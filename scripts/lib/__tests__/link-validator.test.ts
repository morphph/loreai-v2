import { describe, test, expect, vi, beforeEach } from 'vitest';
import { extractInternalLinks, validateLinks } from '../link-validator';

// Mock fs and db
vi.mock('fs', () => ({
  existsSync: vi.fn().mockReturnValue(false),
}));

vi.mock('../db', () => ({
  getDb: vi.fn().mockReturnValue({
    prepare: vi.fn().mockReturnValue({
      get: vi.fn().mockReturnValue(null),
      all: vi.fn().mockReturnValue([]),
    }),
  }),
}));

import { existsSync } from 'fs';
import { getDb } from '../db';

const mockExistsSync = vi.mocked(existsSync);
const mockGetDb = vi.mocked(getDb);

function mockDbWith(contentRows: Array<{ slug: string; title: string | null }> = []) {
  const mockGet = vi.fn().mockReturnValue(null);
  const mockAll = vi.fn().mockReturnValue(contentRows);
  mockGetDb.mockReturnValue({
    prepare: vi.fn().mockReturnValue({
      get: mockGet,
      all: mockAll,
    }),
  } as any);
  return { mockGet, mockAll };
}

describe('extractInternalLinks', () => {
  test('extracts internal links from markdown', () => {
    const md =
      'See [Claude Code](/glossary/claude-code) and [pricing FAQ](/faq/claude-code-pricing).';
    const links = extractInternalLinks(md);
    expect(links).toHaveLength(2);
    expect(links[0]).toEqual({
      text: 'Claude Code',
      href: '/glossary/claude-code',
      full: '[Claude Code](/glossary/claude-code)',
    });
    expect(links[1]).toEqual({
      text: 'pricing FAQ',
      href: '/faq/claude-code-pricing',
      full: '[pricing FAQ](/faq/claude-code-pricing)',
    });
  });

  test('ignores external links', () => {
    const md = 'Visit [Google](https://google.com) and [Home](/glossary/test).';
    const links = extractInternalLinks(md);
    expect(links).toHaveLength(1);
    expect(links[0].href).toBe('/glossary/test');
  });

  test('returns empty array for no links', () => {
    const md = 'No links here.';
    expect(extractInternalLinks(md)).toHaveLength(0);
  });

  test('handles multiple links on same line', () => {
    const md = '[A](/glossary/a) vs [B](/glossary/b) vs [C](/compare/c)';
    const links = extractInternalLinks(md);
    expect(links).toHaveLength(3);
  });
});

describe('validateLinks', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockExistsSync.mockReturnValue(false);
    mockDbWith([]);
  });

  test('/subscribe is always valid', () => {
    const md = '[Subscribe to LoreAI](/subscribe)';
    const result = validateLinks(md, 'faq', 'en');
    expect(result.total_links).toBe(1);
    expect(result.valid_links).toBe(1);
    expect(result.broken_links).toHaveLength(0);
    expect(result.fixed_markdown).toBe(md);
  });

  test('marks link as broken when target file does not exist', () => {
    const md = 'See [Claude Code](/glossary/nonexistent) for details.';
    const result = validateLinks(md, 'faq', 'en');
    expect(result.total_links).toBe(1);
    expect(result.valid_links).toBe(0);
    expect(result.broken_links).toHaveLength(1);
    expect(result.broken_links[0].link).toBe('/glossary/nonexistent');
  });

  test('removes broken links from markdown (keeps anchor text)', () => {
    const md = 'See [Claude Code](/glossary/nonexistent) for details.';
    const result = validateLinks(md, 'faq', 'en');
    expect(result.fixed_markdown).toBe('See Claude Code for details.');
  });

  test('validates link when file exists on disk', () => {
    mockExistsSync.mockReturnValue(true);
    const md = 'See [Claude Code](/glossary/claude-code) here.';
    const result = validateLinks(md, 'faq', 'en');
    expect(result.valid_links).toBe(1);
    expect(result.broken_links).toHaveLength(0);
  });

  test('validates link when DB record exists', () => {
    mockExistsSync.mockReturnValue(false);
    const { mockGet } = mockDbWith([]);
    mockGet.mockReturnValue({ id: 1 });
    const md = 'See [test](/glossary/test) here.';
    const result = validateLinks(md, 'faq', 'en');
    expect(result.valid_links).toBe(1);
    expect(result.broken_links).toHaveLength(0);
  });

  test('handles ZH content paths correctly', () => {
    mockExistsSync.mockImplementation((p: any) => {
      return String(p).includes('/zh/');
    });
    const md = 'See [test](/glossary/test) here.';
    const result = validateLinks(md, 'faq', 'zh');
    expect(result.valid_links).toBe(1);
  });

  test('handles mixed valid and broken links', () => {
    mockExistsSync.mockImplementation((p: any) => {
      return String(p).includes('claude-code');
    });
    const md =
      '[Claude Code](/glossary/claude-code) and [Missing](/glossary/missing) and [Subscribe](/subscribe)';
    const result = validateLinks(md, 'faq', 'en');
    expect(result.total_links).toBe(3);
    expect(result.valid_links).toBe(2); // claude-code + subscribe
    expect(result.broken_links).toHaveLength(1);
    expect(result.broken_links[0].link).toBe('/glossary/missing');
  });

  test('handles blog links', () => {
    mockExistsSync.mockImplementation((p: any) => {
      return String(p).includes('/blog/en/my-post');
    });
    const md = '[My Post](/blog/my-post)';
    const result = validateLinks(md, 'blog', 'en');
    expect(result.valid_links).toBe(1);
  });

  test('handles unknown link types', () => {
    const md = '[Test](/unknown-type/slug)';
    const result = validateLinks(md, 'faq', 'en');
    expect(result.broken_links).toHaveLength(1);
    expect(result.broken_links[0].reason).toContain('Unknown link type');
  });

  test('detects missing glossary links', () => {
    mockExistsSync.mockReturnValue(false);
    const { mockAll } = mockDbWith([{ slug: 'claude-code', title: 'Claude Code' }]);
    // Override the all() to return glossary entries
    mockAll.mockReturnValue([{ slug: 'claude-code', title: 'Claude Code' }]);

    const md = `---
title: Test
---

# Test Page

This page discusses Claude Code and how it works.`;

    const result = validateLinks(md, 'faq', 'en');
    expect(result.missing_glossary_links.length).toBeGreaterThanOrEqual(1);
    expect(result.missing_glossary_links[0].slug).toBe('claude-code');
    expect(result.missing_glossary_links[0].term).toBe('Claude Code');
  });

  test('does not flag already-linked glossary terms as missing', () => {
    mockExistsSync.mockReturnValue(true);
    const { mockAll } = mockDbWith([{ slug: 'claude-code', title: 'Claude Code' }]);
    mockAll.mockReturnValue([{ slug: 'claude-code', title: 'Claude Code' }]);

    const md = `# Test
This page discusses [Claude Code](/glossary/claude-code) and how it works.`;

    const result = validateLinks(md, 'faq', 'en');
    expect(result.missing_glossary_links).toHaveLength(0);
  });

  test('preserves markdown when no broken links', () => {
    mockExistsSync.mockReturnValue(true);
    const md = `# Test
[A](/glossary/a) and [B](/faq/b) and [Sub](/subscribe)`;
    const result = validateLinks(md, 'faq', 'en');
    expect(result.fixed_markdown).toBe(md);
  });

  test('handles empty markdown', () => {
    const result = validateLinks('', 'faq', 'en');
    expect(result.total_links).toBe(0);
    expect(result.valid_links).toBe(0);
    expect(result.broken_links).toHaveLength(0);
    expect(result.fixed_markdown).toBe('');
  });
});
