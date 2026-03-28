# SPEC-D1 — Flagship Topic Discovery Agent

> **Status: Implemented 2026-03-27** — See [LOG-D1-execution.md](LOG-D1-execution.md)

> **Files (new):**
> - `scripts/flagship-discovery.ts` — CLI entry point (full discovery mode)
> - `scripts/flagship-freshness.ts` — CLI entry point (daily freshness mode)
> - `scripts/lib/flagship-discovery.ts` — Full discovery core logic
> - `scripts/lib/flagship-freshness.ts` — Freshness routing core logic
> - `scripts/lib/subtopic-pack.ts` — Subtopic-pack CRUD, materialization, validation
> - `skills/flagship-discovery/SKILL-full.md` — LLM prompt for official + competitor synthesis
> - `skills/flagship-freshness/SKILL.md` — LLM prompt for event routing
> - `data/flagship-packs/{topic-slug}.json` — Persisted subtopic packs
>
> **Modifies:**
> - `scripts/lib/db.ts` — Schema migration (3 new columns)
> - `scripts/daily-pipeline.sh` — Cron integration
>
> **Depends on:** A2 (`serper.ts`), A3 (`exa.ts`), `db.ts`, `discovery.ts` (existing C1), `score-queue.ts` (B3)
> **Consumed by:** C1 (discovery-cycle — reads materialized topic_clusters), B4 (process-queue — reads create_queue)

---

## 1. Purpose

Replace entity-driven flagship subtopic seeding with a dedicated **Flagship Topic Discovery Agent** that becomes the **single source of truth** for flagship-topic subtopics.

Today, `extract-entities.ts` writes AI-extracted entities into `topic_clusters`, and `discovery.ts` (C1) reads `topic_clusters` to decide what to expand. For flagship topics, this mixes noisy daily entity signals with durable topic structure. The new agent separates these concerns:

- **Full Discovery Mode** (weekly, VPS cron) → maintains the durable subtopic map from official product surfaces + SERP/content competitors → sends Telegram summary → human approves with one tap
- **Freshness Mode** (daily, VPS cron) → maps daily events to existing subtopics and drafts refresh/create actions → fully automated, no human approval needed

The existing keyword engine (B1→B2→B3→B4) and unified `create_queue` remain intact. This agent is **upstream planning + freshness routing**, not a replacement for keyword expansion.

**Generalizability:** The system is topic-agnostic. Claude Code and Codex are the initial flagship topics, but the same workflow applies to any future flagship topic. Adding a new topic = one config entry + one full discovery run + one approval tap.

**Strategy reference:** Sections 1–7 of the Flagship Topic Discovery strategy doc.

---

## 2. Architecture: Two VPS Cron Scripts

### 2.1 Why Two Scripts

| Concern | Full Discovery | Freshness |
|---|---|---|
| Nature | Research-heavy (read docs, analyze competitors) | Classification (route events to subtopics) |
| Human involvement | Required — subtopic structure needs approval | None — routing decisions are operational |
| Cadence | Weekly | Daily |
| Tech | VPS cron script → draft pack → human approves via CLI | VPS cron script → auto-writes queue drafts |

### 2.2 Full Discovery: Script + CLI Approval

```
VPS cron (Saturday 7:30am SGT)
  → scripts/flagship-discovery.ts runs
  → Serper + Exa + Claude synthesize subtopic pack
  → Writes data/flagship-packs/{slug}.json (status='draft')
  → Prints summary to cron log

Human (when convenient)
  → SSH to VPS (or review pack JSON in repo after git push)
  → npx tsx scripts/flagship-discovery.ts --topic=claude-code --approve
  → Sets status='approved' → auto-materializes into topic_clusters + seeds keywords
  → Ready for B1→B2→B3→B4

If not approved
  → Pack stays as draft, previous approved pack remains active
  → C5 health check warns after 14 days
```

### 2.3 Freshness: Fully Automated Script

```
VPS cron (daily 4:30am SGT, Mon–Fri)
  → scripts/flagship-freshness.ts runs
  → Loads approved pack + recent news_items
  → Claude routes events to existing subtopics
  → Writes queue drafts to create_queue
  → No human approval needed
```

---

## 3. CLI Interface

### 3.1 Full Discovery

```bash
# Weekly maintenance — all flagship topics (cron default)
npx tsx scripts/flagship-discovery.ts

# Single topic (new flagship or debugging)
npx tsx scripts/flagship-discovery.ts --topic=claude-code

# Approve draft pack → auto-materialize into topic_clusters + seed keywords
npx tsx scripts/flagship-discovery.ts --topic=claude-code --approve

# Dry run (no DB writes, print results)
npx tsx scripts/flagship-discovery.ts --topic=claude-code --dry-run

# Skip SERP/competitor synthesis (faster, official docs only)
npx tsx scripts/flagship-discovery.ts --topic=claude-code --skip-serp
```

| Arg | Required | Default | Description |
|---|---|---|---|
| `--topic` | No | All flagship topics | Flagship topic slug |
| `--approve` | No | false | Approve current draft pack → auto-materialize |
| `--dry-run` | No | false | No DB writes, results to stdout |
| `--skip-serp` | No | false | Skip SERP/competitor synthesis |

### 3.2 Freshness

```bash
# Daily run — all flagship topics (cron default)
npx tsx scripts/flagship-freshness.ts

# Single topic
npx tsx scripts/flagship-freshness.ts --topic=claude-code

# Custom lookback window
npx tsx scripts/flagship-freshness.ts --hours=48

# Dry run
npx tsx scripts/flagship-freshness.ts --dry-run
```

| Arg | Required | Default | Description |
|---|---|---|---|
| `--topic` | No | All flagship topics with approved packs | Flagship topic slug |
| `--hours` | No | 30 | Lookback window for news_items |
| `--dry-run` | No | false | No DB writes, results to stdout |

---

## 4. Flagship Topics Config

Reuse the existing `FLAGSHIP_TOPICS` array from `scripts/lib/discovery.ts` (unchanged):

```typescript
// Already defined in discovery.ts — import, do not duplicate
import { FLAGSHIP_TOPICS, type FlagshipTopic } from './discovery';
```

To add a new flagship topic in the future:
1. Add entry to `FLAGSHIP_TOPICS` array
2. Run `npx tsx scripts/flagship-discovery.ts --topic=new-topic`
3. Approve via Telegram link
4. Done — freshness mode auto-picks it up, B1→B2→B3→B4 expands from seeds

---

## 5. New Artifacts

### 5.1 Subtopic Pack (primary artifact)

The main output of Full Discovery Mode. Persisted as JSON at `data/flagship-packs/{topic-slug}.json`.

```typescript
interface SubtopicPack {
  // Metadata
  topic_slug: string;                    // "claude-code"
  topic_name: string;                    // "Claude Code"
  version: number;                       // Incremented on each full discovery run
  status: 'draft' | 'approved';         // Human must approve before materialization
  created_at: string;                    // ISO timestamp
  approved_at: string | null;

  // Subtopics
  subtopics: Subtopic[];

  // Provenance
  sources: {
    official_docs: string[];             // URLs read for synthesis
    serp_competitors: string[];          // Content-competitor URLs analyzed
  };

  // Diff from previous version (for Telegram summary)
  diff?: {
    added: string[];                     // New subtopic slugs
    removed: string[];                   // Removed subtopic slugs
    unchanged: number;                   // Count of unchanged subtopics
  };
}

interface Subtopic {
  slug: string;                          // "claude-code-hooks"
  name: string;                          // "Hooks"
  description: string;                   // 1-2 sentence concept description
  aliases: string[];                     // ["claude code hook", "cc hooks"]
  evidence_type: 'official_doc' | 'serp_competitor' | 'news_signal' | 'gap_analysis';
  freshness_sensitivity: 'high' | 'medium' | 'low';  // How often this subtopic changes
  page_type_hints: string[];             // ["faq", "blog", "compare"]

  // Seed keyword pack (LLM-drafted, not final demand truth)
  seed_keywords: string[];               // 5-15 initial search phrases
}
```

**Key design decisions:**
- `status: 'draft'` until human taps Approve in Telegram. Prevents auto-materialization.
- `version` tracks lineage. Weekly maintenance increments version, preserving history.
- `seed_keywords` are **input to** B1 expansion, not replacements for it.
- `freshness_sensitivity` tells freshness mode which subtopics need more frequent event scanning.
- `diff` enables concise Telegram summaries ("New: +plugins, +web-workflows. Removed: -beta-features. Unchanged: 11").

### 5.2 Event-Routing Output

Produced by Freshness Mode. Not persisted to a separate file — logged to stdout and fed into queue drafts.

```typescript
interface EventRoutingResult {
  topic_slug: string;
  run_timestamp: string;
  events_processed: number;
  routings: EventRouting[];
  ignored_events: Array<{ title: string; reason: string }>;
}

interface EventRouting {
  event: {
    title: string;
    url: string;
    source: string;
    detected_at: string;
  };
  target_subtopics: string[];            // Subtopic slugs — one-to-many
  target_pages: string[];                // Existing content slugs to refresh
  action: 'refresh' | 'create' | 'refresh_and_create' | 'ignore';
  reasoning: string;                     // LLM explanation
  timeliness_hours: number;              // Hours since event detected
}
```

**Key design decisions:**
- One event → many subtopics/pages (fan-out, not 1:1).
- `target_pages` references existing `content.slug` values for refresh actions.
- `timeliness_hours` feeds into B3 timeliness bonus calculation.

### 5.3 Queue Draft Output

Produced by both modes. These are **recommendations** that flow into `create_queue`.

```typescript
interface QueueDraft {
  topic_slug: string;
  drafts: QueueDraftItem[];
}

interface QueueDraftItem {
  action: 'create' | 'refresh';
  subtopic_slug: string;
  suggested_primary_keyword: string;     // Best guess — may be overridden by B2/B3
  content_type: string;                  // faq, blog, compare, glossary, topic-hub
  research_pipeline: 'standard' | 'deep_research';
  priority_hint: 'high' | 'medium' | 'low';
  reasoning: string;
  source: 'full_discovery' | 'freshness' | 'serp_gap';

  // For refresh actions
  existing_content_slug?: string;        // content.slug to refresh
  refresh_meta?: {
    trigger: string;                     // What event triggered this
    suggested_changes: string;           // What to update
  };

  // For create actions
  seed_keywords?: string[];              // Starting keywords for B1
}
```

---

## 6. Full Discovery Mode

### 6.1 When to Run

- **New flagship topic:** Once, when a new topic is added to `FLAGSHIP_TOPICS`
- **Weekly maintenance:** Every Saturday 7:30am SGT, before the existing discovery cycle

### 6.2 Pipeline

```
Step 1: Official Surface Synthesis (Function 1)
  → Exa + Serper: find official docs for the flagship topic
  → Feed titles + snippets to Claude (Sonnet) with SKILL-full.md
  → Output: official subtopic candidates

Step 2: SERP/Content-Competitor Synthesis (Function 2)
  → Serper: search top queries for the flagship topic
  → Exa: extract content structure from ranking competitor sites
  → Claude: identify missing angles, compare opportunities
  → Output: competitor-derived candidates + gap report

Step 3: Normalize & Merge
  → Deduplicate (official evidence wins ties)
  → Claude (Haiku): draft 5-15 seed keywords per subtopic
  → Set freshness_sensitivity
  → Compute diff against previous pack version
  → Output: SubtopicPack (status='draft')

Step 4: Persist & Report
  → Write SubtopicPack to data/flagship-packs/{slug}.json
  → Git commit + push (so pack is reviewable in repo)
  → Print summary to stdout (for cron logs)
  → Human approves later via: --approve flag
```

### 6.3 Step 1: Official Surface Synthesis

```typescript
async function synthesizeOfficialSurfaces(
  topic: FlagshipTopic,
  opts: { dryRun: boolean }
): Promise<SubtopicCandidate[]>
```

**Implementation:**
1. Use Exa semantic search for `"{topic.name} official documentation"` and `"{topic.name} guide"` to find authoritative pages.
2. Use Serper to search `"{topic.name} documentation site:{known-official-domains}"`.
3. Feed collected page titles + snippets to Claude (Sonnet) with `SKILL-full.md` prompt.
4. LLM returns normalized subtopic candidates with evidence_type='official_doc'.

**For Claude Code specifically**, the known official domain is `docs.anthropic.com`. The LLM should identify concept families like: setup, platforms, workflows, settings, hooks, skills, subagents, MCP, plugins, automation, releases.

**For any future flagship topic**, the official domain is configured in `FlagshipTopic.officialDomains` (new optional field — see §4).

### 6.4 Step 2: SERP/Content-Competitor Synthesis

```typescript
async function synthesizeCompetitors(
  topic: FlagshipTopic,
  existingSubtopics: SubtopicCandidate[],
  opts: { skipSerp: boolean; dryRun: boolean }
): Promise<{ candidates: SubtopicCandidate[]; gapReport: GapReport }>
```

**Implementation:**
1. Serper: search `"{topic.name}"`, `"{topic.name} guide"`, `"{topic.name} tutorial"`, `"{topic.name} vs"`.
2. Exa: semantic search for top 10 ranking content sites (excluding official docs + own domain).
3. Extract page titles + headings from competitor content.
4. Feed to Claude with existing subtopics context → identify missing angles, compare opportunities.
5. Return candidates with evidence_type='serp_competitor' or 'gap_analysis'.

**Gap Report** (informational, included in Telegram summary):
```typescript
interface GapReport {
  missing_angles: string[];              // Subtopics competitors cover that we don't
  weak_content_types: string[];          // e.g., "no comparison pages for pricing"
  compare_opportunities: string[];       // "X vs Y" patterns seen in SERPs
  refresh_opportunities: string[];       // Stale competitor content we can outrank
}
```

### 6.5 Step 3: Normalize & Merge

Pure logic (no external API calls except Claude Haiku for seed keywords):
1. Deduplicate by slug (official_doc evidence wins over serp_competitor).
2. Merge aliases from both sources.
3. Call Claude (Haiku) to draft 5–15 seed keywords per subtopic.
4. Set `freshness_sensitivity` based on evidence type:
   - Topics with changelog/release evidence → `high`
   - Comparison/pricing topics → `medium`
   - Conceptual/tutorial topics → `low`
5. Compute diff against previous pack version (if exists).

### 6.6 LLM Prompt: `SKILL-full.md`

**System prompt responsibilities:**
- Accept a list of official page titles/snippets + competitor page structures
- Return normalized subtopic candidates (not raw nav labels)
- Assign evidence types and freshness sensitivity
- Draft seed keyword packs (search-phrase bundles, not marketing copy)
- Respect the distinction: subtopics are durable concept buckets, not keywords

**Output format:** JSON array of `SubtopicCandidate` objects.

---

## 7. Freshness Mode

### 7.1 When to Run

- **Daily** (Mon–Fri), after Entity Extract completes (4:30am SGT slot)
- Consumes existing collected signals — no new data collection needed
- **Fully automated** — no human approval required

### 7.2 Pipeline

```
Step 1: Load Fresh Signals
  → Read news_items from last N hours (default 30)
  → Read today's newsletter-selected items (if available)
  → Filter to items relevant to flagship topics

Step 2: Load Approved Pack
  → Read SubtopicPack from data/flagship-packs/{slug}.json
  → Must be status='approved' — skip topic if no approved pack

Step 3: Event-to-Subtopic Mapping (Function 3)
  → For each relevant news item:
    → LLM maps to 0+ existing subtopics (one-to-many)
    → LLM checks if any existing pages need refresh
    → LLM decides: refresh, create, or ignore
  → Output: EventRoutingResult

Step 4: Queue Draft Generation (Function 4)
  → Convert EventRouting → QueueDraftItem[]
  → Dedup against existing create_queue (no duplicate jobs)
  → Dedup against recent content (don't refresh what was just generated)
  → Output: QueueDraft

Step 5: Write Queue Drafts
  → Insert approved drafts into create_queue
  → Set timeliness metadata for B3 scoring
  → Log routing decisions
```

### 7.3 Step 1: Load Fresh Signals

```typescript
async function loadFreshSignals(
  topicSlug: string,
  pack: SubtopicPack,
  lookbackHours: number
): Promise<FreshSignal[]>
```

Reuse existing `getAllRecentNewsItems(hours)` from `db.ts`. Filter with a lightweight keyword match against the flagship topic name + known subtopic names from the approved pack.

```typescript
interface FreshSignal {
  news_item_id: number;
  title: string;
  url: string;
  source: string;
  summary: string;
  detected_at: string;
}
```

### 7.4 Step 3: Event-to-Subtopic Mapping

```typescript
async function routeEventsToSubtopics(
  signals: FreshSignal[],
  pack: SubtopicPack,
  existingContent: ExistingContentIndex[],
  opts: { dryRun: boolean }
): Promise<EventRoutingResult>
```

**Implementation:**
1. Build context: approved subtopics + their descriptions + existing content slugs/titles.
2. Batch signals (up to 20 per LLM call to stay within context limits).
3. Call Claude (Sonnet) with `SKILL.md` (freshness):
   - Input: signals + subtopic context + existing pages
   - Output: per-signal routing decisions (target subtopics, action, reasoning)
4. Post-process:
   - Drop routings where action='ignore'
   - Validate target subtopic slugs against approved pack
   - Calculate timeliness_hours from `detected_at`

**Critical constraint:** Freshness mode must **never** add new subtopics to the pack. It only routes events to existing approved subtopics. New subtopics can only be proposed in Full Discovery Mode.

### 7.5 Step 4: Queue Draft Generation + Dedup

```typescript
async function generateQueueDrafts(
  routings: EventRouting[],
  topicSlug: string,
  opts: { dryRun: boolean }
): Promise<QueueDraft>
```

**Dedup logic (critical for §11.6 of strategy):**

1. **Against create_queue:** Check if a pending/in_progress job already exists for the same `keyword_group_id` or same `suggested_primary_keyword` + `content_type` combo. Skip if duplicate.
2. **Against recent content:** Check `content` table for pages with matching slug generated in the last 7 days. Skip refresh if content is fresh.
3. **Against other freshness drafts:** Within the same run, if two events map to the same subtopic with the same action, merge them (combine reasoning, keep highest priority).

### 7.6 Step 5: Write Queue Drafts

For **create** actions:
- If the subtopic already has keywords in B1, create a `create_queue` entry linked to the best matching `keyword_group_id`.
- If no keywords exist yet, seed the keywords via `upsertKeyword()` first, then let the next discovery cycle (B1→B2→B3) handle expansion and scoring naturally.

For **refresh** actions:
- Write to `create_queue` with `content_type='refresh'` and `refresh_meta` JSON containing the trigger event, suggested changes, and timeliness data.
- This matches the existing Performance Cycle refresh pattern exactly.

### 7.7 LLM Prompt: `skills/flagship-freshness/SKILL.md`

**System prompt responsibilities:**
- Accept: list of fresh signals + approved subtopic pack + existing content inventory
- For each signal, decide: which subtopics does this affect? Which existing pages need refresh?
- Return structured routing decisions
- Must NOT propose new subtopics — only map to existing ones
- Must handle one-to-many: a single "plugins launch" event can trigger refresh on hooks, skills, MCP, and create a new plugins page

**Output format:** JSON matching `EventRouting[]`.

---

## 8. CLI Approval Flow

### 8.1 The `--approve` Flag

When `--approve` is passed, the script:
1. Loads the current draft pack from `data/flagship-packs/{slug}.json`
2. Validates it's in `status: 'draft'`
3. Sets `status: 'approved'`, `approved_at: now`
4. Auto-materializes into `topic_clusters` + seeds keywords
5. Prints summary

```typescript
async function approvePack(topicSlug: string): Promise<void> {
  const pack = loadPack(topicSlug);
  if (!pack) throw new Error(`No pack found for ${topicSlug}`);
  if (pack.status === 'approved') {
    console.log(`Pack for ${topicSlug} is already approved (v${pack.version})`);
    return;
  }

  pack.status = 'approved';
  pack.approved_at = new Date().toISOString();
  writePack(pack);

  const result = materializePack(pack, { dryRun: false });
  console.log(`✅ ${pack.topic_name} v${pack.version} approved & materialized`);
  console.log(`   ${result.subtopics_written} subtopics, ${result.keywords_seeded} seed keywords`);
}
```

### 8.2 Weekly Workflow

```bash
# Saturday: cron generates draft (automatic)
# You SSH in when convenient:
ssh loreai
cd /home/ubuntu/loreai-v2

# Review the draft
cat data/flagship-packs/claude-code.json | jq '.diff, .subtopics[].name'

# Approve
npx tsx scripts/flagship-discovery.ts --topic=claude-code --approve
```

Or review the pack JSON in the repo after the cron pushes it (it's committed as part of the pipeline).

---

## 9. Pipeline Integration: Materialization into topic_clusters

### 9.1 The Materialization Step

Auto-triggered when `--approve` is run. Part of the same CLI invocation — no separate step needed.

```typescript
function materializePack(
  pack: SubtopicPack,
  opts: { dryRun: boolean }
): MaterializationResult
```

**Logic:**
1. For each subtopic in the approved pack:
   - `upsertTopicCluster(subtopic.slug, subtopic.name)`
   - Set `source = 'flagship_discovery'`
   - Set `flagship_topic_slug = pack.topic_slug`
   - Set `mention_count = 100` (high baseline to signal flagship authority)
2. For subtopics that were in a previous pack version but removed:
   - Do NOT delete from `topic_clusters` (preserve history)
   - Log as "demoted" for observability
3. Write the flagship topic's own entry if not present:
   - `upsertTopicCluster(pack.topic_slug, pack.topic_name)`

**Result:** `topic_clusters` now contains the approved flagship subtopics, and the existing discovery cycle (B1→B2→B3) can consume them without any code changes.

### 9.2 Seed Keyword Injection

After materialization, inject seed keywords from the pack into the `keywords` table:

```typescript
for (const subtopic of pack.subtopics) {
  for (const kw of subtopic.seed_keywords) {
    upsertKeyword(kw, 'flagship-discovery', subtopic.slug);
  }
}
```

This uses the existing `upsertKeyword()` function. The `source='flagship-discovery'` tag distinguishes these from entity-extracted or Serper-discovered keywords.

The next B1 run will expand these seeds. B2 will group them. B3 will score and queue. **No changes to B1/B2/B3/B4 are needed.**

### 9.3 How B1/B2/B3 See the Data

From the keyword engine's perspective, nothing changes:
- B1 loads subtopics from `topic_clusters WHERE slug LIKE '{topic}-%'` → finds materialized flagship subtopics
- B1 loads existing keywords → finds seed keywords from flagship-discovery
- B1 expands via Serper/Exa as normal
- B2 groups ungrouped keywords as normal
- B3 scores and queues as normal

The only difference is **where the subtopics came from** (curated pack vs. entity extraction).

---

## 10. DB Schema Changes

### 10.1 New Column: `topic_clusters.source`

```sql
ALTER TABLE topic_clusters ADD COLUMN source TEXT DEFAULT 'entity_extract';
```

Values:
- `'entity_extract'` — Created by extract-entities.ts (legacy, default)
- `'flagship_discovery'` — Materialized from an approved subtopic pack
- `'discovery_c1'` — Created by C1 event-triggered subtopic discovery

### 10.2 New Column: `topic_clusters.flagship_topic_slug`

```sql
ALTER TABLE topic_clusters ADD COLUMN flagship_topic_slug TEXT DEFAULT NULL;
```

For subtopics that belong to a flagship topic, this stores the parent slug. Example:
- `slug='claude-code-hooks'`, `flagship_topic_slug='claude-code'`

### 10.3 New Column: `create_queue.source`

```sql
ALTER TABLE create_queue ADD COLUMN source TEXT DEFAULT 'discovery';
```

Values:
- `'discovery'` — Created by B3 (existing, default)
- `'flagship_freshness'` — Created by freshness mode
- `'flagship_full'` — Created by full discovery queue recommendations
- `'performance'` — Created by performance cycle refresh

### 10.4 Migration Script

Add to `initSchema()` in `db.ts` using the existing safe ALTER pattern:

```typescript
// D1 migration: flagship discovery columns
try {
  db.prepare('SELECT source FROM topic_clusters LIMIT 1').get();
} catch {
  db.prepare("ALTER TABLE topic_clusters ADD COLUMN source TEXT DEFAULT 'entity_extract'").run();
}
try {
  db.prepare('SELECT flagship_topic_slug FROM topic_clusters LIMIT 1').get();
} catch {
  db.prepare('ALTER TABLE topic_clusters ADD COLUMN flagship_topic_slug TEXT DEFAULT NULL').run();
}
try {
  db.prepare('SELECT source FROM create_queue LIMIT 1').get();
} catch {
  db.prepare("ALTER TABLE create_queue ADD COLUMN source TEXT DEFAULT 'discovery'").run();
}

```

---

## 11. Dedup & Fan-Out Model

### 11.1 One Event → Many Subtopics/Pages

The freshness LLM prompt explicitly models fan-out. Example:

> Event: "Claude Code plugins capability launched"
> → Refresh: claude-code-hooks page, claude-code-skills page, claude-code-mcp page
> → Create: claude-code-plugins (new page)
> → Create: claude-code-plugins-vs-skills (comparison)

The `EventRouting.target_subtopics` field is an array, not a scalar.

### 11.2 One Subtopic → Many Keyword Groups

Already handled by the existing B1→B2 flow. No changes needed.

### 11.3 No Duplicate Queue Jobs

Dedup function runs before every `create_queue` INSERT:

```typescript
function isDuplicateQueueJob(
  keywordGroupId: number | null,
  primaryKeyword: string,
  contentType: string,
): boolean {
  const db = getDb();

  // Check by keyword_group_id if available
  if (keywordGroupId) {
    const existing = db.prepare(
      `SELECT 1 FROM create_queue
       WHERE keyword_group_id = ? AND status IN ('pending', 'in_progress')
       LIMIT 1`
    ).get(keywordGroupId);
    if (existing) return true;
  }

  // Check by primary_keyword + content_type (fuzzy match for freshness drafts)
  const existing = db.prepare(
    `SELECT 1 FROM create_queue cq
     JOIN keyword_groups kg ON cq.keyword_group_id = kg.group_id
     WHERE kg.primary_keyword = ? AND cq.content_type = ?
       AND cq.status IN ('pending', 'in_progress')
     LIMIT 1`
  ).get(primaryKeyword, contentType);
  return !!existing;
}
```

---

## 12. Cron Integration

### 12.1 Schedule

| Mode | Cadence | Trigger | Cron Slot |
|---|---|---|---|
| Full Discovery | Weekly + on new flagship topic | Saturday 7:30am SGT (before existing 8am discovery) | `30 23 * * 5` UTC |
| Freshness | Daily (Mon–Fri) | After entity extract | `30 20 * * 0-4` UTC (4:30am SGT) |

### 12.2 daily-pipeline.sh Integration

Add to the existing pipeline script:

```bash
# After Entity Extract (4:00am), before Generate (6:00am)
# 4:30am SGT — Flagship Freshness Mode
echo "🔍 Flagship Freshness — $(date)"
npx tsx scripts/flagship-freshness.ts 2>&1 | tee -a "$LOG"
echo "flagship_freshness_exit=$?" >> "$LOG"

# Saturday only — Full Discovery Mode (before regular discovery cycle)
if [ "$(date +%u)" = "6" ]; then
  echo "🔭 Flagship Full Discovery — $(date)"
  npx tsx scripts/flagship-discovery.ts 2>&1 | tee -a "$LOG"
  echo "flagship_full_exit=$?" >> "$LOG"
fi
```

### 12.3 Updated Daily Flow

```
12:00am  Collect
 2:00am  Newsletter
 4:00am  Entity Extract
 4:30am  Flagship Freshness Mode          ← NEW (automated)
 6:00am  Generate (process-queue)
 7:30am  Flagship Full Discovery (Sat)     ← NEW (sends Telegram for approval)
 8:00am  Discovery Cycle (Tue & Sat)
10:00am  Performance Cycle (Sat)
 9:00pm  Review Cycle (C5)
```

---

## 13. Observability

### 13.1 Snapshot Metrics

Write to existing `snapshots` table after each run:

| metric_group | metric_key | Description |
|---|---|---|
| `flagship_discovery` | `approved_packs` | Count of topics with approved packs |
| `flagship_discovery` | `total_subtopics` | Total subtopics across all packs |
| `flagship_discovery` | `draft_packs` | Packs in draft status (need approval) |
| `flagship_freshness` | `events_processed` | Signals evaluated this run |
| `flagship_freshness` | `events_routed` | Signals that produced actions |
| `flagship_freshness` | `events_ignored` | Signals ignored (irrelevant) |
| `flagship_freshness` | `queue_drafts_created` | Jobs added to create_queue |
| `flagship_freshness` | `queue_drafts_deduped` | Jobs skipped (already in queue) |
| `flagship_migration` | `flagship_clusters` | topic_clusters where source='flagship_discovery' |
| `flagship_migration` | `entity_clusters` | topic_clusters where source='entity_extract' |

### 13.2 Console Output

```
🔭 Flagship Full Discovery — claude-code
══════════════════════════════════════════
Step 1: Official Surface Synthesis
  Sources scanned: 12
  Subtopic candidates: 14
Step 2: SERP/Content-Competitor Synthesis
  Competitors analyzed: 8
  Gap candidates: 3
  Compare opportunities: 2
Step 3: Normalize & Merge
  Final subtopics: 13 (8 official, 3 competitor, 2 gap)
  Seed keywords generated: 127
Step 4: Persist & Report
  Pack written: data/flagship-packs/claude-code.json (v3, draft)
  Run --approve to approve and materialize

🔍 Flagship Freshness — claude-code
══════════════════════════════════════════
Signals: 24 items from last 30 hours
Relevant: 6 items matched flagship topic
Routings:
  #1 "Anthropic ships hooks v2" → refresh hooks, refresh skills (2 pages)
  #2 "Claude Code GitHub Actions" → create automation-ci page
  Ignored: 4 items (not relevant to approved subtopics)
Queue: 3 drafts created, 0 deduped
```

### 13.3 Review Cycle (C5) Integration

Add to the existing C5 health checks (`scripts/lib/review.ts`):

```typescript
// Check pack file age and status
for (const topic of FLAGSHIP_TOPICS) {
  const packPath = `data/flagship-packs/${topic.slug}.json`;
  if (!existsSync(packPath)) {
    warnings.push(`No pack for flagship topic: ${topic.slug}`);
    continue;
  }
  const pack: SubtopicPack = JSON.parse(readFileSync(packPath, 'utf-8'));
  if (pack.status === 'draft') {
    warnings.push(`Pack for ${topic.slug} is still draft (v${pack.version}) — check Telegram for approval link`);
  }
  const daysSinceApproval = pack.approved_at
    ? (Date.now() - new Date(pack.approved_at).getTime()) / 86400000
    : Infinity;
  if (daysSinceApproval > 14) {
    warnings.push(`Pack for ${topic.slug} approved ${Math.floor(daysSinceApproval)}d ago — run full discovery`);
  }
}

```

---

## 14. File Structure

```
scripts/
├── flagship-discovery.ts           ← Full discovery CLI entry point
├── flagship-freshness.ts           ← Freshness CLI entry point
├── lib/
│   ├── flagship-discovery.ts       ← Full discovery core logic
│   ├── flagship-freshness.ts       ← Freshness routing core logic
│   └── subtopic-pack.ts            ← Pack CRUD, materialization, dedup, validation
├── ...
skills/
├── flagship-discovery/
│   └── SKILL-full.md               ← Full discovery LLM prompt
├── flagship-freshness/
│   └── SKILL.md                    ← Freshness routing LLM prompt
├── ...
data/
├── flagship-packs/
│   ├── claude-code.json            ← Persisted subtopic pack
│   ├── codex.json
│   └── ...
```

---

## 15. Error Handling

- **No approved pack in freshness mode:** Skip that topic, log warning. Never fall back to entity-derived clusters.
- **LLM returns invalid JSON:** Retry once with same prompt. On second failure, log error, skip step, continue pipeline.
- **Exa/Serper rate limit:** Use existing retry/backoff from A2/A3 clients.
- **Materialization fails mid-write:** `upsertTopicCluster()` is idempotent. Safe to re-run.
- **Pack file corrupted:** Validate JSON schema on load. If invalid, treat as missing (skip in freshness, regenerate in full).
- **Pack not approved:** Stays as draft. Previous approved pack remains active. Next weekly run generates a new draft.

---

## 16. Testing Strategy

### 16.1 Unit Tests

- `subtopic-pack.ts`: Pack read/write/validation, materialization logic, dedup function, diff computation, approve flow
- `flagship-freshness.ts`: Signal filtering, event routing post-processing, queue draft generation
- Priority: Pure functions (dedup, filtering, normalization, diff) first

### 16.2 Integration Tests

- Full discovery end-to-end with mocked API responses
- Freshness mode with seeded news_items + approved pack
- Materialization → verify topic_clusters state
- Dedup → verify no duplicate create_queue entries
- Approval flow → --approve sets status + materializes

### 16.3 Smoke Test

```bash
# Full discovery dry run
npx tsx scripts/flagship-discovery.ts --topic=claude-code --dry-run

# Freshness dry run
npx tsx scripts/flagship-freshness.ts --topic=claude-code --dry-run
```

---

## 17. What This Spec Does NOT Cover

- **Replacement of B1/B2/B3/B4** — untouched
- **Replacement of unified create_queue** — untouched, only new source values added
- **Automatic flagship topic selection** — topics remain manually curated in config
- **Manual event input lane** — events come from existing collected signals only
- **Entity extraction for non-flagship topics** — unchanged (see SPEC-D2 for sunset scope)
- **Total architecture rewrite** — this attaches to the current system

---

## 18. Worked Example: Claude Code

### 18.1 Full Discovery Output

After running on Saturday 7:30am:

```json
{
  "topic_slug": "claude-code",
  "topic_name": "Claude Code",
  "version": 1,
  "status": "draft",
  "subtopics": [
    {
      "slug": "claude-code-setup",
      "name": "Setup & Getting Started",
      "description": "Installation, first run, and initial configuration across platforms",
      "aliases": ["install claude code", "claude code getting started"],
      "evidence_type": "official_doc",
      "freshness_sensitivity": "medium",
      "page_type_hints": ["faq", "blog"],
      "seed_keywords": [
        "how to install claude code",
        "claude code setup guide",
        "claude code getting started",
        "claude code requirements",
        "claude code first project"
      ]
    },
    {
      "slug": "claude-code-hooks",
      "name": "Hooks",
      "description": "Event-driven automation hooks that execute shell commands on tool calls and lifecycle events",
      "aliases": ["claude code hook", "cc hooks"],
      "evidence_type": "official_doc",
      "freshness_sensitivity": "high",
      "page_type_hints": ["faq", "blog", "glossary"],
      "seed_keywords": [
        "claude code hooks",
        "claude code hooks guide",
        "claude code hook examples",
        "how to use hooks in claude code",
        "claude code hooks vs skills",
        "claude code pre-tool-use hook"
      ]
    }
  ],
  "diff": null,
  "sources": {
    "official_docs": ["https://docs.anthropic.com/en/docs/claude-code/..."],
    "serp_competitors": ["https://competitor1.com/claude-code-guide", "..."]
  }
}
```

Console output:
```
🔭 Flagship Full Discovery — claude-code
══════════════════════════════════════════
...
Step 4: Persist & Report
  Pack written: data/flagship-packs/claude-code.json (v1, draft)
  Run --approve to approve and materialize
```

### 18.2 Freshness Routing Example

Signal: "Anthropic ships Claude Code plugins — package skills, hooks, and MCP servers together"

```json
{
  "event": {
    "title": "Anthropic ships Claude Code plugins",
    "url": "https://docs.anthropic.com/...",
    "source": "anthropic-blog",
    "detected_at": "2026-03-27T10:00:00Z"
  },
  "target_subtopics": ["claude-code-hooks", "claude-code-skills", "claude-code-mcp", "claude-code-plugins"],
  "target_pages": ["faq/claude-code-hooks", "blog/claude-code-skills-guide"],
  "action": "refresh_and_create",
  "reasoning": "Plugins package hooks+skills+MCP. Refresh existing hooks/skills pages to mention plugin packaging. Create new plugins explainer.",
  "timeliness_hours": 2
}
```

This produces 3 queue drafts:
1. Refresh `faq/claude-code-hooks` — mention plugin packaging
2. Refresh `blog/claude-code-skills-guide` — mention plugin packaging
3. Create `claude-code-plugins` — new explainer page (blog or faq)

All three enter `create_queue` with `source='flagship_freshness'` and timeliness metadata.
