---
title: "Pipeline Architecture"
status: active
category: spec
last-updated: 2026-03-30
depends-on: []
---

# Pipeline Architecture

## Overview

Daily automated pipeline: collect raw AI news → curate newsletter → extract entities → discover flagship subtopics → generate content → expand keywords → monitor performance.
Each stage feeds the next. The **Keyword Engine** (B1→B4) is the core content generation driver. The **Flagship Discovery Agent** (D1) maintains subtopic authority for flagship topics via weekly full discovery and daily freshness routing.

## Schedule (SGT — crontab uses `TZ=Asia/Singapore`)

| Time (SGT) | Step | Script | Days |
|-------------|------|--------|------|
| 12:00am | Collect | `collect-news.ts` | Mon-Fri |
| 2:00am | Newsletter | `write-newsletter.ts` | Mon-Fri |
| 4:00am | Entity Extract | `extract-entities.ts` | Mon-Fri |
| 4:30am | Flagship Freshness | `flagship-freshness.ts` | Mon-Fri |
| 6:00am | Generate | `process-queue.ts` | Mon-Fri |
| 7:30am | Flagship Discovery | `flagship-discovery.ts` | Sat |
| 8:00am | Discovery | `discovery-cycle.ts` | Tue & Sat |
| 10:00am | Performance | `performance-cycle.ts` | Sat |
| 5:00am | Weekly Digest | `write-weekly.ts` | Sun |
| 9:00pm | Review Health | `review-cycle.ts --mode=health` | Mon-Fri |
| 9:30pm | Review Quality | `review-cycle.ts --mode=quality` | Mon-Fri |
| 10:00pm | Review Strategic | `review-cycle.ts --mode=strategic` | Sun |

**D1 Flagship steps (added 2026-03-27):** Freshness routes daily news signals to approved flagship subtopics and queues create/refresh jobs. Full Discovery runs weekly to re-synthesize subtopics from official docs + competitors (human approval required via `--approve`). See SPEC-D1.

## Pipeline Flow

```
12am SGT
+-----------------------------------------------------------+
|  1. COLLECT  (collect-news.ts)                            |
|                                                           |
|  7 tiers of data sources, collected in parallel:          |
|  Tier 0: RSS (TechCrunch, Ars Technica, VentureBeat,     |
|          Lilian Weng, LangChain, Latent Space, etc.)      |
|  Tier 1: Official Blogs (DeepMind, Google AI, HuggingFace,|
|          Anthropic, OpenAI Releases)                      |
|  Tier 2: Twitter/X (36 accounts + 18 search queries)     |
|  Tier 3a: GitHub Trending (5 search queries, ~130 items)  |
|  Tier 3b: GitHub Releases (18 tracked repos)              |
|  Tier 3c: HuggingFace (trending + top-7d + org-specific)  |
|  Tier 4: Hacker News (Firebase API, AI keyword filter)    |
|  Tier 5: Reddit (4 subreddits, AI keyword filter)         |
|  Tier 6: YouTube (stub — Phase 2)                         |
|                                                           |
|  Staleness filters: 7d RSS, 14d OpenAI, 60d HuggingFace  |
|  -> Deduplicate (URL UNIQUE) -> Insert into SQLite        |
+-----------------------------+-----------------------------+
                              |
                              v
2am SGT
+-----------------------------------------------------------+
|  2. NEWSLETTER  (write-newsletter.ts)                     |
|                                                           |
|  Stage 1: Query DB for all items in last 72 hours         |
|  Stage 2: Pre-filter (hard caps per source type)          |
|           Twitter: RT dedup + AI filter + 3/account cap   |
|           GitHub: blocklist (evergreen repos)             |
|  Stage 3: 3-tier Agent Filter -> pick 18-25 best          |
|           Tier 1: Agent mode (Claude Opus + tools)        |
|           Tier 2: Single-shot (Claude Opus)               |
|           Tier 3: Rule-based fallback                     |
|           + cross-day dedup (compare past issues)         |
|  Stage 3b: Outline Generator (Claude Opus)                |
|  Stage 4: Claude Opus writes EN newsletter                |
|  Stage 5: Claude Opus writes ZH newsletter                |
|           (independent creation, NOT translation)         |
|           Fallback cascade: Opus -> Sonnet -> cached      |
|  Stage 6: Blog Seed Extraction (optional)                 |
|           3-signal scoring: engagement + search + mentions |
|  Stage 7: Persist & Publish                               |
|           Save files, mark items, git commit+push,        |
|           send EN+ZH emails via Buttondown                |
|                                                           |
|  Outputs:                                                 |
|  +-- content/newsletters/en/YYYY-MM-DD.md                |
|  +-- content/newsletters/zh/YYYY-MM-DD.md                |
|  +-- data/filtered-items/YYYY-MM-DD.json                 |
|  +-- data/blog-seeds/YYYY-MM-DD.json (legacy)            |
+--------------+----------------------------+---------------+
               |                            |
               v                            v
4am SGT                              6am SGT
+--------------------------+   +-----------------------------+
| 3. EXTRACT ENTITIES      |   | 4. GENERATE (process-queue) |
| (extract-entities.ts)    |   |                             |
|                          |   | Read top-N jobs from        |
| From ALL items in last   |
|   30h (incl. newsletter- |
|   selected items),       |   | create_queue (by priority)  |
| Claude Sonnet extracts:  |   |                             |
| - Company names          |   | For each job:               |
| - Model names            |   |  Research (Serper + Exa)    |
| - Tech concepts          |   |  or Gemini Deep Research   |
| - Frameworks/products    |   |  -> Claude Opus writes EN  |
|                          |   |  -> Claude Opus writes ZH  |
| -> Upsert into           |   |  -> Validate links         |
|    topic_clusters table  |   |  -> Write files + update DB|
|  (D2: skips flagship     |   | Content types:              |
|   subtopics — guarded    |   |  faq, compare, glossary,   |
|   by isFlagshipSubtopic) |   |  blog, topic-hub,          |
|                          |   |  deep-dive, cornerstone    |
| Output: DB updates       |   |                             |
| (non-flagship entities)  |   |                             |
+-----------+--------------+   +-------------+--------------+
            |                                |
            +---------------+----------------+
                            |
                            v
4:30am SGT (Mon-Fri)
+-----------------------------------------------------------+
|  3b. FLAGSHIP FRESHNESS  (flagship-freshness.ts)          |
|                                                           |
|  Routes daily news signals to approved flagship subtopics.|
|  Reads approved subtopic-pack, maps events to existing    |
|  subtopics/pages, drafts refresh/create actions.          |
|                                                           |
|  -> Writes jobs to create_queue (source='flagship_fresh') |
|  -> Seeds keywords via upsertKeyword()                    |
|                                                           |
|  Triple dedup: vs create_queue, vs recent content,        |
|  vs same-run duplicates.                                  |
+-----------------------------------------------------------+

Sat 7:30am SGT
+-----------------------------------------------------------+
|  3c. FLAGSHIP DISCOVERY  (flagship-discovery.ts)          |
|                                                           |
|  Weekly full discovery — synthesizes official docs +      |
|  competitor content into subtopic-pack.                   |
|                                                           |
|  Step 1: Official surface synthesis (Exa + Serper)        |
|  Step 2: SERP/content-competitor synthesis                 |
|  Step 3: Normalize & merge (official wins ties)           |
|  Step 4: Write draft pack to data/flagship-packs/         |
|                                                           |
|  Human approves via --approve -> materializePack()        |
|  -> Upserts subtopics into topic_clusters                 |
|     (source='flagship_discovery')                         |
|  -> Seeds keywords from pack                              |
+-----------------------------------------------------------+

8am SGT (Tue & Sat)
+-----------------------------------------------------------+
|  5. DISCOVERY  (discovery-cycle.ts)                       |
|                                                           |
|  Keyword Engine Pipeline (C1 -> B1 -> B2 -> B3):         |
|                                                           |
|  C1: Subtopic Discovery                                   |
|      For flagship topics: reads approved subtopic-pack    |
|      For others: legacy topic_clusters LIKE query         |
|                                                           |
|  B1: Keyword Expansion (expand-keywords.ts)               |
|      Serper: PAA, related searches, autocomplete          |
|      Exa: competitor page scan                            |
|      -> Upsert keywords with search_volume, competition  |
|                                                           |
|  B2: Intent Grouping (group-keywords.ts)                  |
|      Claude groups keywords by search intent              |
|      -> Create keyword_groups with content_type           |
|         (faq, compare, glossary, blog, topic-hub)         |
|                                                           |
|  B3: Priority Scoring (score-and-queue.ts)                |
|      Score: volume x competition x intent x timeliness    |
|      -> Insert jobs into create_queue                     |
|                                                           |
|  Does NOT generate content — feeds create_queue for       |
|  the daily Generate step (process-queue.ts)               |
+-----------------------------------------------------------+

Sat 10am SGT
+-----------------------------------------------------------+
|  5b. PERFORMANCE  (performance-cycle.ts)                  |
|                                                           |
|  Stage 1: Import GSC data (28-day window)                 |
|  Stage 2: Segment pages by CTR, impressions, position     |
|  Stage 3: Detect anomalies (position drops, low CTR)      |
|  Stage 4: Queue underperforming pages for refresh         |
|           -> Insert refresh jobs into create_queue        |
|                                                           |
|  Output: snapshots table + refresh jobs in create_queue   |
+-----------------------------------------------------------+

Sunday 5am SGT
+-----------------------------------------------------------+
|  6. WEEKLY  (write-weekly.ts)                             |
|                                                           |
|  Aggregate Mon-Fri newsletters + filtered-items JSONs     |
|  Rank stories by: frequency + engagement + agent_score    |
|  Pick top 5 most important stories                        |
|  Claude Opus writes 200-400 word analysis per story       |
|  "5 Things That Mattered in AI This Week"                 |
|                                                           |
|  Output: content/newsletters/weekly/{en,zh}/YYYY-WXX.md  |
+-----------------------------------------------------------+
```

## Keyword Engine (B1 → B4)

The keyword engine is the core system driving SEO content generation. It replaced the legacy `write-blog.ts` + `generate-seo.ts` scripts.

```
topic_clusters ──> B1 Expansion ──> B2 Grouping ──> B3 Scoring ──> B4 Generation
                   (Serper+Exa)     (Claude)        (priority)     (Claude+research)
                       |                |                |                |
                   keywords        keyword_groups   create_queue     content files
```

| Stage | Script | Input | Output | AI |
|-------|--------|-------|--------|----|
| B1 | `expand-keywords.ts` | topic_clusters | keywords (with search_volume, competition) | — |
| B2 | `group-keywords.ts` | ungrouped keywords | keyword_groups (intent, content_type) | Claude Haiku/Sonnet |
| B3 | `score-and-queue.ts` | keyword_groups | create_queue jobs | — |
| B4 | `process-queue.ts` | create_queue | content files (EN+ZH) | Claude Opus + Serper + Exa |

B4 has two research pipelines:
- **Standard**: Serper SERP results + Exa semantic search
- **Deep Research**: Gemini Deep Research (fallback to Standard if unavailable)

## Data Flow Summary

```
Collect -> news_items (raw articles)
               |
Newsletter -> curated items -> filtered-items JSON (for Weekly)
               |                blog-seeds JSON (legacy)
               |
Entity Extract -> topic_clusters (non-flagship entities only; D2 guard skips flagship subtopics)
               |
Flagship Discovery -> subtopic-pack (approved) -> topic_clusters (source='flagship_discovery')
               |                                         |
Flagship Freshness -> create_queue (source='flagship_freshness')
               |                                         |
Discovery (C1->B1->B2->B3) -> keywords -> keyword_groups -> create_queue
  (C1 prefers flagship packs when available)                      |
                                                                  |
Process Queue (B4) --------> content files (EN+ZH) + content table
                                                                  |
Performance -> GSC snapshots -> refresh jobs -------> create_queue
```

**Collect is raw material. Newsletter is the filter. Entity Extract seeds non-flagship entities. Flagship Discovery defines authoritative subtopics (human-approved). Flagship Freshness routes daily news to flagship subtopics. Discovery expands keywords and queues content jobs. Process Queue generates the content. Performance closes the feedback loop.**

## Key Database Tables

| Table | Written by | Read by |
|-------|-----------|---------|
| `news_items` | Collect | Newsletter, Entity Extract |
| `content` | Newsletter, Generate (B4), Weekly | Discovery (gap analysis), Performance |
| `content_sources` | Newsletter, Generate (B4) | (traceability) |
| `keywords` | Discovery (B1), Generate (B4) | Discovery (B2, B3), Generate (B4) |
| `topic_clusters` | Entity Extract (non-flagship), Flagship Discovery (flagship subtopics) | Discovery (C1), Dashboard |
| `keyword_groups` | Discovery (B2) | Discovery (B3), Generate (B4) |
| `create_queue` | Discovery (B3), Flagship Freshness, Performance | Generate (B4), Dashboard |
| `snapshots` | Performance | Dashboard (trends) |
| `subscribers` | API server | Newsletter (send) |

## Key File Outputs

| Directory | Written by | Format |
|-----------|-----------|--------|
| `content/newsletters/{en,zh}/` | Newsletter | Markdown + frontmatter |
| `content/newsletters/weekly/{en,zh}/` | Weekly | Markdown + frontmatter |
| `content/blog/{en,zh}/` | Generate (B4) | Markdown + frontmatter |
| `content/glossary/{en,zh}/` | Generate (B4) | Markdown + frontmatter |
| `content/faq/{en,zh}/` | Generate (B4) | Markdown + frontmatter |
| `content/compare/{en,zh}/` | Generate (B4) | Markdown + frontmatter |
| `content/topics/{en,zh}/` | Generate (B4) | Markdown + frontmatter |
| `data/filtered-items/` | Newsletter | JSON |
| `data/blog-seeds/` | Newsletter | JSON (legacy) |
| `data/flagship-packs/` | Flagship Discovery | JSON (subtopic packs, human-approved) |

## Orchestration (`daily-pipeline.sh`)

All pipeline steps run through `daily-pipeline.sh`, which provides:

- **Locking**: `flock` prevents concurrent pipeline steps (cron overlap protection)
- **Git pull**: Auto-pulls latest code before each step (3 retries)
- **Step dispatch**: `daily-pipeline.sh {step}` routes to the correct script
- **Validation**: Runs `validate-pipeline.ts` after Collect and Newsletter steps
- **Git commit+push**: Auto-commits content outputs and pushes (triggers Vercel deploy)
- **Email send**: Newsletter step sends EN+ZH emails via Buttondown after validation

Legacy steps (`blog`, `seo`) are preserved for manual/fallback use but print deprecation warnings.

## Dashboard API Server

Hono server (`server/index.ts`, port 3001) running on VPS via pm2:

| Endpoint | Purpose |
|----------|---------|
| `POST /api/subscribe` | Email signup (rate-limited, syncs to Buttondown) |
| `GET /api/subscribers/count` | Subscriber count |
| `GET /api/health` | Health check |
| `GET /api/dashboard/health` | Pipeline stage health (6 stages, green/yellow/red) |
| `GET /api/dashboard/topics` | Topic coverage metrics (keywords, groups, queue) |
| `GET /api/dashboard/topics-tree` | Hierarchical topic tree (flagship topics + subtopics + keyword groups) |
| `GET /api/dashboard/gsc` | Google Search Console data (cached, 8-day staleness) |
| `GET /api/dashboard/activity` | Recent content + queue activity |
| `GET /api/dashboard/trends` | Weekly performance trends (from snapshots table) |
| `GET /api/dashboard/queue` | Content generation queue detail |
| `GET /api/dashboard/coverage` | Keyword coverage gap analysis |
| `GET /api/dashboard/report` | Markdown/JSON health report |

Dashboard URL: `https://loreai.dev/dashboard?key=aeodashboard`

## External APIs

| API | Used by | Purpose |
|-----|---------|---------|
| Claude CLI (Opus) | Newsletter, Generate (B4), Weekly | Content generation |
| Claude CLI (Sonnet) | Entity Extract, Keyword Grouping (B2), Flagship Discovery, Flagship Freshness | Classification, extraction, synthesis, event routing |
| Serper | Discovery (B1), Generate (B4) | Google SERP data, PAA, related searches |
| Exa.ai | Discovery (B1), Generate (B4) | Semantic search, competitor page scan |
| Gemini Deep Research | Generate (B4) | Deep research pipeline (optional) |
| Buttondown | Newsletter | Email delivery (EN + ZH) |
| Twitter API (twitterapi.io) | Collect | Tweet collection (36 accounts + 18 queries) |
| GitHub API | Collect | Trending repos, releases |
| HuggingFace API | Collect | Trending models |
| Google Search Console | Performance | Click/impression/position data |

## Timezone

- Cron runs in UTC on the VPS; all times above are SGT (UTC+8)
- `TZ=Asia/Singapore` is set in crontab header
- SQLite `CURRENT_TIMESTAMP` stores UTC
- All scripts use `todaySGT()` from `scripts/lib/date.ts` as fallback date
- DB queries comparing dates apply `'+8 hours'` offset to convert UTC -> SGT
