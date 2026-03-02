import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import fs from 'fs';
import path from 'path';
import os from 'os';

let tmpDir: string;
let dbPath: string;

describe('Database layer', () => {
  let db: typeof import('../db');

  beforeEach(async () => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'loreai-test-'));
    dbPath = path.join(tmpDir, 'test.db');
    process.env.DB_PATH = dbPath;

    // Reset module registry so db.ts re-reads DB_PATH and creates fresh singleton
    vi.resetModules();
    db = await import('../db');
  });

  afterEach(() => {
    try {
      db.closeDb();
    } catch { /* ignore */ }
    try {
      fs.rmSync(tmpDir, { recursive: true });
    } catch { /* ignore */ }
    delete process.env.DB_PATH;
  });

  // ── Schema ──

  it('getDb() creates all required tables', () => {
    const database = db.getDb();
    const tables = database
      .prepare("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name")
      .all() as { name: string }[];
    const tableNames = tables.map((t) => t.name);
    expect(tableNames).toContain('news_items');
    expect(tableNames).toContain('content');
    expect(tableNames).toContain('content_sources');
    expect(tableNames).toContain('keywords');
    expect(tableNames).toContain('topic_clusters');
    expect(tableNames).toContain('subscribers');
  });

  // ── News Items ──

  it('insertNewsItem inserts and returns ID', () => {
    const id = db.insertNewsItem({
      title: 'Test news',
      url: 'https://example.com/test',
      source: 'test',
      source_tier: 1,
      summary: 'A test item',
      score: 80,
      engagement_likes: 10,
      engagement_retweets: 5,
      engagement_downloads: 0,
    });
    expect(id).toBeTypeOf('number');
    expect(id).toBeGreaterThan(0);
  });

  it('insertNewsItem returns null for duplicate URL', () => {
    const item = {
      title: 'Test news',
      url: 'https://example.com/dup',
      source: 'test',
      source_tier: 1,
      summary: null,
      score: 50,
      engagement_likes: 0,
      engagement_retweets: 0,
      engagement_downloads: 0,
    };
    const first = db.insertNewsItem(item);
    expect(first).not.toBeNull();
    const second = db.insertNewsItem(item);
    expect(second).toBeNull();
  });

  it('insertNewsItems batch inserts and returns count', () => {
    const items = [
      { title: 'Item 1', url: 'https://a.com/1', source: 'test', source_tier: 1, summary: null, score: 50, engagement_likes: 0, engagement_retweets: 0, engagement_downloads: 0 },
      { title: 'Item 2', url: 'https://a.com/2', source: 'test', source_tier: 2, summary: null, score: 60, engagement_likes: 0, engagement_retweets: 0, engagement_downloads: 0 },
      { title: 'Item 3', url: 'https://a.com/3', source: 'test', source_tier: 3, summary: null, score: 70, engagement_likes: 0, engagement_retweets: 0, engagement_downloads: 0 },
    ];
    const count = db.insertNewsItems(items);
    expect(count).toBe(3);
  });

  it('getRecentNewsItems returns items within timeframe', () => {
    db.insertNewsItem({
      title: 'Recent item',
      url: 'https://example.com/recent',
      source: 'test',
      source_tier: 1,
      summary: null,
      score: 90,
      engagement_likes: 0,
      engagement_retweets: 0,
      engagement_downloads: 0,
    });
    const items = db.getRecentNewsItems(72);
    expect(items.length).toBeGreaterThanOrEqual(1);
    expect(items[0].title).toBe('Recent item');
  });

  // ── Content ──

  it('upsertContent inserts new record', () => {
    const id = db.upsertContent({
      type: 'newsletter',
      slug: '2026-01-15',
      lang: 'en',
      title: 'Test Newsletter',
      body_markdown: '# Test',
      meta_json: null,
    });
    expect(id).toBeGreaterThan(0);
  });

  it('upsertContent updates existing record', () => {
    db.upsertContent({
      type: 'blog',
      slug: 'test-post',
      lang: 'en',
      title: 'Original Title',
      body_markdown: '# Original',
      meta_json: null,
    });
    const id2 = db.upsertContent({
      type: 'blog',
      slug: 'test-post',
      lang: 'en',
      title: 'Updated Title',
      body_markdown: '# Updated',
      meta_json: null,
    });
    expect(id2).toBeGreaterThan(0);

    const database = db.getDb();
    const row = database.prepare("SELECT title FROM content WHERE slug='test-post'").get() as { title: string };
    expect(row.title).toBe('Updated Title');
  });

  // ── Content Sources ──

  it('linkContentSources creates junction records', () => {
    const newsId = db.insertNewsItem({
      title: 'Source item',
      url: 'https://example.com/src',
      source: 'test',
      source_tier: 1,
      summary: null,
      score: 50,
      engagement_likes: 0,
      engagement_retweets: 0,
      engagement_downloads: 0,
    });
    const contentId = db.upsertContent({
      type: 'newsletter',
      slug: '2026-01-15',
      lang: 'en',
      title: 'Test',
      body_markdown: '# Test',
      meta_json: null,
    });
    db.linkContentSources(contentId, [newsId!]);

    const database = db.getDb();
    const rows = database.prepare('SELECT * FROM content_sources WHERE content_id = ?').all(contentId);
    expect(rows).toHaveLength(1);
  });

  // ── Subscribers ──

  it('addSubscriber returns true for new email', () => {
    const result = db.addSubscriber('test@example.com');
    expect(result).toBe(true);
  });

  it('addSubscriber returns true for duplicate (INSERT OR IGNORE)', () => {
    db.addSubscriber('dup@example.com');
    const result = db.addSubscriber('dup@example.com');
    expect(result).toBe(true);
  });

  it('getSubscriberCount returns correct count', () => {
    db.addSubscriber('a@test.com');
    db.addSubscriber('b@test.com');
    db.addSubscriber('c@test.com');
    expect(db.getSubscriberCount()).toBe(3);
  });

  // ── Topic Clusters ──

  it('upsertTopicCluster inserts and updates', () => {
    db.upsertTopicCluster('llm', 'Large Language Models');
    db.upsertTopicCluster('llm', 'Large Language Models');

    const database = db.getDb();
    const row = database.prepare("SELECT mention_count FROM topic_clusters WHERE slug='llm'").get() as { mention_count: number };
    expect(row.mention_count).toBe(2);
  });

  // ── Keywords ──

  it('upsertKeyword inserts and updates', () => {
    db.upsertKeyword('transformer', 'brave');
    db.upsertKeyword('transformer', 'reddit', 'llm');

    const database = db.getDb();
    const row = database.prepare("SELECT cluster_slug FROM keywords WHERE keyword='transformer'").get() as { cluster_slug: string };
    expect(row.cluster_slug).toBe('llm');
  });
});
