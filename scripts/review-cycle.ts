/**
 * C5 — Review Cycle CLI
 *
 * Pipeline health monitoring and quality sampling. Read-only.
 *
 * Usage:
 *   npx tsx scripts/review-cycle.ts --mode=health              # Layer 1 health checks (pure SQL)
 *   npx tsx scripts/review-cycle.ts --mode=health --format=md  # Markdown output
 *   npx tsx scripts/review-cycle.ts --mode=quality             # Layer 2 LLM quality sampling
 *   npx tsx scripts/review-cycle.ts --mode=full                # Layer 1 + Layer 2
 *   npx tsx scripts/review-cycle.ts --mode=strategic           # Strategic context package
 *
 * @see docs/plans/specs/SPEC-C5-review-cycle.md
 */

import 'dotenv/config';
import {
  runHealthChecks,
  runQualityChecks,
  saveReport,
  cleanOldReports,
  formatHealthReportMd,
  formatQualityReportMd,
} from './lib/review';
import { getDb, closeDb } from './lib/db';

import type { ReviewOptions } from './lib/review';

// ── Parse CLI args ──

const args = process.argv.slice(2);

function getArg(name: string): string | undefined {
  const arg = args.find((a) => a.startsWith(`--${name}=`));
  return arg?.split('=').slice(1).join('=');
}

const opts: ReviewOptions = {
  mode: (getArg('mode') as ReviewOptions['mode']) ?? 'health',
  topic: getArg('topic'),
  format: (getArg('format') as 'json' | 'md') ?? 'json',
  dryRun: args.includes('--dry-run'),
  model: (getArg('model') as 'sonnet' | 'haiku') ?? 'sonnet',
  backfill: Number(getArg('backfill') ?? 2),
  backfillGroups: Number(getArg('backfill-groups') ?? 3),
};

// ── Main ──

async function main() {
  console.error('=== Review Cycle ===');
  console.error('='.repeat(50));
  console.error(`Mode: ${opts.mode} | Format: ${opts.format}`);

  if (opts.dryRun) {
    console.error('DRY RUN mode\n');
  }

  // Clean old reports on startup
  const cleaned = cleanOldReports();
  if (cleaned > 0) {
    console.error(`Cleaned ${cleaned} old reports (> 30 days)\n`);
  }

  const db = getDb();

  if (opts.mode === 'health' || opts.mode === 'full') {
    console.error('Running Layer 1 health checks...');
    const report = runHealthChecks(db);

    // Save report
    const savedPath = saveReport(report, 'health');
    console.error(`Report saved: ${savedPath}`);

    // Output to stdout
    if (opts.format === 'md') {
      console.log(formatHealthReportMd(report));
    } else {
      console.log(JSON.stringify(report, null, 2));
    }

    // Summary to stderr
    console.error(`\nOverall: ${report.overall_status.toUpperCase()}`);
    console.error(`  Green: ${report.summary.green} | Yellow: ${report.summary.yellow} | Red: ${report.summary.red} | Error: ${report.summary.error}`);
    if (report.issues.length > 0) {
      console.error(`\nIssues (${report.issues.length}):`);
      for (const issue of report.issues) {
        console.error(`  [${issue.status.toUpperCase()}] ${issue.check_id}: ${issue.summary}`);
      }
    }
  }

  if (opts.mode === 'quality' || opts.mode === 'full') {
    console.error('\nRunning Layer 2 quality checks (pure logic rubrics)...');
    const qualityReport = runQualityChecks(db, {
      contentRoot: opts.contentRoot,
      topic: opts.topic,
      dryRun: opts.dryRun,
      model: opts.model,
    });

    const savedQPath = saveReport(qualityReport as unknown as import('./lib/review').HealthReport, 'quality');
    console.error(`Quality report saved: ${savedQPath}`);

    if (opts.format === 'md') {
      console.log(formatQualityReportMd(qualityReport));
    } else {
      console.log(JSON.stringify(qualityReport, null, 2));
    }

    console.error(`\nQuality overall: ${qualityReport.overall_quality.toUpperCase()}`);
    console.error(`  Duration: ${qualityReport.duration_ms}ms | LLM calls: ${qualityReport.llm_calls}`);

    const d = qualityReport.pure_checks.priority_sanity;
    const g = qualityReport.pure_checks.internal_linking;
    const h = qualityReport.pure_checks.refresh_pipeline;
    console.error(`  Rubric D (priority): ${d.status.toUpperCase()} (${d.issues.length} issues)`);
    console.error(`  Rubric G (linking): ${g.status.toUpperCase()} (${g.by_topic.length} topics)`);
    console.error(`  Rubric H (refresh): ${h.status.toUpperCase()}`);
  }

  if (opts.mode === 'strategic') {
    console.error('\nStrategic mode: not yet implemented (Phase 3)');
  }

  closeDb();
}

main().catch((err) => {
  console.error('Review cycle failed:', err);
  closeDb();
  process.exit(1);
});
