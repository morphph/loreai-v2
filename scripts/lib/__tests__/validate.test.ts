import { describe, it, expect } from 'vitest';
import {
  validateNewsletter,
  validateBlogPost,
  validateZhNewsletter,
  validateGlossary,
  validateFaq,
  validateCompare,
  validateTopicHub,
} from '../validate';

// ── Newsletter Validation ──────────────────────────────────────────────

describe('validateNewsletter', () => {
  const validNewsletter = `
# AI Moves Fast: Today's Briefing

## Model Releases

**OpenAI launches GPT-5** — faster, cheaper.

**Anthropic ships Claude 4.5** — coding benchmarks up.

**Google launches Gemini 2.5** — multimodal gains.

## Tools & Infra

**Hugging Face hits 1M models** — open-source milestone.
`;

  it('passes for valid markdown', () => {
    const result = validateNewsletter(validNewsletter);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('fails when missing H1', () => {
    const md = `## Section One\n\n**Bold one** text\n\n**Bold two** text\n\n**Bold three** text\n\n## Section Two\n\nContent here.`;
    const result = validateNewsletter(md);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Missing H1 title');
  });

  it('fails with fewer than 2 H2 sections', () => {
    const md = `# Title\n\n## Only One Section\n\n**Bold one** text\n\n**Bold two** text\n\n**Bold three** text`;
    const result = validateNewsletter(md);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('<2 H2 sections');
  });

  it('fails with fewer than 3 bold items', () => {
    const md = `# Title\n\n## Section One\n\n**Bold one** text\n\n## Section Two\n\nNo bold here.`;
    const result = validateNewsletter(md);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('<3 bold items');
  });

  it('detects meta-summary phrase "in this newsletter"', () => {
    const md = `# Title\n\n## S1\n\n**A** x\n**B** x\n**C** x\n\n## S2\n\nIn this newsletter we cover AI.`;
    const result = validateNewsletter(md);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Meta-summary detected');
  });

  it('detects meta-summary phrase "in today\'s issue"', () => {
    const md = `# Title\n\n## S1\n\n**A** x\n**B** x\n**C** x\n\n## S2\n\nIn today's issue we discuss...`;
    const result = validateNewsletter(md);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Meta-summary detected');
  });

  it('detects date-based title', () => {
    const md = `# 2026-02-28 Newsletter\n\n## S1\n\n**A** x\n**B** x\n**C** x\n\n## S2\n\nContent.`;
    const result = validateNewsletter(md);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Date-based title');
  });
});

// ── Blog Post Validation ───────────────────────────────────────────────

describe('validateBlogPost', () => {
  // Generate a blog with ~600 words
  const filler = Array(100).fill('This is filler text for word count testing purposes and more.').join(' ');
  const validBlog = `# GPT-5 Turbo Review\n\n## Architecture\n\n${filler}\n\n## Conclusion\n\nWrap up here.\n\n[Subscribe to our newsletter](/subscribe)`;

  it('passes for valid blog post', () => {
    const result = validateBlogPost(validBlog);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('fails when too short', () => {
    const md = `# Short Post\n\n## Intro\n\nJust a few words.\n\n## End\n\nDone.\n\n[Subscribe](/subscribe)`;
    const result = validateBlogPost(md);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes('Too short'))).toBe(true);
  });

  it('catches forbidden phrase "without further ado"', () => {
    const md = `# Title\n\n## S1\n\n${filler}\n\nWithout further ado, here's the analysis.\n\n## S2\n\nMore.\n\n[Subscribe](/subscribe)`;
    const result = validateBlogPost(md);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Forbidden phrase detected');
  });

  it('catches forbidden phrase "in this article"', () => {
    const md = `# Title\n\n## S1\n\n${filler}\n\nIn this article we explore...\n\n## S2\n\nMore.\n\n[Subscribe](/subscribe)`;
    const result = validateBlogPost(md);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Forbidden phrase detected');
  });

  it('fails when missing newsletter CTA', () => {
    const md = `# Title\n\n## S1\n\n${filler}\n\n## S2\n\nDone.`;
    const result = validateBlogPost(md);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Missing newsletter CTA');
  });
});

// ── ZH Newsletter Validation ───────────────────────────────────────────

describe('validateZhNewsletter', () => {
  const validZh = `
# AI快报：今日要闻

## 模型发布

**OpenAI发布GPT-5** — 更快更便宜。

**Anthropic发布Claude 4.5** — 编程基准创新高。

**Google发布Gemini 2.5** — 多模态提升。

## 行业动态

**微软深度集成Copilot** — Office新功能。
`;

  it('passes for valid ZH newsletter', () => {
    const result = validateZhNewsletter(validZh);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('detects ZH meta-summary phrase', () => {
    const md = `# 标题\n\n## S1\n\n**A** x\n**B** x\n**C** x\n\n## S2\n\n在本期简报中我们讨论...`;
    const result = validateZhNewsletter(md);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Meta-summary detected (ZH)');
  });
});

// ── Glossary Validation ────────────────────────────────────────────────

describe('validateGlossary', () => {
  const wordsN = (n: number) => Array(n).fill('word').join(' ');

  it('passes for valid glossary (200-400 words)', () => {
    const md = `# Transformer\n\n${wordsN(250)}\n\n[Subscribe](/subscribe)`;
    const result = validateGlossary(md);
    expect(result.valid).toBe(true);
  });

  it('fails when too short (<150 words)', () => {
    const md = `# Term\n\n${wordsN(50)}\n\n[Subscribe](/subscribe)`;
    const result = validateGlossary(md);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes('Too short'))).toBe(true);
  });

  it('fails when too long (>500 words)', () => {
    const md = `# Term\n\n${wordsN(550)}\n\n[Subscribe](/subscribe)`;
    const result = validateGlossary(md);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes('Too long'))).toBe(true);
  });

  it('catches forbidden phrases', () => {
    const md = `# Term\n\n${wordsN(250)} In conclusion this is important.\n\n[Subscribe](/subscribe)`;
    const result = validateGlossary(md);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Forbidden phrase detected');
  });
});

// ── FAQ Validation ─────────────────────────────────────────────────────

describe('validateFaq', () => {
  const wordsN = (n: number) => Array(n).fill('word').join(' ');

  it('passes for valid FAQ (200-500 words)', () => {
    const md = `# What is RAG?\n\n${wordsN(300)}\n\n[Subscribe](/subscribe)`;
    const result = validateFaq(md);
    expect(result.valid).toBe(true);
  });

  it('fails when too short', () => {
    const md = `# Question\n\n${wordsN(50)}\n\n[Subscribe](/subscribe)`;
    const result = validateFaq(md);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes('Too short'))).toBe(true);
  });

  it('fails when too long (>600 words)', () => {
    const md = `# Question\n\n${wordsN(650)}\n\n[Subscribe](/subscribe)`;
    const result = validateFaq(md);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes('Too long'))).toBe(true);
  });
});

// ── Compare Validation ─────────────────────────────────────────────────

describe('validateCompare', () => {
  const wordsN = (n: number) => Array(n).fill('word').join(' ');

  it('passes for valid compare page', () => {
    const md = `# GPT-4 vs Claude 3\n\n## Overview\n\n${wordsN(200)}\n\n| Feature | GPT-4 | Claude 3 |\n|---------|-------|----------|\n| Speed | Fast | Faster |\n\n## Details\n\n${wordsN(200)}\n\n[Subscribe](/subscribe)`;
    const result = validateCompare(md);
    expect(result.valid).toBe(true);
  });

  it('fails when missing comparison table', () => {
    const md = `# A vs B\n\n## Overview\n\n${wordsN(200)}\n\n## Details\n\n${wordsN(200)}\n\n[Subscribe](/subscribe)`;
    const result = validateCompare(md);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Missing comparison table');
  });

  it('fails with fewer than 2 H2s', () => {
    const md = `# A vs B\n\n## Only One\n\n${wordsN(400)}\n\n| A | B |\n|---|---|\n| 1 | 2 |\n\n[Subscribe](/subscribe)`;
    const result = validateCompare(md);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes('H2 sections'))).toBe(true);
  });
});

// ── Topic Hub Validation ───────────────────────────────────────────────

describe('validateTopicHub', () => {
  const wordsN = (n: number) => Array(n).fill('word').join(' ');

  it('passes for valid topic hub', () => {
    const md = `# Large Language Models\n\n## Overview\n\n${wordsN(300)}\n\nSee [glossary](/glossary/transformer) for more.\n\n## Resources\n\n${wordsN(200)}\n\n[Subscribe](/subscribe)`;
    const result = validateTopicHub(md);
    expect(result.valid).toBe(true);
  });

  it('fails when missing internal links', () => {
    const md = `# Topic\n\n## Overview\n\n${wordsN(300)}\n\nNo links here at all.\n\n## Resources\n\n${wordsN(200)}\n\n[Subscribe](https://example.com/subscribe)`;
    const result = validateTopicHub(md);
    expect(result.errors).toContain('No internal links found');
  });

  it('fails when too short', () => {
    const md = `# Topic\n\n## S1\n\nShort.\n\n## S2\n\n[Link](/foo)\n\n[Subscribe](/subscribe)`;
    const result = validateTopicHub(md);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes('Too short'))).toBe(true);
  });

  it('fails when word count exceeds ceiling (>1200)', () => {
    const md = `# Topic\n\n## S1\n\n${wordsN(800)}\n\nSee [this](/page).\n\n## S2\n\n${wordsN(500)}\n\n[Subscribe](/subscribe)`;
    const result = validateTopicHub(md);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes('Too long'))).toBe(true);
  });
});
