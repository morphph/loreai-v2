/**
 * E2E Lifecycle Integration Test — Full Keyword Engine Pipeline
 *
 * Walks a keyword group through every stage of the pipeline:
 *   B1 (discovery) → B2 (grouping) → B3 (scoring/queue) → B4 (load jobs)
 *   → B5 (DB update after generation) → C2 (consumer query)
 *
 * Uses in-memory SQLite. No API keys needed.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
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

/** Slug generation matching content-gen.ts */
function toSlug(keyword: string): string {
  return keyword
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

/** Map content_type to directory type, matching content-gen.ts lines 736-740 */
function toDirType(contentType: string): string {
  switch (contentType) {
    case 'topic-hub': return 'topics';
    case 'deep-dive': return 'blog';
    case 'cornerstone': return 'blog';
    default: return contentType;
  }
}

/**
 * Simulate findEventAgeHours from score-queue.ts:
 * search news_items for recent events matching primary_keyword.
 */
function findEventAgeHours(
  db: InstanceType<typeof Database>,
  primaryKeyword: string,
): number | null {
  const row = db.prepare(`
    SELECT MIN(
      (julianday('now') - julianday(detected_at)) * 24
    ) as hours_ago
    FROM news_items
    WHERE detected_at > datetime('now', '-7 days')
      AND (title LIKE ? OR summary LIKE ?)
  `).get(`%${primaryKeyword}%`, `%${primaryKeyword}%`) as { hours_ago: number | null } | undefined;

  return row?.hours_ago ?? null;
}

/**
 * Simulate getClusterPageCount from score-queue.ts:
 * count published content pages for a cluster slug.
 */
function getClusterPageCount(db: InstanceType<typeof Database>, clusterSlug: string): number {
  const row = db.prepare(`
    SELECT COUNT(*) as count FROM content
    WHERE type IN ('faq', 'compare', 'glossary', 'blog', 'topic-hub', 'cornerstone')
      AND slug LIKE ?
  `).get(`${clusterSlug}%`) as { count: number };
  return row.count;
}

/**
 * Simulate loadJobs from content-gen.ts: JOIN create_queue with keyword_groups,
 * load secondary keywords, return sorted by priority_score DESC.
 */
function loadJobs(db: InstanceType<typeof Database>) {
  const rows = db.prepare(`
    SELECT cq.job_id, cq.keyword_group_id, cq.content_type, cq.research_pipeline,
           cq.priority_score, cq.status,
           kg.primary_keyword, kg.intent, kg.cluster_slug
    FROM create_queue cq
    JOIN keyword_groups kg ON cq.keyword_group_id = kg.group_id
    WHERE cq.status IN ('pending', 'partial')
    ORDER BY cq.priority_score DESC
  `).all() as Array<{
    job_id: number;
    keyword_group_id: number;
    content_type: string;
    research_pipeline: string;
    priority_score: number;
    status: string;
    primary_keyword: string;
    intent: string;
    cluster_slug: string | null;
  }>;

  return rows.map((row) => {
    const secondaryKws = db.prepare(
      'SELECT keyword FROM keywords WHERE keyword_group_id = ? AND keyword != ?',
    ).all(row.keyword_group_id, row.primary_keyword) as Array<{ keyword: string }>;

    return {
      ...row,
      secondary_keywords: secondaryKws.map((k) => k.keyword),
    };
  });
}

/**
 * Simulate updateDbAfterGeneration from content-gen.ts.
 */
function updateDbAfterGeneration(
  db: InstanceType<typeof Database>,
  job: { job_id: number; keyword_group_id: number; primary_keyword: string; content_type: string; cluster_slug: string | null; intent: string },
  enSuccess: boolean,
  zhSuccess: boolean | null,
  enOnly: boolean = false,
) {
  const slug = toSlug(job.primary_keyword);
  const dirType = toDirType(job.content_type);

  if (enSuccess) {
    // Upsert EN content record
    db.prepare(`
      INSERT INTO content (type, slug, lang, title, body_markdown, meta_json)
      VALUES (?, ?, 'en', ?, '# EN content', ?)
      ON CONFLICT(type, slug, lang) DO UPDATE SET
        title = excluded.title,
        body_markdown = excluded.body_markdown,
        meta_json = excluded.meta_json,
        updated_at = CURRENT_TIMESTAMP
    `).run(
      dirType, slug, job.primary_keyword,
      JSON.stringify({ content_type: job.content_type, cluster_slug: job.cluster_slug, intent: job.intent }),
    );

    // Upsert ZH content record if not enOnly and zhSuccess
    if (!enOnly && zhSuccess) {
      db.prepare(`
        INSERT INTO content (type, slug, lang, title, body_markdown, meta_json)
        VALUES (?, ?, 'zh', ?, '# ZH content', ?)
        ON CONFLICT(type, slug, lang) DO UPDATE SET
          title = excluded.title,
          body_markdown = excluded.body_markdown,
          meta_json = excluded.meta_json,
          updated_at = CURRENT_TIMESTAMP
      `).run(
        dirType, slug, job.primary_keyword,
        JSON.stringify({ content_type: job.content_type, cluster_slug: job.cluster_slug, intent: job.intent }),
      );
    }

    // Update queue status
    if (enOnly || zhSuccess === null || zhSuccess) {
      db.prepare(
        "UPDATE create_queue SET status = 'completed', completed_at = CURRENT_TIMESTAMP WHERE job_id = ?",
      ).run(job.job_id);
    } else {
      // EN ok but ZH failed
      db.prepare("UPDATE create_queue SET status = 'partial' WHERE job_id = ?").run(job.job_id);
    }

    // Mark keywords as covered
    db.prepare(
      'UPDATE keywords SET content_exists = 1, content_type = ?, content_slug = ? WHERE keyword_group_id = ?',
    ).run(dirType, slug, job.keyword_group_id);
  }
  // If EN failed, status stays 'pending' — no DB changes
}

/**
 * Simulate getRecentSeoPages from db.ts lines 315-324.
 */
function getRecentSeoPages(db: InstanceType<typeof Database>, days: number = 7, lang: string = 'en') {
  return db.prepare(`
    SELECT type, slug, lang, title, created_at FROM content
    WHERE lang = ?
      AND type NOT IN ('newsletter')
      AND created_at > datetime('now', '-' || ? || ' days')
    ORDER BY created_at DESC
  `).all(lang, days) as Array<{
    type: string;
    slug: string;
    lang: string;
    title: string | null;
    created_at: string;
  }>;
}

// ── Tests ──

describe('full keyword lifecycle', () => {
  beforeEach(() => {
    testDb = createTestDb();
  });

  afterEach(() => {
    testDb.close();
  });

  it('walks a keyword group from discovery to published content', () => {
    // ── Setup: Insert topic clusters + news items ──

    testDb.prepare(`
      INSERT INTO topic_clusters (slug, pillar_topic, mention_count)
      VALUES (?, ?, ?)
    `).run('claude-code', 'Claude Code', 10);

    testDb.prepare(`
      INSERT INTO topic_clusters (slug, pillar_topic, mention_count)
      VALUES (?, ?, ?)
    `).run('claude-code-pricing', 'Claude Code Pricing', 5);

    testDb.prepare(`
      INSERT INTO news_items (title, url, source, source_tier, summary, score)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(
      'Claude Code pricing update announced',
      'https://example.com/claude-code-pricing',
      'techcrunch',
      1,
      'Anthropic announces new claude code pricing tiers',
      85,
    );

    // ── Stage 1 (B1 mock): Insert keywords (simulating expandTopic output) ──

    const b1Keywords = [
      { keyword: 'how much does claude code cost', source: 'serper-expansion', clusterSlug: 'claude-code-pricing' },
      { keyword: 'claude code pricing plans', source: 'serper-expansion', clusterSlug: 'claude-code-pricing' },
      { keyword: 'claude code free tier', source: 'serper-expansion', clusterSlug: 'claude-code-pricing' },
      { keyword: 'claude code vs cursor price', source: 'serper-expansion', clusterSlug: 'claude-code-pricing' },
    ];

    for (const kw of b1Keywords) {
      testDb.prepare(`
        INSERT INTO keywords (keyword, source, cluster_slug, search_volume, competition, intent)
        VALUES (?, ?, ?, NULL, NULL, NULL)
      `).run(kw.keyword, kw.source, kw.clusterSlug);
    }

    // Assert: keywords exist, keyword_group_id IS NULL, cluster_slug set, source set
    const stage1Keywords = testDb.prepare(
      'SELECT keyword, keyword_group_id, cluster_slug, source FROM keywords',
    ).all() as Array<{ keyword: string; keyword_group_id: number | null; cluster_slug: string; source: string }>;

    expect(stage1Keywords).toHaveLength(4);
    for (const kw of stage1Keywords) {
      expect(kw.keyword_group_id).toBeNull();
      expect(kw.cluster_slug).toBe('claude-code-pricing');
      expect(kw.source).toBe('serper-expansion');
    }

    // ── Stage 2 (B2 mock): Insert keyword_groups, link keywords ──

    // Group 1: FAQ group
    const g1Res = testDb.prepare(`
      INSERT INTO keyword_groups (primary_keyword, intent, content_type, priority_score, status, cluster_slug)
      VALUES (?, ?, ?, 0, 'pending', ?)
    `).run('how much does claude code cost', 'informational', 'faq', 'claude-code-pricing');
    const group1Id = Number(g1Res.lastInsertRowid);

    // Group 2: Compare group
    const g2Res = testDb.prepare(`
      INSERT INTO keyword_groups (primary_keyword, intent, content_type, priority_score, status, cluster_slug)
      VALUES (?, ?, ?, 0, 'pending', ?)
    `).run('claude code vs cursor price', 'commercial', 'compare', 'claude-code-pricing');
    const group2Id = Number(g2Res.lastInsertRowid);

    // Link keywords to groups and add volume/competition (simulating B2 enrichment)
    testDb.prepare('UPDATE keywords SET keyword_group_id = ?, search_volume = ?, competition = ? WHERE keyword = ?')
      .run(group1Id, 2400, 'low', 'how much does claude code cost');
    testDb.prepare('UPDATE keywords SET keyword_group_id = ?, search_volume = ?, competition = ? WHERE keyword = ?')
      .run(group1Id, 1000, 'low', 'claude code pricing plans');
    testDb.prepare('UPDATE keywords SET keyword_group_id = ?, search_volume = ?, competition = ? WHERE keyword = ?')
      .run(group1Id, 800, 'low', 'claude code free tier');
    testDb.prepare('UPDATE keywords SET keyword_group_id = ?, search_volume = ?, competition = ? WHERE keyword = ?')
      .run(group2Id, 5000, 'medium', 'claude code vs cursor price');

    // Assert: keyword_groups have correct status and priority_score
    const stage2Groups = testDb.prepare(
      'SELECT group_id, status, priority_score FROM keyword_groups ORDER BY group_id',
    ).all() as Array<{ group_id: number; status: string; priority_score: number }>;

    expect(stage2Groups).toHaveLength(2);
    for (const g of stage2Groups) {
      expect(g.status).toBe('pending');
      expect(g.priority_score).toBe(0);
    }

    // Assert: all keywords have keyword_group_id set (except unlinked ones)
    const linkedKws = testDb.prepare(
      'SELECT keyword FROM keywords WHERE keyword_group_id IS NOT NULL',
    ).all() as Array<{ keyword: string }>;
    expect(linkedKws).toHaveLength(4);

    // ── Stage 3 (B3 real): Score groups + route + write to queue ──

    const pendingGroups = testDb.prepare(`
      SELECT group_id, primary_keyword, intent, content_type, cluster_slug
      FROM keyword_groups
      WHERE status = 'pending'
      ORDER BY group_id
    `).all() as Array<{
      group_id: number;
      primary_keyword: string;
      intent: string;
      content_type: string;
      cluster_slug: string;
    }>;

    const scoredResults = pendingGroups.map((g) => {
      const keywords = testDb.prepare(
        'SELECT keyword, search_volume, competition FROM keywords WHERE keyword_group_id = ?',
      ).all(g.group_id) as GroupKeyword[];

      const eventAgeHours = findEventAgeHours(testDb, g.primary_keyword);

      return {
        group: g,
        scoring: calculatePriorityScore({
          group_id: g.group_id,
          primary_keyword: g.primary_keyword,
          intent: g.intent,
          content_type: g.content_type,
          cluster_slug: g.cluster_slug,
          keywords,
          event_age_hours: eventAgeHours,
        }),
      };
    });

    scoredResults.sort((a, b) => b.scoring.priority_score - a.scoring.priority_score);

    // Write scores + queue entries (simulating writeToQueue from score-queue.ts)
    const checkExistingJob = testDb.prepare(`
      SELECT job_id FROM create_queue
      WHERE keyword_group_id = ? AND status IN ('pending', 'in_progress')
    `);

    for (const { group, scoring } of scoredResults) {
      // Update priority_score
      testDb.prepare('UPDATE keyword_groups SET priority_score = ?, updated_at = CURRENT_TIMESTAMP WHERE group_id = ?')
        .run(scoring.priority_score, group.group_id);

      const clusterPageCount = getClusterPageCount(testDb, group.cluster_slug);
      const routing = routeKeywordGroup({
        intent: group.intent,
        b2_content_type: group.content_type,
        serp_depth: null,
        recommended_content_type: null,
        cluster_page_count: clusterPageCount,
      });

      const deferred = shouldDeferTopicHub(routing.content_type, clusterPageCount);
      const existingJob = checkExistingJob.get(group.group_id);

      if (!deferred && !existingJob) {
        testDb.prepare(`
          INSERT INTO create_queue (keyword_group_id, content_type, research_pipeline, priority_score, status)
          VALUES (?, ?, ?, ?, 'pending')
        `).run(group.group_id, routing.content_type, routing.research_pipeline, scoring.priority_score);

        testDb.prepare("UPDATE keyword_groups SET status = 'queued', updated_at = CURRENT_TIMESTAMP WHERE group_id = ?")
          .run(group.group_id);
      }
    }

    // Assert: priority_score updated > 0
    const scoredGroups = testDb.prepare(
      'SELECT group_id, priority_score, status FROM keyword_groups ORDER BY priority_score DESC',
    ).all() as Array<{ group_id: number; priority_score: number; status: string }>;

    for (const g of scoredGroups) {
      expect(g.priority_score).toBeGreaterThan(0);
      expect(g.status).toBe('queued');
    }

    // Assert: create_queue rows created with status = 'pending'
    const queueRows = testDb.prepare(
      'SELECT * FROM create_queue ORDER BY priority_score DESC',
    ).all() as Array<{
      job_id: number;
      keyword_group_id: number;
      content_type: string;
      research_pipeline: string;
      priority_score: number;
      status: string;
    }>;

    expect(queueRows).toHaveLength(2);
    for (const q of queueRows) {
      expect(q.status).toBe('pending');
    }

    // Assert: ordering by priority_score DESC — commercial compare (high volume) first
    expect(queueRows[0].content_type).toBe('compare');
    expect(queueRows[0].priority_score).toBeGreaterThan(queueRows[1].priority_score);
    expect(queueRows[1].content_type).toBe('faq');

    // ── Stage 4 (B4 simulate loadJobs): Query jobs ──

    const jobs = loadJobs(testDb);

    expect(jobs).toHaveLength(2);

    // Jobs sorted by priority_score DESC
    expect(jobs[0].priority_score).toBeGreaterThanOrEqual(jobs[1].priority_score);

    // secondary_keywords populated from keywords table
    // Group 1 (FAQ) has 3 keywords, primary + 2 secondary
    const faqJob = jobs.find((j) => j.content_type === 'faq')!;
    expect(faqJob).toBeDefined();
    expect(faqJob.secondary_keywords.length).toBeGreaterThanOrEqual(2);
    expect(faqJob.secondary_keywords).not.toContain(faqJob.primary_keyword);

    // content_type -> dirType mapping check
    expect(toDirType('faq')).toBe('faq');
    expect(toDirType('compare')).toBe('compare');
    expect(toDirType('topic-hub')).toBe('topics');
    expect(toDirType('blog')).toBe('blog');

    // ── Stage 5 (DB update simulate updateDbAfterGeneration) ──

    for (const job of jobs) {
      updateDbAfterGeneration(testDb, job, true, true);
    }

    // Assert: queue status = 'completed', completed_at set
    const completedQueue = testDb.prepare(
      'SELECT status, completed_at FROM create_queue',
    ).all() as Array<{ status: string; completed_at: string | null }>;

    for (const q of completedQueue) {
      expect(q.status).toBe('completed');
      expect(q.completed_at).not.toBeNull();
    }

    // Assert: keywords.content_exists = 1, content_type + content_slug populated
    const updatedKws = testDb.prepare(
      'SELECT keyword, content_exists, content_type, content_slug FROM keywords WHERE keyword_group_id IS NOT NULL',
    ).all() as Array<{ keyword: string; content_exists: number; content_type: string | null; content_slug: string | null }>;

    for (const kw of updatedKws) {
      expect(kw.content_exists).toBe(1);
      expect(kw.content_type).not.toBeNull();
      expect(kw.content_slug).not.toBeNull();
    }

    // Assert: content table has EN + ZH rows
    const contentRows = testDb.prepare(
      'SELECT type, slug, lang FROM content ORDER BY slug, lang',
    ).all() as Array<{ type: string; slug: string; lang: string }>;

    // 2 jobs x 2 langs = 4 content records
    expect(contentRows).toHaveLength(4);
    const enRows = contentRows.filter((r) => r.lang === 'en');
    const zhRows = contentRows.filter((r) => r.lang === 'zh');
    expect(enRows).toHaveLength(2);
    expect(zhRows).toHaveLength(2);

    // ── Stage 6 (C2 consumer): Query content like getRecentSeoPages ──

    const recentPages = getRecentSeoPages(testDb, 7, 'en');

    expect(recentPages.length).toBe(2);
    for (const page of recentPages) {
      expect(page.type).not.toBe('newsletter');
      expect(page.lang).toBe('en');
    }

    // Insert a newsletter to verify it's excluded
    testDb.prepare(`
      INSERT INTO content (type, slug, lang, title, body_markdown)
      VALUES ('newsletter', '2026-03-21', 'en', 'Daily Newsletter', '# News')
    `).run();

    const recentPagesAfterNewsletter = getRecentSeoPages(testDb, 7, 'en');
    expect(recentPagesAfterNewsletter.length).toBe(2); // newsletter excluded
    for (const page of recentPagesAfterNewsletter) {
      expect(page.type).not.toBe('newsletter');
    }
  });
});

describe('partial status — EN succeeds, ZH fails', () => {
  beforeEach(() => { testDb = createTestDb(); });
  afterEach(() => { testDb.close(); });

  it('sets queue status to partial and marks keywords as covered', () => {
    // Setup group + keywords + queue job
    const gRes = testDb.prepare(`
      INSERT INTO keyword_groups (primary_keyword, intent, content_type, status, cluster_slug)
      VALUES ('test partial keyword', 'informational', 'faq', 'queued', 'test-cluster')
    `).run();
    const groupId = Number(gRes.lastInsertRowid);

    testDb.prepare(`
      INSERT INTO keywords (keyword, source, cluster_slug, keyword_group_id, search_volume)
      VALUES ('test partial keyword', 'test', 'test-cluster', ?, 500)
    `).run(groupId);

    const qRes = testDb.prepare(`
      INSERT INTO create_queue (keyword_group_id, content_type, research_pipeline, priority_score, status)
      VALUES (?, 'faq', 'standard', 3750, 'pending')
    `).run(groupId);
    const jobId = Number(qRes.lastInsertRowid);

    // Simulate: EN succeeds, ZH fails
    updateDbAfterGeneration(
      testDb,
      { job_id: jobId, keyword_group_id: groupId, primary_keyword: 'test partial keyword', content_type: 'faq', cluster_slug: 'test-cluster', intent: 'informational' },
      true,   // EN success
      false,  // ZH failure
    );

    // Assert: queue status = 'partial'
    const job = testDb.prepare('SELECT status FROM create_queue WHERE job_id = ?').get(jobId) as { status: string };
    expect(job.status).toBe('partial');

    // Assert: content_exists = 1 (EN was written)
    const kw = testDb.prepare('SELECT content_exists FROM keywords WHERE keyword_group_id = ?').get(groupId) as { content_exists: number };
    expect(kw.content_exists).toBe(1);

    // Assert: only EN content row exists, no ZH
    const contentRows = testDb.prepare('SELECT lang FROM content WHERE slug = ?').all('test-partial-keyword') as Array<{ lang: string }>;
    expect(contentRows).toHaveLength(1);
    expect(contentRows[0].lang).toBe('en');
  });
});

describe('EN failure — no DB changes', () => {
  beforeEach(() => { testDb = createTestDb(); });
  afterEach(() => { testDb.close(); });

  it('leaves queue status pending and content_exists = 0 when EN fails', () => {
    const gRes = testDb.prepare(`
      INSERT INTO keyword_groups (primary_keyword, intent, content_type, status, cluster_slug)
      VALUES ('failing keyword', 'informational', 'glossary', 'queued', 'test-cluster')
    `).run();
    const groupId = Number(gRes.lastInsertRowid);

    testDb.prepare(`
      INSERT INTO keywords (keyword, source, cluster_slug, keyword_group_id, search_volume)
      VALUES ('failing keyword', 'test', 'test-cluster', ?, 100)
    `).run(groupId);

    const qRes = testDb.prepare(`
      INSERT INTO create_queue (keyword_group_id, content_type, research_pipeline, priority_score, status)
      VALUES (?, 'glossary', 'standard', 200, 'pending')
    `).run(groupId);
    const jobId = Number(qRes.lastInsertRowid);

    // Simulate: EN fails
    updateDbAfterGeneration(
      testDb,
      { job_id: jobId, keyword_group_id: groupId, primary_keyword: 'failing keyword', content_type: 'glossary', cluster_slug: 'test-cluster', intent: 'informational' },
      false,  // EN failure
      null,   // ZH not attempted
    );

    // Assert: status stays 'pending'
    const job = testDb.prepare('SELECT status FROM create_queue WHERE job_id = ?').get(jobId) as { status: string };
    expect(job.status).toBe('pending');

    // Assert: content_exists stays 0
    const kw = testDb.prepare('SELECT content_exists FROM keywords WHERE keyword_group_id = ?').get(groupId) as { content_exists: number };
    expect(kw.content_exists).toBe(0);

    // Assert: no content rows created
    const contentCount = (testDb.prepare('SELECT COUNT(*) as count FROM content').get() as { count: number }).count;
    expect(contentCount).toBe(0);
  });
});

describe('idempotency — no duplicate queue jobs', () => {
  beforeEach(() => { testDb = createTestDb(); });
  afterEach(() => { testDb.close(); });

  it('does not insert duplicate queue jobs on second scoring run', () => {
    // Setup group + keywords
    const gRes = testDb.prepare(`
      INSERT INTO keyword_groups (primary_keyword, intent, content_type, status, cluster_slug)
      VALUES ('idempotent keyword', 'commercial', 'compare', 'pending', 'test-cluster')
    `).run();
    const groupId = Number(gRes.lastInsertRowid);

    testDb.prepare(`
      INSERT INTO keywords (keyword, source, cluster_slug, keyword_group_id, search_volume, competition)
      VALUES ('idempotent keyword', 'test', 'test-cluster', ?, 3000, 'low')
    `).run(groupId);

    // First scoring run
    const keywords = testDb.prepare(
      'SELECT keyword, search_volume, competition FROM keywords WHERE keyword_group_id = ?',
    ).all(groupId) as GroupKeyword[];

    const scoring = calculatePriorityScore({
      group_id: groupId,
      primary_keyword: 'idempotent keyword',
      intent: 'commercial',
      content_type: 'compare',
      cluster_slug: 'test-cluster',
      keywords,
      event_age_hours: null,
    });

    const routing = routeKeywordGroup({
      intent: 'commercial',
      b2_content_type: 'compare',
      serp_depth: null,
      recommended_content_type: null,
      cluster_page_count: 0,
    });

    // Insert first queue job
    testDb.prepare(`
      INSERT INTO create_queue (keyword_group_id, content_type, research_pipeline, priority_score, status)
      VALUES (?, ?, ?, ?, 'pending')
    `).run(groupId, routing.content_type, routing.research_pipeline, scoring.priority_score);
    testDb.prepare("UPDATE keyword_groups SET status = 'queued', priority_score = ? WHERE group_id = ?")
      .run(scoring.priority_score, groupId);

    expect((testDb.prepare('SELECT COUNT(*) as count FROM create_queue').get() as { count: number }).count).toBe(1);

    // Second scoring run: check existing before inserting
    const existingJob = testDb.prepare(`
      SELECT job_id FROM create_queue
      WHERE keyword_group_id = ? AND status IN ('pending', 'in_progress')
    `).get(groupId);

    expect(existingJob).toBeDefined();

    // Guard: only insert if not already queued
    if (!existingJob) {
      testDb.prepare(`
        INSERT INTO create_queue (keyword_group_id, content_type, research_pipeline, priority_score, status)
        VALUES (?, ?, ?, ?, 'pending')
      `).run(groupId, routing.content_type, routing.research_pipeline, scoring.priority_score);
    }

    // Assert: still only 1 queue job
    const finalCount = (testDb.prepare('SELECT COUNT(*) as count FROM create_queue').get() as { count: number }).count;
    expect(finalCount).toBe(1);
  });
});

describe('timeliness bonus', () => {
  beforeEach(() => { testDb = createTestDb(); });
  afterEach(() => { testDb.close(); });

  it('adds +5000 bonus for keyword matching a news item within 24h', () => {
    // Insert a recent news item
    testDb.prepare(`
      INSERT INTO news_items (title, url, source, source_tier, summary, score, detected_at)
      VALUES (?, ?, ?, ?, ?, ?, datetime('now', '-12 hours'))
    `).run(
      'Breaking: Claude Code launches new API',
      'https://example.com/claude-code-api',
      'verge', 1,
      'Claude Code API now available for developers',
      90,
    );

    const gRes = testDb.prepare(`
      INSERT INTO keyword_groups (primary_keyword, intent, content_type, status, cluster_slug)
      VALUES ('Claude Code', 'informational', 'faq', 'pending', 'claude-code')
    `).run();
    const groupId = Number(gRes.lastInsertRowid);

    testDb.prepare(`
      INSERT INTO keywords (keyword, source, cluster_slug, keyword_group_id, search_volume, competition)
      VALUES ('Claude Code', 'test', 'claude-code', ?, 1000, 'low')
    `).run(groupId);

    const keywords = testDb.prepare(
      'SELECT keyword, search_volume, competition FROM keywords WHERE keyword_group_id = ?',
    ).all(groupId) as GroupKeyword[];

    const eventAgeHours = findEventAgeHours(testDb, 'Claude Code');
    expect(eventAgeHours).not.toBeNull();
    expect(eventAgeHours!).toBeLessThan(48); // Within the full-bonus window

    // Score with timeliness
    const withTimeliness = calculatePriorityScore({
      group_id: groupId,
      primary_keyword: 'Claude Code',
      intent: 'informational',
      content_type: 'faq',
      cluster_slug: 'claude-code',
      keywords,
      event_age_hours: eventAgeHours,
    });

    // Score without timeliness
    const withoutTimeliness = calculatePriorityScore({
      group_id: groupId,
      primary_keyword: 'Claude Code',
      intent: 'informational',
      content_type: 'faq',
      cluster_slug: 'claude-code',
      keywords,
      event_age_hours: null,
    });

    // Assert: timeliness bonus = 5000
    expect(withTimeliness.score_breakdown.timeliness_bonus).toBe(5000);
    expect(withoutTimeliness.score_breakdown.timeliness_bonus).toBe(0);

    // Assert: score with timeliness is 5000 more
    expect(withTimeliness.priority_score).toBe(withoutTimeliness.priority_score + 5000);
  });
});

describe('SERP override — long_form FAQ upgraded to blog', () => {
  beforeEach(() => { testDb = createTestDb(); });
  afterEach(() => { testDb.close(); });

  it('routes informational FAQ to blog with standard when SERP says long_form', () => {
    const result = routeKeywordGroup({
      intent: 'informational',
      b2_content_type: 'faq',
      serp_depth: 'long_form',
      recommended_content_type: 'blog',
      cluster_page_count: 0,
    });

    expect(result.content_type).toBe('blog');
    expect(result.research_pipeline).toBe('standard');
    expect(result.routing_reason).toContain('SERP depth override');
  });

  it('does NOT override non-informational intents', () => {
    const result = routeKeywordGroup({
      intent: 'commercial',
      b2_content_type: 'faq',
      serp_depth: 'long_form',
      recommended_content_type: 'blog',
      cluster_page_count: 0,
    });

    // Commercial intent stays as faq, SERP override only applies to informational
    expect(result.content_type).toBe('faq');
    expect(result.research_pipeline).toBe('standard');
  });
});

describe('enOnly mode — only EN content, status completed', () => {
  beforeEach(() => { testDb = createTestDb(); });
  afterEach(() => { testDb.close(); });

  it('creates only EN content row and sets status to completed', () => {
    const gRes = testDb.prepare(`
      INSERT INTO keyword_groups (primary_keyword, intent, content_type, status, cluster_slug)
      VALUES ('en only keyword', 'informational', 'glossary', 'queued', 'test-cluster')
    `).run();
    const groupId = Number(gRes.lastInsertRowid);

    testDb.prepare(`
      INSERT INTO keywords (keyword, source, cluster_slug, keyword_group_id, search_volume)
      VALUES ('en only keyword', 'test', 'test-cluster', ?, 200)
    `).run(groupId);

    const qRes = testDb.prepare(`
      INSERT INTO create_queue (keyword_group_id, content_type, research_pipeline, priority_score, status)
      VALUES (?, 'glossary', 'standard', 600, 'pending')
    `).run(groupId);
    const jobId = Number(qRes.lastInsertRowid);

    // Simulate enOnly mode: EN succeeds, ZH is null (not attempted)
    updateDbAfterGeneration(
      testDb,
      { job_id: jobId, keyword_group_id: groupId, primary_keyword: 'en only keyword', content_type: 'glossary', cluster_slug: 'test-cluster', intent: 'informational' },
      true,  // EN success
      null,  // ZH not attempted
      true,  // enOnly flag
    );

    // Assert: status = 'completed' (not 'partial')
    const job = testDb.prepare('SELECT status, completed_at FROM create_queue WHERE job_id = ?').get(jobId) as { status: string; completed_at: string | null };
    expect(job.status).toBe('completed');
    expect(job.completed_at).not.toBeNull();

    // Assert: only EN content row, no ZH
    const contentRows = testDb.prepare('SELECT lang FROM content WHERE slug = ?').all('en-only-keyword') as Array<{ lang: string }>;
    expect(contentRows).toHaveLength(1);
    expect(contentRows[0].lang).toBe('en');

    // Assert: keywords still marked as covered
    const kw = testDb.prepare('SELECT content_exists FROM keywords WHERE keyword_group_id = ?').get(groupId) as { content_exists: number };
    expect(kw.content_exists).toBe(1);
  });
});

describe('NULL volume — uses DEFAULT_VOLUME', () => {
  beforeEach(() => { testDb = createTestDb(); });
  afterEach(() => { testDb.close(); });

  it('scores correctly with all-null search_volume and does not crash', () => {
    const gRes = testDb.prepare(`
      INSERT INTO keyword_groups (primary_keyword, intent, content_type, status, cluster_slug)
      VALUES ('null volume keyword', 'informational', 'faq', 'pending', 'test-cluster')
    `).run();
    const groupId = Number(gRes.lastInsertRowid);

    // Insert keywords with NULL volume and NULL competition
    testDb.prepare(`
      INSERT INTO keywords (keyword, source, cluster_slug, keyword_group_id, search_volume, competition)
      VALUES ('null volume keyword', 'test', 'test-cluster', ?, NULL, NULL)
    `).run(groupId);

    testDb.prepare(`
      INSERT INTO keywords (keyword, source, cluster_slug, keyword_group_id, search_volume, competition)
      VALUES ('null volume secondary', 'test', 'test-cluster', ?, NULL, NULL)
    `).run(groupId);

    const keywords = testDb.prepare(
      'SELECT keyword, search_volume, competition FROM keywords WHERE keyword_group_id = ?',
    ).all(groupId) as GroupKeyword[];

    expect(keywords).toHaveLength(2);
    for (const kw of keywords) {
      expect(kw.search_volume).toBeNull();
      expect(kw.competition).toBeNull();
    }

    // Score — should not throw
    const result = calculatePriorityScore({
      group_id: groupId,
      primary_keyword: 'null volume keyword',
      intent: 'informational',
      content_type: 'faq',
      cluster_slug: 'test-cluster',
      keywords,
      event_age_hours: null,
    });

    // Assert: uses volume proxy (2 keywords × 8 = 16)
    expect(result.score_breakdown.volume).toBe(16);
    expect(result.priority_score).toBeGreaterThan(0);

    // With informational intent (1.5x) and default competition (0.5):
    // base = 16 * (1/0.5) * 1.5 = 48
    expect(result.priority_score).toBe(48);
  });
});
