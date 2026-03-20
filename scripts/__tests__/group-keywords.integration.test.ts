/**
 * Integration tests for B2 — Keyword Grouping
 *
 * Uses real Claude API + in-memory SQLite DB.
 * Only runs when ANTHROPIC_API_KEY is set.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

const describeIfKey = process.env.ANTHROPIC_API_KEY ? describe : describe.skip;

// We test parseGroupingResponse and buildPrompt without API.
// The full Claude integration requires an API key.

import {
  buildPrompt,
  parseGroupingResponse,
} from '../lib/keyword-group';

import type { KeywordInput, ClaudeGroupOutput } from '../lib/keyword-group';

// ── Test data ──

const TEST_KEYWORDS: KeywordInput[] = [
  { id: 1, keyword: 'claude code pricing', source: 'serper-related', search_volume: 10000, competition: 'medium' },
  { id: 2, keyword: 'how much does claude code cost', source: 'serper-paa', search_volume: 1000, competition: 'low' },
  { id: 3, keyword: 'claude code cost', source: 'serper-related', search_volume: 1000, competition: 'low' },
  { id: 4, keyword: 'claude code pricing 2026', source: 'serper-autocomplete', search_volume: 100, competition: 'low' },
  { id: 5, keyword: 'is claude code free', source: 'serper-paa', search_volume: 10000, competition: 'medium' },
  { id: 6, keyword: 'claude code free tier', source: 'serper-related', search_volume: 1000, competition: 'low' },
  { id: 7, keyword: 'claude code vs cursor pricing', source: 'exa-competitor', search_volume: null, competition: null },
  { id: 8, keyword: 'claude code enterprise pricing', source: 'exa-competitor', search_volume: null, competition: null },
  { id: 9, keyword: 'what is claude code', source: 'serper-paa', search_volume: 5000, competition: 'medium' },
  { id: 10, keyword: 'claude code api pricing', source: 'serper-autocomplete', search_volume: 100, competition: 'low' },
];

// ── Unit-level integration tests (no API key needed) ──

describe('parseGroupingResponse — integration scenarios', () => {
  const inputKeywords = TEST_KEYWORDS.map((kw) => kw.keyword);

  it('handles realistic Claude response with all keywords accounted for', () => {
    const response: ClaudeGroupOutput = {
      groups: [
        {
          primary_keyword: 'how much does claude code cost',
          secondary_keywords: ['claude code pricing', 'claude code cost', 'claude code pricing 2026', 'claude code api pricing'],
          intent: 'informational',
          content_type: 'faq',
          rationale: 'All express the same intent: understanding the cost of Claude Code',
        },
        {
          primary_keyword: 'is claude code free',
          secondary_keywords: ['claude code free tier'],
          intent: 'informational',
          content_type: 'faq',
          rationale: 'All ask whether a free option exists',
        },
        {
          primary_keyword: 'claude code vs cursor pricing',
          secondary_keywords: [],
          intent: 'commercial',
          content_type: 'compare',
          rationale: 'Comparison intent',
        },
        {
          primary_keyword: 'what is claude code',
          secondary_keywords: [],
          intent: 'definitional',
          content_type: 'glossary',
          rationale: 'Definition query',
        },
      ],
      ungrouped: ['claude code enterprise pricing'],
    };

    const result = parseGroupingResponse(JSON.stringify(response), inputKeywords);

    // All 10 keywords should be accounted for
    const grouped = result.groups.flatMap((g) => [g.primary_keyword, ...g.secondary_keywords]);
    const total = grouped.length + result.ungrouped.length;
    expect(total).toBe(10);

    // Check intent diversity
    const intents = new Set(result.groups.map((g) => g.intent));
    expect(intents.size).toBeGreaterThanOrEqual(2);

    // Primary keywords should be from input
    for (const g of result.groups) {
      expect(inputKeywords).toContain(g.primary_keyword);
    }

    // No duplicates
    const allKw = [...grouped, ...result.ungrouped];
    expect(new Set(allKw).size).toBe(allKw.length);
  });
});

describe('buildPrompt — integration', () => {
  it('produces a well-formed prompt for Claude', () => {
    const prompt = buildPrompt('claude-code-pricing', 'Claude Code Pricing', TEST_KEYWORDS);

    // Should be substantial enough for Claude
    expect(prompt.length).toBeGreaterThan(200);

    // Should contain all keywords
    for (const kw of TEST_KEYWORDS) {
      expect(prompt).toContain(kw.keyword);
    }

    // Should have structure
    expect(prompt).toContain('## Subtopic:');
    expect(prompt).toContain('## Keywords');
    expect(prompt).toContain('Return JSON only');
  });
});

// ── Full Claude API integration tests ──

describeIfKey('Claude API integration — keyword grouping', () => {
  let Anthropic: typeof import('@anthropic-ai/sdk').default;

  beforeEach(async () => {
    const mod = await import('@anthropic-ai/sdk');
    Anthropic = mod.default;
  });

  it('groups pricing keywords correctly', { timeout: 30000 }, async () => {
      const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });

      const skillPath = path.resolve(process.cwd(), 'skills/keyword-grouping/SKILL.md');
      const skill = fs.readFileSync(skillPath, 'utf-8');
      const prompt = buildPrompt('claude-code-pricing', 'Claude Code Pricing', TEST_KEYWORDS);

      const response = await anthropic.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 4096,
        system: skill,
        messages: [{ role: 'user', content: prompt }],
      });

      const textBlock = response.content.find((b) => b.type === 'text');
      expect(textBlock).toBeDefined();

      const inputKeywords = TEST_KEYWORDS.map((kw) => kw.keyword);
      const result = parseGroupingResponse(textBlock!.type === 'text' ? textBlock!.text : '', inputKeywords);

      // At least 2 groups (cost/pricing group and free group should be separate)
      expect(result.groups.length).toBeGreaterThanOrEqual(2);

      // At least one group should have commercial intent (the vs/compare keyword)
      const hasCommercial = result.groups.some((g) => g.intent === 'commercial');
      expect(hasCommercial).toBe(true);

      // All keywords should be accounted for
      const grouped = result.groups.flatMap((g) => [g.primary_keyword, ...g.secondary_keywords]);
      const total = grouped.length + result.ungrouped.length;
      expect(total).toBeGreaterThanOrEqual(inputKeywords.length - 2); // allow small miss

      // Primary keywords should be from input
      for (const g of result.groups) {
        expect(inputKeywords).toContain(g.primary_keyword);
      }

      // No duplicate assignments
      const allGrouped = result.groups.flatMap((g) => [g.primary_keyword, ...g.secondary_keywords]);
      expect(new Set(allGrouped).size).toBe(allGrouped.length);
    });
});
