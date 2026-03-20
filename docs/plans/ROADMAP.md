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
