/**
 * Unit tests for B2 — Keyword Grouping
 *
 * Mocks Claude API and DB — no API credits consumed, no DB touched.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  buildPrompt,
  parseGroupingResponse,
  loadUngroupedKeywords,
  writeGroupingToDb,
  clearClusterGroups,
  groupCluster,
  setSkillContent,
} from '../keyword-group';

import type {
  KeywordInput,
  ClaudeGroupOutput,
  GroupOptions,
} from '../keyword-group';

// ── Mocks ──

// Mock the ai.ts CLI wrapper
const mockCallClaudeWithRetry = vi.fn();

vi.mock('../ai', () => ({
  callClaudeWithRetry: (...args: unknown[]) => mockCallClaudeWithRetry(...args),
}));

// Track DB state
let mockKeywords: Map<
  string,
  {
    id: number;
    keyword: string;
    source: string;
    cluster_slug: string | null;
    search_volume: number | null;
    competition: string | null;
    keyword_group_id: number | null;
    intent: string | null;
  }
> = new Map();
let mockGroups: Map<
  number,
  {
    group_id: number;
    primary_keyword: string;
    intent: string;
    content_type: string;
    cluster_slug: string;
  }
> = new Map();
let mockClusters: Map<string, { slug: string; pillar_topic: string; mention_count: number }> =
  new Map();
let nextGroupId = 1;
let nextKeywordId = 1;

vi.mock('../db', () => {
  const mockDb = {
    prepare: vi.fn((sql: string) => ({
      all: vi.fn((...params: unknown[]) => {
        // Load ungrouped keywords (no force)
        if (
          sql.includes('SELECT id, keyword, source, search_volume, competition') &&
          sql.includes('keyword_group_id IS NULL')
        ) {
          const slug = params[0] as string;
          return Array.from(mockKeywords.values())
            .filter((k) => k.cluster_slug === slug && k.keyword_group_id === null)
            .sort((a, b) => (b.search_volume ?? -1) - (a.search_volume ?? -1));
        }

        // Load all keywords (force mode)
        if (
          sql.includes('SELECT id, keyword, source, search_volume, competition') &&
          !sql.includes('keyword_group_id IS NULL')
        ) {
          const slug = params[0] as string;
          return Array.from(mockKeywords.values())
            .filter((k) => k.cluster_slug === slug)
            .sort((a, b) => (b.search_volume ?? -1) - (a.search_volume ?? -1));
        }

        // Load keyword_groups for summaries
        if (sql.includes('SELECT group_id, primary_keyword, intent, content_type')) {
          const slug = params[0] as string;
          const limit = params[1] as number;
          return Array.from(mockGroups.values())
            .filter((g) => g.cluster_slug === slug)
            .slice(0, limit);
        }

        // Load clusters for topic
        if (sql.includes('SELECT slug FROM topic_clusters')) {
          const pattern = params[0] as string;
          const exact = params[1] as string;
          const prefix = pattern.replace('-%', '');
          return Array.from(mockClusters.values()).filter(
            (c) => c.slug === exact || c.slug.startsWith(prefix + '-'),
          );
        }

        return [];
      }),
      get: vi.fn((...params: unknown[]) => {
        // Look up cluster
        if (sql.includes('SELECT pillar_topic FROM topic_clusters')) {
          const slug = params[0] as string;
          const cluster = mockClusters.get(slug);
          return cluster ? { pillar_topic: cluster.pillar_topic } : undefined;
        }
        return undefined;
      }),
      run: vi.fn((...params: unknown[]) => {
        // Insert keyword_group
        if (sql.includes('INSERT INTO keyword_groups')) {
          const [primaryKeyword, intent, contentType, clusterSlug] = params as [
            string,
            string,
            string,
            string,
          ];
          const id = nextGroupId++;
          mockGroups.set(id, {
            group_id: id,
            primary_keyword: primaryKeyword,
            intent,
            content_type: contentType,
            cluster_slug: clusterSlug,
          });
          return { lastInsertRowid: BigInt(id) };
        }

        // Update keyword group assignment
        if (sql.includes('UPDATE keywords SET keyword_group_id')) {
          if (sql.includes('keyword_group_id = NULL')) {
            // Force clear
            const slug = params[0] as string;
            for (const kw of mockKeywords.values()) {
              if (kw.cluster_slug === slug) {
                kw.keyword_group_id = null;
                kw.intent = null;
              }
            }
          } else {
            const [groupId, intent, keyword] = params as [number, string, string];
            const kw = mockKeywords.get(keyword);
            if (kw) {
              kw.keyword_group_id = groupId;
              kw.intent = intent;
            }
          }
        }

        // Delete keyword_groups
        if (sql.includes('DELETE FROM keyword_groups')) {
          const slug = params[0] as string;
          for (const [id, g] of mockGroups) {
            if (g.cluster_slug === slug) mockGroups.delete(id);
          }
        }

        return { changes: 1, lastInsertRowid: BigInt(0) };
      }),
    })),
    transaction: vi.fn((fn: () => void) => fn),
  };

  return {
    getDb: vi.fn(() => mockDb),
    closeDb: vi.fn(),
  };
});

const mockClaudeCreate = mockCallClaudeWithRetry;

// ── Helpers ──

function resetMockState() {
  mockKeywords = new Map();
  mockGroups = new Map();
  mockClusters = new Map();
  nextGroupId = 1;
  nextKeywordId = 1;
}

function addMockCluster(slug: string, pillarTopic: string) {
  mockClusters.set(slug, { slug, pillar_topic: pillarTopic, mention_count: 5 });
}

function addMockKeyword(
  keyword: string,
  clusterSlug: string,
  opts: { source?: string; searchVolume?: number | null; groupId?: number | null } = {},
) {
  const id = nextKeywordId++;
  mockKeywords.set(keyword, {
    id,
    keyword,
    source: opts.source ?? 'serper-related',
    cluster_slug: clusterSlug,
    search_volume: opts.searchVolume ?? null,
    competition: null,
    keyword_group_id: opts.groupId ?? null,
    intent: null,
  });
}

// ── Test data ──

const MOCK_KEYWORDS: KeywordInput[] = [
  { id: 1, keyword: 'claude code pricing', source: 'serper-related', search_volume: 10000, competition: 'medium' },
  { id: 2, keyword: 'how much does claude code cost', source: 'serper-paa', search_volume: 1000, competition: 'low' },
  { id: 3, keyword: 'claude code cost', source: 'serper-related', search_volume: 1000, competition: 'low' },
  { id: 4, keyword: 'claude code pricing 2026', source: 'serper-autocomplete', search_volume: 100, competition: 'low' },
  { id: 5, keyword: 'claude code pricing per month', source: 'serper-autocomplete', search_volume: 100, competition: 'low' },
  { id: 6, keyword: 'is claude code free', source: 'serper-paa', search_volume: 10000, competition: 'medium' },
  { id: 7, keyword: 'claude code free tier', source: 'serper-related', search_volume: 1000, competition: 'low' },
  { id: 8, keyword: 'claude code free trial', source: 'serper-autocomplete', search_volume: 100, competition: 'low' },
  { id: 9, keyword: 'claude code vs cursor pricing', source: 'exa-competitor', search_volume: null, competition: null },
  { id: 10, keyword: 'claude code enterprise pricing', source: 'exa-competitor', search_volume: null, competition: null },
];

const MOCK_CLAUDE_RESPONSE: ClaudeGroupOutput = {
  groups: [
    {
      primary_keyword: 'how much does claude code cost',
      secondary_keywords: [
        'claude code pricing',
        'claude code cost',
        'claude code pricing 2026',
        'claude code pricing per month',
      ],
      intent: 'informational',
      content_type: 'faq',
      rationale: 'All express the same intent: understanding the cost/pricing of Claude Code',
    },
    {
      primary_keyword: 'is claude code free',
      secondary_keywords: ['claude code free tier', 'claude code free trial'],
      intent: 'informational',
      content_type: 'faq',
      rationale: 'All ask whether a free option exists for Claude Code',
    },
    {
      primary_keyword: 'claude code vs cursor pricing',
      secondary_keywords: [],
      intent: 'commercial',
      content_type: 'compare',
      rationale: 'Comparison intent between two specific products on pricing',
    },
  ],
  ungrouped: ['claude code enterprise pricing'],
};

// ── Tests ──

describe('buildPrompt', () => {
  it('includes all keywords', () => {
    const prompt = buildPrompt('claude-code-pricing', 'Claude Code Pricing', MOCK_KEYWORDS);

    for (const kw of MOCK_KEYWORDS) {
      expect(prompt).toContain(kw.keyword);
    }
  });

  it('includes volume metadata', () => {
    const prompt = buildPrompt('claude-code-pricing', 'Claude Code Pricing', MOCK_KEYWORDS);
    expect(prompt).toContain('[vol: 10000]');
    expect(prompt).toContain('[vol: 1000]');
    expect(prompt).toContain('[vol: 100]');
  });

  it('includes source metadata', () => {
    const prompt = buildPrompt('claude-code-pricing', 'Claude Code Pricing', MOCK_KEYWORDS);
    expect(prompt).toContain('[src: serper-paa]');
    expect(prompt).toContain('[src: serper-related]');
    expect(prompt).toContain('[src: exa-competitor]');
  });

  it('handles empty volume gracefully', () => {
    const prompt = buildPrompt('claude-code-pricing', 'Claude Code Pricing', MOCK_KEYWORDS);
    // Keywords with null volume should not have [vol: ...] (entries 9 and 10)
    const lines = prompt.split('\n');
    const vsLine = lines.find((l) => l.includes('claude code vs cursor pricing'));
    expect(vsLine).toBeDefined();
    expect(vsLine).not.toContain('[vol:');
  });

  it('includes subtopic and cluster info', () => {
    const prompt = buildPrompt('claude-code-pricing', 'Claude Code Pricing', MOCK_KEYWORDS);
    expect(prompt).toContain('## Subtopic: Claude Code Pricing');
    expect(prompt).toContain('Cluster: claude-code-pricing');
    expect(prompt).toContain('Total keywords: 10');
  });

  it('includes competition metadata', () => {
    const prompt = buildPrompt('claude-code-pricing', 'Claude Code Pricing', MOCK_KEYWORDS);
    expect(prompt).toContain('[comp: medium]');
    expect(prompt).toContain('[comp: low]');
  });

  it('ends with grouping instruction', () => {
    const prompt = buildPrompt('claude-code-pricing', 'Claude Code Pricing', MOCK_KEYWORDS);
    expect(prompt).toContain('Group these keywords by shared search intent. Return JSON only.');
  });
});

describe('parseGroupingResponse', () => {
  const inputKeywords = MOCK_KEYWORDS.map((kw) => kw.keyword);

  it('parses valid complete response', () => {
    const raw = JSON.stringify(MOCK_CLAUDE_RESPONSE);
    const result = parseGroupingResponse(raw, inputKeywords);

    expect(result.groups).toHaveLength(3);
    expect(result.ungrouped).toContain('claude code enterprise pricing');

    // Check all input keywords are accounted for
    const allGrouped = result.groups.flatMap((g) => [
      g.primary_keyword,
      ...g.secondary_keywords,
    ]);
    const allAccountedFor = [...allGrouped, ...result.ungrouped];
    for (const kw of inputKeywords) {
      expect(allAccountedFor).toContain(kw);
    }
  });

  it('parses response with single-keyword group', () => {
    const response: ClaudeGroupOutput = {
      groups: [
        {
          primary_keyword: 'claude code pricing',
          secondary_keywords: [],
          intent: 'informational',
          content_type: 'faq',
          rationale: 'Single keyword group',
        },
      ],
      ungrouped: inputKeywords.filter((k) => k !== 'claude code pricing'),
    };

    const result = parseGroupingResponse(JSON.stringify(response), inputKeywords);
    expect(result.groups).toHaveLength(1);
    expect(result.groups[0].secondary_keywords).toHaveLength(0);
  });

  it('warns on missing keywords', () => {
    const partial: ClaudeGroupOutput = {
      groups: [
        {
          primary_keyword: 'claude code pricing',
          secondary_keywords: ['claude code cost'],
          intent: 'informational',
          content_type: 'faq',
          rationale: 'Pricing info',
        },
      ],
      ungrouped: [],
    };

    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const result = parseGroupingResponse(JSON.stringify(partial), inputKeywords);
    expect(result.groups).toHaveLength(1);
    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('keywords not accounted for'));
    warnSpy.mockRestore();
  });

  it('deduplicates: first occurrence wins', () => {
    const duped: ClaudeGroupOutput = {
      groups: [
        {
          primary_keyword: 'claude code pricing',
          secondary_keywords: ['claude code cost'],
          intent: 'informational',
          content_type: 'faq',
          rationale: 'Group A',
        },
        {
          primary_keyword: 'is claude code free',
          secondary_keywords: ['claude code cost'], // duplicate!
          intent: 'informational',
          content_type: 'faq',
          rationale: 'Group B',
        },
      ],
      ungrouped: inputKeywords.filter(
        (k) => !['claude code pricing', 'claude code cost', 'is claude code free'].includes(k),
      ),
    };

    const result = parseGroupingResponse(JSON.stringify(duped), inputKeywords);
    // "claude code cost" should only be in the first group
    expect(result.groups[0].secondary_keywords).toContain('claude code cost');
    expect(result.groups[1].secondary_keywords).not.toContain('claude code cost');
  });

  it('throws on invalid JSON', () => {
    expect(() => parseGroupingResponse('not json', inputKeywords)).toThrow('ParseError');
  });

  it('throws on missing groups key', () => {
    expect(() => parseGroupingResponse('{"data": []}', inputKeywords)).toThrow(
      "Response missing 'groups' key",
    );
  });

  it('throws on invalid intent value', () => {
    const bad = {
      groups: [
        {
          primary_keyword: 'claude code pricing',
          secondary_keywords: [],
          intent: 'transactional',
          content_type: 'faq',
          rationale: 'test',
        },
      ],
      ungrouped: [],
    };
    expect(() => parseGroupingResponse(JSON.stringify(bad), inputKeywords)).toThrow(
      'invalid intent "transactional"',
    );
  });

  it('throws on invalid content_type value', () => {
    const bad = {
      groups: [
        {
          primary_keyword: 'claude code pricing',
          secondary_keywords: [],
          intent: 'informational',
          content_type: 'landing',
          rationale: 'test',
        },
      ],
      ungrouped: [],
    };
    expect(() => parseGroupingResponse(JSON.stringify(bad), inputKeywords)).toThrow(
      'invalid content_type "landing"',
    );
  });

  it('handles empty groups array', () => {
    const empty = { groups: [], ungrouped: inputKeywords };
    const result = parseGroupingResponse(JSON.stringify(empty), inputKeywords);
    expect(result.groups).toHaveLength(0);
    expect(result.ungrouped).toEqual(inputKeywords);
  });

  it('throws when primary_keyword not in input', () => {
    const bad = {
      groups: [
        {
          primary_keyword: 'nonexistent keyword',
          secondary_keywords: [],
          intent: 'informational',
          content_type: 'faq',
          rationale: 'test',
        },
      ],
      ungrouped: [],
    };
    expect(() => parseGroupingResponse(JSON.stringify(bad), inputKeywords)).toThrow(
      'not found in input keywords',
    );
  });

  it('throws when secondary keyword not in input', () => {
    const bad = {
      groups: [
        {
          primary_keyword: 'claude code pricing',
          secondary_keywords: ['nonexistent keyword'],
          intent: 'informational',
          content_type: 'faq',
          rationale: 'test',
        },
      ],
      ungrouped: [],
    };
    expect(() => parseGroupingResponse(JSON.stringify(bad), inputKeywords)).toThrow(
      'not found in input keywords',
    );
  });

  it('strips markdown fences from response', () => {
    const fenced = '```json\n' + JSON.stringify(MOCK_CLAUDE_RESPONSE) + '\n```';
    const result = parseGroupingResponse(fenced, inputKeywords);
    expect(result.groups).toHaveLength(3);
  });
});

describe('loadUngroupedKeywords', () => {
  beforeEach(() => {
    resetMockState();
  });

  it('returns ungrouped keywords for a cluster', () => {
    addMockKeyword('keyword a', 'test-cluster', { searchVolume: 100 });
    addMockKeyword('keyword b', 'test-cluster', { searchVolume: 50 });
    addMockKeyword('keyword c', 'test-cluster', { groupId: 1 }); // already grouped

    const result = loadUngroupedKeywords('test-cluster', false);
    expect(result.length).toBe(2);
  });

  it('returns all keywords with force=true', () => {
    addMockKeyword('keyword a', 'test-cluster', { searchVolume: 100 });
    addMockKeyword('keyword b', 'test-cluster', { groupId: 1 });

    const result = loadUngroupedKeywords('test-cluster', true);
    expect(result.length).toBe(2);
  });
});

describe('writeGroupingToDb', () => {
  beforeEach(() => {
    resetMockState();
    addMockKeyword('how much does claude code cost', 'test-cluster');
    addMockKeyword('claude code pricing', 'test-cluster');
    addMockKeyword('claude code cost', 'test-cluster');
    addMockKeyword('is claude code free', 'test-cluster');
    addMockKeyword('claude code free tier', 'test-cluster');
  });

  it('creates groups and assigns keywords', () => {
    const claudeResult: ClaudeGroupOutput = {
      groups: [
        {
          primary_keyword: 'how much does claude code cost',
          secondary_keywords: ['claude code pricing', 'claude code cost'],
          intent: 'informational',
          content_type: 'faq',
          rationale: 'Cost queries',
        },
        {
          primary_keyword: 'is claude code free',
          secondary_keywords: ['claude code free tier'],
          intent: 'informational',
          content_type: 'faq',
          rationale: 'Free tier queries',
        },
      ],
      ungrouped: [],
    };

    const result = writeGroupingToDb('test-cluster', claudeResult);
    expect(result.groups_created).toBe(2);
    expect(result.keywords_assigned).toBe(5);
  });
});

describe('clearClusterGroups', () => {
  beforeEach(() => {
    resetMockState();
  });

  it('removes groups and resets keywords', () => {
    addMockKeyword('keyword a', 'test-cluster', { groupId: 1 });
    mockGroups.set(1, {
      group_id: 1,
      primary_keyword: 'keyword a',
      intent: 'informational',
      content_type: 'faq',
      cluster_slug: 'test-cluster',
    });

    clearClusterGroups('test-cluster');

    // keyword should have null group_id
    const kw = mockKeywords.get('keyword a');
    expect(kw?.keyword_group_id).toBeNull();
    expect(kw?.intent).toBeNull();

    // group should be deleted
    expect(mockGroups.size).toBe(0);
  });
});

describe('groupCluster', () => {
  const DEFAULT_OPTS: GroupOptions = {
    model: 'haiku',
    dryRun: false,
    force: false,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    resetMockState();

    addMockCluster('claude-code-pricing', 'Claude Code Pricing');
    for (const kw of MOCK_KEYWORDS) {
      addMockKeyword(kw.keyword, 'claude-code-pricing', {
        source: kw.source,
        searchVolume: kw.search_volume,
      });
    }

    // Set a dummy skill content
    setSkillContent('You are a keyword grouping engine.');

    // Mock callClaudeWithRetry response (ai.ts returns { content: string, model: string })
    mockClaudeCreate.mockImplementation((_sys: string, _user: string, opts: { validate?: (c: string) => { valid: boolean; errors: string[] } }) => {
      const content = JSON.stringify(MOCK_CLAUDE_RESPONSE);
      // Run validation if provided (matches real callClaudeWithRetry behavior)
      if (opts?.validate) {
        const { valid, errors } = opts.validate(content);
        if (!valid) throw new Error(`Validation failed: ${errors.join(', ')}`);
      }
      return Promise.resolve({ content, model: 'test' });
    });
  });

  it('happy path — creates groups from Claude response', async () => {
    const result = await groupCluster('claude-code-pricing', DEFAULT_OPTS);

    expect(result.groups_created).toBe(3);
    expect(result.total_keywords).toBe(10);
    expect(result.ungrouped_count).toBe(1);
    expect(result.groups.length).toBe(3);
  });

  it('dry run — no DB writes', async () => {
    const result = await groupCluster('claude-code-pricing', {
      ...DEFAULT_OPTS,
      dryRun: true,
    });

    expect(result.groups_created).toBe(3);
    // No groups should be in mockGroups (no DB write)
    expect(mockGroups.size).toBe(0);
  });

  it('empty cluster — returns early with 0 groups', async () => {
    // Remove all keywords
    mockKeywords.clear();

    const result = await groupCluster('claude-code-pricing', DEFAULT_OPTS);
    expect(result.groups_created).toBe(0);
    expect(result.total_keywords).toBe(0);
    expect(mockClaudeCreate).not.toHaveBeenCalled();
  });

  it('throws for unknown cluster slug', async () => {
    await expect(groupCluster('nonexistent-slug', DEFAULT_OPTS)).rejects.toThrow(
      'not found in topic_clusters',
    );
  });

  it('force mode — clears existing groups before re-grouping', async () => {
    // First, create some existing groups
    mockGroups.set(99, {
      group_id: 99,
      primary_keyword: 'old group',
      intent: 'informational',
      content_type: 'faq',
      cluster_slug: 'claude-code-pricing',
    });

    await groupCluster('claude-code-pricing', { ...DEFAULT_OPTS, force: true });

    // Old group should be cleared
    expect(mockGroups.has(99)).toBe(false);
  });

  it('handles Claude API error gracefully', async () => {
    mockClaudeCreate.mockRejectedValue(new Error('Rate limited'));

    await expect(groupCluster('claude-code-pricing', DEFAULT_OPTS)).rejects.toThrow(
      'Rate limited',
    );
  });

  it('passes buildRetryPrompt and throwOnValidationFailure to callClaudeWithRetry', async () => {
    await groupCluster('claude-code-pricing', DEFAULT_OPTS);

    expect(mockClaudeCreate).toHaveBeenCalledTimes(1);
    const callOpts = mockClaudeCreate.mock.calls[0][2];
    expect(callOpts.throwOnValidationFailure).toBe(true);
    expect(typeof callOpts.buildRetryPrompt).toBe('function');
  });

  it('buildRetryPrompt appends errors to original prompt', async () => {
    await groupCluster('claude-code-pricing', DEFAULT_OPTS);

    const callOpts = mockClaudeCreate.mock.calls[0][2];
    const originalPrompt = 'original prompt text';
    const errors = ['ValidationError: keyword "foo" not found in input keywords'];
    const retryPrompt = callOpts.buildRetryPrompt(originalPrompt, errors);

    expect(retryPrompt).toContain(originalPrompt);
    expect(retryPrompt).toContain('YOUR PREVIOUS RESPONSE HAD ERRORS');
    expect(retryPrompt).toContain('keyword "foo" not found');
    expect(retryPrompt).toContain('Copy keywords EXACTLY');
  });
});

describe('buildPrompt anti-hallucination', () => {
  it('includes anti-hallucination reminder in user prompt', () => {
    const keywords: KeywordInput[] = [
      { id: 1, keyword: 'test keyword', source: 'serper', search_volume: 100, competition: null },
    ];
    const prompt = buildPrompt('test-cluster', 'Test Topic', keywords);

    expect(prompt).toContain('character-for-character');
    expect(prompt).toContain('Do not paraphrase');
  });
});
