#!/usr/bin/env npx tsx
/**
 * scripts/write-newsletter.ts — Newsletter writing pipeline
 * Runs at 5am SGT (21:00 UTC) daily Mon-Fri
 *
 * 8 Stages:
 *   1. DB Query (72h window)
 *   2. Pre-filter (hard caps by source)
 *   3. Agent Filter (Claude Opus, cross-day dedup, source quotas)
 *   4. EN Newsletter (Claude Opus + validation + retry)
 *   5. ZH Newsletter (3-level fallback cascade)
 *   6. Blog Seed Extraction (3-signal scoring)
 *   7. Topic Cluster Update (no AI)
 *   8. Persist & Publish
 */
import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import {
  getRecentNewsItems,
  upsertContent,
  linkContentSources,
  closeDb,
  type NewsItem,
} from './lib/db';
import { callClaudeWithRetry, callZhNewsletterWithFallback, checkClaudeHealth } from './lib/ai';
import { validateNewsletter, validateZhNewsletter } from './lib/validate';
import { extractBoldTitles, crossDayDedup } from './lib/dedup';
import { dailyTopicUpdate } from './lib/topic-cluster';
import { validateAndExpand } from './lib/brave';
import { gitAddCommitPush } from './lib/git';

// Parse args
const dateArg = process.argv.find((a) => a.startsWith('--date='));
const DATE = dateArg ? dateArg.split('=')[1] : new Date().toISOString().split('T')[0];
const DRY_RUN = process.argv.includes('--dry-run');

console.log(`📰 Newsletter Pipeline — ${DATE}`);
console.log('='.repeat(50));

// ============================================================
// STAGE 1: DB Query
// ============================================================

async function stage1_dbQuery(): Promise<NewsItem[]> {
  console.log('\n📋 Stage 1: DB Query (72h window)');
  const items = getRecentNewsItems(72);
  console.log(`  Found ${items.length} items in last 72 hours`);
  return items;
}

// ============================================================
// STAGE 2: Pre-filter (hard caps before AI)
// ============================================================

function stage2_preFilter(items: NewsItem[]): NewsItem[] {
  console.log('\n🔍 Stage 2: Pre-filter');

  const blogs: NewsItem[] = [];
  const rss: NewsItem[] = [];
  const github: NewsItem[] = [];
  const reddit: NewsItem[] = [];
  const huggingface: NewsItem[] = [];
  const twitter: NewsItem[] = [];
  const others: NewsItem[] = [];

  for (const item of items) {
    if (item.source.startsWith('blog:') || (item.source.startsWith('rss:') && item.source_tier === 1)) {
      blogs.push(item);
    } else if (item.source.startsWith('rss:')) {
      rss.push(item);
    } else if (item.source.startsWith('github:trending')) {
      github.push(item);
    } else if (item.source.startsWith('reddit:')) {
      reddit.push(item);
    } else if (item.source.startsWith('huggingface:')) {
      huggingface.push(item);
    } else if (item.source.startsWith('twitter:')) {
      twitter.push(item);
    } else {
      others.push(item);
    }
  }

  // === TWITTER CLEANUP (RT dedup + AI relevance + engagement sort + per-account cap) ===

  // RT dedup: if "RT @X: text" appears via multiple accounts, keep highest engagement
  const rtSeen = new Map<string, NewsItem>();
  for (const item of twitter) {
    const rtMatch = item.title.match(/^RT @\w+: (.{0,80})/);
    if (rtMatch) {
      const key = rtMatch[1].toLowerCase();
      const existing = rtSeen.get(key);
      if (!existing || item.engagement_likes > existing.engagement_likes) {
        rtSeen.set(key, item);
      }
    } else {
      rtSeen.set(item.title.slice(0, 80).toLowerCase(), item);
    }
  }
  const dedupedTwitter = [...rtSeen.values()];

  // AI relevance filter: skip political/non-AI tweets from thought leaders
  const AI_RELEVANCE = /\b(ai|llm|gpt|claude|gemini|anthropic|openai|model|agent|mcp|transformer|benchmark|training|inference|coding|developer|api|sdk|diffusion|rag|fine.?tun|embedding|neural|deep.?learn|machine.?learn|hugging.?face|token|prompt|reasoning|multimodal|vision|speech|voice|distill|safety|alignment|eval)\b/i;
  const relevantTwitter = dedupedTwitter.filter(item =>
    AI_RELEVANCE.test(item.title) || AI_RELEVANCE.test(item.summary || '')
  );

  // Sort with engagement as secondary tiebreaker
  relevantTwitter.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return (b.engagement_likes + b.engagement_retweets) - (a.engagement_likes + a.engagement_retweets);
  });

  // Per-account cap: max 3 items per account
  const accountCounts: Record<string, number> = {};
  const cappedTwitter: NewsItem[] = [];
  for (const item of relevantTwitter) {
    const account = item.source;
    accountCounts[account] = (accountCounts[account] || 0) + 1;
    if (accountCounts[account] <= 3) cappedTwitter.push(item);
  }

  // === GITHUB CLEANUP (evergreen repo blocklist) ===

  const GITHUB_BLOCKLIST = new Set([
    'https://github.com/tensorflow/tensorflow',
    'https://github.com/pytorch/pytorch',
    'https://github.com/huggingface/transformers',
    'https://github.com/f/prompts.chat',
    'https://github.com/langchain-ai/langchain',
    'https://github.com/microsoft/autogen',
    'https://github.com/ggerganov/llama.cpp',
    'https://github.com/AUTOMATIC1111/stable-diffusion-webui',
    'https://github.com/openai/openai-python',
    'https://github.com/hwchase17/langchain',
  ]);
  // Only block github:trending, not github:release (releases are actual news)
  const filteredGithub = github.filter(item =>
    !item.source.startsWith('github:trending') || !GITHUB_BLOCKLIST.has(item.url)
  );

  // Sort remaining groups by score desc
  blogs.sort((a, b) => b.score - a.score);
  rss.sort((a, b) => b.score - a.score);
  filteredGithub.sort((a, b) => b.score - a.score);
  reddit.sort((a, b) => b.score - a.score);
  huggingface.sort((a, b) => {
    const aMetric = a.engagement_likes + a.engagement_downloads / 1000;
    const bMetric = b.engagement_likes + b.engagement_downloads / 1000;
    return bMetric - aMetric;
  });

  const filtered = [
    ...others,
    ...blogs.slice(0, 15),
    ...rss.slice(0, 8),
    ...filteredGithub.slice(0, 5),
    ...reddit.slice(0, 3),
    ...huggingface.slice(0, 15),
    ...cappedTwitter.slice(0, 30),
  ];

  console.log(`  Blogs (tier 1): ${blogs.length} → ${Math.min(blogs.length, 15)}`);
  console.log(`  RSS (tier 0): ${rss.length} → ${Math.min(rss.length, 8)}`);
  console.log(`  GitHub: ${github.length} → ${filteredGithub.length} (blocklist) → ${Math.min(filteredGithub.length, 5)}`);
  console.log(`  Reddit: ${reddit.length} → ${Math.min(reddit.length, 3)}`);
  console.log(`  HuggingFace: ${huggingface.length} → ${Math.min(huggingface.length, 15)}`);
  console.log(`  Twitter: ${twitter.length} → ${dedupedTwitter.length} (dedup) → ${relevantTwitter.length} (relevant) → ${cappedTwitter.length} (capped) → ${Math.min(cappedTwitter.length, 30)}`);
  console.log(`  Others: ${others.length} (pass-through)`);
  console.log(`  Total pre-filtered: ${filtered.length}`);

  return filtered;
}

// ============================================================
// STAGE 3: Agent Filter (Claude Opus)
// ============================================================

interface FilteredItem {
  id: number;
  title: string;
  url: string;
  source: string;
  category: string;
  score: number;
  why_it_matters: string;
  action: string;
  engagement_likes: number;
  engagement_retweets: number;
  engagement_downloads: number;
}

function loadPreviousBoldTitles(): string[] {
  const dir = path.join(process.cwd(), 'content', 'newsletters', 'en');
  if (!fs.existsSync(dir)) return [];

  const files = fs
    .readdirSync(dir)
    .filter((f) => f.endsWith('.md') && !f.startsWith('.'))
    .sort()
    .reverse()
    .slice(0, 7); // Last 7 newsletters

  const titles: string[] = [];
  for (const file of files) {
    const content = fs.readFileSync(path.join(dir, file), 'utf-8');
    titles.push(...extractBoldTitles(content));
  }

  console.log(`  Loaded ${titles.length} bold titles from ${files.length} previous newsletters`);
  return titles;
}

function ruleBasedFallback(items: NewsItem[]): FilteredItem[] {
  console.log('  Using rule-based fallback filter');

  // Group by source type (not just tier — curated Twitter and blogs share tier 1)
  const buckets: Record<string, NewsItem[]> = {
    blog: [],       // blog:* and tier-1 RSS (official blogs)
    rss: [],        // tier-0 RSS (media/indie)
    twitter: [],    // twitter:@* (curated timelines)
    twitterSearch: [], // twitter:search:*
    github: [],     // github:trending + github:release
    huggingface: [], // huggingface:*
    hackernews: [], // hackernews
    reddit: [],     // reddit:*
  };

  for (const item of items) {
    const src = item.source;
    if (src.startsWith('blog:') || (src.startsWith('rss:') && item.source_tier === 1)) {
      buckets.blog.push(item);
    } else if (src.startsWith('rss:')) {
      buckets.rss.push(item);
    } else if (src.startsWith('twitter:search:')) {
      buckets.twitterSearch.push(item);
    } else if (src.startsWith('twitter:')) {
      buckets.twitter.push(item);
    } else if (src.startsWith('github:')) {
      buckets.github.push(item);
    } else if (src.startsWith('huggingface:')) {
      buckets.huggingface.push(item);
    } else if (src === 'hackernews') {
      buckets.hackernews.push(item);
    } else if (src.startsWith('reddit:')) {
      buckets.reddit.push(item);
    } else {
      buckets.rss.push(item); // fallback
    }
  }

  const quotas: Record<string, number> = {
    blog: 6, rss: 6, twitter: 8, twitterSearch: 3,
    github: 4, huggingface: 2, hackernews: 3, reddit: 2,
  };

  const selected: FilteredItem[] = [];
  for (const [bucket, bucketItems] of Object.entries(buckets)) {
    const quota = quotas[bucket] || 3;
    bucketItems.sort((a, b) => b.score - a.score);
    for (const item of bucketItems.slice(0, quota)) {
      if (bucket === 'twitterSearch' && item.score < 65) continue;
      selected.push({
        id: item.id || 0,
        title: item.title,
        url: item.url || '',
        source: item.source,
        category: guessCategory(item),
        score: item.score,
        why_it_matters: item.summary || item.title,
        action: 'Check it out',
        engagement_likes: item.engagement_likes,
        engagement_retweets: item.engagement_retweets,
        engagement_downloads: item.engagement_downloads,
      });
    }
  }

  return selected.sort((a, b) => b.score - a.score).slice(0, 22);
}

function guessCategory(item: NewsItem): string {
  const text = `${item.title} ${item.summary || ''}`.toLowerCase();
  if (/release|launch|drop|ship|announce|version/i.test(text)) return 'LAUNCH';
  if (/sdk|api|tool|framework|developer|library|cli|plugin/i.test(text)) return 'TOOL';
  if (/technique|tip|practice|prompt|coding|how.?to|guide/i.test(text)) return 'TECHNIQUE';
  if (/paper|benchmark|architecture|eval|research|study/i.test(text)) return 'RESEARCH';
  if (/open.?source|tutorial|build|project|repo/i.test(text)) return 'BUILD';
  return 'INSIGHT';
}

async function stage3_agentFilter(
  items: NewsItem[],
  previousBoldTitles: string[]
): Promise<FilteredItem[]> {
  console.log('\n🤖 Stage 3: Agent Filter');

  // Cross-day dedup
  const deduped = crossDayDedup(items, previousBoldTitles);
  console.log(`  After cross-day dedup: ${deduped.length} (removed ${items.length - deduped.length})`);

  // Prepare compact JSON for Claude
  const inputItems = deduped.map((item) => ({
    id: item.id,
    title: item.title.slice(0, 200),
    url: item.url,
    source: item.source,
    source_tier: item.source_tier,
    score: item.score,
    summary: item.summary?.slice(0, 400) || null,
    detected_at: item.detected_at || null,
    likes: item.engagement_likes,
    retweets: item.engagement_retweets,
    downloads: item.engagement_downloads,
  }));

  const systemPrompt = `You are an expert AI news curator for LoreAI, a daily AI newsletter.

Your task: From the provided news items, select 18-22 of the most important and interesting items for today's newsletter.

## Source Quotas (STRICT)
- Reddit: MAX 2 items
- GitHub Trending: MAX 2. Only genuinely new repos (created in last 30 days) or repos with a specific newsworthy event.
- HuggingFace: 3-5 items (group same-lab models as 1 item, show likes AND downloads separately)
- All others: no hard limit

## Categories
Assign each item ONE category:
- LAUNCH: New model releases, product launches, major version drops
- TOOL: Developer tools, SDKs, APIs, infrastructure, integrations
- TECHNIQUE: Practical tips, best practices, coding techniques, prompting strategies
- RESEARCH: Papers, benchmarks, architecture breakthroughs, evals
- INSIGHT: Industry analysis, opinion pieces, trend signals, business moves
- BUILD: Open-source projects, tutorials, hands-on guides, things you can use today

## Category Balance
Ensure at least 2 items per main category when possible.

Prioritize items that developers can ACT on today over industry news/business deals.

## Hard Filters (MUST apply)
- Skip pure sentiment/celebration posts ("Proud to work at X", "What a day!", personal milestones)
- Skip bare RT links with no descriptive text
- Skip political content from thought leaders (not AI industry-related)
- Skip GitHub repos that are established projects (tensorflow, pytorch, transformers) unless they have a specific new release
- Skip old blog posts — if the content is from 2024 or earlier, do not include it
- Prefer ORIGINAL tweets over RTs. If the same news appears as an original + RT, pick the original

## Priority Signals (rank higher)
- Product launches, model releases, API updates, new features
- High engagement relative to the account's typical numbers
- Breaking news (first report of something new)
- Cross-source confirmation (same story from multiple sources = strong signal)

## Selection Criteria
- Prioritize: breaking news, major releases, high engagement, practical value
- Include: diversity of sources and topics
- Skip: trivial updates, duplicate/similar stories, old news recycled
- Skip: items that are well-known older releases (>30 days old) even if still trending on HuggingFace — use your knowledge of actual release dates (e.g. DeepSeek-R1 released Jan 2025)
- Prefer: items with high engagement metrics relative to their source

## Output Format
Return ONLY a JSON array. No markdown, no explanation. Each item:
{
  "id": number,
  "title": "original title",
  "url": "url",
  "source": "source string",
  "category": "LAUNCH|TOOL|TECHNIQUE|RESEARCH|INSIGHT|BUILD",
  "score": number (your score 1-100),
  "why_it_matters": "1-2 sentence explanation for the newsletter writer",
  "action": "1 short phrase: what the reader should do (e.g., 'Try it now', 'Watch the benchmark', 'Update your SDK')",
  "engagement_likes": number,
  "engagement_retweets": number,
  "engagement_downloads": number
}`;

  const userPrompt = `Select 18-22 items from these ${inputItems.length} news items for today's AI newsletter (${DATE}):\n\n${JSON.stringify(inputItems, null, 0)}`;

  try {
    const response = await callClaudeWithRetry(systemPrompt, userPrompt, {
      maxTokens: 8192,
      temperature: 0.3,
      maxRetries: 2,
      validate: (content) => {
        try {
          // Extract JSON from potential markdown code blocks
          let json = content;
          const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
          if (jsonMatch) json = jsonMatch[1];

          const parsed = JSON.parse(json.trim());
          if (!Array.isArray(parsed)) return { valid: false, errors: ['Not an array'] };
          if (parsed.length < 12) return { valid: false, errors: [`Only ${parsed.length} items (need 12+)`] };
          return { valid: true, errors: [] };
        } catch {
          return { valid: false, errors: ['Invalid JSON'] };
        }
      },
    });

    let json = response.content;
    const jsonMatch = json.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) json = jsonMatch[1];

    const filtered: FilteredItem[] = JSON.parse(json.trim());
    console.log(`  Agent selected ${filtered.length} items (model: ${response.model})`);
    console.log(`  Tokens: ${response.usage?.input_tokens} in / ${response.usage?.output_tokens} out`);

    // Verify quotas
    const redditCount = filtered.filter((i) => i.source.includes('reddit')).length;
    const githubCount = filtered.filter((i) => i.source.includes('github:trending')).length;
    const hfCount = filtered.filter((i) => i.source.includes('huggingface')).length;
    console.log(`  Quotas — Reddit: ${redditCount}/2, GitHub: ${githubCount}/4, HF: ${hfCount}/3-5`);

    return filtered;
  } catch (err) {
    console.error('  ⚠️ Agent filter FAILED — falling back to rule-based filtering');
    console.error('  Error:', err instanceof Error ? err.message : err);
    return ruleBasedFallback(deduped);
  }
}

// ============================================================
// STAGE 4: EN Newsletter
// ============================================================

function formatEngagement(item: FilteredItem): string {
  const parts: string[] = [];

  if (item.engagement_likes > 0 && item.engagement_downloads > 0) {
    // HuggingFace style
    const likesStr = item.engagement_likes.toLocaleString();
    const dlStr =
      item.engagement_downloads >= 1_000_000
        ? `${(item.engagement_downloads / 1_000_000).toFixed(2)}M`
        : item.engagement_downloads >= 1_000
          ? `${(item.engagement_downloads / 1_000).toFixed(1)}K`
          : item.engagement_downloads.toString();
    parts.push(`(${likesStr} likes | ${dlStr} downloads)`);
  } else if (item.engagement_likes > 0 && item.engagement_retweets > 0) {
    // Twitter style
    parts.push(`(${item.engagement_likes.toLocaleString()} likes | ${item.engagement_retweets} RTs)`);
  } else if (item.engagement_likes > 0) {
    parts.push(`(${item.engagement_likes.toLocaleString()} likes)`);
  }

  return parts.join(' ');
}

async function stage4_writeEN(filtered: FilteredItem[]): Promise<string> {
  console.log('\n📝 Stage 4: EN Newsletter');

  const skillPath = path.join(process.cwd(), 'skills', 'newsletter-en', 'SKILL.md');
  const skill = fs.readFileSync(skillPath, 'utf-8');

  // Format items by category for the writer
  const byCategory = new Map<string, FilteredItem[]>();
  for (const item of filtered) {
    const cat = item.category || 'PRODUCT';
    if (!byCategory.has(cat)) byCategory.set(cat, []);
    byCategory.get(cat)!.push(item);
  }

  let itemsText = '';
  for (const [category, catItems] of byCategory) {
    itemsText += `\n## ${category}\n`;
    for (const item of catItems) {
      const engagement = formatEngagement(item);
      itemsText += `- ${item.title} ${engagement}\n  URL: ${item.url}\n  Source: ${item.source}\n  Why: ${item.why_it_matters}\n  Action: ${item.action || ''}\n\n`;
    }
  }

  const systemPrompt = `${skill}\n\n## This Run\n- Date: ${DATE}\n- Items provided: ${filtered.length}\n- Write naturally, following the template as a guide not a straitjacket\n- Each item should be 2-4 sentences. Give enough context that a reader understands the story without clicking. Include specific technical details (benchmark scores, parameter counts, context windows). The \`why_it_matters\` and \`action\` fields from the filtered data are your best material — use them.\n- Include engagement metrics in parentheses where available\n- Each item needs a source link as [Read more →](url)\n- Include a 🎓 MODEL LITERACY section and a 🎯 PICK OF THE DAY section\n- Aim for 15-22 items total — curate ruthlessly\n- If an item has no summary, write only the title + link. Don't fabricate details.\n- Output ONLY the newsletter markdown. No frontmatter, no meta-commentary.`;

  const userPrompt = `Write today's LoreAI AI News newsletter (${DATE}) using these ${filtered.length} curated items:\n\n${itemsText}`;

  const response = await callClaudeWithRetry(systemPrompt, userPrompt, {
    maxTokens: 8192,
    temperature: 0.5,
    maxRetries: 3,
    validate: validateNewsletter,
  });

  console.log(`  EN newsletter generated (model: ${response.model})`);
  console.log(`  Tokens: ${response.usage?.input_tokens} in / ${response.usage?.output_tokens} out`);

  const validation = validateNewsletter(response.content);
  if (!validation.valid) {
    console.warn('  ⚠️ Validation warnings (accepted anyway):', validation.errors);
  }

  return response.content;
}

// ============================================================
// STAGE 5: ZH Newsletter (3-level fallback)
// ============================================================

async function stage5_writeZH(filtered: FilteredItem[]): Promise<string> {
  console.log('\n📝 Stage 5: ZH Newsletter (fallback cascade)');

  const skillPath = path.join(process.cwd(), 'skills', 'newsletter-zh', 'SKILL.md');
  const skill = fs.readFileSync(skillPath, 'utf-8');

  // Format items
  let itemsText = '';
  const byCategory = new Map<string, FilteredItem[]>();
  for (const item of filtered) {
    const cat = item.category || 'PRODUCT';
    if (!byCategory.has(cat)) byCategory.set(cat, []);
    byCategory.get(cat)!.push(item);
  }
  for (const [category, catItems] of byCategory) {
    itemsText += `\n## ${category}\n`;
    for (const item of catItems) {
      const engagement = formatEngagement(item);
      itemsText += `- ${item.title} ${engagement}\n  URL: ${item.url}\n  Source: ${item.source}\n  Why: ${item.why_it_matters}\n  Action: ${item.action || ''}\n\n`;
    }
  }

  const systemPrompt = `${skill}\n\n## 本期规则\n- 日期：${DATE}\n- 提供条目：${filtered.length}\n- 必须按照结构模板完整输出中文 Newsletter\n- 所有有 engagement 数据的条目必须显示 — 这是强制要求\n- 必须包含 🎓 模型小课堂（一个技术概念的通俗解释，3-4 句话）\n- 必须包含 🎯 今日精选（当天最重要新闻的深度分析，3-5 句话，要有观点）\n- 目标 15-22 条，不必用完所有提供的条目 — 精选为王\n- 摘要为空时只写标题+链接，不编造细节\n- 只输出 Newsletter 正文 Markdown，不要 frontmatter，不要元描述`;

  const userPrompt = `基于以下 ${filtered.length} 条精选 AI 新闻，创作今日 LoreAI AI 简报中文版（${DATE}）：\n\n${itemsText}`;

  const response = await callZhNewsletterWithFallback(systemPrompt, userPrompt, validateZhNewsletter);

  console.log(`  ZH newsletter generated (model: ${response.model})`);

  const validation = validateZhNewsletter(response.content);
  if (!validation.valid) {
    console.warn('  ⚠️ Validation warnings:', validation.errors);
  }

  return response.content;
}

// ============================================================
// STAGE 6: Blog Seed Extraction (3-signal scoring)
// ============================================================

interface BlogSeed {
  topic: string;
  url: string;
  source: string;
  x_engagement_24h: number;
  brave_has_results: boolean;
  brave_related_searches: string[];
  brave_discussions: string[];
  mention_count_7d: number;
  composite_score: number;
  suggested_angle: 'news' | 'tutorial' | 'analysis' | 'comparison';
}

async function stage6_blogSeeds(filtered: FilteredItem[]): Promise<BlogSeed[]> {
  console.log('\n🌱 Stage 6: Blog Seed Extraction');

  // Score each filtered item
  const candidates: BlogSeed[] = [];

  for (const item of filtered.slice(0, 15)) {
    // Only check top 15 by score
    const braveSignal = await validateAndExpand(item.title.slice(0, 80));

    // Calculate mention count from the filtered set
    const titleWords = item.title.toLowerCase().split(/\s+/);
    const mentionCount = filtered.filter((other) =>
      titleWords.some(
        (w) => w.length > 4 && other.title.toLowerCase().includes(w) && other.id !== item.id
      )
    ).length;

    const composite =
      ((item.engagement_likes + item.engagement_retweets) / 1000) * 0.3 +
      (braveSignal.has_search_demand ? 30 : 0) * 0.3 +
      mentionCount * 10 * 0.4;

    // Guess angle
    let angle: BlogSeed['suggested_angle'] = 'news';
    if (/how|guide|tutorial|setup/i.test(item.title)) angle = 'tutorial';
    else if (/vs|compared|alternative/i.test(item.title)) angle = 'comparison';
    else if (/analysis|deep|impact|future/i.test(item.title)) angle = 'analysis';

    candidates.push({
      topic: item.title,
      url: item.url,
      source: item.source,
      x_engagement_24h: item.engagement_likes + item.engagement_retweets,
      brave_has_results: braveSignal.has_search_demand,
      brave_related_searches: braveSignal.related_keywords,
      brave_discussions: braveSignal.discussions,
      mention_count_7d: mentionCount,
      composite_score: composite,
      suggested_angle: angle,
    });

    // Rate limit Brave calls
    await new Promise((r) => setTimeout(r, 500));
  }

  // Top 3 by composite score
  candidates.sort((a, b) => b.composite_score - a.composite_score);
  const top5 = candidates.slice(0, 5);

  // Save to data/blog-seeds/
  const seedPath = path.join(process.cwd(), 'data', 'blog-seeds', `${DATE}.json`);
  fs.writeFileSync(seedPath, JSON.stringify(top5, null, 2));
  console.log(`  Top ${top5.length} blog seeds saved to ${seedPath}`);
  for (const seed of top5) {
    console.log(`    ${seed.composite_score.toFixed(1)}: ${seed.topic.slice(0, 80)}`);
  }

  return top5;
}

// ============================================================
// STAGE 7: Topic Cluster Update (delegated to topic-cluster.ts)
// ============================================================

// Converts FilteredItem[] to NewsItem[] for the topic cluster engine
function filteredToNewsItems(filtered: FilteredItem[]): NewsItem[] {
  return filtered.map((f) => ({
    id: f.id,
    title: f.title,
    url: f.url,
    source: f.source,
    source_tier: 0,
    summary: f.why_it_matters,
    score: f.score,
    engagement_likes: f.engagement_likes,
    engagement_retweets: f.engagement_retweets,
    engagement_downloads: f.engagement_downloads,
  }));
}

// ============================================================
// STAGE 8: Persist & Publish
// ============================================================

function buildFrontmatter(
  title: string,
  lang: string,
  description: string,
  itemsCount: number,
  categories: string[],
  topStory: string
): string {
  return `---
title: "${title.replace(/"/g, '\\"')}"
date: ${DATE}
type: newsletter
lang: ${lang}
description: "${description.replace(/"/g, '\\"')}"
items_count: ${itemsCount}
categories: [${categories.join(', ')}]
top_story: "${topStory.replace(/"/g, '\\"')}"
---`;
}

function extractTitle(md: string): string {
  const match = md.match(/^# (.+)/m);
  return match ? match[1] : `AI News ${DATE}`;
}

function extractDescription(md: string): string {
  // Look for "Today:" line
  const todayMatch = md.match(/Today:?\s*(.+)/i);
  if (todayMatch) return todayMatch[1].slice(0, 160);

  // Fall back to first paragraph after H1
  const lines = md.split('\n');
  for (const line of lines) {
    if (line.startsWith('#')) continue;
    if (line.trim().length > 20) return line.trim().slice(0, 160);
  }
  return `LoreAI AI News — ${DATE}`;
}

async function stage8_persist(
  enContent: string,
  zhContent: string,
  filtered: FilteredItem[]
): Promise<void> {
  console.log('\n💾 Stage 8: Persist & Publish');

  const categories = [...new Set(filtered.map((f) => f.category))];
  const topStory =
    filtered.sort((a, b) => b.score - a.score)[0]?.title.slice(0, 80) || 'AI News';

  // Build EN file
  const enTitle = extractTitle(enContent);
  const enDesc = extractDescription(enContent);
  const enFrontmatter = buildFrontmatter(enTitle, 'en', enDesc, filtered.length, categories, topStory);
  const enFull = `${enFrontmatter}\n\n${enContent}`;

  // Build ZH file
  const zhTitle = extractTitle(zhContent);
  const zhDesc = extractDescription(zhContent);
  const zhFrontmatter = buildFrontmatter(zhTitle, 'zh', zhDesc, filtered.length, categories, topStory);
  const zhFull = `${zhFrontmatter}\n\n${zhContent}`;

  // Write files
  const enPath = path.join(process.cwd(), 'content', 'newsletters', 'en', `${DATE}.md`);
  const zhPath = path.join(process.cwd(), 'content', 'newsletters', 'zh', `${DATE}.md`);
  fs.writeFileSync(enPath, enFull);
  fs.writeFileSync(zhPath, zhFull);
  console.log(`  Written: ${enPath}`);
  console.log(`  Written: ${zhPath}`);

  // Save filtered items
  const filteredPath = path.join(process.cwd(), 'data', 'filtered-items', `${DATE}.json`);
  fs.writeFileSync(filteredPath, JSON.stringify(filtered, null, 2));
  console.log(`  Filtered items: ${filteredPath}`);

  // Insert into DB
  const enContentId = upsertContent({
    type: 'newsletter',
    slug: DATE,
    lang: 'en',
    title: enTitle,
    body_markdown: enFull,
    meta_json: JSON.stringify({ categories, items_count: filtered.length }),
  });

  const zhContentId = upsertContent({
    type: 'newsletter',
    slug: DATE,
    lang: 'zh',
    title: zhTitle,
    body_markdown: zhFull,
    meta_json: JSON.stringify({ categories, items_count: filtered.length }),
  });

  // Link content to news items
  const itemIds = filtered.map((f) => f.id).filter((id) => id > 0);
  if (itemIds.length > 0) {
    linkContentSources(enContentId, itemIds);
    linkContentSources(zhContentId, itemIds);
  }

  console.log(`  DB records: EN (id=${enContentId}), ZH (id=${zhContentId})`);

  // Git push
  try {
    const committed = await gitAddCommitPush(
      [
        'content/newsletters/',
        'data/filtered-items/',
        'data/blog-seeds/',
      ],
      `📰 AI News ${DATE}`
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

  // Pre-flight: verify Claude CLI is working
  if (!DRY_RUN) {
    checkClaudeHealth();
  }

  // Stage 1
  const rawItems = await stage1_dbQuery();
  if (rawItems.length === 0) {
    console.error('❌ No items in DB. Run collect-news.ts first.');
    process.exit(1);
  }

  // Stage 2
  const preFiltered = stage2_preFilter(rawItems);

  // Stage 3
  const previousBoldTitles = loadPreviousBoldTitles();
  let filtered: FilteredItem[];

  if (DRY_RUN) {
    console.log('\n🤖 Stage 3: Agent Filter (dry-run — using rule-based)');
    filtered = ruleBasedFallback(
      crossDayDedup(preFiltered, previousBoldTitles) as NewsItem[]
    );
  } else {
    filtered = await stage3_agentFilter(preFiltered, previousBoldTitles);
  }

  if (filtered.length === 0) {
    console.error('❌ No items passed filter. Check data quality.');
    process.exit(1);
  }

  console.log(`\n  📊 Filtered items: ${filtered.length}`);
  const catCounts: Record<string, number> = {};
  for (const f of filtered) {
    catCounts[f.category] = (catCounts[f.category] || 0) + 1;
  }
  console.log('  Categories:', Object.entries(catCounts).map(([k, v]) => `${k}:${v}`).join(', '));
  const srcCounts: Record<string, number> = {};
  for (const f of filtered) {
    const bucket = f.source.split(':')[0];
    srcCounts[bucket] = (srcCounts[bucket] || 0) + 1;
  }
  console.log('  Sources:', Object.entries(srcCounts).map(([k, v]) => `${k}:${v}`).join(', '));

  if (DRY_RUN) {
    console.log('\n📝 Stage 4: EN Newsletter (dry-run — skipped)');
    console.log('📝 Stage 5: ZH Newsletter (dry-run — skipped)');

    // Stage 6
    await stage6_blogSeeds(filtered);

    // Stage 7
    await dailyTopicUpdate(filteredToNewsItems(filtered));

    console.log('\n💾 Stage 8: Persist (dry-run — skipped)');
    closeDb();
    console.log('\n✅ Newsletter dry-run complete');
    return;
  }

  // Stage 4 & 5 (EN and ZH can run in parallel)
  const [enContent, zhContent] = await Promise.all([
    stage4_writeEN(filtered),
    stage5_writeZH(filtered),
  ]);

  // Stage 6
  await stage6_blogSeeds(filtered);

  // Stage 7
  await dailyTopicUpdate(filteredToNewsItems(filtered));

  // Stage 8
  await stage8_persist(enContent, zhContent, filtered);

  closeDb();
  console.log('\n✅ Newsletter pipeline complete');
}

main().catch((err) => {
  console.error('💥 Newsletter pipeline failed:', err);
  closeDb();
  process.exit(1);
});
