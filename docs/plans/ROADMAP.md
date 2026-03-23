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

**现状**: Extract pipeline 每天从新闻中提取实体，创建 topic_clusters 记录（334个），但只追踪 mention_count。Discovery pipeline 只在手动配置的 2 个 flagship topic（Claude Code、Codex）上运行。两者之间没有桥梁。

**未来方向**: 当某个 topic 的 mention_count 在 7 天内超过阈值（如 ≥8），自动触发一轮 discovery cycle（关键词扩展 → 分组 → 评分）。如果关键词量足够（如 ≥20 个可用关键词），自动晋升为活跃 flagship topic，加入定期 discovery 轮换。

**关键设计决策**:
- 晋升阈值：纯 mention_count 还是按 tier 加权？
- 活跃 flagship 上限：API 成本约束，建议 10-15 个
- 降级机制：长期无新提及的 topic 是否退出 discovery 轮换？
- Dashboard 过滤：无论是否实现自动晋升，dashboard 应只显示活跃 flagship

**为什么现在不做**:
- 需要先解决 keyword grouping 质量问题（Haiku 幻觉、Exa 垃圾关键词）
- 需要更多数据验证当前 2 个 flagship 的 ROI
- 设计决策需要人工判断（哪些 topic 值得投入）

**触发条件**: 当手动管理 flagship topic 成为瓶颈、或内容覆盖率需要显著扩展时。
