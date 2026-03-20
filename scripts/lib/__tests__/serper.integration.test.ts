import { describe, it, expect, beforeAll } from 'vitest';
import {
  searchPAA,
  searchRelated,
  searchAutocomplete,
  estimateVolume,
  detectSERPDepth,
  searchFull,
  setSerperConfig,
} from '../serper';

/**
 * Integration tests — hit real Serper API.
 * Only run when SERPER_API_KEY is set.
 *
 * Usage:
 *   SERPER_API_KEY=xxx npm test -- scripts/lib/__tests__/serper.integration.test.ts
 */

const describeIfKey = process.env.SERPER_API_KEY ? describe : describe.skip;

describeIfKey('serper integration', () => {
  beforeAll(() => {
    setSerperConfig({ apiKey: process.env.SERPER_API_KEY! });
  });

  it('PAA for known topic returns questions', async () => {
    const result = await searchPAA('claude code pricing');
    expect(result.query).toBe('claude code pricing');
    expect(result.questions.length).toBeGreaterThan(0);
    expect(result.questions[0]).toHaveProperty('question');
    expect(result.questions[0]).toHaveProperty('snippet');
  }, 15_000);

  it('related searches for known topic', async () => {
    const result = await searchRelated('claude code');
    expect(result.query).toBe('claude code');
    expect(result.related.length).toBeGreaterThan(0);
    expect(typeof result.related[0]).toBe('string');
  }, 15_000);

  it('autocomplete returns suggestions', async () => {
    const result = await searchAutocomplete('claude code');
    expect(result.query).toBe('claude code');
    expect(result.suggestions.length).toBeGreaterThan(0);
    expect(typeof result.suggestions[0]).toBe('string');
  }, 15_000);

  it('volume estimate for head term returns high or medium', async () => {
    const result = await estimateVolume('claude code');
    expect(result.query).toBe('claude code');
    expect(['high', 'medium']).toContain(result.estimated_volume);
    expect(result.signals).toHaveProperty('has_answer_box');
    expect(result.signals).toHaveProperty('organic_count');
  }, 15_000);

  it('SERP depth for compare query returns compare', async () => {
    const result = await detectSERPDepth('claude code vs cursor');
    expect(result.query).toBe('claude code vs cursor');
    expect(result.recommended_content_type).toBe('compare');
    expect(result.depth).toBe('mixed');
  }, 15_000);

  it('SERP depth for how-to query returns faq or blog', async () => {
    const result = await detectSERPDepth('how to install claude code');
    expect(['faq', 'blog']).toContain(result.recommended_content_type);
    expect(result.top_results.length).toBeGreaterThan(0);
  }, 15_000);

  it('full search returns organic results', async () => {
    const result = await searchFull('claude code');
    expect(result.organic.length).toBeGreaterThan(0);
    expect(result.organic[0]).toHaveProperty('title');
    expect(result.organic[0]).toHaveProperty('link');
    expect(result.organic[0]).toHaveProperty('snippet');
  }, 15_000);
});
