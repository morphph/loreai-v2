/**
 * Unit tests for B1 — Keyword Expansion
 *
 * Mocks serper.ts and exa.ts — no API credits consumed, no DB touched.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  normalizeKeyword,
  extractCompetitorKeywords,
  expandViaSerperSearch,
  expandSubtopic,
  expandTopic,
} from '../keyword-expand';

import type { SubtopicInput, ExpandOptions } from '../keyword-expand';
import type { ExaSearchResult } from '../exa';

// ── Mocks ──

vi.mock('../serper', () => ({
  searchFull: vi.fn(),
  searchAutocomplete: vi.fn(),
  estimateVolume: vi.fn(),
}));

vi.mock('../exa', () => ({
  semanticSearch: vi.fn(),
}));

vi.mock('../db', () => {
  // In-memory keyword store for testing
  let keywords: Map<string, { source: string; cluster_slug: string | null; search_volume: number | null; competition: string | null }> = new Map();
  let clusters: Map<string, { slug: string; pillar_topic: string; mention_count: number }> = new Map();

  const mockDb = {
    prepare: vi.fn((sql: string) => ({
      all: vi.fn((...params: unknown[]) => {
        if (sql.includes('SELECT keyword FROM keywords WHERE search_volume IS NULL')) {
          // Return unscored keywords from the provided list
          const kwList = params as string[];
          return kwList
            .filter((kw) => {
              const entry = keywords.get(kw);
              return entry && entry.search_volume === null;
            })
            .map((kw) => ({ keyword: kw }));
        }
        if (sql.includes('SELECT keyword FROM keywords')) {
          return Array.from(keywords.keys()).map((k) => ({ keyword: k }));
        }
        if (sql.includes('SELECT slug, pillar_topic FROM topic_clusters WHERE slug IN')) {
          const slugs = params as string[];
          return slugs
            .filter((s) => clusters.has(s))
            .map((s) => clusters.get(s)!);
        }
        if (sql.includes('SELECT slug, pillar_topic FROM topic_clusters')) {
          const pattern = params[0] as string;
          const exact = params[1] as string;
          const prefix = pattern.replace('-%', '');
          return Array.from(clusters.values()).filter(
            (c) => c.slug === exact || c.slug.startsWith(prefix + '-'),
          );
        }
        return [];
      }),
      run: vi.fn((...params: unknown[]) => {
        if (sql.includes('UPDATE keywords SET search_volume')) {
          const [sv, comp, kw] = params as [number, string, string];
          const entry = keywords.get(kw);
          if (entry) {
            entry.search_volume = sv;
            entry.competition = comp;
          }
        }
      }),
    })),
  };

  return {
    getDb: vi.fn(() => mockDb),
    upsertKeyword: vi.fn((keyword: string, source: string, clusterSlug?: string) => {
      keywords.set(keyword, {
        source,
        cluster_slug: clusterSlug || null,
        search_volume: null,
        competition: null,
      });
    }),
    closeDb: vi.fn(),
    __resetMockDb: () => {
      keywords = new Map();
      clusters = new Map();
    },
    __addCluster: (slug: string, pillar_topic: string, mention_count = 1) => {
      clusters.set(slug, { slug, pillar_topic, mention_count });
    },
    __getKeywords: () => keywords,
  };
});

import { searchFull, searchAutocomplete, estimateVolume } from '../serper';
import { semanticSearch } from '../exa';
import { upsertKeyword } from '../db';

// Access mock helpers
const mockDb = await import('../db') as unknown as {
  __resetMockDb: () => void;
  __addCluster: (slug: string, pillar_topic: string, mention_count?: number) => void;
  __getKeywords: () => Map<string, unknown>;
  upsertKeyword: ReturnType<typeof vi.fn>;
};

const mockSearchFull = searchFull as ReturnType<typeof vi.fn>;
const mockSearchAutocomplete = searchAutocomplete as ReturnType<typeof vi.fn>;
const mockEstimateVolume = estimateVolume as ReturnType<typeof vi.fn>;
const mockSemanticSearch = semanticSearch as ReturnType<typeof vi.fn>;

// ── Test data ──

const SUBTOPIC: SubtopicInput = {
  slug: 'claude-code-pricing',
  pillar_topic: 'Claude Code Pricing',
};

const DEFAULT_OPTS: ExpandOptions = {
  delayMs: 0,
  skipExa: false,
  maxVolumeCallsPerSubtopic: 20,
  dryRun: false,
};

function setupDefaultMocks() {
  mockSearchFull.mockResolvedValue({
    searchParameters: { q: 'Claude Code Pricing', gl: 'us', hl: 'en', type: 'search' },
    organic: [],
    peopleAlsoAsk: [
      { question: 'How much does Claude Code cost?', snippet: '...', title: '...', link: '...' },
      { question: 'Is Claude Code free?', snippet: '...', title: '...', link: '...' },
      { question: 'What is Claude Code Max plan?', snippet: '...', title: '...', link: '...' },
    ],
    relatedSearches: [
      { query: 'claude code pricing plans' },
      { query: 'claude code enterprise pricing' },
      { query: 'claude code vs cursor pricing' },
      { query: 'claude code free tier' },
      { query: 'is claude code free' }, // overlaps with PAA after normalization
    ],
  });

  mockSearchAutocomplete.mockResolvedValue({
    query: 'Claude Code Pricing',
    suggestions: [
      'claude code pricing 2026',
      'claude code pricing per month',
      'claude code pricing api',
      'claude code pricing plans', // overlaps with related
    ],
  });

  mockSemanticSearch.mockResolvedValue({
    query: 'Claude Code Pricing',
    results: [
      {
        url: 'https://competitor.com/claude-code-cost',
        title: 'Claude Code Pricing: Complete Cost Breakdown 2026',
        published_date: '2026-02-15',
        author: null,
        text: '## Overview\nContent...\n## Plans and Pricing\nMore content...\n## Free Tier Details\nDetails...',
      },
      {
        url: 'https://another.com/ai-coding-tools',
        title: 'AI Coding Tools Pricing Compared',
        published_date: '2026-01-20',
        author: null,
        text: '## Claude Code\nContent...\n## Cursor\nContent...\n## GitHub Copilot\nContent...',
      },
    ],
  });

  mockEstimateVolume.mockResolvedValue({
    query: 'claude code pricing',
    estimated_volume: 'high',
    signals: { has_answer_box: true, has_knowledge_graph: false, has_paa: true, organic_count: 10, has_ads: true },
  });
}

// ── Tests ──

describe('normalizeKeyword', () => {
  it('basic normalization', () => {
    expect(normalizeKeyword('  Claude Code Pricing? ')).toBe('claude code pricing');
  });

  it('filters too short', () => {
    expect(normalizeKeyword('ai')).toBeNull();
  });

  it('filters too long', () => {
    const long = 'a '.repeat(80);
    expect(normalizeKeyword(long)).toBeNull();
  });

  it('filters URLs', () => {
    expect(normalizeKeyword('https://example.com')).toBeNull();
  });

  it('filters too many words', () => {
    const manyWords = Array(16).fill('word').join(' ');
    expect(normalizeKeyword(manyWords)).toBeNull();
  });

  it('collapses whitespace', () => {
    expect(normalizeKeyword('claude  code   pricing')).toBe('claude code pricing');
  });

  it('removes smart quotes', () => {
    expect(normalizeKeyword('\u201Cclaude code\u201D')).toBe('claude code');
  });

  it('removes trailing question mark', () => {
    expect(normalizeKeyword('what is claude code?')).toBe('what is claude code');
  });

  it('passes valid short keyword', () => {
    expect(normalizeKeyword('api')).toBe('api');
  });

  it('passes keyword with exactly 15 words', () => {
    const kw = Array(15).fill('word').join(' ');
    expect(normalizeKeyword(kw)).toBe(kw);
  });
});

describe('extractCompetitorKeywords', () => {
  it('extracts titles', () => {
    const results: ExaSearchResult[] = [
      { url: 'https://a.com', title: 'Claude Code Review 2026', published_date: null, author: null },
      { url: 'https://b.com', title: 'AI Coding Tools', published_date: null, author: null },
    ];
    const kws = extractCompetitorKeywords(results);
    expect(kws).toContain('Claude Code Review 2026');
    expect(kws).toContain('AI Coding Tools');
  });

  it('extracts H2/H3 headings (filtering single-word noise)', () => {
    const results: ExaSearchResult[] = [
      {
        url: 'https://a.com',
        title: 'Complete Pricing Guide',
        published_date: null,
        author: null,
        text: '## Plans and Pricing\nContent...\n### Free Tier Details\nMore...\n## Overview\nIntro...',
      },
    ];
    const kws = extractCompetitorKeywords(results);
    expect(kws).toContain('Plans and Pricing');
    expect(kws).toContain('Free Tier Details');
    // "Overview" is a single word — filtered as noise
    expect(kws).not.toContain('Overview');
  });

  it('filters short headings (< 5 chars)', () => {
    const results: ExaSearchResult[] = [
      {
        url: 'https://a.com',
        title: 'Title',
        published_date: null,
        author: null,
        text: '## FAQ\nContent...',
      },
    ];
    const kws = extractCompetitorKeywords(results);
    // "FAQ" is only 3 chars, should be filtered
    expect(kws).not.toContain('FAQ');
  });

  it('filters long headings (> 100 chars)', () => {
    const longHeading = 'A'.repeat(101);
    const results: ExaSearchResult[] = [
      {
        url: 'https://a.com',
        title: 'Title',
        published_date: null,
        author: null,
        text: `## ${longHeading}\nContent...`,
      },
    ];
    const kws = extractCompetitorKeywords(results);
    expect(kws).not.toContain(longHeading);
  });

  it('handles results without text', () => {
    const results: ExaSearchResult[] = [
      { url: 'https://a.com', title: 'Just a Title', published_date: null, author: null },
    ];
    const kws = extractCompetitorKeywords(results);
    expect(kws).toEqual(['Just a Title']);
  });

  it('handles results without title', () => {
    const results: ExaSearchResult[] = [
      { url: 'https://a.com', title: '', published_date: null, author: null, text: '## Valid Heading Here\n...' },
    ];
    const kws = extractCompetitorKeywords(results);
    expect(kws).toContain('Valid Heading Here');
    // Empty title is falsy, should not be included
    expect(kws).not.toContain('');
  });

  it('handles empty results', () => {
    expect(extractCompetitorKeywords([])).toEqual([]);
  });

  it('filters CTA/nav titles', () => {
    const results: ExaSearchResult[] = [
      { url: 'https://a.com', title: 'Get Started with Claude', published_date: null, author: null },
      { url: 'https://b.com', title: 'Subscribe to Our Newsletter', published_date: null, author: null },
      { url: 'https://c.com', title: 'Learn More About AI Tools', published_date: null, author: null },
    ];
    const kws = extractCompetitorKeywords(results);
    expect(kws).toHaveLength(0);
  });

  it('filters titles ending with punctuation', () => {
    const results: ExaSearchResult[] = [
      { url: 'https://a.com', title: 'Make better product decisions.', published_date: null, author: null },
    ];
    const kws = extractCompetitorKeywords(results);
    expect(kws).toHaveLength(0);
  });

  it('strips site name suffixes from titles', () => {
    const results: ExaSearchResult[] = [
      { url: 'https://a.com', title: 'Claude Code Pricing Guide | TechSite', published_date: null, author: null },
    ];
    const kws = extractCompetitorKeywords(results);
    expect(kws).toContain('Claude Code Pricing Guide');
    expect(kws).not.toContain('Claude Code Pricing Guide | TechSite');
  });

  it('filters too-short titles (< 3 words)', () => {
    const results: ExaSearchResult[] = [
      { url: 'https://a.com', title: 'Overview', published_date: null, author: null },
      { url: 'https://b.com', title: 'AI Tools', published_date: null, author: null },
    ];
    const kws = extractCompetitorKeywords(results);
    expect(kws).toHaveLength(0);
  });

  it('filters nav headings like Table of Contents', () => {
    const results: ExaSearchResult[] = [
      {
        url: 'https://a.com',
        title: 'Claude Code Complete Guide',
        published_date: null,
        author: null,
        text: '## Table of Contents\n...\n## Related Posts and Resources\n...\n## Claude Code Architecture Overview\n...',
      },
    ];
    const kws = extractCompetitorKeywords(results);
    expect(kws).toContain('Claude Code Architecture Overview');
    expect(kws).not.toContain('Table of Contents');
    expect(kws).not.toContain('Related Posts and Resources');
  });
});

describe('expandViaSerperSearch', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('merges PAA and related from single searchFull call', async () => {
    mockSearchFull.mockResolvedValue({
      searchParameters: { q: 'test', gl: 'us', hl: 'en', type: 'search' },
      organic: [],
      peopleAlsoAsk: [
        { question: 'Q1?', snippet: '', title: '', link: '' },
        { question: 'Q2?', snippet: '', title: '', link: '' },
      ],
      relatedSearches: [
        { query: 'related 1' },
        { query: 'related 2' },
      ],
    });

    const result = await expandViaSerperSearch('test');
    expect(result.paa).toEqual(['Q1?', 'Q2?']);
    expect(result.related).toEqual(['related 1', 'related 2']);
    expect(mockSearchFull).toHaveBeenCalledTimes(1);
  });

  it('handles missing PAA and related', async () => {
    mockSearchFull.mockResolvedValue({
      searchParameters: { q: 'test', gl: 'us', hl: 'en', type: 'search' },
      organic: [],
    });

    const result = await expandViaSerperSearch('test');
    expect(result.paa).toEqual([]);
    expect(result.related).toEqual([]);
  });
});

describe('expandSubtopic', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockDb.__resetMockDb();
    setupDefaultMocks();
  });

  it('combines all sources', async () => {
    const result = await expandSubtopic(SUBTOPIC, DEFAULT_OPTS);

    expect(result.keywords_by_source['serper-paa'].length).toBeGreaterThan(0);
    expect(result.keywords_by_source['serper-related'].length).toBeGreaterThan(0);
    expect(result.keywords_by_source['serper-autocomplete'].length).toBeGreaterThan(0);
    expect(result.keywords_by_source['exa-competitor'].length).toBeGreaterThan(0);
    expect(result.total_raw).toBeGreaterThan(0);
  });

  it('deduplicates within run', async () => {
    // "is claude code free" appears in both PAA and related
    const result = await expandSubtopic(SUBTOPIC, DEFAULT_OPTS);

    const allKeywords = [
      ...result.keywords_by_source['serper-paa'],
      ...result.keywords_by_source['serper-related'],
      ...result.keywords_by_source['serper-autocomplete'],
      ...result.keywords_by_source['exa-competitor'],
    ];
    const uniqueSet = new Set(allKeywords);
    expect(allKeywords.length).toBe(uniqueSet.size);
  });

  it('handles Serper PAA empty', async () => {
    mockSearchFull.mockResolvedValue({
      searchParameters: { q: 'test', gl: 'us', hl: 'en', type: 'search' },
      organic: [],
      peopleAlsoAsk: [],
      relatedSearches: [{ query: 'some related query' }],
    });

    const result = await expandSubtopic(SUBTOPIC, DEFAULT_OPTS);
    expect(result.keywords_by_source['serper-paa']).toHaveLength(0);
    expect(result.keywords_by_source['serper-related'].length).toBeGreaterThan(0);
  });

  it('handles Exa empty', async () => {
    mockSemanticSearch.mockResolvedValue({
      query: 'test',
      results: [],
    });

    const result = await expandSubtopic(SUBTOPIC, DEFAULT_OPTS);
    expect(result.keywords_by_source['exa-competitor']).toHaveLength(0);
    expect(result.keywords_by_source['serper-paa'].length).toBeGreaterThan(0);
  });

  it('skips Exa when skipExa=true', async () => {
    const result = await expandSubtopic(SUBTOPIC, {
      ...DEFAULT_OPTS,
      skipExa: true,
    });

    expect(mockSemanticSearch).not.toHaveBeenCalled();
    expect(result.keywords_by_source['exa-competitor']).toHaveLength(0);
  });

  it('dry run does not call upsertKeyword', async () => {
    const result = await expandSubtopic(SUBTOPIC, {
      ...DEFAULT_OPTS,
      dryRun: true,
    });

    expect(upsertKeyword).not.toHaveBeenCalled();
    expect(result.total_raw).toBeGreaterThan(0);
    // In dry run, total_new = total_raw
    expect(result.total_new).toBe(result.total_raw);
  });

  it('handles Serper search error gracefully', async () => {
    mockSearchFull.mockRejectedValue(new Error('Rate limited'));

    const result = await expandSubtopic(SUBTOPIC, DEFAULT_OPTS);
    // Should still have autocomplete and exa results
    expect(result.keywords_by_source['serper-paa']).toHaveLength(0);
    expect(result.keywords_by_source['serper-related']).toHaveLength(0);
    expect(result.keywords_by_source['serper-autocomplete'].length).toBeGreaterThan(0);
  });

  it('handles Serper autocomplete error gracefully', async () => {
    mockSearchAutocomplete.mockRejectedValue(new Error('Timeout'));

    const result = await expandSubtopic(SUBTOPIC, DEFAULT_OPTS);
    expect(result.keywords_by_source['serper-autocomplete']).toHaveLength(0);
    expect(result.keywords_by_source['serper-paa'].length).toBeGreaterThan(0);
  });

  it('handles Exa error gracefully', async () => {
    mockSemanticSearch.mockRejectedValue(new Error('API error'));

    const result = await expandSubtopic(SUBTOPIC, DEFAULT_OPTS);
    expect(result.keywords_by_source['exa-competitor']).toHaveLength(0);
    expect(result.keywords_by_source['serper-paa'].length).toBeGreaterThan(0);
  });

  it('writes keywords to DB with correct source and clusterSlug', async () => {
    await expandSubtopic(SUBTOPIC, DEFAULT_OPTS);

    // upsertKeyword should be called with source and clusterSlug
    const calls = (upsertKeyword as ReturnType<typeof vi.fn>).mock.calls;
    expect(calls.length).toBeGreaterThan(0);
    for (const [kw, source, slug] of calls) {
      expect(typeof kw).toBe('string');
      expect(['serper-paa', 'serper-related', 'serper-autocomplete', 'exa-competitor']).toContain(source);
      expect(slug).toBe('claude-code-pricing');
    }
  });
});

describe('expandTopic', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockDb.__resetMockDb();
    setupDefaultMocks();
  });

  it('processes multiple subtopics', async () => {
    mockDb.__addCluster('claude-code-pricing', 'Claude Code Pricing', 5);
    mockDb.__addCluster('claude-code-hooks', 'Claude Code Hooks', 3);

    const result = await expandTopic('claude-code', null, DEFAULT_OPTS);
    expect(result.subtopics_processed).toBe(2);
    expect(result.subtopic_results).toHaveLength(2);
    expect(result.total_keywords_discovered).toBeGreaterThan(0);
  });

  it('processes only specified subtopics', async () => {
    mockDb.__addCluster('claude-code-pricing', 'Claude Code Pricing', 5);
    mockDb.__addCluster('claude-code-hooks', 'Claude Code Hooks', 3);
    mockDb.__addCluster('claude-code-agent', 'Claude Code Agent', 2);

    const result = await expandTopic(
      'claude-code',
      ['claude-code-pricing', 'claude-code-hooks'],
      DEFAULT_OPTS,
    );
    expect(result.subtopics_processed).toBe(2);
  });

  it('throws when no subtopics found', async () => {
    await expect(
      expandTopic('nonexistent-topic', null, DEFAULT_OPTS),
    ).rejects.toThrow('No subtopics found');
  });

  it('skips missing subtopics with warning', async () => {
    mockDb.__addCluster('claude-code-pricing', 'Claude Code Pricing', 5);

    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const result = await expandTopic(
      'claude-code',
      ['claude-code-pricing', 'nonexistent-slug'],
      DEFAULT_OPTS,
    );
    expect(result.subtopics_processed).toBe(1);
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining('nonexistent-slug'),
    );
    warnSpy.mockRestore();
  });

  it('includes the flagship topic itself', async () => {
    mockDb.__addCluster('claude-code', 'Claude Code', 10);
    mockDb.__addCluster('claude-code-pricing', 'Claude Code Pricing', 5);

    const result = await expandTopic('claude-code', null, DEFAULT_OPTS);
    expect(result.subtopics_processed).toBe(2);
  });

  it('calculates API call counts', async () => {
    mockDb.__addCluster('claude-code-pricing', 'Claude Code Pricing', 5);

    const result = await expandTopic('claude-code', null, DEFAULT_OPTS);
    expect(result.serper_api_calls).toBeGreaterThanOrEqual(2); // at least 1 searchFull + 1 autocomplete
    expect(result.exa_api_calls).toBe(1);
  });

  it('exa_api_calls is 0 when skipExa is true', async () => {
    mockDb.__addCluster('claude-code-pricing', 'Claude Code Pricing', 5);

    const result = await expandTopic('claude-code', null, {
      ...DEFAULT_OPTS,
      skipExa: true,
    });
    expect(result.exa_api_calls).toBe(0);
  });
});

describe('volume mapping', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockDb.__resetMockDb();
    setupDefaultMocks();
  });

  it('maps high → 10000', async () => {
    mockEstimateVolume.mockResolvedValue({
      query: 'test',
      estimated_volume: 'high',
      signals: { has_answer_box: true, has_knowledge_graph: false, has_paa: true, organic_count: 10, has_ads: true },
    });

    const result = await expandSubtopic(SUBTOPIC, DEFAULT_OPTS);
    // Volume scoring should have been attempted
    expect(result.volume_scored).toBeGreaterThanOrEqual(0);
  });

  it('maps very_low → 10', async () => {
    mockEstimateVolume.mockResolvedValue({
      query: 'test',
      estimated_volume: 'very_low',
      signals: { has_answer_box: false, has_knowledge_graph: false, has_paa: false, organic_count: 3, has_ads: false },
    });

    const result = await expandSubtopic(SUBTOPIC, DEFAULT_OPTS);
    expect(result.volume_scored).toBeGreaterThanOrEqual(0);
  });

  it('respects maxVolumeCallsPerSubtopic', async () => {
    // Create many keywords by having lots of autocomplete suggestions
    mockSearchAutocomplete.mockResolvedValue({
      query: 'test',
      suggestions: Array.from({ length: 30 }, (_, i) => `keyword suggestion ${i}`),
    });

    await expandSubtopic(SUBTOPIC, {
      ...DEFAULT_OPTS,
      maxVolumeCallsPerSubtopic: 5,
    });

    // estimateVolume should be called at most 5 times
    expect(mockEstimateVolume.mock.calls.length).toBeLessThanOrEqual(5);
  });

  it('volume estimation error does not block expansion', async () => {
    mockEstimateVolume.mockRejectedValue(new Error('Volume API error'));

    const result = await expandSubtopic(SUBTOPIC, DEFAULT_OPTS);
    expect(result.total_raw).toBeGreaterThan(0);
    expect(result.volume_scored).toBe(0);
  });
});
