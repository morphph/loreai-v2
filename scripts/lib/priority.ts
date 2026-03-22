/**
 * B3 — Priority Scoring + Queue Routing (Pure Logic)
 *
 * All functions are pure — zero side effects, zero API calls.
 * All inputs come via parameters; all tuning constants are exported.
 *
 * @see docs/plans/specs/SPEC-B3-priority-scoring.md
 */

// ── Types ──

/** Input to the scoring function — pure data, no DB dependency */
export interface ScoringInput {
  group_id: number;
  primary_keyword: string;
  intent: string;
  content_type: string;           // B2's suggestion
  cluster_slug: string | null;
  keywords: GroupKeyword[];       // All keywords in this group (with volume/competition)
  event_age_hours: number | null; // Hours since related news event, null if none
}

export interface GroupKeyword {
  keyword: string;
  search_volume: number | null;
  competition: string | null;
}

/** Output of scoring */
export interface ScoringResult {
  group_id: number;
  primary_keyword: string;
  priority_score: number;
  score_breakdown: {
    volume: number;
    competition_divisor: number;
    intent_multiplier: number;
    base_score: number;
    timeliness_bonus: number;
  };
}

/** Input to routing function */
export interface RoutingInput {
  intent: string;
  b2_content_type: string;
  serp_depth: 'short_answer' | 'long_form' | 'mixed' | null;
  recommended_content_type: string | null;
  cluster_page_count: number;
}

/** Output of routing */
export interface RoutingResult {
  content_type: string;
  research_pipeline: 'standard' | 'deep_research';
  routing_reason: string;
}

/** Combined result for queue entry */
export interface QueueEntry {
  group_id: number;
  primary_keyword: string;
  scoring: ScoringResult;
  routing: RoutingResult;
  deferred: boolean;       // true if topic-hub with < 15 pages
  already_queued: boolean;  // true if existing pending/in_progress job
}

/** Full run result */
export interface ScoringRunResult {
  groups_scored: number;
  groups_queued: number;
  groups_deferred: number;
  groups_already_queued: number;
  serp_api_calls: number;
  queue_entries: QueueEntry[];
}

// ── Constants (all tuning params in one place) ──

export const DEFAULT_VOLUME = 10;
export const MIN_VOLUME = 1;
export const DEFAULT_COMPETITION = 0.5;

export const COMPETITION_MAP: Record<string, number> = {
  low: 0.2,
  medium: 0.5,
  high: 1.0,
  very_high: 2.0,
};

export const INTENT_MULTIPLIER: Record<string, number> = {
  commercial: 3.0,
  informational: 1.5,
  definitional: 1.0,
  navigational: 0.5,
};
export const DEFAULT_INTENT_MULTIPLIER = 1.0;

export const TIMELINESS_MAX_BONUS = 5000;
export const TIMELINESS_FULL_HOURS = 48;
export const TIMELINESS_DECAY_HOURS = 168;

export const TOPIC_HUB_MIN_PAGES = 15;

// ── Pure Functions ──

/**
 * Get the effective volume for a keyword group.
 * Uses max(search_volume) across all keywords.
 * Falls back to DEFAULT_VOLUME if all volumes are null or zero.
 */
export function getGroupVolume(keywords: GroupKeyword[]): number {
  const volumes = keywords
    .map((kw) => kw.search_volume)
    .filter((v): v is number => v !== null && v > 0);
  if (volumes.length === 0) return DEFAULT_VOLUME;
  return Math.max(...volumes);
}

/**
 * Get the competition divisor for the scoring formula.
 * Maps text competition values to numeric divisors.
 * Lower divisor = lower competition = higher score.
 */
export function getCompetitionDivisor(competition: string | null): number {
  if (!competition) return DEFAULT_COMPETITION;
  return COMPETITION_MAP[competition] ?? DEFAULT_COMPETITION;
}

/**
 * Get the intent multiplier for the scoring formula.
 */
export function getIntentMultiplier(intent: string): number {
  return INTENT_MULTIPLIER[intent] ?? DEFAULT_INTENT_MULTIPLIER;
}

/**
 * Calculate timeliness bonus based on hours since the event.
 * Returns TIMELINESS_MAX_BONUS for events within 48h,
 * linearly decays to 0 between 48h and 168h (7 days),
 * returns 0 after 7 days.
 */
export function getTimelinessBonus(eventAgeHours: number | null): number {
  if (eventAgeHours === null) return 0;
  if (eventAgeHours < 0) return 0;
  if (eventAgeHours <= TIMELINESS_FULL_HOURS) return TIMELINESS_MAX_BONUS;
  if (eventAgeHours >= TIMELINESS_DECAY_HOURS) return 0;

  // Linear decay from FULL to DECAY
  const decayWindow = TIMELINESS_DECAY_HOURS - TIMELINESS_FULL_HOURS; // 120h
  const hoursIntoDecay = eventAgeHours - TIMELINESS_FULL_HOURS;
  return TIMELINESS_MAX_BONUS * (1 - hoursIntoDecay / decayWindow);
}

/**
 * Calculate priority score for a keyword group.
 * Formula: volume × (1/competition) × intent_multiplier + timeliness_bonus
 */
export function calculatePriorityScore(input: ScoringInput): ScoringResult {
  const volume = getGroupVolume(input.keywords);
  const competitionDivisor = getCompetitionDivisor(
    input.keywords.find((kw) => kw.keyword === input.primary_keyword)?.competition ?? null,
  );
  const intentMultiplier = getIntentMultiplier(input.intent);
  const timelinessBonus = getTimelinessBonus(input.event_age_hours);

  const baseScore = volume * (1 / competitionDivisor) * intentMultiplier;
  const totalScore = baseScore + timelinessBonus;

  return {
    group_id: input.group_id,
    primary_keyword: input.primary_keyword,
    priority_score: Math.round(totalScore * 100) / 100,
    score_breakdown: {
      volume,
      competition_divisor: competitionDivisor,
      intent_multiplier: intentMultiplier,
      base_score: Math.round(baseScore * 100) / 100,
      timeliness_bonus: Math.round(timelinessBonus * 100) / 100,
    },
  };
}

/**
 * Route a keyword group to content_type + research_pipeline.
 * SERP depth can override B2's content_type suggestion for informational intent.
 */
export function routeKeywordGroup(input: RoutingInput): RoutingResult {
  // Rule 1: SERP depth override (only for informational intent)
  if (input.serp_depth && input.intent === 'informational') {
    if (input.serp_depth === 'long_form' && input.b2_content_type === 'faq') {
      return {
        content_type: 'blog',
        research_pipeline: 'deep_research',
        routing_reason: 'SERP depth override: top results are long-form, upgraded faq → blog (deep research)',
      };
    }
  }

  // Rule 2: Content type → pipeline mapping (default)
  return routeByContentType(input.b2_content_type);
}

/**
 * Check if a topic-hub should be deferred (cluster has too few pages).
 */
export function shouldDeferTopicHub(contentType: string, clusterPageCount: number): boolean {
  return contentType === 'topic-hub' && clusterPageCount < TOPIC_HUB_MIN_PAGES;
}

// ── Internal Helpers ──

function routeByContentType(contentType: string): RoutingResult {
  switch (contentType) {
    case 'compare':
      return {
        content_type: 'compare',
        research_pipeline: 'standard',
        routing_reason: 'commercial intent → compare (standard pipeline)',
      };
    case 'faq':
      return {
        content_type: 'faq',
        research_pipeline: 'standard',
        routing_reason: 'question-form informational → faq (standard pipeline)',
      };
    case 'glossary':
      return {
        content_type: 'glossary',
        research_pipeline: 'standard',
        routing_reason: 'definitional intent → glossary (standard pipeline)',
      };
    case 'topic-hub':
      return {
        content_type: 'topic-hub',
        research_pipeline: 'standard',
        routing_reason: 'navigational → topic-hub (standard pipeline)',
      };
    case 'blog':
      return {
        content_type: 'blog',
        research_pipeline: 'deep_research',
        routing_reason: 'informational blog → deep research pipeline',
      };
    default:
      return {
        content_type: contentType,
        research_pipeline: 'standard',
        routing_reason: `fallback: unknown content_type "${contentType}" → standard pipeline`,
      };
  }
}
