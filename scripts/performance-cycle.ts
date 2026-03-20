/**
 * C3 — Performance Cycle CLI
 *
 * Weekly performance feedback loop: GSC import → segmentation → anomaly detection → refresh queue.
 * Runs every Tuesday to analyze the previous week's search performance.
 *
 * Usage:
 *   npx tsx scripts/performance-cycle.ts                              # Default (28-day window)
 *   npx tsx scripts/performance-cycle.ts --days=14                    # Custom date range
 *   npx tsx scripts/performance-cycle.ts --dry-run                    # No DB writes
 *   npx tsx scripts/performance-cycle.ts --report-only                # Analysis only, no actions
 *   npx tsx scripts/performance-cycle.ts --max-actions=20             # Limit refresh actions
 *   npx tsx scripts/performance-cycle.ts --ctr-threshold=0.03 --impression-threshold=50
 *
 * @see docs/plans/specs/SPEC-C3-performance-loop.md
 */

import { runPerformanceCycle } from './lib/performance';
import { closeDb } from './lib/db';

import type { PerformanceOptions } from './lib/performance';

// ── Parse CLI args ──

const args = process.argv.slice(2);

function getArg(name: string): string | undefined {
  const arg = args.find((a) => a.startsWith(`--${name}=`));
  return arg?.split('=').slice(1).join('=');
}

const opts: PerformanceOptions = {
  days: Number(getArg('days') ?? 28),
  dryRun: args.includes('--dry-run'),
  reportOnly: args.includes('--report-only'),
  maxActions: Number(getArg('max-actions') ?? 30),
  ctrThreshold: Number(getArg('ctr-threshold') ?? 0.02),
  impressionThreshold: Number(getArg('impression-threshold') ?? 100),
  positionDropThreshold: Number(getArg('position-drop-threshold') ?? 3),
};

// ── Main ──

async function main() {
  console.error('═══ Performance Cycle ═══');
  console.error('='.repeat(50));

  if (opts.dryRun) {
    console.error('🧪 DRY RUN mode — no DB writes\n');
  }
  if (opts.reportOnly) {
    console.error('📊 REPORT ONLY mode — no refresh actions generated\n');
  }

  const result = await runPerformanceCycle(opts);

  // Output JSON to stdout (for cron log capture)
  console.log(JSON.stringify(result, null, 2));

  closeDb();
}

main().catch((err) => {
  console.error('❌ Performance cycle failed:', err);
  closeDb();
  process.exit(1);
});
