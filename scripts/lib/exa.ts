import 'dotenv/config';

// ── Config ──

export interface ExaConfig {
  apiKey: string;
  timeoutMs?: number;        // default: 15_000
  defaultNumResults?: number; // default: 10
}

// ── Content Options (shared across search/contents/findSimilar) ──

export interface ExaContentOptions {
  text?: boolean | { maxCharacters?: number };
  highlights?: boolean | { query?: string; maxCharacters?: number };
  summary?: boolean | { query?: string };
}

// ── Search Result ──

export interface ExaSearchResult {
  url: string;
  title: string;
  published_date: string | null;
  author: string | null;
  text?: string;
  highlights?: string[];
  summary?: string;
}

// ── Function Return Types ──

export interface SemanticSearchResult {
  query: string;
  results: ExaSearchResult[];
}

export interface PageContent {
  url: string;
  title: string;
  text: string;
  summary?: string;
  word_count: number;
  status: 'success' | 'error';
  error?: string;
}

export interface ContentsResult {
  urls: string[];
  pages: PageContent[];
  failed: Array<{ url: string; error: string }>;
}

export interface CompetitorPage {
  url: string;
  title: string;
  published_date: string | null;
  text?: string;
  summary?: string;
  word_count: number;
}

export interface CompetitorAnalysis {
  source_url: string;
  competitors: CompetitorPage[];
  coverage_gaps: string[];
  common_themes: string[];
}

// ── Options Types ──

export interface SemanticSearchOptions {
  numResults?: number;
  type?: 'auto' | 'neural';
  contents?: ExaContentOptions;
  startPublishedDate?: string;
  endPublishedDate?: string;
  includeDomains?: string[];
  excludeDomains?: string[];
  category?: 'news' | 'research paper' | 'company' | 'tweet';
}

export interface GetContentsOptions {
  text?: boolean | { maxCharacters?: number };
  summary?: boolean | { query?: string };
  livecrawlTimeout?: number;
}

export interface CompetitorAnalysisOptions {
  numResults?: number;
  excludeDomains?: string[];
  contents?: ExaContentOptions;
}

// ── Raw Exa API Response Types ──

interface ExaRawSearchResult {
  url: string;
  title: string;
  publishedDate: string | null;
  author: string | null;
  text?: string;
  highlights?: string[];
  summary?: string;
}

interface ExaSearchResponse {
  requestId: string;
  results: ExaRawSearchResult[];
}

interface ExaContentsResponse {
  results: Array<{
    id: string;
    url?: string;
    title?: string;
    text?: string;
    summary?: string;
    image?: string;
    favicon?: string;
  }>;
  statuses?: Array<{
    id: string;
    status: 'success' | 'error';
    error?: {
      tag: string;
      httpStatusCode?: number;
    };
  }>;
}

// ── Error ──

export class ExaAPIError extends Error {
  constructor(
    public readonly status: number,
    public readonly body: string,
  ) {
    super(`Exa API error ${status}: ${body}`);
    this.name = 'ExaAPIError';
  }
}

// ── Internal Config ──

let config: ExaConfig = {
  apiKey: process.env.EXA_API_KEY ?? '',
  timeoutMs: 15_000,
  defaultNumResults: 10,
};

export function setExaConfig(c: Partial<ExaConfig>): void {
  config = { ...config, ...c };
}

// ── Internal HTTP Helper ──

async function _post<T>(endpoint: string, body: Record<string, unknown>): Promise<T> {
  const res = await fetch(`https://api.exa.ai${endpoint}`, {
    method: 'POST',
    headers: {
      'x-api-key': config.apiKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(config.timeoutMs ?? 15_000),
  });

  if (!res.ok) {
    throw new ExaAPIError(res.status, await res.text());
  }

  return res.json() as Promise<T>;
}

// ── Word Count (CJK-aware) ──

export function countWords(text: string): number {
  const cjkChars = (text.match(/[\u4e00-\u9fff\u3400-\u4dbf\uF900-\uFAFF]/g) ?? []).length;
  const nonCjk = text.replace(/[\u4e00-\u9fff\u3400-\u4dbf\uF900-\uFAFF]/g, ' ');
  const latinWords = nonCjk.split(/\s+/).filter(Boolean).length;
  return cjkChars + latinWords;
}

// ── Helpers for empty results ──

function emptySearchResult(query: string): SemanticSearchResult {
  return { query, results: [] };
}

function emptyContents(urls: string[]): ContentsResult {
  return { urls, pages: [], failed: [] };
}

function emptyCompetitorAnalysis(sourceUrl: string): CompetitorAnalysis {
  return { source_url: sourceUrl, competitors: [], coverage_gaps: [], common_themes: [] };
}

// ── Helper: build contents body ──

function buildContentsBody(contents?: ExaContentOptions): Record<string, unknown> {
  if (!contents) return {};
  const body: Record<string, unknown> = {};
  if (contents.text !== undefined) {
    body.contents = { ...((body.contents as Record<string, unknown>) ?? {}), text: contents.text };
  }
  if (contents.highlights !== undefined) {
    body.contents = { ...((body.contents as Record<string, unknown>) ?? {}), highlights: contents.highlights };
  }
  if (contents.summary !== undefined) {
    body.contents = { ...((body.contents as Record<string, unknown>) ?? {}), summary: contents.summary };
  }
  return body;
}

// ── Public Functions ──

/** 4.1 — Semantic search via Exa */
export async function semanticSearch(
  query: string,
  opts?: SemanticSearchOptions,
): Promise<SemanticSearchResult> {
  if (!config.apiKey) {
    console.warn('EXA_API_KEY not set, returning empty search result');
    return emptySearchResult(query);
  }

  const contents = opts?.contents ?? { text: { maxCharacters: 2000 } };
  const contentsBody = buildContentsBody(contents);

  const body: Record<string, unknown> = {
    query,
    type: opts?.type ?? 'auto',
    numResults: opts?.numResults ?? config.defaultNumResults ?? 10,
    excludeDomains: opts?.excludeDomains ?? ['loreai.dev'],
    ...contentsBody,
  };

  if (opts?.startPublishedDate) body.startPublishedDate = opts.startPublishedDate;
  if (opts?.endPublishedDate) body.endPublishedDate = opts.endPublishedDate;
  if (opts?.includeDomains) body.includeDomains = opts.includeDomains;
  if (opts?.category) body.category = opts.category;

  const data = await _post<ExaSearchResponse>('/search', body);

  return {
    query,
    results: (data.results ?? []).map((r) => ({
      url: r.url,
      title: r.title,
      published_date: r.publishedDate ?? null,
      author: r.author ?? null,
      text: r.text,
      highlights: r.highlights,
      summary: r.summary,
    })),
  };
}

/** 4.2 — Get contents (full page text) from URLs */
export async function getContents(
  urls: string[],
  opts?: GetContentsOptions,
): Promise<ContentsResult> {
  if (!config.apiKey) {
    console.warn('EXA_API_KEY not set, returning empty contents result');
    return emptyContents(urls);
  }

  if (urls.length === 0) {
    return emptyContents(urls);
  }

  const body: Record<string, unknown> = {
    ids: urls,
    text: opts?.text ?? { maxCharacters: 5000 },
  };

  if (opts?.summary !== undefined) body.summary = opts.summary;
  if (opts?.livecrawlTimeout !== undefined) body.livecrawlTimeout = opts.livecrawlTimeout;

  const data = await _post<ExaContentsResponse>('/contents', body);

  // Build status map from statuses array
  const statusMap = new Map<string, { status: string; error?: string }>();
  for (const s of data.statuses ?? []) {
    statusMap.set(s.id, {
      status: s.status,
      error: s.error ? `${s.error.tag}${s.error.httpStatusCode ? ` (${s.error.httpStatusCode})` : ''}` : undefined,
    });
  }

  const pages: PageContent[] = [];
  const failed: Array<{ url: string; error: string }> = [];

  for (const r of data.results ?? []) {
    const url = r.id ?? r.url ?? '';
    const statusInfo = statusMap.get(url);

    if (statusInfo?.status === 'error') {
      failed.push({ url, error: statusInfo.error ?? 'Unknown error' });
      continue;
    }

    const text = r.text ?? '';
    pages.push({
      url,
      title: r.title ?? '',
      text,
      summary: r.summary,
      word_count: countWords(text),
      status: 'success',
    });
  }

  // URLs that aren't in results at all — mark as failed
  const seenUrls = new Set([...pages.map((p) => p.url), ...failed.map((f) => f.url)]);
  for (const url of urls) {
    if (!seenUrls.has(url)) {
      const statusInfo = statusMap.get(url);
      if (statusInfo?.status === 'error') {
        failed.push({ url, error: statusInfo.error ?? 'Unknown error' });
      } else {
        failed.push({ url, error: 'Not returned in results' });
      }
    }
  }

  return { urls, pages, failed };
}

/** 4.3 — Analyze competitors via findSimilar */
export async function analyzeCompetitors(
  sourceUrl: string,
  opts?: CompetitorAnalysisOptions,
): Promise<CompetitorAnalysis> {
  if (!config.apiKey) {
    console.warn('EXA_API_KEY not set, returning empty competitor analysis');
    return emptyCompetitorAnalysis(sourceUrl);
  }

  const contents = opts?.contents ?? { text: { maxCharacters: 2000 }, summary: true };
  const contentsBody = buildContentsBody(contents);

  const body: Record<string, unknown> = {
    url: sourceUrl,
    numResults: opts?.numResults ?? config.defaultNumResults ?? 10,
    excludeDomains: opts?.excludeDomains ?? ['loreai.dev'],
    ...contentsBody,
  };

  const data = await _post<ExaSearchResponse>('/findSimilar', body);

  const competitors: CompetitorPage[] = (data.results ?? []).map((r) => ({
    url: r.url,
    title: r.title,
    published_date: r.publishedDate ?? null,
    text: r.text,
    summary: r.summary,
    word_count: countWords(r.text ?? ''),
  }));

  return {
    source_url: sourceUrl,
    competitors,
    coverage_gaps: [],
    common_themes: [],
  };
}
