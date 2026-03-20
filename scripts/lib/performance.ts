/**
 * C3 — Performance Loop (Weekly Performance Cycle)
 *
 * Core orchestration: GSC import → Position segmentation → Anomaly detection → Refresh queue
 *
 * @see docs/plans/specs/SPEC-C3-performance-loop.md
 */

import {
  createGSCClient,
  segmentByPosition,
  detectAnomalies,
  findNewQueries,
} from './gsc';
import { getDb, upsertKeyword } from './db';

import type {
  GSCQueryParams,
  GSCQueryResult,
  SegmentationResult,
  AnomalyReport,
  AnomalyType,
  Anomaly,
  NewQuery,
} from './gsc';

// ── Constants ──

export const DEFAULT_DAYS = 28;
export const GSC_DATA_LAG_DAYS = 3;
export const STRIKING_MIN_IMPRESSIONS = 20;
export const MAX_ACTIONS_DEFAULT = 30;
export const RECENT_REFRESH_COOLDOWN_DAYS = 7;
export const PRIORITY_SCORES: Record<string, number> = {
  A: 10000,
  B: 5000,
  C: 2000,
  D: 1000,
  E: 100,
};

// ── Types ──

export type RefreshActionType = 'refresh' | 'create' | 'research';

export interface RefreshAction {
  type: RefreshActionType;
  priority: 'A' | 'B' | 'C' | 'D' | 'E';
  query: string;
  page?: string;
  anomaly_type?: AnomalyType;
  detail: string;
  suggested_action: string;
  /** Original impressions for sorting */
  _impressions?: number;
}

export interface PerformanceOptions {
  days: number;
  dryRun: boolean;
  reportOnly: boolean;
  maxActions: number;
  ctrThreshold: number;
  impressionThreshold: number;
  positionDropThreshold: number;
}

export interface PerformanceCycleResult {
  timestamp: string;
  dateRange: {
    current: { start: string; end: string };
    previous: { start: string; end: string };
  };

  // Stage 1: GSC import
  gscImport: {
    currentRows: number;
    previousRows: number;
    currentWithPagesRows: number;
  };

  // Stage 2: Segmentation
  segmentation: {
    defending: number;
    page_one: number;
    striking: number;
    building: number;
    long_shot: number;
    total: number;
  };

  // Stage 3: Anomaly detection
  anomalies: {
    high_impressions_low_ctr: number;
    high_ctr_low_impressions: number;
    position_dropping: number;
    new_query: number;
    total: number;
  };

  // Stage 4: Actions generated
  actions: {
    striking_distance: number;
    ctr_problems: number;
    position_drops: number;
    new_coverage: number;
    new_discoveries: number;
    total_queued: number;
    total_researched: number;
    skipped_dedup: number;
  };

  // Top actions (for human review)
  topActions: Array<{
    priority: string;
    query: string;
    page?: string;
    detail: string;
    suggested_action: string;
  }>;
}

// ── Date Helpers ──

export function calculateDateRanges(
  today: Date,
  days: number,
): { current: { start: string; end: string }; previous: { start: string; end: string } } {
  const endDate = new Date(today);
  endDate.setDate(endDate.getDate() - GSC_DATA_LAG_DAYS);

  const startDate = new Date(endDate);
  startDate.setDate(startDate.getDate() - days);

  const prevEndDate = new Date(startDate);
  prevEndDate.setDate(prevEndDate.getDate() - 1);

  const prevStartDate = new Date(prevEndDate);
  prevStartDate.setDate(prevStartDate.getDate() - days);

  return {
    current: { start: formatDate(startDate), end: formatDate(endDate) },
    previous: { start: formatDate(prevStartDate), end: formatDate(prevEndDate) },
  };
}

function formatDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

// ── Empty Result ──

function emptyResult(): PerformanceCycleResult {
  return {
    timestamp: new Date().toISOString(),
    dateRange: {
      current: { start: '', end: '' },
      previous: { start: '', end: '' },
    },
    gscImport: { currentRows: 0, previousRows: 0, currentWithPagesRows: 0 },
    segmentation: { defending: 0, page_one: 0, striking: 0, building: 0, long_shot: 0, total: 0 },
    anomalies: { high_impressions_low_ctr: 0, high_ctr_low_impressions: 0, position_dropping: 0, new_query: 0, total: 0 },
    actions: { striking_distance: 0, ctr_problems: 0, position_drops: 0, new_coverage: 0, new_discoveries: 0, total_queued: 0, total_researched: 0, skipped_dedup: 0 },
    topActions: [],
  };
}

// ── Pure: Generate Refresh Actions ──

export function generateRefreshActions(
  segmentation: SegmentationResult,
  anomalyReport: AnomalyReport,
  newQueries: NewQuery[],
  opts: { maxActions: number; strikingMinImpressions: number },
): RefreshAction[] {
  const actions: RefreshAction[] = [];

  // Priority A: Striking distance queries
  for (const q of segmentation.segments.striking.queries) {
    if (q.impressions < opts.strikingMinImpressions) continue;
    actions.push({
      type: 'refresh',
      priority: 'A',
      query: q.query,
      page: q.page,
      detail: `Striking distance: "${q.query}" at position ${q.position.toFixed(1)} with ${q.impressions} impressions`,
      suggested_action: 'Add content depth, improve internal links, refresh with current info',
      _impressions: q.impressions,
    });
  }

  // Priority B/C: From anomalies (excluding new_query which is Priority E)
  for (const anomaly of anomalyReport.anomalies) {
    if (anomaly.type === 'new_query') continue; // handled separately below

    const action: RefreshAction = {
      type: 'refresh',
      priority: anomaly.priority,
      query: anomaly.query,
      page: anomaly.page,
      anomaly_type: anomaly.type,
      detail: anomaly.detail,
      suggested_action: anomaly.suggestedAction,
      _impressions: anomaly.current.impressions,
    };
    actions.push(action);
  }

  // Priority E: New GSC queries → research
  for (const nq of newQueries) {
    actions.push({
      type: 'research',
      priority: 'E',
      query: nq.query,
      detail: `New query "${nq.query}" discovered with ${nq.impressions} impressions`,
      suggested_action: 'Add to keyword universe, check coverage',
      _impressions: nq.impressions,
    });
  }

  // Sort: by priority A→B→C→D→E, within same priority by impressions desc
  const priorityOrder: Record<string, number> = { A: 0, B: 1, C: 2, D: 3, E: 4 };
  actions.sort((a, b) => {
    const pDiff = (priorityOrder[a.priority] ?? 9) - (priorityOrder[b.priority] ?? 9);
    if (pDiff !== 0) return pDiff;
    return (b._impressions ?? 0) - (a._impressions ?? 0);
  });

  // Apply maxActions limit
  if (actions.length > opts.maxActions) {
    return actions.slice(0, opts.maxActions);
  }

  return actions;
}

// ── DB: Write Actions ──

export function writeActions(
  actions: RefreshAction[],
): { queued: number; researched: number; skippedDedup: number } {
  const db = getDb();
  let queued = 0;
  let researched = 0;
  let skippedDedup = 0;

  const findGroup = db.prepare(
    `SELECT group_id FROM keyword_groups WHERE primary_keyword = ? LIMIT 1`,
  );

  const insertGroup = db.prepare(`
    INSERT INTO keyword_groups (primary_keyword, intent, content_type, priority_score, status, cluster_slug)
    VALUES (?, 'informational', 'refresh', ?, 'queued', NULL)
  `);

  const existingPendingJob = db.prepare(`
    SELECT job_id FROM create_queue
    WHERE keyword_group_id = ? AND content_type = 'refresh' AND status IN ('pending', 'in_progress')
    LIMIT 1
  `);

  const recentRefresh = db.prepare(`
    SELECT job_id FROM create_queue
    WHERE keyword_group_id = ?
      AND content_type = 'refresh'
      AND status = 'completed'
      AND completed_at > datetime('now', '-${RECENT_REFRESH_COOLDOWN_DAYS} days')
    LIMIT 1
  `);

  const insertQueue = db.prepare(`
    INSERT INTO create_queue (keyword_group_id, content_type, research_pipeline, priority_score, status)
    VALUES (?, 'refresh', 'standard', ?, 'pending')
  `);

  const writeAll = db.transaction(() => {
    for (const action of actions) {
      // Priority E — goes to keywords table, not queue
      if (action.type === 'research') {
        upsertKeyword(action.query, 'gsc', undefined);
        researched++;
        continue;
      }

      // Find or create keyword_group
      let row = findGroup.get(action.query) as { group_id: number } | undefined;
      if (!row) {
        const priorityScore = PRIORITY_SCORES[action.priority] ?? 0;
        const result = insertGroup.run(action.query, priorityScore);
        row = { group_id: Number(result.lastInsertRowid) };
      }

      // Dedup: skip if already has pending/in_progress refresh job
      const existing = existingPendingJob.get(row.group_id);
      if (existing) {
        skippedDedup++;
        continue;
      }

      // Dedup: skip if recently completed
      const recent = recentRefresh.get(row.group_id);
      if (recent) {
        skippedDedup++;
        continue;
      }

      const priorityScore = PRIORITY_SCORES[action.priority] ?? 0;
      insertQueue.run(row.group_id, priorityScore);
      queued++;
    }
  });

  writeAll();

  return { queued, researched, skippedDedup };
}

// ── Main Orchestration ──

export async function runPerformanceCycle(
  opts: PerformanceOptions,
): Promise<PerformanceCycleResult> {
  const startTime = Date.now();
  const dateRanges = calculateDateRanges(new Date(), opts.days);

  const result = emptyResult();
  result.timestamp = new Date().toISOString();
  result.dateRange = dateRanges;

  // ── Stage 1: GSC Data Import ──
  console.error('\nStage 1 — GSC Import');

  const gsc = createGSCClient();

  const currentParams: GSCQueryParams = {
    startDate: dateRanges.current.start,
    endDate: dateRanges.current.end,
    dimensions: ['query'],
    rowLimit: 25_000,
    dataState: 'final',
  };

  const previousParams: GSCQueryParams = {
    ...currentParams,
    startDate: dateRanges.previous.start,
    endDate: dateRanges.previous.end,
  };

  const [current, previous, currentWithPages] = await Promise.all([
    gsc.fetchQueries(currentParams),
    gsc.fetchQueries(previousParams),
    gsc.fetchQueriesWithPages(currentParams),
  ]);

  result.gscImport = {
    currentRows: current.totalRows,
    previousRows: previous.totalRows,
    currentWithPagesRows: currentWithPages.totalRows,
  };

  console.error(`  Current period:  ${dateRanges.current.start} → ${dateRanges.current.end}  (${current.totalRows} queries)`);
  console.error(`  Previous period: ${dateRanges.previous.start} → ${dateRanges.previous.end}  (${previous.totalRows} queries)`);
  console.error(`  With pages: ${currentWithPages.totalRows} query-page pairs`);

  // Noop degradation: if GSC returns no data, skip
  if (current.totalRows === 0 && previous.totalRows === 0) {
    console.error('⚠️  GSC returned no data — credentials may not be configured. Skipping performance cycle.');
    result.timestamp = new Date().toISOString();
    return result;
  }

  // ── Stage 2: Position Segmentation ──
  console.error('\nStage 2 — Position Segmentation');

  const segmentation = segmentByPosition(
    currentWithPages.rows,
    { start: currentParams.startDate, end: currentParams.endDate },
  );

  result.segmentation = {
    defending: segmentation.segments.defending.count,
    page_one: segmentation.segments.page_one.count,
    striking: segmentation.segments.striking.count,
    building: segmentation.segments.building.count,
    long_shot: segmentation.segments.long_shot.count,
    total: segmentation.totalQueries,
  };

  console.error(`  Defending (1-3):     ${result.segmentation.defending} queries`);
  console.error(`  Page 1 (4-10):       ${result.segmentation.page_one} queries`);
  console.error(`  Striking (11-20):    ${result.segmentation.striking} queries ← highest ROI`);
  console.error(`  Building (21-50):    ${result.segmentation.building} queries`);
  console.error(`  Long shot (50+):     ${result.segmentation.long_shot} queries`);

  // ── Stage 3: Anomaly Detection ──
  console.error('\nStage 3 — Anomaly Detection');

  const anomalyReport = detectAnomalies(current, previous, {
    ctrThresholdLow: opts.ctrThreshold,
    impressionThresholdHigh: opts.impressionThreshold,
    positionDropThreshold: opts.positionDropThreshold,
  });

  const newQueries = findNewQueries(current, previous);

  result.anomalies = {
    high_impressions_low_ctr: anomalyReport.summary.high_impressions_low_ctr,
    high_ctr_low_impressions: anomalyReport.summary.high_ctr_low_impressions,
    position_dropping: anomalyReport.summary.position_dropping,
    new_query: newQueries.length,
    total:
      anomalyReport.summary.high_impressions_low_ctr +
      anomalyReport.summary.high_ctr_low_impressions +
      anomalyReport.summary.position_dropping +
      newQueries.length,
  };

  console.error(`  High impressions / low CTR:  ${result.anomalies.high_impressions_low_ctr}`);
  console.error(`  High CTR / low impressions:  ${result.anomalies.high_ctr_low_impressions}`);
  console.error(`  Position dropping:           ${result.anomalies.position_dropping}`);
  console.error(`  New queries:                 ${result.anomalies.new_query}`);
  console.error(`  Total: ${result.anomalies.total} anomalies`);

  // ── Stage 4: Generate Refresh Actions ──
  console.error('\nStage 4 — Refresh Actions');

  const allActions = generateRefreshActions(segmentation, anomalyReport, newQueries, {
    maxActions: opts.maxActions,
    strikingMinImpressions: STRIKING_MIN_IMPRESSIONS,
  });

  // Count by priority
  const strikingCount = allActions.filter((a) => a.priority === 'A').length;
  const ctrCount = allActions.filter((a) => a.priority === 'B').length;
  const dropCount = allActions.filter((a) => a.priority === 'C').length;
  const coverageCount = allActions.filter((a) => a.priority === 'D').length;
  const discoveryCount = allActions.filter((a) => a.priority === 'E').length;

  console.error(`  Priority A (striking distance):  ${strikingCount}`);
  console.error(`  Priority B (CTR problems):       ${ctrCount}`);
  console.error(`  Priority C (position drops):     ${dropCount}`);
  if (coverageCount > 0) {
    console.error(`  Priority D (new coverage):       ${coverageCount}`);
  }
  console.error(`  Priority E (new discoveries):    ${discoveryCount} → keywords table`);

  // Write actions (unless dry-run or report-only)
  let writeResult = { queued: 0, researched: 0, skippedDedup: 0 };
  if (!opts.dryRun && !opts.reportOnly) {
    writeResult = writeActions(allActions);
  }

  result.actions = {
    striking_distance: strikingCount,
    ctr_problems: ctrCount,
    position_drops: dropCount,
    new_coverage: coverageCount,
    new_discoveries: discoveryCount,
    total_queued: writeResult.queued,
    total_researched: writeResult.researched,
    skipped_dedup: writeResult.skippedDedup,
  };

  console.error(`\n  Written to create_queue: ${writeResult.queued} refresh jobs`);
  console.error(`  Written to keywords: ${writeResult.researched} new keywords (source=gsc)`);
  console.error(`  Skipped (dedup): ${writeResult.skippedDedup}`);

  // Top actions for human review
  result.topActions = allActions.slice(0, 5).map((a) => ({
    priority: a.priority,
    query: a.query,
    page: a.page,
    detail: a.detail,
    suggested_action: a.suggested_action,
  }));

  if (result.topActions.length > 0) {
    console.error('\n  Top actions:');
    for (let i = 0; i < result.topActions.length; i++) {
      const a = result.topActions[i];
      console.error(`  #${i + 1}  [${a.priority}] ${a.detail}`);
    }
  }

  const durationMs = Date.now() - startTime;
  console.error(`\nDuration: ${(durationMs / 1000).toFixed(1)}s`);

  return result;
}
