#!/usr/bin/env npx tsx
/**
 * Pipeline validation script — checks outputs of each pipeline stage.
 *
 * Usage:
 *   npx tsx scripts/validate-pipeline.ts --date=2026-03-04 --step=all
 *   npx tsx scripts/validate-pipeline.ts --date=2026-03-04 --step=newsletter
 *
 * Exit code: 0 = all passed, 1 = failures detected
 */

import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { getDb, closeDb } from './lib/db.js';
import {
  validateNewsletter,
  validateZhNewsletter,
  validateBlogPost,
  validateGlossary,
  validateFaq,
  validateCompare,
  validateTopicHub,
} from './lib/validate.js';

// ---------------------------------------------------------------------------
// CLI args
// ---------------------------------------------------------------------------

const args = process.argv.slice(2);
function getArg(name: string): string | undefined {
  const flag = args.find((a) => a.startsWith(`--${name}=`));
  return flag ? flag.split('=')[1] : undefined;
}

const DATE = getArg('date') || new Date().toISOString().slice(0, 10);
const STEP = getArg('step') || 'all';
const VALID_STEPS = ['all', 'collect', 'newsletter', 'blog', 'seo'];

if (!VALID_STEPS.includes(STEP)) {
  console.error(`Invalid step: ${STEP}. Must be one of: ${VALID_STEPS.join(', ')}`);
  process.exit(1);
}

const ROOT = process.cwd();

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface CheckResult {
  name: string;
  pass: boolean;
  summary: string;
  errors: string[];   // fatal — blocks pipeline
  warnings: string[]; // non-fatal — logged but exit 0
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function countWords(md: string): number {
  const stripped = md
    .replace(/^---[\s\S]*?---/m, '')
    .replace(/^#+.+$/gm, '');

  // Count CJK characters (each ≈ 1 word)
  const cjkChars = (stripped.match(/[\u4e00-\u9fff\u3400-\u4dbf]/g) || []).length;
  // Count non-CJK words (English, numbers, etc.)
  const nonCjk = stripped.replace(/[\u4e00-\u9fff\u3400-\u4dbf]/g, ' ');
  const enWords = nonCjk.split(/\s+/).filter((w) => w.length > 0).length;

  return cjkChars + enWords;
}

function extractExternalLinks(md: string): string[] {
  const matches = md.match(/\[.*?\]\((https?:\/\/[^)]+)\)/g) || [];
  return matches.map((m) => {
    const urlMatch = m.match(/\((https?:\/\/[^)]+)\)/);
    return urlMatch ? urlMatch[1] : '';
  }).filter(Boolean);
}

function fileExists(rel: string): boolean {
  return fs.existsSync(path.join(ROOT, rel));
}

function readFile(rel: string): string {
  return fs.readFileSync(path.join(ROOT, rel), 'utf-8');
}

function normalizeDate(d: unknown): string {
  if (d instanceof Date) return d.toISOString().slice(0, 10);
  return String(d).slice(0, 10);
}

function findFilesByFrontmatterDate(dir: string, date: string): { slug: string; content: string }[] {
  const absDir = path.join(ROOT, dir);
  if (!fs.existsSync(absDir)) return [];
  const files = fs.readdirSync(absDir).filter((f) => f.endsWith('.md'));
  const results: { slug: string; content: string }[] = [];
  for (const file of files) {
    const content = fs.readFileSync(path.join(absDir, file), 'utf-8');
    try {
      const { data } = matter(content);
      if (data.date && normalizeDate(data.date) === date) {
        results.push({ slug: file.replace(/\.md$/, ''), content });
      }
    } catch { /* skip unparseable */ }
  }
  return results;
}

function findFilesModifiedToday(dir: string, date: string): { slug: string; content: string }[] {
  const absDir = path.join(ROOT, dir);
  if (!fs.existsSync(absDir)) return [];
  const files = fs.readdirSync(absDir).filter((f) => f.endsWith('.md'));
  const results: { slug: string; content: string }[] = [];
  for (const file of files) {
    const stat = fs.statSync(path.join(absDir, file));
    const mdate = stat.mtime.toISOString().slice(0, 10);
    if (mdate === date) {
      const content = fs.readFileSync(path.join(absDir, file), 'utf-8');
      results.push({ slug: file.replace(/\.md$/, ''), content });
    }
  }
  return results;
}

// ---------------------------------------------------------------------------
// Collect assertions
// ---------------------------------------------------------------------------

function checkCollect(): CheckResult {
  const errors: string[] = [];
  const db = getDb();

  const row = db.prepare(`
    SELECT COUNT(*) as cnt, COUNT(DISTINCT source_tier) as tiers
    FROM news_items WHERE date(detected_at) = ?
  `).get(DATE) as { cnt: number; tiers: number };

  const count = row.cnt;
  const tiers = row.tiers;

  if (count < 20) errors.push(`Only ${count} items (need >= 20)`);
  if (tiers < 3) errors.push(`Only ${tiers} tiers (need >= 3)`);

  return {
    name: 'Collect',
    pass: errors.length === 0,
    summary: `${count} items, ${tiers} tiers`,
    errors,
    warnings: [],
  };
}

// ---------------------------------------------------------------------------
// Newsletter assertions
// ---------------------------------------------------------------------------

function checkNewsletter(): CheckResult[] {
  const results: CheckResult[] = [];

  for (const lang of ['en', 'zh'] as const) {
    const errors: string[] = [];
    const warnings: string[] = [];
    const filePath = `content/newsletters/${lang}/${DATE}.md`;

    if (!fileExists(filePath)) {
      results.push({
        name: `Newsletter ${lang.toUpperCase()}`,
        pass: false,
        summary: 'file missing',
        errors: [`${filePath} does not exist`],
        warnings: [],
      });
      continue;
    }

    const content = readFile(filePath);

    // Validate with existing validators
    const validation = lang === 'en' ? validateNewsletter(content) : validateZhNewsletter(content);
    if (!validation.valid) {
      errors.push(...validation.errors.map((e) => `validate: ${e}`));
    }

    // Frontmatter check
    try {
      const { data } = matter(content);
      for (const field of ['title', 'date', 'description']) {
        if (!data[field]) errors.push(`frontmatter missing: ${field}`);
      }
    } catch (e) {
      errors.push('frontmatter parse error');
    }

    // External links
    const links = extractExternalLinks(content);
    const uniqueLinks = [...new Set(links)];
    if (uniqueLinks.length < 10) {
      errors.push(`Only ${uniqueLinks.length} unique external links (need >= 10)`);
    }
    if (links.length !== uniqueLinks.length) {
      warnings.push(`${links.length - uniqueLinks.length} duplicate link(s)`);
    }

    const words = countWords(content);

    results.push({
      name: `Newsletter ${lang.toUpperCase()}`,
      pass: errors.length === 0,
      summary: `${words} words, ${uniqueLinks.length} links`,
      errors,
      warnings,
    });
  }

  // Check filtered-items and blog-seeds
  const filteredPath = `data/filtered-items/${DATE}.json`;
  if (fileExists(filteredPath)) {
    try {
      const items = JSON.parse(readFile(filteredPath));
      if (Array.isArray(items) && items.length < 15) {
        results[0].warnings.push(`filtered-items: only ${items.length} items (need >= 15)`);
      }
    } catch {
      results[0].errors.push('filtered-items: invalid JSON');
      results[0].pass = false;
    }
  } else {
    results[0].errors.push(`${filteredPath} does not exist`);
    results[0].pass = false;
  }

  const seedsPath = `data/blog-seeds/${DATE}.json`;
  if (fileExists(seedsPath)) {
    try {
      const seeds = JSON.parse(readFile(seedsPath));
      if (Array.isArray(seeds) && seeds.length < 1) {
        results[0].warnings.push('blog-seeds: empty array');
      }
    } catch {
      results[0].errors.push('blog-seeds: invalid JSON');
      results[0].pass = false;
    }
  } else {
    results[0].warnings.push(`${seedsPath} does not exist`);
  }

  return results;
}

// ---------------------------------------------------------------------------
// Blog assertions
// ---------------------------------------------------------------------------

function checkBlog(): CheckResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  const enPosts = findFilesByFrontmatterDate('content/blog/en', DATE);

  if (enPosts.length === 0) {
    // Check if seeds exist to provide context
    const seedsPath = `data/blog-seeds/${DATE}.json`;
    let seedCount = 0;
    if (fileExists(seedsPath)) {
      try {
        const seeds = JSON.parse(readFile(seedsPath));
        seedCount = Array.isArray(seeds) ? seeds.length : 0;
      } catch { /* ignore */ }
    }
    const ctx = seedCount > 0 ? ` (${seedCount} seeds existed)` : '';
    errors.push(`no EN posts found for ${DATE}${ctx}`);
    return {
      name: 'Blog',
      pass: false,
      summary: `0 posts${ctx}`,
      errors,
      warnings,
    };
  }

  for (const post of enPosts) {
    const prefix = `[${post.slug}]`;

    // ZH counterpart — warning, not fatal
    const zhPath = `content/blog/zh/${post.slug}.md`;
    if (!fileExists(zhPath)) {
      warnings.push(`${prefix} missing ZH version`);
    }

    // Word count — warning
    const words = countWords(post.content);
    if (words < 800) warnings.push(`${prefix} too short: ${words} words (min 800)`);
    if (words > 1500) warnings.push(`${prefix} too long: ${words} words (max 1500)`);

    // Internal links — warning
    const glossaryLinks = (post.content.match(/\[.*?\]\(\/glossary\/[^)]+\)/g) || []).length;
    if (glossaryLinks < 2) warnings.push(`${prefix} only ${glossaryLinks} /glossary/ links (need >= 2)`);

    const internalLinks = (post.content.match(/\[.*?\]\(\/(blog|newsletter)\/[^)]+\)/g) || []).length;
    if (internalLinks < 1) warnings.push(`${prefix} no /blog/ or /newsletter/ internal links`);

    // Frontmatter — error (structural)
    try {
      const { data } = matter(post.content);
      for (const field of ['title', 'date', 'slug', 'description', 'category', 'keywords']) {
        if (!data[field]) errors.push(`${prefix} frontmatter missing: ${field}`);
      }
    } catch {
      errors.push(`${prefix} frontmatter parse error`);
    }

    // Existing validator
    const validation = validateBlogPost(post.content);
    if (!validation.valid) {
      errors.push(...validation.errors.map((e) => `${prefix} validate: ${e}`));
    }
  }

  return {
    name: 'Blog',
    pass: errors.length === 0,
    summary: `${enPosts.length} post(s)`,
    errors,
    warnings,
  };
}

// ---------------------------------------------------------------------------
// SEO assertions
// ---------------------------------------------------------------------------

interface SeoType {
  dir: string;
  label: string;
  validator: (md: string) => { valid: boolean; errors: string[] };
}

const SEO_TYPES: SeoType[] = [
  { dir: 'content/glossary', label: 'glossary', validator: validateGlossary },
  { dir: 'content/faq', label: 'faq', validator: validateFaq },
  { dir: 'content/compare', label: 'compare', validator: validateCompare },
  { dir: 'content/topics', label: 'topics', validator: validateTopicHub },
];

function checkSeo(): CheckResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const counts: Record<string, number> = {};

  for (const seoType of SEO_TYPES) {
    const enDir = `${seoType.dir}/en`;
    const enFiles = findFilesModifiedToday(enDir, DATE);
    counts[seoType.label] = enFiles.length;

    for (const file of enFiles) {
      const prefix = `[${seoType.label}/${file.slug}]`;

      // ZH counterpart — warning
      const zhPath = `${seoType.dir}/zh/${file.slug}.md`;
      if (!fileExists(zhPath)) {
        warnings.push(`${prefix} missing ZH version`);
      }

      // Validator — error (structural)
      const validation = seoType.validator(file.content);
      if (!validation.valid) {
        errors.push(...validation.errors.map((e) => `${prefix} validate: ${e}`));
      }
    }
  }

  const summaryParts = Object.entries(counts)
    .filter(([, n]) => n > 0)
    .map(([label, n]) => `${n} ${label}`);
  const summary = summaryParts.length > 0 ? summaryParts.join(', ') : '0 pages (ok)';

  return {
    name: 'SEO',
    pass: errors.length === 0,
    summary,
    errors,
    warnings,
  };
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

function run(): void {
  const allResults: CheckResult[] = [];

  if (STEP === 'all' || STEP === 'collect') {
    allResults.push(checkCollect());
  }
  if (STEP === 'all' || STEP === 'newsletter') {
    allResults.push(...checkNewsletter());
  }
  if (STEP === 'all' || STEP === 'blog') {
    allResults.push(checkBlog());
  }
  if (STEP === 'all' || STEP === 'seo') {
    allResults.push(checkSeo());
  }

  // Close DB after all checks
  closeDb();

  // Print report
  console.log(`\nPipeline Validation Report -- ${DATE}`);
  console.log('='.repeat(48));

  for (const r of allResults) {
    const hasWarnings = r.warnings.length > 0;
    const tag = !r.pass ? '[FAIL]' : hasWarnings ? '[WARN]' : '[PASS]';
    const name = r.name.padEnd(16);
    console.log(`${tag} ${name} ${r.summary}`);
  }

  const failures = allResults.filter((r) => !r.pass);
  const warned = allResults.filter((r) => r.pass && r.warnings.length > 0);

  if (warned.length > 0) {
    console.log('\nWarnings (non-fatal):');
    for (const w of warned) {
      for (const msg of w.warnings) {
        console.log(`  - ${w.name}: ${msg}`);
      }
    }
  }

  if (failures.length > 0) {
    console.log('\nErrors (fatal):');
    for (const f of failures) {
      for (const e of f.errors) {
        console.log(`  - ${f.name}: ${e}`);
      }
      for (const w of f.warnings) {
        console.log(`  - ${f.name}: [warn] ${w}`);
      }
    }
    process.exit(1);
  } else {
    console.log('\nAll checks passed.');
  }
}

run();
