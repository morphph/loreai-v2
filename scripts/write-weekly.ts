#!/usr/bin/env npx tsx
/**
 * scripts/write-weekly.ts — Weekly digest pipeline
 * Runs Saturday 5am SGT (21:00 UTC)
 *
 * Stages:
 *   1. Load Mon-Fri newsletters from current week
 *   2. Load filtered-items JSONs from the week
 *   3. Rank stories by: frequency across multiple days + total engagement + agent_score
 *   4. Select top 5 stories
 *   5. Generate 200-400 word analysis per story via Claude Opus
 *   6. Wrap in "5 Things That Mattered in AI This Week" format
 *   7. Generate EN then ZH (ZH uses newsletter fallback cascade)
 *   8. Write to content/newsletters/weekly/{en,zh}/YYYY-WXX.md
 *   9. Git push
 *
 * Flags:
 *   --dry-run    Log what would happen, skip AI calls and git push
 *   --date=YYYY-MM-DD   Override Saturday date (default: today, rolls to this week's Saturday)
 */
import 'dotenv/config';
import fs from 'fs';
import path from 'path';

import { callClaudeWithRetry, callZhNewsletterWithFallback } from './lib/ai';
import { validateNewsletter, validateZhNewsletter } from './lib/validate';
import { upsertContent, closeDb } from './lib/db';
import { gitAddCommitPush } from './lib/git';

// --- Args ---
const DRY_RUN = process.argv.includes('--dry-run');
const dateArg = process.argv.find((a) => a.startsWith('--date='));

// Determine the Saturday date for this week
function getThisSaturday(referenceDate: string): Date {
  const d = new Date(referenceDate + 'T00:00:00Z');
  const day = d.getUTCDay();
  // If it's Saturday (6), use it. Otherwise, find the most recent Saturday
  // or use the upcoming Saturday based on whether we're past Saturday
  if (day === 6) return d;
  // Roll back to last Saturday for days 0 (Sun) through 5 (Fri)
  const diff = day === 0 ? 1 : day + 1; // Sun=1 back, Mon=2, ..., Fri=6
  // Actually: we want THIS week's Saturday (the one we're generating for)
  // If we're on Sat, use today. Otherwise find the Saturday of the same week.
  const saturday = new Date(d);
  saturday.setUTCDate(d.getUTCDate() + (6 - day));
  return saturday;
}

const referenceDate = dateArg
  ? dateArg.split('=')[1]
  : new Date().toISOString().split('T')[0];
const saturday = getThisSaturday(referenceDate);
const WEEK_END = saturday.toISOString().split('T')[0];

// ISO week number
function getISOWeek(date: Date): number {
  const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}

const WEEK_NUM = getISOWeek(saturday);
const YEAR = saturday.getUTCFullYear();
const WEEK_SLUG = `${YEAR}-W${String(WEEK_NUM).padStart(2, '0')}`;

// Get Mon-Fri dates for this week
function getWeekdays(saturdayDate: Date): string[] {
  const dates: string[] = [];
  for (let i = 5; i >= 1; i--) {
    const d = new Date(saturdayDate);
    d.setUTCDate(saturdayDate.getUTCDate() - i);
    dates.push(d.toISOString().split('T')[0]);
  }
  return dates;
}

const WEEKDAYS = getWeekdays(saturday);

console.log(`📊 Weekly Digest Pipeline — ${WEEK_SLUG}`);
console.log(`  Saturday: ${WEEK_END}`);
console.log(`  Weekdays: ${WEEKDAYS.join(', ')}`);
console.log('='.repeat(50));

// --- Types ---

interface FilteredItem {
  id: number;
  title: string;
  url: string;
  source: string;
  category: string;
  score: number;
  why_it_matters: string;
  engagement_likes: number;
  engagement_retweets: number;
  engagement_downloads: number;
}

interface WeeklyStory {
  topic: string;
  frequency: number; // how many days it appeared
  total_engagement: number;
  max_score: number;
  composite_score: number;
  items: FilteredItem[];
  best_item: FilteredItem;
  category: string;
}

// ============================================================
// STAGE 1: Load Mon-Fri Newsletters
// ============================================================

function stage1_loadNewsletters(): { dates: string[]; found: number } {
  console.log('\n📋 Stage 1: Load Mon-Fri Newsletters');

  const contentDir = path.join(process.cwd(), 'content', 'newsletters', 'en');
  let found = 0;
  const foundDates: string[] = [];

  for (const date of WEEKDAYS) {
    const filePath = path.join(contentDir, `${date}.md`);
    if (fs.existsSync(filePath)) {
      found++;
      foundDates.push(date);
      console.log(`  ✓ ${date}`);
    } else {
      console.log(`  ✗ ${date} (not found)`);
    }
  }

  console.log(`  Found ${found}/${WEEKDAYS.length} newsletters`);
  return { dates: foundDates, found };
}

// ============================================================
// STAGE 2: Load Filtered Items JSONs
// ============================================================

function stage2_loadFilteredItems(dates: string[]): FilteredItem[] {
  console.log('\n📂 Stage 2: Load Filtered Items');

  const dataDir = path.join(process.cwd(), 'data', 'filtered-items');
  const allItems: FilteredItem[] = [];

  for (const date of dates) {
    const filePath = path.join(dataDir, `${date}.json`);
    if (fs.existsSync(filePath)) {
      try {
        const items = JSON.parse(fs.readFileSync(filePath, 'utf-8')) as FilteredItem[];
        allItems.push(...items);
        console.log(`  ✓ ${date}: ${items.length} items`);
      } catch (err) {
        console.warn(`  ✗ ${date}: parse error`, err);
      }
    } else {
      console.log(`  ✗ ${date}: no filtered-items JSON`);
    }
  }

  console.log(`  Total: ${allItems.length} filtered items across ${dates.length} days`);
  return allItems;
}

// ============================================================
// STAGE 3: Rank Stories
// ============================================================

function stage3_rankStories(items: FilteredItem[]): WeeklyStory[] {
  console.log('\n📊 Stage 3: Rank Stories');

  // If no filtered-items JSONs exist, fall back to extracting stories from newsletters
  if (items.length === 0) {
    console.log('  No filtered-items JSONs found — extracting from newsletter content');
    return extractStoriesFromNewsletters();
  }

  // Group items by topic similarity (simple: group by key words in title)
  const topicMap = new Map<string, FilteredItem[]>();

  for (const item of items) {
    // Normalize title to find a key topic
    const key = extractTopicKey(item.title);
    if (!topicMap.has(key)) topicMap.set(key, []);
    topicMap.get(key)!.push(item);
  }

  // Score each topic group
  const stories: WeeklyStory[] = [];

  for (const [topic, topicItems] of topicMap) {
    // Count unique days this topic appeared
    const uniqueDays = new Set<string>();
    for (const item of topicItems) {
      // We don't have the date directly on FilteredItem, but we can use detection order
      uniqueDays.add(String(item.id)); // Approximate: different IDs = different occurrences
    }

    const totalEngagement = topicItems.reduce(
      (sum, item) => sum + item.engagement_likes + item.engagement_retweets + item.engagement_downloads,
      0
    );

    const maxScore = Math.max(...topicItems.map((i) => i.score));

    // Composite: frequency * 0.3 + engagement * 0.3 + score * 0.4
    const frequency = topicItems.length;
    const composite =
      frequency * 10 * 0.3 +
      (totalEngagement / 1000) * 0.3 +
      maxScore * 0.4;

    const bestItem = topicItems.sort((a, b) => b.score - a.score)[0];

    stories.push({
      topic,
      frequency,
      total_engagement: totalEngagement,
      max_score: maxScore,
      composite_score: composite,
      items: topicItems,
      best_item: bestItem,
      category: bestItem.category,
    });
  }

  stories.sort((a, b) => b.composite_score - a.composite_score);

  console.log(`  Found ${stories.length} distinct topics`);
  for (const s of stories.slice(0, 10)) {
    console.log(`    ${s.composite_score.toFixed(1)}: ${s.topic.slice(0, 60)} (freq=${s.frequency}, eng=${s.total_engagement})`);
  }

  return stories;
}

// Extract a normalized topic key from a title
function extractTopicKey(title: string): string {
  // Extract key entity/product name
  const patterns = [
    /\b(Claude\s*(?:Code|Opus|Sonnet|Haiku)?(?:\s*\d[\d.]*)?)/i,
    /\b(GPT[-\s]*\d[\w.-]*)/i,
    /\b(Gemini[\s]*[\d.]*\s*(?:Pro|Ultra|Flash|Nano)?)/i,
    /\b(Llama[\s]*[\d.]*)/i,
    /\b(DeepSeek[\s]*[\w.-]*)/i,
    /\b(Qwen[\s]*[\d.]*)/i,
    /\b(Mistral[\s]*[\w.-]*)/i,
    /\b(OpenAI|Anthropic|Google|Meta|Microsoft|Apple|Nvidia)/i,
  ];

  for (const pattern of patterns) {
    const match = title.match(pattern);
    if (match) return match[1].trim().toLowerCase().replace(/\s+/g, '-');
  }

  // Fallback: first 4 significant words
  const words = title
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .split(/\s+/)
    .filter((w) => w.length > 3 && !['this', 'that', 'with', 'from', 'your', 'just', 'more', 'than', 'will', 'have', 'been', 'what', 'when', 'here'].includes(w));

  return words.slice(0, 4).join('-') || title.slice(0, 30).toLowerCase().replace(/[^a-z0-9]+/g, '-');
}

// Fallback: extract bold titles from newsletter markdown
function extractStoriesFromNewsletters(): WeeklyStory[] {
  const contentDir = path.join(process.cwd(), 'content', 'newsletters', 'en');
  const stories: WeeklyStory[] = [];
  const seen = new Set<string>();

  for (const date of WEEKDAYS) {
    const filePath = path.join(contentDir, `${date}.md`);
    if (!fs.existsSync(filePath)) continue;

    const content = fs.readFileSync(filePath, 'utf-8');

    // Extract bold items (these are the news headlines)
    const boldMatches = content.match(/\*\*([^*]+)\*\*/g) || [];

    for (const match of boldMatches) {
      const title = match.replace(/\*\*/g, '').trim();
      if (title.length < 15 || title.length > 200) continue;
      // Skip date-like bold text (e.g., "February 28, 2026")
      if (/^(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d/i.test(title)) continue;
      if (seen.has(title.toLowerCase())) continue;
      seen.add(title.toLowerCase());

      const key = extractTopicKey(title);

      // Find URL near this bold text
      const boldIndex = content.indexOf(match);
      const nearby = content.slice(boldIndex, boldIndex + 500);
      const urlMatch = nearby.match(/\[.*?\]\((https?:\/\/[^)]+)\)/);

      stories.push({
        topic: key,
        frequency: 1,
        total_engagement: 0,
        max_score: 70,
        composite_score: 70 * 0.4,
        items: [],
        best_item: {
          id: 0,
          title,
          url: urlMatch ? urlMatch[1] : '',
          source: 'newsletter',
          category: 'PRODUCT',
          score: 70,
          why_it_matters: '',
          engagement_likes: 0,
          engagement_retweets: 0,
          engagement_downloads: 0,
        },
        category: 'PRODUCT',
      });
    }
  }

  // Deduplicate by topic key
  const topicMap = new Map<string, WeeklyStory>();
  for (const story of stories) {
    const existing = topicMap.get(story.topic);
    if (existing) {
      existing.frequency++;
      existing.composite_score += 10 * 0.3;
    } else {
      topicMap.set(story.topic, story);
    }
  }

  const ranked = [...topicMap.values()].sort((a, b) => b.composite_score - a.composite_score);
  console.log(`  Extracted ${ranked.length} topics from newsletter bold items`);
  return ranked;
}

// ============================================================
// STAGE 4: Select Top 5
// ============================================================

function stage4_selectTop5(stories: WeeklyStory[]): WeeklyStory[] {
  console.log('\n🏆 Stage 4: Select Top 5');

  // Ensure category diversity: no more than 2 from same category
  const selected: WeeklyStory[] = [];
  const categoryCounts: Record<string, number> = {};

  for (const story of stories) {
    if (selected.length >= 5) break;
    const cat = story.category;
    if ((categoryCounts[cat] || 0) >= 2) continue;
    selected.push(story);
    categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
  }

  // If we don't have 5 yet, fill from remaining
  if (selected.length < 5) {
    for (const story of stories) {
      if (selected.length >= 5) break;
      if (!selected.includes(story)) {
        selected.push(story);
      }
    }
  }

  console.log('  Selected stories:');
  for (const s of selected) {
    console.log(`    [${s.category}] ${s.best_item.title.slice(0, 70)} (score: ${s.composite_score.toFixed(1)})`);
  }

  return selected;
}

// ============================================================
// STAGE 5: Generate EN Weekly
// ============================================================

async function stage5_generateEN(top5: WeeklyStory[]): Promise<string> {
  console.log('\n📝 Stage 5: Generate EN Weekly');

  const skillPath = path.join(process.cwd(), 'skills', 'newsletter-en', 'SKILL.md');
  const skill = fs.existsSync(skillPath) ? fs.readFileSync(skillPath, 'utf-8') : '';

  // Format the top 5 stories for the AI
  let storiesText = '';
  for (let i = 0; i < top5.length; i++) {
    const s = top5[i];
    storiesText += `\n### Story ${i + 1}: ${s.best_item.title}\n`;
    storiesText += `Category: ${s.category}\n`;
    storiesText += `URL: ${s.best_item.url}\n`;
    storiesText += `Source: ${s.best_item.source}\n`;
    if (s.best_item.why_it_matters) {
      storiesText += `Context: ${s.best_item.why_it_matters}\n`;
    }
    storiesText += `Engagement: likes=${s.total_engagement}, frequency=${s.frequency}\n`;
    // Include related items for context
    if (s.items.length > 1) {
      storiesText += `Related coverage (${s.items.length} items):\n`;
      for (const item of s.items.slice(0, 5)) {
        storiesText += `  - ${item.title} (${item.source})\n`;
      }
    }
    storiesText += '\n';
  }

  const systemPrompt = `${skill}

## Weekly Digest Format

You are writing the **weekly digest**, NOT a daily newsletter. This is a Saturday retrospective.

Format: "5 Things That Mattered in AI This Week"

Structure:
\`\`\`
# 5 Things That Mattered in AI This Week

**Week of ${WEEKDAYS[0]} to ${WEEKDAYS[WEEKDAYS.length - 1]}**

{1-2 sentence intro: What defined AI this week?}

---

## 1. {Story Title}

{200-400 words: What happened → Why it matters → What's next}

[Read more →](url)

---

## 2. {Story Title}
...

## 3. {Story Title}
...

## 4. {Story Title}
...

## 5. {Story Title}
...

---

## Quick Takes

{3-5 bullet points of other notable stories that didn't make top 5}

---

*That's the week in AI. [Subscribe to AI News](/subscribe) to get daily briefings.*
\`\`\`

Rules:
- Each story analysis: 200-400 words covering what happened, why it matters, what's next
- Be opinionated — what's the real significance?
- Include specific numbers: benchmark scores, pricing, download counts
- Link to source for each story
- End with Quick Takes section for overflow stories
- Output ONLY the newsletter markdown. No frontmatter, no meta-commentary.`;

  const userPrompt = `Write the weekly AI digest for ${WEEK_SLUG} (week of ${WEEKDAYS[0]} to ${WEEKDAYS[WEEKDAYS.length - 1]}) using these top 5 stories:\n\n${storiesText}`;

  const response = await callClaudeWithRetry(systemPrompt, userPrompt, {
    maxTokens: 8192,
    temperature: 0.5,
    maxRetries: 3,
    validate: validateNewsletter,
  });

  console.log(`  EN weekly generated (model: ${response.model})`);
  console.log(`  Tokens: ${response.usage?.input_tokens} in / ${response.usage?.output_tokens} out`);

  return response.content;
}

// ============================================================
// STAGE 6: Generate ZH Weekly (fallback cascade)
// ============================================================

async function stage6_generateZH(top5: WeeklyStory[]): Promise<string> {
  console.log('\n📝 Stage 6: ZH Weekly (fallback cascade)');

  const skillPath = path.join(process.cwd(), 'skills', 'newsletter-zh', 'SKILL.md');
  const skill = fs.existsSync(skillPath) ? fs.readFileSync(skillPath, 'utf-8') : '';

  // Format stories
  let storiesText = '';
  for (let i = 0; i < top5.length; i++) {
    const s = top5[i];
    storiesText += `\n### 故事 ${i + 1}：${s.best_item.title}\n`;
    storiesText += `分类：${s.category}\n`;
    storiesText += `链接：${s.best_item.url}\n`;
    storiesText += `来源：${s.best_item.source}\n`;
    if (s.best_item.why_it_matters) {
      storiesText += `背景：${s.best_item.why_it_matters}\n`;
    }
    storiesText += `互动：${s.total_engagement}, 出现频率：${s.frequency}\n\n`;
  }

  const systemPrompt = `${skill}

## 周刊格式

你正在写**周刊**，不是日报。这是周六的回顾总结。

格式："本周 AI 五大要事"

结构：
\`\`\`
# 本周 AI 五大要事

**${WEEKDAYS[0]} 至 ${WEEKDAYS[WEEKDAYS.length - 1]}**

{1-2句话概括本周AI领域大势}

---

## 1. {故事标题}

{200-400字分析：发生了什么 → 为什么重要 → 接下来会怎样}

[详情 →](url)

---

...重复5个故事...

---

## 速览

{3-5个其他值得关注的动态}

---

*本周AI要闻就到这里。[订阅 AI News](/subscribe) 获取每日速递。*
\`\`\`

规则：
- 这不是英文版的翻译。基于同一批新闻源，独立创作中文版本
- 每个故事分析 200-400 字
- 有态度 — 真正的重要性是什么？
- 包含具体数字
- 只输出 Newsletter 正文 Markdown，不要 frontmatter`;

  const userPrompt = `基于以下5个本周热门AI故事，创作 ${WEEK_SLUG} 周刊中文版：\n\n${storiesText}`;

  const response = await callZhNewsletterWithFallback(systemPrompt, userPrompt, validateZhNewsletter);

  console.log(`  ZH weekly generated (model: ${response.model})`);

  return response.content;
}

// ============================================================
// STAGE 7: Persist & Publish
// ============================================================

function extractTitle(md: string): string {
  const match = md.match(/^# (.+)/m);
  return match ? match[1] : `5 Things That Mattered in AI — ${WEEK_SLUG}`;
}

function extractDescription(md: string): string {
  const lines = md.split('\n');
  for (const line of lines) {
    if (line.startsWith('#')) continue;
    if (line.startsWith('**') && line.includes('Week')) continue;
    if (line.trim().length > 20) return line.trim().slice(0, 160);
  }
  return `Weekly AI digest — ${WEEK_SLUG}`;
}

function buildFrontmatter(
  title: string,
  lang: string,
  description: string,
  topStory: string
): string {
  return `---
title: "${title.replace(/"/g, '\\"')}"
date: ${WEEK_END}
slug: ${WEEK_SLUG}
type: weekly
lang: ${lang}
description: "${description.replace(/"/g, '\\"')}"
top_story: "${topStory.replace(/"/g, '\\"')}"
---`;
}

async function stage7_persist(enContent: string, zhContent: string, top5: WeeklyStory[]): Promise<void> {
  console.log('\n💾 Stage 7: Persist & Publish');

  const topStory = top5[0]?.best_item.title.slice(0, 80) || 'AI Weekly';

  // EN
  const enTitle = extractTitle(enContent);
  const enDesc = extractDescription(enContent);
  const enFrontmatter = buildFrontmatter(enTitle, 'en', enDesc, topStory);
  const enFull = `${enFrontmatter}\n\n${enContent}`;

  const enDir = path.join(process.cwd(), 'content', 'newsletters', 'weekly', 'en');
  fs.mkdirSync(enDir, { recursive: true });
  const enPath = path.join(enDir, `${WEEK_SLUG}.md`);
  fs.writeFileSync(enPath, enFull);
  console.log(`  Written: ${enPath}`);

  // ZH
  const zhTitle = extractTitle(zhContent);
  const zhDesc = extractDescription(zhContent);
  const zhFrontmatter = buildFrontmatter(zhTitle, 'zh', zhDesc, topStory);
  const zhFull = `${zhFrontmatter}\n\n${zhContent}`;

  const zhDir = path.join(process.cwd(), 'content', 'newsletters', 'weekly', 'zh');
  fs.mkdirSync(zhDir, { recursive: true });
  const zhPath = path.join(zhDir, `${WEEK_SLUG}.md`);
  fs.writeFileSync(zhPath, zhFull);
  console.log(`  Written: ${zhPath}`);

  // DB
  upsertContent({
    type: 'weekly',
    slug: WEEK_SLUG,
    lang: 'en',
    title: enTitle,
    body_markdown: enFull,
    meta_json: JSON.stringify({ top_story: topStory, stories: top5.length }),
  });

  upsertContent({
    type: 'weekly',
    slug: WEEK_SLUG,
    lang: 'zh',
    title: zhTitle,
    body_markdown: zhFull,
    meta_json: JSON.stringify({ top_story: topStory, stories: top5.length }),
  });

  console.log('  DB records upserted');

  // Git push
  try {
    const committed = await gitAddCommitPush(
      ['content/newsletters/weekly/'],
      `📊 Weekly ${WEEK_SLUG}`
    );
    console.log(committed ? '  Git: committed and pushed' : '  Git: nothing to commit');
  } catch (err) {
    console.warn('  Git push failed (non-fatal):', (err as Error).message);
  }
}

// ============================================================
// MAIN
// ============================================================

async function main() {
  if (DRY_RUN) console.log('🧪 DRY RUN — skipping AI calls and git push\n');

  // Stage 1
  const { dates, found } = stage1_loadNewsletters();
  if (found === 0) {
    console.error('❌ No newsletters found for this week. Run daily pipeline first.');
    process.exit(1);
  }

  // Stage 2
  const allItems = stage2_loadFilteredItems(dates);

  // Stage 3
  const rankedStories = stage3_rankStories(allItems);
  if (rankedStories.length === 0) {
    console.error('❌ No stories found. Check data quality.');
    process.exit(1);
  }

  // Stage 4
  const top5 = stage4_selectTop5(rankedStories);

  if (DRY_RUN) {
    console.log('\n📝 Stage 5: EN Weekly (dry-run — skipped)');
    console.log('📝 Stage 6: ZH Weekly (dry-run — skipped)');
    console.log('💾 Stage 7: Persist (dry-run — skipped)');
    closeDb();
    console.log('\n✅ Weekly digest dry-run complete');
    return;
  }

  // Stage 5 & 6 (EN first, then ZH)
  const enContent = await stage5_generateEN(top5);
  const zhContent = await stage6_generateZH(top5);

  // Stage 7
  await stage7_persist(enContent, zhContent, top5);

  closeDb();
  console.log('\n✅ Weekly digest pipeline complete');
}

main().catch((err) => {
  console.error('💥 Weekly digest pipeline failed:', err);
  closeDb();
  process.exit(1);
});
