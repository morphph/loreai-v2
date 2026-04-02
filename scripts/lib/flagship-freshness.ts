/**
 * Flagship Freshness — Daily freshness mode core logic.
 *
 * Routes fresh news signals to existing approved subtopics,
 * generates queue drafts for create/refresh actions.
 */

import { readFileSync } from 'fs';
import path from 'path';

import { callClaudeWithRetry } from './ai';
import { getDb, getAllRecentNewsItems, upsertKeyword, type NewsItem } from './db';
import {
  type SubtopicPack,
  type EventRouting,
  type EventRoutingResult,
  type QueueDraftItem,
  type QueueDraft,
  loadPack,
  isDuplicateQueueJob,
} from './subtopic-pack';
import { type FlagshipTopic } from './discovery';

// ── Types ──

interface FreshSignal {
  news_item_id: number;
  title: string;
  url: string;
  source: string;
  summary: string;
  detected_at: string;
}

interface ExistingContentEntry {
  type: string;
  slug: string;
  lang: string;
  title: string | null;
  created_at: string;
}

interface LLMRoutingItem {
  signal_index: number;
  event: {
    title: string;
    url: string;
    source: string;
    detected_at: string;
  };
  target_subtopics: string[];
  target_pages: string[];
  action: 'refresh' | 'create' | 'refresh_and_create' | 'ignore';
  reasoning: string;
  suggested_keyword?: string;
  suggested_content_type?: string;
}

interface FreshnessOptions {
  dryRun: boolean;
  hours: number;
}

interface FreshnessRunResult {
  topicSlug: string;
  signalsFound: number;
  signalsFiltered: number;
  routingsCreated: number;
  draftsWritten: number;
  ignored: number;
  skippedDedup: number;
}

// ── Skill Prompt ──

const SKILL_PATH = path.join(
  __dirname,
  '../../skills/flagship-freshness/SKILL.md',
);

function loadSkillPrompt(): string {
  return readFileSync(SKILL_PATH, 'utf-8');
}

// ── Step 1: Load Fresh Signals ──

export function loadFreshSignals(
  topicSlug: string,
  pack: SubtopicPack,
  backHours: number,
): FreshSignal[] {
  const allItems = getAllRecentNewsItems(backHours);

  // Build keyword set for filtering: topic name + subtopic names + aliases
  const keywords: string[] = [
    pack.topic_name.toLowerCase(),
    ...pack.subtopics.flatMap((s) => [
      s.name.toLowerCase(),
      ...s.aliases.map((a) => a.toLowerCase()),
    ]),
  ];

  // Filter items that mention any keyword in title or summary
  const signals: FreshSignal[] = [];
  for (const item of allItems) {
    const text = `${item.title} ${item.summary || ''}`.toLowerCase();
    const matches = keywords.some((kw) => text.includes(kw));
    if (matches) {
      signals.push({
        news_item_id: item.id!,
        title: item.title,
        url: item.url || '',
        source: item.source,
        summary: item.summary || '',
        detected_at: item.detected_at || new Date().toISOString(),
      });
    }
  }

  return signals;
}

// ── Step 2: Load Existing Content ──

export function loadExistingContent(topicSlug: string, pack: SubtopicPack): ExistingContentEntry[] {
  const db = getDb();

  // Get all subtopic slugs from the pack
  const subtopicSlugs = pack.subtopics.map((s) => s.slug);
  if (subtopicSlugs.length === 0) return [];

  // Find content whose slug contains any of the subtopic slugs or the topic slug
  const allSlugs = [topicSlug, ...subtopicSlugs];
  const placeholders = allSlugs.map(() => '?').join(', ');

  // Match content slugs that start with any of the topic/subtopic slugs
  const likeConditions = allSlugs
    .map(() => `slug LIKE ? || '%'`)
    .join(' OR ');

  const rows = db
    .prepare(
      `SELECT type, slug, lang, title, created_at FROM content
       WHERE (${likeConditions})
       ORDER BY created_at DESC`,
    )
    .all(...allSlugs) as ExistingContentEntry[];

  return rows;
}

// ── Step 2.5: Flagship Topic Relevance Pre-Filter ──

export async function filterSignalsByFlagship(
  signals: FreshSignal[],
  pack: SubtopicPack,
  topicName: string,
  opts: Pick<FreshnessOptions, 'dryRun'>,
): Promise<FreshSignal[]> {
  if (opts.dryRun) return signals;
  if (signals.length === 0) return signals;

  const systemPrompt = `You are a relevance classifier for the flagship topic '${topicName}'. For each news signal, determine if it genuinely relates to this specific product/topic — not just to AI in general. Return JSON only: { "results": [{ "index": number, "relevant": boolean }] }`;

  const numberedList = signals
    .map((s, i) => `${i}. ${s.title}\n   ${s.summary}`)
    .join('\n');

  const userPrompt = `Classify each signal for relevance to "${topicName}":\n\n${numberedList}`;

  try {
    const response = await callClaudeWithRetry(systemPrompt, userPrompt, {
      model: 'claude-sonnet-4-20250514',
      maxTokens: 1024,
      temperature: 0,
    });

    const parsed = JSON.parse(response.content) as {
      results: { index: number; relevant: boolean }[];
    };

    if (!parsed.results || !Array.isArray(parsed.results)) {
      console.log('  ⚠ Flagship filter: unexpected response shape, passing all signals through');
      return signals;
    }

    const relevantIndices = new Set(
      parsed.results.filter((r) => r.relevant).map((r) => r.index),
    );

    return signals.filter((_, i) => relevantIndices.has(i));
  } catch (err) {
    console.log(`  ⚠ Flagship filter error (fail-open): ${err}`);
    return signals;
  }
}

// ── Step 3: Route Events to Subtopics ──

export async function routeEventsToSubtopics(
  signals: FreshSignal[],
  pack: SubtopicPack,
  existingContent: ExistingContentEntry[],
  opts: Pick<FreshnessOptions, 'dryRun'>,
): Promise<EventRoutingResult> {
  const result: EventRoutingResult = {
    topic_slug: pack.topic_slug,
    run_timestamp: new Date().toISOString(),
    events_processed: signals.length,
    routings: [],
    ignored_events: [],
  };

  if (signals.length === 0) {
    console.log('  No signals to route');
    return result;
  }

  if (opts.dryRun) {
    console.log(`  [dry-run] Would route ${signals.length} signals`);
    return result;
  }

  const systemPrompt = loadSkillPrompt();

  // Build context strings
  const subtopicContext = pack.subtopics
    .map(
      (s) =>
        `${s.slug}: ${s.name} — ${s.description} [freshness: ${s.freshness_sensitivity}]`,
    )
    .join('\n');

  const contentContext =
    existingContent.length > 0
      ? existingContent
          .map((c) => `${c.type}/${c.slug} (${c.lang}): ${c.title || '(no title)'}`)
          .join('\n')
      : '(no existing content)';

  // Batch signals (max 20 per call)
  const BATCH_SIZE = 20;
  for (let i = 0; i < signals.length; i += BATCH_SIZE) {
    const batch = signals.slice(i, i + BATCH_SIZE);
    const signalsList = batch
      .map(
        (s, idx) =>
          `${i + idx + 1}. [${s.source}] ${s.title}\n   URL: ${s.url}\n   Summary: ${s.summary}\n   Detected: ${s.detected_at}`,
      )
      .join('\n\n');

    const userPrompt = `TOPIC: ${pack.topic_name} (${pack.topic_slug})

--- APPROVED SUBTOPICS ---
${subtopicContext}

--- EXISTING CONTENT ---
${contentContext}

--- FRESH SIGNALS ---
${signalsList}`;

    const response = await callClaudeWithRetry(systemPrompt, userPrompt, {
      model: 'claude-sonnet-4-20250514',
      maxTokens: 4096,
      temperature: 0.2,
      validate: (content) => {
        try {
          const parsed = JSON.parse(content);
          if (!Array.isArray(parsed))
            return { valid: false, errors: ['Expected JSON array'] };
          return { valid: true, errors: [] };
        } catch {
          return { valid: false, errors: ['Invalid JSON'] };
        }
      },
    });

    const routingItems = JSON.parse(response.content) as LLMRoutingItem[];

    // Validate slugs against pack
    const validSubtopicSlugs = new Set(pack.subtopics.map((s) => s.slug));
    const validContentSlugs = new Set(existingContent.map((c) => c.slug));

    for (const item of routingItems) {
      if (item.action === 'ignore') {
        result.ignored_events.push({
          title: item.event.title,
          reason: item.reasoning,
        });
        continue;
      }

      // Strip invalid slugs
      const validTargetSubtopics = item.target_subtopics.filter((s) =>
        validSubtopicSlugs.has(s),
      );
      const validTargetPages = item.target_pages.filter((s) =>
        validContentSlugs.has(s),
      );

      if (validTargetSubtopics.length === 0 && validTargetPages.length === 0) {
        result.ignored_events.push({
          title: item.event.title,
          reason: `No valid target slugs after validation (original: ${item.target_subtopics.join(', ')})`,
        });
        continue;
      }

      // Calculate timeliness_hours
      const detectedAt = new Date(item.event.detected_at).getTime();
      const now = Date.now();
      const timelinessHours = Math.round((now - detectedAt) / (1000 * 60 * 60));

      result.routings.push({
        event: item.event,
        target_subtopics: validTargetSubtopics,
        target_pages: validTargetPages,
        action: item.action,
        reasoning: item.reasoning,
        timeliness_hours: timelinessHours,
      });
    }
  }

  return result;
}

// ── Step 4: Generate Queue Drafts ──

export function generateQueueDrafts(
  routings: EventRouting[],
  topicSlug: string,
  pack: SubtopicPack,
  opts: Pick<FreshnessOptions, 'dryRun'>,
): QueueDraft {
  const drafts: QueueDraftItem[] = [];
  const db = getDb();

  // Track same-subtopic merges within this run
  const subtopicDraftMap = new Map<string, QueueDraftItem>();

  for (const routing of routings) {
    const needsRefresh =
      routing.action === 'refresh' || routing.action === 'refresh_and_create';
    const needsCreate =
      routing.action === 'create' || routing.action === 'refresh_and_create';

    // Generate refresh drafts
    if (needsRefresh) {
      for (const pageSlug of routing.target_pages) {
        // Dedup: check recent content (7 days)
        const recentContent = db
          .prepare(
            `SELECT 1 FROM content
             WHERE slug = ? AND updated_at > datetime('now', '-7 days')
             LIMIT 1`,
          )
          .get(pageSlug);
        if (recentContent) {
          continue; // Skip — content was recently updated
        }

        const draft: QueueDraftItem = {
          action: 'refresh',
          subtopic_slug: routing.target_subtopics[0] || topicSlug,
          suggested_primary_keyword: pageSlug.replace(/-/g, ' '),
          content_type: 'refresh',
          research_pipeline: 'standard',
          priority_hint:
            routing.timeliness_hours < 12
              ? 'high'
              : routing.timeliness_hours < 48
                ? 'medium'
                : 'low',
          reasoning: routing.reasoning,
          source: 'freshness',
          existing_content_slug: pageSlug,
          refresh_meta: {
            trigger: routing.event.title,
            suggested_changes: routing.reasoning,
          },
        };

        drafts.push(draft);
      }
    }

    // Generate create drafts
    if (needsCreate) {
      for (const subtopicSlug of routing.target_subtopics) {
        const subtopic = pack.subtopics.find((s) => s.slug === subtopicSlug);
        const contentType = 'blog'; // Default; will be overridden below if LLM suggested one
        const suggestedKeyword = subtopic
          ? `${subtopic.name.toLowerCase()} ${pack.topic_name.toLowerCase()}`
          : subtopicSlug.replace(/-/g, ' ');

        const draft: QueueDraftItem = {
          action: 'create',
          subtopic_slug: subtopicSlug,
          suggested_primary_keyword: suggestedKeyword,
          content_type: contentType,
          research_pipeline: 'standard',
          priority_hint:
            routing.timeliness_hours < 12
              ? 'high'
              : routing.timeliness_hours < 48
                ? 'medium'
                : 'low',
          reasoning: routing.reasoning,
          source: 'freshness',
          seed_keywords: subtopic?.seed_keywords?.slice(0, 5),
        };

        // Merge same-subtopic drafts within this run
        const mergeKey = `${subtopicSlug}:create`;
        const existing = subtopicDraftMap.get(mergeKey);
        if (existing) {
          // Merge: combine reasoning, keep highest priority
          existing.reasoning += ` | ${draft.reasoning}`;
          if (
            draft.priority_hint === 'high' &&
            existing.priority_hint !== 'high'
          ) {
            existing.priority_hint = 'high';
          }
          continue; // Skip adding duplicate
        }

        subtopicDraftMap.set(mergeKey, draft);
        drafts.push(draft);
      }
    }
  }

  // Dedup against existing create_queue
  const dedupedDrafts: QueueDraftItem[] = [];
  for (const draft of drafts) {
    if (opts.dryRun) {
      dedupedDrafts.push(draft);
      continue;
    }

    const isDup = isDuplicateQueueJob(
      null,
      draft.suggested_primary_keyword,
      draft.content_type,
    );
    if (!isDup) {
      dedupedDrafts.push(draft);
    }
  }

  return { topic_slug: topicSlug, drafts: dedupedDrafts };
}

// ── Step 5: Write Queue Drafts ──

export function writeQueueDrafts(
  queueDraft: QueueDraft,
  opts: Pick<FreshnessOptions, 'dryRun'>,
): number {
  if (opts.dryRun || queueDraft.drafts.length === 0) return 0;

  const db = getDb();
  let written = 0;

  for (const draft of queueDraft.drafts) {
    if (draft.action === 'create' && draft.seed_keywords?.length) {
      // Seed keywords if needed
      for (const kw of draft.seed_keywords) {
        upsertKeyword(kw, 'flagship_freshness', draft.subtopic_slug);
      }
    }

    // Find or create keyword_group_id
    let keywordGroupId: number | null = null;
    const existingGroup = db
      .prepare(
        `SELECT group_id FROM keyword_groups
         WHERE primary_keyword = ? AND content_type = ?
         LIMIT 1`,
      )
      .get(draft.suggested_primary_keyword, draft.content_type) as
      | { group_id: number }
      | undefined;

    if (existingGroup) {
      keywordGroupId = existingGroup.group_id;
    } else {
      // Create a keyword group for this draft
      const result = db
        .prepare(
          `INSERT INTO keyword_groups (primary_keyword, intent, content_type, priority_score, status, cluster_slug)
           VALUES (?, 'informational', ?, ?, 'pending', ?)`,
        )
        .run(
          draft.suggested_primary_keyword,
          draft.content_type,
          draft.priority_hint === 'high'
            ? 80
            : draft.priority_hint === 'medium'
              ? 50
              : 30,
          draft.subtopic_slug,
        );
      keywordGroupId = Number(result.lastInsertRowid);
    }

    // Write to create_queue
    db.prepare(
      `INSERT INTO create_queue (keyword_group_id, content_type, research_pipeline, priority_score, status, refresh_meta, source)
       VALUES (?, ?, ?, ?, 'pending', ?, 'flagship_freshness')`,
    ).run(
      keywordGroupId,
      draft.content_type,
      draft.research_pipeline,
      draft.priority_hint === 'high'
        ? 80
        : draft.priority_hint === 'medium'
          ? 50
          : 30,
      draft.refresh_meta ? JSON.stringify(draft.refresh_meta) : null,
    );

    written++;
  }

  return written;
}

// ── Orchestrator ──

export async function runFreshnessMode(
  topic: FlagshipTopic,
  opts: FreshnessOptions,
): Promise<FreshnessRunResult> {
  console.log(`\n🔄 Flagship Freshness — ${topic.name}`);
  console.log('══════════════════════════════════════════');

  const result: FreshnessRunResult = {
    topicSlug: topic.slug,
    signalsFound: 0,
    signalsFiltered: 0,
    routingsCreated: 0,
    draftsWritten: 0,
    ignored: 0,
    skippedDedup: 0,
  };

  // Step 1: Load approved pack
  const pack = loadPack(topic.slug);
  if (!pack) {
    console.log(`  No pack found for ${topic.slug} — skipping`);
    return result;
  }
  if (pack.status !== 'approved') {
    console.log(
      `  Pack for ${topic.slug} is ${pack.status} (not approved) — skipping`,
    );
    return result;
  }
  console.log(
    `  Pack: v${pack.version} (${pack.subtopics.length} subtopics)`,
  );

  // Step 2: Load fresh signals
  const signals = loadFreshSignals(topic.slug, pack, opts.hours);
  result.signalsFound = signals.length;
  console.log(`  Fresh signals: ${signals.length} (last ${opts.hours}h)`);

  if (signals.length === 0) {
    console.log('  No relevant signals — done\n');
    return result;
  }

  // Step 2.5: Flagship topic relevance pre-filter
  const filteredSignals = await filterSignalsByFlagship(signals, pack, topic.name, opts);
  result.signalsFiltered = filteredSignals.length;
  console.log(`  After flagship filter: ${filteredSignals.length}/${signals.length}`);

  if (filteredSignals.length === 0) {
    console.log('  No relevant signals after filtering — done\n');
    return result;
  }

  // Step 3: Load existing content
  const existingContent = loadExistingContent(topic.slug, pack);
  console.log(`  Existing content: ${existingContent.length} pages`);

  // Step 4: Route events to subtopics
  console.log('  Routing events...');
  const routingResult = await routeEventsToSubtopics(
    filteredSignals,
    pack,
    existingContent,
    opts,
  );
  result.routingsCreated = routingResult.routings.length;
  result.ignored = routingResult.ignored_events.length;
  console.log(
    `  Routings: ${routingResult.routings.length} actionable, ${routingResult.ignored_events.length} ignored`,
  );

  // Step 5: Generate queue drafts
  const queueDraft = generateQueueDrafts(
    routingResult.routings,
    topic.slug,
    pack,
    opts,
  );
  const beforeDedup = queueDraft.drafts.length;
  console.log(`  Queue drafts: ${queueDraft.drafts.length}`);

  // Step 6: Write queue drafts
  const written = writeQueueDrafts(queueDraft, opts);
  result.draftsWritten = written;
  result.skippedDedup = beforeDedup - written;

  if (opts.dryRun) {
    console.log(`  [dry-run] Would write ${queueDraft.drafts.length} drafts`);
    for (const d of queueDraft.drafts) {
      console.log(
        `    ${d.action} ${d.subtopic_slug} — ${d.suggested_primary_keyword}`,
      );
    }
  } else {
    console.log(
      `  Written: ${written} drafts (${result.skippedDedup} deduped)`,
    );
  }

  // Summary
  if (routingResult.routings.length > 0) {
    console.log('\n  Routing summary:');
    for (const r of routingResult.routings) {
      console.log(
        `    ${r.action} → ${r.target_subtopics.join(', ')} | ${r.event.title.slice(0, 60)}`,
      );
    }
  }

  console.log('');
  return result;
}
