---
title: "Claude Code — 你需要知道的一切"
slug: claude-code
description: "Claude Code 完整指南：功能、使用场景与最新动态。"
pillar_topic: Claude Code
category: tools
related_glossary: [claude-code, anthropic, claude, agentic]
related_blog: [anthropic-cowork-claude-desktop-agent, anthropic-claude-memory-upgrades-importing]
related_compare: []
related_faq: []
lang: zh
---

# Claude Code — 你需要知道的一切

**[Claude Code](/glossary/claude-code)** 是 [Anthropic](/glossary/anthropic) 推出的终端 AI 编程智能体。与 IDE 内的代码补全工具不同，Claude Code 直接在命令行中运行，作为一个完整的自主代理——它能读取整个项目结构、规划多步骤任务、执行 shell 命令、跨文件编辑代码并提交变更。基于 [Claude](/glossary/claude) 模型构建，它利用扩展上下文窗口和工具调用能力处理复杂的工程任务。对于习惯终端工作流的开发者来说，Claude Code 正在重新定义人机协作写代码的方式——你不再逐行指导 AI，而是描述目标，让它自主完成从分析到实现的完整流程。

## 最新动态

2026 年初，Anthropic 对 Claude Code 进行了密集更新。**Agent Teams（智能体团队）** 功能允许 Claude Code 生成子代理并行执行任务，这对大型 monorepo 的重构至关重要。**记忆升级**让 Claude Code 能在会话之间保持上下文，减少重复配置。最新的[桌面代理能力](/blog/anthropic-cowork-claude-desktop-agent)将 Claude Code 的能力从终端扩展到了 GUI 交互，开启了 Cowork 模式的新可能。

我们在博客中详细报道了[记忆导入功能](/blog/anthropic-claude-memory-upgrades-importing)，包括它如何改变结对编程的工作流。更多日常更新，请查看我们的[每日简报](/newsletter/2026-03-04)。

## 核心功能与能力

**项目上下文系统**是 Claude Code 的基础。通过 CLAUDE.md 文件，你可以定义项目级别的指令——编码规范、架构决策和约束条件，这些配置在会话之间持续生效。配合 SKILL.md 技能文件，团队可以将工程标准编码为可复用的指令集，确保 AI 在不同成员间表现一致。

**完整的 Shell 访问权限**意味着 Claude Code 能运行任何终端命令：构建工具、测试运行器、代码检查器、部署脚本，全部在用户授权下执行。这不是一个沙盒化的代码补全器，而是一个真正的[自主代理](/glossary/agentic)。

**多文件编辑**是 Claude Code 与传统 IDE 插件的关键区别。它能在一次会话中规划并执行跨整个代码库的变更——重命名模块、更新所有导入、修复相关测试，一个指令完成。

**Git 集成**贯穿整个工作流。Claude Code 能暂存文件、创建结构化的提交信息、发起 Pull Request 并推送代码，完全遵循你仓库的约定。

**MCP 服务器**通过 Model Context Protocol 连接外部工具——数据库、API、监控系统，将 Claude Code 的能力从代码编辑扩展到完整的开发运维场景。

## 常见问题

- **Claude Code 和 Cursor 有什么区别？** Claude Code 是终端自主代理，Cursor 是 AI 增强的 IDE 编辑器。前者擅长多文件自主任务，后者擅长逐行编辑辅助。许多开发者两者搭配使用
- **Claude Code 怎么收费？** 基于 API 用量按 token 计费，没有固定月费。具体成本取决于项目复杂度和使用频率
- **Claude Code 支持 Windows 吗？** 目前原生支持 macOS 和 Linux，Windows 用户可通过 WSL 使用

## Claude Code 对比

目前我们还没有发布 Claude Code 的对比页面。以下是值得关注的对比维度：

- **Claude Code vs Cursor**：终端代理 vs AI 增强 IDE——两种截然不同的 AI 辅助编程范式
- **Claude Code vs GitHub Copilot**：自主工作流 vs 代码补全——交互模型的根本差异

## 所有 Claude Code 资源

### 博客文章
- [Anthropic 桌面代理与 Cowork 模式](/blog/anthropic-cowork-claude-desktop-agent)
- [Claude 记忆升级：跨会话导入上下文](/blog/anthropic-claude-memory-upgrades-importing)

### 术语表
- [Claude Code](/glossary/claude-code) — Anthropic 的终端 AI 编程智能体
- [Claude](/glossary/claude) — Anthropic 的大语言模型系列
- [Anthropic](/glossary/anthropic) — 专注 AI 安全的公司
- [Agentic](/glossary/agentic) — AI 代理式工作模式

### 每日简报
- [2026 年 3 月 4 日 — AI 每日速递](/newsletter/2026-03-04)

---

*觉得有用？[订阅 LoreAI](/subscribe)，每天 5 分钟掌握 AI 动态。*