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

vi.mock('../lib/db', () => ({
  getDb: vi.fn(() => mockDb),
  upsertTopicCluster: vi.fn(),
  closeDb: vi.fn(),
  getAllRecentNewsItems: vi.fn(() => []),
}));

// ── Mock fs for loadSubtopics pack check ──

vi.mock('fs', async () => {
  const actual = await vi.importActual<typeof import('fs')>('fs');
  return {
    ...actual,
    existsSync: vi.fn(() => false),
    readFileSync: actual.readFileSync,
  };
});

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
import { existsSync } from 'fs';

const mockExistsSync = vi.mocked(existsSync);

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
    mockExistsSync.mockReturnValue(true);
    mockAll.mockReturnValueOnce([
      { slug: 'claude-code-hooks', pillar_topic: 'Claude Code Hooks' },
      { slug: 'claude-code-pricing', pillar_topic: 'Claude Code Pricing' },
    ]);

    const result = loadSubtopics('claude-code');

    expect(result).toHaveLength(2);
    expect(result[0].slug).toBe('claude-code-hooks');
    // Should have queried with flagship_topic_slug = ? AND source = 'flagship_discovery'
    expect(mockPrepare).toHaveBeenCalledWith(
      expect.stringContaining('flagship_topic_slug'),
    );
  });

  it('falls back to legacy LIKE query when pack exists but no flagship_discovery rows', () => {
    mockExistsSync.mockReturnValue(true);
    // First call (flagship query) returns empty
    mockAll.mockReturnValueOnce([]);
    // Second call (legacy query) returns rows
    mockAll.mockReturnValueOnce([
      { slug: 'claude-code', pillar_topic: 'Claude Code' },
      { slug: 'claude-code-tips', pillar_topic: 'Claude Code Tips' },
    ]);

    const result = loadSubtopics('claude-code');

    expect(result).toHaveLength(2);
    expect(mockPrepare).toHaveBeenCalledTimes(2);
  });

  it('uses legacy LIKE query when no pack file exists', () => {
    mockExistsSync.mockReturnValue(false);
    mockAll.mockReturnValueOnce([
      { slug: 'openai-gpt', pillar_topic: 'OpenAI GPT' },
    ]);

    const result = loadSubtopics('openai-gpt');

    expect(result).toHaveLength(1);
    // Should NOT have queried for flagship_topic_slug
    expect(mockPrepare).toHaveBeenCalledTimes(1);
    expect(mockPrepare).toHaveBeenCalledWith(
      expect.stringContaining('LIKE'),
    );
  });

  it('returns empty array when no rows match', () => {
    mockExistsSync.mockReturnValue(false);
    mockAll.mockReturnValueOnce([]);

    const result = loadSubtopics('nonexistent-topic');
    expect(result).toHaveLength(0);
  });
});
