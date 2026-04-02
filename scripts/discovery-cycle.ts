/**
 * C1 — Discovery Cycle CLI
 *
 * Orchestrates the full keyword discovery pipeline:
 * Subtopic Discovery → B1 (Expansion) → B2 (Grouping) → B3 (Scoring/Queue)
 *
 * Usage:
 *   npx tsx scripts/discovery-cycle.ts                              # All topics (Tue & Sat 8am SGT cron)
 *   npx tsx scripts/discovery-cycle.ts --topic=claude-code          # Single topic
 *   npx tsx scripts/discovery-cycle.ts --topic=claude-code --event="Anthropic launches new pricing"
 *   npx tsx scripts/discovery-cycle.ts --topic=claude-code --expand-only
 *   npx tsx scripts/discovery-cycle.ts --topic=claude-code --dry-run
 *   npx tsx scripts/discovery-cycle.ts --delay=500 --max-serp=30
 *   npx tsx scripts/discovery-cycle.ts --topic=claude-code --skip-serp
 *
 * @see docs/plans/specs/SPEC-C1-discovery-cycle.md
 */

import 'dotenv/config';
import { runDiscoveryCycle } from './lib/discovery';
import { closeDb } from './lib/db';

import type { DiscoveryOptions } from './lib/discovery';

// ── Parse CLI args ──

const args = process.argv.slice(2);

function getArg(name: string): string | undefined {
  const arg = args.find((a) => a.startsWith(`--${name}=`));
  return arg?.split('=').slice(1).join('=');
}

const opts: DiscoveryOptions = {
  topic: getArg('topic'),
  event: getArg('event'),
  expandOnly: args.includes('--expand-only'),
  dryRun: args.includes('--dry-run'),
  delay: Number(getArg('delay') ?? 300),
  maxSerp: Number(getArg('max-serp') ?? 50),
  skipSerp: args.includes('--skip-serp'),
  model: (getArg('model') as 'haiku' | 'sonnet') ?? 'sonnet',
};

// ── Main ──

async function main() {
  console.error('🔄 Discovery Cycle');
  console.error('='.repeat(50));

  if (opts.dryRun) {
    console.error('🧪 DRY RUN mode — no DB writes\n');
  }

  const results = await runDiscoveryCycle(opts);

  // Print summary to stderr
  console.error('\n' + '='.repeat(50));
  console.error('📊 Summary');

  for (const r of results) {
    const newKw = r.expansion.total_new_keywords;
    const groups = r.grouping?.total_groups_created ?? 0;
    const queued = r.scoring?.groups_queued ?? 0;
    console.error(
      `  ${r.topic}: ${newKw} new keywords → ${groups} groups → ${queued} queued jobs`,
    );
  }

  const totalApi = results.reduce((sum, r) => sum + r.total_api_calls, 0);
  const totalDuration = results.reduce((sum, r) => sum + r.duration_ms, 0);
  console.error(
    `\nTotal API calls: ${totalApi} | Duration: ${(totalDuration / 1000).toFixed(0)}s`,
  );

  if (results.some((r) => r.errors && r.errors.length > 0)) {
    console.error('\n⚠️  Errors occurred:');
    for (const r of results) {
      if (r.errors) {
        for (const e of r.errors) {
          console.error(`  [${r.topic}] ${e}`);
        }
      }
    }
  }

  // Output JSON to stdout (for cron log capture)
  console.log(JSON.stringify(results, null, 2));

  closeDb();
}

main().catch((err) => {
  console.error('❌ Discovery cycle failed:', err);
  closeDb();
  process.exit(1);
});
