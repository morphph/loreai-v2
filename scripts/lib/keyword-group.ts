/**
 * B2 — Keyword Grouping Core Logic
 *
 * Groups raw keywords by shared search intent using Claude.
 * Reads ungrouped keywords from DB, calls Claude with keyword-grouping skill,
 * validates response, and writes keyword_groups + updates keywords.
 *
 * @see docs/plans/specs/SPEC-B2-keyword-grouping.md
 */

import Anthropic from '@anthropic-ai/sdk';
import fs from 'fs';
import path from 'path';
import { getDb } from './db';

// ── Types ──

export interface KeywordInput {
  id: number;
  keyword: string;
  source: string;
  search_volume: number | null;
  competition: string | null;
}

export interface KeywordGroup {
  primary_keyword: string;
  secondary_keywords: string[];
  intent: 'informational' | 'commercial' | 'definitional' | 'navigational';
  content_type: 'faq' | 'compare' | 'glossary' | 'blog' | 'topic-hub';
  rationale: string;
}

export interface ClaudeGroupOutput {
  groups: KeywordGroup[];
  ungrouped: string[];
}

export interface GroupOptions {
  model: 'haiku' | 'sonnet';
  dryRun: boolean;
  force: boolean;
}

export interface GroupSummary {
  group_id: number;
  primary_keyword: string;
  keyword_count: number;
  intent: string;
  content_type: string;
}

export interface ClusterGroupingResult {
  cluster_slug: string;
  pillar_topic: string;
  total_keywords: number;
  groups_created: number;
  ungrouped_count: number;
  groups: GroupSummary[];
}

export interface GroupingRunResult {
  clusters_processed: number;
  total_keywords_grouped: number;
  total_groups_created: number;
  total_ungrouped: number;
  cluster_results: ClusterGroupingResult[];
  claude_api_calls: number;
}

// ── Constants ──

const VALID_INTENTS = ['informational', 'commercial', 'definitional', 'navigational'] as const;
const VALID_CONTENT_TYPES = ['faq', 'compare', 'glossary', 'blog', 'topic-hub'] as const;
const BATCH_SIZE = 300;

const MODEL_MAP: Record<string, string> = {
  haiku: 'claude-haiku-4-5-20251001',
  sonnet: 'claude-sonnet-4-5-20250514',
};

// ── Load Skill ──

let _skillCache: string | null = null;

function loadSkill(): string {
  if (_skillCache) return _skillCache;
  const skillPath = path.resolve(process.cwd(), 'skills/keyword-grouping/SKILL.md');
  _skillCache = fs.readFileSync(skillPath, 'utf-8');
  return _skillCache;
}

/** Exposed for testing — override skill content */
export function setSkillContent(content: string): void {
  _skillCache = content;
}

// ── Core Functions ──

/**
 * Load ungrouped keywords for a cluster from DB.
 */
export function loadUngroupedKeywords(
  clusterSlug: string,
  force: boolean,
): KeywordInput[] {
  const db = getDb();

  if (force) {
    return db.prepare(`
      SELECT id, keyword, source, search_volume, competition
      FROM keywords
      WHERE cluster_slug = ?
      ORDER BY
        CASE WHEN search_volume IS NOT NULL THEN 0 ELSE 1 END,
        search_volume DESC
    `).all(clusterSlug) as KeywordInput[];
  }

  return db.prepare(`
    SELECT id, keyword, source, search_volume, competition
    FROM keywords
    WHERE cluster_slug = ?
      AND keyword_group_id IS NULL
    ORDER BY
      CASE WHEN search_volume IS NOT NULL THEN 0 ELSE 1 END,
      search_volume DESC
  `).all(clusterSlug) as KeywordInput[];
}

/**
 * Build the user prompt for Claude.
 */
export function buildPrompt(
  clusterSlug: string,
  pillarTopic: string,
  keywords: KeywordInput[],
): string {
  const keywordLines = keywords.map((kw) => {
    const parts = [kw.keyword];
    if (kw.search_volume) parts.push(`[vol: ${kw.search_volume}]`);
    if (kw.source) parts.push(`[src: ${kw.source}]`);
    if (kw.competition) parts.push(`[comp: ${kw.competition}]`);
    return `- ${parts.join(' ')}`;
  });

  return [
    `## Subtopic: ${pillarTopic}`,
    `Cluster: ${clusterSlug}`,
    `Total keywords: ${keywords.length}`,
    '',
    '## Keywords',
    '',
    ...keywordLines,
    '',
    'Group these keywords by shared search intent. Return JSON only.',
  ].join('\n');
}

/**
 * Parse and validate Claude's JSON response.
 * Throws on invalid schema. Warns on missing keywords.
 */
export function parseGroupingResponse(
  raw: string,
  inputKeywords: string[],
): ClaudeGroupOutput {
  // Strip markdown fences if present
  let cleaned = raw.trim();
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```(?:json)?\s*\n?/, '').replace(/\n?```\s*$/, '');
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    throw new Error(`ParseError: Claude response is not valid JSON`);
  }

  if (!parsed || typeof parsed !== 'object' || !('groups' in parsed)) {
    throw new Error(`ValidationError: Response missing 'groups' key`);
  }

  const data = parsed as { groups: unknown[]; ungrouped?: unknown[] };

  if (!Array.isArray(data.groups)) {
    throw new Error(`ValidationError: 'groups' is not an array`);
  }

  const ungrouped: string[] = Array.isArray(data.ungrouped)
    ? data.ungrouped.filter((u): u is string => typeof u === 'string')
    : [];

  const inputSet = new Set(inputKeywords);
  const assigned = new Set<string>();
  const groups: KeywordGroup[] = [];

  for (const g of data.groups) {
    const group = g as Record<string, unknown>;

    // Validate required fields
    if (typeof group.primary_keyword !== 'string') {
      throw new Error(`ValidationError: group missing 'primary_keyword'`);
    }

    if (!inputSet.has(group.primary_keyword)) {
      throw new Error(
        `ValidationError: primary_keyword "${group.primary_keyword}" not found in input keywords`,
      );
    }

    const intent = group.intent as string;
    if (!VALID_INTENTS.includes(intent as typeof VALID_INTENTS[number])) {
      throw new Error(
        `ValidationError: invalid intent "${intent}". Must be one of: ${VALID_INTENTS.join(', ')}`,
      );
    }

    const contentType = group.content_type as string;
    if (!VALID_CONTENT_TYPES.includes(contentType as typeof VALID_CONTENT_TYPES[number])) {
      throw new Error(
        `ValidationError: invalid content_type "${contentType}". Must be one of: ${VALID_CONTENT_TYPES.join(', ')}`,
      );
    }

    const secondaryKeywords = Array.isArray(group.secondary_keywords)
      ? (group.secondary_keywords as string[]).filter((s) => typeof s === 'string')
      : [];

    // Validate secondary keywords are from input
    for (const sk of secondaryKeywords) {
      if (!inputSet.has(sk)) {
        throw new Error(
          `ValidationError: secondary keyword "${sk}" not found in input keywords`,
        );
      }
    }

    // Handle duplicates: first occurrence wins
    const primaryKw = group.primary_keyword;
    if (assigned.has(primaryKw)) continue; // skip duplicate
    assigned.add(primaryKw);

    const dedupedSecondary = secondaryKeywords.filter((sk) => {
      if (assigned.has(sk)) return false;
      assigned.add(sk);
      return true;
    });

    groups.push({
      primary_keyword: primaryKw,
      secondary_keywords: dedupedSecondary,
      intent: intent as KeywordGroup['intent'],
      content_type: contentType as KeywordGroup['content_type'],
      rationale: typeof group.rationale === 'string' ? group.rationale : '',
    });
  }

  // Check for missing keywords (not in any group and not in ungrouped)
  const allAccountedFor = new Set([...assigned, ...ungrouped]);
  const missing = inputKeywords.filter((kw) => !allAccountedFor.has(kw));
  if (missing.length > 0) {
    console.warn(
      `  ⚠ ${missing.length} keywords not accounted for in Claude response: ${missing.slice(0, 5).join(', ')}${missing.length > 5 ? '...' : ''}`,
    );
  }

  return { groups, ungrouped };
}

/**
 * Call Claude API with the keyword grouping skill.
 */
export async function callClaude(
  keywords: KeywordInput[],
  clusterSlug: string,
  pillarTopic: string,
  opts: GroupOptions,
): Promise<ClaudeGroupOutput> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error('ANTHROPIC_API_KEY is not set');
  }

  const anthropic = new Anthropic({ apiKey });
  const skill = loadSkill();
  const modelId = MODEL_MAP[opts.model] || MODEL_MAP.haiku;
  const prompt = buildPrompt(clusterSlug, pillarTopic, keywords);

  const response = await anthropic.messages.create({
    model: modelId,
    max_tokens: 4096,
    system: skill,
    messages: [{ role: 'user', content: prompt }],
  });

  const textBlock = response.content.find((b) => b.type === 'text');
  if (!textBlock || textBlock.type !== 'text') {
    throw new Error('Claude returned no text response');
  }

  const inputKeywordList = keywords.map((kw) => kw.keyword);

  try {
    return parseGroupingResponse(textBlock.text, inputKeywordList);
  } catch (err) {
    // Retry once with a hint
    if (err instanceof Error && err.message.startsWith('ParseError')) {
      const retryResponse = await anthropic.messages.create({
        model: modelId,
        max_tokens: 4096,
        system: skill,
        messages: [
          { role: 'user', content: prompt },
          { role: 'assistant', content: textBlock.text },
          { role: 'user', content: 'Your response was not valid JSON. Please return ONLY valid JSON, no markdown fences or explanation.' },
        ],
      });

      const retryText = retryResponse.content.find((b) => b.type === 'text');
      if (!retryText || retryText.type !== 'text') {
        throw new Error('Claude retry returned no text response');
      }

      return parseGroupingResponse(retryText.text, inputKeywordList);
    }
    throw err;
  }
}

/**
 * Write grouping results to DB (keyword_groups + keywords).
 */
export function writeGroupingToDb(
  clusterSlug: string,
  result: ClaudeGroupOutput,
): { groups_created: number; keywords_assigned: number } {
  const db = getDb();
  let groupsCreated = 0;
  let keywordsAssigned = 0;

  const insertGroup = db.prepare(`
    INSERT INTO keyword_groups
      (primary_keyword, intent, content_type, priority_score, status, cluster_slug)
    VALUES (?, ?, ?, 0, 'pending', ?)
  `);

  const updateKeyword = db.prepare(`
    UPDATE keywords SET keyword_group_id = ?, intent = ?
    WHERE keyword = ?
  `);

  const tx = db.transaction(() => {
    for (const group of result.groups) {
      const res = insertGroup.run(
        group.primary_keyword,
        group.intent,
        group.content_type,
        clusterSlug,
      );
      const groupId = Number(res.lastInsertRowid);
      groupsCreated++;

      const allKeywords = [group.primary_keyword, ...group.secondary_keywords];
      for (const kw of allKeywords) {
        updateKeyword.run(groupId, group.intent, kw);
        keywordsAssigned++;
      }
    }
  });

  tx();

  return { groups_created: groupsCreated, keywords_assigned: keywordsAssigned };
}

/**
 * Clear existing groups for a cluster (for --force re-grouping).
 */
export function clearClusterGroups(clusterSlug: string): void {
  const db = getDb();

  db.prepare(`
    UPDATE keywords SET keyword_group_id = NULL, intent = NULL
    WHERE cluster_slug = ?
  `).run(clusterSlug);

  db.prepare(`
    DELETE FROM keyword_groups WHERE cluster_slug = ?
  `).run(clusterSlug);
}

/**
 * Group keywords for a single cluster.
 */
export async function groupCluster(
  clusterSlug: string,
  opts: GroupOptions,
): Promise<ClusterGroupingResult> {
  const db = getDb();

  // Look up pillar_topic
  const cluster = db.prepare(
    'SELECT pillar_topic FROM topic_clusters WHERE slug = ?',
  ).get(clusterSlug) as { pillar_topic: string } | undefined;

  if (!cluster) {
    throw new Error(`Cluster "${clusterSlug}" not found in topic_clusters`);
  }

  // Force: clear existing groups first
  if (opts.force) {
    clearClusterGroups(clusterSlug);
  }

  const keywords = loadUngroupedKeywords(clusterSlug, opts.force);

  const result: ClusterGroupingResult = {
    cluster_slug: clusterSlug,
    pillar_topic: cluster.pillar_topic,
    total_keywords: keywords.length,
    groups_created: 0,
    ungrouped_count: 0,
    groups: [],
  };

  if (keywords.length === 0) {
    return result;
  }

  if (keywords.length < 3) {
    console.warn(`  ⚠ Only ${keywords.length} keywords for "${clusterSlug}" — may produce minimal groups`);
  }

  // Batch if needed
  let claudeResult: ClaudeGroupOutput;

  if (keywords.length > 500) {
    const batches = chunk(keywords, BATCH_SIZE);
    const batchResults: ClaudeGroupOutput[] = [];

    for (const batch of batches) {
      const batchResult = await callClaude(batch, clusterSlug, cluster.pillar_topic, opts);
      batchResults.push(batchResult);
    }

    claudeResult = mergeGroupResults(batchResults);
  } else {
    // Auto-select model for large keyword sets
    const effectiveOpts = { ...opts };
    if (keywords.length > 200 && opts.model === 'haiku') {
      effectiveOpts.model = 'sonnet';
      console.log(`    Auto-upgrading to sonnet (${keywords.length} keywords > 200)`);
    }

    claudeResult = await callClaude(keywords, clusterSlug, cluster.pillar_topic, effectiveOpts);
  }

  result.ungrouped_count = claudeResult.ungrouped.length;

  // Write to DB (unless dry run)
  if (!opts.dryRun) {
    const writeResult = writeGroupingToDb(clusterSlug, claudeResult);
    result.groups_created = writeResult.groups_created;

    // Build group summaries with DB IDs
    const dbGroups = db.prepare(`
      SELECT group_id, primary_keyword, intent, content_type
      FROM keyword_groups
      WHERE cluster_slug = ?
      ORDER BY group_id DESC
      LIMIT ?
    `).all(clusterSlug, writeResult.groups_created) as Array<{
      group_id: number;
      primary_keyword: string;
      intent: string;
      content_type: string;
    }>;

    result.groups = dbGroups.map((g) => {
      const matchingGroup = claudeResult.groups.find(
        (cg) => cg.primary_keyword === g.primary_keyword,
      );
      return {
        group_id: g.group_id,
        primary_keyword: g.primary_keyword,
        keyword_count: matchingGroup
          ? 1 + matchingGroup.secondary_keywords.length
          : 1,
        intent: g.intent,
        content_type: g.content_type,
      };
    });
  } else {
    // Dry run: populate summaries without DB IDs
    result.groups_created = claudeResult.groups.length;
    result.groups = claudeResult.groups.map((g, i) => ({
      group_id: i + 1,
      primary_keyword: g.primary_keyword,
      keyword_count: 1 + g.secondary_keywords.length,
      intent: g.intent,
      content_type: g.content_type,
    }));
  }

  return result;
}

/**
 * Group keywords for all clusters under a topic.
 */
export async function groupTopic(
  topicSlug: string,
  opts: GroupOptions,
): Promise<GroupingRunResult> {
  const db = getDb();

  const clusters = db.prepare(`
    SELECT slug FROM topic_clusters
    WHERE slug LIKE ? OR slug = ?
    ORDER BY mention_count DESC
  `).all(`${topicSlug}-%`, topicSlug) as Array<{ slug: string }>;

  if (clusters.length === 0) {
    throw new Error(`No clusters found for topic "${topicSlug}"`);
  }

  const runResult: GroupingRunResult = {
    clusters_processed: 0,
    total_keywords_grouped: 0,
    total_groups_created: 0,
    total_ungrouped: 0,
    cluster_results: [],
    claude_api_calls: 0,
  };

  for (let i = 0; i < clusters.length; i++) {
    const slug = clusters[i].slug;
    console.log(`  [${i + 1}/${clusters.length}] "${slug}"`);

    try {
      const clusterResult = await groupCluster(slug, opts);
      runResult.cluster_results.push(clusterResult);
      runResult.clusters_processed++;
      runResult.total_groups_created += clusterResult.groups_created;
      runResult.total_ungrouped += clusterResult.ungrouped_count;

      const keywordsInGroups = clusterResult.groups.reduce(
        (sum, g) => sum + g.keyword_count,
        0,
      );
      runResult.total_keywords_grouped += keywordsInGroups;
      runResult.claude_api_calls++;
    } catch (err) {
      console.error(
        `  ✗ Failed to group "${slug}":`,
        err instanceof Error ? err.message : err,
      );
    }
  }

  return runResult;
}

// ── Helpers ──

function chunk<T>(arr: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < arr.length; i += size) {
    chunks.push(arr.slice(i, i + size));
  }
  return chunks;
}

function mergeGroupResults(batchResults: ClaudeGroupOutput[]): ClaudeGroupOutput {
  const mergedGroups: KeywordGroup[] = [];
  const mergedUngrouped: string[] = [];
  const seenPrimary = new Map<string, number>();

  for (const batch of batchResults) {
    for (const group of batch.groups) {
      const existingIdx = seenPrimary.get(group.primary_keyword);
      if (existingIdx !== undefined) {
        // Merge secondary keywords into existing group
        const existing = mergedGroups[existingIdx];
        const existingSecondary = new Set(existing.secondary_keywords);
        for (const sk of group.secondary_keywords) {
          if (!existingSecondary.has(sk)) {
            existing.secondary_keywords.push(sk);
          }
        }
      } else {
        seenPrimary.set(group.primary_keyword, mergedGroups.length);
        mergedGroups.push({ ...group });
      }
    }

    mergedUngrouped.push(...batch.ungrouped);
  }

  return { groups: mergedGroups, ungrouped: mergedUngrouped };
}
