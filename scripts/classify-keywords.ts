#!/usr/bin/env npx tsx
/**
 * classify-keywords.ts — Use Sonnet 4.6 to classify remaining queue items as relevant or off-topic
 *
 * Sends batches of keywords to Claude for relevance classification, then cancels off-topic items.
 *
 * Usage:
 *   npx tsx scripts/classify-keywords.ts              # apply changes
 *   npx tsx scripts/classify-keywords.ts --dry-run     # preview only
 */

import Anthropic from '@anthropic-ai/sdk';
import { getDb } from './lib/db';
import { isJunkGroup } from './lib/priority';

const dryRun = process.argv.includes('--dry-run');

const BATCH_SIZE = 80;

interface PendingItem {
  job_id: number;
  group_id: number;
  primary_keyword: string;
  intent: string;
  cluster_slug: string | null;
  priority_score: number;
}

async function main() {
const db = getDb();
const client = new Anthropic();

// ── Step 1: Load pending items, apply regex pass first ──

const allPending = db.prepare(`
  SELECT cq.job_id, cq.keyword_group_id as group_id, kg.primary_keyword,
    kg.intent, kg.cluster_slug, cq.priority_score
  FROM create_queue cq
  JOIN keyword_groups kg ON cq.keyword_group_id = kg.group_id
  WHERE cq.status = 'pending'
  ORDER BY cq.priority_score DESC
`).all() as PendingItem[];

console.log(`📥 Loaded ${allPending.length} pending items\n`);

// Regex pass
const regexJunk: PendingItem[] = [];
const toClassify: PendingItem[] = [];

for (const item of allPending) {
  if (isJunkGroup(item.primary_keyword, item.intent)) {
    regexJunk.push(item);
  } else {
    toClassify.push(item);
  }
}

if (regexJunk.length > 0) {
  console.log(`🗑  Regex pass: ${regexJunk.length} additional junk items found:`);
  for (const item of regexJunk) {
    console.log(`  ✗ "${item.primary_keyword}"`);
  }
  console.log();
}

console.log(`🤖 Sending ${toClassify.length} items to Sonnet 4.6 for classification...\n`);

// ── Step 2: Batch classify with Claude ──

const SYSTEM_PROMPT = `You are a keyword relevance classifier for LoreAI, an AI news and tools platform that covers:
- **Claude Code** (Anthropic's CLI coding agent) — features, setup, usage, tips, comparisons
- **OpenAI Codex** (OpenAI's coding agent) — the app, CLI, security product, setup, usage
- **AI coding tools** in general — comparisons between AI coding assistants, market trends
- **MCP (Model Context Protocol)** — setup, integration, servers

Your job: For each keyword, decide if someone Googling it would be looking for information about the above topics.

Mark as **KEEP** if:
- It's about Claude Code, Codex, or AI coding tools
- It's a comparison between AI coding tools (even if it names competitors like Cursor, Copilot, Windsurf)
- It's about a specific feature of Claude Code or Codex (hooks, skills, subagents, MCP, plan mode, etc.)
- It's about pricing, setup, or usage of these tools

Mark as **DROP** if:
- It's a generic tech concept that has nothing to do with AI coding tools (e.g., "what is access control", "git worktree list")
- It's about a completely different product (e.g., "how to use outlook", "wordpress plugins")
- It's a scraped article title or heading, not a real search query (e.g., "the three-surface pattern", "scope the risk surface")
- It's meaninglessly vague (e.g., "how it works", "run and scale")
- It's about ancient codex/manuscripts, not OpenAI Codex
- It's a doc navigation label, not a keyword (e.g., "extensions / get started", "for skill authors")

Respond with ONLY a JSON array of objects: [{"id": <number>, "verdict": "KEEP" | "DROP", "reason": "<5 words max>"}]
No other text.`;

interface ClassifyResult {
  id: number;
  verdict: 'KEEP' | 'DROP';
  reason: string;
}

const allResults: ClassifyResult[] = [];

for (let i = 0; i < toClassify.length; i += BATCH_SIZE) {
  const batch = toClassify.slice(i, i + BATCH_SIZE);
  const batchNum = Math.floor(i / BATCH_SIZE) + 1;
  const totalBatches = Math.ceil(toClassify.length / BATCH_SIZE);

  console.log(`  Batch ${batchNum}/${totalBatches} (${batch.length} items)...`);

  const keywordList = batch.map((item) =>
    `{"id": ${item.job_id}, "keyword": "${item.primary_keyword}", "cluster": "${item.cluster_slug}", "intent": "${item.intent}"}`,
  ).join('\n');

  try {
    const response = await client.messages.create({
      model: 'claude-sonnet-4-6-20250514',
      max_tokens: 4096,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: 'user',
          content: `Classify these keywords:\n\n${keywordList}`,
        },
      ],
    });

    const text = response.content
      .filter((b): b is Anthropic.TextBlock => b.type === 'text')
      .map((b) => b.text)
      .join('');

    // Parse JSON from response (handle potential markdown wrapping)
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      console.warn(`  ⚠ Could not parse response for batch ${batchNum}, skipping`);
      // Default to KEEP for unparseable batches
      for (const item of batch) {
        allResults.push({ id: item.job_id, verdict: 'KEEP', reason: 'parse_error' });
      }
      continue;
    }

    const results = JSON.parse(jsonMatch[0]) as ClassifyResult[];
    allResults.push(...results);

    const drops = results.filter((r) => r.verdict === 'DROP').length;
    console.log(`    → ${results.length} classified, ${drops} DROP`);
  } catch (err) {
    console.error(`  ⚠ API error on batch ${batchNum}: ${err instanceof Error ? err.message : err}`);
    // Default to KEEP on error
    for (const item of batch) {
      allResults.push({ id: item.job_id, verdict: 'KEEP', reason: 'api_error' });
    }
  }
}

// ── Step 3: Merge results ──

const resultMap = new Map<number, ClassifyResult>();
for (const r of allResults) {
  resultMap.set(r.id, r);
}

const llmDrops: PendingItem[] = [];
const kept: PendingItem[] = [];

for (const item of toClassify) {
  const result = resultMap.get(item.job_id);
  if (result?.verdict === 'DROP') {
    llmDrops.push(item);
  } else {
    kept.push(item);
  }
}

// ── Step 4: Report ──

console.log('\n' + '='.repeat(60));
console.log('📊 Classification Results:\n');

console.log(`  Regex junk (round 3):     ${regexJunk.length}`);
console.log(`  LLM classified DROP:      ${llmDrops.length}`);
console.log(`  Total to cancel:          ${regexJunk.length + llmDrops.length}`);
console.log(`  Remaining (KEEP):         ${kept.length}`);

if (llmDrops.length > 0) {
  console.log('\n  LLM DROPs:');
  // Group by cluster
  const byCluster: Record<string, { item: PendingItem; reason: string }[]> = {};
  for (const item of llmDrops) {
    const slug = item.cluster_slug || 'uncategorized';
    if (!byCluster[slug]) byCluster[slug] = [];
    const reason = resultMap.get(item.job_id)?.reason ?? '';
    byCluster[slug].push({ item, reason });
  }

  for (const [slug, items] of Object.entries(byCluster).sort((a, b) => b[1].length - a[1].length)) {
    console.log(`\n  ${slug}:`);
    for (const { item, reason } of items) {
      console.log(`    ✗ "${item.primary_keyword}" — ${reason}`);
    }
  }
}

// ── Step 5: Apply ──

if (dryRun) {
  console.log('\n⏸  DRY RUN — no changes written\n');
} else {
  console.log('\n💾 Applying changes...');

  const cancelJob = db.prepare(`UPDATE create_queue SET status = 'cancelled' WHERE job_id = ?`);
  const cancelGroup = db.prepare(
    `UPDATE keyword_groups SET status = 'cancelled', updated_at = CURRENT_TIMESTAMP WHERE group_id = ?`,
  );

  const tx = db.transaction(() => {
    for (const item of [...regexJunk, ...llmDrops]) {
      cancelJob.run(item.job_id);
      cancelGroup.run(item.group_id);
    }
  });

  tx();
  console.log(`  ✓ Cancelled ${regexJunk.length + llmDrops.length} items`);
  console.log(`  ✓ ${kept.length} items remain pending\n`);
}
} // end main

main().catch(console.error);
