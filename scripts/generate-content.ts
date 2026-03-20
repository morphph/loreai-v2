/**
 * B4 — Source-Grounded Content Generation CLI
 *
 * Reads pending jobs from create_queue, runs research + generation pipeline,
 * and writes content to filesystem + DB.
 *
 * Usage:
 *   npx tsx scripts/generate-content.ts --limit=5
 *   npx tsx scripts/generate-content.ts --job=42
 *   npx tsx scripts/generate-content.ts --type=faq --limit=10
 *   npx tsx scripts/generate-content.ts --limit=5 --dry-run
 *   npx tsx scripts/generate-content.ts --limit=5 --en-only
 *   npx tsx scripts/generate-content.ts --limit=5 --skip-validation
 *
 * @see docs/plans/specs/SPEC-B4-content-generation.md
 */

import { runContentGeneration } from './lib/content-gen';
import { closeDb } from './lib/db';

import type { ContentGenOptions, ContentType } from './lib/content-gen';

// ── Parse CLI args ──

const args = process.argv.slice(2);

function getArg(name: string): string | undefined {
  const arg = args.find((a) => a.startsWith(`--${name}=`));
  return arg?.split('=').slice(1).join('=');
}

const VALID_TYPES = new Set([
  'faq',
  'compare',
  'glossary',
  'topic-hub',
  'news-blog',
  'deep-dive',
  'cornerstone',
]);

const limit = Number(getArg('limit') ?? 5);
const jobId = getArg('job') ? Number(getArg('job')) : undefined;
const contentType = getArg('type') as ContentType | undefined;
const dryRun = args.includes('--dry-run');
const enOnly = args.includes('--en-only');
const skipValidation = args.includes('--skip-validation');

// Validate content type
if (contentType && !VALID_TYPES.has(contentType)) {
  console.error(`Invalid content type: ${contentType}`);
  console.error(`Valid types: ${[...VALID_TYPES].join(', ')}`);
  process.exit(1);
}

const opts: ContentGenOptions = {
  limit,
  jobId,
  contentType,
  dryRun,
  enOnly,
  skipValidation,
};

// ── Main ──

async function main() {
  console.log('📝 Content Generation — Source-Grounded Pipeline');
  console.log('='.repeat(50));

  if (dryRun) console.log('🧪 DRY RUN mode — no AI calls, no writes\n');
  if (enOnly) console.log('🇬🇧 EN-only mode — skipping ZH generation\n');
  if (skipValidation) console.log('⚠️  Link validation disabled\n');
  if (jobId) console.log(`🎯 Processing single job: ${jobId}\n`);
  if (contentType) console.log(`🏷️  Filtering by type: ${contentType}\n`);

  const result = await runContentGeneration(opts);

  // Print summary
  console.log('\n' + '='.repeat(50));
  console.log('💾 Summary');
  console.log(`  ${result.jobs_processed} jobs processed`);
  console.log(
    `  EN: ${result.pages_generated.en} generated, ${result.pages_failed.en} failed`,
  );
  console.log(
    `  ZH: ${result.pages_generated.zh} generated, ${result.pages_failed.zh} failed`,
  );
  console.log(`  ${result.broken_links_removed} broken links removed`);
  console.log(
    `  API calls: ${result.api_calls.serper} Serper, ${result.api_calls.exa} Exa, ${result.api_calls.claude} Claude, ${result.api_calls.gemini} Gemini`,
  );

  closeDb();
}

main().catch((err) => {
  console.error('❌ Content generation failed:', err);
  closeDb();
  process.exit(1);
});
