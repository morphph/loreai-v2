import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  semanticSearch,
  getContents,
  analyzeCompetitors,
  setExaConfig,
  countWords,
  ExaAPIError,
} from '../exa';

// ── Mock Data ──

const mockSearchResponse = {
  requestId: 'req-123',
  results: [
    {
      url: 'https://example.com/page1',
      title: 'Claude Code Guide',
      publishedDate: '2025-06-01T00:00:00.000Z',
      author: 'John Doe',
      text: 'This is a guide about Claude Code setup and usage.',
      highlights: ['Claude Code setup'],
      summary: 'A guide about Claude Code',
    },
    {
      url: 'https://example.com/page2',
      title: 'AI Coding Tools',
      publishedDate: null,
      author: null,
      text: 'Comparing various AI coding tools.',
    },
  ],
};

const mockContentsResponse = {
  results: [
    {
      id: 'https://example.com/page1',
      title: 'Page One',
      text: 'Full text content of page one with several words here.',
      summary: 'Summary of page one',
    },
    {
      id: 'https://example.com/page2',
      title: 'Page Two',
      text: 'Content of page two.',
    },
  ],
  statuses: [
    { id: 'https://example.com/page1', status: 'success' as const },
    { id: 'https://example.com/page2', status: 'success' as const },
  ],
};

const mockContentsPartialFailure = {
  results: [
    {
      id: 'https://example.com/page1',
      title: 'Page One',
      text: 'Full text content of page one.',
    },
  ],
  statuses: [
    { id: 'https://example.com/page1', status: 'success' as const },
    {
      id: 'https://example.com/bad-page',
      status: 'error' as const,
      error: { tag: 'CRAWL_NOT_FOUND', httpStatusCode: 404 },
    },
  ],
};

const mockFindSimilarResponse = {
  requestId: 'req-456',
  results: [
    {
      url: 'https://competitor.com/guide',
      title: 'Competitor Guide',
      publishedDate: '2025-05-01T00:00:00.000Z',
      author: 'Jane',
      text: 'Competitor content about the same topic.',
      summary: 'Competitor summary',
    },
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

describe('exa', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    setExaConfig({ apiKey: 'test-key' });
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  // ── countWords ──

  describe('countWords', () => {
    it('counts English words by spaces', () => {
      expect(countWords('hello world foo bar')).toBe(4);
    });

    it('counts CJK characters individually', () => {
      expect(countWords('你好世界')).toBe(4);
    });

    it('counts mixed English + CJK correctly', () => {
      expect(countWords('hello 你好 world')).toBe(4); // 2 english + 2 CJK
    });

    it('returns 0 for empty string', () => {
      expect(countWords('')).toBe(0);
    });

    it('handles multiple spaces and newlines', () => {
      expect(countWords('  hello   world  \n  foo  ')).toBe(3);
    });
  });

  // ── semanticSearch ──

  describe('semanticSearch', () => {
    it('returns mapped results from API response', async () => {
      global.fetch = mockFetchSuccess(mockSearchResponse);

      const result = await semanticSearch('claude code guide');

      expect(result.query).toBe('claude code guide');
      expect(result.results).toHaveLength(2);
      expect(result.results[0]).toEqual({
        url: 'https://example.com/page1',
        title: 'Claude Code Guide',
        published_date: '2025-06-01T00:00:00.000Z',
        author: 'John Doe',
        text: 'This is a guide about Claude Code setup and usage.',
        highlights: ['Claude Code setup'],
        summary: 'A guide about Claude Code',
      });
      expect(result.results[1].published_date).toBeNull();
      expect(result.results[1].author).toBeNull();
    });

    it('defaults excludeDomains to loreai.dev', async () => {
      global.fetch = mockFetchSuccess(mockSearchResponse);

      await semanticSearch('test query');

      const callBody = JSON.parse((global.fetch as ReturnType<typeof vi.fn>).mock.calls[0][1].body);
      expect(callBody.excludeDomains).toEqual(['loreai.dev']);
    });

    it('allows overriding excludeDomains', async () => {
      global.fetch = mockFetchSuccess(mockSearchResponse);

      await semanticSearch('test query', { excludeDomains: ['other.com'] });

      const callBody = JSON.parse((global.fetch as ReturnType<typeof vi.fn>).mock.calls[0][1].body);
      expect(callBody.excludeDomains).toEqual(['other.com']);
    });

    it('sends correct default parameters', async () => {
      global.fetch = mockFetchSuccess(mockSearchResponse);

      await semanticSearch('test query');

      const callBody = JSON.parse((global.fetch as ReturnType<typeof vi.fn>).mock.calls[0][1].body);
      expect(callBody.query).toBe('test query');
      expect(callBody.type).toBe('auto');
      expect(callBody.num_results).toBe(10);
    });

    it('passes optional filters when provided', async () => {
      global.fetch = mockFetchSuccess(mockSearchResponse);

      await semanticSearch('test', {
        startPublishedDate: '2025-01-01T00:00:00.000Z',
        category: 'news',
        includeDomains: ['specific.com'],
      });

      const callBody = JSON.parse((global.fetch as ReturnType<typeof vi.fn>).mock.calls[0][1].body);
      expect(callBody.startPublishedDate).toBe('2025-01-01T00:00:00.000Z');
      expect(callBody.category).toBe('news');
      expect(callBody.includeDomains).toEqual(['specific.com']);
    });

    it('returns empty results when API returns no results', async () => {
      global.fetch = mockFetchSuccess({ requestId: 'req-789', results: [] });

      const result = await semanticSearch('obscure query');

      expect(result.results).toHaveLength(0);
    });

    it('returns empty when API key is missing', async () => {
      setExaConfig({ apiKey: '' });
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      const result = await semanticSearch('test');

      expect(result.results).toHaveLength(0);
      expect(warnSpy).toHaveBeenCalledWith('EXA_API_KEY not set, returning empty search result');
      warnSpy.mockRestore();
    });
  });

  // ── getContents ──

  describe('getContents', () => {
    it('maps successful pages with word count', async () => {
      global.fetch = mockFetchSuccess(mockContentsResponse);

      const result = await getContents(['https://example.com/page1', 'https://example.com/page2']);

      expect(result.pages).toHaveLength(2);
      expect(result.failed).toHaveLength(0);
      expect(result.pages[0].url).toBe('https://example.com/page1');
      expect(result.pages[0].title).toBe('Page One');
      expect(result.pages[0].text).toBe('Full text content of page one with several words here.');
      expect(result.pages[0].summary).toBe('Summary of page one');
      expect(result.pages[0].word_count).toBe(10);
      expect(result.pages[0].status).toBe('success');
    });

    it('handles partial failure — separates success and error', async () => {
      global.fetch = mockFetchSuccess(mockContentsPartialFailure);

      const result = await getContents(['https://example.com/page1', 'https://example.com/bad-page']);

      expect(result.pages).toHaveLength(1);
      expect(result.pages[0].url).toBe('https://example.com/page1');
      expect(result.failed).toHaveLength(1);
      expect(result.failed[0].url).toBe('https://example.com/bad-page');
      expect(result.failed[0].error).toContain('CRAWL_NOT_FOUND');
    });

    it('marks URLs not in results as failed', async () => {
      global.fetch = mockFetchSuccess({
        results: [
          { id: 'https://example.com/page1', title: 'P1', text: 'text' },
        ],
        statuses: [
          { id: 'https://example.com/page1', status: 'success' },
        ],
      });

      const result = await getContents(['https://example.com/page1', 'https://example.com/missing']);

      expect(result.pages).toHaveLength(1);
      expect(result.failed).toHaveLength(1);
      expect(result.failed[0].url).toBe('https://example.com/missing');
      expect(result.failed[0].error).toBe('Not returned in results');
    });

    it('sends correct request body', async () => {
      global.fetch = mockFetchSuccess(mockContentsResponse);

      await getContents(['https://example.com/page1'], { summary: { query: 'summarize this' } });

      const [url, init] = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0];
      expect(url).toBe('https://api.exa.ai/contents');
      const callBody = JSON.parse(init.body);
      expect(callBody.urls).toEqual(['https://example.com/page1']);
      expect(callBody.summary).toEqual({ query: 'summarize this' });
    });

    it('returns empty for empty URL list', async () => {
      const result = await getContents([]);

      expect(result.pages).toHaveLength(0);
      expect(result.failed).toHaveLength(0);
    });

    it('returns empty when API key is missing', async () => {
      setExaConfig({ apiKey: '' });
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      const result = await getContents(['https://example.com/page1']);

      expect(result.pages).toHaveLength(0);
      expect(result.failed).toHaveLength(0);
      expect(warnSpy).toHaveBeenCalledWith('EXA_API_KEY not set, returning empty contents result');
      warnSpy.mockRestore();
    });
  });

  // ── analyzeCompetitors ──

  describe('analyzeCompetitors', () => {
    it('calls findSimilar endpoint with url in body', async () => {
      global.fetch = mockFetchSuccess(mockFindSimilarResponse);

      await analyzeCompetitors('https://loreai.dev/blog/test');

      const [url, init] = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0];
      expect(url).toBe('https://api.exa.ai/findSimilar');
      const callBody = JSON.parse(init.body);
      expect(callBody.url).toBe('https://loreai.dev/blog/test');
    });

    it('excludes loreai.dev by default', async () => {
      global.fetch = mockFetchSuccess(mockFindSimilarResponse);

      await analyzeCompetitors('https://loreai.dev/blog/test');

      const callBody = JSON.parse((global.fetch as ReturnType<typeof vi.fn>).mock.calls[0][1].body);
      expect(callBody.excludeDomains).toEqual(['loreai.dev']);
    });

    it('returns competitor pages with word count', async () => {
      global.fetch = mockFetchSuccess(mockFindSimilarResponse);

      const result = await analyzeCompetitors('https://loreai.dev/blog/test');

      expect(result.source_url).toBe('https://loreai.dev/blog/test');
      expect(result.competitors).toHaveLength(1);
      expect(result.competitors[0].url).toBe('https://competitor.com/guide');
      expect(result.competitors[0].title).toBe('Competitor Guide');
      expect(result.competitors[0].published_date).toBe('2025-05-01T00:00:00.000Z');
      expect(result.competitors[0].word_count).toBeGreaterThan(0);
    });

    it('returns empty coverage_gaps and common_themes', async () => {
      global.fetch = mockFetchSuccess(mockFindSimilarResponse);

      const result = await analyzeCompetitors('https://loreai.dev/blog/test');

      expect(result.coverage_gaps).toEqual([]);
      expect(result.common_themes).toEqual([]);
    });

    it('returns empty when API key is missing', async () => {
      setExaConfig({ apiKey: '' });
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      const result = await analyzeCompetitors('https://loreai.dev/blog/test');

      expect(result.competitors).toHaveLength(0);
      expect(result.coverage_gaps).toEqual([]);
      expect(result.common_themes).toEqual([]);
      warnSpy.mockRestore();
    });
  });

  // ── Error Handling ──

  describe('error handling', () => {
    it('throws ExaAPIError on HTTP 401', async () => {
      global.fetch = mockFetchError(401, 'Unauthorized');

      await expect(semanticSearch('test')).rejects.toThrow(ExaAPIError);
      await expect(semanticSearch('test')).rejects.toThrow('Exa API error 401: Unauthorized');
    });

    it('throws ExaAPIError on HTTP 429', async () => {
      global.fetch = mockFetchError(429, 'Rate limited');

      await expect(semanticSearch('test')).rejects.toThrow(ExaAPIError);
      await expect(semanticSearch('test')).rejects.toThrow('Exa API error 429: Rate limited');
    });

    it('ExaAPIError has correct properties', async () => {
      global.fetch = mockFetchError(403, 'Forbidden');

      try {
        await semanticSearch('test');
        expect.fail('Should have thrown');
      } catch (e) {
        expect(e).toBeInstanceOf(ExaAPIError);
        expect((e as ExaAPIError).status).toBe(403);
        expect((e as ExaAPIError).body).toBe('Forbidden');
        expect((e as ExaAPIError).name).toBe('ExaAPIError');
      }
    });

    it('sends correct auth header', async () => {
      global.fetch = mockFetchSuccess(mockSearchResponse);
      setExaConfig({ apiKey: 'my-secret-key' });

      await semanticSearch('test');

      const headers = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0][1].headers;
      expect(headers['x-api-key']).toBe('my-secret-key');
      expect(headers['Content-Type']).toBe('application/json');
    });
  });
});
