import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import fs from 'fs';
import path from 'path';
import os from 'os';

let tmpDir: string;
let dbPath: string;

describe('seo-extract', () => {
  let seoExtract: typeof import('../seo-extract');
  let db: typeof import('../db');

  beforeEach(async () => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'loreai-test-'));
    dbPath = path.join(tmpDir, 'test.db');
    process.env.DB_PATH = dbPath;

    vi.resetModules();
    db = await import('../db');
    seoExtract = await import('../seo-extract');
  });

  afterEach(() => {
    try { db.closeDb(); } catch { /* ignore */ }
    try { fs.rmSync(tmpDir, { recursive: true }); } catch { /* ignore */ }
    delete process.env.DB_PATH;
  });

  describe('findBestClusterSlug', () => {
    it('returns exact match when cluster slug matches', () => {
      db.upsertTopicCluster('claude-code', 'Claude Code');
      expect(seoExtract.findBestClusterSlug('Claude Code')).toBe('claude-code');
    });

    it('returns substring match', () => {
      db.upsertTopicCluster('claude', 'Claude');
      expect(seoExtract.findBestClusterSlug('Claude Code Extensions')).toBe('claude');
    });

    it('prefers longer slug match (more specific)', () => {
      db.upsertTopicCluster('claude', 'Claude');
      db.upsertTopicCluster('claude-code', 'Claude Code');
      expect(seoExtract.findBestClusterSlug('Claude Code Extensions')).toBe('claude-code');
    });

    it('returns null when no clusters match', () => {
      db.upsertTopicCluster('openai', 'OpenAI');
      expect(seoExtract.findBestClusterSlug('Gemini API')).toBeNull();
    });

    it('returns null when no clusters exist', () => {
      expect(seoExtract.findBestClusterSlug('Anything')).toBeNull();
    });
  });

  describe('saveSEOEntities', () => {
    it('saves FAQ keywords with cluster_slug', () => {
      db.upsertTopicCluster('claude-code', 'Claude Code');

      seoExtract.saveSEOEntities(
        {
          glossary_terms: ['mcp-server'],
          faq_questions: ['What is Claude Code?'],
          comparison_pairs: ['claude-code-vs-cursor'],
        },
        'test-blog-slug',
        'Claude Code'
      );

      const database = db.getDb();

      // FAQ keyword should have cluster_slug
      const faqRow = database.prepare(
        "SELECT cluster_slug, source FROM keywords WHERE source LIKE 'blog-faq:%'"
      ).get() as { cluster_slug: string; source: string };
      expect(faqRow.cluster_slug).toBe('claude-code');

      // Compare keyword should have cluster_slug
      const compareRow = database.prepare(
        "SELECT cluster_slug, source FROM keywords WHERE source LIKE 'blog-compare:%'"
      ).get() as { cluster_slug: string; source: string };
      expect(compareRow.cluster_slug).toBe('claude-code');
    });

    it('uses slug as fallback cluster_slug when no cluster matches', () => {
      seoExtract.saveSEOEntities(
        {
          glossary_terms: [],
          faq_questions: ['How does it work?'],
          comparison_pairs: [],
        },
        'unknown-topic-slug'
      );

      const database = db.getDb();
      const row = database.prepare(
        "SELECT cluster_slug FROM keywords WHERE source LIKE 'blog-faq:%'"
      ).get() as { cluster_slug: string };
      expect(row.cluster_slug).toBe('unknown-topic-slug');
    });
  });
});
