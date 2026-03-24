# Keyword Engine Migration — Usage Guide

> 如何用 Claude Code 逐步执行 migration plan。
> 配合 `docs/plans/KEYWORD-ENGINE-MIGRATION.md` 使用。

---

## 总体流程

每个模块的完整 lifecycle：
```
1. 你给 Claude Code 一个 prompt → 写 spec
2. 你 review spec（或直接 approve）
3. 你给 Claude Code prompt → 执行 spec（实现 + 测试）
4. 验证通过 → commit + push
5. 记录到 Execution Log（docs/plans/specs/KEYWORD-ENGINE-LOG.md）
6. 下一个模块
```

---

## Step-by-step Prompts（按依赖顺序）

### Step 1: A1 — Schema Migration（直接做，不需要 spec）

```
请执行 keyword engine migration plan 的 A1: Schema Migration。

要求：
1. 在 @scripts/lib/db.ts 中扩展 keywords 表，加 search_volume, competition, intent, keyword_group_id 字段
2. 新建 keyword_groups 表（group_id, primary_keyword, intent, content_type, priority_score, status, cluster_slug, created_at, updated_at）
3. 新建 create_queue 表（job_id, keyword_group_id, content_type, research_pipeline, priority_score, status, created_at, completed_at）
4. 确保 ALTER TABLE 对已有数据库安全（SQLite 限制）
5. 跑 npm test 确认现有测试不 break
6. Commit + push

参考：
- @docs/STRATEGY.md §4.4-4.5 的数据模型
- @docs/plans/KEYWORD-ENGINE-MIGRATION.md Phase A
```

---

### Step 2: A2 — Serper API Client（需要 spec）

**Step 2a — 写 Spec：**
```
请为 keyword engine migration 的 A2 写 spec：Serper API Client。

要求：
1. 先搜索 Serper.dev 官方 API 文档，获取最新的 endpoint、参数、返回格式
2. 写 spec 到 docs/plans/specs/SPEC-A2-serper.md
3. Spec 必须包含：
   - 文件路径（scripts/lib/serper.ts）
   - TypeScript 接口定义（输入/输出类型）
   - 每个函数的职责：searchPAA, searchRelated, searchAutocomplete, estimateVolume, detectSERPDepth
   - 完整测试计划（unit tests mock API + integration test 用真实 query）
   - 错误处理策略（rate limit, timeout, API key missing）
   - 环境变量（SERPER_API_KEY）
   - 参考现有 @scripts/lib/brave.ts 的 pattern

参考文档：
- @docs/plans/KEYWORD-ENGINE-MIGRATION.md Phase A → A2
- @docs/STRATEGY.md §4.3-4.4

不要实现，只写 spec。
```

**Step 2b — 执行 Spec：**
```
请执行 @docs/plans/specs/SPEC-A2-serper.md 。

要求：
1. 严格按 spec 实现
2. 写完整的测试（unit + integration）
3. npm test 通过
4. npm run build 通过
5. Commit + push
6. 在 @docs/plans/specs/KEYWORD-ENGINE-LOG.md 记录结果（参考 log 格式见 @docs/plans/KEYWORD-ENGINE-USAGE.md 底部）
```

---

### Step 3: A3 — Exa API Client（需要 spec）

**Step 3a — 写 Spec：**
```
请为 keyword engine migration 的 A3 写 spec：Exa API Client。

要求：
1. 先搜索 Exa.ai 官方 API 文档，获取最新的 endpoint、参数、返回格式
2. 写 spec 到 docs/plans/specs/SPEC-A3-exa.md
3. Spec 必须包含：
   - 文件路径（scripts/lib/exa.ts）
   - TypeScript 接口定义
   - 函数：semanticSearch, getContents (full page text), analyzeCompetitors
   - 完整测试计划
   - 错误处理策略
   - 环境变量（EXA_API_KEY）
   - 参考现有 @scripts/lib/brave.ts 的 pattern

参考文档：
- @docs/plans/KEYWORD-ENGINE-MIGRATION.md Phase A → A3
- @docs/STRATEGY.md §4.3-4.4

不要实现，只写 spec。
```

**Step 3b — 执行 Spec：**
```
请执行 @docs/plans/specs/SPEC-A3-exa.md 。

要求：
1. 严格按 spec 实现
2. 写完整的测试（unit + integration）
3. npm test 通过
4. npm run build 通过
5. Commit + push
6. 在 @docs/plans/specs/KEYWORD-ENGINE-LOG.md 记录结果（参考 log 格式见 @docs/plans/KEYWORD-ENGINE-USAGE.md 底部）
```

---

### Step 4: A4 — GSC API Client（需要 spec）

**Step 4a — 写 Spec：**
```
请为 keyword engine migration 的 A4 写 spec：GSC (Google Search Console) API Client。

要求：
1. 先搜索 Google Search Console API 官方文档（searchanalytics.query endpoint），获取最新信息
2. 写 spec 到 docs/plans/specs/SPEC-A4-gsc.md
3. Spec 必须包含：
   - 文件路径（scripts/lib/gsc.ts）
   - TypeScript 接口定义
   - 函数：fetchQueries (date range, filters), segmentByPosition, detectAnomalies, findNewQueries
   - 认证方式（Service Account JSON key）
   - 完整测试计划（mock + integration with real GSC data）
   - Position segmentation logic（1-3, 4-10, 11-20, 21-50, 50+）
   - 环境变量（GSC_SERVICE_ACCOUNT_KEY_PATH, GSC_SITE_URL）

参考文档：
- @docs/plans/KEYWORD-ENGINE-MIGRATION.md Phase A → A4
- @docs/STRATEGY.md §4.9

不要实现，只写 spec。
```

**Step 4b — 执行 Spec：**
```
请执行 @docs/plans/specs/SPEC-A4-gsc.md 。

要求：
1. 严格按 spec 实现
2. 写完整的测试（unit + integration）
3. npm test 通过
4. npm run build 通过
5. Commit + push
6. 在 @docs/plans/specs/KEYWORD-ENGINE-LOG.md 记录结果（参考 log 格式见 @docs/plans/KEYWORD-ENGINE-USAGE.md 底部）
```

---

### Step 5: B1 — Keyword Expansion（需要 spec，依赖 A2+A3 完成）

**Step 5a — 写 Spec：**
```
请为 keyword engine migration 的 B1 写 spec：Keyword Expansion Script。

前置条件：A2 (Serper) 和 A3 (Exa) 已完成。请先读它们的实现了解可用的 API：
- @scripts/lib/serper.ts
- @scripts/lib/exa.ts

要求：
1. 写 spec 到 docs/plans/specs/SPEC-B1-keyword-expansion.md
2. 输入：flagship topic slug + subtopics list
3. 流程：Serper PAA/related/autocomplete → Exa competitor scan → 汇总 raw keywords → 写入 DB
4. 完整测试计划（mock Serper+Exa responses + integration test for Claude Code topic）
5. 参考 @docs/STRATEGY.md §4.3-4.4
6. 参考现有 @scripts/lib/topic-cluster.ts 和 @scripts/extract-entities.ts 的 pattern
7. 参考 @scripts/lib/db.ts 了解 keywords 表结构

参考文档：
- @docs/plans/KEYWORD-ENGINE-MIGRATION.md Phase B → B1

不要实现，只写 spec。
```

**Step 5b — 执行 Spec：**
```
请执行 @docs/plans/specs/SPEC-B1-keyword-expansion.md 。

要求：
1. 严格按 spec 实现
2. 写完整的测试（unit + integration）
3. npm test 通过
4. npm run build 通过
5. Commit + push
6. 在 @docs/plans/specs/KEYWORD-ENGINE-LOG.md 记录结果（参考 log 格式见 @docs/plans/KEYWORD-ENGINE-USAGE.md 底部）
```

---

### Step 6: B2 — Keyword Grouping Skill（需要 spec，依赖 B1）

**Step 6a — 写 Spec：**
```
请为 keyword engine migration 的 B2 写 spec：Keyword Grouping Skill。

前置条件：B1 (Keyword Expansion) 已完成。请先读 B1 的实现了解 keywords 表中的数据格式：
- @scripts/lib/db.ts （keywords 表结构）

要求：
1. 写 spec 到 docs/plans/specs/SPEC-B2-keyword-grouping.md
2. 新 skill: skills/keyword-grouping/SKILL.md（遵循现有 skill 的 SKILL.md 格式，参考 @skills/seo/SKILL.md ）
3. Runner script: scripts/group-keywords.ts
4. 输入：某 subtopic 下的 raw keywords（从 DB 读）
5. 输出：keyword_groups 表（primary keyword, secondary keywords, intent, content_type）
6. Claude call 的 prompt 设计
7. 完整测试（mock Claude response + 验证 grouping 质量）
8. 参考 @docs/STRATEGY.md §4.4 的 grouping 示例

参考文档：
- @docs/plans/KEYWORD-ENGINE-MIGRATION.md Phase B → B2

不要实现，只写 spec。
```

**Step 6b — 执行 Spec：**
```
请执行 @docs/plans/specs/SPEC-B2-keyword-grouping.md 。

要求：
1. 严格按 spec 实现
2. 写完整的测试（unit + integration）
3. npm test 通过
4. npm run build 通过
5. Commit + push
6. 在 @docs/plans/specs/KEYWORD-ENGINE-LOG.md 记录结果（参考 log 格式见 @docs/plans/KEYWORD-ENGINE-USAGE.md 底部）
```

---

### Step 7: B3 — Priority Scoring + Queue（需要 spec，依赖 B2）

**Step 7a — 写 Spec：**
```
请为 keyword engine migration 的 B3 写 spec：Priority Scoring + Unified Queue。

前置条件：B1+B2 已完成。请先读它们的实现了解 keyword_groups 表的结构：
- @scripts/lib/db.ts （keyword_groups 和 create_queue 表结构）

要求：
1. 写 spec 到 docs/plans/specs/SPEC-B3-priority-scoring.md
2. 纯计算逻辑：volume × (1/competition) × intent_multiplier + timeliness_bonus
3. Queue routing: intent + SERP depth → content_type + research_pipeline
4. 必须有大量单元测试（各种 edge case: volume=0, 新 keyword 无 competition 数据, timeliness decay）
5. 参考 @docs/STRATEGY.md §4.5

参考文档：
- @docs/plans/KEYWORD-ENGINE-MIGRATION.md Phase B → B3

不要实现，只写 spec。
```

**Step 7b — 执行 Spec：**
```
请执行 @docs/plans/specs/SPEC-B3-priority-scoring.md 。

要求：
1. 严格按 spec 实现
2. 写完整的测试（unit + integration）
3. npm test 通过
4. npm run build 通过
5. Commit + push
6. 在 @docs/plans/specs/KEYWORD-ENGINE-LOG.md 记录结果（参考 log 格式见 @docs/plans/KEYWORD-ENGINE-USAGE.md 底部）
```

---

### Step 8: B4 — Source-Grounded Generation（需要 spec，依赖 A2+A3+B3）

**Step 8a — 写 Spec：**
```
请为 keyword engine migration 的 B4 写 spec：Source-Grounded Content Generation。

前置条件：A2 (Serper), A3 (Exa), B3 (Queue) 已完成。请先读它们的实现：
- @scripts/lib/serper.ts
- @scripts/lib/exa.ts
- @scripts/lib/db.ts （create_queue 表结构）

要求：
1. 写 spec 到 docs/plans/specs/SPEC-B4-content-generation.md
2. Standard pipeline: Serper → Exa getContents → Claude + skill
3. Deep Research pipeline: Gemini → Claude + skill
4. 统一入口：read from create_queue → dispatch by content_type
5. Post-generation link validation
6. EN + ZH 双语生成
7. 测试：mock 整个 pipeline（mock Serper, Exa, Claude responses），验证输出 markdown 格式
8. 参考现有 @scripts/generate-seo.ts 和 @skills/seo/SKILL.md 的 pattern

参考文档：
- @docs/plans/KEYWORD-ENGINE-MIGRATION.md Phase B → B4
- @docs/STRATEGY.md §4.6-4.7

不要实现，只写 spec。
```

**Step 8b — 执行 Spec：**
```
请执行 @docs/plans/specs/SPEC-B4-content-generation.md 。

要求：
1. 严格按 spec 实现
2. 写完整的测试（unit + integration）
3. npm test 通过
4. npm run build 通过
5. Commit + push
6. 在 @docs/plans/specs/KEYWORD-ENGINE-LOG.md 记录结果（参考 log 格式见 @docs/plans/KEYWORD-ENGINE-USAGE.md 底部）
```

---

### Step 9: C1 — Discovery Cycle（需要 spec，依赖 Phase B 全部完成）

**Step 9a — 写 Spec：**
```
请为 keyword engine migration 的 C1 写 spec：Discovery Cycle Script。

前置条件：Phase B 全部完成。请先读 B1-B4 的实现了解各模块的 API：
- @scripts/lib/serper.ts
- @scripts/lib/exa.ts
- @scripts/lib/db.ts

要求：
1. 写 spec 到 docs/plans/specs/SPEC-C1-discovery-cycle.md
2. 编排流程：subtopic discovery → keyword expansion (B1) → grouping (B2) → scoring (B3) → queue
3. 周六 cron + event-triggered 模式
4. 支持增量发现（不重复已有 keywords）
5. 测试：mock 整个流程 + integration test on Claude Code topic
6. 参考 @docs/STRATEGY.md §4.3 和 §4.10

参考文档：
- @docs/plans/KEYWORD-ENGINE-MIGRATION.md Phase C → C1

不要实现，只写 spec。
```

**Step 9b — 执行 Spec：**
```
请执行 @docs/plans/specs/SPEC-C1-discovery-cycle.md 。

要求：
1. 严格按 spec 实现
2. 写完整的测试（unit + integration）
3. npm test 通过
4. npm run build 通过
5. Commit + push
6. 在 @docs/plans/specs/KEYWORD-ENGINE-LOG.md 记录结果（参考 log 格式见 @docs/plans/KEYWORD-ENGINE-USAGE.md 底部）
```

---

### Step 10: C2 — Newsletter as Graph Consumer（直接做）

```
请执行 keyword engine migration 的 C2：Newsletter 变为 Graph Consumer。

要求：
1. 修改 @scripts/write-newsletter.ts ，让 blog seed extraction 变为可选
2. Newsletter 仍独立跑，但不再作为 SEO content 的 gatekeeper
3. 新增：newsletter 能读取最近发布的 cluster pages（从 content 表查最近 7 天新增的 SEO pages）
4. 确保现有 newsletter 功能不 break
5. npm test 通过
6. Commit + push

参考：
- @docs/STRATEGY.md §4.8 和 §9
- @docs/plans/KEYWORD-ENGINE-MIGRATION.md Phase C → C2
- @scripts/lib/db.ts （content 表结构）
```

---

### Step 11: C3 — Performance Loop（需要 spec）

**Step 11a — 写 Spec：**
```
请为 keyword engine migration 的 C3 写 spec：Performance Loop。

前置条件：A4 (GSC) 已完成。请先读 GSC client 的实现：
- @scripts/lib/gsc.ts

要求：
1. 写 spec 到 docs/plans/specs/SPEC-C3-performance-loop.md
2. 周二 cron：GSC import → position segmentation → anomaly detection → refresh queue
3. Anomaly types: high impressions/low CTR, position drops, new queries
4. 输出：refresh actions 写入 create_queue
5. Striking distance optimization（position 11-20）
6. 测试：mock GSC data + 验证各 anomaly detection 逻辑
7. 参考 @docs/STRATEGY.md §4.9

参考文档：
- @docs/plans/KEYWORD-ENGINE-MIGRATION.md Phase C → C3
- @scripts/lib/db.ts （create_queue 表结构）

不要实现，只写 spec。
```

**Step 11b — 执行 Spec：**
```
请执行 @docs/plans/specs/SPEC-C3-performance-loop.md 。

要求：
1. 严格按 spec 实现
2. 写完整的测试（unit + integration）
3. npm test 通过
4. npm run build 通过
5. Commit + push
6. 在 @docs/plans/specs/KEYWORD-ENGINE-LOG.md 记录结果（参考 log 格式见 @docs/plans/KEYWORD-ENGINE-USAGE.md 底部）
```

---

### Step 12: C4 — Daily Pipeline 重组（直接做）

```
请执行 keyword engine migration 的 C4：Daily Pipeline 重组。

要求：
1. 新建 scripts/process-queue.ts（从 create_queue 取 top N，调用 B4 的 generation pipeline）
2. 修改 @scripts/daily-pipeline.sh ，新流程：
   - 4am: @scripts/collect-news.ts （不变）
   - 5am: @scripts/write-newsletter.ts （不变）
   - 7am: process-queue.ts（新，替代 @scripts/write-blog.ts + @scripts/generate-seo.ts ）
   - Saturday: discovery-cycle.ts（新）
   - Tuesday: performance-cycle.ts（新）
3. 保留 @scripts/write-blog.ts 和 @scripts/generate-seo.ts 文件但从 cron 中移除
4. npm test 通过
5. Commit + push

参考：
- @docs/plans/KEYWORD-ENGINE-MIGRATION.md Phase C → C4
- @scripts/lib/db.ts （create_queue 表结构）
```

---

## Testing Strategy（贯穿所有 spec）

每个 spec 必须定义三层测试：

| Layer | 什么 | 工具 | 何时跑 |
|-------|------|------|--------|
| **Unit tests** | 纯函数逻辑（scoring, segmentation, parsing） | Vitest + mock | 每次 `npm test` |
| **Integration tests** | API client 调真实 API | Vitest + `.skip` (需 API key) | 手动 `npm test -- --run serper.integration` |
| **E2E validation** | 完整 pipeline 跑一遍 | 手动 script | VPS 上验证 |

### Unit test 设计原则
- 每个公开函数至少 3 个 test case（happy path, edge case, error case）
- Mock 所有外部依赖（API calls, DB, file system）
- 测试输出的 shape（TypeScript type 匹配），不只测 truthy

### Integration test 设计原则
- 用 `describe.skipIf(!process.env.SERPER_API_KEY)` 保护
- 测真实 API 返回的 shape 和内容合理性
- 记录 API response samples 到 `__tests__/fixtures/` 作为未来 mock 数据

### E2E validation 设计原则
- 在 VPS 上跑完整 pipeline（从 keyword expansion → grouping → scoring → generation）
- Human review 生成的内容质量

---

## Execution Log 格式

所有执行结果记录在 `@docs/plans/specs/KEYWORD-ENGINE-LOG.md`，每个 step 追加：

```markdown
## [Step ID] — [Module Name]
- **Date:** YYYY-MM-DD
- **Status:** COMPLETED / FAILED / PARTIAL
- **Files created/modified:**
  - scripts/lib/serper.ts (new)
  - scripts/lib/__tests__/serper.test.ts (new)
- **Tests:** X passed, Y failed
- **Build:** pass/fail
- **Integration test result:** (用真实数据的验证结果)
- **Decisions & deviations:** (任何偏离 spec 的决策)
- **Blockers:** (如有)
- **Insights for next step:** (学到的影响后续 spec 的 insight)
```

---

## Quick Reference — 依赖关系

```
Step 1:  A1 (schema)         — 无依赖，直接做
Step 2:  A2 (serper)         — 依赖 A1
Step 3:  A3 (exa)            — 依赖 A1（可与 A2 并行）
Step 4:  A4 (gsc)            — 依赖 A1（可与 A2/A3 并行）
Step 5:  B1 (expansion)      — 依赖 A2 + A3
Step 6:  B2 (grouping)       — 依赖 B1
Step 7:  B3 (scoring)        — 依赖 B2
Step 8:  B4 (generation)     — 依赖 A2 + A3 + B3
Step 9:  C1 (discovery)      — 依赖 B1 + B2 + B3
Step 10: C2 (newsletter)     — 依赖 B4
Step 11: C3 (performance)    — 依赖 A4
Step 12: C4 (pipeline reorg) — 依赖 C1 + C2 + C3
```

**可并行的 steps：** A2/A3/A4 可以并行写 spec 和实现；C1/C2/C3 在各自前置完成后也可并行。
