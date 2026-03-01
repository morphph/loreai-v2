import 'dotenv/config';

export interface TrendSignal {
  topic: string;
  has_search_demand: boolean;
  related_keywords: string[];
  discussions: string[];
  result_count: number;
}

export async function validateAndExpand(topic: string): Promise<TrendSignal> {
  const apiKey = process.env.BRAVE_SEARCH_API_KEY;
  if (!apiKey) {
    console.warn('BRAVE_SEARCH_API_KEY not set, returning empty signal');
    return {
      topic,
      has_search_demand: false,
      related_keywords: [],
      discussions: [],
      result_count: 0,
    };
  }

  const url = `https://api.search.brave.com/res/v1/web/search?q=${encodeURIComponent(topic)}&count=5`;
  const res = await fetch(url, {
    headers: {
      'X-Subscription-Token': apiKey,
      Accept: 'application/json',
    },
  });

  if (!res.ok) {
    console.warn(`Brave Search API error for "${topic}": ${res.status}`);
    return {
      topic,
      has_search_demand: false,
      related_keywords: [],
      discussions: [],
      result_count: 0,
    };
  }

  const data = await res.json();
  const resultCount = data.web?.results?.length ?? 0;

  return {
    topic,
    has_search_demand: resultCount > 3,
    related_keywords: data.query?.related_searches?.map((r: { query: string }) => r.query) ?? [],
    discussions: data.discussions?.results?.map((d: { title: string }) => d.title) ?? [],
    result_count: resultCount,
  };
}

export async function batchValidate(
  topics: string[],
  delayMs: number = 1000
): Promise<TrendSignal[]> {
  const results: TrendSignal[] = [];
  for (const topic of topics) {
    results.push(await validateAndExpand(topic));
    if (delayMs > 0) await new Promise((r) => setTimeout(r, delayMs));
  }
  return results;
}
