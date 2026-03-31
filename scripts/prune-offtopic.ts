#!/usr/bin/env npx tsx
/**
 * prune-offtopic.ts — Cancel off-topic and junk keyword groups from the queue
 *
 * Applies:
 *   - Expanded junk patterns (ancient manuscripts, other products, scraped headlines)
 *   - Off-topic relevance filter (generic keywords in polluted clusters)
 *
 * Usage:
 *   npx tsx scripts/prune-offtopic.ts              # apply changes
 *   npx tsx scripts/prune-offtopic.ts --dry-run     # preview only
 */

import { getDb } from './lib/db';
import { isJunkGroup, isOffTopicForSite } from './lib/priority';

const dryRun = process.argv.includes('--dry-run');
const db = getDb();

console.log(`🧹 Pruning off-topic queue items${dryRun ? ' (DRY RUN)' : ''}...\n`);

// ── Load all pending items ──

interface PendingItem {
  job_id: number;
  group_id: number;
  primary_keyword: string;
  intent: string;
  cluster_slug: string | null;
  priority_score: number;
}

const pendingItems = db.prepare(`
  SELECT
    cq.job_id,
    cq.keyword_group_id as group_id,
    kg.primary_keyword,
    kg.intent,
    kg.cluster_slug,
    cq.priority_score
  FROM create_queue cq
  JOIN keyword_groups kg ON cq.keyword_group_id = kg.group_id
  WHERE cq.status = 'pending'
  ORDER BY kg.cluster_slug, cq.priority_score DESC
`).all() as PendingItem[];

console.log(`📥 Loaded ${pendingItems.length} pending items\n`);

// ── Categorize each item ──

interface PruneResult {
  item: PendingItem;
  reason: 'junk_pattern' | 'off_topic';
}

const toPrune: PruneResult[] = [];
const toKeep: PendingItem[] = [];

for (const item of pendingItems) {
  if (isJunkGroup(item.primary_keyword, item.intent)) {
    toPrune.push({ item, reason: 'junk_pattern' });
  } else if (isOffTopicForSite(item.primary_keyword, item.cluster_slug)) {
    toPrune.push({ item, reason: 'off_topic' });
  } else {
    toKeep.push(item);
  }
}

// ── Report by cluster ──

const pruneByCluster: Record<string, PruneResult[]> = {};
for (const p of toPrune) {
  const slug = p.item.cluster_slug || 'uncategorized';
  if (!pruneByCluster[slug]) pruneByCluster[slug] = [];
  pruneByCluster[slug].push(p);
}

const keepByCluster: Record<string, PendingItem[]> = {};
for (const item of toKeep) {
  const slug = item.cluster_slug || 'uncategorized';
  if (!keepByCluster[slug]) keepByCluster[slug] = [];
  keepByCluster[slug].push(item);
}

// Print pruned items by cluster
for (const [slug, items] of Object.entries(pruneByCluster).sort((a, b) => b[1].length - a[1].length)) {
  const kept = keepByCluster[slug]?.length ?? 0;
  console.log(`\n${slug} (pruning ${items.length}, keeping ${kept}):`);
  for (const p of items) {
    const tag = p.reason === 'junk_pattern' ? 'JUNK' : 'OFF-TOPIC';
    console.log(`  ✗ [${tag}] "${p.item.primary_keyword}" (score=${p.item.priority_score})`);
  }
}

// ── Summary ──

const junkCount = toPrune.filter((p) => p.reason === 'junk_pattern').length;
const offTopicCount = toPrune.filter((p) => p.reason === 'off_topic').length;

console.log('\n' + '='.repeat(60));
console.log('📊 Summary:');
console.log(`  Total pending before: ${pendingItems.length}`);
console.log(`  Junk patterns:        ${junkCount}`);
console.log(`  Off-topic generic:    ${offTopicCount}`);
console.log(`  Total to prune:       ${toPrune.length}`);
console.log(`  Remaining:            ${toKeep.length}`);

// Per-cluster summary for kept items
console.log('\n  Kept items per cluster:');
const keepSummary = Object.entries(keepByCluster)
  .map(([slug, items]) => ({ slug, count: items.length }))
  .sort((a, b) => b.count - a.count);
for (const { slug, count } of keepSummary) {
  console.log(`    ${slug}: ${count}`);
}

// ── Apply changes ──

if (dryRun) {
  console.log('\n⏸  DRY RUN — no changes written\n');
} else {
  console.log('\n💾 Applying changes...');

  const cancelJob = db.prepare(
    `UPDATE create_queue SET status = 'cancelled' WHERE job_id = ?`,
  );
  const cancelGroup = db.prepare(
    `UPDATE keyword_groups SET status = 'cancelled', updated_at = CURRENT_TIMESTAMP WHERE group_id = ?`,
  );

  const tx = db.transaction(() => {
    for (const p of toPrune) {
      cancelJob.run(p.item.job_id);
      cancelGroup.run(p.item.group_id);
    }
  });

  tx();
  console.log(`  ✓ Cancelled ${toPrune.length} queue jobs + keyword groups`);
  console.log(`  ✓ ${toKeep.length} items remain pending\n`);
}
