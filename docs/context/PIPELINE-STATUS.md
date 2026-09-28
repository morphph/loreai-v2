---
title: "Pipeline Status"
status: active
category: guide
last-updated: 2026-09-28
depends-on: []
---

# Pipeline Status

> Status of each pipeline: scripts involved, trigger mechanism, current health.

## Verified operational snapshot — 2026-09-28

Read-only inspection found daily collection and newsletter schedules still installed. Collection records reached September 28, while the latest stored EN and ZH newsletters and generated files were dated August 9. Recent newsletter logs contained Claude CLI failures; the root cause has not been established. The older “Operational” labels below describe historical configuration, not a current health guarantee. Entity extraction, flagship freshness/discovery, content generation and keyword discovery schedules were commented out in production; performance and weekly schedules remained installed.

The production database is on the VPS; the local news database placeholder is empty. Local and production repository revisions differ, but the newsletter writer, database adapter, AI adapter, send script and scheduler matched by checksum at inspection time.

A newsletter-only Codex adapter has been implemented locally with Claude retained as the default. Codex requires an explicit model selection. It receives historical coverage as supplied text rather than executing history tools. Production scheduling, credentials, database and active runtime have not been changed. Mock tests establish adapter behavior only; a first real writer sample has now completed, while broader quality comparison and server rollout remain pending.

The repository lint gate now passes after correcting existing errors. A frozen set of 19 historical news items and both language prompts is prepared for a bounded writing evaluation. That evaluation saves local drafts and a validation report; it does not test selection, news freshness, outline generation, email rewriting or publishing. The user selected GPT-6 Sol with medium reasoning, but the local CLI's ChatGPT login rejected the model before generation on September 28. The desktop-bundled CLI has a newer model catalog including GPT-6 Sol; the local sample run successfully used that version, without changing the production runtime. English and Chinese drafts passed structural validation and each preserved all 19 source URLs. Initial editorial review found clear but cautious prose. The user subsequently accepted a seven-item Chinese preview using current news and manually verified selection. Production selection, full EN/ZH generation and delivery still require an isolated rehearsal. The runtime now explicitly fixes medium reasoning to match the accepted writing settings.

### Pre-launch recheck — September 28

The public English and Chinese archives also end on August 9; the September 28 edition is absent. The email service accepts authenticated read requests, but its returned delivery history ends on June 19. These are three distinct outcomes: current collection, stale website content, and older email delivery.

The server has no Codex installation or saved Codex login in the checked service-account locations. Its active newsletter still calls Claude and fails during generation; a deprecation warning accompanies the failures but is not sufficient to establish the underlying cause. The actual daily starts are 08:00 for collection and 10:00 for newsletter generation in Singapore time, as observed in logs; schedule comments claim different times. Both jobs run every day.

Launch remains blocked on a verified server runtime, a database backup/restore rehearsal, an isolated full newsletter run, and a controlled release with a rollback path. Publishing also needs explicit handling of repository upload failures and a fixed application version. Email additionally needs recipient-language verification and resumable duplicate-send prevention. Existing timers and the single-writer lock are present, but no working alert path was established in this inspection. That audit made no production changes. The user has since authorized website-only restoration; rollout is in progress. A consistent backup and restored read-back passed, the old daily newsletter timer is paused, and server GPT-6 Sol access is verified. The new fixed-release workflow omits email work. The isolated bilingual run completed, but editorial review found older articles resurfacing through aggregators. Original-article publication metadata checks and source-correct engagement labels are being validated before final activation. Final schedule and live-page acceptance are still pending.

## Pipeline Overview

```
12am    2am     4am    4:30am   6am     7:30am   8am     10am    5am     9pm
 |       |       |       |       |        |       |       |       |       |
Collect  News   Entity  Fresh   Generate  D1     Disc    Perf   Weekly  Review
(daily) (daily) (M-F)   (M-F)   (M-F)   (Sat)  (Tu+Sa) (Sat)  (Sun)  (M-F/Sun)
```

---

## 1. Data Collection Pipeline

| Attribute | Value |
|-----------|-------|
| Script | `scripts/collect-news.ts` |
| Schedule | Daily 12:00am SGT |
| Trigger | Cron via `daily-pipeline.sh collect` |
| Status | **Operational** |

**What it does**: Collects AI news from 7 source tiers in parallel:
- Tier 0: 14 RSS feeds (~35 items)
- Tier 1: 9 official blogs (Anthropic News, Anthropic Engineering, Claude Blog, Platform Release Notes, Claude Apps Release Notes, OpenAI Releases, DeepMind, Google AI, HuggingFace) (~25 items)
- Tier 2: Twitter/X — 38 accounts + 18 search queries (~80 items)
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
| Schedule | Daily 2:00am SGT |
| Trigger | Cron via `daily-pipeline.sh newsletter` |
| Status | **Operational** |

**Stages**:
1. DB query (72h window)
2. Pre-filter (hard caps per source type)
3. 3-tier agent filter (Claude Opus → single-shot → rule-based fallback) + cross-day dedup
3b. Outline generation (Claude Opus)
4. EN newsletter (Claude Opus + `skills/newsletter-en/`)
5. ZH newsletter (Claude Opus → Claude Sonnet fallback (or explicitly selected Codex runtime) + `skills/newsletter-zh/`)
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

**What it does**: Routes daily news signals to approved flagship subtopics. New pre-filter step: Claude Sonnet classifies each signal's relevance to the flagship topic before routing. Reads approved subtopic-pack, maps events to existing subtopics/pages, drafts refresh/create actions.

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

**What it does**: Reads top-N jobs from `create_queue` by priority score. For each job: research (Serper + Exa, or Gemini Deep Research) → Claude writes EN → Claude writes ZH → validate links → write files + update DB. Model map: Opus for all content types except FAQ/Glossary (Sonnet 4.6). Word counts significantly increased based on competitive analysis (e.g., comparison blogs 4000-5000w, topic hubs 3000-5000w, deep-dives 5000-8000w).

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

**Orchestrates**: C1 → B1 → B2 → B3 pipeline (scoped to flagship topics only):
- **C1**: Load subtopics (prefers flagship packs when available)
- **B1**: Keyword expansion via `expand-keywords.ts` (Serper PAA + Autocomplete only; Exa competitor scan and related searches removed)
- **B2**: Intent grouping via `group-keywords.ts` (Claude Sonnet 4.6, auto-downgrade to Haiku for <20 keywords; passes subtopic context including description and aliases)
- **B3**: Priority scoring via `score-and-queue.ts` (flagship-only guard: only processes groups under flagship topic clusters)

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
