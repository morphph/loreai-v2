#!/usr/bin/env npx tsx
/**
 * scripts/import-video-blog.ts — Import blog2video artifacts as blog posts
 *
 * Reads meta.json (or video_plan.json) + script files from blog2video output,
 * generates ZH blog (spoken→written) and EN blog, then persists to content/ + DB.
 *
 * Usage:
 *   # Single directory
 *   npx tsx scripts/import-video-blog.ts --dir=/path/to/output/slug [--video-url=URL] [--dry-run]
 *
 *   # Batch mode: scan queue for unimported dirs
 *   npx tsx scripts/import-video-blog.ts --batch [--queue-dir=/path] [--dry-run]
 *
 *   # Auto mode (for cron): batch + suppress interactive output
 *   npx tsx scripts/import-video-blog.ts --batch --auto [--queue-dir=/path]
 */
import 'dotenv/config';
import fs from 'fs';
import path from 'path';

import { callClaudeWithRetry } from './lib/ai';
import { sanitizeOutput } from './lib/sanitize.js';
import { validateBlogPost } from './lib/validate';
import { upsertContent, upsertKeyword, closeDb } from './lib/db';
import { todaySGT } from './lib/date.js';
import { gitAdd, gitCommit, gitPush, gitPull, gitAddCommitPush } from './lib/git';

// --- CLI args ---
const args = process.argv.slice(2);
function getArg(name: string): string | undefined {
  const flag = args.find((a) => a.startsWith(`--${name}=`));
  return flag ? flag.split('=')[1] : undefined;
}

const DIR = getArg('dir');
const VIDEO_URL = getArg('video-url');
const DRY_RUN = args.includes('--dry-run');
const BATCH = args.includes('--batch');
const AUTO = args.includes('--auto');
const DATE = getArg('date') || todaySGT();
const QUEUE_DIR = getArg('queue-dir') || '/home/ubuntu/blog2video/queue';

if (!DIR && !BATCH) {
  console.error('Usage:\n  --dir=/path/to/slug   Import single directory\n  --batch               Scan queue for unimported dirs\n  --auto                Cron mode (batch + quiet)\n  --queue-dir=/path     Override queue directory (default: /home/ubuntu/blog2video/queue)\n  --dry-run             Preview only');
  process.exit(1);
}

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
// Batch: find unimported directories
// ============================================================

function getExistingBlogSlugs(): Set<string> {
  const slugs = new Set<string>();
  for (const lang of ['en', 'zh']) {
    const dir = path.join(process.cwd(), 'content', 'blog', lang);
    if (!fs.existsSync(dir)) continue;
    for (const f of fs.readdirSync(dir)) {
      if (f.endsWith('.md')) slugs.add(f.replace('.md', ''));
    }
  }
  return slugs;
}

function findUnimportedDirs(queueDir: string): string[] {
  if (!fs.existsSync(queueDir)) {
    console.error(`  ❌ Queue directory not found: ${queueDir}`);
    return [];
  }

  const existingSlugs = getExistingBlogSlugs();
  const dirs: string[] = [];

  for (const entry of fs.readdirSync(queueDir)) {
    const fullPath = path.join(queueDir, entry);
    if (!fs.statSync(fullPath).isDirectory()) continue;

    // Check if this dir has the required artifacts
    const hasMeta = fs.existsSync(path.join(fullPath, 'meta.json')) ||
                    fs.existsSync(path.join(fullPath, 'video_plan.json'));
    const hasScript = fs.readdirSync(fullPath).some((f) => /^video_\d+_script\.md$/.test(f));

    if (!hasMeta || !hasScript) {
      console.log(`  ○ ${entry} — missing artifacts (meta/scripts), skipping`);
      continue;
    }

    // Resolve slug from meta.json or dir name
    const slug = resolveSlugFromDir(fullPath, entry);

    if (existingSlugs.has(slug)) {
      console.log(`  ○ ${entry} — already imported as "${slug}"`);
      continue;
    }

    dirs.push(fullPath);
  }

  return dirs;
}

function resolveSlugFromDir(dirPath: string, dirName: string): string {
  // Try meta.json first
  const metaPath = path.join(dirPath, 'meta.json');
  if (fs.existsSync(metaPath)) {
    try {
      const meta = JSON.parse(fs.readFileSync(metaPath, 'utf-8'));
      if (meta.slug) return meta.slug;
      if (meta.source_blog_slug) return meta.source_blog_slug;
    } catch { /* fallthrough */ }
  }
  // Try video_plan.json
  const planPath = path.join(dirPath, 'video_plan.json');
  if (fs.existsSync(planPath)) {
    try {
      const plan = JSON.parse(fs.readFileSync(planPath, 'utf-8'));
      if (plan.slug) return plan.slug;
      if (plan.source_blog_slug) return plan.source_blog_slug;
    } catch { /* fallthrough */ }
  }
  return dirName;
}

// ============================================================
// Parse artifacts from a single directory
// ============================================================

function parseArtifacts(absDir: string): { plan: VideoPlan; scripts: string; sourceBlog: string | null } | null {
  console.log(`\n📂 Parse Artifacts: ${path.basename(absDir)}`);

  // Read meta.json or video_plan.json
  let plan: VideoPlan;
  const metaPath = path.join(absDir, 'meta.json');
  const planPath = path.join(absDir, 'video_plan.json');

  if (fs.existsSync(metaPath)) {
    const raw = JSON.parse(fs.readFileSync(metaPath, 'utf-8'));
    // Normalize meta.json fields to VideoPlan shape
    plan = {
      topic: raw.topic || raw.title || path.basename(absDir),
      slug: raw.slug || raw.source_blog_slug,
      key_concepts: raw.key_concepts || raw.keywords || [],
      must_include_details: raw.must_include_details || [],
      target_audience: raw.target_audience,
      source_blog_slug: raw.source_blog_slug,
      ...raw,
    };
    console.log(`  ✓ meta.json — topic: ${plan.topic}`);
  } else if (fs.existsSync(planPath)) {
    plan = JSON.parse(fs.readFileSync(planPath, 'utf-8'));
    console.log(`  ✓ video_plan.json — topic: ${plan.topic}`);
  } else {
    console.error(`  ❌ No meta.json or video_plan.json in ${absDir}`);
    return null;
  }

  if (plan.key_concepts?.length) {
    console.log(`    key_concepts: ${plan.key_concepts.join(', ')}`);
  }

  // Read video scripts (video_1_script.md, video_2_script.md, etc.)
  const scriptFiles = fs.readdirSync(absDir)
    .filter((f) => /^video_\d+_script\.md$/.test(f))
    .sort();

  if (scriptFiles.length === 0) {
    console.error(`  ❌ No video script files found in ${absDir}`);
    return null;
  }

  const scripts = scriptFiles
    .map((f) => {
      const content = fs.readFileSync(path.join(absDir, f), 'utf-8');
      console.log(`  ✓ ${f} — ${content.length} chars`);
      return content;
    })
    .join('\n\n---\n\n');

  console.log(`  Total script length: ${scripts.length} chars from ${scriptFiles.length} files`);

  // Read source_blog.md (optional)
  const sourceBlogPath = path.join(absDir, 'source_blog.md');
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
// Generate ZH Blog (spoken → written)
// ============================================================

async function generateZH(
  plan: VideoPlan,
  scripts: string,
  slug: string,
  videoUrl?: string
): Promise<{ frontmatter: BlogFrontmatter; markdown: string } | null> {
  console.log('\n📝 Generate ZH Blog (spoken → written)');

  const skillPath = path.join(process.cwd(), 'skills', 'video-to-blog-zh', 'SKILL.md');
  const skill = fs.readFileSync(skillPath, 'utf-8');

  const systemPrompt = `${skill}

## 本次生成规则
- 日期：${DATE}
- Slug: ${slug}
- 输出完整 Markdown 文件，包含 --- frontmatter 块 ---
- frontmatter 必须包含所有字段：title, date, slug, description, keywords, category, related_newsletter, related_glossary, related_compare, lang (zh), video_ready (true), video_hook, video_status (published), source_type (video)
${videoUrl ? `- video_url: ${videoUrl}` : ''}
- frontmatter 之后输出博客正文，严格按照结构模板
- 正文 800-1500 CJK 字（不含 frontmatter）`;

  let context = `## 元数据\n\n`;
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

    const frontmatter = parseFrontmatter(fmMatch[1], 'zh', slug, videoUrl);
    const body = cleaned.replace(/^---[\s\S]*?---\n*/, '');

    return { frontmatter, markdown: body };
  } catch (err) {
    console.error('  ZH blog generation failed:', (err as Error).message);
    return null;
  }
}

// ============================================================
// Generate EN Blog
// ============================================================

async function generateEN(
  plan: VideoPlan,
  sourceBlog: string | null,
  zhMarkdown: string | null,
  slug: string,
  videoUrl?: string
): Promise<{ frontmatter: BlogFrontmatter; markdown: string } | null> {
  console.log('\n📝 Generate EN Blog');

  const skillPath = path.join(process.cwd(), 'skills', 'blog-en', 'SKILL.md');
  const skill = fs.readFileSync(skillPath, 'utf-8');

  let context: string;
  if (sourceBlog) {
    context = `## Source Blog\n\n${sourceBlog.slice(0, 6000)}`;
    console.log('  Using source_blog.md as reference');
  } else if (zhMarkdown) {
    context = `## Chinese Blog (translate to EN, do NOT literally translate — rewrite independently)\n\n${zhMarkdown}`;
    console.log('  Generating EN from ZH blog content');
  } else {
    console.warn('  No source material for EN blog');
    return null;
  }

  context += `\n\n## Metadata\n`;
  context += `Topic: ${plan.topic}\n`;
  if (plan.key_concepts?.length) context += `Key concepts: ${plan.key_concepts.join(', ')}\n`;

  const systemPrompt = `${skill}

## Generation Rules
- Date: ${DATE}
- Slug: ${slug}
- Generate a complete blog post with YAML frontmatter
- Output the FULL markdown file including the --- frontmatter block ---
- The frontmatter MUST include all required fields: title, date, slug, description, keywords, category, related_newsletter, related_glossary, related_compare, lang (en), video_ready (true), video_hook, video_status (published), source_type (video)
${videoUrl ? `- video_url: ${videoUrl}` : ''}
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

    const frontmatter = parseFrontmatter(fmMatch[1], 'en', slug, videoUrl);
    const body = cleaned.replace(/^---[\s\S]*?---\n*/, '');

    return { frontmatter, markdown: body };
  } catch (err) {
    console.error('  EN blog generation failed:', (err as Error).message);
    return null;
  }
}

// ============================================================
// Extract SEO entities
// ============================================================

function extractSEO(plan: VideoPlan, slug: string): void {
  if (!plan.key_concepts?.length) return;

  console.log('\n🔍 Extract SEO Entities');
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
// Write files + DB (no git — caller handles git)
// ============================================================

function writeAndPersist(
  zhResult: { frontmatter: BlogFrontmatter; markdown: string } | null,
  enResult: { frontmatter: BlogFrontmatter; markdown: string } | null,
  slug: string
): string[] {
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
  }

  return writtenFiles;
}

// ============================================================
// Process a single directory (all stages)
// ============================================================

async function processOneDir(
  absDir: string,
  videoUrl?: string
): Promise<{ slug: string; files: string[] } | null> {
  const artifacts = parseArtifacts(absDir);
  if (!artifacts) return null;

  const { plan, scripts, sourceBlog } = artifacts;
  const slug = plan.slug || plan.source_blog_slug || path.basename(absDir);
  console.log(`  Resolved slug: ${slug}`);

  if (DRY_RUN) {
    console.log(`  [DRY RUN] Would generate ZH blog from ${scripts.length} chars of scripts`);
    console.log(`  [DRY RUN] Would generate EN blog from ${sourceBlog ? 'source_blog.md' : 'ZH output'}`);
    console.log(`  [DRY RUN] Would write to content/blog/{en,zh}/${slug}.md`);
    return { slug, files: [] };
  }

  // Generate ZH blog
  const zhResult = await generateZH(plan, scripts, slug, videoUrl);
  if (!zhResult) {
    console.error(`  ❌ ZH blog generation failed for ${slug}`);
    return null;
  }

  // Generate EN blog
  const enResult = await generateEN(plan, sourceBlog, zhResult.markdown, slug, videoUrl);

  // Extract SEO
  extractSEO(plan, slug);

  // Write files + DB
  const files = writeAndPersist(zhResult, enResult, slug);

  return { slug, files };
}

// ============================================================
// Helpers
// ============================================================

function parseFrontmatter(fmText: string, lang: string, slug: string, videoUrl?: string): BlogFrontmatter {
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

  // video_url priority: CLI flag > parsed from AI output
  if (videoUrl) fm.video_url = videoUrl;
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
  if (BATCH) {
    // --- Batch mode ---
    console.log(`\n🎬 Video Blog Import — BATCH MODE`);
    console.log(`  Queue: ${QUEUE_DIR}`);
    console.log(`  Date: ${DATE}`);
    if (DRY_RUN) console.log('  🧪 DRY RUN');
    if (AUTO) console.log('  🤖 AUTO (cron)');
    console.log('='.repeat(50));

    // Pull latest before batch to avoid conflicts
    if (!DRY_RUN) {
      console.log('\n  Pulling latest...');
      await gitPull();
    }

    const dirs = findUnimportedDirs(QUEUE_DIR);
    if (dirs.length === 0) {
      console.log('\n  No new video outputs to import.');
      closeDb();
      return;
    }

    console.log(`\n  Found ${dirs.length} unimported dirs:`);
    for (const d of dirs) {
      console.log(`    + ${path.basename(d)}`);
    }

    // Process each directory
    const allFiles: string[] = [];
    const importedSlugs: string[] = [];
    const failedDirs: string[] = [];

    for (let i = 0; i < dirs.length; i++) {
      const dirPath = dirs[i];
      console.log(`\n${'─'.repeat(50)}`);
      console.log(`  [${i + 1}/${dirs.length}] ${path.basename(dirPath)}`);

      try {
        const result = await processOneDir(dirPath);
        if (result) {
          importedSlugs.push(result.slug);
          allFiles.push(...result.files);
        } else {
          failedDirs.push(path.basename(dirPath));
        }
      } catch (err) {
        console.error(`  ❌ Error processing ${path.basename(dirPath)}:`, (err as Error).message);
        failedDirs.push(path.basename(dirPath));
      }
    }

    // Single git commit + push for all
    if (allFiles.length > 0 && !DRY_RUN) {
      console.log(`\n${'─'.repeat(50)}`);
      console.log(`\n🚀 Git commit + push (${allFiles.length} files)`);
      const message = importedSlugs.length === 1
        ? `Add video-sourced blog: ${importedSlugs[0]}`
        : `Add ${importedSlugs.length} video-sourced blogs: ${importedSlugs.join(', ')}`;
      gitAdd(allFiles);
      const committed = gitCommit(message);
      if (committed) {
        await gitPush();
        console.log('  Committed and pushed');
      }
    }

    closeDb();

    // Summary
    console.log(`\n${'═'.repeat(50)}`);
    console.log(`✅ Batch import complete`);
    console.log(`  Imported: ${importedSlugs.length} (${importedSlugs.join(', ') || 'none'})`);
    if (failedDirs.length > 0) {
      console.log(`  Failed: ${failedDirs.length} (${failedDirs.join(', ')})`);
    }
    if (DRY_RUN) console.log('  (dry run — nothing written)');

  } else {
    // --- Single directory mode ---
    const absDir = path.isAbsolute(DIR!) ? DIR! : path.resolve(process.cwd(), DIR!);

    console.log(`\n🎬 Video Blog Import — ${path.basename(absDir)}`);
    console.log(`  Directory: ${absDir}`);
    console.log(`  Date: ${DATE}`);
    if (VIDEO_URL) console.log(`  Video URL: ${VIDEO_URL}`);
    if (DRY_RUN) console.log('  🧪 DRY RUN');
    console.log('='.repeat(50));

    const result = await processOneDir(absDir, VIDEO_URL);

    if (!result) {
      closeDb();
      console.error('\n❌ Import failed');
      process.exit(1);
    }

    // Git commit + push for single dir
    if (result.files.length > 0 && !DRY_RUN) {
      await gitAddCommitPush(result.files, `Add video-sourced blog: ${result.slug}`);
      console.log('  Git committed and pushed');
    }

    closeDb();
    console.log(`\n✅ Video blog import complete — ${result.slug}`);
  }
}

main().catch((err) => {
  console.error('💥 Video blog import failed:', err);
  closeDb();
  process.exit(1);
});
