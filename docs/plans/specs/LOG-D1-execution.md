# LOG-D1 — Flagship Topic Discovery Execution Log

> **Spec:** SPEC-D1-flagship-topic-discovery.md
> **Migration spec:** SPEC-D2-migration-sunset.md (Phase 1)

---

## Phase 1: Foundation Data Layer (2026-03-27)

**Scope:** DB schema migration + subtopic-pack module + unit tests. No discovery scripts, freshness scripts, or LLM prompts.

### Deliverables

| # | Artifact | Status |
|---|---|---|
| 1 | DB schema migration (3 columns) | Done |
| 2 | `scripts/lib/subtopic-pack.ts` | Done |
| 3 | `data/flagship-packs/` directory | Done |
| 4 | `scripts/__tests__/subtopic-pack.test.ts` | Done |

### 1. DB Schema Migration (`scripts/lib/db.ts`)

3 new columns added via safe ALTER pattern (PRAGMA table_info check):

| Table | Column | Type | Default |
|---|---|---|---|
| `topic_clusters` | `source` | TEXT | `'entity_extract'` |
| `topic_clusters` | `flagship_topic_slug` | TEXT | `NULL` |
| `create_queue` | `source` | TEXT | `'discovery'` |

Backward-compatible — all existing rows retain their meaning via defaults.

### 2. Subtopic Pack Module (`scripts/lib/subtopic-pack.ts`)

**Interfaces defined:**
- `SubtopicPack`, `Subtopic` — primary artifact
- `GapReport` — competitor analysis output
- `QueueDraft`, `QueueDraftItem` — queue recommendations
- `EventRouting`, `EventRoutingResult` — freshness routing output
- `MaterializationResult`, `PackDiff` — operation results

**Functions implemented:**
| Function | Description |
|---|---|
| `loadPack(topicSlug)` | Read JSON from `data/flagship-packs/{slug}.json` |
| `writePack(pack)` | Write JSON to `data/flagship-packs/{slug}.json` |
| `validatePack(pack)` | Check required fields, slug format, status, evidence types, duplicate slugs |
| `computeDiff(newPack, oldPack)` | Compute added/removed/unchanged subtopics |
| `materializePack(pack, opts)` | Write subtopics to `topic_clusters` (source='flagship_discovery', flagship_topic_slug set, mention_count=100) + seed keywords via `upsertKeyword()` |
| `approvePack(topicSlug)` | Load draft, set status='approved' + approved_at, call materializePack(), print summary |
| `isDuplicateQueueJob(keywordGroupId, primaryKeyword, contentType)` | Dedup check against `create_queue` |

**Key design decisions:**
- `materializePack` uses `MAX(mention_count, 100)` to preserve existing high mention counts from entity extraction
- Reads previous pack version to detect demoted subtopics (logged, not deleted)
- `approvePack` materializes before writing the updated status, so a crash mid-approve doesn't leave an approved pack without materialized rows

### 3. Unit Tests (`scripts/__tests__/subtopic-pack.test.ts`)

21 tests, all using in-memory SQLite (no external APIs):

| Group | Tests | Coverage |
|---|---|---|
| `validatePack` | 9 | Missing fields, invalid slug, invalid status, invalid version, duplicate slugs, invalid evidence_type, non-object input, missing sources |
| `computeDiff` | 4 | Added, removed, identical, completely different packs |
| `isDuplicateQueueJob` | 3 | Dedup by keyword_group_id, by primary_keyword+content_type, ignores completed jobs |
| `materializePack` | 3 | Correct DB writes + keyword seeding, dry run no-op, preserves existing high mention_count |
| `loadPack/writePack` | 2 | JSON round-trip, field preservation including diff/approved_at |

### Quality Gates

| Gate | Result |
|---|---|
| `npm test` | 889 passed, 8 skipped, 0 failed |
| `npm run build` | Success (exit 0) |

### Commit

`551372b` — `feat: add D1 Phase 1 — flagship topic discovery data layer` — pushed to main

---

## Phase 2: Full Discovery Mode Script (2026-03-27)

**Scope:** LLM skill prompt + core discovery logic + CLI entry point. Uses Phase 1's subtopic-pack module for persistence and approval.

### Deliverables

| # | Artifact | Status |
|---|---|---|
| 1 | `skills/flagship-discovery/SKILL-full.md` | Done |
| 2 | `scripts/lib/flagship-discovery.ts` | Done |
| 3 | `scripts/flagship-discovery.ts` | Done |

### 1. LLM Skill Prompt (`skills/flagship-discovery/SKILL-full.md`)

System prompt for Claude Sonnet that synthesizes official + competitor surfaces into subtopic candidates.

**Key instructions to the LLM:**
- Normalize raw nav labels into durable concept buckets (not "Getting Started" → "setup-and-installation")
- Slug format: `{topic-slug}-{subtopic}`, lowercase hyphenated
- Assign evidence types: `official_doc`, `serp_competitor`, `gap_analysis`
- Freshness sensitivity: `high` (releases/changelogs), `medium` (comparisons), `low` (tutorials)
- Draft 5–15 seed keywords per subtopic (real search queries, not marketing copy)
- 1–3 page type hints from: `faq`, `blog`, `compare`, `glossary`, `topic-hub`, `tutorial`
- 2–5 aliases per subtopic
- Target 8–20 subtopics per flagship topic
- Gap analysis: missing angles, weak content types, compare opportunities, refresh opportunities

### 2. Core Logic (`scripts/lib/flagship-discovery.ts`)

**Functions implemented:**

| Function | Description |
|---|---|
| `synthesizeOfficialSurfaces(topic, opts)` | Exa semantic search + Serper site-scoped queries for official docs → Claude Sonnet synthesis → official subtopic candidates |
| `synthesizeCompetitors(topic, existingSubtopics, opts)` | Serper broad search + Exa competitor content → Claude identifies gaps → competitor candidates + GapReport |
| `normalizeAndMerge(official, competitor, topic, previousPack, opts)` | Deduplicate by slug (official wins), merge aliases, Claude drafts missing seed keywords, set freshness_sensitivity, compute diff vs previous pack |
| `runFullDiscovery(topic, opts)` | Orchestrate all 4 steps → write draft pack → print summary |

**Data flow:**
1. Exa + Serper → official surfaces (titles + snippets + URLs)
2. Claude Sonnet + SKILL-full.md → official subtopic candidates
3. Serper broad + Exa competitors → competitor surfaces (top 15 URLs, content extracted)
4. Claude Sonnet → competitor candidates + gap report
5. Merge (official wins ties) → Claude fills missing seed keywords → validate → write pack

**API clients used:**
- `semanticSearch()` from `exa.ts` — semantic doc search with domain filtering
- `getContents()` from `exa.ts` — extract page content from competitor URLs
- `searchFull()` from `serper.ts` — site-scoped and broad SERP queries
- `callClaudeWithRetry()` from `ai.ts` — LLM calls with JSON validation + retry

**Known official domains config:**
- `claude-code` → `docs.anthropic.com`
- `codex` → `openai.com`, `platform.openai.com`

### 3. CLI Entry Point (`scripts/flagship-discovery.ts`)

| Arg | Default | Description |
|---|---|---|
| `--topic=slug` | All flagship topics | Single topic mode |
| `--approve` | false | Approve draft → materialize via `approvePack()` |
| `--dry-run` | false | No file/DB writes, print results |
| `--skip-serp` | false | Skip competitor synthesis (faster, official only) |

**Usage:**
```bash
npx tsx scripts/flagship-discovery.ts                              # All topics
npx tsx scripts/flagship-discovery.ts --topic=claude-code          # Single topic
npx tsx scripts/flagship-discovery.ts --topic=claude-code --approve # Approve draft
npx tsx scripts/flagship-discovery.ts --topic=claude-code --dry-run # Preview
npx tsx scripts/flagship-discovery.ts --topic=claude-code --skip-serp # Official only
```

### Quality Gates

| Gate | Result |
|---|---|
| `npm test` | 889 passed, 8 skipped, 0 failed |
| `npm run build` | Success (exit 0) |

### Commit

`3ef71da` — `feat: add D1 Phase 2 — full discovery mode script` — pushed to main

---

## Phase 3: Daily Freshness Mode Script (2026-03-27)

**Scope:** LLM skill prompt + freshness routing core logic + CLI entry point. Routes daily news signals to existing approved subtopics and generates create/refresh queue drafts. Fully automated — no human approval needed.

### Deliverables

| # | Artifact | Status |
|---|---|---|
| 1 | `skills/flagship-freshness/SKILL.md` | Done |
| 2 | `scripts/lib/flagship-freshness.ts` | Done |
| 3 | `scripts/flagship-freshness.ts` | Done |

### 1. LLM Skill Prompt (`skills/flagship-freshness/SKILL.md`)

System prompt for Claude Sonnet that routes fresh news signals to existing approved subtopics.

**Key instructions to the LLM:**
- Accept: fresh signals + approved subtopic pack (names, descriptions, slugs) + existing content inventory (slugs, titles)
- NEVER propose new subtopics — only map to existing approved ones
- Fan-out: one event can affect multiple subtopics/pages
- Return per-signal routing decisions: target subtopics, target pages, action, reasoning
- Actions: `refresh`, `create`, `refresh_and_create`, `ignore`
- Conservative with `create` (clear content gap needed), aggressive with `refresh`
- Suggested keyword + content type for create actions

### 2. Core Logic (`scripts/lib/flagship-freshness.ts`)

**Functions implemented:**

| Function | Description |
|---|---|
| `loadFreshSignals(topicSlug, pack, backHours)` | Load `getAllRecentNewsItems()`, filter by keyword match against topic name + subtopic names + aliases |
| `loadExistingContent(topicSlug, pack)` | Query `content` table for pages matching topic/subtopic slugs (for refresh targeting) |
| `routeEventsToSubtopics(signals, pack, existingContent, opts)` | Batch signals (max 20/call), Claude Sonnet + SKILL.md, validate target slugs against pack, calculate timeliness_hours |
| `generateQueueDrafts(routings, topicSlug, pack, opts)` | Convert routings to `QueueDraftItem[]` with triple dedup |
| `writeQueueDrafts(queueDraft, opts)` | Seed keywords via `upsertKeyword()`, create keyword groups, write to `create_queue` with source='flagship_freshness' |
| `runFreshnessMode(topic, opts)` | Orchestrate: load pack (must be approved) → load signals → route → draft → write → print summary |

**Triple dedup in `generateQueueDrafts`:**
1. Against `create_queue` — via `isDuplicateQueueJob()` (pending/in_progress jobs)
2. Against recent content — skip refresh if content updated within 7 days
3. Within same run — merge same-subtopic drafts (combine reasoning, keep highest priority)

**Priority scoring:**
- `high` (80 points) — event detected < 12 hours ago
- `medium` (50 points) — event detected < 48 hours ago
- `low` (30 points) — older events

**API clients used:**
- `getAllRecentNewsItems()` from `db.ts` — load recent news signals
- `upsertKeyword()` from `db.ts` — seed keywords for create actions
- `isDuplicateQueueJob()` from `subtopic-pack.ts` — queue dedup
- `callClaudeWithRetry()` from `ai.ts` — LLM routing calls with JSON validation

### 3. CLI Entry Point (`scripts/flagship-freshness.ts`)

| Arg | Default | Description |
|---|---|---|
| `--topic=slug` | All topics with approved packs | Single topic mode |
| `--hours=N` | 30 | Lookback window for news_items |
| `--dry-run` | false | No DB writes, print results |

**Usage:**
```bash
npx tsx scripts/flagship-freshness.ts                              # All approved topics
npx tsx scripts/flagship-freshness.ts --topic=claude-code          # Single topic
npx tsx scripts/flagship-freshness.ts --hours=48                   # Custom lookback
npx tsx scripts/flagship-freshness.ts --dry-run                    # Preview
```

**Default behavior:** Only processes topics with approved packs. Skips topics with draft or missing packs.

### Smoke Test

```
$ npx tsx scripts/flagship-freshness.ts --topic=claude-code --dry-run
Flagship Freshness Mode — 1 topic(s), 30h lookback [DRY RUN]

🔄 Flagship Freshness — Claude Code
══════════════════════════════════════════
  No pack found for claude-code — skipping
```

Expected — no approved pack in local DB (live DB is on VPS).

### Quality Gates

| Gate | Result |
|---|---|
| `npm test` | 889 passed, 8 skipped, 0 failed |
| `npm run build` | Success (exit 0) |

### Commit

`dca1c79` — `feat: add D1 Phase 3 — daily freshness mode script` — pushed to main

---

## Phase 4: Cron Integration & Observability (2026-03-27)

**Scope:** Wire flagship scripts into VPS cron via `daily-pipeline.sh`, add snapshot metrics for observability, add C5 health checks for pack status and migration tracking.

### Deliverables

| # | Artifact | Status |
|---|---|---|
| 1 | `scripts/daily-pipeline.sh` — two new cron steps | Done |
| 2 | `scripts/flagship-discovery.ts` — snapshot writes | Done |
| 3 | `scripts/flagship-freshness.ts` — snapshot writes | Done |
| 4 | `scripts/lib/review-checks.ts` — two new C5 checks | Done |

### 1. Cron Integration (`scripts/daily-pipeline.sh`)

Two new case entries added:

| Step | Cron Slot | Command | Notes |
|---|---|---|---|
| `flagship-freshness` | 4:30am SGT Mon–Fri (after extract) | `npx tsx scripts/flagship-freshness.ts` | Tees to `logs/flagship-freshness-$DATE.log`, git commits `data/flagship-packs/` |
| `flagship-discovery` | 7:30am SGT Saturday (before discovery) | `npx tsx scripts/flagship-discovery.ts` | Tees to `logs/flagship-discovery-$DATE.log`, git commits `data/flagship-packs/` |

Both steps record exit code to the log file and use `safe_push` for git push.

**Updated schedule comments** in the script header to reflect the new 4:30am freshness slot and 7:30am Saturday discovery slot.

**Crontab entries (to be added on VPS):**
```
30 20 * * 0-4  bash scripts/daily-pipeline.sh flagship-freshness
30 23 * * 5    bash scripts/daily-pipeline.sh flagship-discovery
```

### 2. Observability — Snapshot Metrics

**`flagship-discovery.ts`** — writes after each run (skipped in dry-run):

| metric_group | metric_key | Description |
|---|---|---|
| `flagship_discovery` | `approved_packs` | Count of topics with approved packs |
| `flagship_discovery` | `total_subtopics` | Total subtopics across all approved packs |
| `flagship_discovery` | `draft_packs` | Packs in draft status (need approval) |

Iterates over all `FLAGSHIP_TOPICS` (not just the ones processed in this run) to give a global view.

**`flagship-freshness.ts`** — accumulates metrics across all topics processed, writes once:

| metric_group | metric_key | Description |
|---|---|---|
| `flagship_freshness` | `events_processed` | Total signals evaluated |
| `flagship_freshness` | `events_routed` | Signals that produced actionable routings |
| `flagship_freshness` | `events_ignored` | Signals ignored (irrelevant) |
| `flagship_freshness` | `queue_drafts_created` | Jobs written to create_queue |
| `flagship_freshness` | `queue_drafts_deduped` | Jobs skipped (already in queue) |

Both use `writeSnapshots()` from `db.ts` with `todaySGT()` as the snapshot date.

### 3. C5 Health Checks (`scripts/lib/review-checks.ts`)

Two new checks added to Group F — Flagship Topic Health:

| Check ID | Window | Description | Thresholds |
|---|---|---|---|
| `flagship_pack_status` | snapshot | For each `FLAGSHIP_TOPICS` entry: checks pack file exists, warns if draft, warns if `approved_at` > 14 days | Green: all approved & fresh. Yellow: draft or stale. Red: missing pack file |
| `flagship_migration` | snapshot | Counts `topic_clusters` by `source` column — `flagship_discovery` vs `entity_extract` | Info only (migration progress metric) |

Both registered in `ALL_CHECKS` array and will run automatically during `review-health` cron step.

### Quality Gates

| Gate | Result |
|---|---|
| `npm test` | 889 passed, 8 skipped, 0 failed |
| `npm run build` | Success (exit 0) |

### Commit

`6cb1092` — `feat: add D1 Phase 4 — cron integration and observability` — pushed to main

---

## SPEC-D2: Entity Extraction Guard + C1 Adaptation (2026-03-27)

**Spec:** SPEC-D2-migration-sunset.md — Phase 2 (§4) + Phase 3 (§3, §5)

### Deliverables

| # | Artifact | Status |
|---|---|---|
| 1 | `scripts/extract-entities.ts` — flagship subtopic guard | Done |
| 2 | `scripts/lib/discovery.ts` — `loadSubtopics()` C1 adaptation | Done |
| 3 | `scripts/migrate-flagship-tags.ts` — one-time backfill script | Done |
| 4 | `scripts/__tests__/d2-entity-guard.test.ts` — unit tests | Done |

### 1. Entity Extraction Guard (`scripts/extract-entities.ts`)

New exported function `isFlagshipSubtopic(slug)` with 3-tier check:

| Priority | Check | Description |
|---|---|---|
| 1 | Direct match | `flagshipSlugs.has(slug)` against `FLAGSHIP_TOPICS` |
| 2 | DB check | `topic_clusters WHERE slug = ? AND flagship_topic_slug IS NOT NULL` |
| 3 | Prefix match | `slug.startsWith('{flagshipSlug}-')` as fallback |

In Stage 3 entity loop: skips `upsertTopicCluster()` for flagship subtopics, logs each skip, prints `skippedFlagship` count at end.

**Non-flagship entities are completely unaffected** — the guard only prevents writes for entities matching flagship topic structure.

### 2. C1 Adaptation (`scripts/lib/discovery.ts`)

`loadSubtopics()` changed from private to exported, with new pack-aware logic:

1. Check if `data/flagship-packs/{topicSlug}.json` exists
2. If yes: query `topic_clusters WHERE flagship_topic_slug = ? AND source = 'flagship_discovery'` ORDER BY mention_count DESC
3. If that returns rows, use them (flagship-discovery authority)
4. Otherwise fall through to legacy `LIKE` query (backward-compatible)

**Key property:** Non-flagship topics and topics without approved packs use the original path exactly.

### 3. Migration Script (`scripts/migrate-flagship-tags.ts`)

One-time idempotent script to backfill `flagship_topic_slug` for existing clusters:
- For each `FLAGSHIP_TOPICS` entry: UPDATE where `slug = ?` (topic itself) + `slug LIKE '{slug}-%'` (subtopics)
- Prints tagged count per topic

**VPS execution result:**
```
Claude Code: tagged 2 subtopics
OpenAI Codex: tagged 3 subtopics
```

### 4. Unit Tests (`scripts/__tests__/d2-entity-guard.test.ts`)

9 tests covering both `isFlagshipSubtopic()` and `loadSubtopics()`:

| Group | Tests | Coverage |
|---|---|---|
| `isFlagshipSubtopic` | 5 | Direct flagship slug, DB flagship_topic_slug match, prefix match, non-flagship rejection, no false positive on partial prefix (e.g. "claude-coder" does NOT match "claude-code-") |
| `loadSubtopics` | 4 | Pack exists with flagship_discovery rows, pack exists but no rows (fallback), no pack (legacy LIKE), empty result |

### Quality Gates

| Gate | Result |
|---|---|
| `npm test` | 898 passed, 8 skipped, 0 failed |
| `npm run build` | Success (exit 0) |

### VPS Deployment

| Step | Result |
|---|---|
| `git pull` | Fast-forward to dbe0746 |
| `npx tsx scripts/migrate-flagship-tags.ts` | 5 subtopics tagged (2 Claude Code + 3 Codex) |
| `npx tsx scripts/extract-entities.ts --dry-run` | 135 items found, dry-run exits before Stage 3 |

### Commit

`dbe0746` — `feat: implement SPEC-D2 — entity extraction guard + C1 adaptation` — pushed to main

---

## Phase 6: End-to-End VPS Test (2026-03-27)

**Scope:** Full pipeline verification on VPS with live DB. Not a code phase — manual execution of all D1 + D2 scripts in sequence to validate integration.

### Test Steps & Results

| # | Step | Command | Result |
|---|------|---------|--------|
| 1 | Migration | `npx tsx scripts/migrate-flagship-tags.ts` | Tagged 5 subtopics (2 Claude Code, 3 OpenAI Codex) |
| 2 | Full Discovery | `npx tsx scripts/flagship-discovery.ts --topic=claude-code` | 29 subtopics, 317 seed keywords. 4 stages: official (22 sources, 17 candidates) → competitor (15 analyzed, 12 gap, 5 compare) → merge → persist draft |
| 3 | Review Draft | `cat data/flagship-packs/claude-code.json \| jq '.subtopics[].name'` | 29 subtopics covering: setup, CLI, interactive mode, IDE, Agent SDK, MCP, subagents, plugins, skills, memory, output styles, workflows, remote, permissions, auth, desktop, CI/CD, plan mode, comparisons, pricing, non-technical, context mgmt, git, parallel sessions, scheduled tasks, prompt engineering, computer use, Slack/Linear integrations, TDD |
| 4 | Approve | `npx tsx scripts/flagship-discovery.ts --topic=claude-code --approve` | Pack v1 approved & materialized |
| 5 | Verify DB | `sqlite3 loreai.db "SELECT slug, source, flagship_topic_slug FROM topic_clusters WHERE source='flagship_discovery'"` | 30 rows (1 parent + 29 subtopics), all with `source='flagship_discovery'` and `flagship_topic_slug='claude-code'` |
| 6 | Freshness | `npx tsx scripts/flagship-freshness.ts --topic=claude-code` | 12 fresh signals, 9 actionable routings (3 ignored), 12 queue drafts written. Actions: `refresh_and_create` (4), `refresh` (5) |
| 7 | Entity Extraction | `npx tsx scripts/extract-entities.ts` | 74 entities extracted, 18 new clusters, 54 updated. **Skipped 2 flagship subtopics** (Claude Code, Codex) — guard working correctly |
| 8 | Discovery Cycle | `npx tsx scripts/discovery-cycle.ts --topic=claude-code --expand-only --dry-run` | 31 subtopics processed, 830 new keywords discovered across 93 API calls (62 Serper, 31 Exa). Flagship subtopics used as expansion targets |

### Key Verifications

- **D1 Full Discovery → Approve → Materialize** pipeline works end-to-end
- **D1 Freshness** correctly routes live news signals to approved subtopics, creates queue drafts with dedup
- **D2 Entity Guard** correctly skips flagship subtopics during entity extraction (2 skipped)
- **D2 C1 Adaptation** confirmed — discovery cycle uses flagship subtopics as expansion targets (31 subtopics processed vs legacy LIKE query)
- **No regressions** — entity extraction still processes non-flagship entities normally (74 extracted, 18 new clusters)

### Status

All 8 steps passed. D1 + D2 integration verified on live VPS.

---

<!-- Future phases append below -->
