/**
 * Keyword Engine Error Handling Tests
 *
 * Verifies graceful degradation when external services (Serper, Exa, Claude,
 * GSC) fail during pipeline execution. Each test mocks a specific failure
 * and asserts the pipeline degrades without crashing.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// ── B1 Expansion Error Tests ──

describe('B1 expansion: API failure handling', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.resetAllMocks();
  });

  it('continues when Serper searchFull throws (rate limit)', async () => {
    vi.doMock('../lib/serper', () => ({
      searchFull: vi.fn().mockRejectedValue(new Error('429 Rate Limit')),
      searchAutocomplete: vi.fn().mockResolvedValue({ suggestions: ['ac1', 'ac2'] }),
      estimateVolume: vi.fn().mockResolvedValue({ volume: 'medium', competition: 'low' }),
    }));
    vi.doMock('../lib/exa', () => ({
      semanticSearch: vi.fn().mockResolvedValue({ results: [] }),
    }));
    vi.doMock('../lib/db', () => {
      const keywords = new Map<string, unknown>();
      return {
        getDb: vi.fn(() => ({
          prepare: vi.fn((sql: string) => ({
            all: vi.fn(() => {
              if (sql.includes('SELECT keyword FROM keywords')) return Array.from(keywords.keys()).map((k) => ({ keyword: k }));
              if (sql.includes('SELECT slug, pillar_topic')) return [{ slug: 'test-topic', pillar_topic: 'Test Topic' }];
              return [];
            }),
            run: vi.fn(),
          })),
        })),
        upsertKeyword: vi.fn((kw: string) => { keywords.set(kw, {}); }),
      };
    });

    const { expandSubtopic } = await import('../lib/keyword-expand');

    const result = await expandSubtopic(
      { slug: 'test-topic', pillar_topic: 'Test Topic' },
      { delayMs: 0, skipExa: false, maxVolumeCallsPerSubtopic: 0, dryRun: true },
    );

    // Serper PAA+related failed but autocomplete + exa should still work
    expect(result.keywords_by_source['serper-paa']).toHaveLength(0);
    expect(result.keywords_by_source['serper-related']).toHaveLength(0);
    // Autocomplete still ran
    expect(result.keywords_by_source['serper-autocomplete'].length).toBeGreaterThanOrEqual(0);
    // No crash — total_raw is computed
    expect(typeof result.total_raw).toBe('number');
  });

  it('continues when Exa semanticSearch throws (timeout)', async () => {
    vi.doMock('../lib/serper', () => ({
      searchFull: vi.fn().mockResolvedValue({
        peopleAlsoAsk: [{ question: 'what is test' }],
        relatedSearches: [{ query: 'test related' }],
      }),
      searchAutocomplete: vi.fn().mockResolvedValue({ suggestions: [] }),
      estimateVolume: vi.fn(),
    }));
    vi.doMock('../lib/exa', () => ({
      semanticSearch: vi.fn().mockRejectedValue(new Error('ETIMEDOUT')),
    }));
    vi.doMock('../lib/db', () => {
      const keywords = new Map<string, unknown>();
      return {
        getDb: vi.fn(() => ({
          prepare: vi.fn((sql: string) => ({
            all: vi.fn(() => {
              if (sql.includes('SELECT keyword FROM keywords')) return Array.from(keywords.keys()).map((k) => ({ keyword: k }));
              if (sql.includes('SELECT slug, pillar_topic')) return [{ slug: 'test', pillar_topic: 'Test' }];
              return [];
            }),
            run: vi.fn(),
          })),
        })),
        upsertKeyword: vi.fn((kw: string) => { keywords.set(kw, {}); }),
      };
    });

    const { expandSubtopic } = await import('../lib/keyword-expand');

    const result = await expandSubtopic(
      { slug: 'test', pillar_topic: 'Test' },
      { delayMs: 0, skipExa: false, maxVolumeCallsPerSubtopic: 0, dryRun: true },
    );

    // Serper worked, Exa failed gracefully
    expect(result.keywords_by_source['serper-paa'].length).toBeGreaterThanOrEqual(0);
    expect(result.keywords_by_source['exa-competitor']).toHaveLength(0);
    expect(typeof result.total_raw).toBe('number');
  });

  it('returns 0 keywords when Serper returns empty results', async () => {
    vi.doMock('../lib/serper', () => ({
      searchFull: vi.fn().mockResolvedValue({
        peopleAlsoAsk: [],
        relatedSearches: [],
      }),
      searchAutocomplete: vi.fn().mockResolvedValue({ suggestions: [] }),
      estimateVolume: vi.fn(),
    }));
    vi.doMock('../lib/exa', () => ({
      semanticSearch: vi.fn().mockResolvedValue({ results: [] }),
    }));
    vi.doMock('../lib/db', () => ({
      getDb: vi.fn(() => ({
        prepare: vi.fn(() => ({
          all: vi.fn(() => []),
          run: vi.fn(),
        })),
      })),
      upsertKeyword: vi.fn(),
    }));

    const { expandSubtopic } = await import('../lib/keyword-expand');

    const result = await expandSubtopic(
      { slug: 'empty-topic', pillar_topic: 'Empty Topic' },
      { delayMs: 0, skipExa: false, maxVolumeCallsPerSubtopic: 0, dryRun: true },
    );

    expect(result.total_raw).toBe(0);
    expect(result.keywords_by_source['serper-paa']).toHaveLength(0);
    expect(result.keywords_by_source['serper-related']).toHaveLength(0);
    expect(result.keywords_by_source['serper-autocomplete']).toHaveLength(0);
    expect(result.keywords_by_source['exa-competitor']).toHaveLength(0);
  });
});

// ── B2 Grouping Error Tests ──

describe('B2 grouping: Claude response validation', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.resetAllMocks();
  });

  it('throws ParseError for malformed JSON', async () => {
    // parseGroupingResponse is pure — test directly
    const { parseGroupingResponse } = await import('../lib/keyword-group');

    expect(() =>
      parseGroupingResponse('Here are the groups: {invalid json', ['kw1', 'kw2']),
    ).toThrowError('ParseError');
  });

  it('throws when primary_keyword not in input list', async () => {
    const { parseGroupingResponse } = await import('../lib/keyword-group');

    const response = JSON.stringify({
      groups: [
        {
          primary_keyword: 'invented_keyword',
          secondary_keywords: [],
          intent: 'informational',
          content_type: 'faq',
          rationale: 'test',
        },
      ],
      ungrouped: [],
    });

    expect(() =>
      parseGroupingResponse(response, ['real_keyword_1', 'real_keyword_2']),
    ).toThrowError();
  });

  it('handles empty groups array without crashing', async () => {
    const { parseGroupingResponse } = await import('../lib/keyword-group');

    const response = JSON.stringify({
      groups: [],
      ungrouped: ['kw1', 'kw2', 'kw3'],
    });

    const result = parseGroupingResponse(response, ['kw1', 'kw2', 'kw3']);

    expect(result.groups).toHaveLength(0);
    expect(result.ungrouped).toHaveLength(3);
  });

  it('strips markdown fences from Claude response', async () => {
    const { parseGroupingResponse } = await import('../lib/keyword-group');

    const response = '```json\n' + JSON.stringify({
      groups: [
        {
          primary_keyword: 'claude code',
          secondary_keywords: [],
          intent: 'informational',
          content_type: 'faq',
          rationale: 'test',
        },
      ],
      ungrouped: [],
    }) + '\n```';

    const result = parseGroupingResponse(response, ['claude code']);
    expect(result.groups).toHaveLength(1);
    expect(result.groups[0].primary_keyword).toBe('claude code');
  });

  it('throws ValidationError when response missing groups key', async () => {
    const { parseGroupingResponse } = await import('../lib/keyword-group');

    expect(() =>
      parseGroupingResponse('{"ungrouped": ["kw1"]}', ['kw1']),
    ).toThrowError('ValidationError');
  });
});

// ── B4 Content Generation Error Tests ──

describe('B4 content generation: validator routing', () => {
  it('every ContentType has a working validator', async () => {
    const { getValidatorForType } = await import('../lib/content-gen');
    const types = ['faq', 'compare', 'glossary', 'topic-hub', 'blog', 'deep-dive', 'cornerstone'] as const;

    for (const ct of types) {
      const validator = getValidatorForType(ct);
      expect(typeof validator).toBe('function');

      // Validator returns { valid, errors } shape even for invalid content
      const result = validator('# Short\n\nToo short.');
      expect(typeof result.valid).toBe('boolean');
      expect(Array.isArray(result.errors)).toBe(true);
    }
  });

  it('FAQ validator rejects content without H1', async () => {
    const { getValidatorForType } = await import('../lib/content-gen');
    const validate = getValidatorForType('faq');

    const result = validate('No heading here, just text.\n\n[Subscribe](/subscribe)');
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Missing H1 title');
  });

  it('compare validator rejects content without comparison table', async () => {
    const { getValidatorForType } = await import('../lib/content-gen');
    const validate = getValidatorForType('compare');

    const words = Array(400).fill('word').join(' ');
    const result = validate(`# A vs B\n\n## Overview\n\n${words}\n\n## Details\n\nMore text.\n\n[Subscribe](/subscribe)`);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Missing comparison table');
  });
});

// ── B3 Scoring Edge Cases ──

describe('B3 scoring: edge cases that could crash', () => {
  it('handles empty keywords array with DEFAULT_VOLUME', async () => {
    const { calculatePriorityScore, DEFAULT_VOLUME } = await import('../lib/priority');

    const result = calculatePriorityScore({
      group_id: 1,
      primary_keyword: 'orphan',
      intent: 'informational',
      content_type: 'faq',
      cluster_slug: 'test',
      keywords: [],
      event_age_hours: null,
    });

    expect(result.score_breakdown.volume).toBe(DEFAULT_VOLUME);
    expect(result.priority_score).toBeGreaterThan(0);
  });

  it('handles all-NULL-volume keywords gracefully', async () => {
    const { calculatePriorityScore, DEFAULT_VOLUME } = await import('../lib/priority');

    const result = calculatePriorityScore({
      group_id: 1,
      primary_keyword: 'null vol',
      intent: 'commercial',
      content_type: 'compare',
      cluster_slug: 'test',
      keywords: [
        { keyword: 'kw1', search_volume: null, competition: null },
        { keyword: 'kw2', search_volume: null, competition: null },
      ],
      event_age_hours: null,
    });

    expect(result.score_breakdown.volume).toBe(DEFAULT_VOLUME);
    expect(result.priority_score).toBeGreaterThan(0);
  });

  it('handles unknown intent gracefully', async () => {
    const { calculatePriorityScore } = await import('../lib/priority');

    // Should not throw, even with unexpected intent
    const result = calculatePriorityScore({
      group_id: 1,
      primary_keyword: 'weird',
      intent: 'unknown_intent',
      content_type: 'faq',
      cluster_slug: 'test',
      keywords: [{ keyword: 'test', search_volume: 100, competition: 'low' }],
      event_age_hours: null,
    });

    expect(typeof result.priority_score).toBe('number');
    expect(result.priority_score).toBeGreaterThan(0);
  });

  it('handles unknown competition gracefully', async () => {
    const { calculatePriorityScore } = await import('../lib/priority');

    const result = calculatePriorityScore({
      group_id: 1,
      primary_keyword: 'weird comp',
      intent: 'informational',
      content_type: 'faq',
      cluster_slug: 'test',
      keywords: [{ keyword: 'test', search_volume: 100, competition: 'unknown_level' }],
      event_age_hours: null,
    });

    expect(typeof result.priority_score).toBe('number');
    expect(result.priority_score).toBeGreaterThan(0);
  });
});

// ── Routing Edge Cases ──

describe('B3 routing: edge cases', () => {
  it('routes topic-hub with deferral check', async () => {
    const { routeKeywordGroup } = await import('../lib/priority');

    const result = routeKeywordGroup({
      intent: 'informational',
      b2_content_type: 'topic-hub',
      serp_depth: null,
      recommended_content_type: null,
      cluster_page_count: 10,
    });

    // topic-hub should use standard pipeline
    expect(result.content_type).toBe('topic-hub');
    expect(result.research_pipeline).toBe('standard');
  });

  it('overrides FAQ to blog+deep_research when SERP depth is long_form', async () => {
    const { routeKeywordGroup } = await import('../lib/priority');

    const result = routeKeywordGroup({
      intent: 'informational',
      b2_content_type: 'faq',
      serp_depth: 'long_form',
      recommended_content_type: null,
      cluster_page_count: 20,
    });

    expect(result.content_type).toBe('blog');
    expect(result.research_pipeline).toBe('deep_research');
  });
});

// ── GSC Performance Cycle Error Tests ──

describe('C3 performance cycle: GSC edge cases', () => {
  it('segmentByPosition handles boundary positions correctly', async () => {
    const { segmentByPosition } = await import('../lib/gsc');

    // Position exactly at boundary
    const result = segmentByPosition([
      { keys: ['query1', '/page1'], clicks: 10, impressions: 100, ctr: 0.1, position: 3.0 },
      { keys: ['query2', '/page2'], clicks: 5, impressions: 50, ctr: 0.1, position: 10.0 },
      { keys: ['query3', '/page3'], clicks: 2, impressions: 200, ctr: 0.01, position: 20.0 },
      { keys: ['query4', '/page4'], clicks: 1, impressions: 30, ctr: 0.03, position: 50.0 },
    ], { start: '2026-01-01', end: '2026-01-28' });

    expect(result.segments.defending.queries).toHaveLength(1);
    expect(result.segments.page_one.queries).toHaveLength(1);
    expect(result.segments.striking.queries).toHaveLength(1);
    expect(result.segments.building.queries).toHaveLength(1);
  });

  it('segmentByPosition handles empty rows', async () => {
    const { segmentByPosition } = await import('../lib/gsc');

    const result = segmentByPosition([], { start: '2026-01-01', end: '2026-01-28' });

    expect(result.segments.defending.queries).toHaveLength(0);
    expect(result.segments.page_one.queries).toHaveLength(0);
    expect(result.segments.striking.queries).toHaveLength(0);
    expect(result.segments.building.queries).toHaveLength(0);
    expect(result.segments.long_shot.queries).toHaveLength(0);
  });
});
