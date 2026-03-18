/**
 * scripts/lib/discover.ts — External discovery engine for cluster planner
 *
 * Discovers candidate cluster nodes (compare pages, FAQ pages) by analyzing
 * Brave Search demand signals and competitor content structure.
 * Candidates are scored and deduplicated before being returned.
 */
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';
import 'dotenv/config';

import { braveSearch, fetchWithCache, truncateSource } from './source-fetch';
import { callClaude } from './ai';
import { getDb, upsertKeyword } from './db';
import { serperSearch } from './serper';
import { exaSearch, exaFindSimilar } from './exa';

// ============================================================
// Types
// ============================================================

export interface DiscoveryQuery {
  query: string;
  type: 'compare' | 'faq';
  signal: string;
}

export interface RawCandidate {
  type: 'compare' | 'faq';
  raw_text: string;
  extracted_name: string | null;
  source: string;
  source_url: string | null;
  gsc_impressions?: number;
}

export interface CandidateSignals {
  brave_result_count: number;
  related_search_hit: boolean;
  competitor_coverage: number;
  cluster_relevance: boolean;
  intent_clarity: boolean;
  freshness_bonus: boolean;
  paa_hit?: boolean;
  exa_similar_hit?: boolean;
}

export interface ScoredCandidate {
  slug: string;
  type: 'compare' | 'faq' | 'glossary';
  display_term: string;
  question: string | null;
  item_b: string | null;
  item_b_url: string | null;
  score: number;
  signals: CandidateSignals | Record<string, unknown>;
  source: string;
  source_url: string | null;
  discovered_at: string;
  status: 'pending' | 'low-signal' | 'approved' | 'dismissed';
}

interface BraveFullResult {
  web_results: Array<{ url: string; title: string }>;
  related_searches: string[];
  discussions: string[];
  result_count: number;
}

export interface FreshnessSignal {
  event_type: 'pricing-change' | 'new-feature' | 'version-release' | 'deprecation' | 'platform-change';
  description: string;
  source_url: string | null;
  detected_at: string;
}

export interface RefreshFlag {
  slug: string;
  page_type: string;
  severity: 'high' | 'medium' | 'low';
  affected_sections: string[];
  reason: string;
  signal_event: string;
  signal_description: string;
  flagged_at: string;
  status: 'pending' | 'refreshed' | 'cleared';
}

// Minimal cluster type for discovery (avoids importing from generate-seo.ts)
export interface ClusterForDiscovery {
  topic_slug: string;
  pillar_topic: string;
  official_domains?: string[];
  cornerstone: { slug: string };
  target_compare: Array<{
    slug: string;
    item_a?: string;
    item_b?: string;
    item_b_url?: string;
    priority?: number;
    status?: string;
  }>;
  target_faq: Array<{
    slug: string;
    question?: string;
    priority?: number;
    status?: string;
  }>;
  target_glossary: Array<{
    slug: string;
    display_term?: string;
    status?: string;
  }>;
  candidates?: Array<ScoredCandidate>;
  refresh_needed?: RefreshFlag[];
}

// ============================================================
// Brave Search with full signals
// ============================================================

async function braveSearchWithSignals(query: string): Promise<BraveFullResult> {
  const apiKey = process.env.BRAVE_SEARCH_API_KEY;
  if (!apiKey) {
    return { web_results: [], related_searches: [], discussions: [], result_count: 0 };
  }

  try {
    const url = `https://api.search.brave.com/res/v1/web/search?q=${encodeURIComponent(query)}&count=5`;
    const res = await fetch(url, {
      headers: {
        'X-Subscription-Token': apiKey,
        Accept: 'application/json',
      },
    });

    if (!res.ok) {
      console.warn(`    [discover] Brave Search error: ${res.status}`);
      return { web_results: [], related_searches: [], discussions: [], result_count: 0 };
    }

    const data = await res.json();
    return {
      web_results: (data.web?.results ?? []).map((r: { url: string; title: string }) => ({
        url: r.url,
        title: r.title,
      })),
      related_searches: (data.query?.related_searches ?? []).map((r: { query: string }) => r.query),
      discussions: (data.discussions?.results ?? []).map((d: { title: string }) => d.title),
      result_count: data.web?.results?.length ?? 0,
    };
  } catch (err) {
    console.warn(`    [discover] Brave Search failed: ${(err as Error).message}`);
    return { web_results: [], related_searches: [], discussions: [], result_count: 0 };
  }
}

// ============================================================
// Query building
// ============================================================

export function buildDiscoveryQueries(pillarTopic: string): DiscoveryQuery[] {
  return [
    // Compare discovery
    { query: `${pillarTopic} vs`, type: 'compare' as const, signal: 'vs-search' },
    { query: `${pillarTopic} alternatives`, type: 'compare' as const, signal: 'alternatives-search' },
    { query: `best ${pillarTopic} competitors`, type: 'compare' as const, signal: 'competitor-search' },
    // FAQ discovery
    { query: `${pillarTopic} how to`, type: 'faq' as const, signal: 'howto-search' },
    { query: `${pillarTopic} tutorial`, type: 'faq' as const, signal: 'tutorial-search' },
    { query: `is ${pillarTopic}`, type: 'faq' as const, signal: 'is-search' },
    { query: `${pillarTopic} pricing cost`, type: 'faq' as const, signal: 'pricing-search' },
    { query: `${pillarTopic} setup install`, type: 'faq' as const, signal: 'setup-search' },
  ];
}

// ============================================================
// Classification
// ============================================================

const QUESTION_WORDS = /^(how|what|why|when|can|is|does|should|will|where|which)\b/i;
const COMPARE_PATTERNS = /\b(vs|versus|compared to|comparison|or)\b/i;

export function classifyBraveResult(
  text: string,
  pillarTopic: string
): { type: 'compare' | 'faq'; extracted_name: string | null } | null {
  const lower = text.toLowerCase();
  const topicLower = pillarTopic.toLowerCase();

  // Must be relevant to the pillar topic
  if (!lower.includes(topicLower)) return null;

  // Check for compare signals
  if (COMPARE_PATTERNS.test(text)) {
    // Try to extract the "other" item from "X vs Y" patterns
    const vsMatch = lower.match(new RegExp(`${escapeRegex(topicLower)}\\s+(?:vs\\.?|versus|compared to|or)\\s+(.+)`, 'i'))
      || lower.match(new RegExp(`(.+?)\\s+(?:vs\\.?|versus|compared to|or)\\s+${escapeRegex(topicLower)}`, 'i'));

    const extracted = vsMatch ? cleanExtractedName(vsMatch[1]) : null;
    return { type: 'compare', extracted_name: extracted };
  }

  // Check for FAQ signals
  if (QUESTION_WORDS.test(text) || text.trim().endsWith('?')) {
    return { type: 'faq', extracted_name: null };
  }

  return null;
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function cleanExtractedName(raw: string): string {
  return raw
    .replace(/[?!.,;:]+$/, '')
    .replace(/\b(reddit|quora|review|comparison|guide|tutorial|2024|2025|2026)\b/gi, '')
    .trim()
    .split(/\s+/)
    .slice(0, 4) // max 4 words for a tool name
    .join(' ')
    .trim();
}

// ============================================================
// Competitor content audit (LLM-assisted)
// ============================================================

function loadPlannerSkill(name: string): string {
  const skillPath = join(process.cwd(), 'skills', 'planner', `${name}.md`);
  return readFileSync(skillPath, 'utf-8');
}

export async function auditCompetitorContent(
  pillarTopic: string,
  officialDomains: string[],
  ownDomain: string
): Promise<RawCandidate[]> {
  const candidates: RawCandidate[] = [];
  const excludeDomains = [ownDomain, ...officialDomains];

  // Primary path: Exa search with built-in content extraction
  const exaKey = process.env.EXA_API_KEY;
  if (exaKey) {
    console.log(`  [discover] Exa competitor audit for "${pillarTopic}"...`);

    const results = await exaSearch(`${pillarTopic} complete guide`, {
      numResults: 5,
      excludeDomains,
      contents: { highlights: { maxCharacters: 1000 } },
    });

    for (const r of results.results.slice(0, 3)) {
      const highlightText = (r.highlights || []).join('\n');
      if (highlightText.length < 100) continue;

      const extracted = await extractWithLLM(highlightText, pillarTopic, r.url);
      candidates.push(...extracted);
      await delay(1000);
    }

    console.log(`    [discover] Exa competitor audit found ${candidates.length} raw candidates`);
    return candidates;
  }

  // Fallback: existing Brave + fetchWithCache path
  console.log(`  [discover] Brave fallback competitor audit for "${pillarTopic}"...`);

  const results = await braveSearch(`${pillarTopic} complete guide`);

  const competitors = results.filter(r =>
    !r.url.includes(ownDomain) &&
    !officialDomains.some(d => r.url.includes(d))
  );

  if (competitors.length === 0) {
    console.log(`    [discover] No competitor pages found`);
    return [];
  }

  for (const r of competitors.slice(0, 3)) {
    const content = await fetchWithCache(r.url);
    if (!content || content.length < 200) continue;

    const extracted = await extractWithLLM(content, pillarTopic, r.url);
    candidates.push(...extracted);

    await delay(1000);
  }

  console.log(`    [discover] Competitor audit found ${candidates.length} raw candidates`);
  return candidates;
}

// ============================================================
// Stage 1: SERP Demand Signals (Serper.dev — replaces Brave Stage 1)
// ============================================================

function buildSerpQueries(pillarTopic: string): Array<{ query: string; focus: 'compare' | 'faq' }> {
  return [
    { query: `${pillarTopic} vs`, focus: 'compare' },
    { query: `${pillarTopic} alternatives`, focus: 'compare' },
    { query: `best ${pillarTopic} competitors`, focus: 'compare' },
    { query: `${pillarTopic} how to`, focus: 'faq' },
    { query: `is ${pillarTopic}`, focus: 'faq' },
    { query: `${pillarTopic} pricing cost`, focus: 'faq' },
    { query: `${pillarTopic} setup install`, focus: 'faq' },
  ];
}

async function extractSerpSignals(
  pillarTopic: string
): Promise<{ candidates: RawCandidate[]; competitorUrls: string[] }> {
  const candidates: RawCandidate[] = [];
  const competitorUrls: string[] = [];

  for (const q of buildSerpQueries(pillarTopic)) {
    const result = await serperSearch(q.query);

    // 1. People Also Ask → direct FAQ candidates
    for (const paa of result.peopleAlsoAsk) {
      const classified = classifyBraveResult(paa.question, pillarTopic);
      // PAA questions are ALWAYS FAQ candidates even if classifyBraveResult returns null
      candidates.push({
        type: classified?.type ?? 'faq',
        raw_text: paa.question,
        extracted_name: classified?.extracted_name ?? null,
        source: 'serp-paa',
        source_url: paa.link || null,
      });
    }

    // 2. Related Searches → compare or FAQ candidates
    for (const rs of result.relatedSearches) {
      const classified = classifyBraveResult(rs.query, pillarTopic);
      if (!classified) {
        // Relaxed filter: if from a compare-focused query and has compare patterns
        if (q.focus === 'compare' && COMPARE_PATTERNS.test(rs.query)) {
          candidates.push({
            type: 'compare',
            raw_text: rs.query,
            extracted_name: cleanExtractedName(rs.query.replace(/.*\bvs\.?\s+/i, '')),
            source: 'serp-related',
            source_url: null,
          });
        }
        continue;
      }
      candidates.push({
        type: classified.type,
        raw_text: rs.query,
        extracted_name: classified.extracted_name,
        source: 'serp-related',
        source_url: null,
      });
    }

    // 3. Organic results → collect competitor URLs for Stage 2
    for (const org of result.organic) {
      competitorUrls.push(org.link);
    }

    await delay(1000);
  }

  return { candidates, competitorUrls };
}

// ============================================================
// Stage 1.5: Exa Semantic Gap Discovery
// ============================================================

async function discoverSemanticGaps(
  cluster: ClusterForDiscovery,
  existingSlugs: Set<string>,
  dismissedSlugs: Set<string>,
): Promise<RawCandidate[]> {
  const candidates: RawCandidate[] = [];
  const ownDomain = 'loreai.dev';
  const excludeDomains = [ownDomain, ...(cluster.official_domains || [])];

  // 1. Find pages similar to our cornerstone
  const cornerstoneUrl = `https://${ownDomain}/blog/${cluster.cornerstone.slug}`;
  const similar = await exaFindSimilar(cornerstoneUrl, {
    numResults: 10,
    excludeDomains,
    contents: { highlights: { maxCharacters: 500 } },
  });

  for (const result of similar.results) {
    const titleClassified = classifyBraveResult(result.title, cluster.pillar_topic);
    if (titleClassified) {
      candidates.push({
        type: titleClassified.type,
        raw_text: result.title,
        extracted_name: titleClassified.extracted_name,
        source: 'exa-similar-cornerstone',
        source_url: result.url,
      });
    }

    for (const highlight of result.highlights || []) {
      const classified = classifyBraveResult(highlight, cluster.pillar_topic);
      if (classified && classified.type === 'compare' && classified.extracted_name) {
        candidates.push({
          type: 'compare',
          raw_text: `${cluster.pillar_topic} vs ${classified.extracted_name}`,
          extracted_name: classified.extracted_name,
          source: 'exa-similar-cornerstone',
          source_url: result.url,
        });
      }
    }
  }

  // 2. Find pages similar to our top compare page (if one exists)
  const topCompare = cluster.target_compare[0];
  if (topCompare) {
    const compareUrl = `https://${ownDomain}/compare/${topCompare.slug}`;
    const compareSimilar = await exaFindSimilar(compareUrl, {
      numResults: 10,
      excludeDomains,
      contents: { highlights: { maxCharacters: 500 } },
    });

    for (const result of compareSimilar.results) {
      const titleMatch = result.title.match(/\bvs\.?\s+(.+)/i)
        || result.title.match(/(.+?)\s+vs\.?\s/i);
      if (titleMatch) {
        const name = cleanExtractedName(titleMatch[1]);
        if (name) {
          candidates.push({
            type: 'compare',
            raw_text: `${cluster.pillar_topic} vs ${name}`,
            extracted_name: name,
            source: 'exa-similar-compare',
            source_url: result.url,
          });
        }
      }
    }
  }

  return candidates;
}

// ============================================================
// Competitor content audit (LLM-assisted)
// ============================================================

async function extractWithLLM(
  pageContent: string,
  pillarTopic: string,
  sourceUrl: string
): Promise<RawCandidate[]> {
  const skill = loadPlannerSkill('competitor-audit');
  const truncated = truncateSource(pageContent, 12000);

  const system = skill;
  const user = `Pillar topic: "${pillarTopic}"
Source URL: ${sourceUrl}

Page content:
${truncated}`;

  try {
    const response = await callClaude(system, user, {
      maxTokens: 1024,
      temperature: 0.2,
    });

    // Parse JSON response
    const cleaned = response.content
      .replace(/```json\n?/g, '')
      .replace(/```\n?/g, '')
      .trim();

    const parsed = JSON.parse(cleaned);
    const candidates: RawCandidate[] = [];

    for (const ct of parsed.compare_targets || []) {
      candidates.push({
        type: 'compare',
        raw_text: `${pillarTopic} vs ${ct.name}`,
        extracted_name: ct.name,
        source: 'competitor-audit',
        source_url: sourceUrl,
      });
    }

    for (const fq of parsed.faq_questions || []) {
      candidates.push({
        type: 'faq',
        raw_text: fq.question,
        extracted_name: null,
        source: 'competitor-audit',
        source_url: sourceUrl,
      });
    }

    return candidates;
  } catch (err) {
    console.warn(`    [discover] Failed to parse LLM response for ${sourceUrl}: ${(err as Error).message}`);
    return [];
  }
}

// ============================================================
// News Item Signal Extraction (Channel 3)
// ============================================================

interface DiscoveryNewsItem {
  id: number;
  title: string;
  url: string | null;
  summary: string | null;
  detected_at: string;
}

export function getRecentNewsItemsForDiscovery(
  clusterTopic: string,
  daysBack: number = 14
): DiscoveryNewsItem[] {
  try {
    const db = getDb();
    const cutoff = new Date(Date.now() - daysBack * 86400000).toISOString();
    const pattern = `%${clusterTopic}%`;

    const items = db.prepare(`
      SELECT id, title, url, summary, detected_at
      FROM news_items
      WHERE (title LIKE ? OR summary LIKE ?)
        AND detected_at > ?
      ORDER BY detected_at DESC
      LIMIT 50
    `).all(pattern, pattern, cutoff) as DiscoveryNewsItem[];

    return items;
  } catch (err) {
    console.warn(`    [discover] Failed to query news items: ${(err as Error).message}`);
    return [];
  }
}

function parseJsonResponse(raw: string): Record<string, unknown> | null {
  try {
    const cleaned = raw
      .replace(/```json\n?/g, '')
      .replace(/```\n?/g, '')
      .trim();
    return JSON.parse(cleaned);
  } catch {
    return null;
  }
}

export async function extractNewsSignals(
  items: DiscoveryNewsItem[],
  pillarTopic: string,
  topicSlug?: string,
): Promise<RawCandidate[]> {
  const skill = loadPlannerSkill('news-signal-extract');
  const candidates: RawCandidate[] = [];
  const collectedFreshnessEvents: FreshnessSignal[] = [];

  // Batch items (5 per call)
  for (let i = 0; i < items.length; i += 5) {
    const batch = items.slice(i, i + 5);
    const itemsText = batch.map((item, idx) =>
      `[${idx + 1}] "${item.title}"\n${item.summary || '(no summary)'}\nSource: ${item.url || '(no url)'}\nDate: ${item.detected_at}`
    ).join('\n\n');

    try {
      const response = await callClaude(skill, `Pillar topic: "${pillarTopic}"\n\nNews items:\n${itemsText}`, {
        maxTokens: 1024,
        temperature: 0.2,
      });

      const parsed = parseJsonResponse(response.content);
      if (!parsed) {
        console.warn(`    [discover] Failed to parse LLM response for news batch ${i / 5 + 1}`);
        continue;
      }

      // Process entity pairs → compare candidates
      for (const pair of (parsed.entity_pairs as Array<{ entity: string; source_item_url?: string }>) || []) {
        candidates.push({
          type: 'compare',
          raw_text: `${pillarTopic} vs ${pair.entity}`,
          extracted_name: pair.entity,
          source: 'news-entity',
          source_url: pair.source_item_url || null,
        });
      }

      // Process questions → FAQ candidates
      for (const q of (parsed.questions as Array<{ question: string; source_item_url?: string }>) || []) {
        candidates.push({
          type: 'faq',
          raw_text: q.question,
          extracted_name: null,
          source: 'news-question',
          source_url: q.source_item_url || null,
        });
      }

      // Freshness events: cache for SPEC-09d refresh detection
      const events = (parsed.freshness_events as Array<{ event_type: string; description: string; source_item_url?: string }>) || [];
      if (events.length > 0) {
        console.log(`    [discover] Freshness events detected: ${events.map(e => `${e.event_type}: ${e.description}`).join('; ')}`);
        for (const e of events) {
          collectedFreshnessEvents.push({
            event_type: e.event_type as FreshnessSignal['event_type'],
            description: e.description,
            source_url: e.source_item_url || null,
            detected_at: new Date().toISOString().slice(0, 10),
          });
        }
      }
    } catch (err) {
      console.warn(`    [discover] LLM call failed for news batch ${i / 5 + 1}: ${(err as Error).message}`);
    }

    // Rate limit between batches
    if (i + 5 < items.length) {
      await delay(500);
    }
  }

  // Cache freshness events for SPEC-09d refresh detection
  if (collectedFreshnessEvents.length > 0 && topicSlug) {
    cacheFreshnessEvents(topicSlug, collectedFreshnessEvents);
  }

  return candidates;
}

// ============================================================
// GSC Unmatched Query Import (Channel 4)
// ============================================================

export function importGSCCandidates(
  csvPath: string,
  pillarTopic: string,
): RawCandidate[] {
  if (!existsSync(csvPath)) {
    console.log(`    [discover] GSC CSV not found at ${csvPath}, skipping`);
    return [];
  }

  const raw = readFileSync(csvPath, 'utf-8');
  const lines = raw.trim().split('\n');
  if (lines.length < 2) {
    console.log(`    [discover] GSC CSV is empty`);
    return [];
  }

  const header = lines[0].split(',');
  const queryIdx = header.findIndex(h => h.trim().toLowerCase() === 'query');
  const pageIdx = header.findIndex(h => h.trim().toLowerCase() === 'page');
  const impressionIdx = header.findIndex(h => h.trim().toLowerCase() === 'impressions');

  if (queryIdx === -1 || impressionIdx === -1) {
    console.warn(`    [discover] GSC CSV missing required columns (Query, Impressions)`);
    return [];
  }

  const candidates: RawCandidate[] = [];
  const topicLower = pillarTopic.toLowerCase();

  for (const line of lines.slice(1)) {
    const cols = line.split(',');
    const query = cols[queryIdx]?.trim().toLowerCase();
    if (!query) continue;

    const page = pageIdx >= 0 ? cols[pageIdx]?.trim() : '';
    const impressions = parseInt(cols[impressionIdx]?.trim() || '0', 10);

    // Skip if: has a landing page, low impressions, not relevant to topic
    if (page && page.length > 5) continue;
    if (impressions < 10) continue;
    if (!query.includes(topicLower)) continue;

    // Classify by query pattern
    let type: 'compare' | 'faq';
    let extractedName: string | null = null;

    if (query.includes(' vs ') || query.includes(' versus ')) {
      type = 'compare';
      const match = query.match(/vs\.?\s+(.+)/);
      extractedName = match ? match[1].trim() : null;
    } else {
      type = 'faq';
    }

    candidates.push({
      type,
      raw_text: query,
      extracted_name: extractedName,
      source: 'gsc-unmatched',
      source_url: null,
      gsc_impressions: impressions,
    });
  }

  // Sort by impressions descending
  candidates.sort((a, b) => (b.gsc_impressions || 0) - (a.gsc_impressions || 0));

  console.log(`    [discover] GSC: ${candidates.length} unmatched queries (${lines.length - 1} total rows)`);
  return candidates;
}

// ============================================================
// Scoring
// ============================================================

export function scoreCandidate(
  raw: RawCandidate,
  signals: {
    braveResultCount: number;
    relatedSearchHit: boolean;
    competitorCount: number;
    topicSlug: string;
    hasFreshResults: boolean;
    paaHit?: boolean;
    exaSimilarHit?: boolean;
  }
): { score: number; signals: CandidateSignals } {
  // brave_result_count / serp_organic_count: 0 results → 0, 1-2 → 8, 3-4 → 14, 5+ → 20
  let braveScore = 0;
  if (signals.braveResultCount >= 5) braveScore = 20;
  else if (signals.braveResultCount >= 3) braveScore = 14;
  else if (signals.braveResultCount >= 1) braveScore = 8;

  // related_search_hit: binary 0 or 25
  const relatedScore = signals.relatedSearchHit ? 25 : 0;

  // competitor_coverage: 0 → 0, 1 → 10, 2+ → 20
  let competitorScore = 0;
  if (signals.competitorCount >= 2) competitorScore = 20;
  else if (signals.competitorCount >= 1) competitorScore = 10;

  // cluster_relevance: slug contains topic slug or extracted name matches known entity
  const slug = candidateSlug(raw.type, raw, signals.topicSlug.replace(/-/g, ' '));
  const relevanceScore = slug.includes(signals.topicSlug) ? 15 : 0;

  // intent_clarity: question word, "vs", pricing keyword
  const hasIntentClarity =
    QUESTION_WORDS.test(raw.raw_text) ||
    /\bvs\b/i.test(raw.raw_text) ||
    /\b(pricing|cost|free|price)\b/i.test(raw.raw_text);
  const intentScore = hasIntentClarity ? 10 : 0;

  // freshness_bonus: appeared in recent results
  const freshnessScore = signals.hasFreshResults ? 10 : 0;

  // GSC impression bonus: real search demand signal
  let gscBonus = 0;
  if (raw.source === 'gsc-unmatched' && raw.gsc_impressions) {
    if (raw.gsc_impressions >= 200) gscBonus = 35;
    else if (raw.gsc_impressions >= 50) gscBonus = 25;
    else gscBonus = 15;
  }

  // paa_hit: candidate from Google People Also Ask (+20)
  const paaScore = signals.paaHit ? 20 : 0;

  // exa_similar_hit: found via Exa findSimilar (+15)
  const exaSimilarScore = signals.exaSimilarHit ? 15 : 0;

  const totalScore = braveScore + relatedScore + competitorScore + relevanceScore + intentScore + freshnessScore + gscBonus + paaScore + exaSimilarScore;

  return {
    score: Math.min(totalScore, 100),
    signals: {
      brave_result_count: signals.braveResultCount,
      related_search_hit: signals.relatedSearchHit,
      competitor_coverage: signals.competitorCount,
      cluster_relevance: relevanceScore > 0,
      intent_clarity: hasIntentClarity,
      freshness_bonus: signals.hasFreshResults,
      paa_hit: signals.paaHit || false,
      exa_similar_hit: signals.exaSimilarHit || false,
    },
  };
}

// ============================================================
// Slug generation
// ============================================================

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

export function candidateSlug(type: 'compare' | 'faq', raw: RawCandidate, pillarTopic: string): string {
  const topicSlug = slugify(pillarTopic);
  if (type === 'compare' && raw.extracted_name) {
    return slugify(`${pillarTopic} vs ${raw.extracted_name}`);
  }
  if (type === 'faq') {
    return slugify(raw.raw_text.replace(/\?$/, '')).slice(0, 40);
  }
  return slugify(raw.raw_text).slice(0, 40);
}

// ============================================================
// Deduplication
// ============================================================

export function buildExistingSlugSet(cluster: ClusterForDiscovery): Set<string> {
  const slugs = new Set<string>();
  for (const c of cluster.target_compare) slugs.add(c.slug);
  for (const f of cluster.target_faq) slugs.add(f.slug);
  for (const g of cluster.target_glossary) slugs.add(g.slug);
  if (cluster.cornerstone) slugs.add(cluster.cornerstone.slug);
  for (const cand of cluster.candidates || []) slugs.add(cand.slug);
  return slugs;
}

export function buildDismissedSet(cluster: ClusterForDiscovery): Set<string> {
  const dismissed = new Set<string>();
  for (const cand of cluster.candidates || []) {
    if (cand.status === 'dismissed') dismissed.add(cand.slug);
  }
  return dismissed;
}

// ============================================================
// Orchestrator
// ============================================================

export async function discoverForCluster(cluster: ClusterForDiscovery, gscCsvPath?: string): Promise<ScoredCandidate[]> {
  const { pillar_topic, topic_slug, official_domains = [] } = cluster;
  console.log(`\n[discover] Starting discovery for "${pillar_topic}" (${topic_slug})`);

  const existingSlugs = buildExistingSlugSet(cluster);
  const dismissedSlugs = buildDismissedSet(cluster);

  // Track raw candidates with their signal accumulation
  const candidateMap = new Map<string, {
    raw: RawCandidate;
    braveResultCount: number;
    relatedSearchHit: boolean;
    competitorCount: number;
    hasFreshResults: boolean;
    paaHit: boolean;
    exaSimilarHit: boolean;
  }>();

  // ---- Stage 1: SERP Demand Signals (Serper.dev) ----
  const hasSerper = !!process.env.SERPER_API_KEY;
  if (hasSerper) {
    console.log(`  [discover] Stage 1: Serper.dev SERP queries...`);
    const { candidates: serpCandidates, competitorUrls } = await extractSerpSignals(pillar_topic);

    for (const sc of serpCandidates) {
      const slug = candidateSlug(sc.type, sc, pillar_topic);
      if (existingSlugs.has(slug) || dismissedSlugs.has(slug)) continue;

      const isPaa = sc.source === 'serp-paa';
      const existing = candidateMap.get(slug);
      if (existing) {
        existing.relatedSearchHit = existing.relatedSearchHit || sc.source === 'serp-related';
        if (isPaa) existing.paaHit = true;
      } else {
        candidateMap.set(slug, {
          raw: sc,
          braveResultCount: 0,
          relatedSearchHit: sc.source === 'serp-related',
          competitorCount: 0,
          hasFreshResults: false,
          paaHit: isPaa,
          exaSimilarHit: false,
        });
      }
    }
    console.log(`    [discover] Stage 1 found ${candidateMap.size} candidates from SERP`);
  } else {
    console.log(`  [discover] Stage 1: SERPER_API_KEY not set — skipping SERP queries`);
    // Fallback to old Brave queries if no Serper key
    const queries = buildDiscoveryQueries(pillar_topic);
    for (const q of queries) {
      const result = await braveSearchWithSignals(q.query);
      for (const rs of result.related_searches) {
        const classified = classifyBraveResult(rs, pillar_topic);
        if (!classified) continue;
        const raw: RawCandidate = {
          type: classified.type,
          raw_text: rs,
          extracted_name: classified.extracted_name,
          source: `brave-${q.signal}`,
          source_url: null,
        };
        const slug = candidateSlug(classified.type, raw, pillar_topic);
        if (existingSlugs.has(slug) || dismissedSlugs.has(slug)) continue;
        const existing = candidateMap.get(slug);
        if (existing) {
          existing.relatedSearchHit = true;
          existing.braveResultCount = Math.max(existing.braveResultCount, result.result_count);
        } else {
          candidateMap.set(slug, {
            raw,
            braveResultCount: result.result_count,
            relatedSearchHit: true,
            competitorCount: 0,
            hasFreshResults: false,
            paaHit: false,
            exaSimilarHit: false,
          });
        }
      }
      await delay(1000);
    }
    console.log(`    [discover] Stage 1 found ${candidateMap.size} candidates from Brave (fallback)`);
  }

  // ---- Stage 1.5: Exa Semantic Gap Discovery ----
  const hasExa = !!process.env.EXA_API_KEY;
  if (hasExa) {
    console.log(`  [discover] Stage 1.5: Exa semantic gap discovery...`);
    const exaCandidates = await discoverSemanticGaps(cluster, existingSlugs, dismissedSlugs);
    for (const ec of exaCandidates) {
      const slug = candidateSlug(ec.type, ec, pillar_topic);
      if (existingSlugs.has(slug) || dismissedSlugs.has(slug)) continue;
      const existing = candidateMap.get(slug);
      if (existing) {
        existing.exaSimilarHit = true;
      } else {
        candidateMap.set(slug, {
          raw: ec,
          braveResultCount: 0,
          relatedSearchHit: false,
          competitorCount: 0,
          hasFreshResults: false,
          paaHit: false,
          exaSimilarHit: true,
        });
      }
    }
    console.log(`    [discover] After Stage 1.5: ${candidateMap.size} total unique candidates`);
  } else {
    console.log(`  [discover] Stage 1.5: EXA_API_KEY not set — skipping semantic gap discovery`);
  }

  // ---- Stage 2: Competitor Content Audit ----
  console.log(`  [discover] Stage 2: Competitor content audit...`);
  const competitorCandidates = await auditCompetitorContent(
    pillar_topic,
    official_domains,
    'loreai.dev'
  );

  for (const cc of competitorCandidates) {
    const slug = candidateSlug(cc.type, cc, pillar_topic);
    if (existingSlugs.has(slug) || dismissedSlugs.has(slug)) continue;

    const existing = candidateMap.get(slug);
    if (existing) {
      existing.competitorCount++;
    } else {
      candidateMap.set(slug, {
        raw: cc,
        braveResultCount: 0,
        relatedSearchHit: false,
        competitorCount: 1,
        hasFreshResults: false,
        paaHit: false,
        exaSimilarHit: false,
      });
    }
  }

  console.log(`    [discover] After Stage 2: ${candidateMap.size} total unique candidates`);

  // ---- Stage 3: News Item Analysis ----
  console.log(`  [discover] Stage 3: News item analysis...`);
  const newsItems = getRecentNewsItemsForDiscovery(pillar_topic);
  if (newsItems.length > 0) {
    console.log(`    [discover] Analyzing ${newsItems.length} news items...`);
    const newsCandidates = await extractNewsSignals(newsItems, pillar_topic, topic_slug);
    for (const nc of newsCandidates) {
      const slug = candidateSlug(nc.type, nc, pillar_topic);
      if (existingSlugs.has(slug) || dismissedSlugs.has(slug)) continue;
      if (!candidateMap.has(slug)) {
        candidateMap.set(slug, {
          raw: nc,
          braveResultCount: 0,
          relatedSearchHit: false,
          competitorCount: 0,
          hasFreshResults: false,
          paaHit: false,
          exaSimilarHit: false,
        });
      }
    }
    console.log(`    [discover] After Stage 3: ${candidateMap.size} total unique candidates`);
  } else {
    console.log(`    [discover] No relevant news items found`);
  }

  // ---- Stage 4: GSC Import ----
  console.log(`  [discover] Stage 4: GSC import...`);
  const csvPath = gscCsvPath || join(process.cwd(), 'data', 'gsc-exports', 'latest.csv');
  const gscCandidates = importGSCCandidates(csvPath, pillar_topic);
  for (const gc of gscCandidates) {
    const slug = candidateSlug(gc.type, gc, pillar_topic);
    if (existingSlugs.has(slug) || dismissedSlugs.has(slug)) continue;
    if (!candidateMap.has(slug)) {
      candidateMap.set(slug, {
        raw: gc,
        braveResultCount: 0,
        relatedSearchHit: false,
        competitorCount: 0,
        hasFreshResults: false,
        paaHit: false,
        exaSimilarHit: false,
      });
    }
  }
  console.log(`    [discover] After Stage 4: ${candidateMap.size} total unique candidates`);

  // ---- Stage 5: Scoring & Filtering ----
  console.log(`  [discover] Stage 5: Scoring...`);
  const scored: ScoredCandidate[] = [];

  for (const [slug, entry] of Array.from(candidateMap.entries())) {
    const { score, signals } = scoreCandidate(entry.raw, {
      braveResultCount: entry.braveResultCount,
      relatedSearchHit: entry.relatedSearchHit,
      competitorCount: entry.competitorCount,
      topicSlug: topic_slug,
      hasFreshResults: entry.hasFreshResults,
      paaHit: entry.paaHit,
      exaSimilarHit: entry.exaSimilarHit,
    });

    if (score < 30) continue;

    const today = new Date().toISOString().slice(0, 10);
    const displayTerm = entry.raw.type === 'compare' && entry.raw.extracted_name
      ? `${pillar_topic} vs ${entry.raw.extracted_name}`
      : entry.raw.raw_text;

    scored.push({
      slug,
      type: entry.raw.type,
      display_term: displayTerm,
      question: entry.raw.type === 'faq' ? entry.raw.raw_text : null,
      item_b: entry.raw.type === 'compare' ? entry.raw.extracted_name : null,
      item_b_url: null,
      score,
      signals,
      source: entry.raw.source,
      source_url: entry.raw.source_url,
      discovered_at: today,
      status: score >= 40 ? 'pending' : 'low-signal',
    });
  }

  // Sort by score descending
  scored.sort((a, b) => b.score - a.score);

  console.log(`  [discover] Stage 5: ${scored.length} candidates above threshold (dropped ${candidateMap.size - scored.length} below 30)`);

  // Log summary by tier
  const high = scored.filter(c => c.score >= 70).length;
  const moderate = scored.filter(c => c.score >= 40 && c.score < 70).length;
  const low = scored.filter(c => c.score < 40).length;
  console.log(`    High priority (70+): ${high}, Moderate (40-69): ${moderate}, Low signal (30-39): ${low}`);

  // ---- Stage 6: Glossary Inference ----
  console.log(`  [discover] Stage 6: Glossary inference...`);
  const glossaryCandidates = inferGlossaryCandidates(cluster);
  if (glossaryCandidates.length > 0) {
    scored.push(...glossaryCandidates);
    console.log(`    [discover] Inferred ${glossaryCandidates.length} glossary candidates from compare targets`);
  } else {
    console.log(`    [discover] No new glossary candidates to infer`);
  }

  return scored;
}

// ============================================================
// Glossary Inference
// ============================================================

export function inferGlossaryCandidates(cluster: ClusterForDiscovery): ScoredCandidate[] {
  const existingSlugs = buildExistingSlugSet(cluster);
  const candidates: ScoredCandidate[] = [];
  const today = new Date().toISOString().slice(0, 10);

  // Every compare target item_b could be a glossary entry
  for (const c of cluster.target_compare) {
    if (!c.item_b) continue;
    const slug = slugify(c.item_b);
    if (slug && !existingSlugs.has(slug)) {
      candidates.push({
        slug,
        type: 'glossary',
        display_term: c.item_b,
        question: null,
        item_b: null,
        item_b_url: null,
        score: 50,
        signals: { source: 'compare-target-inference' },
        source: 'compare-target-inference',
        source_url: null,
        discovered_at: today,
        status: 'pending',
      });
      existingSlugs.add(slug);
    }
  }

  // Also check newly promoted compare candidates
  for (const c of cluster.candidates || []) {
    if (c.type === 'compare' && c.status === 'approved' && c.item_b) {
      const slug = slugify(c.item_b);
      if (slug && !existingSlugs.has(slug)) {
        candidates.push({
          slug,
          type: 'glossary',
          display_term: c.item_b,
          question: null,
          item_b: null,
          item_b_url: null,
          score: 50,
          signals: { source: 'compare-target-inference' },
          source: 'compare-target-inference',
          source_url: null,
          discovered_at: today,
          status: 'pending',
        });
        existingSlugs.add(slug);
      }
    }
  }

  return candidates;
}

// ============================================================
// Keyword Table Integration
// ============================================================

export function writeDiscoveriesToKeywordTable(
  cluster: ClusterForDiscovery,
  candidates: ScoredCandidate[]
): void {
  for (const c of candidates) {
    const source = `planner-${c.source}`;
    upsertKeyword(c.display_term, source, cluster.topic_slug);

    if (c.type === 'faq' && c.question) {
      upsertKeyword(c.question, source, cluster.topic_slug);
    }
    if (c.type === 'compare' && c.item_b) {
      upsertKeyword(`${cluster.pillar_topic} vs ${c.item_b}`, source, cluster.topic_slug);
    }
  }
}

// ============================================================
// Refresh Detection Engine (SPEC-09d)
// ============================================================

function cacheFreshnessEvents(topicSlug: string, events: FreshnessSignal[]): void {
  const cachePath = join(process.cwd(), 'data', 'flagship-clusters', '.freshness-cache.json');
  let cache: Record<string, FreshnessSignal[]> = {};
  if (existsSync(cachePath)) {
    try {
      cache = JSON.parse(readFileSync(cachePath, 'utf-8'));
    } catch { /* start fresh */ }
  }
  cache[topicSlug] = events;
  writeFileSync(cachePath, JSON.stringify(cache, null, 2) + '\n', 'utf-8');
  console.log(`    [discover] Cached ${events.length} freshness events for ${topicSlug}`);
}

export async function collectFreshnessSignals(
  cluster: ClusterForDiscovery
): Promise<FreshnessSignal[]> {
  const signals: FreshnessSignal[] = [];

  // Source 1: Cached freshness events from SPEC-09c discovery
  const cachePath = join(
    process.cwd(), 'data', 'flagship-clusters', '.freshness-cache.json'
  );
  if (existsSync(cachePath)) {
    try {
      const cached = JSON.parse(readFileSync(cachePath, 'utf-8'));
      const clusterEvents = cached[cluster.topic_slug] || [];
      signals.push(...clusterEvents);
    } catch { /* ignore malformed cache */ }
  }

  // Source 2: If no cached events, do a quick news scan
  if (signals.length === 0) {
    const newsItems = getRecentNewsItemsForDiscovery(cluster.pillar_topic, 7);
    if (newsItems.length > 0) {
      console.log(`    [refresh] No cache found — scanning ${newsItems.length} recent news items...`);
      signals.push(...await extractFreshnessOnly(newsItems, cluster.pillar_topic));
    }
  }

  return signals;
}

async function extractFreshnessOnly(
  items: DiscoveryNewsItem[],
  pillarTopic: string
): Promise<FreshnessSignal[]> {
  const skill = loadPlannerSkill('news-signal-extract');
  const signals: FreshnessSignal[] = [];

  // Batch items (5 per call)
  for (let i = 0; i < items.length; i += 5) {
    const batch = items.slice(i, i + 5);
    const itemsText = batch.map((item, idx) =>
      `[${idx + 1}] "${item.title}"\n${item.summary || '(no summary)'}\nSource: ${item.url || '(no url)'}\nDate: ${item.detected_at}`
    ).join('\n\n');

    try {
      const response = await callClaude(skill, `Pillar topic: "${pillarTopic}"\n\nNews items:\n${itemsText}`, {
        maxTokens: 1024,
        temperature: 0.2,
      });

      const parsed = parseJsonResponse(response.content);
      if (!parsed) continue;

      const events = (parsed.freshness_events as Array<{ event_type: string; description: string; source_item_url?: string }>) || [];
      for (const e of events) {
        signals.push({
          event_type: e.event_type as FreshnessSignal['event_type'],
          description: e.description,
          source_url: e.source_item_url || null,
          detected_at: new Date().toISOString().slice(0, 10),
        });
      }
    } catch (err) {
      console.warn(`    [refresh] LLM call failed for batch ${i / 5 + 1}: ${(err as Error).message}`);
    }

    if (i + 5 < items.length) await delay(500);
  }

  return signals;
}

export function mapSignalToPages(
  signal: FreshnessSignal,
  cluster: ClusterForDiscovery
): string[] {
  const affectedSlugs: string[] = [];

  switch (signal.event_type) {
    case 'pricing-change':
      affectedSlugs.push(cluster.cornerstone.slug);
      for (const f of cluster.target_faq) {
        if (f.slug.includes('pricing') || f.slug.includes('cost') || f.slug.includes('free')) {
          affectedSlugs.push(f.slug);
        }
      }
      for (const c of cluster.target_compare) {
        affectedSlugs.push(c.slug);
      }
      break;

    case 'new-feature':
    case 'version-release':
      affectedSlugs.push(cluster.cornerstone.slug);
      for (const c of cluster.target_compare) {
        affectedSlugs.push(c.slug);
      }
      break;

    case 'deprecation':
      affectedSlugs.push(cluster.cornerstone.slug);
      for (const f of cluster.target_faq) {
        if (f.slug.includes('install') || f.slug.includes('setup') || f.slug.includes('how-to')) {
          affectedSlugs.push(f.slug);
        }
      }
      break;

    case 'platform-change':
      affectedSlugs.push(cluster.cornerstone.slug);
      for (const f of cluster.target_faq) {
        if (f.slug.includes('windows') || f.slug.includes('install') || f.slug.includes('setup')) {
          affectedSlugs.push(f.slug);
        }
      }
      for (const c of cluster.target_compare) {
        affectedSlugs.push(c.slug);
      }
      break;
  }

  return Array.from(new Set(affectedSlugs));
}

function getPageType(slug: string, cluster: ClusterForDiscovery): string {
  if (cluster.cornerstone.slug === slug) return 'blog';
  if (cluster.target_compare.some(c => c.slug === slug)) return 'compare';
  if (cluster.target_faq.some(f => f.slug === slug)) return 'faq';
  if (cluster.target_glossary.some(g => g.slug === slug)) return 'glossary';
  return 'blog';
}

export function readPageContent(
  slug: string,
  type: string,
  lang: string = 'en'
): string | null {
  const typeDir = type === 'blog' ? 'blog' : type;
  const filePath = join(process.cwd(), 'content', typeDir, lang, `${slug}.md`);

  if (!existsSync(filePath)) {
    return null;
  }

  return readFileSync(filePath, 'utf-8');
}

export async function checkPageStaleness(
  pageContent: string,
  pageSlug: string,
  pageType: string,
  signal: FreshnessSignal,
  pillarTopic: string
): Promise<RefreshFlag | null> {
  try {
    const skill = loadPlannerSkill('refresh-detect');
    const truncatedPage = truncateSource(pageContent, 8000);

    const response = await callClaude(skill, `
Pillar topic: "${pillarTopic}"
Page slug: ${pageSlug}
Page type: ${pageType}

Freshness signal:
- Event: ${signal.event_type}
- Description: ${signal.description}
- Source: ${signal.source_url || 'unknown'}
- Detected: ${signal.detected_at}

Current page content:
${truncatedPage}
    `, {
      maxTokens: 512,
      temperature: 0.1,
    });

    const parsed = parseJsonResponse(response.content);
    if (!parsed) return null;

    if (!parsed.is_stale) return null;

    return {
      slug: pageSlug,
      page_type: pageType,
      severity: parsed.severity as RefreshFlag['severity'],
      affected_sections: (parsed.affected_sections as string[]) || [],
      reason: (parsed.reason as string) || '',
      signal_event: signal.event_type,
      signal_description: signal.description,
      flagged_at: new Date().toISOString().slice(0, 10),
      status: 'pending' as const,
    };
  } catch (err) {
    console.warn(`    [refresh] LLM check failed for ${pageSlug}: ${(err as Error).message}`);
    return null;
  }
}

export async function checkClusterRefresh(cluster: ClusterForDiscovery): Promise<RefreshFlag[]> {
  console.log(`\n[refresh] Refresh check for "${cluster.pillar_topic}"`);

  // 1. Collect freshness signals
  const signals = await collectFreshnessSignals(cluster);
  if (signals.length === 0) {
    console.log('  No freshness signals found — skipping refresh check');
    return [];
  }
  console.log(`  Found ${signals.length} freshness signal(s)`);

  // 2. Map signals to affected pages
  const pageChecks = new Map<string, { type: string; signals: FreshnessSignal[] }>();

  for (const signal of signals) {
    const affected = mapSignalToPages(signal, cluster);
    for (const slug of affected) {
      if (!pageChecks.has(slug)) {
        const pageType = getPageType(slug, cluster);
        pageChecks.set(slug, { type: pageType, signals: [] });
      }
      pageChecks.get(slug)!.signals.push(signal);
    }
  }

  console.log(`  ${pageChecks.size} page(s) to check`);

  // 3. LLM staleness check for each affected page
  const flags: RefreshFlag[] = [];
  const existingSlugs = new Set((cluster.refresh_needed || []).filter(r => r.status === 'pending').map(r => `${r.slug}:${r.signal_event}:${r.signal_description}`));

  for (const [slug, { type, signals: pageSignals }] of Array.from(pageChecks.entries())) {
    const content = readPageContent(slug, type);
    if (!content) {
      console.log(`    [skip] ${slug} — file not found`);
      continue;
    }

    for (const signal of pageSignals) {
      // Deduplication: skip if already flagged with same signal
      const dedupeKey = `${slug}:${signal.event_type}:${signal.description}`;
      if (existingSlugs.has(dedupeKey)) {
        console.log(`    [skip] ${slug} — already flagged for "${signal.event_type}"`);
        continue;
      }

      console.log(`    [check] ${slug} <- ${signal.event_type}: ${signal.description.slice(0, 60)}...`);

      const flag = await checkPageStaleness(content, slug, type, signal, cluster.pillar_topic);
      if (flag) {
        flags.push(flag);
        existingSlugs.add(dedupeKey);
        console.log(`    [STALE] ${slug} — ${flag.severity}: ${flag.reason.slice(0, 80)}...`);
      }

      await delay(500);
    }
  }

  return flags;
}

export function clearRefresh(cluster: ClusterForDiscovery, slug: string): void {
  if (!cluster.refresh_needed || cluster.refresh_needed.length === 0) {
    throw new Error('No refresh flags to clear');
  }

  if (slug === 'all') {
    for (const r of cluster.refresh_needed) {
      r.status = 'cleared';
    }
  } else {
    const flag = cluster.refresh_needed.find(r => r.slug === slug);
    if (!flag) throw new Error(`No refresh flag for "${slug}"`);
    flag.status = 'cleared';
  }
}

// ============================================================
// Helpers
// ============================================================

function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
