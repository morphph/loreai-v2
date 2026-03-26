/**
 * C5 — Layer 1 Health Check Definitions
 *
 * Each check is a pure function: (db, opts?) => HealthCheckResult
 * Read-only — never writes to DB.
 *
 * @see docs/plans/specs/SPEC-C5-review-cycle.md Section 3.2
 */

import type Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';
import { todaySGT } from './date';

// ── Status String Constants ──
// Authoritative reference. Never hardcode status strings in SQL.
// See SPEC-C5 Section 3.2B and known-issues.md.

export const QUEUE_STATUS = {
  PENDING: 'pending',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
} as const;

export const GROUP_STATUS = {
  PENDING: 'pending',
  QUEUED: 'queued',
  COMPLETED: 'completed',
} as const;

// ── Types ──

export type CheckStatus = 'green' | 'yellow' | 'red' | 'error' | 'info';
export type CheckWindow = 'today' | 'rolling_7d' | 'snapshot';

export interface HealthCheckResult {
  check_id: string;
  window: CheckWindow;
  status: CheckStatus;
  value: number;
  threshold: { green: string; yellow: string; red: string };
  summary: string;
  detail?: string;
}

export interface CheckOptions {
  /** Content root directory (default: process.cwd()) */
  contentRoot?: string;
  /** Override "now" for testing */
  now?: Date;
}

// ── Helpers ──

function isWeekday(date: Date): boolean {
  const day = date.getUTCDay();
  return day >= 1 && day <= 5;
}

/** Get SGT date string from a Date object */
function toSGTDate(date: Date): string {
  return new Date(date.getTime() + 8 * 3600_000).toISOString().slice(0, 10);
}

/** Count weekdays in last N days */
function weekdaysInLast(days: number, now: Date): number {
  let count = 0;
  for (let i = 0; i < days; i++) {
    const d = new Date(now.getTime() - i * 86400_000);
    if (isWeekday(d)) count++;
  }
  return count;
}

function safeCheck(checkId: string, window: CheckWindow, fn: () => HealthCheckResult): HealthCheckResult {
  try {
    return fn();
  } catch (err) {
    return {
      check_id: checkId,
      window,
      status: 'error',
      value: -1,
      threshold: { green: '', yellow: '', red: '' },
      summary: `Check failed: ${err instanceof Error ? err.message : String(err)}`,
    };
  }
}

// ════════════════════════════════════════════
// Group A — Pipeline Stage Completion
// ════════════════════════════════════════════

export function checkCollectToday(db: Database.Database, opts?: CheckOptions): HealthCheckResult {
  return safeCheck('collect_today', 'today', () => {
    const row = db.prepare(
      `SELECT COUNT(*) as cnt FROM news_items WHERE detected_at > datetime('now', '-24 hours')`
    ).get() as { cnt: number };
    const value = row.cnt;
    let status: CheckStatus = 'green';
    if (value < 20) status = 'red';
    else if (value < 50) status = 'yellow';
    return {
      check_id: 'collect_today',
      window: 'today',
      status,
      value,
      threshold: { green: '>= 50', yellow: '20-49', red: '< 20' },
      summary: `${value} news items collected in last 24h`,
    };
  });
}

export function checkCollectTrend(db: Database.Database, opts?: CheckOptions): HealthCheckResult {
  return safeCheck('collect_trend', 'rolling_7d', () => {
    const row = db.prepare(
      `SELECT COUNT(DISTINCT date(detected_at, '+8 hours')) as days
       FROM news_items WHERE detected_at > datetime('now', '-7 days')`
    ).get() as { days: number };
    const value = row.days;
    const now = opts?.now ?? new Date();
    const expectedWeekdays = weekdaysInLast(7, now);
    const greenThreshold = Math.ceil(expectedWeekdays * 0.8);
    const yellowThreshold = Math.ceil(expectedWeekdays * 0.5);
    let status: CheckStatus = 'green';
    if (value < yellowThreshold) status = 'red';
    else if (value < greenThreshold) status = 'yellow';
    return {
      check_id: 'collect_trend',
      window: 'rolling_7d',
      status,
      value,
      threshold: {
        green: `>= ${greenThreshold} days (80% of ${expectedWeekdays} weekdays)`,
        yellow: `>= ${yellowThreshold} days`,
        red: `< ${yellowThreshold} days`,
      },
      summary: `Collected on ${value}/${expectedWeekdays} weekdays in last 7d`,
    };
  });
}

export function checkNewsletterToday(db: Database.Database, opts?: CheckOptions): HealthCheckResult {
  return safeCheck('newsletter_today', 'today', () => {
    const now = opts?.now ?? new Date();
    const today = toSGTDate(now);
    const contentRoot = opts?.contentRoot ?? process.cwd();
    const filePath = path.join(contentRoot, 'content', 'newsletters', 'en', `${today}.md`);
    const exists = fs.existsSync(filePath);
    const weekday = isWeekday(now);

    let status: CheckStatus = 'green';
    if (!exists && weekday) status = 'red';
    else if (!exists && !weekday) status = 'green'; // weekends are OK

    return {
      check_id: 'newsletter_today',
      window: 'today',
      status,
      value: exists ? 1 : 0,
      threshold: { green: 'file exists', yellow: '—', red: 'missing on weekday' },
      summary: exists
        ? `Newsletter ${today} exists`
        : weekday
          ? `Newsletter ${today} MISSING (weekday)`
          : `Newsletter ${today} not expected (weekend)`,
    };
  });
}

export function checkNewsletterBilingual(db: Database.Database, opts?: CheckOptions): HealthCheckResult {
  return safeCheck('newsletter_bilingual', 'rolling_7d', () => {
    const contentRoot = opts?.contentRoot ?? process.cwd();
    const enDir = path.join(contentRoot, 'content', 'newsletters', 'en');
    const zhDir = path.join(contentRoot, 'content', 'newsletters', 'zh');

    const now = opts?.now ?? new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 86400_000);
    const cutoff = toSGTDate(sevenDaysAgo);

    const listRecent = (dir: string) => {
      if (!fs.existsSync(dir)) return [];
      return fs.readdirSync(dir)
        .filter(f => f.endsWith('.md') && f >= cutoff)
        .map(f => f.replace('.md', ''));
    };

    const enFiles = listRecent(enDir);
    const zhFiles = new Set(listRecent(zhDir));
    const enCount = enFiles.length;
    const zhCount = enFiles.filter(f => zhFiles.has(f)).length;
    const pairRate = enCount > 0 ? zhCount / enCount : 1;
    const pct = Math.round(pairRate * 100);

    let status: CheckStatus = 'green';
    if (pct < 80) status = 'red';
    else if (pct < 100) status = 'yellow';

    return {
      check_id: 'newsletter_bilingual',
      window: 'rolling_7d',
      status,
      value: pct,
      threshold: { green: '100%', yellow: '>= 80%', red: '< 80%' },
      summary: `${zhCount}/${enCount} newsletters have ZH pair (${pct}%) in last 7d`,
    };
  });
}

export function checkEntityExtractRuns(db: Database.Database, opts?: CheckOptions): HealthCheckResult {
  return safeCheck('entity_extract_runs', 'rolling_7d', () => {
    const row = db.prepare(
      `SELECT COUNT(*) as cnt FROM topic_clusters WHERE last_seen > datetime('now', '-7 days')`
    ).get() as { cnt: number };
    const value = row.cnt;
    let status: CheckStatus = value > 0 ? 'green' : 'red';
    return {
      check_id: 'entity_extract_runs',
      window: 'rolling_7d',
      status,
      value,
      threshold: { green: '> 0', yellow: '—', red: '0' },
      summary: `${value} topic clusters updated in last 7d`,
    };
  });
}

// ════════════════════════════════════════════
// Group B — Queue Health
// ════════════════════════════════════════════

export function checkQueuePending(db: Database.Database): HealthCheckResult {
  return safeCheck('queue_pending', 'snapshot', () => {
    const row = db.prepare(
      `SELECT COUNT(*) as cnt FROM create_queue WHERE status = ?`
    ).get(QUEUE_STATUS.PENDING) as { cnt: number };
    return {
      check_id: 'queue_pending',
      window: 'snapshot',
      status: 'info',
      value: row.cnt,
      threshold: { green: 'informational', yellow: '—', red: '—' },
      summary: `${row.cnt} pending jobs in create_queue`,
    };
  });
}

export function checkQueueDrainRate(db: Database.Database): HealthCheckResult {
  return safeCheck('queue_drain_rate', 'rolling_7d', () => {
    const row = db.prepare(
      `SELECT COUNT(*) as cnt FROM create_queue
       WHERE status = ? AND completed_at > datetime('now', '-7 days')`
    ).get(QUEUE_STATUS.COMPLETED) as { cnt: number };
    const value = row.cnt;
    let status: CheckStatus = 'green';
    if (value < 5) status = 'red';
    else if (value < 20) status = 'yellow';
    return {
      check_id: 'queue_drain_rate',
      window: 'rolling_7d',
      status,
      value,
      threshold: { green: '>= 20/week', yellow: '5-19/week', red: '< 5/week' },
      summary: `${value} jobs completed in last 7d`,
    };
  });
}

export function checkQueueDrainToday(db: Database.Database, opts?: CheckOptions): HealthCheckResult {
  return safeCheck('queue_drain_today', 'today', () => {
    const row = db.prepare(
      `SELECT COUNT(*) as cnt FROM create_queue
       WHERE status = ? AND completed_at > datetime('now', '-24 hours')`
    ).get(QUEUE_STATUS.COMPLETED) as { cnt: number };
    const value = row.cnt;
    const now = opts?.now ?? new Date();
    const weekday = isWeekday(now);
    let status: CheckStatus = 'green';
    if (value === 0 && weekday) status = 'red';
    else if (value < 3 && value > 0) status = 'yellow';
    else if (value === 0 && !weekday) status = 'green'; // weekend
    return {
      check_id: 'queue_drain_today',
      window: 'today',
      status,
      value,
      threshold: { green: '>= 3', yellow: '1-2', red: '0 (weekday)' },
      summary: value === 0 && !weekday
        ? `0 jobs completed today (weekend — OK)`
        : `${value} jobs completed today`,
    };
  });
}

export function checkQueueStuck(db: Database.Database): HealthCheckResult {
  return safeCheck('queue_stuck', 'snapshot', () => {
    const row = db.prepare(
      `SELECT COUNT(*) as cnt FROM create_queue
       WHERE status = ? AND created_at < datetime('now', '-24 hours')`
    ).get(QUEUE_STATUS.IN_PROGRESS) as { cnt: number };
    const value = row.cnt;
    let status: CheckStatus = 'green';
    if (value >= 3) status = 'red';
    else if (value >= 1) status = 'yellow';
    return {
      check_id: 'queue_stuck',
      window: 'snapshot',
      status,
      value,
      threshold: { green: '0', yellow: '1-2', red: '>= 3' },
      summary: `${value} jobs stuck in_progress > 24h`,
    };
  });
}

export function checkQueueGrowth(db: Database.Database): HealthCheckResult {
  return safeCheck('queue_growth', 'rolling_7d', () => {
    const newPending = db.prepare(
      `SELECT COUNT(*) as cnt FROM create_queue
       WHERE status = ? AND created_at > datetime('now', '-7 days')`
    ).get(QUEUE_STATUS.PENDING) as { cnt: number };
    const completed = db.prepare(
      `SELECT COUNT(*) as cnt FROM create_queue
       WHERE status = ? AND completed_at > datetime('now', '-7 days')`
    ).get(QUEUE_STATUS.COMPLETED) as { cnt: number };

    const growth = newPending.cnt;
    const drain = completed.cnt;
    // Use drain - growth as value (positive = healthy)
    const value = drain - growth;

    let status: CheckStatus = 'green';
    if (drain === 0 && growth > 0) status = 'red';
    else if (drain < growth) status = 'yellow';

    return {
      check_id: 'queue_growth',
      window: 'rolling_7d',
      status,
      value,
      threshold: { green: 'drain > growth', yellow: 'drain ~= growth', red: 'drain = 0, growth > 0' },
      summary: `7d: +${growth} new pending, -${drain} completed (net ${value >= 0 ? '+' : ''}${value})`,
      detail: `Growth: ${growth}, Drain: ${drain}`,
    };
  });
}

export function checkQueueAge(db: Database.Database): HealthCheckResult {
  return safeCheck('queue_age', 'snapshot', () => {
    const row = db.prepare(
      `SELECT MIN(created_at) as oldest FROM create_queue WHERE status = ?`
    ).get(QUEUE_STATUS.PENDING) as { oldest: string | null };

    if (!row.oldest) {
      return {
        check_id: 'queue_age',
        window: 'snapshot',
        status: 'green',
        value: 0,
        threshold: { green: '< 7 days', yellow: '7-14 days', red: '> 14 days' },
        summary: 'No pending jobs',
      };
    }

    const oldestDate = new Date(row.oldest + 'Z');
    const ageDays = Math.floor((Date.now() - oldestDate.getTime()) / 86400_000);
    let status: CheckStatus = 'green';
    if (ageDays > 14) status = 'red';
    else if (ageDays >= 7) status = 'yellow';

    return {
      check_id: 'queue_age',
      window: 'snapshot',
      status,
      value: ageDays,
      threshold: { green: '< 7 days', yellow: '7-14 days', red: '> 14 days' },
      summary: `Oldest pending job is ${ageDays} days old`,
      detail: `Oldest: ${row.oldest}`,
    };
  });
}

export function checkGroupsStatusSync(db: Database.Database): HealthCheckResult {
  return safeCheck('groups_status_sync', 'snapshot', () => {
    const row = db.prepare(
      `SELECT COUNT(*) as cnt FROM create_queue cq
       JOIN keyword_groups kg ON cq.keyword_group_id = kg.group_id
       WHERE cq.status = ? AND kg.status = ?`
    ).get(QUEUE_STATUS.COMPLETED, GROUP_STATUS.QUEUED) as { cnt: number };
    const value = row.cnt;
    let status: CheckStatus = 'green';
    if (value > 5) status = 'red';
    else if (value >= 1) status = 'yellow';
    return {
      check_id: 'groups_status_sync',
      window: 'snapshot',
      status,
      value,
      threshold: { green: '0 mismatches', yellow: '1-5', red: '> 5' },
      summary: `${value} keyword_groups stuck as 'queued' despite queue completion`,
    };
  });
}

// ════════════════════════════════════════════
// Group C — Discovery Health
// ════════════════════════════════════════════

export function checkKeywordsDiscovered(db: Database.Database): HealthCheckResult {
  return safeCheck('keywords_discovered', 'rolling_7d', () => {
    const row = db.prepare(
      `SELECT COUNT(*) as cnt FROM keywords WHERE discovered_at > datetime('now', '-7 days')`
    ).get() as { cnt: number };
    const value = row.cnt;
    let status: CheckStatus = 'green';
    if (value === 0) status = 'red';
    else if (value <= 20) status = 'yellow';
    return {
      check_id: 'keywords_discovered',
      window: 'rolling_7d',
      status,
      value,
      threshold: { green: '> 20', yellow: '1-20', red: '0' },
      summary: `${value} new keywords discovered in last 7d`,
    };
  });
}

export function checkKeywordsUngrouped(db: Database.Database): HealthCheckResult {
  return safeCheck('keywords_ungrouped', 'snapshot', () => {
    // Keywords with a cluster_slug that belongs to a keyword_group are considered "grouped"
    const total = db.prepare(
      `SELECT COUNT(*) as cnt FROM keywords WHERE cluster_slug IS NOT NULL`
    ).get() as { cnt: number };

    if (total.cnt === 0) {
      return {
        check_id: 'keywords_ungrouped',
        window: 'snapshot',
        status: 'info',
        value: 0,
        threshold: { green: '< 30%', yellow: '30-60%', red: '> 60%' },
        summary: 'No keywords with cluster_slug',
      };
    }

    const grouped = db.prepare(
      `SELECT COUNT(DISTINCT k.id) as cnt FROM keywords k
       WHERE k.cluster_slug IN (SELECT DISTINCT kg.cluster_slug FROM keyword_groups kg WHERE kg.cluster_slug IS NOT NULL)`
    ).get() as { cnt: number };

    const ungroupedPct = Math.round(((total.cnt - grouped.cnt) / total.cnt) * 100);
    let status: CheckStatus = 'green';
    if (ungroupedPct > 60) status = 'red';
    else if (ungroupedPct >= 30) status = 'yellow';

    return {
      check_id: 'keywords_ungrouped',
      window: 'snapshot',
      status,
      value: ungroupedPct,
      threshold: { green: '< 30%', yellow: '30-60%', red: '> 60%' },
      summary: `${ungroupedPct}% of keywords ungrouped (${total.cnt - grouped.cnt}/${total.cnt})`,
    };
  });
}

export function checkGroupsUnscored(db: Database.Database): HealthCheckResult {
  return safeCheck('groups_unscored', 'snapshot', () => {
    const total = db.prepare(`SELECT COUNT(*) as cnt FROM keyword_groups`).get() as { cnt: number };
    if (total.cnt === 0) {
      return {
        check_id: 'groups_unscored',
        window: 'snapshot',
        status: 'info',
        value: 0,
        threshold: { green: '< 20%', yellow: '20-50%', red: '> 50%' },
        summary: 'No keyword groups',
      };
    }
    const unscored = db.prepare(
      `SELECT COUNT(*) as cnt FROM keyword_groups WHERE priority_score = 0`
    ).get() as { cnt: number };
    const pct = Math.round((unscored.cnt / total.cnt) * 100);
    let status: CheckStatus = 'green';
    if (pct > 50) status = 'red';
    else if (pct >= 20) status = 'yellow';
    return {
      check_id: 'groups_unscored',
      window: 'snapshot',
      status,
      value: pct,
      threshold: { green: '< 20%', yellow: '20-50%', red: '> 50%' },
      summary: `${pct}% of keyword groups unscored (${unscored.cnt}/${total.cnt})`,
    };
  });
}

export function checkDiscoveryRecency(db: Database.Database): HealthCheckResult {
  return safeCheck('discovery_recency', 'snapshot', () => {
    const row = db.prepare(
      `SELECT MAX(discovered_at) as latest FROM keywords`
    ).get() as { latest: string | null };

    if (!row.latest) {
      return {
        check_id: 'discovery_recency',
        window: 'snapshot',
        status: 'red',
        value: -1,
        threshold: { green: '< 5 days', yellow: '5-10 days', red: '> 10 days' },
        summary: 'No keywords in DB — discovery has never run',
      };
    }

    const latestDate = new Date(row.latest + 'Z');
    const ageDays = Math.floor((Date.now() - latestDate.getTime()) / 86400_000);
    let status: CheckStatus = 'green';
    if (ageDays > 10) status = 'red';
    else if (ageDays >= 5) status = 'yellow';

    return {
      check_id: 'discovery_recency',
      window: 'snapshot',
      status,
      value: ageDays,
      threshold: { green: '< 5 days', yellow: '5-10 days', red: '> 10 days' },
      summary: `Last discovery was ${ageDays} days ago`,
      detail: `Latest keyword discovered_at: ${row.latest}`,
    };
  });
}

// ════════════════════════════════════════════
// Group D — Content Coverage
// ════════════════════════════════════════════

export function checkContentGeneratedToday(db: Database.Database, opts?: CheckOptions): HealthCheckResult {
  return safeCheck('content_generated_today', 'today', () => {
    const row = db.prepare(
      `SELECT COUNT(*) as cnt FROM content WHERE created_at > datetime('now', '-24 hours')`
    ).get() as { cnt: number };
    const value = row.cnt;
    const now = opts?.now ?? new Date();
    const weekday = isWeekday(now);
    let status: CheckStatus = 'green';
    if (value === 0 && weekday) status = 'red';
    else if (value < 3 && value > 0) status = 'yellow';
    else if (value === 0 && !weekday) status = 'green';
    return {
      check_id: 'content_generated_today',
      window: 'today',
      status,
      value,
      threshold: { green: '>= 3', yellow: '1-2', red: '0 (weekday)' },
      summary: value === 0 && !weekday
        ? '0 content generated today (weekend — OK)'
        : `${value} content pages generated today`,
    };
  });
}

export function checkCoverageVelocity(db: Database.Database): HealthCheckResult {
  return safeCheck('coverage_velocity', 'rolling_7d', () => {
    const thisWeek = db.prepare(
      `SELECT COUNT(*) as cnt FROM content WHERE created_at > datetime('now', '-7 days')`
    ).get() as { cnt: number };
    const lastWeek = db.prepare(
      `SELECT COUNT(*) as cnt FROM content
       WHERE created_at > datetime('now', '-14 days')
         AND created_at <= datetime('now', '-7 days')`
    ).get() as { cnt: number };

    const value = thisWeek.cnt;
    let status: CheckStatus = 'green';
    if (lastWeek.cnt > 0) {
      const change = (thisWeek.cnt - lastWeek.cnt) / lastWeek.cnt;
      if (thisWeek.cnt === 0 || change < -0.5) status = 'red';
      else if (change < -0.3) status = 'yellow';
    } else if (thisWeek.cnt === 0) {
      status = 'red';
    }

    return {
      check_id: 'coverage_velocity',
      window: 'rolling_7d',
      status,
      value,
      threshold: { green: 'stable or growing', yellow: 'decline < 30%', red: 'decline > 50% or 0' },
      summary: `${thisWeek.cnt} content this week vs ${lastWeek.cnt} last week`,
    };
  });
}

export function checkContentTypeBalance(db: Database.Database): HealthCheckResult {
  return safeCheck('content_type_balance', 'snapshot', () => {
    const rows = db.prepare(
      `SELECT type, COUNT(*) as cnt FROM content WHERE lang = 'en' GROUP BY type`
    ).all() as Array<{ type: string; cnt: number }>;

    const total = rows.reduce((s, r) => s + r.cnt, 0);
    if (total === 0) {
      return {
        check_id: 'content_type_balance',
        window: 'snapshot',
        status: 'info',
        value: 0,
        threshold: { green: 'faq+compare >= 30%', yellow: '15-30%', red: '< 15%' },
        summary: 'No content in DB',
      };
    }

    const faqCompare = rows
      .filter(r => r.type === 'faq' || r.type === 'compare')
      .reduce((s, r) => s + r.cnt, 0);
    const pct = Math.round((faqCompare / total) * 100);

    let status: CheckStatus = 'green';
    if (pct < 15) status = 'red';
    else if (pct < 30) status = 'yellow';

    const breakdown = rows.map(r => `${r.type}: ${r.cnt}`).join(', ');

    return {
      check_id: 'content_type_balance',
      window: 'snapshot',
      status,
      value: pct,
      threshold: { green: 'faq+compare >= 30%', yellow: '15-30%', red: '< 15%' },
      summary: `FAQ+Compare = ${pct}% of content (${faqCompare}/${total})`,
      detail: breakdown,
    };
  });
}

export function checkBilingualCoverage(db: Database.Database): HealthCheckResult {
  return safeCheck('bilingual_coverage', 'snapshot', () => {
    const en = db.prepare(
      `SELECT COUNT(*) as cnt FROM content WHERE lang = 'en'`
    ).get() as { cnt: number };
    const zh = db.prepare(
      `SELECT COUNT(*) as cnt FROM content WHERE lang = 'zh'`
    ).get() as { cnt: number };

    if (en.cnt === 0) {
      return {
        check_id: 'bilingual_coverage',
        window: 'snapshot',
        status: 'info',
        value: 0,
        threshold: { green: '>= 80%', yellow: '60-80%', red: '< 60%' },
        summary: 'No EN content in DB',
      };
    }

    const pct = Math.round((zh.cnt / en.cnt) * 100);
    let status: CheckStatus = 'green';
    if (pct < 60) status = 'red';
    else if (pct < 80) status = 'yellow';

    return {
      check_id: 'bilingual_coverage',
      window: 'snapshot',
      status,
      value: pct,
      threshold: { green: '>= 80%', yellow: '60-80%', red: '< 60%' },
      summary: `ZH coverage: ${pct}% (${zh.cnt} ZH / ${en.cnt} EN)`,
    };
  });
}

export function checkTopicCoverage(db: Database.Database): HealthCheckResult {
  return safeCheck('topic_coverage', 'snapshot', () => {
    // Per flagship topic: keywords discovered vs keywords with content
    const rows = db.prepare(
      `SELECT
         tc.slug,
         COUNT(DISTINCT k.id) as total_kw,
         SUM(CASE WHEN k.content_exists = 1 THEN 1 ELSE 0 END) as covered_kw
       FROM topic_clusters tc
       LEFT JOIN keywords k ON k.cluster_slug = tc.slug
       GROUP BY tc.slug
       HAVING total_kw > 0
       ORDER BY total_kw DESC
       LIMIT 20`
    ).all() as Array<{ slug: string; total_kw: number; covered_kw: number }>;

    if (rows.length === 0) {
      return {
        check_id: 'topic_coverage',
        window: 'snapshot',
        status: 'info',
        value: 0,
        threshold: { green: '>= 30%', yellow: '10-30%', red: '< 10%' },
        summary: 'No topic clusters with keywords',
      };
    }

    const avgCoverage = rows.reduce((s, r) => s + (r.total_kw > 0 ? r.covered_kw / r.total_kw : 0), 0) / rows.length;
    const pct = Math.round(avgCoverage * 100);

    let status: CheckStatus = 'green';
    if (pct < 10) status = 'red';
    else if (pct < 30) status = 'yellow';

    const worstTopics = rows
      .filter(r => r.total_kw > 0)
      .map(r => ({ slug: r.slug, coverage: Math.round((r.covered_kw / r.total_kw) * 100) }))
      .sort((a, b) => a.coverage - b.coverage)
      .slice(0, 3);

    return {
      check_id: 'topic_coverage',
      window: 'snapshot',
      status,
      value: pct,
      threshold: { green: '>= 30%', yellow: '10-30%', red: '< 10%' },
      summary: `Average topic coverage: ${pct}%`,
      detail: `Worst: ${worstTopics.map(t => `${t.slug} (${t.coverage}%)`).join(', ')}`,
    };
  });
}

// ════════════════════════════════════════════
// Group E — Performance Loop Health
// ════════════════════════════════════════════

export function checkGscFreshness(db: Database.Database): HealthCheckResult {
  return safeCheck('gsc_freshness', 'snapshot', () => {
    const row = db.prepare(
      `SELECT MAX(snapshot_date) as latest FROM snapshots`
    ).get() as { latest: string | null };

    if (!row.latest) {
      return {
        check_id: 'gsc_freshness',
        window: 'snapshot',
        status: 'red',
        value: -1,
        threshold: { green: '< 10 days', yellow: '10-17 days', red: '> 17 days or no data' },
        summary: 'No snapshots — performance cycle has never run',
      };
    }

    const latestDate = new Date(row.latest + 'T00:00:00Z');
    const ageDays = Math.floor((Date.now() - latestDate.getTime()) / 86400_000);
    let status: CheckStatus = 'green';
    if (ageDays > 17) status = 'red';
    else if (ageDays >= 10) status = 'yellow';

    return {
      check_id: 'gsc_freshness',
      window: 'snapshot',
      status,
      value: ageDays,
      threshold: { green: '< 10 days', yellow: '10-17 days', red: '> 17 days or no data' },
      summary: `Latest snapshot is ${ageDays} days old (${row.latest})`,
    };
  });
}

export function checkRefreshActions(db: Database.Database): HealthCheckResult {
  return safeCheck('refresh_actions', 'rolling_7d', () => {
    const row = db.prepare(
      `SELECT COUNT(*) as cnt FROM create_queue
       WHERE content_type = 'refresh' AND created_at > datetime('now', '-7 days')`
    ).get() as { cnt: number };

    const hasGscData = db.prepare(
      `SELECT COUNT(*) as cnt FROM snapshots`
    ).get() as { cnt: number };

    const value = row.cnt;
    let status: CheckStatus = 'green';
    if (value === 0 && hasGscData.cnt > 0) status = 'red';
    else if (value === 0) status = 'green'; // no GSC data yet, not expected

    return {
      check_id: 'refresh_actions',
      window: 'rolling_7d',
      status,
      value,
      threshold: { green: '>= 1', yellow: '—', red: '0 (with GSC data)' },
      summary: value > 0
        ? `${value} refresh actions generated in last 7d`
        : hasGscData.cnt > 0
          ? 'No refresh actions generated despite GSC data existing'
          : 'No refresh actions (no GSC data yet — expected)',
    };
  });
}

// ════════════════════════════════════════════
// All checks registry
// ════════════════════════════════════════════

export type HealthCheckFn = (db: Database.Database, opts?: CheckOptions) => HealthCheckResult;

export const ALL_CHECKS: HealthCheckFn[] = [
  // A — Pipeline Stage Completion
  checkCollectToday,
  checkCollectTrend,
  checkNewsletterToday,
  checkNewsletterBilingual,
  checkEntityExtractRuns,
  // B — Queue Health
  checkQueuePending,
  checkQueueDrainRate,
  checkQueueDrainToday,
  checkQueueStuck,
  checkQueueGrowth,
  checkQueueAge,
  checkGroupsStatusSync,
  // C — Discovery Health
  checkKeywordsDiscovered,
  checkKeywordsUngrouped,
  checkGroupsUnscored,
  checkDiscoveryRecency,
  // D — Content Coverage
  checkContentGeneratedToday,
  checkCoverageVelocity,
  checkContentTypeBalance,
  checkBilingualCoverage,
  checkTopicCoverage,
  // E — Performance Loop Health
  checkGscFreshness,
  checkRefreshActions,
];
