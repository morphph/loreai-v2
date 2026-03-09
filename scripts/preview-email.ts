#!/usr/bin/env npx tsx
/**
 * Preview email newsletter HTML in browser.
 * Usage: npx tsx scripts/preview-email.ts --date=2026-03-09 [--lang=en|zh]
 */
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { markdownToEmailHtml } from './lib/email-html';
import { generateEmailContent } from './write-newsletter';

const dateArg = process.argv.find(a => a.startsWith('--date='));
const langArg = process.argv.find(a => a.startsWith('--lang='));
const date = dateArg ? dateArg.split('=')[1] : '2026-03-09';
const lang = langArg ? langArg.split('=')[1] : 'en';

const mdPath = path.join(process.cwd(), 'content', 'newsletters', lang, `${date}.md`);
if (!fs.existsSync(mdPath)) {
  console.error(`❌ Newsletter not found: ${mdPath}`);
  process.exit(1);
}

const md = fs.readFileSync(mdPath, 'utf-8');
// Strip frontmatter
const stripped = md.replace(/^---[\s\S]*?---\s*/, '');

// Extract title
const titleMatch = stripped.match(/^# (.+)/m);
const title = titleMatch ? titleMatch[1] : `AI News ${date}`;

// Generate email content
const emailMd = generateEmailContent(md);
console.log('📧 Email markdown generated');

async function main() {
  const html = await markdownToEmailHtml(emailMd, { title, date, lang });

  // Save to temp file and open
  const outDir = path.join(process.cwd(), 'content', 'newsletters', 'email', lang);
  fs.mkdirSync(outDir, { recursive: true });
  const outPath = path.join(outDir, `${date}.html`);
  fs.writeFileSync(outPath, html);
  console.log(`✅ Email saved: ${outPath}`);

  // Open in browser
  execSync(`open "${outPath}"`);
}

main().catch(err => {
  console.error('💥 Error:', err);
  process.exit(1);
});
