---
title: "Cursor — 你需要知道的一切"
slug: cursor
description: "Cursor 完全指南：基于 VS Code 的 AI 代码编辑器，功能、定价与资源汇总。"
pillar_topic: Cursor
category: tools
related_glossary: [agentic, anthropic, agent-teams]
related_blog: [claude-code-extension-stack-skills-hooks-agents-mcp, mcp-vs-cli-vs-skills-extend-claude-code]
related_compare: []
related_faq: []
lang: zh
---

# Cursor — 你需要知道的一切

**Cursor** 是一款基于 VS Code 的 AI 代码编辑器，由 Anysphere 开发。它把大语言模型的能力直接嵌入编辑器——自动补全、内联编辑、代码对话、多文件重构，全部在一个 IDE 里完成。与终端型 AI 工具不同，Cursor 保留了开发者熟悉的图形化编辑体验，同时在每一个操作节点注入 AI 辅助。自 2023 年发布以来，Cursor 迅速成为 AI 辅助编程领域最受欢迎的工具之一，尤其受前端和全栈开发者青睐。

## 最新动态

2026 年初，Cursor 持续迭代核心功能。**Background Agent**（后台代理）功能让 Cursor 能在云端独立完成多步骤编码任务，开发者可以同时处理其他工作。**BugBot** 自动对 PR 进行代码审查，直接在 GitHub 上留下评论。模型层面，Cursor 支持多模型切换——Claude、GPT-4o、Gemini 等——用户可根据任务场景选择最合适的模型。

这些更新标志着 Cursor 正从单纯的「AI 补全编辑器」向 [agentic](/glossary/agentic) 工作流演进。关于 AI 编码工具的 agentic 趋势，我们在[Claude Code 扩展栈深度解析](/blog/claude-code-extension-stack-skills-hooks-agents-mcp)中有详细分析。

## 核心功能

- **Tab 智能补全**：不只是补全当前行，Cursor 的 Tab 功能能预测你接下来要做的多步编辑，包括跨行修改和光标跳转
- **Cmd+K 内联编辑**：选中代码，用自然语言描述修改意图，AI 直接生成 diff——无需离开编辑区
- **Chat 对话**：侧边栏聊天窗口具备完整的代码库上下文，可以引用文件、符号、文档进行技术讨论
- **Composer 多文件编辑**：一次描述跨多个文件的修改需求，Cursor 统一规划并生成变更
- **多模型支持**：内置 Claude（[Anthropic](/glossary/anthropic)）、GPT-4o、Gemini 等模型，按需切换
- **@引用系统**：通过 `@file`、`@symbol`、`@docs`、`@web` 精确控制 AI 的上下文范围
- **隐私模式**：开启后代码不会用于模型训练，适合企业和敏感项目

Cursor 继承了 VS Code 的完整生态——扩展商店、快捷键、主题和设置几乎无缝迁移。

## 常见问题

- **Cursor 和 VS Code 什么关系？**：Cursor 是 VS Code 的 fork，保留了所有原生功能，在此基础上深度集成 AI
- **Cursor 免费吗？**：提供免费版（有限补全次数），Pro 版 $20/月，Business 版 $40/月
- **Cursor 支持哪些语言？**：支持所有 VS Code 支持的编程语言，AI 功能对 Python、TypeScript、Go 等主流语言效果最佳

## Cursor 与其他工具的对比

AI 编码工具市场竞争激烈。Cursor 的定位是**编辑器内置 AI**，而 [Claude Code](/glossary/agentic) 等工具走的是**终端 agent** 路线。两种方式各有优势——Cursor 适合需要视觉反馈和逐行控制的场景，终端 agent 适合大规模自动化任务。详见我们的 [AI 编码工具扩展方式对比](/blog/mcp-vs-cli-vs-skills-extend-claude-code)。

## 全部 Cursor 资源

### 博客文章
- [Claude Code 扩展栈：Skills、Hooks、Agents 与 MCP](/blog/claude-code-extension-stack-skills-hooks-agents-mcp)
- [MCP vs CLI vs Skills：扩展 AI 编码工具的三种方式](/blog/mcp-vs-cli-vs-skills-extend-claude-code)

### 术语表
- [Agentic](/glossary/agentic) — AI agent 化的工作流范式
- [Anthropic](/glossary/anthropic) — Claude 模型背后的 AI 安全公司
- [Agent Teams](/glossary/agent-teams) — 多 agent 并行协作机制

---

*觉得有用？[订阅 LoreAI](/subscribe)，每天 5 分钟掌握 AI 动态。*