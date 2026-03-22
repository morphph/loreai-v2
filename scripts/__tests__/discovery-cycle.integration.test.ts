/**
 * Integration tests for C1 — Discovery Cycle
 *
 * Tests the full orchestration with in-memory DB.
 * Real API calls require SERPER_API_KEY + EXA_API_KEY + ANTHROPIC_API_KEY.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// ── Mock B1/B2/B3 to avoid real API calls but test orchestration ──

vi.mock('../lib/keyword-expand', () => ({
  expandTopic: vi.fn(),
}));

vi.mock('../lib/keyword-group', () => ({
  groupTopic: vi.fn(),
}));

vi.mock('../lib/score-queue', () => ({
  scoreAndQueue: vi.fn(),
}));

vi.mock('../lib/serper', () => ({
  searchRelated: vi.fn(),
}));

vi.mock('../lib/db', () => {
  const subtopics = [
    { slug: 'claude-code', pillar_topic: 'Claude Code' },
    { slug: 'claude-code-pricing', pillar_topic: 'Claude Code Pricing' },
    { slug: 'claude-code-hooks', pillar_topic: 'Claude Code Hooks' },
  ];
  const mockDb = {
    prepare: vi.fn(() => ({
      all: vi.fn(() => subtopics),
      run: vi.fn(),
    })),
  };
  return {
    getDb: vi.fn(() => mockDb),
    upsertTopicCluster: vi.fn(),
    closeDb: vi.fn(),
  };
});

import {
  runDiscoveryCycle,
  FLAGSHIP_TOPICS,
} from '../lib/discovery';

import type { DiscoveryOptions } from '../lib/discovery';

import { expandTopic } from '../lib/keyword-expand';
import { groupTopic } from '../lib/keyword-group';
import { scoreAndQueue } from '../lib/score-queue';
import { searchRelated } from '../lib/serper';

const mockExpandTopic = vi.mocked(expandTopic);
const mockGroupTopic = vi.mocked(groupTopic);
const mockScoreAndQueue = vi.mocked(scoreAndQueue);
const mockSearchRelated = vi.mocked(searchRelated);

const MOCK_EXPANSION = {
  topic: 'claude-code',
  subtopics_processed: 3,
  subtopic_results: [],
  total_keywords_discovered: 50,
  total_new_keywords: 20,
  total_volume_scored: 20,
  serper_api_calls: 12,
  exa_api_calls: 3,
};

const MOCK_GROUPING = {
  clusters_processed: 3,
  total_keywords_grouped: 20,
  total_groups_created: 6,
  total_ungrouped: 2,
  cluster_results: [],
  claude_api_calls: 3,
};

const MOCK_SCORING = {
  groups_scored: 6,
  groups_queued: 5,
  groups_deferred: 1,
  groups_already_queued: 0,
  serp_api_calls: 5,
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
        routing_reason: 'commercial',
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
  skipExa: false,
  skipSerp: false,
  model: 'haiku',
};

beforeEach(() => {
  vi.clearAllMocks();
  mockExpandTopic.mockResolvedValue(MOCK_EXPANSION);
  mockGroupTopic.mockResolvedValue(MOCK_GROUPING);
  mockScoreAndQueue.mockResolvedValue(MOCK_SCORING);
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('Discovery Cycle Integration', () => {
  it('full pipeline for single topic produces valid result', async () => {
    const results = await runDiscoveryCycle({
      ...DEFAULT_OPTS,
      topic: 'claude-code',
    });

    expect(results).toHaveLength(1);
    const r = results[0];

    expect(r.topic).toBe('claude-code');
    expect(r.mode).toBe('scheduled');
    expect(r.expansion.total_new_keywords).toBe(20);
    expect(r.grouping).not.toBeNull();
    expect(r.grouping!.total_groups_created).toBe(6);
    expect(r.scoring).not.toBeNull();
    expect(r.scoring!.groups_queued).toBe(5);
    expect(r.total_api_calls).toBe(12 + 3 + 3 + 5); // serper + exa + claude + serp
    expect(r.duration_ms).toBeGreaterThanOrEqual(0);
    expect(r.errors).toBeUndefined();
  });

  it('multi-topic scheduled mode returns results for all topics', async () => {
    const results = await runDiscoveryCycle(DEFAULT_OPTS);

    expect(results).toHaveLength(FLAGSHIP_TOPICS.length);
    for (let i = 0; i < results.length; i++) {
      expect(results[i].topic).toBe(FLAGSHIP_TOPICS[i].slug);
      expect(results[i].mode).toBe('scheduled');
    }
  });

  it('event-triggered mode includes subtopic discovery', async () => {
    mockSearchRelated.mockResolvedValue({
      query: 'claude code agent teams',
      related: ['claude code team collaboration', 'claude code multi agent setup'],
    });

    const results = await runDiscoveryCycle({
      ...DEFAULT_OPTS,
      topic: 'claude-code',
      event: 'Anthropic launches Claude Code Agent Teams',
    });

    expect(results[0].mode).toBe('event-triggered');
    expect(results[0].event).toBe('Anthropic launches Claude Code Agent Teams');
    expect(results[0].subtopic_discovery).toBeDefined();
    expect(mockSearchRelated).toHaveBeenCalled();
  });

  it('dry-run mode passes dryRun flag through', async () => {
    const results = await runDiscoveryCycle({
      ...DEFAULT_OPTS,
      topic: 'claude-code',
      dryRun: true,
    });

    expect(results).toHaveLength(1);
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

  it('expand-only mode stops after Stage 1', async () => {
    const results = await runDiscoveryCycle({
      ...DEFAULT_OPTS,
      topic: 'claude-code',
      expandOnly: true,
    });

    expect(results[0].grouping).toBeNull();
    expect(results[0].scoring).toBeNull();
    expect(mockGroupTopic).not.toHaveBeenCalled();
    expect(mockScoreAndQueue).not.toHaveBeenCalled();
  });

  it('pipeline continues when Stage 2 fails', async () => {
    mockGroupTopic.mockRejectedValue(new Error('Claude quota exceeded'));

    const results = await runDiscoveryCycle({
      ...DEFAULT_OPTS,
      topic: 'claude-code',
    });

    const r = results[0];
    expect(r.grouping).toBeNull();
    expect(r.scoring).not.toBeNull();
    expect(r.errors).toBeDefined();
    expect(r.errors!.length).toBe(1);
    expect(r.errors![0]).toContain('Stage 2 failed');
  });

  it('JSON output is valid and parseable', async () => {
    const results = await runDiscoveryCycle({
      ...DEFAULT_OPTS,
      topic: 'claude-code',
    });

    const json = JSON.stringify(results);
    const parsed = JSON.parse(json);
    expect(parsed).toEqual(results);
  });

  it('result timestamp is valid ISO 8601', async () => {
    const results = await runDiscoveryCycle({
      ...DEFAULT_OPTS,
      topic: 'claude-code',
    });

    const ts = results[0].timestamp;
    expect(new Date(ts).toISOString()).toBe(ts);
  });

  it('scoring top_5_queue is sorted by priority descending', async () => {
    mockScoreAndQueue.mockResolvedValue({
      ...MOCK_SCORING,
      queue_entries: [
        {
          group_id: 1,
          primary_keyword: 'low priority',
          scoring: {
            group_id: 1,
            primary_keyword: 'low priority',
            priority_score: 100,
            score_breakdown: {
              volume: 100,
              competition_divisor: 1,
              intent_multiplier: 1,
              base_score: 100,
              timeliness_bonus: 0,
            },
          },
          routing: {
            content_type: 'faq',
            research_pipeline: 'standard' as const,
            routing_reason: 'test',
          },
          deferred: false,
          already_queued: false,
        },
        {
          group_id: 2,
          primary_keyword: 'high priority',
          scoring: {
            group_id: 2,
            primary_keyword: 'high priority',
            priority_score: 50000,
            score_breakdown: {
              volume: 50000,
              competition_divisor: 1,
              intent_multiplier: 1,
              base_score: 50000,
              timeliness_bonus: 0,
            },
          },
          routing: {
            content_type: 'blog',
            research_pipeline: 'deep_research' as const,
            routing_reason: 'test',
          },
          deferred: false,
          already_queued: false,
        },
      ],
    });

    const results = await runDiscoveryCycle({
      ...DEFAULT_OPTS,
      topic: 'claude-code',
    });

    const top5 = results[0].scoring!.top_5_queue;
    expect(top5[0].priority_score).toBeGreaterThan(top5[1].priority_score);
    expect(top5[0].primary_keyword).toBe('high priority');
  });
});
