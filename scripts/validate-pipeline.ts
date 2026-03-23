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
import { todaySGT } from './lib/date.js';
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

const DATE = getArg('date') || todaySGT();
const STEP = getArg('step') || 'all';
const VALID_STEPS = ['all', 'collect', 'newsletter', 'blog', 'seo', 'generate', 'discovery', 'performance'];

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
    const mdate = new Date(stat.mtime.getTime() + 8 * 3600_000).toISOString().slice(0, 10);
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

  // detected_at is stored in UTC; DATE is SGT (UTC+8).
  // Convert to SGT before comparing so 20:00 UTC items match the next SGT day.
  const row = db.prepare(`
    SELECT COUNT(*) as cnt, COUNT(DISTINCT source_tier) as tiers
    FROM news_items WHERE date(detected_at, '+8 hours') = ?
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

  // --- SEO Health Checks (warnings only) ---
  const db = getDb();

  // Check 1: orphaned keywords (cluster_slug = NULL)
  const orphanRow = db.prepare(`
    SELECT COUNT(*) as cnt FROM keywords
    WHERE cluster_slug IS NULL
      AND (source LIKE 'blog-faq:%' OR source LIKE 'blog-compare:%')
  `).get() as { cnt: number };
  if (orphanRow.cnt > 0) {
    warnings.push(`⚠️ SEO HEALTH: ${orphanRow.cnt} FAQ/Compare keywords have cluster_slug = NULL — they are invisible to generate-seo.ts`);
  }

  // Check 2: starvation detection — many pending keywords but 0 pages generated in 7 days
  for (const ktype of ['faq', 'compare'] as const) {
    const sourcePattern = ktype === 'faq' ? 'blog-faq:%' : 'blog-compare:%';
    const pendingRow = db.prepare(`
      SELECT COUNT(*) as cnt FROM keywords
      WHERE source LIKE ? AND content_exists = 0
    `).get(sourcePattern) as { cnt: number };

    if (pendingRow.cnt > 20) {
      const recentRow = db.prepare(`
        SELECT COUNT(*) as cnt FROM content
        WHERE type = ? AND lang = 'en'
          AND created_at > datetime('now', '-7 days')
      `).get(ktype) as { cnt: number };

      if (recentRow.cnt === 0) {
        warnings.push(`⚠️ SEO HEALTH: ${pendingRow.cnt} ${ktype} keywords pending but 0 ${ktype} pages generated in 7 days — check generate-seo.ts priority logic`);
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
// Generate assertions (process-queue output)
// ---------------------------------------------------------------------------

function contentTypeToDirType(ct: string): string {
  if (ct === 'topic-hub') return 'topics';
  if (ct === 'deep-dive' || ct === 'cornerstone') return 'blog';
  return ct;
}

function contentTypeToValidator(ct: string): ((md: string) => { valid: boolean; errors: string[] }) | null {
  switch (ct) {
    case 'faq': return validateFaq;
    case 'compare': return validateCompare;
    case 'glossary': return validateGlossary;
    case 'topic-hub': return validateTopicHub;
    case 'deep-dive':
    case 'cornerstone':
    case 'blog':
      return validateBlogPost;
    default: return null;
  }
}

function checkGenerate(): CheckResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const db = getDb();

  // Query create_queue for jobs completed today (SGT = UTC+8)
  const completedJobs = db.prepare(`
    SELECT cq.job_id, cq.keyword_group_id, cq.content_type, cq.status,
           kg.primary_keyword
    FROM create_queue cq
    JOIN keyword_groups kg ON kg.group_id = cq.keyword_group_id
    WHERE date(cq.completed_at, '+8 hours') = ?
  `).all(DATE) as {
    job_id: number;
    keyword_group_id: number;
    content_type: string;
    status: string;
    primary_keyword: string;
  }[];

  if (completedJobs.length === 0) {
    warnings.push('0 jobs processed today (empty queue — not an error)');
    return {
      name: 'Generate',
      pass: true,
      summary: '0 jobs (empty queue)',
      errors,
      warnings,
    };
  }

  let partialCount = 0;

  for (const job of completedJobs) {
    const slug = job.primary_keyword.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    const dirType = contentTypeToDirType(job.content_type);
    const enPath = `content/${dirType}/en/${slug}.md`;
    const prefix = `[${job.content_type}/${slug}]`;

    if (!fileExists(enPath)) {
      errors.push(`${prefix} EN content file missing: ${enPath}`);
    } else {
      // Run type-specific validator
      const validator = contentTypeToValidator(job.content_type);
      if (validator) {
        const content = readFile(enPath);
        const validation = validator(content);
        if (!validation.valid) {
          errors.push(...validation.errors.map((e) => `${prefix} validate: ${e}`));
        }
      }
    }

    if (job.status === 'partial') {
      partialCount++;
    }
  }

  // Verify keywords.content_exists = 1 for completed groups
  const completedGroupIds = completedJobs
    .filter((j) => j.status === 'done')
    .map((j) => j.keyword_group_id);

  if (completedGroupIds.length > 0) {
    const placeholders = completedGroupIds.map(() => '?').join(',');
    const missingFlag = db.prepare(`
      SELECT k.keyword, k.keyword_group_id
      FROM keywords k
      WHERE k.keyword_group_id IN (${placeholders})
        AND k.content_exists != 1
    `).all(...completedGroupIds) as { keyword: string; keyword_group_id: number }[];

    if (missingFlag.length > 0) {
      errors.push(`${missingFlag.length} keyword(s) still have content_exists != 1 after completion`);
    }
  }

  if (partialCount > 0) {
    warnings.push(`${partialCount} job(s) have status = 'partial' (ZH failures)`);
  }

  // Partial job staleness: partial jobs >48h old need attention
  const stalePartials = db.prepare(`
    SELECT COUNT(*) as cnt FROM create_queue
    WHERE status = 'partial' AND created_at < datetime('now', '-48 hours')
  `).get() as { cnt: number };

  if (stalePartials.cnt > 0) {
    warnings.push(`${stalePartials.cnt} partial job(s) older than 48h (ZH generation failed and not retried)`);
  }

  // Content-keyword sync: keywords marked content_exists=1 should have matching content
  const orphanedContent = db.prepare(`
    SELECT k.keyword, k.content_slug, k.content_type
    FROM keywords k
    WHERE k.content_exists = 1 AND k.content_slug IS NOT NULL
      AND NOT EXISTS (
        SELECT 1 FROM content c
        WHERE c.slug = k.content_slug AND c.type = k.content_type AND c.lang = 'en'
      )
  `).all() as { keyword: string; content_slug: string }[];

  if (orphanedContent.length > 0) {
    errors.push(`${orphanedContent.length} keyword(s) have content_exists=1 but no matching content record`);
  }

  return {
    name: 'Generate',
    pass: errors.length === 0,
    summary: `${completedJobs.length} job(s), ${partialCount} partial`,
    errors,
    warnings,
  };
}

// ---------------------------------------------------------------------------
// Discovery assertions (discovery-cycle output)
// ---------------------------------------------------------------------------

function checkDiscovery(): CheckResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const db = getDb();

  // Check keywords table for new rows (discovered_at within 24h)
  const newKeywords = db.prepare(`
    SELECT COUNT(*) as cnt FROM keywords
    WHERE discovered_at > datetime('now', '-24 hours')
  `).get() as { cnt: number };

  if (newKeywords.cnt === 0) {
    errors.push('No new keywords discovered in the last 24 hours');
  }

  // Check keyword_groups table for new rows (created_at within 24h)
  const newGroups = db.prepare(`
    SELECT COUNT(*) as cnt FROM keyword_groups
    WHERE created_at > datetime('now', '-24 hours')
  `).get() as { cnt: number };

  if (newGroups.cnt === 0) {
    errors.push('No new keyword groups created in the last 24 hours');
  }

  // Check create_queue for new pending entries (created_at within 24h)
  const newPending = db.prepare(`
    SELECT COUNT(*) as cnt FROM create_queue
    WHERE created_at > datetime('now', '-24 hours') AND status = 'pending'
  `).get() as { cnt: number };

  if (newPending.cnt === 0) {
    errors.push('No new pending entries in create_queue in the last 24 hours');
  }

  // Warn if any keyword_groups have priority_score = 0 (unscored)
  const unscoredGroups = db.prepare(`
    SELECT COUNT(*) as cnt FROM keyword_groups
    WHERE priority_score = 0
  `).get() as { cnt: number };

  if (unscoredGroups.cnt > 0) {
    warnings.push(`${unscoredGroups.cnt} keyword group(s) have priority_score = 0 (unscored)`);
  }

  // Warn if keywords have cluster_slug = NULL (orphaned)
  const orphanedKeywords = db.prepare(`
    SELECT COUNT(*) as cnt FROM keywords
    WHERE cluster_slug IS NULL
  `).get() as { cnt: number };

  if (orphanedKeywords.cnt > 0) {
    warnings.push(`${orphanedKeywords.cnt} keyword(s) have cluster_slug = NULL (orphaned)`);
  }

  // Queue starvation: no pending jobs and no recent generation (tightened for Mon+Thu schedule)
  const queueStarvation = db.prepare(`
    SELECT COUNT(*) as cnt FROM create_queue
    WHERE status = 'pending'
  `).get() as { cnt: number };

  const lastGeneration = db.prepare(`
    SELECT MAX(completed_at) as last FROM create_queue
    WHERE status = 'completed'
  `).get() as { last: string | null };

  if (queueStarvation.cnt === 0 && lastGeneration.last) {
    const lastGenDate = new Date(lastGeneration.last);
    const daysSinceLast = (Date.now() - lastGenDate.getTime()) / (1000 * 60 * 60 * 24);
    if (daysSinceLast > 3) {
      warnings.push(`Queue empty and last content generation was ${Math.round(daysSinceLast)} days ago`);
    }
  }

  // Discovery frequency: with Mon+Thu schedule, gap should never exceed 5 days
  const lastDiscovery = db.prepare(`
    SELECT MAX(discovered_at) as last FROM keywords
  `).get() as { last: string | null };

  if (lastDiscovery.last) {
    const lastDate = new Date(lastDiscovery.last);
    const daysSinceLast = (Date.now() - lastDate.getTime()) / (1000 * 60 * 60 * 24);
    if (daysSinceLast > 5) {
      warnings.push(`Last keyword discovery was ${Math.round(daysSinceLast)} days ago (expected ≤4 days with Mon+Thu schedule)`);
    }
  }

  return {
    name: 'Discovery',
    pass: errors.length === 0,
    summary: `${newKeywords.cnt} keywords, ${newGroups.cnt} groups, ${newPending.cnt} pending`,
    errors,
    warnings,
  };
}

// ---------------------------------------------------------------------------
// Performance assertions (performance-cycle output)
// ---------------------------------------------------------------------------

function checkPerformance(): CheckResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const db = getDb();

  // Check create_queue for new content_type = 'refresh' rows (created_at within 7 days)
  const refreshRows = db.prepare(`
    SELECT COUNT(*) as cnt FROM create_queue
    WHERE content_type = 'refresh' AND created_at > datetime('now', '-7 days')
  `).get() as { cnt: number };

  // Check keywords for new source = 'gsc' entries (discovered_at within 7 days)
  const gscKeywords = db.prepare(`
    SELECT COUNT(*) as cnt FROM keywords
    WHERE source = 'gsc' AND discovered_at > datetime('now', '-7 days')
  `).get() as { cnt: number };

  // Report 0 refresh actions as info warning (not error — may be no anomalies)
  if (refreshRows.cnt === 0) {
    warnings.push('0 refresh actions in last 7 days (may be no anomalies detected)');
  }

  return {
    name: 'Performance',
    pass: errors.length === 0,
    summary: `${refreshRows.cnt} refresh actions, ${gscKeywords.cnt} GSC keywords`,
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
  if (STEP === 'all' || STEP === 'generate') {
    allResults.push(checkGenerate());
  }
  if (STEP === 'all' || STEP === 'discovery') {
    allResults.push(checkDiscovery());
  }
  if (STEP === 'all' || STEP === 'performance') {
    allResults.push(checkPerformance());
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
