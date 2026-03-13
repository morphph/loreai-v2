---
title: "Claude 登陆 Excel 和 PowerPoint：Skills 系统和跨应用上下文共享来了"
date: 2026-03-13
slug: claude-excel-powerpoint-skills-context
description: "Claude 在 Excel 和 PowerPoint 中新增 Skills 支持和跨应用上下文共享，办公场景的 AI 集成从「能用」迈向「好用」。"
keywords: ["Claude Excel", "Claude PowerPoint", "Claude Skills", "AI 办公"]
category: APP
related_newsletter: 2026-03-13
related_glossary: [claude, skill-md]
related_compare: [claude-vs-chatgpt]
lang: zh
video_ready: true
video_hook: "Claude 在 Office 里终于不是孤岛了"
video_status: none
---

# Claude 登陆 Excel 和 PowerPoint：Skills 系统和跨应用上下文共享来了

**Claude** 在 Excel 和 PowerPoint 中迎来两项关键更新：跨应用上下文共享和 **Skills** 系统支持。这意味着 Claude 在处理你的表格时，能同时理解你演示文稿里的内容；而 Skills 则让你把团队的工作规范注入 AI，确保输出一致。更新不大，但方向很对 — AI 办公集成正在从「每个文件里单独聊」走向「理解你整个工作流」。

## 发生了什么

Anthropic 工程师 [Felix Rieseberg 宣布](https://x.com/felixrieseberg/status/2031823821561610532)，Claude 在 Excel 和 PowerPoint 插件中同时上线了两项功能：

**跨应用上下文共享**：Excel 和 PowerPoint 之间现在可以共享上下文。实际效果是，当你在 PowerPoint 里让 Claude 生成季度汇报时，它能直接引用你 Excel 里的数据表，不需要你手动复制粘贴数据再描述一遍。反过来，在 Excel 里做数据分析时，Claude 也能参考演示文稿中的业务目标和框架。

**Skills 支持**：这是此前 [Claude Code](/glossary/claude-code) 的核心功能，现在扩展到了办公套件。通过 Skills，你可以定义 Claude 在特定任务中的行为规范 — 报告格式、数据处理规则、输出模板等。团队共享一套 Skills，所有人得到风格一致的 AI 输出。

这两个更新配合 Anthropic 上周发布的 [Cowork 定时任务功能](https://x.com/claudeai/status/2026720870631354429)，Claude 的办公场景能力正在快速补齐。

## 为什么重要

AI 办公插件最大的痛点不是"不够聪明"，而是**上下文割裂**。你在 Excel 里有销售数据，在 PowerPoint 里做汇报，在 Word 里写分析 — 每个应用里的 AI 助手都是独立的，不知道其他文件里有什么。你得反复复制数据、重新解释背景，体验碎片化。

跨应用上下文共享直接解决这个问题。一个季度汇报的典型工作流是：Excel 整理数据 → PowerPoint 做演示 → 最终呈现。现在 Claude 能贯穿这个流程，而不是在每个环节都从零开始。

**Skills** 的意义同样重大。没有 Skills 时，同一个团队里 10 个人让 Claude 做周报，会得到 10 种不同的格式和风格。有了 Skills，你定义一次"周报应该长什么样"，所有人的输出自动对齐。这对企业用户来说是刚需 — 一致性比创意更重要。

对比来看，微软 Copilot 在 Microsoft 365 中天然有跨应用上下文（毕竟是自家生态），但缺乏类似 Skills 的行为定制能力。Google Gemini 在 Workspace 中的集成也主要停留在单文件维度。Claude 的策略是用 Skills 这个差异化能力弥补生态劣势。

## 技术细节

**Skills 系统**的工作方式延续了 Claude Code 中的设计：用结构化的 Markdown 文件（[SKILL.md](/glossary/skill-md)）定义指令集，包含语气规范、输出模板、校验规则和标准示例。在办公场景下，一个典型的 Skill 可能这样定义：

```markdown
# 周报生成

## 格式
- 标题：{部门} 周报 - {日期范围}
- 必须包含：本周完成、下周计划、风险项
- 数据引用必须标注来源工作表

## 规则
- 数字保留两位小数
- 同比/环比变化必须标注百分比
- 不使用主观评价词
```

跨应用上下文的实现细节尚未公开，但从产品行为推断，大概率是在插件层面维护一个共享的上下文池，不同应用的 Claude 实例可以读取其中的摘要信息。这和 Claude Code 中多文件上下文的处理思路类似 — 不是把所有文件全文塞进上下文窗口，而是提取关键信息做索引。

一个需要注意的限制：目前上下文共享仅限 Excel 和 PowerPoint 之间，Word 等其他 Office 应用暂未提及。此外，Skills 在办公套件中的管理方式（是通过文件系统还是插件设置面板）也需要等正式文档确认。

## 你现在该做什么

1. **更新 Excel 和 PowerPoint 的 Claude 插件**到最新版本，体验跨应用上下文。最直接的测试：在 Excel 里准备一份数据，然后在 PowerPoint 里让 Claude 基于这些数据生成图表或摘要。
2. **为你团队最常见的办公任务写 Skills**。优先级：周报/月报模板 > 数据分析规范 > 演示文稿风格。从最具体的场景开始，不要一上来就写通用 Skill。
3. **关注 Anthropic 后续的 Office 集成动态**。Word 和 Outlook 的支持大概率在路线图上。如果你的工作流重度依赖这些应用，现在可以先在 Excel + PowerPoint 上验证 Skills 的效果。
4. **对比你现有的 AI 办公方案**。如果你在用 Microsoft Copilot，评估一下 Claude Skills 的定制能力是否值得切换或并行使用。

**相关阅读**：[今日简报](/newsletter/2026-03-13) 有更多 AI 动态。另见：[Claude Code Skills 系统指南](/blog/claude-code-skills-guide)。

---

*觉得有用？[订阅 AI 简报](/subscribe)，每天 5 分钟掌握 AI 动态。*