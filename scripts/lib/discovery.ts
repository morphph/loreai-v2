/**
 * C1 — Discovery Cycle Core Logic
 *
 * Orchestrates: Subtopic Discovery → B1 (Expansion) → B2 (Grouping) → B3 (Scoring)
 * Two modes: scheduled (Saturday cron) and event-triggered (news pipeline).
 *
 * @see docs/plans/specs/SPEC-C1-discovery-cycle.md
 */

import { getDb, upsertTopicCluster, closeDb } from './db';
import { expandTopic } from './keyword-expand';
import { groupTopic } from './keyword-group';
import { scoreAndQueue } from './score-queue';

import type { ExpandOptions, SubtopicInput } from './keyword-expand';
import type { GroupOptions, GroupingRunResult } from './keyword-group';
import type { ScoreQueueOptions } from './score-queue';
import type { ScoringRunResult } from './priority';

// ── Constants ──

export const MAX_NEW_SUBTOPICS_PER_EVENT = 3;

// ── Flagship Topics Config ──

export interface FlagshipTopic {
  slug: string;
  name: string;
  cornerstoneUrl: string;
  excludeDomains: string[];
}

export const FLAGSHIP_TOPICS: FlagshipTopic[] = [
  {
    slug: 'claude-code',
    name: 'Claude Code',
    cornerstoneUrl: 'https://loreai.dev/claude-code',
    excludeDomains: ['loreai.dev'],
  },
  {
    slug: 'codex',
    name: 'OpenAI Codex',
    cornerstoneUrl: 'https://loreai.dev/codex',
    excludeDomains: ['loreai.dev'],
  },
];

// ── Types ──

export interface SubtopicDiscoveryResult {
  event: string;
  new_subtopics: Array<{ slug: string; pillar_topic: string }>;
  existing_match_count: number;
}

export interface DiscoveryCycleResult {
  topic: string;
  mode: 'scheduled' | 'event-triggered';
  event?: string;
  timestamp: string;

  // Stage 0 (event-triggered only)
  subtopic_discovery?: SubtopicDiscoveryResult;

  // Stage 1
  expansion: {
    subtopics_processed: number;
    total_keywords_discovered: number;
    total_new_keywords: number;
    serper_api_calls: number;
    exa_api_calls: number;
  };

  // Stage 2
  grouping: {
    clusters_processed: number;
    total_keywords_grouped: number;
    total_groups_created: number;
    claude_api_calls: number;
  } | null;

  // Stage 3
  scoring: {
    groups_scored: number;
    groups_queued: number;
    groups_deferred: number;
    serp_api_calls: number;
    top_5_queue: Array<{
      primary_keyword: string;
      priority_score: number;
      content_type: string;
      research_pipeline: string;
    }>;
  } | null;

  // Totals
  total_api_calls: number;
  duration_ms: number;

  // Errors
  errors?: string[];
}

export interface DiscoveryOptions {
  topic?: string;
  event?: string;
  expandOnly: boolean;
  dryRun: boolean;
  delay: number;
  maxSerp: number;
  skipExa: boolean;
  skipSerp: boolean;
  model: 'haiku' | 'sonnet';
}

// ── Subtopic Filtering ──

export function filterSubtopicsByEvent(
  allSubtopics: SubtopicInput[],
  event: string,
): SubtopicInput[] {
  const eventTokens = new Set(
    event
      .toLowerCase()
      .split(/\s+/)
      .filter((w) => w.length > 3),
  );

  const matched = allSubtopics.filter((s) => {
    const subtopicTokens = `${s.slug} ${s.pillar_topic}`
      .toLowerCase()
      .split(/[\s-]+/);
    return subtopicTokens.some((t) => eventTokens.has(t));
  });

  // Fallback to first subtopic if no match
  return matched.length > 0 ? matched : allSubtopics.slice(0, 1);
}

// ── Subtopic Discovery (Stage 0) ──

export async function discoverNewSubtopics(
  topicSlug: string,
  event: string,
  existingSlugs: Set<string>,
): Promise<SubtopicDiscoveryResult> {
  // Dynamic import to avoid hard dependency
  const { searchRelated } = await import('./serper');

  const related = await searchRelated(`${topicSlug.replace(/-/g, ' ')} ${event}`);

  const newSubtopics: Array<{ slug: string; pillar_topic: string }> = [];
  let existingMatchCount = 0;

  for (const query of related.related) {
    // Slugify: lowercase, replace spaces/special chars with hyphens
    const slugified = query
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');

    const candidateSlug = `${topicSlug}-${slugified}`;

    if (existingSlugs.has(candidateSlug)) {
      existingMatchCount++;
      continue;
    }

    // Check if the candidate relates to the topic
    if (!candidateSlug.startsWith(topicSlug)) continue;

    newSubtopics.push({
      slug: candidateSlug,
      pillar_topic: query,
    });

    if (newSubtopics.length >= MAX_NEW_SUBTOPICS_PER_EVENT) break;
  }

  return {
    event,
    new_subtopics: newSubtopics,
    existing_match_count: existingMatchCount,
  };
}

// ── Load Subtopics from DB ──

function loadSubtopics(topicSlug: string): SubtopicInput[] {
  const db = getDb();
  const rows = db
    .prepare(
      `SELECT slug, pillar_topic FROM topic_clusters
       WHERE slug LIKE ? OR slug = ?
       ORDER BY mention_count DESC`,
    )
    .all(`${topicSlug}-%`, topicSlug) as Array<{
    slug: string;
    pillar_topic: string;
  }>;

  return rows.map((r) => ({ slug: r.slug, pillar_topic: r.pillar_topic }));
}

// ── Run Discovery for a Single Topic ──

export async function runDiscoveryForTopic(
  topic: FlagshipTopic,
  opts: DiscoveryOptions & { mode: 'scheduled' | 'event-triggered' },
): Promise<DiscoveryCycleResult> {
  const startTime = Date.now();
  const errors: string[] = [];

  const result: DiscoveryCycleResult = {
    topic: topic.slug,
    mode: opts.mode,
    event: opts.event,
    timestamp: new Date().toISOString(),
    expansion: {
      subtopics_processed: 0,
      total_keywords_discovered: 0,
      total_new_keywords: 0,
      serper_api_calls: 0,
      exa_api_calls: 0,
    },
    grouping: null,
    scoring: null,
    total_api_calls: 0,
    duration_ms: 0,
  };

  // Load subtopics
  let subtopics = loadSubtopics(topic.slug);

  // ── Stage 0: Subtopic Discovery (event-triggered only) ──

  if (opts.event && opts.mode === 'event-triggered') {
    try {
      console.error(`\nStage 0 — Subtopic Discovery`);
      const existingSlugs = new Set(subtopics.map((s) => s.slug));
      const discovery = await discoverNewSubtopics(
        topic.slug,
        opts.event,
        existingSlugs,
      );
      result.subtopic_discovery = discovery;

      // Write new subtopics to DB
      if (!opts.dryRun) {
        for (const st of discovery.new_subtopics) {
          upsertTopicCluster(st.slug, st.pillar_topic);
        }
      }

      console.error(
        `  New subtopics: ${discovery.new_subtopics.length}, Existing matches: ${discovery.existing_match_count}`,
      );

      // Reload subtopics if new ones were added
      if (discovery.new_subtopics.length > 0 && !opts.dryRun) {
        subtopics = loadSubtopics(topic.slug);
      }
    } catch (err) {
      const msg = `Stage 0 failed: ${err instanceof Error ? err.message : String(err)}`;
      errors.push(msg);
      console.error(`  ❌ ${msg}`);
    }
  }

  // Event-triggered: filter subtopics to only relevant ones
  let targetSubtopicSlugs: string[] | null = null;
  if (opts.event && subtopics.length > 0) {
    const filtered = filterSubtopicsByEvent(subtopics, opts.event);
    targetSubtopicSlugs = filtered.map((s) => s.slug);
  }

  // ── Stage 1: Keyword Expansion (B1) ──

  let stage1Success = false;
  try {
    console.error(`\nStage 1 — Keyword Expansion`);

    const expandOpts: ExpandOptions = {
      delayMs: opts.delay,
      skipExa: opts.skipExa,
      maxVolumeCallsPerSubtopic: 10,
      dryRun: opts.dryRun,
    };

    const expansionResult = await expandTopic(
      topic.slug,
      targetSubtopicSlugs,
      expandOpts,
    );

    result.expansion = {
      subtopics_processed: expansionResult.subtopics_processed,
      total_keywords_discovered: expansionResult.total_keywords_discovered,
      total_new_keywords: expansionResult.total_new_keywords,
      serper_api_calls: expansionResult.serper_api_calls,
      exa_api_calls: expansionResult.exa_api_calls,
    };

    console.error(
      `  Subtopics: ${expansionResult.subtopics_processed}, New keywords: ${expansionResult.total_new_keywords}`,
    );
    console.error(
      `  API calls: Serper ${expansionResult.serper_api_calls}, Exa ${expansionResult.exa_api_calls}`,
    );

    stage1Success = true;
  } catch (err) {
    const msg = `Stage 1 failed: ${err instanceof Error ? err.message : String(err)}`;
    errors.push(msg);
    console.error(`  ❌ ${msg}`);
  }

  // If expand-only or Stage 1 failed, skip remaining stages
  if (opts.expandOnly || !stage1Success) {
    result.total_api_calls =
      result.expansion.serper_api_calls + result.expansion.exa_api_calls;
    result.duration_ms = Date.now() - startTime;
    if (errors.length > 0) result.errors = errors;
    return result;
  }

  // ── Stage 2: Keyword Grouping (B2) ──

  // Skip if no new keywords found in Stage 1
  if (result.expansion.total_new_keywords > 0) {
    try {
      console.error(`\nStage 2 — Keyword Grouping`);

      const groupOpts: GroupOptions = {
        model: opts.model,
        dryRun: opts.dryRun,
        force: false, // Never force re-group — incremental only
      };

      const groupingResult: GroupingRunResult = await groupTopic(
        topic.slug,
        groupOpts,
      );

      result.grouping = {
        clusters_processed: groupingResult.clusters_processed,
        total_keywords_grouped: groupingResult.total_keywords_grouped,
        total_groups_created: groupingResult.total_groups_created,
        claude_api_calls: groupingResult.claude_api_calls,
      };

      console.error(
        `  Clusters: ${groupingResult.clusters_processed}, Groups created: ${groupingResult.total_groups_created}`,
      );
      console.error(
        `  Keywords grouped: ${groupingResult.total_keywords_grouped}, Claude API calls: ${groupingResult.claude_api_calls}`,
      );
    } catch (err) {
      const msg = `Stage 2 failed: ${err instanceof Error ? err.message : String(err)}`;
      errors.push(msg);
      console.error(`  ❌ ${msg}`);
    }
  } else {
    console.error(`\nStage 2 — Skipped (no new keywords)`);
  }

  // ── Stage 3: Priority Scoring + Queue (B3) ──

  try {
    console.error(`\nStage 3 — Priority Scoring + Queue`);

    const scoreOpts: ScoreQueueOptions = {
      dryRun: opts.dryRun,
      skipSerp: opts.skipSerp,
      force: false, // Don't re-score groups with existing scores
      maxSerp: opts.maxSerp,
    };

    const scoringResult: ScoringRunResult = await scoreAndQueue(
      topic.slug,
      null,
      scoreOpts,
    );

    // Build top 5 queue
    const top5 = scoringResult.queue_entries
      .sort((a, b) => b.scoring.priority_score - a.scoring.priority_score)
      .slice(0, 5)
      .map((e) => ({
        primary_keyword: e.primary_keyword,
        priority_score: e.scoring.priority_score,
        content_type: e.routing.content_type,
        research_pipeline: e.routing.research_pipeline,
      }));

    result.scoring = {
      groups_scored: scoringResult.groups_scored,
      groups_queued: scoringResult.groups_queued,
      groups_deferred: scoringResult.groups_deferred,
      serp_api_calls: scoringResult.serp_api_calls,
      top_5_queue: top5,
    };

    console.error(
      `  Groups scored: ${scoringResult.groups_scored}, Queued: ${scoringResult.groups_queued}, Deferred: ${scoringResult.groups_deferred}`,
    );
    console.error(`  SERP API calls: ${scoringResult.serp_api_calls}`);

    if (top5.length > 0) {
      console.error(`\n  Top ${top5.length} in queue:`);
      for (let i = 0; i < top5.length; i++) {
        const e = top5[i];
        console.error(
          `  #${i + 1}  ${e.primary_keyword.padEnd(35)} score=${e.priority_score}  ${e.content_type}  ${e.research_pipeline}`,
        );
      }
    }
  } catch (err) {
    const msg = `Stage 3 failed: ${err instanceof Error ? err.message : String(err)}`;
    errors.push(msg);
    console.error(`  ❌ ${msg}`);
  }

  // ── Totals ──

  let totalApi =
    result.expansion.serper_api_calls + result.expansion.exa_api_calls;
  if (result.grouping) totalApi += result.grouping.claude_api_calls;
  if (result.scoring) totalApi += result.scoring.serp_api_calls;

  result.total_api_calls = totalApi;
  result.duration_ms = Date.now() - startTime;
  if (errors.length > 0) result.errors = errors;

  return result;
}

// ── Run Full Discovery Cycle ──

export async function runDiscoveryCycle(
  opts: DiscoveryOptions,
): Promise<DiscoveryCycleResult[]> {
  const results: DiscoveryCycleResult[] = [];

  if (opts.topic) {
    // Single topic mode
    const topic = FLAGSHIP_TOPICS.find((t) => t.slug === opts.topic);
    if (!topic) {
      throw new Error(
        `Unknown flagship topic: "${opts.topic}". Available: ${FLAGSHIP_TOPICS.map((t) => t.slug).join(', ')}`,
      );
    }

    const mode = opts.event ? 'event-triggered' : 'scheduled';
    console.error(`\n═══ Discovery: ${topic.name} (${mode}) ═══\n`);

    const result = await runDiscoveryForTopic(topic, { ...opts, mode });
    results.push(result);
  } else {
    // Multi-topic scheduled mode
    for (const topic of FLAGSHIP_TOPICS) {
      console.error(`\n═══ Discovery: ${topic.name} ═══\n`);
      const result = await runDiscoveryForTopic(topic, {
        ...opts,
        mode: 'scheduled',
      });
      results.push(result);
    }
  }

  return results;
}
