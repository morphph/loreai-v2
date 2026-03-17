#!/usr/bin/env tsx
/**
 * scripts/planner.ts — Cluster planner CLI
 *
 * Discovers candidate cluster nodes via Brave Search and competitor content audit.
 * Candidates are scored and written to cluster JSON for human review.
 *
 * Usage:
 *   npx tsx scripts/planner.ts --cluster=claude-code          # discover for one cluster
 *   npx tsx scripts/planner.ts --all                          # discover for all clusters
 *   npx tsx scripts/planner.ts --cluster=claude-code --dry-run # show candidates, don't write
 */
import 'dotenv/config';
import * as fs from 'fs';
import * as path from 'path';
import { discoverForCluster, type ClusterForDiscovery, type ScoredCandidate } from './lib/discover';

const CLUSTERS_DIR = path.join(process.cwd(), 'data', 'flagship-clusters');

// ============================================================
// CLI argument parsing
// ============================================================

function parseArgs(): { cluster?: string; all: boolean; dryRun: boolean } {
  const args = process.argv.slice(2);
  let cluster: string | undefined;
  let all = false;
  let dryRun = false;

  for (const arg of args) {
    if (arg.startsWith('--cluster=')) {
      cluster = arg.split('=')[1];
    } else if (arg === '--all') {
      all = true;
    } else if (arg === '--dry-run') {
      dryRun = true;
    }
  }

  return { cluster, all, dryRun };
}

// ============================================================
// Cluster loading
// ============================================================

function loadCluster(slug: string): ClusterForDiscovery | null {
  const filePath = path.join(CLUSTERS_DIR, `${slug}.json`);
  if (!fs.existsSync(filePath)) {
    console.warn(`[planner] Cluster file not found: ${filePath}`);
    return null;
  }

  try {
    const raw = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(raw) as ClusterForDiscovery;
  } catch (err) {
    console.warn(`[planner] Failed to parse cluster ${slug}: ${(err as Error).message}`);
    return null;
  }
}

function listClusterSlugs(): string[] {
  if (!fs.existsSync(CLUSTERS_DIR)) {
    console.warn(`[planner] Clusters directory not found: ${CLUSTERS_DIR}`);
    return [];
  }

  return fs.readdirSync(CLUSTERS_DIR)
    .filter(f => f.endsWith('.json'))
    .map(f => f.replace('.json', ''));
}

// ============================================================
// Write candidates to cluster JSON
// ============================================================

function writeCandidates(slug: string, candidates: ScoredCandidate[]): void {
  const filePath = path.join(CLUSTERS_DIR, `${slug}.json`);
  const raw = fs.readFileSync(filePath, 'utf-8');
  const cluster = JSON.parse(raw);

  // Ensure candidates array exists
  if (!cluster.candidates) {
    cluster.candidates = [];
  }

  // Append new candidates
  cluster.candidates.push(...candidates);

  // Write atomically: full file rewrite
  fs.writeFileSync(filePath, JSON.stringify(cluster, null, 2) + '\n', 'utf-8');
  console.log(`[planner] Wrote ${candidates.length} candidates to ${filePath}`);
}

// ============================================================
// Display candidates
// ============================================================

function displayCandidates(candidates: ScoredCandidate[]): void {
  if (candidates.length === 0) {
    console.log('  No new candidates discovered.');
    return;
  }

  console.log(`\n  Discovered ${candidates.length} candidates:\n`);
  console.log('  ' + '-'.repeat(90));
  console.log(`  ${'Score'.padEnd(7)} ${'Type'.padEnd(9)} ${'Status'.padEnd(12)} ${'Slug'.padEnd(35)} Source`);
  console.log('  ' + '-'.repeat(90));

  for (const c of candidates) {
    const scoreStr = String(c.score).padEnd(7);
    const typeStr = c.type.padEnd(9);
    const statusStr = c.status.padEnd(12);
    const slugStr = c.slug.padEnd(35);
    console.log(`  ${scoreStr} ${typeStr} ${statusStr} ${slugStr} ${c.source}`);
  }

  console.log('  ' + '-'.repeat(90));

  // Summary by type
  const compareCount = candidates.filter(c => c.type === 'compare').length;
  const faqCount = candidates.filter(c => c.type === 'faq').length;
  console.log(`\n  Summary: ${compareCount} compare, ${faqCount} FAQ`);
}

// ============================================================
// Main
// ============================================================

async function main() {
  const { cluster, all, dryRun } = parseArgs();

  if (!cluster && !all) {
    console.error('Usage: npx tsx scripts/planner.ts --cluster=<slug> [--dry-run]');
    console.error('       npx tsx scripts/planner.ts --all [--dry-run]');
    process.exit(1);
  }

  // Check Brave API key
  if (!process.env.BRAVE_SEARCH_API_KEY) {
    console.warn('[planner] BRAVE_SEARCH_API_KEY not set. Cannot run discovery.');
    process.exit(1);
  }

  const slugs = all ? listClusterSlugs() : [cluster!];

  if (slugs.length === 0) {
    console.warn('[planner] No cluster files found.');
    process.exit(1);
  }

  console.log(`[planner] ${dryRun ? 'DRY RUN — ' : ''}Discovering for ${slugs.length} cluster(s): ${slugs.join(', ')}`);

  for (const slug of slugs) {
    const clusterData = loadCluster(slug);
    if (!clusterData) continue;

    const candidates = await discoverForCluster(clusterData);
    displayCandidates(candidates);

    if (!dryRun && candidates.length > 0) {
      writeCandidates(slug, candidates);
    } else if (dryRun) {
      console.log('\n  [dry-run] No changes written to disk.');
    }
  }

  console.log('\n[planner] Done.');
}

main().catch(err => {
  console.error('[planner] Fatal error:', err);
  process.exit(1);
});
