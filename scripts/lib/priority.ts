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

// ── Volume Proxy (A) ──

/** When no search_volume data exists, use group keyword count as proxy */
export const VOLUME_PER_GROUP_KEYWORD = 8;

// ── Junk Detection (B) ──

export const JUNK_KEYWORD_PATTERNS: RegExp[] = [
  /^#/,                                         // hashtag prefix
  /^\d+\.\d+\s/,                               // doc section header "4.1 create..."
  /trusted by.*(more than\s*)?\d/i,            // ad copy metrics
  /\d{1,3},\d{3}.*businesses/i,               // "60,000 businesses"
  /watch\s+(product\s+)?demo/i,                // CTA
  /^(sign up|get started|download now|try free|start.*trial)$/i,
  /^not just for/i,                            // marketing fluff
  /^mac & ios$/i,                              // platform listing
  /^desktop app download$/i,                   // generic CTA
  /^git provider support$/i,                   // generic nav label
  // Ancient manuscripts (wrong "codex")
  /\b(vaticanus|sinaiticus|gigas|aztec|christianity|manuscript)\b/i,
  /^codex (books|definition)$/i,
  // Other products entirely
  /\b(outlook 365?|outlook)\b.*\b(task|recurring|schedule)\b/i,
  /\brecurring task.*(planner|project|outlook)\b/i,
  /\bschedule.*recurring.*(planner|project)\b/i,
  /\binstallation process of windows\b/i,
  /\bsetup installation windows\b/i,
  /\bwindows installation.*step by step\b/i,
  /\bwindows installation setup is starting\b/i,
  /\b(google|microsoft) authenticator\b/i,
  /\blogin[\s.]?gov\b/i,
  /\bwordpress plugin development\b/i,
  /\bturn on two-factor.*apple\b/i,
  /\bdelete login gov\b/i,
  /\bjira cloud\b/i,
  /\b6 figure\b/i,
  // Scraped article titles / press release headlines
  /^openai (launches|introduces)\b/i,
  /\bprinting house ltd\b/i,
  /\bcomprendiendo las directrices\b/i,        // Spanish article title
];

export const NON_ENGLISH_INDICATORS: RegExp[] = [
  /\bcomo\s+(o|a|el|la|os|as)\b/i,            // Portuguese/Spanish
  /\bfunciona\b/i,                             // Portuguese/Spanish
  /\bwarum\b/i,                                // German
  /\bcomment\s+\w+\s+fonctionne/i,            // French
  /\bintroducing the gemini\b/i,               // competitor press release title
];

export const COMPETITOR_NAV_BRANDS: string[] = [
  'teamviewer', 'realvnc', 'anydesk',
  'databricks workflows', 'cybersecurity webinars',
  'linear slack community', 'github copilot computer use',
];

/**
 * Returns true if the keyword group is junk and should be pruned.
 */
export function isJunkGroup(primaryKeyword: string, intent: string): boolean {
  const kw = primaryKeyword.toLowerCase().trim();

  for (const pattern of JUNK_KEYWORD_PATTERNS) {
    if (pattern.test(kw)) return true;
  }

  for (const pattern of NON_ENGLISH_INDICATORS) {
    if (pattern.test(kw)) return true;
  }

  // Navigational to competitor brands
  if (intent === 'navigational') {
    for (const brand of COMPETITOR_NAV_BRANDS) {
      if (kw.includes(brand)) return true;
    }
  }

  return false;
}

// ── Off-Topic Relevance Filter ──

/** Product and topic terms that indicate a keyword is relevant to our site */
const RELEVANT_TERMS: string[] = [
  'claude', 'codex', 'anthropic', 'loreai',
  'mcp', 'model context protocol',
  'cursor', 'copilot', 'windsurf', 'cline', 'github copilot', // competitors (for compare)
  'ai coding', 'ai agent', 'ai tool', 'ai assistant',
  'hooks', 'subagent', 'worktree', 'skill.md', 'agents.md', 'claude.md',
  'output style', 'plan mode', 'prompt engineering',
];

/**
 * Clusters where generic (non-product-mentioning) keywords are common
 * and should be filtered. Keywords in these clusters MUST mention a
 * RELEVANT_TERM to be kept.
 */
const POLLUTED_CLUSTERS: string[] = [
  'claude-code-authentication',
  'claude-code-ci-cd-integration',
  'claude-code-cli-reference',
  'claude-code-permissions',
  'claude-code-ide-integrations',
  'claude-code-scheduled-tasks',
  'claude-code-slack-linear-integrations',
  'claude-code-remote-control',
  'claude-code-git-workflow',
  'claude-code-parallel-sessions',
  'claude-code-plugins',
  'claude-code-desktop-app',
  'claude-code-installation-setup',
  'claude-code-non-technical-use-cases',
  'claude-code-plan-mode',
  'claude-code-computer-use',
  'claude-code-cost-pricing',
  'claude-code-common-workflows',
  'codex',
  'codex-cli',
  'codex-security',
  'codex-openai',
];

/**
 * Returns true if a keyword is off-topic for our site.
 * For "polluted" clusters, requires the keyword to mention a relevant product term.
 */
export function isOffTopicForSite(primaryKeyword: string, clusterSlug: string | null): boolean {
  if (!clusterSlug) return false;

  // Only filter polluted clusters
  if (!POLLUTED_CLUSTERS.includes(clusterSlug)) return false;

  const kw = primaryKeyword.toLowerCase().trim();

  // If keyword mentions any relevant term, keep it
  for (const term of RELEVANT_TERMS) {
    if (kw.includes(term)) return false;
  }

  // For codex clusters, "codex" in the keyword is enough to keep it
  if (clusterSlug.startsWith('codex') && kw.includes('codex')) return false;

  // Keyword is in a polluted cluster but doesn't mention any product → off-topic
  return true;
}

// ── Cluster Diversity (D) ──

export const CLUSTER_DIVERSITY_TIERS: { maxRank: number; multiplier: number }[] = [
  { maxRank: 5, multiplier: 1.0 },
  { maxRank: 10, multiplier: 0.7 },
  { maxRank: 20, multiplier: 0.4 },
  { maxRank: Infinity, multiplier: 0.2 },
];

/**
 * Returns a multiplier (0..1) based on how many items from this cluster
 * are already ahead in the queue. Rank 1 = first item, no penalty.
 */
export function getClusterDiversityMultiplier(rankInCluster: number): number {
  for (const tier of CLUSTER_DIVERSITY_TIERS) {
    if (rankInCluster <= tier.maxRank) return tier.multiplier;
  }
  return 0.2;
}

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
  if (volumes.length > 0) return Math.max(...volumes);
  // (A) Proxy: group size indicates breadth of search interest
  return Math.max(DEFAULT_VOLUME, keywords.length * VOLUME_PER_GROUP_KEYWORD);
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
        research_pipeline: 'standard',
        routing_reason: 'SERP depth override: top results are long-form, upgraded faq → blog',
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
        research_pipeline: 'standard',
        routing_reason: 'informational blog → standard pipeline (web search)',
      };
    default:
      return {
        content_type: contentType,
        research_pipeline: 'standard',
        routing_reason: `fallback: unknown content_type "${contentType}" → standard pipeline`,
      };
  }
}
