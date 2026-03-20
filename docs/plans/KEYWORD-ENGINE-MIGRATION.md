# LoreAI v2 — Keyword-Centric Engine Migration Plan

## Context

LoreAI 需要从 **newsletter-led publishing system** 转型为 **flagship-topic-led keyword authority system**（详见 `docs/STRATEGY.md`）。

**现状问题：** 当前 pipeline 是串行的 Collect → Newsletter → Blog → SEO。Newsletter 之后的所有环节（blog、FAQ、compare、glossary）经常处于 starvation 状态，很多天产出为零。这是因为 SEO 内容生成完全依赖 newsletter 的 blog seed 输出，而这个 seed 经常不够。

**目标：** 建立 keyword-centric execution engine，让内容生成由 keyword opportunity 驱动（volume × 1/competition × intent），而不是由 newsletter 选题驱动。

**执行策略：Accelerated Strangler Pattern**
- **保留不动：** collect-news.ts、write-newsletter.ts、write-weekly.ts
- **直接替换：** write-blog.ts、generate-seo.ts → 新的 unified keyword engine
- 旧 blog/SEO pipeline 经常 0 产出，替换无业务风险

---

## Phase A — Data Layer（数据感知能力）

### A1. Schema Migration（直接做，不需要 spec）
- 扩展 `keywords` 表：加 `search_volume`, `competition`, `intent`, `keyword_group_id` 字段
- 新建 `keyword_groups` 表：group_id, primary_keyword, intent, content_type, priority_score, status, cluster_slug, created_at, updated_at
- 新建 `create_queue` 表：job_id, keyword_group_id, content_type, research_pipeline, priority_score, status, created_at, completed_at
- **文件：** `scripts/lib/db.ts`
- **验证：** 现有测试仍通过，新表可读写

### A2. Serper API Client（需要 spec）
- 新建 `scripts/lib/serper.ts`
- 功能：PAA queries、related searches、autocomplete、search volume estimation
- SERP depth signal detection（top results 是短答案还是长文）
- **依赖：** Serper API key（环境变量）
- **验证：** 单元测试 + 对 "claude code pricing" 等真实 query 跑 integration test

### A3. Exa API Client（需要 spec）
- 新建 `scripts/lib/exa.ts`
- 功能：语义搜索、getContents（full page text）、competitor analysis
- **依赖：** Exa API key
- **验证：** 能 fetch 真实页面的 clean text

### A4. GSC API Client（需要 spec）
- 新建 `scripts/lib/gsc.ts`
- 功能：拉 queries + positions + impressions + clicks + CTR
- Position segmentation（1-3, 4-10, 11-20, 21-50, 50+）
- New query detection
- **依赖：** GSC API credentials（Service Account）
- **验证：** 能拉到 loreai.dev 的真实 GSC 数据

---

## Phase B — Engine Layer（核心引擎）

### B1. Keyword Expansion Script（需要 spec）
- 新建 `scripts/expand-keywords.ts`
- 输入：flagship topic + subtopics
- 流程：Serper PAA/related → Exa competitor scan → 汇总所有 raw keywords
- 输出：写入 keywords 表
- **关键文件：** 使用 A2 (serper.ts) + A3 (exa.ts)

### B2. Keyword Grouping Skill（需要 spec）
- 新建 `skills/keyword-grouping/SKILL.md`
- 新建 `scripts/group-keywords.ts`
- 输入：某 subtopic 下所有 raw keywords
- Claude 调用：按 shared intent 分组，每组 = 一个页面
- 输出：keyword_groups 表（primary keyword、intent、suggested content_type）
- **关键模式：** 遵循现有 skills/ 目录的 SKILL.md 模式

### B3. Priority Scoring + Unified Queue（需要 spec — 最关键模块）
- 新建 `scripts/lib/priority.ts`
- 公式：`volume × (1/competition) × intent_multiplier + timeliness_bonus`
- 新建 `scripts/score-and-queue.ts`
- 输入：keyword_groups 表
- 输出：create_queue 表（排好序的待创建页面列表）
- 路由逻辑：intent + SERP depth → content_type + research_pipeline（Standard vs Deep Research）
- **纯逻辑，高度可测试**

### B4. Source-Grounded Content Generation（需要 spec）
- 重构/替换 `scripts/generate-seo.ts`
- Standard pipeline：Serper search → Exa getContents → Claude + skill
- Deep Research pipeline：Gemini Deep Research → Claude + skill
- 统一入口：从 create_queue 读取 job → 按 content_type 分发到对应 skill
- 生成 EN + ZH 版本
- Post-generation link validation（验证所有内部链接指向真实页面）
- **关键文件：** 复用并改造现有 skills/seo/SKILL.md，可能拆分为 skills/faq/、skills/compare/ 等

---

## Phase C — Pipeline Switch（切换上线）

### C1. Discovery Cycle Script（需要 spec）
- 新建 `scripts/discovery-cycle.ts`
- 编排：subtopic discovery → keyword expansion → grouping → priority scoring → queue
- 周六跑一次（cron）
- 同时支持 event-triggered（news pipeline 发现新事件时触发）

### C2. Newsletter 变为 Graph Consumer
- 修改 `write-newsletter.ts` 的 blog seed extraction
- Newsletter 仍然独立跑，但 blog seeds 变为可选
- 新内容由 unified queue 驱动，newsletter 只是 surface 最新发布的 graph nodes

### C3. Performance Loop（需要 spec）
- 新建 `scripts/performance-cycle.ts`
- 周二跑：GSC import → position segmentation → anomaly detection → refresh queue
- 输出：refresh actions 写入 create_queue（type = refresh）
- Striking distance optimization（position 11-20）

### C4. Daily Pipeline 重组
- 修改 `scripts/daily-pipeline.sh`
- 新流程：
  ```
  4am: collect-news.ts（不变）
  5am: write-newsletter.ts（不变，但不再 gate SEO）
  7am: process-queue.ts（新，从 create_queue 取 top N，生成内容）
  Saturday: discovery-cycle.ts（新）
  Tuesday: performance-cycle.ts（新）
  ```

---

## Execution Order & Dependencies

```
A1 (schema) ──────────────────────────────────────────────┐
A2 (serper) ──┐                                           │
A3 (exa) ─────┤                                           │
A4 (gsc) ─────┘                                           │
      │                                                    │
      ├──→ B1 (keyword expansion) ──→ B2 (grouping) ──→ B3 (scoring/queue)
      │                                                    │
      └──→ B4 (source-grounded generation) ←───────────────┘
                        │
                        ├──→ C1 (discovery cycle)
                        ├──→ C2 (newsletter as consumer)
                        ├──→ C3 (performance loop)
                        └──→ C4 (daily pipeline reorg)
```

**A1 可以先做**（无依赖），A2/A3/A4 可以并行做。
B1 依赖 A2+A3，B3 依赖 B1+B2，B4 依赖 A2+A3+B3。
C 阶段依赖 B 全部完成。

---

## Spec 策略（最大化 One-Shot 成功率）

**需要 spec 的模块（中大）：** A2, A3, A4, B1, B2, B3, B4, C1, C3
- 每个 spec 1-2 页
- 包含：文件路径、输入输出类型、测试用例、参考的现有 pattern

**直接做的模块（小）：** A1, C2, C4
- Schema migration、config 调整等 mechanical 变更

**每个 spec → 实现 → 验证 的节奏：**
1. 写 spec（1-2 页，放在 `docs/plans/specs/`）
2. Review（或直接 approve）
3. 实现 + 测试
4. VPS 上跑真实数据验证
5. Commit + push
6. 下一个模块

---

## Verification（端到端验证）

每个阶段完成后的验证标准：

**Phase A 完成时：**
- 能对 "claude code" 跑 Serper 拿到 PAA + related searches
- 能用 Exa fetch 竞争对手页面的 full text
- 能从 GSC 拉到 loreai.dev 的 queries + positions
- Keywords 表有 volume/competition 数据

**Phase B 完成时：**
- 能从 "claude code" flagship topic 扩展出 50+ keyword groups
- 每个 group 有 intent classification + content type assignment
- Priority queue 产出排好序的 create jobs
- 从 queue 取一个 job → 用 Serper+Exa source grounding → 生成高质量 FAQ/compare page

**Phase C 完成时：**
- 新 daily pipeline 每天稳定产出 3-5 篇内容（vs 旧系统经常 0）
- Discovery cycle 周六跑，扩展 keyword universe
- Performance cycle 周二跑，产出 refresh/optimize actions
- Newsletter 正常跑，能 surface 当周新发布的 cluster pages
