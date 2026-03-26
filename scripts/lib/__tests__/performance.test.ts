import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import fs from 'fs';
import path from 'path';
import os from 'os';

import type {
  SegmentationResult,
  AnomalyReport,
  NewQuery,
  GSCQueryResult,
} from '../gsc';

// ── Import performance module ──

import {
  calculateDateRanges,
  generateRefreshActions,
  writeActions,
  STRIKING_MIN_IMPRESSIONS,
  PRIORITY_SCORES,
  GSC_DATA_LAG_DAYS,
  DEFAULT_DAYS,
  MAX_ACTIONS_DEFAULT,
  RECENT_REFRESH_COOLDOWN_DAYS,
} from '../performance';

import type { RefreshAction } from '../performance';

// ── Helpers ──

function makeSegmentation(strikingQueries: Array<{ query: string; impressions: number; position: number; page?: string }>): SegmentationResult {
  return {
    dateRange: { start: '2026-02-17', end: '2026-03-17' },
    segments: {
      defending: { segment: 'defending', count: 0, totalClicks: 0, totalImpressions: 0, avgCtr: 0, avgPosition: 0, queries: [] },
      page_one: { segment: 'page_one', count: 0, totalClicks: 0, totalImpressions: 0, avgCtr: 0, avgPosition: 0, queries: [] },
      striking: {
        segment: 'striking',
        count: strikingQueries.length,
        totalClicks: 0,
        totalImpressions: strikingQueries.reduce((s, q) => s + q.impressions, 0),
        avgCtr: 0,
        avgPosition: 0,
        queries: strikingQueries.map((q) => ({
          query: q.query,
          clicks: 0,
          impressions: q.impressions,
          ctr: 0,
          position: q.position,
          segment: 'striking' as const,
          page: q.page,
        })),
      },
      building: { segment: 'building', count: 0, totalClicks: 0, totalImpressions: 0, avgCtr: 0, avgPosition: 0, queries: [] },
      long_shot: { segment: 'long_shot', count: 0, totalClicks: 0, totalImpressions: 0, avgCtr: 0, avgPosition: 0, queries: [] },
    },
    totalQueries: strikingQueries.length,
  };
}

function makeAnomalyReport(anomalies: Array<{
  type: 'high_impressions_low_ctr' | 'high_ctr_low_impressions' | 'position_dropping' | 'new_query';
  query: string;
  impressions: number;
  priority: 'A' | 'B' | 'C' | 'D' | 'E';
}>): AnomalyReport {
  return {
    dateRange: {
      current: { start: '2026-02-17', end: '2026-03-17' },
      previous: { start: '2026-01-20', end: '2026-02-16' },
    },
    anomalies: anomalies.map((a) => ({
      type: a.type,
      query: a.query,
      current: { clicks: 5, impressions: a.impressions, ctr: 0.01, position: 12 },
      detail: `Anomaly: ${a.query}`,
      suggestedAction: 'Fix it',
      priority: a.priority,
    })),
    summary: {
      high_impressions_low_ctr: anomalies.filter((a) => a.type === 'high_impressions_low_ctr').length,
      high_ctr_low_impressions: anomalies.filter((a) => a.type === 'high_ctr_low_impressions').length,
      position_dropping: anomalies.filter((a) => a.type === 'position_dropping').length,
      new_query: anomalies.filter((a) => a.type === 'new_query').length,
    },
  };
}

function makeNewQueries(queries: Array<{ query: string; impressions: number }>): NewQuery[] {
  return queries.map((q) => ({
    query: q.query,
    clicks: 0,
    impressions: q.impressions,
    ctr: 0,
    position: 0,
    firstSeen: '2026-03-01',
  }));
}

// ── Unit Tests ──

describe('Performance Loop — Constants', () => {
  it('exports expected constants', () => {
    expect(DEFAULT_DAYS).toBe(28);
    expect(GSC_DATA_LAG_DAYS).toBe(3);
    expect(STRIKING_MIN_IMPRESSIONS).toBe(20);
    expect(MAX_ACTIONS_DEFAULT).toBe(30);
    expect(RECENT_REFRESH_COOLDOWN_DAYS).toBe(7);
    expect(PRIORITY_SCORES.A).toBe(10000);
    expect(PRIORITY_SCORES.B).toBe(5000);
    expect(PRIORITY_SCORES.C).toBe(2000);
    expect(PRIORITY_SCORES.D).toBe(1000);
    expect(PRIORITY_SCORES.E).toBe(100);
  });
});

describe('calculateDateRanges', () => {
  it('correctly calculates date ranges with GSC lag', () => {
    // Spec §10.1.9: today=2026-03-20, days=28
    const today = new Date('2026-03-20T12:00:00Z');
    const ranges = calculateDateRanges(today, 28);

    expect(ranges.current.end).toBe('2026-03-17');     // 20 - 3 = 17
    expect(ranges.current.start).toBe('2026-02-17');   // 17 - 28 = Feb 17
    expect(ranges.previous.end).toBe('2026-02-16');    // Feb 17 - 1 = Feb 16
    expect(ranges.previous.start).toBe('2026-01-19');  // Feb 16 - 28 = Jan 19
  });

  it('handles shorter period', () => {
    const today = new Date('2026-03-20T12:00:00Z');
    const ranges = calculateDateRanges(today, 14);

    expect(ranges.current.end).toBe('2026-03-17');
    expect(ranges.current.start).toBe('2026-03-03');
    expect(ranges.previous.end).toBe('2026-03-02');
    expect(ranges.previous.start).toBe('2026-02-16');
  });

  it('returns non-overlapping periods', () => {
    const today = new Date('2026-06-15T12:00:00Z');
    const ranges = calculateDateRanges(today, 28);

    // Previous end should be 1 day before current start
    const prevEnd = new Date(ranges.previous.end);
    const currStart = new Date(ranges.current.start);
    const diffDays = (currStart.getTime() - prevEnd.getTime()) / (1000 * 60 * 60 * 24);
    expect(diffDays).toBe(1);
  });
});

describe('generateRefreshActions — striking distance', () => {
  it('only includes queries above STRIKING_MIN_IMPRESSIONS', () => {
    const seg = makeSegmentation([
      { query: 'high imp', impressions: 500, position: 12 },
      { query: 'medium imp', impressions: 50, position: 14 },
      { query: 'low imp', impressions: 10, position: 16 },     // below threshold
      { query: 'very low', impressions: 5, position: 18 },      // below threshold
      { query: 'threshold', impressions: STRIKING_MIN_IMPRESSIONS, position: 15 }, // exactly at threshold
    ]);
    const anomalyReport = makeAnomalyReport([]);
    const newQueries: NewQuery[] = [];

    const actions = generateRefreshActions(seg, anomalyReport, newQueries, {
      maxActions: 100,
      strikingMinImpressions: STRIKING_MIN_IMPRESSIONS,
    });

    const strikingActions = actions.filter((a) => a.priority === 'A');
    expect(strikingActions).toHaveLength(3); // high, medium, threshold
    expect(strikingActions.map((a) => a.query)).toContain('high imp');
    expect(strikingActions.map((a) => a.query)).toContain('medium imp');
    expect(strikingActions.map((a) => a.query)).toContain('threshold');
    expect(strikingActions.map((a) => a.query)).not.toContain('low imp');
  });

  it('sorts striking distance actions by impressions descending', () => {
    const seg = makeSegmentation([
      { query: 'c', impressions: 100, position: 12 },
      { query: 'a', impressions: 500, position: 14 },
      { query: 'b', impressions: 300, position: 16 },
    ]);

    const actions = generateRefreshActions(seg, makeAnomalyReport([]), [], {
      maxActions: 100,
      strikingMinImpressions: STRIKING_MIN_IMPRESSIONS,
    });

    const strikingActions = actions.filter((a) => a.priority === 'A');
    expect(strikingActions[0].query).toBe('a');  // 500
    expect(strikingActions[1].query).toBe('b');  // 300
    expect(strikingActions[2].query).toBe('c');  // 100
  });

  it('includes page in striking distance actions', () => {
    const seg = makeSegmentation([
      { query: 'test query', impressions: 100, position: 12, page: 'https://loreai.dev/blog/test' },
    ]);

    const actions = generateRefreshActions(seg, makeAnomalyReport([]), [], {
      maxActions: 100,
      strikingMinImpressions: STRIKING_MIN_IMPRESSIONS,
    });

    expect(actions[0].page).toBe('https://loreai.dev/blog/test');
  });
});

describe('generateRefreshActions — anomaly → action mapping', () => {
  it('maps high_impressions_low_ctr to Priority B', () => {
    const anomalyReport = makeAnomalyReport([
      { type: 'high_impressions_low_ctr', query: 'test', impressions: 500, priority: 'B' },
    ]);

    const actions = generateRefreshActions(makeSegmentation([]), anomalyReport, [], {
      maxActions: 100,
      strikingMinImpressions: STRIKING_MIN_IMPRESSIONS,
    });

    expect(actions).toHaveLength(1);
    expect(actions[0].priority).toBe('B');
    expect(actions[0].type).toBe('refresh');
  });

  it('maps high_ctr_low_impressions to Priority B', () => {
    const anomalyReport = makeAnomalyReport([
      { type: 'high_ctr_low_impressions', query: 'test', impressions: 10, priority: 'B' },
    ]);

    const actions = generateRefreshActions(makeSegmentation([]), anomalyReport, [], {
      maxActions: 100,
      strikingMinImpressions: STRIKING_MIN_IMPRESSIONS,
    });

    expect(actions).toHaveLength(1);
    expect(actions[0].priority).toBe('B');
  });

  it('maps position_dropping to Priority C', () => {
    const anomalyReport = makeAnomalyReport([
      { type: 'position_dropping', query: 'test', impressions: 200, priority: 'C' },
    ]);

    const actions = generateRefreshActions(makeSegmentation([]), anomalyReport, [], {
      maxActions: 100,
      strikingMinImpressions: STRIKING_MIN_IMPRESSIONS,
    });

    expect(actions).toHaveLength(1);
    expect(actions[0].priority).toBe('C');
  });

  it('new_query anomalies are excluded from anomaly actions (handled via newQueries)', () => {
    const anomalyReport = makeAnomalyReport([
      { type: 'new_query', query: 'new one', impressions: 50, priority: 'E' },
    ]);

    const actions = generateRefreshActions(makeSegmentation([]), anomalyReport, [], {
      maxActions: 100,
      strikingMinImpressions: STRIKING_MIN_IMPRESSIONS,
    });

    // new_query from anomalyReport is skipped — only newQueries param creates E actions
    expect(actions).toHaveLength(0);
  });

  it('maps newQueries to Priority E research actions', () => {
    const newQueries = makeNewQueries([
      { query: 'new query 1', impressions: 100 },
      { query: 'new query 2', impressions: 50 },
    ]);

    const actions = generateRefreshActions(makeSegmentation([]), makeAnomalyReport([]), newQueries, {
      maxActions: 100,
      strikingMinImpressions: STRIKING_MIN_IMPRESSIONS,
    });

    expect(actions).toHaveLength(2);
    expect(actions[0].priority).toBe('E');
    expect(actions[0].type).toBe('research');
  });
});

describe('generateRefreshActions — maxActions limit', () => {
  it('limits output to maxActions', () => {
    // Create many actions to exceed limit
    const strikingQueries = Array.from({ length: 20 }, (_, i) => ({
      query: `striking-${i}`,
      impressions: 100 + i,
      position: 12,
    }));
    const seg = makeSegmentation(strikingQueries);

    const anomalies = Array.from({ length: 50 }, (_, i) => ({
      type: 'high_impressions_low_ctr' as const,
      query: `anomaly-${i}`,
      impressions: 200 + i,
      priority: 'B' as const,
    }));
    const anomalyReport = makeAnomalyReport(anomalies);

    const actions = generateRefreshActions(seg, anomalyReport, [], {
      maxActions: 15,
      strikingMinImpressions: STRIKING_MIN_IMPRESSIONS,
    });

    expect(actions).toHaveLength(15);
  });

  it('preserves priority ordering when limiting', () => {
    const seg = makeSegmentation([
      { query: 'striking-1', impressions: 100, position: 12 },
    ]);
    const anomalyReport = makeAnomalyReport([
      { type: 'high_impressions_low_ctr', query: 'ctr-1', impressions: 200, priority: 'B' },
    ]);
    const newQueries = makeNewQueries([
      { query: 'new-1', impressions: 50 },
    ]);

    const actions = generateRefreshActions(seg, anomalyReport, newQueries, {
      maxActions: 2,
      strikingMinImpressions: STRIKING_MIN_IMPRESSIONS,
    });

    // Should keep A and B, dropping E
    expect(actions).toHaveLength(2);
    expect(actions[0].priority).toBe('A');
    expect(actions[1].priority).toBe('B');
  });
});

describe('generateRefreshActions — mixed priority sorting', () => {
  it('sorts by priority group then by impressions within group', () => {
    const seg = makeSegmentation([
      { query: 'a1', impressions: 100, position: 12 },
      { query: 'a2', impressions: 300, position: 14 },
      { query: 'a3', impressions: 200, position: 16 },
    ]);
    const anomalyReport = makeAnomalyReport([
      { type: 'high_impressions_low_ctr', query: 'b1', impressions: 500, priority: 'B' },
      { type: 'high_impressions_low_ctr', query: 'b2', impressions: 800, priority: 'B' },
      { type: 'high_impressions_low_ctr', query: 'b3', impressions: 300, priority: 'B' },
      { type: 'high_impressions_low_ctr', query: 'b4', impressions: 100, priority: 'B' },
      { type: 'high_impressions_low_ctr', query: 'b5', impressions: 200, priority: 'B' },
      { type: 'position_dropping', query: 'c1', impressions: 150, priority: 'C' },
      { type: 'position_dropping', query: 'c2', impressions: 250, priority: 'C' },
    ]);
    const newQueries = makeNewQueries([
      { query: 'e1', impressions: 30 },
      { query: 'e2', impressions: 60 },
    ]);

    const actions = generateRefreshActions(seg, anomalyReport, newQueries, {
      maxActions: 100,
      strikingMinImpressions: STRIKING_MIN_IMPRESSIONS,
    });

    // Should be: A,A,A, B,B,B,B,B, C,C, E,E
    expect(actions[0].priority).toBe('A');
    expect(actions[1].priority).toBe('A');
    expect(actions[2].priority).toBe('A');
    // A group sorted by impressions desc: a2(300), a3(200), a1(100)
    expect(actions[0].query).toBe('a2');
    expect(actions[1].query).toBe('a3');
    expect(actions[2].query).toBe('a1');

    expect(actions[3].priority).toBe('B');
    expect(actions[7].priority).toBe('B');
    // B group sorted by impressions desc: b2(800), b1(500), b3(300), b5(200), b4(100)
    expect(actions[3].query).toBe('b2');
    expect(actions[4].query).toBe('b1');

    expect(actions[8].priority).toBe('C');
    expect(actions[9].priority).toBe('C');
    // C group sorted: c2(250), c1(150)
    expect(actions[8].query).toBe('c2');

    expect(actions[10].priority).toBe('E');
    expect(actions[11].priority).toBe('E');
    // E group sorted: e2(60), e1(30)
    expect(actions[10].query).toBe('e2');
  });
});

// ── DB Tests (writeActions) ──

describe('writeActions', () => {
  let tmpDir: string;
  let db: typeof import('../db');

  beforeEach(async () => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'loreai-perf-test-'));
    process.env.DB_PATH = path.join(tmpDir, 'test.db');
    vi.resetModules();
    db = await import('../db');
    // Initialize DB
    db.getDb();
  });

  afterEach(() => {
    try { db.closeDb(); } catch { /* ignore */ }
    try { fs.rmSync(tmpDir, { recursive: true }); } catch { /* ignore */ }
    delete process.env.DB_PATH;
  });

  it('writes refresh actions to create_queue', async () => {
    // Re-import performance to pick up the new DB
    vi.resetModules();
    const perf = await import('../performance');

    const actions: RefreshAction[] = [
      {
        type: 'refresh',
        priority: 'A',
        query: 'claude code hooks',
        detail: 'Striking distance',
        suggested_action: 'Improve',
      },
    ];

    const result = perf.writeActions(actions);
    expect(result.queued).toBe(1);
    expect(result.researched).toBe(0);
    expect(result.skippedDedup).toBe(0);

    // Verify in DB
    const database = db.getDb();
    const jobs = database.prepare('SELECT * FROM create_queue').all() as Array<Record<string, unknown>>;
    expect(jobs).toHaveLength(1);
    expect(jobs[0].content_type).toBe('refresh');
    expect(jobs[0].status).toBe('pending');
    expect(jobs[0].priority_score).toBe(10000); // Priority A

    // refresh_meta stores anomaly context
    expect(jobs[0].refresh_meta).toBeTruthy();
    const meta = JSON.parse(jobs[0].refresh_meta as string);
    expect(meta.anomaly_type).toBe('striking_distance');
    expect(meta.suggested_action).toBe('Improve');
  });

  it('deduplicates — skips if pending refresh job exists', async () => {
    const database = db.getDb();

    // Pre-insert a keyword_group and pending refresh job
    database.prepare(
      `INSERT INTO keyword_groups (primary_keyword, intent, content_type, priority_score, status)
       VALUES ('claude code pricing', 'informational', 'refresh', 10000, 'queued')`,
    ).run();
    const groupId = (database.prepare(`SELECT group_id FROM keyword_groups WHERE primary_keyword = 'claude code pricing'`).get() as { group_id: number }).group_id;
    database.prepare(
      `INSERT INTO create_queue (keyword_group_id, content_type, research_pipeline, priority_score, status)
       VALUES (?, 'refresh', 'standard', 10000, 'pending')`,
    ).run(groupId);

    vi.resetModules();
    const perf = await import('../performance');

    const actions: RefreshAction[] = [
      { type: 'refresh', priority: 'A', query: 'claude code pricing', detail: 'test', suggested_action: 'test' },
      { type: 'refresh', priority: 'A', query: 'claude code hooks', detail: 'test', suggested_action: 'test' },
    ];

    const result = perf.writeActions(actions);
    expect(result.queued).toBe(1);         // only "hooks" written
    expect(result.skippedDedup).toBe(1);   // "pricing" skipped
  });

  it('deduplicates — skips if recently completed refresh', async () => {
    const database = db.getDb();

    // Pre-insert a keyword_group and recently completed refresh job
    database.prepare(
      `INSERT INTO keyword_groups (primary_keyword, intent, content_type, priority_score, status)
       VALUES ('claude code vs cursor', 'informational', 'refresh', 10000, 'queued')`,
    ).run();
    const groupId = (database.prepare(`SELECT group_id FROM keyword_groups WHERE primary_keyword = 'claude code vs cursor'`).get() as { group_id: number }).group_id;
    database.prepare(
      `INSERT INTO create_queue (keyword_group_id, content_type, research_pipeline, priority_score, status, completed_at)
       VALUES (?, 'refresh', 'standard', 10000, 'completed', datetime('now', '-3 days'))`,
    ).run(groupId);

    vi.resetModules();
    const perf = await import('../performance');

    const actions: RefreshAction[] = [
      { type: 'refresh', priority: 'A', query: 'claude code vs cursor', detail: 'test', suggested_action: 'test' },
    ];

    const result = perf.writeActions(actions);
    expect(result.queued).toBe(0);
    expect(result.skippedDedup).toBe(1); // within 7-day cooldown
  });

  it('writes Priority E actions to keywords table', async () => {
    vi.resetModules();
    const perf = await import('../performance');

    const actions: RefreshAction[] = [
      { type: 'research', priority: 'E', query: 'new discovery 1', detail: 'test', suggested_action: 'test' },
      { type: 'research', priority: 'E', query: 'new discovery 2', detail: 'test', suggested_action: 'test' },
      { type: 'research', priority: 'E', query: 'new discovery 3', detail: 'test', suggested_action: 'test' },
    ];

    const result = perf.writeActions(actions);
    expect(result.researched).toBe(3);
    expect(result.queued).toBe(0);

    // Verify in keywords table
    const database = db.getDb();
    const keywords = database.prepare(`SELECT * FROM keywords WHERE source = 'gsc'`).all() as Array<Record<string, unknown>>;
    expect(keywords).toHaveLength(3);
    expect(keywords.map((k) => k.keyword)).toContain('new discovery 1');
    expect(keywords.map((k) => k.keyword)).toContain('new discovery 2');
    expect(keywords.map((k) => k.keyword)).toContain('new discovery 3');
  });

  it('creates keyword_group if not exists', async () => {
    vi.resetModules();
    const perf = await import('../performance');

    const actions: RefreshAction[] = [
      { type: 'refresh', priority: 'B', query: 'some new query', detail: 'test', suggested_action: 'test' },
    ];

    const result = perf.writeActions(actions);
    expect(result.queued).toBe(1);

    // Verify keyword_group was created
    const database = db.getDb();
    const group = database.prepare(`SELECT * FROM keyword_groups WHERE primary_keyword = 'some new query'`).get() as Record<string, unknown>;
    expect(group).toBeDefined();
    expect(group.intent).toBe('informational');
    expect(group.content_type).toBe('refresh');
    expect(group.priority_score).toBe(5000); // Priority B
  });

  it('uses existing keyword_group if found', async () => {
    const database = db.getDb();

    // Pre-insert keyword_group
    database.prepare(
      `INSERT INTO keyword_groups (primary_keyword, intent, content_type, priority_score, status, cluster_slug)
       VALUES ('existing query', 'transactional', 'compare', 8000, 'scored', 'claude-code')`,
    ).run();

    vi.resetModules();
    const perf = await import('../performance');

    const actions: RefreshAction[] = [
      { type: 'refresh', priority: 'A', query: 'existing query', detail: 'test', suggested_action: 'test' },
    ];

    const result = perf.writeActions(actions);
    expect(result.queued).toBe(1);

    // Should NOT have created a second keyword_group
    const groups = database.prepare(`SELECT * FROM keyword_groups WHERE primary_keyword = 'existing query'`).all();
    expect(groups).toHaveLength(1);
  });
});

// ── GSC Detection in Performance Context ──

describe('GSC detection functions (performance context)', () => {
  // These import from gsc.ts directly to verify the pure functions work
  // in the context Performance Loop uses them.

  it('segmentByPosition — boundary values', async () => {
    const { segmentByPosition: segFn } = await import('../gsc');

    const rows = [
      { keys: ['q1'], clicks: 1, impressions: 10, ctr: 0.1, position: 3.0 },   // defending
      { keys: ['q2'], clicks: 1, impressions: 10, ctr: 0.1, position: 3.1 },   // page_one
      { keys: ['q3'], clicks: 1, impressions: 10, ctr: 0.1, position: 10.0 },  // page_one
      { keys: ['q4'], clicks: 1, impressions: 10, ctr: 0.1, position: 10.1 },  // striking
      { keys: ['q5'], clicks: 1, impressions: 10, ctr: 0.1, position: 20.0 },  // striking
      { keys: ['q6'], clicks: 1, impressions: 10, ctr: 0.1, position: 20.1 },  // building
      { keys: ['q7'], clicks: 1, impressions: 10, ctr: 0.1, position: 50.0 },  // building
      { keys: ['q8'], clicks: 1, impressions: 10, ctr: 0.1, position: 50.1 },  // long_shot
    ];

    const result = segFn(rows);

    expect(result.segments.defending.count).toBe(1);   // q1 (pos 3.0)
    expect(result.segments.page_one.count).toBe(2);    // q2 (3.1), q3 (10.0)
    expect(result.segments.striking.count).toBe(2);    // q4 (10.1), q5 (20.0)
    expect(result.segments.building.count).toBe(2);    // q6 (20.1), q7 (50.0)
    expect(result.segments.long_shot.count).toBe(1);   // q8 (50.1)
  });

  it('detectAnomalies — high impressions + low CTR', async () => {
    const { detectAnomalies: detectFn } = await import('../gsc');

    const current: GSCQueryResult = {
      rows: [{ keys: ['claude code tutorial'], clicks: 5, impressions: 500, ctr: 0.01, position: 8 }],
      startDate: '2026-02-17',
      endDate: '2026-03-17',
      totalRows: 1,
    };
    const previous: GSCQueryResult = {
      rows: [{ keys: ['claude code tutorial'], clicks: 6, impressions: 400, ctr: 0.015, position: 7 }],
      startDate: '2026-01-20',
      endDate: '2026-02-16',
      totalRows: 1,
    };

    const report = detectFn(current, previous);
    expect(report.summary.high_impressions_low_ctr).toBe(1);
    expect(report.anomalies[0].query).toBe('claude code tutorial');
  });

  it('detectAnomalies — position dropping', async () => {
    const { detectAnomalies: detectFn } = await import('../gsc');

    const current: GSCQueryResult = {
      rows: [{ keys: ['claude code pricing'], clicks: 2, impressions: 100, ctr: 0.02, position: 18 }],
      startDate: '2026-02-17',
      endDate: '2026-03-17',
      totalRows: 1,
    };
    const previous: GSCQueryResult = {
      rows: [{ keys: ['claude code pricing'], clicks: 10, impressions: 200, ctr: 0.05, position: 8 }],
      startDate: '2026-01-20',
      endDate: '2026-02-16',
      totalRows: 1,
    };

    const report = detectFn(current, previous);
    expect(report.summary.position_dropping).toBe(1);
    expect(report.anomalies.find((a) => a.type === 'position_dropping')?.query).toBe('claude code pricing');
  });

  it('detectAnomalies — position dropping NOT triggered when previous > 20', async () => {
    const { detectAnomalies: detectFn } = await import('../gsc');

    const current: GSCQueryResult = {
      rows: [{ keys: ['obscure query'], clicks: 0, impressions: 10, ctr: 0, position: 35 }],
      startDate: '2026-02-17',
      endDate: '2026-03-17',
      totalRows: 1,
    };
    const previous: GSCQueryResult = {
      rows: [{ keys: ['obscure query'], clicks: 0, impressions: 15, ctr: 0, position: 28 }],
      startDate: '2026-01-20',
      endDate: '2026-02-16',
      totalRows: 1,
    };

    const report = detectFn(current, previous);
    expect(report.summary.position_dropping).toBe(0);
  });

  it('findNewQueries — correctly identifies new queries sorted by impressions', async () => {
    const { findNewQueries: findFn } = await import('../gsc');

    const current: GSCQueryResult = {
      rows: [
        { keys: ['a'], clicks: 1, impressions: 50, ctr: 0.02, position: 10 },
        { keys: ['b'], clicks: 2, impressions: 100, ctr: 0.02, position: 8 },
        { keys: ['c'], clicks: 3, impressions: 200, ctr: 0.015, position: 5 },
      ],
      startDate: '2026-02-17',
      endDate: '2026-03-17',
      totalRows: 3,
    };
    const previous: GSCQueryResult = {
      rows: [
        { keys: ['a'], clicks: 1, impressions: 40, ctr: 0.025, position: 11 },
        { keys: ['b'], clicks: 2, impressions: 80, ctr: 0.025, position: 9 },
      ],
      startDate: '2026-01-20',
      endDate: '2026-02-16',
      totalRows: 2,
    };

    const newQueries = findFn(current, previous);
    expect(newQueries).toHaveLength(1);
    expect(newQueries[0].query).toBe('c');
    expect(newQueries[0].impressions).toBe(200);
  });
});

describe('generateRefreshActions — empty inputs', () => {
  it('returns empty array when no data', () => {
    const actions = generateRefreshActions(
      makeSegmentation([]),
      makeAnomalyReport([]),
      [],
      { maxActions: 30, strikingMinImpressions: STRIKING_MIN_IMPRESSIONS },
    );
    expect(actions).toHaveLength(0);
  });
});
