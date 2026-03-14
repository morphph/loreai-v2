---
title: "MCP（Model Context Protocol）— 你需要知道的一切"
slug: mcp
description: "MCP 完全指南：Anthropic 推出的模型上下文协议，让 AI 工具连接外部数据源和服务的开放标准。"
pillar_topic: MCP
category: frameworks
related_glossary: [mcp, agentic, anthropic, claude]
related_blog: [claude-code-extension-stack-skills-hooks-agents-mcp, mcp-vs-cli-vs-skills-extend-claude-code, claude-code-agent-teams]
related_compare: []
related_faq: []
lang: zh
---

# MCP（Model Context Protocol）— 你需要知道的一切

**[MCP](/glossary/mcp)**（Model Context Protocol，模型上下文协议）是 [Anthropic](/glossary/anthropic) 推出的开放标准协议，解决的核心问题是：AI 模型如何安全、标准化地连接外部工具和数据源。在 MCP 出现之前，每个 AI 应用都要为每个外部服务写一套定制集成代码——数据库一套、API 一套、文件系统又一套。MCP 把这个 M×N 的问题变成了 M+N：工具提供方实现一次 MCP server，AI 应用实现一次 MCP client，双方即可互通。这个思路类似于 USB 对硬件接口的统一，或者 LSP（Language Server Protocol）对编辑器语言支持的统一。自 2024 年底发布以来，MCP 已经获得了 [Claude](/glossary/claude) 生态之外的广泛采用，成为 [agentic AI](/glossary/agentic) 架构中连接外部世界的事实标准之一。

## 最新进展

MCP 生态在 2025-2026 年经历了快速扩张。Anthropic 在 Claude Desktop 和 [Claude Code](/glossary/claude) 中原生支持 MCP server，开发者可以通过配置文件直接挂载数据库、监控系统、内部 API 等工具。社区贡献的 MCP server 已覆盖主流开发场景：GitHub、PostgreSQL、Slack、Notion、浏览器自动化等。

值得关注的是，MCP 的采用已经超出了 Anthropic 生态。多家 AI 工具和平台开始支持 MCP 协议，包括 IDE 插件和独立 agent 框架。这种跨生态采用验证了 MCP 作为开放标准的定位——它不是 Anthropic 的私有协议，而是一个任何 AI 应用都可以实现的通用接口。

我们在 [Claude Code 扩展能力深度解析](/blog/claude-code-extension-stack-skills-hooks-agents-mcp) 中详细分析了 MCP 在实际开发流程中的角色，在 [MCP vs CLI vs Skills](/blog/mcp-vs-cli-vs-skills-extend-claude-code) 中对比了三种扩展 Claude Code 能力的方式。

## 核心架构与能力

MCP 采用 **client-server 架构**，通信基于 JSON-RPC 2.0 协议：

- **MCP Server**：暴露工具（tools）、资源（resources）和提示模板（prompts）。每个 server 是一个独立进程，负责与特定外部服务交互。比如一个 PostgreSQL MCP server 提供查询、schema 浏览等工具
- **MCP Client**：AI 应用端的集成层，负责发现、连接和调用 MCP server。Claude Desktop 和 Claude Code 都内置了 MCP client
- **传输层**：支持 stdio（本地进程通信）和 SSE（远程 HTTP 通信）两种传输方式，覆盖本地开发和远程部署场景

**安全模型**是 MCP 的关键设计考量。MCP server 运行在用户本地环境中，AI 模型不直接访问外部服务——所有操作都通过 server 中转，用户对每次工具调用有审批权。这比直接给模型 API key 的方案安全得多。

**工具发现**机制让 AI 模型能动态了解可用工具及其参数。MCP server 通过标准化的 schema 描述自己提供的工具，模型据此决定何时、如何调用。这意味着添加新工具不需要修改模型或重新训练——挂载一个新 server 即可。

对于团队协作，MCP 配置可以写入项目的 `.mcp.json` 文件，随代码库分发。团队成员 clone 项目后自动获得相同的工具集，无需手动配置。我们在 [Claude Code Agent Teams](/blog/claude-code-agent-teams) 中探讨了 MCP 在多 agent 协作场景下的应用。

## 常见问题

- **MCP 和直接调用 API 有什么区别？** MCP 提供标准化的工具描述和调用协议，让 AI 模型能自主发现和使用工具，而不是靠硬编码的 API 调用
- **MCP server 需要自己开发吗？** 社区已有大量现成的 MCP server 覆盖常见场景，也可以用 MCP SDK 快速开发自定义 server
- **MCP 只能用于 Claude 吗？** 不是。MCP 是开放协议，任何 AI 应用都可以实现 MCP client 来使用 MCP server

## 所有 MCP 相关资源

### 博客文章
- [Claude Code 扩展能力全栈：Skills、Hooks、Agents 与 MCP](/blog/claude-code-extension-stack-skills-hooks-agents-mcp)
- [MCP vs CLI vs Skills：扩展 Claude Code 的三种方式](/blog/mcp-vs-cli-vs-skills-extend-claude-code)
- [Claude Code Agent Teams：多智能体协作](/blog/claude-code-agent-teams)

### 术语表
- [MCP](/glossary/mcp) — Model Context Protocol，AI 工具连接外部服务的开放标准
- [Agentic](/glossary/agentic) — 自主执行多步骤任务的 AI 工作模式
- [Anthropic](/glossary/anthropic) — MCP 协议的发起者，Claude 系列模型的开发公司
- [Claude](/glossary/claude) — Anthropic 的大语言模型系列

---

*觉得有用？[订阅 LoreAI](/subscribe)，每天 5 分钟掌握 AI 动态。*