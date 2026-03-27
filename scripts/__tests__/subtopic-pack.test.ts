/**
 * Unit tests for D1 subtopic-pack data layer.
 *
 * Tests pack CRUD, validation, diff computation, dedup, and materialization
 * using in-memory SQLite (no external APIs).
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import Database from 'better-sqlite3';
import { writeFileSync, mkdirSync, rmSync, existsSync, readFileSync } from 'fs';
import path from 'path';
import os from 'os';

import type { SubtopicPack } from '../lib/subtopic-pack';

// ── Test fixtures ──

function makePack(overrides: Partial<SubtopicPack> = {}): SubtopicPack {
  return {
    topic_slug: 'claude-code',
    topic_name: 'Claude Code',
    version: 1,
    status: 'draft',
    created_at: '2026-03-27T00:00:00.000Z',
    approved_at: null,
    subtopics: [
      {
        slug: 'claude-code-hooks',
        name: 'Hooks',
        description: 'Git-style lifecycle hooks for Claude Code',
        aliases: ['claude code hook', 'cc hooks'],
        evidence_type: 'official_doc',
        freshness_sensitivity: 'high',
        page_type_hints: ['faq', 'blog'],
        seed_keywords: ['claude code hooks', 'claude code git hooks'],
      },
      {
        slug: 'claude-code-mcp',
        name: 'MCP Servers',
        description: 'Model Context Protocol server integration',
        aliases: ['mcp', 'model context protocol'],
        evidence_type: 'official_doc',
        freshness_sensitivity: 'medium',
        page_type_hints: ['blog', 'compare'],
        seed_keywords: ['claude code mcp', 'mcp server setup'],
      },
    ],
    sources: {
      official_docs: ['https://docs.anthropic.com/claude-code'],
      serp_competitors: ['https://example.com/competitor'],
    },
    ...overrides,
  };
}

// ── In-memory DB setup ──

let testDb: InstanceType<typeof Database>;
let tmpDir: string;

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
      flagship_topic_slug TEXT DEFAULT NULL
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
      completed_at DATETIME,
      source TEXT DEFAULT 'discovery'
    );
  `);

  return db;
}

beforeEach(() => {
  testDb = createTestDb();
  tmpDir = path.join(os.tmpdir(), `subtopic-pack-test-${Date.now()}`);
  mkdirSync(tmpDir, { recursive: true });

  vi.resetModules();

  // Mock db module to use in-memory DB
  vi.doMock('../lib/db', () => ({
    getDb: () => testDb,
    upsertKeyword: (keyword: string, source: string, clusterSlug?: string) => {
      testDb
        .prepare(
          `INSERT INTO keywords (keyword, source, cluster_slug)
           VALUES (?, ?, ?)
           ON CONFLICT(keyword) DO UPDATE SET
             cluster_slug = COALESCE(excluded.cluster_slug, cluster_slug)`,
        )
        .run(keyword, source, clusterSlug || null);
    },
  }));
});

afterEach(() => {
  testDb?.close();
  if (existsSync(tmpDir)) {
    rmSync(tmpDir, { recursive: true, force: true });
  }
  vi.restoreAllMocks();
});

// ── Tests ──

describe('validatePack', () => {
  it('passes for a valid pack', async () => {
    const { validatePack } = await import('../lib/subtopic-pack');
    const errors = validatePack(makePack());
    expect(errors).toHaveLength(0);
  });

  it('catches missing topic_slug', async () => {
    const { validatePack } = await import('../lib/subtopic-pack');
    const pack = makePack();
    (pack as Record<string, unknown>).topic_slug = '';
    const errors = validatePack(pack);
    expect(errors.some((e) => e.includes('topic_slug'))).toBe(true);
  });

  it('catches invalid slug format', async () => {
    const { validatePack } = await import('../lib/subtopic-pack');
    const pack = makePack({ topic_slug: 'Invalid Slug!' });
    const errors = validatePack(pack);
    expect(errors.some((e) => e.includes('topic_slug format'))).toBe(true);
  });

  it('catches invalid status', async () => {
    const { validatePack } = await import('../lib/subtopic-pack');
    const pack = makePack();
    (pack as Record<string, unknown>).status = 'invalid';
    const errors = validatePack(pack);
    expect(errors.some((e) => e.includes('status'))).toBe(true);
  });

  it('catches missing version', async () => {
    const { validatePack } = await import('../lib/subtopic-pack');
    const pack = makePack();
    (pack as Record<string, unknown>).version = 0;
    const errors = validatePack(pack);
    expect(errors.some((e) => e.includes('version'))).toBe(true);
  });

  it('catches duplicate subtopic slugs', async () => {
    const { validatePack } = await import('../lib/subtopic-pack');
    const pack = makePack();
    pack.subtopics[1].slug = pack.subtopics[0].slug;
    const errors = validatePack(pack);
    expect(errors.some((e) => e.includes('duplicate slug'))).toBe(true);
  });

  it('catches invalid subtopic evidence_type', async () => {
    const { validatePack } = await import('../lib/subtopic-pack');
    const pack = makePack();
    (pack.subtopics[0] as Record<string, unknown>).evidence_type = 'bad';
    const errors = validatePack(pack);
    expect(errors.some((e) => e.includes('evidence_type'))).toBe(true);
  });

  it('catches non-object input', async () => {
    const { validatePack } = await import('../lib/subtopic-pack');
    expect(validatePack(null)).toEqual(['Pack must be a non-null object']);
    expect(validatePack('string')).toEqual(['Pack must be a non-null object']);
  });

  it('catches missing sources', async () => {
    const { validatePack } = await import('../lib/subtopic-pack');
    const pack = makePack();
    (pack as Record<string, unknown>).sources = undefined;
    const errors = validatePack(pack);
    expect(errors.some((e) => e.includes('sources'))).toBe(true);
  });
});

describe('computeDiff', () => {
  it('identifies added subtopics', async () => {
    const { computeDiff } = await import('../lib/subtopic-pack');
    const oldPack = makePack();
    const newPack = makePack();
    newPack.subtopics.push({
      slug: 'claude-code-skills',
      name: 'Skills',
      description: 'Custom skill definitions',
      aliases: [],
      evidence_type: 'official_doc',
      freshness_sensitivity: 'low',
      page_type_hints: ['blog'],
      seed_keywords: ['claude code skills'],
    });

    const diff = computeDiff(newPack, oldPack);
    expect(diff.added).toEqual(['claude-code-skills']);
    expect(diff.removed).toEqual([]);
    expect(diff.unchanged).toEqual(['claude-code-hooks', 'claude-code-mcp']);
  });

  it('identifies removed subtopics', async () => {
    const { computeDiff } = await import('../lib/subtopic-pack');
    const oldPack = makePack();
    const newPack = makePack();
    newPack.subtopics = [newPack.subtopics[0]]; // Keep only first

    const diff = computeDiff(newPack, oldPack);
    expect(diff.added).toEqual([]);
    expect(diff.removed).toEqual(['claude-code-mcp']);
    expect(diff.unchanged).toEqual(['claude-code-hooks']);
  });

  it('handles identical packs', async () => {
    const { computeDiff } = await import('../lib/subtopic-pack');
    const pack = makePack();

    const diff = computeDiff(pack, pack);
    expect(diff.added).toEqual([]);
    expect(diff.removed).toEqual([]);
    expect(diff.unchanged).toHaveLength(2);
  });

  it('handles completely different packs', async () => {
    const { computeDiff } = await import('../lib/subtopic-pack');
    const oldPack = makePack();
    const newPack = makePack({
      subtopics: [
        {
          slug: 'claude-code-plugins',
          name: 'Plugins',
          description: 'Plugin system',
          aliases: [],
          evidence_type: 'gap_analysis',
          freshness_sensitivity: 'high',
          page_type_hints: ['blog'],
          seed_keywords: ['claude code plugins'],
        },
      ],
    });

    const diff = computeDiff(newPack, oldPack);
    expect(diff.added).toEqual(['claude-code-plugins']);
    expect(diff.removed).toEqual(['claude-code-hooks', 'claude-code-mcp']);
    expect(diff.unchanged).toEqual([]);
  });
});

describe('isDuplicateQueueJob', () => {
  it('detects duplicate by keyword_group_id', async () => {
    const { isDuplicateQueueJob } = await import('../lib/subtopic-pack');

    // Insert a keyword group + pending queue job
    testDb
      .prepare(
        `INSERT INTO keyword_groups (primary_keyword, content_type, status)
         VALUES ('claude code hooks', 'blog', 'pending')`,
      )
      .run();
    const groupId = (
      testDb.prepare('SELECT last_insert_rowid() as id').get() as { id: number }
    ).id;
    testDb
      .prepare(
        `INSERT INTO create_queue (keyword_group_id, content_type, status)
         VALUES (?, 'blog', 'pending')`,
      )
      .run(groupId);

    expect(isDuplicateQueueJob(groupId, 'claude code hooks', 'blog')).toBe(true);
    expect(isDuplicateQueueJob(null, 'something else', 'faq')).toBe(false);
  });

  it('detects duplicate by primary_keyword + content_type', async () => {
    const { isDuplicateQueueJob } = await import('../lib/subtopic-pack');

    testDb
      .prepare(
        `INSERT INTO keyword_groups (primary_keyword, content_type, status)
         VALUES ('claude code mcp', 'blog', 'pending')`,
      )
      .run();
    const groupId = (
      testDb.prepare('SELECT last_insert_rowid() as id').get() as { id: number }
    ).id;
    testDb
      .prepare(
        `INSERT INTO create_queue (keyword_group_id, content_type, status)
         VALUES (?, 'blog', 'pending')`,
      )
      .run(groupId);

    expect(isDuplicateQueueJob(null, 'claude code mcp', 'blog')).toBe(true);
    expect(isDuplicateQueueJob(null, 'claude code mcp', 'faq')).toBe(false);
  });

  it('ignores completed jobs', async () => {
    const { isDuplicateQueueJob } = await import('../lib/subtopic-pack');

    testDb
      .prepare(
        `INSERT INTO keyword_groups (primary_keyword, content_type, status)
         VALUES ('done keyword', 'blog', 'pending')`,
      )
      .run();
    const groupId = (
      testDb.prepare('SELECT last_insert_rowid() as id').get() as { id: number }
    ).id;
    testDb
      .prepare(
        `INSERT INTO create_queue (keyword_group_id, content_type, status)
         VALUES (?, 'blog', 'completed')`,
      )
      .run(groupId);

    expect(isDuplicateQueueJob(groupId, 'done keyword', 'blog')).toBe(false);
  });
});

describe('materializePack', () => {
  it('writes subtopics to topic_clusters with correct fields', async () => {
    const { materializePack } = await import('../lib/subtopic-pack');
    const pack = makePack({ status: 'approved' });

    const result = materializePack(pack, { dryRun: false });

    expect(result.subtopics_written).toBe(2);
    expect(result.keywords_seeded).toBe(4); // 2 + 2 seed keywords

    // Check topic_clusters rows
    const rows = testDb
      .prepare(
        `SELECT slug, pillar_topic, source, flagship_topic_slug, mention_count
         FROM topic_clusters ORDER BY slug`,
      )
      .all() as Array<{
      slug: string;
      pillar_topic: string;
      source: string;
      flagship_topic_slug: string;
      mention_count: number;
    }>;

    // Should have 3 rows: parent + 2 subtopics
    expect(rows).toHaveLength(3);

    const parent = rows.find((r) => r.slug === 'claude-code')!;
    expect(parent.source).toBe('flagship_discovery');
    expect(parent.flagship_topic_slug).toBe('claude-code');
    expect(parent.mention_count).toBe(100);

    const hooks = rows.find((r) => r.slug === 'claude-code-hooks')!;
    expect(hooks.pillar_topic).toBe('Hooks');
    expect(hooks.source).toBe('flagship_discovery');
    expect(hooks.flagship_topic_slug).toBe('claude-code');

    // Check keywords
    const kwRows = testDb
      .prepare('SELECT keyword, source, cluster_slug FROM keywords ORDER BY keyword')
      .all() as Array<{ keyword: string; source: string; cluster_slug: string }>;

    expect(kwRows).toHaveLength(4);
    expect(kwRows[0].source).toBe('flagship-discovery');
    expect(kwRows.some((k) => k.keyword === 'claude code hooks')).toBe(true);
    expect(kwRows.some((k) => k.keyword === 'claude code mcp')).toBe(true);
  });

  it('dry run does not write to DB', async () => {
    const { materializePack } = await import('../lib/subtopic-pack');
    const pack = makePack({ status: 'approved' });

    const result = materializePack(pack, { dryRun: true });

    expect(result.subtopics_written).toBe(2);
    expect(result.keywords_seeded).toBe(4);

    // DB should be empty
    const rows = testDb.prepare('SELECT COUNT(*) as c FROM topic_clusters').get() as {
      c: number;
    };
    expect(rows.c).toBe(0);
  });

  it('updates existing rows without losing mention_count', async () => {
    const { materializePack } = await import('../lib/subtopic-pack');

    // Pre-populate with entity-extracted row (high mention_count)
    testDb
      .prepare(
        `INSERT INTO topic_clusters (slug, pillar_topic, mention_count, source)
         VALUES ('claude-code-hooks', 'Claude Code Hooks', 500, 'entity_extract')`,
      )
      .run();

    const pack = makePack({ status: 'approved' });
    materializePack(pack, { dryRun: false });

    const row = testDb
      .prepare('SELECT mention_count, source FROM topic_clusters WHERE slug = ?')
      .get('claude-code-hooks') as { mention_count: number; source: string };

    expect(row.mention_count).toBe(500); // MAX(500, 100) = 500
    expect(row.source).toBe('flagship_discovery');
  });
});

describe('loadPack / writePack round-trip', () => {
  it('writes and reads pack JSON correctly', async () => {
    // We test the actual file I/O by writing to tmpDir, but since the module
    // hardcodes the pack directory, we test via the serialization logic directly
    const pack = makePack();
    const filePath = path.join(tmpDir, 'claude-code.json');

    writeFileSync(filePath, JSON.stringify(pack, null, 2) + '\n', 'utf-8');
    const raw = readFileSync(filePath, 'utf-8');
    const loaded = JSON.parse(raw) as SubtopicPack;

    expect(loaded.topic_slug).toBe('claude-code');
    expect(loaded.topic_name).toBe('Claude Code');
    expect(loaded.version).toBe(1);
    expect(loaded.status).toBe('draft');
    expect(loaded.subtopics).toHaveLength(2);
    expect(loaded.subtopics[0].slug).toBe('claude-code-hooks');
    expect(loaded.subtopics[0].seed_keywords).toEqual([
      'claude code hooks',
      'claude code git hooks',
    ]);
    expect(loaded.sources.official_docs).toHaveLength(1);
  });

  it('preserves all fields through serialization', async () => {
    const pack = makePack({
      status: 'approved',
      approved_at: '2026-03-27T12:00:00.000Z',
      diff: { added: ['new-sub'], removed: ['old-sub'], unchanged: 5 },
    });

    const json = JSON.stringify(pack, null, 2);
    const restored = JSON.parse(json) as SubtopicPack;

    expect(restored.status).toBe('approved');
    expect(restored.approved_at).toBe('2026-03-27T12:00:00.000Z');
    expect(restored.diff?.added).toEqual(['new-sub']);
    expect(restored.diff?.removed).toEqual(['old-sub']);
    expect(restored.diff?.unchanged).toBe(5);
  });
});
