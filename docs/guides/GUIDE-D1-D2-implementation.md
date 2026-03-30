---
title: "Implementation Guide: D1 + D2 Flagship Discovery"
status: active
category: guide
last-updated: 2026-03-27
depends-on: ["SPEC-D1", "SPEC-D2"]
---

# Implementation Guide: D1 + D2 (Flagship Topic Discovery)

Copy-paste each prompt into a fresh Claude Code conversation. Complete one phase, verify it works, clear, then move to the next.

---

## Phase 1 — Foundation (DB + subtopic-pack.ts)

**What you get:** Schema migration + all pack CRUD/materialization logic + unit tests. No scripts that actually run discovery yet.

```
Implement SPEC-D1 Phase 1: the foundation layer for flagship topic discovery.

Reference specs (read these first):
- docs/specs/migration/SPEC-D1-flagship-topic-discovery.md — §5 (artifacts), §8 (CLI approval), §9 (materialization), §10 (DB schema)
- docs/specs/migration/SPEC-D2-migration-sunset.md — §2 Phase 1

Scope:
1. DB schema migration in scripts/lib/db.ts — add 3 columns via safe ALTER pattern:
   - topic_clusters.source (TEXT DEFAULT 'entity_extract')
   - topic_clusters.flagship_topic_slug (TEXT DEFAULT NULL)
   - create_queue.source (TEXT DEFAULT 'discovery')

2. New file: scripts/lib/subtopic-pack.ts — all pack operations:
   - TypeScript interfaces: SubtopicPack, Subtopic, GapReport, QueueDraft, QueueDraftItem, EventRouting, EventRoutingResult, MaterializationResult
   - loadPack(topicSlug) — read JSON from data/flagship-packs/{slug}.json, validate, return
   - writePack(pack) — write JSON to data/flagship-packs/{slug}.json
   - validatePack(pack) — check required fields, slug format, status values
   - computeDiff(newPack, oldPack) — compute added/removed/unchanged subtopics
   - materializePack(pack, opts) — write approved subtopics to topic_clusters (source='flagship_discovery', flagship_topic_slug set, mention_count=100) + seed keywords via upsertKeyword()
   - approvePack(topicSlug) — load draft, set status='approved' + approved_at, call materializePack(), print summary
   - isDuplicateQueueJob(keywordGroupId, primaryKeyword, contentType) — dedup check against create_queue

3. Create directory: data/flagship-packs/ (add .gitkeep)

4. Unit tests in tests/subtopic-pack.test.ts:
   - Pack read/write round-trip
   - validatePack catches missing fields
   - computeDiff correctly identifies added/removed/unchanged
   - isDuplicateQueueJob detects duplicates
   - materializePack writes correct rows (use in-memory SQLite)

Do NOT implement the discovery scripts, freshness scripts, or LLM prompts yet. Just the data layer and pack operations.

Quality gates: npm run build && npm test must pass.
After implementation: git add the new files, commit with descriptive message, push.
```

**Verify before moving on:**

```bash
npm run build && npm test
ls data/flagship-packs/.gitkeep
```

---

## Phase 2 — Full Discovery Script

**What you get:** A working script that synthesizes subtopics from official docs + competitors and writes a draft pack.

```
Implement SPEC-D1 Phase 2: the full discovery mode script.

Reference specs (read these first):
- docs/specs/migration/SPEC-D1-flagship-topic-discovery.md — §3.1 (CLI), §4 (config), §6 (full discovery pipeline), §8 (approval)
- scripts/lib/subtopic-pack.ts already exists from Phase 1 — use its types and functions

Scope:
1. New file: skills/flagship-discovery/SKILL-full.md
   - LLM system prompt for official + competitor synthesis
   - Input: list of official page titles/snippets + competitor page structures
   - Output: JSON array of subtopic candidates with fields: slug, name, description, aliases, evidence_type, freshness_sensitivity, page_type_hints, seed_keywords (5-15 per subtopic)
   - Instructions: normalize into durable concept buckets (not raw nav labels), assign evidence types, draft search-phrase keyword bundles (not marketing copy)

2. New file: scripts/lib/flagship-discovery.ts — core logic:
   - synthesizeOfficialSurfaces(topic, opts) — Exa semantic search + Serper site-scoped search for official docs → feed to Claude Sonnet with SKILL-full.md → return candidates
   - synthesizeCompetitors(topic, existingSubtopics, opts) — Serper broad search + Exa competitor content → Claude identifies gaps → return candidates + GapReport
   - normalizeAndMerge(officialCandidates, competitorCandidates, previousPack?) — deduplicate by slug (official wins), merge aliases, Claude Haiku drafts seed keywords, set freshness_sensitivity, compute diff
   - runFullDiscovery(topic, opts) — orchestrate steps 1-4: synthesize → merge → writePack(draft) → print summary

3. New file: scripts/flagship-discovery.ts — CLI entry point:
   - Args: --topic (optional, default all FLAGSHIP_TOPICS), --approve, --dry-run, --skip-serp
   - If --approve: call approvePack(topicSlug) from subtopic-pack.ts, then exit
   - Otherwise: call runFullDiscovery() for each topic
   - Import FLAGSHIP_TOPICS from scripts/lib/discovery.ts (already exists)

4. Use existing clients: import from scripts/lib/serper.ts (searchGoogle, searchRelated) and scripts/lib/exa.ts (searchSemantic, getContents). Use callClaudeWithRetry from scripts/lib/ai.ts.

Quality gates: npm run build && npm test must pass.
Smoke test: npx tsx scripts/flagship-discovery.ts --topic=claude-code --dry-run
After implementation: commit + push.
```

**Verify before moving on:**

```bash
npm run build && npm test
npx tsx scripts/flagship-discovery.ts --topic=claude-code --dry-run
```

---

## Phase 3 — Freshness Script

**What you get:** A working daily script that routes news events to existing subtopics and writes queue drafts.

```
Implement SPEC-D1 Phase 3: the daily freshness mode script.

Reference specs (read these first):
- docs/specs/migration/SPEC-D1-flagship-topic-discovery.md — §3.2 (CLI), §7 (freshness pipeline), §11 (dedup)
- scripts/lib/subtopic-pack.ts already exists — use loadPack(), isDuplicateQueueJob()

Scope:
1. New file: skills/flagship-freshness/SKILL.md
   - LLM system prompt for event-to-subtopic routing
   - Input: list of fresh news signals + approved subtopic pack (names, descriptions, slugs) + existing content inventory (slugs, titles)
   - Output: JSON array of EventRouting objects — for each signal: target_subtopics (array, one-to-many), target_pages (existing slugs to refresh), action (refresh/create/refresh_and_create/ignore), reasoning
   - Critical instruction: must NOT propose new subtopics, only map to existing approved ones
   - Must handle fan-out: one event can affect multiple subtopics/pages

2. New file: scripts/lib/flagship-freshness.ts — core logic:
   - loadFreshSignals(topicSlug, pack, lookbackHours) — load recent news_items via getAllRecentNewsItems(), filter by keyword match against topic name + subtopic names from pack
   - loadExistingContent(topicSlug) — load content table entries for this topic's cluster slugs (for refresh targeting)
   - routeEventsToSubtopics(signals, pack, existingContent, opts) — batch signals (max 20 per call), call Claude Sonnet with SKILL.md, validate target slugs against pack, calculate timeliness_hours
   - generateQueueDrafts(routings, topicSlug, opts) — convert routings to QueueDraftItems, run dedup (isDuplicateQueueJob + check recent content within 7 days + merge same-subtopic drafts within run)
   - writeQueueDrafts(drafts, opts) — for create: seed keywords via upsertKeyword() if needed, for refresh: write to create_queue with refresh_meta JSON and source='flagship_freshness'
   - runFreshnessMode(topic, opts) — orchestrate: load pack (must be approved, skip if not) → load signals → route → draft → write → print summary

3. New file: scripts/flagship-freshness.ts — CLI entry point:
   - Args: --topic (optional, default all topics with approved packs), --hours (default 30), --dry-run
   - For each topic: call runFreshnessMode()

4. Use existing: getAllRecentNewsItems() from db.ts, upsertKeyword() from db.ts, callClaudeWithRetry from ai.ts.

Quality gates: npm run build && npm test must pass.
Smoke test: npx tsx scripts/flagship-freshness.ts --topic=claude-code --dry-run
After implementation: commit + push.
```

**Verify before moving on:**

```bash
npm run build && npm test
npx tsx scripts/flagship-freshness.ts --topic=claude-code --dry-run
```

---

## Phase 4 — Cron Integration + Observability

**What you get:** Both scripts integrated into the daily pipeline cron, snapshot metrics written after each run, C5 health checks for pack status.

```
Implement SPEC-D1 Phase 4: cron integration and observability.

Reference specs (read these first):
- docs/specs/migration/SPEC-D1-flagship-topic-discovery.md — §12 (cron), §13 (observability)

Scope:
1. scripts/daily-pipeline.sh — add two new cron steps:
   - After extract (4:00am SGT), add flagship freshness at 4:30am SGT slot:
     npx tsx scripts/flagship-freshness.ts
   - Saturday only, before existing discovery cycle (8:00am), add full discovery at 7:30am SGT:
     npx tsx scripts/flagship-discovery.ts
   - Both should: tee to log file, record exit code, git add + commit data/flagship-packs/ changes

2. Observability — add snapshot writes at end of each script:
   - flagship-discovery.ts: write to snapshots table (metric_group='flagship_discovery'):
     approved_packs, total_subtopics, draft_packs
   - flagship-freshness.ts: write to snapshots table (metric_group='flagship_freshness'):
     events_processed, events_routed, events_ignored, queue_drafts_created, queue_drafts_deduped

3. C5 health checks — add to scripts/lib/review.ts:
   - Check each FLAGSHIP_TOPICS has a pack file
   - Warn if pack status is 'draft' (not yet approved)
   - Warn if pack approved_at is older than 14 days
   - Count flagship_discovery vs entity_extract source in topic_clusters (metric_group='flagship_migration')

Quality gates: npm run build && npm test must pass.
After implementation: commit + push.
```

**Verify before moving on:**

```bash
npm run build && npm test
# Check cron entries look correct
grep -A2 "flagship" scripts/daily-pipeline.sh
```

---

## Phase 5 — Migration & Sunset (Entity Extraction Guard)

**What you get:** Entity extraction stops writing flagship subtopics. C1 prefers flagship-discovery subtopics. Existing rows backfilled.

```
Implement SPEC-D2: entity extraction guard + C1 adaptation.

Reference specs (read these first):
- docs/specs/migration/SPEC-D2-migration-sunset.md — §3 (entity guard), §4 (C1 adaptation), §5 (backfill)

Scope:
1. scripts/extract-entities.ts — add flagship subtopic guard:
   - Import FLAGSHIP_TOPICS from scripts/lib/discovery.ts
   - Add isFlagshipSubtopic(slug) function: checks direct match against flagship slugs, then DB check for flagship_topic_slug IS NOT NULL, then prefix match as fallback
   - In the Stage 3 entity loop: skip upsertTopicCluster() if isFlagshipSubtopic(slug), log the skip, count skippedFlagship
   - Print skip count at end

2. scripts/lib/discovery.ts — modify loadSubtopics():
   - Check if data/flagship-packs/{topicSlug}.json exists
   - If yes: query topic_clusters WHERE flagship_topic_slug = ? AND source = 'flagship_discovery', ORDER BY mention_count DESC
   - If that returns rows, use them. Otherwise fall back to existing LIKE query.
   - This is backward-compatible: non-flagship topics and topics without packs use the old path.

3. New one-time script: scripts/migrate-flagship-tags.ts
   - For each FLAGSHIP_TOPICS entry: UPDATE topic_clusters SET flagship_topic_slug = ? WHERE slug = ? (the topic itself) + WHERE slug LIKE '{slug}-%' (subtopics)
   - Print count of tagged rows per topic
   - This is idempotent — safe to run multiple times

4. Unit tests:
   - isFlagshipSubtopic() correctly identifies flagship slugs, flagship subtopics, and does NOT match non-flagship slugs
   - loadSubtopics() returns flagship_discovery rows when pack exists, falls back otherwise

Quality gates: npm run build && npm test must pass.
After implementation: commit + push.
Then on VPS: git pull && npx tsx scripts/migrate-flagship-tags.ts
```

**Verify before moving on:**

```bash
npm run build && npm test
# Verify guard works (dry run entity extraction)
npx tsx scripts/extract-entities.ts --dry-run
```

---

## Phase 6 — End-to-End Test on VPS

**Not a code phase — manual verification on VPS.**

```bash
ssh loreai
cd /home/ubuntu/loreai-v2
git pull

# 1. Run migration
npx tsx scripts/migrate-flagship-tags.ts

# 2. Run full discovery
npx tsx scripts/flagship-discovery.ts --topic=claude-code

# 3. Review draft
cat data/flagship-packs/claude-code.json | jq '.subtopics[].name'

# 4. Approve
npx tsx scripts/flagship-discovery.ts --topic=claude-code --approve

# 5. Verify materialization
sqlite3 loreai.db "SELECT slug, source, flagship_topic_slug FROM topic_clusters WHERE source='flagship_discovery'"

# 6. Run freshness (may find nothing if no recent relevant news)
npx tsx scripts/flagship-freshness.ts --topic=claude-code

# 7. Run entity extraction — verify it skips flagship subtopics
npx tsx scripts/extract-entities.ts

# 8. Run discovery cycle — verify it uses flagship subtopics
npx tsx scripts/discovery-cycle.ts --topic=claude-code --expand-only --dry-run
```

---

## Quick Reference


| Phase | Files Created/Modified                                            | Depends On  |
| ----- | ----------------------------------------------------------------- | ----------- |
| 1     | `db.ts`, `subtopic-pack.ts`, `tests/subtopic-pack.test.ts`        | Nothing     |
| 2     | `flagship-discovery.ts` (CLI + lib), `SKILL-full.md`              | Phase 1     |
| 3     | `flagship-freshness.ts` (CLI + lib), `SKILL.md`                   | Phase 1     |
| 4     | `daily-pipeline.sh`, `review.ts`, snapshot writes                 | Phase 2 + 3 |
| 5     | `extract-entities.ts`, `discovery.ts`, `migrate-flagship-tags.ts` | Phase 1     |
| 6     | Manual VPS verification                                           | All phases  |


Phases 2 and 3 are independent of each other (both only need Phase 1). Phase 4 needs 2+3. Phase 5 only needs Phase 1.