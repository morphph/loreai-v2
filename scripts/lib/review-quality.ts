/**
 * C5 — Layer 2 Quality Rubrics
 *
 * Quality sampling checks for pipeline output. Read-only — never writes to DB.
 * Pure logic rubrics (D, G, H) run without LLM calls.
 * LLM rubrics (A, B, C, E, F) will be added in a follow-up.
 *
 * @see docs/plans/specs/SPEC-C5-review-cycle.md Section 4
 */

import type Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';
import { QUEUE_STATUS, GROUP_STATUS, type CheckStatus } from './review-checks';

// ── Constants ──

const DEFAULT_VOLUME = 10;

// ── Types ──

export interface QualityCheckOptions {
  /** Content root directory (default: process.cwd()) */
  contentRoot?: string;
  /** Override "now" for testing */
  now?: Date;
  /** Topic filter */
  topic?: string;
  /** Dry run — skip LLM calls */
  dryRun?: boolean;
  /** LLM model override */
  model?: 'sonnet' | 'haiku';
}

// Rubric D output
export interface PrioritySanityResult {
  status: CheckStatus;
  issues: string[];
  top10: Array<{ group_id: number; primary_keyword: string; priority_score: number; intent: string; content_type: string }>;
  bottom10: Array<{ group_id: number; primary_keyword: string; priority_score: number; intent: string; content_type: string }>;
}

// Rubric G output
export interface InternalLinkReport {
  topic: string;
  total_pages: number;
  orphan_pages: string[];
  hub_link_coverage: number;
  broken_links: Array<{ page: string; broken_target: string }>;
  cross_cluster_links: number;
  reciprocal_rate: number;
}

export interface InternalLinkingResult {
  status: CheckStatus;
  by_topic: InternalLinkReport[];
}

// Rubric H output
export interface RefreshPipelineResult {
  status: CheckStatus | 'not_implemented';
  refresh_jobs_total: number;
  refresh_jobs_completed: number;
  completion_rate: number;
  stale_jobs: number;
  striking_conversions: number;
  detail: string;
}

// Combined pure-logic quality report
export interface PureQualityReport {
  priority_sanity: PrioritySanityResult;
  internal_linking: InternalLinkingResult;
  refresh_pipeline: RefreshPipelineResult;
}

// ════════════════════════════════════════════
// Rubric D — Priority Score Sanity
// ════════════════════════════════════════════

export function checkPrioritySanity(db: Database.Database, opts?: QualityCheckOptions): PrioritySanityResult {
  try {
    return _checkPrioritySanity(db, opts);
  } catch (err) {
    return {
      status: 'error',
      issues: [`Check failed: ${err instanceof Error ? err.message : String(err)}`],
      top10: [],
      bottom10: [],
    };
  }
}

function _checkPrioritySanity(db: Database.Database, opts?: QualityCheckOptions): PrioritySanityResult {
  // Get top-10 pending/queued jobs by priority (highest first)
  const top10 = db.prepare(
    `SELECT cq.keyword_group_id as group_id, kg.primary_keyword, cq.priority_score,
            kg.intent, kg.content_type
     FROM create_queue cq
     JOIN keyword_groups kg ON cq.keyword_group_id = kg.group_id
     WHERE cq.status = ?
     ORDER BY cq.priority_score DESC
     LIMIT 10`
  ).all(QUEUE_STATUS.PENDING) as PrioritySanityResult['top10'];

  // Get bottom-10 pending jobs (lowest priority first)
  const bottom10 = db.prepare(
    `SELECT cq.keyword_group_id as group_id, kg.primary_keyword, cq.priority_score,
            kg.intent, kg.content_type
     FROM create_queue cq
     JOIN keyword_groups kg ON cq.keyword_group_id = kg.group_id
     WHERE cq.status = ?
     ORDER BY cq.priority_score ASC
     LIMIT 10`
  ).all(QUEUE_STATUS.PENDING) as PrioritySanityResult['bottom10'];

  if (top10.length === 0) {
    return {
      status: 'info' as CheckStatus,
      issues: [],
      top10: [],
      bottom10: [],
    };
  }

  const issues: string[] = [];

  // Check 1: Top-10 contains navigational intent (low commercial value)
  const navInTop = top10.filter(j => j.intent === 'navigational');
  if (navInTop.length > 0) {
    issues.push(
      `Top-10 contains ${navInTop.length} navigational intent keyword(s): ${navInTop.map(j => j.primary_keyword).join(', ')}`
    );
  }

  // Check 2: Top-10 contains keywords with default volume (no real volume data)
  // Join to keywords table to check search_volume
  const topGroupIds = top10.map(j => j.group_id);
  if (topGroupIds.length > 0) {
    const placeholders = topGroupIds.map(() => '?').join(',');
    const defaultVolGroups = db.prepare(
      `SELECT DISTINCT kg.group_id, kg.primary_keyword
       FROM keyword_groups kg
       LEFT JOIN keywords k ON k.cluster_slug = kg.cluster_slug
       WHERE kg.group_id IN (${placeholders})
       GROUP BY kg.group_id
       HAVING MAX(COALESCE(k.search_volume, ${DEFAULT_VOLUME})) = ${DEFAULT_VOLUME}`
    ).all(...topGroupIds) as Array<{ group_id: number; primary_keyword: string }>;

    if (defaultVolGroups.length > 0) {
      issues.push(
        `Top-10 contains ${defaultVolGroups.length} group(s) with no real volume data (default=${DEFAULT_VOLUME}): ${defaultVolGroups.map(g => g.primary_keyword).join(', ')}`
      );
    }
  }

  // Check 3: Bottom-10 contains keywords with high real volume that got deprioritized
  const bottomGroupIds = bottom10.map(j => j.group_id);
  if (bottomGroupIds.length > 0) {
    const placeholders = bottomGroupIds.map(() => '?').join(',');
    const highVolBottom = db.prepare(
      `SELECT kg.group_id, kg.primary_keyword, MAX(k.search_volume) as max_vol
       FROM keyword_groups kg
       LEFT JOIN keywords k ON k.cluster_slug = kg.cluster_slug
       WHERE kg.group_id IN (${placeholders})
       GROUP BY kg.group_id
       HAVING max_vol > 100`
    ).all(...bottomGroupIds) as Array<{ group_id: number; primary_keyword: string; max_vol: number }>;

    if (highVolBottom.length > 0) {
      issues.push(
        `Bottom-10 contains ${highVolBottom.length} group(s) with high volume (>100) that were deprioritized: ${highVolBottom.map(g => `${g.primary_keyword} (vol=${g.max_vol})`).join(', ')}`
      );
    }
  }

  // Check 4: All top-10 are the same content_type (lack of diversity)
  const contentTypes = new Set(top10.map(j => j.content_type));
  if (contentTypes.size === 1 && top10.length >= 5) {
    issues.push(
      `All top-10 jobs are content_type="${[...contentTypes][0]}" — lacks diversity`
    );
  }

  let status: CheckStatus = 'green';
  if (issues.length >= 3) status = 'red';
  else if (issues.length >= 1) status = 'yellow';

  return { status, issues, top10, bottom10 };
}

// ════════════════════════════════════════════
// Rubric G — Internal Linking Coherence
// ════════════════════════════════════════════

/** Extract markdown links [text](/path) from content, returning the path part */
export function extractInternalLinks(markdown: string): string[] {
  const linkRegex = /\[(?:[^\]]*)\]\(\/([^)]+)\)/g;
  const links: string[] = [];
  let match;
  while ((match = linkRegex.exec(markdown)) !== null) {
    links.push('/' + match[1]);
  }
  return links;
}

/** Map a link path like /blog/my-slug to a content type and slug */
export function parseLinkPath(linkPath: string): { type: string; slug: string } | null {
  const match = linkPath.match(/^\/(blog|faq|compare|glossary|topics)\/(.+)$/);
  if (!match) return null;
  return { type: match[1], slug: match[2] };
}

/** Check if a content file exists for a given link path */
function contentFileExists(contentRoot: string, linkPath: string): boolean {
  const parsed = parseLinkPath(linkPath);
  if (!parsed) return true; // Non-content links (e.g. /subscribe) are OK
  // Content files live in content/{type}/en/{slug}.md
  const filePath = path.join(contentRoot, 'content', parsed.type, 'en', `${parsed.slug}.md`);
  return fs.existsSync(filePath);
}

/** Get all content file slugs and their internal links for a topic cluster */
function getClusterPages(
  contentRoot: string,
  clusterSlug: string,
  db: Database.Database,
): Array<{ type: string; slug: string; links: string[] }> {
  // Get all content slugs for this cluster from DB
  const rows = db.prepare(
    `SELECT DISTINCT c.type, c.slug
     FROM content c
     JOIN keyword_groups kg ON c.type = kg.content_type
     WHERE kg.cluster_slug = ? AND c.lang = 'en'`
  ).all(clusterSlug) as Array<{ type: string; slug: string }>;

  // Also check for topic hub page
  const hubPath = path.join(contentRoot, 'content', 'topics', 'en', `${clusterSlug}.md`);
  const hasHub = fs.existsSync(hubPath);
  if (hasHub) {
    // Avoid duplicating if already in the list
    if (!rows.some(r => r.type === 'topics' && r.slug === clusterSlug)) {
      rows.push({ type: 'topics', slug: clusterSlug });
    }
  }

  const pages: Array<{ type: string; slug: string; links: string[] }> = [];
  for (const row of rows) {
    const filePath = path.join(contentRoot, 'content', row.type, 'en', `${row.slug}.md`);
    if (!fs.existsSync(filePath)) continue;
    const content = fs.readFileSync(filePath, 'utf-8');
    pages.push({ type: row.type, slug: row.slug, links: extractInternalLinks(content) });
  }

  return pages;
}

export function checkInternalLinking(
  db: Database.Database,
  opts?: QualityCheckOptions,
): InternalLinkingResult {
  try {
    return _checkInternalLinking(db, opts);
  } catch (err) {
    return {
      status: 'error',
      by_topic: [],
    };
  }
}

function _checkInternalLinking(
  db: Database.Database,
  opts?: QualityCheckOptions,
): InternalLinkingResult {
  const contentRoot = opts?.contentRoot ?? process.cwd();

  // Get topic clusters that have content
  let topicQuery = `SELECT DISTINCT tc.slug FROM topic_clusters tc
    WHERE EXISTS (SELECT 1 FROM keyword_groups kg WHERE kg.cluster_slug = tc.slug)`;
  const params: string[] = [];

  if (opts?.topic) {
    topicQuery += ` AND tc.slug = ?`;
    params.push(opts.topic);
  }
  topicQuery += ` LIMIT 20`;

  const topics = db.prepare(topicQuery).all(...params) as Array<{ slug: string }>;

  if (topics.length === 0) {
    return { status: 'info' as CheckStatus, by_topic: [] };
  }

  const reports: InternalLinkReport[] = [];

  for (const { slug } of topics) {
    const pages = getClusterPages(contentRoot, slug, db);
    if (pages.length === 0) continue;

    // Build slug-to-path map for this cluster
    const clusterPaths = new Set(
      pages.map(p => `/${p.type}/${p.slug}`)
    );

    // Orphan detection: pages with 0 inbound links from other cluster pages
    const inboundCount = new Map<string, number>();
    for (const p of pages) {
      const pagePath = `/${p.type}/${p.slug}`;
      if (!inboundCount.has(pagePath)) inboundCount.set(pagePath, 0);
    }
    for (const p of pages) {
      const pagePath = `/${p.type}/${p.slug}`;
      for (const link of p.links) {
        if (clusterPaths.has(link) && link !== pagePath) {
          inboundCount.set(link, (inboundCount.get(link) ?? 0) + 1);
        }
      }
    }
    const orphanPages = [...inboundCount.entries()]
      .filter(([, count]) => count === 0)
      .map(([pagePath]) => pagePath);

    // Hub completeness: does the topic page link to cluster spoke pages?
    const hubPage = pages.find(p => p.type === 'topics' && p.slug === slug);
    const spokePages = pages.filter(p => !(p.type === 'topics' && p.slug === slug));
    let hubLinkCoverage = 0;
    if (hubPage && spokePages.length > 0) {
      const hubLinksSet = new Set(hubPage.links);
      const linkedSpokes = spokePages.filter(p => hubLinksSet.has(`/${p.type}/${p.slug}`));
      hubLinkCoverage = linkedSpokes.length / spokePages.length;
    } else if (spokePages.length === 0) {
      hubLinkCoverage = 1; // No spokes to link to
    }

    // Broken internal links
    const brokenLinks: Array<{ page: string; broken_target: string }> = [];
    for (const p of pages) {
      for (const link of p.links) {
        const parsed = parseLinkPath(link);
        if (!parsed) continue; // Skip non-content links
        if (!contentFileExists(contentRoot, link)) {
          brokenLinks.push({ page: `/${p.type}/${p.slug}`, broken_target: link });
        }
      }
    }

    // Cross-cluster linking: cluster pages linking to other clusters
    let crossClusterLinks = 0;
    for (const p of pages) {
      for (const link of p.links) {
        const parsed = parseLinkPath(link);
        if (parsed && !clusterPaths.has(link)) {
          crossClusterLinks++;
        }
      }
    }

    // Reciprocal linking rate
    let totalOutbound = 0;
    let reciprocal = 0;
    for (const p of pages) {
      const pagePath = `/${p.type}/${p.slug}`;
      for (const link of p.links) {
        if (!clusterPaths.has(link) || link === pagePath) continue;
        totalOutbound++;
        // Check if target links back to this page
        const target = pages.find(tp => `/${tp.type}/${tp.slug}` === link);
        if (target?.links.includes(pagePath)) {
          reciprocal++;
        }
      }
    }
    const reciprocalRate = totalOutbound > 0 ? reciprocal / totalOutbound : 0;

    reports.push({
      topic: slug,
      total_pages: pages.length,
      orphan_pages: orphanPages,
      hub_link_coverage: Math.round(hubLinkCoverage * 100) / 100,
      broken_links: brokenLinks,
      cross_cluster_links: crossClusterLinks,
      reciprocal_rate: Math.round(reciprocalRate * 100) / 100,
    });
  }

  // Determine overall status from all topic reports
  let status: CheckStatus = 'green';
  for (const r of reports) {
    const totalOrphans = r.orphan_pages.length;
    const totalBroken = r.broken_links.length;

    if (totalOrphans > 3 || r.hub_link_coverage < 0.5 || totalBroken > 3) {
      status = 'red';
      break;
    }
    if (totalOrphans >= 1 || (r.hub_link_coverage > 0 && r.hub_link_coverage < 0.8) || totalBroken >= 1) {
      if (status !== 'red') status = 'yellow';
    }
  }

  if (reports.length === 0) {
    status = 'info' as CheckStatus;
  }

  return { status, by_topic: reports };
}

// ════════════════════════════════════════════
// Rubric H — Refresh Pipeline Health
// ════════════════════════════════════════════

export function checkRefreshPipeline(
  db: Database.Database,
  opts?: QualityCheckOptions,
): RefreshPipelineResult {
  try {
    return _checkRefreshPipeline(db, opts);
  } catch (err) {
    return {
      status: 'error',
      refresh_jobs_total: 0,
      refresh_jobs_completed: 0,
      completion_rate: 0,
      stale_jobs: 0,
      striking_conversions: 0,
      detail: `Check failed: ${err instanceof Error ? err.message : String(err)}`,
    };
  }
}

function _checkRefreshPipeline(
  db: Database.Database,
  _opts?: QualityCheckOptions,
): RefreshPipelineResult {
  // Check if refresh content_type exists in the queue at all
  const totalRow = db.prepare(
    `SELECT COUNT(*) as cnt FROM create_queue WHERE content_type = 'refresh'`
  ).get() as { cnt: number };

  const completedRow = db.prepare(
    `SELECT COUNT(*) as cnt FROM create_queue WHERE content_type = 'refresh' AND status = ?`
  ).get(QUEUE_STATUS.COMPLETED) as { cnt: number };

  const staleRow = db.prepare(
    `SELECT COUNT(*) as cnt FROM create_queue
     WHERE content_type = 'refresh'
       AND status IN (?, ?)
       AND created_at < datetime('now', '-14 days')`
  ).get(QUEUE_STATUS.PENDING, QUEUE_STATUS.IN_PROGRESS) as { cnt: number };

  const total = totalRow.cnt;
  const completed = completedRow.cnt;
  const stale = staleRow.cnt;
  const completionRate = total > 0 ? completed / total : 0;

  // Check if there are two consecutive snapshots to measure striking distance
  const snapshotCount = db.prepare(
    `SELECT COUNT(DISTINCT snapshot_date) as cnt FROM snapshots`
  ).get() as { cnt: number };

  // Striking distance conversions: queries that improved position after refresh
  // This requires at least 2 snapshot dates and completed refresh jobs
  let strikingConversions = 0;
  // For now, we can't measure conversions without actual position data per-page
  // This would need a more complex query joining snapshots with refresh metadata
  // Mark as 0 and let the status logic handle it

  // Determine status
  if (total === 0) {
    // No refresh jobs exist — check if this is expected
    const hasGscData = db.prepare(
      `SELECT COUNT(*) as cnt FROM snapshots`
    ).get() as { cnt: number };

    if (hasGscData.cnt === 0) {
      return {
        status: 'green',
        refresh_jobs_total: 0,
        refresh_jobs_completed: 0,
        completion_rate: 0,
        stale_jobs: 0,
        striking_conversions: 0,
        detail: 'No GSC data yet — refresh pipeline not expected to run',
      };
    }

    // Has GSC data but no refresh jobs — check if the refresh pipeline is wired up
    // Known bug: content_type='refresh' may not be handled by content-gen.ts
    return {
      status: 'not_implemented',
      refresh_jobs_total: 0,
      refresh_jobs_completed: 0,
      completion_rate: 0,
      stale_jobs: 0,
      striking_conversions: 0,
      detail: 'GSC data exists but no refresh jobs have been created. Refresh pipeline may not be wired up yet.',
    };
  }

  // Has refresh jobs — evaluate health
  let status: CheckStatus = 'green';
  const weeksOfData = snapshotCount.cnt >= 2
    ? Math.max(1, Math.round(snapshotCount.cnt / 7))
    : 0;

  if (completionRate < 0.5) {
    status = 'red';
  } else if (completionRate < 0.8) {
    status = 'yellow';
  }

  // If we have >= 4 weeks of data and 0 conversions, that's red
  if (strikingConversions === 0 && weeksOfData >= 4) {
    status = 'red';
  } else if (strikingConversions === 0 && weeksOfData < 4 && status === 'green') {
    status = 'yellow'; // Too early to tell
  }

  if (stale > 0 && status !== 'red') {
    status = 'yellow';
  }

  return {
    status,
    refresh_jobs_total: total,
    refresh_jobs_completed: completed,
    completion_rate: Math.round(completionRate * 100) / 100,
    stale_jobs: stale,
    striking_conversions: strikingConversions,
    detail: `${completed}/${total} refresh jobs completed (${Math.round(completionRate * 100)}%), ${stale} stale (>14d)`,
  };
}

// ════════════════════════════════════════════
// Run all pure logic quality checks
// ════════════════════════════════════════════

export function runPureQualityChecks(
  db: Database.Database,
  opts?: QualityCheckOptions,
): PureQualityReport {
  return {
    priority_sanity: checkPrioritySanity(db, opts),
    internal_linking: checkInternalLinking(db, opts),
    refresh_pipeline: checkRefreshPipeline(db, opts),
  };
}
