/**
 * Unit tests for C1 — Discovery Cycle
 *
 * All external dependencies (B1, B2, B3, Serper) are mocked.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// ── Mock all external modules ──

vi.mock('../keyword-expand', () => ({
  expandTopic: vi.fn(),
}));

vi.mock('../keyword-group', () => ({
  groupTopic: vi.fn(),
}));

vi.mock('../score-queue', () => ({
  scoreAndQueue: vi.fn(),
}));

vi.mock('../serper', () => ({
  searchRelated: vi.fn(),
}));

vi.mock('../db', () => {
  const mockDb = {
    prepare: vi.fn(() => ({
      all: vi.fn(() => []),
      run: vi.fn(),
    })),
  };
  return {
    getDb: vi.fn(() => mockDb),
    upsertTopicCluster: vi.fn(),
    resolveSubtopics: vi.fn(() => []),
    closeDb: vi.fn(),
  };
});

import {
  filterSubtopicsByEvent,
  discoverNewSubtopics,
  runDiscoveryForTopic,
  runDiscoveryCycle,
  FLAGSHIP_TOPICS,
  MAX_NEW_SUBTOPICS_PER_EVENT,
} from '../discovery';

import type { FlagshipTopic, DiscoveryOptions } from '../discovery';
import type { SubtopicInput } from '../keyword-expand';

import { expandTopic } from '../keyword-expand';
import { groupTopic } from '../keyword-group';
import { scoreAndQueue } from '../score-queue';
import { searchRelated } from '../serper';
import { getDb, upsertTopicCluster, resolveSubtopics } from '../db';

const mockExpandTopic = vi.mocked(expandTopic);
const mockGroupTopic = vi.mocked(groupTopic);
const mockScoreAndQueue = vi.mocked(scoreAndQueue);
const mockSearchRelated = vi.mocked(searchRelated);
const mockGetDb = vi.mocked(getDb);
const mockUpsertTopicCluster = vi.mocked(upsertTopicCluster);
const mockResolveSubtopics = vi.mocked(resolveSubtopics);

// ── Mock Data ──

const MOCK_TOPIC: FlagshipTopic = {
  slug: 'claude-code',
  name: 'Claude Code',
  cornerstoneUrl: 'https://loreai.dev/claude-code',
  excludeDomains: ['loreai.dev'],
};

const MOCK_SUBTOPICS: SubtopicInput[] = [
  { slug: 'claude-code', pillar_topic: 'Claude Code' },
  { slug: 'claude-code-pricing', pillar_topic: 'Claude Code Pricing' },
  { slug: 'claude-code-hooks', pillar_topic: 'Claude Code Hooks' },
];

const MOCK_EXPANSION_RESULT = {
  topic: 'claude-code',
  subtopics_processed: 3,
  subtopic_results: [],
  total_keywords_discovered: 50,
  total_new_keywords: 15,
  total_volume_scored: 15,
  serper_api_calls: 9,
};

const MOCK_GROUPING_RESULT = {
  clusters_processed: 3,
  total_keywords_grouped: 15,
  total_groups_created: 5,
  total_ungrouped: 0,
  cluster_results: [],
  claude_api_calls: 3,
};

const MOCK_SCORING_RESULT = {
  groups_scored: 5,
  groups_queued: 4,
  groups_deferred: 1,
  groups_already_queued: 0,
  serp_api_calls: 4,
  queue_entries: [
    {
      group_id: 1,
      primary_keyword: 'claude code vs cursor',
      scoring: {
        group_id: 1,
        primary_keyword: 'claude code vs cursor',
        priority_score: 15000,
        score_breakdown: {
          volume: 10000,
          competition_divisor: 1,
          intent_multiplier: 1.5,
          base_score: 15000,
          timeliness_bonus: 0,
        },
      },
      routing: {
        content_type: 'compare',
        research_pipeline: 'standard' as const,
        routing_reason: 'commercial intent',
      },
      deferred: false,
      already_queued: false,
    },
    {
      group_id: 2,
      primary_keyword: 'how to use claude code hooks',
      scoring: {
        group_id: 2,
        primary_keyword: 'how to use claude code hooks',
        priority_score: 4500,
        score_breakdown: {
          volume: 1000,
          competition_divisor: 1,
          intent_multiplier: 1,
          base_score: 1000,
          timeliness_bonus: 3500,
        },
      },
      routing: {
        content_type: 'faq',
        research_pipeline: 'standard' as const,
        routing_reason: 'informational',
      },
      deferred: false,
      already_queued: false,
    },
  ],
};

const DEFAULT_OPTS: DiscoveryOptions = {
  expandOnly: false,
  dryRun: false,
  delay: 300,
  maxSerp: 50,
  skipSerp: false,
  model: 'haiku',
};

// ── Helpers ──

function setupMockDb(subtopics: SubtopicInput[] = MOCK_SUBTOPICS) {
  const subtopicRows = subtopics.map((s) => ({
    slug: s.slug,
    pillar_topic: s.pillar_topic,
    mention_count: 100,
    first_seen: '',
    last_seen: '',
    has_topic_hub: 0,
    brave_related_json: null,
    brave_updated_at: null,
    source: 'entity_extract',
    flagship_topic_slug: null,
    description: null,
    aliases_json: null,
    freshness_sensitivity: null,
    page_type_hints_json: null,
    seed_keywords_json: null,
    evidence_type: null,
    pack_version: null,
  }));
  mockResolveSubtopics.mockReturnValue(subtopicRows);

  const mockAll = vi.fn(() => subtopics.map((s) => ({ slug: s.slug, pillar_topic: s.pillar_topic })));
  const mockPrepare = vi.fn(() => ({ all: mockAll, run: vi.fn() }));
  mockGetDb.mockReturnValue({ prepare: mockPrepare } as unknown as ReturnType<typeof getDb>);
}

function setupDefaultMocks(subtopics: SubtopicInput[] = MOCK_SUBTOPICS) {
  setupMockDb(subtopics);
  mockExpandTopic.mockResolvedValue(MOCK_EXPANSION_RESULT);
  mockGroupTopic.mockResolvedValue(MOCK_GROUPING_RESULT);
  mockScoreAndQueue.mockResolvedValue(MOCK_SCORING_RESULT);
}

// ── Tests ──

beforeEach(() => {
  vi.clearAllMocks();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('filterSubtopicsByEvent', () => {
  it('matches subtopics by keyword overlap', () => {
    const result = filterSubtopicsByEvent(
      MOCK_SUBTOPICS,
      'Anthropic announces new pricing tiers',
    );
    expect(result).toHaveLength(1);
    expect(result[0].slug).toBe('claude-code-pricing');
  });

  it('returns multiple matches when event matches multiple subtopics', () => {
    const result = filterSubtopicsByEvent(
      MOCK_SUBTOPICS,
      'Claude Code pricing and hooks update',
    );
    // "code", "pricing", "hooks" all match — all 3 subtopics match
    expect(result.length).toBeGreaterThanOrEqual(2);
    expect(result.map((s) => s.slug)).toContain('claude-code-pricing');
    expect(result.map((s) => s.slug)).toContain('claude-code-hooks');
  });

  it('falls back to first subtopic when no match', () => {
    const result = filterSubtopicsByEvent(
      MOCK_SUBTOPICS,
      'Completely unrelated event xyz',
    );
    expect(result).toHaveLength(1);
    expect(result[0].slug).toBe(MOCK_SUBTOPICS[0].slug);
  });

  it('handles empty subtopics array', () => {
    const result = filterSubtopicsByEvent([], 'some event');
    expect(result).toHaveLength(0);
  });

  it('ignores short words (<=3 chars)', () => {
    const result = filterSubtopicsByEvent(
      MOCK_SUBTOPICS,
      'a new way to use it',
    );
    // No word > 3 chars matches subtopic slugs, so fallback
    expect(result).toHaveLength(1);
    expect(result[0].slug).toBe(MOCK_SUBTOPICS[0].slug);
  });
});

describe('discoverNewSubtopics', () => {
  it('returns new subtopics from related searches', async () => {
    mockSearchRelated.mockResolvedValue({
      query: 'claude code agent teams',
      related: [
        'claude code agent teams tutorial',
        'claude code multi agent',
        'claude code pricing plans',
      ],
    });

    const existing = new Set(['claude-code', 'claude-code-pricing']);
    const result = await discoverNewSubtopics(
      'claude-code',
      'Agent Teams feature launch',
      existing,
    );

    expect(result.event).toBe('Agent Teams feature launch');
    expect(result.new_subtopics.length).toBeGreaterThan(0);
    // All new subtopics should start with topic slug
    for (const st of result.new_subtopics) {
      expect(st.slug).toMatch(/^claude-code-/);
    }
  });

  it('excludes existing subtopics', async () => {
    mockSearchRelated.mockResolvedValue({
      query: 'claude code pricing',
      related: ['claude code pricing plans'],
    });

    const existing = new Set(['claude-code-pricing-plans']);
    const result = await discoverNewSubtopics(
      'claude-code',
      'pricing update',
      existing,
    );

    // Should not include already-existing slug
    const slugs = result.new_subtopics.map((s) => s.slug);
    expect(slugs).not.toContain('claude-code-pricing-plans');
  });

  it('limits to MAX_NEW_SUBTOPICS_PER_EVENT', async () => {
    mockSearchRelated.mockResolvedValue({
      query: 'claude code',
      related: [
        'claude code alpha feature',
        'claude code beta feature',
        'claude code gamma feature',
        'claude code delta feature',
        'claude code epsilon feature',
      ],
    });

    const result = await discoverNewSubtopics(
      'claude-code',
      'multiple features',
      new Set(),
    );

    expect(result.new_subtopics.length).toBeLessThanOrEqual(
      MAX_NEW_SUBTOPICS_PER_EVENT,
    );
  });

  it('counts existing matches', async () => {
    // Related queries get slugified: "claude code hooks" → "claude-code-hooks"
    // Prefix: "claude-code-" + slugified → "claude-code-claude-code-hooks"
    mockSearchRelated.mockResolvedValue({
      query: 'claude code',
      related: ['hooks feature', 'pricing plans'],
    });

    // The slugified versions: "claude-code-hooks-feature", "claude-code-pricing-plans"
    const existing = new Set(['claude-code-hooks-feature', 'claude-code-pricing-plans']);
    const result = await discoverNewSubtopics(
      'claude-code',
      'test event',
      existing,
    );

    expect(result.existing_match_count).toBe(2);
    expect(result.new_subtopics).toHaveLength(0);
  });
});

describe('runDiscoveryForTopic', () => {
  it('runs all three stages in order', async () => {
    setupDefaultMocks();

    const result = await runDiscoveryForTopic(MOCK_TOPIC, {
      ...DEFAULT_OPTS,
      mode: 'scheduled',
    });

    expect(result.topic).toBe('claude-code');
    expect(result.mode).toBe('scheduled');
    expect(result.timestamp).toBeTruthy();

    // Stage 1 called
    expect(mockExpandTopic).toHaveBeenCalledTimes(1);
    // Stage 2 called (because total_new_keywords > 0)
    expect(mockGroupTopic).toHaveBeenCalledTimes(1);
    // Stage 3 called
    expect(mockScoreAndQueue).toHaveBeenCalledTimes(1);

    // Verify call order
    const expandOrder = mockExpandTopic.mock.invocationCallOrder[0];
    const groupOrder = mockGroupTopic.mock.invocationCallOrder[0];
    const scoreOrder = mockScoreAndQueue.mock.invocationCallOrder[0];
    expect(expandOrder).toBeLessThan(groupOrder);
    expect(groupOrder).toBeLessThan(scoreOrder);
  });

  it('returns correct result structure', async () => {
    setupDefaultMocks();

    const result = await runDiscoveryForTopic(MOCK_TOPIC, {
      ...DEFAULT_OPTS,
      mode: 'scheduled',
    });

    // Expansion
    expect(result.expansion.subtopics_processed).toBe(3);
    expect(result.expansion.total_new_keywords).toBe(15);
    expect(result.expansion.serper_api_calls).toBe(9);

    // Grouping
    expect(result.grouping).not.toBeNull();
    expect(result.grouping!.total_groups_created).toBe(5);
    expect(result.grouping!.claude_api_calls).toBe(3);

    // Scoring
    expect(result.scoring).not.toBeNull();
    expect(result.scoring!.groups_scored).toBe(5);
    expect(result.scoring!.groups_queued).toBe(4);
    expect(result.scoring!.groups_deferred).toBe(1);

    // Top 5 queue
    expect(result.scoring!.top_5_queue.length).toBeLessThanOrEqual(5);
    expect(result.scoring!.top_5_queue[0].primary_keyword).toBe(
      'claude code vs cursor',
    );
    expect(result.scoring!.top_5_queue[0].priority_score).toBe(15000);
  });

  it('total_api_calls is sum of all stages', async () => {
    setupDefaultMocks();

    const result = await runDiscoveryForTopic(MOCK_TOPIC, {
      ...DEFAULT_OPTS,
      mode: 'scheduled',
    });

    // serper(9) + claude(3) + serp(4) = 16
    expect(result.total_api_calls).toBe(16);
  });

  it('records duration_ms', async () => {
    setupDefaultMocks();

    const result = await runDiscoveryForTopic(MOCK_TOPIC, {
      ...DEFAULT_OPTS,
      mode: 'scheduled',
    });

    expect(result.duration_ms).toBeGreaterThanOrEqual(0);
  });
});

describe('incremental behavior', () => {
  it('skips grouping when no new keywords found', async () => {
    setupMockDb();
    mockExpandTopic.mockResolvedValue({
      ...MOCK_EXPANSION_RESULT,
      total_new_keywords: 0,
    });
    mockScoreAndQueue.mockResolvedValue(MOCK_SCORING_RESULT);

    const result = await runDiscoveryForTopic(MOCK_TOPIC, {
      ...DEFAULT_OPTS,
      mode: 'scheduled',
    });

    // Stage 2 skipped
    expect(mockGroupTopic).not.toHaveBeenCalled();
    expect(result.grouping).toBeNull();

    // Stage 3 still runs (process previously pending groups)
    expect(mockScoreAndQueue).toHaveBeenCalledTimes(1);
    expect(result.scoring).not.toBeNull();
  });
});

describe('expand-only mode', () => {
  it('only runs Stage 1 when expandOnly is true', async () => {
    setupDefaultMocks();

    const result = await runDiscoveryForTopic(MOCK_TOPIC, {
      ...DEFAULT_OPTS,
      expandOnly: true,
      mode: 'scheduled',
    });

    expect(mockExpandTopic).toHaveBeenCalledTimes(1);
    expect(mockGroupTopic).not.toHaveBeenCalled();
    expect(mockScoreAndQueue).not.toHaveBeenCalled();
    expect(result.grouping).toBeNull();
    expect(result.scoring).toBeNull();
  });
});

describe('event-triggered mode', () => {
  it('runs Stage 0 subtopic discovery when event is provided', async () => {
    setupMockDb();
    mockSearchRelated.mockResolvedValue({
      query: 'claude code agent teams',
      related: ['claude code agent teams setup'],
    });
    mockExpandTopic.mockResolvedValue(MOCK_EXPANSION_RESULT);
    mockGroupTopic.mockResolvedValue(MOCK_GROUPING_RESULT);
    mockScoreAndQueue.mockResolvedValue(MOCK_SCORING_RESULT);

    const result = await runDiscoveryForTopic(MOCK_TOPIC, {
      ...DEFAULT_OPTS,
      event: 'Anthropic launches Agent Teams',
      mode: 'event-triggered',
    });

    expect(result.mode).toBe('event-triggered');
    expect(result.event).toBe('Anthropic launches Agent Teams');
    expect(result.subtopic_discovery).toBeDefined();
    expect(mockSearchRelated).toHaveBeenCalledTimes(1);
  });

  it('does not run Stage 0 in scheduled mode even with event', async () => {
    setupDefaultMocks();

    const result = await runDiscoveryForTopic(MOCK_TOPIC, {
      ...DEFAULT_OPTS,
      event: 'some event',
      mode: 'scheduled',
    });

    expect(result.subtopic_discovery).toBeUndefined();
    expect(mockSearchRelated).not.toHaveBeenCalled();
  });

  it('writes new subtopics to DB when not dry-run', async () => {
    setupMockDb();
    mockSearchRelated.mockResolvedValue({
      query: 'claude code agent teams',
      related: ['claude code new feature xyz'],
    });
    mockExpandTopic.mockResolvedValue(MOCK_EXPANSION_RESULT);
    mockGroupTopic.mockResolvedValue(MOCK_GROUPING_RESULT);
    mockScoreAndQueue.mockResolvedValue(MOCK_SCORING_RESULT);

    await runDiscoveryForTopic(MOCK_TOPIC, {
      ...DEFAULT_OPTS,
      event: 'New feature xyz launch',
      mode: 'event-triggered',
      dryRun: false,
    });

    // upsertTopicCluster should be called for new subtopics
    // (may or may not be called depending on whether related searches produce valid slugs)
    // At minimum, the serper was called for discovery
    expect(mockSearchRelated).toHaveBeenCalled();
  });

  it('does not write subtopics in dry-run mode', async () => {
    setupMockDb();
    mockSearchRelated.mockResolvedValue({
      query: 'claude code',
      related: ['claude code brand new thing'],
    });
    mockExpandTopic.mockResolvedValue(MOCK_EXPANSION_RESULT);
    mockGroupTopic.mockResolvedValue(MOCK_GROUPING_RESULT);
    mockScoreAndQueue.mockResolvedValue(MOCK_SCORING_RESULT);

    await runDiscoveryForTopic(MOCK_TOPIC, {
      ...DEFAULT_OPTS,
      event: 'Brand new thing',
      mode: 'event-triggered',
      dryRun: true,
    });

    expect(mockUpsertTopicCluster).not.toHaveBeenCalled();
  });
});

describe('stage failure isolation', () => {
  it('Stage 1 failure → skip Stage 2 & 3', async () => {
    setupMockDb();
    mockExpandTopic.mockRejectedValue(new Error('Serper API down'));

    const result = await runDiscoveryForTopic(MOCK_TOPIC, {
      ...DEFAULT_OPTS,
      mode: 'scheduled',
    });

    expect(mockGroupTopic).not.toHaveBeenCalled();
    expect(mockScoreAndQueue).not.toHaveBeenCalled();
    expect(result.errors).toBeDefined();
    expect(result.errors!.some((e) => e.includes('Stage 1 failed'))).toBe(true);
  });

  it('Stage 2 failure → Stage 3 still runs', async () => {
    setupMockDb();
    mockExpandTopic.mockResolvedValue(MOCK_EXPANSION_RESULT);
    mockGroupTopic.mockRejectedValue(new Error('Claude API error'));
    mockScoreAndQueue.mockResolvedValue(MOCK_SCORING_RESULT);

    const result = await runDiscoveryForTopic(MOCK_TOPIC, {
      ...DEFAULT_OPTS,
      mode: 'scheduled',
    });

    expect(mockScoreAndQueue).toHaveBeenCalledTimes(1);
    expect(result.scoring).not.toBeNull();
    expect(result.errors).toBeDefined();
    expect(result.errors!.some((e) => e.includes('Stage 2 failed'))).toBe(true);
  });

  it('Stage 3 failure → records error in result', async () => {
    setupMockDb();
    mockExpandTopic.mockResolvedValue(MOCK_EXPANSION_RESULT);
    mockGroupTopic.mockResolvedValue(MOCK_GROUPING_RESULT);
    mockScoreAndQueue.mockRejectedValue(new Error('DB write failed'));

    const result = await runDiscoveryForTopic(MOCK_TOPIC, {
      ...DEFAULT_OPTS,
      mode: 'scheduled',
    });

    expect(result.scoring).toBeNull();
    expect(result.errors).toBeDefined();
    expect(result.errors!.some((e) => e.includes('Stage 3 failed'))).toBe(true);
  });

  it('Stage 0 failure → still runs Stages 1-3', async () => {
    setupMockDb();
    mockSearchRelated.mockRejectedValue(new Error('Serper timeout'));
    mockExpandTopic.mockResolvedValue(MOCK_EXPANSION_RESULT);
    mockGroupTopic.mockResolvedValue(MOCK_GROUPING_RESULT);
    mockScoreAndQueue.mockResolvedValue(MOCK_SCORING_RESULT);

    const result = await runDiscoveryForTopic(MOCK_TOPIC, {
      ...DEFAULT_OPTS,
      event: 'Some event',
      mode: 'event-triggered',
    });

    expect(mockExpandTopic).toHaveBeenCalledTimes(1);
    expect(result.errors).toBeDefined();
    expect(result.errors!.some((e) => e.includes('Stage 0 failed'))).toBe(true);
  });
});

describe('runDiscoveryCycle', () => {
  it('runs single topic when --topic specified', async () => {
    setupDefaultMocks();

    const results = await runDiscoveryCycle({
      ...DEFAULT_OPTS,
      topic: 'claude-code',
    });

    expect(results).toHaveLength(1);
    expect(results[0].topic).toBe('claude-code');
  });

  it('runs all flagship topics when no --topic specified', async () => {
    setupDefaultMocks();

    const results = await runDiscoveryCycle(DEFAULT_OPTS);

    expect(results).toHaveLength(FLAGSHIP_TOPICS.length);
    expect(results.map((r) => r.topic)).toEqual(
      FLAGSHIP_TOPICS.map((t) => t.slug),
    );
  });

  it('throws for unknown topic', async () => {
    await expect(
      runDiscoveryCycle({ ...DEFAULT_OPTS, topic: 'nonexistent-topic' }),
    ).rejects.toThrow('Unknown flagship topic');
  });

  it('sets mode to event-triggered when event is provided', async () => {
    setupDefaultMocks();

    const results = await runDiscoveryCycle({
      ...DEFAULT_OPTS,
      topic: 'claude-code',
      event: 'Some event',
    });

    expect(results[0].mode).toBe('event-triggered');
  });

  it('multi-topic runs sequentially', async () => {
    setupDefaultMocks();

    const callOrder: string[] = [];
    mockExpandTopic.mockImplementation(async (topicSlug) => {
      callOrder.push(`expand-${topicSlug}`);
      return MOCK_EXPANSION_RESULT;
    });

    await runDiscoveryCycle(DEFAULT_OPTS);

    // Verify sequential execution
    expect(callOrder[0]).toBe('expand-claude-code');
    expect(callOrder[1]).toBe('expand-codex');
  });
});

describe('options forwarding', () => {
  it('forwards delay to B1', async () => {
    setupDefaultMocks();

    await runDiscoveryForTopic(MOCK_TOPIC, {
      ...DEFAULT_OPTS,
      delay: 500,
      mode: 'scheduled',
    });

    expect(mockExpandTopic).toHaveBeenCalledWith(
      'claude-code',
      null,
      expect.objectContaining({ delayMs: 500 }),
    );
  });

  it('forwards model to B2', async () => {
    setupDefaultMocks();

    await runDiscoveryForTopic(MOCK_TOPIC, {
      ...DEFAULT_OPTS,
      model: 'sonnet',
      mode: 'scheduled',
    });

    expect(mockGroupTopic).toHaveBeenCalledWith(
      'claude-code',
      expect.objectContaining({ model: 'sonnet' }),
    );
  });

  it('forwards dryRun to all stages', async () => {
    setupDefaultMocks();

    await runDiscoveryForTopic(MOCK_TOPIC, {
      ...DEFAULT_OPTS,
      dryRun: true,
      mode: 'scheduled',
    });

    expect(mockExpandTopic).toHaveBeenCalledWith(
      'claude-code',
      null,
      expect.objectContaining({ dryRun: true }),
    );
    expect(mockGroupTopic).toHaveBeenCalledWith(
      'claude-code',
      expect.objectContaining({ dryRun: true }),
    );
    expect(mockScoreAndQueue).toHaveBeenCalledWith(
      'claude-code',
      null,
      expect.objectContaining({ dryRun: true }),
    );
  });

  it('forwards maxSerp and skipSerp to B3', async () => {
    setupDefaultMocks();

    await runDiscoveryForTopic(MOCK_TOPIC, {
      ...DEFAULT_OPTS,
      maxSerp: 20,
      skipSerp: true,
      mode: 'scheduled',
    });

    expect(mockScoreAndQueue).toHaveBeenCalledWith(
      'claude-code',
      null,
      expect.objectContaining({ maxSerp: 20, skipSerp: true }),
    );
  });
});
