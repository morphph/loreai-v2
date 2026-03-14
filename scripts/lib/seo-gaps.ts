/**
 * scripts/lib/seo-gaps.ts — SEO gap identification (testable core logic)
 *
 * Extracted from generate-seo.ts so the gap-finding query logic can be
 * unit-tested without filesystem dependencies.
 */
import type Database from 'better-sqlite3';

export type SEOPageType = 'glossary' | 'faq' | 'compare' | 'topics';

export interface GapJob {
  type: SEOPageType;
  slug: string;
  displayTerm: string;
  clusterSlug: string;
  pillarTopic: string;
}

interface ClusterRow {
  slug: string;
  pillar_topic: string;
  mention_count: number;
  has_topic_hub: number;
}

interface KeywordRow {
  keyword: string;
  source: string;
  content_exists: number;
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 60);
}

/**
 * Find SEO content gaps from DB data.
 *
 * @param db - better-sqlite3 Database instance
 * @param contentExists - function to check if content already exists (filesystem + DB)
 *                        defaults to always-false (treat everything as a gap)
 */
export function findSEOGaps(
  db: Database.Database,
  contentExists: (type: SEOPageType, slug: string) => boolean = () => false
): GapJob[] {
  const clusters = db.prepare(`
    SELECT slug, pillar_topic, mention_count, has_topic_hub
    FROM topic_clusters
    WHERE mention_count >= 2
    ORDER BY mention_count DESC
  `).all() as ClusterRow[];

  const jobs: GapJob[] = [];

  for (const cluster of clusters) {
    const keywords = db.prepare(
      'SELECT keyword, source, content_exists FROM keywords WHERE cluster_slug = ?'
    ).all(cluster.slug) as KeywordRow[];

    const termSlug = cluster.slug;

    // Glossary
    if (!contentExists('glossary', termSlug)) {
      jobs.push({
        type: 'glossary',
        slug: termSlug,
        displayTerm: cluster.pillar_topic,
        clusterSlug: cluster.slug,
        pillarTopic: cluster.pillar_topic,
      });
    }

    // FAQ: from blog-faq keywords
    const blogFaqKeywords = keywords.filter(
      (kw) => kw.source.startsWith('blog-faq:') && !kw.content_exists
    );
    for (const bfk of blogFaqKeywords.slice(0, 2)) {
      const faqSlug = slugify(bfk.keyword);
      if (faqSlug && !contentExists('faq', faqSlug)) {
        jobs.push({
          type: 'faq',
          slug: faqSlug,
          displayTerm: bfk.keyword,
          clusterSlug: cluster.slug,
          pillarTopic: cluster.pillar_topic,
        });
      }
    }

    // FAQ: from brave-discussion keywords
    const discussionKeywords = keywords.filter(
      (kw) => kw.source === 'brave-discussion' && !kw.content_exists
    );
    for (const dk of discussionKeywords.slice(0, 2)) {
      const faqSlug = slugify(dk.keyword);
      if (faqSlug && !contentExists('faq', faqSlug)) {
        jobs.push({
          type: 'faq',
          slug: faqSlug,
          displayTerm: dk.keyword,
          clusterSlug: cluster.slug,
          pillarTopic: cluster.pillar_topic,
        });
      }
    }

    // Compare: from blog-compare or "vs" keywords
    const vsKeywords = keywords.filter(
      (kw) =>
        (kw.keyword.includes(' vs ') || kw.keyword.includes('-vs-') || kw.source.startsWith('blog-compare:')) &&
        !kw.content_exists
    );
    for (const vk of vsKeywords.slice(0, 2)) {
      const compareSlug = slugify(vk.keyword);
      if (compareSlug && !contentExists('compare', compareSlug)) {
        jobs.push({
          type: 'compare',
          slug: compareSlug,
          displayTerm: vk.keyword,
          clusterSlug: cluster.slug,
          pillarTopic: cluster.pillar_topic,
        });
      }
    }

    // Topics: clusters with 5+ mentions
    if (cluster.mention_count >= 5 && !cluster.has_topic_hub && !contentExists('topics', termSlug)) {
      jobs.push({
        type: 'topics',
        slug: termSlug,
        displayTerm: cluster.pillar_topic,
        clusterSlug: cluster.slug,
        pillarTopic: cluster.pillar_topic,
      });
    }
  }

  // Deduplicate
  const seen = new Set<string>();
  return jobs.filter((job) => {
    const key = `${job.type}:${job.slug}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
