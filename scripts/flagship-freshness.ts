#!/usr/bin/env tsx
/**
 * flagship-freshness.ts — Daily Freshness Mode CLI
 *
 * Routes fresh news signals to existing approved subtopics and
 * generates queue drafts for create/refresh actions.
 * Fully automated — no human approval needed.
 *
 * Usage:
 *   npx tsx scripts/flagship-freshness.ts                          # All flagship topics
 *   npx tsx scripts/flagship-freshness.ts --topic=claude-code      # Single topic
 *   npx tsx scripts/flagship-freshness.ts --hours=48               # Custom lookback
 *   npx tsx scripts/flagship-freshness.ts --dry-run                # No DB writes
 */

import { FLAGSHIP_TOPICS } from './lib/discovery';
import { loadPack } from './lib/subtopic-pack';
import { runFreshnessMode } from './lib/flagship-freshness';

// ── CLI Args ──

function parseArgs() {
  const args = process.argv.slice(2);
  let topic = '';
  let hours = 30;
  let dryRun = false;

  for (const arg of args) {
    if (arg.startsWith('--topic=')) topic = arg.slice('--topic='.length);
    if (arg.startsWith('--hours=')) hours = parseInt(arg.slice('--hours='.length), 10);
    if (arg === '--dry-run') dryRun = true;
  }

  return { topic, hours, dryRun };
}

// ── Main ──

async function main() {
  const { topic, hours, dryRun } = parseArgs();

  // Resolve which topics to process
  let topics = FLAGSHIP_TOPICS;
  if (topic) {
    topics = FLAGSHIP_TOPICS.filter((t) => t.slug === topic);
    if (topics.length === 0) {
      console.error(
        `Unknown topic: "${topic}". Available: ${FLAGSHIP_TOPICS.map((t) => t.slug).join(', ')}`,
      );
      process.exit(1);
    }
  } else {
    // Default: only topics with approved packs
    topics = FLAGSHIP_TOPICS.filter((t) => {
      const pack = loadPack(t.slug);
      return pack && pack.status === 'approved';
    });
    if (topics.length === 0) {
      console.log('No flagship topics with approved packs found. Run flagship-discovery.ts first.');
      return;
    }
  }

  console.log(`Flagship Freshness Mode — ${topics.length} topic(s), ${hours}h lookback${dryRun ? ' [DRY RUN]' : ''}`);

  for (const t of topics) {
    await runFreshnessMode(t, { dryRun, hours });
  }
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
