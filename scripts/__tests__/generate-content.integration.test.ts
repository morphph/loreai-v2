import { describe, test, expect } from 'vitest';
import { buildGenerationPrompt, getValidatorForType, setSkillContent } from '../lib/content-gen';
import type { QueueJob, SourcePack, ContentType } from '../lib/content-gen';

/**
 * Integration tests for content generation.
 * These tests verify prompt building and validation routing
 * without requiring API keys.
 */

// ── Fixtures ──

function makeJob(overrides: Partial<QueueJob> = {}): QueueJob {
  return {
    job_id: 1,
    keyword_group_id: 10,
    content_type: 'faq',
    research_pipeline: 'standard',
    priority_score: 450.0,
    status: 'pending',
    primary_keyword: 'how much does claude code cost',
    intent: 'informational',
    cluster_slug: 'claude-code',
    secondary_keywords: ['claude code pricing', 'claude code free tier'],
    ...overrides,
  };
}

function makeSourcePack(overrides: Partial<SourcePack> = {}): SourcePack {
  return {
    primary_keyword: 'how much does claude code cost',
    serp_results: [
      {
        title: 'Claude Code Pricing - Anthropic',
        link: 'https://anthropic.com/claude-code-pricing',
        snippet: 'Claude Code is available in Free, Pro ($20/mo), and Team ($30/mo) plans.',
        position: 1,
      },
      {
        title: 'Claude Code Review 2025',
        link: 'https://example.com/review',
        snippet: 'Claude Code offers competitive pricing with a generous free tier.',
        position: 2,
      },
    ],
    source_pages: [
      {
        url: 'https://anthropic.com/claude-code-pricing',
        title: 'Claude Code Pricing - Anthropic',
        text: 'Claude Code offers multiple pricing tiers. The Free tier includes basic access with limited usage. Pro costs $20/month and includes extended context and priority access. Team plans start at $30/month per seat with admin controls.',
        word_count: 350,
      },
    ],
    paa_questions: [
      'Is Claude Code free?',
      'How much does Claude Code cost per month?',
      'What is included in Claude Code Pro?',
    ],
    related_searches: ['claude code vs cursor pricing', 'claude code free tier limits'],
    serp_depth: {
      depth: 'short_answer',
      avg_snippet_length: 120,
      has_answer_box: true,
    },
    research_pipeline: 'standard',
    ...overrides,
  };
}

const MOCK_SKILL = `# SEO Content Writing Skill

## Voice & Tone
Write like a senior engineer explaining to a smart colleague.

## Page Types

### Page Type 1: Glossary
200-400 words. Definition → Why it matters → How it works → Related terms.

### Page Type 2: FAQ
200-500 words. Answer → Context → Practical steps → Related questions.

### Page Type 3: Comparison
400-800 words. Overview → Feature table → When to use A/B → Verdict.

### Page Type 4: Topic Hub
500-1000 words. Overview → Latest → Key features → Q&A → Comparisons → Resources.

## CTA
EN: *Want more AI insights? [Subscribe to LoreAI](/subscribe) for daily briefings.*
ZH: *觉得有用？[订阅 LoreAI](/subscribe)，每天 5 分钟掌握 AI 动态。*
`;

// ── Tests ──

describe('prompt building integration', () => {
  test('builds a complete FAQ prompt with all sections', () => {
    setSkillContent(MOCK_SKILL);
    const job = makeJob();
    const sp = makeSourcePack();
    const context = {
      job,
      sourcePack: sp,
      relatedSlugs: {
        glossary: ['claude-code', 'mcp'],
        blog: ['claude-code-guide'],
        compare: ['claude-code-vs-cursor'],
        faq: ['is-claude-code-free'],
      },
    };

    const { system, user } = buildGenerationPrompt('faq', sp, context, 'en');

    // Skill content present
    expect(system).toContain('SEO Content Writing Skill');

    // Source material present
    expect(system).toContain('Source Material');
    expect(system).toContain('Claude Code Pricing - Anthropic');
    expect(system).toContain('anthropic.com/claude-code-pricing');

    // PAA questions present
    expect(system).toContain('Is Claude Code free?');
    expect(system).toContain('How much does Claude Code cost per month?');

    // Related searches present
    expect(system).toContain('claude code vs cursor pricing');

    // SERP depth
    expect(system).toContain('short_answer');

    // Context section
    expect(system).toContain('how much does claude code cost');
    expect(system).toContain('claude code pricing');
    expect(system).toContain('informational');
    expect(system).toContain('claude-code');

    // Internal links
    expect(system).toContain('/glossary/claude-code');
    expect(system).toContain('/blog/claude-code-guide');
    expect(system).toContain('/compare/claude-code-vs-cursor');
    expect(system).toContain('/faq/is-claude-code-free');

    // User prompt
    expect(user).toContain('faq');
    expect(user).toContain('how much does claude code cost');
    expect(user).toContain('Do not fabricate');
  });

  test('builds a ZH prompt with Chinese addendum', () => {
    setSkillContent(MOCK_SKILL);
    const job = makeJob();
    const sp = makeSourcePack();
    const context = {
      job,
      sourcePack: sp,
      relatedSlugs: { glossary: [], blog: [], compare: [], faq: [] },
    };

    const { system, user } = buildGenerationPrompt('faq', sp, context, 'zh');

    // ZH-specific
    expect(system).toContain('中文生成要求');
    expect(system).toContain('lang: zh');
    expect(system).toContain('200-450');
    expect(system).toContain('常见问题');
    expect(system).toContain('订阅 LoreAI');

    // User prompt in Chinese
    expect(user).toContain('用中文撰写');
  });

  test('builds a deep-dive prompt with inline instructions', () => {
    setSkillContent(MOCK_SKILL);
    const job = makeJob({ content_type: 'deep-dive', research_pipeline: 'deep_research' });
    const sp = makeSourcePack({ research_pipeline: 'deep_research' });
    const context = {
      job,
      sourcePack: sp,
      relatedSlugs: { glossary: [], blog: [], compare: [], faq: [] },
    };

    const { system } = buildGenerationPrompt('deep-dive', sp, context, 'en');

    expect(system).toContain('Deep-Dive Blog Post');
    expect(system).toContain('code examples');
    expect(system).toContain('Problem → Context → Implementation → Tradeoffs → Takeaways');
  });

  test('builds a cornerstone prompt with inline instructions', () => {
    setSkillContent(MOCK_SKILL);
    const job = makeJob({ content_type: 'cornerstone', research_pipeline: 'deep_research' });
    const sp = makeSourcePack({ research_pipeline: 'deep_research' });
    const context = {
      job,
      sourcePack: sp,
      relatedSlugs: { glossary: [], blog: [], compare: [], faq: [] },
    };

    const { system } = buildGenerationPrompt('cornerstone', sp, context, 'en');

    expect(system).toContain('Cornerstone Page');
    expect(system).toContain('definitive guide');
    expect(system).toContain('supporting cluster pages');
  });
});

describe('validator routing integration', () => {
  test('each content type returns a working validator', () => {
    const types: ContentType[] = [
      'faq',
      'compare',
      'glossary',
      'topic-hub',
      'news-blog',
      'deep-dive',
      'cornerstone',
    ];

    for (const t of types) {
      const v = getValidatorForType(t);
      expect(typeof v).toBe('function');

      // Should return { valid, errors } shape
      const result = v('# Test\n## Section 1\n## Section 2\nContent here.\n[Sub](/subscribe)');
      expect(result).toHaveProperty('valid');
      expect(result).toHaveProperty('errors');
      expect(Array.isArray(result.errors)).toBe(true);
    }
  });

  test('faq validator rejects content without H1', () => {
    const v = getValidatorForType('faq');
    const result = v('No heading here, just text.\n[Subscribe](/subscribe)');
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Missing H1 title');
  });

  test('compare validator requires comparison table', () => {
    const v = getValidatorForType('compare');
    const result = v(
      '# Comparison\n## Tool A\nGood tool.\n## Tool B\nAlso good.\n' +
        'word '.repeat(400) +
        '\n[Subscribe](/subscribe)',
    );
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes('comparison table'))).toBe(true);
  });

  test('topic-hub validator requires internal links', () => {
    const v = getValidatorForType('topic-hub');
    // No markdown links at all to trigger missing internal links check
    const body = Array(100).fill('This is some content about a topic.').join(' ');
    const result = v(
      `# Topic Hub\n## Section 1\n${body}\n## Section 2\nMore content.`,
    );
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes('internal links'))).toBe(true);
  });
});
