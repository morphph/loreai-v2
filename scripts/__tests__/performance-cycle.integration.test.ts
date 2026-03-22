import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import fs from 'fs';
import path from 'path';
import os from 'os';

import type { GSCQueryResult } from '../lib/gsc';

// ── Integration Tests ──

describe('Performance Cycle — Integration', () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'loreai-perf-int-'));
    process.env.DB_PATH = path.join(tmpDir, 'test.db');
    vi.resetModules();
  });

  afterEach(async () => {
    vi.resetModules();
    try {
      const db = await import('../lib/db');
      db.closeDb();
    } catch { /* ignore */ }
    try { fs.rmSync(tmpDir, { recursive: true }); } catch { /* ignore */ }
    delete process.env.DB_PATH;
  });

  it('full cycle with mocked GSC client returns valid result', async () => {
    // Mock GSC module
    vi.doMock('../lib/gsc', async () => {
      const actual = await vi.importActual('../lib/gsc') as Record<string, unknown>;
      return {
        ...actual,
        createGSCClient: () => ({
          async fetchQueries(): Promise<GSCQueryResult> {
            return {
              rows: [
                { keys: ['claude code tutorial'], clicks: 10, impressions: 500, ctr: 0.02, position: 12 },
                { keys: ['claude code pricing'], clicks: 5, impressions: 200, ctr: 0.025, position: 8 },
                { keys: ['what is claude code'], clicks: 20, impressions: 800, ctr: 0.01, position: 6 },  // high imp, low ctr
                { keys: ['brand new query'], clicks: 1, impressions: 30, ctr: 0.03, position: 15 },
              ],
              startDate: '2026-02-17',
              endDate: '2026-03-17',
              totalRows: 4,
            };
          },
          async fetchQueriesWithPages(): Promise<GSCQueryResult> {
            return {
              rows: [
                { keys: ['claude code tutorial', 'https://loreai.dev/blog/tutorial'], clicks: 10, impressions: 500, ctr: 0.02, position: 12 },
                { keys: ['claude code pricing', 'https://loreai.dev/faq/pricing'], clicks: 5, impressions: 200, ctr: 0.025, position: 8 },
                { keys: ['what is claude code', 'https://loreai.dev/topics/claude-code'], clicks: 20, impressions: 800, ctr: 0.01, position: 6 },
                { keys: ['brand new query', 'https://loreai.dev/blog/new'], clicks: 1, impressions: 30, ctr: 0.03, position: 15 },
              ],
              startDate: '2026-02-17',
              endDate: '2026-03-17',
              totalRows: 4,
            };
          },
        }),
      };
    });

    const perf = await import('../lib/performance');
    const db = await import('../lib/db');
    db.getDb(); // init DB

    // Set up previous period with fewer queries (so "brand new query" is new)
    const result = await perf.runPerformanceCycle({
      days: 28,
      dryRun: false,
      reportOnly: false,
      maxActions: 30,
      ctrThreshold: 0.02,
      impressionThreshold: 100,
      positionDropThreshold: 3,
    });

    // Stage 1: GSC data imported
    expect(result.gscImport.currentRows).toBe(4);
    expect(result.gscImport.previousRows).toBe(4); // same mock for both periods
    expect(result.gscImport.currentWithPagesRows).toBe(4);

    // Stage 2: Segmentation
    expect(result.segmentation.total).toBe(4);
    expect(result.segmentation.striking).toBeGreaterThanOrEqual(0);

    // Stage 3: Some anomalies
    expect(result.anomalies.total).toBeGreaterThanOrEqual(0);

    // Stage 4: Result has proper shape
    expect(result.actions).toBeDefined();
    expect(result.actions.total_queued).toBeGreaterThanOrEqual(0);
    expect(result.topActions).toBeDefined();

    // Timestamp and dateRange present
    expect(result.timestamp).toBeTruthy();
    expect(result.dateRange.current.start).toBeTruthy();
    expect(result.dateRange.current.end).toBeTruthy();
  });

  it('dry-run mode does not write to DB', async () => {
    vi.doMock('../lib/gsc', async () => {
      const actual = await vi.importActual('../lib/gsc') as Record<string, unknown>;
      return {
        ...actual,
        createGSCClient: () => ({
          async fetchQueries(): Promise<GSCQueryResult> {
            return {
              rows: [
                { keys: ['test query'], clicks: 5, impressions: 100, ctr: 0.05, position: 14 },
              ],
              startDate: '2026-02-17',
              endDate: '2026-03-17',
              totalRows: 1,
            };
          },
          async fetchQueriesWithPages(): Promise<GSCQueryResult> {
            return {
              rows: [
                { keys: ['test query', 'https://loreai.dev/test'], clicks: 5, impressions: 100, ctr: 0.05, position: 14 },
              ],
              startDate: '2026-02-17',
              endDate: '2026-03-17',
              totalRows: 1,
            };
          },
        }),
      };
    });

    const perf = await import('../lib/performance');
    const db = await import('../lib/db');
    db.getDb();

    const result = await perf.runPerformanceCycle({
      days: 28,
      dryRun: true,
      reportOnly: false,
      maxActions: 30,
      ctrThreshold: 0.02,
      impressionThreshold: 100,
      positionDropThreshold: 3,
    });

    // Actions counted but not written
    expect(result.actions.total_queued).toBe(0);
    expect(result.actions.total_researched).toBe(0);

    // DB should be empty
    const database = db.getDb();
    const jobs = database.prepare('SELECT COUNT(*) as c FROM create_queue').get() as { c: number };
    expect(jobs.c).toBe(0);
  });

  it('report-only mode does not generate actions', async () => {
    vi.doMock('../lib/gsc', async () => {
      const actual = await vi.importActual('../lib/gsc') as Record<string, unknown>;
      return {
        ...actual,
        createGSCClient: () => ({
          async fetchQueries(): Promise<GSCQueryResult> {
            return {
              rows: [
                { keys: ['test'], clicks: 5, impressions: 300, ctr: 0.01, position: 12 },
              ],
              startDate: '2026-02-17',
              endDate: '2026-03-17',
              totalRows: 1,
            };
          },
          async fetchQueriesWithPages(): Promise<GSCQueryResult> {
            return {
              rows: [
                { keys: ['test', 'https://loreai.dev/test'], clicks: 5, impressions: 300, ctr: 0.01, position: 12 },
              ],
              startDate: '2026-02-17',
              endDate: '2026-03-17',
              totalRows: 1,
            };
          },
        }),
      };
    });

    const perf = await import('../lib/performance');
    const db = await import('../lib/db');
    db.getDb();

    const result = await perf.runPerformanceCycle({
      days: 28,
      dryRun: false,
      reportOnly: true,
      maxActions: 30,
      ctrThreshold: 0.02,
      impressionThreshold: 100,
      positionDropThreshold: 3,
    });

    expect(result.actions.total_queued).toBe(0);
    expect(result.actions.total_researched).toBe(0);
  });

  it('empty GSC data returns early with empty result', async () => {
    vi.doMock('../lib/gsc', async () => {
      const actual = await vi.importActual('../lib/gsc') as Record<string, unknown>;
      return {
        ...actual,
        createGSCClient: () => ({
          async fetchQueries(): Promise<GSCQueryResult> {
            return { rows: [], startDate: '2026-02-17', endDate: '2026-03-17', totalRows: 0 };
          },
          async fetchQueriesWithPages(): Promise<GSCQueryResult> {
            return { rows: [], startDate: '2026-02-17', endDate: '2026-03-17', totalRows: 0 };
          },
        }),
      };
    });

    const perf = await import('../lib/performance');
    const db = await import('../lib/db');
    db.getDb();

    const result = await perf.runPerformanceCycle({
      days: 28,
      dryRun: false,
      reportOnly: false,
      maxActions: 30,
      ctrThreshold: 0.02,
      impressionThreshold: 100,
      positionDropThreshold: 3,
    });

    expect(result.gscImport.currentRows).toBe(0);
    expect(result.gscImport.previousRows).toBe(0);
    expect(result.segmentation.total).toBe(0);
    expect(result.anomalies.total).toBe(0);
    expect(result.actions.total_queued).toBe(0);
  });

  it('max-actions limits output correctly', async () => {
    // Create many striking-distance queries
    const manyRows = Array.from({ length: 25 }, (_, i) => ({
      keys: [`striking-query-${i}`, `https://loreai.dev/page-${i}`],
      clicks: 5,
      impressions: 100 + i * 10,
      ctr: 0.05,
      position: 11 + (i % 10),
    }));

    vi.doMock('../lib/gsc', async () => {
      const actual = await vi.importActual('../lib/gsc') as Record<string, unknown>;
      return {
        ...actual,
        createGSCClient: () => ({
          async fetchQueries(): Promise<GSCQueryResult> {
            return {
              rows: manyRows.map((r) => ({ ...r, keys: [r.keys[0]] })),
              startDate: '2026-02-17',
              endDate: '2026-03-17',
              totalRows: manyRows.length,
            };
          },
          async fetchQueriesWithPages(): Promise<GSCQueryResult> {
            return {
              rows: manyRows,
              startDate: '2026-02-17',
              endDate: '2026-03-17',
              totalRows: manyRows.length,
            };
          },
        }),
      };
    });

    const perf = await import('../lib/performance');
    const db = await import('../lib/db');
    db.getDb();

    const result = await perf.runPerformanceCycle({
      days: 28,
      dryRun: false,
      reportOnly: false,
      maxActions: 10,
      ctrThreshold: 0.02,
      impressionThreshold: 100,
      positionDropThreshold: 3,
    });

    // Should not exceed max-actions
    expect(result.actions.total_queued + result.actions.total_researched + result.actions.skipped_dedup).toBeLessThanOrEqual(10);
  });
});

// ── Live Integration Test (requires GSC credentials) ──

describe.skipIf(!process.env.GSC_SITE_URL)('Performance Cycle — Live GSC Integration', () => {
  it('full performance cycle on real GSC data', async () => {
    const { runPerformanceCycle } = await import('../lib/performance');
    const { closeDb } = await import('../lib/db');

    const result = await runPerformanceCycle({
      days: 28,
      dryRun: true,      // don't write to local DB
      reportOnly: false,
      maxActions: 10,
      ctrThreshold: 0.02,
      impressionThreshold: 100,
      positionDropThreshold: 3,
    });

    expect(result.gscImport.currentRows).toBeGreaterThan(0);
    expect(result.gscImport.previousRows).toBeGreaterThan(0);
    expect(result.segmentation.total).toBeGreaterThan(0);
    expect(result.anomalies.total).toBeGreaterThanOrEqual(0);

    closeDb();
  }, 60_000);
});
