#!/usr/bin/env npx tsx
/**
 * scripts/write-blog.ts — Blog writing pipeline
 * Runs at 7am SGT (23:00 UTC) daily Mon-Fri
 *
 * Stages:
 *   1. Load blog seeds from data/blog-seeds/YYYY-MM-DD.json
 *   2. Pick top 2 candidates (skip topics blogged in last 7 days)
 *   3. For each candidate:
 *      a. Fetch seed URL content
 *      b. Pull related news_items from DB
 *      c. Generate EN blog post (Claude Opus)
 *      d. Generate ZH blog post (Claude Opus, no fallback — skip on failure)
 *      e. Extract SEO entities (glossary, FAQ, comparison)
 *      f. Write to content/blog/{en,zh}/slug.md
 *      g. Git add + commit + push
 */
import 'dotenv/config';
import fs from 'fs';
import path from 'path';

import { callClaudeWithRetry } from './lib/ai';
import { validateBlogPost } from './lib/validate';
import { getDb, getRecentNewsItems, upsertContent, upsertKeyword, closeDb } from './lib/db';


/** Strip markdown code fences, preamble text, and leading whitespace that models sometimes wrap output in */
function stripCodeFences(text: string): string {
  let s = text.trim();
  // Remove opening ```markdown or ```yaml or ``` at start
  s = s.replace(/^```(?:markdown|yaml|md)?\s*\n/, '');
  // Remove closing ``` at end
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

// Parse args
const dateArg = process.argv.find((a) => a.startsWith('--date='));
const DATE = dateArg ? dateArg.split('=')[1] : new Date().toISOString().split('T')[0];
const DRY_RUN = process.argv.includes('--dry-run');

console.log(`\n📝 Blog Pipeline — ${DATE}`);
console.log('='.repeat(50));

// ============================================================
// Types
// ============================================================

interface BlogSeed {
  topic: string;
  url: string;
  source: string;
  x_engagement_24h: number;
  brave_has_results: boolean;
  brave_related_searches: string[];
  brave_discussions: string[];
  mention_count_7d: number;
  composite_score: number;
  suggested_angle: 'news' | 'tutorial' | 'analysis' | 'comparison';
}

interface BlogFrontmatter {
  title: string;
  date: string;
  slug: string;
  description: string;
  keywords: string[];
  category: string;
  related_newsletter: string;
  related_glossary: string[];
  related_compare: string[];
  lang: string;
  video_ready: boolean;
  video_hook: string;
  video_status: string;
}

interface SEOEntities {
  glossary_terms: string[];
  faq_questions: string[];
  comparison_pairs: string[];
}

// ============================================================
// STAGE 1: Load Blog Seeds
// ============================================================

function stage1_loadSeeds(): BlogSeed[] {
  console.log('\n🌱 Stage 1: Load Blog Seeds');

  const seedPath = path.join(process.cwd(), 'data', 'blog-seeds', `${DATE}.json`);

  if (!fs.existsSync(seedPath)) {
    console.log(`  No seeds found at ${seedPath}`);
    console.log('  Trying yesterday...');

    // Try yesterday
    const yesterday = new Date(DATE);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];
    const yesterdayPath = path.join(process.cwd(), 'data', 'blog-seeds', `${yesterdayStr}.json`);

    if (fs.existsSync(yesterdayPath)) {
      console.log(`  Found yesterday's seeds: ${yesterdayPath}`);
      const seeds: BlogSeed[] = JSON.parse(fs.readFileSync(yesterdayPath, 'utf-8'));
      console.log(`  Loaded ${seeds.length} seeds`);
      return seeds;
    }

    console.log('  No seeds available. Exiting.');
    return [];
  }

  const seeds: BlogSeed[] = JSON.parse(fs.readFileSync(seedPath, 'utf-8'));
  console.log(`  Loaded ${seeds.length} seeds from ${seedPath}`);
  for (const seed of seeds) {
    console.log(`    ${seed.composite_score.toFixed(1)}: ${seed.topic.slice(0, 80)}`);
  }

  return seeds;
}

// ============================================================
// STAGE 2: Pick Top 2 Candidates
// ============================================================

function getRecentBlogSlugs(days: number = 7): Set<string> {
  const blogDir = path.join(process.cwd(), 'content', 'blog', 'en');
  if (!fs.existsSync(blogDir)) return new Set();

  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);

  const slugs = new Set<string>();
  const files = fs.readdirSync(blogDir).filter((f) => f.endsWith('.md') && !f.startsWith('.'));

  for (const file of files) {
    const content = fs.readFileSync(path.join(blogDir, file), 'utf-8');
    const dateMatch = content.match(/^date:\s*(\d{4}-\d{2}-\d{2})/m);
    if (dateMatch) {
      const postDate = new Date(dateMatch[1]);
      if (postDate >= cutoff) {
        // Extract slug from frontmatter or filename
        const slugMatch = content.match(/^slug:\s*(.+)$/m);
        const slug = slugMatch ? slugMatch[1].trim() : file.replace('.md', '');
        slugs.add(slug);
      }
    }
  }

  return slugs;
}

function topicToSlug(topic: string): string {
  return topic
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 60);
}

function stage2_pickCandidates(seeds: BlogSeed[]): BlogSeed[] {
  console.log('\n🎯 Stage 2: Pick Top 3 Candidates');

  const recentSlugs = getRecentBlogSlugs(7);
  console.log(`  Recent blog slugs (last 7 days): ${recentSlugs.size}`);
  for (const slug of recentSlugs) {
    console.log(`    - ${slug}`);
  }

  // Sort by composite_score descending
  const sorted = [...seeds].sort((a, b) => b.composite_score - a.composite_score);

  // Filter out already-blogged topics
  const candidates: BlogSeed[] = [];
  for (const seed of sorted) {
    const slug = topicToSlug(seed.topic);

    // Check if this topic (or similar slug) was already blogged
    let alreadyBlogged = false;
    for (const recentSlug of recentSlugs) {
      // Simple overlap check: if the generated slug is a substring of recent or vice versa
      if (recentSlug.includes(slug.slice(0, 20)) || slug.includes(recentSlug.slice(0, 20))) {
        alreadyBlogged = true;
        break;
      }
    }

    if (alreadyBlogged) {
      console.log(`  Skipping (already blogged): ${seed.topic.slice(0, 60)}`);
      continue;
    }

    candidates.push(seed);
    if (candidates.length >= 3) break;
  }

  console.log(`  Selected ${candidates.length} candidates:`);
  for (const c of candidates) {
    console.log(`    ${c.composite_score.toFixed(1)}: ${c.topic.slice(0, 80)}`);
  }

  return candidates;
}

// ============================================================
// STAGE 3a: Fetch Seed URL Content
// ============================================================

async function fetchUrlContent(url: string): Promise<string> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);

    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'LoreAI-Bot/2.0 (blog-pipeline)',
        Accept: 'text/html,application/xhtml+xml,text/plain',
      },
    });

    clearTimeout(timeout);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const html = await response.text();

    // Extract text content from HTML (simple extraction)
    const text = html
      // Remove script and style tags with content
      .replace(/<script[\s\S]*?<\/script>/gi, '')
      .replace(/<style[\s\S]*?<\/style>/gi, '')
      // Remove HTML tags
      .replace(/<[^>]+>/g, ' ')
      // Decode common HTML entities
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      // Normalize whitespace
      .replace(/\s+/g, ' ')
      .trim();

    // Take first ~3000 chars to stay within reasonable token limits
    return text.slice(0, 3000);
  } catch (err) {
    console.warn(`  Failed to fetch ${url}: ${(err as Error).message}`);
    return '';
  }
}

// ============================================================
// STAGE 3b: Pull Related News Items
// ============================================================

function getRelatedNewsItems(topic: string): Array<{ title: string; url: string | null; summary: string | null }> {
  const items = getRecentNewsItems(168); // 7 days = 168 hours

  // Extract significant keywords from topic (words > 4 chars)
  const keywords = topic
    .toLowerCase()
    .split(/\s+/)
    .filter((w) => w.length > 4)
    .map((w) => w.replace(/[^a-z0-9]/g, ''))
    .filter((w) => w.length > 0);

  if (keywords.length === 0) return [];

  // Find items matching at least one keyword
  const related = items
    .filter((item) => {
      const text = `${item.title} ${item.summary || ''}`.toLowerCase();
      return keywords.some((kw) => text.includes(kw));
    })
    .slice(0, 10) // Max 10 related items
    .map((item) => ({
      title: item.title,
      url: item.url,
      summary: item.summary,
    }));

  return related;
}

// ============================================================
// STAGE 3c: Generate EN Blog Post
// ============================================================

async function generateENBlog(
  seed: BlogSeed,
  urlContent: string,
  relatedItems: Array<{ title: string; url: string | null; summary: string | null }>
): Promise<{ frontmatter: BlogFrontmatter; markdown: string } | null> {
  console.log('  Generating EN blog post...');

  const skillPath = path.join(process.cwd(), 'skills', 'blog-en', 'SKILL.md');
  const skill = fs.readFileSync(skillPath, 'utf-8');

  // Build context
  let context = `## Source Material\n\n`;
  context += `**Topic**: ${seed.topic}\n`;
  context += `**Source URL**: ${seed.url}\n`;
  context += `**Source**: ${seed.source}\n`;
  context += `**Suggested Angle**: ${seed.suggested_angle}\n`;

  if (seed.brave_related_searches.length > 0) {
    context += `**Related Searches**: ${seed.brave_related_searches.join(', ')}\n`;
  }

  if (urlContent) {
    context += `\n### Source Article Content\n${urlContent}\n`;
  }

  if (relatedItems.length > 0) {
    context += `\n### Related News (Last 7 Days)\n`;
    for (const item of relatedItems) {
      context += `- ${item.title}${item.url ? ` (${item.url})` : ''}\n`;
      if (item.summary) context += `  ${item.summary.slice(0, 150)}\n`;
    }
  }

  const systemPrompt = `${skill}\n\n## Generation Rules\n- Date: ${DATE}\n- Related newsletter: ${DATE}\n- Generate a complete blog post with YAML frontmatter\n- Output the FULL markdown file including the --- frontmatter block ---\n- The frontmatter MUST include all required fields: title, date, slug, description, keywords, category, related_newsletter, related_glossary, related_compare, lang (en), video_ready (true), video_hook, video_status (none)\n- After frontmatter, output the blog post body following the exact structure template\n- 800-1500 words for the body (not counting frontmatter)`;

  const userPrompt = `Write a blog post about this topic for LoreAI:\n\n${context}`;

  try {
    const response = await callClaudeWithRetry(systemPrompt, userPrompt, {
      maxTokens: 8192,
      temperature: 0.5,
      maxRetries: 3,
      validate: (raw) => {
        const content = stripCodeFences(raw);
        if (!content.match(/^---\n[\s\S]*?\n---/)) {
          return { valid: false, errors: ['Missing frontmatter block'] };
        }
        const body = content.replace(/^---[\s\S]*?---\n*/, '');
        return validateBlogPost(body);
      },
    });

    const cleaned = stripCodeFences(response.content);
    console.log(`    EN blog generated (model: ${response.model})`);
    console.log(`    Tokens: ${response.usage?.input_tokens} in / ${response.usage?.output_tokens} out`);

    // Parse frontmatter
    const fmMatch = cleaned.match(/^---\n([\s\S]*?)\n---/);
    if (!fmMatch) {
      console.warn('    Failed to parse frontmatter');
      return null;
    }

    const frontmatter = parseFrontmatter(fmMatch[1], 'en');
    const body = cleaned.replace(/^---[\s\S]*?---\n*/, '');

    return { frontmatter, markdown: body };
  } catch (err) {
    console.error('    EN blog generation failed:', (err as Error).message);
    return null;
  }
}

// ============================================================
// STAGE 3d: Generate ZH Blog Post
// ============================================================

async function generateZHBlog(
  seed: BlogSeed,
  urlContent: string,
  relatedItems: Array<{ title: string; url: string | null; summary: string | null }>,
  enFrontmatter: BlogFrontmatter
): Promise<{ frontmatter: BlogFrontmatter; markdown: string } | null> {
  console.log('  Generating ZH blog post...');

  const skillPath = path.join(process.cwd(), 'skills', 'blog-zh', 'SKILL.md');
  const skill = fs.readFileSync(skillPath, 'utf-8');

  // Build context
  let context = `## 素材\n\n`;
  context += `**主题**: ${seed.topic}\n`;
  context += `**来源 URL**: ${seed.url}\n`;
  context += `**来源**: ${seed.source}\n`;
  context += `**建议角度**: ${seed.suggested_angle}\n`;

  if (seed.brave_related_searches.length > 0) {
    context += `**相关搜索**: ${seed.brave_related_searches.join(', ')}\n`;
  }

  if (urlContent) {
    context += `\n### 原文内容\n${urlContent}\n`;
  }

  if (relatedItems.length > 0) {
    context += `\n### 相关新闻（过去 7 天）\n`;
    for (const item of relatedItems) {
      context += `- ${item.title}${item.url ? ` (${item.url})` : ''}\n`;
      if (item.summary) context += `  ${item.summary.slice(0, 150)}\n`;
    }
  }

  const systemPrompt = `${skill}\n\n## 本次生成规则\n- 日期：${DATE}\n- 关联简报：${DATE}\n- Slug: ${enFrontmatter.slug}\n- 输出完整 Markdown 文件，包含 --- frontmatter 块 ---\n- frontmatter 必须包含所有字段：title, date, slug, description, keywords, category, related_newsletter, related_glossary, related_compare, lang (zh), video_ready (true), video_hook, video_status (none)\n- frontmatter 之后输出博客正文，严格按照结构模板\n- 正文 800-1500 字（不含 frontmatter）\n- 这不是英文版的翻译。基于同一批素材，独立创作中文版本。`;

  const userPrompt = `基于以下素材为 LoreAI 创作一篇中文博客：\n\n${context}`;

  try {
    // No fallback for ZH blog — skip on failure
    const response = await callClaudeWithRetry(systemPrompt, userPrompt, {
      maxTokens: 8192,
      temperature: 0.5,
      maxRetries: 3,
      validate: (raw) => {
        const content = stripCodeFences(raw);
        if (!content.match(/^---\n[\s\S]*?\n---/)) {
          return { valid: false, errors: ['Missing frontmatter block'] };
        }
        // Basic ZH body validation
        const body = content.replace(/^---[\s\S]*?---\n*/, '');
        if (!body.match(/^# .+/m)) return { valid: false, errors: ['Missing H1 title'] };
        if ((body.match(/^## .+/gm) || []).length < 2) return { valid: false, errors: ['<2 H2 sections'] };
        return { valid: true, errors: [] };
      },
    });

    const cleaned = stripCodeFences(response.content);
    console.log(`    ZH blog generated (model: ${response.model})`);
    console.log(`    Tokens: ${response.usage?.input_tokens} in / ${response.usage?.output_tokens} out`);

    const fmMatch = cleaned.match(/^---\n([\s\S]*?)\n---/);
    if (!fmMatch) {
      console.warn('    Failed to parse ZH frontmatter');
      return null;
    }

    const frontmatter = parseFrontmatter(fmMatch[1], 'zh');
    const body = cleaned.replace(/^---[\s\S]*?---\n*/, '');

    return { frontmatter, markdown: body };
  } catch (err) {
    const errorMsg = (err as Error).message;
    const errorStack = (err as Error).stack || '';
    console.warn('    ZH blog generation failed (skipping):', errorMsg);
    console.warn('    Error details:', errorStack);

    // Log ZH error to file for review report
    const errDir = path.join(process.cwd(), 'data', 'blog-errors');
    fs.mkdirSync(errDir, { recursive: true });
    const errPath = path.join(errDir, `${DATE}.json`);
    const existing: Array<Record<string, unknown>> = fs.existsSync(errPath)
      ? JSON.parse(fs.readFileSync(errPath, 'utf-8'))
      : [];
    existing.push({
      lang: 'zh',
      topic: seed.topic,
      error: errorMsg,
      stack: errorStack.slice(0, 500),
      timestamp: new Date().toISOString(),
    });
    fs.writeFileSync(errPath, JSON.stringify(existing, null, 2));

    return null;
  }
}

// ============================================================
// STAGE 3e: Extract SEO Entities
// ============================================================

async function extractSEOEntities(
  topic: string,
  blogContent: string
): Promise<SEOEntities> {
  console.log('  Extracting SEO entities...');

  const systemPrompt = `You are an SEO analyst. Extract entities from the blog post for an AI news website.

Return ONLY a JSON object with these fields:
- glossary_terms: string[] — technical terms that deserve their own glossary page (3-5 terms)
- faq_questions: string[] — questions readers might ask about this topic (2-4 questions)
- comparison_pairs: string[] — "X vs Y" comparison slugs relevant to this topic (1-3 pairs)

Format comparison pairs as lowercase hyphenated slugs: "claude-code-vs-cursor"
Format glossary terms as lowercase hyphenated slugs: "claude-code", "skill-md"

Output ONLY the JSON object. No markdown, no explanation.`;

  const userPrompt = `Topic: ${topic}\n\nBlog content:\n${blogContent.slice(0, 2000)}`;

  try {
    const response = await callClaudeWithRetry(systemPrompt, userPrompt, {
      maxTokens: 1024,
      temperature: 0.2,
      maxRetries: 2,
      validate: (content) => {
        try {
          let json = content;
          const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
          if (jsonMatch) json = jsonMatch[1];
          const parsed = JSON.parse(json.trim());
          if (!parsed.glossary_terms || !parsed.faq_questions) {
            return { valid: false, errors: ['Missing required fields'] };
          }
          return { valid: true, errors: [] };
        } catch {
          return { valid: false, errors: ['Invalid JSON'] };
        }
      },
    });

    let json = response.content;
    const jsonMatch = json.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) json = jsonMatch[1];

    const entities: SEOEntities = JSON.parse(json.trim());
    console.log(`    Glossary: ${entities.glossary_terms.join(', ')}`);
    console.log(`    FAQ: ${entities.faq_questions.length} questions`);
    console.log(`    Comparisons: ${entities.comparison_pairs.join(', ')}`);

    return entities;
  } catch (err) {
    console.warn('    SEO extraction failed:', (err as Error).message);
    return { glossary_terms: [], faq_questions: [], comparison_pairs: [] };
  }
}

// ============================================================
// Helpers
// ============================================================

function parseFrontmatter(fmText: string, lang: string): BlogFrontmatter {
  // Simple YAML-ish parser for our known frontmatter fields
  const get = (key: string): string => {
    const match = fmText.match(new RegExp(`^${key}:\\s*"?([^"\\n]*)"?`, 'm'));
    return match ? match[1].trim() : '';
  };

  const getArray = (key: string): string[] => {
    const match = fmText.match(new RegExp(`^${key}:\\s*\\[([^\\]]*)]`, 'm'));
    if (!match) return [];
    return match[1]
      .split(',')
      .map((s) => s.trim().replace(/^["']|["']$/g, ''))
      .filter((s) => s.length > 0);
  };

  return {
    title: get('title'),
    date: get('date') || DATE,
    slug: get('slug') || topicToSlug(get('title')),
    description: get('description'),
    keywords: getArray('keywords'),
    category: get('category') || 'DEV',
    related_newsletter: get('related_newsletter') || DATE,
    related_glossary: getArray('related_glossary'),
    related_compare: getArray('related_compare'),
    lang,
    video_ready: true,
    video_hook: get('video_hook'),
    video_status: 'none',
  };
}

function buildFrontmatterYaml(fm: BlogFrontmatter): string {
  const kw = fm.keywords.map((k) => `"${k}"`).join(', ');
  const glossary = fm.related_glossary.join(', ');
  const compare = fm.related_compare.join(', ');

  return `---
title: "${fm.title.replace(/"/g, '\\"')}"
date: ${fm.date}
slug: ${fm.slug}
description: "${fm.description.replace(/"/g, '\\"')}"
keywords: [${kw}]
category: ${fm.category}
related_newsletter: ${fm.related_newsletter}
related_glossary: [${glossary}]
related_compare: [${compare}]
lang: ${fm.lang}
video_ready: ${fm.video_ready}
video_hook: "${fm.video_hook.replace(/"/g, '\\"')}"
video_status: ${fm.video_status}
---`;
}

function writeBlogFile(lang: string, slug: string, frontmatter: BlogFrontmatter, body: string): string {
  const dir = path.join(process.cwd(), 'content', 'blog', lang);
  fs.mkdirSync(dir, { recursive: true });

  const filePath = path.join(dir, `${slug}.md`);
  const fullContent = `${buildFrontmatterYaml(frontmatter)}\n\n${body}`;
  fs.writeFileSync(filePath, fullContent);

  return filePath;
}

function saveSEOEntities(entities: SEOEntities, slug: string, seed?: BlogSeed): void {
  // Save glossary terms to keywords table
  for (const term of entities.glossary_terms) {
    upsertKeyword(term, `blog:${slug}`, term);
  }

  // Save FAQ questions as keywords
  for (const question of entities.faq_questions) {
    const faqSlug = question
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .replace(/\s+/g, '-')
      .slice(0, 60);
    upsertKeyword(faqSlug, `blog-faq:${slug}`);
  }

  // Save comparison pairs
  for (const pair of entities.comparison_pairs) {
    upsertKeyword(pair, `blog-compare:${slug}`);
  }

  // Save brave_discussions and brave_related_searches from blog seed
  if (seed) {
    for (const discussion of seed.brave_discussions) {
      const kwSlug = discussion
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, '')
        .replace(/\s+/g, '-')
        .slice(0, 60);
      if (kwSlug) upsertKeyword(kwSlug, 'brave-discussion', slug);
    }
    for (const related of seed.brave_related_searches) {
      const kwSlug = related
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, '')
        .replace(/\s+/g, '-')
        .slice(0, 60);
      if (kwSlug) upsertKeyword(kwSlug, 'brave-related', slug);
    }
  }
}

// ============================================================
// STAGE 3: Process Each Candidate
// ============================================================

async function stage3_processCandidates(candidates: BlogSeed[]): Promise<string[]> {
  console.log('\n📝 Stage 3: Process Candidates');

  const writtenFiles: string[] = [];

  for (let i = 0; i < candidates.length; i++) {
    const seed = candidates[i];
    console.log(`\n--- Candidate ${i + 1}/${candidates.length}: ${seed.topic.slice(0, 60)} ---`);

    // 3a. Fetch seed URL content
    console.log('  Fetching source content...');
    let urlContent = '';
    if (seed.url) {
      urlContent = await fetchUrlContent(seed.url);
      if (urlContent) {
        console.log(`    Fetched ${urlContent.length} chars from ${seed.url}`);
      } else {
        console.log(`    Could not fetch content, using title + summary as fallback`);
        urlContent = `Title: ${seed.topic}\nSource: ${seed.source}`;
      }
    }

    // 3b. Pull related news items
    const relatedItems = getRelatedNewsItems(seed.topic);
    console.log(`  Found ${relatedItems.length} related news items`);

    if (DRY_RUN) {
      console.log('  [DRY RUN] Skipping blog generation');
      continue;
    }

    // 3c. Generate EN blog
    const enResult = await generateENBlog(seed, urlContent, relatedItems);
    if (!enResult) {
      console.warn('  EN blog failed, skipping this candidate');
      continue;
    }

    const slug = enResult.frontmatter.slug;

    // Write EN file
    const enPath = writeBlogFile('en', slug, enResult.frontmatter, enResult.markdown);
    writtenFiles.push(enPath);
    console.log(`  Written: ${enPath}`);

    // Save EN to DB
    const enContentId = upsertContent({
      type: 'blog',
      slug,
      lang: 'en',
      title: enResult.frontmatter.title,
      body_markdown: `${buildFrontmatterYaml(enResult.frontmatter)}\n\n${enResult.markdown}`,
      meta_json: JSON.stringify({
        category: enResult.frontmatter.category,
        keywords: enResult.frontmatter.keywords,
        video_ready: enResult.frontmatter.video_ready,
      }),
    });
    console.log(`  EN DB record id=${enContentId}`);

    // 3d. Generate ZH blog (no fallback — skip on failure)
    const zhResult = await generateZHBlog(seed, urlContent, relatedItems, enResult.frontmatter);
    if (zhResult) {
      // Ensure ZH uses same slug
      zhResult.frontmatter.slug = slug;
      const zhPath = writeBlogFile('zh', slug, zhResult.frontmatter, zhResult.markdown);
      writtenFiles.push(zhPath);
      console.log(`  Written: ${zhPath}`);

      // Save ZH to DB
      const zhContentId = upsertContent({
        type: 'blog',
        slug,
        lang: 'zh',
        title: zhResult.frontmatter.title,
        body_markdown: `${buildFrontmatterYaml(zhResult.frontmatter)}\n\n${zhResult.markdown}`,
        meta_json: JSON.stringify({
          category: zhResult.frontmatter.category,
          keywords: zhResult.frontmatter.keywords,
          video_ready: zhResult.frontmatter.video_ready,
        }),
      });
      console.log(`  ZH DB record id=${zhContentId}`);
    } else {
      console.log('  ZH blog skipped (generation failed — see data/blog-errors/ for details)');
    }

    // 3e. Extract SEO entities
    const seoEntities = await extractSEOEntities(seed.topic, enResult.markdown);
    saveSEOEntities(seoEntities, slug, seed);
    console.log(`  SEO entities saved to DB`);

    // Update frontmatter with SEO entities if they provide better data
    if (seoEntities.glossary_terms.length > 0 && enResult.frontmatter.related_glossary.length === 0) {
      enResult.frontmatter.related_glossary = seoEntities.glossary_terms;
      // Rewrite EN file with updated frontmatter
      writeBlogFile('en', slug, enResult.frontmatter, enResult.markdown);
    }
    if (seoEntities.comparison_pairs.length > 0 && enResult.frontmatter.related_compare.length === 0) {
      enResult.frontmatter.related_compare = seoEntities.comparison_pairs;
      writeBlogFile('en', slug, enResult.frontmatter, enResult.markdown);
    }
  }

  return writtenFiles;
}

// ============================================================
// STAGE 4: Git Push
// ============================================================

async function stage4_gitPush(writtenFiles: string[]): Promise<void> {
  console.log('\n🚀 Stage 4: Git Push');

  if (writtenFiles.length === 0) {
    console.log('  No files to push');
    return;
  }

  if (DRY_RUN) {
    console.log('  [DRY RUN] Would push:');
    for (const f of writtenFiles) {
      console.log(`    ${f}`);
    }
    return;
  }

}

// ============================================================
// MAIN
// ============================================================

async function main() {
  if (DRY_RUN) console.log('🧪 DRY RUN — skipping AI calls and git push\n');

  // Stage 1: Load seeds
  const seeds = stage1_loadSeeds();
  if (seeds.length === 0) {
    console.log('\n⚠️ No blog seeds available. Run write-newsletter.ts first.');
    closeDb();
    process.exit(0);
  }

  // Stage 2: Pick candidates
  const candidates = stage2_pickCandidates(seeds);
  if (candidates.length === 0) {
    console.log('\n⚠️ No eligible candidates (all topics recently blogged).');
    closeDb();
    process.exit(0);
  }

  // Stage 3: Process candidates
  const writtenFiles = await stage3_processCandidates(candidates);

  // Stage 4: Git push
  await stage4_gitPush(writtenFiles);

  closeDb();
  console.log(`\n✅ Blog pipeline complete — ${writtenFiles.length} posts written`);
}

main().catch((err) => {
  console.error('💥 Blog pipeline failed:', err);
  closeDb();
  process.exit(1);
});
