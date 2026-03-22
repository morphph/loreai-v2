import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  searchPAA,
  searchRelated,
  searchAutocomplete,
  estimateVolume,
  detectSERPDepth,
  searchFull,
  batchSearch,
  setSerperConfig,
  SerperAPIError,
} from '../serper';

// ── Mock Data ──

const mockSearchResponse = {
  searchParameters: { q: 'claude code pricing', gl: 'us', hl: 'en', type: 'search' },
  answerBox: { answer: 'Claude Code is free with Max Plan', title: 'Pricing', link: 'https://example.com' },
  knowledgeGraph: { title: 'Claude', type: 'AI', description: 'AI assistant', attributes: {} },
  organic: Array.from({ length: 10 }, (_, i) => ({
    title: `Result ${i + 1}`,
    link: `https://example.com/${i + 1}`,
    snippet: 'A'.repeat(120),
    position: i + 1,
  })),
  peopleAlsoAsk: [
    { question: 'How much does Claude Code cost?', snippet: 'Free with Max', title: 'Pricing', link: 'https://a.com' },
    { question: 'Is Claude Code free?', snippet: 'Yes with limits', title: 'Free tier', link: 'https://b.com' },
    { question: 'Claude Code vs Cursor?', snippet: 'Both are good', title: 'Compare', link: 'https://c.com' },
    { question: 'What is Claude Code?', snippet: 'AI coding tool', title: 'Overview', link: 'https://d.com' },
  ],
  relatedSearches: [
    { query: 'claude code review' },
    { query: 'claude code tutorial' },
    { query: 'claude code free' },
  ],
};

const mockAutocompleteResponse = {
  searchParameters: { q: 'claude code', type: 'autocomplete' },
  suggestions: [
    { value: 'claude code pricing' },
    { value: 'claude code vs cursor' },
    { value: 'claude code tutorial' },
  ],
};

// ── Helpers ──

function mockFetchSuccess(data: unknown) {
  return vi.fn().mockResolvedValue({
    ok: true,
    json: () => Promise.resolve(data),
  });
}

function mockFetchError(status: number, body: string) {
  return vi.fn().mockResolvedValue({
    ok: false,
    status,
    text: () => Promise.resolve(body),
  });
}

// ── Tests ──

describe('serper', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    setSerperConfig({ apiKey: 'test-key' });
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  // ── searchPAA ──

  describe('searchPAA', () => {
    it('extracts PAA questions from search response', async () => {
      global.fetch = mockFetchSuccess(mockSearchResponse);

      const result = await searchPAA('claude code pricing');

      expect(result.query).toBe('claude code pricing');
      expect(result.questions).toHaveLength(4);
      expect(result.questions[0]).toEqual({
        question: 'How much does Claude Code cost?',
        snippet: 'Free with Max',
        title: 'Pricing',
        link: 'https://a.com',
      });
    });

    it('returns empty array when no PAA in response', async () => {
      global.fetch = mockFetchSuccess({
        searchParameters: { q: 'obscure query', gl: 'us', hl: 'en', type: 'search' },
        organic: [],
      });

      const result = await searchPAA('obscure query');

      expect(result.query).toBe('obscure query');
      expect(result.questions).toEqual([]);
    });

    it('returns empty result when API key is missing', async () => {
      setSerperConfig({ apiKey: '' });

      const result = await searchPAA('test');

      expect(result.questions).toEqual([]);
    });
  });

  // ── searchRelated ──

  describe('searchRelated', () => {
    it('extracts related search queries', async () => {
      global.fetch = mockFetchSuccess(mockSearchResponse);

      const result = await searchRelated('claude code');

      expect(result.query).toBe('claude code');
      expect(result.related).toEqual([
        'claude code review',
        'claude code tutorial',
        'claude code free',
      ]);
    });

    it('returns empty when no related searches', async () => {
      global.fetch = mockFetchSuccess({
        searchParameters: { q: 'test', gl: 'us', hl: 'en', type: 'search' },
        organic: [],
      });

      const result = await searchRelated('test');

      expect(result.related).toEqual([]);
    });
  });

  // ── searchAutocomplete ──

  describe('searchAutocomplete', () => {
    it('extracts autocomplete suggestions', async () => {
      global.fetch = mockFetchSuccess(mockAutocompleteResponse);

      const result = await searchAutocomplete('claude code');

      expect(result.query).toBe('claude code');
      expect(result.suggestions).toEqual([
        'claude code pricing',
        'claude code vs cursor',
        'claude code tutorial',
      ]);
    });

    it('returns empty when no suggestions', async () => {
      global.fetch = mockFetchSuccess({
        searchParameters: { q: 'xyz', type: 'autocomplete' },
        suggestions: [],
      });

      const result = await searchAutocomplete('xyz');

      expect(result.suggestions).toEqual([]);
    });

    it('returns empty result when API key is missing', async () => {
      setSerperConfig({ apiKey: '' });

      const result = await searchAutocomplete('test');

      expect(result.suggestions).toEqual([]);
    });
  });

  // ── estimateVolume ──

  describe('estimateVolume', () => {
    it('returns "high" when answerBox + PAA >= 3 + organic = 10', async () => {
      global.fetch = mockFetchSuccess(mockSearchResponse);

      const result = await estimateVolume('claude code pricing');

      expect(result.estimated_volume).toBe('high');
      expect(result.signals.has_answer_box).toBe(true);
      expect(result.signals.has_knowledge_graph).toBe(true);
      expect(result.signals.has_paa).toBe(true);
      expect(result.signals.organic_count).toBe(10);
    });

    it('returns "medium" when PAA >= 2 + organic >= 8', async () => {
      global.fetch = mockFetchSuccess({
        searchParameters: { q: 'test', gl: 'us', hl: 'en', type: 'search' },
        organic: Array.from({ length: 8 }, (_, i) => ({
          title: `R${i}`, link: `https://e.com/${i}`, snippet: 'x', position: i + 1,
        })),
        peopleAlsoAsk: [
          { question: 'Q1', snippet: 's', title: 't', link: 'https://a.com' },
          { question: 'Q2', snippet: 's', title: 't', link: 'https://b.com' },
        ],
      });

      const result = await estimateVolume('test');

      expect(result.estimated_volume).toBe('medium');
    });

    it('returns "low" when PAA >= 1 OR organic >= 5', async () => {
      global.fetch = mockFetchSuccess({
        searchParameters: { q: 'test', gl: 'us', hl: 'en', type: 'search' },
        organic: Array.from({ length: 5 }, (_, i) => ({
          title: `R${i}`, link: `https://e.com/${i}`, snippet: 'x', position: i + 1,
        })),
      });

      const result = await estimateVolume('test');

      expect(result.estimated_volume).toBe('low');
    });

    it('returns "very_low" when no PAA and organic < 5', async () => {
      global.fetch = mockFetchSuccess({
        searchParameters: { q: 'test', gl: 'us', hl: 'en', type: 'search' },
        organic: [
          { title: 'R1', link: 'https://e.com/1', snippet: 'x', position: 1 },
        ],
      });

      const result = await estimateVolume('test');

      expect(result.estimated_volume).toBe('very_low');
    });

    it('returns empty estimate when API key missing', async () => {
      setSerperConfig({ apiKey: '' });

      const result = await estimateVolume('test');

      expect(result.estimated_volume).toBe('very_low');
      expect(result.signals.organic_count).toBe(0);
    });
  });

  // ── detectSERPDepth ──

  describe('detectSERPDepth', () => {
    it('routes "vs" queries to compare', async () => {
      global.fetch = mockFetchSuccess({
        searchParameters: { q: 'claude code vs cursor', gl: 'us', hl: 'en', type: 'search' },
        organic: Array.from({ length: 5 }, (_, i) => ({
          title: `R${i}`, link: `https://e.com/${i}`, snippet: 'A'.repeat(200), position: i + 1,
        })),
      });

      const result = await detectSERPDepth('claude code vs cursor');

      expect(result.depth).toBe('mixed');
      expect(result.recommended_content_type).toBe('compare');
    });

    it('routes "alternative" queries to compare', async () => {
      global.fetch = mockFetchSuccess({
        searchParameters: { q: 'claude code alternative', gl: 'us', hl: 'en', type: 'search' },
        organic: [{ title: 'R1', link: 'https://e.com/1', snippet: 'x', position: 1 }],
      });

      const result = await detectSERPDepth('claude code alternative');

      expect(result.recommended_content_type).toBe('compare');
    });

    it('routes "what is" + short snippets to glossary', async () => {
      global.fetch = mockFetchSuccess({
        searchParameters: { q: 'what is claude code', gl: 'us', hl: 'en', type: 'search' },
        organic: Array.from({ length: 5 }, (_, i) => ({
          title: `R${i}`, link: `https://e.com/${i}`, snippet: 'A'.repeat(100), position: i + 1,
        })),
      });

      const result = await detectSERPDepth('what is claude code');

      expect(result.depth).toBe('short_answer');
      expect(result.recommended_content_type).toBe('glossary');
    });

    it('routes FAQ when answer box + short snippets', async () => {
      global.fetch = mockFetchSuccess({
        searchParameters: { q: 'how to install claude code', gl: 'us', hl: 'en', type: 'search' },
        answerBox: { answer: 'Run npm install', title: 'Install', link: 'https://e.com' },
        organic: Array.from({ length: 5 }, (_, i) => ({
          title: `R${i}`, link: `https://e.com/${i}`, snippet: 'A'.repeat(100), position: i + 1,
        })),
      });

      const result = await detectSERPDepth('how to install claude code');

      expect(result.depth).toBe('short_answer');
      expect(result.recommended_content_type).toBe('faq');
      expect(result.has_answer_box).toBe(true);
    });

    it('routes blog when long snippets', async () => {
      global.fetch = mockFetchSuccess({
        searchParameters: { q: 'claude code deep dive', gl: 'us', hl: 'en', type: 'search' },
        organic: Array.from({ length: 5 }, (_, i) => ({
          title: `R${i}`, link: `https://e.com/${i}`, snippet: 'A'.repeat(350), position: i + 1,
        })),
      });

      const result = await detectSERPDepth('claude code deep dive');

      expect(result.depth).toBe('long_form');
      expect(result.recommended_content_type).toBe('blog');
    });

    it('defaults to mixed/faq when no special signals', async () => {
      global.fetch = mockFetchSuccess({
        searchParameters: { q: 'claude code tips', gl: 'us', hl: 'en', type: 'search' },
        organic: Array.from({ length: 5 }, (_, i) => ({
          title: `R${i}`, link: `https://e.com/${i}`, snippet: 'A'.repeat(220), position: i + 1,
        })),
      });

      const result = await detectSERPDepth('claude code tips');

      expect(result.depth).toBe('mixed');
      expect(result.recommended_content_type).toBe('faq');
    });

    it('returns empty result when API key missing', async () => {
      setSerperConfig({ apiKey: '' });

      const result = await detectSERPDepth('test');

      expect(result.depth).toBe('mixed');
      expect(result.top_results).toEqual([]);
    });
  });

  // ── searchFull ──

  describe('searchFull', () => {
    it('returns full search response', async () => {
      global.fetch = mockFetchSuccess(mockSearchResponse);

      const result = await searchFull('claude code');

      expect(result.organic).toHaveLength(10);
      expect(result.peopleAlsoAsk).toHaveLength(4);
      expect(result.relatedSearches).toHaveLength(3);
    });

    it('returns empty response when API key missing', async () => {
      setSerperConfig({ apiKey: '' });

      const result = await searchFull('test');

      expect(result.organic).toEqual([]);
    });
  });

  // ── Error Handling ──

  describe('error handling', () => {
    it('throws SerperAPIError on HTTP 403', async () => {
      global.fetch = mockFetchError(403, 'Invalid API key');

      await expect(searchPAA('test')).rejects.toThrow(SerperAPIError);
      await expect(searchPAA('test')).rejects.toThrow('Serper API error 403');
    });

    it('throws SerperAPIError on HTTP 429', async () => {
      global.fetch = mockFetchError(429, 'Rate limit exceeded');

      await expect(searchPAA('test')).rejects.toThrow(SerperAPIError);
      await expect(searchPAA('test')).rejects.toThrow('Serper API error 429');
    });

    it('SerperAPIError has correct properties', () => {
      const err = new SerperAPIError(429, 'Rate limit');
      expect(err.status).toBe(429);
      expect(err.body).toBe('Rate limit');
      expect(err.name).toBe('SerperAPIError');
    });
  });

  // ── batchSearch ──

  describe('batchSearch', () => {
    it('processes multiple queries with delay', async () => {
      global.fetch = mockFetchSuccess(mockSearchResponse);
      const start = Date.now();

      const results = await batchSearch(['q1', 'q2', 'q3'], 50);

      const elapsed = Date.now() - start;
      expect(results).toHaveLength(3);
      // 2 delays between 3 queries (50ms each) → at least ~100ms
      expect(elapsed).toBeGreaterThanOrEqual(80);
    });

    it('calls fetch for each query', async () => {
      const fetchMock = mockFetchSuccess(mockSearchResponse);
      global.fetch = fetchMock;

      await batchSearch(['q1', 'q2'], 0);

      expect(fetchMock).toHaveBeenCalledTimes(2);
    });

    it('returns empty results when API key missing', async () => {
      setSerperConfig({ apiKey: '' });

      const results = await batchSearch(['q1', 'q2'], 0);

      expect(results).toHaveLength(2);
      expect(results[0].questions).toEqual([]);
      expect(results[1].questions).toEqual([]);
    });
  });

  // ── Request format ──

  describe('request format', () => {
    it('sends POST with correct headers and body', async () => {
      const fetchMock = mockFetchSuccess(mockSearchResponse);
      global.fetch = fetchMock;

      await searchPAA('test query', { gl: 'uk', hl: 'en' });

      expect(fetchMock).toHaveBeenCalledWith(
        'https://google.serper.dev/search',
        expect.objectContaining({
          method: 'POST',
          headers: {
            'X-API-KEY': 'test-key',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ q: 'test query', gl: 'uk', hl: 'en', num: 10 }),
        }),
      );
    });

    it('sends autocomplete request to correct endpoint', async () => {
      const fetchMock = mockFetchSuccess(mockAutocompleteResponse);
      global.fetch = fetchMock;

      await searchAutocomplete('test');

      expect(fetchMock).toHaveBeenCalledWith(
        'https://google.serper.dev/autocomplete',
        expect.objectContaining({
          method: 'POST',
        }),
      );
    });
  });
});
