# SPEC-A2 — Serper API Client

> **File:** `scripts/lib/serper.ts`
> **Depends on:** A1 (schema migration — keyword tables exist)
> **Consumed by:** B1 (keyword expansion), B3 (priority scoring), B4 (source-grounded generation)

---

## 1. Purpose

封装 Serper.dev Google SERP API，为 keyword engine 提供三类能力：

1. **Keyword discovery** — PAA、related searches、autocomplete → 喂给 B1 keyword expansion
2. **SERP depth detection** — 分析 top results 判断该 keyword 适合 FAQ 还是 deep-dive（Strategy §4.4 routing 的核心信号）
3. **Volume estimation** — Serper 不直接提供 search volume，用 SERP 信号间接估算

---

## 2. Serper API Reference

- **Base URL:** `https://google.serper.dev`
- **Auth:** `X-API-KEY` header
- **Method:** 所有 endpoint 均为 `POST`，body 为 JSON
- **Rate limit:** Free tier 5 req/s，paid tier 最高 300 req/s
- **Credit:** 10 results = 1 credit，20-100 results = 2 credits

### Endpoints Used

| Endpoint | Path | 用途 |
|---|---|---|
| Web Search | `/search` | PAA + related searches + organic results + answer box |
| Autocomplete | `/autocomplete` | Google autocomplete suggestions |

（不使用 news / images / videos / places / shopping / scholar / patents / scrape）

### Web Search Request

```json
{
  "q": "claude code pricing",
  "gl": "us",
  "hl": "en",
  "num": 10
}
```

### Web Search Response (relevant fields)

```typescript
{
  searchParameters: { q: string; gl: string; hl: string; type: "search" };
  answerBox?: { answer?: string; snippet?: string; title?: string; link?: string };
  knowledgeGraph?: { title: string; type: string; description: string; attributes: Record<string, string> };
  organic: Array<{ title: string; link: string; snippet: string; position: number; date?: string }>;
  peopleAlsoAsk: Array<{ question: string; snippet: string; title: string; link: string }>;
  relatedSearches: Array<{ query: string }>;
}
```

### Autocomplete Request / Response

```json
// Request
{ "q": "claude code" }

// Response
{
  "searchParameters": { "q": "claude code", "type": "autocomplete" },
  "suggestions": [{ "value": "claude code pricing" }, { "value": "claude code vs cursor" }]
}
```

---

## 3. TypeScript Interfaces

```typescript
// ── Config ──

export interface SerperConfig {
  apiKey: string;
  defaultGl?: string;   // default: "us"
  defaultHl?: string;   // default: "en"
  timeoutMs?: number;    // default: 10_000
}

// ── Shared ──

export interface PAAItem {
  question: string;
  snippet: string;
  title: string;
  link: string;
}

export interface OrganicResult {
  title: string;
  link: string;
  snippet: string;
  position: number;
  date?: string;
}

// ── Function Return Types ──

export interface PAAResult {
  query: string;
  questions: PAAItem[];
}

export interface RelatedResult {
  query: string;
  related: string[];
}

export interface AutocompleteResult {
  query: string;
  suggestions: string[];
}

export interface VolumeEstimate {
  query: string;
  estimated_volume: 'high' | 'medium' | 'low' | 'very_low';
  signals: {
    has_answer_box: boolean;
    has_knowledge_graph: boolean;
    has_paa: boolean;
    organic_count: number;
    has_ads: boolean;
  };
}

export type SERPDepth = 'short_answer' | 'long_form' | 'mixed';

export interface SERPDepthResult {
  query: string;
  depth: SERPDepth;
  avg_snippet_length: number;
  has_answer_box: boolean;
  has_knowledge_graph: boolean;
  top_results: Array<{
    title: string;
    link: string;
    snippet_length: number;
  }>;
  recommended_content_type: 'faq' | 'blog' | 'compare' | 'glossary' | 'cornerstone';
}
```

---

## 4. Functions

### 4.1 `searchPAA(query: string, opts?: { gl?: string; hl?: string }): Promise<PAAResult>`

从 `/search` 提取 `peopleAlsoAsk` 数组。

- 调用 `/search` with `num: 10`
- 返回所有 PAA questions
- 用于 B1 keyword expansion — PAA questions 本身就是 long-tail keyword candidates

### 4.2 `searchRelated(query: string, opts?: { gl?: string; hl?: string }): Promise<RelatedResult>`

从 `/search` 提取 `relatedSearches` 数组。

- 调用 `/search` with `num: 10`
- 返回 related query strings
- 用于 B1 keyword expansion — related searches 是 Google 直接给出的 keyword universe

### 4.3 `searchAutocomplete(query: string, opts?: { gl?: string; hl?: string }): Promise<AutocompleteResult>`

调用 `/autocomplete` endpoint。

- 返回 suggestion strings
- 用于 B1 keyword expansion — autocomplete 补充 PAA 和 related 没覆盖的 queries

### 4.4 `estimateVolume(query: string, opts?: { gl?: string; hl?: string }): Promise<VolumeEstimate>`

**Serper 不提供 search volume。** 用 SERP 信号间接推断：

| Signal | High Volume Indicator |
|---|---|
| `answerBox` 存在 | Google 认为该 query 有明确需求 |
| `knowledgeGraph` 存在 | Google 认为该 entity 有实体级需求 |
| `peopleAlsoAsk` 数量 ≥ 3 | 活跃的搜索意图生态 |
| `organic` 结果数 = 10 | 充足的内容供给 |

Estimation logic:
```
high:      answerBox + PAA ≥ 3 + organic = 10
medium:    PAA ≥ 2 + organic ≥ 8
low:       PAA ≥ 1 OR organic ≥ 5
very_low:  otherwise
```

**注意：** 这是粗略估算。当 GSC client (A4) 上线后，有真实 impression 数据的 keyword 应优先使用 GSC 数据。

### 4.5 `detectSERPDepth(query: string, opts?: { gl?: string; hl?: string }): Promise<SERPDepthResult>`

**核心路由信号。** 分析 SERP top results 判断该 keyword 适合什么内容类型。

Logic:
1. 调用 `/search` with `num: 10`
2. 计算 top 5 organic results 的 `snippet_length` 平均值
3. 检查 `answerBox` 和 `knowledgeGraph` 存在性
4. 分析 query 本身的 intent markers

Routing rules (对应 Strategy §4.4 表格):

```
query contains "vs" | "alternative" | "compare"
  → depth: mixed, recommended: compare

query contains "what is" | "meaning" | "definition"
  + avg_snippet_length < 200
  → depth: short_answer, recommended: glossary

has_answer_box AND avg_snippet_length < 150
  → depth: short_answer, recommended: faq

avg_snippet_length > 300
  → depth: long_form, recommended: blog

otherwise
  → depth: mixed, recommended: faq
```

### 4.6 `searchFull(query: string, opts?: { gl?: string; hl?: string; num?: number }): Promise<SerperSearchResponse>`

低级 API wrapper — 返回完整 Serper `/search` response。供上层组合使用（如 B4 source-grounded generation 可能需要 organic results 的 links）。

### 4.7 `batchSearch(queries: string[], delayMs?: number): Promise<PAAResult[]>`

批量调用 `searchPAA`，带 delay 防止 rate limit。参考 `brave.ts` 的 `batchValidate` pattern。

- 默认 `delayMs = 200`（paid tier 允许更快）
- 返回所有 queries 的 PAA results

---

## 5. Internal: `_post<T>(endpoint, body): Promise<T>`

共用的 HTTP helper：

```typescript
async function _post<T>(endpoint: string, body: Record<string, unknown>): Promise<T> {
  const res = await fetch(`https://google.serper.dev${endpoint}`, {
    method: 'POST',
    headers: {
      'X-API-KEY': config.apiKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(config.timeoutMs ?? 10_000),
  });

  if (!res.ok) {
    throw new SerperAPIError(res.status, await res.text());
  }

  return res.json() as Promise<T>;
}
```

---

## 6. Error Handling

```typescript
export class SerperAPIError extends Error {
  constructor(
    public readonly status: number,
    public readonly body: string,
  ) {
    super(`Serper API error ${status}: ${body}`);
    this.name = 'SerperAPIError';
  }
}
```

| Scenario | Handling |
|---|---|
| `SERPER_API_KEY` not set | `console.warn` + return empty result（与 `brave.ts` pattern 一致），不 throw |
| HTTP 403 | Throw `SerperAPIError` — API key invalid |
| HTTP 429 (rate limit) | Throw `SerperAPIError` — caller 负责 retry/backoff |
| Network timeout | `AbortSignal.timeout` 触发 AbortError — 自然传播 |
| API returns unexpected shape | Optional chaining + `?? []` fallback（与 `brave.ts` pattern 一致） |

**Design decision:** 与 `brave.ts` 保持一致 — 缺 API key 时不 throw（graceful degradation），API error 时 throw（让调用方决定 retry 策略）。

---

## 7. Environment Variables

| Variable | Required | Description |
|---|---|---|
| `SERPER_API_KEY` | Yes (for production) | Serper.dev API key |

在 `.env.example` 中添加：
```
SERPER_API_KEY=           # Serper.dev - Google SERP data (https://serper.dev)
```

---

## 8. Test Plan

### 8.1 Unit Tests (`scripts/lib/__tests__/serper.test.ts`)

Mock `global.fetch` — 不消耗 API credits。

| Test | 验证 |
|---|---|
| `searchPAA` extracts PAA questions | 给定 mock response，正确提取 `peopleAlsoAsk` 数组 |
| `searchPAA` returns empty when no PAA | `peopleAlsoAsk` 字段缺失时返回空数组 |
| `searchRelated` extracts related queries | 正确提取 `relatedSearches` → `query` strings |
| `searchAutocomplete` extracts suggestions | 正确提取 `suggestions` → `value` strings |
| `estimateVolume` returns "high" | answerBox + PAA ≥ 3 + organic = 10 → `high` |
| `estimateVolume` returns "very_low" | 无 PAA + organic < 5 → `very_low` |
| `detectSERPDepth` routes compare | query "claude code vs cursor" → `recommended: compare` |
| `detectSERPDepth` routes FAQ | short snippets + answer box → `recommended: faq` |
| `detectSERPDepth` routes blog | long snippets → `recommended: blog` |
| `detectSERPDepth` routes glossary | "what is ..." + short snippets → `recommended: glossary` |
| Missing API key → empty results | 不 throw，返回 graceful empty |
| HTTP 403 → throws SerperAPIError | 正确 throw with status |
| HTTP 429 → throws SerperAPIError | 正确 throw with status |
| `batchSearch` respects delay | 多个 queries 之间有 delay（用 spy 验证调用时间间隔） |

### 8.2 Integration Tests (`scripts/lib/__tests__/serper.integration.test.ts`)

**使用真实 API** — 只在 `SERPER_API_KEY` 存在时跑，CI 中 skip。

```typescript
const describeIfKey = process.env.SERPER_API_KEY ? describe : describe.skip;
```

| Test | Query | 验证 |
|---|---|---|
| PAA for known topic | `"claude code pricing"` | `questions.length > 0` |
| Related for known topic | `"claude code"` | `related.length > 0` |
| Autocomplete | `"claude code"` | `suggestions.length > 0` |
| Volume estimate for head term | `"claude code"` | `estimated_volume` is `high` or `medium` |
| SERP depth for compare query | `"claude code vs cursor"` | `recommended_content_type` is `compare` |
| SERP depth for FAQ query | `"how to install claude code"` | `recommended_content_type` is `faq` or `blog` |
| Full search returns organic | `"claude code"` | `organic.length > 0` |

### 8.3 Running Tests

```bash
npm test -- scripts/lib/__tests__/serper.test.ts           # unit (no API key needed)
SERPER_API_KEY=xxx npm test -- scripts/lib/__tests__/serper.integration.test.ts  # integration
```

---

## 9. Pattern Reference: `scripts/lib/brave.ts`

本模块参考 `brave.ts` 的以下 pattern：

| Pattern | brave.ts | serper.ts |
|---|---|---|
| Import dotenv | `import 'dotenv/config'` | 同 |
| API key from env | `process.env.BRAVE_SEARCH_API_KEY` | `process.env.SERPER_API_KEY` |
| Missing key handling | `console.warn` + empty return | 同 |
| HTTP error handling | `console.warn` + empty return | Throw `SerperAPIError`（因为 serper 是核心 pipeline，不应 silently fail） |
| Batch with delay | `batchValidate(topics, delayMs)` | `batchSearch(queries, delayMs)` |
| TypeScript interfaces | Export all types | 同 |

**与 brave.ts 的关键差异：**
- Serper 用 POST（brave 用 GET）
- Serper 返回结构更丰富（PAA, related, answer box, knowledge graph）
- Missing API key 仍然 graceful，但 API error 改为 throw（brave 只 console.warn — 因为 brave 是 optional validation，serper 是 pipeline critical path）

---

## 10. File Structure

```
scripts/lib/
├── brave.ts                     # 现有 — trend validation
├── serper.ts                    # 新建 — Google SERP data
└── __tests__/
    ├── serper.test.ts           # unit tests (mock fetch)
    └── serper.integration.test.ts  # integration tests (real API)
```

---

## 11. Credit Budget Estimate

每个 keyword expansion cycle 的 API 消耗：

| Operation | Queries per subtopic | Credits |
|---|---|---|
| searchPAA | 1 | 1 |
| searchRelated | 1 (same call as PAA) | 0 (reuse) |
| searchAutocomplete | 1 | 1 |
| detectSERPDepth | per keyword group (~5) | 5 |
| **Total per subtopic** | | **~7** |

**Optimization:** `searchPAA` 和 `searchRelated` 共享同一个 `/search` 调用 — 应在实现时合并为一次请求，拆分返回值。加一个内部函数 `_searchWeb(query)` 同时返回 PAA + related + organic。

---

## 12. Open Questions

1. **Volume estimation 精度** — SERP signal 估算只能分 4 档，是否足够？后续 GSC (A4) 有 impression 数据后可以校准。
2. **国际化** — 当前 default `gl=us, hl=en`。ZH content 是否需要 `gl=cn, hl=zh-cn` 的 keyword expansion？暂时不做，Phase C 再考虑。
3. **Caching** — Serper 不 cache（每次 real-time hit Google）。是否需要我们自己在 SQLite 中 cache SERP results？建议 B1 实现时决定。
