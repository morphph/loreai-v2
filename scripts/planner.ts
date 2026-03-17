#!/usr/bin/env tsx
/**
 * scripts/planner.ts — Cluster planner CLI
 *
 * Discovers candidate cluster nodes via Brave Search and competitor content audit.
 * Candidates are scored and written to cluster JSON for human review.
 * Supports promotion, dismissal, and status display.
 *
 * Usage:
 *   npx tsx scripts/planner.ts --cluster=claude-code          # discover for one cluster
 *   npx tsx scripts/planner.ts --all                          # discover for all clusters
 *   npx tsx scripts/planner.ts --cluster=claude-code --dry-run # show candidates, don't write
 *   npx tsx scripts/planner.ts --cluster=claude-code --status  # show candidate status
 *   npx tsx scripts/planner.ts --cluster=claude-code --promote=<slug>
 *   npx tsx scripts/planner.ts --cluster=claude-code --promote-above=70
 *   npx tsx scripts/planner.ts --cluster=claude-code --dismiss=<slug>
 */
import 'dotenv/config';
import * as fs from 'fs';
import * as path from 'path';
import {
  discoverForCluster,
  inferGlossaryCandidates,
  writeDiscoveriesToKeywordTable,
  checkClusterRefresh,
  clearRefresh,
  type ClusterForDiscovery,
  type ScoredCandidate,
  type RefreshFlag,
} from './lib/discover';

const CLUSTERS_DIR = path.join(process.cwd(), 'data', 'flagship-clusters');

// ============================================================
// CLI argument parsing
// ============================================================

interface PlannerArgs {
  cluster?: string;
  all: boolean;
  dryRun: boolean;
  promote?: string;
  promoteAbove?: number;
  dismiss?: string;
  status: boolean;
  gscCsv?: string;
  refreshCheck: boolean;
  clearRefreshSlug?: string;
}

function parseArgs(): PlannerArgs {
  const args = process.argv.slice(2);
  let cluster: string | undefined;
  let all = false;
  let dryRun = false;
  let promote: string | undefined;
  let promoteAbove: number | undefined;
  let dismiss: string | undefined;
  let status = false;
  let gscCsv: string | undefined;
  let refreshCheck = false;
  let clearRefreshSlug: string | undefined;

  for (const arg of args) {
    if (arg.startsWith('--cluster=')) {
      cluster = arg.split('=')[1];
    } else if (arg === '--all') {
      all = true;
    } else if (arg === '--dry-run') {
      dryRun = true;
    } else if (arg.startsWith('--promote-above=')) {
      promoteAbove = parseInt(arg.split('=')[1], 10);
    } else if (arg.startsWith('--promote=')) {
      promote = arg.split('=')[1];
    } else if (arg.startsWith('--dismiss=')) {
      dismiss = arg.split('=')[1];
    } else if (arg === '--status') {
      status = true;
    } else if (arg.startsWith('--gsc-csv=')) {
      gscCsv = arg.split('=')[1];
    } else if (arg === '--refresh-check') {
      refreshCheck = true;
    } else if (arg.startsWith('--clear-refresh=')) {
      clearRefreshSlug = arg.split('=')[1];
    }
  }

  return { cluster, all, dryRun, promote, promoteAbove, dismiss, status, gscCsv, refreshCheck, clearRefreshSlug };
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
// Write cluster JSON atomically
// ============================================================

function writeCluster(slug: string, cluster: ClusterForDiscovery): void {
  const filePath = path.join(CLUSTERS_DIR, `${slug}.json`);
  fs.writeFileSync(filePath, JSON.stringify(cluster, null, 2) + '\n', 'utf-8');
}

function writeCandidates(slug: string, candidates: ScoredCandidate[]): void {
  const filePath = path.join(CLUSTERS_DIR, `${slug}.json`);
  const raw = fs.readFileSync(filePath, 'utf-8');
  const cluster = JSON.parse(raw);

  if (!cluster.candidates) {
    cluster.candidates = [];
  }

  cluster.candidates.push(...candidates);

  fs.writeFileSync(filePath, JSON.stringify(cluster, null, 2) + '\n', 'utf-8');
  console.log(`[planner] Wrote ${candidates.length} candidates to ${filePath}`);
}

// ============================================================
// Display candidates (discovery output)
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

  const compareCount = candidates.filter(c => c.type === 'compare').length;
  const faqCount = candidates.filter(c => c.type === 'faq').length;
  const glossaryCount = candidates.filter(c => c.type === 'glossary').length;
  console.log(`\n  Summary: ${compareCount} compare, ${faqCount} FAQ, ${glossaryCount} glossary`);
}

// ============================================================
// Promotion
// ============================================================

function promoteCandidate(cluster: ClusterForDiscovery, candidateSlug: string): void {
  const candidate = cluster.candidates?.find(c => c.slug === candidateSlug);
  if (!candidate) throw new Error(`Candidate "${candidateSlug}" not found`);
  if (candidate.status === 'approved') throw new Error(`Already promoted`);
  if (candidate.status === 'dismissed') throw new Error(`Already dismissed — remove dismiss first`);

  switch (candidate.type) {
    case 'compare':
      cluster.target_compare.push({
        slug: candidate.slug,
        item_a: cluster.pillar_topic,
        item_b: candidate.item_b || candidate.display_term.replace(`${cluster.pillar_topic} vs `, ''),
        item_b_url: candidate.item_b_url || undefined,
        priority: 3,
        status: 'missing',
      });
      break;

    case 'faq':
      cluster.target_faq.push({
        slug: candidate.slug,
        question: candidate.question || candidate.display_term,
        priority: 3,
        status: 'missing',
      });
      break;

    case 'glossary':
      cluster.target_glossary.push({
        slug: candidate.slug,
        display_term: candidate.display_term,
        status: 'missing',
      });
      break;
  }

  candidate.status = 'approved';
}

function promoteBatch(cluster: ClusterForDiscovery, minScore: number): string[] {
  const promoted: string[] = [];
  for (const c of cluster.candidates || []) {
    if (c.status === 'pending' && c.score >= minScore) {
      promoteCandidate(cluster, c.slug);
      promoted.push(c.slug);
    }
  }
  return promoted;
}

// ============================================================
// Dismissal
// ============================================================

function dismissCandidate(cluster: ClusterForDiscovery, candidateSlug: string): void {
  const candidate = cluster.candidates?.find(c => c.slug === candidateSlug);
  if (!candidate) throw new Error(`Candidate "${candidateSlug}" not found`);
  candidate.status = 'dismissed';
}

// ============================================================
// Status display
// ============================================================

function showStatus(cluster: ClusterForDiscovery): void {
  const candidates = cluster.candidates || [];
  if (candidates.length === 0) {
    console.log('  No candidates found.');
    return;
  }

  const statusIcon = (s: string) => {
    switch (s) {
      case 'approved': return '✅';
      case 'pending': return '⏳';
      case 'low-signal': return '🔅';
      case 'dismissed': return '❌';
      default: return '?';
    }
  };

  console.log(`\n📊 Cluster: ${cluster.topic_slug} — Candidate Status\n`);

  const types = ['compare', 'faq', 'glossary'] as const;
  for (const type of types) {
    const ofType = candidates.filter(c => c.type === type);
    if (ofType.length === 0) continue;

    // Sort by score descending
    ofType.sort((a, b) => b.score - a.score);

    const pending = ofType.filter(c => c.status === 'pending').length;
    const approved = ofType.filter(c => c.status === 'approved').length;
    const dismissed = ofType.filter(c => c.status === 'dismissed').length;
    const lowSignal = ofType.filter(c => c.status === 'low-signal').length;

    const parts: string[] = [];
    if (pending > 0) parts.push(`${pending} pending`);
    if (approved > 0) parts.push(`${approved} approved`);
    if (dismissed > 0) parts.push(`${dismissed} dismissed`);
    if (lowSignal > 0) parts.push(`${lowSignal} low-signal`);

    const label = type.charAt(0).toUpperCase() + type.slice(1);
    console.log(`${label} (${parts.join(', ')}):`);

    for (const c of ofType) {
      const icon = statusIcon(c.status);
      const scoreStr = String(c.score).padStart(3);
      const slugStr = c.slug.padEnd(40);
      const term = `"${c.display_term}"`;
      const src = c.status === 'dismissed' ? '[dismissed]' : `[${c.source}]`;
      console.log(`  ${scoreStr}  ${icon} ${slugStr} — ${term} ${src}`);
    }
    console.log('');
  }
}

// ============================================================
// Refresh flag display
// ============================================================

function displayRefreshFlags(flags: RefreshFlag[]): void {
  if (flags.length === 0) {
    console.log('\n  No stale pages detected.');
    return;
  }

  console.log(`\n  Found ${flags.length} stale page(s):\n`);
  console.log('  ' + '-'.repeat(90));

  for (const f of flags) {
    const severityIcon = f.severity === 'high' ? '[HIGH]' : f.severity === 'medium' ? '[MED]' : '[LOW]';
    console.log(`  ${severityIcon} ${f.slug} (${f.page_type})`);
    console.log(`    Signal: ${f.signal_event} — ${f.signal_description}`);
    console.log(`    Sections: ${f.affected_sections.join(', ') || '(none specified)'}`);
    console.log(`    Reason: ${f.reason}`);
    console.log('');
  }

  console.log('  ' + '-'.repeat(90));
  const high = flags.filter(f => f.severity === 'high').length;
  const med = flags.filter(f => f.severity === 'medium').length;
  const low = flags.filter(f => f.severity === 'low').length;
  console.log(`  Summary: ${high} high, ${med} medium, ${low} low severity`);
}

// ============================================================
// Main
// ============================================================

async function main() {
  const { cluster, all, dryRun, promote, promoteAbove, dismiss, status, gscCsv, refreshCheck, clearRefreshSlug } = parseArgs();

  // --status, --promote, --dismiss, --promote-above, --refresh-check, --clear-refresh require --cluster
  const isManagementOp = status || promote || dismiss || promoteAbove !== undefined || refreshCheck || clearRefreshSlug;

  if (!cluster && !all) {
    console.error('Usage: npx tsx scripts/planner.ts --cluster=<slug> [--dry-run]');
    console.error('       npx tsx scripts/planner.ts --all [--dry-run]');
    console.error('       npx tsx scripts/planner.ts --cluster=<slug> --status');
    console.error('       npx tsx scripts/planner.ts --cluster=<slug> --promote=<slug>');
    console.error('       npx tsx scripts/planner.ts --cluster=<slug> --promote-above=<score>');
    console.error('       npx tsx scripts/planner.ts --cluster=<slug> --dismiss=<slug>');
    console.error('       npx tsx scripts/planner.ts --cluster=<slug> --refresh-check [--dry-run]');
    console.error('       npx tsx scripts/planner.ts --cluster=<slug> --clear-refresh=<slug|all>');
    process.exit(1);
  }

  if (isManagementOp && !cluster) {
    console.error('[planner] --status, --promote, --dismiss, --promote-above require --cluster=<slug>');
    process.exit(1);
  }

  // Handle management operations (no Brave API key needed)
  if (isManagementOp && cluster) {
    const clusterData = loadCluster(cluster);
    if (!clusterData) process.exit(1);

    if (status) {
      showStatus(clusterData);
      return;
    }

    if (promote) {
      promoteCandidate(clusterData, promote);
      console.log(`[planner] Promoted "${promote}" to target array`);

      // After promotion, run glossary inference (new compare targets may produce glossary candidates)
      const glossaryCandidates = inferGlossaryCandidates(clusterData);
      if (glossaryCandidates.length > 0) {
        if (!clusterData.candidates) clusterData.candidates = [];
        clusterData.candidates.push(...glossaryCandidates);
        console.log(`[planner] Inferred ${glossaryCandidates.length} new glossary candidate(s)`);
      }

      writeCluster(cluster, clusterData);
      return;
    }

    if (promoteAbove !== undefined) {
      const promoted = promoteBatch(clusterData, promoteAbove);
      if (promoted.length === 0) {
        console.log(`[planner] No pending candidates with score >= ${promoteAbove}`);
        return;
      }
      console.log(`[planner] Batch promoted ${promoted.length} candidate(s):`);
      for (const s of promoted) console.log(`  - ${s}`);

      // After batch promotion, run glossary inference
      const glossaryCandidates = inferGlossaryCandidates(clusterData);
      if (glossaryCandidates.length > 0) {
        if (!clusterData.candidates) clusterData.candidates = [];
        clusterData.candidates.push(...glossaryCandidates);
        console.log(`[planner] Inferred ${glossaryCandidates.length} new glossary candidate(s)`);
      }

      writeCluster(cluster, clusterData);
      return;
    }

    if (dismiss) {
      dismissCandidate(clusterData, dismiss);
      console.log(`[planner] Dismissed "${dismiss}"`);
      writeCluster(cluster, clusterData);
      return;
    }

    if (refreshCheck) {
      const flags = await checkClusterRefresh(clusterData);
      displayRefreshFlags(flags);

      if (!dryRun && flags.length > 0) {
        if (!clusterData.refresh_needed) clusterData.refresh_needed = [];
        clusterData.refresh_needed.push(...flags);
        writeCluster(cluster, clusterData);
        console.log(`[planner] Wrote ${flags.length} refresh flag(s) to cluster JSON`);
      } else if (dryRun && flags.length > 0) {
        console.log('\n  [dry-run] No changes written to disk.');
      }
      return;
    }

    if (clearRefreshSlug) {
      clearRefresh(clusterData, clearRefreshSlug);
      writeCluster(cluster, clusterData);
      console.log(`[planner] Cleared refresh flag(s): ${clearRefreshSlug}`);
      return;
    }

    return;
  }

  // Discovery mode — requires Brave API key
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

    const candidates = await discoverForCluster(clusterData, gscCsv);
    displayCandidates(candidates);

    if (!dryRun && candidates.length > 0) {
      writeCandidates(slug, candidates);
      // Write keywords to DB after discovery
      writeDiscoveriesToKeywordTable(clusterData, candidates);
      console.log(`[planner] Wrote ${candidates.length} keyword(s) to DB`);
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
