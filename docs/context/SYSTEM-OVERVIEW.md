---
title: "System Overview"
status: active
category: guide
last-updated: 2026-03-31
depends-on: []
---

# System Overview

> Self-contained context snapshot. Read this folder to understand LoreAI's current state without diving into specs.

## What LoreAI Is

Bilingual (EN/ZH) AI news platform with three pillars:
1. **Daily newsletter** (Mon-Fri) — curated AI news digest
2. **Deep blog posts** — SEO-optimized technical content
3. **SEO/AEO flywheel** — programmatic glossary, FAQ, compare, and topic hub pages

Domain: **loreai.dev**

## Tech Stack

| Layer | Choice |
|-------|--------|
| Framework | Next.js 16 (App Router, SSG) |
| Styling | Tailwind CSS v4 |
| Language | TypeScript |
| Database | SQLite (better-sqlite3), VPS only |
| AI Primary | Claude Opus via Anthropic API |
| AI Fallback | Kimi K2.5 (ZH newsletter only) → Claude Sonnet |
| Search APIs | Serper (SERP data), Exa.ai (semantic search) |
| Deep Research | Gemini Deep Research (Python worker) |
| Email | Buttondown (EN + ZH) |
| Data Sources | RSS, Twitter/X, GitHub, HuggingFace, HN, Reddit |
| Hosting | Vercel (frontend, free tier) + VPS Ubuntu (pipelines) |

## Architecture

```
VPS (Ubuntu, ssh loreai)                    Vercel (CDN)
┌──────────────────────────┐               ┌──────────────────┐
│  Cron → daily-pipeline.sh │               │  Next.js SSG     │
│  ├── collect-news.ts      │   git push    │  ├── /newsletter │
│  ├── write-newsletter.ts  │──────────────>│  ├── /blog       │
│  ├── extract-entities.ts  │  (triggers    │  ├── /glossary   │
│  ├── flagship-freshness.ts│   rebuild)    │  ├── /faq        │
│  ├── process-queue.ts     │               │  ├── /compare    │
│  ├── discovery-cycle.ts   │               │  ├── /topics     │
│  ├── performance-cycle.ts │               │  └── /dashboard  │
│                            │               │      (proxy→VPS) │
│                            │               └──────────────────┘
│  Hono API server (pm2)    │
│  └── port 3001             │
│      /api/dashboard/*      │
│      /api/subscribe        │
│      /api/health           │
│                            │
│  SQLite: loreai.db         │
└──────────────────────────┘
```

Content is Markdown with YAML frontmatter. Git push triggers Vercel SSG rebuild. Zero hosting cost for frontend.

## Core Pipeline (Daily, Mon-Fri)

| Time (SGT) | Step | Script |
|------------|------|--------|
| 12:00am | Collect news (7 source tiers) | `collect-news.ts` |
| 2:00am | Write newsletter (EN+ZH) | `write-newsletter.ts` |
| 4:00am | Extract entities | `extract-entities.ts` |
| 4:30am | Flagship freshness routing | `flagship-freshness.ts` |
| 6:00am | Generate content from queue | `process-queue.ts` |

Weekly additions: Flagship Discovery (Sat 7:30am), Discovery Cycle (Tue+Sat 8am), Performance Cycle (Sat 10am), Weekly Digest (Sun 5am).

## Keyword Engine (Core Content Driver)

The keyword engine replaced legacy blog/SEO generation with a data-driven pipeline:

```
topic_clusters → B1 Expansion → B2 Grouping → B3 Scoring → B4 Generation
                 (Serper+Exa)    (Claude)       (priority)    (Claude+research)
                     ↓               ↓              ↓              ↓
                 keywords      keyword_groups   create_queue    content files
```

Two research pipelines:
- **Standard**: Serper SERP + Exa semantic search → Claude + skill (for FAQ, compare, glossary, topic-hub, news blog)
- **Deep Research**: Gemini Deep Research → Claude + skill (for deep-dive blog, cornerstone)

## Flagship Topic System

Flagship topics are manually curated topics that receive full cluster investment (20-30+ coordinated pages). Currently active: **Claude Code**, **Codex**.

The system operates on two layers:
1. **Architecture layer** — defines cluster structure: Flagship Topic → Subtopics → Keyword Groups → Pages
2. **Execution layer** — decides what to build next via priority scoring (volume × 1/competition × intent + timeliness)

Weekly Discovery (D1) synthesizes subtopics from official docs + competitors. Daily Freshness routes news signals to existing subtopics. Human approval required for subtopic packs.

## Key Database Tables

| Table | Purpose |
|-------|---------|
| `news_items` | Raw collected articles from all source tiers |
| `content` | Published content metadata (type, slug, lang) |
| `topic_clusters` | Entities and flagship subtopics |
| `keywords` | Expanded keywords with search volume, competition |
| `keyword_groups` | Keywords grouped by search intent |
| `create_queue` | Unified content generation queue (priority-sorted) |
| `snapshots` | GSC performance data |
| `subscribers` | Newsletter subscriber list |

## Dashboard

URL: `https://loreai.dev/dashboard?key=aeodashboard`

13 components providing: pipeline health (6-stage green/yellow/red), topic coverage metrics, hierarchical topic tree, GSC data, activity feed, performance trends, queue status, coverage gap analysis.

Frontend proxies to VPS API server with 5-min ISR cache.

## Content Output Structure

```
content/
├── newsletters/{en,zh}/YYYY-MM-DD.md     # Daily
├── newsletters/weekly/{en,zh}/YYYY-WXX.md # Weekly
├── blog/{en,zh}/slug.md                   # Deep blogs
├── glossary/{en,zh}/term.md               # Definitions
├── faq/{en,zh}/slug.md                    # Long-tail Q&A
├── compare/{en,zh}/slug.md                # Product comparisons
└── topics/{en,zh}/slug.md                 # Topic hub pages
```

## Skills (Prompt Engineering Vault)

16 production skills in `skills/*/SKILL.md` — battle-tested prompts for content generation. Categories: newsletter (EN/ZH/weekly/outline), email (EN/ZH), blog (EN/ZH/topic), SEO (create/refresh), entity extraction, keyword grouping, flagship freshness, video-to-blog.

See `docs/context/SKILLS-INDEX.md` for the full index.

## Related Documentation

- **Strategy**: `docs/specs/STRATEGY.md` — north star strategic document
- **Pipeline details**: `docs/specs/PIPELINE.md` — complete schedule and data flow
- **Operations**: `docs/guides/DEPLOY.md` — deployment and VPS operations
- **Current state**: `docs/context/CURRENT-STATE.md`
- **Key decisions**: `docs/context/KEY-DECISIONS.md`
