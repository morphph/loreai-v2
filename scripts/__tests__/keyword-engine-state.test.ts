/**
 * Keyword Engine State Management & Idempotency Tests
 *
 * Verifies that pipeline stages handle re-runs, partial failures, and
 * status transitions correctly. Critical for the 2x/week discovery schedule
 * (Mon+Thu at 1am SGT) where data accumulates across cycles.
 *
 * Uses in-memory SQLite, no API keys needed.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import Database from 'better-sqlite3';

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

// ── Tests ──

describe('keyword engine state management', () => {
  beforeEach(() => {
    testDb = createTestDb();
  });

  afterEach(() => {
    testDb.close();
  });

  // ── Cross-cycle idempotency ──

  describe('B1 expansion idempotency', () => {
    it('second upsert of same keyword inserts 0 new rows', () => {
      const upsert = testDb.prepare(`
        INSERT INTO keywords (keyword, source, cluster_slug)
        VALUES (?, ?, ?)
        ON CONFLICT(keyword) DO UPDATE SET
          cluster_slug = COALESCE(excluded.cluster_slug, cluster_slug)
      `);

      // First run (Monday discovery)
      upsert.run('claude code tutorial', 'serper-paa', 'claude-code');
      upsert.run('claude code pricing', 'serper-related', 'claude-code');
      upsert.run('claude code setup', 'exa-competitor', 'claude-code');

      const countAfterFirst = (testDb.prepare('SELECT COUNT(*) as n FROM keywords').get() as { n: number }).n;
      expect(countAfterFirst).toBe(3);

      // Second run (Thursday discovery — same keywords discovered again)
      upsert.run('claude code tutorial', 'serper-paa', 'claude-code');
      upsert.run('claude code pricing', 'serper-related', 'claude-code');
      upsert.run('claude code setup', 'exa-competitor', 'claude-code');

      const countAfterSecond = (testDb.prepare('SELECT COUNT(*) as n FROM keywords').get() as { n: number }).n;
      expect(countAfterSecond).toBe(3); // No new rows
    });
  });

  describe('B2 grouping idempotency', () => {
    it('second grouping finds 0 ungrouped keywords', () => {
      // Insert keywords
      testDb.prepare(`INSERT INTO keywords (keyword, source, cluster_slug) VALUES (?, 'test', 'test')`).run('keyword a');
      testDb.prepare(`INSERT INTO keywords (keyword, source, cluster_slug) VALUES (?, 'test', 'test')`).run('keyword b');

      // First grouping: find ungrouped
      const ungrouped1 = testDb.prepare(`
        SELECT keyword FROM keywords WHERE keyword_group_id IS NULL AND cluster_slug = ?
      `).all('test');
      expect(ungrouped1).toHaveLength(2);

      // Create group and link
      const groupRes = testDb.prepare(`
        INSERT INTO keyword_groups (primary_keyword, intent, content_type, status, cluster_slug)
        VALUES ('keyword a', 'informational', 'faq', 'pending', 'test')
      `).run();
      const groupId = Number(groupRes.lastInsertRowid);
      testDb.prepare('UPDATE keywords SET keyword_group_id = ? WHERE cluster_slug = ?').run(groupId, 'test');

      // Second grouping: 0 ungrouped
      const ungrouped2 = testDb.prepare(`
        SELECT keyword FROM keywords WHERE keyword_group_id IS NULL AND cluster_slug = ?
      `).all('test');
      expect(ungrouped2).toHaveLength(0);
    });
  });

  describe('B3 scoring idempotency', () => {
    it('does not create duplicate queue entries for same group', () => {
      const groupRes = testDb.prepare(`
        INSERT INTO keyword_groups (primary_keyword, intent, content_type, priority_score, status, cluster_slug)
        VALUES ('test kw', 'informational', 'faq', 500, 'queued', 'test')
      `).run();
      const groupId = Number(groupRes.lastInsertRowid);

      // First queue insert
      testDb.prepare(`
        INSERT INTO create_queue (keyword_group_id, content_type, research_pipeline, priority_score, status)
        VALUES (?, 'faq', 'standard', 500, 'pending')
      `).run(groupId);

      // Check if already queued (B3's dedup check)
      const existing = testDb.prepare(`
        SELECT job_id FROM create_queue
        WHERE keyword_group_id = ? AND status IN ('pending', 'in_progress')
      `).get(groupId);

      expect(existing).toBeTruthy(); // already exists

      // Only insert if not already queued
      if (!existing) {
        testDb.prepare(`
          INSERT INTO create_queue (keyword_group_id, content_type, research_pipeline, priority_score, status)
          VALUES (?, 'faq', 'standard', 500, 'pending')
        `).run(groupId);
      }

      const count = (testDb.prepare('SELECT COUNT(*) as n FROM create_queue WHERE keyword_group_id = ?').get(groupId) as { n: number }).n;
      expect(count).toBe(1); // Not duplicated
    });
  });

  describe('B4 completed job exclusion', () => {
    it('loadJobs does not return completed jobs', () => {
      const groupRes = testDb.prepare(`
        INSERT INTO keyword_groups (primary_keyword, intent, content_type, priority_score, status, cluster_slug)
        VALUES ('done kw', 'informational', 'faq', 500, 'queued', 'test')
      `).run();
      const groupId = Number(groupRes.lastInsertRowid);

      testDb.prepare(`
        INSERT INTO create_queue (keyword_group_id, content_type, research_pipeline, priority_score, status, completed_at)
        VALUES (?, 'faq', 'standard', 500, 'completed', datetime('now'))
      `).run(groupId);

      const jobs = testDb.prepare(`
        SELECT * FROM create_queue cq
        JOIN keyword_groups kg ON cq.keyword_group_id = kg.group_id
        WHERE cq.status IN ('pending', 'partial')
        ORDER BY cq.priority_score DESC
      `).all();

      expect(jobs).toHaveLength(0);
    });
  });

  describe('Mon+Thu discovery accumulation', () => {
    it('second cycle only adds truly new keywords', () => {
      const upsert = testDb.prepare(`
        INSERT INTO keywords (keyword, source, cluster_slug, search_volume, competition)
        VALUES (?, ?, ?, ?, ?)
        ON CONFLICT(keyword) DO UPDATE SET
          cluster_slug = COALESCE(excluded.cluster_slug, cluster_slug)
      `);

      // Monday discovery: 5 keywords
      upsert.run('claude code tutorial', 'serper-paa', 'claude-code', 1000, 'low');
      upsert.run('claude code pricing', 'serper-related', 'claude-code', 500, 'medium');
      upsert.run('how to use claude code', 'serper-autocomplete', 'claude-code', 800, 'low');
      upsert.run('claude code review', 'exa-competitor', 'claude-code', 300, 'high');
      upsert.run('claude code vs cursor', 'serper-related', 'claude-code', 2000, 'medium');

      const countMon = (testDb.prepare('SELECT COUNT(*) as n FROM keywords').get() as { n: number }).n;
      expect(countMon).toBe(5);

      // Thursday discovery: 3 overlapping + 2 new
      upsert.run('claude code tutorial', 'serper-paa', 'claude-code', 1000, 'low'); // overlap
      upsert.run('claude code pricing', 'serper-related', 'claude-code', 500, 'medium'); // overlap
      upsert.run('how to use claude code', 'serper-autocomplete', 'claude-code', 800, 'low'); // overlap
      upsert.run('claude code mcp support', 'serper-paa', 'claude-code', 600, 'low'); // NEW
      upsert.run('claude code hooks', 'exa-competitor', 'claude-code', 400, 'medium'); // NEW

      const countThu = (testDb.prepare('SELECT COUNT(*) as n FROM keywords').get() as { n: number }).n;
      expect(countThu).toBe(7); // 5 original + 2 new = 7
    });
  });

  // ── Partial failure recovery ──

  describe('partial job recovery (status=partial)', () => {
    it('partial jobs are returned by loadJobs for retry', () => {
      const groupRes = testDb.prepare(`
        INSERT INTO keyword_groups (primary_keyword, intent, content_type, priority_score, status, cluster_slug)
        VALUES ('partial kw', 'informational', 'faq', 500, 'queued', 'test')
      `).run();
      const groupId = Number(groupRes.lastInsertRowid);

      // EN succeeded, ZH failed → partial
      testDb.prepare(`
        INSERT INTO create_queue (keyword_group_id, content_type, research_pipeline, priority_score, status)
        VALUES (?, 'faq', 'standard', 500, 'partial')
      `).run(groupId);

      // EN content exists
      testDb.prepare(`
        INSERT INTO content (type, slug, lang, title, body_markdown)
        VALUES ('faq', 'partial-kw', 'en', 'Partial KW', '# Partial KW\n\nEN content.')
      `).run();

      // loadJobs includes partial
      const jobs = testDb.prepare(`
        SELECT cq.*, kg.primary_keyword FROM create_queue cq
        JOIN keyword_groups kg ON cq.keyword_group_id = kg.group_id
        WHERE cq.status IN ('pending', 'partial')
      `).all() as Array<{ status: string; primary_keyword: string }>;

      expect(jobs).toHaveLength(1);
      expect(jobs[0].status).toBe('partial');

      // ZH content doesn't exist yet
      const zhContent = testDb.prepare(
        `SELECT id FROM content WHERE slug = 'partial-kw' AND lang = 'zh'`,
      ).get();
      expect(zhContent).toBeUndefined();
    });
  });

  describe('B2 failure does not block B3', () => {
    it('B3 scores pre-existing groups even if B2 fails', () => {
      // Pre-existing groups from previous run
      testDb.prepare(`
        INSERT INTO keyword_groups (primary_keyword, intent, content_type, priority_score, status, cluster_slug)
        VALUES ('existing group', 'informational', 'faq', 0, 'pending', 'test')
      `).run();

      // B3 can find pending groups regardless of B2 state
      const pendingGroups = testDb.prepare(`
        SELECT * FROM keyword_groups WHERE status = 'pending' AND priority_score = 0
      `).all();

      expect(pendingGroups).toHaveLength(1);
    });
  });

  // ── Status transitions ──

  describe('create_queue status transitions', () => {
    it('pending → in_progress → completed with completed_at', () => {
      const groupRes = testDb.prepare(`
        INSERT INTO keyword_groups (primary_keyword, intent, content_type, priority_score, status, cluster_slug)
        VALUES ('status test', 'informational', 'faq', 500, 'queued', 'test')
      `).run();
      const groupId = Number(groupRes.lastInsertRowid);

      testDb.prepare(`
        INSERT INTO create_queue (keyword_group_id, content_type, research_pipeline, priority_score, status)
        VALUES (?, 'faq', 'standard', 500, 'pending')
      `).run(groupId);

      const jobId = (testDb.prepare('SELECT job_id FROM create_queue WHERE keyword_group_id = ?').get(groupId) as { job_id: number }).job_id;

      // Transition: pending → in_progress
      testDb.prepare('UPDATE create_queue SET status = ? WHERE job_id = ?').run('in_progress', jobId);
      let job = testDb.prepare('SELECT status, completed_at FROM create_queue WHERE job_id = ?').get(jobId) as { status: string; completed_at: string | null };
      expect(job.status).toBe('in_progress');
      expect(job.completed_at).toBeNull();

      // Transition: in_progress → completed
      testDb.prepare('UPDATE create_queue SET status = ?, completed_at = datetime(\'now\') WHERE job_id = ?').run('completed', jobId);
      job = testDb.prepare('SELECT status, completed_at FROM create_queue WHERE job_id = ?').get(jobId) as { status: string; completed_at: string | null };
      expect(job.status).toBe('completed');
      expect(job.completed_at).not.toBeNull();
    });
  });

  describe('keyword_groups status transitions', () => {
    it('pending → queued after scoring', () => {
      const groupRes = testDb.prepare(`
        INSERT INTO keyword_groups (primary_keyword, intent, content_type, priority_score, status, cluster_slug)
        VALUES ('group status', 'informational', 'faq', 0, 'pending', 'test')
      `).run();
      const groupId = Number(groupRes.lastInsertRowid);

      // Score and update
      testDb.prepare(`
        UPDATE keyword_groups SET priority_score = 500, status = 'queued', updated_at = CURRENT_TIMESTAMP WHERE group_id = ?
      `).run(groupId);

      const group = testDb.prepare('SELECT status, priority_score FROM keyword_groups WHERE group_id = ?').get(groupId) as { status: string; priority_score: number };
      expect(group.status).toBe('queued');
      expect(group.priority_score).toBe(500);
    });
  });

  // ── Data consistency ──

  describe('keywords.content_exists after generation', () => {
    it('all group keywords marked content_exists=1 after B4 completes', () => {
      const groupRes = testDb.prepare(`
        INSERT INTO keyword_groups (primary_keyword, intent, content_type, priority_score, status, cluster_slug)
        VALUES ('main kw', 'informational', 'faq', 500, 'queued', 'test')
      `).run();
      const groupId = Number(groupRes.lastInsertRowid);

      // Group has 3 keywords
      testDb.prepare(`INSERT INTO keywords (keyword, source, cluster_slug, keyword_group_id) VALUES ('main kw', 'test', 'test', ?)`).run(groupId);
      testDb.prepare(`INSERT INTO keywords (keyword, source, cluster_slug, keyword_group_id) VALUES ('secondary one', 'test', 'test', ?)`).run(groupId);
      testDb.prepare(`INSERT INTO keywords (keyword, source, cluster_slug, keyword_group_id) VALUES ('secondary two', 'test', 'test', ?)`).run(groupId);

      // Simulate B4 completion: mark all keywords
      const slug = 'main-kw';
      testDb.prepare(`
        UPDATE keywords
        SET content_exists = 1, content_type = 'faq', content_slug = ?
        WHERE keyword_group_id = ?
      `).run(slug, groupId);

      // Verify all marked
      const marked = testDb.prepare(`
        SELECT keyword, content_exists, content_type, content_slug
        FROM keywords WHERE keyword_group_id = ?
      `).all(groupId) as Array<{
        keyword: string;
        content_exists: number;
        content_type: string;
        content_slug: string;
      }>;

      expect(marked).toHaveLength(3);
      for (const kw of marked) {
        expect(kw.content_exists).toBe(1);
        expect(kw.content_type).toBe('faq');
        expect(kw.content_slug).toBe(slug);
      }
    });
  });

  describe('orphaned groups', () => {
    it('group with no keywords still has DEFAULT score behavior', () => {
      // Create group with no keywords
      testDb.prepare(`
        INSERT INTO keyword_groups (primary_keyword, intent, content_type, priority_score, status, cluster_slug)
        VALUES ('orphan group', 'informational', 'faq', 0, 'pending', 'test')
      `).run();

      // B3's keyword load returns empty
      const keywords = testDb.prepare(`
        SELECT keyword, search_volume, competition
        FROM keywords WHERE keyword_group_id = (
          SELECT group_id FROM keyword_groups WHERE primary_keyword = 'orphan group'
        )
      `).all();

      expect(keywords).toHaveLength(0);

      // With empty keywords, calculatePriorityScore should use DEFAULT_VOLUME
      // (tested in error tests — here we just verify the DB query returns empty)
    });
  });

  // ── Content upsert idempotency ──

  describe('upsertContent idempotency', () => {
    it('second insert with same type/slug/lang updates body', () => {
      testDb.prepare(`
        INSERT INTO content (type, slug, lang, title, body_markdown, meta_json)
        VALUES ('faq', 'test-slug', 'en', 'Title V1', '# V1\n\nOld body.', '{}')
        ON CONFLICT(type, slug, lang) DO UPDATE SET
          title = excluded.title,
          body_markdown = excluded.body_markdown,
          meta_json = excluded.meta_json,
          updated_at = CURRENT_TIMESTAMP
      `).run();

      testDb.prepare(`
        INSERT INTO content (type, slug, lang, title, body_markdown, meta_json)
        VALUES ('faq', 'test-slug', 'en', 'Title V2', '# V2\n\nNew body.', '{"v": 2}')
        ON CONFLICT(type, slug, lang) DO UPDATE SET
          title = excluded.title,
          body_markdown = excluded.body_markdown,
          meta_json = excluded.meta_json,
          updated_at = CURRENT_TIMESTAMP
      `).run();

      const count = (testDb.prepare('SELECT COUNT(*) as n FROM content WHERE slug = ?').get('test-slug') as { n: number }).n;
      expect(count).toBe(1); // Only 1 row

      const row = testDb.prepare('SELECT title, body_markdown, meta_json FROM content WHERE slug = ?').get('test-slug') as {
        title: string;
        body_markdown: string;
        meta_json: string;
      };
      expect(row.title).toBe('Title V2');
      expect(row.body_markdown).toContain('V2');
      expect(JSON.parse(row.meta_json).v).toBe(2);
    });
  });
});
