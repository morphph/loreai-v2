#!/usr/bin/env tsx
/**
 * flagship-discovery.ts — Full Discovery Mode CLI
 *
 * Maintains the durable subtopic map for flagship topics from official
 * product surfaces + SERP/content competitors.
 *
 * Usage:
 *   npx tsx scripts/flagship-discovery.ts                          # All flagship topics
 *   npx tsx scripts/flagship-discovery.ts --topic=claude-code      # Single topic
 *   npx tsx scripts/flagship-discovery.ts --topic=claude-code --approve  # Approve draft
 *   npx tsx scripts/flagship-discovery.ts --topic=claude-code --dry-run  # No writes
 *   npx tsx scripts/flagship-discovery.ts --topic=claude-code --skip-serp
 */

import { FLAGSHIP_TOPICS } from './lib/discovery';
import { runFullDiscovery } from './lib/flagship-discovery';
import { approvePack } from './lib/subtopic-pack';

// ── CLI Args ──

function parseArgs() {
  const args = process.argv.slice(2);
  let topic = '';
  let approve = false;
  let dryRun = false;
  let skipSerp = false;

  for (const arg of args) {
    if (arg.startsWith('--topic=')) topic = arg.slice('--topic='.length);
    if (arg === '--approve') approve = true;
    if (arg === '--dry-run') dryRun = true;
    if (arg === '--skip-serp') skipSerp = true;
  }

  return { topic, approve, dryRun, skipSerp };
}

// ── Main ──

async function main() {
  const { topic, approve, dryRun, skipSerp } = parseArgs();

  // Resolve which topics to process
  const topics = topic
    ? FLAGSHIP_TOPICS.filter((t) => t.slug === topic)
    : FLAGSHIP_TOPICS;

  if (topics.length === 0) {
    console.error(
      `Unknown topic: "${topic}". Available: ${FLAGSHIP_TOPICS.map((t) => t.slug).join(', ')}`,
    );
    process.exit(1);
  }

  // Approve mode
  if (approve) {
    for (const t of topics) {
      console.log(`\nApproving pack for ${t.name}...`);
      approvePack(t.slug);
    }
    return;
  }

  // Full discovery mode
  for (const t of topics) {
    await runFullDiscovery(t, { dryRun, skipSerp });
  }
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
