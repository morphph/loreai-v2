/**
 * scripts/lib/link-inject.ts — Shared internal link injection
 *
 * Extracted from backfill-links.ts so both the backfill script and
 * import-blog.ts can inject internal links via keyword matching.
 * Zero LLM cost — pure string matching against link-targets.json.
 */
import fs from 'fs';
import path from 'path';

export interface LinkTarget {
  title: string;
  keywords: string[];
  type: string;
}

export function loadTargets(root?: string): Record<string, LinkTarget> {
  const targetsFile = path.join(root || process.cwd(), 'data', 'link-targets.json');
  if (!fs.existsSync(targetsFile)) {
    console.error(`Link targets not found at ${targetsFile}. Run build-link-targets.ts first.`);
    return {};
  }
  return JSON.parse(fs.readFileSync(targetsFile, 'utf-8'));
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Generic terms that match too broadly — skip these
const STOPLIST = new Set([
  'claude', 'anthropic', 'openai', 'google', 'meta', 'microsoft', 'amazon', 'nvidia',
  'gpt', 'gemini', 'llama', 'model', 'models', 'agent', 'agents', 'api',
  'configuration', 'setup', 'install', 'pricing', 'free', 'cost',
]);

export function injectLinks(
  content: string,
  targets: Record<string, LinkTarget>,
  selfSlug: string,
  lang: string,
  maxLinks = 5
): { result: string; added: number; details: string[] } {
  const prefix = lang === 'en' ? '' : `/${lang}`;
  let added = 0;
  const details: string[] = [];
  const linkedUrls = new Set<string>();
  const usedKeywords = new Set<string>();

  // Extract already-existing internal links to avoid double-linking
  const existingLinks = content.match(/\[[^\]]*\]\(\/[^)]+\)/g) || [];
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
      if (kw.length < 3) continue;
      if (STOPLIST.has(kw.toLowerCase())) continue;
      kwIndex.push({ keyword: kw, url, title: target.title });
    }
  }
  kwIndex.sort((a, b) => b.keyword.length - a.keyword.length);

  // Split content into "safe" and "unsafe" zones
  // Unsafe: code blocks, existing links, headings, frontmatter
  const lines = content.split('\n');
  let inCodeBlock = false;

  for (let i = 0; i < lines.length; i++) {
    if (added >= maxLinks) break;

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
      if (added >= maxLinks) break;
      if (linkedUrls.has(url)) continue;
      if (usedKeywords.has(keyword.toLowerCase())) continue;

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
