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
 * Cluster mode:
 *   npx tsx scripts/generate-seo.ts --cluster=claude-code
 *   npx tsx scripts/generate-seo.ts --cluster=claude-code --type=faq
 *   npx tsx scripts/generate-seo.ts --cluster=claude-code --dry-run
 *
 *   Reads a flagship cluster definition JSON and generates missing pages
 *   directly, bypassing the newsletter → blog → keyword extraction chain.
 *
 * Flags:
 *   --dry-run       Log what would be generated, no AI calls or file writes
 *   --date=YYYY-MM-DD   Override date (default: today)
 *   --weekly-strategy   Run weekly strategy mode instead of daily generation
 *   --cluster=SLUG      Run cluster-driven generation mode
 *   --type=TYPE         Filter cluster mode to specific type (faq|compare|glossary|cornerstone)
 */
import 'dotenv/config';
import fs from 'fs';
import path from 'path';

import { callClaude, callClaudeWithRetry } from './lib/ai';
import { sanitizeOutput } from './lib/sanitize.js';
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
import { resolveSource, buildGroundingInstruction } from './lib/source-fetch';
import { RefreshFlag, readPageContent } from './lib/discover';


// ============================================================
// CLI Args
// ============================================================

const dateArg = process.argv.find((a) => a.startsWith('--date='));
import { todaySGT } from './lib/date.js';
const DATE = dateArg ? dateArg.split('=')[1] : todaySGT();
const DRY_RUN = process.argv.includes('--dry-run');
const WEEKLY_STRATEGY = process.argv.includes('--weekly-strategy');
const clusterArg = process.argv.find((a) => a.startsWith('--cluster='));
const typeArg = process.argv.find((a) => a.startsWith('--type='));
const CLUSTER_SLUG = clusterArg ? clusterArg.split('=')[1] : null;
const TYPE_FILTER = typeArg ? typeArg.split('=')[1] : null;
const REFRESH_MODE = process.argv.includes('--refresh');
const slugArg = process.argv.find((a) => a.startsWith('--slug='));
const SLUG_FILTER = slugArg ? slugArg.split('=')[1] : null;
const MAX_PAGES_PER_RUN = 8;

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

  // Round-robin across types to prevent any single type from starving others
  const queues: Record<SEOPageType, PageJob[]> = { glossary: [], faq: [], compare: [], topics: [] };
  for (const job of deduped) queues[job.type].push(job);
  const typeOrder: SEOPageType[] = ['glossary', 'faq', 'compare', 'topics'];
  const limited: PageJob[] = [];
  let emptyRounds = 0;
  while (limited.length < MAX_PAGES_PER_RUN && emptyRounds < typeOrder.length) {
    emptyRounds = 0;
    for (const type of typeOrder) {
      if (limited.length >= MAX_PAGES_PER_RUN) break;
      const next = queues[type].shift();
      if (next) { limited.push(next); } else { emptyRounds++; }
    }
  }
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

  // Source grounding (populated by cluster mode source resolution)
  const sourceBlock = job.context._sourceGrounding
    ? (job.context._sourceGrounding as string)
    : '';

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
This question relates to the topic cluster: "${job.pillarTopic}"${sourceBlock}`;

  const groundedInstruction = sourceBlock
    ? 'Ground your answer in the source material provided above.'
    : 'Use only facts you are confident about — do not fabricate details.';
  const user = `Write an FAQ page answering "${question}" for LoreAI, an AI news platform. ${groundedInstruction}`;

  return { system, user };
}

function buildComparePrompt(job: PageJob, skill: string): { system: string; user: string } {
  const related = getRelatedSlugs(job.clusterSlug);
  const itemA = (job.context.item_a as string) || 'Item A';
  const itemB = (job.context.item_b as string) || 'Item B';

  // Source grounding (populated by cluster mode source resolution)
  const sourceBlock = job.context._sourceGrounding
    ? (job.context._sourceGrounding as string)
    : '';

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
- Compare: ${related.compare.map(s => `/compare/${s}`).join(', ') || 'none yet'}${sourceBlock}`;

  const groundedInstruction = sourceBlock
    ? 'Ground all feature claims, pricing, and capabilities in the source material provided above.'
    : 'Use only facts you are confident about — do not fabricate benchmarks, pricing, or capabilities. If you are unsure about specific details, say so.';
  const user = `Write a comparison page for "${itemA} vs ${itemB}" for LoreAI, an AI news platform. Be fair to both products. ${groundedInstruction}`;

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
    const content = sanitizeOutput(raw);
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

    const cleaned = sanitizeOutput(response.content);
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
// Cluster Mode
// ============================================================

interface ClusterDefinition {
  topic_slug: string;
  pillar_topic: string;
  version: string;
  source_urls?: {
    primary?: string;
    pricing?: string;
    setup?: string;
  };
  official_domains?: string[];
  cornerstone: {
    slug: string;
    target_keywords: string[];
    status: 'exists' | 'missing' | 'draft';
  };
  target_compare: Array<{
    slug: string;
    item_a: string;
    item_b: string;
    item_b_url?: string;
    priority: number;
    status: 'exists' | 'missing' | 'draft';
  }>;
  target_faq: Array<{
    slug: string;
    question: string;
    priority: number;
    status: 'exists' | 'missing' | 'draft';
  }>;
  target_glossary: Array<{
    slug: string;
    display_term: string;
    status: 'exists' | 'missing';
  }>;
  tracked_blogs: Array<{
    slug: string;
    title: string;
  }>;
  candidates?: unknown[];
  refresh_needed?: RefreshFlag[];
}

function loadBlogSkill(): string {
  const skillPath = path.join(process.cwd(), 'skills', 'blog-en', 'SKILL.md');
  return fs.readFileSync(skillPath, 'utf-8');
}

function buildCornerstonePrompt(cluster: ClusterDefinition, sourceGrounding?: string): { system: string; user: string } {
  const blogSkill = loadBlogSkill();

  // Build list of cluster nodes for internal linking
  const clusterNodes: string[] = [];
  for (const c of cluster.target_compare) {
    clusterNodes.push(`- [${c.item_a} vs ${c.item_b}](/compare/${c.slug})`);
  }
  for (const f of cluster.target_faq) {
    clusterNodes.push(`- [${f.question}](/faq/${f.slug})`);
  }
  for (const g of cluster.target_glossary) {
    clusterNodes.push(`- [${g.display_term}](/glossary/${g.slug})`);
  }
  for (const b of cluster.tracked_blogs) {
    clusterNodes.push(`- [${b.title}](/blog/${b.slug})`);
  }

  const sourceBlock = sourceGrounding || '';

  const system = `${blogSkill}

## OVERRIDE: Cornerstone Page Mode

This is NOT a regular blog post. This is a **cornerstone page** — the definitive "everything you need to know" article for ${cluster.pillar_topic}. It should be the single best page on the internet for someone wanting to understand ${cluster.pillar_topic}.

### Cornerstone Requirements
- **Word count**: 1500-2500 words (significantly longer than a regular blog post)
- **Tone**: Authoritative guide, not a news article
- **Frontmatter**: Include \`cornerstone: true\` flag and \`category: DEV\`
- **Date**: Use today's date (${DATE})
- **Target keywords**: ${cluster.cornerstone.target_keywords.join(', ')}

### Required Structure
1. **What is ${cluster.pillar_topic}?** — Comprehensive overview (200-300 words)
2. **Getting Started** — Installation, setup, first steps (200-300 words)
3. **Key Features** — Core capabilities with examples (300-400 words)
4. **Common Workflows** — Practical usage patterns (200-300 words)
5. **Best Practices** — Tips from real usage (200-300 words)
6. **Resources** — Links to all cluster content (100-200 words)

### Cluster Content — MUST Link To
${clusterNodes.join('\n')}

Include these internal links naturally throughout the article. The Resources section should list all of them.${sourceBlock}`;

  const groundedInstruction = sourceBlock
    ? 'Ground all facts in the source material provided above.'
    : 'Use only facts you are confident about.';
  const user = `Write the definitive cornerstone page for "${cluster.pillar_topic}" for LoreAI. This page should be the ultimate guide that someone would bookmark. Slug: "${cluster.cornerstone.slug}". ${groundedInstruction}`;

  return { system, user };
}

async function generateCornerstonePage(
  cluster: ClusterDefinition,
  lang: 'en' | 'zh',
  sourceGrounding?: string
): Promise<{ slug: string; lang: string; filePath: string } | null> {
  const { system: enSystem, user: enUser } = buildCornerstonePrompt(cluster, sourceGrounding);

  let systemPrompt: string;
  let userPrompt: string;

  if (lang === 'en') {
    systemPrompt = enSystem;
    userPrompt = enUser;
  } else {
    systemPrompt = enSystem + `

## 中文生成要求
- lang: zh
- 用中文撰写，不是翻译——基于同一主题独立创作中文版本
- 保持相同的 frontmatter 结构（lang 字段改为 zh）
- slug 保持与英文版相同: ${cluster.cornerstone.slug}
- 正文字数: 1500-2500 字（中文字符计数，不含 frontmatter）
- 正文使用中文，但技术术语可保留英文（如 Claude Code, MCP, SKILL.md）
- 内部链接路径不变
- 必须以以下 CTA 结尾:

---

*觉得有用？[订阅 LoreAI](/subscribe)，每天 5 分钟掌握 AI 动态。*`;
    userPrompt = `用中文撰写关于"${cluster.pillar_topic}"的权威基石页面（不是翻译英文版）。Slug: "${cluster.cornerstone.slug}"。只使用你确信的事实。`;
  }

  const fullValidate = (raw: string) => {
    const content = sanitizeOutput(raw);
    if (!content.match(/^---\n[\s\S]*?\n---/)) {
      return { valid: false, errors: ['Missing frontmatter block'] };
    }
    const body = extractBody(content);
    const wordCount = lang === 'en'
      ? body.split(/\s+/).length
      : body.replace(/[\s\n]/g, '').length;
    if (wordCount < 800) {
      return { valid: false, errors: [`Content too short: ${wordCount} words/chars (min 800)`] };
    }
    return { valid: true, errors: [] };
  };

  try {
    const response = await callClaudeWithRetry(systemPrompt, userPrompt, {
      maxTokens: 8192,
      temperature: 0.4,
      maxRetries: 2,
      validate: fullValidate,
    });

    const cleaned = sanitizeOutput(response.content);
    console.log(`    ${lang.toUpperCase()} cornerstone generated (model: ${response.model})`);
    console.log(`    Tokens: ${response.usage?.input_tokens} in / ${response.usage?.output_tokens} out`);

    const frontmatter = extractFrontmatter(cleaned);
    if (!frontmatter) {
      console.warn(`    Failed to parse frontmatter for ${lang} cornerstone`);
      return null;
    }

    // Write file to content/blog/{lang}/
    const dir = path.join(process.cwd(), 'content', 'blog', lang);
    fs.mkdirSync(dir, { recursive: true });
    const filePath = path.join(dir, `${cluster.cornerstone.slug}.md`);
    fs.writeFileSync(filePath, cleaned);

    return { slug: cluster.cornerstone.slug, lang, filePath };
  } catch (err) {
    console.warn(`    ${lang.toUpperCase()} cornerstone generation failed: ${(err as Error).message}`);
    return null;
  }
}

function updateClusterStatus(clusterSlug: string): void {
  const clusterPath = path.join(process.cwd(), 'data', 'flagship-clusters', `${clusterSlug}.json`);
  const cluster: ClusterDefinition = JSON.parse(fs.readFileSync(clusterPath, 'utf-8'));

  // Update cornerstone status
  const csExists = fs.existsSync(path.join(process.cwd(), 'content', 'blog', 'en', `${cluster.cornerstone.slug}.md`));
  cluster.cornerstone.status = csExists ? 'exists' : 'missing';

  // Update compare status
  for (const c of cluster.target_compare) {
    c.status = contentFileExists('compare', c.slug, 'en') ? 'exists' : 'missing';
  }

  // Update FAQ status
  for (const f of cluster.target_faq) {
    f.status = contentFileExists('faq', f.slug, 'en') ? 'exists' : 'missing';
  }

  // Update glossary status
  for (const g of cluster.target_glossary) {
    g.status = contentFileExists('glossary', g.slug, 'en') ? 'exists' : 'missing';
  }

  fs.writeFileSync(clusterPath, JSON.stringify(cluster, null, 2) + '\n');
  console.log(`  Updated cluster status: ${clusterPath}`);
}

async function runClusterMode(clusterSlug: string, typeFilter?: string): Promise<void> {
  console.log(`\n🎯 Cluster Mode — ${clusterSlug}`);
  console.log('='.repeat(50));

  // 1. Read cluster definition
  const clusterPath = path.join(process.cwd(), 'data', 'flagship-clusters', `${clusterSlug}.json`);
  if (!fs.existsSync(clusterPath)) {
    console.error(`❌ Cluster file not found: ${clusterPath}`);
    process.exit(1);
  }
  const cluster: ClusterDefinition = JSON.parse(fs.readFileSync(clusterPath, 'utf-8'));
  console.log(`  Loaded cluster: ${cluster.pillar_topic}`);

  // 2. Build jobs from missing targets
  const seoJobs: PageJob[] = [];
  let needsCornerstone = false;

  // Cornerstone check
  if (cluster.cornerstone.status === 'missing' && (!typeFilter || typeFilter === 'cornerstone')) {
    const csExists = fs.existsSync(path.join(process.cwd(), 'content', 'blog', 'en', `${cluster.cornerstone.slug}.md`));
    if (!csExists) {
      needsCornerstone = true;
    } else {
      console.log('  Cornerstone already exists on disk, skipping');
    }
  }

  // 2a. Resolve source material for grounded generation
  const officialDomains = cluster.official_domains ?? [];
  let primarySource = '';
  let cornerstoneSourceGrounding = '';

  const needsSourceFetch = (!typeFilter || ['compare', 'faq', 'cornerstone'].includes(typeFilter));
  if (needsSourceFetch && cluster.source_urls) {
    console.log('\n  📚 Resolving source material...');
    primarySource = await resolveSource(
      cluster.source_urls.primary,
      `${cluster.pillar_topic} official documentation`,
      officialDomains
    );
    if (primarySource) {
      console.log(`    Primary source: ${primarySource.length} chars`);
    }

    // Cornerstone needs primary + pricing
    if (!typeFilter || typeFilter === 'cornerstone') {
      const pricingSource = await resolveSource(
        cluster.source_urls.pricing,
        `${cluster.pillar_topic} pricing costs`,
        officialDomains
      );
      const csSourceParts: { label: string; content: string }[] = [
        { label: cluster.pillar_topic, content: primarySource },
      ];
      if (pricingSource) {
        csSourceParts.push({ label: `${cluster.pillar_topic} Pricing`, content: pricingSource });
      }
      cornerstoneSourceGrounding = buildGroundingInstruction(csSourceParts);
    }
  }

  // Compare pages
  for (const c of cluster.target_compare) {
    if (c.status !== 'missing') continue;
    if (typeFilter && typeFilter !== 'compare') continue;
    if (contentFileExists('compare', c.slug, 'en')) continue;

    // Resolve competitor source
    let competitorSource = '';
    if (c.item_b_url || officialDomains.length > 0) {
      console.log(`    Resolving source for ${c.item_b}...`);
      competitorSource = await resolveSource(
        c.item_b_url,
        `${c.item_b} official features documentation`,
        officialDomains
      );
    }

    const sourceGrounding = buildGroundingInstruction([
      { label: c.item_a, content: primarySource },
      { label: c.item_b, content: competitorSource },
    ]);

    seoJobs.push({
      type: 'compare',
      slug: c.slug,
      displayTerm: `${c.item_a} vs ${c.item_b}`,
      clusterSlug: cluster.topic_slug,
      pillarTopic: cluster.pillar_topic,
      context: { item_a: c.item_a, item_b: c.item_b, _sourceGrounding: sourceGrounding },
    });
  }

  // FAQ pages
  for (const f of cluster.target_faq) {
    if (f.status !== 'missing') continue;
    if (typeFilter && typeFilter !== 'faq') continue;
    if (contentFileExists('faq', f.slug, 'en')) continue;

    const faqSourceGrounding = primarySource
      ? buildGroundingInstruction([{ label: cluster.pillar_topic, content: primarySource }])
      : '';

    seoJobs.push({
      type: 'faq',
      slug: f.slug,
      displayTerm: f.question,
      clusterSlug: cluster.topic_slug,
      pillarTopic: cluster.pillar_topic,
      context: { question: f.question, _sourceGrounding: faqSourceGrounding },
    });
  }

  // Glossary
  for (const g of cluster.target_glossary) {
    if (g.status !== 'missing') continue;
    if (typeFilter && typeFilter !== 'glossary') continue;
    if (contentFileExists('glossary', g.slug, 'en')) continue;
    seoJobs.push({
      type: 'glossary',
      slug: g.slug,
      displayTerm: g.display_term,
      clusterSlug: cluster.topic_slug,
      pillarTopic: cluster.pillar_topic,
      context: {},
    });
  }

  const totalGaps = seoJobs.length + (needsCornerstone ? 1 : 0);
  console.log(`  Content gaps: ${totalGaps} pages`);
  if (needsCornerstone) console.log(`    [cornerstone] ${cluster.cornerstone.slug}`);
  for (const job of seoJobs) {
    console.log(`    [${job.type}] ${job.slug} — "${job.displayTerm}"`);
  }

  if (totalGaps === 0) {
    console.log('\n✅ No content gaps — cluster is complete.');
    return;
  }

  // 3. Respect MAX_PAGES_PER_RUN
  const cornerstoneSlots = needsCornerstone ? 1 : 0;
  const limited = seoJobs.slice(0, MAX_PAGES_PER_RUN - cornerstoneSlots);

  if (totalGaps > MAX_PAGES_PER_RUN) {
    console.log(`  Limiting to ${MAX_PAGES_PER_RUN} pages per run (${totalGaps - MAX_PAGES_PER_RUN} deferred)`);
  }

  // 4. Dry-run output
  if (DRY_RUN) {
    console.log('\n🧪 DRY RUN — would generate:');
    if (needsCornerstone) {
      console.log(`  [cornerstone] content/blog/en/${cluster.cornerstone.slug}.md`);
      console.log(`  [cornerstone] content/blog/zh/${cluster.cornerstone.slug}.md`);
      if (cornerstoneSourceGrounding) {
        console.log(`    Source: primary (${primarySource.length} chars) + pricing`);
      }
    }
    for (const job of limited) {
      console.log(`  [${job.type}] content/${job.type}/en/${job.slug}.md`);
      console.log(`  [${job.type}] content/${job.type}/zh/${job.slug}.md`);
      if (job.context._sourceGrounding) {
        const grounding = job.context._sourceGrounding as string;
        const hasSource = !grounding.includes('No Source Material Available');
        console.log(`    Source: ${hasSource ? 'grounded' : 'ungrounded (no sources fetched)'}`);
      }
    }
    return;
  }

  // 5. Generate pages
  let cornerstoneCount = 0;

  // Generate cornerstone first (if needed)
  if (needsCornerstone) {
    console.log(`\n--- Cornerstone: ${cluster.cornerstone.slug} ---`);
    console.log('  Generating EN cornerstone...');
    const enPage = await generateCornerstonePage(cluster, 'en', cornerstoneSourceGrounding || undefined);
    if (enPage) {
      console.log(`  Written: ${enPage.filePath}`);
      upsertContent({
        type: 'blog',
        slug: cluster.cornerstone.slug,
        lang: 'en',
        title: `${cluster.pillar_topic} — Complete Guide`,
        body_markdown: fs.readFileSync(enPage.filePath, 'utf-8'),
        meta_json: JSON.stringify({
          category: 'blog',
          cluster_slug: cluster.topic_slug,
          pillar_topic: cluster.pillar_topic,
          cornerstone: true,
        }),
      });
      cornerstoneCount++;

      console.log('  Generating ZH cornerstone...');
      const zhPage = await generateCornerstonePage(cluster, 'zh', cornerstoneSourceGrounding || undefined);
      if (zhPage) {
        console.log(`  Written: ${zhPage.filePath}`);
        upsertContent({
          type: 'blog',
          slug: cluster.cornerstone.slug,
          lang: 'zh',
          title: `${cluster.pillar_topic} — 完全指南`,
          body_markdown: fs.readFileSync(zhPage.filePath, 'utf-8'),
          meta_json: JSON.stringify({
            category: 'blog',
            cluster_slug: cluster.topic_slug,
            pillar_topic: cluster.pillar_topic,
            cornerstone: true,
          }),
        });
        cornerstoneCount++;
      }
    } else {
      console.warn('  EN cornerstone generation failed, skipping');
    }

    // Upsert cornerstone keywords
    for (const kw of cluster.cornerstone.target_keywords) {
      upsertKeyword(kw, 'cluster-target', cluster.topic_slug);
    }
  }

  // Generate SEO pages (reuse existing pipeline)
  let seoGenerated: GeneratedPage[] = [];
  if (limited.length > 0) {
    seoGenerated = await stage4_generatePages(limited);
    stage5_updateKeywords(limited, seoGenerated);
    await stage6_gitPush(seoGenerated);

    // Upsert keywords with cluster-target source
    for (const job of limited) {
      upsertKeyword(job.displayTerm, 'cluster-target', cluster.topic_slug);
      if (job.type === 'faq' && job.context.question) {
        upsertKeyword(job.context.question as string, 'cluster-target', cluster.topic_slug);
      }
    }
  }

  // 6. Update cluster definition status
  updateClusterStatus(clusterSlug);

  const enCount = seoGenerated.filter((p) => p.lang === 'en').length + (cornerstoneCount > 0 ? 1 : 0);
  const zhCount = seoGenerated.filter((p) => p.lang === 'zh').length + (cornerstoneCount > 1 ? 1 : 0);
  console.log(`\n✅ Cluster "${clusterSlug}" — ${enCount} EN + ${zhCount} ZH pages generated`);
}

// ============================================================
// REFRESH MODE (SPEC-11)
// ============================================================

function buildClusterLinksString(cluster: ClusterDefinition): string {
  const links: string[] = [];
  links.push(`- Topic hub: /topics/${cluster.topic_slug}`);
  links.push(`- Cornerstone: /blog/${cluster.cornerstone.slug}`);
  for (const c of cluster.target_compare) {
    if (c.status === 'exists') links.push(`- /compare/${c.slug}`);
  }
  for (const f of cluster.target_faq) {
    if (f.status === 'exists') links.push(`- /faq/${f.slug}`);
  }
  for (const g of cluster.target_glossary) {
    if (g.status === 'exists') links.push(`- /glossary/${g.slug}`);
  }
  for (const b of cluster.tracked_blogs) {
    links.push(`- /blog/${b.slug}`);
  }
  return links.join('\n');
}

async function resolveRefreshSources(
  flag: RefreshFlag,
  cluster: ClusterDefinition
): Promise<string> {
  const officialDomains = cluster.official_domains || [];

  if (flag.page_type === 'compare') {
    const target = cluster.target_compare.find(c => c.slug === flag.slug);
    const primarySource = await resolveSource(
      cluster.source_urls?.primary,
      `${cluster.pillar_topic} official documentation`,
      officialDomains
    );
    const competitorSource = target?.item_b_url
      ? await resolveSource(target.item_b_url, `${target.item_b} features`, officialDomains)
      : '';
    return buildGroundingInstruction([
      { label: cluster.pillar_topic, content: primarySource },
      { label: target?.item_b || 'Competitor', content: competitorSource },
    ]);
  }

  if (flag.page_type === 'glossary') {
    return '';
  }

  // Cornerstone, FAQ: primary docs only
  const primarySource = await resolveSource(
    cluster.source_urls?.primary,
    `${cluster.pillar_topic} official documentation`,
    officialDomains
  );
  return buildGroundingInstruction([
    { label: cluster.pillar_topic, content: primarySource },
  ]);
}

function buildRefreshPrompt(
  flag: RefreshFlag,
  skill: string,
  existingContent: string,
  freshSources: string,
  clusterLinks: string
): { system: string; user: string } {
  const system = `${skill}

## REFRESH MODE — Updating Existing Page

You are REFRESHING an existing page, not creating from scratch.

### What's stale
${flag.reason}

### Affected sections
${flag.affected_sections.join(', ')}

### Fresh source material
${freshSources}

### Existing page content (for reference)
${existingContent}

### Cluster internal links (must be preserved)
${clusterLinks}

### CRITICAL REFRESH RULES
1. PRESERVE the page slug, title structure, and frontmatter schema exactly
2. PRESERVE all existing internal links that are still valid
3. UPDATE the affected sections with facts from the fresh source material
4. PRESERVE sections that are NOT affected — don't rewrite what isn't broken
5. Keep the same tone, length, and structure as the original
6. Update the date in frontmatter to today's date
7. If a fact from the old page contradicts the fresh source material, use the fresh source
8. If a detail is not in the fresh source material, keep the old version unless it's flagged as stale`;

  const user = `Refresh this ${flag.page_type} page. The stale sections are: ${flag.affected_sections.join(', ')}.
Reason for refresh: ${flag.reason}
Ground all updates in the fresh source material provided above.`;

  return { system, user };
}

function getRefreshFilePath(slug: string, pageType: string, lang: string): string {
  const typeDir = pageType === 'blog' ? 'blog' : pageType;
  return path.join(process.cwd(), 'content', typeDir, lang, `${slug}.md`);
}

function getRefreshValidator(pageType: string): (md: string) => { valid: boolean; errors: string[] } {
  switch (pageType) {
    case 'compare': return validateCompare;
    case 'faq': return validateFaq;
    case 'glossary': return validateGlossary;
    default: {
      // Blog/cornerstone: basic frontmatter + length check
      return (body: string) => {
        const wordCount = body.split(/\s+/).length;
        if (wordCount < 200) return { valid: false, errors: [`Content too short: ${wordCount} words`] };
        return { valid: true, errors: [] };
      };
    }
  }
}

function buildRefreshZhAddendum(flag: RefreshFlag, newEnContent: string): string {
  const pageType = flag.page_type;
  if (pageType === 'blog') {
    return `

## 中文生成要求
- lang: zh
- 用中文撰写，不是翻译——基于刚刚更新的英文版内容独立创作中文版本
- 保持相同的 frontmatter 结构（lang 字段改为 zh）
- slug 保持不变: ${flag.slug}
- 正文字数: 1500-2500 字（中文字符计数，不含 frontmatter）
- 正文使用中文，但技术术语可保留英文
- 内部链接路径不变

## 刚更新的英文版内容（参考）
${newEnContent}`;
  }

  const typeLabels: Record<string, string> = {
    glossary: '术语表',
    faq: '常见问题',
    compare: '对比分析',
  };
  const wordRanges: Record<string, string> = {
    glossary: '200-350',
    faq: '200-450',
    compare: '350-700',
  };

  return `

## 中文生成要求
- lang: zh
- 用中文撰写，不是翻译——基于刚刚更新的英文版内容独立创作中文版本
- 保持相同的 frontmatter 结构（lang 字段改为 zh）
- slug 保持不变: ${flag.slug}
- 页面类型: ${typeLabels[pageType] || pageType}
- 正文字数: ${wordRanges[pageType] || '300-600'} 字（中文字符计数，不含 frontmatter）
- 正文使用中文，但技术术语可保留英文
- 内部链接路径不变
- 必须以以下 CTA 结尾:

---

*觉得有用？[订阅 LoreAI](/subscribe)，每天 5 分钟掌握 AI 动态。*

## 刚更新的英文版内容（参考）
${newEnContent}`;
}

async function runRefreshMode(clusterSlug: string): Promise<void> {
  console.log(`\n🔄 Refresh Mode — ${clusterSlug}`);
  console.log('='.repeat(50));

  // 1. Read cluster JSON
  const clusterPath = path.join(process.cwd(), 'data', 'flagship-clusters', `${clusterSlug}.json`);
  if (!fs.existsSync(clusterPath)) {
    console.error(`❌ Cluster file not found: ${clusterPath}`);
    process.exit(1);
  }
  const cluster: ClusterDefinition = JSON.parse(fs.readFileSync(clusterPath, 'utf-8'));
  console.log(`  Loaded cluster: ${cluster.pillar_topic}`);

  // 2. Filter refresh_needed where status === 'pending'
  const allFlags = cluster.refresh_needed || [];
  let pendingFlags = allFlags.filter(r => r.status === 'pending');

  // 3. Apply --slug filter
  if (SLUG_FILTER) {
    pendingFlags = pendingFlags.filter(r => r.slug === SLUG_FILTER);
  }

  if (pendingFlags.length === 0) {
    console.log('\n✅ No pending refresh flags.');
    return;
  }

  console.log(`  Pending refresh flags: ${pendingFlags.length}`);
  for (const f of pendingFlags) {
    console.log(`    [${f.severity}] ${f.slug} (${f.page_type}) — ${f.reason.slice(0, 80)}`);
  }

  // 4. Dry-run: just list
  if (DRY_RUN) {
    console.log('\n🧪 DRY RUN — would refresh:');
    for (const f of pendingFlags) {
      const enPath = getRefreshFilePath(f.slug, f.page_type, 'en');
      const zhPath = getRefreshFilePath(f.slug, f.page_type, 'zh');
      const enExists = fs.existsSync(enPath);
      console.log(`  [${f.severity}] ${f.slug} (${f.page_type})`);
      console.log(`    Reason: ${f.reason}`);
      console.log(`    Affected: ${f.affected_sections.join(', ')}`);
      console.log(`    EN file: ${enPath} (${enExists ? 'exists' : 'MISSING'})`);
      console.log(`    ZH file: ${zhPath}`);
    }
    return;
  }

  // 5. Refresh each flagged page
  const clusterLinks = buildClusterLinksString(cluster);
  let refreshedCount = 0;

  for (const flag of pendingFlags) {
    console.log(`\n--- Refreshing: ${flag.slug} (${flag.page_type}) ---`);

    // a. Read existing EN content
    const existingEN = readPageContent(flag.slug, flag.page_type, 'en');
    if (!existingEN) {
      console.warn(`  Skip: EN file not found for ${flag.slug}`);
      continue;
    }

    // b. Resolve sources
    console.log('  Resolving fresh source material...');
    const freshSources = await resolveRefreshSources(flag, cluster);

    // c. Build prompt and generate EN
    const skill = flag.page_type === 'blog' ? loadBlogSkill() : loadSkill();
    const { system, user } = buildRefreshPrompt(flag, skill, existingEN, freshSources, clusterLinks);
    const validate = getRefreshValidator(flag.page_type);

    const fullValidate = (raw: string) => {
      const content = sanitizeOutput(raw);
      if (!content.match(/^---\n[\s\S]*?\n---/)) {
        return { valid: false, errors: ['Missing frontmatter block'] };
      }
      const body = extractBody(content);
      return validate(body);
    };

    console.log('  Generating refreshed EN content...');
    try {
      const enResponse = await callClaudeWithRetry(system, user, {
        maxTokens: flag.page_type === 'blog' ? 8192 : 4096,
        temperature: 0.4,
        maxRetries: 2,
        validate: fullValidate,
      });

      const cleanedEN = sanitizeOutput(enResponse.content);
      console.log(`    EN refreshed (model: ${enResponse.model})`);
      console.log(`    Tokens: ${enResponse.usage?.input_tokens} in / ${enResponse.usage?.output_tokens} out`);

      // Write EN
      const enPath = getRefreshFilePath(flag.slug, flag.page_type, 'en');
      fs.mkdirSync(path.dirname(enPath), { recursive: true });
      fs.writeFileSync(enPath, cleanedEN);
      console.log(`    Written: ${enPath}`);

      // d. Generate ZH using NEW EN content
      console.log('  Generating refreshed ZH content...');
      const zhSystemPrompt = system + buildRefreshZhAddendum(flag, cleanedEN);
      const zhUserPrompt = `用中文刷新此 ${flag.page_type} 页面。需要更新的部分: ${flag.affected_sections.join(', ')}。
更新原因: ${flag.reason}
基于最新英文版内容和新鲜源材料进行更新。`;

      const zhResponse = await callClaudeWithRetry(zhSystemPrompt, zhUserPrompt, {
        maxTokens: flag.page_type === 'blog' ? 8192 : 4096,
        temperature: 0.4,
        maxRetries: 2,
        validate: fullValidate,
      });

      const cleanedZH = sanitizeOutput(zhResponse.content);
      console.log(`    ZH refreshed (model: ${zhResponse.model})`);

      // Write ZH
      const zhPath = getRefreshFilePath(flag.slug, flag.page_type, 'zh');
      fs.mkdirSync(path.dirname(zhPath), { recursive: true });
      fs.writeFileSync(zhPath, cleanedZH);
      console.log(`    Written: ${zhPath}`);

      // e. Update flag status
      flag.status = 'refreshed';
      refreshedCount++;
    } catch (err) {
      console.error(`  ❌ Refresh failed for ${flag.slug}: ${(err as Error).message}`);
    }
  }

  // 6. Write updated cluster JSON
  fs.writeFileSync(clusterPath, JSON.stringify(cluster, null, 2) + '\n');
  console.log(`\n  Updated cluster JSON: ${clusterPath}`);

  console.log(`\n✅ Refresh complete — ${refreshedCount} page(s) refreshed`);
}

// ============================================================
// MAIN
// ============================================================

async function main() {
  if (REFRESH_MODE && CLUSTER_SLUG) {
    await runRefreshMode(CLUSTER_SLUG);
    closeDb();
    console.log('\n✅ Refresh mode complete');
    return;
  }

  if (CLUSTER_SLUG) {
    await runClusterMode(CLUSTER_SLUG, TYPE_FILTER || undefined);
    closeDb();
    console.log('\n✅ Cluster mode complete');
    return;
  }

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
