#!/usr/bin/env npx tsx
/**
 * scripts/import-video-blog.ts — Import blog2video artifacts as blog posts
 *
 * Reads video_plan.json + script files from a blog2video output directory,
 * generates ZH blog (spoken→written) and EN blog, then persists to content/ + DB.
 *
 * Usage:
 *   npx tsx scripts/import-video-blog.ts --dir=/path/to/output/slug [--video-url=URL] [--dry-run]
 */
import 'dotenv/config';
import fs from 'fs';
import path from 'path';

import { callClaudeWithRetry } from './lib/ai';
import { sanitizeOutput } from './lib/sanitize.js';
import { validateBlogPost } from './lib/validate';
import { upsertContent, upsertKeyword, closeDb } from './lib/db';
import { todaySGT } from './lib/date.js';
import { gitAddCommitPush } from './lib/git';

// --- CLI args ---
const args = process.argv.slice(2);
function getArg(name: string): string | undefined {
  const flag = args.find((a) => a.startsWith(`--${name}=`));
  return flag ? flag.split('=')[1] : undefined;
}

const DIR = getArg('dir');
const VIDEO_URL = getArg('video-url');
const DRY_RUN = args.includes('--dry-run');
const DATE = getArg('date') || todaySGT();

if (!DIR) {
  console.error('Usage: npx tsx scripts/import-video-blog.ts --dir=/path/to/output/slug [--video-url=URL] [--dry-run]');
  process.exit(1);
}

const ABS_DIR = path.isAbsolute(DIR) ? DIR : path.resolve(process.cwd(), DIR);

console.log(`\n🎬 Video Blog Import — ${path.basename(ABS_DIR)}`);
console.log(`  Directory: ${ABS_DIR}`);
console.log(`  Date: ${DATE}`);
if (VIDEO_URL) console.log(`  Video URL: ${VIDEO_URL}`);
if (DRY_RUN) console.log('  🧪 DRY RUN\n');
console.log('='.repeat(50));

// ============================================================
// Types
// ============================================================

interface VideoPlan {
  topic: string;
  slug?: string;
  key_concepts: string[];
  must_include_details?: string[];
  target_audience?: string;
  source_blog_slug?: string;
  [key: string]: unknown;
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
  video_url?: string;
  source_type: string;
}

// ============================================================
// STAGE 1: Parse Artifacts
// ============================================================

function stage1_parseArtifacts(): { plan: VideoPlan; scripts: string; sourceBlog: string | null } {
  console.log('\n📂 Stage 1: Parse Artifacts');

  // Read video_plan.json
  const planPath = path.join(ABS_DIR, 'video_plan.json');
  if (!fs.existsSync(planPath)) {
    console.error(`  ❌ Missing video_plan.json at ${planPath}`);
    process.exit(1);
  }
  const plan: VideoPlan = JSON.parse(fs.readFileSync(planPath, 'utf-8'));
  console.log(`  ✓ video_plan.json — topic: ${plan.topic}`);
  console.log(`    key_concepts: ${plan.key_concepts?.join(', ') || 'none'}`);

  // Read video scripts (video_1_script.md, video_2_script.md, etc.)
  const scriptFiles = fs.readdirSync(ABS_DIR)
    .filter((f) => /^video_\d+_script\.md$/.test(f))
    .sort();

  if (scriptFiles.length === 0) {
    console.error('  ❌ No video script files found (expected video_N_script.md)');
    process.exit(1);
  }

  const scripts = scriptFiles
    .map((f) => {
      const content = fs.readFileSync(path.join(ABS_DIR, f), 'utf-8');
      console.log(`  ✓ ${f} — ${content.length} chars`);
      return content;
    })
    .join('\n\n---\n\n');

  console.log(`  Total script length: ${scripts.length} chars from ${scriptFiles.length} files`);

  // Read source_blog.md (optional)
  const sourceBlogPath = path.join(ABS_DIR, 'source_blog.md');
  let sourceBlog: string | null = null;
  if (fs.existsSync(sourceBlogPath)) {
    sourceBlog = fs.readFileSync(sourceBlogPath, 'utf-8');
    console.log(`  ✓ source_blog.md — ${sourceBlog.length} chars`);
  } else {
    console.log('  ○ source_blog.md — not found (will generate EN from ZH)');
  }

  return { plan, scripts, sourceBlog };
}

// ============================================================
// STAGE 2: Generate ZH Blog (spoken → written)
// ============================================================

async function stage2_generateZH(
  plan: VideoPlan,
  scripts: string,
  slug: string
): Promise<{ frontmatter: BlogFrontmatter; markdown: string } | null> {
  console.log('\n📝 Stage 2: Generate ZH Blog (spoken → written)');

  const skillPath = path.join(process.cwd(), 'skills', 'video-to-blog-zh', 'SKILL.md');
  const skill = fs.readFileSync(skillPath, 'utf-8');

  const systemPrompt = `${skill}

## 本次生成规则
- 日期：${DATE}
- Slug: ${slug}
- 输出完整 Markdown 文件，包含 --- frontmatter 块 ---
- frontmatter 必须包含所有字段：title, date, slug, description, keywords, category, related_newsletter, related_glossary, related_compare, lang (zh), video_ready (true), video_hook, video_status (published), source_type (video)
${VIDEO_URL ? `- video_url: ${VIDEO_URL}` : ''}
- frontmatter 之后输出博客正文，严格按照结构模板
- 正文 800-1500 CJK 字（不含 frontmatter）`;

  let context = `## video_plan.json 元数据\n\n`;
  context += `**主题**: ${plan.topic}\n`;
  if (plan.key_concepts?.length) context += `**核心概念**: ${plan.key_concepts.join(', ')}\n`;
  if (plan.must_include_details?.length) context += `**必须包含**: ${plan.must_include_details.join(', ')}\n`;
  if (plan.target_audience) context += `**目标受众**: ${plan.target_audience}\n`;

  context += `\n## 视频口播脚本\n\n${scripts}`;

  const userPrompt = `把以下视频口播脚本重写为 LoreAI 中文博客文章：\n\n${context}`;

  try {
    const response = await callClaudeWithRetry(systemPrompt, userPrompt, {
      maxTokens: 8192,
      temperature: 0.5,
      maxRetries: 3,
      validate: (raw) => {
        const content = sanitizeOutput(raw);
        if (!content.match(/^---\n[\s\S]*?\n---/)) {
          return { valid: false, errors: ['Missing frontmatter block'] };
        }
        const body = content.replace(/^---[\s\S]*?---\n*/, '');
        if (!body.match(/^# .+/m)) return { valid: false, errors: ['Missing H1 title'] };
        if ((body.match(/^## .+/gm) || []).length < 2) return { valid: false, errors: ['<2 H2 sections'] };
        return { valid: true, errors: [] };
      },
    });

    const cleaned = sanitizeOutput(response.content);
    console.log(`  ZH blog generated (model: ${response.model})`);
    console.log(`  Tokens: ${response.usage?.input_tokens} in / ${response.usage?.output_tokens} out`);

    const fmMatch = cleaned.match(/^---\n([\s\S]*?)\n---/);
    if (!fmMatch) {
      console.warn('  Failed to parse ZH frontmatter');
      return null;
    }

    const frontmatter = parseFrontmatter(fmMatch[1], 'zh', slug);
    const body = cleaned.replace(/^---[\s\S]*?---\n*/, '');

    return { frontmatter, markdown: body };
  } catch (err) {
    console.error('  ZH blog generation failed:', (err as Error).message);
    return null;
  }
}

// ============================================================
// STAGE 3: Generate EN Blog
// ============================================================

async function stage3_generateEN(
  plan: VideoPlan,
  sourceBlog: string | null,
  zhMarkdown: string | null,
  slug: string
): Promise<{ frontmatter: BlogFrontmatter; markdown: string } | null> {
  console.log('\n📝 Stage 3: Generate EN Blog');

  const skillPath = path.join(process.cwd(), 'skills', 'blog-en', 'SKILL.md');
  const skill = fs.readFileSync(skillPath, 'utf-8');

  let context: string;
  if (sourceBlog) {
    // Use the original source blog as reference
    context = `## Source Blog\n\n${sourceBlog.slice(0, 6000)}`;
    console.log('  Using source_blog.md as reference');
  } else if (zhMarkdown) {
    // Generate from ZH
    context = `## Chinese Blog (translate to EN, do NOT literally translate — rewrite independently)\n\n${zhMarkdown}`;
    console.log('  Generating EN from ZH blog content');
  } else {
    console.warn('  No source material for EN blog');
    return null;
  }

  context += `\n\n## Metadata from video_plan.json\n`;
  context += `Topic: ${plan.topic}\n`;
  if (plan.key_concepts?.length) context += `Key concepts: ${plan.key_concepts.join(', ')}\n`;

  const systemPrompt = `${skill}

## Generation Rules
- Date: ${DATE}
- Slug: ${slug}
- Generate a complete blog post with YAML frontmatter
- Output the FULL markdown file including the --- frontmatter block ---
- The frontmatter MUST include all required fields: title, date, slug, description, keywords, category, related_newsletter, related_glossary, related_compare, lang (en), video_ready (true), video_hook, video_status (published), source_type (video)
${VIDEO_URL ? `- video_url: ${VIDEO_URL}` : ''}
- 800-1500 words for the body`;

  const userPrompt = `Write a blog post for LoreAI based on this material:\n\n${context}`;

  try {
    const response = await callClaudeWithRetry(systemPrompt, userPrompt, {
      maxTokens: 8192,
      temperature: 0.5,
      maxRetries: 3,
      validate: (raw) => {
        const content = sanitizeOutput(raw);
        if (!content.match(/^---\n[\s\S]*?\n---/)) {
          return { valid: false, errors: ['Missing frontmatter block'] };
        }
        const body = content.replace(/^---[\s\S]*?---\n*/, '');
        return validateBlogPost(body);
      },
    });

    const cleaned = sanitizeOutput(response.content);
    console.log(`  EN blog generated (model: ${response.model})`);
    console.log(`  Tokens: ${response.usage?.input_tokens} in / ${response.usage?.output_tokens} out`);

    const fmMatch = cleaned.match(/^---\n([\s\S]*?)\n---/);
    if (!fmMatch) {
      console.warn('  Failed to parse EN frontmatter');
      return null;
    }

    const frontmatter = parseFrontmatter(fmMatch[1], 'en', slug);
    const body = cleaned.replace(/^---[\s\S]*?---\n*/, '');

    return { frontmatter, markdown: body };
  } catch (err) {
    console.error('  EN blog generation failed:', (err as Error).message);
    return null;
  }
}

// ============================================================
// STAGE 4: Extract SEO entities
// ============================================================

async function stage4_extractSEO(plan: VideoPlan, slug: string): Promise<void> {
  console.log('\n🔍 Stage 4: Extract SEO Entities');

  if (!plan.key_concepts?.length) {
    console.log('  No key_concepts in plan, skipping');
    return;
  }

  for (const concept of plan.key_concepts) {
    const kwSlug = concept
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .replace(/\s+/g, '-')
      .slice(0, 60);
    if (kwSlug) {
      upsertKeyword(kwSlug, `video-blog:${slug}`, kwSlug);
      console.log(`  + keyword: ${kwSlug}`);
    }
  }
}

// ============================================================
// STAGE 5: Write files + DB + git
// ============================================================

async function stage5_persist(
  zhResult: { frontmatter: BlogFrontmatter; markdown: string } | null,
  enResult: { frontmatter: BlogFrontmatter; markdown: string } | null,
  slug: string
): Promise<void> {
  console.log('\n💾 Stage 5: Persist & Publish');

  const writtenFiles: string[] = [];

  if (zhResult) {
    const dir = path.join(process.cwd(), 'content', 'blog', 'zh');
    fs.mkdirSync(dir, { recursive: true });
    const filePath = path.join(dir, `${slug}.md`);
    const fullContent = `${buildFrontmatterYaml(zhResult.frontmatter)}\n\n${zhResult.markdown}`;
    fs.writeFileSync(filePath, fullContent);
    writtenFiles.push(filePath);
    console.log(`  Written: ${filePath}`);

    upsertContent({
      type: 'blog',
      slug,
      lang: 'zh',
      title: zhResult.frontmatter.title,
      body_markdown: fullContent,
      meta_json: JSON.stringify({
        category: zhResult.frontmatter.category,
        keywords: zhResult.frontmatter.keywords,
        video_status: 'published',
        source_type: 'video',
      }),
    });
    console.log('  ZH DB record upserted');
  }

  if (enResult) {
    const dir = path.join(process.cwd(), 'content', 'blog', 'en');
    fs.mkdirSync(dir, { recursive: true });
    const filePath = path.join(dir, `${slug}.md`);
    const fullContent = `${buildFrontmatterYaml(enResult.frontmatter)}\n\n${enResult.markdown}`;
    fs.writeFileSync(filePath, fullContent);
    writtenFiles.push(filePath);
    console.log(`  Written: ${filePath}`);

    upsertContent({
      type: 'blog',
      slug,
      lang: 'en',
      title: enResult.frontmatter.title,
      body_markdown: fullContent,
      meta_json: JSON.stringify({
        category: enResult.frontmatter.category,
        keywords: enResult.frontmatter.keywords,
        video_status: 'published',
        source_type: 'video',
      }),
    });
    console.log('  EN DB record upserted');
  }

  if (writtenFiles.length > 0 && !DRY_RUN) {
    await gitAddCommitPush(writtenFiles, `Add video-sourced blog: ${slug}`);
    console.log('  Git committed and pushed');
  }
}

// ============================================================
// Helpers
// ============================================================

function parseFrontmatter(fmText: string, lang: string, slug: string): BlogFrontmatter {
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

  const fm: BlogFrontmatter = {
    title: get('title'),
    date: get('date') || DATE,
    slug: get('slug') || slug,
    description: get('description'),
    keywords: getArray('keywords'),
    category: get('category') || 'DEV',
    related_newsletter: get('related_newsletter') || DATE,
    related_glossary: getArray('related_glossary'),
    related_compare: getArray('related_compare'),
    lang,
    video_ready: true,
    video_hook: get('video_hook'),
    video_status: 'published',
    source_type: 'video',
  };

  if (VIDEO_URL) fm.video_url = VIDEO_URL;
  const parsedVideoUrl = get('video_url');
  if (parsedVideoUrl && !fm.video_url) fm.video_url = parsedVideoUrl;

  return fm;
}

function buildFrontmatterYaml(fm: BlogFrontmatter): string {
  const kw = fm.keywords.map((k) => `"${k}"`).join(', ');
  const glossary = fm.related_glossary.join(', ');
  const compare = fm.related_compare.join(', ');

  let yaml = `---
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
source_type: ${fm.source_type}`;

  if (fm.video_url) {
    yaml += `\nvideo_url: "${fm.video_url}"`;
  }

  yaml += '\n---';
  return yaml;
}

// ============================================================
// MAIN
// ============================================================

async function main() {
  // Stage 1: Parse artifacts
  const { plan, scripts, sourceBlog } = stage1_parseArtifacts();

  const slug = plan.slug || plan.source_blog_slug || path.basename(ABS_DIR);
  console.log(`\n  Resolved slug: ${slug}`);

  if (DRY_RUN) {
    console.log('\n📝 Stage 2-5: DRY RUN — skipping AI calls and persistence');
    console.log(`  Would generate ZH blog from ${scripts.length} chars of scripts`);
    console.log(`  Would generate EN blog from ${sourceBlog ? 'source_blog.md' : 'ZH output'}`);
    console.log(`  Would write to content/blog/{en,zh}/${slug}.md`);
    closeDb();
    console.log('\n✅ Video blog import dry-run complete');
    return;
  }

  // Stage 2: Generate ZH blog
  const zhResult = await stage2_generateZH(plan, scripts, slug);
  if (!zhResult) {
    console.error('❌ ZH blog generation failed');
    closeDb();
    process.exit(1);
  }

  // Stage 3: Generate EN blog
  const enResult = await stage3_generateEN(plan, sourceBlog, zhResult.markdown, slug);

  // Stage 4: Extract SEO entities
  await stage4_extractSEO(plan, slug);

  // Stage 5: Persist
  await stage5_persist(zhResult, enResult, slug);

  closeDb();
  console.log(`\n✅ Video blog import complete — ${slug}`);
}

main().catch((err) => {
  console.error('💥 Video blog import failed:', err);
  closeDb();
  process.exit(1);
});
