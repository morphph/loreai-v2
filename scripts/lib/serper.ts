/**
 * scripts/lib/serper.ts — Serper.dev Google Search API client
 *
 * Returns Google's People Also Ask (PAA) and Related Searches as structured JSON.
 * Used by discovery pipeline Stage 1 to replace broken Brave related_searches.
 */

export interface SerperResult {
  peopleAlsoAsk: Array<{ question: string; snippet: string; title: string; link: string }>;
  relatedSearches: Array<{ query: string }>;
  organic: Array<{ title: string; link: string; snippet: string; position: number; date?: string }>;
}

const EMPTY_RESULT: SerperResult = { peopleAlsoAsk: [], relatedSearches: [], organic: [] };

export async function serperSearch(query: string): Promise<SerperResult> {
  const apiKey = process.env.SERPER_API_KEY;
  if (!apiKey) return EMPTY_RESULT;

  try {
    const res = await fetch('https://google.serper.dev/search', {
      method: 'POST',
      headers: {
        'X-API-KEY': apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ q: query, num: 10 }),
    });

    if (!res.ok) {
      console.warn(`    [serper] API error: ${res.status}`);
      return EMPTY_RESULT;
    }

    const data = await res.json();
    return {
      peopleAlsoAsk: data.peopleAlsoAsk ?? [],
      relatedSearches: data.relatedSearches ?? [],
      organic: data.organic ?? [],
    };
  } catch (err) {
    console.warn(`    [serper] Request failed: ${(err as Error).message}`);
    return EMPTY_RESULT;
  }
}
