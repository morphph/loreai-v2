# SPEC-A3 — Exa API Client

> **File:** `scripts/lib/exa.ts`
> **Depends on:** A1 (schema migration — keyword tables exist)
> **Consumed by:** B1 (keyword expansion), B4 (source-grounded generation), C1 (discovery cycle)

---

## 1. Purpose

封装 Exa.ai API，为 keyword engine 提供三类能力：

1. **Semantic search** — 基于语义（而非关键词匹配）发现竞争对手内容和相关页面 → 喂给 B1 keyword expansion 和 §4.3 subtopic discovery
2. **Full page text extraction** — 从竞争对手 URL 提取 clean text（markdown 格式）→ 喂给 B4 source-grounded content generation
3. **Competitor analysis** — 给定我们的 URL，找到语义相似的竞争页面，分析覆盖差距 → 喂给 B1 keyword expansion + B3 priority scoring

**与 Serper 的分工：**
- **Serper** = Google 视角：PAA、related searches、autocomplete、SERP depth（keyword-level signals）
- **Exa** = 语义视角：semantic search、full page content、competitor discovery（content-level signals）

两者互补，不重叠。Serper 告诉我们 *用户搜什么*，Exa 告诉我们 *竞争对手写了什么*。

---

## 2. Exa API Reference

- **Base URL:** `https://api.exa.ai`
- **Auth:** `x-api-key` header（或 `Authorization: Bearer <key>`）
- **Method:** 所有 endpoint 均为 `POST`，body 为 JSON
- **Rate limit:** Search 10 QPS，Contents 100 QPS
- **Pricing:** Search $7/1k requests (1-10 results)，Contents $1/1k pages per content type。前 10 个 search results 的 contents 免费包含在 search 价格内。
- **Free tier:** 1,000 requests/month

### Endpoints Used

| Endpoint | Path | 用途 |
|---|---|---|
| Search | `POST /search` | Semantic search — 发现相关内容和竞争页面 |
| Contents | `POST /contents` | 从 URL 列表提取 clean text |
| Find Similar | `POST /findSimilar` | 给定 URL，找语义相似的页面 |

（不使用 answer / research — 我们用 Claude 做 reasoning，Exa 只做 data retrieval）

### Search Request

```json
{
  "query": "claude code setup guide",
  "type": "auto",
  "numResults": 10,
  "contents": {
    "text": { "maxCharacters": 3000 }
  },
  "startPublishedDate": "2025-01-01T00:00:00.000Z",
  "excludeDomains": ["loreai.dev"]
}
```

### Search Response (relevant fields)

```typescript
{
  requestId: string;
  results: Array<{
    url: string;
    title: string;
    publishedDate: string | null;
    author: string | null;
    text: string;        // 当 contents.text 开启时
    highlights: string[];  // 当 contents.highlights 开启时
    summary: string;     // 当 contents.summary 开启时
  }>;
}
```

### Contents Request

```json
{
  "ids": ["https://example.com/page1", "https://example.com/page2"],
  "text": { "maxCharacters": 5000 },
  "summary": { "query": "key points about this topic" }
}
```

### Contents Response

```typescript
{
  results: Array<{
    id: string;        // URL
    text: string;      // markdown-formatted clean text
    summary: string;
    image: string;
    favicon: string;
  }>;
  statuses: Array<{
    id: string;
    status: 'success' | 'error';
    error?: {
      tag: 'CRAWL_NOT_FOUND' | 'CRAWL_TIMEOUT' | 'CRAWL_LIVECRAWL_TIMEOUT' | 'SOURCE_NOT_AVAILABLE' | 'CRAWL_UNKNOWN_ERROR';
      httpStatusCode?: number;
    };
  }>;
}
```

### Find Similar Request

```json
{
  "url": "https://loreai.dev/blog/claude-code-guide",
  "numResults": 10,
  "excludeDomains": ["loreai.dev"],
  "contents": {
    "text": { "maxCharacters": 2000 }
  }
}
```

Response schema 与 Search 相同。

---

## 3. TypeScript Interfaces

```typescript
// ── Config ──

export interface ExaConfig {
  apiKey: string;
  timeoutMs?: number;        // default: 15_000 (Exa 比 Serper 慢，给更多时间)
  defaultNumResults?: number; // default: 10
}

// ── Content Options (shared across search/contents/findSimilar) ──

export interface ExaContentOptions {
  text?: boolean | { maxCharacters?: number };
  highlights?: boolean | { query?: string; maxCharacters?: number };
  summary?: boolean | { query?: string };
}

// ── Search Result ──

export interface ExaSearchResult {
  url: string;
  title: string;
  published_date: string | null;
  author: string | null;
  text?: string;
  highlights?: string[];
  summary?: string;
}

// ── Function Return Types ──

export interface SemanticSearchResult {
  query: string;
  results: ExaSearchResult[];
}

export interface PageContent {
  url: string;
  title: string;
  text: string;
  summary?: string;
  word_count: number;
  status: 'success' | 'error';
  error?: string;
}

export interface ContentsResult {
  urls: string[];
  pages: PageContent[];
  failed: Array<{ url: string; error: string }>;
}

export interface CompetitorPage {
  url: string;
  title: string;
  published_date: string | null;
  text?: string;
  summary?: string;
  word_count: number;
}

export interface CompetitorAnalysis {
  source_url: string;
  competitors: CompetitorPage[];
  coverage_gaps: string[];    // topics competitors cover that source doesn't
  common_themes: string[];    // topics both source and competitors cover
}
```

---

## 4. Functions

### 4.1 `semanticSearch(query: string, opts?: SemanticSearchOptions): Promise<SemanticSearchResult>`

```typescript
interface SemanticSearchOptions {
  numResults?: number;           // default: 10
  type?: 'auto' | 'neural';     // default: 'auto'
  contents?: ExaContentOptions;  // default: { text: { maxCharacters: 2000 } }
  startPublishedDate?: string;   // ISO 8601
  endPublishedDate?: string;
  includeDomains?: string[];
  excludeDomains?: string[];     // default: ['loreai.dev']
  category?: 'news' | 'research paper' | 'company' | 'tweet';
}
```

Semantic search 找到与 query 语义相关的内容。

- 调用 `POST /search`
- 默认排除 `loreai.dev`（不搜索自己的内容）
- 默认返回 text（maxCharacters: 2000），可通过 opts 覆盖
- 用于 B1 keyword expansion（发现竞争对手覆盖了哪些 subtopics）和 §4.3 subtopic discovery

### 4.2 `getContents(urls: string[], opts?: GetContentsOptions): Promise<ContentsResult>`

```typescript
interface GetContentsOptions {
  text?: boolean | { maxCharacters?: number };   // default: { maxCharacters: 5000 }
  summary?: boolean | { query?: string };
  livecrawlTimeout?: number;                     // default: 10000
}
```

从 URL 列表提取 clean text（markdown 格式）。

- 调用 `POST /contents`
- 返回每个 URL 的 text + word count
- 区分成功和失败的 URL（Exa 的 `statuses` 数组告诉我们哪些 crawl 失败了）
- 用于 B4 source-grounded generation — 获取竞争对手页面的完整内容作为 Claude 的 source material
- **Word count 计算：** 英文用空格分词 `.split(/\s+/).length`，CJH 字符逐字计数（遵循 CLAUDE.md "ZH content 必须用 CJK word count"）

### 4.3 `analyzeCompetitors(sourceUrl: string, opts?: CompetitorAnalysisOptions): Promise<CompetitorAnalysis>`

```typescript
interface CompetitorAnalysisOptions {
  numResults?: number;           // default: 10
  excludeDomains?: string[];     // default: ['loreai.dev']
  contents?: ExaContentOptions;  // default: { text: { maxCharacters: 2000 }, summary: true }
}
```

给定一个 URL（通常是我们自己的页面），找到语义相似的竞争页面并分析。

- 调用 `POST /findSimilar`（而非 search）
- 返回竞争页面列表 + word count
- `coverage_gaps` 和 `common_themes` 由调用方（B1 或 B3）决定如何填充 — **本函数只返回 competitor pages 的 raw data**，gap analysis 由上层的 Claude call 完成
- **设计决策：** `coverage_gaps` 和 `common_themes` 暂时返回空数组。Gap analysis 需要 NLP/LLM，不应在数据层做。B1 拿到 competitor pages 后，会用 Claude skill 做 gap analysis。

---

## 5. Internal: `_post<T>(endpoint, body): Promise<T>`

共用的 HTTP helper，pattern 与 `serper.ts` 一致：

```typescript
async function _post<T>(endpoint: string, body: Record<string, unknown>): Promise<T> {
  const res = await fetch(`https://api.exa.ai${endpoint}`, {
    method: 'POST',
    headers: {
      'x-api-key': config.apiKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(config.timeoutMs ?? 15_000),
  });

  if (!res.ok) {
    throw new ExaAPIError(res.status, await res.text());
  }

  return res.json() as Promise<T>;
}
```

---

## 6. Error Handling

```typescript
export class ExaAPIError extends Error {
  constructor(
    public readonly status: number,
    public readonly body: string,
  ) {
    super(`Exa API error ${status}: ${body}`);
    this.name = 'ExaAPIError';
  }
}
```

| Scenario | Handling |
|---|---|
| `EXA_API_KEY` not set | `console.warn` + return empty result（与 `brave.ts` / `serper.ts` pattern 一致），不 throw |
| HTTP 401/403 | Throw `ExaAPIError` — API key invalid |
| HTTP 429 (rate limit) | Throw `ExaAPIError` — caller 负责 retry/backoff |
| Network timeout | `AbortSignal.timeout` 触发 AbortError — 自然传播 |
| Contents partial failure | **不 throw。** Exa contents 返回 `statuses` 数组，部分 URL 可能 crawl 失败。将成功的放入 `pages`，失败的放入 `failed`，caller 决定如何处理 |
| API returns unexpected shape | Optional chaining + `?? []` fallback（与 `brave.ts` pattern 一致） |

**Design decision:** 与项目现有 API client pattern 保持一致 — 缺 API key 时 graceful degradation（`console.warn` + empty return），API error 时 throw（serper pattern）。Contents 的 partial failure 特殊处理：不 throw，因为 10 个 URL 中 1 个 crawl 失败不应阻塞整个 pipeline。

---

## 7. Environment Variables

| Variable | Required | Description |
|---|---|---|
| `EXA_API_KEY` | Yes (for production) | Exa.ai API key (https://dashboard.exa.ai) |

在 `.env.example` 中添加：
```
EXA_API_KEY=              # Exa.ai - semantic search & content extraction (https://exa.ai)
```

---

## 8. Test Plan

### 8.1 Unit Tests (`scripts/lib/__tests__/exa.test.ts`)

Mock `global.fetch` — 不消耗 API credits。

| Test | 验证 |
|---|---|
| `semanticSearch` returns results | 给定 mock response，正确映射 `results` 数组到 `ExaSearchResult[]` |
| `semanticSearch` defaults excludeDomains to `['loreai.dev']` | 验证 fetch 请求 body 包含 `excludeDomains: ['loreai.dev']` |
| `semanticSearch` returns empty when no results | `results` 为空时返回空数组 |
| `getContents` maps successful pages | 给定 mock response，正确计算 word_count，区分 success/error |
| `getContents` handles partial failure | 2 URLs，1 success + 1 error → `pages.length = 1`, `failed.length = 1` |
| `getContents` word count: English | "hello world foo bar" → `word_count: 4` |
| `getContents` word count: CJK | "你好世界" → `word_count: 4`（逐字计数） |
| `getContents` word count: mixed | "hello 你好 world" → 正确混合计算 |
| `analyzeCompetitors` calls findSimilar | 验证 fetch 请求 URL 是 `/findSimilar`，body 包含 `url` 字段 |
| `analyzeCompetitors` excludes own domain | 验证 `excludeDomains` 包含 `loreai.dev` |
| `analyzeCompetitors` returns empty gaps/themes | `coverage_gaps` 和 `common_themes` 为空数组（gap analysis 由上层做） |
| Missing API key → empty results | 不 throw，`console.warn` + 返回 graceful empty |
| HTTP 401 → throws ExaAPIError | 正确 throw with status |
| HTTP 429 → throws ExaAPIError | 正确 throw with status |
| Timeout → AbortError propagates | `AbortSignal.timeout` 触发后 error 自然传播 |

### 8.2 Integration Tests (`scripts/lib/__tests__/exa.integration.test.ts`)

**使用真实 API** — 只在 `EXA_API_KEY` 存在时跑，CI 中 skip。

```typescript
const describeIfKey = process.env.EXA_API_KEY ? describe : describe.skip;
```

| Test | Query / Input | 验证 |
|---|---|---|
| Semantic search for known topic | `"claude code setup guide"` | `results.length > 0`, 每个 result 有 `url` 和 `title` |
| Semantic search with text content | `"claude code pricing"` with `contents.text: true` | 至少 1 个 result 有非空 `text` |
| Semantic search with date filter | `"claude code"` + `startPublishedDate: "2025-01-01"` | results 存在且 `published_date >= 2025-01-01` |
| getContents for known URL | `["https://docs.anthropic.com/en/docs/claude-code/overview"]` | `pages.length = 1`, `text` 非空, `word_count > 100` |
| getContents with invalid URL | `["https://example.com/nonexistent-page-12345"]` | `failed.length = 1` 或 `pages[0].status = 'error'`（graceful handling） |
| analyzeCompetitors for our page | `"https://loreai.dev/blog/claude-code-guide"` (or similar existing page) | `competitors.length > 0`, 每个 competitor 有 `url` |
| Rate limit: sequential calls don't fail | 3 sequential `semanticSearch` calls | 全部成功（10 QPS 内） |

### 8.3 Running Tests

```bash
npm test -- scripts/lib/__tests__/exa.test.ts                # unit (no API key needed)
EXA_API_KEY=xxx npm test -- scripts/lib/__tests__/exa.integration.test.ts  # integration
```

---

## 9. Pattern Reference: `scripts/lib/brave.ts` + `scripts/lib/serper.ts`

本模块参考现有 API client 的以下 pattern：

| Pattern | brave.ts / serper.ts | exa.ts |
|---|---|---|
| Import dotenv | `import 'dotenv/config'` | 同 |
| API key from env | `process.env.BRAVE_SEARCH_API_KEY` / `SERPER_API_KEY` | `process.env.EXA_API_KEY` |
| Missing key handling | `console.warn` + empty return | 同 |
| Config object | `SerperConfig` + `setSerperConfig()` | `ExaConfig` + `setExaConfig()` |
| HTTP error | `SerperAPIError` (throw) | `ExaAPIError` (throw) |
| Internal HTTP helper | `_post<T>(endpoint, body)` | 同 |
| TypeScript interfaces | Export all types | 同 |
| Empty result helpers | `emptyPAA()`, `emptyRelated()`, etc. | `emptySearchResult()`, `emptyContents()`, `emptyCompetitorAnalysis()` |

**与 serper.ts 的关键差异：**
- Exa 用 `x-api-key` header（serper 用 `X-API-KEY`）
- Exa 的 `getContents` 有 partial failure — 需要区分成功和失败的 URL（serper 没有这个概念）
- Exa `analyzeCompetitors` 用 `/findSimilar` endpoint（按 URL 而非 query 搜索） — serper 没有等价功能
- Default timeout 15s（serper 10s），因为 Exa 的 livecrawl 可能较慢
- `analyzeCompetitors` 不做 gap analysis（纯数据层），serper 的 `detectSERPDepth` 做 routing logic — 这是合理的差异，因为 gap analysis 需要 LLM

---

## 10. File Structure

```
scripts/lib/
├── brave.ts                        # 现有 — trend validation
├── serper.ts                       # A2 — Google SERP data
├── exa.ts                          # 新建 — semantic search & content extraction
└── __tests__/
    ├── exa.test.ts                 # unit tests (mock fetch)
    └── exa.integration.test.ts     # integration tests (real API)
```

---

## 11. Credit Budget Estimate

每个 keyword expansion cycle 的 Exa API 消耗：

| Operation | Calls per subtopic | Cost (approx) |
|---|---|---|
| semanticSearch (subtopic discovery) | 1 | $0.007 |
| getContents (competitor pages, ~5 URLs) | 1 | $0.005 |
| analyzeCompetitors (findSimilar for our page) | 1 | $0.007 |
| **Total per subtopic** | **3** | **~$0.019** |

**For B4 source-grounded generation (per content piece):**

| Operation | Calls | Cost (approx) |
|---|---|---|
| semanticSearch (find source material) | 1 | $0.007 |
| getContents (fetch top 5 source pages) | 1 | $0.005 |
| **Total per content piece** | **2** | **~$0.012** |

**Monthly estimate (assuming 5 subtopics/week + 20 content pieces/week):**
- Discovery: 5 × $0.019 × 4 = ~$0.38/month
- Generation: 20 × $0.012 × 4 = ~$0.96/month
- **Total: ~$1.34/month**（远低于 free tier 的 1,000 requests）

---

## 12. Design Decisions

### 12.1 不使用 `exa-js` SDK

Exa 有官方 JS SDK (`exa-js`)，但我们选择直接用 `fetch`：

- **一致性：** `brave.ts` 和 `serper.ts` 都用 raw `fetch`，保持统一
- **依赖最小化：** `exa-js` 拉入 `openai`、`zod` 等依赖，对我们的用例过重
- **控制力：** timeout、error handling、retry 策略由我们控制
- **可维护性：** API 就 3 个 endpoint，封装成本极低

### 12.2 `analyzeCompetitors` 不做 gap analysis

Gap analysis（"竞争对手覆盖了什么我们没覆盖的"）需要对比两组内容。这本质上是 NLP/LLM 任务，不应在数据获取层做。

`analyzeCompetitors` 只负责：拿到 competitor pages → 返回 raw data。
Gap analysis 由 B1 (keyword expansion) 的 Claude skill 完成。

### 12.3 Word count 使用 CJK-aware 计算

遵循 CLAUDE.md 规定："ZH content 必须用 CJK word count，不能用英文空格分词"。

```typescript
function countWords(text: string): number {
  const cjkChars = (text.match(/[\u4e00-\u9fff\u3400-\u4dbf\uF900-\uFAFF]/g) ?? []).length;
  const nonCjk = text.replace(/[\u4e00-\u9fff\u3400-\u4dbf\uF900-\uFAFF]/g, ' ');
  const latinWords = nonCjk.split(/\s+/).filter(Boolean).length;
  return cjkChars + latinWords;
}
```

---

## 13. Open Questions

1. **Content freshness for getContents** — Exa 支持 `maxAgeHours`（0=always livecrawl, -1=never livecrawl）。Default 用 Exa 默认缓存还是 always livecrawl？建议默认缓存（更快更便宜），只在 B4 generation 需要最新内容时用 `maxAgeHours: 0`。实现时决定。
2. **Summary vs full text** — `getContents` 支持同时返回 summary 和 full text。B4 source-grounded generation 可能只需要 summary（更短、token 更省）。建议 default 返回 full text，让调用方选择 summary。
3. **Domain exclusion list** — 当前 hardcode `excludeDomains: ['loreai.dev']`。是否需要更完整的排除列表（如 pinterest、quora 等低质量来源）？建议 B1 实现时根据实际结果质量决定。
