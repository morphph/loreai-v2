#!/usr/bin/env tsx
/**
 * One-off backfill: Re-materialize approved flagship packs to populate
 * the B+ enriched metadata columns (description, aliases_json,
 * freshness_sensitivity, page_type_hints_json, seed_keywords_json,
 * evidence_type, pack_version).
 *
 * Safety: additive, idempotent, does NOT create queue jobs,
 * does NOT alter non-flagship rows.
 *
 * Side effect: upsertKeyword for seed keywords (also idempotent).
 *
 * Usage:
 *   npx tsx scripts/backfill-flagship-metadata.ts               # Execute
 *   npx tsx scripts/backfill-flagship-metadata.ts --dry-run      # Preview only
 */

import { getDb, closeDb } from './lib/db';
import { loadPack, materializePack } from './lib/subtopic-pack';
import { FLAGSHIP_TOPICS } from './lib/discovery';

const DRY_RUN = process.argv.includes('--dry-run');

function main() {
  console.log(`\n═══ B+ Metadata Backfill ${DRY_RUN ? '(DRY RUN)' : ''} ═══\n`);

  const db = getDb();

  // Pre-backfill snapshot
  const totalBefore = (db.prepare(
    "SELECT COUNT(*) as c FROM topic_clusters WHERE source = 'flagship_discovery'"
  ).get() as { c: number }).c;
  const withMetaBefore = (db.prepare(
    "SELECT COUNT(*) as c FROM topic_clusters WHERE source = 'flagship_discovery' AND description IS NOT NULL"
  ).get() as { c: number }).c;

  console.log(`Pre-backfill state:`);
  console.log(`  Flagship rows total: ${totalBefore}`);
  console.log(`  Rows with metadata:  ${withMetaBefore}`);
  console.log(`  Rows missing metadata: ${totalBefore - withMetaBefore}\n`);

  let totalWritten = 0;
  let totalSeeded = 0;

  for (const topic of FLAGSHIP_TOPICS) {
    console.log(`── ${topic.name} (${topic.slug}) ──`);

    const pack = loadPack(topic.slug);
    if (!pack) {
      console.log(`  No pack file found — skipping\n`);
      continue;
    }
    if (pack.status !== 'approved') {
      console.log(`  Pack status is "${pack.status}" (not approved) — skipping\n`);
      continue;
    }

    console.log(`  Pack: v${pack.version}, ${pack.subtopics.length} subtopics, approved ${pack.approved_at}`);

    const result = materializePack(pack, { dryRun: DRY_RUN });

    console.log(`  Subtopics written: ${result.subtopics_written}`);
    console.log(`  Keywords seeded:   ${result.keywords_seeded}`);
    if (result.demoted.length > 0) {
      console.log(`  Demoted: ${result.demoted.join(', ')}`);
    }
    console.log();

    totalWritten += result.subtopics_written;
    totalSeeded += result.keywords_seeded;
  }

  // Post-backfill verification
  if (!DRY_RUN) {
    console.log(`═══ Post-Backfill Verification ═══\n`);

    const totalAfter = (db.prepare(
      "SELECT COUNT(*) as c FROM topic_clusters WHERE source = 'flagship_discovery'"
    ).get() as { c: number }).c;
    const withMetaAfter = (db.prepare(
      "SELECT COUNT(*) as c FROM topic_clusters WHERE source = 'flagship_discovery' AND description IS NOT NULL"
    ).get() as { c: number }).c;
    const missingMeta = (db.prepare(
      `SELECT slug FROM topic_clusters
       WHERE source = 'flagship_discovery'
         AND flagship_topic_slug IS NOT NULL
         AND slug != flagship_topic_slug
         AND description IS NULL`
    ).all() as Array<{ slug: string }>);

    console.log(`Flagship rows total: ${totalAfter}`);
    console.log(`Rows with metadata:  ${withMetaAfter}`);
    console.log(`Rows still missing:  ${missingMeta.length}`);
    if (missingMeta.length > 0) {
      for (const r of missingMeta) {
        console.log(`  ⚠ ${r.slug}`);
      }
    }

    // Sample metadata check
    const sample = db.prepare(
      `SELECT slug, pillar_topic, description, freshness_sensitivity, pack_version,
              aliases_json, seed_keywords_json
       FROM topic_clusters
       WHERE source = 'flagship_discovery' AND description IS NOT NULL
       LIMIT 3`
    ).all() as Array<Record<string, unknown>>;

    console.log(`\nSample enriched rows:`);
    for (const row of sample) {
      const aliases = row.aliases_json ? JSON.parse(row.aliases_json as string).length : 0;
      const seeds = row.seed_keywords_json ? JSON.parse(row.seed_keywords_json as string).length : 0;
      console.log(`  ${row.slug}`);
      console.log(`    pillar_topic: ${row.pillar_topic}`);
      console.log(`    description:  ${(row.description as string).slice(0, 80)}...`);
      console.log(`    freshness:    ${row.freshness_sensitivity}`);
      console.log(`    aliases:      ${aliases} entries`);
      console.log(`    seed_kw:      ${seeds} entries`);
      console.log(`    pack_version: ${row.pack_version}`);
    }

    // Check for entity rows that might have been accidentally touched
    const entityCheck = (db.prepare(
      `SELECT COUNT(*) as c FROM topic_clusters
       WHERE source = 'entity_extract' AND description IS NOT NULL`
    ).get() as { c: number }).c;
    console.log(`\nEntity rows with metadata (should be 0): ${entityCheck}`);
    if (entityCheck > 0) {
      console.log(`  ⚠ ANOMALY: ${entityCheck} entity rows have metadata — investigate!`);
    }
  }

  console.log(`\n═══ Summary ═══`);
  console.log(`Total subtopics written: ${totalWritten}`);
  console.log(`Total keywords seeded:   ${totalSeeded}`);
  console.log(`Mode: ${DRY_RUN ? 'DRY RUN (no writes)' : 'EXECUTED'}\n`);

  closeDb();
}

main();
