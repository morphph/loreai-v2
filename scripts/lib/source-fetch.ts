/**
 * scripts/lib/source-fetch.ts — Shared source resolution for grounded generation
 *
 * Provides URL fetching with in-memory cache, Brave Search fallback,
 * and domain prioritization for cluster-mode SEO generation.
 */
import 'dotenv/config';
import { exaSearch } from './exa';

// In-memory cache — prevents duplicate fetches within a single run
const sourceCache = new Map<string, string>();

/**
 * Fetch URL content with in-memory caching.
 * Returns extracted text from the page, or empty string on failure.
 */
export async function fetchWithCache(url: string): Promise<string> {
  if (sourceCache.has(url)) {
    console.log(`    [source] cache hit: ${url}`);
    return sourceCache.get(url)!;
  }

  const content = await fetchUrlContent(url);
  if (content) {
    sourceCache.set(url, content);
    console.log(`    [source] fetched: ${url} (${content.length} chars)`);
  } else {
    console.warn(`    [source] failed: ${url}`);
  }
  return content;
}

/**
 * Fetch a URL and extract text content from HTML.
 * Duplicated from write-blog.ts core logic (standalone, no blog dependencies).
 */
async function fetchUrlContent(url: string): Promise<string> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);

    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'LoreAI-Bot/2.0 (seo-pipeline)',
        Accept: 'text/html,application/xhtml+xml,text/plain',
      },
    });

    clearTimeout(timeout);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const html = await response.text();

    // Extract text content from HTML
    const text = html
      .replace(/<script[\s\S]*?<\/script>/gi, '')
      .replace(/<style[\s\S]*?<\/style>/gi, '')
      .replace(/<nav[\s\S]*?<\/nav>/gi, '')
      .replace(/<footer[\s\S]*?<\/footer>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/\s+/g, ' ')
      .trim();

    return text;
  } catch (err) {
    console.warn(`    [source] fetch error ${url}: ${(err as Error).message}`);
    return '';
  }
}

/**
 * Truncate source content to ~maxChars to keep prompt sizes manageable.
 * Keeps the beginning of the page (usually has overview, features, pricing).
 */
export function truncateSource(content: string, maxChars: number = 16000): string {
  if (content.length <= maxChars) return content;
  // Cut at last space before limit to avoid breaking words
  const cut = content.lastIndexOf(' ', maxChars);
  return content.slice(0, cut > 0 ? cut : maxChars) + '\n\n[...truncated]';
}

/**
 * Sort search results to prioritize official domains.
 */
export function prioritizeResults(
  results: Array<{ url: string; title: string }>,
  officialDomains: string[]
): Array<{ url: string; title: string }> {
  return [...results].sort((a, b) => {
    const aOfficial = officialDomains.some(d => a.url.includes(d));
    const bOfficial = officialDomains.some(d => b.url.includes(d));
    if (aOfficial && !bOfficial) return -1;
    if (!aOfficial && bOfficial) return 1;
    return 0; // preserve search ranking order
  });
}

/**
 * Search Brave for a query and return results.
 */
export async function braveSearch(query: string): Promise<Array<{ url: string; title: string }>> {
  const apiKey = process.env.BRAVE_SEARCH_API_KEY;
  if (!apiKey) {
    console.warn('    [source] BRAVE_SEARCH_API_KEY not set, skipping search');
    return [];
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
      console.warn(`    [source] Brave Search error: ${res.status}`);
      return [];
    }

    const data = await res.json();
    const results = data.web?.results ?? [];
    return results.map((r: { url: string; title: string }) => ({
      url: r.url,
      title: r.title,
    }));
  } catch (err) {
    console.warn(`    [source] Brave Search failed: ${(err as Error).message}`);
    return [];
  }
}

/**
 * Resolve source material through the chain:
 * 1. Try curated URL first
 * 2. Fall back to Brave Search with domain prioritization
 * 3. Return empty string if all fail (not an error)
 */
export async function resolveSource(
  curatedUrl: string | undefined,
  searchQuery: string,
  officialDomains: string[]
): Promise<string> {
  // 1. Try curated URL
  if (curatedUrl) {
    const content = await fetchWithCache(curatedUrl);
    if (content) return truncateSource(content);
  }

  // 2. Exa search with domain filtering (primary fallback)
  const exaKey = process.env.EXA_API_KEY;
  if (exaKey) {
    console.log(`    [source] exa search: "${searchQuery}"`);
    const exaResults = await exaSearch(searchQuery, {
      numResults: 3,
      includeDomains: officialDomains,
      contents: { text: { maxCharacters: 16000 } },
    });

    for (const r of exaResults.results) {
      if (r.text && r.text.length > 200) {
        return truncateSource(`Source: ${r.url}\n${r.text}`);
      }
    }
  }

  // 3. Brave Search fallback
  console.log(`    [source] brave fallback: "${searchQuery}"`);
  const results = await braveSearch(searchQuery);
  if (results.length === 0) {
    console.warn(`    [source] no search results for "${searchQuery}"`);
    return '';
  }

  // Prioritize official domains
  const prioritized = prioritizeResults(results, officialDomains);

  // Fetch top 2-3 results
  const topResults = prioritized.slice(0, 3);
  const contents: string[] = [];

  for (const r of topResults) {
    const content = await fetchWithCache(r.url);
    if (content) {
      contents.push(`Source: ${r.url}\n${content}`);
      // If we got a good result from an official domain, that's enough
      if (officialDomains.some(d => r.url.includes(d)) && content.length > 500) {
        break;
      }
    }
  }

  if (contents.length === 0) {
    console.warn(`    [source] all fetches failed for "${searchQuery}"`);
    return '';
  }

  // Concatenate then truncate
  return truncateSource(contents.join('\n\n---\n\n'));
}

/**
 * Build the factual grounding instruction block for prompts.
 */
export function buildGroundingInstruction(sources: { label: string; content: string }[]): string {
  if (sources.every(s => !s.content)) {
    return '\n\n## ⚠️ No Source Material Available\nNo external sources could be fetched. Use only facts you are highly confident about. State "not publicly documented" for any detail you are uncertain about.\n';
  }

  let block = '';
  for (const { label, content } of sources) {
    if (content) {
      block += `\n\n## Source Material — ${label}\n${content}\n`;
    }
  }

  block += `
## CRITICAL: Factual Grounding Rules
- Use ONLY facts from the source material above for feature claims, pricing, and capabilities
- If a detail is not in the source material, state "not publicly documented" or omit it
- Do NOT supplement with prior knowledge for specific product facts (pricing, features, platform support)
- You MAY use general knowledge for framing, structure, and comparisons at a conceptual level`;

  return block;
}
