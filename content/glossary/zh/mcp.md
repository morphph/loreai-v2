---
title: "MCP（Model Context Protocol）— AI 术语表"
slug: mcp
description: "什么是 MCP？Model Context Protocol 是连接 AI 模型与外部工具和数据源的开放协议标准。"
term: mcp
display_term: "MCP（Model Context Protocol）"
category: frameworks
related_glossary: [claude-code, claude, anthropic]
related_blog: [anthropic-cowork-claude-desktop-agent]
related_compare: []
lang: zh
---

# MCP（Model Context Protocol）— AI 术语表

**MCP（Model Context Protocol）** 是由 [Anthropic](/glossary/anthropic) 提出的开放协议标准，用于将大语言模型与外部工具、数据源和服务进行标准化连接。简单来说，MCP 为 AI 应用定义了一套通用的"插件接口"——任何遵循该协议的工具都能被 AI 模型直接调用，无需为每个工具单独编写集成代码。

## 为什么 MCP 重要

在 MCP 出现之前，每个 AI 应用都需要自行实现与外部服务的对接逻辑，导致大量重复开发和碎片化的集成方案。MCP 通过统一的协议规范解决了这个问题——工具开发者只需实现一次 MCP server，所有支持 MCP 的 AI 客户端都能直接使用。

这对开发者生态意义重大。[Claude Code](/glossary/claude-code) 已原生支持 MCP，开发者可以通过 MCP server 让 AI 直接查询数据库、调用 API、访问监控系统。关于 Anthropic 在智能体方向的最新布局，可以参考我们的[深度报道](/blog/anthropic-cowork-claude-desktop-agent)。

## MCP 的工作原理

MCP 采用客户端-服务端架构，基于 JSON-RPC 2.0 协议通信：

- **MCP Host**：运行 AI 模型的应用（如 [Claude](/glossary/claude) 桌面端、Claude Code）
- **MCP Client**：Host 内部的协议客户端，负责与 Server 建立一对一连接
- **MCP Server**：轻量级服务进程，暴露特定的工具能力（如读取文件系统、查询数据库、调用第三方 API）

Server 向 Client 声明自己提供哪些"工具"（tools），每个工具包含名称、参数定义和描述。模型根据用户意图选择合适的工具调用，Client 将请求发送到对应的 Server 执行，再将结果返回给模型。整个过程对用户透明。

目前 MCP 支持 stdio 和 HTTP+SSE 两种传输方式，社区已有数百个开源 MCP server 覆盖常见开发场景。

## 相关术语

- **[Claude Code](/glossary/claude-code)**：Anthropic 的终端 AI 编程工具，原生支持 MCP server 扩展能力
- **[Claude](/glossary/claude)**：Anthropic 推出的大语言模型系列，MCP 的主要应用载体
- **[Anthropic](/glossary/anthropic)**：MCP 协议的发起者，专注 AI 安全的人工智能公司

---

*觉得有用？[订阅 LoreAI](/subscribe)，每天 5 分钟掌握 AI 动态。*