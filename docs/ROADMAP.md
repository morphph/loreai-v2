---
title: "Roadmap — Future Enhancements"
status: active
category: roadmap
last-updated: 2026-04-01
depends-on: []
---

# Roadmap — Future Enhancements

> Living document. 对话中发现的"现在不做、将来值得做"的优化方向。
> 不是 spec，不是 strategy，是 what-next ideas。

---

## SEO: Sub-agent 自主链接策略

**现状**: Pipeline 脚本 + Skill prompt 负责关键词优化和内链插入，链接目标由脚本预计算后注入 prompt。

**未来方向**: 让 sub-agent 自主决定链接策略 —— agent 拥有站点地图上下文，能在生成内容时自主选择最佳锚文本和链接目标，而非依赖预计算的链接列表。

**为什么现在不做**:
- 当前 Pipeline + Skill 方案已能覆盖需求
- Sub-agent 自主链接需要更成熟的 agent 框架和更多 context window
- 需要先积累足够的内链效果数据来评估收益

**触发条件**: 当内链覆盖率或锚文本质量成为瓶颈时重新评估。

---

## Auto-Promotion: Extract → Discovery 自动晋升

**现状 (updated 2026-03-27)**: D1 (Flagship Discovery) 和 D2 (Migration Guard) 已上线。`topic_clusters.source` 列区分 `flagship_discovery` vs `entity_extract`。Entity extraction 自动跳过 flagship subtopics（`isFlagshipSubtopic` 三层检查）。Discovery cycle 的 `loadSubtopics()` 优先使用 approved flagship packs。目前手动配置 2 个 flagship topic（Claude Code、Codex）。

**未来方向**: 当某个 topic 的 mention_count 在 7 天内超过阈值（如 ≥8），自动触发一轮 full discovery（official docs + competitor synthesis）。如果 subtopic 数量和关键词量足够，自动晋升为活跃 flagship topic，加入定期 freshness + discovery 轮换。

**关键设计决策**:
- 晋升阈值：纯 mention_count 还是按 tier 加权？
- 活跃 flagship 上限：API 成本约束，建议 10-15 个
- 降级机制：长期无新提及的 topic 是否退出 discovery 轮换？
- Dashboard 过滤：无论是否实现自动晋升，dashboard 应只显示活跃 flagship

**基础设施已就绪**:
- `source` 列 + `flagship_topic_slug` 列已存在（D1 Phase 1）
- Entity extraction guard 已就绪（D2）— 新 flagship 一旦 approved 即自动被 guard 保护
- `materializePack()` + `approvePack()` 可直接复用
- C5 health check `flagship_pack_status` 会自动监控新 flagship

**为什么现在不做**:
- 需要更多数据验证当前 2 个 flagship 的 ROI
- 设计决策需要人工判断（哪些 topic 值得投入）

**触发条件**: 当手动管理 flagship topic 成为瓶颈、或内容覆盖率需要显著扩展时。

---

## Cross-Cluster Keyword Dedup at Content Generation

**现状 (2026-04-01)**: B2 grouping happens per-cluster, so the same search intent can produce separate keyword groups in different clusters. Example: "codex vs claude code" (cluster: codex, score 6000), "claude code vs codex" (cluster: claude-code, score 1500), and "codex cli vs claude code" (cluster: codex-cli, score 1050) are three separate queue jobs that would generate three nearly identical compare pages.

**Known duplicates found in queue audit**:
- Claude Code vs Codex — 4 groups across 3 clusters
- Claude Code vs Copilot — 3 groups across 3 clusters
- Plugin vs Skill — 3 groups (codex-plugins, codex-skills, claude-code-plugins)
- Claude Code vs Windsurf — 2 groups

**未来方向**: Add a dedup step in `process-queue.ts` before content generation:
1. When picking a job from the queue, fuzzy-match the primary keyword against other pending jobs (e.g., normalize "A vs B" ↔ "B vs A", strip "cli"/"app" suffixes)
2. If overlapping jobs found, merge their secondary keywords into one content brief
3. Mark the duplicates as `merged_into = <job_id>` instead of generating separately
4. Generate one page targeting all merged keywords

**Alternative**: Do dedup at B3 scoring time — when inserting into `create_queue`, check for existing pending jobs with similar primary keywords and merge before queuing.

**为什么现在不做**:
- Current queue (344 items) is manageable — can handle manually for the first batch
- Needs fuzzy matching logic + merge strategy design
- Should validate with real generation data first

**触发条件**: When the queue grows past ~500 items again after next discovery cycle, or when duplicate content pages are detected in production.
