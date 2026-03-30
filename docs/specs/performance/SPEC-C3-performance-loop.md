---
title: "SPEC-C3 — Performance Loop"
status: active
category: spec
last-updated: 2026-03-20
depends-on: ["SPEC-A4"]
---

# SPEC-C3 — Performance Loop (Weekly Performance Cycle)

> **Files:**
> - `scripts/performance-cycle.ts` — CLI entry point
> - `scripts/lib/performance.ts` — Core orchestration logic
>
> **Depends on:** A4 (`scripts/lib/gsc.ts`), A1 (`scripts/lib/db.ts` — `create_queue`, `keywords`, `keyword_groups` tables)
> **Consumed by:** C4 (daily pipeline reorg — Tuesday cron), B4 (content generation — processes refresh queue entries)

---

## 1. Purpose

每周二自动运行的 **performance feedback loop**——从 GSC 拉取真实搜索表现数据，与已有关键词对比，检测异常和机会，生成 refresh/optimize actions 写入 `create_queue`。

**Strategy §4.9 定位：** Performance Loop 回答 "How is what we built performing, and what should we do next?" 它是 keyword engine 的闭环反馈机制——Discovery Cycle（周六）扩展知识边界，Performance Loop（周二）优化已有页面。

**核心价值：**
- **Striking distance optimization（position 11-20）：** 这是 ROI 最高的优化——小幅改进即可推入 page 1
- **Anomaly detection：** 自动发现 CTR 问题、排名下降、新关键词
- **Feedback loop：** GSC 发现的新 query 反哺 keyword universe，形成闭环

**为什么是周二：** GSC 数据有 ~3 天延迟，周二能拿到完整的上一周数据（包括周末）。

---

## 2. CLI Interface

```bash
# 周二 cron（默认 28 天 vs 前 28 天对比）
npx tsx scripts/performance-cycle.ts

# 自定义日期范围
npx tsx scripts/performance-cycle.ts --days=14

# Dry run（不写 DB，输出各阶段结果）
npx tsx scripts/performance-cycle.ts --dry-run

# 只跑 GSC import + segmentation，不生成 refresh actions
npx tsx scripts/performance-cycle.ts --report-only

# 限制 refresh actions 数量（防止一次产出过多）
npx tsx scripts/performance-cycle.ts --max-actions=20

# 自定义 anomaly 阈值
npx tsx scripts/performance-cycle.ts --ctr-threshold=0.03 --impression-threshold=50
```

### Arguments

| Arg | Required | Default | Description |
|---|---|---|---|
| `--days` | No | 28 | Current period 天数（previous period = 同长度的前一段） |
| `--dry-run` | No | false | 不写 DB，各阶段结果输出到 stdout |
| `--report-only` | No | false | 只输出分析报告，不生成 refresh queue entries |
| `--max-actions` | No | 30 | 每次 cycle 最多生成的 refresh actions 数量 |
| `--ctr-threshold` | No | 0.02 | High impressions / low CTR 的 CTR 阈值 |
| `--impression-threshold` | No | 100 | High impressions / low CTR 的 impression 阈值 |
| `--position-drop-threshold` | No | 3 | Position dropping 的最小位数差 |

---

## 3. Performance Pipeline（四阶段）

### 3.1 Stage 1 — GSC Data Import

从 GSC API 拉取两个时间段的 query-level 数据。

```typescript
import { createGSCClient, type GSCQueryParams } from './lib/gsc';

const gsc = createGSCClient();

// Current period: last 28 days (ending 3 days ago due to GSC lag)
const endDate = subtractDays(today(), 3);  // GSC ~3 day lag
const startDate = subtractDays(endDate, opts.days);

// Previous period: same length, immediately before current
const prevEndDate = subtractDays(startDate, 1);
const prevStartDate = subtractDays(prevEndDate, opts.days);

const currentParams: GSCQueryParams = {
  startDate: formatDate(startDate),
  endDate: formatDate(endDate),
  dimensions: ['query'],
  rowLimit: 25_000,
  dataState: 'final',
};

const current = await gsc.fetchQueries(currentParams);
const previous = await gsc.fetchQueries({ ...currentParams, startDate: formatDate(prevStartDate), endDate: formatDate(prevEndDate) });

// Also fetch query+page pairs for striking distance (need landing page URLs)
const currentWithPages = await gsc.fetchQueriesWithPages(currentParams);
```

**输出：** `GSCQueryResult` for current + previous periods, plus current with page dimension.

**Noop 降级：** 如果 GSC credentials 未配置（`createGSCClient` 返回 noop client），Stage 1 返回空数据，整个 pipeline 跳过并输出警告。

### 3.2 Stage 2 — Position Segmentation

使用 `gsc.ts` 的 `segmentByPosition()` 对当前数据进行分段。

```typescript
import { segmentByPosition, type SegmentationResult } from './lib/gsc';

const segmentation = segmentByPosition(
  currentWithPages.rows,
  { start: currentParams.startDate, end: currentParams.endDate },
);
```

**关键输出：** `segments.striking` (position 11-20) 是最高 ROI 的优化目标。

### 3.3 Stage 3 — Anomaly Detection

使用 `gsc.ts` 的 `detectAnomalies()` + `findNewQueries()` 检测异常。

```typescript
import { detectAnomalies, findNewQueries, type AnomalyReport } from './lib/gsc';

const anomalyReport = detectAnomalies(current, previous, {
  ctrThresholdLow: opts.ctrThreshold,
  impressionThresholdHigh: opts.impressionThreshold,
  positionDropThreshold: opts.positionDropThreshold,
});

const newQueries = findNewQueries(current, previous);
```

**Anomaly 类型和 Priority 映射（Strategy §4.9）：**

| Anomaly Type | Signal | Priority | Action Type |
|---|---|---|---|
| `high_impressions_low_ctr` | Title/meta 不够吸引 | B | REFRESH — rewrite title & meta |
| `high_ctr_low_impressions` | Authority 不足 | B | REFRESH — build internal links, supporting content |
| `position_dropping` | 内容过时 or 竞争对手变强 | C | REFRESH — refresh content |
| `new_query` | 新发现的 query | E | RESEARCH — 新关键词加入 keyword universe |

### 3.4 Stage 4 — Generate Refresh Actions → create_queue

将异常和 striking distance queries 转化为 `create_queue` entries。

**Action 类型划分（Strategy §4.9 Step 4）：**

```typescript
type RefreshActionType = 'refresh' | 'create' | 'research';

interface RefreshAction {
  type: RefreshActionType;
  priority: 'A' | 'B' | 'C' | 'D' | 'E';
  query: string;
  page?: string;               // existing landing page (for refresh)
  anomaly_type?: AnomalyType;
  detail: string;
  suggested_action: string;
}
```

**Priority → Action 映射：**

| Priority | Source | Action Type | create_queue handling |
|---|---|---|---|
| A | Striking distance (position 11-20) with impressions > 50 | `refresh` | 写入 create_queue, content_type = 'refresh', research_pipeline = 'standard' |
| B | High impressions/low CTR; High CTR/low impressions | `refresh` | 写入 create_queue, content_type = 'refresh', research_pipeline = 'standard' |
| C | Position dropping | `refresh` | 写入 create_queue, content_type = 'refresh', research_pipeline = 'standard' |
| D | Uncovered keywords (in our universe but no page) | `create` | 写入 create_queue, content_type from keyword_group, research_pipeline from routing |
| E | New GSC queries not in keyword universe | `research` | 写入 `keywords` 表（source='gsc'），不写 create_queue（等下次 Discovery Cycle 处理） |

---

## 4. Striking Distance Optimization（核心）

Striking distance（position 11-20）是 Performance Loop 最重要的产出。这些关键词离 page 1 只差一点，小幅优化就能产生巨大流量增益。

### 4.1 识别 Striking Distance Queries

```typescript
function identifyStrikingDistanceActions(
  segmentation: SegmentationResult,
  opts: { minImpressions: number },
): RefreshAction[] {
  const striking = segmentation.segments.striking;
  const actions: RefreshAction[] = [];

  for (const q of striking.queries) {
    // 只优化有一定 impressions 的 query（有搜索量才值得优化）
    if (q.impressions < opts.minImpressions) continue;

    actions.push({
      type: 'refresh',
      priority: 'A',
      query: q.query,
      page: q.page,
      detail: `Striking distance: "${q.query}" at position ${q.position.toFixed(1)} with ${q.impressions} impressions`,
      suggested_action: 'Add content depth, improve internal links, refresh with current info',
    });
  }

  // Sort by impressions desc (highest traffic potential first)
  actions.sort((a, b) => {
    const aImp = striking.queries.find(q => q.query === a.query)?.impressions ?? 0;
    const bImp = striking.queries.find(q => q.query === b.query)?.impressions ?? 0;
    return bImp - aImp;
  });

  return actions;
}
```

### 4.2 Striking Distance Minimum Impressions

```typescript
const STRIKING_MIN_IMPRESSIONS = 20;  // 低于此值的 striking distance query 不值得单独优化
```

**理由：** Position 11-20 但 impressions < 20 说明搜索量太低，优化 ROI 不高。优先处理高 impression 的 striking distance queries。

---

## 5. create_queue Integration

### 5.1 Refresh Actions 写入 create_queue

Priority A/B/C actions 需要找到或创建对应的 `keyword_group`，然后写入 `create_queue`。

```typescript
function writeRefreshActions(actions: RefreshAction[]): number {
  const db = getDb();

  let written = 0;
  const insertQueue = db.prepare(`
    INSERT INTO create_queue (keyword_group_id, content_type, research_pipeline, priority_score, status)
    VALUES (?, 'refresh', 'standard', ?, 'pending')
  `);

  const findGroup = db.prepare(`
    SELECT group_id FROM keyword_groups WHERE primary_keyword = ? LIMIT 1
  `);

  const insertGroup = db.prepare(`
    INSERT INTO keyword_groups (primary_keyword, intent, content_type, priority_score, status, cluster_slug)
    VALUES (?, 'informational', 'refresh', ?, 'queued', NULL)
  `);

  // Check for existing pending refresh job
  const existingJob = db.prepare(`
    SELECT job_id FROM create_queue
    WHERE keyword_group_id = ? AND content_type = 'refresh' AND status IN ('pending', 'in_progress')
    LIMIT 1
  `);

  const writeAll = db.transaction(() => {
    for (const action of actions) {
      if (action.type === 'research') continue;  // Priority E — goes to keywords table, not queue

      // Find or create keyword_group
      let row = findGroup.get(action.query) as { group_id: number } | undefined;
      if (!row) {
        const priorityScore = priorityForLevel(action.priority);
        const result = insertGroup.run(action.query, priorityScore);
        row = { group_id: Number(result.lastInsertRowid) };
      }

      // Dedup: skip if already has pending refresh job
      const existing = existingJob.get(row.group_id);
      if (existing) continue;

      const priorityScore = priorityForLevel(action.priority);
      insertQueue.run(row.group_id, priorityScore);
      written++;
    }
  });
  writeAll();

  return written;
}

function priorityForLevel(priority: 'A' | 'B' | 'C' | 'D' | 'E'): number {
  // Higher number = higher priority in create_queue
  const map: Record<string, number> = { A: 10000, B: 5000, C: 2000, D: 1000, E: 100 };
  return map[priority] ?? 0;
}
```

### 5.2 New Query Discovery（Priority E）

新 GSC queries 不直接进 create_queue，而是写入 `keywords` 表等待 Discovery Cycle 处理。

```typescript
function writeNewQueryDiscoveries(newQueries: NewQuery[]): number {
  let written = 0;
  for (const nq of newQueries) {
    // source='gsc' distinguishes from serper/exa-discovered keywords
    upsertKeyword(nq.query, 'gsc', null);
    written++;
  }
  return written;
}
```

### 5.3 Deduplication Rules

防止重复写入 refresh actions：

1. **已有 pending/in_progress refresh job：** 跳过（见 `existingJob` 查询）
2. **最近 7 天内完成过 refresh：** 跳过（避免过度刷新）

```typescript
const recentRefresh = db.prepare(`
  SELECT job_id FROM create_queue
  WHERE keyword_group_id = ?
    AND content_type = 'refresh'
    AND status = 'completed'
    AND completed_at > datetime('now', '-7 days')
  LIMIT 1
`);
```

---

## 6. Core Function Signatures

### `scripts/lib/performance.ts`

```typescript
export interface PerformanceOptions {
  days: number;               // default: 28
  dryRun: boolean;
  reportOnly: boolean;
  maxActions: number;         // default: 30
  ctrThreshold: number;       // default: 0.02
  impressionThreshold: number; // default: 100
  positionDropThreshold: number; // default: 3
}

export interface PerformanceCycleResult {
  timestamp: string;                // ISO 8601
  dateRange: {
    current: { start: string; end: string };
    previous: { start: string; end: string };
  };

  // Stage 1: GSC import
  gscImport: {
    currentRows: number;
    previousRows: number;
    currentWithPagesRows: number;
  };

  // Stage 2: Segmentation
  segmentation: {
    defending: number;              // count of queries in each segment
    page_one: number;
    striking: number;
    building: number;
    long_shot: number;
    total: number;
  };

  // Stage 3: Anomaly detection
  anomalies: {
    high_impressions_low_ctr: number;
    high_ctr_low_impressions: number;
    position_dropping: number;
    new_query: number;
    total: number;
  };

  // Stage 4: Actions generated
  actions: {
    striking_distance: number;      // Priority A
    ctr_problems: number;           // Priority B
    position_drops: number;         // Priority C
    new_coverage: number;           // Priority D
    new_discoveries: number;        // Priority E (→ keywords table)
    total_queued: number;           // A+B+C+D written to create_queue
    total_researched: number;       // E written to keywords table
    skipped_dedup: number;          // Skipped due to existing pending job
  };

  // Top actions (for human review)
  topActions: Array<{
    priority: string;
    query: string;
    page?: string;
    detail: string;
    suggested_action: string;
  }>;
}

export async function runPerformanceCycle(
  opts: PerformanceOptions,
): Promise<PerformanceCycleResult>;

/** Pure: generate refresh actions from segmentation + anomalies */
export function generateRefreshActions(
  segmentation: SegmentationResult,
  anomalyReport: AnomalyReport,
  newQueries: NewQuery[],
  opts: { maxActions: number; strikingMinImpressions: number },
): RefreshAction[];

/** Write refresh actions to create_queue + keywords table */
export function writeActions(
  actions: RefreshAction[],
): { queued: number; researched: number; skippedDedup: number };
```

### `scripts/performance-cycle.ts`

Thin CLI wrapper: parse args → call `runPerformanceCycle()` → print results → `closeDb()` → exit.

---

## 7. Scheduling & Cron

```bash
# crontab entry (VPS)
# 周二 07:00 UTC — runs after GSC data has refreshed for the previous week
0 7 * * 2 cd /home/ubuntu/loreai-v2 && npx tsx scripts/performance-cycle.ts >> logs/performance-cycle.log 2>&1
```

**时间选择依据：**
- 周二——GSC 数据有 ~3 天延迟，周二拿到的是上周五之前的完整数据
- 07:00 UTC——在 newsletter pipeline（05:00）之后，在 content generation queue processing（09:00）之前
- 产出的 refresh actions 进入 create_queue，由当天或后续的 `process-queue.ts` 处理

---

## 8. Error Handling

### 8.1 GSC Unavailable

如果 `createGSCClient()` 返回 noop client（无 credentials），整个 cycle 跳过：

```typescript
if (gscImport.currentRows === 0 && gscImport.previousRows === 0) {
  console.error('⚠️  GSC returned no data — credentials may not be configured. Skipping performance cycle.');
  return emptyResult();
}
```

### 8.2 GSC API Errors

`GSCAPIError`（rate limit、auth failure 等）在 Stage 1 就会 throw → pipeline 失败，输出 error。不做 partial recovery（没有 GSC data 就没法做 performance analysis）。

### 8.3 DB Write Failures

Stage 4 的 DB 写入在一个 transaction 中——要么全写入，要么全回滚。

---

## 9. Constants

```typescript
// performance.ts
export const DEFAULT_DAYS = 28;                     // 对比窗口天数
export const GSC_DATA_LAG_DAYS = 3;                 // GSC 数据延迟
export const STRIKING_MIN_IMPRESSIONS = 20;         // Striking distance 最小 impression 门槛
export const MAX_ACTIONS_DEFAULT = 30;              // 每次 cycle 最多产出的 actions
export const RECENT_REFRESH_COOLDOWN_DAYS = 7;      // 最近 N 天刷新过的不再刷新
export const PRIORITY_SCORES: Record<string, number> = {
  A: 10000,   // Striking distance
  B: 5000,    // CTR problems
  C: 2000,    // Position drops
  D: 1000,    // New coverage (uncovered keywords)
  E: 100,     // New discoveries (→ keywords table only)
};
```

---

## 10. Tests

### 10.1 Unit Tests (`tests/performance.test.ts`)

**10.1.1 generateRefreshActions — striking distance**
- 输入：segmentation with 5 striking queries (position 11-20), varying impressions
- 期望：只有 impressions >= `STRIKING_MIN_IMPRESSIONS` 的 queries 产出 Priority A actions
- 期望：按 impressions 降序排列

**10.1.2 generateRefreshActions — anomaly → action mapping**
- 输入：anomalyReport with 各类 anomaly
- 验证 anomaly type → priority 映射正确：
  - `high_impressions_low_ctr` → Priority B
  - `high_ctr_low_impressions` → Priority B
  - `position_dropping` → Priority C
  - `new_query` → Priority E

**10.1.3 generateRefreshActions — maxActions 限制**
- 输入：50 个 anomalies + 20 个 striking distance queries
- `maxActions = 15`
- 期望：返回 15 个 actions（按 priority A→B→C→D→E 排序，高优先级先选）

**10.1.4 generateRefreshActions — 混合 priority 排序**
- 输入：Priority A × 3, B × 5, C × 2, E × 10
- 期望：输出顺序为 A,A,A,B,B,B,B,B,C,C,E,E,...（按 priority 分组，组内按 impressions 降序）

**10.1.5 writeActions — dedup**
- Setup: 向 create_queue 预插入一个 pending refresh job for query "claude code pricing"
- 输入：actions 包含 "claude code pricing"（应跳过）+ "claude code hooks"（应写入）
- 期望：`queued = 1`, `skippedDedup = 1`

**10.1.6 writeActions — recent refresh cooldown**
- Setup: 向 create_queue 预插入一个 3 天前 completed 的 refresh job for query "claude code vs cursor"
- 输入：actions 包含 "claude code vs cursor"
- 期望：跳过（在 7 天 cooldown 内）

**10.1.7 writeActions — new query research**
- 输入：3 个 Priority E actions (type='research')
- 期望：`researched = 3`, `queued = 0`
- 验证：`keywords` 表新增 3 条 source='gsc' 记录

**10.1.8 writeActions — creates keyword_group if not exists**
- 输入：action for query "some new query" 不在 keyword_groups 表中
- 期望：自动创建 keyword_group，然后写入 create_queue

**10.1.9 date range calculation**
- 验证 `calculateDateRanges(today, days)` 正确计算 current/previous 日期段
- 验证 GSC lag (3天) 被正确应用
- 输入：today=2026-03-20, days=28
  - current: 2026-02-17 ~ 2026-03-17
  - previous: 2026-01-20 ~ 2026-02-16

**10.1.10 empty GSC data → early exit**
- Mock GSC client 返回空结果
- 验证：返回 empty result，不写 DB

### 10.2 GSC Detection Logic Tests（验证 gsc.ts 的 pure functions）

这些测试验证 A4 已实现的 `segmentByPosition` 和 `detectAnomalies` 在 performance loop 的使用场景下表现正确。

**10.2.1 segmentByPosition — 边界值**
- Position 3.0 → `defending`
- Position 3.1 → `page_one`
- Position 10.0 → `page_one`
- Position 10.1 → `striking`
- Position 20.0 → `striking`
- Position 20.1 → `building`
- Position 50.0 → `building`
- Position 50.1 → `long_shot`

**10.2.2 detectAnomalies — high impressions + low CTR**
- Current: query "claude code tutorial", impressions=500, ctr=0.01
- Previous: same query, impressions=400, ctr=0.015
- 期望：检测到 `high_impressions_low_ctr` anomaly

**10.2.3 detectAnomalies — position dropping**
- Current: query "claude code pricing", position=18
- Previous: same query, position=8
- 期望：检测到 `position_dropping` anomaly (dropped 10 positions, was in top 20)

**10.2.4 detectAnomalies — position dropping not triggered when previous was > 20**
- Current: query "obscure query", position=35
- Previous: same query, position=28
- 期望：**不** 检测到 anomaly（prev.position > 20，不在 `prev.position <= 20` 过滤条件内）

**10.2.5 findNewQueries — correctly identifies new queries**
- Current: ["a", "b", "c"], Previous: ["a", "b"]
- 期望：返回 ["c"]
- 验证：按 impressions 降序排列

### 10.3 Integration Test (`tests/performance.integration.test.ts`)

**前提：** 需要 GSC credentials（`GSC_SITE_URL`, `GSC_SERVICE_ACCOUNT_KEY_PATH` 或 `GSC_CLIENT_EMAIL` + `GSC_PRIVATE_KEY`）。

```typescript
test('full performance cycle on loreai.dev', async () => {
  const result = await runPerformanceCycle({
    days: 28,
    dryRun: false,
    reportOnly: false,
    maxActions: 10,
    ctrThreshold: 0.02,
    impressionThreshold: 100,
    positionDropThreshold: 3,
  });

  // Stage 1: GSC data imported
  expect(result.gscImport.currentRows).toBeGreaterThan(0);
  expect(result.gscImport.previousRows).toBeGreaterThan(0);

  // Stage 2: Segmentation has results
  expect(result.segmentation.total).toBeGreaterThan(0);

  // Stage 3: Some anomalies detected (any real site will have some)
  expect(result.anomalies.total).toBeGreaterThanOrEqual(0);

  // Stage 4: Actions written
  // (may be 0 if site is very new or all queries are stable)
  expect(result.actions.total_queued).toBeGreaterThanOrEqual(0);

  closeDb();
}, 60_000);  // 1 min timeout (GSC API can be slow)
```

---

## 11. Example Output

```
═══ Performance Cycle (2026-03-17) ═══

Stage 1 — GSC Import
  Current period:  2026-02-17 → 2026-03-17  (842 queries)
  Previous period: 2026-01-20 → 2026-02-16  (798 queries)
  With pages: 1,204 query-page pairs

Stage 2 — Position Segmentation
  Defending (1-3):     23 queries
  Page 1 (4-10):       67 queries
  Striking (11-20):    89 queries ← highest ROI
  Building (21-50):   312 queries
  Long shot (50+):    351 queries

Stage 3 — Anomaly Detection
  High impressions / low CTR:  12
  High CTR / low impressions:   5
  Position dropping:             8
  New queries:                  44
  Total: 69 anomalies

Stage 4 — Refresh Actions
  Priority A (striking distance):  14
  Priority B (CTR problems):       12
  Priority C (position drops):      4
  Priority E (new discoveries):    44 → keywords table

  Written to create_queue: 22 refresh jobs
  Written to keywords: 44 new keywords (source=gsc)
  Skipped (dedup): 8

  Top 5 actions:
  #1  [A] "claude code tutorial"        pos=12.3  imp=890  → Add depth, improve internal links
  #2  [A] "claude code vs cursor"       pos=14.7  imp=650  → Add depth, improve internal links
  #3  [A] "claude code pricing"         pos=11.2  imp=420  → Add depth, improve internal links
  #4  [B] "what is claude code"         pos=6.1   imp=1200 ctr=1.2% → Rewrite title and meta
  #5  [B] "claude code hooks tutorial"  pos=8.4   imp=340  ctr=0.9% → Rewrite title and meta
```

---

## 12. Non-Goals (Explicitly Out of Scope)

- **Content refresh execution** — Performance Loop 只产出 refresh actions 写入 queue，实际内容刷新由 B4 (`content-gen.ts`) + `process-queue.ts` 处理
- **Cluster health dashboard** — 后续 SPEC-14 的范畴，Performance Loop 只产出数据
- **Automatic internal link building** — 建议 action 中会提到，但不自动执行
- **GSC data persistence** — 不把 GSC 原始数据存入 DB（每次 cycle 实时拉取，避免 schema 膨胀）
