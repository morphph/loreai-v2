/**
 * B1 — Keyword Expansion Core Logic
 *
 * Expands subtopics into full keyword universes using Serper (PAA/related/autocomplete)
 * and Exa (competitor scan). Writes results to the keywords table.
 *
 * @see docs/plans/specs/SPEC-B1-keyword-expansion.md
 */

import { searchFull, searchAutocomplete, estimateVolume } from './serper';
import { semanticSearch } from './exa';
import { getDb, upsertKeyword } from './db';

import type { SerperSearchResponse } from './serper';
import type { ExaSearchResult } from './exa';

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
    'serper-related': string[];
    'serper-autocomplete': string[];
    'exa-competitor': string[];
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
  exa_api_calls: number;
}

export interface ExpandOptions {
  delayMs: number;
  skipExa: boolean;
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

// ── Competitor Keyword Extraction ──

/**
 * Known CTA / navigation patterns that are not real search queries.
 */
const NOISE_PATTERNS = /^(get started|sign up|learn more|read more|subscribe|join|log ?in|download|about this|about us|connect on|contact us|table of contents|related posts|see also|next steps|further reading|share this|leave a comment|comments|acknowledgements?|references|disclaimer|privacy policy|terms of service)/i;

/**
 * Strip trailing ` | SiteName` or ` - SiteName` suffixes from page titles.
 */
function stripSiteSuffix(title: string): string {
  return title.replace(/\s*[|\-–—]\s*[^|\-–—]+$/, '').trim();
}

/**
 * Check if a string looks like a real keyword (not pure CTA/nav noise).
 */
function isKeywordNoise(text: string): boolean {
  const words = text.split(/\s+/);
  // Too short (<3 words) or too long (>12 words) — unlikely a search query
  if (words.length < 3 || words.length > 12) return true;
  // Matches known CTA/nav patterns
  if (NOISE_PATTERNS.test(text)) return true;
  // Ends with punctuation typical of CTAs, not queries
  if (/[.!]$/.test(text)) return true;
  return false;
}

/**
 * Extract keywords from Exa competitor page results.
 * Filters out page titles that are CTAs, navigation, or site-suffixed noise.
 */
export function extractCompetitorKeywords(
  results: ExaSearchResult[],
): string[] {
  const keywords: string[] = [];

  for (const r of results) {
    if (r.title) {
      const cleaned = stripSiteSuffix(r.title);
      if (cleaned && !isKeywordNoise(cleaned)) {
        keywords.push(cleaned);
      }
    }

    if (r.text) {
      const headings = r.text.match(/^#{2,3}\s+(.+)$/gm) ?? [];
      for (const h of headings) {
        const clean = h.replace(/^#{2,3}\s+/, '').trim();
        if (clean.length > 5 && clean.length < 100 && !isKeywordNoise(clean)) {
          keywords.push(clean);
        }
      }
    }
  }

  return keywords;
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
      'serper-related': [],
      'serper-autocomplete': [],
      'exa-competitor': [],
    },
    total_raw: 0,
    total_new: 0,
    volume_scored: 0,
  };

  // Track API calls
  let serperCalls = 0;
  let exaCalls = 0;

  // ── Step 1+2: Serper PAA + Related (single API call) ──
  try {
    const { paa, related } = await expandViaSerperSearch(
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

    for (const q of related) {
      const norm = normalizeKeyword(q);
      if (norm && !seen.has(norm)) {
        seen.add(norm);
        result.keywords_by_source['serper-related'].push(norm);
      }
    }
  } catch (err) {
    console.warn(
      `  ⚠ Serper search failed for "${subtopic.pillar_topic}":`,
      err instanceof Error ? err.message : err,
    );
  }

  await delay(opts.delayMs);

  // ── Step 3: Serper Autocomplete ──
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

  // ── Step 4: Exa Competitor Scan ──
  if (!opts.skipExa) {
    try {
      const competitors = await semanticSearch(subtopic.pillar_topic, {
        numResults: 10,
        contents: { text: { maxCharacters: 3000 } },
        excludeDomains: ['loreai.dev'],
      });
      exaCalls++;

      const competitorKeywords = extractCompetitorKeywords(
        competitors.results,
      );
      for (const kw of competitorKeywords) {
        const norm = normalizeKeyword(kw);
        if (norm && !seen.has(norm)) {
          seen.add(norm);
          result.keywords_by_source['exa-competitor'].push(norm);
        }
      }
    } catch (err) {
      console.warn(
        `  ⚠ Exa competitor scan failed for "${subtopic.pillar_topic}":`,
        err instanceof Error ? err.message : err,
      );
    }

    await delay(opts.delayMs);
  }

  // ── Compute raw total ──
  result.total_raw =
    result.keywords_by_source['serper-paa'].length +
    result.keywords_by_source['serper-related'].length +
    result.keywords_by_source['serper-autocomplete'].length +
    result.keywords_by_source['exa-competitor'].length;

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
    // Prioritize PAA and related keywords (more likely to be real search queries)
    const prioritized = [
      ...result.keywords_by_source['serper-paa'],
      ...result.keywords_by_source['serper-related'],
      ...result.keywords_by_source['serper-autocomplete'],
      ...result.keywords_by_source['exa-competitor'],
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
  const db = getDb();

  // Load subtopics from DB
  let subtopics: SubtopicInput[];

  if (subtopicSlugs && subtopicSlugs.length > 0) {
    // Load only specified subtopics
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
    // Load all subtopics for the topic
    subtopics = db
      .prepare(
        `SELECT slug, pillar_topic FROM topic_clusters
         WHERE slug LIKE ? OR slug = ?
         ORDER BY mention_count DESC`,
      )
      .all(`${topicSlug}-%`, topicSlug) as SubtopicInput[];
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
    exa_api_calls: 0,
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
      `    serper-related:      ${stResult.keywords_by_source['serper-related'].length} keywords`,
    );
    console.log(
      `    serper-autocomplete: ${stResult.keywords_by_source['serper-autocomplete'].length} keywords`,
    );
    console.log(
      `    exa-competitor:      ${stResult.keywords_by_source['exa-competitor'].length} keywords`,
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
  runResult.exa_api_calls = opts.skipExa ? 0 : subtopics.length;

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
