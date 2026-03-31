#!/usr/bin/env npx tsx
/**
 * Backfill internal links into existing markdown content by keyword matching.
 * Zero LLM cost — pure string matching against link-targets.json.
 *
 * Usage:
 *   npx tsx scripts/backfill-links.ts --dry-run          # Preview changes
 *   npx tsx scripts/backfill-links.ts                     # Apply changes
 *   npx tsx scripts/backfill-links.ts --type=blog         # Only blog posts
 *   npx tsx scripts/backfill-links.ts --lang=en           # Only English
 *   npx tsx scripts/backfill-links.ts --max-links=5       # Max 5 links per file
 */

import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';

const ROOT = process.cwd();
const TARGETS_FILE = path.join(ROOT, 'data', 'link-targets.json');

// CLI args
const DRY_RUN = process.argv.includes('--dry-run');
const typeArg = process.argv.find((a) => a.startsWith('--type='));
const TYPES = typeArg ? [typeArg.split('=')[1]] : ['blog', 'faq', 'glossary', 'compare'];
const langArg = process.argv.find((a) => a.startsWith('--lang='));
const LANGS = langArg ? [langArg.split('=')[1]] : ['en', 'zh'];
const maxArg = process.argv.find((a) => a.startsWith('--max-links='));
const MAX_LINKS_PER_FILE = maxArg ? parseInt(maxArg.split('=')[1], 10) : 5;

interface LinkTarget {
  title: string;
  keywords: string[];
  type: string;
}

// ---------------------------------------------------------------------------

function loadTargets(): Record<string, LinkTarget> {
  if (!fs.existsSync(TARGETS_FILE)) {
    console.error(`Link targets not found at ${TARGETS_FILE}. Run build-link-targets.ts first.`);
    process.exit(1);
  }
  return JSON.parse(fs.readFileSync(TARGETS_FILE, 'utf-8'));
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function injectLinks(
  content: string,
  targets: Record<string, LinkTarget>,
  selfSlug: string,
  lang: string
): { result: string; added: number; details: string[] } {
  const prefix = lang === 'en' ? '' : `/${lang}`;
  let result = content;
  let added = 0;
  const details: string[] = [];
  const linkedUrls = new Set<string>();
  const usedKeywords = new Set<string>(); // track keyword text to avoid same anchor for different URLs

  // Generic terms that match too broadly — skip these
  const STOPLIST = new Set([
    'claude', 'anthropic', 'openai', 'google', 'meta', 'microsoft', 'amazon', 'nvidia',
    'gpt', 'gemini', 'llama', 'model', 'models', 'agent', 'agents', 'api',
    'configuration', 'setup', 'install', 'pricing', 'free', 'cost',
  ]);

  // Extract already-existing internal links to avoid double-linking
  const existingLinks = result.match(/\[[^\]]*\]\(\/[^)]+\)/g) || [];
  for (const link of existingLinks) {
    const urlMatch = link.match(/\((\/[^)]+)\)/);
    if (urlMatch) linkedUrls.add(urlMatch[1]);
  }

  // Build keyword → URL index, sorted by keyword length desc (match longest first)
  const kwIndex: { keyword: string; url: string; title: string }[] = [];
  for (const [url, target] of Object.entries(targets)) {
    // Only link to content in the same language
    if (lang === 'en' && url.startsWith('/zh')) continue;
    if (lang === 'zh' && !url.startsWith('/zh')) continue;

    // Don't self-link
    if (url.endsWith(`/${selfSlug}`)) continue;

    for (const kw of target.keywords) {
      if (kw.length < 3) continue; // skip very short keywords
      if (STOPLIST.has(kw.toLowerCase())) continue; // skip generic terms
      kwIndex.push({ keyword: kw, url, title: target.title });
    }
  }
  kwIndex.sort((a, b) => b.keyword.length - a.keyword.length);

  // Split content into "safe" and "unsafe" zones
  // Unsafe: code blocks, existing links, headings, frontmatter
  const lines = result.split('\n');
  let inCodeBlock = false;

  for (let i = 0; i < lines.length; i++) {
    if (added >= MAX_LINKS_PER_FILE) break;

    const line = lines[i];

    // Track code fences
    if (line.trimStart().startsWith('```')) {
      inCodeBlock = !inCodeBlock;
      continue;
    }
    if (inCodeBlock) continue;

    // Skip headings, frontmatter delimiters, empty lines
    if (line.startsWith('#') || line.startsWith('---') || line.trim() === '') continue;

    // Skip lines that are predominantly links already
    if ((line.match(/\[[^\]]*\]\([^)]+\)/g) || []).length >= 2) continue;

    let modified = line;
    for (const { keyword, url } of kwIndex) {
      if (added >= MAX_LINKS_PER_FILE) break;
      if (linkedUrls.has(url)) continue;
      if (usedKeywords.has(keyword.toLowerCase())) continue; // same anchor text already used

      // Match whole word/phrase, case insensitive, not already inside a link
      const pattern = new RegExp(
        `(?<![\\[/])\\b(${escapeRegex(keyword)})\\b(?![\\]\\(])`,
        'i'
      );
      const match = modified.match(pattern);
      if (match && match.index !== undefined) {
        const original = match[1];
        modified =
          modified.slice(0, match.index) +
          `[${original}](${url})` +
          modified.slice(match.index + original.length);
        linkedUrls.add(url);
        usedKeywords.add(keyword.toLowerCase());
        added++;
        details.push(`  + "${original}" → ${url}`);
      }
    }
    lines[i] = modified;
  }

  return { result: lines.join('\n'), added, details };
}

// ---------------------------------------------------------------------------

function main() {
  const targets = loadTargets();
  console.log(`\nLoaded ${Object.keys(targets).length} link targets`);
  console.log(`Mode: ${DRY_RUN ? 'DRY RUN (no files changed)' : 'APPLY'}\n`);

  let totalFiles = 0;
  let totalModified = 0;
  let totalLinksAdded = 0;

  for (const type of TYPES) {
    for (const lang of LANGS) {
      const dir = path.join(ROOT, 'content', type, lang);
      if (!fs.existsSync(dir)) continue;

      const files = fs.readdirSync(dir).filter((f) => f.endsWith('.md') && !f.startsWith('.'));
      for (const file of files) {
        totalFiles++;
        const filePath = path.join(dir, file);
        const raw = fs.readFileSync(filePath, 'utf-8');
        const { data, content } = matter(raw);
        const slug = data.slug || file.replace(/\.md$/, '');

        const { result, added, details } = injectLinks(content, targets, slug, lang);

        if (added > 0) {
          totalModified++;
          totalLinksAdded += added;
          console.log(`${type}/${lang}/${file} (+${added} links)`);
          for (const d of details) console.log(d);

          if (!DRY_RUN) {
            // Reconstruct file with original frontmatter + modified content
            const newRaw = matter.stringify(result, data);
            fs.writeFileSync(filePath, newRaw, 'utf-8');
          }
        }
      }
    }
  }

  console.log(`\n--- Summary ---`);
  console.log(`Files scanned: ${totalFiles}`);
  console.log(`Files modified: ${totalModified}`);
  console.log(`Links added: ${totalLinksAdded}`);
  if (DRY_RUN) console.log(`(dry run — no files were changed)`);
}

main();
