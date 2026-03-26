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

// ════════════════════════════════════════════
// LLM Rubrics — Types
// ════════════════════════════════════════════

/** Callable LLM function — injectable for testing */
export type LLMCallFn = (systemPrompt: string, userPrompt: string) => Promise<{ content: string }>;

// -- Sampling types --

export interface KeywordGroupSample {
  group_id: number;
  primary_keyword: string;
  secondary_keywords: string[];
  intent: string;
  content_type: string;
}

export interface ContentSample {
  type: string;
  slug: string;
  title: string;
  keyword: string;
  first_500_words: string;
  full_content: string;
}

export interface SubtopicSample {
  slug: string;
  pillar_topic: string;
}

export interface RawKeywordSample {
  keyword: string;
  source: string;
  cluster_slug: string;
}

// -- Result types --

export interface KeywordCoherenceResult {
  status: CheckStatus;
  samples_scored: number;
  average_score: number;
  worst_groups: Array<{ group_id: number; primary_keyword: string; score: number; reason: string }>;
  errors: string[];
}

export interface ContentIntentMatchResult {
  status: CheckStatus;
  samples_scored: number;
  average_score: number;
  by_type: Record<string, { average: number; count: number }>;
  worst_pieces: Array<{ slug: string; type: string; score: number; reason: string }>;
  errors: string[];
}

export interface ContentAEOResult {
  status: CheckStatus;
  samples_scored: number;
  average_score: number;
  by_type: Record<string, { average: number; count: number }>;
  common_issues: string[];
  errors: string[];
}

export interface SubtopicDiscoveryResult {
  status: CheckStatus;
  samples_scored: number;
  average_score: number;
  worst_subtopics: Array<{ slug: string; score: number; reason: string }>;
  errors: string[];
}

export interface RawKeywordQualityResult {
  status: CheckStatus;
  samples_scored: number;
  average_score: number;
  junk_rate: number;
  junk_rate_by_source: Record<string, number>;
  worst_keywords: Array<{ keyword: string; source: string; score: number; reason: string }>;
  errors: string[];
}

export interface LLMQualityReport {
  keyword_coherence: KeywordCoherenceResult;
  content_intent_match: ContentIntentMatchResult;
  content_aeo_readiness: ContentAEOResult;
  subtopic_discovery: SubtopicDiscoveryResult;
  keyword_quality: RawKeywordQualityResult;
  llm_calls: number;
}

// ════════════════════════════════════════════
// Sampling Functions
// ════════════════════════════════════════════

export function sampleKeywordGroups(
  db: Database.Database,
  opts?: { topic?: string; limit?: number },
): KeywordGroupSample[] {
  const limit = opts?.limit ?? 10;
  let query = `SELECT kg.group_id, kg.primary_keyword, kg.intent, kg.content_type, kg.cluster_slug
    FROM keyword_groups kg
    WHERE kg.status IN (?, ?, ?)`;
  const params: (string | number)[] = [GROUP_STATUS.PENDING, GROUP_STATUS.QUEUED, GROUP_STATUS.COMPLETED];

  if (opts?.topic) {
    query += ` AND kg.cluster_slug = ?`;
    params.push(opts.topic);
  }
  query += ` ORDER BY RANDOM() LIMIT ?`;
  params.push(limit);

  const groups = db.prepare(query).all(...params) as Array<{
    group_id: number; primary_keyword: string; intent: string;
    content_type: string; cluster_slug: string;
  }>;

  return groups.map(g => {
    const secondaryRows = db.prepare(
      `SELECT keyword FROM keywords WHERE cluster_slug = ? AND keyword != ?`
    ).all(g.cluster_slug, g.primary_keyword) as Array<{ keyword: string }>;

    return {
      group_id: g.group_id,
      primary_keyword: g.primary_keyword,
      secondary_keywords: secondaryRows.map(r => r.keyword),
      intent: g.intent,
      content_type: g.content_type ?? 'unknown',
    };
  });
}

export function sampleContent(
  db: Database.Database,
  contentRoot: string,
  opts?: { topic?: string; limit?: number },
): ContentSample[] {
  const limit = opts?.limit ?? 20;
  let query = `SELECT c.type, c.slug, c.title, kg.primary_keyword
    FROM content c
    LEFT JOIN keyword_groups kg ON c.type = kg.content_type AND c.slug LIKE '%' || REPLACE(kg.primary_keyword, ' ', '-') || '%'
    WHERE c.lang = 'en'`;
  const params: (string | number)[] = [];

  if (opts?.topic) {
    query += ` AND EXISTS (SELECT 1 FROM keyword_groups kg2 WHERE kg2.cluster_slug = ? AND c.type = kg2.content_type)`;
    params.push(opts.topic);
  }
  query += ` ORDER BY RANDOM() LIMIT ?`;
  params.push(limit);

  const rows = db.prepare(query).all(...params) as Array<{
    type: string; slug: string; title: string; primary_keyword: string | null;
  }>;

  const samples: ContentSample[] = [];
  for (const row of rows) {
    const filePath = path.join(contentRoot, 'content', row.type, 'en', `${row.slug}.md`);
    if (!fs.existsSync(filePath)) continue;
    const fullContent = fs.readFileSync(filePath, 'utf-8');
    const words = fullContent.split(/\s+/);
    const first500 = words.slice(0, 500).join(' ');

    samples.push({
      type: row.type,
      slug: row.slug,
      title: row.title ?? row.slug,
      keyword: row.primary_keyword ?? row.slug.replace(/-/g, ' '),
      first_500_words: first500,
      full_content: fullContent,
    });
  }
  return samples;
}

export function sampleSubtopics(
  db: Database.Database,
  opts?: { limit?: number },
): SubtopicSample[] {
  const limit = opts?.limit ?? 10;
  const rows = db.prepare(
    `SELECT slug, pillar_topic FROM topic_clusters
     ORDER BY last_seen DESC LIMIT ?`
  ).all(limit) as Array<{ slug: string; pillar_topic: string }>;

  return rows.map(r => ({ slug: r.slug, pillar_topic: r.pillar_topic }));
}

export function sampleRawKeywords(
  db: Database.Database,
  opts?: { topic?: string; limit?: number },
): RawKeywordSample[] {
  const limit = opts?.limit ?? 20;
  let query = `SELECT keyword, source, cluster_slug FROM keywords WHERE cluster_slug IS NOT NULL`;
  const params: (string | number)[] = [];

  if (opts?.topic) {
    query += ` AND cluster_slug = ?`;
    params.push(opts.topic);
  }
  query += ` ORDER BY RANDOM() LIMIT ?`;
  params.push(limit);

  return db.prepare(query).all(...params) as RawKeywordSample[];
}

// ════════════════════════════════════════════
// Prompt Builders (exported for testing)
// ════════════════════════════════════════════

export function buildPromptA(sample: KeywordGroupSample): string {
  return `Score this keyword group 1-5 on search intent coherence.

A score of 5 means: a single page could fully satisfy a user searching ANY of these keywords.
A score of 1 means: these keywords need completely different pages.

Primary keyword: "${sample.primary_keyword}"
Secondary keywords: ${JSON.stringify(sample.secondary_keywords)}
Assigned intent: ${sample.intent}
Assigned content type: ${sample.content_type}

Respond ONLY in this JSON format:
{"score": <1-5>, "reason": "<one sentence>", "misfit_keywords": [<keywords that don't belong, if any>]}`;
}

export function buildPromptB(sample: ContentSample): string {
  return `Score this content 1-5 on how well it satisfies the search intent for the target keyword.

A score of 5 means: a user searching this keyword would find exactly what they need.
A score of 1 means: the content is irrelevant or too generic to satisfy the search.

Target keyword: "${sample.keyword}"
Content type: ${sample.type}
Title: "${sample.title}"
First 500 words:
---
${sample.first_500_words}
---

Respond ONLY in this JSON format:
{"score": <1-5>, "reason": "<one sentence>", "improvement": "<one concrete suggestion, or null>"}`;
}

export function buildPromptC(sample: ContentSample): string {
  return `Score this content 1-5 on AI answer engine readiness.

A score of 5 means: an AI like Perplexity or ChatGPT search could directly quote this as a source.
A score of 1 means: the content has no extractable answers.

Check for:
- Does the first paragraph contain a direct, quotable answer?
- Are headings phrased as questions (for FAQ) or clear topic labels?
- Is there structured data (tables, lists) that an AI could parse?
- Does it avoid fluff and get to the point?

Content type: ${sample.type}
Title: "${sample.title}"
Full content:
---
${sample.full_content}
---

Respond ONLY in this JSON format:
{"score": <1-5>, "reason": "<one sentence>", "missing": "<what would make it more AEO-ready, or null>"}`;
}

export function buildPromptE(samples: SubtopicSample[], flagshipTopic: string): string {
  const list = samples.map((s, i) => `${i + 1}. slug: "${s.slug}", pillar_topic: "${s.pillar_topic}"`).join('\n');
  return `Score each subtopic 1-5 on whether it represents real, targetable search demand for the parent topic.

A score of 5 means: this is a clear, specific subtopic that people actively search for.
A score of 1 means: this is noise, too vague, or unrelated to the parent topic.

Parent topic: "${flagshipTopic}"
Subtopics to evaluate:
${list}

Respond ONLY in this JSON format:
{"scores": [{"slug": "<slug>", "score": <1-5>, "reason": "<one sentence>"}]}`;
}

export function buildPromptF(samples: RawKeywordSample[], flagshipTopic: string): string {
  const list = samples.map((s, i) => `${i + 1}. ${s.keyword} | source: ${s.source}`).join('\n');
  return `Score each keyword 1-5 on whether it is a real, targetable search query for SEO content.

A score of 5 means: someone would actually type this into Google, and a page could rank for it.
A score of 1 means: this is gibberish, too specific (error codes), stale (outdated version numbers), or clearly noise from automated scraping.

Topic context: "${flagshipTopic}"
Keywords to evaluate (with source):
${list}

Respond ONLY in this JSON format:
{"scores": [{"keyword": "<keyword>", "score": <1-5>, "reason": "<one sentence>"}], "junk_rate": <0.0-1.0>}`;
}

// ════════════════════════════════════════════
// Response Parsers (exported for testing)
// ════════════════════════════════════════════

/** Extract JSON from a response that may contain markdown fences or preamble */
function extractJSON(raw: string): string {
  // Try to find JSON in code fences first
  const fenceMatch = raw.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/);
  if (fenceMatch) return fenceMatch[1].trim();
  // Try to find raw JSON object
  const jsonMatch = raw.match(/\{[\s\S]*\}/);
  if (jsonMatch) return jsonMatch[0];
  return raw.trim();
}

export interface ParsedRubricA {
  score: number;
  reason: string;
  misfit_keywords: string[];
}

export function parseResponseA(raw: string): ParsedRubricA {
  const parsed = JSON.parse(extractJSON(raw));
  if (typeof parsed.score !== 'number' || parsed.score < 1 || parsed.score > 5) {
    throw new Error(`Invalid score: ${parsed.score}`);
  }
  return {
    score: parsed.score,
    reason: String(parsed.reason ?? ''),
    misfit_keywords: Array.isArray(parsed.misfit_keywords) ? parsed.misfit_keywords : [],
  };
}

export interface ParsedRubricB {
  score: number;
  reason: string;
  improvement: string | null;
}

export function parseResponseB(raw: string): ParsedRubricB {
  const parsed = JSON.parse(extractJSON(raw));
  if (typeof parsed.score !== 'number' || parsed.score < 1 || parsed.score > 5) {
    throw new Error(`Invalid score: ${parsed.score}`);
  }
  return {
    score: parsed.score,
    reason: String(parsed.reason ?? ''),
    improvement: parsed.improvement ?? null,
  };
}

export interface ParsedRubricC {
  score: number;
  reason: string;
  missing: string | null;
}

export function parseResponseC(raw: string): ParsedRubricC {
  const parsed = JSON.parse(extractJSON(raw));
  if (typeof parsed.score !== 'number' || parsed.score < 1 || parsed.score > 5) {
    throw new Error(`Invalid score: ${parsed.score}`);
  }
  return {
    score: parsed.score,
    reason: String(parsed.reason ?? ''),
    missing: parsed.missing ?? null,
  };
}

export interface ParsedRubricE {
  scores: Array<{ slug: string; score: number; reason: string }>;
}

export function parseResponseE(raw: string): ParsedRubricE {
  const parsed = JSON.parse(extractJSON(raw));
  if (!Array.isArray(parsed.scores)) {
    throw new Error('Missing scores array');
  }
  return {
    scores: parsed.scores.map((s: { slug?: string; score?: number; reason?: string }) => {
      if (typeof s.score !== 'number' || s.score < 1 || s.score > 5) {
        throw new Error(`Invalid score for ${s.slug}: ${s.score}`);
      }
      return { slug: String(s.slug ?? ''), score: s.score, reason: String(s.reason ?? '') };
    }),
  };
}

export interface ParsedRubricF {
  scores: Array<{ keyword: string; score: number; reason: string }>;
  junk_rate: number;
}

export function parseResponseF(raw: string): ParsedRubricF {
  const parsed = JSON.parse(extractJSON(raw));
  if (!Array.isArray(parsed.scores)) {
    throw new Error('Missing scores array');
  }
  return {
    scores: parsed.scores.map((s: { keyword?: string; score?: number; reason?: string }) => {
      if (typeof s.score !== 'number' || s.score < 1 || s.score > 5) {
        throw new Error(`Invalid score for ${s.keyword}: ${s.score}`);
      }
      return { keyword: String(s.keyword ?? ''), score: s.score, reason: String(s.reason ?? '') };
    }),
    junk_rate: typeof parsed.junk_rate === 'number' ? parsed.junk_rate : 0,
  };
}

// ════════════════════════════════════════════
// Rubric A — Keyword Group Coherence
// ════════════════════════════════════════════

export async function checkKeywordCoherence(
  db: Database.Database,
  callLLM: LLMCallFn,
  opts?: QualityCheckOptions & { limit?: number },
): Promise<KeywordCoherenceResult> {
  const samples = sampleKeywordGroups(db, { topic: opts?.topic, limit: opts?.limit ?? 10 });
  if (samples.length === 0) {
    return { status: 'info' as CheckStatus, samples_scored: 0, average_score: 0, worst_groups: [], errors: [] };
  }

  const scores: Array<{ group_id: number; primary_keyword: string; score: number; reason: string }> = [];
  const errors: string[] = [];

  for (const sample of samples) {
    if (opts?.dryRun) {
      scores.push({ group_id: sample.group_id, primary_keyword: sample.primary_keyword, score: 0, reason: '[dry-run]' });
      continue;
    }
    try {
      const resp = await callLLM('You are an SEO quality evaluator. Respond only in JSON.', buildPromptA(sample));
      const parsed = parseResponseA(resp.content);
      scores.push({ group_id: sample.group_id, primary_keyword: sample.primary_keyword, score: parsed.score, reason: parsed.reason });
    } catch (err) {
      errors.push(`Group ${sample.group_id} (${sample.primary_keyword}): ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  const validScores = scores.filter(s => s.score > 0);
  const avg = validScores.length > 0 ? validScores.reduce((sum, s) => sum + s.score, 0) / validScores.length : 0;
  const worst = [...validScores].sort((a, b) => a.score - b.score).slice(0, 5);

  let status: CheckStatus = 'green';
  if (avg > 0 && avg < 2.5) status = 'red';
  else if (avg > 0 && avg < 3.5) status = 'yellow';
  if (opts?.dryRun) status = 'info' as CheckStatus;

  return { status, samples_scored: validScores.length, average_score: Math.round(avg * 100) / 100, worst_groups: worst, errors };
}

// ════════════════════════════════════════════
// Rubric B — Content Search Intent Match
// ════════════════════════════════════════════

export async function checkContentIntentMatch(
  contentSamples: ContentSample[],
  callLLM: LLMCallFn,
  opts?: QualityCheckOptions,
): Promise<ContentIntentMatchResult> {
  if (contentSamples.length === 0) {
    return { status: 'info' as CheckStatus, samples_scored: 0, average_score: 0, by_type: {}, worst_pieces: [], errors: [] };
  }

  const scores: Array<{ slug: string; type: string; score: number; reason: string }> = [];
  const errors: string[] = [];

  for (const sample of contentSamples) {
    if (opts?.dryRun) {
      scores.push({ slug: sample.slug, type: sample.type, score: 0, reason: '[dry-run]' });
      continue;
    }
    try {
      const resp = await callLLM('You are an SEO quality evaluator. Respond only in JSON.', buildPromptB(sample));
      const parsed = parseResponseB(resp.content);
      scores.push({ slug: sample.slug, type: sample.type, score: parsed.score, reason: parsed.reason });
    } catch (err) {
      errors.push(`${sample.type}/${sample.slug}: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  const validScores = scores.filter(s => s.score > 0);
  const avg = validScores.length > 0 ? validScores.reduce((sum, s) => sum + s.score, 0) / validScores.length : 0;

  // Group by type
  const byType: Record<string, { average: number; count: number }> = {};
  for (const s of validScores) {
    if (!byType[s.type]) byType[s.type] = { average: 0, count: 0 };
    byType[s.type].average += s.score;
    byType[s.type].count++;
  }
  for (const key of Object.keys(byType)) {
    byType[key].average = Math.round((byType[key].average / byType[key].count) * 100) / 100;
  }

  const worst = [...validScores].sort((a, b) => a.score - b.score).slice(0, 5);

  let status: CheckStatus = 'green';
  if (avg > 0 && avg < 3.0) status = 'red';
  else if (avg > 0 && avg < 4.0) status = 'yellow';
  if (opts?.dryRun) status = 'info' as CheckStatus;

  return { status, samples_scored: validScores.length, average_score: Math.round(avg * 100) / 100, by_type: byType, worst_pieces: worst, errors };
}

// ════════════════════════════════════════════
// Rubric C — Content AEO Readiness
// ════════════════════════════════════════════

export async function checkContentAEO(
  contentSamples: ContentSample[],
  callLLM: LLMCallFn,
  opts?: QualityCheckOptions,
): Promise<ContentAEOResult> {
  if (contentSamples.length === 0) {
    return { status: 'info' as CheckStatus, samples_scored: 0, average_score: 0, by_type: {}, common_issues: [], errors: [] };
  }

  const scores: Array<{ slug: string; type: string; score: number; reason: string; missing: string | null }> = [];
  const errors: string[] = [];

  for (const sample of contentSamples) {
    if (opts?.dryRun) {
      scores.push({ slug: sample.slug, type: sample.type, score: 0, reason: '[dry-run]', missing: null });
      continue;
    }
    try {
      const resp = await callLLM('You are an SEO quality evaluator. Respond only in JSON.', buildPromptC(sample));
      const parsed = parseResponseC(resp.content);
      scores.push({ slug: sample.slug, type: sample.type, score: parsed.score, reason: parsed.reason, missing: parsed.missing });
    } catch (err) {
      errors.push(`${sample.type}/${sample.slug}: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  const validScores = scores.filter(s => s.score > 0);
  const avg = validScores.length > 0 ? validScores.reduce((sum, s) => sum + s.score, 0) / validScores.length : 0;

  // Group by type
  const byType: Record<string, { average: number; count: number }> = {};
  for (const s of validScores) {
    if (!byType[s.type]) byType[s.type] = { average: 0, count: 0 };
    byType[s.type].average += s.score;
    byType[s.type].count++;
  }
  for (const key of Object.keys(byType)) {
    byType[key].average = Math.round((byType[key].average / byType[key].count) * 100) / 100;
  }

  // Collect common issues from "missing" field
  const missingCounts = new Map<string, number>();
  for (const s of validScores) {
    if (s.missing) {
      missingCounts.set(s.missing, (missingCounts.get(s.missing) ?? 0) + 1);
    }
  }
  const commonIssues = [...missingCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([issue]) => issue);

  let status: CheckStatus = 'green';
  if (avg > 0 && avg < 2.5) status = 'red';
  else if (avg > 0 && avg < 3.5) status = 'yellow';
  if (opts?.dryRun) status = 'info' as CheckStatus;

  return { status, samples_scored: validScores.length, average_score: Math.round(avg * 100) / 100, by_type: byType, common_issues: commonIssues, errors };
}

// ════════════════════════════════════════════
// Rubric E — Subtopic Discovery Quality
// ════════════════════════════════════════════

export async function checkSubtopicDiscovery(
  db: Database.Database,
  callLLM: LLMCallFn,
  opts?: QualityCheckOptions & { limit?: number },
): Promise<SubtopicDiscoveryResult> {
  const samples = sampleSubtopics(db, { limit: opts?.limit ?? 10 });
  if (samples.length === 0) {
    return { status: 'info' as CheckStatus, samples_scored: 0, average_score: 0, worst_subtopics: [], errors: [] };
  }

  if (opts?.dryRun) {
    return { status: 'info' as CheckStatus, samples_scored: 0, average_score: 0, worst_subtopics: [], errors: [] };
  }

  // Determine flagship topic for context
  const flagshipTopic = samples[0]?.pillar_topic ?? 'AI tools';

  try {
    const resp = await callLLM('You are an SEO quality evaluator. Respond only in JSON.', buildPromptE(samples, flagshipTopic));
    const parsed = parseResponseE(resp.content);

    const avg = parsed.scores.length > 0
      ? parsed.scores.reduce((sum, s) => sum + s.score, 0) / parsed.scores.length
      : 0;
    const worst = [...parsed.scores].sort((a, b) => a.score - b.score).slice(0, 5);

    let status: CheckStatus = 'green';
    if (avg < 2.5) status = 'red';
    else if (avg < 3.5) status = 'yellow';

    return {
      status,
      samples_scored: parsed.scores.length,
      average_score: Math.round(avg * 100) / 100,
      worst_subtopics: worst,
      errors: [],
    };
  } catch (err) {
    return {
      status: 'error' as CheckStatus,
      samples_scored: 0,
      average_score: 0,
      worst_subtopics: [],
      errors: [`Batch scoring failed: ${err instanceof Error ? err.message : String(err)}`],
    };
  }
}

// ════════════════════════════════════════════
// Rubric F — Raw Keyword Quality
// ════════════════════════════════════════════

export async function checkRawKeywordQuality(
  db: Database.Database,
  callLLM: LLMCallFn,
  opts?: QualityCheckOptions & { limit?: number },
): Promise<RawKeywordQualityResult> {
  const samples = sampleRawKeywords(db, { topic: opts?.topic, limit: opts?.limit ?? 20 });
  if (samples.length === 0) {
    return { status: 'info' as CheckStatus, samples_scored: 0, average_score: 0, junk_rate: 0, junk_rate_by_source: {}, worst_keywords: [], errors: [] };
  }

  if (opts?.dryRun) {
    return { status: 'info' as CheckStatus, samples_scored: 0, average_score: 0, junk_rate: 0, junk_rate_by_source: {}, worst_keywords: [], errors: [] };
  }

  // Determine flagship topic for context
  const flagshipTopic = samples[0]?.cluster_slug ?? 'AI tools';

  try {
    const resp = await callLLM('You are an SEO quality evaluator. Respond only in JSON.', buildPromptF(samples, flagshipTopic));
    const parsed = parseResponseF(resp.content);

    const avg = parsed.scores.length > 0
      ? parsed.scores.reduce((sum, s) => sum + s.score, 0) / parsed.scores.length
      : 0;
    const worst = [...parsed.scores].sort((a, b) => a.score - b.score).slice(0, 5);

    // Compute junk_rate_by_source
    const bySource: Record<string, { junk: number; total: number }> = {};
    for (const scored of parsed.scores) {
      const sample = samples.find(s => s.keyword === scored.keyword);
      const source = sample?.source ?? 'unknown';
      if (!bySource[source]) bySource[source] = { junk: 0, total: 0 };
      bySource[source].total++;
      if (scored.score <= 2) bySource[source].junk++;
    }
    const junkRateBySource: Record<string, number> = {};
    for (const [source, { junk, total }] of Object.entries(bySource)) {
      junkRateBySource[source] = Math.round((junk / total) * 100) / 100;
    }

    let status: CheckStatus = 'green';
    if (parsed.junk_rate > 0.30) status = 'red';
    else if (parsed.junk_rate > 0.15) status = 'yellow';

    return {
      status,
      samples_scored: parsed.scores.length,
      average_score: Math.round(avg * 100) / 100,
      junk_rate: parsed.junk_rate,
      junk_rate_by_source: junkRateBySource,
      worst_keywords: worst,
      errors: [],
    };
  } catch (err) {
    return {
      status: 'error' as CheckStatus,
      samples_scored: 0,
      average_score: 0,
      junk_rate: 0,
      junk_rate_by_source: {},
      worst_keywords: [],
      errors: [`Batch scoring failed: ${err instanceof Error ? err.message : String(err)}`],
    };
  }
}

// ════════════════════════════════════════════
// Run all LLM quality checks
// ════════════════════════════════════════════

export async function runLLMQualityChecks(
  db: Database.Database,
  callLLM: LLMCallFn,
  opts?: QualityCheckOptions,
): Promise<LLMQualityReport> {
  let llmCalls = 0;
  const countingCallLLM: LLMCallFn = async (sys, user) => {
    llmCalls++;
    return callLLM(sys, user);
  };

  // Sample content once for B+C (shared samples)
  const contentRoot = opts?.contentRoot ?? process.cwd();
  const contentSamples = sampleContent(db, contentRoot, { topic: opts?.topic });

  // Run all LLM rubrics — pure logic rubrics D/G/H are handled separately
  const [keywordCoherence, contentIntentMatch, contentAeo, subtopicDiscovery, keywordQuality] =
    await Promise.all([
      checkKeywordCoherence(db, countingCallLLM, opts),
      checkContentIntentMatch(contentSamples, countingCallLLM, opts),
      checkContentAEO(contentSamples, countingCallLLM, opts),
      checkSubtopicDiscovery(db, countingCallLLM, opts),
      checkRawKeywordQuality(db, countingCallLLM, opts),
    ]);

  return {
    keyword_coherence: keywordCoherence,
    content_intent_match: contentIntentMatch,
    content_aeo_readiness: contentAeo,
    subtopic_discovery: subtopicDiscovery,
    keyword_quality: keywordQuality,
    llm_calls: llmCalls,
  };
}
