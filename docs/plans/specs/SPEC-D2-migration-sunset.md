# SPEC-D2 — Migration & Sunset: Entity-Led → Discovery-Led Flagship Subtopics

> **Status: Implemented 2026-03-27 (Phases 1–3)** — See [LOG-D1-execution.md](LOG-D1-execution.md). Phase 4 (dashboard adaptation) deferred.

> **Modifies:**
> - `scripts/extract-entities.ts` — Add flagship topic guard
> - `scripts/lib/db.ts` — Schema migration, new queries
> - `scripts/lib/discovery.ts` — C1 reads from approved packs
> - `server/index.ts` — Dashboard adaptation
> - `scripts/lib/review.ts` — C5 migration health checks
>
> **Depends on:** SPEC-D1 (flagship discovery agent must be implemented first)

---

## 1. Purpose

Spec the retirement of entity-driven flagship subtopic seeding and the transition of `topic_clusters` from an independently-seeded taxonomy to a **materialized projection** of approved flagship subtopic packs.

This is the most architecture-sensitive part of the strategy. It affects:
- `extract-entities.ts` — what it is allowed to write
- `discovery.ts` (C1) — where it gets flagship subtopic input
- `topic_clusters` — its semantic meaning
- Dashboard assumptions about `topic_clusters`

---

## 2. Migration Phases

### Phase 1 — Introduce Authority Model (Week 1)

**Goal:** New system runs alongside old. No existing behavior changes.

| Step | Action | Risk |
|---|---|---|
| 1a | Implement SPEC-D1 (full discovery + freshness scripts, subtopic-pack.ts) | None — new files only |
| 1b | Add `source` and `flagship_topic_slug` columns to `topic_clusters` | None — ALTERs with defaults |
| 1c | Add `source` column to `create_queue` | None — ALTER with default |
| 1d | Run full discovery for Claude Code → produces draft pack | None — informational only |
| 1e | Human reviews + approves via `--approve` flag → auto-materializes into topic_clusters | Additive — existing rows untouched |

**Validation:** After 1e, run `SELECT slug, source FROM topic_clusters WHERE slug LIKE 'claude-code%'` — should show both `entity_extract` and `flagship_discovery` rows coexisting.

**Exit criteria:** Approved pack materialized for at least one flagship topic.

### Phase 2 — Attach to Discovery Flow (Week 2)

**Goal:** C1 prefers flagship subtopics from approved packs. Entity extraction continues for everything.

| Step | Action | Risk |
|---|---|---|
| 2a | Modify `loadSubtopics()` in `discovery.ts` to prefer `source='flagship_discovery'` rows | Low — falls back to all rows if no pack exists |
| 2b | Enable freshness mode in daily cron | Low — only reads approved packs |
| 2c | Monitor for 1 week: compare freshness outputs vs. entity extraction outputs | None — observational |

**Validation:** Discovery cycle produces same or better subtopic coverage. Freshness mode produces actionable queue drafts.

**Exit criteria:** Freshness mode running daily for 7 days without errors.

### Phase 3 — Sunset Entity-Led Flagship Seeding (Week 3)

**Goal:** Entity extraction stops creating or modifying flagship subtopics.

| Step | Action | Risk |
|---|---|---|
| 3a | Add flagship guard to `extract-entities.ts` (see §3) | Medium — must not break non-flagship entity extraction |
| 3b | Backfill `flagship_topic_slug` for existing flagship clusters | Low — one-time data migration |
| 3c | Update C5 health checks to monitor migration status | None |

**Validation:** Run entity extraction → verify no `topic_clusters` rows with `flagship_topic_slug IS NOT NULL` were modified by entity extract.

**Exit criteria:** Entity extraction provably does not touch flagship subtopics.

### Phase 4 — Clean Operational Semantics (Week 4+)

**Goal:** Clarify `topic_clusters` role and update downstream consumers.

| Step | Action | Risk |
|---|---|---|
| 4a | Update dashboard to show `source` column, filter by flagship vs. entity | Low |
| 4b | Add `/api/flagship-packs` endpoint for dashboard pack status (optional) | Low |
| 4c | Update PIPELINE.md and STRATEGY.md documentation | None |
| 4d | Remove C1 event-triggered subtopic creation for flagship topics (--event flag) | Low — replaced by freshness mode |

---

## 3. Entity Extraction Guard (Phase 3a)

### 3.1 The Change

In `extract-entities.ts`, add a guard that prevents entity extraction from upserting `topic_clusters` rows that belong to a flagship topic.

```typescript
// New: load flagship topic slugs at startup
import { FLAGSHIP_TOPICS } from './lib/discovery';

const flagshipSlugs = new Set(FLAGSHIP_TOPICS.map(t => t.slug));

// New: check if a slug belongs to a flagship topic
function isFlagshipSubtopic(slug: string): boolean {
  // Direct match
  if (flagshipSlugs.has(slug)) return true;

  // Subtopic match: check flagship_topic_slug in DB
  const db = getDb();
  const row = db.prepare(
    `SELECT 1 FROM topic_clusters
     WHERE slug = ? AND flagship_topic_slug IS NOT NULL
     LIMIT 1`
  ).get(slug);
  if (row) return true;

  // Prefix match against flagship slugs (fallback)
  for (const fs of flagshipSlugs) {
    if (slug.startsWith(`${fs}-`)) return true;
  }

  return false;
}
```

### 3.2 Modified Entity Extraction Loop

```typescript
// In Stage 3 of extract-entities.ts, replace the current loop:

let skippedFlagship = 0;

for (const entity of entities) {
  const slug = entity.normalized;
  if (!slug) continue;

  // NEW: Skip flagship subtopics — these are managed by flagship discovery
  if (isFlagshipSubtopic(slug)) {
    console.log(`  Skipped flagship subtopic: "${entity.entity}" → ${slug}`);
    skippedFlagship++;
    continue;
  }

  upsertTopicCluster(slug, entity.entity);
  // ... rest of existing logic
}

console.log(`  Skipped ${skippedFlagship} flagship subtopics (managed by discovery agent)`);
```

### 3.3 What Entity Extraction Still Does

After the guard, entity extraction continues to:
- Extract ALL entities from news (no filtering at the AI step)
- Write non-flagship entities to `topic_clusters` as before
- Serve as a **candidate detection** system for future flagship topics (high mention_count entities may be promoted)
- Feed analytics and dashboards with entity signals

It stops:
- Creating new flagship subtopics in `topic_clusters`
- Incrementing `mention_count` for flagship subtopics
- Acting as the authority for flagship topic structure

### 3.4 Non-Flagship Topics

For topics not in `FLAGSHIP_TOPICS`, nothing changes. Entity extraction continues to be the primary source of `topic_clusters` entries. This is deliberate — the flagship discovery agent is only for manually curated flagship topics.

---

## 4. C1 Discovery Cycle Adaptation (Phase 2a)

### 4.1 Modified `loadSubtopics()`

In `scripts/lib/discovery.ts`, update the subtopic loading to prefer flagship-discovery sources:

```typescript
function loadSubtopics(topicSlug: string): SubtopicInput[] {
  const db = getDb();

  // Check if this topic has an approved flagship pack
  const hasApprovedPack = existsSync(
    join(__dirname, '../../data/flagship-packs', `${topicSlug}.json`)
  );

  if (hasApprovedPack) {
    // Prefer flagship-discovery subtopics
    const rows = db
      .prepare(
        `SELECT slug, pillar_topic FROM topic_clusters
         WHERE flagship_topic_slug = ? AND source = 'flagship_discovery'
         ORDER BY mention_count DESC`
      )
      .all(topicSlug) as Array<{ slug: string; pillar_topic: string }>;

    if (rows.length > 0) {
      return rows.map((r) => ({ slug: r.slug, pillar_topic: r.pillar_topic }));
    }
    // Fall through to legacy query if materialization hasn't happened yet
  }

  // Legacy: slug prefix matching (unchanged)
  const rows = db
    .prepare(
      `SELECT slug, pillar_topic FROM topic_clusters
       WHERE slug LIKE ? OR slug = ?
       ORDER BY mention_count DESC`
    )
    .all(`${topicSlug}-%`, topicSlug) as Array<{
    slug: string;
    pillar_topic: string;
  }>;

  return rows.map((r) => ({ slug: r.slug, pillar_topic: r.pillar_topic }));
}
```

**Key property:** Backward-compatible. If no approved pack exists, falls back to the current behavior exactly.

### 4.2 C1 Event-Triggered Subtopic Discovery

In Phase 4d, for flagship topics with approved packs, disable C1's `discoverNewSubtopics()` call. New subtopics for flagship topics should only come from Full Discovery Mode.

```typescript
// In runDiscoveryForTopic():
if (opts.event && opts.mode === 'event-triggered') {
  // NEW: Skip subtopic creation for flagship topics with approved packs
  if (hasApprovedPack(topic.slug)) {
    console.error('  Stage 0 — Skipped (flagship topic uses approved pack)');
    // Still filter subtopics by event for B1 targeting
    const filtered = filterSubtopicsByEvent(subtopics, opts.event);
    targetSubtopicSlugs = filtered.map((s) => s.slug);
  } else {
    // Existing behavior for non-flagship topics
    // ... current discoverNewSubtopics() logic
  }
}
```

---

## 5. Backfill: `flagship_topic_slug` (Phase 3b)

One-time migration to tag existing flagship subtopics:

```typescript
// scripts/migrate-flagship-tags.ts (one-time script)

import { getDb, closeDb } from './lib/db';
import { FLAGSHIP_TOPICS } from './lib/discovery';

const db = getDb();

for (const topic of FLAGSHIP_TOPICS) {
  // Tag the flagship topic itself
  db.prepare(
    `UPDATE topic_clusters
     SET flagship_topic_slug = ?
     WHERE slug = ?`
  ).run(topic.slug, topic.slug);

  // Tag all subtopics (prefix match)
  const result = db.prepare(
    `UPDATE topic_clusters
     SET flagship_topic_slug = ?
     WHERE slug LIKE ? AND slug != ?`
  ).run(topic.slug, `${topic.slug}-%`, topic.slug);

  console.log(`${topic.name}: tagged ${result.changes} subtopics`);
}

closeDb();
```

---

## 6. Dashboard Adaptation (Phase 4a–4b)

### 6.1 Current State

In `server/index.ts`, the dashboard hardcodes flagship topics and loads all `topic_clusters` rows without distinguishing sources.

### 6.2 Target State

Update the dashboard API to expose the `source` column:

```typescript
// GET /api/clusters — add source to response
app.get('/api/clusters', (req, res) => {
  const clusters = db.prepare(
    `SELECT slug, pillar_topic, mention_count, source, flagship_topic_slug,
            first_seen, last_seen, has_topic_hub
     FROM topic_clusters
     ORDER BY mention_count DESC`
  ).all();
  res.json(clusters);
});

// NEW: GET /api/flagship-packs — list approved packs
app.get('/api/flagship-packs', (req, res) => {
  const packs = [];
  for (const topic of FLAGSHIP_TOPICS) {
    const packPath = join(__dirname, '../data/flagship-packs', `${topic.slug}.json`);
    if (existsSync(packPath)) {
      const pack = JSON.parse(readFileSync(packPath, 'utf-8'));
      packs.push({
        topic_slug: pack.topic_slug,
        version: pack.version,
        status: pack.status,
        subtopic_count: pack.subtopics.length,
        approved_at: pack.approved_at,
      });
    }
  }
  res.json(packs);
});
```

### 6.3 Frontend Considerations

The dashboard should visually distinguish:
- **Flagship subtopics** (source='flagship_discovery') — shown with a badge/icon
- **Entity-derived clusters** (source='entity_extract') — current display
- **C1-discovered subtopics** (source='discovery_c1') — current display

No frontend spec here — this is a backend API change. Frontend can be updated iteratively.

---

## 7. topic_clusters Semantic Clarification

### 7.1 Before (Today)

`topic_clusters` is the **de facto topic taxonomy**. Entity extraction creates it. Discovery reads it. It is the shared namespace for all topic-related operations.

### 7.2 After

`topic_clusters` becomes a **unified operational table** with clear provenance:

| source | Authority | Written by | Meaning |
|---|---|---|---|
| `flagship_discovery` | **Canonical** for flagship topics | Auto-materialization on `--approve` | Curated, human-approved subtopic |
| `entity_extract` | **Signals** for non-flagship topics | extract-entities.ts | AI-extracted entity, may become flagship candidate |
| `discovery_c1` | **Exploratory** for non-flagship topics | C1 event-triggered discovery | Serper-derived subtopic suggestion |

For flagship topics, `source='flagship_discovery'` rows are authoritative. Other sources exist for analytics and candidate detection.

For non-flagship topics, behavior is unchanged — entity extraction and C1 remain the primary sources.

### 7.3 Is topic_clusters a "view" or a "table"?

It remains a **table**. Making it a SQLite view would require restructuring how entity extraction and C1 write to it. The `source` column achieves the same semantic clarity with zero architectural churn.

---

## 8. Freshness Signals: What Still Flows Daily

After the sunset, the daily data flow is:

```
Collect (news_items)
  → Entity Extract
       → non-flagship entities → topic_clusters (unchanged)
       → flagship entities → SKIPPED (logged only)
  → Flagship Freshness Mode
       → reads approved pack + recent news_items
       → routes events to existing subtopics
       → writes create_queue drafts (automated, no approval needed)
```

Daily entity extraction continues to detect entities related to flagship topics — it just doesn't write them to `topic_clusters`. This data is still available in the LLM response for analytics if needed in the future.

The freshness mode uses `news_items` directly (not `topic_clusters`) as its signal source, so the entity extraction guard has no impact on freshness detection.

---

## 9. Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Entity guard accidentally blocks non-flagship entities | Low | Medium | Guard uses explicit flagship slug list + DB check. Unit test the boundary. |
| Approved pack goes stale (human doesn't run --approve) | Medium | Low | C5 warns after 14 days. Previous approved pack stays active. Weekly cron generates new drafts. |
| Freshness mode misses relevant events | Medium | Low | Existing entity extraction still runs for analytics. Manual event lane can be added later. |
| B1/B2/B3 behavior changes due to different subtopic input | Low | Medium | Materialization produces identical `topic_clusters` rows — B1 query unchanged. |
| Dashboard breaks due to new columns | Low | Low | New columns have defaults. Existing queries unaffected. |

---

## 10. Rollback Plan

Each phase is independently reversible:

- **Phase 1 rollback:** Delete pack files, drop new columns (or leave them — defaults are safe).
- **Phase 2 rollback:** Revert `loadSubtopics()` to the original LIKE query. Remove freshness cron entry.
- **Phase 3 rollback:** Remove the entity extraction guard. Entity extraction resumes writing flagship subtopics.
- **Phase 4 rollback:** Revert dashboard API changes.

No phase destroys existing data. The `source` column defaults to `'entity_extract'` so all existing rows retain their meaning.

---

## 11. Acceptance Criteria

### Phase 1
- [ ] SPEC-D1 implemented (full discovery + freshness scripts, subtopic-pack.ts)
- [ ] Schema migration runs without error on VPS
- [ ] At least one flagship topic has an approved, materialized pack

### Phase 2
- [ ] `loadSubtopics()` prefers flagship_discovery source for flagship topics
- [ ] Freshness mode runs daily for 7 days without errors
- [ ] Discovery cycle produces equivalent or better results

### Phase 3
- [ ] Entity extraction skips flagship subtopics (logged, not written)
- [ ] Non-flagship entity extraction unchanged
- [ ] `flagship_topic_slug` backfilled for all existing flagship clusters
- [ ] C5 health check reports migration status

### Phase 4
- [ ] Dashboard shows `source` column for topic_clusters
- [ ] Dashboard exposes flagship pack status endpoint
- [ ] PIPELINE.md updated to reflect new flow
- [ ] C1 event-triggered subtopic creation disabled for flagship topics

---

## 12. Impact Summary

| Component | Phase 1 | Phase 2 | Phase 3 | Phase 4 |
|---|---|---|---|---|
| `extract-entities.ts` | — | — | **Modified** (guard) | — |
| `discovery.ts` (C1) | — | **Modified** (loadSubtopics) | — | **Modified** (skip C1 for flagship) |
| `db.ts` | **Modified** (3 ALTERs) | — | — | — |
| `server/index.ts` | — | — | — | **Modified** (dashboard APIs, optional) |
| `topic_clusters` table | Additive rows | Query change | Write restriction | Semantic clarification |
| `create_queue` table | Additive column | — | — | — |
| `daily-pipeline.sh` | — | **Modified** (freshness cron) | — | — |
| `review.ts` (C5) | — | — | **Modified** (health checks) | — |
| B1/B2/B3/B4 | — | — | — | — |
| Performance Cycle | — | — | — | — |
