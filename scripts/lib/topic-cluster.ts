import { upsertKeyword, getDb } from './db';
import { validateAndExpand } from './brave';

export interface TopicCluster {
  slug: string;
  pillar_topic: string;
  mention_count: number;
  related_keywords: string[];
  content_gap: string[];
}

export async function braveExpandNewTopics(
  newSeeds: string[],
  maxTopics: number = 3
): Promise<void> {
  const toExpand = newSeeds.slice(0, maxTopics);
  if (toExpand.length === 0) return;

  console.log(`  Brave Search: expanding ${toExpand.length} new topics`);
  const db = getDb();

  for (const slug of toExpand) {
    const cluster = db
      .prepare('SELECT pillar_topic FROM topic_clusters WHERE slug = ?')
      .get(slug) as { pillar_topic: string } | undefined;

    if (!cluster) continue;

    const signal = await validateAndExpand(cluster.pillar_topic);

    // Store related searches as keywords
    for (const keyword of signal.related_keywords) {
      upsertKeyword(keyword, 'brave-related', slug);
    }

    // Store discussions as FAQ candidates
    for (const discussion of signal.discussions) {
      upsertKeyword(discussion, 'brave-discussion', slug);
    }

    // Update cluster with Brave data
    db.prepare(
      `UPDATE topic_clusters
       SET brave_related_json = ?, brave_updated_at = CURRENT_TIMESTAMP
       WHERE slug = ?`
    ).run(JSON.stringify(signal), slug);

    console.log(
      `    "${cluster.pillar_topic}": ${signal.related_keywords.length} related, ${signal.discussions.length} discussions`
    );

    // Rate limit
    await new Promise((r) => setTimeout(r, 1000));
  }
}

// Weekly strategy (called from generate-seo.ts --weekly-strategy)
export function runGapAnalysis(): {
  clusters: TopicCluster[];
  gaps: { cluster: string; missing: string[] }[];
} {
  const db = getDb();

  const clusters = db
    .prepare(
      `SELECT slug, pillar_topic, mention_count, brave_related_json
       FROM topic_clusters
       WHERE mention_count >= 2
       ORDER BY mention_count DESC`
    )
    .all() as Array<{
    slug: string;
    pillar_topic: string;
    mention_count: number;
    brave_related_json: string | null;
  }>;

  const result: TopicCluster[] = [];
  const gaps: { cluster: string; missing: string[] }[] = [];

  for (const c of clusters) {
    const related = c.brave_related_json
      ? JSON.parse(c.brave_related_json).related_keywords || []
      : [];

    // Check which related keywords have content
    const keywords = db
      .prepare('SELECT keyword, content_exists FROM keywords WHERE cluster_slug = ?')
      .all(c.slug) as Array<{ keyword: string; content_exists: number }>;

    const missing = keywords
      .filter((k) => !k.content_exists)
      .map((k) => k.keyword);

    result.push({
      slug: c.slug,
      pillar_topic: c.pillar_topic,
      mention_count: c.mention_count,
      related_keywords: related,
      content_gap: missing,
    });

    if (missing.length > 0) {
      gaps.push({ cluster: c.slug, missing });
    }
  }

  return { clusters: result, gaps };
}
