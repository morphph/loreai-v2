/**
 * Send the daily newsletter via Buttondown.
 *
 * Usage:
 *   npx tsx scripts/send-newsletter.ts --date=2026-03-05
 *   npx tsx scripts/send-newsletter.ts --date=2026-03-05 --dry-run
 *   npx tsx scripts/send-newsletter.ts --date=2026-03-05 --lang=zh
 */
import 'dotenv/config';
import { readFileSync, existsSync, writeFileSync } from 'fs';
import { join } from 'path';
import matter from 'gray-matter';
import { sendEmail } from './lib/buttondown';
import { markdownToEmailHtml } from './lib/email-html';

const args = process.argv.slice(2);
const dateArg = args.find((a) => a.startsWith('--date='))?.split('=')[1];
const langArg = args.find((a) => a.startsWith('--lang='))?.split('=')[1] || 'en';
const dryRun = args.includes('--dry-run');
const preview = args.includes('--preview');

if (!dateArg) {
  console.error('Usage: npx tsx scripts/send-newsletter.ts --date=YYYY-MM-DD [--lang=en|zh] [--dry-run] [--preview]');
  process.exit(1);
}

const contentDir = join(process.cwd(), 'content', 'newsletters', langArg);
const filePath = join(contentDir, `${dateArg}.md`);

if (!existsSync(filePath)) {
  console.error(`Newsletter not found: ${filePath}`);
  process.exit(1);
}

const raw = readFileSync(filePath, 'utf-8');
const { data: meta, content } = matter(raw);

const subject = meta.title || `LoreAI ${langArg === 'zh' ? '每日简报' : 'Daily'} — ${dateArg}`;

async function main() {
  const emailHtml = await markdownToEmailHtml(content, {
    title: subject,
    date: dateArg!,
    lang: langArg,
  });

  console.log(`[send-newsletter] Subject: ${subject}`);
  console.log(`[send-newsletter] Lang: ${langArg}`);
  console.log(`[send-newsletter] HTML size: ${(emailHtml.length / 1024).toFixed(1)}KB`);

  if (preview) {
    const previewPath = join(process.cwd(), 'data', 'review', `email-preview-${langArg}.html`);
    writeFileSync(previewPath, emailHtml, 'utf-8');
    console.log(`[send-newsletter] Preview saved: ${previewPath}`);
    process.exit(0);
  }

  if (dryRun) {
    console.log('[send-newsletter] DRY RUN — not sending.');
    process.exit(0);
  }

  if (!process.env.BUTTONDOWN_API_KEY) {
    console.error('[send-newsletter] BUTTONDOWN_API_KEY not set. Skipping send.');
    process.exit(1);
  }

  try {
    const result = await sendEmail({
      subject,
      body: emailHtml,
      status: 'about_to_send',
    });
    console.log(`[send-newsletter] Sent! Email ID: ${result.id}, Status: ${result.status}`);
  } catch (err) {
    console.error('[send-newsletter] Failed to send:', err);
    process.exit(1);
  }
}

main();
