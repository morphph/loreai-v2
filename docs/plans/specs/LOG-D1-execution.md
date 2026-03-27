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

<!-- Future phases append below -->
