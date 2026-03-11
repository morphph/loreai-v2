#!/usr/bin/env npx tsx
/**
 * check-coverage.ts — Check if a topic was recently covered in newsletters
 * Usage: npx tsx scripts/helpers/check-coverage.ts --topic="Claude Opus" --days=5
 * Output: JSON to stdout with matches from newsletter bold titles and filtered-items
 */
import fs from 'fs';
import path from 'path';

const args = process.argv.slice(2);
const topicArg = args.find(a => a.startsWith('--topic='));
const daysArg = args.find(a => a.startsWith('--days='));

if (!topicArg) {
  console.error('Usage: npx tsx scripts/helpers/check-coverage.ts --topic="QUERY" [--days=5]');
  process.exit(1);
}

const query = topicArg.split('=').slice(1).join('=').replace(/^["']|["']$/g, '');
const days = daysArg ? parseInt(daysArg.split('=')[1], 10) : 5;
const queryLower = query.toLowerCase();

interface Match {
  date: string;
  title: string;
  context: string;
  source: 'newsletter' | 'filtered-items';
}

const matches: Match[] = [];
const base = process.cwd();

// 1. Check newsletter files
const nlDir = path.join(base, 'content', 'newsletters', 'en');
if (fs.existsSync(nlDir)) {
  const files = fs.readdirSync(nlDir)
    .filter(f => f.endsWith('.md') && /^\d{4}-\d{2}-\d{2}\.md$/.test(f))
    .sort()
    .reverse()
    .slice(0, days);

  for (const file of files) {
    const date = file.replace('.md', '');
    const content = fs.readFileSync(path.join(nlDir, file), 'utf-8');
    const boldRegex = /\*\*([^*]+)\*\*/g;
    let m: RegExpExecArray | null;
    while ((m = boldRegex.exec(content)) !== null) {
      const title = m[1];
      if (title.toLowerCase().includes(queryLower)) {
        // Grab context: the bold match + text after it (up to 200 chars)
        const pos = m.index;
        const contextEnd = Math.min(pos + 200, content.length);
        const context = content.slice(pos, contextEnd).replace(/\n/g, ' ').trim();
        matches.push({ date, title, context, source: 'newsletter' });
      }
    }
  }
}

// 2. Check filtered-items JSON files
const fiDir = path.join(base, 'data', 'filtered-items');
if (fs.existsSync(fiDir)) {
  const files = fs.readdirSync(fiDir)
    .filter(f => f.endsWith('.json') && /^\d{4}-\d{2}-\d{2}\.json$/.test(f))
    .sort()
    .reverse()
    .slice(0, days);

  for (const file of files) {
    const date = file.replace('.json', '');
    try {
      const items = JSON.parse(fs.readFileSync(path.join(fiDir, file), 'utf-8'));
      if (Array.isArray(items)) {
        for (const item of items) {
          if (item.title && item.title.toLowerCase().includes(queryLower)) {
            matches.push({
              date,
              title: item.title,
              context: item.why_it_matters || item.title,
              source: 'filtered-items',
            });
          }
        }
      }
    } catch { /* skip invalid JSON */ }
  }
}

console.log(JSON.stringify({ query, days, matches }, null, 2));
