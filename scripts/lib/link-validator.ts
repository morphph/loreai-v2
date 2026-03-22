/**
 * B4 — Post-generation Link Validation
 *
 * Extracts internal links from generated markdown, checks that targets exist
 * (on disk or in DB), removes broken links, and flags missing glossary links.
 *
 * @see docs/plans/specs/SPEC-B4-content-generation.md §6
 */

import { existsSync } from 'fs';
import path from 'path';
import { getDb } from './db';

// ── Types ──

export interface LinkValidationResult {
  total_links: number;
  valid_links: number;
  broken_links: Array<{ link: string; reason: string }>;
  missing_glossary_links: Array<{ term: string; slug: string }>;
  fixed_markdown: string;
}

// ── Whitelist — always valid ──

const ALWAYS_VALID = new Set(['/subscribe']);

// ── Link type → content directory mapping ──

const LINK_TYPE_MAP: Record<string, string> = {
  glossary: 'glossary',
  faq: 'faq',
  compare: 'compare',
  blog: 'blog',
  topics: 'topics',
  newsletter: 'newsletter',
};

// ── Core ──

/**
 * Extract all internal links from markdown.
 * Returns array of { text, href } for links starting with /
 */
export function extractInternalLinks(
  markdown: string,
): Array<{ text: string; href: string; full: string }> {
  const regex = /\[([^\]]+)\]\((\/[^)]+)\)/g;
  const links: Array<{ text: string; href: string; full: string }> = [];
  let match;
  while ((match = regex.exec(markdown)) !== null) {
    links.push({
      text: match[1],
      href: match[2],
      full: match[0],
    });
  }
  return links;
}

/**
 * Check if a link target exists on disk or in the DB.
 */
function linkTargetExists(href: string, lang: string): { exists: boolean; reason?: string } {
  // Whitelist
  if (ALWAYS_VALID.has(href)) {
    return { exists: true };
  }

  // Parse: /type/slug → type + slug
  const parts = href.split('/').filter(Boolean);
  if (parts.length < 2) {
    return { exists: false, reason: 'Invalid internal link format' };
  }

  const linkType = parts[0];
  const slug = parts.slice(1).join('/');

  const contentDir = LINK_TYPE_MAP[linkType];
  if (!contentDir) {
    return { exists: false, reason: `Unknown link type: ${linkType}` };
  }

  // Check filesystem
  const filePath = path.join(process.cwd(), 'content', contentDir, lang, `${slug}.md`);
  if (existsSync(filePath)) {
    return { exists: true };
  }

  // Check DB
  try {
    const db = getDb();
    const dbType = linkType === 'topics' ? 'topic-hub' : linkType;
    const row = db
      .prepare('SELECT id FROM content WHERE type = ? AND slug = ? AND lang = ?')
      .get(dbType, slug, lang);
    if (row) {
      return { exists: true };
    }

    // Also check with original linkType (e.g. 'topics')
    if (dbType !== linkType) {
      const row2 = db
        .prepare('SELECT id FROM content WHERE type = ? AND slug = ? AND lang = ?')
        .get(linkType, slug, lang);
      if (row2) {
        return { exists: true };
      }
    }
  } catch {
    // DB error — assume not found
  }

  return { exists: false, reason: `Target not found: ${filePath}` };
}

/**
 * Find glossary terms that exist but are not linked in the text.
 */
function findMissingGlossaryLinks(
  markdown: string,
  lang: string,
): Array<{ term: string; slug: string }> {
  const missing: Array<{ term: string; slug: string }> = [];

  try {
    const db = getDb();
    // Get all existing glossary entries
    const glossaryEntries = db
      .prepare("SELECT slug, title FROM content WHERE type = 'glossary' AND lang = ?")
      .all(lang) as Array<{ slug: string; title: string | null }>;

    // Extract already-linked glossary slugs
    const linkedSlugs = new Set<string>();
    const linkRegex = /\[[^\]]+\]\(\/glossary\/([^)]+)\)/g;
    let match;
    while ((match = linkRegex.exec(markdown)) !== null) {
      linkedSlugs.add(match[1]);
    }

    // Strip markdown links and frontmatter for plain text search
    const plainText = markdown
      .replace(/^---[\s\S]*?---/m, '')
      .replace(/\[[^\]]*\]\([^)]*\)/g, '')
      .replace(/[#*_`]/g, '');

    for (const entry of glossaryEntries) {
      if (linkedSlugs.has(entry.slug)) continue;

      // Convert slug to display term for searching
      const displayTerm = entry.title || entry.slug.replace(/-/g, ' ');

      // Case-insensitive search for the term in plain text
      const termRegex = new RegExp(`\\b${escapeRegex(displayTerm)}\\b`, 'i');
      if (termRegex.test(plainText)) {
        missing.push({ term: displayTerm, slug: entry.slug });
      }
    }
  } catch {
    // DB error — skip
  }

  return missing;
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// ── Main Validation Function ──

export function validateLinks(
  markdown: string,
  _contentType: string,
  lang: string,
): LinkValidationResult {
  const links = extractInternalLinks(markdown);
  const broken: Array<{ link: string; reason: string }> = [];
  let validCount = 0;
  let fixed = markdown;

  for (const link of links) {
    const { exists, reason } = linkTargetExists(link.href, lang);
    if (exists) {
      validCount++;
    } else {
      broken.push({ link: link.href, reason: reason || 'Target not found' });
      // Remove link wrapper, keep anchor text
      fixed = fixed.replace(link.full, link.text);
    }
  }

  const missingGlossary = findMissingGlossaryLinks(fixed, lang);

  return {
    total_links: links.length,
    valid_links: validCount,
    broken_links: broken,
    missing_glossary_links: missingGlossary,
    fixed_markdown: fixed,
  };
}
