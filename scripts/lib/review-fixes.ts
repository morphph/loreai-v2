/**
 * C5 — Deterministic Auto-Fixes
 *
 * Small, surgical, DB-only fixes for health check failures.
 * Each fix is a pure SQL operation — no LLM, no external API, no file I/O.
 *
 * Every fix is logged to an `auto_fixes` array in the health report JSON.
 *
 * @see docs/plans/specs/SPEC-C5-review-cycle.md
 */

import type Database from 'better-sqlite3';
import type { HealthCheckResult } from './review-checks';
import { QUEUE_STATUS, GROUP_STATUS } from './review-checks';

// ── Types ──

export interface AutoFix {
  check_id: string;
  action: string;
  affected: number;
  detail?: string;
}

type FixFn = (db: Database.Database) => AutoFix | null;

// ── Fix Definitions ──

/**
 * queue_stuck: Reset jobs stuck in_progress > 24h back to pending.
 *
 * Why: A crashed process-queue.ts run leaves jobs in_progress permanently.
 * The job will be retried on the next generate cycle.
 */
function fixQueueStuck(db: Database.Database): AutoFix | null {
  const result = db.prepare(
    `UPDATE create_queue SET status = ?
     WHERE status = ? AND created_at < datetime('now', '-24 hours')`,
  ).run(QUEUE_STATUS.PENDING, QUEUE_STATUS.IN_PROGRESS);

  if (result.changes === 0) return null;
  return {
    check_id: 'queue_stuck',
    action: `Reset ${result.changes} stuck job(s) from in_progress to pending`,
    affected: result.changes,
  };
}

/**
 * groups_status_sync: Set keyword_groups to 'completed' when their queue job is done.
 *
 * Why: process-queue.ts marks the queue job completed but sometimes the
 * keyword_group stays stuck as 'queued', blocking re-scoring and discovery.
 */
function fixGroupsStatusSync(db: Database.Database): AutoFix | null {
  const result = db.prepare(
    `UPDATE keyword_groups SET status = ?
     WHERE status = ? AND group_id IN (
       SELECT keyword_group_id FROM create_queue WHERE status = ?
     )`,
  ).run(GROUP_STATUS.COMPLETED, GROUP_STATUS.QUEUED, QUEUE_STATUS.COMPLETED);

  if (result.changes === 0) return null;
  return {
    check_id: 'groups_status_sync',
    action: `Synced ${result.changes} keyword_group(s) from queued to completed`,
    affected: result.changes,
  };
}

// ── Registry ──

/**
 * Map from check_id to its fix function.
 * Only checks with deterministic, safe fixes are listed here.
 */
const FIX_REGISTRY: Record<string, FixFn> = {
  queue_stuck: fixQueueStuck,
  groups_status_sync: fixGroupsStatusSync,
};

// ── Runner ──

/**
 * Run auto-fixes for all red/yellow health checks that have a registered fix.
 * Returns the list of fixes applied (empty if nothing needed fixing).
 */
export function runAutoFixes(
  db: Database.Database,
  issues: HealthCheckResult[],
): AutoFix[] {
  const fixes: AutoFix[] = [];

  for (const issue of issues) {
    const fixFn = FIX_REGISTRY[issue.check_id];
    if (!fixFn) continue;

    const fix = fixFn(db);
    if (fix) fixes.push(fix);
  }

  return fixes;
}
