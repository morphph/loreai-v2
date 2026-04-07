#!/usr/bin/env npx tsx
/**
 * scripts/import-blog.ts — Import offline-created blog articles
 *
 * Normalizes frontmatter, strips HTML comments, inserts mermaid visualizations,
 * injects internal links, populates related content, upserts to DB,
 * and extracts SEO entities.
 *
 * Usage:
 *   npx tsx scripts/import-blog.ts --file=article.md [options]
 *
 * Options:
 *   --file=PATH          Path to the offline markdown article (required)
 *   --date=YYYY-MM-DD    Override publish date (default: today SGT)
 *   --category=DEV       Override category (default: DEV)
 *   --max-words=10000    Override word count ceiling (default: 10000)
 *   --dry-run            Preview only, no writes
 *   --no-seo             Skip SEO entity extraction
 *   --no-git             Skip git add/commit/push
 *   --force              Overwrite if slug already exists
 */
import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';

import { validateBlogPost, countWords } from './lib/validate';
import { upsertContent, upsertKeyword, closeDb } from './lib/db';
import { todaySGT } from './lib/date.js';
import { gitAddCommitPush } from './lib/git';
import { loadTargets, injectLinks } from './lib/link-inject';

const ROOT = process.cwd();

// ============================================================
// CLI args
// ============================================================

const args = process.argv.slice(2);
function getArg(name: string): string | undefined {
  const flag = args.find((a) => a.startsWith(`--${name}=`));
  return flag ? flag.split('=').slice(1).join('=') : undefined;
}

const FILE = getArg('file');
const DATE_OVERRIDE = getArg('date');
const CATEGORY = getArg('category') || 'DEV';
const MAX_WORDS = parseInt(getArg('max-words') || '10000', 10);
const DRY_RUN = args.includes('--dry-run');
const NO_SEO = args.includes('--no-seo');
const NO_GIT = args.includes('--no-git');
const FORCE = args.includes('--force');

if (!FILE) {
  console.error('Usage: npx tsx scripts/import-blog.ts --file=article.md [--date=YYYY-MM-DD] [--category=DEV] [--dry-run] [--no-seo] [--no-git] [--force]');
  process.exit(1);
}

const filePath = path.isAbsolute(FILE) ? FILE : path.join(ROOT, FILE);
if (!fs.existsSync(filePath)) {
  console.error(`File not found: ${filePath}`);
  process.exit(1);
}

// ============================================================
// Types
// ============================================================

interface NormalizedFrontmatter {
  title: string;
  date: string;
  slug: string;
  description: string;
  keywords: string[];
  category: string;
  related_newsletter: string;
  related_glossary: string[];
  related_compare: string[];
  related_blog: string[];
  related_topics: string[];
  lang: string;
  video_ready: boolean;
  video_hook: string;
  video_status: string;
  source_type: string;
}

interface ExtraMetadata {
  series?: string;
  episode?: string;
  author?: string;
  canonical_url?: string;
  [key: string]: unknown;
}

// ============================================================
// Main
// ============================================================

async function main() {

// ============================================================
// Stage 0: Parse
// ============================================================

console.log(`\n📄 Import Blog: ${path.basename(filePath)}`);
const raw = fs.readFileSync(filePath, 'utf-8');
const parsed = matter(raw);
const data = parsed.data as Record<string, unknown>;
let body = parsed.content;

console.log(`  Title: ${data.title || '(missing)'}`);
console.log(`  Slug: ${data.slug || '(missing)'}`);
console.log(`  Lang: ${data.lang || '(missing)'}`);

// ============================================================
// Stage 1: Normalize frontmatter
// ============================================================

console.log('\n🔧 Stage 1: Normalize frontmatter');

function resolveDate(rawDate: unknown): string {
  if (DATE_OVERRIDE) return `${DATE_OVERRIDE}T00:00:00.000Z`;
  if (typeof rawDate === 'string') {
    // Detect placeholder dates like "2026-04-XX"
    if (rawDate.includes('XX') || rawDate.includes('xx') || !Date.parse(rawDate)) {
      const today = todaySGT();
      console.log(`  Date placeholder "${rawDate}" → ${today}`);
      return `${today}T00:00:00.000Z`;
    }
    // Ensure ISO format
    if (!rawDate.includes('T')) return `${rawDate}T00:00:00.000Z`;
    return rawDate;
  }
  if (rawDate instanceof Date) return rawDate.toISOString();
  return `${todaySGT()}T00:00:00.000Z`;
}

function normalizeLang(rawLang: unknown): string {
  const lang = String(rawLang || 'en').toLowerCase();
  // Strip region suffix: zh-CN → zh, en-US → en
  return lang.split('-')[0];
}

function toStringArray(val: unknown): string[] {
  if (Array.isArray(val)) return val.map(String);
  if (typeof val === 'string') return [val];
  return [];
}

const resolvedDate = resolveDate(data.date);
const lang = normalizeLang(data.lang);

// Map tags → keywords
const keywords = toStringArray(data.keywords || data.tags);

// Extract extra metadata (preserved in DB meta_json, stripped from published frontmatter)
const EXTRA_FIELDS = ['series', 'episode', 'author', 'canonical_url'];
const extras: ExtraMetadata = {};
for (const field of EXTRA_FIELDS) {
  if (data[field] !== undefined) {
    extras[field] = data[field] as string;
    console.log(`  Extra: ${field} = ${data[field]}`);
  }
}

const frontmatter: NormalizedFrontmatter = {
  title: String(data.title || ''),
  date: resolvedDate.slice(0, 10),
  slug: String(data.slug || ''),
  description: String(data.description || ''),
  keywords,
  category: String(data.category || CATEGORY),
  related_newsletter: resolvedDate.slice(0, 10) + 'T00:00:00.000Z',
  related_glossary: toStringArray(data.related_glossary),
  related_compare: toStringArray(data.related_compare),
  related_blog: toStringArray(data.related_blog),
  related_topics: toStringArray(data.related_topics),
  lang,
  video_ready: false,
  video_hook: '',
  video_status: 'none',
  source_type: 'offline',
};

// Validate required fields
if (!frontmatter.title || !frontmatter.slug) {
  console.error('  ❌ Missing required fields: title and slug are mandatory');
  process.exit(1);
}

console.log(`  → lang: ${frontmatter.lang}`);
console.log(`  → date: ${frontmatter.date}`);
console.log(`  → category: ${frontmatter.category}`);
console.log(`  → keywords: ${frontmatter.keywords.join(', ')}`);

// ============================================================
// Stage 2: Insert visualizations (replace illustration placeholders)
// ============================================================

console.log('\n🎨 Stage 2: Insert visualizations');
// Visualization insertion is skipped — illustration placeholders in HTML comments
// are stripped in Stage 3. Per-article diagrams should be authored inline in the
// markdown source, not injected by the import script.
console.log('  (skipped — diagrams should be inline in source markdown)');

// ============================================================
// Stage 3: Strip remaining HTML comments
// ============================================================

console.log('\n🧹 Stage 3: Strip HTML comments');
const commentsBefore = (body.match(/<!--[\s\S]*?-->/g) || []).length;
body = body.replace(/<!--[\s\S]*?-->/g, '').replace(/\n{3,}/g, '\n\n').trim();
console.log(`  Stripped ${commentsBefore} HTML comment blocks`);

// ============================================================
// Stage 4: Inject internal links
// ============================================================

console.log('\n🔗 Stage 4: Inject internal links');
const targets = loadTargets(ROOT);
if (Object.keys(targets).length > 0) {
  const { result, added, details } = injectLinks(body, targets, frontmatter.slug, frontmatter.lang, 8);
  body = result;
  console.log(`  Injected ${added} internal links`);
  for (const d of details) console.log(d);
} else {
  console.log('  ⚠ No link targets found — run build-link-targets.ts first. Skipping.');
}

// ============================================================
// Stage 5: Auto-populate related_* frontmatter
// ============================================================

console.log('\n📎 Stage 5: Auto-populate related content');

function findRelatedSlugs(type: string): string[] {
  const dir = path.join(ROOT, 'content', type, frontmatter.lang);
  if (!fs.existsSync(dir)) return [];

  const slugs: string[] = [];
  const kwLower = frontmatter.keywords.map((k) => k.toLowerCase());

  for (const file of fs.readdirSync(dir)) {
    if (!file.endsWith('.md')) continue;
    const slug = file.replace(/\.md$/, '');
    if (slug === frontmatter.slug) continue; // skip self

    // Check if slug contains any of our keywords
    const slugWords = slug.toLowerCase();
    for (const kw of kwLower) {
      const kwSlug = kw.replace(/\s+/g, '-').toLowerCase();
      if (slugWords.includes(kwSlug) || kwSlug.includes(slugWords)) {
        slugs.push(slug);
        break;
      }
    }
  }
  return slugs;
}

if (frontmatter.related_glossary.length === 0) {
  frontmatter.related_glossary = findRelatedSlugs('glossary').slice(0, 5);
  if (frontmatter.related_glossary.length > 0)
    console.log(`  → related_glossary: ${frontmatter.related_glossary.join(', ')}`);
}

if (frontmatter.related_compare.length === 0) {
  frontmatter.related_compare = findRelatedSlugs('compare').slice(0, 3);
  if (frontmatter.related_compare.length > 0)
    console.log(`  → related_compare: ${frontmatter.related_compare.join(', ')}`);
}

if (frontmatter.related_blog.length === 0) {
  frontmatter.related_blog = findRelatedSlugs('blog').slice(0, 3);
  if (frontmatter.related_blog.length > 0)
    console.log(`  → related_blog: ${frontmatter.related_blog.join(', ')}`);
}

if (frontmatter.related_topics.length === 0) {
  frontmatter.related_topics = findRelatedSlugs('topics').slice(0, 2);
  if (frontmatter.related_topics.length > 0)
    console.log(`  → related_topics: ${frontmatter.related_topics.join(', ')}`);
}

// ============================================================
// Stage 6: Validate
// ============================================================

console.log('\n✅ Stage 6: Validate');

// Auto-append CTA if missing
if (!body.match(/\[.*(subscribe|订阅).*\]/i)) {
  const cta = frontmatter.lang === 'zh'
    ? '\n\n---\n\n*觉得有用？[订阅 AI 简报](/subscribe)，每天 5 分钟掌握 AI 动态。*'
    : '\n\n---\n\n*Found this useful? [Subscribe to AI News](/subscribe) for daily AI briefings.*';
  body += cta;
  console.log('  + Auto-appended newsletter CTA');
}

const wordCount = countWords(body);
console.log(`  Word count: ${wordCount}`);

const validation = validateBlogPost(body, { maxWords: MAX_WORDS });
if (validation.valid) {
  console.log('  ✓ Validation passed');
} else {
  console.warn('  ⚠ Validation warnings (proceeding — human-authored content):');
  for (const err of validation.errors) console.warn(`    - ${err}`);
}

// ============================================================
// Build output
// ============================================================

// Build clean frontmatter (without extra fields)
const cleanFm: Record<string, unknown> = { ...frontmatter };
// Remove empty arrays to keep frontmatter clean
if (frontmatter.related_blog.length === 0) delete cleanFm.related_blog;
if (frontmatter.related_topics.length === 0) delete cleanFm.related_topics;

const outputMarkdown = matter.stringify('\n' + body, cleanFm);

if (DRY_RUN) {
  console.log('\n📋 DRY RUN — would write:');
  console.log(`  File: content/blog/${frontmatter.lang}/${frontmatter.slug}.md`);
  console.log(`  Title: ${frontmatter.title}`);
  console.log(`  Date: ${frontmatter.date}`);
  console.log(`  Words: ${wordCount}`);
  console.log(`  Keywords: ${frontmatter.keywords.join(', ')}`);
  console.log(`  Related glossary: ${frontmatter.related_glossary.join(', ') || '(none)'}`);
  console.log(`  Related compare: ${frontmatter.related_compare.join(', ') || '(none)'}`);
  console.log(`  Related blog: ${frontmatter.related_blog.join(', ') || '(none)'}`);
  console.log(`  Related topics: ${frontmatter.related_topics.join(', ') || '(none)'}`);
  console.log('\n  First 500 chars of output:\n');
  console.log(outputMarkdown.slice(0, 500));
  console.log('\n  ...\n');
  process.exit(0);
}

// ============================================================
// Stage 7: Write file
// ============================================================

console.log('\n📝 Stage 7: Write file');

const outDir = path.join(ROOT, 'content', 'blog', frontmatter.lang);
fs.mkdirSync(outDir, { recursive: true });
const outPath = path.join(outDir, `${frontmatter.slug}.md`);

if (fs.existsSync(outPath) && !FORCE) {
  console.error(`  ❌ File already exists: ${outPath}`);
  console.error('  Use --force to overwrite.');
  process.exit(1);
}

fs.writeFileSync(outPath, outputMarkdown, 'utf-8');
console.log(`  Written: ${outPath}`);

const writtenFiles = [outPath];

// ============================================================
// Stage 8: DB upsert
// ============================================================

console.log('\n💾 Stage 8: DB upsert');

try {
  upsertContent({
    type: 'blog',
    slug: frontmatter.slug,
    lang: frontmatter.lang,
    title: frontmatter.title,
    body_markdown: outputMarkdown,
    meta_json: JSON.stringify({
      category: frontmatter.category,
      keywords: frontmatter.keywords,
      source_type: 'offline',
      ...extras,
    }),
    generated_by: 'human',
  });
  console.log('  ✓ Content upserted to DB');

  // Upsert keywords
  for (const keyword of frontmatter.keywords) {
    const kwSlug = keyword
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .slice(0, 60);
    if (kwSlug) {
      upsertKeyword(kwSlug, `offline-blog:${frontmatter.slug}`, kwSlug);
    }
  }
  console.log(`  ✓ ${frontmatter.keywords.length} keywords upserted`);
} catch (err) {
  console.warn(`  ⚠ DB upsert failed (may be running locally without DB): ${(err as Error).message}`);
}

// ============================================================
// Stage 9: SEO extraction
// ============================================================

if (!NO_SEO) {
  console.log('\n🔍 Stage 9: SEO entity extraction');
  try {
    const { extractSEOEntities, saveSEOEntities } = await import('./lib/seo-extract');
    const entities = await extractSEOEntities(frontmatter.title, body);
    saveSEOEntities(entities, frontmatter.slug, frontmatter.title);
    console.log('  ✓ SEO entities extracted and saved');
  } catch (err) {
    console.warn(`  ⚠ SEO extraction failed: ${(err as Error).message}`);
  }
} else {
  console.log('\n⏭️  Stage 9: SEO extraction (skipped — --no-seo)');
}

// ============================================================
// Stage 11: Git
// ============================================================

if (!NO_GIT) {
  console.log('\n📦 Stage 11: Git add/commit/push');
  try {
    await gitAddCommitPush(writtenFiles, `Add offline blog: ${frontmatter.slug}`);
    console.log('  ✓ Committed and pushed');
  } catch (err) {
    console.warn(`  ⚠ Git failed: ${(err as Error).message}`);
  }
} else {
  console.log('\n⏭️  Stage 11: Git (skipped — --no-git)');
}

// ============================================================
// Done
// ============================================================

try { closeDb(); } catch { /* ok if db not open */ }

console.log(`\n✅ Import complete: ${frontmatter.slug}`);
console.log(`  File: content/blog/${frontmatter.lang}/${frontmatter.slug}.md`);
console.log(`  Words: ${wordCount}`);
console.log(`  Source: offline import`);

} // end main

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
