import { describe, it, expect } from 'vitest';
import { validateOutline, extractJsonObject } from '../outline';

// ── extractJsonObject ─────────────────────────────────────────────────

describe('extractJsonObject', () => {
  it('extracts JSON from plain content', () => {
    const result = extractJsonObject('{"date":"2026-03-11"}');
    expect(result).toBe('{"date":"2026-03-11"}');
  });

  it('extracts JSON from ```json wrapper', () => {
    const result = extractJsonObject('```json\n{"date":"2026-03-11"}\n```');
    expect(result).toBe('{"date":"2026-03-11"}');
  });

  it('extracts JSON from prose wrapper', () => {
    const result = extractJsonObject('Here is the outline:\n\n{"date":"2026-03-11","total_items":20}\n\nDone.');
    expect(result).toBe('{"date":"2026-03-11","total_items":20}');
  });

  it('returns trimmed content when no braces found', () => {
    const result = extractJsonObject('  no json here  ');
    expect(result).toBe('no json here');
  });
});

// ── validateOutline ───────────────────────────────────────────────────

const validOutline = {
  date: '2026-03-11',
  headline_hook: 'OpenAI Ships GPT-5 While Anthropic Goes Enterprise',
  preview_topics: ['GPT-5 launch', 'Claude enterprise features', 'new coding benchmarks'],
  pick_of_the_day: {
    item_id: 1,
    thesis: 'The 20-minute model war reveals more about competitive dynamics than any benchmark ever could',
  },
  model_literacy: {
    concept: 'Context Window vs. Effective Context',
    relevance: 'Both new models claim huge context windows — but effective usage varies dramatically',
  },
  sections: [
    {
      name: 'LAUNCH',
      items: [
        { id: 1, title: 'GPT-5 is here', section: 'LAUNCH', prominence: 'hero', angle: 'Biggest launch of the year', key_fact: '57% on SWE-Bench Pro' },
        { id: 2, title: 'Claude Enterprise launches', section: 'LAUNCH', prominence: 'hero', angle: 'Enterprise play', key_fact: '$100/seat/month' },
      ],
    },
    {
      name: 'TOOL',
      items: [
        { id: 3, title: 'Xcode gets Claude SDK', section: 'TOOL', prominence: 'regular', angle: 'Apple dev integration', key_fact: 'Full agent loop support' },
      ],
    },
    {
      name: 'TECHNIQUE',
      items: [
        { id: 4, title: 'Infra noise breaks benchmarks', section: 'TECHNIQUE', prominence: 'regular', angle: 'Eval reliability', key_fact: 'Several % swing' },
      ],
    },
    {
      name: 'INSIGHT',
      items: [
        { id: 5, title: 'ServiceNow picks Claude', section: 'INSIGHT', prominence: 'regular', angle: 'Enterprise consolidation', key_fact: 'Single provider strategy' },
      ],
    },
    {
      name: 'BUILD',
      items: [
        { id: 6, title: 'Community Evals live', section: 'BUILD', prominence: 'regular', angle: 'Decentralized benchmarking', key_fact: 'Auditable leaderboard' },
        { id: 7, title: 'New open-source agent framework', section: 'BUILD', prominence: 'regular', angle: 'Builder tool', key_fact: '10K stars in a week' },
        { id: 8, title: 'RAG tutorial with citations', section: 'BUILD', prominence: 'regular', angle: 'Practical guide', key_fact: '95% citation accuracy' },
        { id: 9, title: 'Vector DB comparison 2026', section: 'BUILD', prominence: 'regular', angle: 'Updated benchmarks', key_fact: '12 DBs tested' },
        { id: 10, title: 'MCP server template', section: 'BUILD', prominence: 'regular', angle: 'Quick start', key_fact: '5 min setup' },
        { id: 11, title: 'LLM cost calculator', section: 'BUILD', prominence: 'regular', angle: 'Budget planning', key_fact: 'All major providers' },
      ],
    },
  ],
  quick_links: [
    { id: 12, title: 'SyGra Studio', section: 'QUICK_LINKS', prominence: 'quick', angle: 'New from HF', key_fact: 'HF + ServiceNow collab' },
    { id: 13, title: 'Nemotron embed v2', section: 'QUICK_LINKS', prominence: 'quick', angle: 'NVIDIA retrieval', key_fact: 'Tops ViDoRe V3' },
    { id: 14, title: 'AI for endangered species', section: 'QUICK_LINKS', prominence: 'quick', angle: 'Google genomics', key_fact: 'Genome sequencing' },
    { id: 15, title: 'New tokenizer paper', section: 'QUICK_LINKS', prominence: 'quick', angle: 'Research', key_fact: '15% fewer tokens' },
  ],
  total_items: 15,
};

describe('validateOutline', () => {
  it('passes for valid outline', () => {
    const result = validateOutline(JSON.stringify(validOutline));
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('fails on invalid JSON', () => {
    const result = validateOutline('not json at all');
    expect(result.valid).toBe(false);
    expect(result.errors[0]).toMatch(/Invalid JSON/);
  });

  it('fails when missing required fields', () => {
    const result = validateOutline(JSON.stringify({ date: '2026-03-11' }));
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Missing required field: headline_hook');
  });

  it('fails when sections is empty', () => {
    const bad = { ...validOutline, sections: [] };
    const result = validateOutline(JSON.stringify(bad));
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('sections must be a non-empty array');
  });

  it('fails when a section has 0 items', () => {
    const bad = {
      ...validOutline,
      sections: [{ name: 'LAUNCH', items: [] }, ...validOutline.sections.slice(1)],
    };
    const result = validateOutline(JSON.stringify(bad));
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Section "LAUNCH" must have at least 1 item');
  });

  it('fails when POTD item_id not in items', () => {
    const bad = {
      ...validOutline,
      pick_of_the_day: { item_id: 999, thesis: 'Some thesis about the industry' },
    };
    const result = validateOutline(JSON.stringify(bad));
    expect(result.valid).toBe(false);
    expect(result.errors[0]).toMatch(/pick_of_the_day.item_id.*999.*not found/);
  });

  it('fails when headline_hook is too short', () => {
    const bad = { ...validOutline, headline_hook: 'Ships Fast' };
    const result = validateOutline(JSON.stringify(bad));
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.includes('words (need >= 6)'))).toBe(true);
  });

  it('fails when headline_hook has no verb', () => {
    const bad = { ...validOutline, headline_hook: 'The Big AI News Day for Developers Today' };
    const result = validateOutline(JSON.stringify(bad));
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('headline_hook must contain at least one common verb (ships, drops, launches, etc.)');
  });

  it('fails when preview_topics count is not 3', () => {
    const bad = { ...validOutline, preview_topics: ['one', 'two'] };
    const result = validateOutline(JSON.stringify(bad));
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.includes('exactly 3 items'))).toBe(true);
  });

  it('fails when total_items is out of range', () => {
    const bad = { ...validOutline, total_items: 5 };
    const result = validateOutline(JSON.stringify(bad));
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.includes('15-25'))).toBe(true);
  });

  it('fails with fewer than 2 heroes', () => {
    const noHeroes = {
      ...validOutline,
      sections: validOutline.sections.map(s => ({
        ...s,
        items: s.items.map(i => ({ ...i, prominence: 'regular' as const })),
      })),
    };
    const result = validateOutline(JSON.stringify(noHeroes));
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.includes('hero items'))).toBe(true);
  });

  it('handles ```json wrapped content', () => {
    const wrapped = '```json\n' + JSON.stringify(validOutline) + '\n```';
    const result = validateOutline(wrapped);
    expect(result.valid).toBe(true);
  });
});
