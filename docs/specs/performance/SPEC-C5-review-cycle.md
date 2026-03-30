---
title: "SPEC-C5 — Pipeline Review Cycle"
status: active
category: spec
last-updated: 2026-03-20
depends-on: ["SPEC-C1", "SPEC-C3"]
---

# SPEC-C5 — Pipeline Review Cycle

> **Files:**
> - `scripts/review-cycle.ts` — CLI entry point
> - `scripts/lib/review.ts` — Core orchestration logic
> - `scripts/lib/review-checks.ts` — Layer 1 health check definitions (pure functions)
> - `scripts/lib/review-quality.ts` — Layer 2 LLM quality sampling logic
>
> **Depends on:** `scripts/lib/db.ts`, `scripts/lib/ai.ts` (for Layer 2 only), `scripts/lib/validate.ts` (reuse existing validators)
> **Consumed by:** Human review sessions, future Slack/email alerting

---

## 1. Purpose

Pipeline Review Cycle 回答的核心问题不是 "这篇内容格式对不对"（stage gates 已经做了），而是：

1. **管线健康吗？** — 各阶段是否按预期运行？Queue 在增长还是在消化？
2. **产出质量好吗？** — Keyword grouping 是否合理？生成的内容是否能满足搜索意图？
3. **系统在进步吗？** — 覆盖率在增长吗？质量趋势是上升还是下降？

**与现有系统的关系：**

| 系统 | 回答的问题 | 运行时机 | 粒度 |
|------|-----------|---------|------|
| `validate-pipeline.ts` (stage gates) | "这个 output 格式对吗？" | 生成时 | 单个内容 |
| `performance-cycle.ts` (C3) | "GSC 表现如何？该刷新哪些页面？" | 每周六 | 已发布页面 |
| **`review-cycle.ts` (C5, 本 spec)** | "管线整体运转正常吗？产出质量如何？" | 每日 + 每周 | 跨阶段聚合 |

**C5 不替代任何现有系统。** 它是一个 read-only 观察层——只读 DB、不写 DB、不修改内容、不触发任何管线动作。

---

## 2. CLI Interface

```bash
# Layer 1: 每日健康检查（纯 SQL，零 LLM 成本）
npx tsx scripts/review-cycle.ts --mode=health

# Layer 2: LLM 质量抽样（Wed & Sun cron）
npx tsx scripts/review-cycle.ts --mode=quality

# Layer 1 + Layer 2 合并报告
npx tsx scripts/review-cycle.ts --mode=full

# 生成 strategic review context package（人工周会用）
npx tsx scripts/review-cycle.ts --mode=strategic

# 指定日期范围
npx tsx scripts/review-cycle.ts --mode=health --days=7

# 只看某个 flagship topic
npx tsx scripts/review-cycle.ts --mode=quality --topic=claude-code

# 输出格式
npx tsx scripts/review-cycle.ts --mode=health --format=json   # default: json to stdout
npx tsx scripts/review-cycle.ts --mode=health --format=md      # markdown report to stdout
```

### Arguments

| Arg | Required | Default | Description |
|---|---|---|---|
| `--mode` | Yes | — | `health`, `quality`, `full`, `strategic` |
| `--topic` | No | all flagship topics | Filter to one topic slug |
| `--format` | No | `json` | Output format: `json` or `md` |
| `--backfill` | No | 2 | Layer 2: backfill samples per content type (older content spot-check) |
| `--backfill-groups` | No | 3 | Layer 2: backfill keyword group samples |
| `--dry-run` | No | false | Layer 2: print prompts without calling LLM |
| `--model` | No | `sonnet` | Layer 2: LLM model — `sonnet` (Claude Sonnet 4.6) or `haiku` (cheaper, for stable baselines) |

Note: `--days` 不再是全局参数。Layer 1 的每个 check 使用自己的自然时间窗口（today / rolling_7d / snapshot，见 Section 3.1）。Layer 2 的 "new" 池子由上一次 quality report 的时间自动确定。

---

## 3. Layer 1 — Health Checks (Daily)

纯 SQL 查询 + 阈值判断。零 API 调用，零 LLM 成本。每个 check 返回 `green | yellow | red` + 数值 + 人类可读 summary。

### 3.1 Check Definitions

每个 check 有自己的自然时间窗口，不依赖全局 `--days` 参数：

```typescript
interface HealthCheckResult {
  check_id: string;        // e.g. "queue_drain_rate"
  window: 'today' | 'rolling_7d' | 'snapshot';  // what time range this check covers
  status: 'green' | 'yellow' | 'red';
  value: number;           // the measured value
  threshold: { green: string; yellow: string; red: string };
  summary: string;         // human-readable one-liner
  detail?: string;         // optional elaboration
}
```

**三种时间窗口：**

| Window | 含义 | 适用场景 |
|---|---|---|
| `today` | 过去 24 小时 | "今天的管线跑了吗？" — 检测当日断裂 |
| `rolling_7d` | 过去 7 天滚动 | "管线趋势健康吗？" — 检测慢性退化 |
| `snapshot` | 当前状态（无时间范围） | "现在有没有卡住的 job？" — 检测即时问题 |

每个 check 使用自己最自然的窗口。Health report 同时包含三种窗口的 checks，给出完整画面。

### 3.2 Check Catalog

#### A — Pipeline Stage Completion

检查每个 cron stage 是否在过去 N 天内按预期产出。

| Check ID | Window | 查什么 | SQL 核心 | Green | Yellow | Red |
|---|---|---|---|---|---|---|
| `collect_today` | today | 今天 collect 是否运行 | `SELECT COUNT(*) FROM news_items WHERE detected_at > datetime('now', '-24 hours')` | ≥ 50 | 20-49 | < 20 |
| `collect_trend` | rolling_7d | 过去 7 天的 collect 产出天数 | `SELECT COUNT(DISTINCT date(detected_at, '+8 hours')) FROM news_items WHERE detected_at > ?` | ≥ weekdays × 0.8 | ≥ 0.5 × expected | < 0.5 |
| `newsletter_today` | today | 今天 newsletter 是否生成 | Check if `content/newsletters/en/{today}.md` exists | 存在 | — | 不存在（weekday） |
| `newsletter_bilingual` | rolling_7d | EN/ZH 配对率 | Compare EN vs ZH file counts in range | 100% | ≥ 80% | < 80% |
| `entity_extract_runs` | rolling_7d | topic_clusters 在过去 7 天有更新 | `SELECT COUNT(*) FROM topic_clusters WHERE last_seen > ?` | > 0 | — | 0 |

#### B — Queue Health

这是最关键的检查组。

**历史教训（2026-03-25）：** Dashboard report 用 `status = 'done'` 查询了 6 处，但 process-queue.ts 写入的是 `status = 'completed'`。管线实际在正常消化（5 jobs/day），但 dashboard 显示 0。这正是 review cycle 要防止的 observability bug。

**Status string 权威参考：**

| Table | Status values (代码实际使用) |
|---|---|
| `create_queue` | `pending` → `in_progress` → `completed` (NOT 'done') |
| `keyword_groups` | `pending` → `queued` → `completed` (NOT 'done') |

⚠️ 所有 health check SQL 必须使用上述 status 值。如果将来代码改了 status string，这里是唯一需要更新的地方。

| Check ID | Window | 查什么 | SQL 核心 | Green | Yellow | Red |
|---|---|---|---|---|---|---|
| `queue_pending` | snapshot | create_queue 中 pending 的 job 总数 | `SELECT COUNT(*) FROM create_queue WHERE status = 'pending'` | 信息性（无阈值） | — | — |
| `queue_drain_rate` | rolling_7d | 过去 7 天完成的 job 数 | `SELECT COUNT(*) FROM create_queue WHERE status = 'completed' AND completed_at > ?` | ≥ 20/week (5/day × weekdays) | 5-19/week | < 5/week |
| `queue_drain_today` | today | 今天完成的 job 数 | `SELECT COUNT(*) FROM create_queue WHERE status = 'completed' AND completed_at > datetime('now', '-24 hours')` | ≥ 3 | 1-2 | 0 (weekday) |
| `queue_stuck` | snapshot | status='in_progress' 超过 24h 的 job | `SELECT COUNT(*) FROM create_queue WHERE status = 'in_progress' AND created_at < datetime('now', '-24 hours')` | 0 | 1-2 | ≥ 3 |
| `queue_growth` | rolling_7d | pending 增长率 vs drain 率 | pending 新增 / completed 在 7 天内 | drain > growth | drain ≈ growth | drain = 0 且 growth > 0 |
| `queue_age` | snapshot | 最老的 pending job 年龄 | `SELECT MIN(created_at) FROM create_queue WHERE status = 'pending'` | < 7 days | 7-14 days | > 14 days |
| `groups_status_sync` | snapshot | keyword_groups 与 create_queue 状态一致性 | 检查：是否有 create_queue status='completed' 但对应 keyword_groups status='queued' 的记录 | 0 mismatches | 1-5 | > 5 |

#### C — Discovery Health

| Check ID | Window | 查什么 | SQL 核心 | Green | Yellow | Red |
|---|---|---|---|---|---|---|
| `keywords_discovered` | rolling_7d | 过去 7 天新发现的 keywords 数 | `SELECT COUNT(*) FROM keywords WHERE discovered_at > ?` | > 20 | 1-20 | 0 |
| `keywords_ungrouped` | snapshot | 有 cluster_slug 但未被任何 group 覆盖的 keywords 占比 | 用 `keyword_groups.cluster_slug` 和 `keywords.cluster_slug` 比对：已被 group 的 cluster_slug 下的 keywords 视为 grouped | < 30% | 30-60% | > 60% |
| `groups_unscored` | snapshot | priority_score = 0 的 keyword_groups 数 | `SELECT COUNT(*) FROM keyword_groups WHERE priority_score = 0` | < 20% of total | 20-50% | > 50% |
| `discovery_recency` | snapshot | 上次 discovery cycle 的时间 | 从 keywords.discovered_at 推断 | < 5 days ago | 5-10 days | > 10 days |

#### D — Content Coverage

| Check ID | Window | 查什么 | SQL 核心 | Green | Yellow | Red |
|---|---|---|---|---|---|---|
| `content_generated_today` | today | 今天生成的 content 数 | `SELECT COUNT(*) FROM content WHERE created_at > datetime('now', '-24 hours')` | ≥ 3 | 1-2 | 0 (weekday) |
| `coverage_velocity` | rolling_7d | 本周 vs 上周的 content 新增数 | `SELECT COUNT(*) FROM content WHERE created_at > ?` grouped by week | 增长或持平 | 下降 < 30% | 下降 > 50% 或 = 0 |
| `content_type_balance` | snapshot | FAQ / compare / glossary / blog 比例 | `SELECT type, COUNT(*) FROM content GROUP BY type` | FAQ+compare ≥ 30% of total | FAQ+compare 15-30% | FAQ+compare < 15% (glossary 过载) |
| `bilingual_coverage` | snapshot | ZH 内容相对 EN 的覆盖率 | 比较 EN vs ZH content counts per type | ≥ 80% | 60-80% | < 60% |
| `topic_coverage` | snapshot | 每个 flagship topic 的 keyword coverage % | 从 dashboard health report 中读取 | ≥ 30% | 10-30% | < 10% |

#### E — Performance Loop Health

| Check ID | Window | 查什么 | SQL 核心 | Green | Yellow | Red |
|---|---|---|---|---|---|---|
| `gsc_freshness` | snapshot | 最近一次 snapshot 的日期 | `SELECT MAX(snapshot_date) FROM snapshots` | < 10 days | 10-17 days | > 17 days 或 无记录 |
| `refresh_actions` | rolling_7d | 过去 7 天生成的 refresh actions | `SELECT COUNT(*) FROM create_queue WHERE content_type = 'refresh' AND created_at > ?` | ≥ 1 | — | 0 (且 GSC 有数据) |

#### F — Flagship Topic Health (added 2026-03-27, D1/D2)

| Check ID | Window | 查什么 | SQL 核心 | Green | Yellow | Red |
|---|---|---|---|---|---|---|
| `flagship_pack_status` | snapshot | 每个 `FLAGSHIP_TOPICS` 的 pack 状态 | 检查 `data/flagship-packs/{slug}.json` 是否存在、status 是否 approved、`approved_at` 是否 > 14 天 | All approved & fresh | Draft or stale (>14d) | Missing pack file |
| `flagship_migration` | snapshot | `topic_clusters.source` 分布 | `SELECT source, COUNT(*) FROM topic_clusters GROUP BY source` | 信息性（无阈值） | — | — |

`flagship_pack_status` iterates over all configured flagship topics. `flagship_migration` is informational — tracks the ratio of `flagship_discovery` vs `entity_extract` rows as migration progresses.

### 3.3 Layer 1 Output

```typescript
interface HealthReport {
  generated_at: string;           // ISO timestamp
  review_window_days: number;
  overall_status: 'green' | 'yellow' | 'red';  // worst of all checks
  checks: HealthCheckResult[];
  summary: {
    green: number;
    yellow: number;
    red: number;
  };
  // Convenience: just the problems
  issues: HealthCheckResult[];   // yellow + red only
}
```

`overall_status` = worst status across all checks. 一个 red 就是 red。

---

## 4. Layer 2 — LLM Quality Sampling (Daily)

用 Claude 对 pipeline 产出做 judgment-based 质量评分。每次调用的 prompt 保持小而聚焦（< 500 tokens input），避免 context window 退化。每天跑，每天取不同样本。

### 4.1 Sampling Strategy

**核心原则：Score all new + backfill random older content.**

管线每天产出 ~5 个内容页面。这个量足够小，可以全部评分而不是抽样。对于关键词和 subtopic，也是同样逻辑——先评新的，再补查老的。

```typescript
interface SamplingConfig {
  // "New" window: score EVERYTHING created since last quality report
  // Typically: content created in last 24h, keyword groups created in last 24h
  // If last report was 2 days ago (e.g. weekend), window extends to cover the gap
  new_since: string;  // ISO datetime of last quality report, from data/review/

  // "Backfill" samples: random pick from OLDER content (> 24h old)
  // Purpose: spot-check whether older content quality has drifted
  backfill_content_per_type: number;   // default 2
  backfill_keyword_groups: number;     // default 3
}
```

**每天 quality report 覆盖两个池子：**

| 池子 | 选什么 | 为什么 |
|------|--------|--------|
| **New** (since last report) | 所有新生成的 content、新创建的 keyword groups、新发现的 subtopics | 保证每个 pipeline 产出都被评分一次，不遗漏 |
| **Backfill** (older than 24h) | 随机抽 2 篇 per type + 3 个 keyword groups | 检测质量漂移：老内容可能是不同 prompt 版本生成的 |

**去重：** Quality report 记录已评分的 slug/group_id 列表（写入 report JSON 的 `scored_items` 字段）。Backfill 抽样时排除最近 7 天内已评分的 items，确保不重复浪费 LLM 调用。

**每日预期 LLM 调用量：**
- New content: ~5 pieces × 2 rubrics (B+C) = ~10 calls
- New keyword groups: ~5-10 groups × 1 rubric (A) = ~10 calls
- Backfill content: ~8 pieces × 2 rubrics = ~16 calls
- Backfill keyword groups: ~3 × 1 rubric = ~3 calls
- Subtopic batch (E): ~1 call
- Keyword quality batch (F): ~1 call
- **Total: ~41 LLM calls/day, < $0.25/day with Sonnet 4.6**

**抽样来源：**

| 抽样对象 | New 池子 | Backfill 池子 |
|---------|---------|---------|
| FAQ content | `content/faq/en/` created since last report | Random from older files, exclude recently scored |
| Compare content | `content/compare/en/` created since last report | Random from older |
| Blog content | `content/blog/en/` created since last report | Random from older |
| Glossary content | `content/glossary/en/` created since last report | Random from older |
| Keyword groups | `keyword_groups` created since last report | Random from older, exclude recently scored |
| Subtopics | `topic_clusters` first_seen since last report | — (no backfill, subtopics don't drift) |
| Raw keywords | `keywords` discovered_at since last report | — (no backfill) |

只抽 EN 内容——ZH 质量与 EN 高度相关，分开评估收益不高。

### 4.2 Quality Rubrics

每个 rubric 定义一个聚焦的 LLM prompt + 1-5 分的评分标准。

#### Rubric A — Keyword Group Coherence

> 评估：一个 keyword group 中的所有 keyword 是否真的能用同一个页面满足？

```typescript
interface KeywordGroupSample {
  group_id: number;
  primary_keyword: string;
  secondary_keywords: string[];
  intent: string;
  content_type: string;
}
```

**Prompt template** (每个 group 一次调用):

```
Score this keyword group 1-5 on search intent coherence.

A score of 5 means: a single page could fully satisfy a user searching ANY of these keywords.
A score of 1 means: these keywords need completely different pages.

Primary keyword: "{primary_keyword}"
Secondary keywords: {secondary_keywords as JSON array}
Assigned intent: {intent}
Assigned content type: {content_type}

Respond ONLY in this JSON format:
{"score": <1-5>, "reason": "<one sentence>", "misfit_keywords": [<keywords that don't belong, if any>]}
```

**阈值：**
- Green: average score ≥ 3.5
- Yellow: 2.5 - 3.5
- Red: < 2.5

#### Rubric B — Content Search Intent Match

> 评估：生成的内容是否真正回答了目标 keyword 的搜索意图？

**Prompt template** (每篇内容一次调用):

```
Score this content 1-5 on how well it satisfies the search intent for the target keyword.

A score of 5 means: a user searching this keyword would find exactly what they need.
A score of 1 means: the content is irrelevant or too generic to satisfy the search.

Target keyword: "{keyword}"
Content type: {type}
Title: "{title}"
First 500 words:
---
{first_500_words}
---

Respond ONLY in this JSON format:
{"score": <1-5>, "reason": "<one sentence>", "improvement": "<one concrete suggestion, or null>"}
```

**阈值：**
- Green: average ≥ 4.0
- Yellow: 3.0 - 4.0
- Red: < 3.0

#### Rubric C — Content AEO Readiness

> 评估：内容是否结构化到足以被 AI 搜索引擎引用？

**Prompt template**:

```
Score this content 1-5 on AI answer engine readiness.

A score of 5 means: an AI like Perplexity or ChatGPT search could directly quote this as a source.
A score of 1 means: the content has no extractable answers.

Check for:
- Does the first paragraph contain a direct, quotable answer?
- Are headings phrased as questions (for FAQ) or clear topic labels?
- Is there structured data (tables, lists) that an AI could parse?
- Does it avoid fluff and get to the point?

Content type: {type}
Title: "{title}"
Full content:
---
{full_content}
---

Respond ONLY in this JSON format:
{"score": <1-5>, "reason": "<one sentence>", "missing": "<what would make it more AEO-ready, or null>"}
```

**阈值：**
- Green: average ≥ 3.5
- Yellow: 2.5 - 3.5
- Red: < 2.5

#### Rubric D — Priority Score Sanity

> 评估：priority scoring 是否在优先高价值 keyword？

不需要 LLM。纯逻辑 check：

```typescript
// Take top-10 and bottom-10 queued jobs
// Flag if:
// - Top-10 contains navigational intent (low commercial value)
// - Top-10 contains keywords with volume = DEFAULT_VOLUME (10) meaning no real volume data
// - Bottom-10 contains keywords with high real volume that got deprioritized
// - All top-10 are the same content_type (lack of diversity)
```

#### Rubric E — Subtopic Discovery Quality

> 评估：最近发现的 subtopics 是否代表真实的搜索需求？

背景：`discoverNewSubtopics()` 只用 Serper `searchRelated()`，返回的是 Google 自动建议。这些建议可能是噪音（太宽泛、与 topic 无关、或没有搜索量）。ROADMAP.md 已经标记过 "Haiku 幻觉、Exa 垃圾关键词" 的问题。

**Prompt template** (batch: 一次评估最近发现的 5-10 个 subtopics):

```
Score each subtopic 1-5 on whether it represents real, targetable search demand for the parent topic.

A score of 5 means: this is a clear, specific subtopic that people actively search for.
A score of 1 means: this is noise, too vague, or unrelated to the parent topic.

Parent topic: "{flagship_topic_name}"
Subtopics to evaluate:
{subtopics as numbered list with slug and pillar_topic}

Respond ONLY in this JSON format:
{"scores": [{"slug": "<slug>", "score": <1-5>, "reason": "<one sentence>"}]}
```

**阈值：**
- Green: average ≥ 3.5
- Yellow: 2.5 - 3.5
- Red: < 2.5

不需要 LLM。纯逻辑 check（从 keywords table 抽样）：

#### Rubric F — Raw Keyword Quality

> 评估：expansion 阶段发现的原始 keyword 是否可用？

在 grouping 之前，Serper PAA/related/autocomplete 和 Exa competitor scan 可能引入垃圾关键词。Rubric A 检查 grouping 是否合理，但不检查原始关键词本身是否有价值。

**Prompt template** (batch: 一次评估 15-20 个随机 keyword):

```
Score each keyword 1-5 on whether it is a real, targetable search query for SEO content.

A score of 5 means: someone would actually type this into Google, and a page could rank for it.
A score of 1 means: this is gibberish, too specific (error codes), stale (outdated version numbers), or clearly noise from automated scraping.

Topic context: "{flagship_topic_name}"
Keywords to evaluate (with source):
{keywords as numbered list: keyword | source (serper-paa/exa-competitor/etc)}

Respond ONLY in this JSON format:
{"scores": [{"keyword": "<keyword>", "score": <1-5>, "reason": "<one sentence>"}], "junk_rate": <0.0-1.0>}
```

**阈值：**
- Green: junk_rate < 0.15 (< 15% 垃圾关键词)
- Yellow: 0.15 - 0.30
- Red: > 0.30

**额外价值：** 按 source 分组统计 junk_rate，可以快速定位是 Exa competitor 还是 Serper autocomplete 在产出垃圾。

#### Rubric G — Internal Linking Coherence

> 评估：cluster 内的页面是否正确互链？

不需要 LLM。纯文件系统 + 正则 check：

```typescript
// For each flagship topic:
// 1. List all content pages in the cluster (by cluster_slug)
// 2. For each page, extract all internal links (markdown [text](/path) pattern)
// 3. Check:
//    a. Orphan pages: pages with 0 inbound internal links from other cluster pages
//    b. Hub completeness: does the topic-hub page link to ≥ 80% of cluster spoke pages?
//    c. Broken internal links: links pointing to slugs that don't exist in content/
//    d. Cross-cluster linking: do cluster pages link to pages in other clusters? (good for SEO)
//    e. Reciprocal linking rate: of outbound links, how many have a reciprocal inbound?
```

**输出：**
```typescript
interface InternalLinkReport {
  topic: string;
  total_pages: number;
  orphan_pages: string[];         // slugs with 0 inbound
  hub_link_coverage: number;      // 0.0-1.0
  broken_links: Array<{ page: string; broken_target: string }>;
  cross_cluster_links: number;
  reciprocal_rate: number;        // 0.0-1.0
}
```

**阈值：**
- Green: orphans = 0, hub coverage ≥ 0.8, broken = 0
- Yellow: orphans 1-3 or hub coverage 0.5-0.8 or broken 1-3
- Red: orphans > 3 or hub coverage < 0.5 or broken > 3

#### Rubric H — Refresh Pipeline Health

> 评估：GSC feedback loop 是否闭合？

**⚠️ 已知 Bug（2026-03-25 发现）：** `content_type = 'refresh'` 不在 `content-gen.ts` 的 `ContentType` union 中。`MODEL_MAP` 和 `getValidatorForType` 都没有 'refresh' 条目。这意味着 performance cycle 创建的 refresh queue entries 会在 process-queue 中静默失败。**此 bug 必须先修复，Rubric H 才有意义。**

修复后，Rubric H 检查（不需要 LLM，纯逻辑）：

```typescript
// 1. Refresh job completion rate:
//    SELECT COUNT(*) FROM create_queue WHERE content_type = 'refresh' AND status = 'completed'
//    vs total refresh jobs created
//
// 2. Striking distance conversion:
//    For queries that had refresh actions, compare GSC position before vs after
//    (requires snapshots from two consecutive performance cycles)
//
// 3. Refresh → ranking improvement correlation:
//    Of completed refresh jobs, how many show position improvement in next GSC snapshot?
//
// 4. Stale action detection:
//    Refresh jobs in queue for > 14 days without completion
```

**阈值：**
- Green: refresh completion rate ≥ 80%, ≥ 1 striking distance conversion
- Yellow: completion 50-80%, or 0 conversions but < 4 weeks of data
- Red: completion < 50%, or 0 conversions with ≥ 4 weeks of data

### 4.3 Layer 2 Output

```typescript
interface QualityReport {
  generated_at: string;
  review_window_days: number;
  overall_quality: 'green' | 'yellow' | 'red';

  // Rubric A
  keyword_coherence: {
    samples_scored: number;
    average_score: number;
    status: 'green' | 'yellow' | 'red';
    worst_groups: Array<{ group_id: number; primary_keyword: string; score: number; reason: string }>;
  };

  // Rubric B
  content_intent_match: {
    samples_scored: number;
    average_score: number;
    status: 'green' | 'yellow' | 'red';
    by_type: Record<string, { average: number; count: number }>;
    worst_pieces: Array<{ slug: string; type: string; score: number; reason: string }>;
  };

  // Rubric C
  content_aeo_readiness: {
    samples_scored: number;
    average_score: number;
    status: 'green' | 'yellow' | 'red';
    by_type: Record<string, { average: number; count: number }>;
    common_issues: string[];
  };

  // Rubric D (no LLM)
  priority_sanity: {
    status: 'green' | 'yellow' | 'red';
    issues: string[];
  };

  // Rubric E
  subtopic_discovery_quality: {
    samples_scored: number;
    average_score: number;
    status: 'green' | 'yellow' | 'red';
    worst_subtopics: Array<{ slug: string; score: number; reason: string }>;
  };

  // Rubric F
  keyword_quality: {
    samples_scored: number;
    average_score: number;
    junk_rate: number;
    junk_rate_by_source: Record<string, number>;  // e.g. { "exa-competitor": 0.35, "serper-paa": 0.08 }
    status: 'green' | 'yellow' | 'red';
    worst_keywords: Array<{ keyword: string; source: string; score: number; reason: string }>;
  };

  // Rubric G (no LLM)
  internal_linking: {
    status: 'green' | 'yellow' | 'red';
    by_topic: Array<{
      topic: string;
      total_pages: number;
      orphan_pages: string[];
      hub_link_coverage: number;
      broken_links: Array<{ page: string; broken_target: string }>;
      cross_cluster_links: number;
      reciprocal_rate: number;
    }>;
  };

  // Rubric H (no LLM) — requires refresh pipeline bug fix first
  refresh_pipeline: {
    status: 'green' | 'yellow' | 'red' | 'not_implemented';
    refresh_jobs_total: number;
    refresh_jobs_completed: number;
    completion_rate: number;
    stale_jobs: number;           // in queue > 14 days
    striking_conversions: number;  // queries that improved position after refresh
    detail: string;
  };

  llm_calls: number;
  llm_model: string;
  duration_ms: number;
}
```

### 4.4 LLM Usage

- **Model:** Claude Sonnet 4.6 (`claude-sonnet-4-6`)。Early-stage 管线需要高质量的质量判断来建立 baseline——Haiku 可能在 AEO readiness 和 intent match 评分上缺乏区分度。等质量 baseline 稳定后（~4 周），可以降级到 Haiku 观察分数是否一致，如果一致就切换。
- **Estimated cost per run:** ~10 keyword groups × 1 call (Rubric A) + ~20 content samples × 2 rubrics (B+C) + ~1 batch call (Rubric E subtopics) + ~1 batch call (Rubric F keywords) = ~55 LLM calls × ~500 tokens = ~28K tokens input + ~6K output。Sonnet 4.6 定价下仍然很便宜（< $0.25/run）。Rubrics D, G, H 不需要 LLM。
- **CLI override:** `--model=haiku` 可降级用于测试或省钱。
- **Fallback:** If LLM fails for a sample, skip it and note in report. Don't retry — one missing sample doesn't matter for trend tracking.

---

## 5. Mode: `strategic` — Context Package Generator

`--mode=strategic` 不是一个 review。它生成一个 **context package**——一个可以直接粘贴到 Claude conversation 中进行人工 strategic review 的文件。

### 5.1 What It Generates

一个 markdown 文件（`data/review/strategic-{date}.md`），包含：

```markdown
# LoreAI Strategic Review — {date}

## Pipeline Health (Layer 1)
{Layer 1 HealthReport 的 markdown 版本}

## Quality Scores (Layer 2)
{Layer 2 QualityReport 的 markdown 版本}
{包含 trend: 本周 vs 上周的分数变化}

## Content Inventory
- Blog: {count} EN / {count} ZH
- FAQ: {count} / {count}
- Compare: {count} / {count}
- Glossary: {count} / {count}
- Topics: {count} / {count}

## Flagship Topic Status
{per topic: keywords discovered, grouped, queued, completed, coverage %}

## Top 10 Queue (What System Wants to Build Next)
{top-10 from create_queue with priority_score, keyword, content_type}

## Bottom 5 Quality Samples (What Needs Attention)
{worst-scoring content from Layer 2}

## Worst Keyword Groups (Grouping Issues)
{worst-scoring groups from Layer 2}

## Questions for Human Review
{auto-generated questions based on detected issues, e.g.:
- "Queue drain rate is 0. Is process-queue.ts cron running?"
- "Keyword coherence dropped from 3.8 to 3.1 this week. Review grouping prompt?"
- "FAQ content scores 2.8 on AEO readiness. Should we update the SEO skill prompt?"}
```

### 5.2 Target Size

Strategic context package 目标 < 15K tokens (约 10KB markdown)，确保可以完整粘贴进 Claude 对话而不超出 sweet spot。

---

## 6. Report Storage

所有 report 写入 `data/review/`：

```
data/review/
  health-2026-03-25.json
  quality-2026-03-25.json
  quality-2026-03-26.json
  quality-2026-03-27.json
  strategic-2026-03-30.md
```

### 6.1 每种 Report 的时间覆盖

| Report | 频率 | 覆盖的时间区间 | 内容 |
|---|---|---|---|
| `health` | 每天 9pm | **today** checks: 过去 24h; **rolling_7d** checks: 过去 7 天; **snapshot** checks: 当前状态 | 管线是否在运转？有没有卡住？趋势是否健康？ |
| `quality` | 每天 9:30pm | **New 池子**: 自上次 quality report 以来的所有新产出（通常 ~24h，周末后可能 48-72h）; **Backfill 池子**: 从全部历史内容中随机抽样 | 今天的产出质量如何？老内容质量有没有漂移？ |
| `strategic` | 周日 10pm | 聚合过去 7 天的 health + quality reports，生成人类可读的 markdown | 本周整体表现 + 需要人工决策的问题 |

**Quality report 的 "new since" 逻辑：**
- 启动时读取 `data/review/` 中最新的 `quality-*.json`
- 提取其 `generated_at` 时间戳作为 `new_since`
- 如果没有历史 report（首次运行），`new_since` = 7 天前
- 这样即使周末没跑，周一的 report 会自动覆盖 3 天的积压

### 6.2 Retention & Trend Tracking

保留最近 30 天的 report。超过 30 天的自动删除（在 review-cycle.ts 启动时清理）。

**Trend tracking:** Quality report 在生成时读取前一次 report 的分数，计算 delta 并写入当前 report 的 `trends` 字段。Strategic report 聚合 7 天的 quality reports 计算周趋势。这样不需要额外的 DB table 就能追踪趋势。

```typescript
interface QualityTrend {
  previous_report_date: string | null;
  deltas: {
    keyword_coherence: number | null;   // e.g. +0.3 or -0.5
    content_intent_match: number | null;
    content_aeo_readiness: number | null;
    keyword_quality_junk_rate: number | null;
  };
}
```

---

## 7. Cron Schedule

添加到 `daily-pipeline.sh` 的 step dispatch。所有 review 任务安排在夜间（管线全天产出完成后）。

| Time (SGT) | Mode | Days | 估计耗时 | 输出 |
|---|---|---|---|---|
| 9:00pm | `health` | Mon-Fri | < 5 seconds | `data/review/health-{date}.json` |
| 9:30pm | `quality` | Daily (Mon-Fri) | ~2 minutes | `data/review/quality-{date}.json` |
| 10:00pm Sun | `strategic` | Sun (after quality) | < 10 seconds | `data/review/strategic-{date}.md` |

**为什么夜间：** 管线白天运行（12am-10am SGT），review 应该在所有 stage 完成后才跑，这样能看到当天的完整产出。9pm 是一个安全的时间——即使有延迟的 stage 也已完成。

**为什么 quality 每天跑：** 管线处于 early stage，需要快速建立质量 baseline 和发现问题。每天跑 Sonnet 4.6 的成本 < $0.20/天，忽略不计。等 baseline 稳定（~4 周后 quality scores 方差 < 0.3），可以降频到 2x/week。

**Strategic 周日跑：** 聚合一周的 health + quality 数据，生成 context package 供周一人工 review 使用。

Crontab entries（UTC，SGT = UTC+8，所以 9pm SGT = 1pm UTC）：

```cron
# C5 — Pipeline Review Cycle
0  13 * * 1-5  cd /path/to/loreai-v2 && bash scripts/daily-pipeline.sh review-health
30 13 * * 1-5  cd /path/to/loreai-v2 && bash scripts/daily-pipeline.sh review-quality
0  14 * * 0    cd /path/to/loreai-v2 && bash scripts/daily-pipeline.sh review-strategic
```

---

## 8. Implementation Notes

### 8.1 Architecture

```
scripts/review-cycle.ts          # CLI: parse args, dispatch mode, output result
scripts/lib/review.ts            # Orchestration: run checks, run sampling, assemble report
scripts/lib/review-checks.ts     # Pure functions: each health check is a named export
scripts/lib/review-quality.ts    # LLM sampling: rubric definitions, prompt templates, scoring
```

### 8.2 Design Principles

1. **Read-only.** Review cycle 不写入 DB，不修改内容文件，不触发管线动作。唯一的写操作是保存 report JSON 到 `data/review/`。
2. **Pure functions for checks.** 每个 health check 是 `(db, opts) => HealthCheckResult`，方便单独测试和新增。
3. **Fail-open.** 如果某个 check 失败（DB error、LLM timeout），跳过并在 report 中标注 `status: 'error'`。不阻断其他 checks。
4. **Reuse existing code.** 导入 `scripts/lib/db.ts` 的 `getDb()`，导入 `scripts/lib/ai.ts` 的 `callClaude()`（如果有），导入 `scripts/lib/validate.ts` 的现有验证函数。不重新实现。

### 8.3 Content Sampling Implementation

```typescript
// Sample random content files from the review window
function sampleContentFiles(
  contentDir: string,
  type: string,
  lang: string,
  days: number,
  count: number,
): string[] {
  // 1. List all .md files in content/{type}/{lang}/
  // 2. Parse frontmatter to get date
  // 3. Filter to files within the review window
  // 4. Random shuffle + take first {count}
  // 5. Return file paths
}
```

### 8.4 Keyword Group Sampling

```typescript
// Sample keyword groups with their member keywords
function sampleKeywordGroups(
  db: Database,
  topicSlug: string | null,
  count: number,
): KeywordGroupSample[] {
  // 1. Query keyword_groups (filtered by topic if specified)
  // 2. For each group, load member keywords from keywords table
  //    (JOIN on cluster_slug or use keyword_group_members if that relation exists)
  // 3. Random shuffle + take first {count}
  // NOTE: 当前 DB schema 中 keyword_groups 和 keywords 的关联
  //       需要通过 cluster_slug 间接关联——确认实际 schema 后调整 SQL
}
```

### 8.5 关于 keyword_groups ↔ keywords 关联

**已确认（2026-03-25 调查）：**

- `keyword_groups` 使用 status: `pending` → `queued` → `completed`
- `create_queue` 使用 status: `pending` → `in_progress` → `completed`
- 两表通过 `keyword_group_id` 关联：`create_queue.keyword_group_id` → `keyword_groups.group_id`
- `keyword_groups` 和 `keywords` 通过 `cluster_slug` 间接关联
- `content-gen.ts` 现已在内容生成完成后更新 `keyword_groups SET status = 'completed'`（此前遗漏，groups 会永远停在 'queued'）

新增的 `groups_status_sync` check（Section 3.2B）专门检测 create_queue 和 keyword_groups 之间的状态不一致——这是已知的历史 bug 模式。

---

## 9. Test Strategy

### 9.1 Unit Tests (`scripts/__tests__/review-cycle.test.ts`)

每个 health check function 单独测试：

```typescript
// 用 in-memory SQLite + fixture data
describe('check: queue_drain_rate', () => {
  it('returns green when >= 5 jobs completed in 7 days', () => { ... });
  it('returns red when 0 jobs completed', () => { ... });
  it('handles empty create_queue table gracefully', () => { ... });
});
```

每个 quality rubric 的 prompt template 测试（不调用 LLM）：

```typescript
describe('rubric: keyword_coherence', () => {
  it('builds correct prompt from sample data', () => { ... });
  it('parses valid LLM response', () => { ... });
  it('handles malformed LLM response gracefully', () => { ... });
});
```

### 9.2 Integration Test

一个 e2e test 用 fixture DB 运行 `--mode=health`，验证完整 report 结构。

---

## 10. Future Extensions (Not in v1)

以下功能明确 **不在** v1 scope 中，记录在此供将来参考：

- **Slack/email alerting:** 当 overall_status = red 时自动通知。等 v1 跑稳后再加。
- **Historical trend dashboard:** 在 loreai.dev/dashboard 上展示 quality score 趋势图。等积累 4+ 周数据后再建。
- **Auto-remediation:** 检测到 queue stuck 时自动重启 process-queue。风险太高，不自动化。
- **ZH content 独立评估:** 如果发现 EN/ZH 质量分化严重，加 ZH-specific rubrics。
- **Newsletter quality sampling:** 目前 newsletter 已有严格的 stage gates + forbidden phrases。如果发现不够，加 Layer 2 rubric。
- **Site audit integration:** 链接检查、schema 验证、404 检测。独立系统，不在 review cycle 中。
