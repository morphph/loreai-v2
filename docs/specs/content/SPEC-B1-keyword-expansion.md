---
title: "SPEC-B1 — Keyword Expansion"
status: active
category: spec
last-updated: 2026-03-20
depends-on: ["SPEC-A2", "SPEC-A3"]
---

# SPEC-B1 — Keyword Expansion Script

> **File:** `scripts/expand-keywords.ts`
> **Depends on:** A1 (schema — keywords/keyword_groups/create_queue tables), A2 (serper.ts), A3 (exa.ts)
> **Consumed by:** B2 (keyword grouping), B3 (priority scoring), C1 (discovery cycle)

---

## 1. Purpose

给定一个 flagship topic 的 subtopics 列表，自动扩展出完整的 keyword universe 并写入 DB。

这是 keyword engine 的 **第一个 orchestration 层**——它把 A2 (Serper) 和 A3 (Exa) 的原子 API 调用编排成一个完整的 keyword discovery 流程。

**Strategy §4.4 定位：** Keyword Expansion 是 "Stage 3 — Keyword Expansion & Grouping" 的前半段。它回答 "What specific queries do people search?" 的问题。后半段（grouping）由 B2 完成。

**与现有 `topic-cluster.ts` 的关系：**
- `topic-cluster.ts` 的 `braveExpandNewTopics()` 是旧 pipeline 的 keyword expansion——用 Brave Search 做简单扩展
- B1 替代这个角色，使用更丰富的信号源（Serper PAA/related/autocomplete + Exa competitor scan）
- 旧系统保留不动（newsletter pipeline 仍使用），B1 是新 keyword engine 的专属入口

---

## 2. CLI Interface

```bash
# 基本用法：扩展一个 flagship topic 的所有 subtopics
npx tsx scripts/expand-keywords.ts --topic=claude-code

# 只扩展指定 subtopics
npx tsx scripts/expand-keywords.ts --topic=claude-code --subtopics=pricing,hooks,agent-teams

# Dry run（不写 DB，只输出发现的 keywords）
npx tsx scripts/expand-keywords.ts --topic=claude-code --dry-run

# 指定并发度和 API delay
npx tsx scripts/expand-keywords.ts --topic=claude-code --delay=300
```

### Arguments

| Arg | Required | Default | Description |
|---|---|---|---|
| `--topic` | Yes | — | Flagship topic slug（必须在 `topic_clusters` 表中存在） |
| `--subtopics` | No | 全部 | 逗号分隔的 subtopic slug 列表，只扩展这些 |
| `--dry-run` | No | false | 不写 DB，只输出到 stdout |
| `--delay` | No | 300 | API 调用之间的延迟（ms），防 rate limit |
| `--skip-exa` | No | false | 跳过 Exa competitor scan（省 API credits，适合频繁测试） |

---

## 3. Input: Subtopics

Subtopics 从 `topic_clusters` 表读取。每个 subtopic 是一个 cluster slug + pillar topic name。

```typescript
interface SubtopicInput {
  slug: string;          // e.g. "claude-code-pricing"
  pillar_topic: string;  // e.g. "Claude Code Pricing"
}
```

**读取逻辑：**
```sql
SELECT slug, pillar_topic FROM topic_clusters
WHERE slug LIKE '{topic}-%'    -- subtopics of the flagship topic
   OR slug = '{topic}'          -- the flagship topic itself
ORDER BY mention_count DESC
```

如果指定了 `--subtopics`，只取指定的 slug。

---

## 4. Expansion Pipeline

对每个 subtopic，按顺序执行 4 个 expansion step。每个 step 产出 raw keywords，最后汇总去重写入 DB。

### 4.1 Serper PAA Expansion

```typescript
import { searchPAA } from './lib/serper';

const paa = await searchPAA(subtopic.pillar_topic);
// paa.questions → 每个 question 本身就是一个 long-tail keyword
// e.g. "How much does Claude Code cost per month?"
```

**产出：** PAA questions 作为 keywords，source = `'serper-paa'`

### 4.2 Serper Related Searches

```typescript
import { searchRelated } from './lib/serper';

const related = await searchRelated(subtopic.pillar_topic);
// related.related → Google 直接给出的 keyword universe
// e.g. "claude code pricing plans", "claude code enterprise"
```

**产出：** Related searches 作为 keywords，source = `'serper-related'`

### 4.3 Serper Autocomplete

```typescript
import { searchAutocomplete } from './lib/serper';

const autocomplete = await searchAutocomplete(subtopic.pillar_topic);
// autocomplete.suggestions → 用户实际输入的 queries
// e.g. "claude code pricing 2026", "claude code pricing vs cursor"
```

**产出：** Autocomplete suggestions 作为 keywords，source = `'serper-autocomplete'`

### 4.4 Exa Competitor Scan

```typescript
import { semanticSearch } from './lib/exa';

const competitors = await semanticSearch(subtopic.pillar_topic, {
  numResults: 10,
  contents: { text: { maxCharacters: 3000 } },
  excludeDomains: ['loreai.dev'],
});
```

从 competitor pages 中提取额外的 keyword signals：
- **Title keywords：** 竞争对手的 page title 本身就是一个 keyword signal
- **Heading extraction：** 从 competitor text 中提取 H2/H3-style headings 作为 subtopic keywords

```typescript
function extractCompetitorKeywords(results: ExaSearchResult[]): string[] {
  const keywords: string[] = [];

  for (const r of results) {
    // Title as keyword
    if (r.title) keywords.push(r.title);

    // Extract markdown headings from text (## or ### lines)
    if (r.text) {
      const headings = r.text.match(/^#{2,3}\s+(.+)$/gm) ?? [];
      for (const h of headings) {
        const clean = h.replace(/^#{2,3}\s+/, '').trim();
        if (clean.length > 5 && clean.length < 100) {
          keywords.push(clean);
        }
      }
    }
  }

  return keywords;
}
```

**产出：** Competitor titles + headings 作为 keywords，source = `'exa-competitor'`

---

## 5. Keyword Normalization & Dedup

所有 4 个 step 的 raw keywords 在写入 DB 前经过统一处理：

```typescript
function normalizeKeyword(raw: string): string | null {
  let kw = raw
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ')        // collapse whitespace
    .replace(/[""'']/g, '')      // remove smart quotes
    .replace(/\?$/, '');          // remove trailing question mark

  // Filter out garbage
  if (kw.length < 3 || kw.length > 150) return null;
  if (/^https?:\/\//.test(kw)) return null;          // URLs
  if (kw.split(' ').length > 15) return null;         // too many words = not a keyword

  return kw;
}
```

**Dedup 策略：**
- In-memory Set 去重（同一个 expansion run 内）
- DB-level dedup via `UNIQUE(keyword)` constraint（跨 run 去重）
- `upsertKeyword()` 的 `ON CONFLICT` 只更新 `cluster_slug`，不覆盖 source（保留首次发现的来源）

---

## 6. Volume Pre-scoring (Optional, Batched)

对发现的 keyword 中 **尚未有 volume estimate 的**，批量调用 Serper `estimateVolume`：

```typescript
import { estimateVolume } from './lib/serper';

// Only score keywords that don't have volume yet
const unscored = newKeywords.filter(kw => !kw.search_volume);

// Batch with delay to respect rate limits
for (const kw of unscored.slice(0, MAX_VOLUME_CALLS)) {
  const vol = await estimateVolume(kw.keyword);
  updateKeywordVolume(kw.keyword, vol.estimated_volume, vol.signals);
  await delay(delayMs);
}
```

**限制：** 每次 run 最多对 `MAX_VOLUME_CALLS = 20` 个 keyword 做 volume estimation（控制 API credits）。优先选 source = `'serper-paa'` 和 `'serper-related'` 的（比 competitor headings 更可能是真实 search queries）。

**DB 更新：**
```sql
UPDATE keywords
SET search_volume = ?, competition = ?
WHERE keyword = ?
```

Volume mapping:

| `estimated_volume` | `search_volume` (numeric) |
|---|---|
| `high` | 10000 |
| `medium` | 1000 |
| `low` | 100 |
| `very_low` | 10 |

（粗略数字，仅用于 priority scoring 的相对排序。A4 GSC 上线后用真实 impression 数据校准。）

---

## 7. DB Write

使用现有 `upsertKeyword()` 函数写入 keywords 表：

```typescript
import { upsertKeyword, getDb } from './lib/db';

for (const kw of normalizedKeywords) {
  upsertKeyword(kw.text, kw.source, subtopic.slug);
}
```

**注意：** 遵循 CLAUDE.md 规定 "`upsertKeyword()` 必须传三个参数（keyword, source, clusterSlug）"。

### 写入统计

每个 subtopic 完成后输出统计：

```
  "Claude Code Pricing" (claude-code-pricing):
    serper-paa:          4 keywords (3 new)
    serper-related:      8 keywords (5 new)
    serper-autocomplete: 7 keywords (4 new)
    exa-competitor:     12 keywords (8 new)
    volume-scored:       15 keywords
    total new:           20 keywords
```

---

## 8. Output Types

```typescript
/** Per-subtopic expansion result */
export interface SubtopicExpansionResult {
  slug: string;
  pillar_topic: string;
  keywords_by_source: {
    'serper-paa': string[];
    'serper-related': string[];
    'serper-autocomplete': string[];
    'exa-competitor': string[];
  };
  total_raw: number;
  total_new: number;        // after dedup against DB
  volume_scored: number;
}

/** Full run result */
export interface ExpansionRunResult {
  topic: string;
  subtopics_processed: number;
  subtopic_results: SubtopicExpansionResult[];
  total_keywords_discovered: number;
  total_new_keywords: number;
  total_volume_scored: number;
  serper_api_calls: number;
  exa_api_calls: number;
}
```

---

## 9. Script Structure

遵循 `extract-entities.ts` 的 pattern：staged execution + dry-run support。

```
scripts/expand-keywords.ts     ← CLI entry point (main script)
scripts/lib/keyword-expand.ts  ← Core logic (importable, testable)
```

### `scripts/lib/keyword-expand.ts` — Core Logic

```typescript
export interface ExpandOptions {
  delayMs: number;
  skipExa: boolean;
  maxVolumeCallsPerSubtopic: number;  // default: 20
  dryRun: boolean;
}

/**
 * Expand keywords for a single subtopic.
 * Pure logic — all DB/API calls through injected dependencies.
 */
export async function expandSubtopic(
  subtopic: SubtopicInput,
  opts: ExpandOptions,
): Promise<SubtopicExpansionResult>;

/**
 * Expand keywords for all subtopics of a flagship topic.
 */
export async function expandTopic(
  topicSlug: string,
  subtopicSlugs: string[] | null,  // null = all subtopics
  opts: ExpandOptions,
): Promise<ExpansionRunResult>;

/**
 * Normalize a raw keyword string. Returns null if invalid.
 */
export function normalizeKeyword(raw: string): string | null;

/**
 * Extract keywords from Exa competitor page results.
 */
export function extractCompetitorKeywords(
  results: ExaSearchResult[],
): string[];
```

### `scripts/expand-keywords.ts` — CLI Entry Point

```typescript
// Pattern: extract-entities.ts style
async function main() {
  console.log(`🔍 Keyword Expansion — ${topicSlug}`);

  // Stage 1: Load subtopics from DB
  // Stage 2: Expand each subtopic (Serper + Exa)
  // Stage 3: Volume pre-scoring
  // Stage 4: Write to DB (unless dry-run)
  // Stage 5: Summary

  closeDb();
}

main().catch((err) => {
  console.error('❌ Keyword expansion failed:', err);
  closeDb();
  process.exit(1);
});
```

---

## 10. API Credit Budget

Per subtopic:

| Operation | API | Calls | Credits |
|---|---|---|---|
| `searchPAA` | Serper | 1 | 1 |
| `searchRelated` | Serper | 1 | 0 (shares `_searchWeb` with PAA — see optimization below) |
| `searchAutocomplete` | Serper | 1 | 1 |
| `semanticSearch` | Exa | 1 | ~$0.007 |
| `estimateVolume` (up to 20) | Serper | 20 | 20 |
| **Total per subtopic** | | **24** | **~22 Serper credits + $0.007 Exa** |

### Optimization: Merge PAA + Related into Single Call

`searchPAA` 和 `searchRelated` 都调用 `_searchWeb(query)`。创建一个 helper 合并两次调用为一次：

```typescript
async function expandViaSerperSearch(
  query: string,
  opts?: { gl?: string; hl?: string },
): Promise<{ paa: string[]; related: string[] }> {
  const data = await searchFull(query, opts);
  return {
    paa: (data.peopleAlsoAsk ?? []).map(item => item.question),
    related: (data.relatedSearches ?? []).map(item => item.query),
  };
}
```

**Savings:** 每个 subtopic 节省 1 Serper credit（PAA + related 合并为 1 次 /search 调用）。

---

## 11. Error Handling

| Scenario | Handling |
|---|---|
| Flagship topic not in DB | Exit with error message, don't proceed |
| Subtopic not in DB | Skip with warning, continue to next |
| Serper API key missing | `console.warn` + skip Serper steps（graceful degradation，与 serper.ts pattern 一致） |
| Exa API key missing | `console.warn` + skip Exa step |
| Serper API error (429/500) | Log error, skip that subtopic's Serper expansion, continue |
| Exa API error | Log error, skip Exa expansion for that subtopic, continue |
| No keywords found for a subtopic | Log warning, continue to next subtopic |
| DB write failure | Log error, continue（`upsertKeyword` 的 `INSERT OR IGNORE` 已经 handles conflicts） |

**Design principle:** 单个 subtopic 或 API call 的失败不应阻塞整个 expansion run。Log + skip + continue。

---

## 12. Rate Limiting

```typescript
const DEFAULT_DELAY_MS = 300;

async function delay(ms: number): Promise<void> {
  if (ms > 0) await new Promise(r => setTimeout(r, ms));
}
```

在每个 API 调用之间插入 delay：
- Serper: 300ms（paid tier 允许 300 req/s，但保守处理）
- Exa: 300ms（10 QPS limit）
- Volume estimation: 300ms per call

可通过 `--delay` 参数调整。

---

## 13. Console Output

遵循 `extract-entities.ts` 的 emoji + staged output pattern：

```
🔍 Keyword Expansion — claude-code
==================================================

📥 Stage 1: Load Subtopics
  Found 8 subtopics for "claude-code"

🌐 Stage 2: Serper Expansion
  [1/8] "Claude Code Pricing" (claude-code-pricing)
    PAA: 4 questions
    Related: 8 queries
    Autocomplete: 7 suggestions
  [2/8] "Claude Code vs Cursor" (claude-code-vs-cursor)
    PAA: 5 questions
    Related: 6 queries
    Autocomplete: 9 suggestions
  ...

🔎 Stage 3: Exa Competitor Scan
  [1/8] "Claude Code Pricing" → 10 competitor pages → 12 keywords
  [2/8] "Claude Code vs Cursor" → 8 competitor pages → 9 keywords
  ...

📊 Stage 4: Volume Pre-scoring
  Scoring 45 unscored keywords (max 20 per subtopic)
  Scored: 12 high, 18 medium, 10 low, 5 very_low

💾 Stage 5: Write to DB
  Total: 156 raw keywords → 89 new (after dedup)
  API usage: 28 Serper calls, 8 Exa calls

✅ Keyword expansion complete — 89 new keywords across 8 subtopics
```

Dry run 时 Stage 5 替换为：
```
🧪 DRY RUN — skipping DB write
  Would write 89 new keywords
```

---

## 14. Test Plan

### 14.1 Unit Tests (`scripts/lib/__tests__/keyword-expand.test.ts`)

Mock `serper.ts` 和 `exa.ts` 模块——不消耗 API credits，不碰 DB。

| Test | 验证 |
|---|---|
| `normalizeKeyword` — basic normalization | `"  Claude Code Pricing? "` → `"claude code pricing"` |
| `normalizeKeyword` — filters too short | `"ai"` → `null` |
| `normalizeKeyword` — filters too long | 超过 150 字符 → `null` |
| `normalizeKeyword` — filters URLs | `"https://example.com"` → `null` |
| `normalizeKeyword` — filters too many words | 超过 15 个 word → `null` |
| `normalizeKeyword` — collapses whitespace | `"claude  code   pricing"` → `"claude code pricing"` |
| `normalizeKeyword` — removes smart quotes | `""claude code""` → `"claude code"` |
| `extractCompetitorKeywords` — extracts titles | 给定 results with titles → 返回 titles |
| `extractCompetitorKeywords` — extracts H2/H3 headings | 给定 results with markdown text → 提取 `##` 和 `###` headings |
| `extractCompetitorKeywords` — filters short headings | heading < 5 chars → 不提取 |
| `extractCompetitorKeywords` — filters long headings | heading > 100 chars → 不提取 |
| `expandSubtopic` — combines all sources | Mock Serper (PAA: 3, related: 5, autocomplete: 4) + Exa (2 competitor titles) → total 14 raw keywords |
| `expandSubtopic` — deduplicates within run | PAA 和 related 返回相同 keyword → 只计一次 |
| `expandSubtopic` — handles Serper PAA empty | `peopleAlsoAsk` 为空 → 继续执行 related 和 autocomplete |
| `expandSubtopic` — handles Exa empty | `semanticSearch` 返回空 results → 继续，只输出 Serper keywords |
| `expandSubtopic` — skips Exa when `skipExa=true` | 不调用 `semanticSearch`，只输出 Serper keywords |
| `expandSubtopic` — dry run doesn't call DB | `dryRun=true` → `upsertKeyword` 从未被调用 |
| `expandTopic` — processes multiple subtopics | 2 subtopics → 分别调用 `expandSubtopic` 并汇总 |
| `expandTopic` — skips missing subtopics | 指定不存在的 slug → skip with warning |
| Volume mapping — high → 10000 | `estimateVolume` 返回 `'high'` → DB 写入 `search_volume = 10000` |
| Volume mapping — very_low → 10 | `estimateVolume` 返回 `'very_low'` → DB 写入 `search_volume = 10` |
| Volume scoring — respects max calls | 30 unscored keywords + `maxVolumeCallsPerSubtopic=20` → 只调用 20 次 `estimateVolume` |
| Volume scoring — prioritizes PAA/related | PAA keyword 在 competitor keyword 之前被 scored |

### 14.2 Mock Data

```typescript
// Mock Serper PAA response
const MOCK_PAA: PAAResult = {
  query: 'claude code pricing',
  questions: [
    { question: 'How much does Claude Code cost?', snippet: '...', title: '...', link: '...' },
    { question: 'Is Claude Code free?', snippet: '...', title: '...', link: '...' },
    { question: 'What is Claude Code Max plan?', snippet: '...', title: '...', link: '...' },
  ],
};

// Mock Serper Related response
const MOCK_RELATED: RelatedResult = {
  query: 'claude code pricing',
  related: ['claude code pricing plans', 'claude code enterprise pricing', 'claude code vs cursor pricing'],
};

// Mock Serper Autocomplete response
const MOCK_AUTOCOMPLETE: AutocompleteResult = {
  query: 'claude code pricing',
  suggestions: ['claude code pricing 2026', 'claude code pricing per month', 'claude code pricing api'],
};

// Mock Exa semantic search response
const MOCK_EXA_SEARCH: SemanticSearchResult = {
  query: 'claude code pricing',
  results: [
    {
      url: 'https://competitor.com/claude-code-cost',
      title: 'Claude Code Pricing: Complete Cost Breakdown 2026',
      published_date: '2026-02-15',
      author: null,
      text: '## Overview\nClaude Code offers...\n## Plans and Pricing\n...\n## Free Tier Details\n...',
    },
    {
      url: 'https://another.com/ai-coding-tools-pricing',
      title: 'AI Coding Tools Pricing Compared',
      published_date: '2026-01-20',
      author: null,
      text: '## Claude Code\n...\n## Cursor\n...\n## GitHub Copilot\n...',
    },
  ],
};

// Mock Volume estimate
const MOCK_VOLUME: VolumeEstimate = {
  query: 'claude code pricing',
  estimated_volume: 'high',
  signals: { has_answer_box: true, has_knowledge_graph: false, has_paa: true, organic_count: 10, has_ads: true },
};
```

### 14.3 Integration Test (`scripts/__tests__/expand-keywords.integration.test.ts`)

**使用真实 API + 临时 SQLite DB** — 只在 `SERPER_API_KEY` AND `EXA_API_KEY` 都存在时跑。

```typescript
const describeIfKeys = (process.env.SERPER_API_KEY && process.env.EXA_API_KEY)
  ? describe : describe.skip;
```

**Setup:** 每个 test 创建临时 in-memory SQLite DB，插入 test topic cluster。

| Test | Input | 验证 |
|---|---|---|
| Full expansion for "claude code" subtopic | topic=`"claude-code"`, subtopics=`["claude-code-pricing"]` | `total_new_keywords > 0`, DB 中有 keywords with `cluster_slug = 'claude-code-pricing'` |
| PAA returns real questions | topic=`"claude-code"`, subtopics=`["claude-code-pricing"]` | `keywords_by_source['serper-paa'].length > 0` |
| Related returns real queries | 同上 | `keywords_by_source['serper-related'].length > 0` |
| Exa finds competitors | 同上 | `keywords_by_source['exa-competitor'].length > 0` |
| Dedup works across sources | 同上 | `total_new < total_raw`（PAA 和 related 几乎一定有重叠） |
| Volume scoring writes to DB | 同上 | DB 中至少有 1 个 keyword 的 `search_volume IS NOT NULL` |
| skip-exa flag works | `skipExa: true` | `exa_api_calls = 0`, `keywords_by_source['exa-competitor']` 为空 |
| Dry run doesn't write | `dryRun: true` | DB keywords count = 0 after run |

### 14.4 Running Tests

```bash
# Unit tests (no API keys needed)
npm test -- scripts/lib/__tests__/keyword-expand.test.ts

# Integration tests (requires both API keys)
SERPER_API_KEY=xxx EXA_API_KEY=xxx npm test -- scripts/__tests__/expand-keywords.integration.test.ts
```

---

## 15. File Structure

```
scripts/
├── expand-keywords.ts                     # CLI entry point
├── lib/
│   ├── keyword-expand.ts                  # Core logic (testable)
│   ├── serper.ts                          # A2 — Serper API client
│   ├── exa.ts                             # A3 — Exa API client
│   ├── db.ts                              # DB layer
│   └── __tests__/
│       └── keyword-expand.test.ts         # Unit tests
└── __tests__/
    └── expand-keywords.integration.test.ts  # Integration tests
```

---

## 16. Open Questions

1. **Recursive expansion** — 发现的 keyword 中可能包含新的 subtopic candidates（如 PAA "What is Claude Code Agent Teams?" 暗示 "agent-teams" 是一个 subtopic）。是否在 B1 中做 recursive expansion？**建议不做**——subtopic discovery 是 C1 (discovery-cycle) 的职责，B1 只做 keyword-level expansion。保持 single responsibility。

2. **Language expansion** — 当前只扩展 English keywords (`gl=us, hl=en`)。是否同时扩展 Chinese keywords？**建议不做**——Strategy 明确 "English as primary authority layer"。ZH keywords 可在后续 phase 加入，用 `gl=cn, hl=zh-cn` 参数调用 Serper。

3. **Serper search caching** — `searchPAA` + `searchRelated` 合并后，同一个 query 只调用一次 `/search`。但跨 subtopic 可能有重复 query（如 "claude code pricing" 和 "claude code cost" 的 related searches 可能重叠）。是否在内存中 cache Serper responses？**建议做**——在 expansion run 内维护一个 `Map<string, SerperSearchResponse>` cache，避免重复 API 调用。

4. **Competitor keyword 质量** — Exa competitor headings 可能包含非 keyword 的内容（如 "Table of Contents"、"About the Author"）。是否需要更强的过滤？**建议在实现时根据实际输出调整 filter rules**——先跑一次看实际质量，再迭代。
