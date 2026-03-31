---
title: Model Context Protocol — AI 术语表
slug: model-context-protocol
description: Model Context Protocol 是什么？Anthropic 推出的开放标准，用于连接 AI 应用与外部数据源和工具。
term: model-context-protocol
display_term: Model Context Protocol
category: concepts
related_glossary:
  - agent-sdk
  - agentic-coding
related_blog:
  - first-few-days-with-codex-cli
lang: zh
related_topics:
  - claude-code
---

# Model Context Protocol — AI 术语表

**Model Context Protocol**（[MCP](/zh/blog/claude-code-seven-programmable-layers)）是 Anthropic 于 2024 年 11 月推出的开放标准。它为 AI 应用提供了一套标准化的方式，来连接外部数据源、工具和工作流程，使 AI 模型能够突破孤岛限制，访问实时数据并执行操作。

## 为什么 MCP 重要

传统 AI 模型的知识被冻结在训练时间点，无法与外部世界交互。MCP 解决了这个根本问题——它让大语言模型能够动态访问数据库、日历、团队工具等系统。这种能力对企业至关重要：客服机器人可以查询多个数据库，编码助手能理解设计稿生成代码。MCP 还降低了开发复杂性，用一套标准替代了原来为每个数据源定制连接的繁琐做法。自推出以来，OpenAI、[Google DeepMind](/zh/blog/gemini-3-1-pro-complex-tasks) 等已采纳这一标准。

## MCP 工作原理

MCP 采用客户端-服务器架构。MCP 服务器公开数据和工具，MCP 客户端（位于 AI 应用内）负责翻译请求并获取数据。两者通过 JSON-RPC 2.0 消息通信，支持 stdio（本地资源）和 SSE（远程资源）两种传输方式。开发者可以用 TypeScript、Python、Java 等多种语言构建 MCP 服务器，从而快速连接 Google Drive、Slack、GitHub 等系统。

## 相关术语

- **[Agent SDK](/glossary/agent-sdk)**：用于构建 AI 智能体的开发工具包，与 MCP 配合使用
- **[Agentic Coding](/glossary/agentic-coding)**：由 MCP 驱动的自主编码能力
- **[AI Safety](/glossary/ai-safety)**：MCP 设计中内置的安全机制

---

*觉得有用？[订阅 LoreAI](/subscribe)，每天 5 分钟掌握 AI 动态。*
