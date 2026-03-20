import 'dotenv/config';

// ── Config ──

export interface SerperConfig {
  apiKey: string;
  defaultGl?: string;   // default: "us"
  defaultHl?: string;   // default: "en"
  timeoutMs?: number;    // default: 10_000
}

// ── Shared ──

export interface PAAItem {
  question: string;
  snippet: string;
  title: string;
  link: string;
}

export interface OrganicResult {
  title: string;
  link: string;
  snippet: string;
  position: number;
  date?: string;
}

// ── Function Return Types ──

export interface PAAResult {
  query: string;
  questions: PAAItem[];
}

export interface RelatedResult {
  query: string;
  related: string[];
}

export interface AutocompleteResult {
  query: string;
  suggestions: string[];
}

export interface VolumeEstimate {
  query: string;
  estimated_volume: 'high' | 'medium' | 'low' | 'very_low';
  signals: {
    has_answer_box: boolean;
    has_knowledge_graph: boolean;
    has_paa: boolean;
    organic_count: number;
    has_ads: boolean;
  };
}

export type SERPDepth = 'short_answer' | 'long_form' | 'mixed';

export interface SERPDepthResult {
  query: string;
  depth: SERPDepth;
  avg_snippet_length: number;
  has_answer_box: boolean;
  has_knowledge_graph: boolean;
  top_results: Array<{
    title: string;
    link: string;
    snippet_length: number;
  }>;
  recommended_content_type: 'faq' | 'blog' | 'compare' | 'glossary' | 'cornerstone';
}

// ── Raw Serper API Response Types ──

export interface SerperSearchResponse {
  searchParameters: { q: string; gl: string; hl: string; type: string };
  answerBox?: { answer?: string; snippet?: string; title?: string; link?: string };
  knowledgeGraph?: { title: string; type: string; description: string; attributes: Record<string, string> };
  organic: Array<{ title: string; link: string; snippet: string; position: number; date?: string }>;
  peopleAlsoAsk?: Array<{ question: string; snippet: string; title: string; link: string }>;
  relatedSearches?: Array<{ query: string }>;
}

interface SerperAutocompleteResponse {
  searchParameters: { q: string; type: string };
  suggestions: Array<{ value: string }>;
}

// ── Error ──

export class SerperAPIError extends Error {
  constructor(
    public readonly status: number,
    public readonly body: string,
  ) {
    super(`Serper API error ${status}: ${body}`);
    this.name = 'SerperAPIError';
  }
}

// ── Internal Config ──

let config: SerperConfig = {
  apiKey: process.env.SERPER_API_KEY ?? '',
  defaultGl: 'us',
  defaultHl: 'en',
  timeoutMs: 10_000,
};

export function setSerperConfig(c: Partial<SerperConfig>): void {
  config = { ...config, ...c };
}

// ── Internal HTTP Helper ──

async function _post<T>(endpoint: string, body: Record<string, unknown>): Promise<T> {
  const res = await fetch(`https://google.serper.dev${endpoint}`, {
    method: 'POST',
    headers: {
      'X-API-KEY': config.apiKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(config.timeoutMs ?? 10_000),
  });

  if (!res.ok) {
    throw new SerperAPIError(res.status, await res.text());
  }

  return res.json() as Promise<T>;
}

// ── Internal: shared web search (PAA + related + organic in one call) ──

async function _searchWeb(
  query: string,
  opts?: { gl?: string; hl?: string; num?: number },
): Promise<SerperSearchResponse> {
  return _post<SerperSearchResponse>('/search', {
    q: query,
    gl: opts?.gl ?? config.defaultGl,
    hl: opts?.hl ?? config.defaultHl,
    num: opts?.num ?? 10,
  });
}

// ── Helpers for empty results ──

function emptyPAA(query: string): PAAResult {
  return { query, questions: [] };
}

function emptyRelated(query: string): RelatedResult {
  return { query, related: [] };
}

function emptyAutocomplete(query: string): AutocompleteResult {
  return { query, suggestions: [] };
}

function emptyVolumeEstimate(query: string): VolumeEstimate {
  return {
    query,
    estimated_volume: 'very_low',
    signals: {
      has_answer_box: false,
      has_knowledge_graph: false,
      has_paa: false,
      organic_count: 0,
      has_ads: false,
    },
  };
}

function emptySERPDepth(query: string): SERPDepthResult {
  return {
    query,
    depth: 'mixed',
    avg_snippet_length: 0,
    has_answer_box: false,
    has_knowledge_graph: false,
    top_results: [],
    recommended_content_type: 'faq',
  };
}

// ── Public Functions ──

/** 4.1 — Extract People Also Ask questions from SERP */
export async function searchPAA(
  query: string,
  opts?: { gl?: string; hl?: string },
): Promise<PAAResult> {
  if (!config.apiKey) {
    console.warn('SERPER_API_KEY not set, returning empty PAA result');
    return emptyPAA(query);
  }

  const data = await _searchWeb(query, opts);
  return {
    query,
    questions: (data.peopleAlsoAsk ?? []).map((item) => ({
      question: item.question,
      snippet: item.snippet,
      title: item.title,
      link: item.link,
    })),
  };
}

/** 4.2 — Extract related searches from SERP */
export async function searchRelated(
  query: string,
  opts?: { gl?: string; hl?: string },
): Promise<RelatedResult> {
  if (!config.apiKey) {
    console.warn('SERPER_API_KEY not set, returning empty related result');
    return emptyRelated(query);
  }

  const data = await _searchWeb(query, opts);
  return {
    query,
    related: (data.relatedSearches ?? []).map((item) => item.query),
  };
}

/** 4.3 — Get autocomplete suggestions */
export async function searchAutocomplete(
  query: string,
  opts?: { gl?: string; hl?: string },
): Promise<AutocompleteResult> {
  if (!config.apiKey) {
    console.warn('SERPER_API_KEY not set, returning empty autocomplete result');
    return emptyAutocomplete(query);
  }

  const data = await _post<SerperAutocompleteResponse>('/autocomplete', {
    q: query,
    gl: opts?.gl ?? config.defaultGl,
    hl: opts?.hl ?? config.defaultHl,
  });

  return {
    query,
    suggestions: (data.suggestions ?? []).map((s) => s.value),
  };
}

/** 4.4 — Estimate search volume from SERP signals */
export async function estimateVolume(
  query: string,
  opts?: { gl?: string; hl?: string },
): Promise<VolumeEstimate> {
  if (!config.apiKey) {
    console.warn('SERPER_API_KEY not set, returning empty volume estimate');
    return emptyVolumeEstimate(query);
  }

  const data = await _searchWeb(query, opts);

  const hasAnswerBox = !!data.answerBox;
  const hasKnowledgeGraph = !!data.knowledgeGraph;
  const paaCount = data.peopleAlsoAsk?.length ?? 0;
  const hasPaa = paaCount >= 1;
  const organicCount = data.organic?.length ?? 0;
  const hasAds = false; // Serper web search doesn't return ads in standard response

  const signals = {
    has_answer_box: hasAnswerBox,
    has_knowledge_graph: hasKnowledgeGraph,
    has_paa: hasPaa,
    organic_count: organicCount,
    has_ads: hasAds,
  };

  let estimated_volume: VolumeEstimate['estimated_volume'];

  if (hasAnswerBox && paaCount >= 3 && organicCount >= 10) {
    estimated_volume = 'high';
  } else if (paaCount >= 2 && organicCount >= 8) {
    estimated_volume = 'medium';
  } else if (paaCount >= 1 || organicCount >= 5) {
    estimated_volume = 'low';
  } else {
    estimated_volume = 'very_low';
  }

  return { query, estimated_volume, signals };
}

/** 4.5 — Detect SERP depth and recommend content type */
export async function detectSERPDepth(
  query: string,
  opts?: { gl?: string; hl?: string },
): Promise<SERPDepthResult> {
  if (!config.apiKey) {
    console.warn('SERPER_API_KEY not set, returning empty SERP depth result');
    return emptySERPDepth(query);
  }

  const data = await _searchWeb(query, opts);

  const hasAnswerBox = !!data.answerBox;
  const hasKnowledgeGraph = !!data.knowledgeGraph;

  const top5 = (data.organic ?? []).slice(0, 5);
  const topResults = top5.map((r) => ({
    title: r.title,
    link: r.link,
    snippet_length: r.snippet?.length ?? 0,
  }));

  const avgSnippetLength =
    topResults.length > 0
      ? topResults.reduce((sum, r) => sum + r.snippet_length, 0) / topResults.length
      : 0;

  const lowerQuery = query.toLowerCase();

  // Routing rules per spec §4.5
  let depth: SERPDepth;
  let recommended_content_type: SERPDepthResult['recommended_content_type'];

  if (/\b(vs|alternative|compare)\b/.test(lowerQuery)) {
    depth = 'mixed';
    recommended_content_type = 'compare';
  } else if (
    /\b(what is|meaning|definition)\b/.test(lowerQuery) &&
    avgSnippetLength < 200
  ) {
    depth = 'short_answer';
    recommended_content_type = 'glossary';
  } else if (hasAnswerBox && avgSnippetLength < 150) {
    depth = 'short_answer';
    recommended_content_type = 'faq';
  } else if (avgSnippetLength > 300) {
    depth = 'long_form';
    recommended_content_type = 'blog';
  } else {
    depth = 'mixed';
    recommended_content_type = 'faq';
  }

  return {
    query,
    depth,
    avg_snippet_length: Math.round(avgSnippetLength),
    has_answer_box: hasAnswerBox,
    has_knowledge_graph: hasKnowledgeGraph,
    top_results: topResults,
    recommended_content_type,
  };
}

/** 4.6 — Full search response (low-level wrapper) */
export async function searchFull(
  query: string,
  opts?: { gl?: string; hl?: string; num?: number },
): Promise<SerperSearchResponse> {
  if (!config.apiKey) {
    console.warn('SERPER_API_KEY not set, returning empty search response');
    return {
      searchParameters: {
        q: query,
        gl: opts?.gl ?? config.defaultGl ?? 'us',
        hl: opts?.hl ?? config.defaultHl ?? 'en',
        type: 'search',
      },
      organic: [],
    };
  }

  return _searchWeb(query, opts);
}

/** 4.7 — Batch PAA search with delay between calls */
export async function batchSearch(
  queries: string[],
  delayMs: number = 200,
): Promise<PAAResult[]> {
  const results: PAAResult[] = [];
  for (const query of queries) {
    results.push(await searchPAA(query));
    if (delayMs > 0 && query !== queries[queries.length - 1]) {
      await new Promise((r) => setTimeout(r, delayMs));
    }
  }
  return results;
}
