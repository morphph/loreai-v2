import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs';
import path from 'path';
import os from 'os';

// We need to override process.cwd() for tests, so we use a helper approach
let tmpDir: string;
let origCwd: () => string;

function writeClusterJson(filename: string, data: Record<string, unknown>): void {
  const dir = path.join(tmpDir, 'data', 'flagship-clusters');
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, filename), JSON.stringify(data, null, 2));
}

function writeContentFile(relativePath: string, content: string, mtime?: Date): void {
  const fullPath = path.join(tmpDir, relativePath);
  fs.mkdirSync(path.dirname(fullPath), { recursive: true });
  fs.writeFileSync(fullPath, content);
  if (mtime) {
    fs.utimesSync(fullPath, mtime, mtime);
  }
}

describe('cluster-changes', () => {
  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'cluster-changes-test-'));
    origCwd = process.cwd;
    process.cwd = () => tmpDir;
  });

  afterEach(() => {
    process.cwd = origCwd;
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  // Dynamic import to pick up the cwd override
  async function loadModule() {
    // Clear module cache to get fresh cwd
    const modulePath = path.resolve(__dirname, '../cluster-changes.ts');
    // vitest handles this via dynamic import
    return await import(modulePath);
  }

  it('returns empty array when no cluster changes exist', async () => {
    // Create a cluster with targets whose files are old
    writeClusterJson('test-cluster.json', {
      topic_slug: 'test-cluster',
      pillar_topic: 'Test Cluster',
      cornerstone: { slug: 'test-guide', status: 'exists' },
      target_compare: [
        { slug: 'a-vs-b', item_a: 'A', item_b: 'B', status: 'exists' },
      ],
      target_faq: [],
      target_glossary: [],
      tracked_blogs: [],
    });

    // Create content files with old mtime (2025-01-01)
    const oldDate = new Date('2025-01-01T12:00:00Z');
    writeContentFile('content/compare/a-vs-b/en.md', '---\ntitle: A vs B\n---\n', oldDate);
    writeContentFile('content/blog/en/test-guide.md', '---\ntitle: Test Guide\ndate: 2025-01-01\n---\n', oldDate);

    const { getClusterChanges } = await loadModule();
    const changes = getClusterChanges('2026-03-10', '2026-03-17');
    expect(changes).toEqual([]);
  });

  it('detects newly created compare page by mtime', async () => {
    writeClusterJson('test-cluster.json', {
      topic_slug: 'test-cluster',
      pillar_topic: 'Test Cluster',
      target_compare: [
        { slug: 'x-vs-y', item_a: 'X', item_b: 'Y', status: 'exists' },
      ],
      target_faq: [],
      target_glossary: [],
      tracked_blogs: [],
    });

    // Create content file with mtime within range
    const recentDate = new Date('2026-03-15T10:00:00Z');
    writeContentFile('content/compare/x-vs-y/en.md', '---\ntitle: X vs Y\n---\n', recentDate);

    const { getClusterChanges } = await loadModule();
    const changes = getClusterChanges('2026-03-10', '2026-03-17');

    expect(changes).toHaveLength(1);
    expect(changes[0].cluster_slug).toBe('test-cluster');
    expect(changes[0].changes).toHaveLength(1);
    expect(changes[0].changes[0]).toMatchObject({
      slug: 'x-vs-y',
      type: 'compare',
      title: 'X vs Y',
      action: 'created',
      url_path: '/compare/x-vs-y',
    });
  });

  it('detects refreshed pages from refresh_needed array', async () => {
    writeClusterJson('test-cluster.json', {
      topic_slug: 'test-cluster',
      pillar_topic: 'Test Cluster',
      target_compare: [],
      target_faq: [],
      target_glossary: [],
      tracked_blogs: [],
      refresh_needed: [
        { slug: 'old-page', type: 'compare', refreshed_at: '2026-03-14' },
        { slug: 'not-refreshed', type: 'faq' }, // no refreshed_at
      ],
    });

    const { getClusterChanges } = await loadModule();
    const changes = getClusterChanges('2026-03-10', '2026-03-17');

    expect(changes).toHaveLength(1);
    expect(changes[0].changes).toHaveLength(1);
    expect(changes[0].changes[0]).toMatchObject({
      slug: 'old-page',
      type: 'compare',
      action: 'refreshed',
      date: '2026-03-14',
    });
  });

  it('detects new tracked blogs by frontmatter date', async () => {
    writeClusterJson('test-cluster.json', {
      topic_slug: 'test-cluster',
      pillar_topic: 'Test Cluster',
      target_compare: [],
      target_faq: [],
      target_glossary: [],
      tracked_blogs: [
        { slug: 'new-blog-post', title: 'A Great Blog Post' },
        { slug: 'old-blog-post', title: 'Old Blog Post' },
      ],
    });

    writeContentFile(
      'content/blog/en/new-blog-post.md',
      '---\ntitle: A Great Blog Post\ndate: 2026-03-12\n---\nContent here.',
    );
    writeContentFile(
      'content/blog/en/old-blog-post.md',
      '---\ntitle: Old Blog Post\ndate: 2025-06-01\n---\nOld content.',
    );

    const { getClusterChanges } = await loadModule();
    const changes = getClusterChanges('2026-03-10', '2026-03-17');

    expect(changes).toHaveLength(1);
    expect(changes[0].changes).toHaveLength(1);
    expect(changes[0].changes[0]).toMatchObject({
      slug: 'new-blog-post',
      type: 'blog',
      title: 'A Great Blog Post',
      action: 'created',
      date: '2026-03-12',
      url_path: '/blog/new-blog-post',
    });
  });

  it('returns empty array when cluster directory is empty', async () => {
    // Create the directory but no JSON files
    fs.mkdirSync(path.join(tmpDir, 'data', 'flagship-clusters'), { recursive: true });

    const { getClusterChanges } = await loadModule();
    const changes = getClusterChanges('2026-03-10', '2026-03-17');
    expect(changes).toEqual([]);
  });

  it('handles missing content files gracefully', async () => {
    writeClusterJson('test-cluster.json', {
      topic_slug: 'test-cluster',
      pillar_topic: 'Test Cluster',
      target_compare: [
        { slug: 'missing-page', item_a: 'A', item_b: 'B', status: 'exists' },
      ],
      target_faq: [],
      target_glossary: [],
      tracked_blogs: [
        { slug: 'missing-blog', title: 'Missing Blog' },
      ],
    });
    // Don't create the content files — should not crash

    const { getClusterChanges } = await loadModule();
    const changes = getClusterChanges('2026-03-10', '2026-03-17');
    expect(changes).toEqual([]);
  });
});
