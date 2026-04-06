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
import { loadTargets, injectLinks } from './lib/link-inject';

const ROOT = process.cwd();

// CLI args
const DRY_RUN = process.argv.includes('--dry-run');
const typeArg = process.argv.find((a) => a.startsWith('--type='));
const TYPES = typeArg ? [typeArg.split('=')[1]] : ['blog', 'faq', 'glossary', 'compare'];
const langArg = process.argv.find((a) => a.startsWith('--lang='));
const LANGS = langArg ? [langArg.split('=')[1]] : ['en', 'zh'];
const maxArg = process.argv.find((a) => a.startsWith('--max-links='));
const MAX_LINKS_PER_FILE = maxArg ? parseInt(maxArg.split('=')[1], 10) : 5;

// ---------------------------------------------------------------------------

function main() {
  const targets = loadTargets();
  if (Object.keys(targets).length === 0) {
    console.error('No link targets found. Run build-link-targets.ts first.');
    process.exit(1);
  }
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

        const { result, added, details } = injectLinks(content, targets, slug, lang, MAX_LINKS_PER_FILE);

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
