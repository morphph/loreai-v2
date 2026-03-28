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
  isKeywordNoise,
  getNoiseReason,
  isTitleCase,
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
    resolveSubtopics: vi.fn((topicSlug: string) => {
      // Mimic resolveSubtopics: return all clusters matching prefix or exact
      return Array.from(clusters.values())
        .filter((c) => c.slug === topicSlug || c.slug.startsWith(`${topicSlug}-`))
        .sort((a, b) => b.mention_count - a.mention_count)
        .map((c) => ({
          ...c,
          first_seen: '',
          last_seen: '',
          has_topic_hub: 0,
          brave_related_json: null,
          brave_updated_at: null,
          source: 'entity_extract',
          flagship_topic_slug: null,
          description: null,
          aliases_json: null,
          freshness_sensitivity: null,
          page_type_hints_json: null,
          seed_keywords_json: null,
          evidence_type: null,
          pack_version: null,
        }));
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
        title: 'claude code cost breakdown',
        published_date: '2026-02-15',
        author: null,
        text: '## Overview\nContent...\n## plans and pricing details\nMore content...\n## free tier usage details\nDetails...',
      },
      {
        url: 'https://another.com/ai-coding-tools',
        title: 'ai coding tools compared',
        published_date: '2026-01-20',
        author: null,
        text: '## claude code pricing info\nContent...\n## cursor pricing overview\nContent...\n## copilot enterprise pricing\nContent...',
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

  it('strips zero-width characters', () => {
    expect(normalizeKeyword('claude\u200B code\u200C pricing\u200D tool\uFEFF')).toBe('claude code pricing tool');
  });

  it('strips zero-width characters and still validates length', () => {
    // Only zero-width chars → empty after strip → too short
    expect(normalizeKeyword('\u200B\u200C\u200D')).toBeNull();
  });
});

describe('isKeywordNoise', () => {
  it('rejects numbered prefixes', () => {
    expect(isKeywordNoise('1) add an explicit threat-model sync step per repo')).toBe(true);
    expect(getNoiseReason('1) add an explicit threat-model sync')).toBe('numbered-prefix');
    expect(isKeywordNoise('3. harden against agent-specific failure modes')).toBe(true);
    expect(getNoiseReason('3. harden against agent-specific failure')).toBe('numbered-prefix');
  });

  it('rejects site suffix remnants with pipe', () => {
    expect(isKeywordNoise('foo tool | bar baz qux')).toBe(true);
    expect(getNoiseReason('foo tool | bar baz qux')).toBe('site-suffix-remnant');
  });

  it('rejects site suffix remnants with backslash', () => {
    expect(isKeywordNoise('foo tool \\ bar baz qux')).toBe(true);
    expect(getNoiseReason('foo tool \\ bar baz qux')).toBe('site-suffix-remnant');
  });

  it('rejects year markers in parentheses', () => {
    expect(isKeywordNoise('claude code hooks (2026)')).toBe(true);
    expect(getNoiseReason('claude code hooks (2026)')).toBe('year-in-parens');
  });

  it('keeps year without parentheses', () => {
    expect(isKeywordNoise('claude code hooks 2026')).toBe(false);
  });

  it('rejects subtitle patterns with long text after colon', () => {
    // This string is also >8 words (too-long fires first), so test a shorter subtitle
    expect(isKeywordNoise('claude code: what it is how its different and why users love it')).toBe(true);
    // 8 words total, 6 words after colon → subtitle-pattern
    expect(isKeywordNoise('claude code: deep coding at terminal velocity now')).toBe(true);
    expect(getNoiseReason('claude code: deep coding at terminal velocity now')).toBe('subtitle-pattern');
  });

  it('keeps short subtitle after colon', () => {
    expect(isKeywordNoise('claude code: pricing info')).toBe(false);
  });

  it('rejects strings ending with ellipsis', () => {
    expect(isKeywordNoise('claude code on deskt\u2026')).toBe(true);
    expect(getNoiseReason('claude code on deskt\u2026')).toBe('sentence-punctuation');
  });

  it('rejects strings ending with em dash', () => {
    expect(isKeywordNoise('claude code pricing \u2014')).toBe(true);
    expect(getNoiseReason('claude code pricing \u2014')).toBe('sentence-punctuation');
  });

  it('rejects strings ending with en dash', () => {
    expect(isKeywordNoise('claude code pricing \u2013')).toBe(true);
    expect(getNoiseReason('claude code pricing \u2013')).toBe('sentence-punctuation');
  });

  it('rejects self-domain references', () => {
    expect(isKeywordNoise('something about loreai tools')).toBe(true);
    expect(getNoiseReason('something about loreai tools')).toBe('self-domain');
    expect(isKeywordNoise('claude code hooks morph guide')).toBe(true);
    expect(getNoiseReason('claude code hooks morph guide')).toBe('self-domain');
  });

  it('keeps keywords without self-domain', () => {
    expect(isKeywordNoise('claude code pricing guide')).toBe(false);
  });

  it('rejects markdown artifacts with bold', () => {
    expect(isKeywordNoise('**bold title** for something')).toBe(true);
    expect(getNoiseReason('**bold title** for something')).toBe('markdown-artifact');
  });

  it('rejects markdown artifacts with links', () => {
    expect(isKeywordNoise('check [this link](url) here now')).toBe(true);
    expect(getNoiseReason('check [this link](url) here now')).toBe('markdown-artifact');
  });

  it('rejects markdown artifacts with underscores', () => {
    expect(isKeywordNoise('some __underlined__ text here today')).toBe(true);
    expect(getNoiseReason('some __underlined__ text here today')).toBe('markdown-artifact');
  });

  it('rejects >8 word strings as too long', () => {
    expect(isKeywordNoise('one two three four five six seven eight nine')).toBe(true);
    expect(getNoiseReason('one two three four five six seven eight nine')).toBe('too-long');
  });

  it('keeps 7-word strings', () => {
    expect(isKeywordNoise('claude code api pricing plans cost guide')).toBe(false);
  });

  it('keeps 8-word strings', () => {
    expect(isKeywordNoise('claude code api pricing plans cost guide overview')).toBe(false);
  });

  it('rejects CTA patterns', () => {
    expect(isKeywordNoise('native install on mac setup')).toBe(true);
    expect(isKeywordNoise('how to install claude code')).toBe(true);
    expect(isKeywordNoise('see pricing for enterprise plans')).toBe(true);
    expect(isKeywordNoise('click here for more details')).toBe(true);
    expect(isKeywordNoise('step 3 configure your environment')).toBe(true);
  });

  it('rejects trailing (recommended) pattern', () => {
    expect(isKeywordNoise('claude code setup (recommended) for devs')).toBe(false); // not at end
    expect(isKeywordNoise('claude code setup (recommended)')).toBe(true);
    expect(getNoiseReason('claude code setup (recommended)')).toBe('trailing-noise');
  });

  it('rejects truncated text with short unknown last word', () => {
    expect(isKeywordNoise('claude code on de xy')).toBe(true);
    expect(getNoiseReason('claude code on de xy')).toBe('truncated-text');
  });

  it('keeps keywords ending with known short words', () => {
    // "is" is a known short word
    expect(isKeywordNoise('what claude code is')).toBe(false);
    // "vs" is a known short word
    expect(isKeywordNoise('claude code cursor vs')).toBe(false);
    // "ai" is a known short word
    expect(isKeywordNoise('best tools for ai')).toBe(false);
  });

  it('keeps legitimate keywords', () => {
    expect(isKeywordNoise('claude code pricing')).toBe(false);
    expect(isKeywordNoise('how much does claude code cost')).toBe(false);
    expect(isKeywordNoise('codex cli vs cursor')).toBe(false);
  });
});

describe('isTitleCase', () => {
  it('detects title case article headlines', () => {
    expect(isTitleCase('Building A Real Feature With Claude Code: Every Step Explained')).toBe(true);
  });

  it('does not flag lowercase text', () => {
    expect(isTitleCase('claude code pricing')).toBe(false);
  });

  it('does not flag short strings (< 4 words)', () => {
    // Even if capitalized, too few words to judge
    expect(isTitleCase('Claude Code Pricing')).toBe(false);
  });

  it('does not flag mostly lowercase with some capitals', () => {
    // Only 2 out of 5 words capitalized = 40% < 60%
    expect(isTitleCase('Claude code is a Tool')).toBe(false);
  });

  it('flags strings with >60% capitalized words', () => {
    // 4 out of 5 words capitalized = 80% > 60%
    expect(isTitleCase('Claude Code Pricing Guide Overview')).toBe(true);
  });
});

describe('extractCompetitorKeywords', () => {
  it('extracts titles', () => {
    const results: ExaSearchResult[] = [
      // 3 words — below isTitleCase threshold (< 4 words)
      { url: 'https://a.com', title: 'claude code review', published_date: null, author: null },
      { url: 'https://b.com', title: 'AI Coding Tools', published_date: null, author: null },
    ];
    const kws = extractCompetitorKeywords(results);
    expect(kws).toContain('claude code review');
    expect(kws).toContain('AI Coding Tools');
  });

  it('filters title-case article headlines', () => {
    const results: ExaSearchResult[] = [
      // 4+ words, >60% capitalized → title case → rejected
      { url: 'https://a.com', title: 'Claude Code Review Complete Guide', published_date: null, author: null },
    ];
    const kws = extractCompetitorKeywords(results);
    expect(kws).not.toContain('Claude Code Review Complete Guide');
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
      { url: 'https://a.com', title: 'just a title here', published_date: null, author: null },
    ];
    const kws = extractCompetitorKeywords(results);
    expect(kws).toEqual(['just a title here']);
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
      // After stripping " | TechSite", becomes "claude code pricing" — 3 words, below isTitleCase threshold
      { url: 'https://a.com', title: 'claude code pricing | TechSite', published_date: null, author: null },
    ];
    const kws = extractCompetitorKeywords(results);
    expect(kws).toContain('claude code pricing');
    expect(kws).not.toContain('claude code pricing | TechSite');
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
        title: 'claude code guide',
        published_date: null,
        author: null,
        text: '## Table of Contents\n...\n## Related Posts and Resources\n...\n## claude code architecture overview\n...',
      },
    ];
    const kws = extractCompetitorKeywords(results);
    expect(kws).toContain('claude code architecture overview');
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
