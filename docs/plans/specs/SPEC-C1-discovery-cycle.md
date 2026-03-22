# SPEC-C1 — Discovery Cycle Script

> **Files:**
> - `scripts/discovery-cycle.ts` — CLI entry point
> - `scripts/lib/discovery.ts` — Core orchestration logic
>
> **Depends on:** B1 (`scripts/lib/keyword-expand.ts`), B2 (`scripts/lib/keyword-group.ts`), B3 (`scripts/lib/score-queue.ts`, `scripts/lib/priority.ts`), A2 (`scripts/lib/serper.ts`), A3 (`scripts/lib/exa.ts`), `scripts/lib/db.ts`
> **Consumed by:** C4 (daily pipeline reorg — Saturday cron)

---

## 1. Purpose

将 B1（keyword expansion）→ B2（keyword grouping）→ B3（priority scoring + queue routing）编排为一个完整的 **discovery cycle**。这是 keyword engine 的 **周期性发现引擎**——每周六自动运行，持续扩展 keyword universe。

**Strategy §4.3 定位：** Discovery Cycle 是 "Stage 2 — Subtopic Discovery" + "Stage 3 — Keyword Expansion & Grouping" + "Stage 4 — Priority Scoring" 的端到端编排。

**Strategy §4.10 定位：** 周六运行，与 Tuesday 的 Performance Cycle 形成互补——Discovery 扩展知识边界，Performance 优化已有页面。

**两种触发模式：**
- **Scheduled（周六 cron）：** 全量扫描所有 flagship topics 的所有 subtopics
- **Event-triggered（新闻事件）：** 当 news pipeline 发现与某 flagship topic 相关的新事件时，只对该 topic 做增量 discovery

**增量发现是核心设计原则：** 已存在于 `keywords` 表的 keyword 不会被重新扩展或 re-grouped。B1 的 `upsertKeyword` 自带去重，B2 的 `loadUngroupedKeywords` 只加载未分组的 keyword，B3 默认只 score `priority_score = 0` 的 group。Discovery Cycle 只需正确编排调用顺序，增量逻辑由各模块自身保证。

---

## 2. CLI Interface

```bash
# 周六全量 discovery（所有 flagship topics）
npx tsx scripts/discovery-cycle.ts

# 指定 topic（event-triggered 模式 or 调试）
npx tsx scripts/discovery-cycle.ts --topic=claude-code

# 只跑 subtopic discovery + keyword expansion（不 group/score）
npx tsx scripts/discovery-cycle.ts --topic=claude-code --expand-only

# Dry run（不写 DB，输出各阶段结果）
npx tsx scripts/discovery-cycle.ts --topic=claude-code --dry-run

# Event-triggered：指定触发事件关键词（news pipeline 调用时使用）
npx tsx scripts/discovery-cycle.ts --topic=claude-code --event="Anthropic launches new pricing"

# 控制 API 调用速率
npx tsx scripts/discovery-cycle.ts --delay=500 --max-serp=30

# 跳过 Exa（省 API credits）
npx tsx scripts/discovery-cycle.ts --topic=claude-code --skip-exa
```

### Arguments

| Arg | Required | Default | Description |
|---|---|---|---|
| `--topic` | No | 全部 flagship topics | Flagship topic slug，只 discover 这一个 topic |
| `--event` | No | — | Event description（用于 subtopic discovery 和 timeliness bonus） |
| `--expand-only` | No | false | 只跑 B1（expansion），不跑 B2/B3 |
| `--dry-run` | No | false | 不写 DB，各阶段结果输出到 stdout |
| `--delay` | No | 300 | API 调用之间的延迟 ms（传递给 B1） |
| `--max-serp` | No | 50 | SERP depth API 调用上限（传递给 B3） |
| `--skip-exa` | No | false | 跳过 Exa competitor scan（传递给 B1） |
| `--skip-serp` | No | false | 跳过 SERP depth detection（传递给 B3） |
| `--model` | No | "haiku" | Claude model for grouping（传递给 B2），> 200 keywords auto-upgrades |

---

## 3. Flagship Topics

Flagship topics 从 config 定义读取，不存放在 DB。每个 flagship topic 有一个 slug 和一组已知 subtopics。

```typescript
interface FlagshipTopic {
  slug: string;               // e.g. "claude-code"
  name: string;               // e.g. "Claude Code"
  cornerstoneUrl: string;     // e.g. "https://loreai.dev/claude-code"
  excludeDomains: string[];   // 自身域名 + 不需要的竞争对手
}

// 初始配置，后续可迁移到 DB 或 JSON 文件
const FLAGSHIP_TOPICS: FlagshipTopic[] = [
  {
    slug: 'claude-code',
    name: 'Claude Code',
    cornerstoneUrl: 'https://loreai.dev/claude-code',
    excludeDomains: ['loreai.dev'],
  },
  {
    slug: 'codex',
    name: 'OpenAI Codex',
    cornerstoneUrl: 'https://loreai.dev/codex',
    excludeDomains: ['loreai.dev'],
  },
];
```

**Subtopics** 从 `topic_clusters` 表读取（与 B1 一致）：

```sql
SELECT slug, pillar_topic FROM topic_clusters
WHERE slug LIKE '{topicSlug}-%' OR slug = '{topicSlug}'
ORDER BY mention_count DESC
```

---

## 4. Discovery Pipeline（四阶段）

### 4.0 Stage 0 — Subtopic Discovery（仅 event-triggered 模式）

当 `--event` 提供时，先检查事件是否暗示新 subtopic。

**逻辑：**
1. 用事件描述 query Serper related searches
2. 提取潜在新 subtopic keywords（B1 的 `normalizeKeyword` 过滤）
3. 与已有 `topic_clusters` 对比
4. 如果发现新 subtopic，调用 `upsertTopicCluster(slug, pillarTopic)` 写入 DB
5. 将新 subtopic 加入本次 expansion 列表

```typescript
interface SubtopicDiscoveryResult {
  event: string;
  new_subtopics: Array<{ slug: string; pillar_topic: string }>;
  existing_match_count: number;  // 事件关键词匹配到的已有 subtopic 数
}
```

**新 subtopic slug 生成规则：** `{topicSlug}-{slugified_subtopic_name}`，例如 `claude-code-agent-teams`。

**安全约束：** 每次 event-triggered run 最多发现 3 个新 subtopics（`MAX_NEW_SUBTOPICS_PER_EVENT = 3`），防止一次事件产生太多低质量 subtopic。

### 4.1 Stage 1 — Keyword Expansion（B1）

调用 B1 的 `expandTopic()` 对目标 topic 进行 keyword expansion。

```typescript
import { expandTopic, type ExpandOptions } from './lib/keyword-expand';

const expansionResult = await expandTopic(topic.slug, subtopicSlugs, {
  delayMs: opts.delay,
  skipExa: opts.skipExa,
  maxVolumeCallsPerSubtopic: 10,
  dryRun: opts.dryRun,
});
```

**增量保证：** `expandTopic` 内部使用 `upsertKeyword()`，已存在的 keyword 不会被重复写入。新 keyword 会被 volume estimation 评分。

如果 `--expand-only`，到这里结束。

### 4.2 Stage 2 — Keyword Grouping（B2）

调用 B2 的 `groupTopic()` 对未分组的 keywords 进行 Claude-powered grouping。

```typescript
import { groupTopic, type GroupOptions } from './lib/keyword-group';

const groupingResult = await groupTopic(topic.slug, {
  model: opts.model,
  dryRun: opts.dryRun,
  force: false,  // 永远不 force re-group——增量 only
});
```

**增量保证：** `loadUngroupedKeywords()` 只加载 `keyword_group_id IS NULL` 的 keywords。已分组的不会被重新处理。

**跳过条件：** 如果 Stage 1 的 `total_new_keywords === 0`（没发现新 keyword），跳过 grouping，直接进 Stage 3（因为可能有之前 expanded 但未 scored 的 groups）。

### 4.3 Stage 3 — Priority Scoring + Queue Routing（B3）

调用 B3 的 `scoreAndQueue()` 对未 scored 的 keyword groups 进行 priority scoring 和 queue routing。

```typescript
import { scoreAndQueue, type ScoreQueueOptions } from './lib/score-queue';

const scoringResult = await scoreAndQueue(topic.slug, null, {
  dryRun: opts.dryRun,
  skipSerp: opts.skipSerp,
  force: false,  // 不 re-score 已有 score 的 groups
  maxSerp: opts.maxSerp,
});
```

**增量保证：** `loadPendingGroups()` 只加载 `priority_score = 0` 且 `status IN ('pending', 'queued')` 的 groups。

**Event timeliness bonus：** B3 的 `findEventAgeHours()` 会自动从 `news_items` 表中检测近期事件——Discovery Cycle 不需要手动传递 event age。只要 news pipeline 先于 discovery cycle 运行（见 §7 Scheduling），timeliness bonus 自动生效。

### 4.4 Stage 4 — Summary Report

输出本次 discovery cycle 的汇总报告。

```typescript
interface DiscoveryCycleResult {
  topic: string;
  mode: 'scheduled' | 'event-triggered';
  event?: string;
  timestamp: string;               // ISO 8601

  // Stage 0 (event-triggered only)
  subtopic_discovery?: SubtopicDiscoveryResult;

  // Stage 1
  expansion: {
    subtopics_processed: number;
    total_keywords_discovered: number;
    total_new_keywords: number;
    serper_api_calls: number;
    exa_api_calls: number;
  };

  // Stage 2
  grouping: {
    clusters_processed: number;
    total_keywords_grouped: number;
    total_groups_created: number;
    claude_api_calls: number;
  } | null;  // null if --expand-only or skipped

  // Stage 3
  scoring: {
    groups_scored: number;
    groups_queued: number;
    groups_deferred: number;
    serp_api_calls: number;
    top_5_queue: Array<{
      primary_keyword: string;
      priority_score: number;
      content_type: string;
      research_pipeline: string;
    }>;
  } | null;  // null if --expand-only

  // Totals
  total_api_calls: number;
  duration_ms: number;
}
```

**输出格式：** JSON 写入 `stdout`（可被 cron redirect 到 log file）。同时 `console.error` 输出人类可读的 summary table。

---

## 5. Multi-Topic Scheduled Mode

当不指定 `--topic` 时（周六 cron 模式），对所有 `FLAGSHIP_TOPICS` 顺序执行 discovery cycle。

```typescript
async function runScheduledDiscovery(opts: DiscoveryOptions): Promise<DiscoveryCycleResult[]> {
  const results: DiscoveryCycleResult[] = [];

  for (const topic of FLAGSHIP_TOPICS) {
    console.error(`\n═══ Discovery: ${topic.name} ═══\n`);
    const result = await runDiscoveryForTopic(topic, {
      ...opts,
      mode: 'scheduled',
    });
    results.push(result);
  }

  return results;
}
```

**顺序执行，不并行：** 避免 API rate limit 问题，且各 topic 之间无依赖。

---

## 6. Event-Triggered Mode

news pipeline（`collect-news.ts`）在检测到与 flagship topic 相关的重大事件时，可调用 discovery cycle 进行增量发现。

### 6.1 触发方式

由 news pipeline 或手动通过 CLI 触发：

```bash
# collect-news.ts 检测到重大事件后调用
npx tsx scripts/discovery-cycle.ts \
  --topic=claude-code \
  --event="Anthropic launches Claude Code Agent Teams feature"
```

### 6.2 与 Scheduled Mode 的差异

| 维度 | Scheduled (Saturday) | Event-triggered |
|---|---|---|
| 范围 | 所有 flagship topics | 单个 topic |
| Subtopic discovery | 不做（subtopics 由 weekly review 管理） | 做（Stage 0，从事件中发现新 subtopic） |
| Keyword expansion | 全量 subtopics | 只扩展与事件相关的 subtopics |
| 紧迫性 | 常规 | timeliness bonus 通过 B3 自动加权 |

### 6.3 Event-Triggered Subtopic Filtering

Event-triggered 模式下，只扩展与事件相关的 subtopics，而非全部：

```typescript
function filterSubtopicsByEvent(
  allSubtopics: SubtopicInput[],
  event: string,
): SubtopicInput[] {
  const eventTokens = new Set(
    event.toLowerCase().split(/\s+/).filter(w => w.length > 3)
  );

  // 匹配：subtopic 的 pillar_topic 或 slug 与 event 有词汇重叠
  const matched = allSubtopics.filter(s => {
    const subtopicTokens = `${s.slug} ${s.pillar_topic}`.toLowerCase().split(/[\s-]+/);
    return subtopicTokens.some(t => eventTokens.has(t));
  });

  // 如果没匹配到任何 subtopic，fallback 到 flagship topic 本身
  return matched.length > 0 ? matched : allSubtopics.slice(0, 1);
}
```

---

## 7. Scheduling & Cron

### 7.1 Saturday Cron

```bash
# crontab entry (VPS)
# 周六 06:00 UTC — runs after news pipeline (04:00) has populated latest events
0 6 * * 6 cd /home/ubuntu/loreai-v2 && npx tsx scripts/discovery-cycle.ts >> logs/discovery-cycle.log 2>&1
```

**时间选择依据：**
- 06:00 UTC（周六）——在 news pipeline（04:00 daily）之后运行
- B3 的 `findEventAgeHours()` 会检测 `news_items` 中的近期事件，所以 news pipeline 先跑可以让 timeliness bonus 正确生效
- 选周六是因为 Wednesday–Friday 是 create 时段，周六 discovery 产出的 queue 正好给下周一开始处理

### 7.2 Event-Triggered（由 news pipeline 调用）

`collect-news.ts` 可以在检测到重大事件后 spawn discovery cycle。实现方式留给 C4（daily pipeline reorg）决定，可以是：
- `child_process.execSync` 直接调用
- 写一个 event 标记文件，由独立 cron 轮询
- 或简单地记录到 log，由人工判断后手动触发

**推荐 C1 阶段的做法：** 不在 `collect-news.ts` 中自动触发，而是提供 CLI 入口供手动或 webhook 调用。自动触发机制留给 C4 实现。

---

## 8. Error Handling & Resilience

### 8.1 Stage-Level Try/Catch

每个 stage 独立 try/catch。单个 stage 失败不阻止后续 stage（但会记录错误）。

```typescript
// Stage 1 failure → skip Stage 2 & 3 (no new data to process)
// Stage 2 failure → still run Stage 3 (may have previously ungrouped keywords)
// Stage 3 failure → report error, queue not updated
```

### 8.2 API Rate Limit

- B1 有内置 delay（`--delay` 参数）
- B3 有 `--max-serp` 上限
- 如果 Serper/Exa API 返回 429，B1/B3 的 `_post` helper 会 throw → stage-level catch 处理

### 8.3 Partial Progress

所有 DB 写入都是增量的：
- B1 逐个 keyword 写入（`upsertKeyword`，每个 keyword 独立）
- B2 逐个 cluster 写入（每个 cluster 的 grouping 是一个 transaction）
- B3 所有 queue entry 在最后一次性 transaction 写入

如果中途 crash，重跑即可——已写入的 keyword/group 不会重复处理。

---

## 9. Core Function Signatures

### `scripts/lib/discovery.ts`

```typescript
export interface DiscoveryOptions {
  topic?: string;           // 如果未指定，跑所有 FLAGSHIP_TOPICS
  event?: string;           // Event description (event-triggered mode)
  expandOnly: boolean;
  dryRun: boolean;
  delay: number;
  maxSerp: number;
  skipExa: boolean;
  skipSerp: boolean;
  model: 'haiku' | 'sonnet';
}

export async function runDiscoveryCycle(
  opts: DiscoveryOptions,
): Promise<DiscoveryCycleResult[]>;

export async function runDiscoveryForTopic(
  topic: FlagshipTopic,
  opts: DiscoveryOptions & { mode: 'scheduled' | 'event-triggered' },
): Promise<DiscoveryCycleResult>;

export function discoverNewSubtopics(
  topicSlug: string,
  event: string,
  existingSlugs: Set<string>,
): Promise<SubtopicDiscoveryResult>;

export function filterSubtopicsByEvent(
  allSubtopics: SubtopicInput[],
  event: string,
): SubtopicInput[];
```

### `scripts/discovery-cycle.ts`

Thin CLI wrapper: parse args → call `runDiscoveryCycle()` → print results → `closeDb()` → exit.

---

## 10. Tests

### 10.1 Unit Tests (`tests/discovery.test.ts`)

**10.1.1 filterSubtopicsByEvent**
- 输入：`allSubtopics = [{slug: 'claude-code-pricing', ...}, {slug: 'claude-code-hooks', ...}]`，`event = "Anthropic announces new pricing tiers"`
- 期望：返回 `[{slug: 'claude-code-pricing', ...}]`（匹配 "pricing"）
- Edge case: event 不匹配任何 subtopic → fallback 到第一个 subtopic

**10.1.2 discoverNewSubtopics**
- Mock Serper `searchRelated` 返回 related searches
- 验证：只返回不在 `existingSlugs` 中的新 subtopic
- 验证：最多返回 `MAX_NEW_SUBTOPICS_PER_EVENT` 个
- 验证：slug 格式正确（`topicSlug-subtopicName`）

**10.1.3 runDiscoveryForTopic（mock 全流程）**
- Mock B1 `expandTopic` → 返回 `{ total_new_keywords: 15, ... }`
- Mock B2 `groupTopic` → 返回 `{ total_groups_created: 3, ... }`
- Mock B3 `scoreAndQueue` → 返回 `{ groups_queued: 3, ... }`
- 验证：三个 stage 按顺序调用
- 验证：返回的 `DiscoveryCycleResult` 结构正确
- 验证：`total_api_calls` 是各 stage 的 api_calls 之和

**10.1.4 增量行为验证**
- Mock B1 返回 `total_new_keywords: 0`
- 验证：B2 被跳过（grouping 为 null）
- 验证：B3 仍然被调用（处理之前遗留的 pending groups）

**10.1.5 expand-only 模式**
- `expandOnly: true`
- 验证：只调用 B1，不调用 B2/B3

**10.1.6 multi-topic scheduled mode**
- 两个 flagship topics
- 验证：`runDiscoveryCycle` 返回两个 result
- 验证：顺序执行（第二个 topic 在第一个完成后才开始）

**10.1.7 stage failure isolation**
- B1 throw → result 记录 error，B2/B3 被跳过
- B2 throw → result 记录 error，B3 仍然执行

### 10.2 Integration Test (`tests/discovery.integration.test.ts`)

**前提：** 需要 `SERPER_API_KEY` 和 `EXA_API_KEY` 环境变量。

```typescript
// 跑 "claude-code" topic 的真实 discovery cycle（使用 test DB）
// 验证端到端：keywords 表有新数据 → keyword_groups 有新 groups → create_queue 有新 jobs
test('full discovery cycle on claude-code topic', async () => {
  // Setup: 确保 topic_clusters 表有 claude-code 相关 subtopics
  const db = getDb();
  upsertTopicCluster('claude-code', 'Claude Code');
  upsertTopicCluster('claude-code-pricing', 'Claude Code Pricing');
  upsertTopicCluster('claude-code-hooks', 'Claude Code Hooks');

  const results = await runDiscoveryCycle({
    topic: 'claude-code',
    expandOnly: false,
    dryRun: false,
    delay: 500,      // 防 rate limit
    maxSerp: 5,       // 控制 API cost
    skipExa: false,
    skipSerp: false,
    model: 'haiku',
  });

  expect(results).toHaveLength(1);
  const result = results[0];

  // Stage 1: keywords discovered
  expect(result.expansion.total_new_keywords).toBeGreaterThan(0);

  // Stage 2: groups created
  expect(result.grouping).not.toBeNull();
  expect(result.grouping!.total_groups_created).toBeGreaterThan(0);

  // Stage 3: queue populated
  expect(result.scoring).not.toBeNull();
  expect(result.scoring!.groups_queued).toBeGreaterThan(0);

  // DB verification
  const keywords = db.prepare(
    "SELECT COUNT(*) as count FROM keywords WHERE cluster_slug LIKE 'claude-code%'"
  ).get() as { count: number };
  expect(keywords.count).toBeGreaterThan(0);

  const queue = db.prepare(
    "SELECT COUNT(*) as count FROM create_queue WHERE status = 'pending'"
  ).get() as { count: number };
  expect(queue.count).toBeGreaterThan(0);

  closeDb();
}, 120_000);  // 2 min timeout (real API calls)
```

**Event-triggered integration test：**

```typescript
test('event-triggered discovery for claude-code', async () => {
  const results = await runDiscoveryCycle({
    topic: 'claude-code',
    event: 'Anthropic launches Claude Code Agent Teams',
    expandOnly: false,
    dryRun: false,
    delay: 500,
    maxSerp: 3,
    skipExa: true,   // 省 credits
    skipSerp: false,
    model: 'haiku',
  });

  const result = results[0];
  expect(result.mode).toBe('event-triggered');
  // 至少匹配到事件相关的 subtopics
  expect(result.expansion.subtopics_processed).toBeGreaterThan(0);
}, 120_000);
```

---

## 11. Example Output

```
═══ Discovery Cycle: Claude Code (scheduled) ═══

Stage 1 — Keyword Expansion
  Subtopics processed: 8
  Keywords discovered: 142
  New keywords: 37
  API calls: Serper 24, Exa 8

Stage 2 — Keyword Grouping
  Clusters processed: 5 (3 skipped — no new keywords)
  Keywords grouped: 37
  Groups created: 8
  Claude API calls: 5

Stage 3 — Priority Scoring + Queue
  Groups scored: 8
  Groups queued: 7 (1 deferred — topic-hub, <15 pages)
  SERP API calls: 7

  Top 5 in queue:
  #1  claude code vs cursor             score=15000  compare    standard
  #2  how to use claude code hooks      score=4500   faq        standard
  #3  claude code agent teams tutorial  score=3200   blog       deep_research
  #4  claude code pricing 2026          score=2800   faq        standard
  #5  what is claude code mcp           score=1600   glossary   standard

Summary: 37 new keywords → 8 groups → 7 queued jobs
Total API calls: 44 | Duration: 92s
```

---

## 12. Constants

```typescript
// discovery.ts
export const MAX_NEW_SUBTOPICS_PER_EVENT = 3;

// Flagship topics config — will move to JSON/DB when we have 3+ topics
export const FLAGSHIP_TOPICS: FlagshipTopic[] = [/* ... */];
```

所有 scoring/routing 相关的常量在 B3 的 `priority.ts` 中定义，Discovery Cycle 不重复定义。
