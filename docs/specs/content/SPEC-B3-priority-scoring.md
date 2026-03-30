---
title: "SPEC-B3 — Priority Scoring + Unified Queue"
status: active
category: spec
last-updated: 2026-03-20
depends-on: ["SPEC-B2"]
---

# SPEC-B3 — Priority Scoring + Unified Queue

> **Files:**
> - `scripts/score-and-queue.ts` — CLI entry point
> - `scripts/lib/priority.ts` — Core scoring + routing logic (pure functions, highly testable)
>
> **Depends on:** A1 (schema — `keyword_groups`, `create_queue` tables), A2 (serper.ts — `detectSERPDepth`), B1 (keyword expansion), B2 (keyword grouping — populated `keyword_groups` table)
> **Consumed by:** B4 (source-grounded content generation), C1 (discovery cycle), C3 (performance cycle)

---

## 1. Purpose

给每个 keyword group 计算 **priority score**，并根据 intent + SERP depth signal 决定 **content_type** 和 **research_pipeline**，然后将排好序的 create jobs 写入 `create_queue` 表。

这是 keyword engine 的 **决策中枢**——它回答 "What specific page do we build next?" 的问题（STRATEGY §4.5）。B1 发现 keywords，B2 将它们分组，B3 决定 **哪些组优先做、做成什么类型、用什么深度的 research pipeline**。

**旧模型 vs 新模型：**

| 旧模型（type-based 固定顺序） | 新模型（opportunity-based） |
|---|---|
| 1. Cornerstone → 2. Compare → 3. FAQ → 4. Glossary | 按 priority score 排序，highest ROI first |
| 内容类型决定顺序 | 数据驱动，可能先做低竞争 FAQ 再做 compare |

**核心设计原则：**
- `scripts/lib/priority.ts` 是 **纯计算逻辑**，零副作用，零 API 调用——所有输入通过参数传入
- SERP depth detection（Serper API 调用）在 scoring 之前完成，结果作为参数传入 scoring 函数
- 所有公式参数（multiplier、decay rate 等）集中定义为常量，易于调优

---

## 2. CLI Interface

```bash
# 基本用法：对所有 pending keyword_groups 进行 scoring + queue
npx tsx scripts/score-and-queue.ts --topic=claude-code

# 只 score 一个 cluster
npx tsx scripts/score-and-queue.ts --cluster=claude-code-pricing

# Dry run（不写 DB，只输出 scoring 结果和 queue 预览）
npx tsx scripts/score-and-queue.ts --topic=claude-code --dry-run

# 跳过 SERP depth detection（使用 B2 的 content_type 建议，不调 Serper API）
npx tsx scripts/score-and-queue.ts --topic=claude-code --skip-serp

# 限制 SERP depth API 调用（控制 cost）
npx tsx scripts/score-and-queue.ts --topic=claude-code --max-serp=20
```

### Arguments

| Arg | Required | Default | Description |
|---|---|---|---|
| `--topic` | One of `--topic`/`--cluster` | — | Flagship topic slug，score 其下所有 pending groups |
| `--cluster` | One of `--topic`/`--cluster` | — | 单个 cluster slug |
| `--dry-run` | No | false | 不写 DB，输出 scoring 结果到 stdout |
| `--skip-serp` | No | false | 跳过 SERP depth detection，使用 B2 的 content_type 建议 |
| `--max-serp` | No | 50 | SERP depth API 调用上限（每次 run） |
| `--force` | No | false | 重新 score 已有 score 的 groups（默认只 score `priority_score = 0` 的） |

---

## 3. Priority Score Formula

```
PRIORITY_SCORE = volume × (1 / competition) × intent_multiplier + timeliness_bonus
```

### 3.1 Volume

来自 `keywords.search_volume`，取 group 中所有 keywords 的 **max volume**（primary keyword 通常是 highest volume，但不保证）。

| Condition | Handling |
|---|---|
| Group 有 volume 数据 | 使用 max(search_volume) |
| Group 所有 keywords 的 volume = NULL | 使用 `DEFAULT_VOLUME = 10`（保底值，确保有 score） |
| Volume = 0 | 使用 `MIN_VOLUME = 1`（防止 score 归零） |

```typescript
function getGroupVolume(keywords: GroupKeyword[]): number {
  const volumes = keywords
    .map(kw => kw.search_volume)
    .filter((v): v is number => v !== null && v > 0);
  if (volumes.length === 0) return DEFAULT_VOLUME;
  return Math.max(...volumes);
}
```

### 3.2 Competition

来自 `keywords.competition`，取 group 中 primary keyword 的 competition 值。

| Competition Text | Numeric Divisor |
|---|---|
| `low` | 0.2 |
| `medium` | 0.5 |
| `high` | 1.0 |
| `very_high` | 2.0 |
| `NULL` / 缺失 | 0.5 (default = medium) |

```typescript
const COMPETITION_MAP: Record<string, number> = {
  low: 0.2,
  medium: 0.5,
  high: 1.0,
  very_high: 2.0,
};

const DEFAULT_COMPETITION = 0.5;

function getCompetitionDivisor(competition: string | null): number {
  if (!competition) return DEFAULT_COMPETITION;
  return COMPETITION_MAP[competition] ?? DEFAULT_COMPETITION;
}
```

**注意：** `1 / competition` 的含义是 competition 越低 → score 越高。`low` 的 divisor 是 0.2，所以 `1/0.2 = 5x` multiplier。`very_high` 的 divisor 是 2.0，所以 `1/2.0 = 0.5x` multiplier。

### 3.3 Intent Multiplier

来自 `keyword_groups.intent`（由 B2 设定）。

| Intent | Multiplier | Rationale |
|---|---|---|
| `commercial` | 3.0 | Decision-stage users，highest conversion value |
| `informational` | 1.5 | Good traffic，moderate conversion |
| `definitional` | 1.0 | Authority building，lower traffic |
| `navigational` | 0.5 | Internal use，not traffic-driving |

```typescript
const INTENT_MULTIPLIER: Record<string, number> = {
  commercial: 3.0,
  informational: 1.5,
  definitional: 1.0,
  navigational: 0.5,
};

const DEFAULT_INTENT_MULTIPLIER = 1.0;
```

### 3.4 Timeliness Bonus

当 keyword group 关联到近期新闻事件时，获得 timeliness bonus。Bonus 在 48 小时内为最大值，然后在 7 天内线性衰减到 0。

```typescript
const TIMELINESS_MAX_BONUS = 5000;
const TIMELINESS_FULL_HOURS = 48;    // Full bonus window
const TIMELINESS_DECAY_HOURS = 168;  // 7 days total, then 0

/**
 * Calculate timeliness bonus based on hours since the event.
 * Returns TIMELINESS_MAX_BONUS for events within 48h,
 * linearly decays to 0 between 48h and 168h (7 days),
 * returns 0 after 7 days.
 */
function getTimelinessBonus(eventAgeHours: number | null): number {
  if (eventAgeHours === null) return 0;
  if (eventAgeHours < 0) return 0;
  if (eventAgeHours <= TIMELINESS_FULL_HOURS) return TIMELINESS_MAX_BONUS;
  if (eventAgeHours >= TIMELINESS_DECAY_HOURS) return 0;

  // Linear decay from FULL to DECAY
  const decayWindow = TIMELINESS_DECAY_HOURS - TIMELINESS_FULL_HOURS; // 120h
  const hoursIntoDecay = eventAgeHours - TIMELINESS_FULL_HOURS;
  return TIMELINESS_MAX_BONUS * (1 - hoursIntoDecay / decayWindow);
}
```

**Event age 如何确定：** keyword_groups 本身不存储 event timestamp。Timeliness bonus 通过可选参数传入，来源是：
- News pipeline 发现新事件 → 创建/更新 keyword group 时附带 `detected_at` timestamp
- `score-and-queue.ts` CLI 查询 `news_items.detected_at` 关联到 keyword group（通过 keyword 匹配或 cluster 匹配）
- 如果找不到关联新闻事件，timeliness bonus = 0

### 3.5 Complete Scoring Function

```typescript
export interface ScoringInput {
  group_id: number;
  primary_keyword: string;
  intent: string;
  content_type: string;           // B2's suggestion
  cluster_slug: string | null;
  keywords: GroupKeyword[];       // All keywords in this group (with volume/competition)
  event_age_hours: number | null; // Hours since related news event, null if none
}

export interface GroupKeyword {
  keyword: string;
  search_volume: number | null;
  competition: string | null;
}

export interface ScoringResult {
  group_id: number;
  primary_keyword: string;
  priority_score: number;
  score_breakdown: {
    volume: number;
    competition_divisor: number;
    intent_multiplier: number;
    base_score: number;           // volume * (1/competition) * intent_multiplier
    timeliness_bonus: number;
  };
}

export function calculatePriorityScore(input: ScoringInput): ScoringResult {
  const volume = getGroupVolume(input.keywords);
  const competitionDivisor = getCompetitionDivisor(
    input.keywords.find(kw => kw.keyword === input.primary_keyword)?.competition ?? null
  );
  const intentMultiplier = INTENT_MULTIPLIER[input.intent] ?? DEFAULT_INTENT_MULTIPLIER;
  const timelinessBonus = getTimelinessBonus(input.event_age_hours);

  const baseScore = volume * (1 / competitionDivisor) * intentMultiplier;
  const totalScore = baseScore + timelinessBonus;

  return {
    group_id: input.group_id,
    primary_keyword: input.primary_keyword,
    priority_score: Math.round(totalScore * 100) / 100,
    score_breakdown: {
      volume,
      competition_divisor: competitionDivisor,
      intent_multiplier: intentMultiplier,
      base_score: Math.round(baseScore * 100) / 100,
      timeliness_bonus: Math.round(timelinessBonus * 100) / 100,
    },
  };
}
```

### 3.6 Score Examples

| Keyword Group | Volume | Competition | Intent | Timeliness | Score |
|---|---|---|---|---|---|
| "claude code vs cursor" | 10000 | low (0.2) | commercial (3.0) | none | 10000 × 5.0 × 3.0 = **150,000** |
| "how much does claude code cost" | 1000 | low (0.2) | informational (1.5) | none | 1000 × 5.0 × 1.5 = **7,500** |
| "what is MCP server" | 100 | medium (0.5) | definitional (1.0) | none | 100 × 2.0 × 1.0 = **200** |
| "claude code new pricing 2026" | 100 | low (0.2) | informational (1.5) | 24h old (full bonus) | 100 × 5.0 × 1.5 + 5000 = **5,750** |
| (no volume data) | 10 (default) | NULL (0.5) | informational (1.5) | none | 10 × 2.0 × 1.5 = **30** |

---

## 4. Queue Routing

每个 keyword group 被路由到一个 `content_type` + `research_pipeline` 组合。路由逻辑分两层：

### 4.1 SERP Depth Detection（可选，推荐）

调用 `serper.detectSERPDepth()` 获取 SERP depth signal，用于决定是否 override B2 的 content_type 建议。

```typescript
import { detectSERPDepth, SERPDepthResult, SERPDepth } from './serper';

export interface RoutingInput {
  intent: string;
  b2_content_type: string;              // B2's suggested content_type
  serp_depth: SERPDepth | null;         // null if --skip-serp
  recommended_content_type: string | null; // from detectSERPDepth
  cluster_page_count: number;           // pages already published in this cluster
}

export interface RoutingResult {
  content_type: string;
  research_pipeline: 'standard' | 'deep_research';
  routing_reason: string;
}
```

### 4.2 Routing Rules

```typescript
export function routeKeywordGroup(input: RoutingInput): RoutingResult {
  // Rule 1: Cornerstone auto-triggers when cluster has 15+ pages
  if (input.cluster_page_count >= 15 && input.b2_content_type === 'topic-hub') {
    // topic-hub stays as-is, but if intent is definitional + head term → cornerstone candidate
  }

  // Rule 2: SERP depth override
  if (input.serp_depth && input.intent === 'informational') {
    if (input.serp_depth === 'long_form' && input.b2_content_type === 'faq') {
      // SERP shows top results are 2000+ word guides → FAQ can't compete → use blog + deep research
      return {
        content_type: 'blog',
        research_pipeline: 'deep_research',
        routing_reason: 'SERP depth override: top results are long-form, upgraded faq → blog (deep research)',
      };
    }
  }

  // Rule 3: Content type → pipeline mapping (default)
  return routeByContentType(input.b2_content_type, input.intent);
}
```

### 4.3 Content Type → Pipeline Mapping

| Content Type | Research Pipeline | Skill | Condition |
|---|---|---|---|
| `compare` | standard | `compare` skill | Always |
| `faq` | standard | `faq` skill | When SERP depth is `short_answer` or `mixed` |
| `glossary` | standard | `glossary` skill | Always |
| `topic-hub` | standard | `topic-hub` skill | Created last (cluster_page_count >= 15) |
| `blog` (informational, SERP long_form) | deep_research | `deep-dive` skill | SERP depth shows long-form content ranking |
| `blog` (informational, SERP short/mixed) | standard | `news-blog` skill | Default for informational blog |

```typescript
function routeByContentType(contentType: string, intent: string): RoutingResult {
  switch (contentType) {
    case 'compare':
      return {
        content_type: 'compare',
        research_pipeline: 'standard',
        routing_reason: 'commercial intent → compare (standard pipeline)',
      };
    case 'faq':
      return {
        content_type: 'faq',
        research_pipeline: 'standard',
        routing_reason: 'question-form informational → faq (standard pipeline)',
      };
    case 'glossary':
      return {
        content_type: 'glossary',
        research_pipeline: 'standard',
        routing_reason: 'definitional intent → glossary (standard pipeline)',
      };
    case 'topic-hub':
      return {
        content_type: 'topic-hub',
        research_pipeline: 'standard',
        routing_reason: 'navigational → topic-hub (standard pipeline)',
      };
    case 'blog':
      return {
        content_type: 'blog',
        research_pipeline: 'deep_research',
        routing_reason: 'informational blog → deep research pipeline',
      };
    default:
      return {
        content_type: contentType,
        research_pipeline: 'standard',
        routing_reason: `fallback: unknown content_type "${contentType}" → standard pipeline`,
      };
  }
}
```

### 4.4 Topic Hub Constraint

Topic hub 必须是 **最后创建的**——它需要链接到 cluster 中已有的页面。

```typescript
const TOPIC_HUB_MIN_PAGES = 15;

function shouldDeferTopicHub(contentType: string, clusterPageCount: number): boolean {
  return contentType === 'topic-hub' && clusterPageCount < TOPIC_HUB_MIN_PAGES;
}
```

如果 `shouldDeferTopicHub` 返回 true，该 group 不进入 `create_queue`，保持 `status = 'pending'`。下次 scoring run 时重新检查。

---

## 5. Orchestration Flow

```
Step 1: Load pending keyword_groups from DB
Step 2: Load associated keywords (with volume/competition) for each group
Step 3: (Optional) SERP depth detection for each group's primary_keyword
Step 4: Calculate priority score for each group
Step 5: Route each group → content_type + research_pipeline
Step 6: Filter out deferred groups (topic-hub with < 15 cluster pages)
Step 7: Filter out groups that already have a pending/in-progress job in create_queue
Step 8: Write to create_queue, update keyword_groups.priority_score + status
Step 9: Output summary
```

### 5.1 Loading Pending Groups

```sql
-- Load groups that need scoring
SELECT kg.group_id, kg.primary_keyword, kg.intent, kg.content_type,
       kg.cluster_slug, kg.priority_score, kg.status
FROM keyword_groups kg
WHERE kg.cluster_slug LIKE ? OR kg.cluster_slug = ?
  AND (kg.priority_score = 0 OR ? = 1)  -- ? = force flag
  AND kg.status = 'pending'
ORDER BY kg.group_id
```

### 5.2 Loading Keywords per Group

```sql
SELECT keyword, search_volume, competition
FROM keywords
WHERE keyword_group_id = ?
```

### 5.3 Checking Existing Queue Jobs

```sql
-- Check if a group already has a pending/in-progress job
SELECT job_id FROM create_queue
WHERE keyword_group_id = ?
  AND status IN ('pending', 'in_progress')
```

### 5.4 Writing to Queue

```sql
INSERT INTO create_queue
  (keyword_group_id, content_type, research_pipeline, priority_score, status)
VALUES (?, ?, ?, ?, 'pending')
```

```sql
-- Update keyword_groups with new score and status
UPDATE keyword_groups
SET priority_score = ?, status = 'queued', updated_at = CURRENT_TIMESTAMP
WHERE group_id = ?
```

---

## 6. DB Write

### 6.1 Transaction

整个 scoring + queue write 在一个 transaction 中完成：

```typescript
const writeQueue = db.transaction(() => {
  for (const item of scoredGroups) {
    // 1. Update keyword_groups.priority_score
    updateGroupScore.run(item.scoring.priority_score, item.group_id);

    // 2. Insert into create_queue (if not deferred and not already queued)
    if (!item.deferred && !item.already_queued) {
      insertQueueJob.run(
        item.group_id,
        item.routing.content_type,
        item.routing.research_pipeline,
        item.scoring.priority_score,
      );
      updateGroupStatus.run('queued', item.group_id);
    }
  }
});
writeQueue();
```

### 6.2 Idempotency

- `score-and-queue.ts` 是 **幂等的**——重复运行不会创建 duplicate queue jobs
- 已有 pending/in_progress job 的 group 不会重复入队
- `--force` 只重新计算 score，不重复入队
- Score 更新总是覆盖旧值（`keyword_groups.priority_score`）

---

## 7. Output Types

```typescript
/** Input to the scoring function — pure data, no DB dependency */
export interface ScoringInput {
  group_id: number;
  primary_keyword: string;
  intent: string;
  content_type: string;
  cluster_slug: string | null;
  keywords: GroupKeyword[];
  event_age_hours: number | null;
}

export interface GroupKeyword {
  keyword: string;
  search_volume: number | null;
  competition: string | null;
}

/** Output of scoring */
export interface ScoringResult {
  group_id: number;
  primary_keyword: string;
  priority_score: number;
  score_breakdown: {
    volume: number;
    competition_divisor: number;
    intent_multiplier: number;
    base_score: number;
    timeliness_bonus: number;
  };
}

/** Input to routing function */
export interface RoutingInput {
  intent: string;
  b2_content_type: string;
  serp_depth: 'short_answer' | 'long_form' | 'mixed' | null;
  recommended_content_type: string | null;
  cluster_page_count: number;
}

/** Output of routing */
export interface RoutingResult {
  content_type: string;
  research_pipeline: 'standard' | 'deep_research';
  routing_reason: string;
}

/** Combined result for queue entry */
export interface QueueEntry {
  group_id: number;
  primary_keyword: string;
  scoring: ScoringResult;
  routing: RoutingResult;
  deferred: boolean;       // true if topic-hub with < 15 pages
  already_queued: boolean;  // true if existing pending/in_progress job
}

/** Full run result */
export interface ScoringRunResult {
  groups_scored: number;
  groups_queued: number;
  groups_deferred: number;
  groups_already_queued: number;
  serp_api_calls: number;
  queue_entries: QueueEntry[];
}
```

---

## 8. Script Structure

```
scripts/
├── score-and-queue.ts                     # CLI entry point
├── lib/
│   ├── priority.ts                        # Pure scoring + routing logic
│   ├── serper.ts                          # Existing — detectSERPDepth()
│   ├── db.ts                             # Existing — DB layer
│   └── __tests__/
│       └── priority.test.ts              # Unit tests (extensive)
└── __tests__/
    └── score-and-queue.integration.test.ts  # Integration tests
```

### `scripts/lib/priority.ts` — Pure Logic

```typescript
// ── Constants (all tuning params in one place) ──

export const DEFAULT_VOLUME = 10;
export const MIN_VOLUME = 1;
export const DEFAULT_COMPETITION = 0.5;

export const COMPETITION_MAP: Record<string, number> = {
  low: 0.2, medium: 0.5, high: 1.0, very_high: 2.0,
};

export const INTENT_MULTIPLIER: Record<string, number> = {
  commercial: 3.0, informational: 1.5, definitional: 1.0, navigational: 0.5,
};
export const DEFAULT_INTENT_MULTIPLIER = 1.0;

export const TIMELINESS_MAX_BONUS = 5000;
export const TIMELINESS_FULL_HOURS = 48;
export const TIMELINESS_DECAY_HOURS = 168;

export const TOPIC_HUB_MIN_PAGES = 15;

// ── Pure Functions ──

export function getGroupVolume(keywords: GroupKeyword[]): number;
export function getCompetitionDivisor(competition: string | null): number;
export function getIntentMultiplier(intent: string): number;
export function getTimelinessBonus(eventAgeHours: number | null): number;
export function calculatePriorityScore(input: ScoringInput): ScoringResult;
export function routeKeywordGroup(input: RoutingInput): RoutingResult;
export function shouldDeferTopicHub(contentType: string, clusterPageCount: number): boolean;
```

### `scripts/score-and-queue.ts` — CLI Entry Point

```typescript
async function main() {
  // Stage 1: Load pending keyword_groups from DB
  // Stage 2: Load keywords per group
  // Stage 3: (Optional) SERP depth detection (batch, respects --max-serp)
  // Stage 4: Score all groups
  // Stage 5: Route all groups
  // Stage 6: Write to create_queue (unless --dry-run)
  // Stage 7: Summary

  closeDb();
}
```

---

## 9. Error Handling

| Scenario | Handling |
|---|---|
| No pending keyword_groups | Exit with "✓ No pending groups to score" message |
| Group with 0 keywords in DB | Skip with warning, use DEFAULT_VOLUME |
| Serper API failure for one keyword | Log warning, skip SERP depth for that group (use B2's content_type) |
| `SERPER_API_KEY` missing + no `--skip-serp` | Auto-fallback to `--skip-serp` mode with warning |
| Unknown intent value | Use `DEFAULT_INTENT_MULTIPLIER` with warning |
| Unknown competition value | Use `DEFAULT_COMPETITION` with warning |
| DB write failure | Rollback transaction, exit with error |

---

## 10. Console Output

```
📊 Priority Scoring — claude-code
==================================================

📥 Stage 1: Load Pending Groups
  Found 12 keyword groups across 4 clusters

🔍 Stage 2: SERP Depth Detection
  [1/12] "claude code vs cursor" → long_form
  [2/12] "how much does claude code cost" → short_answer
  [3/12] "what is MCP server" → mixed
  ...
  ✓ 12 SERP depth checks (3 Serper API calls — cached)

📈 Stage 3: Priority Scoring
  TOP 5:
    1. "claude code vs cursor"             → 150,000  (vol=10000 comp=low intent=commercial)
    2. "claude code new pricing 2026"      →   5,750  (vol=100 comp=low intent=info + timeliness=5000)
    3. "how much does claude code cost"    →   7,500  (vol=1000 comp=low intent=info)
    4. "is claude code free"               →   3,000  (vol=10000 comp=medium intent=info)
    5. "what is MCP server"                →     200  (vol=100 comp=medium intent=def)

🔀 Stage 4: Queue Routing
  compare (standard):     3 groups
  faq (standard):         5 groups
  blog (deep_research):   2 groups
  glossary (standard):    1 group
  topic-hub (deferred):   1 group (cluster has 8/15 pages)

💾 Stage 5: Write to Queue
  11 jobs added to create_queue
  1 group deferred (topic-hub)
  0 groups already queued

✅ Scoring complete — 12 groups scored, 11 queued
```

Dry run 时 Stage 5 替换为：
```
🧪 DRY RUN — skipping DB write
  Would add 11 jobs to create_queue
  Would defer 1 group (topic-hub)
```

---

## 11. Test Plan

### 11.1 Unit Tests (`scripts/lib/__tests__/priority.test.ts`)

**重点：** `priority.ts` 是纯函数，每个函数都可以独立测试，不需要 mock DB 或 API。

#### `getGroupVolume` tests

| Test | Input | Expected | 验证 |
|---|---|---|---|
| Normal — multiple keywords with volume | `[{vol: 100}, {vol: 1000}, {vol: 500}]` | `1000` | Returns max volume |
| Single keyword | `[{vol: 500}]` | `500` | Single value works |
| All null volumes | `[{vol: null}, {vol: null}]` | `DEFAULT_VOLUME (10)` | Fallback to default |
| Mixed null and non-null | `[{vol: null}, {vol: 100}, {vol: null}]` | `100` | Ignores nulls |
| Volume = 0 (all zeros) | `[{vol: 0}, {vol: 0}]` | `DEFAULT_VOLUME (10)` | Zero treated as missing |
| Empty keyword list | `[]` | `DEFAULT_VOLUME (10)` | Empty list fallback |
| Very large volume | `[{vol: 1_000_000}]` | `1_000_000` | No cap |

#### `getCompetitionDivisor` tests

| Test | Input | Expected | 验证 |
|---|---|---|---|
| low | `'low'` | `0.2` | Correct mapping |
| medium | `'medium'` | `0.5` | Correct mapping |
| high | `'high'` | `1.0` | Correct mapping |
| very_high | `'very_high'` | `2.0` | Correct mapping |
| null | `null` | `0.5` (DEFAULT) | Null fallback |
| unknown string | `'ultra_low'` | `0.5` (DEFAULT) | Unknown fallback |
| empty string | `''` | `0.5` (DEFAULT) | Empty fallback |

#### `getIntentMultiplier` tests

| Test | Input | Expected | 验证 |
|---|---|---|---|
| commercial | `'commercial'` | `3.0` | Highest multiplier |
| informational | `'informational'` | `1.5` | Moderate multiplier |
| definitional | `'definitional'` | `1.0` | Base multiplier |
| navigational | `'navigational'` | `0.5` | Lowest multiplier |
| unknown | `'transactional'` | `1.0` (DEFAULT) | Unknown fallback |
| empty string | `''` | `1.0` (DEFAULT) | Empty fallback |

#### `getTimelinessBonus` tests

| Test | Input (hours) | Expected | 验证 |
|---|---|---|---|
| null (no event) | `null` | `0` | No event → no bonus |
| Negative hours | `-5` | `0` | Invalid → no bonus |
| 0 hours (just happened) | `0` | `5000` | Full bonus |
| 24 hours | `24` | `5000` | Within 48h → full bonus |
| 48 hours (boundary) | `48` | `5000` | Exactly at boundary → full bonus |
| 49 hours (start decay) | `49` | `~4958` | Just past boundary → slight decay |
| 108 hours (mid decay) | `108` | `2500` | Midpoint of decay window → half bonus |
| 167 hours (near end) | `167` | `~42` | Near end of decay window |
| 168 hours (boundary) | `168` | `0` | Exactly 7 days → zero |
| 200 hours (past) | `200` | `0` | Past 7 days → zero |
| 0.5 hours (fractional) | `0.5` | `5000` | Fractional hours work |

#### `calculatePriorityScore` tests

| Test | Scenario | Expected Score | 验证 |
|---|---|---|---|
| High-value commercial | vol=10000, comp=low, commercial, no event | `150,000` | Formula: 10000 × 5.0 × 3.0 |
| Low-value definitional | vol=100, comp=medium, definitional, no event | `200` | Formula: 100 × 2.0 × 1.0 |
| With timeliness | vol=100, comp=low, informational, 24h event | `5,750` | 100 × 5.0 × 1.5 + 5000 |
| All defaults (no data) | vol=null, comp=null, intent=unknown, no event | `20` | 10 × 2.0 × 1.0 |
| Score is rounded to 2 decimal places | vol=333, comp=high, informational | `499.5` | 333 × 1.0 × 1.5 |
| Volume=0 edge case | vol=0, comp=low, commercial | `150` | MIN_VOLUME=1 → 1 × 5.0 × 3.0... wait, DEFAULT=10 for all-zero |
| Only timeliness matters | vol=null, comp=null, informational, 0h event | `5,030` | 10 × 2.0 × 1.5 + 5000 |
| Breakdown fields correct | any input | — | score_breakdown contains all components |

#### `routeKeywordGroup` tests

| Test | Input | Expected | 验证 |
|---|---|---|---|
| Compare → standard | intent=commercial, b2=compare, serp=null | `compare, standard` | Default mapping |
| FAQ → standard | intent=info, b2=faq, serp=short_answer | `faq, standard` | Short answer SERP → FAQ stays |
| FAQ → blog (SERP override) | intent=info, b2=faq, serp=long_form | `blog, deep_research` | Long form SERP → upgrade to blog |
| Blog → deep_research | intent=info, b2=blog, serp=null | `blog, deep_research` | Blog always uses deep research |
| Glossary → standard | intent=def, b2=glossary, serp=null | `glossary, standard` | Default mapping |
| Topic-hub → standard | intent=nav, b2=topic-hub, serp=null | `topic-hub, standard` | Default mapping |
| No SERP data (skip-serp) | intent=info, b2=faq, serp=null | `faq, standard` | No SERP → use B2's suggestion |
| Unknown content_type | intent=info, b2='landing', serp=null | `landing, standard` | Fallback |
| SERP override only for informational | intent=commercial, b2=compare, serp=long_form | `compare, standard` | Commercial intent not affected by SERP depth |

#### `shouldDeferTopicHub` tests

| Test | Input | Expected | 验证 |
|---|---|---|---|
| Topic-hub, 0 pages | `'topic-hub', 0` | `true` | Not enough pages |
| Topic-hub, 14 pages | `'topic-hub', 14` | `true` | Just under threshold |
| Topic-hub, 15 pages | `'topic-hub', 15` | `false` | At threshold — OK to create |
| Topic-hub, 100 pages | `'topic-hub', 100` | `false` | Over threshold |
| Non-topic-hub, 0 pages | `'faq', 0` | `false` | Only topic-hub is deferred |
| Non-topic-hub, 14 pages | `'blog', 14` | `false` | Constraint only applies to topic-hub |

#### Score ordering tests (integration of formula)

| Test | 验证 |
|---|---|
| Sort 5 diverse groups by score | Commercial high-vol groups always rank above informational low-vol |
| Timeliness can override natural ordering | A low-vol group with fresh news event scores higher than a medium-vol group without |
| Timeliness decays correctly over time | Same group scored at 24h, 108h, 168h produces decreasing scores |
| All-null data still produces a positive score | Group with no volume/competition/timeliness still has score > 0 |

### 11.2 Mock Data

```typescript
const MOCK_GROUP_COMMERCIAL: ScoringInput = {
  group_id: 1,
  primary_keyword: 'claude code vs cursor',
  intent: 'commercial',
  content_type: 'compare',
  cluster_slug: 'claude-code-vs-cursor',
  keywords: [
    { keyword: 'claude code vs cursor', search_volume: 10000, competition: 'low' },
    { keyword: 'claude code or cursor', search_volume: 500, competition: 'low' },
  ],
  event_age_hours: null,
};

const MOCK_GROUP_INFORMATIONAL: ScoringInput = {
  group_id: 2,
  primary_keyword: 'how much does claude code cost',
  intent: 'informational',
  content_type: 'faq',
  cluster_slug: 'claude-code-pricing',
  keywords: [
    { keyword: 'how much does claude code cost', search_volume: 1000, competition: 'low' },
    { keyword: 'claude code cost', search_volume: 1000, competition: 'low' },
    { keyword: 'claude code pricing', search_volume: 10000, competition: 'medium' },
  ],
  event_age_hours: null,
};

const MOCK_GROUP_NO_DATA: ScoringInput = {
  group_id: 3,
  primary_keyword: 'claude code enterprise setup guide',
  intent: 'informational',
  content_type: 'blog',
  cluster_slug: 'claude-code-enterprise',
  keywords: [
    { keyword: 'claude code enterprise setup guide', search_volume: null, competition: null },
    { keyword: 'claude code enterprise installation', search_volume: null, competition: null },
  ],
  event_age_hours: null,
};

const MOCK_GROUP_TIMELY: ScoringInput = {
  group_id: 4,
  primary_keyword: 'claude code new pricing 2026',
  intent: 'informational',
  content_type: 'faq',
  cluster_slug: 'claude-code-pricing',
  keywords: [
    { keyword: 'claude code new pricing 2026', search_volume: 100, competition: 'low' },
  ],
  event_age_hours: 24,
};

const MOCK_GROUP_TOPIC_HUB: ScoringInput = {
  group_id: 5,
  primary_keyword: 'claude code complete guide',
  intent: 'navigational',
  content_type: 'topic-hub',
  cluster_slug: 'claude-code',
  keywords: [
    { keyword: 'claude code complete guide', search_volume: 500, competition: 'high' },
  ],
  event_age_hours: null,
};
```

### 11.3 Integration Test (`scripts/__tests__/score-and-queue.integration.test.ts`)

使用临时 in-memory SQLite DB，插入 test keyword_groups + keywords，验证 end-to-end flow。

| Test | Setup | 验证 |
|---|---|---|
| Happy path — 3 groups scored and queued | Insert 3 groups (各种 intent) + keywords | `create_queue` has 3 rows, sorted by score |
| Topic-hub deferred | Insert topic-hub group + cluster with 5 pages | `create_queue` has 0 rows for topic-hub, group status = 'pending' |
| Idempotent — no duplicate queue jobs | Run scoring twice | Second run adds 0 new jobs |
| Force rescore | Run scoring, change volume, run with --force | Scores updated |
| Skip-serp mode | `--skip-serp` | No Serper calls, uses B2's content_type |
| Groups with no keywords | Insert group with 0 keywords | Uses DEFAULT_VOLUME, doesn't crash |
| Timeliness from news_items | Insert group + related news_items | Timeliness bonus applied |

### 11.4 Running Tests

```bash
# Unit tests (no API keys, no DB needed — pure functions)
npm test -- scripts/lib/__tests__/priority.test.ts

# Integration tests (no API keys needed — uses in-memory DB)
npm test -- scripts/__tests__/score-and-queue.integration.test.ts

# Integration test with real Serper (optional, needs SERPER_API_KEY)
SERPER_API_KEY=xxx npm test -- scripts/__tests__/score-and-queue.integration.test.ts
```

---

## 12. Open Questions

1. **Timeliness source — how to link news events to keyword groups?** 建议 v1 实现最简方案：查 `news_items` 表中 48h 内的新闻，用 keyword 匹配（primary_keyword 出现在 news title/summary 中）。精确度足够，复杂度低。未来 C1 (discovery cycle) 可以增加更精确的关联。

2. **Deep Research weekly budget enforcement** — STRATEGY 说 "Max 5 deep-dive calls per week"。B3 是否应该在 routing 时 enforce 这个 budget？**建议不在 B3 enforce**——B3 只做 routing 标记，budget enforcement 是 B4 (content generation) 的职责。B3 标记所有 eligible groups 为 `deep_research`，B4 在消费 queue 时检查本周已用 budget。

3. **Cross-cluster dedup** — 两个 cluster 可能有 similar primary_keyword 的 groups（B2 §14 Open Question #2 提到）。B3 应该检测吗？**建议 v1 不做**——如果两个 groups 的 primary_keyword 完全相同，B2 应该已经通过 `keyword_group_id` 去重了。如果是语义相似但不同的 keyword，让两个都入队，content generation 时再判断是否合并。

4. **Score normalization** — 当前 score 范围从 ~30 到 ~150,000，跨度很大。是否需要 normalize 到 0-100？**建议不 normalize**——absolute score 更直观（可以直接看出 volume 和 intent 的贡献），且 queue 只需要 **排序**，不需要 threshold。

5. **Rescoring cadence** — STRATEGY 说 "Unbuilt groups persist and are rescored each discovery cycle"。B3 的 `--force` flag 支持手动 rescore。自动 rescore 在 C1 (discovery cycle) 中编排：每个 Saturday discovery cycle 结束时自动调用 `score-and-queue.ts --topic=X --force`。
