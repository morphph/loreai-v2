---
title: "MCP（Model Context Protocol）— AI 术语表"
slug: model-context-protocol
description: "什么是 MCP？Anthropic 推出的开放协议，让 AI 模型安全连接外部工具和数据源。"
term: model-context-protocol
display_term: "MCP"
category: frameworks
related_glossary: [claude-code, cursor]
related_blog: [claude-code-simplify-batch-skills]
related_compare: []
lang: zh
---

# MCP（Model Context Protocol）— AI 术语表

**MCP（Model Context Protocol）** 是 Anthropic 推出的开放标准协议，定义了 AI 模型与外部工具、数据源之间的通信方式。它解决的核心问题是：大语言模型虽然能力强大，但天生被困在文本输入输出的沙盒里——MCP 给了模型一个标准化的「插座」，让它能安全地调用数据库、API、文件系统等外部资源。

## 为什么 MCP 重要

在 MCP 出现之前，每个 AI 工具连接外部服务都要写定制化的集成代码。这导致生态碎片化严重——同一个数据库连接器，可能要为十个不同的 AI 产品各写一遍。

MCP 用「客户端-服务器」的标准架构统一了这个问题。工具开发者只需要写一个 MCP server，所有支持 MCP 的 AI 客户端都能直接使用。[Claude Code](/glossary/claude-code) 是最早原生支持 MCP 的开发工具之一，通过 MCP server 扩展能力边界——从查询数据库到操作云服务，都可以通过配置 MCP server 实现。我们在 [Claude Code 技能指南](/blog/claude-code-simplify-batch-skills) 中详细介绍了这种扩展机制。

## MCP 的工作原理

MCP 采用 JSON-RPC 2.0 作为通信协议，架构分三层：

- **MCP Host**：发起请求的 AI 应用（如 Claude Code、[Cursor](/glossary/cursor)）
- **MCP Client**：嵌入在 Host 中的协议客户端，负责维护与 Server 的连接
- **MCP Server**：暴露具体能力的服务端，每个 server 声明自己提供哪些工具（tools）、资源（resources）和提示模板（prompts）

连接建立后，Host 通过 Client 发现 Server 提供的能力列表，AI 模型根据任务需要选择调用。整个过程支持权限控制——用户可以审批每次工具调用，防止未授权操作。传输层支持 stdio（本地进程）和 HTTP+SSE（远程服务）两种模式。

## 相关术语

- **[Claude Code](/glossary/claude-code)**：Anthropic 的终端 AI 编程工具，原生支持 MCP server 扩展
- **[Cursor](/glossary/cursor)**：支持 MCP 协议的 AI 代码编辑器，可通过 MCP server 连接外部工具
- **[ChatGPT](/glossary/chatgpt)**：OpenAI 的对话 AI，采用独立的插件/GPTs 体系而非 MCP 协议

---

*觉得有用？[订阅 LoreAI](/subscribe)，每天 5 分钟掌握 AI 动态。*