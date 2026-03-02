import { describe, it, expect } from 'vitest';
import {
  jaccardSimilarity,
  deduplicateItems,
  extractBoldTitles,
  crossDayDedup,
} from '../dedup';
import type { NewsItem } from '../db';

function makeItem(overrides: Partial<NewsItem> = {}): NewsItem {
  return {
    title: 'Default Title',
    url: null,
    source: 'test',
    source_tier: 3,
    summary: null,
    score: 50,
    engagement_likes: 0,
    engagement_retweets: 0,
    engagement_downloads: 0,
    ...overrides,
  };
}

// ── Jaccard Similarity ─────────────────────────────────────────────────

describe('jaccardSimilarity', () => {
  it('returns 1.0 for identical strings', () => {
    expect(jaccardSimilarity('hello world', 'hello world')).toBe(1);
  });

  it('returns 0.0 for completely different strings', () => {
    expect(jaccardSimilarity('hello world', 'foo bar baz')).toBe(0);
  });

  it('returns value between 0 and 1 for partial overlap', () => {
    const sim = jaccardSimilarity('openai launches gpt5', 'openai releases gpt5 turbo');
    expect(sim).toBeGreaterThan(0);
    expect(sim).toBeLessThan(1);
  });

  it('handles both strings empty (returns 1.0)', () => {
    expect(jaccardSimilarity('', '')).toBe(1);
  });

  it('handles one string empty (returns 0.0)', () => {
    expect(jaccardSimilarity('hello', '')).toBe(0);
    expect(jaccardSimilarity('', 'world')).toBe(0);
  });
});

// ── Deduplicate Items ──────────────────────────────────────────────────

describe('deduplicateItems', () => {
  it('removes duplicate items (keeps higher tier)', () => {
    const items: NewsItem[] = [
      makeItem({ title: 'OpenAI launches GPT-5 Turbo model', source_tier: 1, score: 90 }),
      makeItem({ title: 'OpenAI launches GPT-5 Turbo model today', source_tier: 3, score: 80 }),
    ];
    const result = deduplicateItems(items, 0.5);
    expect(result).toHaveLength(1);
    expect(result[0].source_tier).toBe(1);
  });

  it('keeps unique items', () => {
    const items: NewsItem[] = [
      makeItem({ title: 'OpenAI launches GPT-5', source_tier: 1, score: 90 }),
      makeItem({ title: 'Google releases Gemini update', source_tier: 2, score: 85 }),
      makeItem({ title: 'Meta open sources new model', source_tier: 3, score: 70 }),
    ];
    const result = deduplicateItems(items, 0.5);
    expect(result).toHaveLength(3);
  });

  it('handles empty array', () => {
    expect(deduplicateItems([])).toEqual([]);
  });
});

// ── Extract Bold Titles ────────────────────────────────────────────────

describe('extractBoldTitles', () => {
  it('extracts bold text from markdown', () => {
    const md = `**OpenAI launches GPT-5** — big deal.\n\n**Anthropic ships Claude** — also big.`;
    const titles = extractBoldTitles(md);
    expect(titles).toEqual(['OpenAI launches GPT-5', 'Anthropic ships Claude']);
  });

  it('returns empty array when no bold text', () => {
    expect(extractBoldTitles('No bold here.')).toEqual([]);
  });
});

// ── Cross-Day Dedup ────────────────────────────────────────────────────

describe('crossDayDedup', () => {
  it('filters previously seen items', () => {
    const items: NewsItem[] = [
      makeItem({ title: 'OpenAI launches GPT-5 Turbo model' }),
      makeItem({ title: 'New Rust compiler release speeds up builds' }),
    ];
    const previousTitles = ['OpenAI launches GPT-5 Turbo'];
    const result = crossDayDedup(items, previousTitles, 0.5);
    expect(result).toHaveLength(1);
    expect(result[0].title).toBe('New Rust compiler release speeds up builds');
  });

  it('keeps all items when no overlap', () => {
    const items: NewsItem[] = [
      makeItem({ title: 'Brand new topic A' }),
      makeItem({ title: 'Brand new topic B' }),
    ];
    const result = crossDayDedup(items, ['Completely different old title'], 0.5);
    expect(result).toHaveLength(2);
  });
});
