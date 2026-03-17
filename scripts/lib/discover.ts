/**
 * scripts/lib/discover.ts — External discovery engine for cluster planner
 *
 * Discovers candidate cluster nodes (compare pages, FAQ pages) by analyzing
 * Brave Search demand signals and competitor content structure.
 * Candidates are scored and deduplicated before being returned.
 */
import { readFileSync } from 'fs';
import { join } from 'path';
import 'dotenv/config';

import { braveSearch, fetchWithCache, truncateSource } from './source-fetch';
import { callClaude } from './ai';

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
}

export interface CandidateSignals {
  brave_result_count: number;
  related_search_hit: boolean;
  competitor_coverage: number;
  cluster_relevance: boolean;
  intent_clarity: boolean;
  freshness_bonus: boolean;
}

export interface ScoredCandidate {
  slug: string;
  type: 'compare' | 'faq';
  display_term: string;
  question: string | null;
  item_b: string | null;
  item_b_url: string | null;
  score: number;
  signals: CandidateSignals;
  source: string;
  source_url: string | null;
  discovered_at: string;
  status: 'pending' | 'low-signal';
}

interface BraveFullResult {
  web_results: Array<{ url: string; title: string }>;
  related_searches: string[];
  discussions: string[];
  result_count: number;
}

// Minimal cluster type for discovery (avoids importing from generate-seo.ts)
export interface ClusterForDiscovery {
  topic_slug: string;
  pillar_topic: string;
  official_domains?: string[];
  cornerstone: { slug: string };
  target_compare: Array<{ slug: string }>;
  target_faq: Array<{ slug: string }>;
  target_glossary: Array<{ slug: string }>;
  candidates?: Array<{ slug: string; status: string }>;
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
  console.log(`  [discover] Auditing competitor content for "${pillarTopic}"...`);

  // 1. Search for competing guide pages
  const results = await braveSearch(`${pillarTopic} complete guide`);

  // 2. Filter out own domain and official product domains
  const competitors = results.filter(r =>
    !r.url.includes(ownDomain) &&
    !officialDomains.some(d => r.url.includes(d))
  );

  if (competitors.length === 0) {
    console.log(`    [discover] No competitor pages found`);
    return [];
  }

  // 3. Fetch top 2-3 competitor pages
  const candidates: RawCandidate[] = [];
  for (const r of competitors.slice(0, 3)) {
    const content = await fetchWithCache(r.url);
    if (!content || content.length < 200) continue;

    // 4. Send to LLM for structured extraction
    const extracted = await extractWithLLM(content, pillarTopic, r.url);
    candidates.push(...extracted);

    // Rate limit
    await delay(1000);
  }

  console.log(`    [discover] Competitor audit found ${candidates.length} raw candidates`);
  return candidates;
}

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
  }
): { score: number; signals: CandidateSignals } {
  // brave_result_count: 0 results → 0, 1-2 → 8, 3-4 → 14, 5+ → 20
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

  // freshness_bonus: appeared in recent Brave results
  const freshnessScore = signals.hasFreshResults ? 10 : 0;

  const totalScore = braveScore + relatedScore + competitorScore + relevanceScore + intentScore + freshnessScore;

  return {
    score: Math.min(totalScore, 100),
    signals: {
      brave_result_count: signals.braveResultCount,
      related_search_hit: signals.relatedSearchHit,
      competitor_coverage: signals.competitorCount,
      cluster_relevance: relevanceScore > 0,
      intent_clarity: hasIntentClarity,
      freshness_bonus: signals.hasFreshResults,
    },
  };
}

// ============================================================
// Slug generation
// ============================================================

function slugify(text: string): string {
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

export async function discoverForCluster(cluster: ClusterForDiscovery): Promise<ScoredCandidate[]> {
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
  }>();

  // ---- Stage 1: Brave Search Signals ----
  console.log(`  [discover] Stage 1: Brave Search queries...`);
  const queries = buildDiscoveryQueries(pillar_topic);

  for (const q of queries) {
    console.log(`    [discover] Query: "${q.query}"`);
    const result = await braveSearchWithSignals(q.query);

    // Process related searches
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
        });
      }
    }

    // Process discussion titles as FAQ candidates
    for (const disc of result.discussions) {
      const raw: RawCandidate = {
        type: 'faq',
        raw_text: disc,
        extracted_name: null,
        source: `brave-${q.signal}-discussion`,
        source_url: null,
      };

      const slug = candidateSlug('faq', raw, pillar_topic);
      if (existingSlugs.has(slug) || dismissedSlugs.has(slug)) continue;

      if (!candidateMap.has(slug)) {
        candidateMap.set(slug, {
          raw,
          braveResultCount: result.result_count,
          relatedSearchHit: false,
          competitorCount: 0,
          hasFreshResults: false,
        });
      }
    }

    // Rate limit between Brave queries
    await delay(1000);
  }

  console.log(`    [discover] Stage 1 found ${candidateMap.size} raw candidates from Brave`);

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
      });
    }
  }

  console.log(`    [discover] After Stage 2: ${candidateMap.size} total unique candidates`);

  // ---- Stage 3: Scoring & Filtering ----
  console.log(`  [discover] Stage 3: Scoring...`);
  const scored: ScoredCandidate[] = [];

  for (const [slug, entry] of Array.from(candidateMap.entries())) {
    const { score, signals } = scoreCandidate(entry.raw, {
      braveResultCount: entry.braveResultCount,
      relatedSearchHit: entry.relatedSearchHit,
      competitorCount: entry.competitorCount,
      topicSlug: topic_slug,
      hasFreshResults: entry.hasFreshResults,
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

  console.log(`  [discover] Stage 3: ${scored.length} candidates above threshold (dropped ${candidateMap.size - scored.length} below 30)`);

  // Log summary by tier
  const high = scored.filter(c => c.score >= 70).length;
  const moderate = scored.filter(c => c.score >= 40 && c.score < 70).length;
  const low = scored.filter(c => c.score < 40).length;
  console.log(`    High priority (70+): ${high}, Moderate (40-69): ${moderate}, Low signal (30-39): ${low}`);

  return scored;
}

// ============================================================
// Helpers
// ============================================================

function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
