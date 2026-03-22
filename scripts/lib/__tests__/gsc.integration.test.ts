import { describe, it, expect, beforeAll } from 'vitest';
import {
  createGSCClient,
  segmentByPosition,
  detectAnomalies,
  findNewQueries,
} from '../gsc';
import type { GSCClient } from '../gsc';

/**
 * Integration tests — hit real Google Search Console API.
 * Only run when GSC_SERVICE_ACCOUNT_KEY_PATH and GSC_SITE_URL are set.
 *
 * Usage:
 *   GSC_SERVICE_ACCOUNT_KEY_PATH=./gsc-key.json GSC_SITE_URL=sc-domain:loreai.dev \
 *     npm test -- scripts/lib/__tests__/gsc.integration.test.ts
 */

const describeIfGSC = process.env.GSC_SERVICE_ACCOUNT_KEY_PATH ? describe : describe.skip;

describeIfGSC('gsc integration', () => {
  let client: GSCClient;

  // Use dates with 3-day lag to ensure data availability
  const endDate = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  const startDate = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  const prevEndDate = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  const prevStartDate = new Date(Date.now() - 17 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

  beforeAll(() => {
    client = createGSCClient();
  });

  it('fetches queries for last 7 days', async () => {
    const result = await client.fetchQueries({
      startDate,
      endDate,
      dimensions: ['query'],
    });

    expect(result.rows.length).toBeGreaterThan(0);
    expect(result.startDate).toBe(startDate);
    expect(result.endDate).toBe(endDate);
    expect(result.rows[0]).toHaveProperty('keys');
    expect(result.rows[0]).toHaveProperty('clicks');
    expect(result.rows[0]).toHaveProperty('impressions');
    expect(result.rows[0]).toHaveProperty('ctr');
    expect(result.rows[0]).toHaveProperty('position');
  }, 30_000);

  it('fetches queries with page dimension', async () => {
    const result = await client.fetchQueriesWithPages({
      startDate,
      endDate,
    });

    expect(result.rows.length).toBeGreaterThan(0);
    // keys[0] = query, keys[1] = page URL
    expect(result.rows[0].keys.length).toBe(2);
    expect(result.rows[0].keys[1]).toMatch(/^https?:\/\//);
  }, 30_000);

  it('fetches queries with filter', async () => {
    const result = await client.fetchQueries({
      startDate,
      endDate,
      dimensions: ['query'],
      filters: [{
        dimension: 'query',
        operator: 'contains',
        expression: 'claude',
      }],
    });

    // May or may not have results depending on site data
    for (const row of result.rows) {
      expect(row.keys[0].toLowerCase()).toContain('claude');
    }
  }, 30_000);

  it('segments real data by position', async () => {
    const result = await client.fetchQueries({
      startDate,
      endDate,
      dimensions: ['query'],
    });

    const segments = segmentByPosition(result.rows, { start: startDate, end: endDate });

    expect(segments.totalQueries).toBeGreaterThan(0);
    // At least one segment should be non-empty
    const totalFromSegments = Object.values(segments.segments).reduce((sum, s) => sum + s.count, 0);
    expect(totalFromSegments).toBe(segments.totalQueries);
  }, 30_000);

  it('detects anomalies comparing two periods', async () => {
    const current = await client.fetchQueries({
      startDate,
      endDate,
      dimensions: ['query'],
    });

    const previous = await client.fetchQueries({
      startDate: prevStartDate,
      endDate: prevEndDate,
      dimensions: ['query'],
    });

    const report = detectAnomalies(current, previous);

    // Report structure is correct regardless of whether anomalies exist
    expect(report.dateRange.current).toEqual({ start: startDate, end: endDate });
    expect(report.dateRange.previous).toEqual({ start: prevStartDate, end: prevEndDate });
    expect(report.summary).toHaveProperty('high_impressions_low_ctr');
    expect(report.summary).toHaveProperty('position_dropping');
    expect(report.summary).toHaveProperty('new_query');
  }, 60_000);

  it('finds new queries comparing two periods', async () => {
    const current = await client.fetchQueries({
      startDate,
      endDate,
      dimensions: ['query'],
    });

    const previous = await client.fetchQueries({
      startDate: prevStartDate,
      endDate: prevEndDate,
      dimensions: ['query'],
    });

    const newQueries = findNewQueries(current, previous);

    // Structure is correct
    for (const q of newQueries) {
      expect(q).toHaveProperty('query');
      expect(q).toHaveProperty('clicks');
      expect(q).toHaveProperty('impressions');
      expect(q).toHaveProperty('position');
      expect(q).toHaveProperty('firstSeen');
    }

    // Should be sorted by impressions desc
    for (let i = 1; i < newQueries.length; i++) {
      expect(newQueries[i].impressions).toBeLessThanOrEqual(newQueries[i - 1].impressions);
    }
  }, 60_000);

  it('pagination works with small rowLimit', async () => {
    const small = await client.fetchQueries({
      startDate,
      endDate,
      dimensions: ['query'],
      rowLimit: 10,
    });

    const full = await client.fetchQueries({
      startDate,
      endDate,
      dimensions: ['query'],
    });

    // Full fetch should return >= small fetch results
    expect(full.totalRows).toBeGreaterThanOrEqual(small.totalRows);
  }, 60_000);
});
