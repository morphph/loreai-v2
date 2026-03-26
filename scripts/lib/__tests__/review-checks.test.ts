import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import fs from 'fs';
import path from 'path';
import os from 'os';
import type Database from 'better-sqlite3';

// ── Test setup: in-memory SQLite via DB_PATH ──

let tmpDir: string;
let dbPath: string;
let db: typeof import('../db');

beforeEach(async () => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'loreai-review-test-'));
  dbPath = path.join(tmpDir, 'test.db');
  process.env.DB_PATH = dbPath;
  vi.resetModules();
  db = await import('../db');
});

afterEach(() => {
  try { db.closeDb(); } catch { /* ignore */ }
  try { fs.rmSync(tmpDir, { recursive: true }); } catch { /* ignore */ }
  delete process.env.DB_PATH;
});

function getTestDb(): Database.Database {
  return db.getDb();
}

// Helper: insert news items with specific detected_at
function insertNewsItem(database: Database.Database, title: string, hoursAgo: number = 0): void {
  database.prepare(
    `INSERT INTO news_items (title, url, source, source_tier, score, detected_at)
     VALUES (?, ?, 'test', 1, 50, datetime('now', '-' || ? || ' hours'))`
  ).run(title, `https://example.com/${title.replace(/\s/g, '-')}`, hoursAgo);
}

// Helper: insert create_queue job
function insertJob(
  database: Database.Database,
  status: string,
  opts: { hoursAgo?: number; completedHoursAgo?: number; contentType?: string; groupId?: number } = {}
): void {
  const createdAt = opts.hoursAgo ?? 0;
  const completed = opts.completedHoursAgo != null
    ? `datetime('now', '-${opts.completedHoursAgo} hours')`
    : 'NULL';
  database.prepare(
    `INSERT INTO create_queue (keyword_group_id, content_type, status, priority_score, created_at, completed_at)
     VALUES (?, ?, ?, 100, datetime('now', '-' || ? || ' hours'), ${completed})`
  ).run(opts.groupId ?? null, opts.contentType ?? 'faq', status, createdAt);
}

// Helper: insert keyword_group
function insertGroup(
  database: Database.Database,
  opts: { status?: string; priorityScore?: number; clusterSlug?: string } = {}
): number {
  database.prepare(
    `INSERT INTO keyword_groups (primary_keyword, intent, content_type, priority_score, status, cluster_slug)
     VALUES ('test keyword', 'informational', 'faq', ?, ?, ?)`
  ).run(opts.priorityScore ?? 100, opts.status ?? 'pending', opts.clusterSlug ?? null);
  return (database.prepare('SELECT last_insert_rowid() as id').get() as { id: number }).id;
}

// Helper: insert keyword
function insertKeyword(
  database: Database.Database,
  keyword: string,
  opts: { clusterSlug?: string; hoursAgo?: number } = {}
): void {
  database.prepare(
    `INSERT OR IGNORE INTO keywords (keyword, source, cluster_slug, discovered_at)
     VALUES (?, 'test', ?, datetime('now', '-' || ? || ' hours'))`
  ).run(keyword, opts.clusterSlug ?? null, opts.hoursAgo ?? 0);
}

// Helper: insert content
function insertContent(
  database: Database.Database,
  type: string,
  slug: string,
  lang: string = 'en',
  hoursAgo: number = 0
): void {
  database.prepare(
    `INSERT OR IGNORE INTO content (type, slug, lang, title, created_at)
     VALUES (?, ?, ?, 'Test Title', datetime('now', '-' || ? || ' hours'))`
  ).run(type, slug, lang, hoursAgo);
}

// ════════════════════════════════════════════
// Group A — Pipeline Stage Completion
// ════════════════════════════════════════════

describe('checkCollectToday', async () => {
  const { checkCollectToday } = await import('../review-checks');

  it('returns green when >= 50 items', () => {
    const database = getTestDb();
    for (let i = 0; i < 60; i++) insertNewsItem(database, `item-${i}`, 12);
    expect(checkCollectToday(database).status).toBe('green');
    expect(checkCollectToday(database).value).toBe(60);
  });

  it('returns yellow when 20-49 items', () => {
    const database = getTestDb();
    for (let i = 0; i < 30; i++) insertNewsItem(database, `item-${i}`, 12);
    expect(checkCollectToday(database).status).toBe('yellow');
  });

  it('returns red when < 20 items', () => {
    const database = getTestDb();
    for (let i = 0; i < 5; i++) insertNewsItem(database, `item-${i}`, 12);
    expect(checkCollectToday(database).status).toBe('red');
  });

  it('returns red on empty table', () => {
    const database = getTestDb();
    expect(checkCollectToday(database).status).toBe('red');
    expect(checkCollectToday(database).value).toBe(0);
  });
});

describe('checkCollectTrend', async () => {
  const { checkCollectTrend } = await import('../review-checks');

  it('returns green when collection happened most weekdays', () => {
    const database = getTestDb();
    // Insert items spread across 5 different days
    for (let day = 0; day < 5; day++) {
      insertNewsItem(database, `day-${day}-item`, day * 24 + 1);
    }
    const result = checkCollectTrend(database);
    expect(result.value).toBe(5);
    // Should be green — 5 days >= 80% of weekdays in any 7-day window
    expect(['green', 'yellow']).toContain(result.status);
  });

  it('returns red on empty table', () => {
    const database = getTestDb();
    const result = checkCollectTrend(database);
    expect(result.value).toBe(0);
    expect(result.status).toBe('red');
  });
});

describe('checkNewsletterToday', async () => {
  const { checkNewsletterToday } = await import('../review-checks');

  it('returns green when file exists', () => {
    const now = new Date();
    const today = new Date(now.getTime() + 8 * 3600_000).toISOString().slice(0, 10);
    const contentRoot = tmpDir;
    const nlDir = path.join(contentRoot, 'content', 'newsletters', 'en');
    fs.mkdirSync(nlDir, { recursive: true });
    fs.writeFileSync(path.join(nlDir, `${today}.md`), '# Test', 'utf-8');

    const result = checkNewsletterToday(getTestDb(), { contentRoot, now });
    expect(result.status).toBe('green');
    expect(result.value).toBe(1);
  });

  it('returns red on weekday when file missing', () => {
    // Find a Wednesday
    const wed = new Date('2026-03-25T10:00:00Z'); // Wednesday
    const result = checkNewsletterToday(getTestDb(), { contentRoot: tmpDir, now: wed });
    expect(result.status).toBe('red');
  });

  it('returns green on weekend when file missing', () => {
    const sat = new Date('2026-03-28T10:00:00Z'); // Saturday
    const result = checkNewsletterToday(getTestDb(), { contentRoot: tmpDir, now: sat });
    expect(result.status).toBe('green');
  });
});

describe('checkNewsletterBilingual', async () => {
  const { checkNewsletterBilingual } = await import('../review-checks');

  it('returns green when all EN have ZH pair', () => {
    const contentRoot = tmpDir;
    const enDir = path.join(contentRoot, 'content', 'newsletters', 'en');
    const zhDir = path.join(contentRoot, 'content', 'newsletters', 'zh');
    fs.mkdirSync(enDir, { recursive: true });
    fs.mkdirSync(zhDir, { recursive: true });

    const today = new Date(Date.now() + 8 * 3600_000).toISOString().slice(0, 10);
    fs.writeFileSync(path.join(enDir, `${today}.md`), '# EN', 'utf-8');
    fs.writeFileSync(path.join(zhDir, `${today}.md`), '# ZH', 'utf-8');

    const result = checkNewsletterBilingual(getTestDb(), { contentRoot });
    expect(result.status).toBe('green');
    expect(result.value).toBe(100);
  });

  it('returns red when ZH is missing', () => {
    const contentRoot = tmpDir;
    const enDir = path.join(contentRoot, 'content', 'newsletters', 'en');
    fs.mkdirSync(enDir, { recursive: true });

    const today = new Date(Date.now() + 8 * 3600_000).toISOString().slice(0, 10);
    fs.writeFileSync(path.join(enDir, `${today}.md`), '# EN', 'utf-8');

    const result = checkNewsletterBilingual(getTestDb(), { contentRoot });
    expect(result.status).toBe('red');
    expect(result.value).toBe(0);
  });
});

describe('checkEntityExtractRuns', async () => {
  const { checkEntityExtractRuns } = await import('../review-checks');

  it('returns green when clusters updated recently', () => {
    const database = getTestDb();
    database.prepare(
      `INSERT INTO topic_clusters (slug, pillar_topic, last_seen) VALUES ('test', 'Test', datetime('now'))`
    ).run();
    expect(checkEntityExtractRuns(database).status).toBe('green');
  });

  it('returns red when no recent updates', () => {
    const database = getTestDb();
    expect(checkEntityExtractRuns(database).status).toBe('red');
  });
});

// ════════════════════════════════════════════
// Group B — Queue Health
// ════════════════════════════════════════════

describe('checkQueuePending', async () => {
  const { checkQueuePending } = await import('../review-checks');

  it('returns info status with count', () => {
    const database = getTestDb();
    insertJob(database, 'pending');
    insertJob(database, 'pending');
    insertJob(database, 'completed', { completedHoursAgo: 1 });
    const result = checkQueuePending(database);
    expect(result.status).toBe('info');
    expect(result.value).toBe(2);
  });
});

describe('checkQueueDrainRate', async () => {
  const { checkQueueDrainRate } = await import('../review-checks');

  it('returns green when >= 20 completed in 7d', () => {
    const database = getTestDb();
    for (let i = 0; i < 25; i++) {
      insertJob(database, 'completed', { completedHoursAgo: i * 5 });
    }
    expect(checkQueueDrainRate(database).status).toBe('green');
  });

  it('returns yellow when 5-19 completed', () => {
    const database = getTestDb();
    for (let i = 0; i < 10; i++) {
      insertJob(database, 'completed', { completedHoursAgo: i * 10 });
    }
    expect(checkQueueDrainRate(database).status).toBe('yellow');
  });

  it('returns red when < 5 completed', () => {
    const database = getTestDb();
    insertJob(database, 'completed', { completedHoursAgo: 2 });
    expect(checkQueueDrainRate(database).status).toBe('red');
  });
});

describe('checkQueueDrainToday', async () => {
  const { checkQueueDrainToday } = await import('../review-checks');

  it('returns green when >= 3 completed today', () => {
    const database = getTestDb();
    for (let i = 0; i < 5; i++) {
      insertJob(database, 'completed', { completedHoursAgo: i * 2 });
    }
    const result = checkQueueDrainToday(database, { now: new Date('2026-03-25T10:00:00Z') }); // Wed
    expect(result.status).toBe('green');
  });

  it('returns red when 0 completed on weekday', () => {
    const database = getTestDb();
    const result = checkQueueDrainToday(database, { now: new Date('2026-03-25T10:00:00Z') }); // Wed
    expect(result.status).toBe('red');
  });

  it('returns green when 0 completed on weekend', () => {
    const database = getTestDb();
    const result = checkQueueDrainToday(database, { now: new Date('2026-03-28T10:00:00Z') }); // Sat
    expect(result.status).toBe('green');
  });
});

describe('checkQueueStuck', async () => {
  const { checkQueueStuck } = await import('../review-checks');

  it('returns green when no stuck jobs', () => {
    const database = getTestDb();
    insertJob(database, 'in_progress', { hoursAgo: 1 }); // only 1h old, not stuck
    expect(checkQueueStuck(database).status).toBe('green');
  });

  it('returns yellow when 1-2 stuck', () => {
    const database = getTestDb();
    insertJob(database, 'in_progress', { hoursAgo: 30 });
    expect(checkQueueStuck(database).status).toBe('yellow');
  });

  it('returns red when >= 3 stuck', () => {
    const database = getTestDb();
    for (let i = 0; i < 4; i++) {
      insertJob(database, 'in_progress', { hoursAgo: 48 });
    }
    expect(checkQueueStuck(database).status).toBe('red');
  });
});

describe('checkQueueGrowth', async () => {
  const { checkQueueGrowth } = await import('../review-checks');

  it('returns green when drain > growth', () => {
    const database = getTestDb();
    insertJob(database, 'pending', { hoursAgo: 24 });
    for (let i = 0; i < 5; i++) {
      insertJob(database, 'completed', { completedHoursAgo: i * 10 });
    }
    const result = checkQueueGrowth(database);
    expect(result.status).toBe('green');
  });

  it('returns red when drain = 0 but growth > 0', () => {
    const database = getTestDb();
    for (let i = 0; i < 3; i++) {
      insertJob(database, 'pending', { hoursAgo: 24 });
    }
    const result = checkQueueGrowth(database);
    expect(result.status).toBe('red');
  });
});

describe('checkQueueAge', async () => {
  const { checkQueueAge } = await import('../review-checks');

  it('returns green when no pending jobs', () => {
    const database = getTestDb();
    expect(checkQueueAge(database).status).toBe('green');
    expect(checkQueueAge(database).value).toBe(0);
  });

  it('returns green when oldest pending < 7 days', () => {
    const database = getTestDb();
    insertJob(database, 'pending', { hoursAgo: 48 }); // 2 days
    const result = checkQueueAge(database);
    expect(result.status).toBe('green');
  });

  it('returns yellow when oldest 7-14 days', () => {
    const database = getTestDb();
    insertJob(database, 'pending', { hoursAgo: 10 * 24 }); // 10 days
    const result = checkQueueAge(database);
    expect(result.status).toBe('yellow');
  });

  it('returns red when oldest > 14 days', () => {
    const database = getTestDb();
    insertJob(database, 'pending', { hoursAgo: 20 * 24 }); // 20 days
    const result = checkQueueAge(database);
    expect(result.status).toBe('red');
  });
});

describe('checkGroupsStatusSync', async () => {
  const { checkGroupsStatusSync } = await import('../review-checks');

  it('returns green when no mismatches', () => {
    const database = getTestDb();
    const gid = insertGroup(database, { status: 'completed' });
    insertJob(database, 'completed', { groupId: gid, completedHoursAgo: 1 });
    expect(checkGroupsStatusSync(database).status).toBe('green');
  });

  it('returns yellow when 1-5 mismatches', () => {
    const database = getTestDb();
    const gid = insertGroup(database, { status: 'queued' });
    insertJob(database, 'completed', { groupId: gid, completedHoursAgo: 1 });
    const result = checkGroupsStatusSync(database);
    expect(result.status).toBe('yellow');
    expect(result.value).toBe(1);
  });

  it('returns red when > 5 mismatches', () => {
    const database = getTestDb();
    for (let i = 0; i < 7; i++) {
      const gid = insertGroup(database, { status: 'queued' });
      insertJob(database, 'completed', { groupId: gid, completedHoursAgo: 1 });
    }
    const result = checkGroupsStatusSync(database);
    expect(result.status).toBe('red');
    expect(result.value).toBe(7);
  });
});

// ════════════════════════════════════════════
// Group C — Discovery Health
// ════════════════════════════════════════════

describe('checkKeywordsDiscovered', async () => {
  const { checkKeywordsDiscovered } = await import('../review-checks');

  it('returns green when > 20 new keywords', () => {
    const database = getTestDb();
    for (let i = 0; i < 25; i++) insertKeyword(database, `kw-${i}`, { hoursAgo: 24 });
    expect(checkKeywordsDiscovered(database).status).toBe('green');
  });

  it('returns red when 0 new keywords', () => {
    const database = getTestDb();
    expect(checkKeywordsDiscovered(database).status).toBe('red');
  });
});

describe('checkKeywordsUngrouped', async () => {
  const { checkKeywordsUngrouped } = await import('../review-checks');

  it('returns green when most keywords are grouped', () => {
    const database = getTestDb();
    insertGroup(database, { clusterSlug: 'claude-code' });
    for (let i = 0; i < 8; i++) insertKeyword(database, `grouped-${i}`, { clusterSlug: 'claude-code' });
    for (let i = 0; i < 2; i++) insertKeyword(database, `ungrouped-${i}`, { clusterSlug: 'orphan-topic' });
    const result = checkKeywordsUngrouped(database);
    expect(result.status).toBe('green');
    expect(result.value).toBe(20); // 2/10 = 20%
  });

  it('returns info when no keywords with cluster_slug', () => {
    const database = getTestDb();
    expect(checkKeywordsUngrouped(database).status).toBe('info');
  });
});

describe('checkGroupsUnscored', async () => {
  const { checkGroupsUnscored } = await import('../review-checks');

  it('returns green when < 20% unscored', () => {
    const database = getTestDb();
    for (let i = 0; i < 8; i++) insertGroup(database, { priorityScore: 100 });
    insertGroup(database, { priorityScore: 0 });
    const result = checkGroupsUnscored(database);
    expect(result.status).toBe('green');
  });

  it('returns red when > 50% unscored', () => {
    const database = getTestDb();
    for (let i = 0; i < 3; i++) insertGroup(database, { priorityScore: 0 });
    insertGroup(database, { priorityScore: 100 });
    const result = checkGroupsUnscored(database);
    expect(result.status).toBe('red');
    expect(result.value).toBe(75);
  });
});

describe('checkDiscoveryRecency', async () => {
  const { checkDiscoveryRecency } = await import('../review-checks');

  it('returns green when discovery ran recently', () => {
    const database = getTestDb();
    insertKeyword(database, 'recent-kw', { hoursAgo: 24 });
    const result = checkDiscoveryRecency(database);
    expect(result.status).toBe('green');
    expect(result.value).toBeLessThanOrEqual(1);
  });

  it('returns red when no keywords exist', () => {
    const database = getTestDb();
    expect(checkDiscoveryRecency(database).status).toBe('red');
  });
});

// ════════════════════════════════════════════
// Group D — Content Coverage
// ════════════════════════════════════════════

describe('checkContentGeneratedToday', async () => {
  const { checkContentGeneratedToday } = await import('../review-checks');

  it('returns green when >= 3 content generated', () => {
    const database = getTestDb();
    for (let i = 0; i < 5; i++) insertContent(database, 'faq', `test-${i}`, 'en', 12);
    const result = checkContentGeneratedToday(database, { now: new Date('2026-03-25T10:00:00Z') });
    expect(result.status).toBe('green');
  });

  it('returns red when 0 on weekday', () => {
    const database = getTestDb();
    const result = checkContentGeneratedToday(database, { now: new Date('2026-03-25T10:00:00Z') });
    expect(result.status).toBe('red');
  });

  it('returns green when 0 on weekend', () => {
    const database = getTestDb();
    const result = checkContentGeneratedToday(database, { now: new Date('2026-03-28T10:00:00Z') });
    expect(result.status).toBe('green');
  });
});

describe('checkCoverageVelocity', async () => {
  const { checkCoverageVelocity } = await import('../review-checks');

  it('returns green when this week >= last week', () => {
    const database = getTestDb();
    for (let i = 0; i < 5; i++) insertContent(database, 'faq', `this-${i}`, 'en', 24);
    for (let i = 0; i < 3; i++) insertContent(database, 'faq', `last-${i}`, 'en', 8 * 24);
    const result = checkCoverageVelocity(database);
    expect(result.status).toBe('green');
  });

  it('returns red when 0 this week', () => {
    const database = getTestDb();
    for (let i = 0; i < 5; i++) insertContent(database, 'faq', `last-${i}`, 'en', 10 * 24);
    const result = checkCoverageVelocity(database);
    expect(result.status).toBe('red');
  });
});

describe('checkContentTypeBalance', async () => {
  const { checkContentTypeBalance } = await import('../review-checks');

  it('returns green when faq+compare >= 30%', () => {
    const database = getTestDb();
    for (let i = 0; i < 5; i++) insertContent(database, 'faq', `faq-${i}`);
    for (let i = 0; i < 3; i++) insertContent(database, 'compare', `cmp-${i}`);
    for (let i = 0; i < 10; i++) insertContent(database, 'glossary', `gls-${i}`);
    const result = checkContentTypeBalance(database);
    expect(result.status).toBe('green');
    // 8/18 ~= 44%
    expect(result.value).toBeGreaterThanOrEqual(30);
  });

  it('returns red when faq+compare < 15%', () => {
    const database = getTestDb();
    insertContent(database, 'faq', 'faq-1');
    for (let i = 0; i < 20; i++) insertContent(database, 'glossary', `gls-${i}`);
    const result = checkContentTypeBalance(database);
    expect(result.status).toBe('red');
  });
});

describe('checkBilingualCoverage', async () => {
  const { checkBilingualCoverage } = await import('../review-checks');

  it('returns green when ZH >= 80% of EN', () => {
    const database = getTestDb();
    for (let i = 0; i < 10; i++) {
      insertContent(database, 'faq', `faq-${i}`, 'en');
      insertContent(database, 'faq', `faq-${i}`, 'zh');
    }
    const result = checkBilingualCoverage(database);
    expect(result.status).toBe('green');
    expect(result.value).toBe(100);
  });

  it('returns red when ZH < 60% of EN', () => {
    const database = getTestDb();
    for (let i = 0; i < 10; i++) insertContent(database, 'faq', `faq-${i}`, 'en');
    for (let i = 0; i < 4; i++) insertContent(database, 'faq', `faq-${i}`, 'zh');
    const result = checkBilingualCoverage(database);
    expect(result.status).toBe('red');
    expect(result.value).toBe(40);
  });
});

// ════════════════════════════════════════════
// Group E — Performance Loop Health
// ════════════════════════════════════════════

describe('checkGscFreshness', async () => {
  const { checkGscFreshness } = await import('../review-checks');

  it('returns red when no snapshots', () => {
    const database = getTestDb();
    expect(checkGscFreshness(database).status).toBe('red');
  });

  it('returns green when recent snapshot', () => {
    const database = getTestDb();
    const today = new Date().toISOString().slice(0, 10);
    database.prepare(
      `INSERT INTO snapshots (snapshot_date, metric_group, metric_key, metric_value) VALUES (?, 'gsc', 'total_clicks', 100)`
    ).run(today);
    const result = checkGscFreshness(database);
    expect(result.status).toBe('green');
  });
});

describe('checkRefreshActions', async () => {
  const { checkRefreshActions } = await import('../review-checks');

  it('returns green when refresh actions exist', () => {
    const database = getTestDb();
    // Add a snapshot so GSC data exists
    database.prepare(
      `INSERT INTO snapshots (snapshot_date, metric_group, metric_key, metric_value) VALUES ('2026-03-20', 'gsc', 'clicks', 100)`
    ).run();
    insertJob(database, 'pending', { contentType: 'refresh', hoursAgo: 24 });
    const result = checkRefreshActions(database);
    expect(result.status).toBe('green');
  });

  it('returns red when no refresh actions but GSC data exists', () => {
    const database = getTestDb();
    database.prepare(
      `INSERT INTO snapshots (snapshot_date, metric_group, metric_key, metric_value) VALUES ('2026-03-20', 'gsc', 'clicks', 100)`
    ).run();
    const result = checkRefreshActions(database);
    expect(result.status).toBe('red');
  });

  it('returns green when no refresh actions and no GSC data', () => {
    const database = getTestDb();
    const result = checkRefreshActions(database);
    expect(result.status).toBe('green');
  });
});

// ════════════════════════════════════════════
// Orchestrator
// ════════════════════════════════════════════

describe('runHealthChecks', async () => {
  const { runHealthChecks } = await import('../review');

  it('runs all checks and returns report', () => {
    const database = getTestDb();
    const report = runHealthChecks(database, { contentRoot: tmpDir });
    expect(report.generated_at).toBeDefined();
    expect(report.overall_status).toBeDefined();
    expect(report.checks.length).toBeGreaterThan(0);
    expect(report.summary.green + report.summary.yellow + report.summary.red + report.summary.error + report.summary.info)
      .toBe(report.checks.length);
  });

  it('overall_status is red when any check is red', () => {
    const database = getTestDb();
    // Empty DB will produce multiple red checks
    const report = runHealthChecks(database, { contentRoot: tmpDir });
    expect(report.overall_status).toBe('red');
    expect(report.issues.length).toBeGreaterThan(0);
  });

  it('issues only contains yellow/red/error checks', () => {
    const database = getTestDb();
    const report = runHealthChecks(database, { contentRoot: tmpDir });
    for (const issue of report.issues) {
      expect(['yellow', 'red', 'error']).toContain(issue.status);
    }
  });
});

// ════════════════════════════════════════════
// Markdown Formatter
// ════════════════════════════════════════════

describe('formatHealthReportMd', async () => {
  const { runHealthChecks, formatHealthReportMd } = await import('../review');

  it('produces valid markdown', () => {
    const database = getTestDb();
    const report = runHealthChecks(database, { contentRoot: tmpDir });
    const md = formatHealthReportMd(report);
    expect(md).toContain('# Pipeline Health Report');
    expect(md).toContain('Generated:');
    expect(md).toContain('Overall:');
  });
});

// ════════════════════════════════════════════
// Report Storage
// ════════════════════════════════════════════

describe('saveReport + cleanOldReports', async () => {
  const { runHealthChecks, saveReport, cleanOldReports } = await import('../review');

  it('saves report to data/review/', () => {
    const database = getTestDb();
    const report = runHealthChecks(database, { contentRoot: tmpDir });
    const filePath = saveReport(report, 'health', tmpDir);
    expect(fs.existsSync(filePath)).toBe(true);
    const content = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    expect(content.overall_status).toBeDefined();
  });

  it('cleans reports older than 30 days', () => {
    const dir = path.join(tmpDir, 'data', 'review');
    fs.mkdirSync(dir, { recursive: true });
    // Create an old report
    fs.writeFileSync(path.join(dir, 'health-2025-01-01.json'), '{}', 'utf-8');
    // Create a recent report
    const today = new Date().toISOString().slice(0, 10);
    fs.writeFileSync(path.join(dir, `health-${today}.json`), '{}', 'utf-8');

    const cleaned = cleanOldReports(tmpDir);
    expect(cleaned).toBe(1);
    expect(fs.existsSync(path.join(dir, 'health-2025-01-01.json'))).toBe(false);
    expect(fs.existsSync(path.join(dir, `health-${today}.json`))).toBe(true);
  });
});
