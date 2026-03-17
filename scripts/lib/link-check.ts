/**
 * Internal link extraction and validation for cluster health checks.
 */

import { existsSync, readFileSync, readdirSync } from "fs";
import { join, resolve } from "path";

const ROOT = resolve(join(__dirname, "..", ".."));
const CONTENT_DIR = join(ROOT, "content");

export interface LinkCheckResult {
  totalLinks: number;
  brokenLinks: { page: string; link: string }[];
  orphanPages: string[]; // pages not linked from hub
  linkDensity: {
    cornerstoneOutLinks: number;
    compareToHub: { found: number; total: number };
    compareToCornerstone: { found: number; total: number };
    faqToHub: { found: number; total: number };
    crossLinksCompare: number;
    crossLinksFaq: number;
  };
  pagesChecked: number;
}

/**
 * Extract internal links (markdown format) from content string.
 * Matches [text](/path) patterns — only internal links starting with /.
 */
export function extractInternalLinks(content: string): string[] {
  const linkRegex = /\[([^\]]*)\]\((\/[^)]+)\)/g;
  const links: string[] = [];
  let match;
  while ((match = linkRegex.exec(content))) {
    links.push(match[2]);
  }
  return links;
}

/**
 * Check if an internal link path resolves to an existing content file.
 */
export function checkLinkExists(linkPath: string): boolean {
  const parts = linkPath.split("/").filter(Boolean);
  if (parts.length < 2) return true; // single-segment path (e.g. /subscribe) — not a content link

  const type = parts[0]; // compare, faq, glossary, blog, topics
  const slug = parts.slice(1).join("/"); // handle nested paths

  // Map URL path types to content directories
  const contentTypeMap: Record<string, string> = {
    compare: "compare",
    faq: "faq",
    glossary: "glossary",
    blog: "blog",
    topics: "topics",
  };

  const contentType = contentTypeMap[type];
  if (!contentType) return true; // non-content path — not a broken link

  const filePath = join(CONTENT_DIR, contentType, "en", `${slug}.md`);
  return existsSync(filePath);
}

/**
 * Get all content file paths for a cluster's pages.
 */
function getClusterContentFiles(cluster: {
  cornerstone: { slug: string; status: string };
  target_compare: Array<{ slug: string; status: string }>;
  target_faq: Array<{ slug: string; status: string }>;
  target_glossary: Array<{ slug: string; status: string }>;
  topic_slug: string;
}): { path: string; slug: string; type: string }[] {
  const files: { path: string; slug: string; type: string }[] = [];

  // Cornerstone
  if (cluster.cornerstone.status === "exists") {
    const p = join(CONTENT_DIR, "blog", "en", `${cluster.cornerstone.slug}.md`);
    if (existsSync(p)) files.push({ path: p, slug: cluster.cornerstone.slug, type: "cornerstone" });
  }

  // Compare
  for (const page of cluster.target_compare) {
    if (page.status === "exists") {
      const p = join(CONTENT_DIR, "compare", "en", `${page.slug}.md`);
      if (existsSync(p)) files.push({ path: p, slug: page.slug, type: "compare" });
    }
  }

  // FAQ
  for (const page of cluster.target_faq) {
    if (page.status === "exists") {
      const p = join(CONTENT_DIR, "faq", "en", `${page.slug}.md`);
      if (existsSync(p)) files.push({ path: p, slug: page.slug, type: "faq" });
    }
  }

  // Glossary
  for (const term of cluster.target_glossary) {
    if (term.status === "exists") {
      const p = join(CONTENT_DIR, "glossary", "en", `${term.slug}.md`);
      if (existsSync(p)) files.push({ path: p, slug: term.slug, type: "glossary" });
    }
  }

  // Topic hub
  const hubPath = join(CONTENT_DIR, "topics", "en", `${cluster.topic_slug}.md`);
  if (existsSync(hubPath)) {
    files.push({ path: hubPath, slug: cluster.topic_slug, type: "hub" });
  }

  return files;
}

/**
 * Full link health audit for a cluster.
 */
export function checkClusterLinkHealth(cluster: {
  topic_slug: string;
  cornerstone: { slug: string; status: string };
  target_compare: Array<{ slug: string; status: string }>;
  target_faq: Array<{ slug: string; status: string }>;
  target_glossary: Array<{ slug: string; status: string }>;
}): LinkCheckResult {
  const files = getClusterContentFiles(cluster);
  const hubUrl = `/topics/${cluster.topic_slug}`;
  const cornerstoneUrl = `/blog/${cluster.cornerstone.slug}`;

  let totalLinks = 0;
  const brokenLinks: { page: string; link: string }[] = [];
  const pagesLinkedFromHub = new Set<string>();

  // Track per-page links for density analysis
  let cornerstoneOutLinks = 0;
  let compareToHubCount = 0;
  let compareToCSCount = 0;
  let faqToHubCount = 0;
  let crossLinksCompare = 0;
  let crossLinksFaq = 0;

  const compareSlugs = cluster.target_compare
    .filter((p) => p.status === "exists")
    .map((p) => p.slug);
  const faqSlugs = cluster.target_faq
    .filter((p) => p.status === "exists")
    .map((p) => p.slug);

  for (const file of files) {
    const content = readFileSync(file.path, "utf-8");
    const links = extractInternalLinks(content);
    totalLinks += links.length;

    // Check for broken links
    for (const link of links) {
      if (!checkLinkExists(link)) {
        brokenLinks.push({ page: `${file.type}/${file.slug}`, link });
      }
    }

    // Hub: track which pages it links to
    if (file.type === "hub") {
      for (const link of links) {
        pagesLinkedFromHub.add(link);
      }
    }

    // Cornerstone link density
    if (file.type === "cornerstone") {
      cornerstoneOutLinks = links.length;
    }

    // Compare pages: check links to hub and cornerstone
    if (file.type === "compare") {
      if (links.some((l) => l === hubUrl)) compareToHubCount++;
      if (links.some((l) => l === cornerstoneUrl)) compareToCSCount++;
      // Cross-links to other compare pages
      for (const link of links) {
        if (compareSlugs.some((s) => link === `/compare/${s}`) && link !== `/compare/${file.slug}`) {
          crossLinksCompare++;
        }
      }
    }

    // FAQ pages: check links to hub
    if (file.type === "faq") {
      if (links.some((l) => l === hubUrl)) faqToHubCount++;
      // Cross-links to other FAQ pages
      for (const link of links) {
        if (faqSlugs.some((s) => link === `/faq/${s}`) && link !== `/faq/${file.slug}`) {
          crossLinksFaq++;
        }
      }
    }
  }

  // Orphan pages: pages not linked from the hub
  const orphanPages: string[] = [];
  for (const file of files) {
    if (file.type === "hub") continue;
    // Build the URL path this page would have
    const typeUrlMap: Record<string, string> = {
      cornerstone: "blog",
      compare: "compare",
      faq: "faq",
      glossary: "glossary",
    };
    const urlType = typeUrlMap[file.type];
    if (urlType) {
      const url = `/${urlType}/${file.slug}`;
      if (!pagesLinkedFromHub.has(url)) {
        orphanPages.push(`${file.type}/${file.slug}`);
      }
    }
  }

  const compareTotal = compareSlugs.length;
  const faqTotal = faqSlugs.length;

  return {
    totalLinks,
    brokenLinks,
    orphanPages,
    linkDensity: {
      cornerstoneOutLinks,
      compareToHub: { found: compareToHubCount, total: compareTotal },
      compareToCornerstone: { found: compareToCSCount, total: compareTotal },
      faqToHub: { found: faqToHubCount, total: faqTotal },
      crossLinksCompare,
      crossLinksFaq,
    },
    pagesChecked: files.length,
  };
}
