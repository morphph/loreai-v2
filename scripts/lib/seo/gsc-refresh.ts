/**
 * scripts/lib/seo/gsc-refresh.ts — Performance-based refresh detection from GSC data
 *
 * Reads GSC CSV exports, compares two time periods, and flags pages
 * where rankings have dropped significantly (3+ positions).
 * Produces RefreshFlag entries compatible with the existing refresh pipeline.
 */
import fs from 'fs';
import path from 'path';
import type { RefreshFlag, ClusterDefinition } from './types';

// ============================================================
// Types
// ============================================================

interface GSCPageMetrics {
  page: string;
  queries: string[];
  avgPosition: number;
  totalImpressions: number;
  totalClicks: number;
}

export interface RankingDrop {
  page: string;
  slug: string;
  pageType: string;
  oldPosition: number;
  newPosition: number;
  positionDrop: number;
  impressionChange: number;
  topQueries: string[];
}

// ============================================================
// CSV Parsing
// ============================================================

/**
 * Parse a GSC CSV export file into per-page metrics.
 * CSV format: Query,Page,Clicks,Impressions,CTR,Position
 */
export function parseGSCExport(csvPath: string): Map<string, GSCPageMetrics> {
  if (!fs.existsSync(csvPath)) {
    console.warn(`  GSC CSV not found: ${csvPath}`);
    return new Map();
  }

  const content = fs.readFileSync(csvPath, 'utf-8');
  const lines = content.trim().split('\n');
  if (lines.length < 2) return new Map();

  // Skip header
  const dataLines = lines.slice(1);
  const pageMap = new Map<string, { positions: number[]; impressions: number; clicks: number; queries: string[] }>();

  for (const line of dataLines) {
    const parts = parseCSVLine(line);
    if (parts.length < 6) continue;

    const query = parts[0];
    const page = parts[1];
    const clicks = parseInt(parts[2], 10) || 0;
    const impressions = parseInt(parts[3], 10) || 0;
    const position = parseFloat(parts[5]) || 0;

    if (!page || !position) continue;

    const existing = pageMap.get(page) || { positions: [], impressions: 0, clicks: 0, queries: [] };
    existing.positions.push(position);
    existing.impressions += impressions;
    existing.clicks += clicks;
    existing.queries.push(query);
    pageMap.set(page, existing);
  }

  // Aggregate: weighted average position by impressions
  const result = new Map<string, GSCPageMetrics>();
  for (const [page, data] of pageMap) {
    const avgPosition = data.positions.reduce((a, b) => a + b, 0) / data.positions.length;
    result.set(page, {
      page,
      queries: data.queries.slice(0, 5),
      avgPosition,
      totalImpressions: data.impressions,
      totalClicks: data.clicks,
    });
  }

  return result;
}

/**
 * Simple CSV line parser that handles quoted fields.
 */
function parseCSVLine(line: string): string[] {
  const parts: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      inQuotes = !inQuotes;
    } else if (ch === ',' && !inQuotes) {
      parts.push(current.trim());
      current = '';
    } else {
      current += ch;
    }
  }
  parts.push(current.trim());
  return parts;
}

// ============================================================
// Ranking Drop Detection
// ============================================================

/**
 * Extract slug and page type from a URL path.
 * E.g., "https://loreai.dev/compare/claude-code-vs-cursor" → { slug: "claude-code-vs-cursor", type: "compare" }
 */
function extractPageInfo(pageUrl: string): { slug: string; type: string } | null {
  try {
    const url = new URL(pageUrl);
    const parts = url.pathname.split('/').filter(Boolean);
    if (parts.length < 2) return null;

    const typeMap: Record<string, string> = {
      compare: 'compare',
      faq: 'faq',
      glossary: 'glossary',
      topics: 'topics',
      blog: 'blog',
    };

    const type = typeMap[parts[0]];
    if (!type) return null;

    return { slug: parts.slice(1).join('/'), type };
  } catch {
    return null;
  }
}

/**
 * Compare two GSC exports and detect significant ranking drops.
 *
 * @param olderCsvPath - Path to the older (baseline) GSC CSV export
 * @param newerCsvPath - Path to the newer (current) GSC CSV export
 * @param minPositionDrop - Minimum position drop to flag (default: 3)
 * @param minImpressions - Minimum impressions to consider (avoids noise from low-traffic pages)
 */
export function detectRankingDrops(
  olderCsvPath: string,
  newerCsvPath: string,
  minPositionDrop: number = 3,
  minImpressions: number = 10
): RankingDrop[] {
  console.log('  Comparing GSC exports for ranking drops...');

  const olderData = parseGSCExport(olderCsvPath);
  const newerData = parseGSCExport(newerCsvPath);

  if (olderData.size === 0 || newerData.size === 0) {
    console.log('  Insufficient GSC data for comparison');
    return [];
  }

  const drops: RankingDrop[] = [];

  for (const [page, newerMetrics] of newerData) {
    const olderMetrics = olderData.get(page);
    if (!olderMetrics) continue; // New page, no baseline

    // Only consider pages with meaningful traffic
    if (olderMetrics.totalImpressions < minImpressions && newerMetrics.totalImpressions < minImpressions) {
      continue;
    }

    const positionDrop = newerMetrics.avgPosition - olderMetrics.avgPosition;
    if (positionDrop >= minPositionDrop) {
      const pageInfo = extractPageInfo(page);
      if (!pageInfo) continue;

      drops.push({
        page,
        slug: pageInfo.slug,
        pageType: pageInfo.type,
        oldPosition: olderMetrics.avgPosition,
        newPosition: newerMetrics.avgPosition,
        positionDrop,
        impressionChange: newerMetrics.totalImpressions - olderMetrics.totalImpressions,
        topQueries: newerMetrics.queries,
      });
    }
  }

  // Sort by severity (largest drops first)
  drops.sort((a, b) => b.positionDrop - a.positionDrop);

  console.log(`  Found ${drops.length} pages with ranking drops >= ${minPositionDrop} positions`);
  for (const drop of drops.slice(0, 5)) {
    console.log(`    ${drop.slug} (${drop.pageType}): ${drop.oldPosition.toFixed(1)} → ${drop.newPosition.toFixed(1)} (↓${drop.positionDrop.toFixed(1)})`);
  }

  return drops;
}

// ============================================================
// Refresh Flag Generation
// ============================================================

/**
 * Convert ranking drops into RefreshFlag entries for a specific cluster.
 * Only flags pages that belong to the cluster's target lists.
 */
export function rankingDropsToRefreshFlags(
  drops: RankingDrop[],
  cluster: ClusterDefinition
): RefreshFlag[] {
  const clusterSlugs = new Set<string>();

  // Collect all slugs belonging to this cluster
  clusterSlugs.add(cluster.cornerstone.slug);
  for (const c of cluster.target_compare) clusterSlugs.add(c.slug);
  for (const f of cluster.target_faq) clusterSlugs.add(f.slug);
  for (const g of cluster.target_glossary) clusterSlugs.add(g.slug);

  const flags: RefreshFlag[] = [];

  for (const drop of drops) {
    if (!clusterSlugs.has(drop.slug)) continue;

    // Don't flag minor drops
    const severity = drop.positionDrop >= 10 ? 'high' :
                     drop.positionDrop >= 5 ? 'medium' : 'low';

    flags.push({
      slug: drop.slug,
      page_type: drop.pageType,
      severity,
      affected_sections: ['content freshness', 'keyword targeting'],
      reason: `GSC ranking dropped ${drop.positionDrop.toFixed(1)} positions (${drop.oldPosition.toFixed(1)} → ${drop.newPosition.toFixed(1)}). Top queries: ${drop.topQueries.slice(0, 3).join(', ')}`,
      signal_event: 'gsc-ranking-drop',
      signal_description: `Position drop from ${drop.oldPosition.toFixed(1)} to ${drop.newPosition.toFixed(1)}`,
      flagged_at: new Date().toISOString(),
      status: 'pending',
    });
  }

  return flags;
}

/**
 * Scan GSC exports directory for the two most recent exports
 * and detect ranking drops across all clusters.
 */
export function detectPerformanceRefreshNeeds(): RankingDrop[] {
  const exportDir = path.join(process.cwd(), 'data', 'gsc-exports');
  if (!fs.existsSync(exportDir)) {
    console.log('  No GSC exports directory found');
    return [];
  }

  // Find CSV files sorted by name (chronological: weekly-YYYY-MM-DD)
  const csvFiles = fs.readdirSync(exportDir)
    .filter(f => f.startsWith('weekly-') && f.endsWith('.csv'))
    .sort();

  if (csvFiles.length < 2) {
    console.log(`  Need at least 2 GSC exports for comparison (found ${csvFiles.length})`);
    return [];
  }

  const olderFile = path.join(exportDir, csvFiles[csvFiles.length - 2]);
  const newerFile = path.join(exportDir, csvFiles[csvFiles.length - 1]);

  console.log(`  Comparing: ${csvFiles[csvFiles.length - 2]} → ${csvFiles[csvFiles.length - 1]}`);

  return detectRankingDrops(olderFile, newerFile);
}
