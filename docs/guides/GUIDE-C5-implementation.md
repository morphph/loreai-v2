---
title: "Implementation Guide: C5 Pipeline Review"
status: active
category: guide
last-updated: 2026-03-20
depends-on: ["SPEC-C5"]
---

# Implementation Guide: C5 Pipeline Review Cycle

## For Claude Code — Read This First

You are implementing SPEC-C5 (Pipeline Review Cycle) for the loreai-v2 project.
Before starting, read these files in order:

1. `CLAUDE.md` — project rules and backpressure gates
2. `docs/specs/PIPELINE.md` — understand the full pipeline architecture
3. `docs/specs/performance/SPEC-C5-review-cycle.md` — the spec you're implementing
4. `scripts/lib/db.ts` — understand the DB schema (you'll query it heavily)
5. `scripts/lib/ai.ts` — understand how Claude is called (reuse for Layer 2)
6. `scripts/performance-cycle.ts` + `scripts/lib/performance.ts` — similar pattern to follow

## Phase 0: Pre-Implementation Review (10 minutes max)

After reading the spec and codebase, do a quick sanity check BEFORE writing any code. Answer these 5 questions concisely (2-3 sentences each):

1. **Schema match:** Does the spec's SQL match the actual DB schema in `scripts/lib/db.ts`? Flag any mismatches (column names, table names, status strings).
2. **Import feasibility:** Can you actually import `getDb()` from `scripts/lib/db.ts` and `callClaude()` from `scripts/lib/ai.ts` (or equivalent) without Next.js module contamination?
3. **Missing assumptions:** Does the spec assume any data that might not exist yet in the DB? (e.g., does `content` table have rows? Does `snapshots` have any data?)
4. **Test feasibility:** Can the unit tests run with an in-memory SQLite DB, or does the test setup need special handling?
5. **Blind spots:** Is there anything in the codebase that contradicts the spec or that the spec doesn't account for?

Present your findings. If there are blocking issues, flag them. If they're minor, note them and proceed to Phase 1. **Do NOT redesign the spec.** The architecture has been validated — this review is for catching implementation-level issues only.

**Time limit: spend at most 10 minutes on Phase 0, then move to Phase 1 regardless.**

## Build Order

### Phase 1: Layer 1 Health Checks (ship first, immediate value)

1. Create `scripts/lib/review-checks.ts`
   - Start with the 5 Queue Health checks (Section 3.2B in spec)
   - Start with the 6 Queue Health checks (Section 3.2B in spec) — includes `groups_status_sync` which catches the exact class of bug found on 2026-03-25
   - Each check is a pure function: `(db, opts) => HealthCheckResult`
   - Write unit tests for each check as you go

2. Create `scripts/lib/review.ts`
   - Orchestrator: runs all checks, assembles HealthReport
   - Keep it simple: loop through check functions, collect results

3. Create `scripts/review-cycle.ts`
   - CLI entry point: parse args, call orchestrator, output JSON or markdown
   - Follow the same pattern as `scripts/discovery-cycle.ts`

4. Add remaining check groups (A, C, D, E from spec Section 3.2)
   - Pipeline Stage Completion checks
   - Discovery Health checks
   - Content Coverage checks
   - Performance Loop Health checks

5. **Test:** `npm test` must pass. Run `npx tsx scripts/review-cycle.ts --mode=health` against the real DB on VPS to verify.

### Phase 2: Layer 2 LLM Quality Sampling

6. Create `scripts/lib/review-quality.ts`
   - Implement sampling functions first:
     - Content file sampler (random pick from content/{type}/en/)
     - Keyword group sampler (random from keyword_groups table)
     - Subtopic sampler (recent from topic_clusters)
     - Raw keyword sampler (random from keywords table)
   - Then implement rubrics in this order:

   **Pure logic rubrics (no LLM, do these first):**
   - Rubric D: Priority Score Sanity
   - Rubric G: Internal Linking Coherence (file system + regex parsing)
   - Rubric H: Refresh Pipeline Health (SQL checks — will show `not_implemented` until refresh bug is fixed)

   **LLM rubrics:**
   - Rubric A: Keyword Group Coherence (1 call per group, ~10 calls)
   - Rubric B: Content Search Intent Match (1 call per content sample, ~20 calls)
   - Rubric C: Content AEO Readiness (1 call per content sample, ~20 calls)
   - Rubric E: Subtopic Discovery Quality (1 batch call for ~10 subtopics)
   - Rubric F: Raw Keyword Quality (1 batch call for ~20 keywords)

7. Wire Layer 2 into `scripts/lib/review.ts` orchestrator
   - `--mode=quality` runs Layer 2 only
   - `--mode=full` runs Layer 1 + Layer 2
   - Pure logic rubrics (D, G, H) run first, then LLM rubrics
   - If LLM fails, pure rubric results still get reported

8. **Test:** Run `--mode=quality --dry-run` to verify prompts look correct before spending API credits.

### Phase 3: Strategic Mode + Cron Integration

9. Implement `--mode=strategic` report generator
   - Reads Layer 1 + Layer 2 results
   - Generates a compact markdown file < 15K tokens
   - Saves to `data/review/`

10. Add report storage + cleanup (30-day retention)

11. Add cron entries to `daily-pipeline.sh`
    - Add `review` as a new step in the dispatch case statement
    - Add crontab entries per spec Section 7

### Validation Before Each Commit

Per CLAUDE.md backpressure rules:
1. `npm run build` — must pass
2. `npm test` — must pass (including your new tests)
3. No import of Next.js modules in pipeline scripts

## Key Design Decisions (Don't Change These)

- **Read-only:** review-cycle.ts NEVER writes to the DB. Only writes report files to `data/review/`.
- **Pure functions for checks:** Don't put SQL inside the orchestrator. Each check is its own exported function.
- **Fail-open:** If a check errors, mark it `status: 'error'` and continue. Don't crash the cycle.
- **Sonnet 4.6 for Layer 2:** Default to `claude-sonnet-4-6` for quality scoring. Early-stage pipeline needs high-quality judgment to establish baselines. Support `--model=haiku` CLI flag for later cost optimization.
- **EN-only sampling:** Don't sample ZH content separately unless explicitly asked later.
- **Status strings as constants:** Define `QUEUE_STATUS = { PENDING: 'pending', IN_PROGRESS: 'in_progress', COMPLETED: 'completed' }` and `GROUP_STATUS = { PENDING: 'pending', QUEUED: 'queued', COMPLETED: 'completed' }` at the top of `review-checks.ts`. Never hardcode status strings in SQL. This prevents the exact class of bug that was just fixed.

## DB Schema Notes (Confirmed 2026-03-25)

**Critical: Status string values.** This was the source of a week-long observability bug — dashboard used `'done'` but code writes `'completed'`. The spec Section 3.2B has the authoritative reference. Never hardcode status strings; import them from a shared constant.

Confirmed status transitions:
- `create_queue`: `pending` → `in_progress` → `completed`
- `keyword_groups`: `pending` → `queued` → `completed`

Confirmed join paths:
- `create_queue.keyword_group_id` → `keyword_groups.group_id`
- `keyword_groups.cluster_slug` ↔ `keywords.cluster_slug` (indirect, no join table)
- There is NO `keyword_group_members` table

For Layer 2 keyword group sampling, query like:
```sql
SELECT kg.group_id, kg.primary_keyword, kg.intent, kg.content_type, kg.cluster_slug
FROM keyword_groups kg
WHERE kg.cluster_slug LIKE 'claude-code%'
ORDER BY RANDOM()
LIMIT 10
```
Then for each group, get secondary keywords:
```sql
SELECT keyword FROM keywords
WHERE cluster_slug = ?
AND keyword != ?
```
