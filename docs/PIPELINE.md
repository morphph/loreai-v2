# Pipeline Architecture

## Overview

Daily automated pipeline: collect raw AI news → curate newsletter → write deep blogs → generate SEO pages.
Each stage feeds the next with increasingly refined data.

## Schedule (SGT, Mon-Fri unless noted)

| Time | Step | Script |
|------|------|--------|
| 4:00am | Collect | `collect-news.ts` |
| 5:00am | Newsletter | `write-newsletter.ts` |
| 6:30am | Entity Extract | `extract-entities.ts` |
| 7:00am | Blog | `write-blog.ts` |
| 9:00am | SEO | `generate-seo.ts` |
| Sat 5:00am | Weekly Digest | `write-weekly.ts` |

## Pipeline Flow

```
4am SGT
+-----------------------------------------------------------+
|  1. COLLECT  (collect-news.ts)                            |
|                                                           |
|  6 tiers of data sources, collected in parallel:          |
|  Tier 0: RSS (TechCrunch, Verge, Wired etc, 14 feeds)    |
|  Tier 1: Official Blogs (DeepMind, Google AI, HuggingFace)|
|  Tier 2: Twitter/X (36 accounts + 18 search queries)     |
|  Tier 3: GitHub Trending + Releases + HuggingFace models  |
|  Tier 4: Hacker News                                     |
|  Tier 5: Reddit                                          |
|                                                           |
|  -> Deduplicate -> Insert into SQLite (~800 items/day)    |
+-----------------------------+-----------------------------+
                              |
                              v
5am SGT
+-----------------------------------------------------------+
|  2. NEWSLETTER  (write-newsletter.ts)                     |
|                                                           |
|  Stage 1: Query DB for all items in last 72 hours         |
|  Stage 2: Pre-filter (hard caps per source type)          |
|  Stage 3: Claude Opus smart filter -> pick 18-22 best     |
|           + cross-day dedup (compare past 7 issues)       |
|  Stage 4: Claude Opus writes EN newsletter                |
|  Stage 5: Claude Opus writes ZH newsletter                |
|           (independent creation, NOT translation)         |
|  Stage 6: Extract Blog Seeds  <-- KEY OUTPUT              |
|           (pick topics worth deep analysis)               |
|           Scoring: X engagement + Brave search + mentions |
|  Stage 7: Update Topic Clusters (rule-based, no AI)       |
|  Stage 8: Save files + send emails                        |
|                                                           |
|  Outputs:                                                 |
|  +-- content/newsletters/en/YYYY-MM-DD.md                |
|  +-- content/newsletters/zh/YYYY-MM-DD.md                |
|  +-- data/filtered-items/YYYY-MM-DD.json                 |
|  +-- data/blog-seeds/YYYY-MM-DD.json  <-- for Blog step  |
+--------------+----------------------------+---------------+
               |                            |
               v                            v
6:30am SGT                           7am SGT
+--------------------------+   +-----------------------------+
| 3. EXTRACT ENTITIES      |   | 4. BLOG  (write-blog.ts)   |
| (extract-entities.ts)    |   |                            |
|                          |   | Read blog-seeds JSON       |
| From recent 72h items,   |   | Pick top 3 by score        |
| Claude extracts:         |   |                            |
| - Company names          |   | For each seed:             |
| - Model names            |   | -> Claude Opus writes EN   |
| - Tech concepts          |   | -> Claude Opus writes ZH   |
| - Frameworks/products    |   | -> Extract SEO entities:   |
|                          |   |    glossary_terms          |
| -> Cluster into          |   |    faq_questions           |
|    topic_clusters table  |   |    comparison_pairs        |
| -> Brave Search expands  |   | -> Save to keywords table  |
|    new topic context     |   |                            |
|                          |   | Outputs:                   |
| Output: DB updates       |   | +-- content/blog/en/xxx.md |
| (topic_clusters,         |   | +-- content/blog/zh/xxx.md |
|  keywords tables)        |   +-------------+--------------+
+-----------+--------------+                 |
            |                                |
            +---------------+----------------+
                            |
                            v
9am SGT
+-----------------------------------------------------------+
|  5. SEO  (generate-seo.ts)                                |
|                                                           |
|  Data sources:                                            |
|  - keywords table (from Blog's extracted entities)        |
|  - topic_clusters table (from Entity Extraction)          |
|                                                           |
|  Gap Analysis: find keywords without content yet          |
|  -> Generate up to 5 pages/day (EN + ZH each)            |
|                                                           |
|  4 page types:                                            |
|  +-- glossary/  "What is X"                              |
|  +-- faq/       "X frequently asked questions"           |
|  +-- compare/   "X vs Y"                                |
|  +-- topics/    Topic hub (pillar page)                  |
|                                                           |
|  Claude Opus generates -> validate -> write -> update DB  |
+-----------------------------------------------------------+

Saturday 5am SGT
+-----------------------------------------------------------+
|  6. WEEKLY  (write-weekly.ts)                             |
|                                                           |
|  Aggregate Mon-Fri newsletters                            |
|  Pick 5 most important stories                            |
|  Write 200-400 word analysis per story                    |
|  "5 Things That Mattered in AI This Week"                 |
+-----------------------------------------------------------+
```

## Data Flow Summary

```
Collect -> SQLite (raw items)
               |
Newsletter -> curated items -> blog-seeds JSON -> Blog
               |                                    |
          topic clusters                      keywords table
               |                                    |
          Entity Extract                       SEO Pages
               |                            (glossary/faq/
          topic_clusters table               compare/topics)
               |
          SEO Pages (topic hubs)
```

**Collect is raw material. Newsletter is the filter. Blog consumes Newsletter's byproduct. SEO consumes Blog's and Entity's byproducts.** Each layer refines the input for the next.

## Key Database Tables

| Table | Written by | Read by |
|-------|-----------|---------|
| `news_items` | Collect | Newsletter, Entity Extract |
| `content` | Newsletter, Blog, SEO | SEO (gap analysis) |
| `content_sources` | Newsletter, Blog | (traceability) |
| `keywords` | Blog, SEO | SEO (gap analysis) |
| `topic_clusters` | Entity Extract, SEO | SEO (topic hubs) |
| `subscribers` | API server | Newsletter (send) |

## Key File Outputs

| Directory | Written by | Format |
|-----------|-----------|--------|
| `content/newsletters/{en,zh}/` | Newsletter | Markdown + frontmatter |
| `content/newsletters/weekly/{en,zh}/` | Weekly | Markdown + frontmatter |
| `content/blog/{en,zh}/` | Blog | Markdown + frontmatter |
| `content/glossary/{en,zh}/` | SEO | Markdown + frontmatter |
| `content/faq/{en,zh}/` | SEO | Markdown + frontmatter |
| `content/compare/{en,zh}/` | SEO | Markdown + frontmatter |
| `content/topics/{en,zh}/` | SEO | Markdown + frontmatter |
| `data/filtered-items/` | Newsletter | JSON |
| `data/blog-seeds/` | Newsletter | JSON |
| `data/review/` | Review | HTML |

## Timezone

- Cron runs in UTC on the VPS; all times above are SGT (UTC+8)
- SQLite `CURRENT_TIMESTAMP` stores UTC
- All scripts use `todaySGT()` from `scripts/lib/date.ts` as fallback date
- DB queries comparing dates apply `'+8 hours'` offset to convert UTC -> SGT
