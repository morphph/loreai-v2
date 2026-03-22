import 'dotenv/config';
import { searchconsole, auth as googleAuth } from '@googleapis/searchconsole';
import type { searchconsole_v1 } from '@googleapis/searchconsole';

// ── Config ──

export interface GSCConfig {
  siteUrl: string;               // e.g. "sc-domain:loreai.dev"
  keyFilePath?: string;          // path to service account JSON key
  credentials?: {                // alternative: inline credentials
    clientEmail: string;
    privateKey: string;
  };
  timeoutMs?: number;            // default: 30_000 (GSC can be slow)
}

// ── Query Parameters ──

export interface GSCQueryParams {
  startDate: string;             // "YYYY-MM-DD"
  endDate: string;               // "YYYY-MM-DD"
  dimensions?: GSCDimension[];
  filters?: GSCFilter[];
  rowLimit?: number;             // default: 25_000
  dataState?: 'final' | 'all';  // default: 'final'
}

export type GSCDimension = 'query' | 'page' | 'device' | 'country' | 'date';

export interface GSCFilter {
  dimension: GSCDimension;
  operator: 'equals' | 'contains' | 'notContains' | 'notEquals' | 'includingRegex' | 'excludingRegex';
  expression: string;
}

// ── API Response ──

export interface GSCRow {
  keys: string[];
  clicks: number;
  impressions: number;
  ctr: number;                   // 0.0 ~ 1.0
  position: number;              // average position
}

export interface GSCQueryResult {
  rows: GSCRow[];
  startDate: string;
  endDate: string;
  totalRows: number;             // rows.length (for convenience after pagination merge)
}

// ── Position Segmentation ──

export type PositionSegment =
  | 'defending'       // 1-3
  | 'page_one'        // 4-10
  | 'striking'        // 11-20 (highest ROI)
  | 'building'        // 21-50
  | 'long_shot';      // 50+

export interface SegmentedQuery {
  query: string;
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
  segment: PositionSegment;
  page?: string;                 // landing page URL (if 'page' dimension was included)
}

export interface SegmentSummary {
  segment: PositionSegment;
  count: number;
  totalClicks: number;
  totalImpressions: number;
  avgCtr: number;
  avgPosition: number;
  queries: SegmentedQuery[];
}

export interface SegmentationResult {
  dateRange: { start: string; end: string };
  segments: Record<PositionSegment, SegmentSummary>;
  totalQueries: number;
}

// ── Anomaly Detection ──

export type AnomalyType =
  | 'high_impressions_low_ctr'   // title/meta 不够吸引
  | 'high_ctr_low_impressions'   // authority 不足
  | 'position_dropping'          // 内容过时 or 竞争对手变强
  | 'new_query';                 // 新发现的 query

export interface Anomaly {
  type: AnomalyType;
  query: string;
  page?: string;
  current: { clicks: number; impressions: number; ctr: number; position: number };
  previous?: { clicks: number; impressions: number; ctr: number; position: number };
  detail: string;                // human-readable description
  suggestedAction: string;       // e.g. "Rewrite title and meta description"
  priority: 'A' | 'B' | 'C' | 'D' | 'E';
}

export interface AnomalyReport {
  dateRange: { current: { start: string; end: string }; previous: { start: string; end: string } };
  anomalies: Anomaly[];
  summary: Record<AnomalyType, number>;
}

export interface AnomalyDetectionOpts {
  ctrThresholdLow?: number;       // default: 0.02 (2%)
  impressionThresholdHigh?: number; // default: 100
  positionDropThreshold?: number;  // default: 3 (positions)
}

// ── New Query Detection ──

export interface NewQuery {
  query: string;
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
  firstSeen: string;             // date first appeared in current period
}

// ── Error Classes ──

export class GSCAPIError extends Error {
  constructor(
    public readonly status: number,
    public readonly body: string,
  ) {
    super(`GSC API error ${status}: ${body}`);
    this.name = 'GSCAPIError';
  }
}

export class GSCAuthError extends Error {
  constructor(message: string) {
    super(`GSC auth error: ${message}`);
    this.name = 'GSCAuthError';
  }
}

// ── GSC Client Interface ──

export interface GSCClient {
  fetchQueries(params: GSCQueryParams): Promise<GSCQueryResult>;
  fetchQueriesWithPages(params: GSCQueryParams): Promise<GSCQueryResult>;
}

// ── Noop Client (graceful degradation when no credentials) ──

function _noopClient(): GSCClient {
  return {
    async fetchQueries(params: GSCQueryParams): Promise<GSCQueryResult> {
      return { rows: [], startDate: params.startDate, endDate: params.endDate, totalRows: 0 };
    },
    async fetchQueriesWithPages(params: GSCQueryParams): Promise<GSCQueryResult> {
      return { rows: [], startDate: params.startDate, endDate: params.endDate, totalRows: 0 };
    },
  };
}

// ── Factory ──

export function createGSCClient(config?: Partial<GSCConfig>): GSCClient {
  // Resolve siteUrl
  const siteUrl = config?.siteUrl ?? process.env.GSC_SITE_URL ?? '';
  if (!siteUrl) {
    console.warn('GSC_SITE_URL not set, returning noop GSC client');
    return _noopClient();
  }

  // Resolve credentials
  const keyFilePath = config?.keyFilePath ?? process.env.GSC_SERVICE_ACCOUNT_KEY_PATH;
  const clientEmail = config?.credentials?.clientEmail ?? process.env.GSC_CLIENT_EMAIL;
  const privateKey = config?.credentials?.privateKey ?? process.env.GSC_PRIVATE_KEY;

  let authClient;
  if (keyFilePath) {
    authClient = new googleAuth.GoogleAuth({
      keyFile: keyFilePath,
      scopes: ['https://www.googleapis.com/auth/webmasters.readonly'],
    });
  } else if (clientEmail && privateKey) {
    authClient = new googleAuth.GoogleAuth({
      credentials: {
        client_email: clientEmail,
        private_key: privateKey,
      },
      scopes: ['https://www.googleapis.com/auth/webmasters.readonly'],
    });
  } else {
    console.warn('GSC credentials not configured, returning noop GSC client');
    return _noopClient();
  }

  const sc = searchconsole({ version: 'v1', auth: authClient as unknown as string });
  const timeoutMs = config?.timeoutMs ?? 30_000;

  async function _query(params: GSCQueryParams, dimensions?: GSCDimension[]): Promise<GSCQueryResult> {
    const dims = dimensions ?? params.dimensions ?? ['query'];
    const rowLimit = params.rowLimit ?? 25_000;

    const allRows: GSCRow[] = [];
    let startRow = 0;

     
    while (true) {
      const requestBody: searchconsole_v1.Schema$SearchAnalyticsQueryRequest = {
        startDate: params.startDate,
        endDate: params.endDate,
        dimensions: dims,
        rowLimit,
        startRow,
        dataState: params.dataState ?? 'final',
      };

      if (params.filters && params.filters.length > 0) {
        requestBody.dimensionFilterGroups = [{
          groupType: 'and',
          filters: params.filters.map((f) => ({
            dimension: f.dimension,
            operator: f.operator,
            expression: f.expression,
          })),
        }];
      }

      let response;
      try {
        response = await sc.searchanalytics.query({
          siteUrl,
          requestBody,
        }, { timeout: timeoutMs });
      } catch (err: unknown) {
        const gaxiosErr = err as { response?: { status?: number; data?: unknown }; message?: string };
        if (gaxiosErr.response?.status) {
          throw new GSCAPIError(
            gaxiosErr.response.status,
            typeof gaxiosErr.response.data === 'string'
              ? gaxiosErr.response.data
              : JSON.stringify(gaxiosErr.response.data ?? ''),
          );
        }
        throw err;
      }

      const rows = response.data.rows ?? [];
      for (const row of rows) {
        allRows.push({
          keys: row.keys ?? [],
          clicks: row.clicks ?? 0,
          impressions: row.impressions ?? 0,
          ctr: row.ctr ?? 0,
          position: row.position ?? 0,
        });
      }

      if (rows.length < rowLimit) break;
      startRow += rows.length;
    }

    return {
      rows: allRows,
      startDate: params.startDate,
      endDate: params.endDate,
      totalRows: allRows.length,
    };
  }

  return {
    fetchQueries(params: GSCQueryParams): Promise<GSCQueryResult> {
      return _query(params);
    },
    fetchQueriesWithPages(params: GSCQueryParams): Promise<GSCQueryResult> {
      return _query(params, ['query', 'page']);
    },
  };
}

// ── Pure Functions ──

/** Classify position into segment */
function _classifyPosition(position: number): PositionSegment {
  if (position <= 3) return 'defending';
  if (position <= 10) return 'page_one';
  if (position <= 20) return 'striking';
  if (position <= 50) return 'building';
  return 'long_shot';
}

/** Create empty segment summary */
function _emptySegment(segment: PositionSegment): SegmentSummary {
  return {
    segment,
    count: 0,
    totalClicks: 0,
    totalImpressions: 0,
    avgCtr: 0,
    avgPosition: 0,
    queries: [],
  };
}

/** 4.3 — Segment queries by position range */
export function segmentByPosition(rows: GSCRow[], dateRange?: { start: string; end: string }): SegmentationResult {
  const segments: Record<PositionSegment, SegmentSummary> = {
    defending: _emptySegment('defending'),
    page_one: _emptySegment('page_one'),
    striking: _emptySegment('striking'),
    building: _emptySegment('building'),
    long_shot: _emptySegment('long_shot'),
  };

  for (const row of rows) {
    const segment = _classifyPosition(row.position);
    const summary = segments[segment];
    const segmented: SegmentedQuery = {
      query: row.keys[0] ?? '',
      clicks: row.clicks,
      impressions: row.impressions,
      ctr: row.ctr,
      position: row.position,
      segment,
      page: row.keys[1],
    };
    summary.queries.push(segmented);
    summary.count++;
    summary.totalClicks += row.clicks;
    summary.totalImpressions += row.impressions;
  }

  // Compute averages
  for (const seg of Object.values(segments)) {
    if (seg.count > 0) {
      seg.avgCtr = seg.queries.reduce((sum, q) => sum + q.ctr, 0) / seg.count;
      seg.avgPosition = seg.queries.reduce((sum, q) => sum + q.position, 0) / seg.count;
    }
  }

  return {
    dateRange: dateRange ?? { start: '', end: '' },
    segments,
    totalQueries: rows.length,
  };
}

/** 4.4 — Detect anomalies by comparing two time periods */
export function detectAnomalies(
  current: GSCQueryResult,
  previous: GSCQueryResult,
  opts?: AnomalyDetectionOpts,
): AnomalyReport {
  const ctrThresholdLow = opts?.ctrThresholdLow ?? 0.02;
  const impressionThresholdHigh = opts?.impressionThresholdHigh ?? 100;
  const positionDropThreshold = opts?.positionDropThreshold ?? 3;

  const anomalies: Anomaly[] = [];

  // Build lookup for previous period
  const prevMap = new Map<string, GSCRow>();
  for (const row of previous.rows) {
    prevMap.set(row.keys[0] ?? '', row);
  }

  for (const row of current.rows) {
    const query = row.keys[0] ?? '';
    const prev = prevMap.get(query);
    const currentMetrics = { clicks: row.clicks, impressions: row.impressions, ctr: row.ctr, position: row.position };

    // High impressions + low CTR
    if (row.impressions >= impressionThresholdHigh && row.ctr < ctrThresholdLow) {
      anomalies.push({
        type: 'high_impressions_low_ctr',
        query,
        current: currentMetrics,
        previous: prev ? { clicks: prev.clicks, impressions: prev.impressions, ctr: prev.ctr, position: prev.position } : undefined,
        detail: `Query "${query}" has ${row.impressions} impressions but only ${(row.ctr * 100).toFixed(1)}% CTR`,
        suggestedAction: 'Rewrite title and meta description',
        priority: 'B',
      });
    }

    // High CTR + low impressions
    if (row.ctr >= 0.10 && row.impressions < 20) {
      anomalies.push({
        type: 'high_ctr_low_impressions',
        query,
        current: currentMetrics,
        previous: prev ? { clicks: prev.clicks, impressions: prev.impressions, ctr: prev.ctr, position: prev.position } : undefined,
        detail: `Query "${query}" has ${(row.ctr * 100).toFixed(1)}% CTR but only ${row.impressions} impressions`,
        suggestedAction: 'Build internal links, create supporting content',
        priority: 'B',
      });
    }

    // Position dropping
    if (prev && row.position - prev.position >= positionDropThreshold && prev.position <= 20) {
      anomalies.push({
        type: 'position_dropping',
        query,
        current: currentMetrics,
        previous: { clicks: prev.clicks, impressions: prev.impressions, ctr: prev.ctr, position: prev.position },
        detail: `Query "${query}" dropped from position ${prev.position.toFixed(1)} to ${row.position.toFixed(1)}`,
        suggestedAction: 'Refresh content, check competitor changes',
        priority: 'C',
      });
    }

    // New query
    if (!prev) {
      anomalies.push({
        type: 'new_query',
        query,
        current: currentMetrics,
        detail: `New query "${query}" discovered with ${row.impressions} impressions`,
        suggestedAction: 'Add to keyword universe, check coverage',
        priority: 'E',
      });
    }
  }

  // Build summary
  const summary: Record<AnomalyType, number> = {
    high_impressions_low_ctr: 0,
    high_ctr_low_impressions: 0,
    position_dropping: 0,
    new_query: 0,
  };
  for (const a of anomalies) {
    summary[a.type]++;
  }

  return {
    dateRange: {
      current: { start: current.startDate, end: current.endDate },
      previous: { start: previous.startDate, end: previous.endDate },
    },
    anomalies,
    summary,
  };
}

/** 4.5 — Find new queries in current period that don't exist in previous */
export function findNewQueries(
  current: GSCQueryResult,
  previous: GSCQueryResult,
): NewQuery[] {
  const prevQueries = new Set<string>();
  for (const row of previous.rows) {
    prevQueries.add(row.keys[0] ?? '');
  }

  const newQueries: NewQuery[] = [];
  for (const row of current.rows) {
    const query = row.keys[0] ?? '';
    if (!prevQueries.has(query)) {
      newQueries.push({
        query,
        clicks: row.clicks,
        impressions: row.impressions,
        ctr: row.ctr,
        position: row.position,
        firstSeen: current.startDate,
      });
    }
  }

  // Sort by impressions descending
  newQueries.sort((a, b) => b.impressions - a.impressions);

  return newQueries;
}
