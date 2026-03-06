import { readFileSync } from 'fs';
import { join } from 'path';
import { getDb, getRecentNewsItems, upsertTopicCluster, upsertKeyword, closeDb } from './lib/db';
import { callClaudeWithRetry, checkClaudeHealth } from './lib/ai';
import { braveExpandNewTopics } from './lib/topic-cluster';
import 'dotenv/config';

// Parse args
const args = process.argv.slice(2);
const DRY_RUN = args.includes('--dry-run');
const DATE = args.find((a) => a.startsWith('--date='))?.split('=')[1] || new Date().toISOString().slice(0, 10);

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
  const items = getRecentNewsItems(30); // last 30 hours to catch overnight items
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

  let entities: ExtractedEntity[];

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

  entities = parseEntities(response.content);
  console.log(`  Extracted ${entities.length} entities via ${response.model}`);

  // Stage 3: Update clusters
  console.log('\n📊 Stage 3: Update Topic Clusters');
  const newSeeds: string[] = [];
  let updated = 0;
  let created = 0;

  // Batch-load existing clusters to avoid N+1 queries
  const db = getDb();
  const existingSlugs = new Set(
    (db.prepare('SELECT slug FROM topic_clusters').all() as { slug: string }[])
      .map((r) => r.slug)
  );

  for (const entity of entities) {
    const slug = entity.normalized;
    if (!slug) continue;

    upsertTopicCluster(slug, entity.entity);
    upsertKeyword(entity.entity, 'ai-extraction', slug);

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

  // Stage 4: Brave expand new topics
  if (newSeeds.length > 0) {
    console.log('\n🌐 Stage 4: Brave Search Expansion');
    await braveExpandNewTopics(newSeeds);
  }

  closeDb();
  console.log(`\n✅ Entity extraction complete — ${entities.length} entities, ${created} new clusters`);
}

main().catch((err) => {
  console.error('❌ Entity extraction failed:', err);
  closeDb();
  process.exit(1);
});
