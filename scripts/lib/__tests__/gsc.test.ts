import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  segmentByPosition,
  detectAnomalies,
  findNewQueries,
  GSCAPIError,
  GSCAuthError,
  createGSCClient,
} from '../gsc';
import type { GSCRow, GSCQueryResult } from '../gsc';

// ── Helpers ──

function makeRow(query: string, position: number, overrides?: Partial<GSCRow>): GSCRow {
  return {
    clicks: overrides?.clicks ?? 10,
    impressions: overrides?.impressions ?? 100,
    ctr: overrides?.ctr ?? 0.10,
    position,
    ...overrides,
    keys: overrides?.keys ?? [query],
  };
}

function makeResult(rows: GSCRow[], start = '2026-03-06', end = '2026-03-12'): GSCQueryResult {
  return { rows, startDate: start, endDate: end, totalRows: rows.length };
}

// ── segmentByPosition ──

describe('segmentByPosition', () => {
  it('correctly assigns "defending" for position 1-3', () => {
    const rows = [makeRow('test query', 2.1)];
    const result = segmentByPosition(rows);

    expect(result.segments.defending.count).toBe(1);
    expect(result.segments.defending.queries[0].segment).toBe('defending');
    expect(result.segments.defending.queries[0].query).toBe('test query');
  });

  it('correctly assigns "page_one" for position 4-10', () => {
    const rows = [makeRow('page one query', 7.5)];
    const result = segmentByPosition(rows);

    expect(result.segments.page_one.count).toBe(1);
    expect(result.segments.page_one.queries[0].segment).toBe('page_one');
  });

  it('correctly assigns "striking" for position 11-20', () => {
    const rows = [makeRow('striking query', 14.3)];
    const result = segmentByPosition(rows);

    expect(result.segments.striking.count).toBe(1);
    expect(result.segments.striking.queries[0].segment).toBe('striking');
  });

  it('correctly assigns "building" for position 21-50', () => {
    const rows = [makeRow('building query', 35.0)];
    const result = segmentByPosition(rows);

    expect(result.segments.building.count).toBe(1);
    expect(result.segments.building.queries[0].segment).toBe('building');
  });

  it('correctly assigns "long_shot" for position 50+', () => {
    const rows = [makeRow('long shot query', 72.0)];
    const result = segmentByPosition(rows);

    expect(result.segments.long_shot.count).toBe(1);
    expect(result.segments.long_shot.queries[0].segment).toBe('long_shot');
  });

  it('boundary: position exactly 3.0 → defending', () => {
    const rows = [makeRow('boundary 3', 3.0)];
    const result = segmentByPosition(rows);
    expect(result.segments.defending.count).toBe(1);
  });

  it('boundary: position exactly 10.0 → page_one', () => {
    const rows = [makeRow('boundary 10', 10.0)];
    const result = segmentByPosition(rows);
    expect(result.segments.page_one.count).toBe(1);
  });

  it('boundary: position exactly 20.0 → striking', () => {
    const rows = [makeRow('boundary 20', 20.0)];
    const result = segmentByPosition(rows);
    expect(result.segments.striking.count).toBe(1);
  });

  it('boundary: position exactly 50.0 → building', () => {
    const rows = [makeRow('boundary 50', 50.0)];
    const result = segmentByPosition(rows);
    expect(result.segments.building.count).toBe(1);
  });

  it('computes aggregate stats per segment correctly', () => {
    const rows = [
      makeRow('q1', 2.0, { clicks: 20, impressions: 200, ctr: 0.10 }),
      makeRow('q2', 1.5, { clicks: 30, impressions: 300, ctr: 0.10 }),
      makeRow('q3', 15.0, { clicks: 5, impressions: 500, ctr: 0.01 }),
    ];
    const result = segmentByPosition(rows);

    const defending = result.segments.defending;
    expect(defending.count).toBe(2);
    expect(defending.totalClicks).toBe(50);
    expect(defending.totalImpressions).toBe(500);
    expect(defending.avgCtr).toBeCloseTo(0.10);
    expect(defending.avgPosition).toBeCloseTo(1.75);

    const striking = result.segments.striking;
    expect(striking.count).toBe(1);
    expect(striking.totalClicks).toBe(5);
  });

  it('returns all segments with count 0 for empty input', () => {
    const result = segmentByPosition([]);

    expect(result.totalQueries).toBe(0);
    expect(result.segments.defending.count).toBe(0);
    expect(result.segments.page_one.count).toBe(0);
    expect(result.segments.striking.count).toBe(0);
    expect(result.segments.building.count).toBe(0);
    expect(result.segments.long_shot.count).toBe(0);
  });

  it('includes page from keys[1] when available', () => {
    const rows: GSCRow[] = [{
      keys: ['test query', 'https://loreai.dev/test'],
      clicks: 10,
      impressions: 100,
      ctr: 0.10,
      position: 5.0,
    }];
    const result = segmentByPosition(rows);
    expect(result.segments.page_one.queries[0].page).toBe('https://loreai.dev/test');
  });

  it('sets dateRange when provided', () => {
    const result = segmentByPosition([], { start: '2026-03-01', end: '2026-03-07' });
    expect(result.dateRange).toEqual({ start: '2026-03-01', end: '2026-03-07' });
  });
});

// ── detectAnomalies ──

describe('detectAnomalies', () => {
  it('detects high impressions + low CTR', () => {
    const current = makeResult([
      makeRow('bad ctr query', 5.0, { impressions: 500, ctr: 0.01, clicks: 5 }),
    ]);
    const previous = makeResult([
      makeRow('bad ctr query', 5.0, { impressions: 400, ctr: 0.02, clicks: 8 }),
    ], '2026-02-27', '2026-03-05');

    const report = detectAnomalies(current, previous);

    expect(report.anomalies.length).toBeGreaterThanOrEqual(1);
    const anomaly = report.anomalies.find((a) => a.type === 'high_impressions_low_ctr');
    expect(anomaly).toBeDefined();
    expect(anomaly!.priority).toBe('B');
    expect(anomaly!.query).toBe('bad ctr query');
    expect(report.summary.high_impressions_low_ctr).toBe(1);
  });

  it('detects high CTR + low impressions', () => {
    const current = makeResult([
      makeRow('niche query', 8.0, { impressions: 10, ctr: 0.15, clicks: 2 }),
    ]);
    const previous = makeResult([
      makeRow('niche query', 8.0, { impressions: 12, ctr: 0.12, clicks: 1 }),
    ], '2026-02-27', '2026-03-05');

    const report = detectAnomalies(current, previous);

    const anomaly = report.anomalies.find((a) => a.type === 'high_ctr_low_impressions');
    expect(anomaly).toBeDefined();
    expect(anomaly!.suggestedAction).toContain('internal links');
  });

  it('detects position dropping', () => {
    const current = makeResult([
      makeRow('dropping query', 15.0, { clicks: 5, impressions: 100, ctr: 0.05 }),
    ]);
    const previous = makeResult([
      makeRow('dropping query', 8.0, { clicks: 20, impressions: 200, ctr: 0.10 }),
    ], '2026-02-27', '2026-03-05');

    const report = detectAnomalies(current, previous);

    const anomaly = report.anomalies.find((a) => a.type === 'position_dropping');
    expect(anomaly).toBeDefined();
    expect(anomaly!.priority).toBe('C');
    expect(anomaly!.previous).toBeDefined();
    expect(anomaly!.previous!.position).toBe(8.0);
  });

  it('ignores small position change (< threshold)', () => {
    const current = makeResult([
      makeRow('stable query', 9.0, { clicks: 10, impressions: 100, ctr: 0.10 }),
    ]);
    const previous = makeResult([
      makeRow('stable query', 8.0, { clicks: 12, impressions: 110, ctr: 0.11 }),
    ], '2026-02-27', '2026-03-05');

    const report = detectAnomalies(current, previous);

    const positionAnomalies = report.anomalies.filter((a) => a.type === 'position_dropping');
    expect(positionAnomalies).toHaveLength(0);
  });

  it('ignores position drop for low-rank queries (prev > 20)', () => {
    const current = makeResult([
      makeRow('low rank query', 55.0, { clicks: 1, impressions: 10, ctr: 0.10 }),
    ]);
    const previous = makeResult([
      makeRow('low rank query', 45.0, { clicks: 2, impressions: 15, ctr: 0.13 }),
    ], '2026-02-27', '2026-03-05');

    const report = detectAnomalies(current, previous);

    const positionAnomalies = report.anomalies.filter((a) => a.type === 'position_dropping');
    expect(positionAnomalies).toHaveLength(0);
  });

  it('detects new query', () => {
    const current = makeResult([
      makeRow('brand new query', 12.0, { clicks: 3, impressions: 50, ctr: 0.06 }),
    ]);
    const previous = makeResult([], '2026-02-27', '2026-03-05');

    const report = detectAnomalies(current, previous);

    const anomaly = report.anomalies.find((a) => a.type === 'new_query');
    expect(anomaly).toBeDefined();
    expect(anomaly!.priority).toBe('E');
  });

  it('respects custom thresholds', () => {
    const current = makeResult([
      // Would be "high_impressions_low_ctr" with defaults (impressions=500, ctr=0.015)
      // but not with custom impressionThresholdHigh=1000
      makeRow('custom threshold', 5.0, { impressions: 500, ctr: 0.015, clicks: 8 }),
    ]);
    const previous = makeResult([
      makeRow('custom threshold', 5.0, { impressions: 500, ctr: 0.02, clicks: 10 }),
    ], '2026-02-27', '2026-03-05');

    const report = detectAnomalies(current, previous, {
      impressionThresholdHigh: 1000,
    });

    const ctrAnomalies = report.anomalies.filter((a) => a.type === 'high_impressions_low_ctr');
    expect(ctrAnomalies).toHaveLength(0);
  });

  it('returns no anomalies for stable data', () => {
    const current = makeResult([
      makeRow('stable', 5.0, { clicks: 10, impressions: 50, ctr: 0.20 }),
    ]);
    const previous = makeResult([
      makeRow('stable', 5.0, { clicks: 10, impressions: 50, ctr: 0.20 }),
    ], '2026-02-27', '2026-03-05');

    const report = detectAnomalies(current, previous);

    expect(report.anomalies).toHaveLength(0);
  });

  it('summary counts are correct with multiple anomalies', () => {
    const current = makeResult([
      makeRow('bad ctr', 5.0, { impressions: 500, ctr: 0.01, clicks: 5 }),
      makeRow('new q1', 12.0, { clicks: 3, impressions: 50, ctr: 0.06 }),
      makeRow('new q2', 18.0, { clicks: 1, impressions: 20, ctr: 0.05 }),
    ]);
    const previous = makeResult([
      makeRow('bad ctr', 5.0, { impressions: 400, ctr: 0.02, clicks: 8 }),
    ], '2026-02-27', '2026-03-05');

    const report = detectAnomalies(current, previous);

    expect(report.summary.high_impressions_low_ctr).toBe(1);
    expect(report.summary.new_query).toBe(2);
  });

  it('includes correct dateRange in report', () => {
    const current = makeResult([], '2026-03-06', '2026-03-12');
    const previous = makeResult([], '2026-02-27', '2026-03-05');

    const report = detectAnomalies(current, previous);

    expect(report.dateRange.current).toEqual({ start: '2026-03-06', end: '2026-03-12' });
    expect(report.dateRange.previous).toEqual({ start: '2026-02-27', end: '2026-03-05' });
  });
});

// ── findNewQueries ──

describe('findNewQueries', () => {
  it('finds queries in current but not in previous', () => {
    const current = makeResult([
      makeRow('claude code tips', 8.0, { clicks: 5, impressions: 100, ctr: 0.05 }),
      makeRow('existing query', 3.0, { clicks: 20, impressions: 200, ctr: 0.10 }),
    ]);
    const previous = makeResult([
      makeRow('existing query', 3.0, { clicks: 18, impressions: 190, ctr: 0.09 }),
    ], '2026-02-27', '2026-03-05');

    const result = findNewQueries(current, previous);

    expect(result).toHaveLength(1);
    expect(result[0].query).toBe('claude code tips');
    expect(result[0].firstSeen).toBe('2026-03-06');
  });

  it('excludes queries that exist in both periods', () => {
    const current = makeResult([
      makeRow('shared query', 5.0),
    ]);
    const previous = makeResult([
      makeRow('shared query', 6.0),
    ], '2026-02-27', '2026-03-05');

    const result = findNewQueries(current, previous);

    expect(result).toHaveLength(0);
  });

  it('sorts by impressions descending', () => {
    const current = makeResult([
      makeRow('low imp', 10.0, { impressions: 10 }),
      makeRow('high imp', 10.0, { impressions: 500 }),
      makeRow('mid imp', 10.0, { impressions: 100 }),
    ]);
    const previous = makeResult([], '2026-02-27', '2026-03-05');

    const result = findNewQueries(current, previous);

    expect(result).toHaveLength(3);
    expect(result[0].query).toBe('high imp');
    expect(result[1].query).toBe('mid imp');
    expect(result[2].query).toBe('low imp');
  });

  it('returns empty when no new queries', () => {
    const rows = [makeRow('q1', 5.0), makeRow('q2', 10.0)];
    const current = makeResult(rows);
    const previous = makeResult(rows, '2026-02-27', '2026-03-05');

    const result = findNewQueries(current, previous);

    expect(result).toHaveLength(0);
  });

  it('returns all queries when previous is empty', () => {
    const current = makeResult([
      makeRow('q1', 5.0),
      makeRow('q2', 10.0),
    ]);
    const previous = makeResult([], '2026-02-27', '2026-03-05');

    const result = findNewQueries(current, previous);

    expect(result).toHaveLength(2);
  });
});

// ── Error Classes ──

describe('GSCAPIError', () => {
  it('has correct properties', () => {
    const err = new GSCAPIError(403, 'Forbidden');
    expect(err.status).toBe(403);
    expect(err.body).toBe('Forbidden');
    expect(err.name).toBe('GSCAPIError');
    expect(err.message).toBe('GSC API error 403: Forbidden');
  });
});

describe('GSCAuthError', () => {
  it('has correct properties', () => {
    const err = new GSCAuthError('No credentials provided');
    expect(err.name).toBe('GSCAuthError');
    expect(err.message).toBe('GSC auth error: No credentials provided');
  });
});

// ── createGSCClient (noop behavior) ──

describe('createGSCClient', () => {
  beforeEach(() => {
    // Ensure env vars are not set
    delete process.env.GSC_SITE_URL;
    delete process.env.GSC_SERVICE_ACCOUNT_KEY_PATH;
    delete process.env.GSC_CLIENT_EMAIL;
    delete process.env.GSC_PRIVATE_KEY;
  });

  it('returns noop client when GSC_SITE_URL is not set', async () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const client = createGSCClient();

    const result = await client.fetchQueries({
      startDate: '2026-03-06',
      endDate: '2026-03-12',
    });

    expect(result.rows).toEqual([]);
    expect(result.totalRows).toBe(0);
    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('GSC_SITE_URL'));
    warnSpy.mockRestore();
  });

  it('returns noop client when credentials are missing', async () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const client = createGSCClient({ siteUrl: 'sc-domain:loreai.dev' });

    const result = await client.fetchQueriesWithPages({
      startDate: '2026-03-06',
      endDate: '2026-03-12',
    });

    expect(result.rows).toEqual([]);
    expect(result.totalRows).toBe(0);
    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('credentials'));
    warnSpy.mockRestore();
  });

  it('noop client preserves date params in response', async () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const client = createGSCClient();

    const result = await client.fetchQueries({
      startDate: '2026-03-01',
      endDate: '2026-03-07',
    });

    expect(result.startDate).toBe('2026-03-01');
    expect(result.endDate).toBe('2026-03-07');
    warnSpy.mockRestore();
  });
});
