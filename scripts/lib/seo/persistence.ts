/**
 * scripts/lib/seo/persistence.ts — DB updates, file writes, cluster status
 */
import fs from 'fs';
import path from 'path';
import { getDb } from '../db';
import { contentFileExists } from './helpers';
import type { PageJob, GeneratedPage, ClusterDefinition } from './types';

// ============================================================
// Stage 5: Update Keywords & DB
// ============================================================

export function updateKeywords(jobs: PageJob[], generated: GeneratedPage[]): void {
  console.log('\n📝 Stage 5: Update Keywords & DB');

  const db = getDb();
  const generatedSlugs = new Set(generated.filter((p) => p.lang === 'en').map((p) => `${p.type}:${p.slug}`));

  for (const job of jobs) {
    const key = `${job.type}:${job.slug}`;
    if (!generatedSlugs.has(key)) continue;

    // Mark keyword as having content
    db.prepare(
      `UPDATE keywords SET content_exists = 1, content_type = ?, content_slug = ?
       WHERE keyword = ? OR keyword = ?`
    ).run(job.type, job.slug, job.displayTerm, job.slug);

    // If it's a topic hub, mark the cluster
    if (job.type === 'topics') {
      db.prepare('UPDATE topic_clusters SET has_topic_hub = 1 WHERE slug = ?').run(job.clusterSlug);
    }

    console.log(`  Updated: [${job.type}] ${job.slug} — content_exists=1`);
  }
}

// ============================================================
// Stage 6: Git Push placeholder
// ============================================================

export async function gitPush(generated: GeneratedPage[], dryRun: boolean = false): Promise<void> {
  console.log('\n🚀 Stage 6: Git Push');

  if (generated.length === 0) {
    console.log('  No files to push');
    return;
  }

  if (dryRun) {
    console.log('  [DRY RUN] Would push:');
    for (const page of generated) {
      console.log(`    ${page.filePath}`);
    }
    return;
  }

  // Collect unique content type directories
  const dirs = new Set<string>();
  for (const page of generated) {
    dirs.add(`content/${page.type}/`);
  }
}

// ============================================================
// Cluster status updates
// ============================================================

export function updateClusterStatus(clusterSlug: string): void {
  const clusterPath = path.join(process.cwd(), 'data', 'flagship-clusters', `${clusterSlug}.json`);
  const cluster: ClusterDefinition = JSON.parse(fs.readFileSync(clusterPath, 'utf-8'));

  // Update cornerstone status
  const csExists = fs.existsSync(path.join(process.cwd(), 'content', 'blog', 'en', `${cluster.cornerstone.slug}.md`));
  cluster.cornerstone.status = csExists ? 'exists' : 'missing';

  // Update compare status
  for (const c of cluster.target_compare) {
    c.status = contentFileExists('compare', c.slug, 'en') ? 'exists' : 'missing';
  }

  // Update FAQ status
  for (const f of cluster.target_faq) {
    f.status = contentFileExists('faq', f.slug, 'en') ? 'exists' : 'missing';
  }

  // Update glossary status
  for (const g of cluster.target_glossary) {
    g.status = contentFileExists('glossary', g.slug, 'en') ? 'exists' : 'missing';
  }

  fs.writeFileSync(clusterPath, JSON.stringify(cluster, null, 2) + '\n');
  console.log(`  Updated cluster status: ${clusterPath}`);
}
