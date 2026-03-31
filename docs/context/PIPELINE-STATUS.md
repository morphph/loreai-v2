---
title: "Pipeline Status"
status: active
category: guide
last-updated: 2026-03-31
depends-on: []
---

# Pipeline Status

> Status of each pipeline: scripts involved, trigger mechanism, current health.

## Pipeline Overview

```
12am    2am     4am    4:30am   6am     7:30am   8am     10am    5am     9pm
 |       |       |       |       |        |       |       |       |       |
Collect  News   Entity  Fresh   Generate  D1     Disc    Perf   Weekly  Review
(M-F)   (M-F)  (M-F)   (M-F)   (M-F)   (Sat)  (Tu+Sa) (Sat)  (Sun)  (M-F/Sun)
```

---

## 1. Data Collection Pipeline

| Attribute | Value |
|-----------|-------|
| Script | `scripts/collect-news.ts` |
| Schedule | Mon-Fri 12:00am SGT |
| Trigger | Cron via `daily-pipeline.sh collect` |
| Status | **Operational** |

**What it does**: Collects AI news from 7 source tiers in parallel:
- Tier 0: 14 RSS feeds (~35 items)
- Tier 1: 6 official blogs (~25 items)
- Tier 2: Twitter/X — 36 accounts + 18 search queries (~80 items)
- Tier 3a: GitHub Trending (~130 items)
- Tier 3b: GitHub Releases — 18 tracked repos (~16 items)
- Tier 3c: HuggingFace — trending + top-7d (~50 items)
- Tier 4: Hacker News — Firebase API, AI filter (~7 items)
- Tier 5: Reddit — 4 subreddits (~23 items)
- Tier 6: YouTube (stub — Phase 2)

**Output**: `news_items` table. ~300 raw → ~250 after URL-based dedup.
**Validation**: `validate-pipeline.ts --step=collect` runs after.

---

## 2. Newsletter Pipeline

| Attribute | Value |
|-----------|-------|
| Script | `scripts/write-newsletter.ts` |
| Schedule | Mon-Fri 2:00am SGT |
| Trigger | Cron via `daily-pipeline.sh newsletter` |
| Status | **Operational** |

**Stages**:
1. DB query (72h window)
2. Pre-filter (hard caps per source type)
3. 3-tier agent filter (Claude Opus → single-shot → rule-based fallback) + cross-day dedup
3b. Outline generation (Claude Opus)
4. EN newsletter (Claude Opus + `skills/newsletter-en/`)
5. ZH newsletter (Claude Opus → Kimi K2.5 → Claude Sonnet fallback + `skills/newsletter-zh/`)
6. Blog seed extraction (legacy)
7. Persist & publish (git commit+push, Buttondown send EN+ZH)

**Output**: `content/newsletters/{en,zh}/YYYY-MM-DD.md`, `data/filtered-items/YYYY-MM-DD.json`
**Validation**: `validate-pipeline.ts --step=newsletter` runs after.
**Related scripts**: `send-newsletter.ts` (re-send), `preview-email.ts` (preview HTML)

---

## 3. Entity Extraction Pipeline

| Attribute | Value |
|-----------|-------|
| Script | `scripts/extract-entities.ts` |
| Schedule | Mon-Fri 4:00am SGT |
| Trigger | Cron via `daily-pipeline.sh extract` |
| Status | **Operational** |

**What it does**: Claude Sonnet extracts companies, model names, tech concepts, frameworks from all news items in last 30h. Upserts into `topic_clusters` table.

**D2 Guard**: Skips entities matching flagship subtopics (`isFlagshipSubtopic` 3-layer check: slug match, pillar_topic match, alias match).

**Output**: `topic_clusters` table updates (non-flagship entities only).

---

## 4. Flagship Freshness Pipeline

| Attribute | Value |
|-----------|-------|
| Script | `scripts/flagship-freshness.ts` |
| Schedule | Mon-Fri 4:30am SGT |
| Trigger | Cron via `daily-pipeline.sh freshness` |
| Status | **Operational** (since 2026-03-27) |

**What it does**: Routes daily news signals to approved flagship subtopics. Reads approved subtopic-pack, maps events to existing subtopics/pages, drafts refresh/create actions.

**Dedup**: Triple dedup — vs create_queue, vs recent content, vs same-run duplicates.
**Output**: `create_queue` entries with `source='flagship_fresh'`, keyword seeds via `upsertKeyword()`.

---

## 5. Content Generation Pipeline

| Attribute | Value |
|-----------|-------|
| Script | `scripts/process-queue.ts` |
| Schedule | Mon-Fri 6:00am SGT |
| Trigger | Cron via `daily-pipeline.sh generate` |
| Status | **Operational** |

**What it does**: Reads top-N jobs from `create_queue` by priority score. For each job: research (Serper + Exa, or Gemini Deep Research) → Claude Opus writes EN → Claude Opus writes ZH → validate links → write files + update DB.

**Content types**: faq, compare, glossary, blog, topic-hub, deep-dive, cornerstone
**Output**: Content files in `content/{type}/{en,zh}/slug.md`, `content` table updates.

---

## 6. Flagship Discovery Pipeline

| Attribute | Value |
|-----------|-------|
| Script | `scripts/flagship-discovery.ts` |
| Schedule | Saturday 7:30am SGT |
| Trigger | Cron via `daily-pipeline.sh flagship-discovery` |
| Status | **Operational** (since 2026-03-27) |

**What it does**: Weekly full discovery — synthesizes official docs + competitor content into subtopic-pack via Exa + Serper.

**Steps**: Official surface synthesis → SERP/competitor synthesis → normalize & merge → write draft pack to `data/flagship-packs/`.
**Human gate**: Requires `--approve` flag to materialize pack into `topic_clusters`.
**Output**: Draft/approved subtopic packs, `topic_clusters` entries with `source='flagship_discovery'`.

---

## 7. Discovery Cycle (Keyword Engine)

| Attribute | Value |
|-----------|-------|
| Script | `scripts/discovery-cycle.ts` |
| Schedule | Tuesday + Saturday 8:00am SGT |
| Trigger | Cron via `daily-pipeline.sh discovery` |
| Status | **Operational** |

**Orchestrates**: C1 → B1 → B2 → B3 pipeline:
- **C1**: Load subtopics (prefers flagship packs when available)
- **B1**: Keyword expansion via `expand-keywords.ts` (Serper + Exa)
- **B2**: Intent grouping via `group-keywords.ts` (Claude)
- **B3**: Priority scoring via `score-and-queue.ts`

**Output**: `keywords`, `keyword_groups`, `create_queue` entries.

---

## 8. Performance Cycle

| Attribute | Value |
|-----------|-------|
| Script | `scripts/performance-cycle.ts` |
| Schedule | Saturday 10:00am SGT |
| Trigger | Cron via `daily-pipeline.sh performance` |
| Status | **Operational** |

**Stages**: GSC data import (28-day window) → page segmentation by CTR/impressions/position → anomaly detection → queue underperforming pages for refresh.

**Output**: `snapshots` table, refresh jobs in `create_queue`.

---

## 9. Weekly Digest Pipeline

| Attribute | Value |
|-----------|-------|
| Script | `scripts/write-weekly.ts` |
| Schedule | Sunday 5:00am SGT |
| Trigger | Cron via `daily-pipeline.sh weekly` |
| Status | **Operational** |

**What it does**: Aggregates Mon-Fri newsletters, ranks stories by frequency + engagement + agent_score, picks top 5. Claude Opus writes 200-400 word analysis per story.

**Output**: `content/newsletters/weekly/{en,zh}/YYYY-WXX.md`

---

## 10. Review Cycle (Removed)

Removed 2026-03-31. C5 review cycle produced passive reports with no automated consumers or feedback loops. Scripts preserved at `scripts/review-cycle.ts` for manual use if needed.

---

## 11. Video Pipeline

| Attribute | Value |
|-----------|-------|
| Scripts | `pick-video-candidates.ts`, `import-video-blog.ts`, `update-video-status.ts` |
| Schedule | Manual (not cron-automated) |
| Status | **Phase 2 — scripts exist, not automated** |

See `docs/guides/VIDEO-PIPELINE.md` for details.

---

## Supporting Scripts (Manual/Utility)

| Script | Purpose |
|--------|---------|
| `send-newsletter.ts` | Re-send newsletter via Buttondown |
| `preview-email.ts` | Preview email HTML in browser |
| `subscriber-report.ts` | Generate subscriber source report (HTML) |
| `validate-pipeline.ts` | Check outputs of each pipeline stage |
| `vps-smoke-test.ts` | Pre-deployment environment checks |
| `validate-narrative.ts` | Validate narrative JSON schema |
| `write-topic-blog.ts` | Manual topic blog pipeline (Gemini → EN/ZH) |
| `backfill-*.ts` | One-time migration/backfill scripts |
| `migrate-flagship-tags.ts` | One-time migration script |
