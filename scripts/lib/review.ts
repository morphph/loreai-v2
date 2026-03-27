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
import { runAutoFixes, type AutoFix } from './review-fixes';
import {
  runPureQualityChecks,
  runLLMQualityChecks,
  type PureQualityReport,
  type LLMQualityReport,
  type QualityCheckOptions,
  type LLMCallFn,
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
  auto_fixes?: AutoFix[];
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

// ── Auto-Fix ──

export function applyAutoFixes(db: Database.Database, report: HealthReport): HealthReport {
  const fixes = runAutoFixes(db, report.issues);
  if (fixes.length === 0) return report;
  return { ...report, auto_fixes: fixes };
}

// Re-export for convenience
export type { AutoFix } from './review-fixes';

// ── Quality Report ──

export interface QualityReport {
  generated_at: string;
  pure_checks: PureQualityReport;
  llm_checks?: LLMQualityReport;
  overall_quality: 'green' | 'yellow' | 'red';
  llm_calls: number;
  llm_model: string;
  duration_ms: number;
}

const MODEL_MAP: Record<string, string> = {
  sonnet: 'claude-sonnet-4-20250514',
  haiku: 'claude-haiku-4-5-20251001',
};

export async function runQualityChecks(
  db: Database.Database,
  opts?: QualityCheckOptions & { callLLM?: LLMCallFn },
): Promise<QualityReport> {
  const start = Date.now();

  // Pure logic rubrics (D, G, H) — always run
  const pureChecks = runPureQualityChecks(db, opts);

  // LLM rubrics (A, B, C, E, F) — skip if no callLLM provided
  let llmChecks: LLMQualityReport | undefined;
  if (opts?.callLLM) {
    try {
      llmChecks = await runLLMQualityChecks(db, opts.callLLM, opts);
    } catch (err) {
      console.error('LLM quality checks failed (pure rubric results preserved):', err);
    }
  }

  // Determine overall quality from all checks
  const statuses: CheckStatus[] = [
    pureChecks.priority_sanity.status,
    pureChecks.internal_linking.status,
    pureChecks.refresh_pipeline.status === 'not_implemented' ? 'info' : pureChecks.refresh_pipeline.status,
  ];

  if (llmChecks) {
    statuses.push(
      llmChecks.keyword_coherence.status,
      llmChecks.content_intent_match.status,
      llmChecks.content_aeo_readiness.status,
      llmChecks.subtopic_discovery.status,
      llmChecks.keyword_quality.status,
    );
  }

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
    llm_checks: llmChecks,
    overall_quality: overall,
    llm_calls: llmChecks?.llm_calls ?? 0,
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

  // LLM Rubrics (if present)
  if (report.llm_checks) {
    const lc = report.llm_checks;

    // Rubric A
    const a = lc.keyword_coherence;
    lines.push(`## Rubric A — Keyword Group Coherence ${QUALITY_STATUS_ICON[a.status]}`);
    lines.push(`Samples: ${a.samples_scored} | Average: ${a.average_score}`);
    if (a.worst_groups.length > 0) {
      lines.push('Worst groups:');
      for (const w of a.worst_groups) {
        lines.push(`- ${w.primary_keyword} (score=${w.score}): ${w.reason}`);
      }
    }
    if (a.errors.length > 0) lines.push(`Errors: ${a.errors.length}`);
    lines.push('');

    // Rubric B
    const b = lc.content_intent_match;
    lines.push(`## Rubric B — Content Intent Match ${QUALITY_STATUS_ICON[b.status]}`);
    lines.push(`Samples: ${b.samples_scored} | Average: ${b.average_score}`);
    for (const [type, data] of Object.entries(b.by_type)) {
      lines.push(`- ${type}: avg=${data.average} (n=${data.count})`);
    }
    if (b.worst_pieces.length > 0) {
      lines.push('Worst pieces:');
      for (const w of b.worst_pieces) {
        lines.push(`- ${w.type}/${w.slug} (score=${w.score}): ${w.reason}`);
      }
    }
    lines.push('');

    // Rubric C
    const c = lc.content_aeo_readiness;
    lines.push(`## Rubric C — Content AEO Readiness ${QUALITY_STATUS_ICON[c.status]}`);
    lines.push(`Samples: ${c.samples_scored} | Average: ${c.average_score}`);
    if (c.common_issues.length > 0) {
      lines.push('Common issues:');
      for (const issue of c.common_issues) {
        lines.push(`- ${issue}`);
      }
    }
    lines.push('');

    // Rubric E
    const e = lc.subtopic_discovery;
    lines.push(`## Rubric E — Subtopic Discovery ${QUALITY_STATUS_ICON[e.status]}`);
    lines.push(`Samples: ${e.samples_scored} | Average: ${e.average_score}`);
    if (e.worst_subtopics.length > 0) {
      lines.push('Worst subtopics:');
      for (const w of e.worst_subtopics) {
        lines.push(`- ${w.slug} (score=${w.score}): ${w.reason}`);
      }
    }
    lines.push('');

    // Rubric F
    const f = lc.keyword_quality;
    lines.push(`## Rubric F — Raw Keyword Quality ${QUALITY_STATUS_ICON[f.status]}`);
    lines.push(`Samples: ${f.samples_scored} | Average: ${f.average_score} | Junk rate: ${Math.round(f.junk_rate * 100)}%`);
    if (Object.keys(f.junk_rate_by_source).length > 0) {
      lines.push('Junk rate by source:');
      for (const [source, rate] of Object.entries(f.junk_rate_by_source)) {
        lines.push(`- ${source}: ${Math.round(rate * 100)}%`);
      }
    }
    lines.push('');
  }

  return lines.join('\n');
}

// ── Report Storage ──

const REPORT_DIR = 'data/review';
const RETENTION_DAYS = 30;

export function saveReport(
  report: HealthReport | QualityReport | string,
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

  const content = typeof report === 'string' ? report : JSON.stringify(report, null, 2);
  fs.writeFileSync(filePath, content, 'utf-8');
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

// ── Trend Tracking ──

export interface QualityTrend {
  previous_report_date: string | null;
  deltas: {
    keyword_coherence: number | null;
    content_intent_match: number | null;
    content_aeo_readiness: number | null;
    keyword_quality_junk_rate: number | null;
  };
}

export function loadLatestReport<T>(
  mode: string,
  rootDir: string = process.cwd(),
): { date: string; report: T } | null {
  const dir = path.join(rootDir, REPORT_DIR);
  if (!fs.existsSync(dir)) return null;

  const files = fs.readdirSync(dir)
    .filter(f => f.startsWith(`${mode}-`) && f.endsWith('.json'))
    .sort()
    .reverse();

  if (files.length === 0) return null;

  const dateMatch = files[0].match(/\d{4}-\d{2}-\d{2}/);
  if (!dateMatch) return null;

  const content = fs.readFileSync(path.join(dir, files[0]), 'utf-8');
  return { date: dateMatch[0], report: JSON.parse(content) as T };
}

export function loadReportsInRange<T>(
  mode: string,
  days: number,
  rootDir: string = process.cwd(),
): Array<{ date: string; report: T }> {
  const dir = path.join(rootDir, REPORT_DIR);
  if (!fs.existsSync(dir)) return [];

  const cutoff = new Date(Date.now() - days * 86400_000).toISOString().slice(0, 10);

  return fs.readdirSync(dir)
    .filter(f => f.startsWith(`${mode}-`) && f.endsWith('.json'))
    .sort()
    .map(f => {
      const dateMatch = f.match(/\d{4}-\d{2}-\d{2}/);
      if (!dateMatch || dateMatch[0] < cutoff) return null;
      const content = fs.readFileSync(path.join(dir, f), 'utf-8');
      return { date: dateMatch[0], report: JSON.parse(content) as T };
    })
    .filter((x): x is { date: string; report: T } => x !== null);
}

export function computeQualityTrends(
  current: QualityReport,
  rootDir: string = process.cwd(),
): QualityTrend {
  const prev = loadLatestReport<QualityReport>('quality', rootDir);

  if (!prev || !prev.report.llm_checks) {
    return {
      previous_report_date: prev?.date ?? null,
      deltas: {
        keyword_coherence: null,
        content_intent_match: null,
        content_aeo_readiness: null,
        keyword_quality_junk_rate: null,
      },
    };
  }

  const prevLLM = prev.report.llm_checks;
  const curLLM = current.llm_checks;

  const delta = (cur: number | undefined, prev: number): number | null =>
    cur != null ? Math.round((cur - prev) * 100) / 100 : null;

  return {
    previous_report_date: prev.date,
    deltas: {
      keyword_coherence: delta(curLLM?.keyword_coherence.average_score, prevLLM.keyword_coherence.average_score),
      content_intent_match: delta(curLLM?.content_intent_match.average_score, prevLLM.content_intent_match.average_score),
      content_aeo_readiness: delta(curLLM?.content_aeo_readiness.average_score, prevLLM.content_aeo_readiness.average_score),
      keyword_quality_junk_rate: delta(curLLM?.keyword_quality.junk_rate, prevLLM.keyword_quality.junk_rate),
    },
  };
}

// ── Strategic Report Generator ──

export interface StrategicContext {
  db: Database.Database;
  rootDir?: string;
  contentRoot?: string;
}

export function generateStrategicReport(ctx: StrategicContext): string {
  const { db, rootDir = process.cwd(), contentRoot = process.cwd() } = ctx;
  const today = todaySGT();
  const lines: string[] = [];

  lines.push(`# LoreAI Strategic Review — ${today}`);
  lines.push('');

  // ── Section 1: Pipeline Health ──
  const latestHealth = loadLatestReport<HealthReport>('health', rootDir);
  if (latestHealth) {
    lines.push('## Pipeline Health (Layer 1)');
    lines.push(`*From: ${latestHealth.date}*`);
    lines.push(`Overall: **${latestHealth.report.overall_status.toUpperCase()}**`);
    lines.push('');
    if (latestHealth.report.issues.length > 0) {
      lines.push('Issues:');
      for (const issue of latestHealth.report.issues) {
        lines.push(`- [${issue.status.toUpperCase()}] **${issue.check_id}**: ${issue.summary}`);
      }
    } else {
      lines.push('No issues detected.');
    }
    lines.push('');
  } else {
    lines.push('## Pipeline Health (Layer 1)');
    lines.push('*No health report available — run `--mode=health` first.*');
    lines.push('');
  }

  // ── Section 2: Quality Scores + Trends ──
  const qualityReports = loadReportsInRange<QualityReport>('quality', 7, rootDir);
  const latestQuality = qualityReports.length > 0 ? qualityReports[qualityReports.length - 1] : null;

  lines.push('## Quality Scores (Layer 2)');
  if (latestQuality) {
    const q = latestQuality.report;
    lines.push(`*From: ${latestQuality.date} | Overall: ${q.overall_quality.toUpperCase()}*`);
    lines.push('');

    // Pure checks summary
    const d = q.pure_checks.priority_sanity;
    const g = q.pure_checks.internal_linking;
    const h = q.pure_checks.refresh_pipeline;
    lines.push(`| Rubric | Status | Detail |`);
    lines.push(`|--------|--------|--------|`);
    lines.push(`| D — Priority | ${d.status.toUpperCase()} | ${d.issues.length} issues |`);
    lines.push(`| G — Linking | ${g.status.toUpperCase()} | ${g.by_topic.length} topics |`);
    lines.push(`| H — Refresh | ${h.status.toUpperCase()} | ${h.detail.slice(0, 60)} |`);

    // LLM checks summary
    if (q.llm_checks) {
      const lc = q.llm_checks;
      lines.push(`| A — Coherence | ${lc.keyword_coherence.status.toUpperCase()} | avg=${lc.keyword_coherence.average_score} (n=${lc.keyword_coherence.samples_scored}) |`);
      lines.push(`| B — Intent | ${lc.content_intent_match.status.toUpperCase()} | avg=${lc.content_intent_match.average_score} (n=${lc.content_intent_match.samples_scored}) |`);
      lines.push(`| C — AEO | ${lc.content_aeo_readiness.status.toUpperCase()} | avg=${lc.content_aeo_readiness.average_score} (n=${lc.content_aeo_readiness.samples_scored}) |`);
      lines.push(`| E — Subtopics | ${lc.subtopic_discovery.status.toUpperCase()} | avg=${lc.subtopic_discovery.average_score} (n=${lc.subtopic_discovery.samples_scored}) |`);
      lines.push(`| F — Keywords | ${lc.keyword_quality.status.toUpperCase()} | junk=${Math.round(lc.keyword_quality.junk_rate * 100)}% (n=${lc.keyword_quality.samples_scored}) |`);
    }
    lines.push('');

    // Weekly trends from multiple quality reports
    if (qualityReports.length >= 2) {
      const first = qualityReports[0].report;
      const last = qualityReports[qualityReports.length - 1].report;
      lines.push('### Weekly Trends');
      lines.push(`Reports this week: ${qualityReports.length}`);
      lines.push('');
      if (first.llm_checks && last.llm_checks) {
        const trend = (label: string, cur: number, prev: number) => {
          const d = Math.round((cur - prev) * 100) / 100;
          const arrow = d > 0 ? '+' : d < 0 ? '' : '=';
          return `- ${label}: ${prev} → ${cur} (${arrow}${d})`;
        };
        lines.push(trend('Keyword coherence', last.llm_checks.keyword_coherence.average_score, first.llm_checks.keyword_coherence.average_score));
        lines.push(trend('Intent match', last.llm_checks.content_intent_match.average_score, first.llm_checks.content_intent_match.average_score));
        lines.push(trend('AEO readiness', last.llm_checks.content_aeo_readiness.average_score, first.llm_checks.content_aeo_readiness.average_score));
        lines.push(trend('Junk rate', last.llm_checks.keyword_quality.junk_rate, first.llm_checks.keyword_quality.junk_rate));
      }
      lines.push('');
    }
  } else {
    lines.push('*No quality report available — run `--mode=quality` first.*');
    lines.push('');
  }

  // ── Section 3: Content Inventory ──
  lines.push('## Content Inventory');
  const contentTypes = ['blog', 'faq', 'compare', 'glossary', 'topics'] as const;
  for (const type of contentTypes) {
    const enDir = path.join(contentRoot, 'content', type, 'en');
    const zhDir = path.join(contentRoot, 'content', type, 'zh');
    const enCount = countContentFiles(enDir);
    const zhCount = countContentFiles(zhDir);
    lines.push(`- ${type}: ${enCount} EN / ${zhCount} ZH`);
  }
  lines.push('');

  // ── Section 4: Flagship Topic Status ──
  lines.push('## Flagship Topic Status');
  try {
    const topicRows = db.prepare(
      `SELECT
         tc.slug,
         COUNT(DISTINCT k.id) as total_kw,
         SUM(CASE WHEN k.content_exists = 1 THEN 1 ELSE 0 END) as covered_kw
       FROM topic_clusters tc
       LEFT JOIN keywords k ON k.cluster_slug = tc.slug
       GROUP BY tc.slug
       HAVING total_kw > 0
       ORDER BY total_kw DESC
       LIMIT 15`
    ).all() as Array<{ slug: string; total_kw: number; covered_kw: number }>;

    // Also get group/queue counts per topic
    const groupRows = db.prepare(
      `SELECT cluster_slug, COUNT(*) as cnt, status
       FROM keyword_groups
       WHERE cluster_slug IS NOT NULL
       GROUP BY cluster_slug, status`
    ).all() as Array<{ cluster_slug: string; cnt: number; status: string }>;

    const groupMap = new Map<string, Record<string, number>>();
    for (const r of groupRows) {
      if (!groupMap.has(r.cluster_slug)) groupMap.set(r.cluster_slug, {});
      groupMap.get(r.cluster_slug)![r.status] = r.cnt;
    }

    const queueRows = db.prepare(
      `SELECT kg.cluster_slug, cq.status, COUNT(*) as cnt
       FROM create_queue cq
       JOIN keyword_groups kg ON cq.keyword_group_id = kg.group_id
       WHERE kg.cluster_slug IS NOT NULL
       GROUP BY kg.cluster_slug, cq.status`
    ).all() as Array<{ cluster_slug: string; status: string; cnt: number }>;

    const queueMap = new Map<string, Record<string, number>>();
    for (const r of queueRows) {
      if (!queueMap.has(r.cluster_slug)) queueMap.set(r.cluster_slug, {});
      queueMap.get(r.cluster_slug)![r.status] = r.cnt;
    }

    lines.push('| Topic | Keywords | Covered | Groups | Queue | Coverage |');
    lines.push('|-------|----------|---------|--------|-------|----------|');
    for (const row of topicRows) {
      const coverage = row.total_kw > 0 ? Math.round((row.covered_kw / row.total_kw) * 100) : 0;
      const gs = groupMap.get(row.slug) ?? {};
      const qs = queueMap.get(row.slug) ?? {};
      const groupTotal = Object.values(gs).reduce((s, n) => s + n, 0);
      const queueTotal = Object.values(qs).reduce((s, n) => s + n, 0);
      lines.push(`| ${row.slug} | ${row.total_kw} | ${row.covered_kw} | ${groupTotal} | ${queueTotal} | ${coverage}% |`);
    }
  } catch {
    lines.push('*Could not query topic data.*');
  }
  lines.push('');

  // ── Section 5: Top 10 Queue ──
  lines.push('## Top 10 Queue (What System Wants to Build Next)');
  try {
    const queueItems = db.prepare(
      `SELECT cq.job_id, kg.primary_keyword, cq.content_type, cq.priority_score
       FROM create_queue cq
       JOIN keyword_groups kg ON cq.keyword_group_id = kg.group_id
       WHERE cq.status = 'pending'
       ORDER BY cq.priority_score DESC
       LIMIT 10`
    ).all() as Array<{ job_id: number; primary_keyword: string; content_type: string; priority_score: number }>;

    if (queueItems.length > 0) {
      for (const item of queueItems) {
        lines.push(`- [${item.priority_score}] ${item.primary_keyword} (${item.content_type})`);
      }
    } else {
      lines.push('*Queue is empty.*');
    }
  } catch {
    lines.push('*Could not query queue.*');
  }
  lines.push('');

  // ── Section 6: Bottom 5 Quality Samples ──
  lines.push('## Bottom 5 Quality Samples (What Needs Attention)');
  if (latestQuality?.report.llm_checks) {
    const lc = latestQuality.report.llm_checks;
    const worstContent = lc.content_intent_match.worst_pieces.slice(0, 5);
    if (worstContent.length > 0) {
      for (const w of worstContent) {
        lines.push(`- ${w.type}/${w.slug} (intent score=${w.score}): ${w.reason}`);
      }
    } else {
      lines.push('*No low-scoring content samples.*');
    }
  } else {
    lines.push('*No LLM quality data available.*');
  }
  lines.push('');

  // ── Section 7: Worst Keyword Groups ──
  lines.push('## Worst Keyword Groups (Grouping Issues)');
  if (latestQuality?.report.llm_checks) {
    const worstGroups = latestQuality.report.llm_checks.keyword_coherence.worst_groups.slice(0, 5);
    if (worstGroups.length > 0) {
      for (const w of worstGroups) {
        lines.push(`- ${w.primary_keyword} (score=${w.score}): ${w.reason}`);
      }
    } else {
      lines.push('*No low-scoring keyword groups.*');
    }
  } else {
    lines.push('*No LLM quality data available.*');
  }
  lines.push('');

  // ── Section 8: Questions for Human Review ──
  lines.push('## Questions for Human Review');
  const questions = generateReviewQuestions(latestHealth?.report ?? null, latestQuality?.report ?? null);
  if (questions.length > 0) {
    for (const q of questions) {
      lines.push(`- ${q}`);
    }
  } else {
    lines.push('*No auto-generated questions — everything looks healthy.*');
  }
  lines.push('');

  return lines.join('\n');
}

function countContentFiles(dir: string): number {
  if (!fs.existsSync(dir)) return 0;
  return fs.readdirSync(dir).filter(f => f.endsWith('.md') && f !== '.gitkeep').length;
}

function generateReviewQuestions(
  health: HealthReport | null,
  quality: QualityReport | null,
): string[] {
  const questions: string[] = [];

  if (health) {
    for (const issue of health.issues) {
      if (issue.check_id === 'queue_drain_rate' && issue.value === 0) {
        questions.push('Queue drain rate is 0. Is process-queue.ts cron running?');
      }
      if (issue.check_id === 'newsletter_published' && issue.status === 'red') {
        questions.push(`Newsletter missing: ${issue.summary}. Check write-newsletter.ts cron?`);
      }
      if (issue.check_id === 'discovery_freshness' && issue.status === 'red') {
        questions.push('Discovery cycle is stale. Check discovery-cycle.ts cron?');
      }
      if (issue.check_id === 'queue_stuck_items' && issue.status !== 'green') {
        questions.push(`${issue.value} stuck queue items. Investigate process-queue.ts failures?`);
      }
    }
  }

  if (quality?.llm_checks) {
    const lc = quality.llm_checks;
    if (lc.keyword_coherence.average_score < 3.5) {
      questions.push(`Keyword coherence is ${lc.keyword_coherence.average_score}/5. Review grouping prompt?`);
    }
    if (lc.content_aeo_readiness.average_score < 3.0) {
      questions.push(`AEO readiness is ${lc.content_aeo_readiness.average_score}/5. Update SEO skill prompt?`);
    }
    if (lc.content_intent_match.average_score < 3.0) {
      questions.push(`Intent match is ${lc.content_intent_match.average_score}/5. Check content generation prompts?`);
    }
    if (lc.keyword_quality.junk_rate > 0.3) {
      questions.push(`Keyword junk rate is ${Math.round(lc.keyword_quality.junk_rate * 100)}%. Tighten discovery filters?`);
    }
  }

  if (quality?.pure_checks) {
    const d = quality.pure_checks.priority_sanity;
    if (d.status === 'red') {
      questions.push(`Priority scoring has ${d.issues.length} issues. Review scoring logic?`);
    }
    const g = quality.pure_checks.internal_linking;
    if (g.status === 'red') {
      const totalOrphans = g.by_topic.reduce((s, t) => s + t.orphan_pages.length, 0);
      questions.push(`${totalOrphans} orphan pages detected. Add internal links?`);
    }
  }

  return questions;
}

// ── Markdown Formatter ──

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

  if (report.auto_fixes && report.auto_fixes.length > 0) {
    lines.push('## Auto-Fixes Applied');
    lines.push('');
    for (const fix of report.auto_fixes) {
      lines.push(`- [FIX] **${fix.check_id}**: ${fix.action}`);
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
