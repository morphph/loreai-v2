#!/usr/bin/env npx tsx
/**
 * scripts/backfill-clean-keywords.ts — Retroactive keyword cleanup
 *
 * Two-phase cleanup:
 *   Phase 1: Delete all `ai-extraction` source keywords (entities, not keywords — they
 *            belong in topic_clusters, not the keywords table)
 *   Phase 2: Apply noise filters to actual keyword sources (exa-competitor, serper-*)
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

type DeleteReason = NoiseFilterReason | 'normalize-rejected' | 'title-case' | 'entity-not-keyword';

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

    // Phase 1: Entity names don't belong in the keywords table.
    // They were inserted by extract-entities.ts (now fixed) and should be removed.
    // Two source names exist historically: 'ai-extraction' and 'entity-extraction'.
    if (row.source === 'ai-extraction' || row.source === 'entity-extraction') {
      reason = 'entity-not-keyword';
    }

    // Phase 2: Apply noise filters to exa-competitor keywords only.
    // The 10 noise filters were designed for Issue #2 (junk Exa headings).
    // Blog-generated slugs and serper keywords follow their own rules.
    if (!reason && row.source === 'exa-competitor') {
      const normalized = normalizeKeyword(row.keyword);
      if (normalized === null) {
        reason = 'normalize-rejected';
      }

      if (!reason) {
        const noiseReason = getNoiseReason(row.keyword);
        if (noiseReason) {
          reason = noiseReason;
        }
      }

      if (!reason && isTitleCase(row.keyword)) {
        reason = 'title-case';
      }
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

  // Show samples grouped by reason
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
