#!/usr/bin/env npx tsx
/**
 * scripts/generate-seo.ts — SEO content generation pipeline
 *
 * Daily mode (default):
 *   npx tsx scripts/generate-seo.ts --date=YYYY-MM-DD
 *
 *   1. Load topic clusters from DB (active clusters with mention_count >= 2)
 *   2. Load keywords table for related keywords per cluster
 *   3. Check which content already exists (glossary/FAQ/compare/topics) via DB or filesystem
 *   4. For clusters missing content, generate pages:
 *      - Glossary: for each cluster's pillar_topic that lacks a glossary entry
 *      - FAQ: from Brave discussions data in keywords table
 *      - Compare: from "vs" keyword patterns in keywords table
 *      - Topic hubs: for clusters with 5+ mentions and no existing hub
 *   5. For each page type: generate EN + ZH, validate, write, store in DB
 *   6. Update keywords table: mark content_exists=1
 *
 * Weekly strategy mode:
 *   npx tsx scripts/generate-seo.ts --weekly-strategy
 *
 *   1. Run gap analysis
 *   2. Brave Search batch validate
 *   3. Generate content plan JSON
 *   4. Log summary
 *
 * Flags:
 *   --dry-run       Log what would be generated, no AI calls or file writes
 *   --date=YYYY-MM-DD   Override date (default: today)
 *   --weekly-strategy   Run weekly strategy mode instead of daily generation
 */
import 'dotenv/config';
import fs from 'fs';
import path from 'path';

import { callClaude, callClaudeWithRetry } from './lib/ai';
import {
  validateGlossary,
  validateFaq,
  validateCompare,
  validateTopicHub,
} from './lib/validate';
import {
  getDb,
  upsertContent,
  upsertKeyword,
  closeDb,
} from './lib/db';
import { runGapAnalysis } from './lib/topic-cluster';
import { batchValidate } from './lib/brave';


/** Strip markdown code fences, preamble text, and leading whitespace that models sometimes wrap output in */
function stripCodeFences(text: string): string {
  let s = text.trim();
  s = s.replace(/^```(?:markdown|yaml|md)?\s*\n/, '');
  s = s.replace(/\n```\s*$/, '');
  s = s.trim();

  // If frontmatter doesn't start at the beginning, the model added preamble text.
  // Extract from the first --- block onwards.
  if (!s.startsWith('---') && s.includes('\n---\n')) {
    const idx = s.indexOf('\n---\n');
    s = s.slice(idx + 1);
  }

  return s.trim();
}

// ============================================================
// CLI Args
// ============================================================

const dateArg = process.argv.find((a) => a.startsWith('--date='));
import { todaySGT } from './lib/date.js';
const DATE = dateArg ? dateArg.split('=')[1] : todaySGT();
const DRY_RUN = process.argv.includes('--dry-run');
const WEEKLY_STRATEGY = process.argv.includes('--weekly-strategy');
const MAX_PAGES_PER_RUN = 5;

console.log(`\n🔎 SEO Pipeline — ${DATE}`);
console.log('='.repeat(50));
if (DRY_RUN) console.log('🧪 DRY RUN — skipping AI calls and file writes\n');

// ============================================================
// Types
// ============================================================

type SEOPageType = 'glossary' | 'faq' | 'compare' | 'topics';

interface ClusterRow {
  slug: string;
  pillar_topic: string;
  mention_count: number;
  has_topic_hub: number;
  brave_related_json: string | null;
}

interface KeywordRow {
  id: number;
  keyword: string;
  cluster_slug: string | null;
  source: string;
  content_exists: number;
  content_type: string | null;
  content_slug: string | null;
}

interface PageJob {
  type: SEOPageType;
  slug: string;
  displayTerm: string;
  clusterSlug: string;
  pillarTopic: string;
  context: Record<string, unknown>;
}

interface GeneratedPage {
  type: SEOPageType;
  slug: string;
  lang: string;
  frontmatter: string;
  body: string;
  filePath: string;
}

// ============================================================
// Helpers
// ============================================================

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 60);
}

function contentFileExists(type: SEOPageType, slug: string, lang: string): boolean {
  const filePath = path.join(process.cwd(), 'content', type, lang, `${slug}.md`);
  return fs.existsSync(filePath);
}

function contentExistsInDb(type: SEOPageType, slug: string, lang: string): boolean {
  const db = getDb();
  const row = db
    .prepare('SELECT id FROM content WHERE type = ? AND slug = ? AND lang = ?')
    .get(type, slug, lang);
  return !!row;
}

function contentExists(type: SEOPageType, slug: string): boolean {
  // Both EN and ZH must exist for the content to be considered complete
  const enExists = contentFileExists(type, slug, 'en') || contentExistsInDb(type, slug, 'en');
  const zhExists = contentFileExists(type, slug, 'zh') || contentExistsInDb(type, slug, 'zh');
  return enExists && zhExists;
}

function loadSkill(): string {
  const skillPath = path.join(process.cwd(), 'skills', 'seo', 'SKILL.md');
  return fs.readFileSync(skillPath, 'utf-8');
}

function getWeekNumber(date: Date): string {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return `${d.getUTCFullYear()}-W${String(weekNo).padStart(2, '0')}`;
}

function extractFrontmatter(content: string): string {
  const match = content.match(/^---\n([\s\S]*?)\n---/);
  return match ? match[0] : '';
}

function extractBody(content: string): string {
  return content.replace(/^---[\s\S]*?---\n*/, '');
}

function getRelatedSlugs(clusterSlug: string): {
  glossary: string[];
  blog: string[];
  compare: string[];
  faq: string[];
} {
  const db = getDb();

  // Find related content in DB for this cluster
  const keywords = db
    .prepare('SELECT keyword, content_type, content_slug FROM keywords WHERE cluster_slug = ? AND content_exists = 1')
    .all(clusterSlug) as Array<{ keyword: string; content_type: string | null; content_slug: string | null }>;

  const glossary: string[] = [];
  const blog: string[] = [];
  const compare: string[] = [];
  const faq: string[] = [];

  for (const kw of keywords) {
    if (kw.content_type === 'glossary' && kw.content_slug) glossary.push(kw.content_slug);
    if (kw.content_type === 'blog' && kw.content_slug) blog.push(kw.content_slug);
    if (kw.content_type === 'compare' && kw.content_slug) compare.push(kw.content_slug);
    if (kw.content_type === 'faq' && kw.content_slug) faq.push(kw.content_slug);
  }

  // Also check content table directly
  const glossaryContent = db
    .prepare("SELECT slug FROM content WHERE type = 'glossary' AND lang = 'en' LIMIT 10")
    .all() as Array<{ slug: string }>;
  for (const c of glossaryContent) {
    if (!glossary.includes(c.slug)) glossary.push(c.slug);
  }

  const blogContent = db
    .prepare("SELECT slug FROM content WHERE type = 'blog' AND lang = 'en' ORDER BY created_at DESC LIMIT 5")
    .all() as Array<{ slug: string }>;
  for (const c of blogContent) {
    if (!blog.includes(c.slug)) blog.push(c.slug);
  }

  return {
    glossary: glossary.slice(0, 5),
    blog: blog.slice(0, 3),
    compare: compare.slice(0, 3),
    faq: faq.slice(0, 3),
  };
}

// ============================================================
// STAGE 1: Load Topic Clusters
// ============================================================

function stage1_loadClusters(): ClusterRow[] {
  console.log('\n📊 Stage 1: Load Topic Clusters');

  const db = getDb();
  const clusters = db
    .prepare(
      `SELECT slug, pillar_topic, mention_count, has_topic_hub, brave_related_json
       FROM topic_clusters
       WHERE mention_count >= 2
       ORDER BY mention_count DESC`
    )
    .all() as ClusterRow[];

  console.log(`  Found ${clusters.length} active clusters (mention_count >= 2)`);
  for (const c of clusters.slice(0, 10)) {
    console.log(`    ${c.mention_count}x: ${c.pillar_topic} (${c.slug})`);
  }
  if (clusters.length > 10) {
    console.log(`    ... and ${clusters.length - 10} more`);
  }

  return clusters;
}

// ============================================================
// STAGE 2: Load Keywords & Brave Data
// ============================================================

function stage2_loadKeywords(clusters: ClusterRow[]): Map<string, KeywordRow[]> {
  console.log('\n🔑 Stage 2: Load Keywords');

  const db = getDb();
  const keywordMap = new Map<string, KeywordRow[]>();

  for (const cluster of clusters) {
    const keywords = db
      .prepare('SELECT * FROM keywords WHERE cluster_slug = ?')
      .all(cluster.slug) as KeywordRow[];

    keywordMap.set(cluster.slug, keywords);
  }

  const totalKeywords = Array.from(keywordMap.values()).reduce((sum, kws) => sum + kws.length, 0);
  console.log(`  Loaded ${totalKeywords} keywords across ${keywordMap.size} clusters`);

  return keywordMap;
}

// ============================================================
// STAGE 3: Identify Content Gaps
// ============================================================

function stage3_identifyGaps(
  clusters: ClusterRow[],
  keywordMap: Map<string, KeywordRow[]>
): PageJob[] {
  console.log('\n🕳️  Stage 3: Identify Content Gaps');

  const jobs: PageJob[] = [];

  for (const cluster of clusters) {
    const keywords = keywordMap.get(cluster.slug) || [];
    const termSlug = cluster.slug;

    // --- Glossary: pillar_topic needs a glossary entry ---
    if (!contentExists('glossary', termSlug)) {
      jobs.push({
        type: 'glossary',
        slug: termSlug,
        displayTerm: cluster.pillar_topic,
        clusterSlug: cluster.slug,
        pillarTopic: cluster.pillar_topic,
        context: {},
      });
    }

    // --- FAQ: from Brave discussion keywords ---
    const discussionKeywords = keywords.filter((kw) => kw.source === 'brave-discussion' && !kw.content_exists);
    for (const dk of discussionKeywords.slice(0, 2)) {
      const faqSlug = slugify(dk.keyword);
      if (faqSlug && !contentExists('faq', faqSlug)) {
        jobs.push({
          type: 'faq',
          slug: faqSlug,
          displayTerm: dk.keyword,
          clusterSlug: cluster.slug,
          pillarTopic: cluster.pillar_topic,
          context: { question: dk.keyword },
        });
      }
    }

    // --- FAQ: from blog-faq source keywords ---
    const blogFaqKeywords = keywords.filter((kw) => kw.source.startsWith('blog-faq:') && !kw.content_exists);
    for (const bfk of blogFaqKeywords.slice(0, 2)) {
      const faqSlug = slugify(bfk.keyword);
      if (faqSlug && !contentExists('faq', faqSlug)) {
        jobs.push({
          type: 'faq',
          slug: faqSlug,
          displayTerm: bfk.keyword,
          clusterSlug: cluster.slug,
          pillarTopic: cluster.pillar_topic,
          context: { question: bfk.keyword },
        });
      }
    }

    // --- Compare: from "vs" keyword patterns ---
    const vsKeywords = keywords.filter(
      (kw) =>
        (kw.keyword.includes(' vs ') || kw.keyword.includes('-vs-') || kw.source.startsWith('blog-compare:')) &&
        !kw.content_exists
    );
    for (const vk of vsKeywords.slice(0, 2)) {
      const compareSlug = slugify(vk.keyword);
      if (compareSlug && !contentExists('compare', compareSlug)) {
        // Extract item_a and item_b from the "X vs Y" pattern
        const vsMatch = vk.keyword.match(/^(.+?)\s+vs\.?\s+(.+)$/i) ||
                         vk.keyword.match(/^(.+?)-vs-(.+)$/i);
        const itemA = vsMatch ? vsMatch[1].trim() : cluster.pillar_topic;
        const itemB = vsMatch ? vsMatch[2].trim() : vk.keyword;

        jobs.push({
          type: 'compare',
          slug: compareSlug,
          displayTerm: vk.keyword,
          clusterSlug: cluster.slug,
          pillarTopic: cluster.pillar_topic,
          context: { item_a: itemA, item_b: itemB },
        });
      }
    }

    // --- Topic Hub: clusters with 5+ mentions and no existing hub ---
    if (cluster.mention_count >= 5 && !cluster.has_topic_hub && !contentExists('topics', termSlug)) {
      // Parse Brave data for extra context
      let braveData: { related_keywords?: string[]; discussions?: string[] } = {};
      if (cluster.brave_related_json) {
        try {
          braveData = JSON.parse(cluster.brave_related_json);
        } catch {
          // ignore parse errors
        }
      }

      jobs.push({
        type: 'topics',
        slug: termSlug,
        displayTerm: cluster.pillar_topic,
        clusterSlug: cluster.slug,
        pillarTopic: cluster.pillar_topic,
        context: {
          related_keywords: braveData.related_keywords || [],
          discussions: braveData.discussions || [],
          mention_count: cluster.mention_count,
        },
      });
    }
  }

  // Deduplicate jobs by type+slug
  const seen = new Set<string>();
  const deduped: PageJob[] = [];
  for (const job of jobs) {
    const key = `${job.type}:${job.slug}`;
    if (!seen.has(key)) {
      seen.add(key);
      deduped.push(job);
    }
  }

  console.log(`  Content gaps found: ${deduped.length} pages`);
  const byType = { glossary: 0, faq: 0, compare: 0, topics: 0 };
  for (const job of deduped) {
    byType[job.type]++;
  }
  console.log(`    Glossary: ${byType.glossary}, FAQ: ${byType.faq}, Compare: ${byType.compare}, Topics: ${byType.topics}`);

  // Prioritize: glossary first, then topics, then compare, then FAQ
  const priority: Record<SEOPageType, number> = { glossary: 0, topics: 1, compare: 2, faq: 3 };
  deduped.sort((a, b) => priority[a.type] - priority[b.type]);

  // Limit to MAX_PAGES_PER_RUN
  const limited = deduped.slice(0, MAX_PAGES_PER_RUN);
  if (deduped.length > MAX_PAGES_PER_RUN) {
    console.log(`  Limiting to ${MAX_PAGES_PER_RUN} pages per run (${deduped.length - MAX_PAGES_PER_RUN} deferred)`);
  }

  for (const job of limited) {
    console.log(`    [${job.type}] ${job.slug} — "${job.displayTerm}"`);
  }

  return limited;
}

// ============================================================
// STAGE 4: Generate Pages
// ============================================================

function buildGlossaryPrompt(job: PageJob, skill: string): { system: string; user: string } {
  const related = getRelatedSlugs(job.clusterSlug);

  const system = `${skill}

## Generation Task
Generate a GLOSSARY page for the term "${job.displayTerm}".

## Requirements
- Page type: Glossary (/glossary/${job.slug})
- Display term: ${job.displayTerm}
- Word count: 200-400 words (body only, not counting frontmatter)
- Structure: Definition -> Why it matters -> How it works -> Related terms
- First 1-2 sentences must directly answer "What is ${job.displayTerm}?"
- Output the FULL markdown file including the --- frontmatter block ---
- Frontmatter must include: title, slug, description, term, display_term, category, related_glossary, related_blog, related_compare, lang

## Available Internal Links
- Glossary: ${related.glossary.map(s => `/glossary/${s}`).join(', ') || 'none yet'}
- Blog: ${related.blog.map(s => `/blog/${s}`).join(', ') || 'none yet'}
- Compare: ${related.compare.map(s => `/compare/${s}`).join(', ') || 'none yet'}`;

  const user = `Write a glossary entry for "${job.displayTerm}" for LoreAI, an AI news platform. The term slug is "${job.slug}". Use only facts you are confident about — do not fabricate benchmarks, pricing, or capabilities.`;

  return { system, user };
}

function buildFaqPrompt(job: PageJob, skill: string): { system: string; user: string } {
  const related = getRelatedSlugs(job.clusterSlug);
  const question = (job.context.question as string) || job.displayTerm;

  const system = `${skill}

## Generation Task
Generate an FAQ page answering the question: "${question}"

## Requirements
- Page type: FAQ (/faq/${job.slug})
- Word count: 200-500 words (body only, not counting frontmatter)
- Structure: Direct answer first -> Context -> Practical steps (if applicable) -> Related questions
- First 1-2 sentences must directly answer the question
- Output the FULL markdown file including the --- frontmatter block ---
- Frontmatter must include: title, slug, description, category, related_glossary, related_blog, lang

## Available Internal Links
- Glossary: ${related.glossary.map(s => `/glossary/${s}`).join(', ') || 'none yet'}
- Blog: ${related.blog.map(s => `/blog/${s}`).join(', ') || 'none yet'}
- FAQ: ${related.faq.map(s => `/faq/${s}`).join(', ') || 'none yet'}

## Parent Topic
This question relates to the topic cluster: "${job.pillarTopic}"`;

  const user = `Write an FAQ page answering "${question}" for LoreAI, an AI news platform. Use only facts you are confident about — do not fabricate details.`;

  return { system, user };
}

function buildComparePrompt(job: PageJob, skill: string): { system: string; user: string } {
  const related = getRelatedSlugs(job.clusterSlug);
  const itemA = (job.context.item_a as string) || 'Item A';
  const itemB = (job.context.item_b as string) || 'Item B';

  const system = `${skill}

## Generation Task
Generate a COMPARISON page: "${itemA} vs ${itemB}"

## Requirements
- Page type: Comparison (/compare/${job.slug})
- Item A: ${itemA}
- Item B: ${itemB}
- Word count: 400-800 words (body only, not counting frontmatter)
- Structure: Overview -> Feature table -> When to use A -> When to use B -> Verdict
- Must include a feature comparison table in markdown
- Be balanced, opinionated but fair — state a clear verdict
- Output the FULL markdown file including the --- frontmatter block ---
- Frontmatter must include: title, slug, description, item_a, item_b, category, related_glossary, related_blog, lang

## Available Internal Links
- Glossary: ${related.glossary.map(s => `/glossary/${s}`).join(', ') || 'none yet'}
- Blog: ${related.blog.map(s => `/blog/${s}`).join(', ') || 'none yet'}
- Compare: ${related.compare.map(s => `/compare/${s}`).join(', ') || 'none yet'}`;

  const user = `Write a comparison page for "${itemA} vs ${itemB}" for LoreAI, an AI news platform. Be fair to both products. Use only facts you are confident about — do not fabricate benchmarks, pricing, or capabilities. If you are unsure about specific details, say so.`;

  return { system, user };
}

function buildTopicHubPrompt(job: PageJob, skill: string): { system: string; user: string } {
  const related = getRelatedSlugs(job.clusterSlug);
  const relatedKeywords = (job.context.related_keywords as string[]) || [];
  const discussions = (job.context.discussions as string[]) || [];

  const system = `${skill}

## Generation Task
Generate a TOPIC HUB page for "${job.displayTerm}"

## Requirements
- Page type: Topic Hub (/topics/${job.slug})
- Pillar topic: ${job.displayTerm}
- Word count: 500-1000 words (body only, not counting frontmatter)
- Structure: Overview -> Latest developments -> Key features -> Common questions -> Comparisons -> All resources
- This is the central hub for all "${job.displayTerm}" content on the site
- Output the FULL markdown file including the --- frontmatter block ---
- Frontmatter must include: title, slug, description, pillar_topic, category, related_glossary, related_blog, related_compare, related_faq, lang

## Available Internal Links
- Glossary: ${related.glossary.map(s => `/glossary/${s}`).join(', ') || 'none yet'}
- Blog: ${related.blog.map(s => `/blog/${s}`).join(', ') || 'none yet'}
- Compare: ${related.compare.map(s => `/compare/${s}`).join(', ') || 'none yet'}
- FAQ: ${related.faq.map(s => `/faq/${s}`).join(', ') || 'none yet'}

## Additional Context
- Mention count: ${job.context.mention_count || 'unknown'}
- Related search keywords: ${relatedKeywords.slice(0, 10).join(', ') || 'none'}
- Community discussions: ${discussions.slice(0, 5).join('; ') || 'none'}`;

  const user = `Write a topic hub page for "${job.displayTerm}" for LoreAI, an AI news platform. This should be the definitive overview page for this topic on our site. Use only facts you are confident about — do not fabricate details.`;

  return { system, user };
}

function getValidatorForType(type: SEOPageType): (md: string) => { valid: boolean; errors: string[] } {
  switch (type) {
    case 'glossary': return validateGlossary;
    case 'faq': return validateFaq;
    case 'compare': return validateCompare;
    case 'topics': return validateTopicHub;
  }
}

function buildPrompt(job: PageJob, skill: string): { system: string; user: string } {
  switch (job.type) {
    case 'glossary': return buildGlossaryPrompt(job, skill);
    case 'faq': return buildFaqPrompt(job, skill);
    case 'compare': return buildComparePrompt(job, skill);
    case 'topics': return buildTopicHubPrompt(job, skill);
  }
}

function buildZhSystemAddendum(job: PageJob): string {
  const typeLabels: Record<SEOPageType, string> = {
    glossary: '术语表',
    faq: '常见问题',
    compare: '对比分析',
    topics: '专题中心',
  };
  const wordRanges: Record<SEOPageType, string> = {
    glossary: '200-350',
    faq: '200-450',
    compare: '350-700',
    topics: '450-900',
  };
  return `
## 中文生成要求
- lang: zh
- 用中文撰写，不是翻译——基于同一主题独立创作中文版本
- 保持相同的 frontmatter 结构（lang 字段改为 zh）
- slug 保持与英文版相同: ${job.slug}
- 页面类型: ${typeLabels[job.type]}
- 正文字数: ${wordRanges[job.type]} 字（中文字符计数，不含 frontmatter）
- 正文使用中文，但技术术语可保留英文（如 Claude Code, MCP, SKILL.md）
- 内部链接路径不变
- 必须以以下 CTA 结尾:

---

*觉得有用？[订阅 LoreAI](/subscribe)，每天 5 分钟掌握 AI 动态。*`;
}

async function generatePage(
  job: PageJob,
  skill: string,
  lang: 'en' | 'zh'
): Promise<GeneratedPage | null> {
  const { system: baseSystem, user: baseUser } = buildPrompt(job, skill);
  const validate = getValidatorForType(job.type);

  let systemPrompt = baseSystem;
  let userPrompt = baseUser;

  if (lang === 'zh') {
    systemPrompt = baseSystem + buildZhSystemAddendum(job);
    userPrompt = `用中文撰写以下内容（不是翻译英文版）：\n\n${baseUser}`;
  }

  const fullValidate = (raw: string) => {
    const content = stripCodeFences(raw);
    if (!content.match(/^---\n[\s\S]*?\n---/)) {
      return { valid: false, errors: ['Missing frontmatter block'] };
    }
    const body = extractBody(content);
    return validate(body);
  };

  try {
    let response;
    if (lang === 'en') {
      response = await callClaudeWithRetry(systemPrompt, userPrompt, {
        maxTokens: 4096,
        temperature: 0.4,
        maxRetries: 3,
        validate: fullValidate,
      });
    } else {
      // ZH: retry with validation (2 attempts)
      response = await callClaudeWithRetry(systemPrompt, userPrompt, {
        maxTokens: 4096,
        temperature: 0.4,
        maxRetries: 2,
        validate: fullValidate,
      });
      const result = fullValidate(response.content);
      if (!result.valid) {
        console.warn(`    ZH validation failed: ${result.errors.join(', ')}`);
        return null;
      }
    }

    const cleaned = stripCodeFences(response.content);
    console.log(`    ${lang.toUpperCase()} generated (model: ${response.model})`);
    console.log(`    Tokens: ${response.usage?.input_tokens} in / ${response.usage?.output_tokens} out`);

    const frontmatter = extractFrontmatter(cleaned);
    const body = extractBody(cleaned);

    if (!frontmatter) {
      console.warn(`    Failed to parse frontmatter for ${lang}`);
      return null;
    }

    // Write file
    const dir = path.join(process.cwd(), 'content', job.type, lang);
    fs.mkdirSync(dir, { recursive: true });
    const filePath = path.join(dir, `${job.slug}.md`);
    fs.writeFileSync(filePath, cleaned);

    return {
      type: job.type,
      slug: job.slug,
      lang,
      frontmatter,
      body,
      filePath,
    };
  } catch (err) {
    console.warn(`    ${lang.toUpperCase()} generation failed: ${(err as Error).message}`);
    return null;
  }
}

async function stage4_generatePages(jobs: PageJob[]): Promise<GeneratedPage[]> {
  console.log('\n✍️  Stage 4: Generate Pages');

  if (jobs.length === 0) {
    console.log('  No pages to generate');
    return [];
  }

  const skill = loadSkill();
  const generated: GeneratedPage[] = [];

  for (let i = 0; i < jobs.length; i++) {
    const job = jobs[i];
    console.log(`\n--- Page ${i + 1}/${jobs.length}: [${job.type}] ${job.slug} ---`);

    if (DRY_RUN) {
      console.log(`  [DRY RUN] Would generate ${job.type} page for "${job.displayTerm}"`);
      console.log(`    EN: content/${job.type}/en/${job.slug}.md`);
      console.log(`    ZH: content/${job.type}/zh/${job.slug}.md`);
      continue;
    }

    // Generate EN (skip if already exists on disk)
    const enFileExists = contentFileExists(job.type, job.slug, 'en');
    if (enFileExists) {
      console.log('  EN already exists, skipping');
    } else {
      console.log('  Generating EN...');
      const enPage = await generatePage(job, skill, 'en');
      if (!enPage) {
        console.warn('  EN generation failed, skipping this page');
        continue;
      }
      generated.push(enPage);
      console.log(`  Written: ${enPage.filePath}`);

      const enContentId = upsertContent({
        type: job.type,
        slug: job.slug,
        lang: 'en',
        title: job.displayTerm,
        body_markdown: `${enPage.frontmatter}\n\n${enPage.body}`,
        meta_json: JSON.stringify({
          category: job.type,
          cluster_slug: job.clusterSlug,
          pillar_topic: job.pillarTopic,
        }),
      });
      console.log(`  EN DB record id=${enContentId}`);
    }

    // Generate ZH (retry with validation)
    console.log('  Generating ZH...');
    const zhPage = await generatePage(job, skill, 'zh');
    if (zhPage) {
      generated.push(zhPage);
      console.log(`  Written: ${zhPage.filePath}`);

      const zhContentId = upsertContent({
        type: job.type,
        slug: job.slug,
        lang: 'zh',
        title: job.displayTerm,
        body_markdown: `${zhPage.frontmatter}\n\n${zhPage.body}`,
        meta_json: JSON.stringify({
          category: job.type,
          cluster_slug: job.clusterSlug,
          pillar_topic: job.pillarTopic,
        }),
      });
      console.log(`  ZH DB record id=${zhContentId}`);
    } else {
      console.log('  ZH generation skipped (failed)');
    }
  }

  return generated;
}

// ============================================================
// STAGE 5: Update Keywords & DB
// ============================================================

function stage5_updateKeywords(jobs: PageJob[], generated: GeneratedPage[]): void {
  console.log('\n📝 Stage 5: Update Keywords & DB');

  const db = getDb();
  const generatedSlugs = new Set(generated.filter((p) => p.lang === 'en').map((p) => `${p.type}:${p.slug}`));

  for (const job of jobs) {
    const key = `${job.type}:${job.slug}`;
    if (!generatedSlugs.has(key)) continue;

    // Mark keyword as having content
    db.prepare(
      `UPDATE keywords SET content_exists = 1, content_type = ?, content_slug = ?
       WHERE keyword = ? OR keyword = ?`
    ).run(job.type, job.slug, job.displayTerm, job.slug);

    // If it's a topic hub, mark the cluster
    if (job.type === 'topics') {
      db.prepare('UPDATE topic_clusters SET has_topic_hub = 1 WHERE slug = ?').run(job.clusterSlug);
    }

    console.log(`  Updated: [${job.type}] ${job.slug} — content_exists=1`);
  }
}

// ============================================================
// STAGE 6: Git Push
// ============================================================

async function stage6_gitPush(generated: GeneratedPage[]): Promise<void> {
  console.log('\n🚀 Stage 6: Git Push');

  if (generated.length === 0) {
    console.log('  No files to push');
    return;
  }

  if (DRY_RUN) {
    console.log('  [DRY RUN] Would push:');
    for (const page of generated) {
      console.log(`    ${page.filePath}`);
    }
    return;
  }

  // Collect unique content type directories
  const dirs = new Set<string>();
  for (const page of generated) {
    dirs.add(`content/${page.type}/`);
  }

}

// ============================================================
// Weekly Strategy Mode
// ============================================================

async function runWeeklyStrategy(): Promise<void> {
  console.log('\n📋 Weekly Strategy Mode');
  console.log('='.repeat(50));

  // 1. Gap Analysis
  console.log('\n📊 Step 1: Gap Analysis');
  const { clusters, gaps } = runGapAnalysis();
  console.log(`  Active clusters: ${clusters.length}`);
  console.log(`  Clusters with gaps: ${gaps.length}`);

  for (const gap of gaps.slice(0, 10)) {
    console.log(`    ${gap.cluster}: ${gap.missing.length} missing keywords`);
  }

  // 2. Brave Search batch validate
  console.log('\n🔍 Step 2: Brave Search Validation');
  const topClusterTopics = clusters.slice(0, 10).map((c) => c.pillar_topic);

  let braveResults: Awaited<ReturnType<typeof batchValidate>> = [];
  if (!DRY_RUN && topClusterTopics.length > 0) {
    braveResults = await batchValidate(topClusterTopics, 1000);
    console.log(`  Validated ${braveResults.length} topics via Brave Search`);
    for (const r of braveResults) {
      console.log(`    "${r.topic}": demand=${r.has_search_demand}, results=${r.result_count}, related=${r.related_keywords.length}`);
    }
  } else if (DRY_RUN) {
    console.log(`  [DRY RUN] Would validate ${topClusterTopics.length} topics via Brave Search`);
  } else {
    console.log('  No clusters to validate');
  }

  // 3. Generate content plan
  console.log('\n📝 Step 3: Generate Content Plan');
  const plan = generateContentPlan(clusters, gaps, braveResults);

  const weekStr = getWeekNumber(new Date(DATE));
  const planDir = path.join(process.cwd(), 'data', 'content-plan');
  fs.mkdirSync(planDir, { recursive: true });
  const planPath = path.join(planDir, `${weekStr}.json`);

  if (!DRY_RUN) {
    fs.writeFileSync(planPath, JSON.stringify(plan, null, 2));
    console.log(`  Written: ${planPath}`);
  } else {
    console.log(`  [DRY RUN] Would write: ${planPath}`);
  }

  // 4. Log summary
  console.log('\n📊 Weekly Strategy Summary');
  console.log(`  Week: ${weekStr}`);
  console.log(`  Total clusters: ${clusters.length}`);
  console.log(`  Clusters with content gaps: ${gaps.length}`);
  console.log(`  Planned glossary pages: ${plan.glossary.length}`);
  console.log(`  Planned FAQ pages: ${plan.faq.length}`);
  console.log(`  Planned compare pages: ${plan.compare.length}`);
  console.log(`  Planned topic hub pages: ${plan.topics.length}`);
  console.log(`  Total planned pages: ${plan.glossary.length + plan.faq.length + plan.compare.length + plan.topics.length}`);
}

interface ContentPlan {
  week: string;
  generated_at: string;
  glossary: Array<{ slug: string; term: string; cluster: string; priority: number }>;
  faq: Array<{ slug: string; question: string; cluster: string; priority: number }>;
  compare: Array<{ slug: string; items: string; cluster: string; priority: number }>;
  topics: Array<{ slug: string; topic: string; mention_count: number; priority: number }>;
}

function generateContentPlan(
  clusters: ReturnType<typeof runGapAnalysis>['clusters'],
  gaps: ReturnType<typeof runGapAnalysis>['gaps'],
  braveResults: Awaited<ReturnType<typeof batchValidate>>
): ContentPlan {
  const weekStr = getWeekNumber(new Date(DATE));
  const plan: ContentPlan = {
    week: weekStr,
    generated_at: new Date().toISOString(),
    glossary: [],
    faq: [],
    compare: [],
    topics: [],
  };

  // Build a set of topics with high Brave search demand
  const highDemandTopics = new Set(
    braveResults.filter((r) => r.has_search_demand).map((r) => r.topic.toLowerCase())
  );

  const db = getDb();

  for (const cluster of clusters) {
    const termSlug = slugify(cluster.pillar_topic);
    const hasDemand = highDemandTopics.has(cluster.pillar_topic.toLowerCase());
    const basePriority = hasDemand ? 1 : 2;

    // Glossary
    if (!contentExists('glossary', termSlug)) {
      plan.glossary.push({
        slug: termSlug,
        term: cluster.pillar_topic,
        cluster: cluster.slug,
        priority: basePriority,
      });
    }

    // Topic hub
    if (cluster.mention_count >= 5 && !contentExists('topics', termSlug)) {
      plan.topics.push({
        slug: termSlug,
        topic: cluster.pillar_topic,
        mention_count: cluster.mention_count,
        priority: basePriority,
      });
    }

    // FAQ from keywords
    const keywords = db
      .prepare("SELECT keyword FROM keywords WHERE cluster_slug = ? AND source IN ('brave-discussion', 'blog-faq') AND content_exists = 0")
      .all(cluster.slug) as Array<{ keyword: string }>;

    for (const kw of keywords.slice(0, 3)) {
      const faqSlug = slugify(kw.keyword);
      if (faqSlug && !contentExists('faq', faqSlug)) {
        plan.faq.push({
          slug: faqSlug,
          question: kw.keyword,
          cluster: cluster.slug,
          priority: basePriority + 1,
        });
      }
    }

    // Compare from keywords
    const vsKeywords = db
      .prepare("SELECT keyword FROM keywords WHERE cluster_slug = ? AND (keyword LIKE '%vs%' OR source LIKE 'blog-compare:%') AND content_exists = 0")
      .all(cluster.slug) as Array<{ keyword: string }>;

    for (const vk of vsKeywords.slice(0, 2)) {
      const compareSlug = slugify(vk.keyword);
      if (compareSlug && !contentExists('compare', compareSlug)) {
        plan.compare.push({
          slug: compareSlug,
          items: vk.keyword,
          cluster: cluster.slug,
          priority: basePriority + 1,
        });
      }
    }
  }

  // Sort each category by priority
  plan.glossary.sort((a, b) => a.priority - b.priority);
  plan.faq.sort((a, b) => a.priority - b.priority);
  plan.compare.sort((a, b) => a.priority - b.priority);
  plan.topics.sort((a, b) => a.priority - b.priority);

  return plan;
}

// ============================================================
// MAIN
// ============================================================

async function main() {
  if (WEEKLY_STRATEGY) {
    await runWeeklyStrategy();
    closeDb();
    console.log('\n✅ Weekly strategy complete');
    return;
  }

  // Daily mode
  // Stage 1: Load clusters
  const clusters = stage1_loadClusters();
  if (clusters.length === 0) {
    console.log('\n⚠️  No active topic clusters (mention_count >= 2). Run the newsletter pipeline first to build clusters.');
    closeDb();
    process.exit(0);
  }

  // Stage 2: Load keywords
  const keywordMap = stage2_loadKeywords(clusters);

  // Stage 3: Identify content gaps
  const jobs = stage3_identifyGaps(clusters, keywordMap);
  if (jobs.length === 0) {
    console.log('\n✅ No content gaps — all SEO pages are up to date.');
    closeDb();
    process.exit(0);
  }

  // Stage 4: Generate pages
  const generated = await stage4_generatePages(jobs);

  // Stage 5: Update keywords & DB
  stage5_updateKeywords(jobs, generated);

  // Stage 6: Git push
  await stage6_gitPush(generated);

  closeDb();

  const enCount = generated.filter((p) => p.lang === 'en').length;
  const zhCount = generated.filter((p) => p.lang === 'zh').length;
  console.log(`\n✅ SEO pipeline complete — ${enCount} EN + ${zhCount} ZH pages written`);
}

main().catch((err) => {
  console.error('💥 SEO pipeline failed:', err);
  closeDb();
  process.exit(1);
});
