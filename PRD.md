# PRD: LoreAI v2 — The AI Newsletter & Content Flywheel

> **For**: Claude Code execution. Each Batch section is one Claude Code session.
> **Repo**: New repo `loreai-v2` on GitHub. Fresh start.
> **Site**: loreai.dev
> **Launch with**: `claude --dangerously-skip-permissions`

---

## Business Goals

1. **Best-in-class AI newsletter**: One daily digest (Mon-Fri) + one weekly deep digest (Saturday) that captures every trending and important AI story across models, apps, dev tools, infrastructure, and open source. EN + ZH. This replaces the current AI Daily + AI Dev split.
2. **Deep blog posts on hot topics**: Auto-detect what's trending (via X engagement + Brave Search demand + internal recurrence) and generate in-depth, useful blog posts that our audience actually wants to read and search engines actually rank.
3. **SEO/AEO flywheel**: Programmatic glossary, FAQ, comparison, and topic hub pages that capture long-tail search traffic. Every page funnels visitors toward newsletter signup. Content compounds over time via topic clusters and internal linking.

```
Newsletter (daily seed) → Deep Blog (SEO magnet) → SEO Pages (long-tail capture)
     ↑                                                          |
     └──────────── Newsletter Signup CTAs everywhere ←──────────┘
```

---

## Architecture

```
VPS (Ubuntu, ssh loreai)
  4:00am SGT — collect-news.ts      → SQLite DB
  5:00am SGT — write-newsletter.ts  → content/newsletters/ → git push → Vercel rebuild
  7:00am SGT — write-blog.ts        → content/blog/        → git push → Vercel rebuild
  9:00am SGT — generate-seo.ts      → content/glossary|faq|compare|topics/ → git push
  Saturday 5am — write-weekly.ts    → content/newsletters/weekly/ → git push

GitHub repo ← git push triggers → Vercel SSG → loreai.dev (static HTML, CDN-served)
```

Everything is **Static Site Generation**. Content is markdown with YAML frontmatter. Git push triggers Vercel rebuild. Zero hosting cost for frontend.

---

## Tech Stack

| Layer | Choice |
|-------|--------|
| Framework | Next.js 15 (App Router, SSG) |
| Styling | Tailwind CSS v4 |
| Language | TypeScript everywhere |
| Database | SQLite (better-sqlite3) on VPS only |
| AI Primary | Claude Opus via Anthropic API (`@anthropic-ai/sdk`) |
| AI Fallback (Newsletter ZH only) | Kimi K2.5 (`moonshot-v1-128k`) then Claude Sonnet |
| Twitter | twitterapi.io |
| Trend Validation | Brave Search API (free tier, 2000 queries/month) |
| Hosting | Vercel (free tier) |
| Analytics | Plausible or Umami (self-hosted) |

---

## Repo Structure

```
loreai-v2/
├── CLAUDE.md
├── .claude/settings.json                  # Permissions + agent teams flag
├── package.json / tsconfig.json / next.config.ts / tailwind.config.ts
│
├── content/                               # All generated content (git-tracked)
│   ├── newsletters/
│   │   ├── en/YYYY-MM-DD.md               # Daily AI News EN (Mon-Fri)
│   │   ├── zh/YYYY-MM-DD.md               # Daily AI News ZH
│   │   └── weekly/
│   │       ├── en/YYYY-WXX.md             # Weekly Digest EN (Saturday)
│   │       └── zh/YYYY-WXX.md             # Weekly Digest ZH
│   ├── blog/
│   │   ├── en/slug.md
│   │   └── zh/slug.md
│   ├── glossary/{en,zh}/term.md
│   ├── faq/{en,zh}/slug.md
│   ├── compare/{en,zh}/slug.md
│   └── topics/{en,zh}/slug.md             # Topic hub pages
│
├── data/                                   # Pipeline artifacts (git-tracked)
│   ├── filtered-items/YYYY-MM-DD.json
│   ├── blog-seeds/YYYY-MM-DD.json
│   └── content-plan/YYYY-WXX.json         # Weekly content plan
│
├── scripts/
│   ├── collect-news.ts                     # Data collection (all sources)
│   ├── write-newsletter.ts                 # Daily newsletter EN+ZH
│   ├── write-weekly.ts                     # Saturday weekly digest EN+ZH
│   ├── write-blog.ts                       # Deep blog posts EN+ZH
│   ├── generate-seo.ts                     # Glossary/FAQ/Compare/Topic pages
│   ├── daily-pipeline.sh                   # Cron orchestrator
│   └── lib/
│       ├── db.ts                           # SQLite helpers
│       ├── ai.ts                           # Claude/Kimi API wrappers + fallback
│       ├── twitter.ts                      # Twitter API client
│       ├── brave.ts                        # Brave Search API for trend validation
│       ├── dedup.ts                        # Jaccard dedup + cross-day dedup
│       ├── validate.ts                     # Newsletter/blog validation
│       ├── topic-cluster.ts                # Cluster detection + gap analysis
│       └── git.ts                          # Git operations with retry
│
├── skills/                                 # Prompt engineering vault
│   ├── newsletter-en/SKILL.md              # ← PRESERVE from v1 repo
│   ├── newsletter-zh/SKILL.md              # ← PRESERVE from v1 repo
│   ├── blog-en/SKILL.md                    # NEW
│   ├── blog-zh/SKILL.md                    # NEW
│   └── seo/SKILL.md                        # NEW
│
├── src/
│   ├── app/
│   │   ├── layout.tsx                      # Nav + footer + signup CTA
│   │   ├── page.tsx                        # Homepage
│   │   ├── newsletter/
│   │   │   ├── page.tsx                    # Newsletter archive
│   │   │   └── [date]/page.tsx             # Single newsletter
│   │   ├── zh/newsletter/                  # ZH mirrors
│   │   │   ├── page.tsx
│   │   │   └── [date]/page.tsx
│   │   ├── blog/
│   │   │   ├── page.tsx                    # Blog index
│   │   │   └── [slug]/page.tsx             # Single blog post
│   │   ├── zh/blog/                        # ZH mirrors
│   │   │   ├── page.tsx
│   │   │   └── [slug]/page.tsx
│   │   ├── glossary/
│   │   │   ├── page.tsx
│   │   │   └── [term]/page.tsx
│   │   ├── faq/
│   │   │   ├── page.tsx
│   │   │   └── [slug]/page.tsx
│   │   ├── compare/
│   │   │   ├── page.tsx
│   │   │   └── [slug]/page.tsx
│   │   ├── topics/
│   │   │   ├── page.tsx
│   │   │   └── [slug]/page.tsx
│   │   ├── subscribe/page.tsx              # Dedicated subscribe landing
│   │   ├── sitemap.ts
│   │   ├── robots.ts
│   │   └── feed.xml/route.ts               # RSS feed
│   ├── components/
│   │   ├── NewsletterSignup.tsx             # Email capture (hero|inline|sidebar|floating|page)
│   │   ├── NewsletterCard.tsx
│   │   ├── BlogCard.tsx
│   │   ├── TableOfContents.tsx
│   │   ├── RelatedContent.tsx
│   │   ├── LanguageSwitcher.tsx
│   │   └── ShareButtons.tsx
│   └── lib/
│       ├── content.ts                      # Read markdown, parse frontmatter
│       ├── newsletter.ts
│       ├── blog.ts
│       └── seo.ts
│
├── public/
│   ├── llms.txt
│   ├── og-image.png
│   └── favicon.ico
│
└── loreai.db                               # SQLite (VPS only, .gitignored)
```

---

## Database Schema

```sql
CREATE TABLE news_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  url TEXT UNIQUE,
  source TEXT NOT NULL,
  source_tier INTEGER DEFAULT 5,
  summary TEXT,
  score INTEGER DEFAULT 50,
  engagement_likes INTEGER DEFAULT 0,
  engagement_retweets INTEGER DEFAULT 0,
  engagement_downloads INTEGER DEFAULT 0,
  detected_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  raw_json TEXT
);

CREATE TABLE content (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  type TEXT NOT NULL,
  slug TEXT NOT NULL,
  lang TEXT NOT NULL DEFAULT 'en',
  title TEXT,
  body_markdown TEXT,
  meta_json TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(type, slug, lang)
);

CREATE TABLE content_sources (
  content_id INTEGER REFERENCES content(id),
  news_item_id INTEGER REFERENCES news_items(id),
  PRIMARY KEY (content_id, news_item_id)
);

CREATE TABLE keywords (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  keyword TEXT UNIQUE NOT NULL,
  cluster_slug TEXT,
  source TEXT NOT NULL,
  search_result_count INTEGER DEFAULT 0,
  content_exists BOOLEAN DEFAULT 0,
  content_type TEXT,
  content_slug TEXT,
  discovered_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE topic_clusters (
  slug TEXT PRIMARY KEY,
  pillar_topic TEXT NOT NULL,
  mention_count INTEGER DEFAULT 0,
  first_seen DATETIME DEFAULT CURRENT_TIMESTAMP,
  last_seen DATETIME DEFAULT CURRENT_TIMESTAMP,
  has_topic_hub BOOLEAN DEFAULT 0,
  brave_related_json TEXT,
  brave_updated_at DATETIME
);

CREATE TABLE subscribers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT UNIQUE NOT NULL,
  lang TEXT DEFAULT 'en',
  subscribed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  confirmed BOOLEAN DEFAULT 0
);
```

---

## Newsletter: Frequency & Coverage

### Daily AI News (Mon-Fri, 5am SGT)

- **Time window**: 48h primary, 72h DB query buffer for dedup
- **Item count**: 25-30 selected items
- **Format**: News-style headline H1 → 2-sentence opener with attitude → "Today:" preview → 6 category sections + MODEL LITERACY + PICK OF THE DAY + ⚡ Quick Hits overflow
- **Identity**: "LoreAI AI News — comprehensive daily AI digest covering models, apps, developer tools, infrastructure, industry moves, and open source trends"
- **Voice**: "Sharp tech insider briefing a busy founder over coffee — confident, concise, opinionated"
- **Languages**: EN + ZH (independent creation, not translation)

### Weekly Deep Digest (Saturday, 5am SGT)

- **Coverage**: Best 5 stories of the week, each with 200-400 word analysis
- **Format**: "5 Things That Mattered in AI This Week"
- **Source**: Aggregated from Mon-Fri newsletters + engagement data
- **Purpose**: Serves weekly-digest readers + ranks for "AI news this week" queries

### Categories

```
🧠 MODEL — New model releases, benchmarks, trends
📱 APP — Consumer products, platform updates
🔧 DEV — Developer tools, SDKs, APIs, infrastructure
📝 TECHNIQUE — Practical tips, best practices, coding techniques
🚀 PRODUCT — Products, research, open-source projects
🎓 MODEL LITERACY — One concept explained, 3-4 sentences
🎯 PICK OF THE DAY — Single most impactful item, 2-3 sentences + link
⚡ Quick Hits — Overflow items, one line + link each
🎬 WATCH — (Future Phase 2: YouTube content)
```

---

## Data Collection Pipeline

> `scripts/collect-news.ts` — runs at 4am SGT (20:00 UTC)

### Source Tiers

| Tier | Source | Items | Score |
|------|--------|-------|-------|
| 0 | 14 RSS Feeds | ~35 | 70-92 |
| 1 | 6 Official Blogs | ~25 | 85-95 |
| 2 | Twitter/X — 36 accounts + 14 search queries | ~80 | 50-90 |
| 3 | GitHub Trending (3 query strategies) | ~130 | 50-90 |
| 3b | GitHub Releases (19 tracked repos) | ~16 | 82 |
| 3c | HuggingFace — top 30 by `likes7d` + top 30 by `downloads7d`, merge & dedup | ~50 | 60-85 |
| 4 | Hacker News (Firebase API, top 30, AI-filtered) | ~7 | 50-75 |
| 5 | Reddit (OAuth API, 4 subreddits) | ~23 | 50-85 |
| 6 | YouTube — **stub only**, implement Phase 2 | 0 | — |

### Official Blogs (Tier 1)

```typescript
const OFFICIAL_BLOGS = [
  { name: 'Anthropic Engineering', url: 'https://www.anthropic.com/engineering' },
  { name: 'Anthropic Research', url: 'https://www.anthropic.com/research' },
  { name: 'Claude Code Changelog', url: 'https://code.claude.com/docs/en/changelog' },
  { name: 'HuggingFace Blog', url: 'https://huggingface.co/blog' },
  { name: 'DeepMind Blog', url: 'https://deepmind.google/blog' },
  { name: 'OpenAI Changelog', url: 'https://platform.openai.com/docs/changelog' },
];
```

### Twitter Accounts (36)

```typescript
const TWITTER_ACCOUNTS = [
  // Claude Code Team
  'bcherny', 'ErikSchluntz', 'adocomplete', 'felixrieseberg',
  // Anthropic
  'AnthropicAI', 'claudeai', 'mikeyk', 'alexalbert__', 'trq212',
  // Official Labs
  'OpenAI', 'OpenAIDevs', 'GoogleAI', 'GoogleDeepMind', 'AIatMeta',
  'MistralAI', 'huggingface', 'LangChainAI',
  // Thought Leaders
  'karpathy', 'swyx', 'lilianweng', 'simonw', 'emollick', 'drjimfan',
  'latentspacepod', 'aiDotEngineer', 'sama',
  // Broader Coverage
  'hardmaru', '_akhaliq', 'reach_vb', 'AiBreakfast',
  // More
  'ylecun', 'ID_AA_Carmack', 'bindureddy',
  // From AI Dev
  'chipro', 'ChatGPTapp',
];
```

### Twitter Search Queries (14)

```typescript
const SEARCH_QUERIES = [
  'Claude Code', 'AI agent', 'AI agent framework', 'MCP server',
  'Claude Code skills', 'vibe coding', 'AI devtools', 'LLM tools',
  'AI engineering', 'open source LLM', 'AI startup funding',
  'OpenAI Responses API', 'Claude API', 'OpenAI skills',
];
```

### Deduplication

- Jaccard similarity on tokenized titles, threshold 0.5
- Priority: lower source_tier + higher score wins
- Expected: ~300 raw → ~250 after dedup

---

## Newsletter Writing Pipeline

> `scripts/write-newsletter.ts` — runs at 5am SGT (21:00 UTC)

### Stages

**Stage 1 — DB Query**: `SELECT * FROM news_items WHERE detected_at > datetime('now', '-72 hours')`

**Stage 2 — Pre-filter** (hard caps before AI):
- GitHub Trending: top 5 by score
- Reddit: top 3 by score
- HuggingFace: top 10 by combined metric
- All others: pass through

**Stage 3 — Agent Filter** (Claude Opus via API):
- Input: 50-90 curated items as JSON
- Selects 25-30 items with categories, scores, `why_it_matters`
- Source quotas: Reddit MAX 2, GitHub MAX 4, HuggingFace 3-5
- Cross-day dedup: loads bold titles from last 3 newsletters
- Fallback: rule-based filter if API fails (top items by score per tier)

**Stage 4 — EN Newsletter** (Claude Opus, max 3 retries):
- Uses `skills/newsletter-en/SKILL.md` as system prompt context
- Validation: H1 title, ≥2 H2 sections, ≥3 bold items, no meta-summaries, no date-based titles

**Stage 5 — ZH Newsletter** (fallback cascade — newsletter only):
1. Claude Opus (2 attempts)
2. Kimi K2.5 API (`moonshot-v1-128k`, temp 0.4)
3. Claude Sonnet
- Uses `skills/newsletter-zh/SKILL.md`
- Same validation

**Stage 6 — Blog Seed Extraction**:
- From filtered items, extract top 3 by composite score (X engagement + Brave demand + recurrence)
- Save to `data/blog-seeds/YYYY-MM-DD.json`

**Stage 7 — Topic Cluster Update** (daily, no AI calls):
- Extract entities from today's filtered items
- Tag to existing clusters or create cluster seeds (3+ mentions in 7 days)
- Run Brave Search on top 3 NEW topics entering radar
- Store `related_searches` into keywords table

**Stage 8 — Persist & Publish**:
- Write to `content/newsletters/{en,zh}/YYYY-MM-DD.md`
- Insert into SQLite `content` table, link via `content_sources`
- Save filtered items to `data/filtered-items/YYYY-MM-DD.json`
- Git add, commit (`📰 AI News YYYY-MM-DD`), push

### Engagement Display

```
(2,192 likes | 1.63M downloads) — HuggingFace Trending
(847 likes | 23 RTs) — @karpathy
(95 engagement) — for sources with only combined metric
```

### Newsletter Frontmatter

```yaml
---
title: "Claude Code Goes Mobile While Qwen 3.5 Drops a Model Bomb"
date: 2026-02-28
type: newsletter
lang: en
description: "Today: Claude Code Remote Control, Qwen 3.5 family, OpenAI WebSocket API."
items_count: 27
categories: [MODEL, APP, DEV, TECHNIQUE, PRODUCT]
top_story: "Claude Code Remote Control"
---
```

### Validation Function (PRESERVE from v1)

```typescript
function validateNewsletter(md: string): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  if (!md.match(/^# .+/m)) errors.push('Missing H1 title');
  if ((md.match(/^## .+/gm) || []).length < 2) errors.push('<2 H2 sections');
  if ((md.match(/\*\*.+?\*\*/g) || []).length < 3) errors.push('<3 bold items');
  if (md.match(/in this newsletter|in today's issue/i)) errors.push('Meta-summary detected');
  if (md.match(/^# .*\d{4}-\d{2}-\d{2}/m)) errors.push('Date-based title');
  return { valid: errors.length === 0, errors };
}
```

---

## Weekly Digest Pipeline

> `scripts/write-weekly.ts` — runs Saturday 5am SGT

1. Load all Mon-Fri newsletters from current week
2. Load all filtered-items JSONs from the week
3. Rank stories by: frequency across multiple days + total engagement + agent_score
4. Select top 5 stories
5. For each: generate 200-400 word analysis (what happened → why it matters → what's next)
6. Wrap in "5 Things That Mattered in AI This Week" format
7. Generate EN then ZH via Claude Opus (for weekly ZH: newsletter fallback cascade applies)
8. Write to `content/newsletters/weekly/{en,zh}/YYYY-WXX.md`
9. Git push

---

## Hot Topic Detection & Blog Pipeline

> `scripts/write-blog.ts` — runs at 7am SGT (23:00 UTC)

### 3-Signal Topic Scoring

```typescript
interface BlogCandidate {
  topic: string;
  x_engagement_24h: number;         // Signal 1: X engagement velocity
  brave_has_results: boolean;        // Signal 2: Brave Search demand
  brave_related_searches: string[];  // free keyword expansion
  brave_discussions: string[];       // user questions → FAQ candidates
  mention_count_7d: number;          // Signal 3: Internal recurrence
  composite_score: number;
  suggested_angle: 'news' | 'tutorial' | 'analysis' | 'comparison';
}
```

**Scoring**:
```
composite = (x_engagement_24h / 1000) * 0.3
          + (brave_has_results ? 30 : 0) * 0.3
          + (mention_count_7d * 10) * 0.4
```

### Blog Generation (per post)

1. Pick top 2 candidates by composite_score (skip topics blogged in last 7 days)
2. Fetch full article from seed URL
3. Pull related news_items from DB (same topic, last 7 days)
4. Generate EN via Claude Opus (800-1500 words)
5. Generate ZH via Claude Opus (same pipeline, no fallback — skip on failure)
6. Extract SEO entities: glossary terms, FAQ questions, comparison pairs
7. Write to `content/blog/{en,zh}/slug.md`
8. Git push

### Blog Post Structure

```markdown
---
title: "Claude Code Skills System: The Complete Guide for AI Engineers"
date: 2026-02-28
slug: claude-code-skills-guide
description: "How Claude Code's skills system works and how to build your own SKILL.md files."
keywords: ["Claude Code skills", "SKILL.md", "Claude Code configuration"]
category: DEV
related_newsletter: 2026-02-28
related_glossary: [claude-code, skill-md, mcp-server]
related_compare: [claude-code-vs-cursor]
lang: en
video_ready: true
video_hook: "Claude Code 最强大的功能不是写代码，而是 Skills"
video_status: none
---

# Claude Code Skills System: The Complete Guide for AI Engineers

[80-120 word hook]

## What Happened
[200-300 words]

## Why It Matters
[200-300 words]

## Technical Deep-Dive
[200-300 words]

## What You Should Do
[100-200 words]

---

*Found this useful? [Subscribe to AI News](/subscribe) for daily AI briefings.*
```

### Blog Writing Skill (`skills/blog-en/SKILL.md`)

- **Voice**: Authoritative but accessible. Senior engineer explaining to a smart colleague.
- **Depth**: Go beyond newsletter summary. Add context, comparisons, benchmarks.
- **SEO**: Target keyword in title, first paragraph, one H2, and meta description.
- **Internal linking**: Every post links to ≥2 glossary terms and ≥1 related blog/newsletter.
- **No fabrication**: Don't invent details not in source material.
- **CTA**: End with newsletter signup prompt.
- **Forbidden phrases**: Same as newsletter + "In this article", "Without further ado", "Let's break it down"
- Include a gold-standard example.

---

## SEO/AEO Engine

> `scripts/generate-seo.ts` — runs at 9am SGT (01:00 UTC)

### Page Types

**Glossary** (`/glossary/[term]`) — 200-400 words
- Definition → Why it matters → How it works → Related terms
- `DefinedTerm` JSON-LD
- Trigger: term appears 3+ times in 7 days

**FAQ** (`/faq/[slug]`) — 200-500 words
- Direct answer first → Context → Related resources
- `FAQPage` JSON-LD
- Source: Brave `discussions` + blog extraction

**Comparisons** (`/compare/[slug]`) — 400-800 words
- Overview → Feature table → Use cases → Verdict
- `Product` JSON-LD
- Source: Brave "vs" queries + same-cluster competitors

**Topic Hubs** (`/topics/[slug]`) — 500-1000 words
- Overview → Latest news → Key features → All related links
- Central cluster node, auto-regenerated weekly

### Initial Volume (Quality > Quantity)

```
Phase 1 (Week 5-6):  20 glossary + 10 FAQ + 5 comparisons + 3 topic hubs
Phase 2 (Week 7-8):  Expand based on GSC impressions data
Phase 3 (Week 9+):   Scale via Brave keyword bank + GSC signals
```

### ZH for SEO Pages

Claude Opus only. No fallback. Skip on failure, retry next batch.

### Topic Cluster Engine (`scripts/lib/topic-cluster.ts`)

**Daily** (in newsletter Stage 7, no AI):
- Extract entities → tag to clusters or create seeds (3+ mentions in 7 days)
- Brave Search top 3 new topics → `related_searches` into keywords table

**Weekly** (Saturday):
- Brave Search all active clusters (20-30 calls, within free tier)
- Gap analysis per cluster
- Output: `data/content-plan/YYYY-WXX.json`

### Brave Search (`scripts/lib/brave.ts`)

```typescript
async function validateAndExpand(topic: string): Promise<TrendSignal> {
  const res = await fetch(
    `https://api.search.brave.com/res/v1/web/search?q=${encodeURIComponent(topic)}&count=5`,
    { headers: { 'X-Subscription-Token': BRAVE_SEARCH_API_KEY, Accept: 'application/json' } }
  );
  const data = await res.json();
  return {
    topic,
    has_search_demand: (data.web?.results?.length ?? 0) > 3,
    related_keywords: data.query?.related_searches?.map(r => r.query) ?? [],
    discussions: data.discussions?.results?.map(d => d.title) ?? [],
  };
}
```

### Internal Linking

Every page in a cluster links to every other page in the same cluster. Topic hub is the central node.

### AEO Strategy

- **llms.txt** at root
- **JSON-LD** on every page
- **Direct answer in first 1-2 sentences** for AI extraction
- **Canonical URLs** + **hreflang tags** EN/ZH

---

## Frontend Spec

### Routes

| Route | Content |
|-------|---------|
| `/` | Hero + latest newsletter + 3 blog posts + signup CTA |
| `/newsletter` | Archive (daily + weekly), paginated |
| `/newsletter/[date]` | Single newsletter |
| `/blog` | Blog index, paginated |
| `/blog/[slug]` | Blog post with TOC + related content |
| `/glossary` | Alphabetical index |
| `/glossary/[term]` | Single entry |
| `/faq` | FAQ index by category |
| `/faq/[slug]` | Single FAQ |
| `/compare` | Comparisons index |
| `/compare/[slug]` | Single comparison |
| `/topics` | Topic hubs index |
| `/topics/[slug]` | Single hub |
| `/subscribe` | Dedicated signup |
| `/zh/newsletter`, `/zh/blog` + detail pages | ZH mirrors |
| `/sitemap.xml`, `/feed.xml`, `/zh/feed.xml` | SEO + RSS |

### Homepage

```
Nav: LoreAI | Newsletter | Blog | EN/中文

HERO:
  "Your daily AI briefing. Models. Tools. Code. Trends."
  [Email input] [Subscribe — it's free]
  "Join X AI practitioners" (real count)

TODAY'S AI NEWS: [Latest newsletter, full embed]
DEEP DIVES: [Blog card] [Blog card] [Blog card]
[Newsletter signup CTA repeat]
Footer: About | RSS | GitHub | Twitter
```

### Newsletter Signup Component

Most important component. Appears on: homepage hero, bottom of every newsletter, bottom of every blog post, sidebar of blog index, `/subscribe` page, floating banner (dismissible, first visit).

POST to `/api/subscribe` → SQLite subscribers table. Phase 1 = collect only. Phase 2 = email distribution.

### SEO HTML (Every Page)

- `<title>` unique, <60 chars, keyword-first
- `<meta name="description">` 150-160 chars
- `<link rel="canonical">` + hreflang
- Open Graph tags
- JSON-LD per page type
- Semantic HTML

### Design Principles

1. Fast (<1s LCP), clean, reading-first (`max-w-3xl`), mobile-first, CTA-everywhere.

---

## blog2video Integration

ZH blog frontmatter includes `video_ready`, `video_hook`, `video_status`, `video_url`. Template renders `📺 Watch video` when published. No deep integration now.

Social funnel: 小红书/微信视频号 → `loreai.dev/zh/blog/slug` → newsletter signup.

---

## Deployment & Ops

### VPS Crontab

```cron
0 20 * * 1-5 /home/ubuntu/loreai-v2/scripts/daily-pipeline.sh collect >> /home/ubuntu/loreai-v2/logs/collect.log 2>&1
0 21 * * 1-5 /home/ubuntu/loreai-v2/scripts/daily-pipeline.sh newsletter >> /home/ubuntu/loreai-v2/logs/newsletter.log 2>&1
0 23 * * 1-5 /home/ubuntu/loreai-v2/scripts/daily-pipeline.sh blog >> /home/ubuntu/loreai-v2/logs/blog.log 2>&1
0  1 * * 2-6 /home/ubuntu/loreai-v2/scripts/daily-pipeline.sh seo >> /home/ubuntu/loreai-v2/logs/seo.log 2>&1
0 21 * * 6   /home/ubuntu/loreai-v2/scripts/daily-pipeline.sh weekly >> /home/ubuntu/loreai-v2/logs/weekly.log 2>&1
0 23 * * 6   /home/ubuntu/loreai-v2/scripts/daily-pipeline.sh cluster-strategy >> /home/ubuntu/loreai-v2/logs/strategy.log 2>&1
```

### `scripts/daily-pipeline.sh`

```bash
#!/bin/bash
set -euo pipefail
cd /home/ubuntu/loreai-v2
STEP="${1:-all}"
DATE=$(date -u +%Y-%m-%d)
mkdir -p logs
for i in 1 2 3; do git pull --rebase && break; sleep 10; done

case "$STEP" in
  collect)    npx tsx scripts/collect-news.ts ;;
  newsletter)
    npx tsx scripts/write-newsletter.ts --date="$DATE"
    git add content/newsletters/ data/filtered-items/ data/blog-seeds/
    git commit -m "📰 AI News $DATE" || true && git push ;;
  blog)
    npx tsx scripts/write-blog.ts --date="$DATE"
    git add content/blog/
    git commit -m "📝 Blog $DATE" || true && git push ;;
  seo)
    npx tsx scripts/generate-seo.ts --date="$DATE"
    git add content/glossary/ content/faq/ content/compare/ content/topics/
    git commit -m "🔍 SEO $DATE" || true && git push ;;
  weekly)
    npx tsx scripts/write-weekly.ts
    git add content/newsletters/weekly/
    git commit -m "📊 Weekly $(date +%Y-W%V)" || true && git push ;;
  cluster-strategy)
    npx tsx scripts/generate-seo.ts --weekly-strategy
    git add data/content-plan/
    git commit -m "📋 Plan $(date +%Y-W%V)" || true && git push ;;
esac
```

### Environment Variables (`.env`, NOT in git)

```
ANTHROPIC_API_KEY, TWITTER_API_KEY, TWITTER_API_SECRET, MOONSHOT_API_KEY,
GITHUB_TOKEN, REDDIT_CLIENT_ID, REDDIT_CLIENT_SECRET, BRAVE_SEARCH_API_KEY
```

### Vercel Redirects (`next.config.ts`)

```typescript
async redirects() {
  return [
    { source: '/newsletter/ai-daily/:date', destination: '/newsletter/:date', permanent: true },
    { source: '/en/blog/:slug', destination: '/blog/:slug', permanent: true },
    { source: '/en/glossary/:term', destination: '/glossary/:term', permanent: true },
    { source: '/en/faq/:slug', destination: '/faq/:slug', permanent: true },
    { source: '/en/compare/:slug', destination: '/compare/:slug', permanent: true },
    { source: '/en/topics/:slug', destination: '/topics/:slug', permanent: true },
  ];
}
```

---

## Prompt Vault — PRESERVE FROM V1

> ⚠️ Battle-tested. Copy exactly. Iterate, never start from scratch.

### Files to Copy from `hot2content-init`

| Source | Destination |
|--------|-------------|
| `skills/newsletter-en/SKILL.md` | `skills/newsletter-en/SKILL.md` |
| `skills/newsletter-zh/SKILL.md` | `skills/newsletter-zh/SKILL.md` |
| `docs/NEWSLETTER-OPTIMIZATION-STRATEGY.md` | `docs/NEWSLETTER-OPTIMIZATION-STRATEGY.md` |

### Critical Rules to Preserve

1. **No fabrication**: Empty summary → ONLY title + source + link
2. **ZH fallback cascade** (newsletter only): Opus → Kimi K2.5 → Sonnet
3. **Chinese ≠ translation**: "基于同一批新闻源，独立创作中文版本"
4. **Source quotas**: Reddit MAX 2, GitHub MAX 4
5. **Engagement**: Likes and downloads shown separately
6. **Forbidden phrases**: EN and ZH curated lists
7. **Quick Hits overflow**: 5+ items per category → ⚡ Quick Hits
8. **Few-shot examples**: Crafted for target voice
9. **Cross-day dedup**: Bold titles from last 3 newsletters

### Agent Filter Enhancements

```
## HuggingFace Trending Quota
Select 3-5 HuggingFace items. Group same-lab models as 1 item. Show likes AND downloads separately.

## Category Balance
At least 2 items per main category when possible.
```

---

## Content Migration (run once)

```bash
cp -r /home/ubuntu/hot2content-init/content/newsletters/en/* /home/ubuntu/loreai-v2/content/newsletters/en/
cp -rn /home/ubuntu/hot2content-init/content/newsletters/ai-daily/en/* /home/ubuntu/loreai-v2/content/newsletters/en/
cp -r /home/ubuntu/hot2content-init/content/newsletters/zh/* /home/ubuntu/loreai-v2/content/newsletters/zh/
cp -rn /home/ubuntu/hot2content-init/content/newsletters/ai-daily/zh/* /home/ubuntu/loreai-v2/content/newsletters/zh/
cp -r /home/ubuntu/hot2content-init/content/blog/* /home/ubuntu/loreai-v2/content/blog/ 2>/dev/null || true
cp -r /home/ubuntu/hot2content-init/content/glossary/* /home/ubuntu/loreai-v2/content/glossary/ 2>/dev/null || true
cp -r /home/ubuntu/hot2content-init/content/faq/* /home/ubuntu/loreai-v2/content/faq/ 2>/dev/null || true
cp -r /home/ubuntu/hot2content-init/content/compare/* /home/ubuntu/loreai-v2/content/compare/ 2>/dev/null || true
```

---

## CLAUDE.md

```markdown
# CLAUDE.md — LoreAI v2

## What This Is
LoreAI v2: bilingual (EN/ZH) AI news platform. Daily newsletter + deep blog + SEO pages.
Stack: Next.js 15 + TypeScript + Tailwind v4 + SQLite. Deployed on Vercel. Pipelines on VPS.

## Permissions
This project uses --dangerously-skip-permissions. All operations pre-approved.

## Commands
npm run dev                                            # Local dev
npm run build                                          # Build
npx tsx scripts/collect-news.ts                        # Data collection
npx tsx scripts/write-newsletter.ts --date=YYYY-MM-DD  # Newsletter
npx tsx scripts/write-blog.ts --date=YYYY-MM-DD        # Blog
npx tsx scripts/generate-seo.ts --date=YYYY-MM-DD      # SEO pages
npx tsx scripts/write-weekly.ts                        # Weekly digest

## Content Directories
content/newsletters/{en,zh}/YYYY-MM-DD.md       # Daily
content/newsletters/weekly/{en,zh}/YYYY-WXX.md  # Weekly
content/blog/{en,zh}/slug.md                    # Blog
content/glossary/{en,zh}/term.md                # Glossary
content/faq/{en,zh}/slug.md                     # FAQ
content/compare/{en,zh}/slug.md                 # Comparisons
content/topics/{en,zh}/slug.md                  # Topic hubs

## Cron (SGT, Mon-Fri unless noted)
4am  collect-news.ts
5am  write-newsletter.ts
7am  write-blog.ts
9am  generate-seo.ts
Sat 5am: write-weekly.ts + cluster-strategy

## Danger Windows
4-6am, 7-8am, 9-10am SGT: Pipelines active, don't push

## Env Vars
ANTHROPIC_API_KEY, TWITTER_API_KEY, TWITTER_API_SECRET, MOONSHOT_API_KEY,
GITHUB_TOKEN, REDDIT_CLIENT_ID, REDDIT_CLIENT_SECRET, BRAVE_SEARCH_API_KEY

## Style
Newsletter: "sharp tech insider briefing a busy founder over coffee"
Blog: "senior engineer explaining to a smart colleague"
Chinese: NOT translation. Independent creation. WeChat-group tone.

## Prompts
skills/ contains battle-tested prompts. Do not rewrite from scratch.
```

---

## .claude/settings.json

```json
{
  "permissions": {
    "allow": [
      "Bash(*)",
      "Read(*)",
      "Write(*)",
      "Edit(*)",
      "MultiEdit(*)",
      "Glob(*)",
      "Grep(*)"
    ]
  },
  "env": {
    "CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS": "1"
  }
}
```

---

## Execution Batches

> Launch each: `claude --dangerously-skip-permissions`
> Batches 1-3: single agent. Batches 4-6: agent teams. Batches 7-8: single agent.

### Batch 1: Scaffold & Data Layer

**Goal**: Repo initialized, `npm run dev` works, DB creates.

```
1. npx create-next-app@latest loreai-v2 --typescript --tailwind --app --src-dir
2. Create full repo structure per this PRD
3. SQLite DB with full schema (scripts/lib/db.ts)
4. scripts/lib/ai.ts — Claude API + Kimi fallback
5. scripts/lib/brave.ts — Brave Search wrapper
6. scripts/lib/git.ts — git ops with retry
7. scripts/lib/dedup.ts — Jaccard similarity
8. scripts/lib/validate.ts — newsletter/blog validation
9. CLAUDE.md + .claude/settings.json
10. .env.example, .gitignore
11. Verify: npm run dev works, DB creates
```

### Batch 2: Data Collection Pipeline

**Goal**: `collect-news.ts` populates DB with ~250 items.

```
1. scripts/collect-news.ts — all tiers (0-5, tier 6 stub)
2. scripts/lib/twitter.ts — 36 accounts, 14 queries
3. RSS, 6 blog scrapers (incl Claude Code changelog), GitHub, HN, Reddit
4. HuggingFace dual query
5. Dedup + insert
6. Test: 200+ items in DB
```

### Batch 3: Newsletter Pipeline

**Goal**: `write-newsletter.ts` generates EN + ZH.

```
1. scripts/write-newsletter.ts — all 8 stages
2. Copy skills/ from old repo (or create from PRD prompts)
3. Agent filter + cross-day dedup + source quotas
4. EN writer + validation + retry
5. ZH writer + 3-level fallback (newsletter only)
6. Blog seed extraction (3-signal scoring)
7. Topic cluster daily update + Brave Search
8. Persist + git push
9. Test: verify output quality
```

### Batch 4: Frontend — Newsletter + Homepage (AGENT TEAM)

**Goal**: Homepage + newsletter pages live.

```
Create agent team with 3 teammates:

Teammate "layout": layout.tsx, page.tsx (homepage), subscribe page,
  NewsletterSignup (5 variants), LanguageSwitcher, /api/subscribe

Teammate "newsletter-pages": content.ts lib, newsletter archive + detail pages,
  ZH mirrors, migrate 5 sample newsletters

Teammate "seo-infra": sitemap.ts, robots.ts, feed.xml, llms.txt,
  seo.ts JSON-LD helpers, next.config.ts redirects, OG image, favicon

Verify: npm run build, pages render, signup works
```

### Batch 5: Blog Pipeline + Frontend (AGENT TEAM)

**Goal**: Blog posts auto-generate and render.

```
Create agent team with 2 teammates:

Teammate "pipeline": write-blog.ts, blog skills, topic-cluster.ts,
  generate 2 test posts

Teammate "frontend": blog pages + ZH mirrors, BlogCard, TableOfContents,
  RelatedContent, ShareButtons, JSON-LD Article

Verify: posts render, TOC, related links, CTA
```

### Batch 6: SEO Engine (AGENT TEAM)

**Goal**: All SEO pages generate and render.

```
Create agent team with 2 teammates:

Teammate "pipeline": generate-seo.ts (all 4 types + weekly strategy),
  seo/SKILL.md

Teammate "frontend": glossary/faq/compare/topics pages + JSON-LD,
  internal linking, seed content (20+10+5+3)

Verify: pages render, structured data, sitemap
```

### Batch 7: Weekly Digest + Orchestration

**Goal**: Full pipeline end-to-end.

```
1. write-weekly.ts
2. daily-pipeline.sh
3. Content migration from old repo
4. Weekly in newsletter archive
5. Dry-run full pipeline
6. npm run build with all content
7. Vercel deploy checklist
```

### Batch 8: Growth & Polish

**Goal**: Production-ready.

```
1. Floating signup banner
2. Blog CTAs
3. /subscribe social proof
4. Analytics snippet
5. blog2video frontmatter support
6. 404 page
7. Performance (<1s LCP)
8. Final verification
```

---

## Success Metrics

| Metric | Month 1 | Month 3 | Month 6 |
|--------|---------|---------|---------|
| Subscribers | 100 | 500 | 2,000 |
| Daily organic visitors | 50 | 300 | 1,500 |
| Blog posts | 60 | 180 | 360 |
| Indexed pages | 150 | 500 | 1,200 |

**North star**: Newsletter subscribers.

---

## Key Decisions

| Decision | Choice | Why |
|----------|--------|-----|
| One newsletter | Combined AI News | 48% overlap gone, stronger brand |
| AI Dev pipeline base | TypeScript multi-stage | Structured, tested, fallbacks |
| Daily Mon-Fri + Weekly Sat | Industry standard | Different audiences |
| Brave Search | Free, `related_searches` | Keyword expansion |
| 3-signal blog scoring | X + Brave + recurrence | Hot + searchable + durable |
| Quality > quantity (SEO) | Start small, expand on data | Rankings > page count |
| No ZH fallback for blog | Same pipeline | Simplicity; fallback = newsletter only |
| blog2video: frontmatter | Data contract only | No over-engineering |
| --dangerously-skip-permissions | Speed | Fresh repo |
