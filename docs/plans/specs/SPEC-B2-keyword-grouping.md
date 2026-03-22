# SPEC-B2 — Keyword Grouping Skill

> **Files:**
> - `scripts/group-keywords.ts` — CLI entry point
> - `scripts/lib/keyword-group.ts` — Core logic (testable)
> - `skills/keyword-grouping/SKILL.md` — Claude prompt for grouping
>
> **Depends on:** A1 (schema — `keywords`, `keyword_groups` tables), B1 (keyword expansion — populated `keywords` table)
> **Consumed by:** B3 (priority scoring), B4 (content generation), C1 (discovery cycle)

---

## 1. Purpose

将 B1 扩展出的 raw keywords 按 **shared search intent** 分组——如果搜索 keyword A 的用户会被搜索 keyword B 的同一篇内容满足，则 A 和 B 属于同一组，对应 **一个页面**。

这是 keyword engine 的核心 intelligence 层。B1 回答 "what do people search?"，B2 回答 "which searches can one page satisfy?" + "what kind of page should it be?"

**Strategy §4.4 定位：** Keyword Grouping 是 "Stage 3 — Keyword Expansion & Grouping" 的后半段。它实现为一个 **skill**（`skills/keyword-grouping/SKILL.md`），让 grouping prompt 可迭代、可测试、可跨 discovery cycle 复用。

**为什么用 Claude 而不是 rule-based？** Keyword grouping 的核心判断是语义的：`"claude code cost"` 和 `"how much does claude code cost"` 属于同一组（同一个 intent），但 `"claude code pricing"` 和 `"claude code pricing vs cursor"` 可能不是（一个是信息型，一个是对比型）。这种 intent-level 判断需要 LLM。

---

## 2. CLI Interface

```bash
# 基本用法：对一个 subtopic 的所有未分组 keywords 执行 grouping
npx tsx scripts/group-keywords.ts --cluster=claude-code-pricing

# 对一个 flagship topic 下的所有 subtopics 执行 grouping
npx tsx scripts/group-keywords.ts --topic=claude-code

# Dry run（不写 DB，输出 Claude 的 grouping 结果到 stdout）
npx tsx scripts/group-keywords.ts --cluster=claude-code-pricing --dry-run

# 指定模型（默认 haiku，大量 keywords 可用 sonnet）
npx tsx scripts/group-keywords.ts --cluster=claude-code-pricing --model=sonnet
```

### Arguments

| Arg | Required | Default | Description |
|---|---|---|---|
| `--cluster` | One of `--cluster`/`--topic` | — | 单个 cluster slug，只 grouping 这个 subtopic 的 keywords |
| `--topic` | One of `--cluster`/`--topic` | — | Flagship topic slug，grouping 其下所有 subtopics |
| `--dry-run` | No | false | 不写 DB，只输出 grouping 结果到 stdout |
| `--model` | No | `haiku` | Claude model（`haiku` / `sonnet`）。Keywords 少于 200 用 haiku，超过用 sonnet |
| `--force` | No | false | 重新 grouping 已有 `keyword_group_id` 的 keywords（默认只 grouping 未分组的） |

---

## 3. Input: Keywords from DB

### 3.1 读取未分组的 keywords

```sql
-- Single cluster
SELECT id, keyword, source, search_volume, competition, intent
FROM keywords
WHERE cluster_slug = ?
  AND keyword_group_id IS NULL
ORDER BY
  CASE WHEN search_volume IS NOT NULL THEN 0 ELSE 1 END,
  search_volume DESC

-- With --force: include already-grouped keywords
SELECT id, keyword, source, search_volume, competition, intent
FROM keywords
WHERE cluster_slug = ?
ORDER BY search_volume DESC NULLS LAST
```

### 3.2 Input Validation

| Condition | Handling |
|---|---|
| Cluster slug 不在 `topic_clusters` 表 | Exit with error |
| Cluster 下 0 个未分组 keywords | Skip with message, continue to next cluster |
| Cluster 下 < 3 个 keywords | Warn，仍然执行（可能只产出 1 个 group） |
| Cluster 下 > 500 个 keywords | 分批处理（见 §6.3） |

### 3.3 Keyword Input Type

```typescript
interface KeywordInput {
  id: number;
  keyword: string;
  source: string;
  search_volume: number | null;
  competition: string | null;  // 'low' | 'medium' | 'high' | 'very_high'
}
```

---

## 4. Grouping Pipeline

```
Step 1: Load ungrouped keywords from DB
Step 2: Format keywords into Claude prompt context
Step 3: Call Claude with keyword-grouping skill
Step 4: Parse + validate Claude JSON response
Step 5: Write keyword_groups to DB
Step 6: Update keywords.keyword_group_id
```

### 4.1 Pre-processing

在发送给 Claude 之前：
- 按 `search_volume DESC` 排序（volume 高的排前面，帮助 Claude 选择 primary keyword）
- 附带 volume 和 source 信息作为 signal（帮助 Claude 理解 keyword 重要性）
- 去掉 DB-specific 字段（id 等），只传 keyword + metadata

### 4.2 Claude Call

单次 Claude 调用，输入一个 subtopic 下的所有 keywords，输出分好组的 JSON。

```typescript
import Anthropic from '@anthropic-ai/sdk';
import fs from 'fs';

const skill = fs.readFileSync('skills/keyword-grouping/SKILL.md', 'utf-8');

const response = await anthropic.messages.create({
  model: modelId,  // 'claude-haiku-4-5-20251001' or 'claude-sonnet-4-5-20250514'
  max_tokens: 4096,
  system: skill,
  messages: [{
    role: 'user',
    content: buildPrompt(clusterSlug, pillarTopic, keywords),
  }],
});
```

### 4.3 Response Parsing

Claude 返回 JSON array of groups。解析后验证 schema：

```typescript
interface ClaudeGroupOutput {
  groups: KeywordGroup[];
  ungrouped: string[];  // keywords Claude couldn't confidently group
}

interface KeywordGroup {
  primary_keyword: string;
  secondary_keywords: string[];
  intent: 'informational' | 'commercial' | 'definitional' | 'navigational';
  content_type: 'faq' | 'compare' | 'glossary' | 'blog' | 'topic-hub';
  rationale: string;  // 1-sentence explanation of why these keywords share intent
}
```

**Validation rules:**
- Every keyword from input must appear in exactly one group OR in `ungrouped`
- `primary_keyword` must be one of the input keywords
- All `secondary_keywords` must be from the input keywords
- No keyword appears in multiple groups
- `intent` must be one of the 4 allowed values
- `content_type` must be one of the 5 allowed values
- Each group has at least 1 keyword (primary only is valid for unique intents)

---

## 5. SKILL.md Design

File: `skills/keyword-grouping/SKILL.md`

This skill defines the system prompt for Claude's keyword grouping task.

### 5.1 Skill Content

```markdown
You are a keyword grouping engine for an AI-focused content platform. Your job is to cluster raw keywords by shared search intent — if a user searching keyword A would be fully satisfied by the same page as keyword B, they belong in the same group.

## Input

You receive:
- A **subtopic name** (the parent category these keywords belong to)
- A list of **keywords** with optional metadata (search volume, source, competition)

## Output

Return ONLY valid JSON. No markdown fences, no explanation text outside the JSON.

```json
{
  "groups": [
    {
      "primary_keyword": "the keyword with highest search intent clarity",
      "secondary_keywords": ["other", "keywords", "in", "this", "group"],
      "intent": "informational|commercial|definitional|navigational",
      "content_type": "faq|compare|glossary|blog|topic-hub",
      "rationale": "One sentence: why these keywords share the same search intent"
    }
  ],
  "ungrouped": ["keywords", "that", "dont", "fit", "any", "group"]
}
```

## Grouping Rules

### Core Principle
Group by **search intent**, not by topic similarity. Two keywords about the same topic can have different intents:
- "claude code pricing" (informational) ≠ "claude code vs cursor pricing" (commercial/comparison)
- "what is RAG" (definitional) ≠ "RAG implementation guide" (informational/how-to)

### Primary Keyword Selection
Choose the primary keyword that:
1. Has the **clearest, most direct expression** of the group's intent
2. Has the **highest search volume** (if volume data is provided)
3. Is **concise but specific** — not too broad, not too long-tail

### Intent Classification

| Intent | Signals | Examples |
|---|---|---|
| **informational** | "how to", "guide", "tutorial", "best way to", "tips" | "how to use claude code", "claude code tips" |
| **commercial** | "vs", "alternative", "compare", "best", "top", "review" | "claude code vs cursor", "best ai coding tool" |
| **definitional** | "what is", "meaning", "definition", "explain", short head terms | "what is claude code", "MCP server" |
| **navigational** | brand + product, "official", "download", "login" | "claude code download", "anthropic claude code" |

### Content Type Assignment

| Intent | Typical Content Type | Override Condition |
|---|---|---|
| informational (question-form) | `faq` | If cluster of 5+ related questions → `blog` (comprehensive guide) |
| informational (how-to/guide) | `blog` | — |
| commercial (vs/compare) | `compare` | — |
| definitional (what-is/term) | `glossary` | If broad head term with many facets → `topic-hub` |
| navigational | `faq` | — |

### Group Size Guidelines
- **Typical group**: 2-8 keywords (a primary + closely related variants)
- **Max group size**: 15 keywords (beyond this, the intent is likely too broad — split the group)
- **Single-keyword groups are valid**: some unique intents only have one keyword expression
- **Ungrouped keywords**: Put keywords here if they are noise (not real search queries), off-topic, or too ambiguous to assign confidently. Keep this list small (<10% of input).

### What NOT to Group Together
- Different comparison pairs: "claude code vs cursor" and "claude code vs copilot" are SEPARATE groups (different pages)
- Different question intents: "is claude code free" and "how much does claude code cost" — same topic, but one is yes/no and the other is price breakdown. Use judgment: if one FAQ page genuinely answers both, group them; if not, separate.
- Head terms with specific long-tails: "claude code" (navigational/definitional) should NOT be grouped with "claude code tutorial for beginners" (informational)

## Quality Checklist
- Every input keyword appears in exactly one group OR in `ungrouped`
- No keyword appears in multiple groups
- Each group has a clear, distinct intent from every other group
- `primary_keyword` is the best page-title candidate in each group
- `content_type` matches the intent (don't assign `glossary` to a "how to" question)
- `rationale` explains the shared intent, not just "these are related"
```

---

## 6. Claude Call Architecture

### 6.1 User Prompt Construction

```typescript
function buildPrompt(
  clusterSlug: string,
  pillarTopic: string,
  keywords: KeywordInput[],
): string {
  const keywordLines = keywords.map(kw => {
    const parts = [kw.keyword];
    if (kw.search_volume) parts.push(`[vol: ${kw.search_volume}]`);
    if (kw.source) parts.push(`[src: ${kw.source}]`);
    if (kw.competition) parts.push(`[comp: ${kw.competition}]`);
    return `- ${parts.join(' ')}`;
  });

  return [
    `## Subtopic: ${pillarTopic}`,
    `Cluster: ${clusterSlug}`,
    `Total keywords: ${keywords.length}`,
    '',
    '## Keywords',
    '',
    ...keywordLines,
    '',
    'Group these keywords by shared search intent. Return JSON only.',
  ].join('\n');
}
```

### 6.2 Model Selection

| Keyword Count | Model | Rationale |
|---|---|---|
| ≤ 200 | `claude-haiku-4-5-20251001` | Fast + cheap, sufficient for small groups |
| > 200 | `claude-sonnet-4-5-20250514` | Better at managing complex multi-group outputs |

可通过 `--model` 强制指定。

### 6.3 Batching for Large Keyword Sets

如果一个 cluster 下 keywords > 500：

1. 按 `search_volume DESC` 排序
2. 分批，每批最多 300 keywords
3. 每批独立调用 Claude
4. 合并结果时检测跨批重叠（primary keyword 相同 → merge groups）

```typescript
const BATCH_SIZE = 300;

if (keywords.length > 500) {
  const batches = chunk(keywords, BATCH_SIZE);
  const batchResults = [];
  for (const batch of batches) {
    const result = await callClaude(batch, skill, opts);
    batchResults.push(result);
  }
  return mergeGroupResults(batchResults);
}
```

### 6.4 API Cost Estimate

| Model | Input (200 kw) | Output | Cost |
|---|---|---|---|
| Haiku | ~2K tokens | ~1.5K tokens | ~$0.003 |
| Sonnet | ~2K tokens | ~1.5K tokens | ~$0.02 |

Per-cluster cost is negligible. Even 50 clusters with Sonnet = ~$1.

---

## 7. DB Write

### 7.1 Write `keyword_groups`

```typescript
function insertKeywordGroup(group: KeywordGroup, clusterSlug: string): number {
  const db = getDb();
  const stmt = db.prepare(`
    INSERT INTO keyword_groups
      (primary_keyword, intent, content_type, priority_score, status, cluster_slug)
    VALUES (?, ?, ?, 0, 'pending', ?)
  `);
  const result = stmt.run(
    group.primary_keyword,
    group.intent,
    group.content_type,
    clusterSlug,
  );
  return Number(result.lastInsertRowid);
}
```

### 7.2 Update `keywords.keyword_group_id`

```typescript
function assignKeywordsToGroup(
  groupId: number,
  primaryKeyword: string,
  secondaryKeywords: string[],
): void {
  const db = getDb();
  const allKeywords = [primaryKeyword, ...secondaryKeywords];
  const stmt = db.prepare(`
    UPDATE keywords SET keyword_group_id = ?, intent = ?
    WHERE keyword = ?
  `);
  const tx = db.transaction(() => {
    for (const kw of allKeywords) {
      // intent is stored per-keyword as well (from the group's intent)
      stmt.run(groupId, null, kw);
    }
  });
  tx();
}
```

**Note:** `keywords.intent` 也同步更新为 group 的 intent value，用 group-level intent 覆盖：

```typescript
function assignKeywordsToGroup(
  groupId: number,
  intent: string,
  primaryKeyword: string,
  secondaryKeywords: string[],
): void {
  const db = getDb();
  const allKeywords = [primaryKeyword, ...secondaryKeywords];
  const stmt = db.prepare(`
    UPDATE keywords SET keyword_group_id = ?, intent = ?
    WHERE keyword = ?
  `);
  const tx = db.transaction(() => {
    for (const kw of allKeywords) {
      stmt.run(groupId, intent, kw);
    }
  });
  tx();
}
```

### 7.3 Write Flow（Transaction）

整个 cluster 的 grouping result 在一个 transaction 中写入：

```typescript
const writeGrouping = db.transaction(() => {
  for (const group of result.groups) {
    const groupId = insertKeywordGroup(group, clusterSlug);
    assignKeywordsToGroup(groupId, group.intent, group.primary_keyword, group.secondary_keywords);
  }
});
writeGrouping();
```

### 7.4 Re-grouping with `--force`

当使用 `--force` 时：
1. 删除该 cluster 下所有 existing keyword_groups
2. 将对应 keywords 的 `keyword_group_id` 重置为 NULL
3. 重新执行 grouping pipeline

```typescript
if (opts.force) {
  db.prepare(`
    UPDATE keywords SET keyword_group_id = NULL, intent = NULL
    WHERE cluster_slug = ?
  `).run(clusterSlug);

  db.prepare(`
    DELETE FROM keyword_groups WHERE cluster_slug = ?
  `).run(clusterSlug);
}
```

---

## 8. Output Types

```typescript
/** Per-cluster grouping result */
export interface ClusterGroupingResult {
  cluster_slug: string;
  pillar_topic: string;
  total_keywords: number;
  groups_created: number;
  ungrouped_count: number;
  groups: GroupSummary[];
}

export interface GroupSummary {
  group_id: number;           // DB-assigned ID
  primary_keyword: string;
  keyword_count: number;      // primary + secondary
  intent: string;
  content_type: string;
}

/** Full run result */
export interface GroupingRunResult {
  clusters_processed: number;
  total_keywords_grouped: number;
  total_groups_created: number;
  total_ungrouped: number;
  cluster_results: ClusterGroupingResult[];
  claude_api_calls: number;
}
```

---

## 9. Script Structure

```
scripts/
├── group-keywords.ts                     # CLI entry point
├── lib/
│   ├── keyword-group.ts                  # Core logic (testable)
│   ├── db.ts                             # DB layer (existing)
│   └── __tests__/
│       └── keyword-group.test.ts         # Unit tests
└── __tests__/
    └── group-keywords.integration.test.ts  # Integration tests

skills/
└── keyword-grouping/
    └── SKILL.md                          # Claude prompt for grouping
```

### `scripts/lib/keyword-group.ts` — Core Logic

```typescript
export interface GroupOptions {
  model: 'haiku' | 'sonnet';
  dryRun: boolean;
  force: boolean;
}

/**
 * Load ungrouped keywords for a cluster from DB.
 */
export function loadUngroupedKeywords(
  clusterSlug: string,
  force: boolean,
): KeywordInput[];

/**
 * Build the user prompt for Claude.
 */
export function buildPrompt(
  clusterSlug: string,
  pillarTopic: string,
  keywords: KeywordInput[],
): string;

/**
 * Parse and validate Claude's JSON response.
 * Throws on invalid schema or missing keywords.
 */
export function parseGroupingResponse(
  raw: string,
  inputKeywords: string[],
): ClaudeGroupOutput;

/**
 * Group keywords for a single cluster.
 */
export async function groupCluster(
  clusterSlug: string,
  opts: GroupOptions,
): Promise<ClusterGroupingResult>;

/**
 * Group keywords for all clusters under a topic.
 */
export async function groupTopic(
  topicSlug: string,
  opts: GroupOptions,
): Promise<GroupingRunResult>;

/**
 * Write grouping results to DB (keyword_groups + keywords).
 */
export function writeGroupingToDb(
  clusterSlug: string,
  result: ClaudeGroupOutput,
): { groups_created: number; keywords_assigned: number };
```

### `scripts/group-keywords.ts` — CLI Entry Point

```typescript
// Pattern: expand-keywords.ts style
async function main() {
  console.log(`📊 Keyword Grouping`);

  // Stage 1: Load keywords from DB
  // Stage 2: Call Claude with keyword-grouping skill
  // Stage 3: Validate response
  // Stage 4: Write to DB (unless dry-run)
  // Stage 5: Summary

  closeDb();
}
```

---

## 10. Error Handling

| Scenario | Handling |
|---|---|
| `ANTHROPIC_API_KEY` missing | Exit with error — Claude call is not optional |
| Cluster slug not in DB | Exit with error message |
| No ungrouped keywords | Skip with "✓ all keywords already grouped" message |
| Claude returns invalid JSON | Retry once with appended "Return valid JSON only" hint. If still fails, log raw response and skip cluster |
| Claude response missing keywords | Log warning with list of missing keywords, proceed with partial result |
| Claude response has duplicate assignments | Deduplicate: first occurrence wins |
| DB write failure | Rollback transaction, log error, continue to next cluster |
| Claude rate limit (429) | Wait 30s, retry once. If still fails, skip cluster |
| Keyword count > 500 | Auto-batch (§6.3) |

**Design principle:** 与 B1 一致——单个 cluster 的失败不阻塞整个 run。Log + skip + continue。

---

## 11. Console Output

```
📊 Keyword Grouping — claude-code
==================================================

📥 Stage 1: Load Keywords
  Cluster "claude-code-pricing": 45 ungrouped keywords
  Cluster "claude-code-vs-cursor": 38 ungrouped keywords
  Total: 83 keywords across 2 clusters

🤖 Stage 2: Claude Grouping
  [1/2] "Claude Code Pricing" (claude-code-pricing)
    Keywords: 45 → Claude (haiku)...
    Result: 6 groups, 3 ungrouped
      GROUP 1: "how much does claude code cost" (faq, informational) — 8 keywords
      GROUP 2: "is claude code free" (faq, informational) — 5 keywords
      GROUP 3: "claude code pricing plans" (blog, informational) — 7 keywords
      GROUP 4: "claude code enterprise pricing" (faq, commercial) — 4 keywords
      GROUP 5: "claude code api pricing" (faq, informational) — 6 keywords
      GROUP 6: "claude code pricing 2026" (faq, informational) — 3 keywords
      Ungrouped: 3 keywords

  [2/2] "Claude Code vs Cursor" (claude-code-vs-cursor)
    Keywords: 38 → Claude (haiku)...
    Result: 4 groups, 2 ungrouped

💾 Stage 3: Write to DB
  10 keyword groups created
  78 keywords assigned to groups
  5 keywords ungrouped

✅ Keyword grouping complete — 10 groups across 2 clusters
```

Dry run 时 Stage 3 替换为：
```
🧪 DRY RUN — skipping DB write
  Would create 10 keyword groups
  Would assign 78 keywords
```

---

## 12. Test Plan

### 12.1 Unit Tests (`scripts/lib/__tests__/keyword-group.test.ts`)

Mock Claude API — 不消耗 API credits，不碰 DB。

#### buildPrompt tests

| Test | 验证 |
|---|---|
| `buildPrompt` — includes all keywords | 每个 keyword 都出现在 prompt 中 |
| `buildPrompt` — includes volume metadata | `[vol: 10000]` appears for keywords with volume |
| `buildPrompt` — includes source metadata | `[src: serper-paa]` appears |
| `buildPrompt` — handles empty volume gracefully | Keywords without volume don't have `[vol: ...]` |

#### parseGroupingResponse tests

| Test | 验证 |
|---|---|
| Valid complete response | All input keywords accounted for in groups + ungrouped |
| Valid response — single-keyword group | Group with only primary_keyword, empty secondary_keywords |
| Missing keywords → warning | Input has 10 keywords, response only covers 8 → returns result + logs warning |
| Duplicate assignment → first wins | Keyword in group A and group B → assigned to group A only |
| Invalid JSON → throws | Non-JSON string → throws ParseError |
| Invalid schema — missing `groups` key | → throws ValidationError |
| Invalid intent value | `intent: "transactional"` → throws ValidationError |
| Invalid content_type value | `content_type: "landing"` → throws ValidationError |
| Empty groups array | Valid — returns `{ groups: [], ungrouped: allKeywords }` |
| Keyword not from input | `primary_keyword` not in input list → throws ValidationError |

#### groupCluster tests (mock Claude)

| Test | 验证 |
|---|---|
| Happy path — 3 groups | Claude returns 3 groups → DB gets 3 keyword_group rows + keywords updated |
| Dry run — no DB writes | `dryRun=true` → no DB calls, returns result |
| Force mode — clears existing groups | Existing groups deleted before re-grouping |
| Empty cluster — skips | 0 ungrouped keywords → returns early with 0 groups |
| Claude error — skip cluster | API throws → returns error result, doesn't crash |

### 12.2 Mock Data

```typescript
// Mock keywords (as they'd come from DB after B1 expansion)
const MOCK_KEYWORDS: KeywordInput[] = [
  { id: 1, keyword: 'claude code pricing', source: 'serper-related', search_volume: 10000, competition: 'medium' },
  { id: 2, keyword: 'how much does claude code cost', source: 'serper-paa', search_volume: 1000, competition: 'low' },
  { id: 3, keyword: 'claude code cost', source: 'serper-related', search_volume: 1000, competition: 'low' },
  { id: 4, keyword: 'claude code pricing 2026', source: 'serper-autocomplete', search_volume: 100, competition: 'low' },
  { id: 5, keyword: 'claude code pricing per month', source: 'serper-autocomplete', search_volume: 100, competition: 'low' },
  { id: 6, keyword: 'is claude code free', source: 'serper-paa', search_volume: 10000, competition: 'medium' },
  { id: 7, keyword: 'claude code free tier', source: 'serper-related', search_volume: 1000, competition: 'low' },
  { id: 8, keyword: 'claude code free trial', source: 'serper-autocomplete', search_volume: 100, competition: 'low' },
  { id: 9, keyword: 'claude code vs cursor pricing', source: 'exa-competitor', search_volume: null, competition: null },
  { id: 10, keyword: 'claude code enterprise pricing', source: 'exa-competitor', search_volume: null, competition: null },
];

// Mock Claude response (matching STRATEGY §4.4 example)
const MOCK_CLAUDE_RESPONSE: ClaudeGroupOutput = {
  groups: [
    {
      primary_keyword: 'how much does claude code cost',
      secondary_keywords: [
        'claude code pricing',
        'claude code cost',
        'claude code pricing 2026',
        'claude code pricing per month',
      ],
      intent: 'informational',
      content_type: 'faq',
      rationale: 'All express the same intent: understanding the cost/pricing of Claude Code',
    },
    {
      primary_keyword: 'is claude code free',
      secondary_keywords: [
        'claude code free tier',
        'claude code free trial',
      ],
      intent: 'informational',
      content_type: 'faq',
      rationale: 'All ask whether a free option exists for Claude Code',
    },
    {
      primary_keyword: 'claude code vs cursor pricing',
      secondary_keywords: [],
      intent: 'commercial',
      content_type: 'compare',
      rationale: 'Comparison intent between two specific products on pricing',
    },
  ],
  ungrouped: ['claude code enterprise pricing'],
};
```

### 12.3 Integration Test (`scripts/__tests__/group-keywords.integration.test.ts`)

**使用真实 Claude API + 临时 SQLite DB** — 只在 `ANTHROPIC_API_KEY` 存在时跑。

```typescript
const describeIfKey = process.env.ANTHROPIC_API_KEY
  ? describe : describe.skip;
```

**Setup:** 每个 test 创建临时 in-memory SQLite DB，插入 test cluster + keywords（用 B1 的 mock data 或真实 B1 输出）。

| Test | Input | 验证 |
|---|---|---|
| Groups pricing keywords | 10 pricing-related keywords | `groups.length >= 2`（至少 cost group 和 free group 分开） |
| Assigns intent correctly | Keywords with "vs" | 至少一个 group 有 `intent: 'commercial'` |
| Assigns content_type correctly | Keywords with "what is" | 有 group 的 `content_type` 是 `'glossary'` 或 `'faq'` |
| All keywords accounted for | 10 input keywords | `sum(group.keywords) + ungrouped.length >= 10` |
| Primary keyword is from input | — | Every `primary_keyword` exists in input list |
| Writes to DB correctly | — | `keyword_groups` table has rows, `keywords.keyword_group_id` is set |
| No duplicate assignments | — | Each keyword has exactly one `keyword_group_id` |
| Dry run doesn't write | `dryRun: true` | DB tables unchanged |

### 12.4 Running Tests

```bash
# Unit tests (no API keys needed)
npm test -- scripts/lib/__tests__/keyword-group.test.ts

# Integration tests (requires Anthropic API key)
ANTHROPIC_API_KEY=xxx npm test -- scripts/__tests__/group-keywords.integration.test.ts
```

---

## 13. File Structure

```
scripts/
├── group-keywords.ts                      # CLI entry point
├── lib/
│   ├── keyword-group.ts                   # Core logic (testable)
│   ├── db.ts                              # DB layer (existing)
│   └── __tests__/
│       └── keyword-group.test.ts          # Unit tests
└── __tests__/
    └── group-keywords.integration.test.ts # Integration tests

skills/
└── keyword-grouping/
    └── SKILL.md                           # Claude prompt for grouping
```

---

## 14. Open Questions

1. **Ungrouped keywords — what happens to them?** 建议：保留 `keyword_group_id = NULL`，在下次 discovery cycle 时有新 context 后重新尝试 grouping。不主动删除。

2. **Cross-cluster grouping** — "claude code pricing" 在 cluster `claude-code-pricing`，但 "claude code vs cursor pricing" 可能也在 cluster `claude-code-vs-cursor` 下。是否需要跨 cluster 的 group 去重？**建议 B2 不做**——跨 cluster 去重是 B3 (priority scoring) 的职责，通过 primary_keyword similarity detection 实现。B2 只在 single cluster scope 内工作。

3. **Re-grouping cadence** — 新 keywords 不断通过 B1 加入。是否每次 discovery cycle 都重新 grouping 所有 keywords？**建议只 group 新增的**（`keyword_group_id IS NULL`），除非用 `--force`。已有 groups 在 performance cycle (C3) 中通过 refresh 机制更新。

4. **Content type override** — Claude 建议的 `content_type` 可能被 B3 的 SERP depth analysis 覆盖（如 Claude 建议 faq 但 SERP 显示 top results 都是 2000+ word articles → 应为 blog）。B2 的 content_type 是 **initial suggestion**，B3 可以 override。

5. **keyword_groups.updated_at** — 当 `--force` re-grouping 时，应该 update existing groups 还是 delete + recreate？**建议 delete + recreate**（simpler，group_id 变更不影响下游，因为 B3/B4 都是通过 status='pending' 查询）。
