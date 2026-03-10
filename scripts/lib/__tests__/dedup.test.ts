import { describe, it, expect } from 'vitest';
import { extractBoldTitles } from '../dedup';

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
