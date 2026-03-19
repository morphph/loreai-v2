/**
 * scripts/lib/seo/planning.ts — Gap identification and content planning
 *
 * Unified planning for both auto-discovered (DB) and flagship (JSON) clusters.
 * Strategic content ordering: Compare → FAQ → Glossary → Topic Hub
 * (Cornerstone is handled separately in cluster mode)
 */
import fs from 'fs';
import path from 'path';
import { getDb } from '../db';
import { slugify, contentExists, contentFileExists } from './helpers';
import type { ClusterRow, KeywordRow, PageJob, SEOPageType, ContentPlan, ClusterDefinition } from './types';

// ============================================================
// Cluster Tier
// ============================================================

export type ClusterTier = 'auto' | 'flagship';

export interface UnifiedCluster {
  slug: string;
  pillar_topic: string;
  mention_count: number;
  has_topic_hub: number;
  brave_related_json: string | null;
  tier: ClusterTier;
  /** Only set for flagship clusters */
  definition?: ClusterDefinition;
}

// ============================================================
// Unified Cluster Loading
// ============================================================

/**
 * Load all clusters from both sources:
 * - Auto tier: from DB topic_clusters table (mention_count >= 2)
 * - Flagship tier: from data/flagship-clusters/*.json files
 *
 * If a cluster exists in both (e.g., "claude-code"), the flagship
 * definition takes precedence (merged with DB mention_count).
 */
export function loadAllClusters(): UnifiedCluster[] {
  console.log('\n📊 Loading All Clusters (unified)');

  const db = getDb();

  // 1. Load auto clusters from DB
  const dbClusters = db
    .prepare(
      `SELECT slug, pillar_topic, mention_count, has_topic_hub, brave_related_json
       FROM topic_clusters
       WHERE mention_count >= 2
       ORDER BY mention_count DESC`
    )
    .all() as ClusterRow[];

  const unified = new Map<string, UnifiedCluster>();

  for (const c of dbClusters) {
    unified.set(c.slug, {
      ...c,
      tier: 'auto',
    });
  }

  // 2. Load flagship clusters from JSON files
  const flagshipDir = path.join(process.cwd(), 'data', 'flagship-clusters');
  if (fs.existsSync(flagshipDir)) {
    const files = fs.readdirSync(flagshipDir).filter(f => f.endsWith('.json') && !f.startsWith('.'));
    for (const file of files) {
      try {
        const def: ClusterDefinition = JSON.parse(
          fs.readFileSync(path.join(flagshipDir, file), 'utf-8')
        );
        const existing = unified.get(def.topic_slug);
        unified.set(def.topic_slug, {
          slug: def.topic_slug,
          pillar_topic: def.pillar_topic,
          mention_count: existing?.mention_count ?? 0,
          has_topic_hub: existing?.has_topic_hub ?? 0,
          brave_related_json: existing?.brave_related_json ?? null,
          tier: 'flagship',
          definition: def,
        });
      } catch {
        console.warn(`  Warning: could not parse ${file}`);
      }
    }
  }

  const result = Array.from(unified.values());
  // Sort: flagship first (strategic priority), then by mention_count
  result.sort((a, b) => {
    if (a.tier !== b.tier) return a.tier === 'flagship' ? -1 : 1;
    return b.mention_count - a.mention_count;
  });

  const flagshipCount = result.filter(c => c.tier === 'flagship').length;
  const autoCount = result.filter(c => c.tier === 'auto').length;
  console.log(`  Found ${result.length} clusters (${flagshipCount} flagship, ${autoCount} auto)`);
  for (const c of result.slice(0, 10)) {
    const badge = c.tier === 'flagship' ? '⭐' : '  ';
    console.log(`    ${badge} ${c.mention_count}x: ${c.pillar_topic} (${c.slug})`);
  }
  if (result.length > 10) {
    console.log(`    ... and ${result.length - 10} more`);
  }

  return result;
}

// ============================================================
// Strategic Content Priority
// ============================================================

/** Priority order for content types (lower = generate first) */
const TYPE_PRIORITY: Record<SEOPageType, number> = {
  compare: 1,   // Highest commercial intent
  faq: 2,       // Long-tail + PAA capture
  glossary: 3,  // Entity definitions
  topics: 4,    // Needs content to link to
};

/**
 * Plan jobs for a flagship cluster from its definition.
 * Uses the target lists in the cluster JSON.
 */
export function planFlagshipJobs(cluster: UnifiedCluster): PageJob[] {
  const def = cluster.definition;
  if (!def) return [];

  const jobs: PageJob[] = [];

  // Compare pages
  for (const c of def.target_compare) {
    if (c.status !== 'missing') continue;
    if (contentFileExists('compare', c.slug, 'en')) continue;
    jobs.push({
      type: 'compare',
      slug: c.slug,
      displayTerm: `${c.item_a} vs ${c.item_b}`,
      clusterSlug: def.topic_slug,
      pillarTopic: def.pillar_topic,
      context: { item_a: c.item_a, item_b: c.item_b },
      priority: c.priority,
    });
  }

  // FAQ pages
  for (const f of def.target_faq) {
    if (f.status !== 'missing') continue;
    if (contentFileExists('faq', f.slug, 'en')) continue;
    jobs.push({
      type: 'faq',
      slug: f.slug,
      displayTerm: f.question,
      clusterSlug: def.topic_slug,
      pillarTopic: def.pillar_topic,
      context: { question: f.question },
      priority: f.priority,
    });
  }

  // Glossary
  for (const g of def.target_glossary) {
    if (g.status !== 'missing') continue;
    if (contentFileExists('glossary', g.slug, 'en')) continue;
    jobs.push({
      type: 'glossary',
      slug: g.slug,
      displayTerm: g.display_term,
      clusterSlug: def.topic_slug,
      pillarTopic: def.pillar_topic,
      context: {},
    });
  }

  return jobs;
}

// ============================================================
// Stage 1: Load Topic Clusters from DB
// ============================================================

export function loadClusters(): ClusterRow[] {
  console.log('\n📊 Stage 1: Load Topic Clusters');

  const db = getDb();
  const clusters = db
    .prepare(
      `SELECT slug, pillar_topic, mention_count, has_topic_hub, brave_related_json
       FROM topic_clusters
       WHERE mention_count >= 2
       ORDER BY mention_count DESC`
    )
    .all() as ClusterRow[];

  console.log(`  Found ${clusters.length} active clusters (mention_count >= 2)`);
  for (const c of clusters.slice(0, 10)) {
    console.log(`    ${c.mention_count}x: ${c.pillar_topic} (${c.slug})`);
  }
  if (clusters.length > 10) {
    console.log(`    ... and ${clusters.length - 10} more`);
  }

  return clusters;
}

// ============================================================
// Stage 2: Load Keywords per Cluster
// ============================================================

export function loadKeywords(clusters: ClusterRow[]): Map<string, KeywordRow[]> {
  console.log('\n🔑 Stage 2: Load Keywords');

  const db = getDb();
  const keywordMap = new Map<string, KeywordRow[]>();

  for (const cluster of clusters) {
    const keywords = db
      .prepare('SELECT * FROM keywords WHERE cluster_slug = ?')
      .all(cluster.slug) as KeywordRow[];

    keywordMap.set(cluster.slug, keywords);
  }

  const totalKeywords = Array.from(keywordMap.values()).reduce((sum, kws) => sum + kws.length, 0);
  console.log(`  Loaded ${totalKeywords} keywords across ${keywordMap.size} clusters`);

  return keywordMap;
}

// ============================================================
// Stage 3: Identify Content Gaps
// ============================================================

export function identifyGaps(
  clusters: ClusterRow[],
  keywordMap: Map<string, KeywordRow[]>,
  maxPagesPerRun: number = 8
): PageJob[] {
  console.log('\n🕳️  Stage 3: Identify Content Gaps');

  const jobs: PageJob[] = [];

  for (const cluster of clusters) {
    const keywords = keywordMap.get(cluster.slug) || [];
    const termSlug = cluster.slug;

    // --- Glossary: pillar_topic needs a glossary entry ---
    if (!contentExists('glossary', termSlug)) {
      jobs.push({
        type: 'glossary',
        slug: termSlug,
        displayTerm: cluster.pillar_topic,
        clusterSlug: cluster.slug,
        pillarTopic: cluster.pillar_topic,
        context: {},
      });
    }

    // --- FAQ: from Brave discussion keywords ---
    const discussionKeywords = keywords.filter((kw) => kw.source === 'brave-discussion' && !kw.content_exists);
    for (const dk of discussionKeywords.slice(0, 2)) {
      const faqSlug = slugify(dk.keyword);
      if (faqSlug && !contentExists('faq', faqSlug)) {
        jobs.push({
          type: 'faq',
          slug: faqSlug,
          displayTerm: dk.keyword,
          clusterSlug: cluster.slug,
          pillarTopic: cluster.pillar_topic,
          context: { question: dk.keyword },
        });
      }
    }

    // --- FAQ: from blog-faq source keywords ---
    const blogFaqKeywords = keywords.filter((kw) => kw.source.startsWith('blog-faq:') && !kw.content_exists);
    for (const bfk of blogFaqKeywords.slice(0, 2)) {
      const faqSlug = slugify(bfk.keyword);
      if (faqSlug && !contentExists('faq', faqSlug)) {
        jobs.push({
          type: 'faq',
          slug: faqSlug,
          displayTerm: bfk.keyword,
          clusterSlug: cluster.slug,
          pillarTopic: cluster.pillar_topic,
          context: { question: bfk.keyword },
        });
      }
    }

    // --- Compare: from "vs" keyword patterns ---
    const vsKeywords = keywords.filter(
      (kw) =>
        (kw.keyword.includes(' vs ') || kw.keyword.includes('-vs-') || kw.source.startsWith('blog-compare:')) &&
        !kw.content_exists
    );
    for (const vk of vsKeywords.slice(0, 2)) {
      const compareSlug = slugify(vk.keyword);
      if (compareSlug && !contentExists('compare', compareSlug)) {
        // Extract item_a and item_b from the "X vs Y" pattern
        const vsMatch = vk.keyword.match(/^(.+?)\s+vs\.?\s+(.+)$/i) ||
                         vk.keyword.match(/^(.+?)-vs-(.+)$/i);
        const itemA = vsMatch ? vsMatch[1].trim() : cluster.pillar_topic;
        const itemB = vsMatch ? vsMatch[2].trim() : vk.keyword;

        jobs.push({
          type: 'compare',
          slug: compareSlug,
          displayTerm: vk.keyword,
          clusterSlug: cluster.slug,
          pillarTopic: cluster.pillar_topic,
          context: { item_a: itemA, item_b: itemB },
        });
      }
    }

    // --- Topic Hub: clusters with 5+ mentions and no existing hub ---
    if (cluster.mention_count >= 5 && !cluster.has_topic_hub && !contentExists('topics', termSlug)) {
      // Parse Brave data for extra context
      let braveData: { related_keywords?: string[]; discussions?: string[] } = {};
      if (cluster.brave_related_json) {
        try {
          braveData = JSON.parse(cluster.brave_related_json);
        } catch {
          // ignore parse errors
        }
      }

      jobs.push({
        type: 'topics',
        slug: termSlug,
        displayTerm: cluster.pillar_topic,
        clusterSlug: cluster.slug,
        pillarTopic: cluster.pillar_topic,
        context: {
          related_keywords: braveData.related_keywords || [],
          discussions: braveData.discussions || [],
          mention_count: cluster.mention_count,
        },
      });
    }
  }

  // Deduplicate jobs by type+slug
  const seen = new Set<string>();
  const deduped: PageJob[] = [];
  for (const job of jobs) {
    const key = `${job.type}:${job.slug}`;
    if (!seen.has(key)) {
      seen.add(key);
      deduped.push(job);
    }
  }

  console.log(`  Content gaps found: ${deduped.length} pages`);
  const byType = { glossary: 0, faq: 0, compare: 0, topics: 0 };
  for (const job of deduped) {
    byType[job.type]++;
  }
  console.log(`    Glossary: ${byType.glossary}, FAQ: ${byType.faq}, Compare: ${byType.compare}, Topics: ${byType.topics}`);

  // Strategic ordering: Compare → FAQ → Glossary → Topics
  // Within each type, preserve discovery order (higher mention_count clusters first)
  const limited = applyStrategicOrdering(deduped, maxPagesPerRun);

  for (const job of limited) {
    console.log(`    [${job.type}] ${job.slug} — "${job.displayTerm}"`);
  }

  return limited;
}

// ============================================================
// Unified Planning (both auto + flagship)
// ============================================================

/**
 * Plan content for all clusters (both tiers).
 * Flagship clusters contribute their curated target lists.
 * Auto clusters contribute DB-derived gaps.
 * All jobs are merged, deduped, and strategically ordered.
 */
export function planAllContent(
  allClusters: UnifiedCluster[],
  keywordMap: Map<string, KeywordRow[]>,
  maxPagesPerRun: number = 8
): PageJob[] {
  console.log('\n🕳️  Planning Content (unified)');

  const allJobs: PageJob[] = [];

  for (const cluster of allClusters) {
    if (cluster.tier === 'flagship' && cluster.definition) {
      // Flagship: use curated target lists
      const flagshipJobs = planFlagshipJobs(cluster);
      allJobs.push(...flagshipJobs);
    }

    // All clusters (including flagship): also check DB keywords for gaps
    const keywords = keywordMap.get(cluster.slug) || [];
    const termSlug = cluster.slug;

    if (!contentExists('glossary', termSlug)) {
      allJobs.push({
        type: 'glossary',
        slug: termSlug,
        displayTerm: cluster.pillar_topic,
        clusterSlug: cluster.slug,
        pillarTopic: cluster.pillar_topic,
        context: {},
      });
    }

    // FAQ from keywords
    const discussionKeywords = keywords.filter((kw) => kw.source === 'brave-discussion' && !kw.content_exists);
    for (const dk of discussionKeywords.slice(0, 2)) {
      const faqSlug = slugify(dk.keyword);
      if (faqSlug && !contentExists('faq', faqSlug)) {
        allJobs.push({
          type: 'faq',
          slug: faqSlug,
          displayTerm: dk.keyword,
          clusterSlug: cluster.slug,
          pillarTopic: cluster.pillar_topic,
          context: { question: dk.keyword },
        });
      }
    }
    const blogFaqKeywords = keywords.filter((kw) => kw.source.startsWith('blog-faq:') && !kw.content_exists);
    for (const bfk of blogFaqKeywords.slice(0, 2)) {
      const faqSlug = slugify(bfk.keyword);
      if (faqSlug && !contentExists('faq', faqSlug)) {
        allJobs.push({
          type: 'faq',
          slug: faqSlug,
          displayTerm: bfk.keyword,
          clusterSlug: cluster.slug,
          pillarTopic: cluster.pillar_topic,
          context: { question: bfk.keyword },
        });
      }
    }

    // Compare from keywords
    const vsKeywords = keywords.filter(
      (kw) =>
        (kw.keyword.includes(' vs ') || kw.keyword.includes('-vs-') || kw.source.startsWith('blog-compare:')) &&
        !kw.content_exists
    );
    for (const vk of vsKeywords.slice(0, 2)) {
      const compareSlug = slugify(vk.keyword);
      if (compareSlug && !contentExists('compare', compareSlug)) {
        const vsMatch = vk.keyword.match(/^(.+?)\s+vs\.?\s+(.+)$/i) ||
                         vk.keyword.match(/^(.+?)-vs-(.+)$/i);
        const itemA = vsMatch ? vsMatch[1].trim() : cluster.pillar_topic;
        const itemB = vsMatch ? vsMatch[2].trim() : vk.keyword;
        allJobs.push({
          type: 'compare',
          slug: compareSlug,
          displayTerm: vk.keyword,
          clusterSlug: cluster.slug,
          pillarTopic: cluster.pillar_topic,
          context: { item_a: itemA, item_b: itemB },
        });
      }
    }

    // Topic Hub
    if (cluster.mention_count >= 5 && !cluster.has_topic_hub && !contentExists('topics', termSlug)) {
      let braveData: { related_keywords?: string[]; discussions?: string[] } = {};
      if (cluster.brave_related_json) {
        try { braveData = JSON.parse(cluster.brave_related_json); } catch { /* ignore */ }
      }
      allJobs.push({
        type: 'topics',
        slug: termSlug,
        displayTerm: cluster.pillar_topic,
        clusterSlug: cluster.slug,
        pillarTopic: cluster.pillar_topic,
        context: {
          related_keywords: braveData.related_keywords || [],
          discussions: braveData.discussions || [],
          mention_count: cluster.mention_count,
        },
      });
    }
  }

  // Deduplicate by type+slug (flagship targets win over DB-derived)
  const seen = new Set<string>();
  const deduped: PageJob[] = [];
  for (const job of allJobs) {
    const key = `${job.type}:${job.slug}`;
    if (!seen.has(key)) {
      seen.add(key);
      deduped.push(job);
    }
  }

  console.log(`  Content gaps found: ${deduped.length} pages`);
  const byType = { glossary: 0, faq: 0, compare: 0, topics: 0 };
  for (const job of deduped) byType[job.type]++;
  console.log(`    Compare: ${byType.compare}, FAQ: ${byType.faq}, Glossary: ${byType.glossary}, Topics: ${byType.topics}`);

  return applyStrategicOrdering(deduped, maxPagesPerRun);
}

// ============================================================
// Strategic Ordering
// ============================================================

/**
 * Apply strategic content ordering:
 * 1. Sort by type priority (Compare → FAQ → Glossary → Topics)
 * 2. Within each type, sort by explicit priority then discovery order
 * 3. Round-robin across types to prevent starvation
 * 4. Limit to maxPagesPerRun
 */
function applyStrategicOrdering(jobs: PageJob[], maxPagesPerRun: number): PageJob[] {
  // Sort each type's queue by priority (lower = higher priority)
  const queues: Record<SEOPageType, PageJob[]> = { glossary: [], faq: [], compare: [], topics: [] };
  for (const job of jobs) {
    queues[job.type].push(job);
  }
  for (const type of Object.keys(queues) as SEOPageType[]) {
    queues[type].sort((a, b) => (a.priority ?? 99) - (b.priority ?? 99));
  }

  // Strategic type order: Compare → FAQ → Glossary → Topics
  const typeOrder: SEOPageType[] = ['compare', 'faq', 'glossary', 'topics'];
  const result: PageJob[] = [];
  let emptyRounds = 0;
  while (result.length < maxPagesPerRun && emptyRounds < typeOrder.length) {
    emptyRounds = 0;
    for (const type of typeOrder) {
      if (result.length >= maxPagesPerRun) break;
      const next = queues[type].shift();
      if (next) { result.push(next); } else { emptyRounds++; }
    }
  }
  if (jobs.length > maxPagesPerRun) {
    console.log(`  Limiting to ${maxPagesPerRun} pages per run (${jobs.length - maxPagesPerRun} deferred)`);
  }
  return result;
}

// ============================================================
// Weekly Content Plan generation
// ============================================================

export function generateContentPlan(
  clusters: Array<{ slug: string; pillar_topic: string; mention_count: number }>,
  gaps: Array<{ cluster: string; missing: string[] }>,
  braveResults: Array<{ topic: string; has_search_demand: boolean }>,
  date: string
): ContentPlan {
  const db = getDb();

  // Compute week number
  const d = new Date(date);
  const dUtc = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const dayNum = dUtc.getUTCDay() || 7;
  dUtc.setUTCDate(dUtc.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(dUtc.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil(((dUtc.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  const weekStr = `${dUtc.getUTCFullYear()}-W${String(weekNo).padStart(2, '0')}`;

  const plan: ContentPlan = {
    week: weekStr,
    generated_at: new Date().toISOString(),
    glossary: [],
    faq: [],
    compare: [],
    topics: [],
  };

  // Build a set of topics with high Brave search demand
  const highDemandTopics = new Set(
    braveResults.filter((r) => r.has_search_demand).map((r) => r.topic.toLowerCase())
  );

  for (const cluster of clusters) {
    const termSlug = slugify(cluster.pillar_topic);
    const hasDemand = highDemandTopics.has(cluster.pillar_topic.toLowerCase());
    const basePriority = hasDemand ? 1 : 2;

    // Glossary
    if (!contentExists('glossary', termSlug)) {
      plan.glossary.push({
        slug: termSlug,
        term: cluster.pillar_topic,
        cluster: cluster.slug,
        priority: basePriority,
      });
    }

    // Topic hub
    if (cluster.mention_count >= 5 && !contentExists('topics', termSlug)) {
      plan.topics.push({
        slug: termSlug,
        topic: cluster.pillar_topic,
        mention_count: cluster.mention_count,
        priority: basePriority,
      });
    }

    // FAQ from keywords
    const keywords = db
      .prepare("SELECT keyword FROM keywords WHERE cluster_slug = ? AND source IN ('brave-discussion', 'blog-faq') AND content_exists = 0")
      .all(cluster.slug) as Array<{ keyword: string }>;

    for (const kw of keywords.slice(0, 3)) {
      const faqSlug = slugify(kw.keyword);
      if (faqSlug && !contentExists('faq', faqSlug)) {
        plan.faq.push({
          slug: faqSlug,
          question: kw.keyword,
          cluster: cluster.slug,
          priority: basePriority + 1,
        });
      }
    }

    // Compare from keywords
    const vsKeywords = db
      .prepare("SELECT keyword FROM keywords WHERE cluster_slug = ? AND (keyword LIKE '%vs%' OR source LIKE 'blog-compare:%') AND content_exists = 0")
      .all(cluster.slug) as Array<{ keyword: string }>;

    for (const vk of vsKeywords.slice(0, 2)) {
      const compareSlug = slugify(vk.keyword);
      if (compareSlug && !contentExists('compare', compareSlug)) {
        plan.compare.push({
          slug: compareSlug,
          items: vk.keyword,
          cluster: cluster.slug,
          priority: basePriority + 1,
        });
      }
    }
  }

  // Sort each category by priority
  plan.glossary.sort((a, b) => a.priority - b.priority);
  plan.faq.sort((a, b) => a.priority - b.priority);
  plan.compare.sort((a, b) => a.priority - b.priority);
  plan.topics.sort((a, b) => a.priority - b.priority);

  return plan;
}
