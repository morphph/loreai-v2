#!/usr/bin/env npx tsx
/**
 * scripts/process-queue.ts — Unified content generation from keyword queue
 * Replaces write-blog.ts + generate-seo.ts in the daily pipeline.
 *
 * Reads top-N pending jobs from create_queue (sorted by priority_score DESC),
 * runs the B4 source-grounded generation pipeline (Standard or Deep Research),
 * and writes EN+ZH content files.
 *
 * Usage:
 *   npx tsx scripts/process-queue.ts                     # Process top 5 jobs
 *   npx tsx scripts/process-queue.ts --limit=10          # Process top 10
 *   npx tsx scripts/process-queue.ts --job-id=42         # Process specific job
 *   npx tsx scripts/process-queue.ts --type=faq          # Only FAQ jobs
 *   npx tsx scripts/process-queue.ts --dry-run           # Preview without generation
 *   npx tsx scripts/process-queue.ts --en-only           # Skip ZH generation
 *   npx tsx scripts/process-queue.ts --skip-validation   # Skip link validation
 *
 * Pipeline integration (daily-pipeline.sh):
 *   6am SGT: process-queue (replaces blog + seo steps)
 *
 * @see docs/plans/KEYWORD-ENGINE-MIGRATION.md Phase C → C4
 * @see scripts/lib/content-gen.ts (B4 core orchestration)
 */
import 'dotenv/config';
import { runContentGeneration } from './lib/content-gen';
import { closeDb } from './lib/db';

import type { ContentGenOptions, ContentType } from './lib/content-gen';

// ── CLI Args ──

function parseArgs(): ContentGenOptions {
  const args = process.argv.slice(2);

  const limitArg = args.find((a) => a.startsWith('--limit='));
  const jobIdArg = args.find((a) => a.startsWith('--job-id='));
  const typeArg = args.find((a) => a.startsWith('--type='));
  const dryRun = args.includes('--dry-run');
  const enOnly = args.includes('--en-only');
  const skipValidation = args.includes('--skip-validation');

  const limit = limitArg ? parseInt(limitArg.split('=')[1], 10) : 5;
  const jobId = jobIdArg ? parseInt(jobIdArg.split('=')[1], 10) : undefined;
  const contentType = typeArg ? (typeArg.split('=')[1] as ContentType) : undefined;

  return { limit, jobId, contentType, dryRun, enOnly, skipValidation };
}

// ── Main ──

async function main() {
  const opts = parseArgs();

  console.log('\n🚀 Process Queue — Unified Content Generation');
  console.log('='.repeat(50));
  console.log(`  Limit: ${opts.jobId ? `job #${opts.jobId}` : opts.limit}`);
  if (opts.contentType) console.log(`  Filter: ${opts.contentType}`);
  if (opts.dryRun) console.log('  Mode: DRY RUN');
  if (opts.enOnly) console.log('  Lang: EN only');
  if (opts.skipValidation) console.log('  Link validation: SKIP');

  const result = await runContentGeneration(opts);

  // Summary
  console.log('\n' + '='.repeat(50));
  console.log('📊 Process Queue Summary');
  console.log(`  Jobs processed:     ${result.jobs_processed}`);
  console.log(`  Pages generated EN: ${result.pages_generated.en}`);
  console.log(`  Pages generated ZH: ${result.pages_generated.zh}`);
  if (result.pages_failed.en > 0 || result.pages_failed.zh > 0) {
    console.log(`  Pages failed EN:    ${result.pages_failed.en}`);
    console.log(`  Pages failed ZH:    ${result.pages_failed.zh}`);
  }
  if (result.broken_links_removed > 0) {
    console.log(`  Broken links fixed: ${result.broken_links_removed}`);
  }
  console.log(`  API calls: Serper=${result.api_calls.serper} Exa=${result.api_calls.exa} Claude=${result.api_calls.claude} Gemini=${result.api_calls.gemini}`);

  // Output JSON for pipeline consumption
  console.log('\n📤 Result JSON:');
  console.log(JSON.stringify(result, null, 2));

  closeDb();
  console.log('\n✅ Process queue complete');
}

main().catch((err) => {
  console.error('💥 Process queue failed:', err);
  closeDb();
  process.exit(1);
});
