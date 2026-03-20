/**
 * B3 — Priority Scoring + Unified Queue CLI
 *
 * Scores keyword groups by priority and routes them to the create queue.
 *
 * Usage:
 *   npx tsx scripts/score-and-queue.ts --topic=claude-code
 *   npx tsx scripts/score-and-queue.ts --cluster=claude-code-pricing
 *   npx tsx scripts/score-and-queue.ts --topic=claude-code --dry-run
 *   npx tsx scripts/score-and-queue.ts --topic=claude-code --skip-serp
 *   npx tsx scripts/score-and-queue.ts --topic=claude-code --max-serp=20
 *   npx tsx scripts/score-and-queue.ts --topic=claude-code --force
 *
 * @see docs/plans/specs/SPEC-B3-priority-scoring.md
 */

import { scoreAndQueue } from './lib/score-queue';
import { closeDb } from './lib/db';

import type { ScoreQueueOptions } from './lib/score-queue';

// ── Parse CLI args ──

const args = process.argv.slice(2);

function getArg(name: string): string | undefined {
  const arg = args.find((a) => a.startsWith(`--${name}=`));
  return arg?.split('=').slice(1).join('=');
}

const topicSlug = getArg('topic');
const clusterSlug = getArg('cluster');
const dryRun = args.includes('--dry-run');
const skipSerp = args.includes('--skip-serp');
const force = args.includes('--force');
const maxSerp = Number(getArg('max-serp') ?? 50);

if (!topicSlug && !clusterSlug) {
  console.error(
    'Usage: npx tsx scripts/score-and-queue.ts --topic=<slug> | --cluster=<slug> [--dry-run] [--skip-serp] [--max-serp=50] [--force]',
  );
  process.exit(1);
}

const opts: ScoreQueueOptions = {
  dryRun,
  skipSerp,
  force,
  maxSerp,
};

// ── Main ──

async function main() {
  const target = topicSlug ? `topic "${topicSlug}"` : `cluster "${clusterSlug}"`;
  console.log(`📊 Priority Scoring — ${target}`);
  console.log('='.repeat(50));

  if (dryRun) {
    console.log('🧪 DRY RUN mode — no DB writes\n');
  }

  const result = await scoreAndQueue(
    topicSlug ?? null,
    clusterSlug ?? null,
    opts,
  );

  // ── Summary ──
  console.log('\n' + '='.repeat(50));

  if (result.groups_scored === 0) {
    console.log('✓ No pending groups to score');
    closeDb();
    return;
  }

  if (dryRun) {
    console.log('🧪 DRY RUN — skipping DB write');
    console.log(`  Would add ${result.groups_queued} jobs to create_queue`);
    console.log(`  Would defer ${result.groups_deferred} group(s) (topic-hub)`);
  } else {
    console.log('💾 Summary');
    console.log(`  ${result.groups_queued} jobs added to create_queue`);
    console.log(`  ${result.groups_deferred} group(s) deferred (topic-hub)`);
    console.log(`  ${result.groups_already_queued} group(s) already queued`);
  }

  if (result.serp_api_calls > 0) {
    console.log(`  ${result.serp_api_calls} Serper API calls`);
  }

  console.log(
    `\n✅ Scoring complete — ${result.groups_scored} groups scored, ${result.groups_queued} queued`,
  );

  closeDb();
}

main().catch((err) => {
  console.error('❌ Priority scoring failed:', err);
  closeDb();
  process.exit(1);
});
