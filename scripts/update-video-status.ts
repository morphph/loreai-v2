#!/usr/bin/env npx tsx
/**
 * scripts/update-video-status.ts — Update video_status and video_url in blog frontmatter
 *
 * Usage:
 *   npx tsx scripts/update-video-status.ts --slug=X --status=published [--video-url=URL]
 */
import fs from 'fs';
import path from 'path';
import { gitAddCommitPush } from './lib/git';

const args = process.argv.slice(2);
function getArg(name: string): string | undefined {
  const flag = args.find((a) => a.startsWith(`--${name}=`));
  return flag ? flag.split('=')[1] : undefined;
}

const SLUG = getArg('slug');
const STATUS = getArg('status');
const VIDEO_URL = getArg('video-url');

if (!SLUG || !STATUS) {
  console.error('Usage: npx tsx scripts/update-video-status.ts --slug=X --status=published [--video-url=URL]');
  process.exit(1);
}

const VALID_STATUSES = ['none', 'scripted', 'recorded', 'published'];
if (!VALID_STATUSES.includes(STATUS)) {
  console.error(`Invalid status: ${STATUS}. Must be one of: ${VALID_STATUSES.join(', ')}`);
  process.exit(1);
}

console.log(`\n📹 Update Video Status — ${SLUG}`);
console.log(`  Status: ${STATUS}`);
if (VIDEO_URL) console.log(`  Video URL: ${VIDEO_URL}`);
console.log('='.repeat(50));

function updateFrontmatter(filePath: string): boolean {
  if (!fs.existsSync(filePath)) return false;

  let content = fs.readFileSync(filePath, 'utf-8');

  // Update video_status
  if (content.match(/^video_status:\s*.+$/m)) {
    content = content.replace(/^(video_status:\s*).+$/m, `$1${STATUS}`);
  } else {
    // Add video_status before closing ---
    content = content.replace(/^(---\s*)$/m, `video_status: ${STATUS}\n$1`);
  }

  // Update video_url
  if (VIDEO_URL) {
    if (content.match(/^video_url:\s*.+$/m)) {
      content = content.replace(/^(video_url:\s*).+$/m, `$1"${VIDEO_URL}"`);
    } else {
      // Add video_url after video_status
      content = content.replace(
        /^(video_status:\s*.+)$/m,
        `$1\nvideo_url: "${VIDEO_URL}"`
      );
    }
  }

  fs.writeFileSync(filePath, content);
  return true;
}

async function main() {
  const updatedFiles: string[] = [];

  for (const lang of ['en', 'zh']) {
    const filePath = path.join(process.cwd(), 'content', 'blog', lang, `${SLUG}.md`);
    if (updateFrontmatter(filePath)) {
      updatedFiles.push(filePath);
      console.log(`  ✓ Updated ${lang}: ${filePath}`);
    } else {
      console.log(`  ○ Not found: ${filePath}`);
    }
  }

  if (updatedFiles.length === 0) {
    console.error(`\n❌ No blog files found for slug: ${SLUG}`);
    process.exit(1);
  }

  await gitAddCommitPush(updatedFiles, `Update video status: ${SLUG} → ${STATUS}`);
  console.log(`\n✅ Video status updated for ${SLUG}`);
}

main().catch((err) => {
  console.error('💥 Failed:', err);
  process.exit(1);
});
