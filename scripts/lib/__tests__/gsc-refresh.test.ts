import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { parseGSCExport, detectRankingDrops, rankingDropsToRefreshFlags } from '../seo/gsc-refresh';
import type { ClusterDefinition } from '../seo/types';

let tmpDir: string;

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'gsc-test-'));
});

afterEach(() => {
  fs.rmSync(tmpDir, { recursive: true });
});

function writeCSV(name: string, rows: string[]): string {
  const header = 'Query,Page,Clicks,Impressions,CTR,Position';
  const content = [header, ...rows].join('\n') + '\n';
  const filepath = path.join(tmpDir, name);
  fs.writeFileSync(filepath, content);
  return filepath;
}

describe('parseGSCExport', () => {
  it('parses CSV into page metrics', () => {
    const csvPath = writeCSV('test.csv', [
      'claude code,https://loreai.dev/glossary/claude-code,10,100,10.0%,5.2',
      'what is claude code,https://loreai.dev/glossary/claude-code,5,50,10.0%,4.8',
    ]);

    const result = parseGSCExport(csvPath);
    expect(result.size).toBe(1);

    const page = result.get('https://loreai.dev/glossary/claude-code');
    expect(page).toBeDefined();
    expect(page!.totalClicks).toBe(15);
    expect(page!.totalImpressions).toBe(150);
    expect(page!.avgPosition).toBe(5.0); // (5.2 + 4.8) / 2
    expect(page!.queries).toHaveLength(2);
  });

  it('returns empty map for missing file', () => {
    const result = parseGSCExport('/nonexistent.csv');
    expect(result.size).toBe(0);
  });
});

describe('detectRankingDrops', () => {
  it('detects pages that dropped 3+ positions', () => {
    const older = writeCSV('older.csv', [
      'claude code vs cursor,https://loreai.dev/compare/claude-code-vs-cursor,20,200,10.0%,3.5',
      'claude code faq,https://loreai.dev/faq/how-claude-code-works,5,50,10.0%,8.0',
    ]);
    const newer = writeCSV('newer.csv', [
      'claude code vs cursor,https://loreai.dev/compare/claude-code-vs-cursor,10,150,6.7%,8.0',
      'claude code faq,https://loreai.dev/faq/how-claude-code-works,4,45,8.9%,9.5',
    ]);

    const drops = detectRankingDrops(older, newer, 3, 1);
    expect(drops.length).toBe(1); // Only compare page dropped 4.5 positions
    expect(drops[0].slug).toBe('claude-code-vs-cursor');
    expect(drops[0].pageType).toBe('compare');
    expect(drops[0].positionDrop).toBeCloseTo(4.5);
  });

  it('ignores pages with insufficient impressions', () => {
    const older = writeCSV('older.csv', [
      'rare query,https://loreai.dev/glossary/rare-term,0,2,0%,5.0',
    ]);
    const newer = writeCSV('newer.csv', [
      'rare query,https://loreai.dev/glossary/rare-term,0,1,0%,20.0',
    ]);

    const drops = detectRankingDrops(older, newer, 3, 10);
    expect(drops.length).toBe(0);
  });
});

describe('rankingDropsToRefreshFlags', () => {
  it('converts ranking drops to refresh flags for cluster pages', () => {
    const drops = [{
      page: 'https://loreai.dev/compare/claude-code-vs-cursor',
      slug: 'claude-code-vs-cursor',
      pageType: 'compare',
      oldPosition: 3.5,
      newPosition: 8.0,
      positionDrop: 4.5,
      impressionChange: -50,
      topQueries: ['claude code vs cursor'],
    }];

    const cluster: ClusterDefinition = {
      topic_slug: 'claude-code',
      pillar_topic: 'Claude Code',
      version: '1.0',
      cornerstone: { slug: 'claude-code-complete-guide', target_keywords: [], status: 'exists' },
      target_compare: [{ slug: 'claude-code-vs-cursor', item_a: 'Claude Code', item_b: 'Cursor', priority: 1, status: 'exists' }],
      target_faq: [],
      target_glossary: [],
      tracked_blogs: [],
    };

    const flags = rankingDropsToRefreshFlags(drops, cluster);
    expect(flags.length).toBe(1);
    expect(flags[0].slug).toBe('claude-code-vs-cursor');
    expect(flags[0].severity).toBe('low'); // 4.5 < 5
    expect(flags[0].signal_event).toBe('gsc-ranking-drop');
    expect(flags[0].status).toBe('pending');
  });

  it('ignores drops for pages not in the cluster', () => {
    const drops = [{
      page: 'https://loreai.dev/compare/random-vs-thing',
      slug: 'random-vs-thing',
      pageType: 'compare',
      oldPosition: 5,
      newPosition: 15,
      positionDrop: 10,
      impressionChange: -100,
      topQueries: ['random vs thing'],
    }];

    const cluster: ClusterDefinition = {
      topic_slug: 'claude-code',
      pillar_topic: 'Claude Code',
      version: '1.0',
      cornerstone: { slug: 'claude-code-complete-guide', target_keywords: [], status: 'exists' },
      target_compare: [{ slug: 'claude-code-vs-cursor', item_a: 'Claude Code', item_b: 'Cursor', priority: 1, status: 'exists' }],
      target_faq: [],
      target_glossary: [],
      tracked_blogs: [],
    };

    const flags = rankingDropsToRefreshFlags(drops, cluster);
    expect(flags.length).toBe(0);
  });
});
