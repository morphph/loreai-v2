/**
 * B3 — Score & Queue Orchestration
 *
 * Bridges pure scoring/routing logic (priority.ts) with DB + Serper API.
 * Loads keyword groups from DB, optionally detects SERP depth,
 * scores, routes, and writes to create_queue.
 *
 * @see docs/plans/specs/SPEC-B3-priority-scoring.md
 */

import { getDb } from './db';
import {
  calculatePriorityScore,
  routeKeywordGroup,
  shouldDeferTopicHub,
} from './priority';

import type {
  ScoringInput,
  GroupKeyword,
  QueueEntry,
  ScoringRunResult,
} from './priority';
import type { SERPDepth } from './serper';

// ── Types ──

export interface ScoreQueueOptions {
  dryRun: boolean;
  skipSerp: boolean;
  force: boolean;
  maxSerp: number;
}

interface DBKeywordGroup {
  group_id: number;
  primary_keyword: string;
  intent: string;
  content_type: string;
  cluster_slug: string | null;
  priority_score: number;
  status: string;
}

// ── Main Orchestration ──

export async function scoreAndQueue(
  topicSlug: string | null,
  clusterSlug: string | null,
  opts: ScoreQueueOptions,
): Promise<ScoringRunResult> {
  const db = getDb();

  // ── Stage 1: Load pending keyword_groups ──
  console.log('\n📥 Stage 1: Load Pending Groups');

  const groups = loadPendingGroups(topicSlug, clusterSlug, opts.force);

  if (groups.length === 0) {
    return {
      groups_scored: 0,
      groups_queued: 0,
      groups_deferred: 0,
      groups_already_queued: 0,
      serp_api_calls: 0,
      queue_entries: [],
    };
  }

  console.log(`  Found ${groups.length} keyword groups`);

  // ── Stage 2: Load keywords per group + build ScoringInputs ──
  const loadKeywords = db.prepare(`
    SELECT keyword, search_volume, competition
    FROM keywords
    WHERE keyword_group_id = ?
  `);

  const scoringInputs: ScoringInput[] = [];
  for (const g of groups) {
    const keywords = loadKeywords.all(g.group_id) as GroupKeyword[];
    const eventAgeHours = findEventAgeHours(g.primary_keyword);

    scoringInputs.push({
      group_id: g.group_id,
      primary_keyword: g.primary_keyword,
      intent: g.intent,
      content_type: g.content_type,
      cluster_slug: g.cluster_slug,
      keywords,
      event_age_hours: eventAgeHours,
    });
  }

  // ── Stage 3: SERP depth detection (optional) ──
  let serpApiCalls = 0;
  const serpDepthMap = new Map<number, { depth: SERPDepth; recommended: string | null }>();

  if (!opts.skipSerp && process.env.SERPER_API_KEY) {
    console.log('\n🔍 Stage 2: SERP Depth Detection');

    let detectSERPDepth: typeof import('./serper').detectSERPDepth;
    try {
      const serperModule = await import('./serper');
      detectSERPDepth = serperModule.detectSERPDepth;
    } catch {
      console.warn('  ⚠ Could not load serper module, skipping SERP depth detection');
      detectSERPDepth = null as unknown as typeof import('./serper').detectSERPDepth;
    }

    if (detectSERPDepth) {
      const limit = Math.min(scoringInputs.length, opts.maxSerp);
      for (let i = 0; i < limit; i++) {
        const input = scoringInputs[i];
        try {
          const result = await detectSERPDepth(input.primary_keyword);
          serpDepthMap.set(input.group_id, {
            depth: result.depth,
            recommended: result.recommended_content_type,
          });
          serpApiCalls++;
          console.log(
            `  [${i + 1}/${limit}] "${input.primary_keyword}" → ${result.depth}`,
          );
        } catch (err) {
          console.warn(
            `  ⚠ SERP depth failed for "${input.primary_keyword}": ${err instanceof Error ? err.message : err}`,
          );
        }
      }
      console.log(`  ✓ ${serpApiCalls} SERP depth checks`);
    }
  } else if (!opts.skipSerp && !process.env.SERPER_API_KEY) {
    console.log('\n  ⚠ SERPER_API_KEY not set, auto-skipping SERP depth detection');
  }

  // ── Stage 4: Score all groups ──
  console.log('\n📈 Stage 3: Priority Scoring');

  const scored = scoringInputs.map((input) => calculatePriorityScore(input));
  scored.sort((a, b) => b.priority_score - a.priority_score);

  // Print top 5
  const top = scored.slice(0, 5);
  console.log('  TOP 5:');
  for (let i = 0; i < top.length; i++) {
    const s = top[i];
    const bd = s.score_breakdown;
    const parts = [`vol=${bd.volume}`, `comp=${bd.competition_divisor}`, `intent=${s.score_breakdown.intent_multiplier}`];
    if (bd.timeliness_bonus > 0) parts.push(`timeliness=${bd.timeliness_bonus}`);
    console.log(
      `    ${i + 1}. "${s.primary_keyword}" → ${s.priority_score.toLocaleString()}  (${parts.join(' ')})`,
    );
  }

  // ── Stage 5: Route all groups ──
  console.log('\n🔀 Stage 4: Queue Routing');

  const checkExistingJob = db.prepare(`
    SELECT job_id FROM create_queue
    WHERE keyword_group_id = ?
      AND status IN ('pending', 'in_progress')
  `);

  const routingSummary: Record<string, number> = {};
  let deferredCount = 0;
  let alreadyQueuedCount = 0;

  const queueEntries: QueueEntry[] = scored.map((scoringResult) => {
    const input = scoringInputs.find((i) => i.group_id === scoringResult.group_id)!;
    const serpData = serpDepthMap.get(input.group_id);

    // Get cluster page count for topic-hub deferral check
    const clusterPageCount = input.cluster_slug
      ? getClusterPageCount(input.cluster_slug)
      : 0;

    const routing = routeKeywordGroup({
      intent: input.intent,
      b2_content_type: input.content_type,
      serp_depth: serpData?.depth ?? null,
      recommended_content_type: serpData?.recommended ?? null,
      cluster_page_count: clusterPageCount,
    });

    const deferred = shouldDeferTopicHub(routing.content_type, clusterPageCount);
    const existingJob = checkExistingJob.get(input.group_id) as { job_id: number } | undefined;
    const alreadyQueued = !!existingJob;

    if (deferred) deferredCount++;
    if (alreadyQueued) alreadyQueuedCount++;

    const routeKey = `${routing.content_type} (${routing.research_pipeline})`;
    if (deferred) {
      routingSummary[`${routing.content_type} (deferred)`] = (routingSummary[`${routing.content_type} (deferred)`] ?? 0) + 1;
    } else {
      routingSummary[routeKey] = (routingSummary[routeKey] ?? 0) + 1;
    }

    return {
      group_id: input.group_id,
      primary_keyword: input.primary_keyword,
      scoring: scoringResult,
      routing,
      deferred,
      already_queued: alreadyQueued,
    };
  });

  // Print routing summary
  for (const [key, count] of Object.entries(routingSummary)) {
    console.log(`  ${key}: ${count} group${count > 1 ? 's' : ''}`);
  }

  // ── Stage 6: Write to DB ──
  const queuedCount = queueEntries.filter((e) => !e.deferred && !e.already_queued).length;

  if (!opts.dryRun) {
    writeToQueue(queueEntries);
  }

  return {
    groups_scored: scored.length,
    groups_queued: queuedCount,
    groups_deferred: deferredCount,
    groups_already_queued: alreadyQueuedCount,
    serp_api_calls: serpApiCalls,
    queue_entries: queueEntries,
  };
}

// ── DB Helpers ──

function loadPendingGroups(
  topicSlug: string | null,
  clusterSlug: string | null,
  force: boolean,
): DBKeywordGroup[] {
  const db = getDb();

  if (clusterSlug) {
    // Single cluster
    return db.prepare(`
      SELECT group_id, primary_keyword, intent, content_type,
             cluster_slug, priority_score, status
      FROM keyword_groups
      WHERE cluster_slug = ?
        AND (priority_score = 0 OR ? = 1)
        AND status IN ('pending', 'queued')
      ORDER BY group_id
    `).all(clusterSlug, force ? 1 : 0) as DBKeywordGroup[];
  }

  if (topicSlug) {
    // All clusters under a topic
    return db.prepare(`
      SELECT group_id, primary_keyword, intent, content_type,
             cluster_slug, priority_score, status
      FROM keyword_groups
      WHERE (cluster_slug LIKE ? OR cluster_slug = ?)
        AND (priority_score = 0 OR ? = 1)
        AND status IN ('pending', 'queued')
      ORDER BY group_id
    `).all(`${topicSlug}-%`, topicSlug, force ? 1 : 0) as DBKeywordGroup[];
  }

  return [];
}

function findEventAgeHours(primaryKeyword: string): number | null {
  const db = getDb();

  // Search news_items for recent events matching the primary keyword
  const row = db.prepare(`
    SELECT MIN(
      (julianday('now') - julianday(detected_at)) * 24
    ) as hours_ago
    FROM news_items
    WHERE detected_at > datetime('now', '-7 days')
      AND (title LIKE ? OR summary LIKE ?)
  `).get(`%${primaryKeyword}%`, `%${primaryKeyword}%`) as { hours_ago: number | null } | undefined;

  return row?.hours_ago ?? null;
}

function getClusterPageCount(clusterSlug: string): number {
  const db = getDb();

  // Count published content pages for this cluster
  const row = db.prepare(`
    SELECT COUNT(*) as count FROM content
    WHERE type IN ('faq', 'compare', 'glossary', 'blog', 'topic-hub', 'cornerstone')
      AND slug LIKE ?
  `).get(`${clusterSlug}%`) as { count: number };

  return row.count;
}

function writeToQueue(entries: QueueEntry[]): void {
  const db = getDb();

  const updateGroupScore = db.prepare(`
    UPDATE keyword_groups
    SET priority_score = ?, updated_at = CURRENT_TIMESTAMP
    WHERE group_id = ?
  `);

  const insertQueueJob = db.prepare(`
    INSERT INTO create_queue
      (keyword_group_id, content_type, research_pipeline, priority_score, status)
    VALUES (?, ?, ?, ?, 'pending')
  `);

  const updateGroupStatus = db.prepare(`
    UPDATE keyword_groups
    SET status = ?, updated_at = CURRENT_TIMESTAMP
    WHERE group_id = ?
  `);

  const tx = db.transaction(() => {
    for (const entry of entries) {
      // Always update the score
      updateGroupScore.run(entry.scoring.priority_score, entry.group_id);

      // Insert into queue if not deferred and not already queued
      if (!entry.deferred && !entry.already_queued) {
        insertQueueJob.run(
          entry.group_id,
          entry.routing.content_type,
          entry.routing.research_pipeline,
          entry.scoring.priority_score,
        );
        updateGroupStatus.run('queued', entry.group_id);
      }
    }
  });

  tx();
}
