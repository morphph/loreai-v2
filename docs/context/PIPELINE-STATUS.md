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

Daily English and Chinese website publication has been restored with the user's authorization. The September 28 editions were generated with GPT-6 Sol and medium reasoning, uploaded, and verified on both public pages at 16:43 Singapore time. Each edition covers 18 selected items. This is a completed website publication, not just a successful generation or upload. Subscriber email generation and sending are disabled in the restored daily workflow.

The next scheduled run is September 29: collection starts at 08:00 and newsletter generation starts at 10:00 Singapore time, every day including weekends. Website publication follows generation, validation and hosting deployment; 10:00 is the start time, not a guaranteed appearance time. The two daily timers were installed and read back, the old daily jobs are inactive, and the server scheduler is active. Execution stays on a fixed tested application release; normal repository updates do not silently replace it. A shared lock prevents simultaneous pipeline writers.

The production database remains on the VPS. A consistent backup and a disposable restored copy both passed integrity checks and matched table counts before the switch. Server model authentication and exact model access were verified. An isolated full bilingual rehearsal exposed stale articles resurfacing through aggregators; the released workflow now checks available original publication metadata and correctly labels Hacker News points/comments. Unknown publication dates still need editorial judgment.

Today's production writer saved both language records with Codex model provenance. Website validation passed; repeated daily-pick links and the intentionally omitted blog-seed file generated non-blocking warnings. The optional outline generator exhausted its headline validation retries; the existing free-form writer fallback completed both editions. This is a known quality/reliability follow-up, not a failed publication. The full offline suite passed 929 tests, with 30 external-service integration tests not enabled; production build, lint and historical content validation passed.

A daily 11:00 Singapore-time Codex check is configured to read server status and both live pages, report the first scheduled success, and then notify on meaningful failures or recovery. This follow-up requires its Codex host to be available; production publishing itself runs on the VPS independently. Status records distinguish generated, uploaded, verified and failed runs. Publication-only retries reuse validated drafts; partial generation or repository conflicts require inspection rather than blind regeneration.

Before restoration, collection was current but both website archives ended on August 9, and the old newsletter logs showed Claude CLI failures. That legacy path is not a verified rollback for availability. Rollback retains the backup, generated artifacts and previous launch configuration; reverting code does not overwrite newer database data.

Other pipeline schedules were not expanded by this rollout. Entity extraction, flagship freshness/discovery, content generation and keyword discovery remain paused in the inspected configuration. Performance and weekly jobs retain their existing schedules and runtime; their old “Operational” labels below are historical descriptions, not acceptance results from this daily-website rollout.

## Historical Pipeline Overview

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
| Schedule | Daily 08:00 SGT |
| Trigger | Fixed-release daily website scheduler |
| Status | Collection verified September 28; replacement timer active |

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
| Schedule | Daily 10:00 SGT generation start |
| Trigger | Fixed-release daily website scheduler |
| Status | September 28 EN/ZH pages verified live; daily timer active |

**Active daily stages**:
1. Query recent news, enforce age filters and check available original publication dates.
2. Select with GPT-6 Sol, historical coverage and cross-day deduplication; existing filter fallbacks remain.
3. Attempt an outline, then independently write EN and ZH with GPT-6 Sol / medium. Validated free-form writing is the fallback if the optional outline fails.
4. Validate and save both editions with a recovery receipt.
5. Upload only the two website editions and verify their live page titles.

Daily email rewriting/sending and blog-seed generation are omitted from this workflow.

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
