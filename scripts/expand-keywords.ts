/**
 * B1 — Keyword Expansion CLI
 *
 * Expands subtopics of a flagship topic into a full keyword universe
 * using Serper (PAA/related/autocomplete) and Exa (competitor scan).
 *
 * Usage:
 *   npx tsx scripts/expand-keywords.ts --topic=claude-code
 *   npx tsx scripts/expand-keywords.ts --topic=claude-code --subtopics=pricing,hooks
 *   npx tsx scripts/expand-keywords.ts --topic=claude-code --dry-run
 *   npx tsx scripts/expand-keywords.ts --topic=claude-code --skip-exa --delay=500
 *
 * @see docs/plans/specs/SPEC-B1-keyword-expansion.md
 */

import 'dotenv/config';
import { expandTopic } from './lib/keyword-expand';
import { closeDb } from './lib/db';

// ── Parse CLI args ──

const args = process.argv.slice(2);

function getArg(name: string): string | undefined {
  const arg = args.find((a) => a.startsWith(`--${name}=`));
  return arg?.split('=').slice(1).join('=');
}

const topicSlug = getArg('topic');
const subtopicsArg = getArg('subtopics');
const dryRun = args.includes('--dry-run');
const skipExa = args.includes('--skip-exa');
const delayMs = Number(getArg('delay') ?? 300);

if (!topicSlug) {
  console.error('Usage: npx tsx scripts/expand-keywords.ts --topic=<slug> [--subtopics=a,b] [--dry-run] [--skip-exa] [--delay=300]');
  process.exit(1);
}

const subtopicSlugs = subtopicsArg
  ? subtopicsArg.split(',').map((s) => s.trim()).filter(Boolean)
  : null;

// ── Main ──

async function main() {
  console.log(`🔍 Keyword Expansion — ${topicSlug}`);
  console.log('='.repeat(50));

  if (dryRun) {
    console.log('🧪 DRY RUN mode — no DB writes\n');
  }

  console.log('📥 Stage 1: Load Subtopics');

  const result = await expandTopic(topicSlug!, subtopicSlugs, {
    delayMs,
    skipExa,
    maxVolumeCallsPerSubtopic: 20,
    dryRun,
  });

  // ── Summary ──
  console.log('\n' + '='.repeat(50));

  if (dryRun) {
    console.log(`🧪 DRY RUN — skipping DB write`);
    console.log(`  Would write ${result.total_new_keywords} new keywords`);
  } else {
    console.log(`💾 Summary`);
    console.log(`  Total: ${result.total_keywords_discovered} raw keywords → ${result.total_new_keywords} new (after dedup)`);
    console.log(`  Volume scored: ${result.total_volume_scored} keywords`);
    console.log(`  API usage: ${result.serper_api_calls} Serper calls, ${result.exa_api_calls} Exa calls`);
  }

  console.log(`\n✅ Keyword expansion complete — ${result.total_new_keywords} new keywords across ${result.subtopics_processed} subtopics`);

  closeDb();
}

main().catch((err) => {
  console.error('❌ Keyword expansion failed:', err);
  closeDb();
  process.exit(1);
});
