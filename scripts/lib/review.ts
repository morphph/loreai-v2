/**
 * C5 — Review Cycle Orchestrator
 *
 * Runs health checks, assembles report. Read-only — never writes to DB.
 * Only writes report files to data/review/.
 *
 * @see docs/plans/specs/SPEC-C5-review-cycle.md
 */

import type Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';
import { todaySGT } from './date';
import {
  ALL_CHECKS,
  type HealthCheckResult,
  type CheckStatus,
  type CheckOptions,
} from './review-checks';
import {
  runPureQualityChecks,
  type PureQualityReport,
  type QualityCheckOptions,
} from './review-quality';

// ── Types ──

export interface HealthReport {
  generated_at: string;
  overall_status: 'green' | 'yellow' | 'red';
  checks: HealthCheckResult[];
  summary: {
    green: number;
    yellow: number;
    red: number;
    error: number;
    info: number;
  };
  issues: HealthCheckResult[];
}

export interface ReviewOptions {
  mode: 'health' | 'quality' | 'full' | 'strategic';
  topic?: string;
  format: 'json' | 'md';
  dryRun: boolean;
  model: 'sonnet' | 'haiku';
  backfill: number;
  backfillGroups: number;
  contentRoot?: string;
}

// ── Health Report ──

const STATUS_SEVERITY: Record<string, number> = {
  green: 0,
  info: 0,
  yellow: 1,
  red: 2,
  error: 2,
};

function worstStatus(checks: HealthCheckResult[]): 'green' | 'yellow' | 'red' {
  let worst = 0;
  for (const c of checks) {
    const sev = STATUS_SEVERITY[c.status] ?? 0;
    if (sev > worst) worst = sev;
  }
  if (worst >= 2) return 'red';
  if (worst >= 1) return 'yellow';
  return 'green';
}

export function runHealthChecks(db: Database.Database, opts?: CheckOptions): HealthReport {
  const checks: HealthCheckResult[] = [];

  for (const checkFn of ALL_CHECKS) {
    checks.push(checkFn(db, opts));
  }

  const summary = {
    green: checks.filter(c => c.status === 'green').length,
    yellow: checks.filter(c => c.status === 'yellow').length,
    red: checks.filter(c => c.status === 'red').length,
    error: checks.filter(c => c.status === 'error').length,
    info: checks.filter(c => c.status === 'info').length,
  };

  return {
    generated_at: new Date().toISOString(),
    overall_status: worstStatus(checks),
    checks,
    summary,
    issues: checks.filter(c => c.status === 'yellow' || c.status === 'red' || c.status === 'error'),
  };
}

// ── Quality Report ──

export interface QualityReport {
  generated_at: string;
  pure_checks: PureQualityReport;
  overall_quality: 'green' | 'yellow' | 'red';
  // LLM rubrics will be added here in follow-up
  llm_calls: number;
  llm_model: string;
  duration_ms: number;
}

export function runQualityChecks(db: Database.Database, opts?: QualityCheckOptions): QualityReport {
  const start = Date.now();

  // Phase 2 step 1: pure logic rubrics only (D, G, H)
  const pureChecks = runPureQualityChecks(db, opts);

  // Determine overall quality from pure checks
  const statuses = [
    pureChecks.priority_sanity.status,
    pureChecks.internal_linking.status,
    pureChecks.refresh_pipeline.status === 'not_implemented' ? 'info' : pureChecks.refresh_pipeline.status,
  ] as CheckStatus[];

  const STATUS_SEVERITY: Record<string, number> = {
    green: 0, info: 0, yellow: 1, red: 2, error: 2,
  };

  let worst = 0;
  for (const s of statuses) {
    const sev = STATUS_SEVERITY[s] ?? 0;
    if (sev > worst) worst = sev;
  }

  const overall = worst >= 2 ? 'red' : worst >= 1 ? 'yellow' : 'green';

  return {
    generated_at: new Date().toISOString(),
    pure_checks: pureChecks,
    overall_quality: overall,
    llm_calls: 0,
    llm_model: opts?.model ?? 'sonnet',
    duration_ms: Date.now() - start,
  };
}

// ── Quality Report Formatter ──

const QUALITY_STATUS_ICON: Record<string, string> = {
  green: '[OK]',
  yellow: '[WARN]',
  red: '[FAIL]',
  error: '[ERR]',
  info: '[INFO]',
  not_implemented: '[N/A]',
};

export function formatQualityReportMd(report: QualityReport): string {
  const lines: string[] = [];
  lines.push('# Pipeline Quality Report');
  lines.push(`Generated: ${report.generated_at}`);
  lines.push(`Overall: **${report.overall_quality.toUpperCase()}**`);
  lines.push(`LLM calls: ${report.llm_calls} | Model: ${report.llm_model} | Duration: ${report.duration_ms}ms`);
  lines.push('');

  // Rubric D
  const d = report.pure_checks.priority_sanity;
  lines.push(`## Rubric D — Priority Score Sanity ${QUALITY_STATUS_ICON[d.status]}`);
  if (d.issues.length === 0) {
    lines.push('No issues detected.');
  } else {
    for (const issue of d.issues) {
      lines.push(`- ${issue}`);
    }
  }
  lines.push('');

  // Rubric G
  const g = report.pure_checks.internal_linking;
  lines.push(`## Rubric G — Internal Linking ${QUALITY_STATUS_ICON[g.status]}`);
  if (g.by_topic.length === 0) {
    lines.push('No topic clusters with content found.');
  }
  for (const t of g.by_topic) {
    lines.push(`### ${t.topic} (${t.total_pages} pages)`);
    lines.push(`- Orphans: ${t.orphan_pages.length > 0 ? t.orphan_pages.join(', ') : 'none'}`);
    lines.push(`- Hub coverage: ${Math.round(t.hub_link_coverage * 100)}%`);
    lines.push(`- Broken links: ${t.broken_links.length}`);
    lines.push(`- Cross-cluster links: ${t.cross_cluster_links}`);
    lines.push(`- Reciprocal rate: ${Math.round(t.reciprocal_rate * 100)}%`);
  }
  lines.push('');

  // Rubric H
  const h = report.pure_checks.refresh_pipeline;
  lines.push(`## Rubric H — Refresh Pipeline ${QUALITY_STATUS_ICON[h.status]}`);
  lines.push(h.detail);
  lines.push('');

  return lines.join('\n');
}

// ── Report Storage ──

const REPORT_DIR = 'data/review';
const RETENTION_DAYS = 30;

export function saveReport(
  report: HealthReport,
  mode: string,
  rootDir: string = process.cwd(),
): string {
  const dir = path.join(rootDir, REPORT_DIR);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  const today = todaySGT();
  const ext = mode === 'strategic' ? 'md' : 'json';
  const filename = `${mode}-${today}.${ext}`;
  const filePath = path.join(dir, filename);

  fs.writeFileSync(filePath, JSON.stringify(report, null, 2), 'utf-8');
  return filePath;
}

export function cleanOldReports(rootDir: string = process.cwd()): number {
  const dir = path.join(rootDir, REPORT_DIR);
  if (!fs.existsSync(dir)) return 0;

  const cutoff = new Date(Date.now() - RETENTION_DAYS * 86400_000);
  const cutoffStr = cutoff.toISOString().slice(0, 10);
  let deleted = 0;

  for (const file of fs.readdirSync(dir)) {
    // Extract date from filename like health-2026-03-25.json
    const match = file.match(/\d{4}-\d{2}-\d{2}/);
    if (match && match[0] < cutoffStr) {
      fs.unlinkSync(path.join(dir, file));
      deleted++;
    }
  }
  return deleted;
}

// ── Markdown Formatter ──

const STATUS_ICON: Record<string, string> = {
  green: '[OK]',
  yellow: '[WARN]',
  red: '[FAIL]',
  error: '[ERR]',
  info: '[INFO]',
};

export function formatHealthReportMd(report: HealthReport): string {
  const lines: string[] = [];
  lines.push(`# Pipeline Health Report`);
  lines.push(`Generated: ${report.generated_at}`);
  lines.push(`Overall: **${report.overall_status.toUpperCase()}**`);
  lines.push('');
  lines.push(`| Status | Count |`);
  lines.push(`|--------|-------|`);
  lines.push(`| Green  | ${report.summary.green} |`);
  lines.push(`| Yellow | ${report.summary.yellow} |`);
  lines.push(`| Red    | ${report.summary.red} |`);
  lines.push(`| Error  | ${report.summary.error} |`);
  lines.push(`| Info   | ${report.summary.info} |`);
  lines.push('');

  if (report.issues.length > 0) {
    lines.push('## Issues');
    lines.push('');
    for (const issue of report.issues) {
      lines.push(`- ${STATUS_ICON[issue.status]} **${issue.check_id}** (${issue.window}): ${issue.summary}`);
      if (issue.detail) lines.push(`  ${issue.detail}`);
    }
    lines.push('');
  }

  lines.push('## All Checks');
  lines.push('');
  // Group by window
  for (const window of ['today', 'rolling_7d', 'snapshot'] as const) {
    const windowChecks = report.checks.filter(c => c.window === window);
    if (windowChecks.length === 0) continue;
    lines.push(`### ${window}`);
    lines.push('');
    for (const c of windowChecks) {
      lines.push(`- ${STATUS_ICON[c.status]} **${c.check_id}**: ${c.summary}`);
    }
    lines.push('');
  }

  return lines.join('\n');
}
