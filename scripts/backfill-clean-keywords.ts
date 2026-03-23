#!/usr/bin/env npx tsx
/**
 * scripts/backfill-clean-keywords.ts — Retroactive keyword cleanup
 *
 * Applies new keyword noise filters retroactively to all existing keywords.
 * Deletes keywords that fail the updated isKeywordNoise() or normalizeKeyword() checks.
 *
 * Usage:
 *   npx tsx scripts/backfill-clean-keywords.ts --dry-run              # Preview deletions
 *   npx tsx scripts/backfill-clean-keywords.ts                         # Apply deletions
 *   npx tsx scripts/backfill-clean-keywords.ts --cluster=claude-code   # Filter by cluster
 */
import 'dotenv/config';
import { getDb, closeDb } from './lib/db';
import {
  normalizeKeyword,
  isKeywordNoise,
  getNoiseReason,
  isTitleCase,
  type NoiseFilterReason,
} from './lib/keyword-expand';

const DRY_RUN = process.argv.includes('--dry-run');
const clusterArg = process.argv.find((a) => a.startsWith('--cluster='));
const CLUSTER_FILTER = clusterArg ? clusterArg.split('=')[1] : null;

interface KeywordRow {
  id: number;
  keyword: string;
  source: string;
  cluster_slug: string | null;
}

type DeleteReason = NoiseFilterReason | 'normalize-rejected' | 'title-case';

function main() {
  console.log(
    `\nClean Keywords${DRY_RUN ? ' (DRY RUN)' : ''}${CLUSTER_FILTER ? ` [cluster=${CLUSTER_FILTER}]` : ''}`,
  );
  console.log('='.repeat(60));

  const db = getDb();

  // Load keywords
  let rows: KeywordRow[];
  if (CLUSTER_FILTER) {
    rows = db
      .prepare(
        `SELECT id, keyword, source, cluster_slug FROM keywords
         WHERE cluster_slug = ? OR cluster_slug LIKE ?`,
      )
      .all(CLUSTER_FILTER, `${CLUSTER_FILTER}-%`) as KeywordRow[];
  } else {
    rows = db
      .prepare('SELECT id, keyword, source, cluster_slug FROM keywords')
      .all() as KeywordRow[];
  }

  console.log(`  Total keywords scanned: ${rows.length}`);

  const toDelete: Array<{ row: KeywordRow; reason: DeleteReason }> = [];
  const reasonCounts: Record<string, number> = {};

  for (const row of rows) {
    let reason: DeleteReason = null;

    // Check 1: Does it survive normalizeKeyword()?
    const normalized = normalizeKeyword(row.keyword);
    if (normalized === null) {
      reason = 'normalize-rejected';
    }

    // Check 2: Does it pass isKeywordNoise()? (operates on the raw keyword since it's already lowercased in DB)
    if (!reason) {
      const noiseReason = getNoiseReason(row.keyword);
      if (noiseReason) {
        reason = noiseReason;
      }
    }

    // Check 3: Title case check (the keyword in DB is lowercased, so check the original keyword text)
    // Since DB keywords are already lowercased, isTitleCase won't trigger here.
    // This check is mainly for catching keywords that somehow got stored with casing.
    if (!reason && isTitleCase(row.keyword)) {
      reason = 'title-case';
    }

    if (reason) {
      toDelete.push({ row, reason });
      reasonCounts[reason] = (reasonCounts[reason] || 0) + 1;
    }
  }

  // Report
  if (toDelete.length === 0) {
    console.log('  No junk keywords found. All clean!');
    closeDb();
    return;
  }

  console.log(`\n  Keywords to delete: ${toDelete.length}`);
  console.log('  Breakdown by filter:');
  for (const [reason, count] of Object.entries(reasonCounts).sort(
    (a, b) => b[1] - a[1],
  )) {
    console.log(`    ${reason}: ${count}`);
  }

  // Show samples
  console.log('\n  Sample deletions (up to 20):');
  for (const { row, reason } of toDelete.slice(0, 20)) {
    console.log(`    [${reason}] "${row.keyword}" (source=${row.source})`);
  }
  if (toDelete.length > 20) {
    console.log(`    ... and ${toDelete.length - 20} more`);
  }

  // Execute deletions
  if (!DRY_RUN) {
    const deleteStmt = db.prepare('DELETE FROM keywords WHERE id = ?');
    const deleteAll = db.transaction(() => {
      for (const { row } of toDelete) {
        deleteStmt.run(row.id);
      }
    });
    deleteAll();
    console.log(`\n  Deleted ${toDelete.length} keywords from DB.`);

    // Verify
    const remaining = db
      .prepare('SELECT COUNT(*) as count FROM keywords')
      .get() as { count: number };
    console.log(`  Remaining keywords: ${remaining.count}`);
  } else {
    console.log('\n  (No changes made -- run without --dry-run to apply)');
  }

  // Summary
  console.log(`\n  Scanned: ${rows.length} | Deleted: ${toDelete.length} | By filter: ${JSON.stringify(reasonCounts)}`);

  closeDb();
  console.log('\nDone.');
}

main();
