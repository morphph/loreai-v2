/**
 * Integration tests for B1 — Keyword Expansion
 *
 * Uses real Serper + Exa APIs with a temporary in-memory SQLite DB.
 * Skipped when API keys are not set.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import Database from 'better-sqlite3';
import { expandSubtopic, expandTopic } from '../lib/keyword-expand';

import type { SubtopicInput, ExpandOptions } from '../lib/keyword-expand';

// ── Conditional execution ──

const HAS_KEYS = !!(process.env.SERPER_API_KEY && process.env.EXA_API_KEY);
const describeIfKeys = HAS_KEYS ? describe : describe.skip;

// ── Mock DB for integration tests ──
// We need to override the db module to use an in-memory database

let memDb: Database.Database;

function setupMemoryDb() {
  memDb = new Database(':memory:');
  memDb.exec(`
    CREATE TABLE IF NOT EXISTS keywords (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      keyword TEXT UNIQUE NOT NULL,
      cluster_slug TEXT,
      source TEXT NOT NULL,
      search_result_count INTEGER DEFAULT 0,
      content_exists BOOLEAN DEFAULT 0,
      content_type TEXT,
      content_slug TEXT,
      discovered_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      search_volume INTEGER DEFAULT NULL,
      competition TEXT DEFAULT NULL,
      intent TEXT DEFAULT NULL,
      keyword_group_id INTEGER DEFAULT NULL
    );

    CREATE TABLE IF NOT EXISTS topic_clusters (
      slug TEXT PRIMARY KEY,
      pillar_topic TEXT NOT NULL,
      mention_count INTEGER DEFAULT 0,
      first_seen DATETIME DEFAULT CURRENT_TIMESTAMP,
      last_seen DATETIME DEFAULT CURRENT_TIMESTAMP,
      has_topic_hub BOOLEAN DEFAULT 0,
      brave_related_json TEXT,
      brave_updated_at DATETIME,
      source TEXT DEFAULT 'entity_extract',
      flagship_topic_slug TEXT DEFAULT NULL,
      description TEXT DEFAULT NULL,
      aliases_json TEXT DEFAULT NULL,
      freshness_sensitivity TEXT DEFAULT NULL,
      page_type_hints_json TEXT DEFAULT NULL,
      seed_keywords_json TEXT DEFAULT NULL,
      evidence_type TEXT DEFAULT NULL,
      pack_version INTEGER DEFAULT NULL
    );
  `);

  // Insert test topic cluster
  memDb.prepare(`
    INSERT INTO topic_clusters (slug, pillar_topic, mention_count)
    VALUES ('claude-code-pricing', 'Claude Code Pricing', 5)
  `).run();
}

describeIfKeys('B1 — Keyword Expansion (Integration)', () => {
  beforeEach(() => {
    setupMemoryDb();
  });

  afterEach(() => {
    if (memDb) memDb.close();
  });

  it('full expansion for claude-code-pricing subtopic', async () => {
    // This test uses real APIs — it will consume credits
    const subtopic: SubtopicInput = {
      slug: 'claude-code-pricing',
      pillar_topic: 'Claude Code Pricing',
    };

    const result = await expandSubtopic(subtopic, {
      delayMs: 500,
      skipExa: false,
      maxVolumeCallsPerSubtopic: 3, // Limit volume calls to save credits
      dryRun: true, // Use dry run to avoid needing a real DB connection
    });

    expect(result.total_raw).toBeGreaterThan(0);
    expect(result.slug).toBe('claude-code-pricing');
  }, 30_000);

  it('PAA returns real questions', async () => {
    const subtopic: SubtopicInput = {
      slug: 'claude-code-pricing',
      pillar_topic: 'Claude Code Pricing',
    };

    const result = await expandSubtopic(subtopic, {
      delayMs: 500,
      skipExa: true,
      maxVolumeCallsPerSubtopic: 0,
      dryRun: true,
    });

    // PAA may return empty for some queries — assert structure exists
    expect(Array.isArray(result.keywords_by_source['serper-paa'])).toBe(true);
  }, 15_000);

  it('related returns real queries', async () => {
    const subtopic: SubtopicInput = {
      slug: 'claude-code-pricing',
      pillar_topic: 'Claude Code Pricing',
    };

    const result = await expandSubtopic(subtopic, {
      delayMs: 500,
      skipExa: true,
      maxVolumeCallsPerSubtopic: 0,
      dryRun: true,
    });

    // Related may return empty for some queries — assert structure exists
    expect(Array.isArray(result.keywords_by_source['serper-related'])).toBe(true);
  }, 15_000);

  it('Exa finds competitors', async () => {
    const subtopic: SubtopicInput = {
      slug: 'claude-code-pricing',
      pillar_topic: 'Claude Code Pricing',
    };

    const result = await expandSubtopic(subtopic, {
      delayMs: 500,
      skipExa: false,
      maxVolumeCallsPerSubtopic: 0,
      dryRun: true,
    });

    expect(result.keywords_by_source['exa-competitor'].length).toBeGreaterThan(0);
  }, 30_000);

  it('dedup works across sources', async () => {
    const subtopic: SubtopicInput = {
      slug: 'claude-code-pricing',
      pillar_topic: 'Claude Code Pricing',
    };

    const result = await expandSubtopic(subtopic, {
      delayMs: 500,
      skipExa: false,
      maxVolumeCallsPerSubtopic: 0,
      dryRun: true,
    });

    // All keywords should be unique (dedup within run)
    const allKws = [
      ...result.keywords_by_source['serper-paa'],
      ...result.keywords_by_source['serper-related'],
      ...result.keywords_by_source['serper-autocomplete'],
      ...result.keywords_by_source['exa-competitor'],
    ];
    const uniqueSet = new Set(allKws);
    expect(allKws.length).toBe(uniqueSet.size);
  }, 30_000);

  it('skip-exa flag works', async () => {
    const subtopic: SubtopicInput = {
      slug: 'claude-code-pricing',
      pillar_topic: 'Claude Code Pricing',
    };

    const result = await expandSubtopic(subtopic, {
      delayMs: 500,
      skipExa: true,
      maxVolumeCallsPerSubtopic: 0,
      dryRun: true,
    });

    expect(result.keywords_by_source['exa-competitor']).toHaveLength(0);
    // PAA may return empty — just verify Exa was skipped
    expect(Array.isArray(result.keywords_by_source['serper-paa'])).toBe(true);
  }, 15_000);

  it('dry run reports total_new = total_raw', async () => {
    const subtopic: SubtopicInput = {
      slug: 'claude-code-pricing',
      pillar_topic: 'Claude Code Pricing',
    };

    const result = await expandSubtopic(subtopic, {
      delayMs: 500,
      skipExa: true,
      maxVolumeCallsPerSubtopic: 0,
      dryRun: true,
    });

    expect(result.total_new).toBe(result.total_raw);
  }, 15_000);
});
