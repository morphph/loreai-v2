import { describe, it, expect } from 'vitest';
import { semanticSearch, getContents, analyzeCompetitors } from '../exa';

const describeIfKey = process.env.EXA_API_KEY ? describe : describe.skip;

describeIfKey('exa (integration)', () => {
  it('semantic search for known topic returns results', async () => {
    const result = await semanticSearch('claude code setup guide', { numResults: 5 });

    expect(result.query).toBe('claude code setup guide');
    expect(result.results.length).toBeGreaterThan(0);
    for (const r of result.results) {
      expect(r.url).toBeTruthy();
      expect(r.title).toBeTruthy();
    }
  }, 30_000);

  it('semantic search with text content returns text', async () => {
    const result = await semanticSearch('claude code pricing', {
      numResults: 3,
      contents: { text: { maxCharacters: 1000 } },
    });

    expect(result.results.length).toBeGreaterThan(0);
    const withText = result.results.filter((r) => r.text && r.text.length > 0);
    expect(withText.length).toBeGreaterThan(0);
  }, 30_000);

  it('semantic search with date filter returns recent results', async () => {
    const result = await semanticSearch('claude code', {
      numResults: 5,
      startPublishedDate: '2025-01-01T00:00:00.000Z',
    });

    expect(result.results.length).toBeGreaterThan(0);
  }, 30_000);

  it('getContents for known URL returns text and word count', async () => {
    const result = await getContents(
      ['https://docs.anthropic.com/en/docs/claude-code/overview'],
      { text: { maxCharacters: 3000 } },
    );

    expect(result.pages.length).toBe(1);
    expect(result.pages[0].text.length).toBeGreaterThan(0);
    expect(result.pages[0].word_count).toBeGreaterThan(100);
  }, 30_000);

  it('getContents with invalid URL handles gracefully', async () => {
    const result = await getContents(
      ['https://example.com/nonexistent-page-12345-xyz'],
    );

    // Either the page comes back with minimal content or it fails
    const totalHandled = result.pages.length + result.failed.length;
    expect(totalHandled).toBeGreaterThanOrEqual(1);
  }, 30_000);

  it('analyzeCompetitors finds similar pages', async () => {
    const result = await analyzeCompetitors(
      'https://docs.anthropic.com/en/docs/claude-code/overview',
      { numResults: 5 },
    );

    expect(result.competitors.length).toBeGreaterThan(0);
    for (const c of result.competitors) {
      expect(c.url).toBeTruthy();
    }
    expect(result.coverage_gaps).toEqual([]);
    expect(result.common_themes).toEqual([]);
  }, 30_000);

  it('sequential calls within rate limit all succeed', async () => {
    const queries = ['claude code', 'AI coding tools', 'LLM development'];
    for (const q of queries) {
      const result = await semanticSearch(q, { numResults: 3 });
      expect(result.results.length).toBeGreaterThan(0);
    }
  }, 60_000);
});
