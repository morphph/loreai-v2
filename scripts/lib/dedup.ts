import type { NewsItem } from './db';

function tokenize(text: string): Set<string> {
  return new Set(
    text
      .toLowerCase()
      .replace(/[^a-z0-9\u4e00-\u9fff\s]/g, ' ')
      .split(/\s+/)
      .filter((t) => t.length > 1)
  );
}

export function jaccardSimilarity(a: string, b: string): number {
  const setA = tokenize(a);
  const setB = tokenize(b);
  if (setA.size === 0 && setB.size === 0) return 1;
  if (setA.size === 0 || setB.size === 0) return 0;

  let intersection = 0;
  for (const token of setA) {
    if (setB.has(token)) intersection++;
  }
  const union = setA.size + setB.size - intersection;
  return union === 0 ? 0 : intersection / union;
}

export function deduplicateItems(
  items: NewsItem[],
  threshold: number = 0.5
): NewsItem[] {
  // Sort by: lower source_tier first, then higher score
  const sorted = [...items].sort((a, b) => {
    if (a.source_tier !== b.source_tier) return a.source_tier - b.source_tier;
    return b.score - a.score;
  });

  const kept: NewsItem[] = [];

  for (const item of sorted) {
    const isDuplicate = kept.some(
      (existing) => jaccardSimilarity(existing.title, item.title) >= threshold
    );
    if (!isDuplicate) {
      kept.push(item);
    }
  }

  return kept;
}

// Cross-day dedup: extract bold titles from existing newsletter markdown
export function extractBoldTitles(markdown: string): string[] {
  const matches = markdown.match(/\*\*([^*]+)\*\*/g) || [];
  return matches.map((m) => m.replace(/\*\*/g, ''));
}

export function crossDayDedup(
  items: NewsItem[],
  previousBoldTitles: string[],
  threshold: number = 0.4
): NewsItem[] {
  return items.filter((item) => {
    return !previousBoldTitles.some(
      (title) => jaccardSimilarity(title, item.title) >= threshold
    );
  });
}
