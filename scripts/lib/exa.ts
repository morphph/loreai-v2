/**
 * scripts/lib/exa.ts — Exa Search API client
 *
 * Provides semantic search and findSimilar for discovery pipeline.
 * Used by Stage 1.5 (semantic gap discovery), Stage 2 (competitor audit),
 * and source grounding (source-fetch.ts).
 */

export interface ExaSearchResult {
  requestId: string;
  results: Array<{
    url: string;
    title: string;
    id: string;
    text?: string;
    highlights?: string[];
    highlightScores?: number[];
    publishedDate?: string;
    author?: string;
    summary?: string;
  }>;
}

interface ExaOptions {
  numResults?: number;
  includeDomains?: string[];
  excludeDomains?: string[];
  startPublishedDate?: string;
  contents?: {
    text?: { maxCharacters?: number };
    highlights?: { maxCharacters?: number; query?: string };
  };
}

const EMPTY_RESULT: ExaSearchResult = { requestId: '', results: [] };

async function exaRequest(endpoint: string, body: Record<string, unknown>): Promise<ExaSearchResult> {
  const apiKey = process.env.EXA_API_KEY;
  if (!apiKey) return EMPTY_RESULT;

  try {
    const res = await fetch(`https://api.exa.ai/${endpoint}`, {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      console.warn(`    [exa] API error (${endpoint}): ${res.status}`);
      return EMPTY_RESULT;
    }

    return await res.json() as ExaSearchResult;
  } catch (err) {
    console.warn(`    [exa] Request failed (${endpoint}): ${(err as Error).message}`);
    return EMPTY_RESULT;
  }
}

export async function exaSearch(query: string, options?: ExaOptions): Promise<ExaSearchResult> {
  const body: Record<string, unknown> = { query };
  if (options?.numResults) body.numResults = options.numResults;
  if (options?.includeDomains) body.includeDomains = options.includeDomains;
  if (options?.excludeDomains) body.excludeDomains = options.excludeDomains;
  if (options?.startPublishedDate) body.startPublishedDate = options.startPublishedDate;
  if (options?.contents) body.contents = options.contents;
  return exaRequest('search', body);
}

export async function exaFindSimilar(url: string, options?: ExaOptions): Promise<ExaSearchResult> {
  const body: Record<string, unknown> = { url };
  if (options?.numResults) body.numResults = options.numResults;
  if (options?.includeDomains) body.includeDomains = options.includeDomains;
  if (options?.excludeDomains) body.excludeDomains = options.excludeDomains;
  if (options?.contents) body.contents = options.contents;
  return exaRequest('findSimilar', body);
}
