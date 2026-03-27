/**
 * One-time migration: backfill flagship_topic_slug for existing flagship clusters.
 *
 * Idempotent — safe to run multiple times.
 * Usage: npx tsx scripts/migrate-flagship-tags.ts
 */

import { getDb, closeDb } from './lib/db';
import { FLAGSHIP_TOPICS } from './lib/discovery';
import 'dotenv/config';

const db = getDb();

console.log('🏷️  Backfilling flagship_topic_slug\n');

for (const topic of FLAGSHIP_TOPICS) {
  // Tag the flagship topic itself
  db.prepare(
    `UPDATE topic_clusters
     SET flagship_topic_slug = ?
     WHERE slug = ?`
  ).run(topic.slug, topic.slug);

  // Tag all subtopics (prefix match)
  const result = db.prepare(
    `UPDATE topic_clusters
     SET flagship_topic_slug = ?
     WHERE slug LIKE ? AND slug != ?`
  ).run(topic.slug, `${topic.slug}-%`, topic.slug);

  console.log(`${topic.name}: tagged ${result.changes} subtopics`);
}

closeDb();
console.log('\n✅ Migration complete');
