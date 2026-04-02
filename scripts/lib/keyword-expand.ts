/**
 * B1 — Keyword Expansion Core Logic
 *
 * Expands subtopics into full keyword universes using Serper (PAA/autocomplete).
 * Restricted to flagship topics only.
 *
 * @see docs/plans/specs/SPEC-B1-keyword-expansion.md
 */

import { searchFull, searchAutocomplete, estimateVolume } from './serper';
import { getDb, upsertKeyword, resolveSubtopics } from './db';
import { FLAGSHIP_TOPICS } from './flagship-topics';

import type { SerperSearchResponse } from './serper';

// ── Types ──

export interface SubtopicInput {
  slug: string; // e.g. "claude-code-pricing"
  pillar_topic: string; // e.g. "Claude Code Pricing"
}

export interface SubtopicExpansionResult {
  slug: string;
  pillar_topic: string;
  keywords_by_source: {
    'serper-paa': string[];
    'serper-autocomplete': string[];
  };
  total_raw: number;
  total_new: number;
  volume_scored: number;
}

export interface ExpansionRunResult {
  topic: string;
  subtopics_processed: number;
  subtopic_results: SubtopicExpansionResult[];
  total_keywords_discovered: number;
  total_new_keywords: number;
  total_volume_scored: number;
  serper_api_calls: number;
}

export interface ExpandOptions {
  delayMs: number;
  maxVolumeCallsPerSubtopic: number;
  dryRun: boolean;
}

// ── Volume mapping ──

const VOLUME_MAP: Record<string, number> = {
  high: 10_000,
  medium: 1_000,
  low: 100,
  very_low: 10,
};

// ── Keyword Normalization ──

/**
 * Normalize a raw keyword string. Returns null if invalid.
 */
export function normalizeKeyword(raw: string): string | null {
  const kw = raw
    // Strip zero-width characters early
    .replace(/[\u200B\u200C\u200D\uFEFF]/g, '')
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/[\u201C\u201D\u2018\u2019""'']/g, '')
    .replace(/\?$/, '');

  if (kw.length < 3 || kw.length > 150) return null;
  if (/^https?:\/\//.test(kw)) return null;
  if (kw.split(' ').length > 15) return null;

  return kw;
}

// ── Keyword Noise Filtering ──

/**
 * Known CTA / navigation patterns that are not real search queries.
 */
const NOISE_PATTERNS = /^(get started|sign up|learn more|read more|subscribe|join|log ?in|download|about this|about us|connect on|contact us|table of contents|related posts|see also|next steps|further reading|share this|leave a comment|comments|acknowledgements?|references|disclaimer|privacy policy|terms of service|install|native install|data collection|make better|about this course|see pricing|view pricing|click here|step \d|how to install)/i;

/**
 * Trailing noise patterns (UI elements, not queries).
 */
const TRAILING_NOISE = /\(recommended\)$/i;

/**
 * Known short words that can legitimately end a keyword phrase.
 */
const KNOWN_SHORT_WORDS = new Set(['a', 'i', 'ai', 'an', 'be', 'by', 'do', 'go', 'if', 'in', 'is', 'it', 'no', 'of', 'on', 'or', 'so', 'to', 'up', 'us', 'vs', 'we']);

/**
 * Filter reason tags for debugging which filter caught a keyword.
 */
export type NoiseFilterReason =
  | 'too-short'
  | 'too-long'
  | 'cta-pattern'
  | 'trailing-noise'
  | 'sentence-punctuation'
  | 'numbered-prefix'
  | 'site-suffix-remnant'
  | 'year-in-parens'
  | 'subtitle-pattern'
  | 'truncated-text'
  | 'self-domain'
  | 'markdown-artifact'
  | null;

/**
 * Check if a string looks like a real keyword (not pure CTA/nav noise).
 * Returns true if the text is noise (should be rejected).
 */
export function isKeywordNoise(text: string): boolean {
  return getNoiseReason(text) !== null;
}

/**
 * Returns the reason a keyword is noise, or null if it's clean.
 * Exported for use by the backfill cleanup script.
 */
export function getNoiseReason(text: string): NoiseFilterReason {
  const words = text.split(/\s+/);

  // Too short (<3 words) or too long (>8 words) — unlikely a search query
  if (words.length < 3) return 'too-short';
  if (words.length > 8) return 'too-long';

  // Matches known CTA/nav patterns
  if (NOISE_PATTERNS.test(text)) return 'cta-pattern';

  // Trailing noise patterns (UI elements)
  if (TRAILING_NOISE.test(text)) return 'trailing-noise';

  // Ends with punctuation typical of sentences/CTAs, not queries
  // Also catch `...`, `…`, `—`, `–`
  if (/[.!]$/.test(text)) return 'sentence-punctuation';
  if (/[…—–]$/.test(text)) return 'sentence-punctuation';
  if (/\.{3}$/.test(text)) return 'sentence-punctuation';

  // Numbered prefixes — article/list patterns, not search queries
  if (/^\d+[.)]\s/.test(text)) return 'numbered-prefix';

  // Site suffix remnants — mid-string pipes or backslashes
  if (/[|\\]/.test(text)) return 'site-suffix-remnant';

  // Year markers in parentheses — article title patterns
  if (/\(20[2-3]\d\)/.test(text)) return 'year-in-parens';

  // Subtitle patterns — colon with >5 words after it
  const colonIdx = text.indexOf(':');
  if (colonIdx !== -1) {
    const afterColon = text.slice(colonIdx + 1).trim();
    if (afterColon.split(/\s+/).filter(Boolean).length > 5) return 'subtitle-pattern';
  }

  // Truncated text — last word is 1-2 chars and not a known short word,
  // or string ends with ellipsis/dash
  const lastWord = words[words.length - 1];
  if (lastWord.length <= 2 && !KNOWN_SHORT_WORDS.has(lastWord.toLowerCase())) {
    return 'truncated-text';
  }

  // Self-domain filter — our own content shouldn't be keywords
  if (/loreai|morph/i.test(text)) return 'self-domain';

  // Markdown artifacts
  if (/\*\*|__|]\(|\[/.test(text)) return 'markdown-artifact';

  return null;
}

/**
 * Check if a raw (pre-normalization) string looks like a Title Case article headline.
 * Returns true if >60% of words are capitalized → likely an article title, not a query.
 */
export function isTitleCase(raw: string): boolean {
  const words = raw.trim().split(/\s+/).filter(w => w.length > 0);
  if (words.length < 4) return false; // too few words to judge
  const capitalizedCount = words.filter(w => /^[A-Z]/.test(w)).length;
  return capitalizedCount / words.length > 0.6;
}

// ── Serper Search Optimization ──

/**
 * Single Serper /search call returning both PAA questions and related searches.
 * Saves 1 API credit per subtopic vs separate searchPAA + searchRelated calls.
 */
export async function expandViaSerperSearch(
  query: string,
  opts?: { gl?: string; hl?: string },
): Promise<{ paa: string[]; related: string[] }> {
  const data: SerperSearchResponse = await searchFull(query, opts);
  return {
    paa: (data.peopleAlsoAsk ?? []).map((item) => item.question),
    related: (data.relatedSearches ?? []).map((item) => item.query),
  };
}

// ── Core Expansion Logic ──

/**
 * Expand keywords for a single subtopic.
 */
export async function expandSubtopic(
  subtopic: SubtopicInput,
  opts: ExpandOptions,
): Promise<SubtopicExpansionResult> {
  const seen = new Set<string>();
  const result: SubtopicExpansionResult = {
    slug: subtopic.slug,
    pillar_topic: subtopic.pillar_topic,
    keywords_by_source: {
      'serper-paa': [],
      'serper-autocomplete': [],
    },
    total_raw: 0,
    total_new: 0,
    volume_scored: 0,
  };

  // Track API calls
  let serperCalls = 0;

  // ── Step 1: Serper PAA (from full search) ──
  try {
    const { paa } = await expandViaSerperSearch(
      subtopic.pillar_topic,
    );
    serperCalls++;

    for (const q of paa) {
      const norm = normalizeKeyword(q);
      if (norm && !seen.has(norm)) {
        seen.add(norm);
        result.keywords_by_source['serper-paa'].push(norm);
      }
    }
  } catch (err) {
    console.warn(
      `  ⚠ Serper search failed for "${subtopic.pillar_topic}":`,
      err instanceof Error ? err.message : err,
    );
  }

  await delay(opts.delayMs);

  // ── Step 2: Serper Autocomplete ──
  try {
    const ac = await searchAutocomplete(subtopic.pillar_topic);
    serperCalls++;

    for (const s of ac.suggestions) {
      const norm = normalizeKeyword(s);
      if (norm && !seen.has(norm)) {
        seen.add(norm);
        result.keywords_by_source['serper-autocomplete'].push(norm);
      }
    }
  } catch (err) {
    console.warn(
      `  ⚠ Serper autocomplete failed for "${subtopic.pillar_topic}":`,
      err instanceof Error ? err.message : err,
    );
  }

  await delay(opts.delayMs);

  // ── Compute raw total ──
  result.total_raw =
    result.keywords_by_source['serper-paa'].length +
    result.keywords_by_source['serper-autocomplete'].length;

  // ── DB Write ──
  if (!opts.dryRun) {
    // Load existing keywords to compute total_new
    const db = getDb();
    const existingRows = db
      .prepare('SELECT keyword FROM keywords')
      .all() as { keyword: string }[];
    const existingSet = new Set(existingRows.map((r) => r.keyword));

    let newCount = 0;
    const allKeywords = collectAllKeywords(result);

    for (const { text, source } of allKeywords) {
      if (!existingSet.has(text)) {
        newCount++;
        existingSet.add(text); // track within this run
      }
      upsertKeyword(text, source, subtopic.slug);
    }

    result.total_new = newCount;

    // ── Volume Pre-scoring ──
    // Prioritize PAA keywords (more likely to be real search queries)
    const prioritized = [
      ...result.keywords_by_source['serper-paa'],
      ...result.keywords_by_source['serper-autocomplete'],
    ];

    // Only score keywords that don't have volume yet
    const unscoredRows = db
      .prepare(
        `SELECT keyword FROM keywords WHERE search_volume IS NULL AND keyword IN (${prioritized.map(() => '?').join(',')})`,
      )
      .all(...prioritized) as { keyword: string }[];
    const unscored = unscoredRows.map((r) => r.keyword);

    const toScore = unscored.slice(0, opts.maxVolumeCallsPerSubtopic);
    for (const kw of toScore) {
      try {
        const vol = await estimateVolume(kw);
        serperCalls++;
        const numericVolume = VOLUME_MAP[vol.estimated_volume] ?? 10;
        db.prepare(
          'UPDATE keywords SET search_volume = ?, competition = ? WHERE keyword = ?',
        ).run(numericVolume, vol.estimated_volume, kw);
        result.volume_scored++;
        await delay(opts.delayMs);
      } catch (err) {
        console.warn(
          `  ⚠ Volume estimation failed for "${kw}":`,
          err instanceof Error ? err.message : err,
        );
      }
    }
  } else {
    // Dry run: total_new = total_raw (all would be new since we can't check DB)
    result.total_new = result.total_raw;
  }

  return result;
}

/**
 * Expand keywords for all subtopics of a flagship topic.
 */
export async function expandTopic(
  topicSlug: string,
  subtopicSlugs: string[] | null,
  opts: ExpandOptions,
): Promise<ExpansionRunResult> {
  // Flagship guard — only expand keywords for known flagship topics
  const isFlagship = FLAGSHIP_TOPICS.some(t => t.slug === topicSlug);
  if (!isFlagship) {
    throw new Error(`Keyword expansion restricted to flagship topics: ${FLAGSHIP_TOPICS.map(t => t.slug).join(', ')}`);
  }

  const db = getDb();

  // Load subtopics via resolveSubtopics() (flagship-aware, single entry point)
  let subtopics: SubtopicInput[];

  if (subtopicSlugs && subtopicSlugs.length > 0) {
    // Load only specified subtopics by slug
    const placeholders = subtopicSlugs.map(() => '?').join(',');
    subtopics = db
      .prepare(
        `SELECT slug, pillar_topic FROM topic_clusters WHERE slug IN (${placeholders})`,
      )
      .all(...subtopicSlugs) as SubtopicInput[];

    // Warn about missing subtopics
    const foundSlugs = new Set(subtopics.map((s) => s.slug));
    for (const s of subtopicSlugs) {
      if (!foundSlugs.has(s)) {
        console.warn(`  ⚠ Subtopic "${s}" not found in DB — skipping`);
      }
    }
  } else {
    // Load all subtopics for the topic (flagship-aware)
    subtopics = resolveSubtopics(topicSlug).map((r) => ({
      slug: r.slug,
      pillar_topic: r.pillar_topic,
    }));
  }

  if (subtopics.length === 0) {
    throw new Error(
      `No subtopics found for topic "${topicSlug}". Make sure the topic exists in topic_clusters.`,
    );
  }

  const runResult: ExpansionRunResult = {
    topic: topicSlug,
    subtopics_processed: 0,
    subtopic_results: [],
    total_keywords_discovered: 0,
    total_new_keywords: 0,
    total_volume_scored: 0,
    serper_api_calls: 0,
  };

  for (let i = 0; i < subtopics.length; i++) {
    const st = subtopics[i];
    console.log(
      `  [${i + 1}/${subtopics.length}] "${st.pillar_topic}" (${st.slug})`,
    );

    const stResult = await expandSubtopic(st, opts);
    runResult.subtopic_results.push(stResult);
    runResult.subtopics_processed++;
    runResult.total_keywords_discovered += stResult.total_raw;
    runResult.total_new_keywords += stResult.total_new;
    runResult.total_volume_scored += stResult.volume_scored;

    // Log per-subtopic stats
    console.log(
      `    serper-paa:          ${stResult.keywords_by_source['serper-paa'].length} keywords`,
    );
    console.log(
      `    serper-autocomplete: ${stResult.keywords_by_source['serper-autocomplete'].length} keywords`,
    );
    if (stResult.volume_scored > 0) {
      console.log(
        `    volume-scored:       ${stResult.volume_scored} keywords`,
      );
    }
    console.log(`    total new:           ${stResult.total_new} keywords`);
  }

  // Estimate API calls (1 searchFull + 1 autocomplete per subtopic, + volume calls)
  runResult.serper_api_calls =
    subtopics.length * 2 + runResult.total_volume_scored;

  return runResult;
}

// ── Helpers ──

function collectAllKeywords(
  result: SubtopicExpansionResult,
): Array<{ text: string; source: string }> {
  const all: Array<{ text: string; source: string }> = [];
  for (const [source, keywords] of Object.entries(
    result.keywords_by_source,
  )) {
    for (const kw of keywords) {
      all.push({ text: kw, source });
    }
  }
  return all;
}

async function delay(ms: number): Promise<void> {
  if (ms > 0) await new Promise((r) => setTimeout(r, ms));
}
