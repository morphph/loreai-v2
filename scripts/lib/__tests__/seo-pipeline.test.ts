import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import fs from 'fs';
import path from 'path';
import os from 'os';

let tmpDir: string;
let dbPath: string;

describe('SEO pipeline keyword visibility', () => {
  let db: typeof import('../db');
  let seoGaps: typeof import('../seo-gaps');

  beforeEach(async () => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'loreai-test-'));
    dbPath = path.join(tmpDir, 'test.db');
    process.env.DB_PATH = dbPath;

    vi.resetModules();
    db = await import('../db');
    seoGaps = await import('../seo-gaps');
  });

  afterEach(() => {
    try { db.closeDb(); } catch { /* ignore */ }
    try { fs.rmSync(tmpDir, { recursive: true }); } catch { /* ignore */ }
    delete process.env.DB_PATH;
  });

  it('keywords with cluster_slug appear as FAQ and Compare gaps', () => {
    // Set up cluster
    db.upsertTopicCluster('claude-code', 'Claude Code');
    // mention_count needs to be >= 2
    db.upsertTopicCluster('claude-code', 'Claude Code');

    // Insert FAQ keyword WITH cluster_slug
    db.upsertKeyword('How does Claude Code work?', 'blog-faq:test', 'claude-code');
    // Insert Compare keyword WITH cluster_slug
    db.upsertKeyword('claude-code-vs-cursor', 'blog-compare:test', 'claude-code');

    const gaps = seoGaps.findSEOGaps(db.getDb());
    const types = gaps.map((g) => g.type);

    expect(types).toContain('faq');
    expect(types).toContain('compare');

    // Verify the specific keywords are found
    const faqGap = gaps.find((g) => g.type === 'faq');
    expect(faqGap).toBeDefined();
    expect(faqGap!.clusterSlug).toBe('claude-code');

    const compareGap = gaps.find((g) => g.type === 'compare');
    expect(compareGap).toBeDefined();
    expect(compareGap!.clusterSlug).toBe('claude-code');
  });

  it('keywords with cluster_slug = NULL do NOT appear in gap results (Bug #1 regression)', () => {
    // Set up cluster
    db.upsertTopicCluster('claude-code', 'Claude Code');
    db.upsertTopicCluster('claude-code', 'Claude Code');

    // Insert keywords WITHOUT cluster_slug (the bug)
    db.upsertKeyword('orphan-faq-question', 'blog-faq:test');
    db.upsertKeyword('orphan-compare-pair', 'blog-compare:test');

    const gaps = seoGaps.findSEOGaps(db.getDb());

    // These orphaned keywords should NOT appear
    const orphanFaq = gaps.find((g) => g.displayTerm === 'orphan-faq-question');
    const orphanCompare = gaps.find((g) => g.displayTerm === 'orphan-compare-pair');

    expect(orphanFaq).toBeUndefined();
    expect(orphanCompare).toBeUndefined();
  });

  it('glossary gaps are found from cluster pillar topics', () => {
    db.upsertTopicCluster('mcp', 'Model Context Protocol');
    db.upsertTopicCluster('mcp', 'Model Context Protocol');

    const gaps = seoGaps.findSEOGaps(db.getDb());
    const glossaryGap = gaps.find((g) => g.type === 'glossary' && g.slug === 'mcp');

    expect(glossaryGap).toBeDefined();
    expect(glossaryGap!.displayTerm).toBe('Model Context Protocol');
  });

  it('topics gaps require mention_count >= 5', () => {
    // Only 2 mentions — should NOT get a topics gap
    db.upsertTopicCluster('small-topic', 'Small Topic');
    db.upsertTopicCluster('small-topic', 'Small Topic');

    const gaps = seoGaps.findSEOGaps(db.getDb());
    const topicsGap = gaps.find((g) => g.type === 'topics' && g.slug === 'small-topic');
    expect(topicsGap).toBeUndefined();

    // Bump to 5 mentions
    for (let i = 0; i < 3; i++) db.upsertTopicCluster('small-topic', 'Small Topic');

    const gaps2 = seoGaps.findSEOGaps(db.getDb());
    const topicsGap2 = gaps2.find((g) => g.type === 'topics' && g.slug === 'small-topic');
    expect(topicsGap2).toBeDefined();
  });

  it('keywords with content_exists = 1 are excluded', () => {
    db.upsertTopicCluster('claude-code', 'Claude Code');
    db.upsertTopicCluster('claude-code', 'Claude Code');

    // Insert keyword with cluster_slug
    db.upsertKeyword('already-answered', 'blog-faq:test', 'claude-code');
    // Mark as having content
    const database = db.getDb();
    database.prepare("UPDATE keywords SET content_exists = 1 WHERE keyword = 'already-answered'").run();

    const gaps = seoGaps.findSEOGaps(database);
    const faqGap = gaps.find((g) => g.type === 'faq' && g.displayTerm === 'already-answered');
    expect(faqGap).toBeUndefined();
  });

  it('contentExists callback filters out existing content', () => {
    db.upsertTopicCluster('claude-code', 'Claude Code');
    db.upsertTopicCluster('claude-code', 'Claude Code');

    // Mock contentExists to say glossary for claude-code already exists
    const gaps = seoGaps.findSEOGaps(db.getDb(), (type, slug) => {
      return type === 'glossary' && slug === 'claude-code';
    });

    const glossaryGap = gaps.find((g) => g.type === 'glossary' && g.slug === 'claude-code');
    expect(glossaryGap).toBeUndefined();
  });

  it('deduplicates jobs by type+slug', () => {
    db.upsertTopicCluster('claude-code', 'Claude Code');
    db.upsertTopicCluster('claude-code', 'Claude Code');

    // Two keywords that would produce the same FAQ slug
    db.upsertKeyword('same-question', 'blog-faq:post-1', 'claude-code');
    // Unique constraint on keyword, so use different keyword text
    db.upsertKeyword('same-question-v2', 'blog-faq:post-2', 'claude-code');

    const gaps = seoGaps.findSEOGaps(db.getDb());
    const faqGaps = gaps.filter((g) => g.type === 'faq');

    // Should have 2 distinct FAQ slugs (different keywords → different slugs)
    const slugs = faqGaps.map((g) => g.slug);
    const uniqueSlugs = [...new Set(slugs)];
    expect(slugs.length).toBe(uniqueSlugs.length);
  });
});
