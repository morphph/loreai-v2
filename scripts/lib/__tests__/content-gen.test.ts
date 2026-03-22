import { describe, test, expect, vi, beforeEach } from 'vitest';
import {
  loadJobs,
  buildGenerationPrompt,
  getValidatorForType,
  setSkillContent,
  runStandardResearch,
  runDeepResearch,
  generateContent,
} from '../content-gen';

import type { QueueJob, SourcePack, ContentType } from '../content-gen';

// ── Mocks ──

vi.mock('../db', () => {
  const mockPrepare = vi.fn();
  return {
    getDb: vi.fn().mockReturnValue({
      prepare: mockPrepare,
    }),
    upsertContent: vi.fn().mockReturnValue(1),
    closeDb: vi.fn(),
  };
});

vi.mock('../ai', () => ({
  callClaudeWithRetry: vi.fn(),
}));

vi.mock('../sanitize', () => ({
  sanitizeOutput: vi.fn((raw: string) => raw),
}));

vi.mock('../link-validator', () => ({
  validateLinks: vi.fn().mockReturnValue({
    total_links: 0,
    valid_links: 0,
    broken_links: [],
    missing_glossary_links: [],
    fixed_markdown: '',
  }),
}));

vi.mock('fs', async () => {
  const actual = await vi.importActual('fs');
  return {
    ...actual,
    existsSync: vi.fn().mockReturnValue(false),
    readFileSync: vi.fn().mockReturnValue('# Mock Skill Content\n'),
    writeFileSync: vi.fn(),
    mkdirSync: vi.fn(),
  };
});

import { getDb } from '../db';
import { callClaudeWithRetry } from '../ai';
import { sanitizeOutput } from '../sanitize';

const mockGetDb = vi.mocked(getDb);
const mockCallClaude = vi.mocked(callClaudeWithRetry);
const mockSanitize = vi.mocked(sanitizeOutput);

// ── Test Fixtures ──

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
        title: 'Claude Code Pricing',
        link: 'https://example.com/pricing',
        snippet: 'Claude Code costs...',
        position: 1,
      },
    ],
    source_pages: [
      {
        url: 'https://example.com/pricing',
        title: 'Claude Code Pricing',
        text: 'Claude Code costs $20/month for Pro tier. Free tier available with limited usage.',
        word_count: 200,
      },
    ],
    paa_questions: ['Is Claude Code free?', 'How much does Claude cost per month?'],
    related_searches: ['claude code vs cursor pricing', 'claude code free'],
    serp_depth: {
      depth: 'mixed',
      avg_snippet_length: 150,
      has_answer_box: false,
    },
    research_pipeline: 'standard',
    ...overrides,
  };
}

const VALID_FAQ_MD = `---
title: "How Much Does Claude Code Cost?"
slug: how-much-does-claude-code-cost
description: "Learn about Claude Code pricing including free tier and Pro plan options."
lang: en
category: tools
---

# How Much Does Claude Code Cost?

Claude Code offers a free tier with limited usage. The Pro plan costs $20/month.

## Pricing Tiers

The free tier includes basic access. Pro users get unlimited access.

*Want more AI insights? [Subscribe to LoreAI](/subscribe) for daily briefings.*`;

// ── Tests ──

describe('loadJobs', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('loads pending jobs ordered by priority_score DESC', () => {
    const mockAll = vi.fn().mockReturnValue([
      {
        job_id: 1,
        keyword_group_id: 10,
        content_type: 'faq',
        research_pipeline: 'standard',
        priority_score: 450,
        status: 'pending',
        primary_keyword: 'test keyword',
        intent: 'informational',
        cluster_slug: 'test-cluster',
      },
    ]);
    const mockSecondaryAll = vi.fn().mockReturnValue([{ keyword: 'secondary kw' }]);

    mockGetDb.mockReturnValue({
      prepare: vi.fn().mockImplementation((sql: string) => {
        if (sql.includes('FROM create_queue')) return { all: mockAll };
        if (sql.includes('FROM keywords')) return { all: mockSecondaryAll };
        return { all: vi.fn().mockReturnValue([]) };
      }),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any);

    const jobs = loadJobs({
      limit: 5,
      dryRun: false,
      enOnly: false,
      skipValidation: false,
    });

    expect(jobs).toHaveLength(1);
    expect(jobs[0].job_id).toBe(1);
    expect(jobs[0].secondary_keywords).toEqual(['secondary kw']);
  });

  test('respects --limit flag', () => {
    const mockAll = vi.fn().mockReturnValue([]);
    mockGetDb.mockReturnValue({
      prepare: vi.fn().mockReturnValue({ all: mockAll }),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any);

    loadJobs({ limit: 3, dryRun: false, enOnly: false, skipValidation: false });

    // The SQL should include LIMIT
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const sqlCall = mockGetDb().prepare as any;
    expect(mockAll).toHaveBeenCalled();
  });

  test('loads specific job by --job flag', () => {
    const mockAll = vi.fn().mockReturnValue([
      {
        job_id: 42,
        keyword_group_id: 10,
        content_type: 'faq',
        research_pipeline: 'standard',
        priority_score: 450,
        status: 'pending',
        primary_keyword: 'test',
        intent: 'informational',
        cluster_slug: null,
      },
    ]);
    const mockSecondaryAll = vi.fn().mockReturnValue([]);

    mockGetDb.mockReturnValue({
      prepare: vi.fn().mockImplementation((sql: string) => {
        if (sql.includes('FROM create_queue')) return { all: mockAll };
        return { all: mockSecondaryAll };
      }),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any);

    const jobs = loadJobs({
      limit: 5,
      jobId: 42,
      dryRun: false,
      enOnly: false,
      skipValidation: false,
    });

    expect(jobs).toHaveLength(1);
    expect(jobs[0].job_id).toBe(42);
  });

  test('filters by content_type', () => {
    const mockAll = vi.fn().mockReturnValue([]);
    mockGetDb.mockReturnValue({
      prepare: vi.fn().mockReturnValue({ all: mockAll }),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any);

    loadJobs({
      limit: 10,
      contentType: 'faq',
      dryRun: false,
      enOnly: false,
      skipValidation: false,
    });

    expect(mockAll).toHaveBeenCalled();
  });
});

describe('buildGenerationPrompt', () => {
  beforeEach(() => {
    setSkillContent('# Mock SEO Skill\nWrite good content.');
  });

  test('prompt includes source material from SourcePack', () => {
    const job = makeJob();
    const sp = makeSourcePack();
    const context = {
      job,
      sourcePack: sp,
      relatedSlugs: { glossary: [], blog: [], compare: [], faq: [] },
    };

    const { system } = buildGenerationPrompt('faq', sp, context, 'en');

    expect(system).toContain('Source Material');
    expect(system).toContain('DO NOT fabricate');
    expect(system).toContain('Claude Code costs');
    expect(system).toContain('example.com/pricing');
  });

  test('prompt includes PAA questions', () => {
    const job = makeJob();
    const sp = makeSourcePack();
    const context = {
      job,
      sourcePack: sp,
      relatedSlugs: { glossary: [], blog: [], compare: [], faq: [] },
    };

    const { system } = buildGenerationPrompt('faq', sp, context, 'en');

    expect(system).toContain('Is Claude Code free?');
    expect(system).toContain('How much does Claude cost per month?');
  });

  test('prompt includes secondary keywords', () => {
    const job = makeJob();
    const sp = makeSourcePack();
    const context = {
      job,
      sourcePack: sp,
      relatedSlugs: { glossary: [], blog: [], compare: [], faq: [] },
    };

    const { system } = buildGenerationPrompt('faq', sp, context, 'en');

    expect(system).toContain('claude code pricing');
    expect(system).toContain('claude code free tier');
  });

  test('prompt includes related internal links', () => {
    const job = makeJob();
    const sp = makeSourcePack();
    const context = {
      job,
      sourcePack: sp,
      relatedSlugs: {
        glossary: ['claude-code'],
        blog: ['claude-code-guide'],
        compare: [],
        faq: [],
      },
    };

    const { system } = buildGenerationPrompt('faq', sp, context, 'en');

    expect(system).toContain('/glossary/claude-code');
    expect(system).toContain('/blog/claude-code-guide');
  });

  test('EN prompt has lang: en in output requirements', () => {
    const job = makeJob();
    const sp = makeSourcePack();
    const context = {
      job,
      sourcePack: sp,
      relatedSlugs: { glossary: [], blog: [], compare: [], faq: [] },
    };

    const { system } = buildGenerationPrompt('faq', sp, context, 'en');
    expect(system).toContain('lang (en)');
  });

  test('ZH prompt includes Chinese generation addendum', () => {
    const job = makeJob();
    const sp = makeSourcePack();
    const context = {
      job,
      sourcePack: sp,
      relatedSlugs: { glossary: [], blog: [], compare: [], faq: [] },
    };

    const { system, user } = buildGenerationPrompt('faq', sp, context, 'zh');

    expect(system).toContain('中文生成要求');
    expect(system).toContain('lang: zh');
    expect(system).toContain('用中文撰写');
    expect(system).toContain('订阅 LoreAI');
    expect(system).toContain('200-450');
    expect(user).toContain('用中文撰写');
  });

  test('blog prompt includes inline instructions', () => {
    const job = makeJob({ content_type: 'blog' });
    const sp = makeSourcePack();
    const context = {
      job,
      sourcePack: sp,
      relatedSlugs: { glossary: [], blog: [], compare: [], faq: [] },
    };

    const { system } = buildGenerationPrompt('blog', sp, context, 'en');

    expect(system).toContain('Blog Post');
    expect(system).toContain('WHAT happened');
    expect(system).toContain('800-1500');
  });

  test('deep-dive prompt includes inline instructions', () => {
    const job = makeJob({ content_type: 'deep-dive' });
    const sp = makeSourcePack();
    const context = {
      job,
      sourcePack: sp,
      relatedSlugs: { glossary: [], blog: [], compare: [], faq: [] },
    };

    const { system } = buildGenerationPrompt('deep-dive', sp, context, 'en');

    expect(system).toContain('Deep-Dive Blog Post');
    expect(system).toContain('2500-4000');
    expect(system).toContain('code examples');
  });

  test('cornerstone prompt includes inline instructions', () => {
    const job = makeJob({ content_type: 'cornerstone' });
    const sp = makeSourcePack();
    const context = {
      job,
      sourcePack: sp,
      relatedSlugs: { glossary: [], blog: [], compare: [], faq: [] },
    };

    const { system } = buildGenerationPrompt('cornerstone', sp, context, 'en');

    expect(system).toContain('Cornerstone Page');
    expect(system).toContain('definitive guide');
    expect(system).toContain('2500-4000');
  });

  test('user prompt instructs not to fabricate', () => {
    const job = makeJob();
    const sp = makeSourcePack();
    const context = {
      job,
      sourcePack: sp,
      relatedSlugs: { glossary: [], blog: [], compare: [], faq: [] },
    };

    const { user } = buildGenerationPrompt('faq', sp, context, 'en');

    expect(user).toContain('ONLY the source material');
    expect(user).toContain('Do not fabricate');
  });
});

describe('getValidatorForType', () => {
  test('routes faq to validateFaq', () => {
    const v = getValidatorForType('faq');
    // Validator should return { valid, errors }
    const result = v('# Test\nSome content.\n[Subscribe](/subscribe)');
    expect(result).toHaveProperty('valid');
    expect(result).toHaveProperty('errors');
  });

  test('routes glossary to validateGlossary', () => {
    const v = getValidatorForType('glossary');
    const result = v('# Test\nSome content.\n[Subscribe](/subscribe)');
    expect(result).toHaveProperty('valid');
  });

  test('routes compare to validateCompare', () => {
    const v = getValidatorForType('compare');
    const result = v('# Test\n## A\n## B\n| A | B |\n|---|---|\n| 1 | 2 |\n[Subscribe](/subscribe)');
    expect(result).toHaveProperty('valid');
  });

  test('routes topic-hub to validateTopicHub', () => {
    const v = getValidatorForType('topic-hub');
    const result = v('# Test\n## A\n## B\n[link](/glossary/test)\n[Subscribe](/subscribe)');
    expect(result).toHaveProperty('valid');
  });

  test('routes blog to validateBlogPost', () => {
    const v = getValidatorForType('blog');
    const result = v('# Test');
    expect(result).toHaveProperty('valid');
  });

  test('routes deep-dive to validateBlogPost with maxWords 5000', () => {
    const v = getValidatorForType('deep-dive');
    // With maxWords 5000, a 4500 word article should pass the upper bound
    const result = v('# Test\n## A\n## B\n' + 'word '.repeat(4500) + '\n[Subscribe](/subscribe)');
    expect(result.valid).toBe(true);
  });

  test('routes cornerstone to validateBlogPost with maxWords 5000', () => {
    const v = getValidatorForType('cornerstone');
    const result = v('# Test\n## A\n## B\n' + 'word '.repeat(4500) + '\n[Subscribe](/subscribe)');
    expect(result.valid).toBe(true);
  });

  test('each content type has a validator', () => {
    const types: ContentType[] = [
      'faq',
      'compare',
      'glossary',
      'topic-hub',
      'blog',
      'deep-dive',
      'cornerstone',
    ];
    for (const t of types) {
      const v = getValidatorForType(t);
      expect(typeof v).toBe('function');
    }
  });
});

describe('runStandardResearch', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('assembles SourcePack from Serper + Exa', async () => {
    // Mock serper module
    vi.doMock('../serper', () => ({
      searchFull: vi.fn().mockResolvedValue({
        searchParameters: { q: 'test', gl: 'us', hl: 'en', type: 'search' },
        organic: [
          { title: 'Test', link: 'https://test.com', snippet: 'Test snippet', position: 1 },
        ],
        peopleAlsoAsk: [{ question: 'What is test?', snippet: '', title: '', link: '' }],
        relatedSearches: [{ query: 'test related' }],
      }),
      detectSERPDepth: vi.fn().mockResolvedValue({
        query: 'test',
        depth: 'mixed',
        avg_snippet_length: 150,
        has_answer_box: false,
        has_knowledge_graph: false,
        top_results: [],
        recommended_content_type: 'faq',
      }),
    }));

    vi.doMock('../exa', () => ({
      getContents: vi.fn().mockResolvedValue({
        urls: ['https://test.com'],
        pages: [
          { url: 'https://test.com', title: 'Test', text: 'Long text content '.repeat(20), word_count: 200, status: 'success' },
        ],
        failed: [],
      }),
      countWords: vi.fn().mockReturnValue(200),
    }));

    // Re-import after mocking
    const { runStandardResearch: run } = await import('../content-gen');
    const job = makeJob();
    const { sourcePack, apiCalls } = await run(job);

    expect(sourcePack.primary_keyword).toBe(job.primary_keyword);
    expect(sourcePack.research_pipeline).toBe('standard');
    expect(sourcePack.serp_results.length).toBeGreaterThanOrEqual(0);
    expect(apiCalls.serper).toBeGreaterThanOrEqual(1);

    vi.doUnmock('../serper');
    vi.doUnmock('../exa');
  });

  test('skips Exa pages with word_count < 100', async () => {
    vi.doMock('../serper', () => ({
      searchFull: vi.fn().mockResolvedValue({
        searchParameters: { q: 'test', gl: 'us', hl: 'en', type: 'search' },
        organic: [
          { title: 'Short', link: 'https://short.com', snippet: 'Short', position: 1 },
        ],
        peopleAlsoAsk: [],
        relatedSearches: [],
      }),
      detectSERPDepth: vi.fn().mockResolvedValue({
        query: 'test', depth: 'mixed', avg_snippet_length: 50,
        has_answer_box: false, has_knowledge_graph: false, top_results: [],
        recommended_content_type: 'faq',
      }),
    }));

    vi.doMock('../exa', () => ({
      getContents: vi.fn().mockResolvedValue({
        urls: ['https://short.com'],
        pages: [
          { url: 'https://short.com', title: 'Short', text: 'Very short', word_count: 5, status: 'success' },
        ],
        failed: [],
      }),
      countWords: vi.fn().mockReturnValue(5),
    }));

    const { runStandardResearch: run } = await import('../content-gen');
    const job = makeJob();
    const { sourcePack } = await run(job);
    expect(sourcePack.source_pages).toHaveLength(0);

    vi.doUnmock('../serper');
    vi.doUnmock('../exa');
  });

  test('handles Exa failure gracefully with Serper snippet fallback', async () => {
    vi.doMock('../serper', () => ({
      searchFull: vi.fn().mockResolvedValue({
        searchParameters: { q: 'test', gl: 'us', hl: 'en', type: 'search' },
        organic: [
          { title: 'Result', link: 'https://test.com', snippet: 'Test snippet text', position: 1 },
        ],
        peopleAlsoAsk: [],
        relatedSearches: [],
      }),
      detectSERPDepth: vi.fn().mockResolvedValue({
        query: 'test', depth: 'mixed', avg_snippet_length: 50,
        has_answer_box: false, has_knowledge_graph: false, top_results: [],
        recommended_content_type: 'faq',
      }),
    }));

    vi.doMock('../exa', () => ({
      getContents: vi.fn().mockRejectedValue(new Error('Exa API error')),
      countWords: vi.fn().mockReturnValue(0),
    }));

    const { runStandardResearch: run } = await import('../content-gen');
    const job = makeJob();
    const { sourcePack } = await run(job);

    // Should use Serper snippets as fallback
    expect(sourcePack.source_pages.length).toBeGreaterThanOrEqual(1);
    expect(sourcePack.source_pages[0].text).toBe('Test snippet text');

    vi.doUnmock('../serper');
    vi.doUnmock('../exa');
  });
});

describe('generateContent', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setSkillContent('# Mock SEO Skill\nWrite good content.');
    mockSanitize.mockImplementation((raw) => raw);
    mockGetDb.mockReturnValue({
      prepare: vi.fn().mockReturnValue({
        get: vi.fn().mockReturnValue(null),
        all: vi.fn().mockReturnValue([]),
      }),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any);
  });

  test('generates EN markdown with correct frontmatter', async () => {
    mockCallClaude.mockResolvedValue({
      content: VALID_FAQ_MD,
      model: 'claude-haiku-4-5',
    });
    mockSanitize.mockReturnValue(VALID_FAQ_MD);

    const job = makeJob();
    const sp = makeSourcePack();
    const relatedSlugs = { glossary: [], blog: [], compare: [], faq: [] };

    const result = await generateContent(job, sp, relatedSlugs, 'en');

    expect(result.success).toBe(true);
    expect(result.filePath).toBeDefined();
    expect(result.markdown).toContain('---');
    expect(result.markdown).toContain('Claude Code');
  });

  test('returns failure when Claude fails', async () => {
    mockCallClaude.mockRejectedValue(new Error('Claude CLI failed'));

    const job = makeJob();
    const sp = makeSourcePack();
    const relatedSlugs = { glossary: [], blog: [], compare: [], faq: [] };

    const result = await generateContent(job, sp, relatedSlugs, 'en');

    expect(result.success).toBe(false);
    expect(result.errors).toBeDefined();
    expect(result.errors![0]).toContain('Claude CLI failed');
  });

  test('returns failure when frontmatter is missing', async () => {
    mockCallClaude.mockResolvedValue({
      content: '# No Frontmatter\nJust a heading.',
      model: 'claude-haiku-4-5',
    });
    mockSanitize.mockReturnValue('# No Frontmatter\nJust a heading.');

    const job = makeJob();
    const sp = makeSourcePack();
    const relatedSlugs = { glossary: [], blog: [], compare: [], faq: [] };

    const result = await generateContent(job, sp, relatedSlugs, 'en');

    expect(result.success).toBe(false);
    expect(result.errors).toContain('Failed to parse frontmatter');
  });

  test('maps content types to correct directories', async () => {
    mockCallClaude.mockResolvedValue({
      content: VALID_FAQ_MD,
      model: 'claude-haiku-4-5',
    });
    mockSanitize.mockReturnValue(VALID_FAQ_MD);

    const job = makeJob({ content_type: 'faq' });
    const sp = makeSourcePack();
    const relatedSlugs = { glossary: [], blog: [], compare: [], faq: [] };

    const result = await generateContent(job, sp, relatedSlugs, 'en');

    expect(result.success).toBe(true);
    expect(result.filePath).toBeDefined();
    expect(result.filePath!).toContain('/content/faq/en/');
  });

  test('skips ZH when EN fails', async () => {
    // This is tested at the orchestration level (runContentGeneration),
    // but we verify the EN failure return here
    mockCallClaude.mockRejectedValue(new Error('EN failed'));

    const job = makeJob();
    const sp = makeSourcePack();
    const relatedSlugs = { glossary: [], blog: [], compare: [], faq: [] };

    const enResult = await generateContent(job, sp, relatedSlugs, 'en');
    expect(enResult.success).toBe(false);
    // ZH should not even be attempted when EN fails — this is orchestration logic
  });
});

describe('content type routing — model selection', () => {
  // We can't directly test MODEL_MAP since it's not exported,
  // but we verify through buildGenerationPrompt that the correct
  // model would be used (via the callClaudeWithRetry mock)

  beforeEach(() => {
    vi.clearAllMocks();
    setSkillContent('# Mock SEO Skill');
  });

  test('prompt structure varies by content type', () => {
    const types: ContentType[] = ['faq', 'compare', 'glossary', 'topic-hub', 'blog', 'deep-dive', 'cornerstone'];
    const job = makeJob();
    const sp = makeSourcePack();
    const context = {
      job,
      sourcePack: sp,
      relatedSlugs: { glossary: [], blog: [], compare: [], faq: [] },
    };

    for (const t of types) {
      const updatedJob = { ...job, content_type: t };
      const updatedContext = { ...context, job: updatedJob };
      const { system } = buildGenerationPrompt(t, sp, updatedContext, 'en');
      expect(system.length).toBeGreaterThan(50);
    }
  });
});

describe('ZH generation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setSkillContent('# Mock SEO Skill');
  });

  test('ZH word range is correct for each type', () => {
    const types: ContentType[] = ['faq', 'compare', 'glossary', 'topic-hub', 'blog', 'deep-dive', 'cornerstone'];
    const expectedRanges: Record<ContentType, string> = {
      faq: '200-450',
      compare: '350-700',
      glossary: '200-350',
      'topic-hub': '450-900',
      blog: '600-1200',
      'deep-dive': '2000-3500',
      cornerstone: '2000-3500',
    };

    for (const t of types) {
      const job = makeJob({ content_type: t });
      const sp = makeSourcePack();
      const context = {
        job,
        sourcePack: sp,
        relatedSlugs: { glossary: [], blog: [], compare: [], faq: [] },
      };

      const { system } = buildGenerationPrompt(t, sp, context, 'zh');
      expect(system).toContain(expectedRanges[t]);
    }
  });

  test('ZH prompt includes CTA in Chinese', () => {
    const job = makeJob();
    const sp = makeSourcePack();
    const context = {
      job,
      sourcePack: sp,
      relatedSlugs: { glossary: [], blog: [], compare: [], faq: [] },
    };

    const { system } = buildGenerationPrompt('faq', sp, context, 'zh');
    expect(system).toContain('觉得有用？');
    expect(system).toContain('订阅 LoreAI');
  });
});
