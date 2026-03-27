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
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'loreai-review-strategic-'));
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

// ══════════════════════════════════════════════
// Report Storage Tests
// ══════════════════════════════════════════════

describe('saveReport', () => {
  it('saves health report as JSON', async () => {
    const { saveReport } = await import('../review');
    const report = {
      generated_at: '2026-03-27T00:00:00Z',
      overall_status: 'green' as const,
      checks: [],
      summary: { green: 0, yellow: 0, red: 0, error: 0, info: 0 },
      issues: [],
    };

    const filePath = saveReport(report, 'health', tmpDir);
    expect(filePath).toContain('health-');
    expect(filePath).toMatch(/\.json$/);
    expect(fs.existsSync(filePath)).toBe(true);

    const content = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    expect(content.overall_status).toBe('green');
  });

  it('saves quality report as JSON', async () => {
    const { saveReport } = await import('../review');
    const report = {
      generated_at: '2026-03-27T00:00:00Z',
      overall_quality: 'yellow',
      pure_checks: {},
      llm_calls: 5,
      llm_model: 'sonnet',
      duration_ms: 1000,
    };

    const filePath = saveReport(report as any, 'quality', tmpDir);
    expect(filePath).toContain('quality-');
    expect(filePath).toMatch(/\.json$/);
  });

  it('saves strategic report as markdown string', async () => {
    const { saveReport } = await import('../review');
    const md = '# Strategic Review\n\nContent here.';

    const filePath = saveReport(md, 'strategic', tmpDir);
    expect(filePath).toContain('strategic-');
    expect(filePath).toMatch(/\.md$/);

    const content = fs.readFileSync(filePath, 'utf-8');
    expect(content).toBe(md);
  });

  it('creates data/review directory if missing', async () => {
    const { saveReport } = await import('../review');
    const nested = path.join(tmpDir, 'nested');
    const md = '# Test';

    const filePath = saveReport(md, 'strategic', nested);
    expect(fs.existsSync(filePath)).toBe(true);
  });
});

describe('cleanOldReports', () => {
  it('deletes reports older than 30 days', async () => {
    const { cleanOldReports } = await import('../review');
    const dir = path.join(tmpDir, 'data', 'review');
    fs.mkdirSync(dir, { recursive: true });

    // Create old report (40 days ago)
    fs.writeFileSync(path.join(dir, 'health-2026-02-15.json'), '{}');
    // Create recent report
    fs.writeFileSync(path.join(dir, 'health-2026-03-25.json'), '{}');

    const deleted = cleanOldReports(tmpDir);
    expect(deleted).toBe(1);
    expect(fs.existsSync(path.join(dir, 'health-2026-02-15.json'))).toBe(false);
    expect(fs.existsSync(path.join(dir, 'health-2026-03-25.json'))).toBe(true);
  });

  it('returns 0 when no reports exist', async () => {
    const { cleanOldReports } = await import('../review');
    const deleted = cleanOldReports(tmpDir);
    expect(deleted).toBe(0);
  });
});

// ══════════════════════════════════════════════
// Trend Tracking Tests
// ══════════════════════════════════════════════

describe('loadLatestReport', () => {
  it('loads the most recent report by date', async () => {
    const { loadLatestReport } = await import('../review');
    const dir = path.join(tmpDir, 'data', 'review');
    fs.mkdirSync(dir, { recursive: true });

    fs.writeFileSync(path.join(dir, 'quality-2026-03-24.json'), JSON.stringify({ day: 24 }));
    fs.writeFileSync(path.join(dir, 'quality-2026-03-25.json'), JSON.stringify({ day: 25 }));
    fs.writeFileSync(path.join(dir, 'quality-2026-03-23.json'), JSON.stringify({ day: 23 }));

    const result = loadLatestReport<{ day: number }>('quality', tmpDir);
    expect(result).not.toBeNull();
    expect(result!.date).toBe('2026-03-25');
    expect(result!.report.day).toBe(25);
  });

  it('returns null when no reports exist', async () => {
    const { loadLatestReport } = await import('../review');
    const result = loadLatestReport('quality', tmpDir);
    expect(result).toBeNull();
  });

  it('only matches the specified mode', async () => {
    const { loadLatestReport } = await import('../review');
    const dir = path.join(tmpDir, 'data', 'review');
    fs.mkdirSync(dir, { recursive: true });

    fs.writeFileSync(path.join(dir, 'health-2026-03-25.json'), JSON.stringify({ type: 'health' }));

    const result = loadLatestReport('quality', tmpDir);
    expect(result).toBeNull();
  });
});

describe('loadReportsInRange', () => {
  it('loads reports within the date range', async () => {
    const { loadReportsInRange } = await import('../review');
    const dir = path.join(tmpDir, 'data', 'review');
    fs.mkdirSync(dir, { recursive: true });

    // Write reports spanning 10 days
    fs.writeFileSync(path.join(dir, 'quality-2026-03-20.json'), JSON.stringify({ day: 20 }));
    fs.writeFileSync(path.join(dir, 'quality-2026-03-24.json'), JSON.stringify({ day: 24 }));
    fs.writeFileSync(path.join(dir, 'quality-2026-03-25.json'), JSON.stringify({ day: 25 }));
    fs.writeFileSync(path.join(dir, 'quality-2026-03-10.json'), JSON.stringify({ day: 10 }));

    const results = loadReportsInRange<{ day: number }>('quality', 7, tmpDir);
    // Should include reports from last 7 days (depends on "now")
    // All should be sorted by date
    expect(results.length).toBeGreaterThanOrEqual(1);
    for (let i = 1; i < results.length; i++) {
      expect(results[i].date >= results[i - 1].date).toBe(true);
    }
  });
});

describe('computeQualityTrends', () => {
  it('returns null deltas when no previous report exists', async () => {
    const { computeQualityTrends } = await import('../review');

    const current = makeMockQualityReport(4.0, 3.5, 3.8, 0.1);
    const trends = computeQualityTrends(current, tmpDir);

    expect(trends.previous_report_date).toBeNull();
    expect(trends.deltas.keyword_coherence).toBeNull();
  });

  it('computes deltas from previous report', async () => {
    const { computeQualityTrends, saveReport } = await import('../review');

    // Save a "previous" quality report
    const prev = makeMockQualityReport(3.5, 3.0, 3.2, 0.2);
    saveReport(prev as any, 'quality', tmpDir);

    // Wait a bit to ensure different filename (in real use they'd be on different dates)
    const current = makeMockQualityReport(4.0, 3.5, 3.8, 0.1);
    const trends = computeQualityTrends(current, tmpDir);

    expect(trends.previous_report_date).not.toBeNull();
    expect(trends.deltas.keyword_coherence).toBe(0.5);
    expect(trends.deltas.content_intent_match).toBe(0.5);
    expect(trends.deltas.content_aeo_readiness).toBe(0.6);
    expect(trends.deltas.keyword_quality_junk_rate).toBe(-0.1);
  });
});

// ══════════════════════════════════════════════
// Strategic Report Generation Tests
// ══════════════════════════════════════════════

describe('generateStrategicReport', () => {
  it('generates markdown with all sections', async () => {
    const { generateStrategicReport } = await import('../review');
    const database = getTestDb();

    const md = generateStrategicReport({
      db: database,
      rootDir: tmpDir,
      contentRoot: tmpDir,
    });

    expect(md).toContain('# LoreAI Strategic Review');
    expect(md).toContain('## Pipeline Health (Layer 1)');
    expect(md).toContain('## Quality Scores (Layer 2)');
    expect(md).toContain('## Content Inventory');
    expect(md).toContain('## Flagship Topic Status');
    expect(md).toContain('## Top 10 Queue');
    expect(md).toContain('## Bottom 5 Quality Samples');
    expect(md).toContain('## Worst Keyword Groups');
    expect(md).toContain('## Questions for Human Review');
  });

  it('includes health data when report exists', async () => {
    const { generateStrategicReport, saveReport } = await import('../review');
    const database = getTestDb();

    // Save a health report
    const healthReport = {
      generated_at: '2026-03-27T00:00:00Z',
      overall_status: 'yellow' as const,
      checks: [],
      summary: { green: 5, yellow: 2, red: 0, error: 0, info: 1 },
      issues: [
        { check_id: 'queue_drain_rate', window: 'today' as const, status: 'yellow' as const, value: 0, threshold: { green: '', yellow: '', red: '' }, summary: 'No items completed today' },
      ],
    };
    saveReport(healthReport, 'health', tmpDir);

    const md = generateStrategicReport({
      db: database,
      rootDir: tmpDir,
      contentRoot: tmpDir,
    });

    expect(md).toContain('YELLOW');
    expect(md).toContain('queue_drain_rate');
  });

  it('includes content inventory counts', async () => {
    const { generateStrategicReport } = await import('../review');
    const database = getTestDb();

    // Create some content dirs with files
    const blogEnDir = path.join(tmpDir, 'content', 'blog', 'en');
    fs.mkdirSync(blogEnDir, { recursive: true });
    fs.writeFileSync(path.join(blogEnDir, 'test-post.md'), '# Test');
    fs.writeFileSync(path.join(blogEnDir, 'another-post.md'), '# Another');

    const md = generateStrategicReport({
      db: database,
      rootDir: tmpDir,
      contentRoot: tmpDir,
    });

    expect(md).toContain('blog: 2 EN');
  });

  it('shows queue items when present', async () => {
    const { generateStrategicReport } = await import('../review');
    const database = getTestDb();

    // Insert a keyword group and queue item
    database.prepare(
      `INSERT INTO keyword_groups (primary_keyword, intent, content_type, priority_score, status, cluster_slug)
       VALUES ('test keyword', 'informational', 'faq', 200, 'queued', 'test-topic')`
    ).run();
    const groupId = (database.prepare('SELECT last_insert_rowid() as id').get() as { id: number }).id;

    database.prepare(
      `INSERT INTO create_queue (keyword_group_id, content_type, status, priority_score, created_at)
       VALUES (?, 'faq', 'pending', 200, datetime('now'))`
    ).run(groupId);

    const md = generateStrategicReport({
      db: database,
      rootDir: tmpDir,
      contentRoot: tmpDir,
    });

    expect(md).toContain('test keyword');
    expect(md).toContain('200');
  });

  it('generates review questions from health issues', async () => {
    const { generateStrategicReport, saveReport } = await import('../review');
    const database = getTestDb();

    const healthReport = {
      generated_at: '2026-03-27T00:00:00Z',
      overall_status: 'red' as const,
      checks: [],
      summary: { green: 0, yellow: 0, red: 1, error: 0, info: 0 },
      issues: [
        {
          check_id: 'queue_drain_rate',
          window: 'today' as const,
          status: 'red' as const,
          value: 0,
          threshold: { green: '>= 3', yellow: '1-2', red: '0' },
          summary: 'No items completed today',
        },
      ],
    };
    saveReport(healthReport, 'health', tmpDir);

    const md = generateStrategicReport({
      db: database,
      rootDir: tmpDir,
      contentRoot: tmpDir,
    });

    expect(md).toContain('Queue drain rate is 0');
    expect(md).toContain('process-queue.ts');
  });

  it('stays under 15K tokens target', async () => {
    const { generateStrategicReport } = await import('../review');
    const database = getTestDb();

    const md = generateStrategicReport({
      db: database,
      rootDir: tmpDir,
      contentRoot: tmpDir,
    });

    // Rough estimate: 1 token ≈ 4 chars, 15K tokens ≈ 60K chars
    // With empty DB it should be well under
    expect(md.length).toBeLessThan(60_000);
  });
});

// ── Helpers ──

function makeMockQualityReport(
  coherence: number, intent: number, aeo: number, junkRate: number,
) {
  return {
    generated_at: new Date().toISOString(),
    pure_checks: {
      priority_sanity: { status: 'green' as const, issues: [], top10: [], bottom10: [] },
      internal_linking: { status: 'green' as const, by_topic: [] },
      refresh_pipeline: { status: 'not_implemented' as const, refresh_jobs_total: 0, refresh_jobs_completed: 0, completion_rate: 0, stale_jobs: 0, striking_conversions: 0, detail: '' },
    },
    llm_checks: {
      keyword_coherence: { status: 'green' as const, samples_scored: 10, average_score: coherence, worst_groups: [], errors: [] },
      content_intent_match: { status: 'green' as const, samples_scored: 20, average_score: intent, by_type: {}, worst_pieces: [], errors: [] },
      content_aeo_readiness: { status: 'green' as const, samples_scored: 20, average_score: aeo, by_type: {}, common_issues: [], errors: [] },
      subtopic_discovery: { status: 'green' as const, samples_scored: 10, average_score: 4.0, worst_subtopics: [], errors: [] },
      keyword_quality: { status: 'green' as const, samples_scored: 20, average_score: 4.0, junk_rate: junkRate, junk_rate_by_source: {}, worst_keywords: [], errors: [] },
      llm_calls: 50,
    },
    overall_quality: 'green' as const,
    llm_calls: 50,
    llm_model: 'sonnet',
    duration_ms: 5000,
  };
}
