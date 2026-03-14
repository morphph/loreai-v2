#!/usr/bin/env tsx
/**
 * write-topic-blog.ts — Manual Topic Blog Pipeline
 *
 * Input a topic keyword → Gemini Deep Research → Narrative Architect →
 * EN/ZH Writers → Persist to content/ + SQLite → Git push.
 *
 * Usage:
 *   npx tsx scripts/write-topic-blog.ts --topic="Claude Code Agent Teams"
 *   npx tsx scripts/write-topic-blog.ts --topic="..." --skip-research
 *   npx tsx scripts/write-topic-blog.ts --topic="..." --dry-run
 */

import { existsSync, mkdirSync, readFileSync, copyFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import matter from 'gray-matter';

import { runGeminiDeepResearch } from './lib/gemini-research';
import { runSubagent, runSubagentWithRetry } from './lib/subagent';
import { validateBlogPost } from './lib/validate';
import { sanitizeOutput } from './lib/sanitize';
import { upsertContent, upsertKeyword, closeDb } from './lib/db';
import { gitAddCommitPush } from './lib/git';
import { todaySGT } from './lib/date';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, '..');
const WORKSPACE_BASE = path.join(PROJECT_ROOT, 'output', 'blog-workspace');

// ── CLI Args ─────────────────────────────────────────────────────────

function parseArgs() {
  const args = process.argv.slice(2);
  let topic = '';
  let skipResearch = false;
  let dryRun = false;

  for (const arg of args) {
    if (arg.startsWith('--topic=')) topic = arg.slice('--topic='.length);
    if (arg === '--skip-research') skipResearch = true;
    if (arg === '--dry-run') dryRun = true;
  }

  if (!topic) {
    console.error('Usage: npx tsx scripts/write-topic-blog.ts --topic="Your Topic"');
    console.error('Options: --skip-research  --dry-run');
    process.exit(1);
  }

  return { topic, skipResearch, dryRun };
}

function toSlug(topic: string): string {
  return topic
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 60);
}

function log(step: string, message: string) {
  const ts = new Date().toISOString().split('T')[1].split('.')[0];
  console.log(`[${ts}] [${step}] ${message}`);
}

// ── Main ─────────────────────────────────────────────────────────────

async function main() {
  const { topic, skipResearch, dryRun } = parseArgs();
  const slug = toSlug(topic);
  const date = todaySGT();
  const workspace = path.join(WORKSPACE_BASE, slug);

  console.log('\n' + '='.repeat(60));
  console.log('  Topic Blog Pipeline');
  console.log('='.repeat(60));
  log('START', `Topic: ${topic}`);
  log('START', `Slug: ${slug}`);
  log('START', `Workspace: ${workspace}`);
  log('START', `Date: ${date}`);
  log('START', `Skip research: ${skipResearch}`);
  log('START', `Dry run: ${dryRun}`);

  if (dryRun) {
    console.log('\n[DRY RUN] Pipeline plan:');
    console.log(`  1. ${skipResearch ? 'SKIP' : 'RUN'} Gemini Deep Research`);
    console.log('  2. RUN Narrative Architect (Claude Subagent)');
    console.log('  3a. RUN EN Writer (Claude Subagent)');
    console.log('  3b. RUN ZH Writer (Claude Subagent)');
    console.log(`  4. Persist to content/blog/{en,zh}/${slug}.md + SQLite`);
    console.log('  5. Git commit + push');
    console.log('\n[DRY RUN] No actions taken.');
    process.exit(0);
  }

  mkdirSync(workspace, { recursive: true });
  const startTime = Date.now();

  const materialPath = path.join(workspace, 'material.md');
  const narrativePath = path.join(workspace, 'narrative.json');
  const blogEnPath = path.join(workspace, 'blog-en.md');
  const blogZhPath = path.join(workspace, 'blog-zh.md');

  // ── Step 1: Gemini Deep Research ───────────────────────────────────

  console.log('\n' + '-'.repeat(60));
  if (skipResearch) {
    log('RESEARCH', 'Skipped (--skip-research)');
    if (!existsSync(materialPath)) {
      const { writeFileSync } = await import('fs');
      writeFileSync(materialPath, `Topic: ${topic}\nGemini research skipped. Write based on your knowledge of this topic.\n`);
    }
  } else {
    log('STEP', '1/5 - Gemini Deep Research');
    await runGeminiDeepResearch(topic, materialPath);
  }

  // ── Step 2: Narrative Architect ────────────────────────────────────

  console.log('\n' + '-'.repeat(60));
  log('STEP', '2/5 - Narrative Architect (Claude Subagent)');

  let researchSummary = '';
  if (existsSync(materialPath)) {
    const full = readFileSync(materialPath, 'utf-8');
    researchSummary = full.slice(0, 3000);
  }

  const narrativePrompt = `
读取 material.md，提炼 Core Narrative。

Focus on controversy, industry implications, and what makes this story matter to developers — not just what happened.

输出要求：
1. 写入 narrative.json，严格遵循以下 JSON schema：
   - topic_id: string (kebab-case)
   - title: string
   - created_at: string (ISO 8601)
   - is_update: boolean
   - previous_topic_id: string | null
   - one_liner: string (must be provocative enough to share on Twitter)
   - key_points: string[] (3-5 items, each must contain a specific number, date, or verifiable fact)
   - story_spine: { background, breakthrough, mechanism, significance, risks } (all non-empty strings)
   - faq: { question, answer }[] (min 3)
   - references: { title, url, source, date (YYYY-MM-DD) }[] (min 1)
   - diagrams: { type: "mermaid", title, code }[] (min 1)
   - seo: { slug (kebab-case), meta_title_en (50-60 chars), meta_description_en (150-160 chars), keywords_en (3-5), keywords_zh (3-5) }

2. Quality bar:
   - one_liner must be provocative enough to share on Twitter
   - key_points must each contain a specific number, date, or verifiable fact

完成后执行: npx tsx scripts/validate-narrative.ts narrative.json
如果验证失败，修复后重新输出。

Here is the research executive summary for context:

${researchSummary}

(Full report is at material.md — read it for details)
`.trim();

  const narrativeResult = await runSubagentWithRetry(
    'NARRATIVE', narrativePrompt, workspace, 5 * 60 * 1000
  );

  if (existsSync(narrativePath)) {
    log('NARRATIVE', 'Success: narrative.json created');
  } else {
    log('NARRATIVE', `Failed (ok=${narrativeResult.ok}), continuing without narrative`);
  }

  // ── Step 3a/3b: EN + ZH Writers (parallel) ────────────────────────

  console.log('\n' + '-'.repeat(60));
  log('STEP', '3/5 - Writers EN + ZH (Claude Subagents, parallel)');

  // Build narrative context for EN writer
  let narrativeContext = '';
  if (existsSync(narrativePath)) {
    try {
      const narr = JSON.parse(readFileSync(narrativePath, 'utf-8'));
      narrativeContext = `
Key narrative elements (from narrative.json):
- One-liner: ${narr.one_liner || 'N/A'}
- Key points: ${JSON.stringify(narr.key_points || [])}
- Story spine: ${JSON.stringify(narr.story_spine || {})}
`;
    } catch {}
  }

  const enPrompt = `
You are an English SEO blog writer.

Follow ${PROJECT_ROOT}/skills/topic-blog-en/SKILL.md strictly for formatting, tone, and structure.

Input files:
- material.md (deep research material)
- narrative.json (structural framework)
- ${PROJECT_ROOT}/skills/topic-blog-en/SKILL.md (writing spec)

${narrativeContext}

Editorial angle: Extract the one_liner and story_spine from narrative.json and use them as your structural backbone. Your article must have a clear *thesis* — not just summarize facts, but argue a position.

What unique insight can LoreAI offer that TechCrunch or The Verge won't? Go deeper on technical implications.

Writing principles:
- Narrative provides structure: organize by story_spine
- Research provides depth: extract specific data, user feedback, technical details
- Combine both for a piece with both framework and depth

IMPORTANT: Follow the SKILL.md frontmatter format exactly. Use date: ${date}, slug from narrative.json seo.slug.

Output: write to blog-en.md

(Full narrative: narrative.json, Full research: material.md)
`.trim();

  // Build narrative context for ZH writer
  let narrativeContextZH = '';
  if (existsSync(narrativePath)) {
    try {
      const narr = JSON.parse(readFileSync(narrativePath, 'utf-8'));
      narrativeContextZH = `
核心叙事要素（来自 narrative.json）：
- One-liner: ${narr.one_liner || 'N/A'}
- Key points: ${JSON.stringify(narr.key_points || [])}
- Story spine: ${JSON.stringify(narr.story_spine || {})}
`;
    } catch {}
  }

  const zhPrompt = `
你是中文科技博客作家。

严格遵循 ${PROJECT_ROOT}/skills/topic-blog-zh/SKILL.md 的格式、语气和结构规范。

输入：
- material.md (深度素材)
- narrative.json (结构框架)
- ${PROJECT_ROOT}/skills/topic-blog-zh/SKILL.md (写作规范)

${narrativeContextZH}

重要原则：
- 你不是在翻译！基于同一话题独立创作中文内容
- 用中文读者熟悉的比喻和类比
- 如果话题与中国市场相关，自然融入本地视角和国产模型对比；如果不相关，不要强行加入。
- 专业术语首次出现标注英文：大语言模型（LLM）
- 语气像懂技术的朋友在科普

文章必须有明确的观点和立场，不是简单的信息汇总。从 narrative.json 的 one_liner 和 story_spine 中提取叙事主线。

LoreAI 的差异化：比机器之心更有观点，比少数派更有技术深度。

IMPORTANT: Follow the SKILL.md frontmatter format exactly. Use date: ${date}, slug same as EN version.

输出：写入 blog-zh.md

(Full narrative: narrative.json, Full research: material.md)
`.trim();

  // Run EN and ZH writers in parallel
  const [enResult, zhResult] = await Promise.all([
    runSubagentWithRetry('WRITER-EN', enPrompt, workspace, 10 * 60 * 1000),
    runSubagentWithRetry('WRITER-ZH', zhPrompt, workspace, 10 * 60 * 1000),
  ]);

  // ── Validate outputs ──────────────────────────────────────────────

  let enOk = false;
  if (existsSync(blogEnPath)) {
    const enRaw = readFileSync(blogEnPath, 'utf-8');
    const enBody = sanitizeOutput(enRaw);
    if (enBody.startsWith('---')) {
      const validation = validateBlogPost(
        enBody.replace(/^---[\s\S]*?---/, ''), // strip frontmatter for validation
        { maxWords: 3500 }
      );
      if (validation.valid) {
        log('WRITER-EN', 'Success: blog-en.md validated');
        enOk = true;
      } else {
        log('WRITER-EN', `Validation warnings: ${validation.errors.join(', ')}`);
        enOk = true; // still usable
      }
    } else {
      log('WRITER-EN', 'Warning: blog-en.md does not start with frontmatter');
      enOk = true; // still try to use it
    }
  } else {
    log('WRITER-EN', `Failed: blog-en.md not found (ok=${enResult.ok})`);
  }

  let zhOk = false;
  if (existsSync(blogZhPath)) {
    const zhRaw = readFileSync(blogZhPath, 'utf-8');
    if (zhRaw.match(/^# .+/m) && (zhRaw.match(/^## .+/gm) || []).length >= 2) {
      log('WRITER-ZH', 'Success: blog-zh.md validated');
      zhOk = true;
    } else {
      log('WRITER-ZH', 'Warning: blog-zh.md missing H1 or <2 H2s');
      zhOk = true; // still try to use it
    }
  } else {
    log('WRITER-ZH', `Failed: blog-zh.md not found (ok=${zhResult.ok}), skipping ZH`);
  }

  if (!enOk) {
    log('ERROR', 'EN blog not produced, aborting');
    process.exit(1);
  }

  // ── Step 4: Persist ────────────────────────────────────────────────

  console.log('\n' + '-'.repeat(60));
  log('STEP', '4/5 - Persist to content/ + SQLite');

  // Determine final slug from narrative.json if available
  let finalSlug = slug;
  if (existsSync(narrativePath)) {
    try {
      const narr = JSON.parse(readFileSync(narrativePath, 'utf-8'));
      if (narr.seo?.slug) finalSlug = narr.seo.slug;
    } catch {}
  }

  const contentFiles: string[] = [];

  // EN blog
  const enDestDir = path.join(PROJECT_ROOT, 'content', 'blog', 'en');
  const enDest = path.join(enDestDir, `${finalSlug}.md`);
  mkdirSync(enDestDir, { recursive: true });
  copyFileSync(blogEnPath, enDest);
  contentFiles.push(enDest);

  const enMd = readFileSync(enDest, 'utf-8');
  const enParsed = matter(enMd);
  const enTitle = enParsed.data.title || topic;

  upsertContent({
    type: 'blog',
    slug: finalSlug,
    lang: 'en',
    title: enTitle,
    body_markdown: enMd,
    meta_json: JSON.stringify(enParsed.data),
  });
  log('PERSIST', `EN blog: content/blog/en/${finalSlug}.md + DB`);

  // Keywords from narrative
  if (existsSync(narrativePath)) {
    try {
      const narr = JSON.parse(readFileSync(narrativePath, 'utf-8'));
      for (const kw of narr.seo?.keywords_en || []) {
        upsertKeyword(kw, 'topic-blog', finalSlug);
      }
      for (const kw of narr.seo?.keywords_zh || []) {
        upsertKeyword(kw, 'topic-blog', finalSlug);
      }
    } catch {}
  }

  // ZH blog
  if (zhOk) {
    const zhDestDir = path.join(PROJECT_ROOT, 'content', 'blog', 'zh');
    const zhDest = path.join(zhDestDir, `${finalSlug}.md`);
    mkdirSync(zhDestDir, { recursive: true });
    copyFileSync(blogZhPath, zhDest);
    contentFiles.push(zhDest);

    const zhMd = readFileSync(zhDest, 'utf-8');
    const zhParsed = matter(zhMd);
    const zhTitle = zhParsed.data.title || topic;

    upsertContent({
      type: 'blog',
      slug: finalSlug,
      lang: 'zh',
      title: zhTitle,
      body_markdown: zhMd,
      meta_json: JSON.stringify(zhParsed.data),
    });
    log('PERSIST', `ZH blog: content/blog/zh/${finalSlug}.md + DB`);
  }

  // ── Step 4b: SEO Entity Extraction ─────────────────────────────────

  log('STEP', '4b - SEO Entity Extraction');
  try {
    const { extractSEOEntities, saveSEOEntities } = await import('./lib/seo-extract');
    const enBody = readFileSync(enDest, 'utf-8').replace(/^---[\s\S]*?---\s*/, '');
    const seoEntities = await extractSEOEntities(topic, enBody);
    saveSEOEntities(seoEntities, finalSlug, topic);
    log('SEO', `Extracted: ${seoEntities.glossary_terms.length} glossary, ${seoEntities.faq_questions.length} FAQ, ${seoEntities.comparison_pairs.length} compare`);
  } catch (err) {
    log('SEO', `Entity extraction failed (non-fatal): ${(err as Error).message}`);
  }

  closeDb();

  // ── Step 5: Git push ───────────────────────────────────────────────

  console.log('\n' + '-'.repeat(60));
  log('STEP', '5/5 - Git commit + push');

  const commitMsg = `📝 Topic blog: ${topic.slice(0, 50)}`;
  const committed = await gitAddCommitPush(contentFiles, commitMsg);
  if (committed) {
    log('GIT', 'Committed + pushed');
  } else {
    log('GIT', 'Nothing to commit');
  }

  // ── Summary ────────────────────────────────────────────────────────

  const elapsed = ((Date.now() - startTime) / 1000 / 60).toFixed(1);
  console.log('\n' + '='.repeat(60));
  console.log('  Pipeline Summary');
  console.log('='.repeat(60));
  console.log(`  Topic: ${topic}`);
  console.log(`  Slug: ${finalSlug}`);
  console.log(`  Time: ${elapsed} minutes`);
  console.log(`  EN blog: ${enOk ? 'OK' : 'FAILED'}`);
  console.log(`  ZH blog: ${zhOk ? 'OK' : 'SKIPPED'}`);
  console.log('='.repeat(60));
  console.log();
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
