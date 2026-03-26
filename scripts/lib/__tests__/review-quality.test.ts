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
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'loreai-quality-test-'));
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

// ── Helpers ──

function insertGroup(
  database: Database.Database,
  opts: {
    status?: string;
    priorityScore?: number;
    clusterSlug?: string;
    intent?: string;
    contentType?: string;
    primaryKeyword?: string;
  } = {}
): number {
  database.prepare(
    `INSERT INTO keyword_groups (primary_keyword, intent, content_type, priority_score, status, cluster_slug)
     VALUES (?, ?, ?, ?, ?, ?)`
  ).run(
    opts.primaryKeyword ?? 'test keyword',
    opts.intent ?? 'informational',
    opts.contentType ?? 'faq',
    opts.priorityScore ?? 100,
    opts.status ?? 'pending',
    opts.clusterSlug ?? null,
  );
  return (database.prepare('SELECT last_insert_rowid() as id').get() as { id: number }).id;
}

function insertJob(
  database: Database.Database,
  status: string,
  opts: {
    hoursAgo?: number;
    completedHoursAgo?: number;
    contentType?: string;
    groupId?: number;
    priorityScore?: number;
  } = {}
): void {
  const createdAt = opts.hoursAgo ?? 0;
  const completed = opts.completedHoursAgo != null
    ? `datetime('now', '-${opts.completedHoursAgo} hours')`
    : 'NULL';
  database.prepare(
    `INSERT INTO create_queue (keyword_group_id, content_type, status, priority_score, created_at, completed_at)
     VALUES (?, ?, ?, ?, datetime('now', '-' || ? || ' hours'), ${completed})`
  ).run(opts.groupId ?? null, opts.contentType ?? 'faq', status, opts.priorityScore ?? 100, createdAt);
}

function insertKeyword(
  database: Database.Database,
  keyword: string,
  opts: { clusterSlug?: string; hoursAgo?: number; searchVolume?: number | null } = {}
): void {
  database.prepare(
    `INSERT OR IGNORE INTO keywords (keyword, source, cluster_slug, discovered_at, search_volume)
     VALUES (?, 'test', ?, datetime('now', '-' || ? || ' hours'), ?)`
  ).run(keyword, opts.clusterSlug ?? null, opts.hoursAgo ?? 0, opts.searchVolume ?? null);
}

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

function writeContentFile(contentRoot: string, type: string, slug: string, content: string): void {
  const dir = path.join(contentRoot, 'content', type, 'en');
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, `${slug}.md`), content, 'utf-8');
}

// ════════════════════════════════════════════
// Rubric D — Priority Score Sanity
// ════════════════════════════════════════════

describe('checkPrioritySanity', async () => {
  const { checkPrioritySanity } = await import('../review-quality');

  it('returns info when no pending jobs', () => {
    const database = getTestDb();
    const result = checkPrioritySanity(database);
    expect(result.status).toBe('info');
    expect(result.issues).toHaveLength(0);
  });

  it('returns green when top-10 looks healthy', () => {
    const database = getTestDb();
    // Create 20 varied groups so top-10 and bottom-10 don't overlap
    // Top 10: high priority + high volume; Bottom 10: low priority + low volume
    for (let i = 0; i < 20; i++) {
      const contentType = i % 3 === 0 ? 'faq' : i % 3 === 1 ? 'compare' : 'blog';
      const gid = insertGroup(database, {
        priorityScore: 200 - i * 5,
        intent: 'informational',
        contentType,
        clusterSlug: `topic-${i}`,
        primaryKeyword: `keyword-${i}`,
      });
      insertJob(database, 'pending', { groupId: gid, priorityScore: 200 - i * 5 });
      insertKeyword(database, `kw-${i}`, { clusterSlug: `topic-${i}`, searchVolume: i < 10 ? 500 : 20 });
    }
    const result = checkPrioritySanity(database);
    expect(result.status).toBe('green');
    expect(result.issues).toHaveLength(0);
    expect(result.top10).toHaveLength(10);
  });

  it('flags navigational intent in top-10', () => {
    const database = getTestDb();
    const gid = insertGroup(database, {
      intent: 'navigational',
      primaryKeyword: 'github login',
      clusterSlug: 'nav-topic',
    });
    insertJob(database, 'pending', { groupId: gid, priorityScore: 200 });

    const result = checkPrioritySanity(database);
    expect(result.status).toBe('yellow');
    expect(result.issues.some(i => i.includes('navigational'))).toBe(true);
  });

  it('flags default volume in top-10', () => {
    const database = getTestDb();
    const gid = insertGroup(database, {
      clusterSlug: 'low-vol-topic',
      primaryKeyword: 'obscure thing',
    });
    insertJob(database, 'pending', { groupId: gid, priorityScore: 200 });
    // Keyword with default volume (null → defaults to 10 in the query)
    insertKeyword(database, 'obscure thing', { clusterSlug: 'low-vol-topic', searchVolume: null });

    const result = checkPrioritySanity(database);
    expect(result.issues.some(i => i.includes('no real volume data'))).toBe(true);
  });

  it('flags high-volume keywords deprioritized in bottom-10', () => {
    const database = getTestDb();
    // Create 15 jobs — top 10 are high priority, bottom 5 are low
    for (let i = 0; i < 10; i++) {
      const gid = insertGroup(database, {
        priorityScore: 200 - i,
        clusterSlug: `high-${i}`,
        primaryKeyword: `high-kw-${i}`,
      });
      insertJob(database, 'pending', { groupId: gid, priorityScore: 200 - i });
      insertKeyword(database, `high-kw-${i}`, { clusterSlug: `high-${i}`, searchVolume: 50 });
    }
    // Bottom entries with high volume but low priority
    for (let i = 0; i < 5; i++) {
      const gid = insertGroup(database, {
        priorityScore: 5 + i,
        clusterSlug: `bottom-${i}`,
        primaryKeyword: `bottom-kw-${i}`,
      });
      insertJob(database, 'pending', { groupId: gid, priorityScore: 5 + i });
      insertKeyword(database, `bottom-kw-${i}`, { clusterSlug: `bottom-${i}`, searchVolume: 500 });
    }

    const result = checkPrioritySanity(database);
    expect(result.issues.some(i => i.includes('high volume') && i.includes('deprioritized'))).toBe(true);
  });

  it('flags all same content_type in top-10', () => {
    const database = getTestDb();
    for (let i = 0; i < 8; i++) {
      const gid = insertGroup(database, {
        contentType: 'glossary',
        clusterSlug: `gls-${i}`,
        primaryKeyword: `gls-kw-${i}`,
      });
      insertJob(database, 'pending', { groupId: gid, priorityScore: 100 - i });
      insertKeyword(database, `gls-kw-${i}`, { clusterSlug: `gls-${i}`, searchVolume: 300 });
    }

    const result = checkPrioritySanity(database);
    expect(result.issues.some(i => i.includes('lacks diversity'))).toBe(true);
  });

  it('returns red when 3+ issues detected', () => {
    const database = getTestDb();
    // Create jobs that trigger multiple issues:
    // 1) navigational intent, 2) default volume, 3) all same type
    for (let i = 0; i < 6; i++) {
      const gid = insertGroup(database, {
        intent: 'navigational',
        contentType: 'glossary',
        clusterSlug: `bad-${i}`,
        primaryKeyword: `bad-kw-${i}`,
      });
      insertJob(database, 'pending', { groupId: gid, priorityScore: 100 - i });
      // No keywords → will use default volume
    }

    const result = checkPrioritySanity(database);
    expect(result.status).toBe('red');
    expect(result.issues.length).toBeGreaterThanOrEqual(3);
  });
});

// ════════════════════════════════════════════
// Rubric G — Internal Linking Coherence
// ════════════════════════════════════════════

describe('extractInternalLinks', async () => {
  const { extractInternalLinks } = await import('../review-quality');

  it('extracts markdown links', () => {
    const md = `Check [this FAQ](/faq/my-faq) and [blog post](/blog/my-post) for details.`;
    const links = extractInternalLinks(md);
    expect(links).toEqual(['/faq/my-faq', '/blog/my-post']);
  });

  it('ignores external links', () => {
    const md = `Visit [Google](https://google.com) and [docs](/faq/setup).`;
    const links = extractInternalLinks(md);
    expect(links).toEqual(['/faq/setup']);
  });

  it('returns empty for no links', () => {
    expect(extractInternalLinks('Just plain text.')).toEqual([]);
  });
});

describe('parseLinkPath', async () => {
  const { parseLinkPath } = await import('../review-quality');

  it('parses content paths', () => {
    expect(parseLinkPath('/blog/my-post')).toEqual({ type: 'blog', slug: 'my-post' });
    expect(parseLinkPath('/faq/setup')).toEqual({ type: 'faq', slug: 'setup' });
    expect(parseLinkPath('/glossary/ai-safety')).toEqual({ type: 'glossary', slug: 'ai-safety' });
    expect(parseLinkPath('/compare/x-vs-y')).toEqual({ type: 'compare', slug: 'x-vs-y' });
    expect(parseLinkPath('/topics/claude-code')).toEqual({ type: 'topics', slug: 'claude-code' });
  });

  it('returns null for non-content paths', () => {
    expect(parseLinkPath('/subscribe')).toBeNull();
    expect(parseLinkPath('/newsletter/2026-03-25')).toBeNull();
  });
});

describe('checkInternalLinking', async () => {
  const { checkInternalLinking } = await import('../review-quality');

  it('returns info when no topic clusters with content', () => {
    const database = getTestDb();
    const result = checkInternalLinking(database, { contentRoot: tmpDir });
    expect(result.status).toBe('info');
    expect(result.by_topic).toHaveLength(0);
  });

  it('detects broken internal links', () => {
    const database = getTestDb();
    // Create topic cluster
    database.prepare(
      `INSERT INTO topic_clusters (slug, pillar_topic, last_seen) VALUES ('test-topic', 'Test', datetime('now'))`
    ).run();
    // Create keyword group for this cluster
    insertGroup(database, { clusterSlug: 'test-topic', contentType: 'faq' });
    // Create content in DB
    insertContent(database, 'faq', 'real-faq');
    // Write file with a broken link
    writeContentFile(tmpDir, 'faq', 'real-faq', `
# FAQ
Check [broken link](/blog/nonexistent-post) for more info.
`);

    const result = checkInternalLinking(database, { contentRoot: tmpDir });
    const topicReport = result.by_topic.find(t => t.topic === 'test-topic');
    expect(topicReport).toBeDefined();
    expect(topicReport!.broken_links.length).toBeGreaterThan(0);
    expect(topicReport!.broken_links[0].broken_target).toBe('/blog/nonexistent-post');
  });

  it('detects orphan pages (no inbound links)', () => {
    const database = getTestDb();
    database.prepare(
      `INSERT INTO topic_clusters (slug, pillar_topic, last_seen) VALUES ('orphan-topic', 'Orphan', datetime('now'))`
    ).run();
    insertGroup(database, { clusterSlug: 'orphan-topic', contentType: 'faq' });
    insertContent(database, 'faq', 'page-a');
    insertContent(database, 'faq', 'page-b');
    // page-a links to page-b, but page-b doesn't link back — page-a is orphan
    writeContentFile(tmpDir, 'faq', 'page-a', `Link to [page B](/faq/page-b).`);
    writeContentFile(tmpDir, 'faq', 'page-b', `No links here.`);

    const result = checkInternalLinking(database, { contentRoot: tmpDir });
    const topicReport = result.by_topic.find(t => t.topic === 'orphan-topic');
    expect(topicReport).toBeDefined();
    // page-a has no inbound links from cluster pages
    expect(topicReport!.orphan_pages).toContain('/faq/page-a');
  });

  it('measures hub link coverage', () => {
    const database = getTestDb();
    database.prepare(
      `INSERT INTO topic_clusters (slug, pillar_topic, last_seen) VALUES ('hub-test', 'Hub', datetime('now'))`
    ).run();
    insertGroup(database, { clusterSlug: 'hub-test', contentType: 'faq' });
    insertContent(database, 'faq', 'spoke-1');
    insertContent(database, 'faq', 'spoke-2');
    // Hub page links to spoke-1 but not spoke-2
    writeContentFile(tmpDir, 'topics', 'hub-test', `# Hub\nSee [spoke 1](/faq/spoke-1).`);
    writeContentFile(tmpDir, 'faq', 'spoke-1', `Content.`);
    writeContentFile(tmpDir, 'faq', 'spoke-2', `Content.`);

    const result = checkInternalLinking(database, { contentRoot: tmpDir });
    const topicReport = result.by_topic.find(t => t.topic === 'hub-test');
    expect(topicReport).toBeDefined();
    expect(topicReport!.hub_link_coverage).toBe(0.5); // 1 of 2 spokes linked
  });

  it('returns green when linking is healthy', () => {
    const database = getTestDb();
    database.prepare(
      `INSERT INTO topic_clusters (slug, pillar_topic, last_seen) VALUES ('good-topic', 'Good', datetime('now'))`
    ).run();
    insertGroup(database, { clusterSlug: 'good-topic', contentType: 'faq' });
    insertContent(database, 'faq', 'faq-1');
    insertContent(database, 'faq', 'faq-2');
    // Hub links to both spokes, spokes link to each other
    writeContentFile(tmpDir, 'topics', 'good-topic', `# Hub\n[FAQ 1](/faq/faq-1) and [FAQ 2](/faq/faq-2).`);
    writeContentFile(tmpDir, 'faq', 'faq-1', `See [FAQ 2](/faq/faq-2) and [hub](/topics/good-topic).`);
    writeContentFile(tmpDir, 'faq', 'faq-2', `See [FAQ 1](/faq/faq-1) and [hub](/topics/good-topic).`);

    const result = checkInternalLinking(database, { contentRoot: tmpDir });
    // With good interlinking, expect green or at least no red
    expect(result.by_topic.length).toBeGreaterThan(0);
    const topicReport = result.by_topic[0];
    expect(topicReport.broken_links).toHaveLength(0);
    expect(topicReport.hub_link_coverage).toBe(1);
  });

  it('counts cross-cluster links', () => {
    const database = getTestDb();
    database.prepare(
      `INSERT INTO topic_clusters (slug, pillar_topic, last_seen) VALUES ('cc-topic', 'CC', datetime('now'))`
    ).run();
    insertGroup(database, { clusterSlug: 'cc-topic', contentType: 'faq' });
    insertContent(database, 'faq', 'cc-page');
    // Page links to an external cluster page
    writeContentFile(tmpDir, 'faq', 'cc-page', `See [other topic](/blog/other-cluster-post).`);
    // Create the target file so it's not a broken link
    writeContentFile(tmpDir, 'blog', 'other-cluster-post', `Other content.`);

    const result = checkInternalLinking(database, { contentRoot: tmpDir });
    const topicReport = result.by_topic.find(t => t.topic === 'cc-topic');
    expect(topicReport).toBeDefined();
    expect(topicReport!.cross_cluster_links).toBeGreaterThan(0);
  });
});

// ════════════════════════════════════════════
// Rubric H — Refresh Pipeline Health
// ════════════════════════════════════════════

describe('checkRefreshPipeline', async () => {
  const { checkRefreshPipeline } = await import('../review-quality');

  it('returns green when no GSC data (refresh not expected)', () => {
    const database = getTestDb();
    const result = checkRefreshPipeline(database);
    expect(result.status).toBe('green');
    expect(result.detail).toContain('No GSC data');
  });

  it('returns not_implemented when GSC exists but no refresh jobs', () => {
    const database = getTestDb();
    database.prepare(
      `INSERT INTO snapshots (snapshot_date, metric_group, metric_key, metric_value) VALUES ('2026-03-20', 'gsc', 'clicks', 100)`
    ).run();
    const result = checkRefreshPipeline(database);
    expect(result.status).toBe('not_implemented');
    expect(result.detail).toContain('no refresh jobs');
  });

  it('returns green when completion rate >= 80%', () => {
    const database = getTestDb();
    database.prepare(
      `INSERT INTO snapshots (snapshot_date, metric_group, metric_key, metric_value) VALUES ('2026-03-20', 'gsc', 'clicks', 100)`
    ).run();
    // 5 completed out of 5 total
    for (let i = 0; i < 5; i++) {
      insertJob(database, 'completed', { contentType: 'refresh', completedHoursAgo: i * 24 });
    }
    const result = checkRefreshPipeline(database);
    // completion rate = 100%, but 0 conversions with < 4 weeks data → yellow
    expect(['green', 'yellow']).toContain(result.status);
    expect(result.completion_rate).toBe(1);
  });

  it('returns red when completion rate < 50%', () => {
    const database = getTestDb();
    database.prepare(
      `INSERT INTO snapshots (snapshot_date, metric_group, metric_key, metric_value) VALUES ('2026-03-20', 'gsc', 'clicks', 100)`
    ).run();
    // 1 completed, 4 pending → 20% completion
    insertJob(database, 'completed', { contentType: 'refresh', completedHoursAgo: 24 });
    for (let i = 0; i < 4; i++) {
      insertJob(database, 'pending', { contentType: 'refresh', hoursAgo: 48 });
    }
    const result = checkRefreshPipeline(database);
    expect(result.status).toBe('red');
    expect(result.completion_rate).toBe(0.2);
  });

  it('detects stale refresh jobs', () => {
    const database = getTestDb();
    database.prepare(
      `INSERT INTO snapshots (snapshot_date, metric_group, metric_key, metric_value) VALUES ('2026-03-20', 'gsc', 'clicks', 100)`
    ).run();
    // All completed (so completion rate is OK), plus stale pending ones
    for (let i = 0; i < 5; i++) {
      insertJob(database, 'completed', { contentType: 'refresh', completedHoursAgo: i * 24 });
    }
    // Stale: pending for > 14 days
    insertJob(database, 'pending', { contentType: 'refresh', hoursAgo: 20 * 24 });
    const result = checkRefreshPipeline(database);
    expect(result.stale_jobs).toBe(1);
  });

  it('reports correct totals', () => {
    const database = getTestDb();
    database.prepare(
      `INSERT INTO snapshots (snapshot_date, metric_group, metric_key, metric_value) VALUES ('2026-03-20', 'gsc', 'clicks', 100)`
    ).run();
    insertJob(database, 'completed', { contentType: 'refresh', completedHoursAgo: 24 });
    insertJob(database, 'pending', { contentType: 'refresh', hoursAgo: 24 });
    insertJob(database, 'in_progress', { contentType: 'refresh', hoursAgo: 12 });

    const result = checkRefreshPipeline(database);
    expect(result.refresh_jobs_total).toBe(3);
    expect(result.refresh_jobs_completed).toBe(1);
  });
});

// ════════════════════════════════════════════
// Combined: runPureQualityChecks
// ════════════════════════════════════════════

describe('runPureQualityChecks', async () => {
  const { runPureQualityChecks } = await import('../review-quality');

  it('returns all three rubric results', () => {
    const database = getTestDb();
    const report = runPureQualityChecks(database, { contentRoot: tmpDir });
    expect(report.priority_sanity).toBeDefined();
    expect(report.internal_linking).toBeDefined();
    expect(report.refresh_pipeline).toBeDefined();
  });
});

// ════════════════════════════════════════════
// Quality Report Orchestrator
// ════════════════════════════════════════════

describe('runQualityChecks', async () => {
  const { runQualityChecks } = await import('../review');

  it('returns quality report with timing', () => {
    const database = getTestDb();
    const report = runQualityChecks(database, { contentRoot: tmpDir });
    expect(report.generated_at).toBeDefined();
    expect(report.overall_quality).toBeDefined();
    expect(report.duration_ms).toBeGreaterThanOrEqual(0);
    expect(report.llm_calls).toBe(0); // No LLM rubrics yet
    expect(report.pure_checks).toBeDefined();
  });
});

describe('formatQualityReportMd', async () => {
  const { runQualityChecks, formatQualityReportMd } = await import('../review');

  it('produces valid markdown', () => {
    const database = getTestDb();
    const report = runQualityChecks(database, { contentRoot: tmpDir });
    const md = formatQualityReportMd(report);
    expect(md).toContain('# Pipeline Quality Report');
    expect(md).toContain('Rubric D');
    expect(md).toContain('Rubric G');
    expect(md).toContain('Rubric H');
  });
});
