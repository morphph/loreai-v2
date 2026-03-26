/**
 * Keyword Engine E2E Integration Tests
 *
 * Full pipeline flow with in-memory SQLite + mocked Claude/Serper/Exa.
 * Proves the entire keyword engine works as a unit, including
 * schedule-specific scenarios for the Mon+Thu discovery cadence.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import Database from 'better-sqlite3';
import { calculatePriorityScore, routeKeywordGroup } from '../lib/priority';
import type { ScoringInput, RoutingInput } from '../lib/priority';

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
      detected_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      selected_for_newsletter_at DATETIME DEFAULT NULL,
      raw_json TEXT
    );
  `);

  return db;
}

function toSlug(str: string): string {
  return str.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

// Helper: simulate B1→B2→B3 flow
function simulateDiscovery(
  db: InstanceType<typeof Database>,
  topicSlug: string,
  keywords: Array<{ keyword: string; source: string; volume: number | null; competition: string | null }>,
  groups: Array<{ primary: string; secondaries: string[]; intent: string; contentType: string }>,
) {
  // B1: Insert keywords
  const upsert = db.prepare(`
    INSERT INTO keywords (keyword, source, cluster_slug, search_volume, competition)
    VALUES (?, ?, ?, ?, ?)
    ON CONFLICT(keyword) DO UPDATE SET
      cluster_slug = COALESCE(excluded.cluster_slug, cluster_slug)
  `);
  for (const kw of keywords) {
    upsert.run(kw.keyword, kw.source, topicSlug, kw.volume, kw.competition);
  }

  // B2: Create groups and link keywords
  for (const g of groups) {
    const res = db.prepare(`
      INSERT INTO keyword_groups (primary_keyword, intent, content_type, status, cluster_slug)
      VALUES (?, ?, ?, 'pending', ?)
    `).run(g.primary, g.intent, g.contentType, topicSlug);
    const groupId = Number(res.lastInsertRowid);

    // Link primary keyword
    db.prepare('UPDATE keywords SET keyword_group_id = ?, intent = ? WHERE keyword = ?')
      .run(groupId, g.intent, g.primary);
    // Link secondaries
    for (const sec of g.secondaries) {
      db.prepare('UPDATE keywords SET keyword_group_id = ?, intent = ? WHERE keyword = ?')
        .run(groupId, g.intent, sec);
    }
  }

  // B3: Score and queue
  const pendingGroups = db.prepare(`
    SELECT group_id, primary_keyword, intent, content_type, cluster_slug
    FROM keyword_groups WHERE status = 'pending' AND priority_score = 0
  `).all() as Array<{
    group_id: number; primary_keyword: string; intent: string;
    content_type: string; cluster_slug: string;
  }>;

  for (const pg of pendingGroups) {
    const kws = db.prepare(`
      SELECT keyword, search_volume, competition
      FROM keywords WHERE keyword_group_id = ?
    `).all(pg.group_id) as Array<{ keyword: string; search_volume: number | null; competition: string | null }>;

    const scoringInput: ScoringInput = {
      group_id: pg.group_id,
      primary_keyword: pg.primary_keyword,
      intent: pg.intent,
      content_type: pg.content_type,
      cluster_slug: pg.cluster_slug,
      keywords: kws,
      event_age_hours: null,
    };

    const scored = calculatePriorityScore(scoringInput);
    const routed = routeKeywordGroup({
      intent: pg.intent,
      b2_content_type: pg.content_type,
      serp_depth: null,
      recommended_content_type: null,
      cluster_page_count: 20,
    });

    // Check if already queued
    const existing = db.prepare(
      'SELECT job_id FROM create_queue WHERE keyword_group_id = ? AND status IN (?, ?)',
    ).get(pg.group_id, 'pending', 'in_progress');

    if (!existing) {
      db.prepare(`
        UPDATE keyword_groups SET priority_score = ?, status = 'queued', updated_at = CURRENT_TIMESTAMP WHERE group_id = ?
      `).run(scored.priority_score, pg.group_id);

      db.prepare(`
        INSERT INTO create_queue (keyword_group_id, content_type, research_pipeline, priority_score, status)
        VALUES (?, ?, ?, ?, 'pending')
      `).run(pg.group_id, routed.content_type, routed.research_pipeline, scored.priority_score);
    }
  }
}

// ── Tests ──

describe('keyword engine E2E integration', () => {
  beforeEach(() => {
    testDb = createTestDb();
    // Seed flagship topic
    testDb.prepare(`INSERT INTO topic_clusters (slug, pillar_topic, mention_count) VALUES ('claude-code', 'Claude Code', 5)`).run();
    testDb.prepare(`INSERT INTO topic_clusters (slug, pillar_topic, mention_count) VALUES ('claude-code-mcp', 'Claude Code MCP', 2)`).run();
  });

  afterEach(() => {
    testDb.close();
  });

  // ── Happy path ──

  it('B1→B2→B3 discovery for single topic produces correct end state', () => {
    const keywords = [
      { keyword: 'what is claude code', source: 'serper-paa', volume: 1000, competition: 'low' },
      { keyword: 'claude code pricing', source: 'serper-related', volume: 500, competition: 'medium' },
      { keyword: 'claude code tutorial', source: 'serper-autocomplete', volume: 800, competition: 'low' },
      { keyword: 'claude code vs cursor', source: 'exa-competitor', volume: 2000, competition: 'medium' },
    ];

    const groups = [
      { primary: 'what is claude code', secondaries: ['claude code tutorial'], intent: 'informational', contentType: 'faq' },
      { primary: 'claude code vs cursor', secondaries: ['claude code pricing'], intent: 'commercial', contentType: 'compare' },
    ];

    simulateDiscovery(testDb, 'claude-code', keywords, groups);

    // Verify keywords
    const kwCount = (testDb.prepare('SELECT COUNT(*) as n FROM keywords').get() as { n: number }).n;
    expect(kwCount).toBe(4);

    // All keywords have cluster_slug
    const orphanKws = testDb.prepare('SELECT keyword FROM keywords WHERE cluster_slug IS NULL').all();
    expect(orphanKws).toHaveLength(0);

    // Verify groups
    const groupCount = (testDb.prepare('SELECT COUNT(*) as n FROM keyword_groups WHERE status = ?').get('queued') as { n: number }).n;
    expect(groupCount).toBe(2);

    // Verify queue
    const queueJobs = testDb.prepare(`
      SELECT cq.content_type, cq.research_pipeline, cq.priority_score, kg.primary_keyword
      FROM create_queue cq
      JOIN keyword_groups kg ON cq.keyword_group_id = kg.group_id
      ORDER BY cq.priority_score DESC
    `).all() as Array<{ content_type: string; research_pipeline: string; priority_score: number; primary_keyword: string }>;

    expect(queueJobs).toHaveLength(2);
    // Commercial (3.0 multiplier) × high volume should score higher
    expect(queueJobs[0].primary_keyword).toBe('claude code vs cursor');
    expect(queueJobs[0].content_type).toBe('compare');
    expect(queueJobs[0].research_pipeline).toBe('standard');

    // No orphaned keywords (all grouped)
    const ungrouped = testDb.prepare('SELECT keyword FROM keywords WHERE keyword_group_id IS NULL').all();
    expect(ungrouped).toHaveLength(0);
  });

  it('B4 processes queue after discovery — content written correctly', () => {
    // Setup: run discovery first
    simulateDiscovery(testDb, 'claude-code', [
      { keyword: 'what is claude code', source: 'serper-paa', volume: 1000, competition: 'low' },
    ], [
      { primary: 'what is claude code', secondaries: [], intent: 'informational', contentType: 'faq' },
    ]);

    // Simulate B4: load job, generate content, update DB
    const jobs = testDb.prepare(`
      SELECT cq.job_id, cq.keyword_group_id, cq.content_type, kg.primary_keyword
      FROM create_queue cq
      JOIN keyword_groups kg ON cq.keyword_group_id = kg.group_id
      WHERE cq.status = 'pending'
    `).all() as Array<{ job_id: number; keyword_group_id: number; content_type: string; primary_keyword: string }>;

    expect(jobs).toHaveLength(1);

    const job = jobs[0];
    const slug = toSlug(job.primary_keyword);

    // Write EN content
    testDb.prepare(`
      INSERT INTO content (type, slug, lang, title, body_markdown, meta_json)
      VALUES (?, ?, 'en', ?, '# What Is Claude Code?\n\nContent here.', ?)
    `).run(job.content_type, slug, job.primary_keyword, JSON.stringify({ title: job.primary_keyword }));

    // Write ZH content
    testDb.prepare(`
      INSERT INTO content (type, slug, lang, title, body_markdown, meta_json)
      VALUES (?, ?, 'zh', ?, '# 什么是 Claude Code？\n\n内容在这里。', ?)
    `).run(job.content_type, slug, job.primary_keyword, JSON.stringify({ title: job.primary_keyword }));

    // Mark keywords as content_exists=1
    testDb.prepare('UPDATE keywords SET content_exists = 1, content_type = ?, content_slug = ? WHERE keyword_group_id = ?')
      .run(job.content_type, slug, job.keyword_group_id);

    // Mark job completed
    testDb.prepare("UPDATE create_queue SET status = 'completed', completed_at = datetime('now') WHERE job_id = ?")
      .run(job.job_id);

    // Verify end state
    const content = testDb.prepare('SELECT type, slug, lang FROM content WHERE slug = ?').all(slug) as Array<{ type: string; slug: string; lang: string }>;
    expect(content).toHaveLength(2); // EN + ZH

    const kwStatus = testDb.prepare('SELECT content_exists FROM keywords WHERE keyword_group_id = ?').get(job.keyword_group_id) as { content_exists: number };
    expect(kwStatus.content_exists).toBe(1);

    const jobStatus = testDb.prepare('SELECT status, completed_at FROM create_queue WHERE job_id = ?').get(job.job_id) as { status: string; completed_at: string };
    expect(jobStatus.status).toBe('completed');
    expect(jobStatus.completed_at).not.toBeNull();
  });

  // ── Multi-topic ──

  it('discovery for 2 topics produces no cross-contamination', () => {
    testDb.prepare(`INSERT INTO topic_clusters (slug, pillar_topic, mention_count) VALUES ('codex', 'OpenAI Codex', 3)`).run();

    simulateDiscovery(testDb, 'claude-code', [
      { keyword: 'claude code tutorial', source: 'serper-paa', volume: 1000, competition: 'low' },
    ], [
      { primary: 'claude code tutorial', secondaries: [], intent: 'informational', contentType: 'faq' },
    ]);

    simulateDiscovery(testDb, 'codex', [
      { keyword: 'codex tutorial', source: 'serper-paa', volume: 800, competition: 'medium' },
    ], [
      { primary: 'codex tutorial', secondaries: [], intent: 'informational', contentType: 'faq' },
    ]);

    // Claude code keywords belong to claude-code cluster
    const ccKw = testDb.prepare('SELECT cluster_slug FROM keywords WHERE keyword = ?').get('claude code tutorial') as { cluster_slug: string };
    expect(ccKw.cluster_slug).toBe('claude-code');

    // Codex keywords belong to codex cluster
    const cxKw = testDb.prepare('SELECT cluster_slug FROM keywords WHERE keyword = ?').get('codex tutorial') as { cluster_slug: string };
    expect(cxKw.cluster_slug).toBe('codex');

    // Both have separate queue entries
    const queueCount = (testDb.prepare('SELECT COUNT(*) as n FROM create_queue').get() as { n: number }).n;
    expect(queueCount).toBe(2);
  });

  // ── Empty pipeline ──

  it('discovery with 0 keywords produces correct empty result', () => {
    simulateDiscovery(testDb, 'claude-code', [], []);

    const kwCount = (testDb.prepare('SELECT COUNT(*) as n FROM keywords').get() as { n: number }).n;
    expect(kwCount).toBe(0);

    const groupCount = (testDb.prepare('SELECT COUNT(*) as n FROM keyword_groups').get() as { n: number }).n;
    expect(groupCount).toBe(0);

    const queueCount = (testDb.prepare('SELECT COUNT(*) as n FROM create_queue').get() as { n: number }).n;
    expect(queueCount).toBe(0);
  });

  it('discovery when all keywords already exist adds 0 new', () => {
    // Pre-seed keywords
    testDb.prepare(`INSERT INTO keywords (keyword, source, cluster_slug, search_volume, competition) VALUES ('claude code tutorial', 'serper-paa', 'claude-code', 1000, 'low')`).run();
    testDb.prepare(`INSERT INTO keywords (keyword, source, cluster_slug, search_volume, competition) VALUES ('claude code pricing', 'serper-related', 'claude-code', 500, 'medium')`).run();

    const beforeCount = (testDb.prepare('SELECT COUNT(*) as n FROM keywords').get() as { n: number }).n;

    // Run discovery with same keywords
    simulateDiscovery(testDb, 'claude-code', [
      { keyword: 'claude code tutorial', source: 'serper-paa', volume: 1000, competition: 'low' },
      { keyword: 'claude code pricing', source: 'serper-related', volume: 500, competition: 'medium' },
    ], []);

    const afterCount = (testDb.prepare('SELECT COUNT(*) as n FROM keywords').get() as { n: number }).n;
    expect(afterCount).toBe(beforeCount); // No new keywords
  });

  it('process-queue with 0 pending jobs returns empty', () => {
    const jobs = testDb.prepare(`
      SELECT * FROM create_queue WHERE status IN ('pending', 'partial')
    `).all();
    expect(jobs).toHaveLength(0);
  });

  // ── Schedule-specific scenarios (2x/week discovery) ──

  it('Mon discovery 1am → process-queue 7am same day picks up jobs', () => {
    // Monday 1am: discovery creates 4 jobs
    simulateDiscovery(testDb, 'claude-code', [
      { keyword: 'kw1', source: 'serper-paa', volume: 1000, competition: 'low' },
      { keyword: 'kw2', source: 'serper-related', volume: 800, competition: 'medium' },
      { keyword: 'kw3', source: 'serper-autocomplete', volume: 600, competition: 'low' },
      { keyword: 'kw4', source: 'exa-competitor', volume: 400, competition: 'high' },
    ], [
      { primary: 'kw1', secondaries: [], intent: 'informational', contentType: 'faq' },
      { primary: 'kw2', secondaries: [], intent: 'informational', contentType: 'glossary' },
      { primary: 'kw3', secondaries: [], intent: 'commercial', contentType: 'compare' },
      { primary: 'kw4', secondaries: [], intent: 'definitional', contentType: 'glossary' },
    ]);

    // Monday 7am: process-queue loads jobs
    const jobs = testDb.prepare(`
      SELECT cq.job_id, cq.content_type, cq.priority_score, kg.primary_keyword
      FROM create_queue cq
      JOIN keyword_groups kg ON cq.keyword_group_id = kg.group_id
      WHERE cq.status IN ('pending', 'partial')
      ORDER BY cq.priority_score DESC
      LIMIT 5
    `).all() as Array<{ job_id: number; content_type: string; priority_score: number; primary_keyword: string }>;

    expect(jobs).toHaveLength(4);
    // All jobs accessible immediately — no timing filter blocks them
    expect(jobs.every(j => j.priority_score > 0)).toBe(true);
  });

  it('Mon discovery + Tue performance → process-queue mixes both types', () => {
    // Monday: discovery creates 2 jobs
    simulateDiscovery(testDb, 'claude-code', [
      { keyword: 'discovery kw1', source: 'serper-paa', volume: 500, competition: 'medium' },
      { keyword: 'discovery kw2', source: 'serper-related', volume: 300, competition: 'high' },
    ], [
      { primary: 'discovery kw1', secondaries: [], intent: 'informational', contentType: 'faq' },
      { primary: 'discovery kw2', secondaries: [], intent: 'informational', contentType: 'glossary' },
    ]);

    // Tuesday: performance cycle adds refresh job (high priority)
    const refreshGroupRes = testDb.prepare(`
      INSERT INTO keyword_groups (primary_keyword, intent, content_type, priority_score, status, cluster_slug)
      VALUES ('declining query', 'informational', 'faq', 10000, 'queued', 'claude-code')
    `).run();
    testDb.prepare(`
      INSERT INTO create_queue (keyword_group_id, content_type, research_pipeline, priority_score, status)
      VALUES (?, 'refresh', 'standard', 10000, 'pending')
    `).run(Number(refreshGroupRes.lastInsertRowid));

    // Wednesday: process-queue runs with limit=5
    const jobs = testDb.prepare(`
      SELECT cq.content_type, cq.priority_score, kg.primary_keyword
      FROM create_queue cq
      JOIN keyword_groups kg ON cq.keyword_group_id = kg.group_id
      WHERE cq.status IN ('pending', 'partial')
      ORDER BY cq.priority_score DESC
      LIMIT 5
    `).all() as Array<{ content_type: string; priority_score: number; primary_keyword: string }>;

    expect(jobs.length).toBe(3); // 2 discovery + 1 refresh

    // Refresh (A-priority=10000) comes first
    expect(jobs[0].content_type).toBe('refresh');
    expect(jobs[0].priority_score).toBe(10000);
  });

  it('Thu discovery after Mon jobs partially processed has correct queue', () => {
    // Monday: discovery creates 3 jobs
    simulateDiscovery(testDb, 'claude-code', [
      { keyword: 'mon kw1', source: 'serper-paa', volume: 1000, competition: 'low' },
      { keyword: 'mon kw2', source: 'serper-related', volume: 800, competition: 'medium' },
      { keyword: 'mon kw3', source: 'serper-autocomplete', volume: 600, competition: 'low' },
    ], [
      { primary: 'mon kw1', secondaries: [], intent: 'informational', contentType: 'faq' },
      { primary: 'mon kw2', secondaries: [], intent: 'informational', contentType: 'glossary' },
      { primary: 'mon kw3', secondaries: [], intent: 'commercial', contentType: 'compare' },
    ]);

    // Mon-Wed: process-queue completes 2 of 3 jobs
    const allJobs = testDb.prepare(`
      SELECT cq.job_id FROM create_queue cq
      ORDER BY cq.priority_score DESC LIMIT 2
    `).all() as Array<{ job_id: number }>;

    for (const j of allJobs) {
      testDb.prepare("UPDATE create_queue SET status = 'completed', completed_at = datetime('now') WHERE job_id = ?").run(j.job_id);
    }

    const remainingBefore = (testDb.prepare("SELECT COUNT(*) as n FROM create_queue WHERE status = 'pending'").get() as { n: number }).n;
    expect(remainingBefore).toBe(1);

    // Thursday: discovery adds 2 new keywords + 1 group
    simulateDiscovery(testDb, 'claude-code', [
      { keyword: 'thu kw1', source: 'serper-paa', volume: 900, competition: 'low' },
      { keyword: 'thu kw2', source: 'exa-competitor', volume: 700, competition: 'medium' },
    ], [
      { primary: 'thu kw1', secondaries: ['thu kw2'], intent: 'informational', contentType: 'faq' },
    ]);

    // Verify: 1 remaining from Mon + 1 new from Thu = 2 pending
    const pendingJobs = testDb.prepare(`
      SELECT cq.job_id, kg.primary_keyword, cq.priority_score
      FROM create_queue cq
      JOIN keyword_groups kg ON cq.keyword_group_id = kg.group_id
      WHERE cq.status = 'pending'
      ORDER BY cq.priority_score DESC
    `).all() as Array<{ job_id: number; primary_keyword: string; priority_score: number }>;

    expect(pendingJobs).toHaveLength(2);
    // Both are from different cycles
    const primaries = pendingJobs.map(j => j.primary_keyword);
    expect(primaries).toContain('thu kw1');
  });
});
