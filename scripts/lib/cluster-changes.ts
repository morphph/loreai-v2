/**
 * scripts/lib/cluster-changes.ts — Cluster change detection library
 *
 * Pure filesystem scanning — no LLM, no network calls.
 * Detects newly created and refreshed pages across all flagship clusters.
 */
import fs from 'fs';
import path from 'path';

export interface ClusterPageChange {
  slug: string;
  type: 'compare' | 'faq' | 'glossary' | 'cornerstone' | 'blog';
  title: string;
  action: 'created' | 'refreshed';
  date: string; // YYYY-MM-DD
  url_path: string;
}

export interface ClusterChange {
  cluster_slug: string;
  pillar_topic: string;
  changes: ClusterPageChange[];
}

function pageUrl(type: string, slug: string): string {
  switch (type) {
    case 'compare':
      return `/compare/${slug}`;
    case 'faq':
      return `/faq/${slug}`;
    case 'glossary':
      return `/glossary/${slug}`;
    case 'cornerstone':
    case 'blog':
      return `/blog/${slug}`;
    default:
      return `/blog/${slug}`;
  }
}

function contentFilePath(type: string, slug: string): string {
  const root = process.cwd();
  switch (type) {
    case 'compare':
      return path.join(root, 'content', 'compare', slug, 'en.md');
    case 'faq':
      return path.join(root, 'content', 'faq', slug, 'en.md');
    case 'glossary':
      return path.join(root, 'content', 'glossary', slug, 'en.md');
    case 'cornerstone':
      return path.join(root, 'content', 'blog', 'en', `${slug}.md`);
    case 'blog':
      return path.join(root, 'content', 'blog', 'en', `${slug}.md`);
    default:
      return path.join(root, 'content', 'blog', 'en', `${slug}.md`);
  }
}

function isInRange(dateStr: string, since: string, until: string): boolean {
  return dateStr >= since && dateStr <= until;
}

function mtimeDate(filePath: string): string | null {
  try {
    const stat = fs.statSync(filePath);
    return stat.mtime.toISOString().split('T')[0];
  } catch {
    return null;
  }
}

function readFrontmatterDate(filePath: string): string | null {
  try {
    const raw = fs.readFileSync(filePath, 'utf-8');
    const match = raw.match(/^date:\s*(\d{4}-\d{2}-\d{2})/m);
    return match ? match[1] : null;
  } catch {
    return null;
  }
}

interface ClusterTarget {
  slug: string;
  status?: string;
  item_a?: string;
  item_b?: string;
  question?: string;
  display_term?: string;
}

interface TrackedBlog {
  slug: string;
  title: string;
}

interface RefreshEntry {
  slug: string;
  type?: string;
  refreshed_at?: string;
}

interface ClusterJson {
  topic_slug: string;
  pillar_topic: string;
  cornerstone?: { slug: string; status?: string };
  target_compare?: ClusterTarget[];
  target_faq?: ClusterTarget[];
  target_glossary?: ClusterTarget[];
  tracked_blogs?: TrackedBlog[];
  refresh_needed?: RefreshEntry[];
}

export function getClusterChanges(since: string, until: string): ClusterChange[] {
  const clusterDir = path.join(process.cwd(), 'data', 'flagship-clusters');
  if (!fs.existsSync(clusterDir)) return [];

  const files = fs.readdirSync(clusterDir).filter((f) => f.endsWith('.json') && !f.startsWith('.'));
  const results: ClusterChange[] = [];

  for (const file of files) {
    const raw = fs.readFileSync(path.join(clusterDir, file), 'utf-8');
    let cluster: ClusterJson;
    try {
      cluster = JSON.parse(raw);
    } catch {
      continue;
    }

    if (!cluster.topic_slug || !cluster.pillar_topic) continue;

    const changes: ClusterPageChange[] = [];

    // --- New pages (created): check targets with status "exists" ---
    const targetSets: { type: 'compare' | 'faq' | 'glossary'; targets: ClusterTarget[] }[] = [
      { type: 'compare', targets: cluster.target_compare || [] },
      { type: 'faq', targets: cluster.target_faq || [] },
      { type: 'glossary', targets: cluster.target_glossary || [] },
    ];

    for (const { type, targets } of targetSets) {
      for (const target of targets) {
        if (target.status !== 'exists') continue;
        const filePath = contentFilePath(type, target.slug);
        const mdate = mtimeDate(filePath);
        if (!mdate || !isInRange(mdate, since, until)) continue;

        let title: string;
        if (type === 'compare') title = `${target.item_a || ''} vs ${target.item_b || ''}`.trim();
        else if (type === 'faq') title = target.question || target.slug;
        else title = target.display_term || target.slug;

        changes.push({
          slug: target.slug,
          type,
          title,
          action: 'created',
          date: mdate,
          url_path: pageUrl(type, target.slug),
        });
      }
    }

    // --- Cornerstone ---
    if (cluster.cornerstone && cluster.cornerstone.status === 'exists') {
      const filePath = contentFilePath('cornerstone', cluster.cornerstone.slug);
      const mdate = mtimeDate(filePath);
      if (mdate && isInRange(mdate, since, until)) {
        changes.push({
          slug: cluster.cornerstone.slug,
          type: 'cornerstone',
          title: cluster.pillar_topic,
          action: 'created',
          date: mdate,
          url_path: pageUrl('cornerstone', cluster.cornerstone.slug),
        });
      }
    }

    // --- Refreshed pages (from refresh_needed array) ---
    if (cluster.refresh_needed) {
      for (const entry of cluster.refresh_needed) {
        if (!entry.refreshed_at) continue;
        if (!isInRange(entry.refreshed_at, since, until)) continue;

        changes.push({
          slug: entry.slug,
          type: (entry.type as ClusterPageChange['type']) || 'compare',
          title: entry.slug,
          action: 'refreshed',
          date: entry.refreshed_at,
          url_path: pageUrl(entry.type || 'compare', entry.slug),
        });
      }
    }

    // --- New tracked blogs ---
    if (cluster.tracked_blogs) {
      for (const blog of cluster.tracked_blogs) {
        const filePath = contentFilePath('blog', blog.slug);
        const blogDate = readFrontmatterDate(filePath);
        if (!blogDate || !isInRange(blogDate, since, until)) continue;

        changes.push({
          slug: blog.slug,
          type: 'blog',
          title: blog.title,
          action: 'created',
          date: blogDate,
          url_path: pageUrl('blog', blog.slug),
        });
      }
    }

    if (changes.length > 0) {
      results.push({
        cluster_slug: cluster.topic_slug,
        pillar_topic: cluster.pillar_topic,
        changes,
      });
    }
  }

  return results;
}
