#!/usr/bin/env npx tsx
/**
 * Preview email newsletter HTML in browser.
 * Usage: npx tsx scripts/preview-email.ts --date=2026-03-09 [--lang=en|zh]
 */
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { markdownToEmailHtml } from './lib/email-html';

const dateArg = process.argv.find(a => a.startsWith('--date='));
const langArg = process.argv.find(a => a.startsWith('--lang='));
const date = dateArg ? dateArg.split('=')[1] : '2026-03-09';
const lang = langArg ? langArg.split('=')[1] : 'en';

// Check for pre-generated email HTML first
const emailPath = path.join(process.cwd(), 'content', 'newsletters', 'email', lang, `${date}.html`);
if (fs.existsSync(emailPath)) {
  console.log(`📧 Opening existing email: ${emailPath}`);
  execSync(`open "${emailPath}"`);
  process.exit(0);
}

// Otherwise generate from newsletter markdown
const mdPath = path.join(process.cwd(), 'content', 'newsletters', lang, `${date}.md`);
if (!fs.existsSync(mdPath)) {
  console.error(`❌ Newsletter not found: ${mdPath}`);
  process.exit(1);
}

const md = fs.readFileSync(mdPath, 'utf-8');
const stripped = md.replace(/^---[\s\S]*?---\s*/, '');
const titleMatch = stripped.match(/^# (.+)/m);
const title = titleMatch ? titleMatch[1] : `AI News ${date}`;

async function main() {
  const html = await markdownToEmailHtml(stripped, { title, date, lang });
  const outDir = path.join(process.cwd(), 'content', 'newsletters', 'email', lang);
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(emailPath, html);
  console.log(`✅ Email saved: ${emailPath}`);
  execSync(`open "${emailPath}"`);
}

main().catch(err => {
  console.error('💥 Error:', err);
  process.exit(1);
});
