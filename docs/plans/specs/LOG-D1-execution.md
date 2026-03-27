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

<!-- Future phases append below -->
