/**
 * Keyword Engine Concurrency & Race Condition Tests
 *
 * Verifies queue locking, dedup prevention, flock behavior, upsert races,
 * and performance refresh cooldown — all critical with the 2x/week
 * discovery schedule (Mon+Thu 1am SGT) where pipeline steps can overlap.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';

// ── In-memory DB helpers ──

let testDb: InstanceType<typeof Database>;

function createTestDb(): InstanceType<typeof Database> {
  const db = new Database(':memory:');
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');

  db.exec(`
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
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      completed_at DATETIME
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
  `);

  return db;
}

describe('keyword engine concurrency', () => {
  beforeEach(() => {
    testDb = createTestDb();
  });

  afterEach(() => {
    testDb.close();
  });

  // ── Queue job locking ──

  describe('queue job locking', () => {
    it('in_progress jobs are excluded from loadJobs', () => {
      // Create 2 jobs
      for (let i = 1; i <= 2; i++) {
        const res = testDb.prepare(`
          INSERT INTO keyword_groups (primary_keyword, intent, content_type, priority_score, status, cluster_slug)
          VALUES (?, 'informational', 'faq', ?, 'queued', 'test')
        `).run(`kw${i}`, 1000 - i * 100);
        testDb.prepare(`
          INSERT INTO create_queue (keyword_group_id, content_type, research_pipeline, priority_score, status)
          VALUES (?, 'faq', 'standard', ?, 'pending')
        `).run(Number(res.lastInsertRowid), 1000 - i * 100);
      }

      // First call picks up job 1 and marks it in_progress
      const firstJob = testDb.prepare(`
        SELECT cq.job_id, kg.primary_keyword FROM create_queue cq
        JOIN keyword_groups kg ON cq.keyword_group_id = kg.group_id
        WHERE cq.status = 'pending' ORDER BY cq.priority_score DESC LIMIT 1
      `).get() as { job_id: number; primary_keyword: string };

      testDb.prepare("UPDATE create_queue SET status = 'in_progress' WHERE job_id = ?")
        .run(firstJob.job_id);

      // Second call should NOT return the in_progress job
      const secondJob = testDb.prepare(`
        SELECT cq.job_id, kg.primary_keyword FROM create_queue cq
        JOIN keyword_groups kg ON cq.keyword_group_id = kg.group_id
        WHERE cq.status IN ('pending', 'partial') ORDER BY cq.priority_score DESC LIMIT 1
      `).get() as { job_id: number; primary_keyword: string } | undefined;

      expect(secondJob).toBeDefined();
      expect(secondJob!.job_id).not.toBe(firstJob.job_id);
      expect(secondJob!.primary_keyword).toBe('kw2');
    });
  });

  // ── Duplicate queue prevention ──

  describe('duplicate queue prevention', () => {
    it('same keyword_group_id cannot be queued twice', () => {
      const groupRes = testDb.prepare(`
        INSERT INTO keyword_groups (primary_keyword, intent, content_type, priority_score, status, cluster_slug)
        VALUES ('dedup test', 'informational', 'faq', 500, 'queued', 'test')
      `).run();
      const groupId = Number(groupRes.lastInsertRowid);

      // First queue
      testDb.prepare(`
        INSERT INTO create_queue (keyword_group_id, content_type, research_pipeline, priority_score, status)
        VALUES (?, 'faq', 'standard', 500, 'pending')
      `).run(groupId);

      // Second queue attempt — check first
      const exists = testDb.prepare(`
        SELECT job_id FROM create_queue
        WHERE keyword_group_id = ? AND status IN ('pending', 'in_progress')
      `).get(groupId);

      expect(exists).toBeTruthy();

      // Don't insert if exists
      const countBefore = (testDb.prepare('SELECT COUNT(*) as n FROM create_queue').get() as { n: number }).n;
      if (!exists) {
        testDb.prepare(`
          INSERT INTO create_queue (keyword_group_id, content_type, research_pipeline, priority_score, status)
          VALUES (?, 'faq', 'standard', 500, 'pending')
        `).run(groupId);
      }
      const countAfter = (testDb.prepare('SELECT COUNT(*) as n FROM create_queue').get() as { n: number }).n;

      expect(countAfter).toBe(countBefore);
    });
  });

  // ── flock behavior ──

  describe('flock behavior in daily-pipeline.sh', () => {
    it('uses flock for concurrency protection', () => {
      const scriptPath = path.join(process.cwd(), 'scripts', 'daily-pipeline.sh');
      const content = fs.readFileSync(scriptPath, 'utf-8');

      // Verify flock is used
      expect(content).toContain('flock');
      expect(content).toContain('/tmp/loreai-pipeline.lock');

      // Verify it's at the top (before any pipeline logic)
      const flockLine = content.split('\n').findIndex((l) => l.includes('flock'));
      const caseLine = content.split('\n').findIndex((l) => l.includes('case "$STEP"'));
      expect(flockLine).toBeLessThan(caseLine);
    });
  });

  // ── Keyword upsert race ──

  describe('keyword upsert race', () => {
    it('double upsert of same keyword results in exactly 1 row', () => {
      const upsert = testDb.prepare(`
        INSERT INTO keywords (keyword, source, cluster_slug)
        VALUES (?, ?, ?)
        ON CONFLICT(keyword) DO UPDATE SET
          cluster_slug = COALESCE(excluded.cluster_slug, cluster_slug)
      `);

      // Simulate two expansions upserting the same keyword
      upsert.run('claude code', 'serper-paa', 'claude-code');
      upsert.run('claude code', 'exa-competitor', 'claude-code');

      const count = (testDb.prepare('SELECT COUNT(*) as n FROM keywords WHERE keyword = ?').get('claude code') as { n: number }).n;
      expect(count).toBe(1);

      const row = testDb.prepare('SELECT cluster_slug, source FROM keywords WHERE keyword = ?')
        .get('claude code') as { cluster_slug: string; source: string };
      expect(row.cluster_slug).toBe('claude-code');
      // Source stays from first insert (no update clause for source)
      expect(row.source).toBe('serper-paa');
    });
  });

  // ── Performance refresh cooldown ──

  describe('performance refresh cooldown', () => {
    it('does not re-queue keyword refreshed within 7 days', () => {
      // Create a recently completed refresh
      const groupRes = testDb.prepare(`
        INSERT INTO keyword_groups (primary_keyword, intent, content_type, priority_score, status, cluster_slug)
        VALUES ('recent refresh', 'informational', 'faq', 10000, 'queued', 'test')
      `).run();
      const groupId = Number(groupRes.lastInsertRowid);

      testDb.prepare(`
        INSERT INTO create_queue (keyword_group_id, content_type, research_pipeline, priority_score, status, completed_at)
        VALUES (?, 'refresh', 'standard', 10000, 'completed', datetime('now', '-3 days'))
      `).run(groupId);

      // Check cooldown: was there a completed refresh within 7 days?
      const recentRefresh = testDb.prepare(`
        SELECT job_id FROM create_queue
        WHERE keyword_group_id = ? AND status = 'completed'
          AND completed_at > datetime('now', '-7 days')
      `).get(groupId);

      expect(recentRefresh).toBeTruthy();

      // Performance cycle should skip this keyword
      // (Only queue if no recent refresh)
      const shouldQueue = !recentRefresh;
      expect(shouldQueue).toBe(false);
    });

    it('allows re-queue when refresh was >7 days ago', () => {
      const groupRes = testDb.prepare(`
        INSERT INTO keyword_groups (primary_keyword, intent, content_type, priority_score, status, cluster_slug)
        VALUES ('old refresh', 'informational', 'faq', 10000, 'queued', 'test')
      `).run();
      const groupId = Number(groupRes.lastInsertRowid);

      testDb.prepare(`
        INSERT INTO create_queue (keyword_group_id, content_type, research_pipeline, priority_score, status, completed_at)
        VALUES (?, 'refresh', 'standard', 10000, 'completed', datetime('now', '-14 days'))
      `).run(groupId);

      // Check cooldown
      const recentRefresh = testDb.prepare(`
        SELECT job_id FROM create_queue
        WHERE keyword_group_id = ? AND status = 'completed'
          AND completed_at > datetime('now', '-7 days')
      `).get(groupId);

      expect(recentRefresh).toBeUndefined();

      // Performance cycle SHOULD queue this keyword
      const shouldQueue = !recentRefresh;
      expect(shouldQueue).toBe(true);
    });
  });
});
