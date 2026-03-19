#!/usr/bin/env npx tsx
/**
 * scripts/generate-seo.ts — SEO content generation pipeline (thin CLI router)
 *
 * Daily mode (default):
 *   npx tsx scripts/generate-seo.ts --date=YYYY-MM-DD
 *
 * Weekly strategy mode:
 *   npx tsx scripts/generate-seo.ts --weekly-strategy
 *
 * Cluster mode:
 *   npx tsx scripts/generate-seo.ts --cluster=claude-code
 *   npx tsx scripts/generate-seo.ts --cluster=claude-code --type=faq
 *   npx tsx scripts/generate-seo.ts --cluster=claude-code --dry-run
 *
 * Refresh mode:
 *   npx tsx scripts/generate-seo.ts --cluster=claude-code --refresh
 *
 * Flags:
 *   --dry-run       Log what would be generated, no AI calls or file writes
 *   --date=YYYY-MM-DD   Override date (default: today)
 *   --weekly-strategy   Run weekly strategy mode instead of daily generation
 *   --cluster=SLUG      Run cluster-driven generation mode
 *   --type=TYPE         Filter cluster mode to specific type (faq|compare|glossary|cornerstone)
 *   --refresh           Run refresh mode for the specified cluster
 *   --slug=SLUG         Filter refresh to a specific page slug
 */
import 'dotenv/config';
import fs from 'fs';
import path from 'path';

import { callClaudeWithRetry } from './lib/ai';
import { sanitizeOutput } from './lib/sanitize.js';
import {
  upsertContent,
  upsertKeyword,
  closeDb,
} from './lib/db';
import { runGapAnalysis } from './lib/topic-cluster';
import { batchValidate } from './lib/brave';
import { resolveSource, buildGroundingInstruction } from './lib/source-fetch';
import { readPageContent } from './lib/discover';
import { todaySGT } from './lib/date.js';

// Import from extracted SEO modules
import type { ClusterDefinition, PageJob, RefreshFlag } from './lib/seo/types';
import {
  contentFileExists,
  loadSkill,
  loadBlogSkill,
  getWeekNumber,
  extractBody,
  buildClusterLinksString,
} from './lib/seo/helpers';
import {
  buildRefreshPrompt,
  buildRefreshZhAddendum,
  getRefreshValidator,
} from './lib/seo/prompts';
import {
  generatePages,
  generateCornerstonePage,
} from './lib/seo/generation';
import {
  loadClusters,
  loadKeywords,
  identifyGaps,
  generateContentPlan,
} from './lib/seo/planning';
import {
  updateKeywords,
  gitPush,
  updateClusterStatus,
} from './lib/seo/persistence';
import {
  detectPerformanceRefreshNeeds,
  rankingDropsToRefreshFlags,
} from './lib/seo/gsc-refresh';


// ============================================================
// CLI Args
// ============================================================

const dateArg = process.argv.find((a) => a.startsWith('--date='));
const DATE = dateArg ? dateArg.split('=')[1] : todaySGT();
const DRY_RUN = process.argv.includes('--dry-run');
const WEEKLY_STRATEGY = process.argv.includes('--weekly-strategy');
const clusterArg = process.argv.find((a) => a.startsWith('--cluster='));
const typeArg = process.argv.find((a) => a.startsWith('--type='));
const CLUSTER_SLUG = clusterArg ? clusterArg.split('=')[1] : null;
const TYPE_FILTER = typeArg ? typeArg.split('=')[1] : null;
const REFRESH_MODE = process.argv.includes('--refresh');
const slugArg = process.argv.find((a) => a.startsWith('--slug='));
const SLUG_FILTER = slugArg ? slugArg.split('=')[1] : null;
const MAX_PAGES_PER_RUN = 8;

console.log(`\n🔎 SEO Pipeline — ${DATE}`);
console.log('='.repeat(50));
if (DRY_RUN) console.log('🧪 DRY RUN — skipping AI calls and file writes\n');


// ============================================================
// Weekly Strategy Mode
// ============================================================

async function runWeeklyStrategy(): Promise<void> {
  console.log('\n📋 Weekly Strategy Mode');
  console.log('='.repeat(50));

  // 1. Gap Analysis
  console.log('\n📊 Step 1: Gap Analysis');
  const { clusters, gaps } = runGapAnalysis();
  console.log(`  Active clusters: ${clusters.length}`);
  console.log(`  Clusters with gaps: ${gaps.length}`);

  for (const gap of gaps.slice(0, 10)) {
    console.log(`    ${gap.cluster}: ${gap.missing.length} missing keywords`);
  }

  // 2. Brave Search batch validate
  console.log('\n🔍 Step 2: Brave Search Validation');
  const topClusterTopics = clusters.slice(0, 10).map((c) => c.pillar_topic);

  let braveResults: Awaited<ReturnType<typeof batchValidate>> = [];
  if (!DRY_RUN && topClusterTopics.length > 0) {
    braveResults = await batchValidate(topClusterTopics, 1000);
    console.log(`  Validated ${braveResults.length} topics via Brave Search`);
    for (const r of braveResults) {
      console.log(`    "${r.topic}": demand=${r.has_search_demand}, results=${r.result_count}, related=${r.related_keywords.length}`);
    }
  } else if (DRY_RUN) {
    console.log(`  [DRY RUN] Would validate ${topClusterTopics.length} topics via Brave Search`);
  } else {
    console.log('  No clusters to validate');
  }

  // 3. Generate content plan
  console.log('\n📝 Step 3: Generate Content Plan');
  const plan = generateContentPlan(clusters, gaps, braveResults, DATE);

  const weekStr = getWeekNumber(new Date(DATE));
  const planDir = path.join(process.cwd(), 'data', 'content-plan');
  fs.mkdirSync(planDir, { recursive: true });
  const planPath = path.join(planDir, `${weekStr}.json`);

  if (!DRY_RUN) {
    fs.writeFileSync(planPath, JSON.stringify(plan, null, 2));
    console.log(`  Written: ${planPath}`);
  } else {
    console.log(`  [DRY RUN] Would write: ${planPath}`);
  }

  // 4. Log summary
  console.log('\n📊 Weekly Strategy Summary');
  console.log(`  Week: ${weekStr}`);
  console.log(`  Total clusters: ${clusters.length}`);
  console.log(`  Clusters with content gaps: ${gaps.length}`);
  console.log(`  Planned glossary pages: ${plan.glossary.length}`);
  console.log(`  Planned FAQ pages: ${plan.faq.length}`);
  console.log(`  Planned compare pages: ${plan.compare.length}`);
  console.log(`  Planned topic hub pages: ${plan.topics.length}`);
  console.log(`  Total planned pages: ${plan.glossary.length + plan.faq.length + plan.compare.length + plan.topics.length}`);
}


// ============================================================
// Cluster Mode
// ============================================================

async function runClusterMode(clusterSlug: string, typeFilter?: string): Promise<void> {
  console.log(`\n🎯 Cluster Mode — ${clusterSlug}`);
  console.log('='.repeat(50));

  // 1. Read cluster definition
  const clusterPath = path.join(process.cwd(), 'data', 'flagship-clusters', `${clusterSlug}.json`);
  if (!fs.existsSync(clusterPath)) {
    console.error(`❌ Cluster file not found: ${clusterPath}`);
    process.exit(1);
  }
  const cluster: ClusterDefinition = JSON.parse(fs.readFileSync(clusterPath, 'utf-8'));
  console.log(`  Loaded cluster: ${cluster.pillar_topic}`);

  // 2. Build jobs from missing targets
  const seoJobs: PageJob[] = [];
  let needsCornerstone = false;

  // Cornerstone check
  if (cluster.cornerstone.status === 'missing' && (!typeFilter || typeFilter === 'cornerstone')) {
    const csExists = fs.existsSync(path.join(process.cwd(), 'content', 'blog', 'en', `${cluster.cornerstone.slug}.md`));
    if (!csExists) {
      needsCornerstone = true;
    } else {
      console.log('  Cornerstone already exists on disk, skipping');
    }
  }

  // 2a. Resolve source material for grounded generation
  const officialDomains = cluster.official_domains ?? [];
  let primarySource = '';
  let cornerstoneSourceGrounding = '';

  const needsSourceFetch = (!typeFilter || ['compare', 'faq', 'cornerstone'].includes(typeFilter));
  if (needsSourceFetch && cluster.source_urls) {
    console.log('\n  📚 Resolving source material...');
    primarySource = await resolveSource(
      cluster.source_urls.primary,
      `${cluster.pillar_topic} official documentation`,
      officialDomains
    );
    if (primarySource) {
      console.log(`    Primary source: ${primarySource.length} chars`);
    }

    // Cornerstone needs primary + pricing
    if (!typeFilter || typeFilter === 'cornerstone') {
      const pricingSource = await resolveSource(
        cluster.source_urls.pricing,
        `${cluster.pillar_topic} pricing costs`,
        officialDomains
      );
      const csSourceParts: { label: string; content: string }[] = [
        { label: cluster.pillar_topic, content: primarySource },
      ];
      if (pricingSource) {
        csSourceParts.push({ label: `${cluster.pillar_topic} Pricing`, content: pricingSource });
      }
      cornerstoneSourceGrounding = buildGroundingInstruction(csSourceParts);
    }
  }

  // Compare pages
  for (const c of cluster.target_compare) {
    if (c.status !== 'missing') continue;
    if (typeFilter && typeFilter !== 'compare') continue;
    if (contentFileExists('compare', c.slug, 'en')) continue;

    // Resolve competitor source
    let competitorSource = '';
    if (c.item_b_url || officialDomains.length > 0) {
      console.log(`    Resolving source for ${c.item_b}...`);
      competitorSource = await resolveSource(
        c.item_b_url,
        `${c.item_b} official features documentation`,
        officialDomains
      );
    }

    const sourceGrounding = buildGroundingInstruction([
      { label: c.item_a, content: primarySource },
      { label: c.item_b, content: competitorSource },
    ]);

    seoJobs.push({
      type: 'compare',
      slug: c.slug,
      displayTerm: `${c.item_a} vs ${c.item_b}`,
      clusterSlug: cluster.topic_slug,
      pillarTopic: cluster.pillar_topic,
      context: { item_a: c.item_a, item_b: c.item_b, _sourceGrounding: sourceGrounding },
    });
  }

  // FAQ pages
  for (const f of cluster.target_faq) {
    if (f.status !== 'missing') continue;
    if (typeFilter && typeFilter !== 'faq') continue;
    if (contentFileExists('faq', f.slug, 'en')) continue;

    const faqSourceGrounding = primarySource
      ? buildGroundingInstruction([{ label: cluster.pillar_topic, content: primarySource }])
      : '';

    seoJobs.push({
      type: 'faq',
      slug: f.slug,
      displayTerm: f.question,
      clusterSlug: cluster.topic_slug,
      pillarTopic: cluster.pillar_topic,
      context: { question: f.question, _sourceGrounding: faqSourceGrounding },
    });
  }

  // Glossary
  for (const g of cluster.target_glossary) {
    if (g.status !== 'missing') continue;
    if (typeFilter && typeFilter !== 'glossary') continue;
    if (contentFileExists('glossary', g.slug, 'en')) continue;
    seoJobs.push({
      type: 'glossary',
      slug: g.slug,
      displayTerm: g.display_term,
      clusterSlug: cluster.topic_slug,
      pillarTopic: cluster.pillar_topic,
      context: {},
    });
  }

  const totalGaps = seoJobs.length + (needsCornerstone ? 1 : 0);
  console.log(`  Content gaps: ${totalGaps} pages`);
  if (needsCornerstone) console.log(`    [cornerstone] ${cluster.cornerstone.slug}`);
  for (const job of seoJobs) {
    console.log(`    [${job.type}] ${job.slug} — "${job.displayTerm}"`);
  }

  if (totalGaps === 0) {
    console.log('\n✅ No content gaps — cluster is complete.');
    return;
  }

  // 3. Respect MAX_PAGES_PER_RUN
  const cornerstoneSlots = needsCornerstone ? 1 : 0;
  const limited = seoJobs.slice(0, MAX_PAGES_PER_RUN - cornerstoneSlots);

  if (totalGaps > MAX_PAGES_PER_RUN) {
    console.log(`  Limiting to ${MAX_PAGES_PER_RUN} pages per run (${totalGaps - MAX_PAGES_PER_RUN} deferred)`);
  }

  // 4. Dry-run output
  if (DRY_RUN) {
    console.log('\n🧪 DRY RUN — would generate:');
    if (needsCornerstone) {
      console.log(`  [cornerstone] content/blog/en/${cluster.cornerstone.slug}.md`);
      console.log(`  [cornerstone] content/blog/zh/${cluster.cornerstone.slug}.md`);
      if (cornerstoneSourceGrounding) {
        console.log(`    Source: primary (${primarySource.length} chars) + pricing`);
      }
    }
    for (const job of limited) {
      console.log(`  [${job.type}] content/${job.type}/en/${job.slug}.md`);
      console.log(`  [${job.type}] content/${job.type}/zh/${job.slug}.md`);
      if (job.context._sourceGrounding) {
        const grounding = job.context._sourceGrounding as string;
        const hasSource = !grounding.includes('No Source Material Available');
        console.log(`    Source: ${hasSource ? 'grounded' : 'ungrounded (no sources fetched)'}`);
      }
    }
    return;
  }

  // 5. Generate pages
  let cornerstoneCount = 0;

  // Generate cornerstone first (if needed)
  if (needsCornerstone) {
    console.log(`\n--- Cornerstone: ${cluster.cornerstone.slug} ---`);
    console.log('  Generating EN cornerstone...');
    const enPage = await generateCornerstonePage(cluster, 'en', DATE, cornerstoneSourceGrounding || undefined);
    if (enPage) {
      console.log(`  Written: ${enPage.filePath}`);
      upsertContent({
        type: 'blog',
        slug: cluster.cornerstone.slug,
        lang: 'en',
        title: `${cluster.pillar_topic} — Complete Guide`,
        body_markdown: fs.readFileSync(enPage.filePath, 'utf-8'),
        meta_json: JSON.stringify({
          category: 'blog',
          cluster_slug: cluster.topic_slug,
          pillar_topic: cluster.pillar_topic,
          cornerstone: true,
        }),
      });
      cornerstoneCount++;

      console.log('  Generating ZH cornerstone...');
      const zhPage = await generateCornerstonePage(cluster, 'zh', DATE, cornerstoneSourceGrounding || undefined);
      if (zhPage) {
        console.log(`  Written: ${zhPage.filePath}`);
        upsertContent({
          type: 'blog',
          slug: cluster.cornerstone.slug,
          lang: 'zh',
          title: `${cluster.pillar_topic} — 完全指南`,
          body_markdown: fs.readFileSync(zhPage.filePath, 'utf-8'),
          meta_json: JSON.stringify({
            category: 'blog',
            cluster_slug: cluster.topic_slug,
            pillar_topic: cluster.pillar_topic,
            cornerstone: true,
          }),
        });
        cornerstoneCount++;
      }
    } else {
      console.warn('  EN cornerstone generation failed, skipping');
    }

    // Upsert cornerstone keywords
    for (const kw of cluster.cornerstone.target_keywords) {
      upsertKeyword(kw, 'cluster-target', cluster.topic_slug);
    }
  }

  // Generate SEO pages (reuse existing pipeline)
  let seoGenerated: Awaited<ReturnType<typeof generatePages>> = [];
  if (limited.length > 0) {
    seoGenerated = await generatePages(limited, DRY_RUN);
    updateKeywords(limited, seoGenerated);
    await gitPush(seoGenerated, DRY_RUN);

    // Upsert keywords with cluster-target source
    for (const job of limited) {
      upsertKeyword(job.displayTerm, 'cluster-target', cluster.topic_slug);
      if (job.type === 'faq' && job.context.question) {
        upsertKeyword(job.context.question as string, 'cluster-target', cluster.topic_slug);
      }
    }
  }

  // 6. Update cluster definition status
  updateClusterStatus(clusterSlug);

  const enCount = seoGenerated.filter((p) => p.lang === 'en').length + (cornerstoneCount > 0 ? 1 : 0);
  const zhCount = seoGenerated.filter((p) => p.lang === 'zh').length + (cornerstoneCount > 1 ? 1 : 0);
  console.log(`\n✅ Cluster "${clusterSlug}" — ${enCount} EN + ${zhCount} ZH pages generated`);
}


// ============================================================
// Refresh Mode (SPEC-11)
// ============================================================

async function resolveRefreshSources(
  flag: RefreshFlag,
  cluster: ClusterDefinition
): Promise<string> {
  const officialDomains = cluster.official_domains || [];

  if (flag.page_type === 'compare') {
    const target = cluster.target_compare.find(c => c.slug === flag.slug);
    const primarySource = await resolveSource(
      cluster.source_urls?.primary,
      `${cluster.pillar_topic} official documentation`,
      officialDomains
    );
    const competitorSource = target?.item_b_url
      ? await resolveSource(target.item_b_url, `${target.item_b} features`, officialDomains)
      : '';
    return buildGroundingInstruction([
      { label: cluster.pillar_topic, content: primarySource },
      { label: target?.item_b || 'Competitor', content: competitorSource },
    ]);
  }

  if (flag.page_type === 'glossary') {
    return '';
  }

  // Cornerstone, FAQ: primary docs only
  const primarySource = await resolveSource(
    cluster.source_urls?.primary,
    `${cluster.pillar_topic} official documentation`,
    officialDomains
  );
  return buildGroundingInstruction([
    { label: cluster.pillar_topic, content: primarySource },
  ]);
}

function getRefreshFilePath(slug: string, pageType: string, lang: string): string {
  const typeDir = pageType === 'blog' ? 'blog' : pageType;
  return path.join(process.cwd(), 'content', typeDir, lang, `${slug}.md`);
}

async function runRefreshMode(clusterSlug: string): Promise<void> {
  console.log(`\n🔄 Refresh Mode — ${clusterSlug}`);
  console.log('='.repeat(50));

  // 1. Read cluster JSON
  const clusterPath = path.join(process.cwd(), 'data', 'flagship-clusters', `${clusterSlug}.json`);
  if (!fs.existsSync(clusterPath)) {
    console.error(`❌ Cluster file not found: ${clusterPath}`);
    process.exit(1);
  }
  const cluster: ClusterDefinition = JSON.parse(fs.readFileSync(clusterPath, 'utf-8'));
  console.log(`  Loaded cluster: ${cluster.pillar_topic}`);

  // 1b. Check GSC data for performance-based refresh needs
  console.log('\n  📊 Checking GSC data for ranking drops...');
  const rankingDrops = detectPerformanceRefreshNeeds();
  if (rankingDrops.length > 0) {
    const gscFlags = rankingDropsToRefreshFlags(rankingDrops, cluster);
    if (gscFlags.length > 0) {
      console.log(`  Found ${gscFlags.length} GSC-triggered refresh needs for this cluster`);
      // Merge GSC flags with existing flags (avoid duplicates by slug+page_type)
      const existingSlugs = new Set(
        (cluster.refresh_needed || []).map(f => `${f.slug}:${f.page_type}`)
      );
      for (const flag of gscFlags) {
        const key = `${flag.slug}:${flag.page_type}`;
        if (!existingSlugs.has(key)) {
          cluster.refresh_needed = cluster.refresh_needed || [];
          cluster.refresh_needed.push(flag);
          existingSlugs.add(key);
        }
      }
    }
  }

  // 2. Filter refresh_needed where status === 'pending'
  const allFlags = cluster.refresh_needed || [];
  let pendingFlags = allFlags.filter(r => r.status === 'pending');

  // 3. Apply --slug filter
  if (SLUG_FILTER) {
    pendingFlags = pendingFlags.filter(r => r.slug === SLUG_FILTER);
  }

  if (pendingFlags.length === 0) {
    console.log('\n✅ No pending refresh flags.');
    return;
  }

  console.log(`  Pending refresh flags: ${pendingFlags.length}`);
  for (const f of pendingFlags) {
    console.log(`    [${f.severity}] ${f.slug} (${f.page_type}) — ${f.reason.slice(0, 80)}`);
  }

  // 4. Dry-run: just list
  if (DRY_RUN) {
    console.log('\n🧪 DRY RUN — would refresh:');
    for (const f of pendingFlags) {
      const enPath = getRefreshFilePath(f.slug, f.page_type, 'en');
      const zhPath = getRefreshFilePath(f.slug, f.page_type, 'zh');
      const enExists = fs.existsSync(enPath);
      console.log(`  [${f.severity}] ${f.slug} (${f.page_type})`);
      console.log(`    Reason: ${f.reason}`);
      console.log(`    Affected: ${f.affected_sections.join(', ')}`);
      console.log(`    EN file: ${enPath} (${enExists ? 'exists' : 'MISSING'})`);
      console.log(`    ZH file: ${zhPath}`);
    }
    return;
  }

  // 5. Refresh each flagged page
  const clusterLinks = buildClusterLinksString(cluster);
  let refreshedCount = 0;

  for (const flag of pendingFlags) {
    console.log(`\n--- Refreshing: ${flag.slug} (${flag.page_type}) ---`);

    // a. Read existing EN content
    const existingEN = readPageContent(flag.slug, flag.page_type, 'en');
    if (!existingEN) {
      console.warn(`  Skip: EN file not found for ${flag.slug}`);
      continue;
    }

    // b. Resolve sources
    console.log('  Resolving fresh source material...');
    const freshSources = await resolveRefreshSources(flag, cluster);

    // c. Build prompt and generate EN
    const skill = flag.page_type === 'blog' ? loadBlogSkill() : loadSkill();
    const { system, user } = buildRefreshPrompt(flag, skill, existingEN, freshSources, clusterLinks);
    const validate = getRefreshValidator(flag.page_type);

    const fullValidate = (raw: string) => {
      const content = sanitizeOutput(raw);
      if (!content.match(/^---\n[\s\S]*?\n---/)) {
        return { valid: false, errors: ['Missing frontmatter block'] };
      }
      const body = extractBody(content);
      return validate(body);
    };

    console.log('  Generating refreshed EN content...');
    try {
      const enResponse = await callClaudeWithRetry(system, user, {
        maxTokens: flag.page_type === 'blog' ? 8192 : 4096,
        temperature: 0.4,
        maxRetries: 2,
        validate: fullValidate,
      });

      const cleanedEN = sanitizeOutput(enResponse.content);
      console.log(`    EN refreshed (model: ${enResponse.model})`);
      console.log(`    Tokens: ${enResponse.usage?.input_tokens} in / ${enResponse.usage?.output_tokens} out`);

      // Write EN
      const enPath = getRefreshFilePath(flag.slug, flag.page_type, 'en');
      fs.mkdirSync(path.dirname(enPath), { recursive: true });
      fs.writeFileSync(enPath, cleanedEN);
      console.log(`    Written: ${enPath}`);

      // d. Generate ZH using NEW EN content
      console.log('  Generating refreshed ZH content...');
      const zhSystemPrompt = system + buildRefreshZhAddendum(flag, cleanedEN);
      const zhUserPrompt = `用中文刷新此 ${flag.page_type} 页面。需要更新的部分: ${flag.affected_sections.join(', ')}。
更新原因: ${flag.reason}
基于最新英文版内容和新鲜源材料进行更新。`;

      const zhResponse = await callClaudeWithRetry(zhSystemPrompt, zhUserPrompt, {
        maxTokens: flag.page_type === 'blog' ? 8192 : 4096,
        temperature: 0.4,
        maxRetries: 2,
        validate: fullValidate,
      });

      const cleanedZH = sanitizeOutput(zhResponse.content);
      console.log(`    ZH refreshed (model: ${zhResponse.model})`);

      // Write ZH
      const zhPath = getRefreshFilePath(flag.slug, flag.page_type, 'zh');
      fs.mkdirSync(path.dirname(zhPath), { recursive: true });
      fs.writeFileSync(zhPath, cleanedZH);
      console.log(`    Written: ${zhPath}`);

      // e. Update flag status
      flag.status = 'refreshed';
      refreshedCount++;
    } catch (err) {
      console.error(`  ❌ Refresh failed for ${flag.slug}: ${(err as Error).message}`);
    }
  }

  // 6. Write updated cluster JSON
  fs.writeFileSync(clusterPath, JSON.stringify(cluster, null, 2) + '\n');
  console.log(`\n  Updated cluster JSON: ${clusterPath}`);

  console.log(`\n✅ Refresh complete — ${refreshedCount} page(s) refreshed`);
}


// ============================================================
// MAIN
// ============================================================

async function main() {
  if (REFRESH_MODE && CLUSTER_SLUG) {
    await runRefreshMode(CLUSTER_SLUG);
    closeDb();
    console.log('\n✅ Refresh mode complete');
    return;
  }

  if (CLUSTER_SLUG) {
    await runClusterMode(CLUSTER_SLUG, TYPE_FILTER || undefined);
    closeDb();
    console.log('\n✅ Cluster mode complete');
    return;
  }

  if (WEEKLY_STRATEGY) {
    await runWeeklyStrategy();
    closeDb();
    console.log('\n✅ Weekly strategy complete');
    return;
  }

  // Daily mode
  // Stage 1: Load clusters
  const clusters = loadClusters();
  if (clusters.length === 0) {
    console.log('\n⚠️  No active topic clusters (mention_count >= 2). Run the newsletter pipeline first to build clusters.');
    closeDb();
    process.exit(0);
  }

  // Stage 2: Load keywords
  const keywordMap = loadKeywords(clusters);

  // Stage 3: Identify content gaps
  const jobs = identifyGaps(clusters, keywordMap, MAX_PAGES_PER_RUN);
  if (jobs.length === 0) {
    console.log('\n✅ No content gaps — all SEO pages are up to date.');
    closeDb();
    process.exit(0);
  }

  // Stage 4: Generate pages
  const generated = await generatePages(jobs, DRY_RUN);

  // Stage 5: Update keywords & DB
  updateKeywords(jobs, generated);

  // Stage 6: Git push
  await gitPush(generated, DRY_RUN);

  closeDb();

  const enCount = generated.filter((p) => p.lang === 'en').length;
  const zhCount = generated.filter((p) => p.lang === 'zh').length;
  console.log(`\n✅ SEO pipeline complete — ${enCount} EN + ${zhCount} ZH pages written`);
}

main().catch((err) => {
  console.error('💥 SEO pipeline failed:', err);
  closeDb();
  process.exit(1);
});
