#!/usr/bin/env npx tsx
/**
 * scripts/backfill-keyword-clusters.ts — One-time backfill
 *
 * Assigns cluster_slug to orphaned keywords (WHERE cluster_slug IS NULL)
 * so that generate-seo.ts can discover them for FAQ/Compare page generation.
 *
 * Usage:
 *   npx tsx scripts/backfill-keyword-clusters.ts --dry-run   # Preview matches
 *   npx tsx scripts/backfill-keyword-clusters.ts              # Apply matches
 */
import 'dotenv/config';
import { getDb, closeDb } from './lib/db';

const DRY_RUN = process.argv.includes('--dry-run');

interface OrphanRow {
  id: number;
  keyword: string;
  source: string;
}

interface ClusterRow {
  slug: string;
  pillar_topic: string;
  mention_count: number;
}

function findClusterSlug(keyword: string, clusters: ClusterRow[]): string | null {
  const kw = keyword.toLowerCase();

  // Strategy 1: exact slug match
  for (const c of clusters) {
    if (c.slug === kw) return c.slug;
  }

  // Strategy 2: keyword contains cluster slug
  for (const c of clusters) {
    if (kw.includes(c.slug)) return c.slug;
  }

  // Strategy 3: cluster slug starts with keyword or keyword starts with slug
  for (const c of clusters) {
    if (kw.startsWith(c.slug) || c.slug.startsWith(kw)) return c.slug;
  }

  // Strategy 4: for "X-vs-Y" patterns, match either side
  const vsMatch = kw.match(/^(.+?)-vs-(.+)$/);
  if (vsMatch) {
    const [, a, b] = vsMatch;
    for (const c of clusters) {
      if (c.slug === a || c.slug === b) return c.slug;
      if (a.includes(c.slug) || b.includes(c.slug)) return c.slug;
    }
  }

  // Strategy 5: word overlap (words > 3 chars)
  const kwWords = kw.split('-').filter(w => w.length > 3);
  if (kwWords.length > 0) {
    let bestSlug: string | null = null;
    let bestOverlap = 0;

    for (const c of clusters) {
      const cWords = c.slug.split('-').filter(w => w.length > 3);
      const overlap = kwWords.filter(w => cWords.includes(w)).length;
      if (overlap > bestOverlap) {
        bestOverlap = overlap;
        bestSlug = c.slug;
      }
    }

    if (bestSlug && bestOverlap >= 1) return bestSlug;
  }

  return null;
}

function main() {
  console.log(`\n🔧 Backfill Keyword Clusters${DRY_RUN ? ' (DRY RUN)' : ''}`);
  console.log('='.repeat(50));

  const db = getDb();

  // Load orphaned keywords
  const orphans = db.prepare(`
    SELECT id, keyword, source FROM keywords
    WHERE cluster_slug IS NULL
      AND (source LIKE 'blog-faq:%' OR source LIKE 'blog-compare:%' OR source LIKE 'blog:%')
  `).all() as OrphanRow[];

  console.log(`  Orphaned keywords: ${orphans.length}`);

  if (orphans.length === 0) {
    console.log('  Nothing to backfill.');
    closeDb();
    return;
  }

  // Load clusters (ordered by mention_count DESC for best match priority)
  const clusters = db.prepare(`
    SELECT slug, pillar_topic, mention_count FROM topic_clusters
    ORDER BY mention_count DESC
  `).all() as ClusterRow[];

  console.log(`  Topic clusters: ${clusters.length}`);

  // Match orphans to clusters
  let matched = 0;
  let unmatched = 0;

  const updateStmt = DRY_RUN ? null : db.prepare(
    'UPDATE keywords SET cluster_slug = ? WHERE id = ?'
  );

  for (const orphan of orphans) {
    const clusterSlug = findClusterSlug(orphan.keyword, clusters);

    if (clusterSlug) {
      matched++;
      console.log(`  ✓ "${orphan.keyword}" (${orphan.source}) → ${clusterSlug}`);
      if (!DRY_RUN && updateStmt) {
        updateStmt.run(clusterSlug, orphan.id);
      }
    } else {
      unmatched++;
      if (DRY_RUN) {
        console.log(`  ✗ "${orphan.keyword}" (${orphan.source}) — no match`);
      }
    }
  }

  console.log(`\n  Summary: ${matched} matched, ${unmatched} unmatched out of ${orphans.length}`);

  if (DRY_RUN) {
    console.log('  (No changes made — run without --dry-run to apply)');
  }

  // Verify
  if (!DRY_RUN) {
    const remaining = db.prepare(`
      SELECT COUNT(*) as count FROM keywords
      WHERE cluster_slug IS NULL
        AND (source LIKE 'blog-faq:%' OR source LIKE 'blog-compare:%' OR source LIKE 'blog:%')
    `).get() as { count: number };
    console.log(`  Remaining orphans: ${remaining.count}`);
  }

  closeDb();
  console.log('\n✅ Backfill complete');
}

main();
