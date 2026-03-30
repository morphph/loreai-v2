---
title: "SPEC-A4 — Google Search Console API Client"
status: active
category: spec
last-updated: 2026-03-20
depends-on: []
---

# SPEC-A4 — Google Search Console API Client

> **File:** `scripts/lib/gsc.ts`
> **Depends on:** A1 (schema migration — keywords 表存在)
> **Consumed by:** B3 (priority scoring — 用真实 impression 替代 Serper 估算), C3 (performance loop — position segmentation + anomaly detection)

---

## 1. Purpose

封装 Google Search Console Search Analytics API，为 keyword engine 提供三类能力：

1. **Real performance data** — 拉取 queries 的 clicks、impressions、CTR、position → 替代 Serper 的粗略 volume estimation（Strategy §4.9 的数据基础）
2. **Position segmentation** — 按 position 段分类 keywords，识别 striking distance opportunities（position 11-20，最高 ROI）
3. **Anomaly detection** — 发现 CTR 异常、position 下降、新 queries → 喂给 C3 performance cycle 生成 refresh/optimize actions

**与 Serper/Exa 的分工：**
- **Serper** = Google 搜索视角（SERP 结构、PAA、related searches — keyword-level signals）
- **Exa** = 语义视角（competitor content、semantic search — content-level signals）
- **GSC** = 我们自己的真实数据（impressions、clicks、position、CTR — performance signals）

GSC 提供的是 **ground truth**。Serper 估算 volume 只能分 4 档，GSC 的 impression 数据是精确值。当 keyword 同时有 Serper 和 GSC 数据时，GSC 优先。

---

## 2. Google Search Console API Reference

### Endpoint

- **URL:** `POST https://searchconsole.googleapis.com/v1/sites/{siteUrl}/searchAnalytics/query`
  - v1 API (recommended, replaces legacy webmasters/v3)
- **siteUrl path param:** URL-encoded property URL（如 `sc-domain%3Aloreai.dev` 或 `https%3A%2F%2Floreai.dev%2F`）

### Authentication

- **Method:** Service Account (JSON key file)
- **Scope:** `https://www.googleapis.com/auth/webmasters.readonly`（read-only 足够）
- **Setup requirement:** Service Account email 必须在 Search Console 中被添加为 user（Settings → Users and permissions → Add User → Restricted 权限）
- **Node.js library:** `@googleapis/searchconsole`（轻量，只包含 GSC API）

### Request Body

```typescript
{
  startDate: string;           // "YYYY-MM-DD", required, Pacific Time
  endDate: string;             // "YYYY-MM-DD", required, Pacific Time
  dimensions?: string[];       // "query" | "page" | "device" | "country" | "date" | "searchAppearance"
  type?: string;               // "web" (default) | "image" | "video" | "news" | "discover"
  dimensionFilterGroups?: Array<{
    groupType?: "and";
    filters?: Array<{
      dimension: string;       // "query" | "page" | "device" | "country"
      operator: string;        // "equals" | "contains" | "notContains" | "notEquals" | "includingRegex" | "excludingRegex"
      expression: string;
    }>;
  }>;
  rowLimit?: number;           // default 1000, max 25000
  startRow?: number;           // 0-based pagination offset
  dataState?: string;          // "final" (default) | "all" (include fresh/incomplete data)
  aggregationType?: string;    // "auto" (default) | "byPage" | "byProperty"
}
```

### Response Schema

```typescript
{
  rows?: Array<{
    keys: string[];            // dimension values, in request order
    clicks: number;
    impressions: number;
    ctr: number;               // 0.0 ~ 1.0
    position: number;          // average position
  }>;
  responseAggregationType?: string;
}
```

### Key Constraints

| Constraint | Detail |
|---|---|
| Data freshness | ~2-3 天延迟（today is Mar 20 → latest reliable data ~Mar 17-18） |
| Historical range | 最多 ~16 个月，更早的数据被 Google 删除 |
| Max rows per request | 25,000（用 `startRow` 分页获取更多） |
| Row completeness | API 不保证返回所有数据，有内部 row cap |
| Date timezone | Pacific Time (UTC-7/UTC-8) |
| Expensive queries | `query` + `page` dimension 组合是最贵的（load quota） |

### Rate Limits

| Scope | Limit |
|---|---|
| Per-site | 1,200 QPM |
| Per-user | 1,200 QPM |
| Per-project | 40,000 QPM / 30,000,000 QPD |
| Load quota | Search Analytics 有额外 load-based 限流（`query` + `page` 最贵） |

---

## 3. TypeScript Interfaces

```typescript
// ── Config ──

export interface GSCConfig {
  siteUrl: string;               // e.g. "sc-domain:loreai.dev"
  keyFilePath?: string;          // path to service account JSON key
  credentials?: {                // alternative: inline credentials
    clientEmail: string;
    privateKey: string;
  };
  timeoutMs?: number;            // default: 30_000 (GSC can be slow)
}

// ── Query Parameters ──

export interface GSCQueryParams {
  startDate: string;             // "YYYY-MM-DD"
  endDate: string;               // "YYYY-MM-DD"
  dimensions?: GSCDimension[];
  filters?: GSCFilter[];
  rowLimit?: number;             // default: 25_000
  dataState?: 'final' | 'all';  // default: 'final'
}

export type GSCDimension = 'query' | 'page' | 'device' | 'country' | 'date';

export interface GSCFilter {
  dimension: GSCDimension;
  operator: 'equals' | 'contains' | 'notContains' | 'notEquals' | 'includingRegex' | 'excludingRegex';
  expression: string;
}

// ── API Response ──

export interface GSCRow {
  keys: string[];
  clicks: number;
  impressions: number;
  ctr: number;                   // 0.0 ~ 1.0
  position: number;              // average position
}

export interface GSCQueryResult {
  rows: GSCRow[];
  startDate: string;
  endDate: string;
  totalRows: number;             // rows.length (for convenience after pagination merge)
}

// ── Position Segmentation ──

export type PositionSegment =
  | 'defending'       // 1-3
  | 'page_one'        // 4-10
  | 'striking'        // 11-20 (highest ROI)
  | 'building'        // 21-50
  | 'long_shot';      // 50+

export interface SegmentedQuery {
  query: string;
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
  segment: PositionSegment;
  page?: string;                 // landing page URL (if 'page' dimension was included)
}

export interface SegmentSummary {
  segment: PositionSegment;
  count: number;
  totalClicks: number;
  totalImpressions: number;
  avgCtr: number;
  avgPosition: number;
  queries: SegmentedQuery[];
}

export interface SegmentationResult {
  dateRange: { start: string; end: string };
  segments: Record<PositionSegment, SegmentSummary>;
  totalQueries: number;
}

// ── Anomaly Detection ──

export type AnomalyType =
  | 'high_impressions_low_ctr'   // title/meta 不够吸引
  | 'high_ctr_low_impressions'   // authority 不足
  | 'position_dropping'          // 内容过时 or 竞争对手变强
  | 'new_query';                 // 新发现的 query

export interface Anomaly {
  type: AnomalyType;
  query: string;
  page?: string;
  current: { clicks: number; impressions: number; ctr: number; position: number };
  previous?: { clicks: number; impressions: number; ctr: number; position: number };
  detail: string;                // human-readable description
  suggestedAction: string;       // e.g. "Rewrite title and meta description"
  priority: 'A' | 'B' | 'C' | 'D' | 'E';  // maps to Strategy §4.9 priority levels
}

export interface AnomalyReport {
  dateRange: { current: { start: string; end: string }; previous: { start: string; end: string } };
  anomalies: Anomaly[];
  summary: Record<AnomalyType, number>;
}

// ── New Query Detection ──

export interface NewQuery {
  query: string;
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
  firstSeen: string;             // date first appeared in current period
}
```

---

## 4. Functions

### 4.1 `createGSCClient(config?: Partial<GSCConfig>): GSCClient`

Factory function — 创建认证好的 GSC client。

- **Config resolution 优先级:**
  1. 显式传入的 `config`
  2. 环境变量 `GSC_SERVICE_ACCOUNT_KEY_PATH`（JSON key file 路径）
  3. 环境变量 `GSC_CLIENT_EMAIL` + `GSC_PRIVATE_KEY`（inline credentials）
- **siteUrl:** 从 `config.siteUrl` 或 `GSC_SITE_URL` 环境变量读取
- 缺少认证信息时 `console.warn` + 返回 noop client（与 serper.ts / brave.ts pattern 一致）

```typescript
export function createGSCClient(config?: Partial<GSCConfig>): GSCClient;
```

### 4.2 `fetchQueries(params: GSCQueryParams): Promise<GSCQueryResult>`

核心数据拉取函数。封装 `searchAnalytics.query` API call。

- 默认 `dimensions: ['query']`，`rowLimit: 25_000`
- 自动分页：如果结果刚好 = rowLimit，继续用 `startRow` 翻页直到拿完
- 将 API response 的 `rows` 映射为 `GSCRow[]`
- 如果 row 为空（0 data），返回 `{ rows: [], totalRows: 0, ... }`

```typescript
async fetchQueries(params: GSCQueryParams): Promise<GSCQueryResult>;
```

**Pagination logic:**

```
let allRows = [];
let startRow = 0;
do {
  result = api.query({ ...params, startRow, rowLimit: 25_000 });
  allRows.push(...result.rows);
  startRow += result.rows.length;
} while (result.rows.length === 25_000);
return { rows: allRows, totalRows: allRows.length, ... };
```

### 4.3 `segmentByPosition(rows: GSCRow[]): SegmentationResult`

**纯函数 — 无 API 调用。** 按 position 范围分段。

Position segments（对应 Strategy §4.9 表格）：

| Position | Segment | Status | Action |
|---|---|---|---|
| 1–3 | `defending` | Defending | Monitor, don't touch unless dropping |
| 4–10 | `page_one` | Page 1, not top 3 | Optimize content depth, improve title/meta for CTR |
| 11–20 | `striking` | **Striking distance** (highest ROI) | Add depth, improve internal links, refresh |
| 21–50 | `building` | Building | Build internal links, add content depth |
| 50+ | `long_shot` | Long shot | Don't optimize — build surrounding pages first |

- 输入：`GSCRow[]`（来自 `fetchQueries` 的结果）
- 输出：`SegmentationResult` — 每个 segment 的 queries list + aggregate stats
- `keys[0]` = query（assumes dimension `['query']` 或 `['query', 'page']`）
- `keys[1]` = page（if dimension includes `'page'`）

```typescript
export function segmentByPosition(rows: GSCRow[]): SegmentationResult;
```

### 4.4 `detectAnomalies(current: GSCQueryResult, previous: GSCQueryResult, opts?: AnomalyDetectionOpts): AnomalyReport`

**纯函数 — 无 API 调用。** 比较两个时间段的数据，检测异常。

```typescript
export interface AnomalyDetectionOpts {
  ctrThresholdLow?: number;       // default: 0.02 (2%)
  impressionThresholdHigh?: number; // default: 100
  positionDropThreshold?: number;  // default: 3 (positions)
}
```

**Anomaly detection rules（对应 Strategy §4.9）：**

| Anomaly | Condition | Priority | Suggested Action |
|---|---|---|---|
| `high_impressions_low_ctr` | impressions ≥ 100 AND ctr < 0.02 | B | Rewrite title and meta description |
| `high_ctr_low_impressions` | ctr ≥ 0.10 AND impressions < 20 | — | Build internal links, create supporting content |
| `position_dropping` | current.position - previous.position ≥ 3 AND previous.position ≤ 20 | C | Refresh content, check competitor changes |
| `new_query` | query 存在于 current 但不存在于 previous | E | Add to keyword universe, check coverage |

**Priority mapping（Strategy §4.9）：**
- A — Striking distance (position 11-20) — from `segmentByPosition`, not anomaly
- B — CTR problems
- C — Position drops
- D — New coverage (uncovered keywords) — from B3, not anomaly
- E — New discoveries (GSC queries not in our universe)

```typescript
export function detectAnomalies(
  current: GSCQueryResult,
  previous: GSCQueryResult,
  opts?: AnomalyDetectionOpts,
): AnomalyReport;
```

### 4.5 `findNewQueries(current: GSCQueryResult, previous: GSCQueryResult): NewQuery[]`

**纯函数。** 找出 current period 中存在但 previous period 中不存在的 queries。

- 用 `Set` 存 previous period 的所有 query strings
- Filter current rows where query not in previous set
- 按 impressions 降序排列

这些 new queries 是 **organic keyword discovery** — 用户已经通过这些 query 找到我们了，但我们可能没有专门的页面覆盖。

```typescript
export function findNewQueries(
  current: GSCQueryResult,
  previous: GSCQueryResult,
): NewQuery[];
```

### 4.6 `fetchQueriesWithPages(params: GSCQueryParams): Promise<GSCQueryResult>`

Convenience wrapper — 自动设置 `dimensions: ['query', 'page']`。

- 用于需要知道每个 query 落在哪个 landing page 的场景（如 anomaly detection 需要知道 page 以生成 refresh action）
- **注意：** 这是 load quota 最贵的查询组合，应控制使用频率

```typescript
async fetchQueriesWithPages(params: GSCQueryParams): Promise<GSCQueryResult>;
```

---

## 5. Internal: Authentication & HTTP

### 5.1 Authentication

```typescript
import { searchconsole, auth } from '@googleapis/searchconsole';

function _createAuthClient(config: GSCConfig) {
  // Option 1: key file path
  if (config.keyFilePath) {
    return new auth.GoogleAuth({
      keyFile: config.keyFilePath,
      scopes: ['https://www.googleapis.com/auth/webmasters.readonly'],
    });
  }

  // Option 2: inline credentials
  if (config.credentials) {
    return new auth.GoogleAuth({
      credentials: {
        client_email: config.credentials.clientEmail,
        private_key: config.credentials.privateKey,
      },
      scopes: ['https://www.googleapis.com/auth/webmasters.readonly'],
    });
  }

  throw new GSCAuthError('No credentials provided');
}
```

### 5.2 URL Encoding

`siteUrl` 必须 URL-encoded 用于 API path：
- Domain property `sc-domain:loreai.dev` → path 中用 `sc-domain%3Aloreai.dev`
- URL-prefix property → 标准 `encodeURIComponent`

`@googleapis/searchconsole` library 自动处理 encoding，不需要手动 encode。

---

## 6. Error Handling

```typescript
export class GSCAPIError extends Error {
  constructor(
    public readonly status: number,
    public readonly body: string,
  ) {
    super(`GSC API error ${status}: ${body}`);
    this.name = 'GSCAPIError';
  }
}

export class GSCAuthError extends Error {
  constructor(message: string) {
    super(`GSC auth error: ${message}`);
    this.name = 'GSCAuthError';
  }
}
```

| Scenario | Handling |
|---|---|
| `GSC_SERVICE_ACCOUNT_KEY_PATH` 和 `GSC_CLIENT_EMAIL` 都不存在 | `console.warn` + return noop client（graceful degradation） |
| `GSC_SITE_URL` not set | `console.warn` + return noop client |
| Auth error (invalid credentials) | Throw `GSCAuthError` |
| HTTP 403 (no access to property) | Throw `GSCAPIError` — service account 没有被加为 GSC user |
| HTTP 429 (rate limit / load quota) | Throw `GSCAPIError` — caller 负责 backoff |
| 0 rows returned | 不 throw，返回 `{ rows: [], totalRows: 0 }` — 空数据不是错误 |

**Design decision:** 与 serper.ts 一致 — 缺认证 graceful degrade（pipeline 可以跑但没有 GSC 数据），API error throw（让调用方决定 retry 策略）。

---

## 7. Environment Variables

| Variable | Required | Description |
|---|---|---|
| `GSC_SERVICE_ACCOUNT_KEY_PATH` | Yes (option 1) | Path to Google Service Account JSON key file |
| `GSC_CLIENT_EMAIL` | Yes (option 2) | Service Account email (alternative to key file) |
| `GSC_PRIVATE_KEY` | Yes (option 2) | Service Account private key (alternative to key file) |
| `GSC_SITE_URL` | Yes | Search Console property URL, e.g. `sc-domain:loreai.dev` |

**Option 1 vs 2:** Key file path 更安全（key 不在环境变量中），适合 VPS。Inline credentials 适合 CI / 容器化环境。

在 `.env.example` 中添加：
```
GSC_SERVICE_ACCOUNT_KEY_PATH=  # Path to Google Service Account JSON key
GSC_SITE_URL=sc-domain:loreai.dev  # Search Console property URL
```

---

## 8. Test Plan

### 8.1 Unit Tests (`scripts/lib/__tests__/gsc.test.ts`)

Mock `@googleapis/searchconsole` — 不消耗 API quota。

#### 8.1.1 `segmentByPosition` (纯函数，最易测试)

| Test | Input | Expected |
|---|---|---|
| Correctly assigns `defending` | row with position 2.1 | segment = `defending` |
| Correctly assigns `page_one` | row with position 7.5 | segment = `page_one` |
| Correctly assigns `striking` | row with position 14.3 | segment = `striking` |
| Correctly assigns `building` | row with position 35.0 | segment = `building` |
| Correctly assigns `long_shot` | row with position 72.0 | segment = `long_shot` |
| Boundary: position exactly 3.0 | position = 3.0 | `defending` (1-3 inclusive) |
| Boundary: position exactly 10.0 | position = 10.0 | `page_one` (4-10 inclusive) |
| Boundary: position exactly 20.0 | position = 20.0 | `striking` (11-20 inclusive) |
| Boundary: position exactly 50.0 | position = 50.0 | `building` (21-50 inclusive) |
| Aggregate stats per segment | mixed rows | correct count, totalClicks, avgCtr per segment |
| Empty input | `[]` | all segments have count 0 |

#### 8.1.2 `detectAnomalies` (纯函数)

| Test | Input | Expected |
|---|---|---|
| Detects high impressions + low CTR | impressions=500, ctr=0.01 | anomaly `high_impressions_low_ctr`, priority B |
| Detects high CTR + low impressions | ctr=0.15, impressions=10 | anomaly `high_ctr_low_impressions` |
| Detects position drop | prev position=8, curr position=15 | anomaly `position_dropping`, priority C |
| Ignores small position change | prev position=8, curr position=9 | no anomaly |
| Ignores position drop for low-rank | prev position=45, curr position=55 | no anomaly (prev > 20) |
| Detects new query | query in current, not in previous | anomaly `new_query`, priority E |
| Custom thresholds | opts override defaults | anomaly detection respects custom thresholds |
| No anomalies | stable data | empty anomalies array |
| Summary counts correct | multiple anomalies | `summary` counts match |

#### 8.1.3 `findNewQueries` (纯函数)

| Test | Input | Expected |
|---|---|---|
| Finds new queries | current has "claude code tips", previous doesn't | returned in results |
| Excludes existing queries | query in both periods | not returned |
| Sorted by impressions desc | multiple new queries | highest impressions first |
| Empty when no new queries | identical periods | `[]` |

#### 8.1.4 `fetchQueries` (需要 mock API)

| Test | Input | Expected |
|---|---|---|
| Single page of results | mock returns 100 rows | returns 100 rows, no pagination |
| Auto-pagination | mock returns 25000, then 500 | returns 25500 rows total |
| Empty response (no rows) | mock returns `{}` | returns `{ rows: [], totalRows: 0 }` |
| API error → throws GSCAPIError | mock returns 403 | throws with status 403 |
| Missing credentials → noop | no env vars | `console.warn`, returns empty |

### 8.2 Integration Tests (`scripts/lib/__tests__/gsc.integration.test.ts`)

**使用真实 GSC API** — 只在 credentials 存在时跑。

```typescript
const describeIfGSC = process.env.GSC_SERVICE_ACCOUNT_KEY_PATH ? describe : describe.skip;
```

| Test | 验证 |
|---|---|
| Fetch queries for last 7 days | `rows.length > 0`（loreai.dev 应该有 GSC 数据） |
| Fetch queries with page dimension | rows 有 `keys[1]` (page URL) |
| Fetch queries with date dimension | rows 有 date key，按 date 排序 |
| Fetch queries with filter | 用 `contains: "claude"` filter，只返回包含 claude 的 queries |
| Segment real data | `segmentByPosition` on real rows → 至少有一个非空 segment |
| Detect anomalies on real data | 对比 last 7 days vs previous 7 days → 返回 `AnomalyReport`（可能有也可能没有 anomalies，但结构正确） |
| Find new queries on real data | 对比两个 period → 返回 `NewQuery[]`（结构正确） |
| Pagination works | fetch with `rowLimit: 10` then full fetch → full fetch 结果 ≥ 10 |

### 8.3 Running Tests

```bash
npm test -- scripts/lib/__tests__/gsc.test.ts                    # unit (no credentials needed)
GSC_SERVICE_ACCOUNT_KEY_PATH=./gsc-key.json GSC_SITE_URL=sc-domain:loreai.dev \
  npm test -- scripts/lib/__tests__/gsc.integration.test.ts      # integration
```

---

## 9. Pattern Reference

| Pattern | serper.ts / brave.ts | gsc.ts |
|---|---|---|
| Import dotenv | `import 'dotenv/config'` | 同 |
| Missing credentials handling | `console.warn` + empty return | 同 (noop client pattern) |
| API error handling | Throw custom error class | 同 (`GSCAPIError`) |
| TypeScript interfaces | Export all types | 同 |
| Integration test guard | `process.env.KEY ? describe : describe.skip` | 同 |

**与 serper.ts 的关键差异：**
- GSC 用 `@googleapis/searchconsole` SDK（不是直接 `fetch`）— Google API 有复杂的 auth flow
- GSC 需要分页（max 25k rows）— Serper 单次请求即可
- GSC 的核心价值函数（`segmentByPosition`, `detectAnomalies`, `findNewQueries`）是**纯函数** — 不调 API，高度可测试
- GSC 数据有 2-3 天延迟 — 调用方需要注意 date range

---

## 10. File Structure

```
scripts/lib/
├── brave.ts                       # 现有 — trend validation
├── serper.ts                      # A2 — Google SERP data
├── exa.ts                         # A3 — semantic search & content extraction
├── gsc.ts                         # 新建 — Google Search Console performance data
└── __tests__/
    ├── gsc.test.ts                # unit tests (mock SDK)
    └── gsc.integration.test.ts    # integration tests (real GSC API)
```

---

## 11. Dependency

```bash
npm install @googleapis/searchconsole
```

`@googleapis/searchconsole` 是轻量级单 API package（vs 完整的 `googleapis` 包含 250+ APIs）。它包含：
- SearchConsole v1 API client
- `auth.GoogleAuth` for authentication
- TypeScript types

---

## 12. Usage Example (for C3 Performance Cycle)

```typescript
// scripts/performance-cycle.ts 会这样调用 gsc.ts：

import { createGSCClient, segmentByPosition, detectAnomalies, findNewQueries } from './lib/gsc.js';

const gsc = createGSCClient();

// 1. Fetch current and previous period
const current = await gsc.fetchQueries({
  startDate: '2026-03-06',  // last 7 days (accounting for 3-day lag)
  endDate: '2026-03-12',
  dimensions: ['query'],
});

const previous = await gsc.fetchQueries({
  startDate: '2026-02-27',
  endDate: '2026-03-05',
  dimensions: ['query'],
});

// 2. Segment by position
const segments = segmentByPosition(current.rows);
console.log(`Striking distance (11-20): ${segments.segments.striking.count} queries`);

// 3. Detect anomalies
const report = detectAnomalies(current, previous);
console.log(`Anomalies found: ${report.anomalies.length}`);

// 4. Find new queries (organic keyword discovery)
const newQueries = findNewQueries(current, previous);
console.log(`New queries discovered: ${newQueries.length}`);
```

---

## 13. Open Questions

1. **Date range for performance cycle** — Strategy says Tuesday（after GSC data refreshes with ~3-day lag）。具体 date range 是 last 7 days? last 28 days? 建议：current = last 7 days, previous = 7 days before that. 28-day aggregate 作为 secondary view。决定留给 C3 spec。
2. **Domain property vs URL-prefix** — loreai.dev 在 GSC 中是 domain property 还是 URL-prefix property？影响 `siteUrl` 的格式。需要确认。目前代码兼容两种格式。
3. **Impression threshold for anomaly** — `impressionThresholdHigh: 100` 是否合适？取决于 loreai.dev 当前的流量水平。Integration test 跑完后根据真实数据调整 default。
4. **Rate limit / load quota management** — 当前设计是 throw + caller handles。如果 C3 需要大量查询（query+page），是否需要在 gsc.ts 层面加 built-in rate limiting？建议先不加，C3 实现时按需决定。
