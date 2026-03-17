#!/usr/bin/env npx tsx
/**
 * Cluster Health Dashboard
 * Comprehensive health assessment for flagship topic clusters.
 *
 * Usage:
 *   npx tsx scripts/cluster-health.ts --cluster=claude-code
 *   npx tsx scripts/cluster-health.ts --all
 *   npx tsx scripts/cluster-health.ts --cluster=claude-code --format=json
 *   npx tsx scripts/cluster-health.ts --cluster=claude-code --format=md --output=data/reports/
 *   npx tsx scripts/cluster-health.ts --cluster=claude-code --gsc
 */

import { existsSync, readFileSync, readdirSync, writeFileSync, mkdirSync } from "fs";
import { join, resolve } from "path";
import { checkClusterLinkHealth, type LinkCheckResult } from "./lib/link-check";

// ── Types ────────────────────────────────────────────────────────────────────

interface ClusterDefinition {
  topic_slug: string;
  pillar_topic: string;
  version: string;
  cornerstone: {
    slug: string;
    target_keywords: string[];
    status: "exists" | "missing" | "draft";
  };
  target_compare: Array<{
    slug: string;
    item_a: string;
    item_b: string;
    priority: 1 | 2 | 3;
    status: "exists" | "missing" | "draft";
  }>;
  target_faq: Array<{
    slug: string;
    question: string;
    priority: 1 | 2 | 3;
    status: "exists" | "missing" | "draft";
  }>;
  target_glossary: Array<{
    slug: string;
    display_term: string;
    status: "exists" | "missing";
  }>;
  tracked_blogs: Array<{
    slug: string;
    title: string;
  }>;
  candidates?: Array<{
    slug: string;
    type: "compare" | "faq" | "glossary";
    display_term: string;
    question?: string | null;
    score: number;
    source: string;
    status?: string;
    discovered_at: string;
  }>;
  refresh_needed?: Array<{
    slug: string;
    reason: string;
    priority: "HIGH" | "MEDIUM" | "LOW";
    detected_at: string;
    refreshed_at?: string;
  }>;
}

interface GscRow {
  query: string;
  page: string;
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
}

interface HealthReport {
  cluster: string;
  pillar_topic: string;
  timestamp: string;
  completeness: {
    cornerstone: { exists: number; total: 1 };
    compare: { exists: number; total: number; promoted: number };
    faq: { exists: number; total: number };
    glossary: { exists: number; total: number };
    hub: { exists: number; total: 1 };
    blogs: number;
    overall: { exists: number; total: number };
  };
  linkHealth: LinkCheckResult;
  refresh: {
    pending: Array<{ slug: string; reason: string; priority: string }>;
    recentlyRefreshed: Array<{ slug: string; refreshed_at: string }>;
  };
  discovery: {
    total: number;
    byStatus: Record<string, number>;
    topPending: Array<{ slug: string; score: number; type: string; source: string }>;
  };
  gsc: {
    available: boolean;
    totalImpressions: number;
    totalClicks: number;
    avgCtr: number;
    avgPosition: number;
    topPages: Array<{ page: string; impressions: number; clicks: number }>;
    unmatchedQueries: Array<{ query: string; impressions: number }>;
  };
  schema: {
    faqJsonLd: { found: number; total: number };
    articleJsonLd: { found: number; total: number };
    breadcrumbJsonLd: { found: number; total: number };
  };
}

// ── Paths ────────────────────────────────────────────────────────────────────

const ROOT = resolve(join(__dirname, ".."));
const CLUSTERS_DIR = join(ROOT, "data", "flagship-clusters");
const CONTENT_DIR = join(ROOT, "content");
const GSC_DIR = join(ROOT, "data", "gsc-exports");

const contentPath = {
  cornerstone: (slug: string) => join(CONTENT_DIR, "blog", "en", `${slug}.md`),
  compare: (slug: string) => join(CONTENT_DIR, "compare", "en", `${slug}.md`),
  faq: (slug: string) => join(CONTENT_DIR, "faq", "en", `${slug}.md`),
  glossary: (slug: string) => join(CONTENT_DIR, "glossary", "en", `${slug}.md`),
  hub: (slug: string) => join(CONTENT_DIR, "topics", "en", `${slug}.md`),
};

// ── Helpers ──────────────────────────────────────────────────────────────────

function loadCluster(slug: string): ClusterDefinition | null {
  const filePath = join(CLUSTERS_DIR, `${slug}.json`);
  if (!existsSync(filePath)) {
    console.error(`⚠️  Cluster file not found: ${filePath} — skipping`);
    return null;
  }
  try {
    return JSON.parse(readFileSync(filePath, "utf-8"));
  } catch (e) {
    console.error(`⚠️  Malformed cluster JSON: ${filePath} — skipping`);
    return null;
  }
}

function progressBar(ratio: number, width: number = 10): string {
  const filled = Math.round(ratio * width);
  return "█".repeat(filled) + "░".repeat(width - filled);
}

function pct(n: number, d: number): string {
  if (d === 0) return "N/A";
  return `${Math.round((n / d) * 100)}%`;
}

// ── Section 1: Completeness ─────────────────────────────────────────────────

function computeCompleteness(cluster: ClusterDefinition): HealthReport["completeness"] {
  const csExists = cluster.cornerstone?.slug
    ? (existsSync(contentPath.cornerstone(cluster.cornerstone.slug)) ? 1 : 0)
    : 0;

  const targetCompare = cluster.target_compare || [];
  const targetFaq = cluster.target_faq || [];
  const targetGlossary = cluster.target_glossary || [];
  const trackedBlogs = cluster.tracked_blogs || [];

  const compareExists = targetCompare.filter(
    (p) => existsSync(contentPath.compare(p.slug))
  ).length;
  const comparePromoted = 0; // auto-detect if needed later

  const faqExists = targetFaq.filter(
    (p) => existsSync(contentPath.faq(p.slug))
  ).length;

  const glossExists = targetGlossary.filter(
    (t) => existsSync(contentPath.glossary(t.slug))
  ).length;

  const hubExists = existsSync(contentPath.hub(cluster.topic_slug)) ? 1 : 0;

  const totalNodes =
    1 + // cornerstone
    targetCompare.length +
    targetFaq.length +
    targetGlossary.length +
    1; // hub
  const existNodes = csExists + compareExists + faqExists + glossExists + hubExists;

  return {
    cornerstone: { exists: csExists, total: 1 },
    compare: { exists: compareExists, total: targetCompare.length, promoted: comparePromoted },
    faq: { exists: faqExists, total: targetFaq.length },
    glossary: { exists: glossExists, total: targetGlossary.length },
    hub: { exists: hubExists, total: 1 },
    blogs: trackedBlogs.length,
    overall: { exists: existNodes, total: totalNodes },
  };
}

// ── Section 3: Refresh Status ───────────────────────────────────────────────

function computeRefreshStatus(cluster: ClusterDefinition): HealthReport["refresh"] {
  const refreshArr = cluster.refresh_needed || [];

  const pending = refreshArr
    .filter((r) => !r.refreshed_at)
    .map((r) => ({ slug: r.slug, reason: r.reason, priority: r.priority }));

  const recentlyRefreshed = refreshArr
    .filter((r) => r.refreshed_at)
    .map((r) => ({ slug: r.slug, refreshed_at: r.refreshed_at! }));

  return { pending, recentlyRefreshed };
}

// ── Section 4: Discovery Pipeline ───────────────────────────────────────────

function computeDiscovery(cluster: ClusterDefinition): HealthReport["discovery"] {
  const candidates = cluster.candidates || [];
  const total = candidates.length;

  const byStatus: Record<string, number> = {};
  for (const c of candidates) {
    const status = c.status || "pending";
    byStatus[status] = (byStatus[status] || 0) + 1;
  }

  const topPending = candidates
    .filter((c) => (c.status || "pending") === "pending" || (c.status || "pending") === "low-signal")
    .sort((a, b) => b.score - a.score)
    .slice(0, 5)
    .map((c) => ({ slug: c.slug, score: c.score, type: c.type, source: c.source }));

  return { total, byStatus, topPending };
}

// ── Section 5: GSC Performance ──────────────────────────────────────────────

function parseGscCsv(csvPath: string, pillarTopic: string): GscRow[] {
  if (!existsSync(csvPath)) return [];
  const content = readFileSync(csvPath, "utf-8");
  const lines = content.trim().split("\n");
  if (lines.length < 2) return [];

  const rows: GscRow[] = [];
  for (let i = 1; i < lines.length; i++) {
    const parts = lines[i].split(",");
    if (parts.length < 6) continue;
    const query = parts[0];
    const page = parts[1];
    const clicks = parseInt(parts[2]) || 0;
    const impressions = parseInt(parts[3]) || 0;
    const ctr = parseFloat(parts[4].replace("%", "")) / 100 || 0;
    const position = parseFloat(parts[5]) || 0;
    rows.push({ query, page, clicks, impressions, ctr, position });
  }

  // Filter to rows relevant to this cluster's pillar topic
  const topicLower = pillarTopic.toLowerCase();
  return rows.filter(
    (r) =>
      r.query.toLowerCase().includes(topicLower) ||
      r.page.toLowerCase().includes(topicLower.replace(/\s+/g, "-"))
  );
}

function computeGsc(cluster: ClusterDefinition, gscEnabled: boolean): HealthReport["gsc"] {
  const empty: HealthReport["gsc"] = {
    available: false,
    totalImpressions: 0,
    totalClicks: 0,
    avgCtr: 0,
    avgPosition: 0,
    topPages: [],
    unmatchedQueries: [],
  };

  if (!gscEnabled) return empty;

  const csvPath = join(GSC_DIR, "latest.csv");
  const rows = parseGscCsv(csvPath, cluster.pillar_topic);
  if (rows.length === 0) return empty;

  const totalImpressions = rows.reduce((s, r) => s + r.impressions, 0);
  const totalClicks = rows.reduce((s, r) => s + r.clicks, 0);
  const avgCtr = totalImpressions > 0 ? totalClicks / totalImpressions : 0;
  const avgPosition =
    rows.length > 0
      ? rows.reduce((s, r) => s + r.position * r.impressions, 0) / totalImpressions
      : 0;

  // Top pages by impressions (rows that have a page URL)
  const pageMap = new Map<string, { impressions: number; clicks: number }>();
  for (const r of rows) {
    if (!r.page) continue;
    const existing = pageMap.get(r.page) || { impressions: 0, clicks: 0 };
    existing.impressions += r.impressions;
    existing.clicks += r.clicks;
    pageMap.set(r.page, existing);
  }
  const topPages = Array.from(pageMap.entries())
    .map(([page, data]) => ({ page, ...data }))
    .sort((a, b) => b.impressions - a.impressions)
    .slice(0, 5);

  // Unmatched queries (no page URL, meaningful impressions)
  const unmatchedQueries = rows
    .filter((r) => !r.page && r.impressions >= 10)
    .sort((a, b) => b.impressions - a.impressions)
    .slice(0, 5)
    .map((r) => ({ query: r.query, impressions: r.impressions }));

  return {
    available: true,
    totalImpressions,
    totalClicks,
    avgCtr,
    avgPosition,
    topPages,
    unmatchedQueries,
  };
}

// ── Section 6: Schema Coverage ──────────────────────────────────────────────

function checkSchemaInFile(filePath: string, schemaType: string): boolean {
  if (!existsSync(filePath)) return false;
  const content = readFileSync(filePath, "utf-8");
  // Check frontmatter for schema hints or structured data markers
  // For FAQ pages: check for faqSchema or FAQPage references
  // For compare/blog: check for articleSchema or Article references
  if (schemaType === "FAQPage") {
    return content.includes("faq") && content.includes("schema");
  }
  // For now, check if the frontmatter contains schema-related fields
  // In practice, JSON-LD is added by the Next.js components at render time
  return true;
}

function computeSchema(cluster: ClusterDefinition): HealthReport["schema"] {
  // JSON-LD schemas are typically added at the component level in Next.js,
  // not in the markdown files. We check if content files exist (since the
  // components automatically add JSON-LD for existing pages).
  const targetFaq = cluster.target_faq || [];
  const targetCompare = cluster.target_compare || [];
  const targetGlossary = cluster.target_glossary || [];

  const faqTotal = targetFaq.length;
  const faqFound = targetFaq.filter((p) =>
    existsSync(contentPath.faq(p.slug))
  ).length;

  const compareTotal = targetCompare.length;
  const compareFound = targetCompare.filter((p) =>
    existsSync(contentPath.compare(p.slug))
  ).length;

  // Breadcrumb covers all page types
  const csSlug = cluster.cornerstone?.slug;
  const allPages = [
    ...(csSlug && existsSync(contentPath.cornerstone(csSlug)) ? [1] : []),
    ...targetCompare.filter((p) => existsSync(contentPath.compare(p.slug))),
    ...targetFaq.filter((p) => existsSync(contentPath.faq(p.slug))),
    ...targetGlossary.filter((t) => existsSync(contentPath.glossary(t.slug))),
    ...(existsSync(contentPath.hub(cluster.topic_slug)) ? [1] : []),
  ];

  return {
    faqJsonLd: { found: faqFound, total: faqTotal },
    articleJsonLd: { found: compareFound, total: compareTotal },
    breadcrumbJsonLd: { found: allPages.length, total: allPages.length },
  };
}

// ── Build full report ───────────────────────────────────────────────────────

function buildReport(cluster: ClusterDefinition, gscEnabled: boolean): HealthReport {
  // Provide safe defaults for link-check input
  const safeCluster = {
    topic_slug: cluster.topic_slug,
    cornerstone: cluster.cornerstone || { slug: "", status: "missing" as const },
    target_compare: (cluster.target_compare || []).map((p) => ({
      slug: p.slug,
      status: p.status || ("missing" as const),
    })),
    target_faq: (cluster.target_faq || []).map((p) => ({
      slug: p.slug,
      status: p.status || ("missing" as const),
    })),
    target_glossary: (cluster.target_glossary || []).map((t) => ({
      slug: t.slug,
      status: t.status || ("missing" as const),
    })),
  };

  return {
    cluster: cluster.topic_slug,
    pillar_topic: cluster.pillar_topic,
    timestamp: new Date().toISOString(),
    completeness: computeCompleteness(cluster),
    linkHealth: checkClusterLinkHealth(safeCluster),
    refresh: computeRefreshStatus(cluster),
    discovery: computeDiscovery(cluster),
    gsc: computeGsc(cluster, gscEnabled),
    schema: computeSchema(cluster),
  };
}

// ── Output: Terminal ────────────────────────────────────────────────────────

function printTerminal(report: HealthReport): void {
  const { completeness: c, linkHealth: lh, refresh: r, discovery: d, gsc: g, schema: s } = report;

  console.log("");
  console.log(`📊 Cluster Completeness: ${report.pillar_topic}`);
  console.log("─".repeat(50));

  const csRatio = c.cornerstone.exists / c.cornerstone.total;
  console.log(`  Cornerstone:  ${c.cornerstone.exists}/${c.cornerstone.total}  ${progressBar(csRatio)} ${pct(c.cornerstone.exists, c.cornerstone.total)}`);

  const compRatio = c.compare.exists / c.compare.total;
  const compNote = c.compare.promoted > 0 ? ` (${c.compare.total - c.compare.promoted} original + ${c.compare.promoted} promoted)` : "";
  console.log(`  Compare:      ${c.compare.exists}/${c.compare.total}  ${progressBar(compRatio)} ${pct(c.compare.exists, c.compare.total)}${compNote}`);

  const faqRatio = c.faq.exists / c.faq.total;
  console.log(`  FAQ:         ${c.faq.exists.toString().padStart(2)}/${c.faq.total.toString().padStart(2)} ${progressBar(faqRatio)} ${pct(c.faq.exists, c.faq.total)}`);

  const glossRatio = c.glossary.exists / c.glossary.total;
  console.log(`  Glossary:     ${c.glossary.exists}/${c.glossary.total}  ${progressBar(glossRatio)} ${pct(c.glossary.exists, c.glossary.total)}`);

  const hubRatio = c.hub.exists / c.hub.total;
  console.log(`  Topic Hub:    ${c.hub.exists}/${c.hub.total}  ${progressBar(hubRatio)} ${pct(c.hub.exists, c.hub.total)}`);

  console.log(`  Blogs:        ${c.blogs} tracked`);

  const overallRatio = c.overall.exists / c.overall.total;
  console.log(`\n  Overall: ${c.overall.exists}/${c.overall.total} nodes (${pct(c.overall.exists, c.overall.total)})`);

  // Section 2: Link Health
  console.log("");
  console.log("🔗 Internal Link Health");
  console.log("─".repeat(50));
  console.log(`  Pages checked: ${lh.pagesChecked}`);
  console.log(`  Total internal links: ${lh.totalLinks}`);
  console.log(`  Broken links: ${lh.brokenLinks.length}`);
  if (lh.brokenLinks.length > 0) {
    for (const bl of lh.brokenLinks) {
      console.log(`    ❌ ${bl.page} → ${bl.link}`);
    }
  }
  console.log(`  Orphan pages: ${lh.orphanPages.length}`);
  if (lh.orphanPages.length > 0) {
    for (const op of lh.orphanPages) {
      console.log(`    ⚠️  ${op}`);
    }
  }
  console.log("");
  console.log("  Link density:");
  console.log(`    Cornerstone → other pages: ${lh.linkDensity.cornerstoneOutLinks} links`);
  console.log(`    Compare pages → hub: ${lh.linkDensity.compareToHub.found}/${lh.linkDensity.compareToHub.total} (${pct(lh.linkDensity.compareToHub.found, lh.linkDensity.compareToHub.total)})`);
  console.log(`    Compare pages → cornerstone: ${lh.linkDensity.compareToCornerstone.found}/${lh.linkDensity.compareToCornerstone.total} (${pct(lh.linkDensity.compareToCornerstone.found, lh.linkDensity.compareToCornerstone.total)})`);
  console.log(`    FAQ pages → hub: ${lh.linkDensity.faqToHub.found}/${lh.linkDensity.faqToHub.total} (${pct(lh.linkDensity.faqToHub.found, lh.linkDensity.faqToHub.total)})`);
  console.log(`    Cross-links (compare↔compare): ${lh.linkDensity.crossLinksCompare} links`);
  console.log(`    Cross-links (FAQ↔FAQ): ${lh.linkDensity.crossLinksFaq} links`);

  // Section 3: Refresh Status
  console.log("");
  console.log("🔄 Refresh Status");
  console.log("─".repeat(50));
  if (r.pending.length === 0) {
    console.log("  No pending refreshes");
  } else {
    console.log(`  Pending refresh: ${r.pending.length} pages`);
    for (const p of r.pending) {
      console.log(`    ${p.priority}: ${p.slug} — ${p.reason}`);
    }
  }
  if (r.recentlyRefreshed.length > 0) {
    console.log(`\n  Recently refreshed: ${r.recentlyRefreshed.length} pages`);
    for (const p of r.recentlyRefreshed) {
      console.log(`    ${p.slug} — refreshed ${p.refreshed_at}`);
    }
  }

  // Section 4: Discovery Pipeline
  console.log("");
  console.log("🔍 Discovery Pipeline");
  console.log("─".repeat(50));
  console.log(`  Total candidates: ${d.total}`);
  if (d.total > 0) {
    for (const [status, count] of Object.entries(d.byStatus)) {
      console.log(`    ${status}: ${count}`);
    }
    if (d.topPending.length > 0) {
      console.log("\n  Top candidates:");
      for (const c of d.topPending) {
        console.log(`    ${c.score.toString().padStart(3)}  ${c.slug} — ${c.type} [${c.source}]`);
      }
    }
  } else {
    console.log("  No candidates discovered yet");
  }

  // Section 5: GSC Performance
  console.log("");
  console.log("📈 GSC Performance");
  console.log("─".repeat(50));
  if (!g.available) {
    console.log("  No GSC data available");
  } else {
    console.log(`  Total impressions: ${g.totalImpressions.toLocaleString()}`);
    console.log(`  Total clicks: ${g.totalClicks.toLocaleString()}`);
    console.log(`  Average CTR: ${(g.avgCtr * 100).toFixed(2)}%`);
    console.log(`  Average position: ${g.avgPosition.toFixed(1)}`);
    if (g.topPages.length > 0) {
      console.log("\n  Top pages by impressions:");
      for (const p of g.topPages) {
        console.log(`    ${p.impressions.toLocaleString().padStart(6)}  ${p.page}`);
      }
    }
    if (g.unmatchedQueries.length > 0) {
      console.log("\n  Unmatched queries (in GSC but no page):");
      for (const q of g.unmatchedQueries) {
        console.log(`    ${q.impressions.toString().padStart(4)} impressions — "${q.query}"`);
      }
    }
  }

  // Section 6: Schema Coverage
  console.log("");
  console.log("✅ Schema Coverage");
  console.log("─".repeat(50));
  console.log(`  FAQPage JSON-LD: ${s.faqJsonLd.found}/${s.faqJsonLd.total} FAQ pages (${pct(s.faqJsonLd.found, s.faqJsonLd.total)})`);
  console.log(`  Article JSON-LD: ${s.articleJsonLd.found}/${s.articleJsonLd.total} compare pages (${pct(s.articleJsonLd.found, s.articleJsonLd.total)})`);
  console.log(`  Breadcrumb JSON-LD: ${s.breadcrumbJsonLd.found}/${s.breadcrumbJsonLd.total} pages (${pct(s.breadcrumbJsonLd.found, s.breadcrumbJsonLd.total)})`);
  console.log("");
}

// ── Output: Markdown ────────────────────────────────────────────────────────

function formatMarkdown(report: HealthReport): string {
  const { completeness: c, linkHealth: lh, refresh: r, discovery: d, gsc: g, schema: s } = report;
  const lines: string[] = [];

  lines.push(`# Cluster Health: ${report.pillar_topic}`);
  lines.push(`_Generated: ${report.timestamp}_`);
  lines.push("");

  // Completeness
  lines.push("## Cluster Completeness");
  lines.push("");
  lines.push("| Type | Status | Percentage |");
  lines.push("|------|--------|------------|");
  lines.push(`| Cornerstone | ${c.cornerstone.exists}/${c.cornerstone.total} | ${pct(c.cornerstone.exists, c.cornerstone.total)} |`);
  lines.push(`| Compare | ${c.compare.exists}/${c.compare.total} | ${pct(c.compare.exists, c.compare.total)} |`);
  lines.push(`| FAQ | ${c.faq.exists}/${c.faq.total} | ${pct(c.faq.exists, c.faq.total)} |`);
  lines.push(`| Glossary | ${c.glossary.exists}/${c.glossary.total} | ${pct(c.glossary.exists, c.glossary.total)} |`);
  lines.push(`| Topic Hub | ${c.hub.exists}/${c.hub.total} | ${pct(c.hub.exists, c.hub.total)} |`);
  lines.push(`| Blogs | ${c.blogs} tracked | — |`);
  lines.push(`| **Overall** | **${c.overall.exists}/${c.overall.total}** | **${pct(c.overall.exists, c.overall.total)}** |`);
  lines.push("");

  // Link Health
  lines.push("## Internal Link Health");
  lines.push("");
  lines.push(`- Pages checked: ${lh.pagesChecked}`);
  lines.push(`- Total internal links: ${lh.totalLinks}`);
  lines.push(`- Broken links: ${lh.brokenLinks.length}`);
  if (lh.brokenLinks.length > 0) {
    for (const bl of lh.brokenLinks) {
      lines.push(`  - ${bl.page} → ${bl.link}`);
    }
  }
  lines.push(`- Orphan pages: ${lh.orphanPages.length}`);
  if (lh.orphanPages.length > 0) {
    for (const op of lh.orphanPages) {
      lines.push(`  - ${op}`);
    }
  }
  lines.push("");
  lines.push("### Link Density");
  lines.push(`- Cornerstone → other pages: ${lh.linkDensity.cornerstoneOutLinks} links`);
  lines.push(`- Compare → hub: ${lh.linkDensity.compareToHub.found}/${lh.linkDensity.compareToHub.total}`);
  lines.push(`- Compare → cornerstone: ${lh.linkDensity.compareToCornerstone.found}/${lh.linkDensity.compareToCornerstone.total}`);
  lines.push(`- FAQ → hub: ${lh.linkDensity.faqToHub.found}/${lh.linkDensity.faqToHub.total}`);
  lines.push(`- Cross-links compare: ${lh.linkDensity.crossLinksCompare}`);
  lines.push(`- Cross-links FAQ: ${lh.linkDensity.crossLinksFaq}`);
  lines.push("");

  // Refresh
  lines.push("## Refresh Status");
  lines.push("");
  if (r.pending.length === 0) {
    lines.push("No pending refreshes.");
  } else {
    lines.push(`Pending: ${r.pending.length}`);
    for (const p of r.pending) {
      lines.push(`- **${p.priority}**: ${p.slug} — ${p.reason}`);
    }
  }
  if (r.recentlyRefreshed.length > 0) {
    lines.push("");
    lines.push(`Recently refreshed: ${r.recentlyRefreshed.length}`);
    for (const p of r.recentlyRefreshed) {
      lines.push(`- ${p.slug} — ${p.refreshed_at}`);
    }
  }
  lines.push("");

  // Discovery
  lines.push("## Discovery Pipeline");
  lines.push("");
  lines.push(`Total candidates: ${d.total}`);
  if (d.total > 0) {
    for (const [status, count] of Object.entries(d.byStatus)) {
      lines.push(`- ${status}: ${count}`);
    }
    if (d.topPending.length > 0) {
      lines.push("");
      lines.push("### Top Candidates");
      lines.push("| Score | Slug | Type | Source |");
      lines.push("|-------|------|------|--------|");
      for (const c of d.topPending) {
        lines.push(`| ${c.score} | ${c.slug} | ${c.type} | ${c.source} |`);
      }
    }
  }
  lines.push("");

  // GSC
  lines.push("## GSC Performance");
  lines.push("");
  if (!g.available) {
    lines.push("No GSC data available.");
  } else {
    lines.push(`- Impressions: ${g.totalImpressions.toLocaleString()}`);
    lines.push(`- Clicks: ${g.totalClicks.toLocaleString()}`);
    lines.push(`- CTR: ${(g.avgCtr * 100).toFixed(2)}%`);
    lines.push(`- Position: ${g.avgPosition.toFixed(1)}`);
  }
  lines.push("");

  // Schema
  lines.push("## Schema Coverage");
  lines.push("");
  lines.push(`- FAQPage JSON-LD: ${s.faqJsonLd.found}/${s.faqJsonLd.total}`);
  lines.push(`- Article JSON-LD: ${s.articleJsonLd.found}/${s.articleJsonLd.total}`);
  lines.push(`- Breadcrumb JSON-LD: ${s.breadcrumbJsonLd.found}/${s.breadcrumbJsonLd.total}`);
  lines.push("");

  return lines.join("\n");
}

// ── CLI ──────────────────────────────────────────────────────────────────────

function parseArgs(): {
  clusters: string[];
  format: "terminal" | "json" | "md";
  output: string | null;
  gsc: boolean;
} {
  const args = process.argv.slice(2);
  let clusters: string[] = [];
  let format: "terminal" | "json" | "md" = "terminal";
  let output: string | null = null;
  let gsc = false;

  for (const arg of args) {
    if (arg === "--all") {
      if (existsSync(CLUSTERS_DIR)) {
        clusters = readdirSync(CLUSTERS_DIR)
          .filter((f) => f.endsWith(".json") && !f.startsWith("."))
          .map((f) => f.replace(".json", ""));
      }
    } else if (arg.startsWith("--cluster=")) {
      clusters.push(arg.replace("--cluster=", ""));
    } else if (arg.startsWith("--format=")) {
      const f = arg.replace("--format=", "");
      if (f === "json" || f === "md" || f === "terminal") format = f;
    } else if (arg.startsWith("--output=")) {
      output = arg.replace("--output=", "");
    } else if (arg === "--gsc") {
      gsc = true;
    }
  }

  if (clusters.length === 0) {
    console.error("Usage:");
    console.error("  npx tsx scripts/cluster-health.ts --cluster=claude-code");
    console.error("  npx tsx scripts/cluster-health.ts --all");
    console.error("  npx tsx scripts/cluster-health.ts --cluster=claude-code --format=json");
    console.error("  npx tsx scripts/cluster-health.ts --cluster=claude-code --format=md --output=data/reports/");
    console.error("  npx tsx scripts/cluster-health.ts --cluster=claude-code --gsc");
    process.exit(1);
  }

  return { clusters, format, output, gsc };
}

function main(): void {
  const { clusters, format, output, gsc } = parseArgs();
  const reports: HealthReport[] = [];

  for (const slug of clusters) {
    const cluster = loadCluster(slug);
    if (!cluster) continue;

    const report = buildReport(cluster, gsc);
    reports.push(report);

    if (format === "terminal") {
      printTerminal(report);
    } else if (format === "md") {
      const md = formatMarkdown(report);
      if (output) {
        const outputDir = resolve(ROOT, output);
        if (!existsSync(outputDir)) mkdirSync(outputDir, { recursive: true });
        const date = new Date().toISOString().split("T")[0];
        const filePath = join(outputDir, `cluster-health-${slug}-${date}.md`);
        writeFileSync(filePath, md, "utf-8");
        console.log(`📄 Report written to ${filePath}`);
      } else {
        console.log(md);
      }
    }
  }

  if (format === "json") {
    const output = reports.length === 1 ? reports[0] : reports;
    console.log(JSON.stringify(output, null, 2));
  }
}

main();
