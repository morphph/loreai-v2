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
  markItemsAsSelected,
  closeDb,
  type NewsItem,
} from './lib/db';
import { callClaudeWithRetry, callZhNewsletterWithFallback, checkClaudeHealth } from './lib/ai';
import { sanitizeOutput } from './lib/sanitize.js';
import { validateNewsletter, validateZhNewsletter, validateNewsletterQuality } from './lib/validate';
import { extractBoldTitles } from './lib/dedup';
import { validateAndExpand } from './lib/brave';
import { markdownToEmailHtml } from './lib/email-html';
// Parse args
const dateArg = process.argv.find((a) => a.startsWith('--date='));
import { todaySGT } from './lib/date.js';
const DATE = dateArg ? dateArg.split('=')[1] : todaySGT();
const DRY_RUN = process.argv.includes('--dry-run');
const DIFF_MODE = process.argv.includes('--diff');

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
  const AI_RELEVANCE = /\b(ai|llm|gpt|claude|gemini|anthropic|openai|model|agent|mcp|transformer|benchmark|training|inference|coding|developer|api|sdk|diffusion|rag|fine.?tun|embedding|neural|deep.?learn|machine.?learn|hugging.?face|token|prompt|reasoning|multimodal|vision|speech|voice|distill|safety|alignment|eval|engineering|blog|changelog|release.?note|update|feature)\b/i;
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
  // Filter HF items: min 100 likes (defense-in-depth against low-engagement noise)
  const filteredHuggingface = huggingface.filter(item => item.engagement_likes >= 100);
  filteredHuggingface.sort((a, b) => {
    const aMetric = a.engagement_likes + a.engagement_downloads / 1000;
    const bMetric = b.engagement_likes + b.engagement_downloads / 1000;
    return bMetric - aMetric;
  });

  // === PRIORITY SOURCE EXTRACTION ===
  // Must-include sources from major AI labs — bypass hard caps
  const PRIORITY_BLOGS = /anthropic\.com\/(engineering|news)|openai\.com|blog\.google|deepmind\.google/i;
  const PRIORITY_TWITTER = /twitter:@(AnthropicAI|claudeai|bcherny|trq212|OpenAI|OpenAIDevs|GoogleAI|GoogleDeepMind|AIatMeta|MistralAI|huggingface|ChatGPTapp)$/i;

  const isPriority = (item: NewsItem): boolean =>
    PRIORITY_BLOGS.test(item.url || '') || PRIORITY_TWITTER.test(item.source);

  // Extract priority items from all pools before applying caps
  const priorityItems: NewsItem[] = [];
  const markPriority = (pool: NewsItem[]): NewsItem[] => {
    const normal: NewsItem[] = [];
    for (const item of pool) {
      if (isPriority(item)) {
        (item as NewsItem & { priority?: boolean }).priority = true;
        priorityItems.push(item);
      } else {
        normal.push(item);
      }
    }
    return normal;
  };

  const normalBlogs = markPriority(blogs);
  const normalRss = markPriority(rss);
  const normalTwitter = markPriority(cappedTwitter);

  const filtered = [
    ...priorityItems,  // Priority items always included
    ...others,
    ...normalBlogs.slice(0, 15),
    ...normalRss.slice(0, 8),
    ...filteredGithub.slice(0, 5),
    ...reddit.slice(0, 3),
    ...filteredHuggingface.slice(0, 15),
    ...normalTwitter.slice(0, 30),
  ];

  // Deduplicate (priority items may overlap with normal pools)
  const seenIds = new Set<number>();
  const deduped = filtered.filter(item => {
    if (seenIds.has(item.id)) return false;
    seenIds.add(item.id);
    return true;
  });

  console.log(`  Priority items (bypass caps): ${priorityItems.length}`);
  console.log(`  Blogs (tier 1): ${blogs.length} → ${Math.min(normalBlogs.length, 15)}`);
  console.log(`  RSS (tier 0): ${rss.length} → ${Math.min(normalRss.length, 8)}`);
  console.log(`  GitHub: ${github.length} → ${filteredGithub.length} (blocklist) → ${Math.min(filteredGithub.length, 5)}`);
  console.log(`  Reddit: ${reddit.length} → ${Math.min(reddit.length, 3)}`);
  console.log(`  HuggingFace: ${huggingface.length} → ${filteredHuggingface.length} (≥100 likes) → ${Math.min(filteredHuggingface.length, 15)}`);
  console.log(`  Twitter: ${twitter.length} → ${dedupedTwitter.length} (dedup) → ${relevantTwitter.length} (relevant) → ${cappedTwitter.length} (capped) → ${Math.min(normalTwitter.length, 30)}`);
  console.log(`  Others: ${others.length} (pass-through)`);
  console.log(`  Total pre-filtered: ${deduped.length}`);

  return deduped;
}

// ============================================================
// JSON extraction helper — handles ```json blocks, 4+ backticks, prose wrappers
// ============================================================

function extractJsonArray(content: string): string {
  // Find the first [ and last ] — the JSON array boundaries
  const start = content.indexOf('[');
  const end = content.lastIndexOf(']');
  if (start !== -1 && end > start) {
    return content.slice(start, end + 1);
  }
  return content.trim();
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
  console.log(`  Items entering agent filter: ${items.length}`);
  console.log(`  Previous titles for dedup: ${previousBoldTitles.length}`);

  // Prepare compact JSON for Claude (no Jaccard pre-filter — Claude handles dedup semantically)
  const inputItems = items.map((item) => ({
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
    priority: (item as NewsItem & { priority?: boolean }).priority || false,
  }));

  // Build the "Previously Covered" section from bold titles
  const previousStoriesSection = previousBoldTitles.length > 0
    ? `\n## Previously Covered Stories (STRICT: DO NOT REPEAT)
These stories appeared in recent newsletters. Do NOT select any item that covers the same underlying event or topic, even if from a different source or with different wording.
The ONLY exception: include a previously covered story if there is a genuinely MAJOR new development (e.g., new benchmark results, official response, policy reversal, legal action). If you do include such a follow-up, you MUST note it in why_it_matters starting with "Follow-up: [what's new]".

Recent titles:
${previousBoldTitles.map(t => `- ${t}`).join('\n')}
`
    : '';

  const systemPrompt = `You are an expert AI news curator for LoreAI, a daily AI newsletter.

Your task: From the provided news items, select 18-25 of the most important and interesting items for today's newsletter.

## Priority Items (MUST INCLUDE)
Items marked with "priority": true are from official AI lab sources (Anthropic, OpenAI, Google/DeepMind). Include ALL priority items unless they are exact duplicates of stories covered in the last 7 days. Priority items count toward the total but the total can flex to 25 to accommodate them.

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
- Skip any story that is substantially the same as a Previously Covered Story listed below, even if from a different source or with slightly different wording

## Deduplication (CRITICAL)
- If the same underlying event appears from multiple sources in the input, pick the SINGLE best source (most detail, highest engagement). Multiple sources reporting the same thing is confirmation of importance, not a reason to include it multiple times.
- If multiple items are about the same topic (e.g., 3 tweets about "Anthropic distillation attack"), select only ONE — the most informative version.

## Priority Signals (rank higher)
- Product launches, model releases, API updates, new features
- High engagement relative to the account's typical numbers
- Breaking news (first report of something new)

## Selection Criteria
- Prioritize: breaking news, major releases, high engagement, practical value
- Include: diversity of sources and topics
- Skip: trivial updates, duplicate/similar stories, old news recycled
- Skip: items that are well-known older releases (>30 days old) even if still trending on HuggingFace — use your knowledge of actual release dates (e.g. DeepSeek-R1 released Jan 2025)
- Prefer: items with high engagement metrics relative to their source
${previousStoriesSection}
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

  const userPrompt = `Select 18-25 items from these ${inputItems.length} news items for today's AI newsletter (${DATE}):\n\n${JSON.stringify(inputItems, null, 0)}`;

  try {
    const response = await callClaudeWithRetry(systemPrompt, userPrompt, {
      maxTokens: 8192,
      temperature: 0.3,
      maxRetries: 2,
      validate: (content) => {
        try {
          const json = extractJsonArray(content);
          const parsed = JSON.parse(json);
          if (!Array.isArray(parsed)) return { valid: false, errors: ['Not an array'] };
          if (parsed.length < 12) return { valid: false, errors: [`Only ${parsed.length} items (need 12+)`] };
          return { valid: true, errors: [] };
        } catch (e) {
          const msg = e instanceof Error ? e.message : 'Unknown';
          return { valid: false, errors: [`Invalid JSON: ${msg}`] };
        }
      },
    });

    const json = extractJsonArray(response.content);
    const filtered: FilteredItem[] = JSON.parse(json);
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
    return ruleBasedFallback(items);
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

  const systemPrompt = `${skill}\n\n## This Run\n- Date: ${DATE}\n- Items provided: ${filtered.length}\n- IMPORTANT STRUCTURE: You MUST start with a # headline, then **${DATE}**, then a 1-2 sentence intro paragraph, then a "Today: X, Y, and Z." preview line, then --- before sections. These are required for the frontend — do NOT skip any of them.\n- Output ONLY the newsletter markdown. No frontmatter, no meta-commentary.\n- CRITICAL — Attribution accuracy: Do NOT infer or guess which product/company an item is about. Use ONLY the product/company names explicitly stated in the item title or summary. If the source doesn't name the product, describe the features without attributing them to a specific product.`;

  const userPrompt = `Write today's LoreAI AI News newsletter (${DATE}) using these ${filtered.length} curated items:\n\n${itemsText}`;

  const response = await callClaudeWithRetry(systemPrompt, userPrompt, {
    maxTokens: 8192,
    temperature: 0.5,
    maxRetries: 3,
    validate: validateNewsletter,
  });

  console.log(`  EN newsletter generated (model: ${response.model})`);
  console.log(`  Tokens: ${response.usage?.input_tokens} in / ${response.usage?.output_tokens} out`);

  const content = sanitizeOutput(response.content);
  const validation = validateNewsletter(content);
  if (!validation.valid) {
    console.warn('  ⚠️ Validation warnings (accepted anyway):', validation.errors);
  }

  return content;
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

  const systemPrompt = `${skill}\n\n## 本期规则\n- 日期：${DATE}\n- 提供条目：${filtered.length}\n- 重要结构：必须以 # 中文标题开头，然后 **${DATE}**，然后 1-2 句开场白，然后"今天聊：X、Y、Z。"预览行，然后 --- 分隔再开始正文。这些是前端显示必需的，不能省略任何一项。\n- 只输出 Newsletter 正文 Markdown，不要 frontmatter，不要元描述\n- 关键 — 归属准确性：不要推断或猜测某条新闻是关于哪个产品/公司的。只使用标题或摘要中明确提到的产品/公司名。如果来源没有点名产品，就描述功能本身，不要张冠李戴。`;

  const userPrompt = `基于以下 ${filtered.length} 条精选 AI 新闻，创作今日 LoreAI AI 简报中文版（${DATE}）：\n\n${itemsText}`;

  const response = await callZhNewsletterWithFallback(systemPrompt, userPrompt, validateZhNewsletter);

  console.log(`  ZH newsletter generated (model: ${response.model})`);

  const content = sanitizeOutput(response.content);
  const validation = validateZhNewsletter(content);
  if (!validation.valid) {
    console.warn('  ⚠️ Validation warnings:', validation.errors);
  }

  return content;
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
// Email Content Generation (Claude + skill)
// ============================================================

/**
 * Rewrite full newsletter markdown into an email-optimized version using Claude.
 * Uses skills/email-{lang}/SKILL.md for formatting guidance.
 */
async function generateEmailContent(newsletterMd: string, lang: string): Promise<string> {
  const stripped = newsletterMd.replace(/^---[\s\S]*?---\s*/, '');

  const skillPath = path.join(process.cwd(), 'skills', `email-${lang}`, 'SKILL.md');
  const skill = fs.readFileSync(skillPath, 'utf-8');

  const systemPrompt = `${skill}\n\n## This Run\n- Date: ${DATE}\n- Lang: ${lang}`;
  const userPrompt = `Rewrite this newsletter for email:\n\n${stripped}`;

  const response = await callClaudeWithRetry(systemPrompt, userPrompt, {
    maxTokens: 6144,
    temperature: 0.4,
    maxRetries: 2,
    validate: (content) => {
      if (!content.includes('# ')) return { valid: false, errors: ['Missing headline'] };
      if (content.length < 500) return { valid: false, errors: ['Too short'] };
      return { valid: true, errors: [] };
    },
  });

  console.log(`  Email ${lang.toUpperCase()} rewritten (model: ${response.model})`);
  return sanitizeOutput(response.content);
}

// ============================================================
// STAGE 7: Persist & Publish
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

function ensureHeadline(md: string, _topStory: string, lang: string): string {
  // Safety net — ensure a # headline exists. Never rewrite content, only extract from body.
  const trimmed = md.replace(/^(?:---\s*\n?)+/, '').trim();

  if (trimmed.startsWith('# ')) {
    const titleMatch = trimmed.match(/^# (.+)/);
    if (titleMatch) {
      const title = titleMatch[1].trim();
      const needsRewrite =
        (lang === 'zh' && !/[\u4e00-\u9fff\u3400-\u4dbf]/.test(title)) ||
        (lang === 'en' && /^introducing\s/i.test(title) && title.length > 60);
      if (needsRewrite) {
        const fallback = extractHeadlineFromBody(trimmed, lang);
        if (fallback) return trimmed.replace(/^# .+/, `# ${fallback}`);
      }
    }
    return trimmed;
  }

  // Claude skipped headline — extract from body
  const headline = extractHeadlineFromBody(trimmed, lang)
    || (lang === 'zh' ? '今日 AI 简报' : `AI News — ${DATE}`);
  return `# ${headline}\n\n${trimmed}`;
}

function extractHeadlineFromBody(md: string, lang: string): string | null {
  const subMatch = md.match(/^### (.+)/m);
  if (!subMatch) return null;
  const sub = subMatch[1].replace(/[。.]\s*$/, '').trim();
  if (lang === 'zh' && !/[\u4e00-\u9fff\u3400-\u4dbf]/.test(sub)) return null;
  return sub.slice(0, 80);
}

function extractTitle(md: string): string {
  const match = md.match(/^# (.+)/m);
  return match ? match[1] : `AI News ${DATE}`;
}

function extractDescription(md: string): string {
  let desc: string | undefined;

  // 1. Match preview line the skill defines: "Today:" / "今天聊:" / "今日看点:"
  const todayMatch = md.match(/(?:Today|今天聊|今日看点)[：:]\s*(.+)/i);
  if (todayMatch) {
    desc = todayMatch[1].slice(0, 200);
  }

  // 2. Try intro paragraph (between # headline and first ## section / ---)
  if (!desc) {
    const lines = md.split('\n');
    let started = false;
    const introLines: string[] = [];
    for (const line of lines) {
      if (line.startsWith('# ')) { started = true; continue; }
      if (!started) continue;
      if (line.startsWith('## ') || line === '---') break;
      const t = line.trim();
      if (!t || /^\*\*\d{4}/.test(t) || /^(?:Today|今天聊|今日看点)[：:]/i.test(t)) continue;
      introLines.push(t);
    }
    const intro = introLines.join(' ').trim();
    if (intro.length > 30) desc = intro.slice(0, 200);
  }

  // 3. Fallback: first ### sub-header
  if (!desc) {
    const subHeaderMatch = md.match(/^### (.+)/m);
    if (subHeaderMatch) desc = subHeaderMatch[1].slice(0, 160);
  }

  if (!desc) return `LoreAI AI News — ${DATE}`;

  // Clean punctuation bugs from joining H3 titles
  return desc
    .replace(/\.,/g, ',')
    .replace(/\.\./g, '.')
    .replace(/,\s*$/, '');
}

async function stage7_persist(
  enContent: string,
  zhContent: string,
  filtered: FilteredItem[]
): Promise<void> {
  console.log('\n💾 Stage 7: Persist & Publish');

  const categories = [...new Set(filtered.map((f) => f.category))];
  const topStory =
    filtered.sort((a, b) => b.score - a.score)[0]?.title.slice(0, 80) || 'AI News';

  // Ensure headline exists (Claude sometimes skips it despite prompt instructions)
  const enFixed = ensureHeadline(enContent, topStory, 'en');
  const zhFixed = ensureHeadline(zhContent, topStory, 'zh');

  // Build EN file
  const enTitle = extractTitle(enFixed);
  const enDesc = extractDescription(enFixed);
  const enFrontmatter = buildFrontmatter(enTitle, 'en', enDesc, filtered.length, categories, topStory);
  const enFull = `${enFrontmatter}\n\n${enFixed}`;

  // Build ZH file
  const zhTitle = extractTitle(zhFixed);
  const zhDesc = extractDescription(zhFixed);
  const zhFrontmatter = buildFrontmatter(zhTitle, 'zh', zhDesc, filtered.length, categories, topStory);
  const zhFull = `${zhFrontmatter}\n\n${zhFixed}`;

  // Write files
  const enPath = path.join(process.cwd(), 'content', 'newsletters', 'en', `${DATE}.md`);
  const zhPath = path.join(process.cwd(), 'content', 'newsletters', 'zh', `${DATE}.md`);
  fs.writeFileSync(enPath, enFull);
  fs.writeFileSync(zhPath, zhFull);
  console.log(`  Written: ${enPath}`);
  console.log(`  Written: ${zhPath}`);

  // Generate and save email HTML versions
  const emailEnDir = path.join(process.cwd(), 'content', 'newsletters', 'email', 'en');
  const emailZhDir = path.join(process.cwd(), 'content', 'newsletters', 'email', 'zh');
  fs.mkdirSync(emailEnDir, { recursive: true });
  fs.mkdirSync(emailZhDir, { recursive: true });

  console.log('\n📧 Generating email versions...');
  const [enEmailContent, zhEmailContent] = await Promise.all([
    generateEmailContent(enFixed, 'en'),
    generateEmailContent(zhFixed, 'zh'),
  ]);

  // Extract email-specific titles (may differ from website titles)
  const enEmailTitle = extractTitle(enEmailContent) || enTitle;
  const zhEmailTitle = extractTitle(zhEmailContent) || zhTitle;

  const enEmailHtml = await markdownToEmailHtml(enEmailContent, { title: enEmailTitle, date: DATE, lang: 'en' });
  const zhEmailHtml = await markdownToEmailHtml(zhEmailContent, { title: zhEmailTitle, date: DATE, lang: 'zh' });

  const enEmailPath = path.join(emailEnDir, `${DATE}.html`);
  const zhEmailPath = path.join(emailZhDir, `${DATE}.html`);
  fs.writeFileSync(enEmailPath, enEmailHtml);
  fs.writeFileSync(zhEmailPath, zhEmailHtml);
  console.log(`  Email HTML: ${enEmailPath}`);
  console.log(`  Email HTML: ${zhEmailPath}`);

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

  // Link content to news items & mark as selected (prevents re-selection in future runs)
  const itemIds = filtered.map((f) => f.id).filter((id) => id > 0);
  if (itemIds.length > 0) {
    linkContentSources(enContentId, itemIds);
    linkContentSources(zhContentId, itemIds);
    markItemsAsSelected(itemIds);
    console.log(`  Marked ${itemIds.length} items as selected (excluded from future newsletters)`);
  }

  console.log(`  DB records: EN (id=${enContentId}), ZH (id=${zhContentId})`);

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
  // Cross-day dedup is handled by DB (selected_for_newsletter_at IS NULL in getRecentNewsItems)
  // Bold titles still used for Claude's "Previously Covered" prompt context
  const previousBoldTitles = loadPreviousBoldTitles();
  let filtered: FilteredItem[];

  if (DRY_RUN) {
    console.log('\n🤖 Stage 3: Agent Filter (dry-run — using rule-based)');
    filtered = ruleBasedFallback(preFiltered);
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

    console.log('\n💾 Stage 7: Persist (dry-run — skipped)');
    closeDb();
    console.log('\n✅ Newsletter dry-run complete');
    return;
  }

  // Stage 4 & 5 (EN and ZH can run in parallel)
  const [enContent, zhContent] = await Promise.all([
    stage4_writeEN(filtered),
    stage5_writeZH(filtered),
  ]);

  // Quality validation gate (runs before persist — catches content issues)
  console.log('\n🔍 Quality Validation');
  const enQuality = validateNewsletterQuality({
    md: enContent,
    lang: 'en',
    filteredItems: filtered.map((f) => ({ ...f, detected_at: undefined })),
    previousBoldTitles,
  });
  const zhQuality = validateNewsletterQuality({
    md: zhContent,
    lang: 'zh',
    filteredItems: filtered.map((f) => ({ ...f, detected_at: undefined })),
    previousBoldTitles,
  });

  if (!enQuality.valid) {
    console.warn('  ⚠️ EN quality issues:', enQuality.errors);
  } else {
    console.log('  ✅ EN quality checks passed');
  }
  if (!zhQuality.valid) {
    console.warn('  ⚠️ ZH quality issues:', zhQuality.errors);
  } else {
    console.log('  ✅ ZH quality checks passed');
  }

  // Diff mode: show what changed vs existing newsletters, but don't persist
  if (DIFF_MODE) {
    console.log('\n📊 Diff Mode — comparing with existing newsletters');
    const enExistingPath = path.join(process.cwd(), 'content', 'newsletters', 'en', `${DATE}.md`);
    const zhExistingPath = path.join(process.cwd(), 'content', 'newsletters', 'zh', `${DATE}.md`);

    for (const [label, existing, newContent] of [
      ['EN', enExistingPath, enContent],
      ['ZH', zhExistingPath, zhContent],
    ] as const) {
      if (fs.existsSync(existing)) {
        const oldMd = fs.readFileSync(existing, 'utf-8');
        // Strip frontmatter for comparison
        const oldBody = oldMd.replace(/^---[\s\S]*?---\s*/, '').trim();
        const newBody = newContent.trim();

        if (oldBody === newBody) {
          console.log(`  ${label}: No changes`);
        } else {
          // Write temp files for diff
          const tmpOld = path.join(process.cwd(), `tmp-diff-old-${label.toLowerCase()}.md`);
          const tmpNew = path.join(process.cwd(), `tmp-diff-new-${label.toLowerCase()}.md`);
          fs.writeFileSync(tmpOld, oldBody);
          fs.writeFileSync(tmpNew, newBody);

          const { execSync } = await import('child_process');
          try {
            const diff = execSync(`diff -u "${tmpOld}" "${tmpNew}" || true`, { encoding: 'utf-8' });
            console.log(`\n  === ${label} DIFF ===`);
            console.log(diff.slice(0, 3000));
            if (diff.length > 3000) console.log(`  ... (${diff.length - 3000} more chars)`);
          } catch {
            console.log(`  ${label}: Could not generate diff`);
          }

          // Clean up temp files
          try { fs.unlinkSync(tmpOld); } catch { /* ignore */ }
          try { fs.unlinkSync(tmpNew); } catch { /* ignore */ }
        }
      } else {
        console.log(`  ${label}: No existing newsletter to compare (new)`);
      }
    }

    closeDb();
    console.log('\n✅ Diff mode complete — no files written');
    return;
  }

  // Stage 6
  await stage6_blogSeeds(filtered);

  // Stage 7
  await stage7_persist(enContent, zhContent, filtered);

  closeDb();
  console.log('\n✅ Newsletter pipeline complete');
}

main().catch((err) => {
  console.error('💥 Newsletter pipeline failed:', err);
  closeDb();
  process.exit(1);
});
