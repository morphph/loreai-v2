/**
 * B2 — Keyword Grouping CLI
 *
 * Groups keywords by shared search intent using Claude.
 * Reads ungrouped keywords from DB, sends to Claude with
 * the keyword-grouping skill, writes keyword_groups to DB.
 *
 * Usage:
 *   npx tsx scripts/group-keywords.ts --cluster=claude-code-pricing
 *   npx tsx scripts/group-keywords.ts --topic=claude-code
 *   npx tsx scripts/group-keywords.ts --cluster=claude-code-pricing --dry-run
 *   npx tsx scripts/group-keywords.ts --cluster=claude-code-pricing --model=sonnet
 *   npx tsx scripts/group-keywords.ts --cluster=claude-code-pricing --force
 *
 * @see docs/plans/specs/SPEC-B2-keyword-grouping.md
 */

import { groupCluster, groupTopic } from './lib/keyword-group';
import { closeDb } from './lib/db';

import type { GroupOptions } from './lib/keyword-group';

// ── Parse CLI args ──

const args = process.argv.slice(2);

function getArg(name: string): string | undefined {
  const arg = args.find((a) => a.startsWith(`--${name}=`));
  return arg?.split('=').slice(1).join('=');
}

const clusterSlug = getArg('cluster');
const topicSlug = getArg('topic');
const dryRun = args.includes('--dry-run');
const force = args.includes('--force');
const modelArg = (getArg('model') ?? 'haiku') as 'haiku' | 'sonnet';

if (!clusterSlug && !topicSlug) {
  console.error(
    'Usage: npx tsx scripts/group-keywords.ts --cluster=<slug> | --topic=<slug> [--dry-run] [--model=haiku|sonnet] [--force]',
  );
  process.exit(1);
}

const opts: GroupOptions = {
  model: modelArg,
  dryRun,
  force,
};

// ── Main ──

async function main() {
  console.log(`📊 Keyword Grouping${topicSlug ? ` — ${topicSlug}` : ` — ${clusterSlug}`}`);
  console.log('='.repeat(50));

  if (dryRun) {
    console.log('🧪 DRY RUN mode — no DB writes\n');
  }

  if (topicSlug) {
    // Group all clusters under a topic
    console.log(`📥 Stage 1: Load Keywords for topic "${topicSlug}"\n`);
    console.log('🤖 Stage 2: Claude Grouping');

    const result = await groupTopic(topicSlug, opts);

    // Summary
    console.log('\n' + '='.repeat(50));

    if (dryRun) {
      console.log('🧪 DRY RUN — skipping DB write');
      console.log(`  Would create ${result.total_groups_created} keyword groups`);
      console.log(`  Would assign ${result.total_keywords_grouped} keywords`);
    } else {
      console.log('💾 Stage 3: Write to DB');
      console.log(`  ${result.total_groups_created} keyword groups created`);
      console.log(`  ${result.total_keywords_grouped} keywords assigned to groups`);
      console.log(`  ${result.total_ungrouped} keywords ungrouped`);
    }

    console.log(
      `\n✅ Keyword grouping complete — ${result.total_groups_created} groups across ${result.clusters_processed} clusters`,
    );
  } else {
    // Group a single cluster
    console.log(`📥 Stage 1: Load Keywords for cluster "${clusterSlug}"\n`);
    console.log('🤖 Stage 2: Claude Grouping');

    const result = await groupCluster(clusterSlug!, opts);

    if (result.total_keywords === 0) {
      console.log('  ✓ All keywords already grouped — nothing to do');
    } else {
      // Print group details
      for (const g of result.groups) {
        console.log(
          `    GROUP ${g.group_id}: "${g.primary_keyword}" (${g.content_type}, ${g.intent}) — ${g.keyword_count} keywords`,
        );
      }
      if (result.ungrouped_count > 0) {
        console.log(`    Ungrouped: ${result.ungrouped_count} keywords`);
      }
    }

    // Summary
    console.log('\n' + '='.repeat(50));

    if (dryRun) {
      console.log('🧪 DRY RUN — skipping DB write');
      console.log(`  Would create ${result.groups_created} keyword groups`);
    } else {
      console.log('💾 Stage 3: Write to DB');
      console.log(`  ${result.groups_created} keyword groups created`);
      const totalAssigned = result.groups.reduce((s, g) => s + g.keyword_count, 0);
      console.log(`  ${totalAssigned} keywords assigned to groups`);
      console.log(`  ${result.ungrouped_count} keywords ungrouped`);
    }

    console.log(
      `\n✅ Keyword grouping complete — ${result.groups_created} groups for "${clusterSlug}"`,
    );
  }

  closeDb();
}

main().catch((err) => {
  console.error('❌ Keyword grouping failed:', err);
  closeDb();
  process.exit(1);
});
