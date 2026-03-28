/**
 * Unit tests for resolveSubtopics() — the single entry point for subtopic loading.
 *
 * Tests flagship-aware path (prefers materialized pack rows) and legacy fallback
 * (prefix matching for non-flagship or pre-materialization).
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import fs from 'fs';
import path from 'path';
import os from 'os';

let tmpDir: string;
let dbPath: string;

describe('resolveSubtopics', () => {
  let db: typeof import('../lib/db');

  beforeEach(async () => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'loreai-resolve-test-'));
    dbPath = path.join(tmpDir, 'test.db');
    process.env.DB_PATH = dbPath;

    vi.resetModules();
    db = await import('../lib/db');
    // Force schema init
    db.getDb();
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

  it('returns flagship-materialized rows when they exist', () => {
    const d = db.getDb();
    d.prepare(
      `INSERT INTO topic_clusters (slug, pillar_topic, mention_count, source, flagship_topic_slug)
       VALUES (?, ?, ?, ?, ?)`,
    ).run('claude-code', 'Claude Code', 100, 'flagship_discovery', 'claude-code');
    d.prepare(
      `INSERT INTO topic_clusters (slug, pillar_topic, mention_count, source, flagship_topic_slug, description)
       VALUES (?, ?, ?, ?, ?, ?)`,
    ).run('claude-code-hooks', 'Hooks', 100, 'flagship_discovery', 'claude-code', 'Lifecycle hooks');
    d.prepare(
      `INSERT INTO topic_clusters (slug, pillar_topic, mention_count, source, flagship_topic_slug)
       VALUES (?, ?, ?, ?, ?)`,
    ).run('claude-code-mcp', 'MCP Servers', 100, 'flagship_discovery', 'claude-code');

    // Also seed an entity-extracted row with matching prefix (should NOT be returned)
    d.prepare(
      `INSERT INTO topic_clusters (slug, pillar_topic, mention_count, source)
       VALUES (?, ?, ?, ?)`,
    ).run('claude-code-stale', 'Stale Entity', 5, 'entity_extract');

    const rows = db.resolveSubtopics('claude-code');

    // Should return only flagship rows (3), not the entity row
    expect(rows).toHaveLength(3);
    expect(rows.every((r) => r.source === 'flagship_discovery')).toBe(true);
    expect(rows.map((r) => r.slug)).toContain('claude-code-hooks');
    expect(rows.map((r) => r.slug)).toContain('claude-code-mcp');
    expect(rows.map((r) => r.slug)).not.toContain('claude-code-stale');
  });

  it('falls back to prefix matching for non-flagship topics', () => {
    const d = db.getDb();
    d.prepare(
      `INSERT INTO topic_clusters (slug, pillar_topic, mention_count, source)
       VALUES (?, ?, ?, ?)`,
    ).run('openai-gpt', 'OpenAI GPT', 10, 'entity_extract');
    d.prepare(
      `INSERT INTO topic_clusters (slug, pillar_topic, mention_count, source)
       VALUES (?, ?, ?, ?)`,
    ).run('openai-gpt-pricing', 'OpenAI GPT Pricing', 3, 'entity_extract');

    const rows = db.resolveSubtopics('openai-gpt');

    expect(rows).toHaveLength(2);
    expect(rows.map((r) => r.slug).sort()).toEqual(['openai-gpt', 'openai-gpt-pricing']);
  });

  it('returns empty array when no matching rows exist', () => {
    const rows = db.resolveSubtopics('nonexistent-topic');
    expect(rows).toHaveLength(0);
  });

  it('falls back to prefix matching if flagship rows have not been materialized yet', () => {
    const d = db.getDb();
    d.prepare(
      `INSERT INTO topic_clusters (slug, pillar_topic, mention_count, source)
       VALUES (?, ?, ?, ?)`,
    ).run('claude-code', 'Claude Code', 50, 'entity_extract');
    d.prepare(
      `INSERT INTO topic_clusters (slug, pillar_topic, mention_count, source)
       VALUES (?, ?, ?, ?)`,
    ).run('claude-code-pricing', 'Claude Code Pricing', 8, 'entity_extract');

    const rows = db.resolveSubtopics('claude-code');

    // Should fall back to prefix matching
    expect(rows).toHaveLength(2);
    expect(rows[0].source).toBe('entity_extract');
  });

  it('returns rows ordered by mention_count DESC', () => {
    const d = db.getDb();
    d.prepare(
      `INSERT INTO topic_clusters (slug, pillar_topic, mention_count, source, flagship_topic_slug)
       VALUES (?, ?, ?, ?, ?)`,
    ).run('test-topic-a', 'A', 50, 'flagship_discovery', 'test-topic');
    d.prepare(
      `INSERT INTO topic_clusters (slug, pillar_topic, mention_count, source, flagship_topic_slug)
       VALUES (?, ?, ?, ?, ?)`,
    ).run('test-topic-b', 'B', 200, 'flagship_discovery', 'test-topic');

    const rows = db.resolveSubtopics('test-topic');

    expect(rows[0].slug).toBe('test-topic-b');
    expect(rows[1].slug).toBe('test-topic-a');
  });

  it('includes enriched metadata columns for flagship rows', () => {
    const d = db.getDb();
    d.prepare(
      `INSERT INTO topic_clusters (
         slug, pillar_topic, mention_count, source, flagship_topic_slug,
         description, aliases_json, freshness_sensitivity,
         page_type_hints_json, seed_keywords_json, evidence_type, pack_version
       ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    ).run(
      'claude-code-hooks',
      'Hooks',
      100,
      'flagship_discovery',
      'claude-code',
      'Lifecycle hooks for Claude Code',
      JSON.stringify(['cc hooks', 'claude hooks']),
      'high',
      JSON.stringify(['faq', 'blog']),
      JSON.stringify(['claude code hooks']),
      'official_doc',
      1,
    );

    const rows = db.resolveSubtopics('claude-code');

    expect(rows).toHaveLength(1);
    const row = rows[0];
    expect(row.description).toBe('Lifecycle hooks for Claude Code');
    expect(JSON.parse(row.aliases_json!)).toEqual(['cc hooks', 'claude hooks']);
    expect(row.freshness_sensitivity).toBe('high');
    expect(JSON.parse(row.page_type_hints_json!)).toEqual(['faq', 'blog']);
    expect(JSON.parse(row.seed_keywords_json!)).toEqual(['claude code hooks']);
    expect(row.evidence_type).toBe('official_doc');
    expect(row.pack_version).toBe(1);
  });
});
