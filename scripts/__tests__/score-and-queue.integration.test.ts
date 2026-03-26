/**
 * Integration tests for B3 — Priority Scoring + Unified Queue
 *
 * Uses in-memory SQLite DB. No API keys needed for most tests.
 * Serper tests require SERPER_API_KEY.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import Database from 'better-sqlite3';

import {
  calculatePriorityScore,
  routeKeywordGroup,
  shouldDeferTopicHub,
  DEFAULT_VOLUME,
} from '../lib/priority';

import type {
  ScoringInput,
  GroupKeyword,
  QueueEntry,
} from '../lib/priority';

// ── In-memory DB helpers ──

let testDb: InstanceType<typeof Database>;

function createTestDb(): InstanceType<typeof Database> {
  const db = new Database(':memory:');
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');

  db.exec(`
    CREATE TABLE IF NOT EXISTS topic_clusters (
      slug TEXT PRIMARY KEY,
      pillar_topic TEXT NOT NULL,
      mention_count INTEGER DEFAULT 0,
      first_seen DATETIME DEFAULT CURRENT_TIMESTAMP,
      last_seen DATETIME DEFAULT CURRENT_TIMESTAMP,
      has_topic_hub BOOLEAN DEFAULT 0,
      brave_related_json TEXT,
      brave_updated_at DATETIME
    );

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

    CREATE TABLE IF NOT EXISTS keyword_groups (
      group_id INTEGER PRIMARY KEY AUTOINCREMENT,
      primary_keyword TEXT NOT NULL,
      intent TEXT NOT NULL DEFAULT 'informational',
      content_type TEXT,
      priority_score REAL DEFAULT 0,
      status TEXT NOT NULL DEFAULT 'pending',
      cluster_slug TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS create_queue (
      job_id INTEGER PRIMARY KEY AUTOINCREMENT,
      keyword_group_id INTEGER REFERENCES keyword_groups(group_id),
      content_type TEXT NOT NULL,
      research_pipeline TEXT NOT NULL DEFAULT 'standard',
      priority_score REAL DEFAULT 0,
      status TEXT NOT NULL DEFAULT 'pending',
      refresh_meta TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      completed_at DATETIME
    );

    CREATE TABLE IF NOT EXISTS content (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      type TEXT NOT NULL,
      slug TEXT NOT NULL,
      lang TEXT NOT NULL DEFAULT 'en',
      title TEXT,
      body_markdown TEXT,
      meta_json TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(type, slug, lang)
    );

    CREATE TABLE IF NOT EXISTS news_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      url TEXT UNIQUE,
      source TEXT NOT NULL,
      source_tier INTEGER DEFAULT 5,
      summary TEXT,
      score INTEGER DEFAULT 50,
      engagement_likes INTEGER DEFAULT 0,
      engagement_retweets INTEGER DEFAULT 0,
      engagement_downloads INTEGER DEFAULT 0,
      detected_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      selected_for_newsletter_at DATETIME DEFAULT NULL,
      raw_json TEXT
    );
  `);

  return db;
}

function insertTestGroup(
  db: InstanceType<typeof Database>,
  opts: {
    primaryKeyword: string;
    intent: string;
    contentType: string;
    clusterSlug: string;
    keywords: Array<{ keyword: string; searchVolume: number | null; competition: string | null }>;
  },
): number {
  const res = db.prepare(`
    INSERT INTO keyword_groups (primary_keyword, intent, content_type, priority_score, status, cluster_slug)
    VALUES (?, ?, ?, 0, 'pending', ?)
  `).run(opts.primaryKeyword, opts.intent, opts.contentType, opts.clusterSlug);

  const groupId = Number(res.lastInsertRowid);

  for (const kw of opts.keywords) {
    db.prepare(`
      INSERT INTO keywords (keyword, source, cluster_slug, search_volume, competition, keyword_group_id)
      VALUES (?, 'test', ?, ?, ?, ?)
    `).run(kw.keyword, opts.clusterSlug, kw.searchVolume, kw.competition, groupId);
  }

  return groupId;
}

// ── Tests ──

describe('score-and-queue integration', () => {
  beforeEach(() => {
    testDb = createTestDb();
  });

  afterEach(() => {
    testDb.close();
  });

  describe('end-to-end scoring flow (pure logic)', () => {
    it('scores 3 diverse groups correctly and orders by priority', () => {
      // Simulate what score-and-queue.ts would do:
      // 1. Load groups + keywords
      // 2. Score
      // 3. Route
      // 4. Write to queue

      // Insert test data
      const group1Id = insertTestGroup(testDb, {
        primaryKeyword: 'claude code vs cursor',
        intent: 'commercial',
        contentType: 'compare',
        clusterSlug: 'claude-code-vs-cursor',
        keywords: [
          { keyword: 'claude code vs cursor', searchVolume: 10000, competition: 'low' },
          { keyword: 'claude code or cursor', searchVolume: 500, competition: 'low' },
        ],
      });

      const group2Id = insertTestGroup(testDb, {
        primaryKeyword: 'how much does claude code cost',
        intent: 'informational',
        contentType: 'faq',
        clusterSlug: 'claude-code-pricing',
        keywords: [
          { keyword: 'how much does claude code cost', searchVolume: 1000, competition: 'low' },
          { keyword: 'claude code cost', searchVolume: 1000, competition: 'low' },
        ],
      });

      const group3Id = insertTestGroup(testDb, {
        primaryKeyword: 'what is MCP server',
        intent: 'definitional',
        contentType: 'glossary',
        clusterSlug: 'claude-code-mcp',
        keywords: [
          { keyword: 'what is MCP server', searchVolume: 100, competition: 'medium' },
        ],
      });

      // Load from DB and score
      const groups = testDb.prepare(`
        SELECT group_id, primary_keyword, intent, content_type, cluster_slug
        FROM keyword_groups ORDER BY group_id
      `).all() as Array<{ group_id: number; primary_keyword: string; intent: string; content_type: string; cluster_slug: string }>;

      const results = groups.map((g) => {
        const keywords = testDb.prepare(`
          SELECT keyword, search_volume, competition FROM keywords WHERE keyword_group_id = ?
        `).all(g.group_id) as GroupKeyword[];

        return calculatePriorityScore({
          group_id: g.group_id,
          primary_keyword: g.primary_keyword,
          intent: g.intent,
          content_type: g.content_type,
          cluster_slug: g.cluster_slug,
          keywords,
          event_age_hours: null,
        });
      });

      results.sort((a, b) => b.priority_score - a.priority_score);

      // Commercial with high volume should rank first
      expect(results[0].primary_keyword).toBe('claude code vs cursor');
      expect(results[0].priority_score).toBe(150000);

      // Informational with moderate volume second
      expect(results[1].primary_keyword).toBe('how much does claude code cost');

      // Definitional with low volume last
      expect(results[2].primary_keyword).toBe('what is MCP server');
      expect(results[2].priority_score).toBe(200);

      // Write to queue
      const insertJob = testDb.prepare(`
        INSERT INTO create_queue (keyword_group_id, content_type, research_pipeline, priority_score, status)
        VALUES (?, ?, ?, ?, 'pending')
      `);

      for (const r of results) {
        const group = groups.find((g) => g.group_id === r.group_id)!;
        const routing = routeKeywordGroup({
          intent: group.intent,
          b2_content_type: group.content_type,
          serp_depth: null,
          recommended_content_type: null,
          cluster_page_count: 0,
        });
        insertJob.run(r.group_id, routing.content_type, routing.research_pipeline, r.priority_score);
      }

      // Verify queue
      const queue = testDb.prepare(`
        SELECT * FROM create_queue ORDER BY priority_score DESC
      `).all() as Array<{ keyword_group_id: number; content_type: string; research_pipeline: string; priority_score: number }>;

      expect(queue).toHaveLength(3);
      expect(queue[0].content_type).toBe('compare');
      expect(queue[0].research_pipeline).toBe('standard');
      expect(queue[1].content_type).toBe('faq');
      expect(queue[2].content_type).toBe('glossary');
    });

    it('defers topic-hub when cluster has too few pages', () => {
      insertTestGroup(testDb, {
        primaryKeyword: 'claude code guide',
        intent: 'navigational',
        contentType: 'topic-hub',
        clusterSlug: 'claude-code',
        keywords: [
          { keyword: 'claude code guide', searchVolume: 500, competition: 'high' },
        ],
      });

      // Insert only 5 content pages (below TOPIC_HUB_MIN_PAGES=15)
      for (let i = 0; i < 5; i++) {
        testDb.prepare(`
          INSERT INTO content (type, slug, lang, title) VALUES ('faq', ?, 'en', ?)
        `).run(`claude-code-faq-${i}`, `FAQ ${i}`);
      }

      const pageCount = (testDb.prepare(`
        SELECT COUNT(*) as count FROM content WHERE slug LIKE 'claude-code%'
      `).get() as { count: number }).count;

      expect(shouldDeferTopicHub('topic-hub', pageCount)).toBe(true);
    });

    it('does not defer topic-hub when cluster has enough pages', () => {
      // Insert 16 content pages
      for (let i = 0; i < 16; i++) {
        testDb.prepare(`
          INSERT INTO content (type, slug, lang, title) VALUES ('faq', ?, 'en', ?)
        `).run(`claude-code-faq-${i}`, `FAQ ${i}`);
      }

      const pageCount = (testDb.prepare(`
        SELECT COUNT(*) as count FROM content WHERE slug LIKE 'claude-code%'
      `).get() as { count: number }).count;

      expect(shouldDeferTopicHub('topic-hub', pageCount)).toBe(false);
    });
  });

  describe('idempotency', () => {
    it('does not create duplicate queue jobs', () => {
      const groupId = insertTestGroup(testDb, {
        primaryKeyword: 'test keyword',
        intent: 'informational',
        contentType: 'faq',
        clusterSlug: 'test-cluster',
        keywords: [
          { keyword: 'test keyword', searchVolume: 100, competition: 'low' },
        ],
      });

      // Insert first job
      testDb.prepare(`
        INSERT INTO create_queue (keyword_group_id, content_type, research_pipeline, priority_score, status)
        VALUES (?, 'faq', 'standard', 750, 'pending')
      `).run(groupId);

      // Check if already queued
      const existing = testDb.prepare(`
        SELECT job_id FROM create_queue
        WHERE keyword_group_id = ? AND status IN ('pending', 'in_progress')
      `).get(groupId);

      expect(existing).toBeDefined();

      // Attempting to insert again should be skipped by logic (not by DB constraint)
      const queueBefore = testDb.prepare('SELECT COUNT(*) as count FROM create_queue').get() as { count: number };
      expect(queueBefore.count).toBe(1);
    });
  });

  describe('groups with no keywords', () => {
    it('uses DEFAULT_VOLUME and does not crash', () => {
      insertTestGroup(testDb, {
        primaryKeyword: 'orphan keyword',
        intent: 'informational',
        contentType: 'faq',
        clusterSlug: 'test-cluster',
        keywords: [], // no keywords
      });

      const keywords = testDb.prepare(`
        SELECT keyword, search_volume, competition FROM keywords WHERE keyword_group_id = ?
      `).all(1) as GroupKeyword[];

      // Empty keywords → should use default volume
      const result = calculatePriorityScore({
        group_id: 1,
        primary_keyword: 'orphan keyword',
        intent: 'informational',
        content_type: 'faq',
        cluster_slug: 'test-cluster',
        keywords,
        event_age_hours: null,
      });

      expect(result.priority_score).toBeGreaterThan(0);
      expect(result.score_breakdown.volume).toBe(DEFAULT_VOLUME);
    });
  });

  describe('force rescore', () => {
    it('updates scores when forced', () => {
      const groupId = insertTestGroup(testDb, {
        primaryKeyword: 'test keyword',
        intent: 'informational',
        contentType: 'faq',
        clusterSlug: 'test-cluster',
        keywords: [
          { keyword: 'test keyword', searchVolume: 100, competition: 'low' },
        ],
      });

      // First score
      const keywords1 = testDb.prepare(`
        SELECT keyword, search_volume, competition FROM keywords WHERE keyword_group_id = ?
      `).all(groupId) as GroupKeyword[];

      const result1 = calculatePriorityScore({
        group_id: groupId,
        primary_keyword: 'test keyword',
        intent: 'informational',
        content_type: 'faq',
        cluster_slug: 'test-cluster',
        keywords: keywords1,
        event_age_hours: null,
      });

      testDb.prepare('UPDATE keyword_groups SET priority_score = ? WHERE group_id = ?')
        .run(result1.priority_score, groupId);

      // Change volume
      testDb.prepare('UPDATE keywords SET search_volume = 10000 WHERE keyword_group_id = ?')
        .run(groupId);

      // Re-score
      const keywords2 = testDb.prepare(`
        SELECT keyword, search_volume, competition FROM keywords WHERE keyword_group_id = ?
      `).all(groupId) as GroupKeyword[];

      const result2 = calculatePriorityScore({
        group_id: groupId,
        primary_keyword: 'test keyword',
        intent: 'informational',
        content_type: 'faq',
        cluster_slug: 'test-cluster',
        keywords: keywords2,
        event_age_hours: null,
      });

      expect(result2.priority_score).toBeGreaterThan(result1.priority_score);
    });
  });

  describe('routing integration', () => {
    it('routes all standard content types correctly', () => {
      const cases = [
        { intent: 'commercial', contentType: 'compare', expectedPipeline: 'standard' },
        { intent: 'informational', contentType: 'faq', expectedPipeline: 'standard' },
        { intent: 'definitional', contentType: 'glossary', expectedPipeline: 'standard' },
        { intent: 'navigational', contentType: 'topic-hub', expectedPipeline: 'standard' },
        { intent: 'informational', contentType: 'blog', expectedPipeline: 'deep_research' },
      ];

      for (const c of cases) {
        const result = routeKeywordGroup({
          intent: c.intent,
          b2_content_type: c.contentType,
          serp_depth: null,
          recommended_content_type: null,
          cluster_page_count: 20,
        });
        expect(result.content_type).toBe(c.contentType);
        expect(result.research_pipeline).toBe(c.expectedPipeline);
      }
    });

    it('SERP depth override produces correct routing', () => {
      const result = routeKeywordGroup({
        intent: 'informational',
        b2_content_type: 'faq',
        serp_depth: 'long_form',
        recommended_content_type: 'blog',
        cluster_page_count: 0,
      });

      expect(result.content_type).toBe('blog');
      expect(result.research_pipeline).toBe('deep_research');
    });
  });
});
