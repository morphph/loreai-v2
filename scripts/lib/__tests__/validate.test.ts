import { describe, it, expect } from 'vitest';
import {
  validateNewsletter,
  validateBlogPost,
  validateZhNewsletter,
  validateWeeklyNewsletter,
  validateWeeklyZhNewsletter,
  validateGlossary,
  validateFaq,
  validateCompare,
  validateTopicHub,
  validateNewsletterQuality,
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

## 🎓 MODEL LITERACY

Short explainer about a model concept.

## 🎯 PICK OF THE DAY

Top story of the day goes here.
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

## 🎓 模型小课堂

关于模型概念的简短解释。

## 🎯 今日精选

今天最重要的新闻。
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

  it('fails when too long (>600 words)', () => {
    const md = `# Term\n\n${wordsN(650)}\n\n[Subscribe](/subscribe)`;
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

// ── Weekly Newsletter Validation ─────────────────────────────────────────

describe('validateWeeklyNewsletter', () => {
  const validWeekly = `
# The Week AI Agents Went Mainstream

**Week of 2026-03-02 to 2026-03-06**

Big week for agents.

---

## 1. Story One

**Claude** ships agents. Details here.

## 2. Story Two

**OpenAI** responds with Codex.

## 3. Story Three

**Google** launches Gemini update.

## 4. Story Four

**Meta** open-sources Llama 4.

## 5. Story Five

**Anthropic** pricing changes.

## Quick Takes

- **Item A**: Short note.
- **Item B**: Another note.
`;

  it('passes for valid weekly newsletter', () => {
    const result = validateWeeklyNewsletter(validWeekly);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('fails when missing H1', () => {
    const md = `## 1. S1\n\n**A** x\n**B** x\n**C** x\n\n## 2. S2\n\n## 3. S3\n\n## 4. S4\n\n## 5. S5\n\n## Quick Takes`;
    const result = validateWeeklyNewsletter(md);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Missing H1 title');
  });

  it('fails with fewer than 5 H2 sections', () => {
    const md = `# Title\n\n## 1. Story\n\n**A** x\n**B** x\n**C** x\n\n## 2. Story\n\n## Quick Takes`;
    const result = validateWeeklyNewsletter(md);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('<5 H2 sections');
  });

  it('fails when missing Quick Takes section', () => {
    const md = `# Title\n\n**A** x\n**B** x\n**C** x\n\n## 1. S\n\n## 2. S\n\n## 3. S\n\n## 4. S\n\n## 5. S`;
    const result = validateWeeklyNewsletter(md);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Missing Quick Takes section');
  });

  it('does NOT require MODEL LITERACY or PICK OF THE DAY', () => {
    const result = validateWeeklyNewsletter(validWeekly);
    expect(result.errors).not.toContain('Missing MODEL LITERACY section');
    expect(result.errors).not.toContain('Missing PICK OF THE DAY section');
  });

  it('detects date-based title', () => {
    const md = `# 2026-03-07 Weekly\n\n**A** x\n**B** x\n**C** x\n\n## 1. S\n\n## 2. S\n\n## 3. S\n\n## 4. S\n\n## 5. S\n\n## Quick Takes`;
    const result = validateWeeklyNewsletter(md);
    expect(result.errors).toContain('Date-based title');
  });

  it('detects forbidden phrases', () => {
    const md = `# Title\n\n**A** x\n**B** x\n**C** x\n\n## 1. S\n\n## 2. S\n\n## 3. S\n\n## 4. S\n\n## 5. S\n\n## Quick Takes\n\nThis is game-changing.`;
    const result = validateWeeklyNewsletter(md);
    expect(result.errors).toContain('Forbidden phrase detected');
  });
});

describe('validateWeeklyZhNewsletter', () => {
  const validWeeklyZh = `
# 本周 AI 五大要事：Anthropic 和 OpenAI 正面交锋

**2026-03-02 至 2026-03-06**

大事不少。

---

## 1. 故事一

**Claude** 发布新版本。详情很多。

## 2. 故事二

**OpenAI** 跟进发布 Codex。

## 3. 故事三

**Google** 更新 Gemini。

## 4. 故事四

**Meta** 开源 Llama 4。

## 5. 故事五

**Anthropic** 调整定价。

## 速览

- **项目 A**：简要说明。
- **项目 B**：另一条。
`;

  it('passes for valid ZH weekly newsletter', () => {
    const result = validateWeeklyZhNewsletter(validWeeklyZh);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('fails when missing 速览 section', () => {
    const md = `# 标题\n\n**A** x\n**B** x\n**C** x\n\n## 1. S\n\n## 2. S\n\n## 3. S\n\n## 4. S\n\n## 5. S`;
    const result = validateWeeklyZhNewsletter(md);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Missing Quick Takes (速览) section');
  });

  it('does NOT require 模型小课堂 or 今日精选', () => {
    const result = validateWeeklyZhNewsletter(validWeeklyZh);
    expect(result.errors).not.toContain('Missing MODEL LITERACY (ZH)');
    expect(result.errors).not.toContain('Missing PICK OF THE DAY (ZH)');
  });

  it('detects ZH forbidden phrases', () => {
    const md = `# 标题\n\n**A** x\n**B** x\n**C** x\n\n## 1. S\n\n## 2. S\n\n## 3. S\n\n## 4. S\n\n## 5. S\n\n## 速览\n\n这是划时代的突破。`;
    const result = validateWeeklyZhNewsletter(md);
    expect(result.errors).toContain('Forbidden phrase detected (ZH)');
  });
});

// ── Newsletter Quality Validation ──────────────────────────────────────

describe('validateNewsletterQuality', () => {
  const validEN = `# OpenAI Splits Reasoning Into Two Tiers With O3 and O4 Mini

## Model Releases

**OpenAI launches GPT-5 with improved reasoning** — faster, cheaper, 2x context.

**Anthropic ships Claude 4.5 Sonnet update** — coding benchmarks significantly improved.

**Google rolls out Gemini 2.5 Pro preview** — multimodal gains across the board.

**Meta releases Llama 4 open weights** — competitive with proprietary models.

## Tools & Infra

**LangChain adds native MCP support** — simplifies tool integration.

## 🎓 MODEL LITERACY

Short explainer about a model concept.

## 🎯 PICK OF THE DAY

Top story of the day goes here.
`;

  it('passes for valid EN newsletter with no stale items', () => {
    const result = validateNewsletterQuality({
      md: validEN,
      lang: 'en',
    });
    expect(result.valid).toBe(true);
  });

  it('fails when >3 stale items (>72h old)', () => {
    const fourDaysAgo = new Date(Date.now() - 96 * 60 * 60 * 1000).toISOString();
    const staleItems = Array.from({ length: 5 }, (_, i) => ({
      id: i,
      title: `Stale item ${i}`,
      url: `https://example.com/${i}`,
      source: 'rss:test',
      detected_at: fourDaysAgo,
      engagement_likes: 100,
      engagement_retweets: 10,
      engagement_downloads: 0,
    }));

    const result = validateNewsletterQuality({
      md: validEN,
      lang: 'en',
      filteredItems: staleItems,
    });
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes('stale items'))).toBe(true);
  });

  it('passes when ≤3 stale items', () => {
    const fourDaysAgo = new Date(Date.now() - 96 * 60 * 60 * 1000).toISOString();
    const items = [
      { id: 1, title: 'Stale one', url: 'https://a.com/1', source: 'rss:a', detected_at: fourDaysAgo, engagement_likes: 0, engagement_retweets: 0, engagement_downloads: 0 },
      { id: 2, title: 'Fresh one', url: 'https://a.com/2', source: 'rss:a', detected_at: new Date().toISOString(), engagement_likes: 0, engagement_retweets: 0, engagement_downloads: 0 },
    ];

    const result = validateNewsletterQuality({
      md: validEN,
      lang: 'en',
      filteredItems: items,
    });
    expect(result.errors.some((e) => e.includes('stale items'))).toBe(false);
  });

  it('fails when cross-day overlap >20%', () => {
    const mdWithRepeats = `# Big News Day in AI Today

## Releases

**OpenAI launches GPT-5** — faster.

**Anthropic ships Claude 4.5** — better.

**Google rolls out Gemini Pro** — improved.

**Meta releases Llama model** — open.

**Microsoft updates Copilot** — new features.

## More

**Extra item here for length** — details.

## 🎓 MODEL LITERACY

Concept.

## 🎯 PICK OF THE DAY

Top.
`;

    const previousBoldTitles = [
      'OpenAI launches GPT-5',
      'Anthropic ships Claude 4.5',
      'Google rolls out Gemini Pro',
    ];

    const result = validateNewsletterQuality({
      md: mdWithRepeats,
      lang: 'en',
      previousBoldTitles,
    });
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes('Cross-day overlap'))).toBe(true);
  });

  it('passes when cross-day overlap ≤20%', () => {
    const previousBoldTitles = ['Some unrelated previous story about quantum computing'];

    const result = validateNewsletterQuality({
      md: validEN,
      lang: 'en',
      previousBoldTitles,
    });
    expect(result.errors.some((e) => e.includes('Cross-day overlap'))).toBe(false);
  });

  it('fails when too many short bold titles (EN)', () => {
    const md = `# Big News Day for AI World Today

## Section

**GPT** — wow.

**Claude** — nice.

**Gemini** — cool.

**Fourth Bold Item More Words** — details.

## More

Content.

## 🎓 MODEL LITERACY

Concept.

## 🎯 PICK OF THE DAY

Top.
`;

    const result = validateNewsletterQuality({ md, lang: 'en' });
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes('bold titles have ≤3 words'))).toBe(true);
  });

  it('detects ZH punctuation mixing', () => {
    const md = `# AI快报：今日要闻

## 模型发布

**OpenAI发布新版本** — 更快更便宜。

这是一个测试,我们来看看效果.

又一行混用标点,中文和英文混在一起.

第三行也有问题,标点不对.

## 🎓 模型小课堂

解释概念。

## 🎯 今日精选

今日精选内容。
`;

    const result = validateNewsletterQuality({ md, lang: 'zh' });
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes('ZH punctuation mixing'))).toBe(true);
  });

  it('passes ZH without punctuation mixing', () => {
    const md = `# AI快报：今日要闻

## 模型发布

**OpenAI发布新版本** — 更快、更便宜。

这是一个测试，我们来看看效果。

## 🎓 模型小课堂

解释概念。

## 🎯 今日精选

今日精选内容。
`;

    const result = validateNewsletterQuality({ md, lang: 'zh' });
    expect(result.errors.some((e) => e.includes('ZH punctuation mixing'))).toBe(false);
  });

  it('fails when EN H1 title is too short', () => {
    const md = `# AI News

## S1

**Long enough bold title here** — details.

**Another bold title with words** — more.

**Third bold title with content** — stuff.

## S2

Content.

## 🎓 MODEL LITERACY

Concept.

## 🎯 PICK OF THE DAY

Top.
`;

    const result = validateNewsletterQuality({ md, lang: 'en' });
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes('H1 title too short'))).toBe(true);
  });
});
