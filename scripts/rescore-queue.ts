#!/usr/bin/env npx tsx
/**
 * rescore-queue.ts — One-off re-scoring of all pending queue items
 *
 * Applies:
 *   (A) Volume proxy via group keyword count
 *   (B) Junk pruning
 *   (C) All pipelines → standard (no deep_research)
 *   (D) Cluster diversity multiplier
 *
 * Usage:
 *   npx tsx scripts/rescore-queue.ts            # apply changes
 *   npx tsx scripts/rescore-queue.ts --dry-run   # preview only
 */

import { getDb } from './lib/db';
import {
  calculatePriorityScore,
  isJunkGroup,
  getClusterDiversityMultiplier,
} from './lib/priority';
import type { ScoringInput, GroupKeyword } from './lib/priority';

const dryRun = process.argv.includes('--dry-run');
const db = getDb();

console.log(`🔄 Re-scoring all pending queue items${dryRun ? ' (DRY RUN)' : ''}...\n`);

// ── Step 1: Load all pending items ──

interface PendingItem {
  job_id: number;
  group_id: number;
  primary_keyword: string;
  intent: string;
  content_type: string;
  cluster_slug: string | null;
}

const pendingItems = db.prepare(`
  SELECT
    cq.job_id,
    cq.keyword_group_id as group_id,
    kg.primary_keyword,
    kg.intent,
    kg.content_type,
    kg.cluster_slug
  FROM create_queue cq
  JOIN keyword_groups kg ON cq.keyword_group_id = kg.group_id
  WHERE cq.status = 'pending'
  ORDER BY kg.cluster_slug
`).all() as PendingItem[];

console.log(`📥 Loaded ${pendingItems.length} pending items\n`);

// ── Step 2: Junk pruning (B) ──

console.log('🗑  Step 1: Junk Pruning');

const junkItems: PendingItem[] = [];
const surviving: PendingItem[] = [];

for (const item of pendingItems) {
  if (isJunkGroup(item.primary_keyword, item.intent)) {
    junkItems.push(item);
  } else {
    surviving.push(item);
  }
}

for (const item of junkItems) {
  console.log(`  ✗ "${item.primary_keyword}" (${item.intent})`);
}
console.log(`  Pruned: ${junkItems.length} | Remaining: ${surviving.length}\n`);

// ── Step 3: Re-score with volume proxy (A) ──

console.log('📈 Step 2: Re-scoring with volume proxy');

const loadKeywords = db.prepare(`
  SELECT keyword, search_volume, competition
  FROM keywords WHERE keyword_group_id = ?
`);

const findEventAge = db.prepare(`
  SELECT MIN(
    (julianday('now') - julianday(detected_at)) * 24
  ) as hours_ago
  FROM news_items
  WHERE detected_at > datetime('now', '-7 days')
    AND (title LIKE ? OR summary LIKE ?)
`);

interface ScoredItem {
  job_id: number;
  group_id: number;
  primary_keyword: string;
  cluster_slug: string;
  intent: string;
  content_type: string;
  keyword_count: number;
  raw_score: number;
  adjusted_score: number;
}

const scoredItems: ScoredItem[] = [];

for (const item of surviving) {
  const keywords = loadKeywords.all(item.group_id) as GroupKeyword[];
  const eventRow = findEventAge.get(
    `%${item.primary_keyword}%`,
    `%${item.primary_keyword}%`,
  ) as { hours_ago: number | null } | undefined;

  const input: ScoringInput = {
    group_id: item.group_id,
    primary_keyword: item.primary_keyword,
    intent: item.intent,
    content_type: item.content_type,
    cluster_slug: item.cluster_slug,
    keywords,
    event_age_hours: eventRow?.hours_ago ?? null,
  };

  const result = calculatePriorityScore(input);

  scoredItems.push({
    job_id: item.job_id,
    group_id: item.group_id,
    primary_keyword: item.primary_keyword,
    cluster_slug: item.cluster_slug || 'uncategorized',
    intent: item.intent,
    content_type: item.content_type,
    keyword_count: keywords.length,
    raw_score: result.priority_score,
    adjusted_score: result.priority_score,
  });
}

// ── Step 4: Apply cluster diversity (D) ──

console.log('🔀 Step 3: Applying cluster diversity\n');

// Group by cluster, rank within each, apply multiplier
const byCluster: Record<string, ScoredItem[]> = {};
for (const item of scoredItems) {
  if (!byCluster[item.cluster_slug]) byCluster[item.cluster_slug] = [];
  byCluster[item.cluster_slug].push(item);
}

for (const items of Object.values(byCluster)) {
  items.sort((a, b) => b.raw_score - a.raw_score);
  for (let i = 0; i < items.length; i++) {
    const multiplier = getClusterDiversityMultiplier(i + 1);
    items[i].adjusted_score = Math.round(items[i].raw_score * multiplier * 100) / 100;
  }
}

// Flatten and sort globally by adjusted score
const allSorted = Object.values(byCluster).flat();
allSorted.sort((a, b) => b.adjusted_score - a.adjusted_score);

// Print top 20
console.log('  TOP 20 after adjustment:');
for (let i = 0; i < Math.min(20, allSorted.length); i++) {
  const s = allSorted[i];
  console.log(
    `    ${String(i + 1).padStart(2)}. [${String(s.adjusted_score).padStart(7)}] "${s.primary_keyword}" (${s.cluster_slug} | ${s.intent}/${s.content_type})`,
  );
}

// ── Step 5: Write to DB ──

if (dryRun) {
  console.log('\n⏸  DRY RUN — no changes written\n');
} else {
  console.log('\n💾 Step 4: Writing to database');

  const cancelJob = db.prepare(
    `UPDATE create_queue SET status = 'cancelled' WHERE job_id = ?`,
  );
  const cancelGroup = db.prepare(
    `UPDATE keyword_groups SET status = 'cancelled', updated_at = CURRENT_TIMESTAMP WHERE group_id = ?`,
  );
  const updateJobScore = db.prepare(`
    UPDATE create_queue
    SET priority_score = ?, research_pipeline = 'standard'
    WHERE job_id = ?
  `);
  const updateGroupScore = db.prepare(`
    UPDATE keyword_groups SET priority_score = ?, updated_at = CURRENT_TIMESTAMP
    WHERE group_id = ?
  `);

  const tx = db.transaction(() => {
    for (const item of junkItems) {
      cancelJob.run(item.job_id);
      cancelGroup.run(item.group_id);
    }
    for (const item of allSorted) {
      updateJobScore.run(item.adjusted_score, item.job_id);
      updateGroupScore.run(item.adjusted_score, item.group_id);
    }
  });

  tx();
  console.log(`  ✓ Cancelled ${junkItems.length} junk items`);
  console.log(`  ✓ Re-scored ${allSorted.length} items`);
  console.log(`  ✓ Set all research_pipeline to 'standard'\n`);
}

// ── Summary ──

console.log('📊 Summary:');
console.log(`  Total pending before: ${pendingItems.length}`);
console.log(`  Junk pruned: ${junkItems.length}`);
console.log(`  Remaining: ${allSorted.length}`);

const high = allSorted.filter((s) => s.adjusted_score >= 1000).length;
const medium = allSorted.filter((s) => s.adjusted_score >= 100 && s.adjusted_score < 1000).length;
const low = allSorted.filter((s) => s.adjusted_score < 100).length;
console.log(`  High (≥1000): ${high}`);
console.log(`  Medium (100-999): ${medium}`);
console.log(`  Low (<100): ${low}`);

// Per-cluster breakdown
console.log('\n  Per-cluster (top 15):');
const clusterSummary = Object.entries(byCluster)
  .map(([slug, items]) => ({
    slug,
    count: items.length,
    topScore: Math.max(...items.map((i) => i.adjusted_score)),
  }))
  .sort((a, b) => b.topScore - a.topScore)
  .slice(0, 15);

for (const c of clusterSummary) {
  console.log(`    ${c.slug}: ${c.count} items, top=${c.topScore}`);
}
