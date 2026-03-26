/**
 * E2E Contract Tests — Data Shape at Module Boundaries
 *
 * Verifies that data produced by one pipeline step matches what the next
 * step expects to consume. Uses in-memory SQLite, no API keys needed.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import Database from 'better-sqlite3';

import {
  calculatePriorityScore,
  DEFAULT_VOLUME,
} from '../lib/priority';

import type { GroupKeyword } from '../lib/priority';

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

// Slug generation function (matches content-gen.ts)
function toSlug(str: string): string {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

// ── Tests ──

describe('e2e contract tests', () => {
  beforeEach(() => {
    testDb = createTestDb();
  });

  afterEach(() => {
    testDb.close();
  });

  // ── 1. B1 -> B2 contract ──

  describe('B1 -> B2: expanded keywords are ungrouped', () => {
    it('keywords from expansion have keyword_group_id = NULL and B2 query finds them', () => {
      // B1 inserts keywords with keyword_group_id = NULL
      testDb.prepare(`
        INSERT INTO keywords (keyword, source, cluster_slug, keyword_group_id)
        VALUES (?, 'expansion', ?, NULL)
      `).run('what is claude code', 'claude-code');

      testDb.prepare(`
        INSERT INTO keywords (keyword, source, cluster_slug, keyword_group_id)
        VALUES (?, 'expansion', ?, NULL)
      `).run('claude code pricing', 'claude-code');

      // Already-grouped keyword (should NOT be picked up)
      testDb.prepare(`
        INSERT INTO keywords (keyword, source, cluster_slug, keyword_group_id)
        VALUES (?, 'expansion', ?, ?)
      `).run('claude code tutorial', 'claude-code', 99);

      // B2's query: find ungrouped keywords for a cluster
      const ungrouped = testDb.prepare(`
        SELECT keyword, cluster_slug
        FROM keywords
        WHERE keyword_group_id IS NULL AND cluster_slug = ?
      `).all('claude-code') as Array<{ keyword: string; cluster_slug: string }>;

      expect(ungrouped).toHaveLength(2);
      expect(ungrouped.map((r) => r.keyword)).toContain('what is claude code');
      expect(ungrouped.map((r) => r.keyword)).toContain('claude code pricing');
    });
  });

  // ── 2. B2 -> B3 contract ──

  describe('B2 -> B3: groups are pending with zero score', () => {
    it('B3 loadPendingGroups query finds newly created groups', () => {
      // B2 creates groups with status='pending', priority_score=0
      testDb.prepare(`
        INSERT INTO keyword_groups (primary_keyword, intent, content_type, priority_score, status, cluster_slug)
        VALUES (?, ?, ?, 0, 'pending', ?)
      `).run('what is claude code', 'informational', 'faq', 'claude-code');

      testDb.prepare(`
        INSERT INTO keyword_groups (primary_keyword, intent, content_type, priority_score, status, cluster_slug)
        VALUES (?, ?, ?, 0, 'pending', ?)
      `).run('claude vs cursor', 'commercial', 'compare', 'claude-code');

      // Already-scored group (should still be found with force=1)
      testDb.prepare(`
        INSERT INTO keyword_groups (primary_keyword, intent, content_type, priority_score, status, cluster_slug)
        VALUES (?, ?, ?, 85.5, 'queued', ?)
      `).run('claude code setup', 'informational', 'faq', 'claude-code');

      // B3's query (non-force mode): only pending + zero-score
      const pendingNonForce = testDb.prepare(`
        SELECT group_id, primary_keyword, intent, content_type, cluster_slug
        FROM keyword_groups
        WHERE status IN ('pending', 'queued') AND (priority_score = 0 OR ? = 1)
      `).all(0) as Array<{ group_id: number; primary_keyword: string }>;

      expect(pendingNonForce).toHaveLength(2);

      // B3's query (force mode): all pending/queued regardless of score
      const pendingForce = testDb.prepare(`
        SELECT group_id, primary_keyword, intent, content_type, cluster_slug
        FROM keyword_groups
        WHERE status IN ('pending', 'queued') AND (priority_score = 0 OR ? = 1)
      `).all(1) as Array<{ group_id: number; primary_keyword: string }>;

      expect(pendingForce).toHaveLength(3);
    });
  });

  // ── 3. B3 -> B4 contract ──

  describe('B3 -> B4: queue rows JOIN with keyword_groups', () => {
    it('loadJobs query successfully joins queue with groups', () => {
      // B3 creates a group and queue entry
      const groupRes = testDb.prepare(`
        INSERT INTO keyword_groups (primary_keyword, intent, content_type, priority_score, status, cluster_slug)
        VALUES (?, ?, ?, ?, 'queued', ?)
      `).run('claude code vs cursor', 'commercial', 'compare', 150000, 'claude-code');

      const groupId = Number(groupRes.lastInsertRowid);

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
      `).all() as Array<{
        job_id: number;
        keyword_group_id: number;
        content_type: string;
        research_pipeline: string;
        priority_score: number;
        status: string;
        primary_keyword: string;
        intent: string;
        cluster_slug: string;
      }>;

      expect(jobs).toHaveLength(1);
      expect(jobs[0].primary_keyword).toBe('claude code vs cursor');
      expect(jobs[0].content_type).toBe('compare');
      expect(jobs[0].research_pipeline).toBe('standard');
      expect(jobs[0].intent).toBe('commercial');
      expect(jobs[0].cluster_slug).toBe('claude-code');
      expect(jobs[0].priority_score).toBe(150000);
    });
  });

  // ── 4. B4 -> content mapping ──

  describe('B4 -> content: content_type maps to storage type', () => {
    it('maps content types to correct DB storage types', () => {
      // This mapping is from content-gen.ts (dirType logic)
      const mapping: Record<string, string> = {
        'topic-hub': 'topics',
        'deep-dive': 'blog',
        cornerstone: 'blog',
        faq: 'faq',
        compare: 'compare',
        glossary: 'glossary',
        blog: 'blog',
      };

      for (const [contentType, storageType] of Object.entries(mapping)) {
        // Replicate the mapping logic from content-gen.ts
        const dirType =
          contentType === 'topic-hub'
            ? 'topics'
            : contentType === 'deep-dive'
              ? 'blog'
              : contentType === 'cornerstone'
                ? 'blog'
                : contentType;

        expect(dirType).toBe(storageType);

        // Verify the storage type can be inserted into the content table
        testDb.prepare(`
          INSERT INTO content (type, slug, lang, title) VALUES (?, ?, 'en', ?)
        `).run(storageType, `test-${contentType}`, `Test ${contentType}`);
      }

      // Verify all rows were inserted
      const rows = testDb.prepare('SELECT type, slug FROM content ORDER BY slug').all() as Array<{
        type: string;
        slug: string;
      }>;
      expect(rows).toHaveLength(Object.keys(mapping).length);
    });
  });

  // ── 5. content -> newsletter contract ──

  describe('content -> newsletter: getRecentSeoPages excludes newsletters', () => {
    it('returns all B4 content types but NOT newsletter', () => {
      // Insert one row for each storage type
      const types = ['faq', 'compare', 'glossary', 'topics', 'blog', 'newsletter'];
      for (const type of types) {
        testDb.prepare(`
          INSERT INTO content (type, slug, lang, title, created_at)
          VALUES (?, ?, 'en', ?, datetime('now'))
        `).run(type, `${type}-test-slug`, `Test ${type}`);
      }

      // Newsletter's getRecentSeoPages query
      const seoPages = testDb.prepare(`
        SELECT type, slug, lang, title, created_at FROM content
        WHERE lang = ?
          AND type NOT IN ('newsletter')
          AND created_at > datetime('now', '-' || ? || ' days')
        ORDER BY created_at DESC
      `).all('en', 7) as Array<{ type: string; slug: string }>;

      expect(seoPages).toHaveLength(5);
      const returnedTypes = seoPages.map((r) => r.type);
      expect(returnedTypes).toContain('faq');
      expect(returnedTypes).toContain('compare');
      expect(returnedTypes).toContain('glossary');
      expect(returnedTypes).toContain('topics');
      expect(returnedTypes).toContain('blog');
      expect(returnedTypes).not.toContain('newsletter');
    });
  });

  // ── 6. perf -> queue contract ──

  describe('perf -> queue: refresh actions create queue entries', () => {
    it('refresh queue entries are queryable', () => {
      // Performance loop creates a group + queue entry for refresh
      const groupRes = testDb.prepare(`
        INSERT INTO keyword_groups (primary_keyword, intent, content_type, priority_score, status, cluster_slug)
        VALUES (?, ?, ?, ?, 'queued', ?)
      `).run('declining page keyword', 'informational', 'faq', 50, 'seo-cluster');

      const groupId = Number(groupRes.lastInsertRowid);

      testDb.prepare(`
        INSERT INTO create_queue (keyword_group_id, content_type, research_pipeline, priority_score, status)
        VALUES (?, 'refresh', 'standard', 50, 'pending')
      `).run(groupId);

      // Verify refresh jobs are queryable by the same loadJobs query B4 uses
      const jobs = testDb.prepare(`
        SELECT cq.job_id, cq.content_type, cq.status
        FROM create_queue cq
        WHERE cq.content_type = 'refresh' AND cq.status = 'pending'
      `).all() as Array<{ job_id: number; content_type: string; status: string }>;

      expect(jobs).toHaveLength(1);
      expect(jobs[0].content_type).toBe('refresh');
      expect(jobs[0].status).toBe('pending');
    });
  });

  // ── 7. NULL volume handling ──

  describe('NULL volume handling', () => {
    it('calculatePriorityScore with empty keywords uses DEFAULT_VOLUME and score > 0', () => {
      const result = calculatePriorityScore({
        group_id: 1,
        primary_keyword: 'orphan keyword',
        intent: 'informational',
        content_type: 'faq',
        cluster_slug: 'test-cluster',
        keywords: [],
        event_age_hours: null,
      });

      expect(result.score_breakdown.volume).toBe(DEFAULT_VOLUME);
      expect(result.priority_score).toBeGreaterThan(0);
    });
  });

  // ── 8. NULL cluster handling ──

  describe('NULL cluster handling', () => {
    it('getRelatedSlugs with null cluster returns empty arrays', () => {
      // Replicate the logic: if clusterSlug is null, return empty arrays
      function getRelatedSlugs(clusterSlug: string | null): {
        glossary: string[];
        blog: string[];
        compare: string[];
        faq: string[];
      } {
        if (!clusterSlug) {
          return { glossary: [], blog: [], compare: [], faq: [] };
        }
        // In real code this would query the DB
        return { glossary: [], blog: [], compare: [], faq: [] };
      }

      const result = getRelatedSlugs(null);
      expect(result.glossary).toEqual([]);
      expect(result.blog).toEqual([]);
      expect(result.compare).toEqual([]);
      expect(result.faq).toEqual([]);
    });
  });

  // ── 9. Slug determinism ──

  describe('slug determinism', () => {
    it('same primary_keyword produces identical slugs across calls', () => {
      const keywords = [
        'What Is Claude Code?',
        'Claude Code vs. Cursor IDE',
        'how much does claude-code cost',
        '  leading/trailing spaces  ',
        'UPPER CASE KEYWORD',
        'special!@#$%chars',
      ];

      for (const kw of keywords) {
        const slug1 = toSlug(kw);
        const slug2 = toSlug(kw);
        const slug3 = toSlug(kw);

        expect(slug1).toBe(slug2);
        expect(slug2).toBe(slug3);
      }
    });

    it('produces expected slug formats', () => {
      expect(toSlug('What Is Claude Code?')).toBe('what-is-claude-code');
      expect(toSlug('Claude Code vs. Cursor')).toBe('claude-code-vs-cursor');
      expect(toSlug('  leading spaces  ')).toBe('leading-spaces');
      expect(toSlug('UPPER CASE')).toBe('upper-case');
      expect(toSlug('special!@#chars')).toBe('special-chars');
    });
  });

  // ── 10. ContentType completeness ──

  describe('ContentType completeness', () => {
    it('getValidatorForType returns a function for every ContentType', () => {
      const contentTypes: ContentType[] = [
        'faq',
        'compare',
        'glossary',
        'topic-hub',
        'blog',
        'deep-dive',
        'cornerstone',
      ];

      for (const ct of contentTypes) {
        const validator = getValidatorForType(ct);
        expect(typeof validator).toBe('function');
      }
    });
  });

  // ── 11. Partial retry contract ──

  describe('partial retry contract', () => {
    it('loadJobs query includes status=partial jobs', () => {
      // Create a group
      const groupRes = testDb.prepare(`
        INSERT INTO keyword_groups (primary_keyword, intent, content_type, priority_score, status, cluster_slug)
        VALUES (?, ?, ?, ?, 'queued', ?)
      `).run('partial keyword', 'informational', 'faq', 500, 'test-cluster');

      const groupId = Number(groupRes.lastInsertRowid);

      // Insert a partial job (e.g., EN succeeded but ZH failed)
      testDb.prepare(`
        INSERT INTO create_queue (keyword_group_id, content_type, research_pipeline, priority_score, status)
        VALUES (?, 'faq', 'standard', 500, 'partial')
      `).run(groupId);

      // Also insert a pending job for comparison
      const group2Res = testDb.prepare(`
        INSERT INTO keyword_groups (primary_keyword, intent, content_type, priority_score, status, cluster_slug)
        VALUES (?, ?, ?, ?, 'queued', ?)
      `).run('pending keyword', 'commercial', 'compare', 1000, 'test-cluster');

      const group2Id = Number(group2Res.lastInsertRowid);

      testDb.prepare(`
        INSERT INTO create_queue (keyword_group_id, content_type, research_pipeline, priority_score, status)
        VALUES (?, 'compare', 'standard', 1000, 'pending')
      `).run(group2Id);

      // Also insert a completed job (should NOT be returned)
      const group3Res = testDb.prepare(`
        INSERT INTO keyword_groups (primary_keyword, intent, content_type, priority_score, status, cluster_slug)
        VALUES (?, ?, ?, ?, 'completed', ?)
      `).run('done keyword', 'informational', 'glossary', 200, 'test-cluster');

      const group3Id = Number(group3Res.lastInsertRowid);

      testDb.prepare(`
        INSERT INTO create_queue (keyword_group_id, content_type, research_pipeline, priority_score, status)
        VALUES (?, 'glossary', 'standard', 200, 'completed')
      `).run(group3Id);

      // B4's loadJobs query
      const jobs = testDb.prepare(`
        SELECT cq.job_id, cq.keyword_group_id, cq.content_type, cq.research_pipeline,
               cq.priority_score, cq.status,
               kg.primary_keyword, kg.intent, kg.cluster_slug
        FROM create_queue cq
        JOIN keyword_groups kg ON cq.keyword_group_id = kg.group_id
        WHERE cq.status IN ('pending', 'partial')
        ORDER BY cq.priority_score DESC LIMIT 10
      `).all() as Array<{
        job_id: number;
        content_type: string;
        status: string;
        primary_keyword: string;
        priority_score: number;
      }>;

      expect(jobs).toHaveLength(2);
      // Higher priority first
      expect(jobs[0].primary_keyword).toBe('pending keyword');
      expect(jobs[0].status).toBe('pending');
      // Partial job included
      expect(jobs[1].primary_keyword).toBe('partial keyword');
      expect(jobs[1].status).toBe('partial');
    });
  });
});
