#!/usr/bin/env npx tsx
/**
 * scripts/pick-video-candidates.ts — Pick blog posts suitable for video production
 *
 * Scans content/blog/en/*.md for posts with video_ready: true AND video_status: none.
 * Scores by recency, category diversity vs recent videos, and word count.
 * Outputs ranked JSON to data/video-queue/candidates.json.
 *
 * Usage:
 *   npx tsx scripts/pick-video-candidates.ts [--top=5]
 */
import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';

const args = process.argv.slice(2);
function getArg(name: string): string | undefined {
  const flag = args.find((a) => a.startsWith(`--${name}=`));
  return flag ? flag.split('=')[1] : undefined;
}

const TOP_N = Number(getArg('top') || '5');
const BLOG_DIR = path.join(process.cwd(), 'content', 'blog', 'en');

console.log(`\n🎯 Video Candidate Picker — top ${TOP_N}`);
console.log('='.repeat(50));

interface Candidate {
  slug: string;
  title: string;
  date: string;
  category: string;
  video_hook: string;
  word_count: number;
  score: number;
  flow_source: string;
  score_breakdown: {
    recency: number;
    word_count: number;
    diversity: number;
  };
}

// Scan for eligible posts
function scanPosts(): Candidate[] {
  if (!fs.existsSync(BLOG_DIR)) {
    console.log('  No blog directory found');
    return [];
  }

  const files = fs.readdirSync(BLOG_DIR).filter((f) => f.endsWith('.md'));
  const candidates: Candidate[] = [];
  const now = Date.now();
  const DAY_MS = 86400000;

  // Get categories of recent video posts (video_status != 'none')
  const recentVideoCategories: string[] = [];

  for (const file of files) {
    const raw = fs.readFileSync(path.join(BLOG_DIR, file), 'utf-8');
    const { data, content } = matter(raw);

    // Track recent video categories
    if (data.video_status && data.video_status !== 'none') {
      recentVideoCategories.push(data.category || 'DEV');
    }

    // Only consider video_ready: true AND video_status: none
    if (!data.video_ready || (data.video_status && data.video_status !== 'none')) {
      continue;
    }

    const dateStr = data.date instanceof Date
      ? data.date.toISOString().split('T')[0]
      : String(data.date || '').slice(0, 10);

    const postDate = new Date(dateStr + 'T00:00:00Z').getTime();
    const ageDays = (now - postDate) / DAY_MS;

    // Skip posts older than 14 days
    if (ageDays > 14) continue;

    // Word count
    const wordCount = content.split(/\s+/).filter((w) => w.length > 0).length;

    // Recency score: linear decay over 14 days (1.0 → 0.0)
    const recencyScore = Math.max(0, 1 - ageDays / 14) * 40;

    // Word count score: 800-2000 is ideal range
    let wordCountScore = 0;
    if (wordCount >= 800 && wordCount <= 2000) {
      wordCountScore = 30;
    } else if (wordCount >= 500 && wordCount < 800) {
      wordCountScore = 15;
    } else if (wordCount > 2000) {
      wordCountScore = 20;
    }

    candidates.push({
      slug: data.slug || file.replace('.md', ''),
      title: data.title || file.replace('.md', ''),
      date: dateStr,
      category: data.category || 'DEV',
      video_hook: data.video_hook || '',
      word_count: wordCount,
      score: 0,
      flow_source: 'loreai-picker',
      score_breakdown: {
        recency: recencyScore,
        word_count: wordCountScore,
        diversity: 0,
      },
    });
  }

  // Apply diversity scoring
  const categoryCounts: Record<string, number> = {};
  for (const cat of recentVideoCategories) {
    categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
  }

  for (const c of candidates) {
    // Higher score if category is underrepresented in recent videos
    const catCount = categoryCounts[c.category] || 0;
    c.score_breakdown.diversity = catCount === 0 ? 30 : Math.max(0, 30 - catCount * 10);
    c.score = c.score_breakdown.recency + c.score_breakdown.word_count + c.score_breakdown.diversity;
  }

  return candidates.sort((a, b) => b.score - a.score);
}

function main() {
  const candidates = scanPosts();
  const top = candidates.slice(0, TOP_N);

  console.log(`\n  Found ${candidates.length} eligible posts, showing top ${TOP_N}:\n`);
  for (const c of top) {
    console.log(`  ${c.score.toFixed(1)} | ${c.date} | [${c.category}] ${c.title.slice(0, 60)}`);
    console.log(`       recency=${c.score_breakdown.recency.toFixed(1)} words=${c.score_breakdown.word_count} diversity=${c.score_breakdown.diversity}`);
  }

  // Write output
  const outDir = path.join(process.cwd(), 'data', 'video-queue');
  fs.mkdirSync(outDir, { recursive: true });
  const outPath = path.join(outDir, 'candidates.json');
  fs.writeFileSync(outPath, JSON.stringify(top, null, 2));
  console.log(`\n  Written: ${outPath}`);
  console.log(`\n✅ Video candidate picker complete`);
}

main();
