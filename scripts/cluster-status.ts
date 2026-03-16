#!/usr/bin/env npx tsx
/**
 * Cluster Status Tool
 * Reports gap analysis for flagship topic clusters.
 *
 * Usage:
 *   npx tsx scripts/cluster-status.ts --cluster=claude-code
 *   npx tsx scripts/cluster-status.ts --cluster=claude-code --update
 *   npx tsx scripts/cluster-status.ts --all
 */

import { existsSync, readFileSync, writeFileSync, readdirSync } from "fs";
import { join, resolve } from "path";

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
    type: "compare" | "faq" | "glossary";
    slug: string;
    display: string;
    source: string;
    evidence_score: number;
    discovered_at: string;
  }>;
}

// ── Paths ────────────────────────────────────────────────────────────────────

const ROOT = resolve(join(__dirname, ".."));
const CLUSTERS_DIR = join(ROOT, "data", "flagship-clusters");
const CONTENT_DIR = join(ROOT, "content");

// Content type → filesystem path mapping
const contentPath = {
  cornerstone: (slug: string) => join(CONTENT_DIR, "blog", "en", `${slug}.md`),
  compare: (slug: string) => join(CONTENT_DIR, "compare", "en", `${slug}.md`),
  faq: (slug: string) => join(CONTENT_DIR, "faq", "en", `${slug}.md`),
  glossary: (slug: string) =>
    join(CONTENT_DIR, "glossary", "en", `${slug}.md`),
  blog: (slug: string) => join(CONTENT_DIR, "blog", "en", `${slug}.md`),
};

// ── Helpers ──────────────────────────────────────────────────────────────────

function loadCluster(slug: string): ClusterDefinition {
  const filePath = join(CLUSTERS_DIR, `${slug}.json`);
  if (!existsSync(filePath)) {
    console.error(`❌ Cluster file not found: ${filePath}`);
    process.exit(1);
  }
  return JSON.parse(readFileSync(filePath, "utf-8"));
}

function checkExists(pathFn: (slug: string) => string, slug: string): boolean {
  return existsSync(pathFn(slug));
}

function detectStatus(
  pathFn: (slug: string) => string,
  slug: string
): "exists" | "missing" {
  return checkExists(pathFn, slug) ? "exists" : "missing";
}

// ── Status computation ───────────────────────────────────────────────────────

function computeStatus(cluster: ClusterDefinition): {
  cluster: ClusterDefinition;
  changed: boolean;
} {
  let changed = false;

  // Cornerstone
  const csStatus = detectStatus(contentPath.cornerstone, cluster.cornerstone.slug);
  if (cluster.cornerstone.status !== csStatus) {
    cluster.cornerstone.status = csStatus;
    changed = true;
  }

  // Compare pages
  for (const page of cluster.target_compare) {
    const status = detectStatus(contentPath.compare, page.slug);
    if (page.status !== status) {
      page.status = status;
      changed = true;
    }
  }

  // FAQ pages
  for (const page of cluster.target_faq) {
    const status = detectStatus(contentPath.faq, page.slug);
    if (page.status !== status) {
      page.status = status;
      changed = true;
    }
  }

  // Glossary
  for (const term of cluster.target_glossary) {
    const status = detectStatus(contentPath.glossary, term.slug);
    if (term.status !== status) {
      term.status = status;
      changed = true;
    }
  }

  return { cluster, changed };
}

// ── Report ───────────────────────────────────────────────────────────────────

function printReport(cluster: ClusterDefinition): void {
  const { pillar_topic } = cluster;

  console.log("");
  console.log(`📊 ${pillar_topic} Cluster Status`);
  console.log("══════════════════════════════");

  // Cornerstone
  const csIcon = cluster.cornerstone.status === "exists" ? "✅" : "❌";
  console.log(
    `Cornerstone: ${csIcon} ${cluster.cornerstone.status.toUpperCase()} (${cluster.cornerstone.slug})`
  );

  // Compare
  const compareExist = cluster.target_compare.filter(
    (p) => p.status === "exists"
  );
  const compareMiss = cluster.target_compare.filter(
    (p) => p.status !== "exists"
  );
  const comparePct = Math.round(
    (compareExist.length / cluster.target_compare.length) * 100
  );
  const compareExistStr = compareExist.map((p) => p.slug.replace("claude-code-", "")).join(" ");
  const compareMissStr = compareMiss.map((p) => p.slug.replace("claude-code-", "")).join(" ");
  console.log(
    `Compare:     ${compareExist.length}/${cluster.target_compare.length} (${comparePct}%) — ${compareExistStr ? `✅ ${compareExistStr}` : ""}${compareExistStr && compareMissStr ? " | " : ""}${compareMissStr ? `❌ ${compareMissStr}` : ""}`
  );

  // FAQ
  const faqExist = cluster.target_faq.filter((p) => p.status === "exists");
  const faqMiss = cluster.target_faq.filter((p) => p.status !== "exists");
  const faqPct = Math.round(
    (faqExist.length / cluster.target_faq.length) * 100
  );
  const faqExistStr = faqExist.map((p) => p.slug).join(", ");
  const faqMissStr = faqMiss.map((p) => p.slug).join(", ");
  console.log(
    `FAQ:         ${faqExist.length}/${cluster.target_faq.length} (${faqPct}%) — ${faqExistStr ? `✅ ${faqExistStr}` : ""}${faqExistStr && faqMissStr ? " | " : ""}${faqMissStr ? `❌ ${faqMissStr}` : ""}`
  );

  // Glossary
  const glossExist = cluster.target_glossary.filter(
    (t) => t.status === "exists"
  );
  const glossMiss = cluster.target_glossary.filter(
    (t) => t.status !== "exists"
  );
  const glossPct = Math.round(
    (glossExist.length / cluster.target_glossary.length) * 100
  );
  const glossExistStr = glossExist.map((t) => t.slug).join(", ");
  const glossMissStr = glossMiss.map((t) => t.slug).join(", ");
  console.log(
    `Glossary:    ${glossExist.length}/${cluster.target_glossary.length} (${glossPct}%) — ${glossExistStr ? `✅ ${glossExistStr}` : ""}${glossExistStr && glossMissStr ? " | " : ""}${glossMissStr ? `❌ ${glossMissStr}` : ""}`
  );

  // Blogs
  console.log(`Blogs:       ${cluster.tracked_blogs.length} tracked`);

  // Overall
  const totalNodes =
    1 + // cornerstone
    cluster.target_compare.length +
    cluster.target_faq.length +
    cluster.target_glossary.length;
  const existNodes =
    (cluster.cornerstone.status === "exists" ? 1 : 0) +
    compareExist.length +
    faqExist.length +
    glossExist.length;
  const overallPct = Math.round((existNodes / totalNodes) * 100);
  console.log(`Overall:     ${existNodes}/${totalNodes} nodes (${overallPct}%)`);
  console.log("");
}

// ── CLI ──────────────────────────────────────────────────────────────────────

function parseArgs(): { clusters: string[]; update: boolean } {
  const args = process.argv.slice(2);
  let clusters: string[] = [];
  let update = false;

  for (const arg of args) {
    if (arg === "--update") {
      update = true;
    } else if (arg === "--all") {
      // Discover all cluster files
      if (existsSync(CLUSTERS_DIR)) {
        clusters = readdirSync(CLUSTERS_DIR)
          .filter((f) => f.endsWith(".json"))
          .map((f) => f.replace(".json", ""));
      }
    } else if (arg.startsWith("--cluster=")) {
      clusters.push(arg.replace("--cluster=", ""));
    }
  }

  if (clusters.length === 0) {
    console.error("Usage:");
    console.error(
      "  npx tsx scripts/cluster-status.ts --cluster=claude-code"
    );
    console.error(
      "  npx tsx scripts/cluster-status.ts --cluster=claude-code --update"
    );
    console.error("  npx tsx scripts/cluster-status.ts --all");
    process.exit(1);
  }

  return { clusters, update };
}

function main(): void {
  const { clusters, update } = parseArgs();

  for (const slug of clusters) {
    const cluster = loadCluster(slug);
    const { cluster: updated, changed } = computeStatus(cluster);

    printReport(updated);

    if (update && changed) {
      const filePath = join(CLUSTERS_DIR, `${slug}.json`);
      writeFileSync(filePath, JSON.stringify(updated, null, 2) + "\n", "utf-8");
      console.log(`📝 Updated ${filePath}`);
    } else if (update && !changed) {
      console.log(`✅ ${slug}: all status fields already correct`);
    }
  }
}

main();
