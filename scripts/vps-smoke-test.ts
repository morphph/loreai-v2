#!/usr/bin/env npx tsx
/**
 * VPS Smoke Test — run before switching cron to new keyword engine pipeline.
 * Verifies environment, API keys, DB schema, and file structure.
 *
 * Usage: npx tsx scripts/vps-smoke-test.ts
 * Exit: 0 = all pass, 1 = failures detected
 */

import fs from 'fs';
import path from 'path';
import Database from 'better-sqlite3';

interface CheckResult {
  name: string;
  pass: boolean;
  detail: string;
}

const results: CheckResult[] = [];

function check(name: string, fn: () => { pass: boolean; detail: string }) {
  try {
    const { pass, detail } = fn();
    results.push({ name, pass, detail });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    results.push({ name, pass: false, detail: `Exception: ${msg}` });
  }
}

// ── 1. Node.js >= 18 ──────────────────────────────────────────────────
check('Node.js >= 18', () => {
  const major = parseInt(process.versions.node.split('.')[0], 10);
  return {
    pass: major >= 18,
    detail: `Node.js v${process.versions.node} (major=${major})`,
  };
});

// ── 2. Required env vars present ──────────────────────────────────────
check('Required env vars', () => {
  const required = ['SERPER_API_KEY', 'EXA_API_KEY', 'ANTHROPIC_API_KEY', 'GSC_SITE_URL'];
  const missing = required.filter((k) => !process.env[k]);
  return {
    pass: missing.length === 0,
    detail: missing.length === 0
      ? `All ${required.length} env vars present`
      : `Missing: ${missing.join(', ')}`,
  };
});

// ── 3. DB writable — all 8 tables exist ───────────────────────────────
const dbPath = path.join(process.cwd(), 'loreai.db');
const expectedTables = [
  'news_items',
  'content',
  'content_sources',
  'keywords',
  'topic_clusters',
  'subscribers',
  'keyword_groups',
  'create_queue',
];

check('DB writable (8 tables)', () => {
  const db = new Database(dbPath);
  try {
    const rows = db
      .prepare("SELECT name FROM sqlite_master WHERE type='table'")
      .all() as { name: string }[];
    const tableNames = new Set(rows.map((r) => r.name));
    const missing = expectedTables.filter((t) => !tableNames.has(t));
    return {
      pass: missing.length === 0,
      detail: missing.length === 0
        ? `All ${expectedTables.length} tables found`
        : `Missing tables: ${missing.join(', ')}`,
    };
  } finally {
    db.close();
  }
});

// ── 4. DB schema current — keywords migration columns ─────────────────
check('DB schema current (keywords cols)', () => {
  const db = new Database(dbPath);
  try {
    const cols = db.prepare("PRAGMA table_info('keywords')").all() as { name: string }[];
    const colNames = new Set(cols.map((c) => c.name));
    const required = ['search_volume', 'competition', 'intent', 'keyword_group_id'];
    const missing = required.filter((c) => !colNames.has(c));
    return {
      pass: missing.length === 0,
      detail: missing.length === 0
        ? `All migration columns present: ${required.join(', ')}`
        : `Missing columns: ${missing.join(', ')}`,
    };
  } finally {
    db.close();
  }
});

// ── 5. keyword_groups & create_queue readable ─────────────────────────
check('keyword_groups & create_queue readable', () => {
  const db = new Database(dbPath);
  try {
    const kgCount = (db.prepare('SELECT COUNT(*) AS cnt FROM keyword_groups').get() as { cnt: number }).cnt;
    const cqCount = (db.prepare('SELECT COUNT(*) AS cnt FROM create_queue').get() as { cnt: number }).cnt;
    return {
      pass: true,
      detail: `keyword_groups: ${kgCount} rows, create_queue: ${cqCount} rows`,
    };
  } finally {
    db.close();
  }
});

// ── 6. Skill file exists ──────────────────────────────────────────────
check('Skill file exists', () => {
  const skillPath = path.join(process.cwd(), 'skills/seo/SKILL.md');
  const exists = fs.existsSync(skillPath);
  return {
    pass: exists,
    detail: exists ? skillPath : `Not found: ${skillPath}`,
  };
});

// ── 7. Content directories exist ──────────────────────────────────────
const contentDirs = [
  'content/blog/en',
  'content/blog/zh',
  'content/compare/en',
  'content/compare/zh',
  'content/faq/en',
  'content/faq/zh',
  'content/glossary/en',
  'content/glossary/zh',
  'content/topics/en',
  'content/topics/zh',
];

check('Content directories exist', () => {
  const missing = contentDirs.filter(
    (d) => !fs.existsSync(path.join(process.cwd(), d)),
  );
  return {
    pass: missing.length === 0,
    detail: missing.length === 0
      ? `All ${contentDirs.length} content dirs present`
      : `Missing: ${missing.join(', ')}`,
  };
});

// ── 8. New scripts exist ──────────────────────────────────────────────
check('New scripts exist', () => {
  const scripts = [
    'scripts/process-queue.ts',
    'scripts/discovery-cycle.ts',
    'scripts/performance-cycle.ts',
  ];
  const missing = scripts.filter(
    (s) => !fs.existsSync(path.join(process.cwd(), s)),
  );
  return {
    pass: missing.length === 0,
    detail: missing.length === 0
      ? `All ${scripts.length} new scripts found`
      : `Missing: ${missing.join(', ')}`,
  };
});

// ── 9. daily-pipeline.sh has new cases ────────────────────────────────
check('daily-pipeline.sh has new cases', () => {
  const pipelinePath = path.join(process.cwd(), 'scripts/daily-pipeline.sh');
  if (!fs.existsSync(pipelinePath)) {
    return { pass: false, detail: 'daily-pipeline.sh not found' };
  }
  const content = fs.readFileSync(pipelinePath, 'utf-8');
  const requiredCases = ['generate)', 'discovery)', 'performance)'];
  const missing = requiredCases.filter((c) => !content.includes(c));
  return {
    pass: missing.length === 0,
    detail: missing.length === 0
      ? `All cases found: ${requiredCases.join(', ')}`
      : `Missing cases: ${missing.join(', ')}`,
  };
});

// ── 10. tmp/ directory writable ───────────────────────────────────────
check('tmp/ directory writable', () => {
  const tmpDir = path.join(process.cwd(), 'tmp');
  if (!fs.existsSync(tmpDir)) {
    fs.mkdirSync(tmpDir, { recursive: true });
  }
  const testFile = path.join(tmpDir, '.smoke-test-probe');
  fs.writeFileSync(testFile, 'ok');
  const readBack = fs.readFileSync(testFile, 'utf-8');
  fs.unlinkSync(testFile);
  return {
    pass: readBack === 'ok',
    detail: `tmp/ writable at ${tmpDir}`,
  };
});

// ── Output ────────────────────────────────────────────────────────────

const passed = results.filter((r) => r.pass).length;
const failed = results.filter((r) => !r.pass).length;
const allPassed = failed === 0;

// Human-readable table
console.log('\n╔══════════════════════════════════════════════════════════════╗');
console.log('║              VPS Smoke Test — LoreAI v2                    ║');
console.log('╠══════════════════════════════════════════════════════════════╣');

for (const r of results) {
  const icon = r.pass ? '✅' : '❌';
  const status = r.pass ? 'PASS' : 'FAIL';
  console.log(`║ ${icon} ${status}  ${r.name.padEnd(40)} ║`);
  console.log(`║        ${r.detail.padEnd(50)} ║`);
}

console.log('╠══════════════════════════════════════════════════════════════╣');
console.log(`║  Result: ${passed} passed, ${failed} failed${allPassed ? ' — ALL CLEAR' : ' — ACTION NEEDED'}`.padEnd(63) + '║');
console.log('╚══════════════════════════════════════════════════════════════╝\n');

// Machine-parseable JSON on a single line
console.log(JSON.stringify({ passed, failed, allPassed, results }));

process.exit(allPassed ? 0 : 1);
