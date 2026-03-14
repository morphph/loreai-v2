---
title: "Claude Code 代码审查功能详解：多 Agent 协作的 PR Review 新范式"
date: 2026-03-11
slug: claude-code-review-agents
description: "Claude Code 推出多 Agent 代码审查功能，自动对每个 PR 进行深度 Review。Anthropic 工程师代码产出增长 200%，审查成为瓶颈后内部先行打造的解决方案。"
keywords: ["Claude Code review", "AI 代码审查", "Claude Code agents", "PR review"]
category: DEV
related_newsletter: 2026-03-11
related_glossary: [claude-code, code-review]
related_compare: []
related_topics: [claude-code]
lang: zh
video_ready: true
video_hook: "Anthropic 工程师产出涨了 200%，瓶颈不是写代码，是 Review"
video_status: none
---

# Claude Code 代码审查功能详解：多 Agent 协作的 PR Review 新范式

**Claude Code** 上线了原生代码审查功能——一组 Agent 协同工作，对每个 PR 进行深度 Review。这不是实验性功能，而是 Anthropic 内部先用了几周、验证有效后才开放的工具。背景很直接：今年 Anthropic 工程师的代码产出增长了 200%，Review 成了最大瓶颈。当 AI 帮你写代码的速度远超人类审查的速度，审查环节本身就需要 AI 介入。

## 发生了什么

Anthropic 的 Claude Code 团队负责人 Boris Cherny [在推文中宣布](https://x.com/bcherny/status/2031089411820228645)：**Claude Code** 新增 Code Review 功能，采用多 Agent 架构，对每个 Pull Request 自动执行深度审查。

关键信息：这个功能是 Anthropic 先给自己用的。随着 AI 辅助编码的普及，Anthropic 内部工程师的代码产出今年增长了 200%。产出飙升后，人工 Review 跟不上了——PR 排队等审查，合并周期被拉长，Review 质量也难保证。于是团队把 Review 本身也交给了 Agent。

Boris 本人已经用了几周，反馈是"它能捕获很多问题"。结合近期 Claude Code 密集更新的节奏——[HTTP Hooks](https://x.com/bcherny/status/2029339111212126458) 提升集成安全性、[/simplify 和 /batch Skills](https://x.com/bcherny/status/2027534984534544489) 自动化 PR 流程、[Remote 模式](https://x.com/bcherny/status/2027462787358949679)上线——可以看出 Anthropic 正在把 Claude Code 从"写代码的助手"推向"端到端工程协作平台"。

## 为什么重要

代码审查是软件工程中最吃高级工程师时间的活动之一。一个资深工程师花在 Review 上的时间，往往占工作日的 30%-50%。当团队开始大量使用 AI 辅助编码后，PR 数量和代码量同步激增，Review 压力成倍增长。

这不只是 Anthropic 的问题。[Shopify、Ramp、Rakuten 等公司](https://x.com/bcherny/status/2028638679204577380)都在大规模采用 Claude Code，面临同样的瓶颈：AI 写得快，人审不过来。

多 Agent Review 的思路很巧妙。不是一个模型从头到尾看一遍，而是多个专注不同维度的 Agent 各司其职——安全漏洞、性能问题、代码风格、逻辑错误——然后汇总结果。这比单次 LLM 调用能覆盖更多维度，也更可靠。

对比现有方案：GitHub Copilot 有 PR 摘要功能但审查深度有限；[Cursor](/glossary/cursor) 专注编辑器内体验，不涉及 Review 流程；CodeRabbit 等第三方工具需要额外集成。Claude Code 的优势在于审查和编码用同一个工具链，Agent 理解你的项目上下文（通过 [CLAUDE.md](/glossary/claude-md) 和 Skills 系统），Review 标准可以跟着仓库走。

## 技术细节

从已公开的信息和 Claude Code 的架构推断，这个多 Agent Review 系统大概率基于以下设计：

**多 Agent 并行架构**：每个 PR 触发一组 Agent，分别负责不同审查维度。这和 Claude Code 最近推出的 `/batch` 技能理念一致——把大任务拆成多个并行子任务，各自独立执行后汇总。

**项目上下文感知**：通过 CLAUDE.md 和 Skills 系统，Review Agent 能读取项目级别的编码规范、测试要求和架构约束。这意味着它不是通用的"这段代码看起来不对"，而是"这段代码违反了你们项目的 X 规范"。

**与 HTTP Hooks 集成**：近期上线的 [HTTP Hooks](https://x.com/bcherny/status/2029339111212126458) 功能让 Claude Code 可以安全地与外部服务交互。Code Review 功能很可能通过 Hooks 接入 GitHub/GitLab 的 PR 事件，实现自动触发。

需要注意的局限性：

- AI Review 目前更擅长捕获模式化的问题（安全漏洞、性能反模式、风格不一致），对业务逻辑正确性的判断仍然依赖人类
- 多 Agent 意味着更高的 [Token](/glossary/token) 消耗，大 PR 的审查成本需要关注
- 这是对人工 Review 的增强而非替代——最终合并决策仍应由人做出

## 你现在该做什么

1. **确保项目有完善的 CLAUDE.md**。Review Agent 的质量直接取决于项目上下文的丰富程度。把编码规范、架构约束、安全要求写进去。
2. **关注 Claude Code 更新**，Code Review 功能正在逐步开放。如果你是 Pro 用户，结合已上线的 [Claude Code Remote](https://x.com/bcherny/status/2027462787358949679) 可以在任何设备上使用。
3. **重新审视团队的 Review 流程**。哪些审查维度可以交给 AI（风格、安全、性能），哪些必须人工把关（业务逻辑、架构决策）？提前想清楚，才能在功能到位时快速落地。
4. **试用 /simplify 技能**。在 Code Review 之前先用 `/simplify` 自动优化代码质量，减少 Review 中的低级问题，让 AI 和人类审查者都聚焦在高价值问题上。

**相关阅读**：[今日简报](/newsletter/2026-03-11) 有更多 Claude Code 动态。另见：[Claude Code Skills 系统指南](/blog/claude-code-skills-guide)。

---

*觉得有用？[订阅 AI 简报](/subscribe)，每天 5 分钟掌握 AI 动态。*