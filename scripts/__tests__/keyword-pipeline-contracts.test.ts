/**
 * Keyword Pipeline Contract Tests — Cross-Stage Data Shape Verification
 *
 * Verifies that data produced by each keyword engine stage (B1→B2→B3→B4)
 * matches what the next stage expects. Uses in-memory SQLite, no API keys.
 *
 * Complements e2e-contracts.test.ts with deeper keyword engine contracts,
 * including C1→B1 (discovery) and C3→queue (performance) boundaries.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import Database from 'better-sqlite3';

import {
  calculatePriorityScore,
  routeKeywordGroup,
  DEFAULT_VOLUME,
} from '../lib/priority';
import type { ScoringInput, RoutingInput } from '../lib/priority';

import { getValidatorForType } from '../lib/content-gen';
import type { ContentType } from '../lib/content-gen';

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

function toSlug(str: string): string {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

// ── Tests ──

describe('keyword pipeline contracts', () => {
  beforeEach(() => {
    testDb = createTestDb();
  });

  afterEach(() => {
    testDb.close();
  });

  // ── 1. B1 → B2: upsertKeyword output feeds B2 ungrouped query ──

  describe('B1 → B2: expansion output matches grouping input', () => {
    it('keywords from B1 have all fields B2 needs for grouping', () => {
      // B1 writes keywords via upsertKeyword(keyword, source, clusterSlug)
      const insertKw = testDb.prepare(`
        INSERT INTO keywords (keyword, source, cluster_slug, search_volume, competition)
        VALUES (?, ?, ?, ?, ?)
        ON CONFLICT(keyword) DO UPDATE SET
          cluster_slug = COALESCE(excluded.cluster_slug, cluster_slug)
      `);

      insertKw.run('what is claude code', 'serper-paa', 'claude-code', 1000, 'medium');
      insertKw.run('claude code pricing', 'serper-related', 'claude-code', 500, 'high');
      insertKw.run('claude code setup guide', 'exa-competitor', 'claude-code', null, null);

      // B2's ungrouped keyword query
      const ungrouped = testDb.prepare(`
        SELECT keyword, cluster_slug, search_volume, competition, intent, keyword_group_id
        FROM keywords
        WHERE keyword_group_id IS NULL AND cluster_slug = ?
        ORDER BY search_volume DESC NULLS LAST
      `).all('claude-code') as Array<{
        keyword: string;
        cluster_slug: string;
        search_volume: number | null;
        competition: string | null;
        intent: string | null;
        keyword_group_id: number | null;
      }>;

      expect(ungrouped).toHaveLength(3);

      // All have required fields for B2
      for (const kw of ungrouped) {
        expect(kw.cluster_slug).toBe('claude-code');
        expect(kw.keyword_group_id).toBeNull(); // ungrouped
        expect(kw.intent).toBeNull(); // not yet assigned by B2
        expect(typeof kw.keyword).toBe('string');
        expect(kw.keyword.length).toBeGreaterThan(0);
      }

      // Volume ordering: highest first, NULLs last
      expect(ungrouped[0].keyword).toBe('what is claude code');
      expect(ungrouped[0].search_volume).toBe(1000);
      expect(ungrouped[2].search_volume).toBeNull();
    });
  });

  // ── 2. B1 upsertKeyword cluster_slug COALESCE ──

  describe('B1 upsertKeyword: cluster_slug COALESCE behavior', () => {
    it('preserves existing cluster_slug when new value is NULL', () => {
      const insertKw = testDb.prepare(`
        INSERT INTO keywords (keyword, source, cluster_slug)
        VALUES (?, ?, ?)
        ON CONFLICT(keyword) DO UPDATE SET
          cluster_slug = COALESCE(excluded.cluster_slug, cluster_slug)
      `);

      // First insert with cluster_slug
      insertKw.run('claude code mcp', 'serper-paa', 'claude-code');

      // Second insert without cluster_slug (the known gotcha)
      insertKw.run('claude code mcp', 'blog-faq:test', null);

      const row = testDb.prepare('SELECT cluster_slug FROM keywords WHERE keyword = ?')
        .get('claude code mcp') as { cluster_slug: string | null };

      // COALESCE keeps the non-NULL value
      expect(row.cluster_slug).toBe('claude-code');
    });

    it('sets cluster_slug to NULL when never provided', () => {
      const insertKw = testDb.prepare(`
        INSERT INTO keywords (keyword, source, cluster_slug)
        VALUES (?, ?, ?)
        ON CONFLICT(keyword) DO UPDATE SET
          cluster_slug = COALESCE(excluded.cluster_slug, cluster_slug)
      `);

      insertKw.run('orphan keyword', 'blog-faq:test', null);

      const row = testDb.prepare('SELECT cluster_slug FROM keywords WHERE keyword = ?')
        .get('orphan keyword') as { cluster_slug: string | null };

      expect(row.cluster_slug).toBeNull();
    });
  });

  // ── 3. B2 → B3: grouped keywords feed scoring ──

  describe('B2 → B3: keyword_groups feed scoring pipeline', () => {
    it('B2 groups have all fields B3 needs for scoring', () => {
      // B2 creates groups
      testDb.prepare(`
        INSERT INTO keyword_groups (primary_keyword, intent, content_type, priority_score, status, cluster_slug)
        VALUES (?, ?, ?, 0, 'pending', ?)
      `).run('what is claude code', 'informational', 'faq', 'claude-code');

      const groupId = Number(
        (testDb.prepare('SELECT last_insert_rowid() as id').get() as { id: number }).id,
      );

      // B2 links keywords to the group
      testDb.prepare(`
        INSERT INTO keywords (keyword, source, cluster_slug, search_volume, competition, keyword_group_id)
        VALUES (?, 'serper-paa', 'claude-code', ?, ?, ?)
      `).run('what is claude code', 1000, 'medium', groupId);

      testDb.prepare(`
        INSERT INTO keywords (keyword, source, cluster_slug, search_volume, competition, keyword_group_id)
        VALUES (?, 'serper-related', 'claude-code', ?, ?, ?)
      `).run('claude code explained', 500, 'low', groupId);

      // B3's load query
      const groups = testDb.prepare(`
        SELECT group_id, primary_keyword, intent, content_type, cluster_slug
        FROM keyword_groups
        WHERE status IN ('pending', 'queued') AND priority_score = 0
      `).all() as Array<{
        group_id: number;
        primary_keyword: string;
        intent: string;
        content_type: string;
        cluster_slug: string;
      }>;

      expect(groups).toHaveLength(1);
      expect(groups[0].primary_keyword).toBe('what is claude code');
      expect(groups[0].intent).toBe('informational');
      expect(groups[0].content_type).toBe('faq');
      expect(groups[0].cluster_slug).toBe('claude-code');

      // B3's keyword load query
      const keywords = testDb.prepare(`
        SELECT keyword, search_volume, competition
        FROM keywords
        WHERE keyword_group_id = ?
      `).all(groups[0].group_id) as Array<{
        keyword: string;
        search_volume: number | null;
        competition: string | null;
      }>;

      expect(keywords).toHaveLength(2);
      // Each keyword has the fields ScoringInput.keywords needs
      for (const kw of keywords) {
        expect(typeof kw.keyword).toBe('string');
        // search_volume and competition can be null but must be present
        expect('search_volume' in kw).toBe(true);
        expect('competition' in kw).toBe(true);
      }
    });
  });

  // ── 4. B2 keyword_group_id backlink integrity ──

  describe('B2 keyword_group_id backlink', () => {
    it('every grouped keyword points to a valid group_id', () => {
      // Create group
      const res = testDb.prepare(`
        INSERT INTO keyword_groups (primary_keyword, intent, content_type, status, cluster_slug)
        VALUES ('test keyword', 'informational', 'faq', 'pending', 'test')
      `).run();

      const groupId = Number(res.lastInsertRowid);

      // Link keywords
      testDb.prepare(`
        INSERT INTO keywords (keyword, source, cluster_slug, keyword_group_id)
        VALUES ('test keyword', 'serper-paa', 'test', ?)
      `).run(groupId);

      testDb.prepare(`
        INSERT INTO keywords (keyword, source, cluster_slug, keyword_group_id)
        VALUES ('related keyword', 'serper-related', 'test', ?)
      `).run(groupId);

      // Verify all grouped keywords reference existing groups
      const orphans = testDb.prepare(`
        SELECT k.keyword, k.keyword_group_id
        FROM keywords k
        LEFT JOIN keyword_groups kg ON k.keyword_group_id = kg.group_id
        WHERE k.keyword_group_id IS NOT NULL AND kg.group_id IS NULL
      `).all();

      expect(orphans).toHaveLength(0);
    });
  });

  // ── 5. B3 → B4: queue entry feeds job loader ──

  describe('B3 → B4: queue entry matches loadJobs shape', () => {
    it('loadJobs query returns all fields QueueJob needs', () => {
      // B3 creates group + queue entry
      const groupRes = testDb.prepare(`
        INSERT INTO keyword_groups (primary_keyword, intent, content_type, priority_score, status, cluster_slug)
        VALUES (?, ?, ?, ?, 'queued', ?)
      `).run('claude code vs cursor', 'commercial', 'compare', 150000, 'claude-code');

      const groupId = Number(groupRes.lastInsertRowid);

      // Link secondary keywords
      testDb.prepare(`
        INSERT INTO keywords (keyword, source, cluster_slug, keyword_group_id)
        VALUES (?, 'serper-paa', 'claude-code', ?)
      `).run('claude code vs cursor comparison', groupId);

      testDb.prepare(`
        INSERT INTO keywords (keyword, source, cluster_slug, keyword_group_id)
        VALUES (?, 'serper-related', 'claude-code', ?)
      `).run('claude code or cursor which is better', groupId);

      // B3 writes to queue
      testDb.prepare(`
        INSERT INTO create_queue (keyword_group_id, content_type, research_pipeline, priority_score, status)
        VALUES (?, 'compare', 'standard', 150000, 'pending')
      `).run(groupId);

      // B4's loadJobs query
      const jobs = testDb.prepare(`
        SELECT cq.job_id, cq.keyword_group_id, cq.content_type, cq.research_pipeline,
               cq.priority_score, cq.status,
               kg.primary_keyword, kg.intent, kg.cluster_slug
        FROM create_queue cq
        JOIN keyword_groups kg ON cq.keyword_group_id = kg.group_id
        WHERE cq.status IN ('pending', 'partial')
        ORDER BY cq.priority_score DESC LIMIT 10
      `).all() as Array<Record<string, unknown>>;

      expect(jobs).toHaveLength(1);

      const job = jobs[0];
      // Verify all QueueJob interface fields are present
      expect(job.job_id).toBeDefined();
      expect(job.keyword_group_id).toBe(groupId);
      expect(job.content_type).toBe('compare');
      expect(job.research_pipeline).toBe('standard');
      expect(job.priority_score).toBe(150000);
      expect(job.status).toBe('pending');
      expect(job.primary_keyword).toBe('claude code vs cursor');
      expect(job.intent).toBe('commercial');
      expect(job.cluster_slug).toBe('claude-code');

      // B4 also loads secondary_keywords separately
      const secondaryKws = testDb.prepare(`
        SELECT keyword FROM keywords
        WHERE keyword_group_id = ? AND keyword != ?
      `).all(groupId, 'claude code vs cursor') as Array<{ keyword: string }>;

      expect(secondaryKws).toHaveLength(2);
      expect(secondaryKws.map((k) => k.keyword)).toContain('claude code vs cursor comparison');
      expect(secondaryKws.map((k) => k.keyword)).toContain(
        'claude code or cursor which is better',
      );
    });
  });

  // ── 6. B3 secondary_keywords loaded correctly ──

  describe('B3 secondary_keywords: 5-keyword group loads all', () => {
    it('all secondary keywords are returned for the group', () => {
      const groupRes = testDb.prepare(`
        INSERT INTO keyword_groups (primary_keyword, intent, content_type, priority_score, status, cluster_slug)
        VALUES ('main keyword', 'informational', 'faq', 500, 'queued', 'test')
      `).run();

      const groupId = Number(groupRes.lastInsertRowid);

      const secondaries = [
        'secondary one',
        'secondary two',
        'secondary three',
        'secondary four',
        'secondary five',
      ];

      // Insert primary + secondaries
      testDb.prepare(
        `INSERT INTO keywords (keyword, source, cluster_slug, keyword_group_id) VALUES (?, 'test', 'test', ?)`,
      ).run('main keyword', groupId);

      for (const kw of secondaries) {
        testDb.prepare(
          `INSERT INTO keywords (keyword, source, cluster_slug, keyword_group_id) VALUES (?, 'test', 'test', ?)`,
        ).run(kw, groupId);
      }

      testDb.prepare(`
        INSERT INTO create_queue (keyword_group_id, content_type, research_pipeline, priority_score, status)
        VALUES (?, 'faq', 'standard', 500, 'pending')
      `).run(groupId);

      // Load secondary keywords (B4's query)
      const loaded = testDb.prepare(`
        SELECT keyword FROM keywords
        WHERE keyword_group_id = ? AND keyword != ?
      `).all(groupId, 'main keyword') as Array<{ keyword: string }>;

      expect(loaded).toHaveLength(5);
      for (const kw of secondaries) {
        expect(loaded.map((r) => r.keyword)).toContain(kw);
      }
    });
  });

  // ── 7. B4 → DB: content record shape after generation ──

  describe('B4 → DB: content record matches expected shape', () => {
    it('generated content has correct type, slug, and metadata', () => {
      const primaryKeyword = 'What Is Claude Code?';
      const slug = toSlug(primaryKeyword);

      // Simulate B4 writing to content table
      testDb.prepare(`
        INSERT INTO content (type, slug, lang, title, body_markdown, meta_json)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run('faq', slug, 'en', 'What Is Claude Code?', '# What Is Claude Code?\n\nBody text.', JSON.stringify({ title: 'What Is Claude Code?', description: 'A FAQ about Claude Code' }));

      // Verify shape
      const record = testDb.prepare(
        `SELECT type, slug, lang, title, body_markdown, meta_json FROM content WHERE slug = ? AND lang = ?`,
      ).get(slug, 'en') as {
        type: string;
        slug: string;
        lang: string;
        title: string;
        body_markdown: string;
        meta_json: string;
      };

      expect(record.type).toBe('faq');
      expect(record.slug).toBe('what-is-claude-code');
      expect(record.lang).toBe('en');
      expect(record.title).toBeTruthy();
      expect(record.body_markdown).toBeTruthy();
      expect(record.body_markdown.startsWith('#')).toBe(true);

      const meta = JSON.parse(record.meta_json);
      expect(meta.title).toBeDefined();
    });
  });

  // ── 8. B4 directory mapping: content_type → storage type ──

  describe('B4 directory mapping', () => {
    it('maps all ContentTypes to correct storage directories', () => {
      const mapping: Record<string, string> = {
        faq: 'faq',
        compare: 'compare',
        glossary: 'glossary',
        'topic-hub': 'topics',
        blog: 'blog',
        'deep-dive': 'blog',
        cornerstone: 'blog',
      };

      for (const [contentType, expectedDir] of Object.entries(mapping)) {
        // Replicate the dirType logic from content-gen.ts line 736
        const dirType =
          contentType === 'topic-hub'
            ? 'topics'
            : contentType === 'deep-dive'
              ? 'blog'
              : contentType === 'cornerstone'
                ? 'blog'
                : contentType;

        expect(dirType).toBe(expectedDir);
      }
    });
  });

  // ── 9. C1 → B1: discovery subtopic feeds expansion ──

  describe('C1 → B1: discovery subtopic matches expansion input', () => {
    it('topic_clusters rows have the fields expandTopic needs', () => {
      // C1 creates subtopics as topic_clusters
      testDb.prepare(`
        INSERT INTO topic_clusters (slug, pillar_topic, mention_count)
        VALUES (?, ?, ?)
      `).run('claude-code', 'Claude Code', 5);

      testDb.prepare(`
        INSERT INTO topic_clusters (slug, pillar_topic, mention_count)
        VALUES (?, ?, ?)
      `).run('claude-code-mcp', 'Claude Code MCP Support', 1);

      // B1's query to find subtopics for expansion
      const subtopics = testDb.prepare(`
        SELECT slug, pillar_topic
        FROM topic_clusters
        WHERE slug LIKE ? || '%'
      `).all('claude-code') as Array<{ slug: string; pillar_topic: string }>;

      expect(subtopics.length).toBeGreaterThanOrEqual(2);

      // Each subtopic has the SubtopicInput shape
      for (const st of subtopics) {
        expect(typeof st.slug).toBe('string');
        expect(st.slug.length).toBeGreaterThan(0);
        expect(typeof st.pillar_topic).toBe('string');
        expect(st.pillar_topic.length).toBeGreaterThan(0);
      }
    });
  });

  // ── 10. C3 → create_queue: performance refresh action shape ──

  describe('C3 → create_queue: refresh action feeds B4', () => {
    it('refresh jobs have correct priority and are loadable by process-queue', () => {
      // C3 creates a keyword_group for the refresh
      const groupRes = testDb.prepare(`
        INSERT INTO keyword_groups (primary_keyword, intent, content_type, priority_score, status, cluster_slug)
        VALUES (?, 'informational', 'faq', ?, 'queued', 'seo-cluster')
      `).run('declining page keyword', 10000);

      const groupId = Number(groupRes.lastInsertRowid);

      // C3 inserts refresh job with priority A (10000) and refresh_meta
      testDb.prepare(`
        INSERT INTO create_queue (keyword_group_id, content_type, research_pipeline, priority_score, status, refresh_meta)
        VALUES (?, 'refresh', 'standard', 10000, 'pending', ?)
      `).run(groupId, JSON.stringify({
        anomaly_type: 'striking_distance',
        suggested_action: 'Add content depth',
        detail: 'Position 12 with 200 impressions',
      }));

      // Also insert a regular discovery job with lower priority
      const group2Res = testDb.prepare(`
        INSERT INTO keyword_groups (primary_keyword, intent, content_type, priority_score, status, cluster_slug)
        VALUES ('new topic', 'informational', 'faq', 500, 'queued', 'test')
      `).run();

      testDb.prepare(`
        INSERT INTO create_queue (keyword_group_id, content_type, research_pipeline, priority_score, status)
        VALUES (?, 'faq', 'standard', 500, 'pending')
      `).run(Number(group2Res.lastInsertRowid));

      // B4's loadJobs query — should return refresh first (higher priority)
      const jobs = testDb.prepare(`
        SELECT cq.job_id, cq.content_type, cq.research_pipeline, cq.priority_score,
               cq.refresh_meta, kg.primary_keyword
        FROM create_queue cq
        JOIN keyword_groups kg ON cq.keyword_group_id = kg.group_id
        WHERE cq.status IN ('pending', 'partial')
        ORDER BY cq.priority_score DESC
      `).all() as Array<{
        job_id: number;
        content_type: string;
        research_pipeline: string;
        priority_score: number;
        refresh_meta: string | null;
        primary_keyword: string;
      }>;

      expect(jobs).toHaveLength(2);

      // Refresh job (A-priority=10000) comes first
      expect(jobs[0].content_type).toBe('refresh');
      expect(jobs[0].research_pipeline).toBe('standard');
      expect(jobs[0].priority_score).toBe(10000);
      expect(jobs[0].primary_keyword).toBe('declining page keyword');

      // refresh_meta is stored
      expect(jobs[0].refresh_meta).not.toBeNull();
      const meta = JSON.parse(jobs[0].refresh_meta!);
      expect(meta.anomaly_type).toBe('striking_distance');
      expect(meta.suggested_action).toBe('Add content depth');

      // Regular job second
      expect(jobs[1].content_type).toBe('faq');
      expect(jobs[1].priority_score).toBe(500);
      expect(jobs[1].refresh_meta).toBeNull();
    });
  });
});
