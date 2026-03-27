import { readFileSync } from 'fs';
import { join } from 'path';
import { getDb, getAllRecentNewsItems, upsertTopicCluster, closeDb } from './lib/db';
import { callClaudeWithRetry, checkClaudeHealth } from './lib/ai';
import { FLAGSHIP_TOPICS } from './lib/discovery';
import 'dotenv/config';

// ── Flagship Guard ──

const flagshipSlugs = new Set(FLAGSHIP_TOPICS.map(t => t.slug));

export function isFlagshipSubtopic(slug: string): boolean {
  // Direct match against flagship topic slugs
  if (flagshipSlugs.has(slug)) return true;

  // Subtopic match: check flagship_topic_slug in DB
  const db = getDb();
  const row = db.prepare(
    `SELECT 1 FROM topic_clusters
     WHERE slug = ? AND flagship_topic_slug IS NOT NULL
     LIMIT 1`
  ).get(slug);
  if (row) return true;

  // Prefix match against flagship slugs (fallback)
  for (const fs of flagshipSlugs) {
    if (slug.startsWith(`${fs}-`)) return true;
  }

  return false;
}

// Parse args
const args = process.argv.slice(2);
const DRY_RUN = args.includes('--dry-run');
import { todaySGT } from './lib/date.js';
const DATE = args.find((a) => a.startsWith('--date='))?.split('=')[1] || todaySGT();

interface ExtractedEntity {
  entity: string;
  normalized: string;
  type: 'company' | 'model' | 'technology' | 'framework' | 'concept' | 'product';
  mentions: number;
}

function validateExtractionResponse(content: string): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Strip markdown code fences if present
  const cleaned = content.replace(/^```(?:json)?\s*\n?/m, '').replace(/\n?```\s*$/m, '');

  let entities: unknown;
  try {
    entities = JSON.parse(cleaned);
  } catch {
    errors.push('Response is not valid JSON');
    return { valid: false, errors };
  }

  if (!Array.isArray(entities)) {
    errors.push('Response is not an array');
    return { valid: false, errors };
  }

  if (entities.length === 0) {
    errors.push('No entities extracted');
    return { valid: false, errors };
  }

  // Check for duplicate normalized slugs
  const slugs = new Set<string>();
  for (const e of entities) {
    if (!e.entity || !e.normalized || !e.type || typeof e.mentions !== 'number') {
      errors.push(`Invalid entity object: ${JSON.stringify(e).slice(0, 100)}`);
      continue;
    }
    if (slugs.has(e.normalized)) {
      errors.push(`Duplicate normalized slug: ${e.normalized}`);
    }
    slugs.add(e.normalized);
  }

  return { valid: errors.length === 0, errors };
}

function parseEntities(content: string): ExtractedEntity[] {
  const cleaned = content.replace(/^```(?:json)?\s*\n?/m, '').replace(/\n?```\s*$/m, '');
  return JSON.parse(cleaned);
}

async function main() {
  console.log(`🔍 Entity Extraction — ${DATE}`);
  console.log('==================================================\n');

  if (DRY_RUN) console.log('🧪 DRY RUN — will not write to DB\n');

  // Stage 1: Load recent news items
  console.log('📥 Stage 1: Load Recent News Items');
  const items = getAllRecentNewsItems(30); // last 30 hours — includes newsletter-selected items
  console.log(`  Found ${items.length} items from last 30 hours`);

  if (items.length === 0) {
    console.log('  No items found — skipping extraction');
    closeDb();
    return;
  }

  // Stage 2: Call Sonnet for entity extraction
  console.log('\n🤖 Stage 2: AI Entity Extraction');

  if (!DRY_RUN) {
    checkClaudeHealth();
  }

  const systemPrompt = readFileSync(
    join(__dirname, '..', 'skills', 'entity-extraction', 'SKILL.md'),
    'utf-8'
  );

  const inputItems = items.map((item) => ({
    title: item.title,
    summary: item.summary || '',
    source: item.source,
    score: item.score,
  }));

  const userPrompt = `Extract all AI-related entities from these ${inputItems.length} news items:\n\n${JSON.stringify(inputItems, null, 2)}`;

  if (DRY_RUN) {
    console.log('  (dry-run: skipping AI call)');
    console.log(`  Would send ${inputItems.length} items to Sonnet 4.6`);
    closeDb();
    return;
  }

  const response = await callClaudeWithRetry(systemPrompt, userPrompt, {
    model: 'claude-sonnet-4-20250514',
    maxRetries: 2,
    validate: validateExtractionResponse,
  });

  const entities = parseEntities(response.content);
  console.log(`  Extracted ${entities.length} entities via ${response.model}`);

  // Stage 3: Update clusters
  console.log('\n📊 Stage 3: Update Topic Clusters');
  const newSeeds: string[] = [];
  let updated = 0;
  let created = 0;
  let skippedFlagship = 0;

  // Batch-load existing clusters to avoid N+1 queries
  const db = getDb();
  const existingSlugs = new Set(
    (db.prepare('SELECT slug FROM topic_clusters').all() as { slug: string }[])
      .map((r) => r.slug)
  );

  for (const entity of entities) {
    const slug = entity.normalized;
    if (!slug) continue;

    // Skip flagship subtopics — these are managed by flagship discovery
    if (isFlagshipSubtopic(slug)) {
      console.log(`  Skipped flagship subtopic: "${entity.entity}" → ${slug}`);
      skippedFlagship++;
      continue;
    }

    upsertTopicCluster(slug, entity.entity);

    if (existingSlugs.has(slug)) {
      updated++;
    } else {
      created++;
      newSeeds.push(slug);
      existingSlugs.add(slug); // track newly created
      console.log(`  New cluster: "${entity.entity}" → ${slug} (${entity.type}, ${entity.mentions} mentions)`);
    }
  }

  console.log(`  Updated ${updated} existing, created ${created} new clusters`);
  console.log(`  Skipped ${skippedFlagship} flagship subtopics (managed by discovery agent)`);

  closeDb();
  console.log(`\n✅ Entity extraction complete — ${entities.length} entities, ${created} new clusters`);
}

main().catch((err) => {
  console.error('❌ Entity extraction failed:', err);
  closeDb();
  process.exit(1);
});
