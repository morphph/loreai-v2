/**
 * Tests for SPEC-D2: Entity extraction guard + C1 adaptation
 *
 * - isFlagshipSubtopic() correctly identifies flagship slugs, subtopics, and rejects non-flagship
 * - loadSubtopics() returns flagship_discovery rows when pack exists, falls back otherwise
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// ── Mock DB ──

const mockGet = vi.fn();
const mockAll = vi.fn();
const mockPrepare = vi.fn(() => ({ get: mockGet, all: mockAll, run: vi.fn() }));
const mockDb = { prepare: mockPrepare };

const mockResolveSubtopics = vi.fn(() => [] as Array<{ slug: string; pillar_topic: string; source: string }>);

vi.mock('../lib/db', () => ({
  getDb: vi.fn(() => mockDb),
  upsertTopicCluster: vi.fn(),
  resolveSubtopics: (...args: unknown[]) => mockResolveSubtopics(...args),
  closeDb: vi.fn(),
  getAllRecentNewsItems: vi.fn(() => []),
}));

// fs mock removed — loadSubtopics now delegates to resolveSubtopics (no filesystem check)

// ── Mock AI (not needed for these tests but extract-entities imports it) ──

vi.mock('../lib/ai', () => ({
  callClaudeWithRetry: vi.fn(),
  checkClaudeHealth: vi.fn(),
}));

// ── Mock remaining discovery deps ──

vi.mock('../lib/keyword-expand', () => ({ expandTopic: vi.fn() }));
vi.mock('../lib/keyword-group', () => ({ groupTopic: vi.fn() }));
vi.mock('../lib/score-queue', () => ({ scoreAndQueue: vi.fn() }));
vi.mock('../lib/serper', () => ({ searchRelated: vi.fn() }));

import { isFlagshipSubtopic } from '../extract-entities';
import { loadSubtopics, FLAGSHIP_TOPICS } from '../lib/discovery';

beforeEach(() => {
  vi.clearAllMocks();
  // Default: DB returns nothing for flagship check
  mockGet.mockReturnValue(undefined);
  mockAll.mockReturnValue([]);
});

afterEach(() => {
  vi.restoreAllMocks();
});

// ── isFlagshipSubtopic ──

describe('isFlagshipSubtopic', () => {
  it('returns true for a direct flagship slug', () => {
    expect(isFlagshipSubtopic('claude-code')).toBe(true);
    expect(isFlagshipSubtopic('codex')).toBe(true);
  });

  it('returns true when DB has flagship_topic_slug set', () => {
    // Simulate a DB row with flagship_topic_slug IS NOT NULL
    mockGet.mockReturnValueOnce({ 1: 1 });
    expect(isFlagshipSubtopic('claude-code-pricing')).toBe(true);
  });

  it('returns true for prefix match against flagship slugs', () => {
    // DB returns nothing, but prefix matches
    mockGet.mockReturnValue(undefined);
    expect(isFlagshipSubtopic('claude-code-hooks')).toBe(true);
    expect(isFlagshipSubtopic('codex-cli-setup')).toBe(true);
  });

  it('returns false for non-flagship slugs', () => {
    mockGet.mockReturnValue(undefined);
    expect(isFlagshipSubtopic('openai-gpt')).toBe(false);
    expect(isFlagshipSubtopic('gemini-pro')).toBe(false);
    expect(isFlagshipSubtopic('anthropic-api')).toBe(false);
  });

  it('does not false-positive on partial prefix match', () => {
    mockGet.mockReturnValue(undefined);
    // "claude-coder" starts with "claude-code" but NOT "claude-code-"
    expect(isFlagshipSubtopic('claude-coder')).toBe(false);
    // "codextra" starts with "codex" but NOT "codex-"
    expect(isFlagshipSubtopic('codextra')).toBe(false);
  });
});

// ── loadSubtopics ──

describe('loadSubtopics', () => {
  it('returns flagship_discovery rows when pack exists and DB has them', () => {
    // loadSubtopics now delegates to resolveSubtopics
    mockResolveSubtopics.mockReturnValueOnce([
      { slug: 'claude-code-hooks', pillar_topic: 'Claude Code Hooks', source: 'flagship_discovery' },
      { slug: 'claude-code-pricing', pillar_topic: 'Claude Code Pricing', source: 'flagship_discovery' },
    ]);

    const result = loadSubtopics('claude-code');

    expect(result).toHaveLength(2);
    expect(result[0].slug).toBe('claude-code-hooks');
    expect(mockResolveSubtopics).toHaveBeenCalledWith('claude-code');
  });

  it('falls back to legacy LIKE query when no flagship_discovery rows', () => {
    // resolveSubtopics handles fallback internally; returns entity rows
    mockResolveSubtopics.mockReturnValueOnce([
      { slug: 'claude-code', pillar_topic: 'Claude Code', source: 'entity_extract' },
      { slug: 'claude-code-tips', pillar_topic: 'Claude Code Tips', source: 'entity_extract' },
    ]);

    const result = loadSubtopics('claude-code');

    expect(result).toHaveLength(2);
    expect(mockResolveSubtopics).toHaveBeenCalledWith('claude-code');
  });

  it('uses resolveSubtopics for non-flagship topics too', () => {
    mockResolveSubtopics.mockReturnValueOnce([
      { slug: 'openai-gpt', pillar_topic: 'OpenAI GPT', source: 'entity_extract' },
    ]);

    const result = loadSubtopics('openai-gpt');

    expect(result).toHaveLength(1);
    expect(mockResolveSubtopics).toHaveBeenCalledWith('openai-gpt');
  });

  it('returns empty array when no rows match', () => {
    mockResolveSubtopics.mockReturnValueOnce([]);

    const result = loadSubtopics('nonexistent-topic');
    expect(result).toHaveLength(0);
  });
});
