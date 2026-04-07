---
title: "MCP 与 Claude Code — AI 术语表"
slug: what-is-mcp-claude-code
description: "什么是 MCP？Model Context Protocol 是连接 Claude Code 与外部工具的标准协议，让 AI 代理突破终端边界。"
term: what-is-mcp-claude-code
display_term: "MCP（Model Context Protocol）"
category: tools
related_glossary: [claude-code, agent-sdk, agentic-coding]
related_blog: [create-an-mcp-server, claude-code-extension-stack-skills-hooks-agents-mcp, claude-code-seven-programmable-layers]
related_compare: []
related_topics: [claude-code]
lang: zh
---

# MCP（Model Context Protocol）与 Claude Code — AI 术语表

**MCP（Model Context Protocol）** 是 Anthropic 提出的开放标准协议，用于连接 Claude Code 与外部工具、数据库和 API。它解决了 AI 代理"只能看到终端"的局限——通过 MCP，Claude Code 可以读写数据库、调用第三方 API、接入监控系统，像调用本地命令一样操作远程服务。

## 为什么 MCP 对 Claude Code 很重要

没有 MCP，Claude Code 只能操作本地文件和运行 shell 命令。有了 MCP，它的能力边界大幅扩展：查询生产数据库、拉取 Linear 工单、读取 Grafana 指标——这些外部上下文全部可以注入到 AI 的推理过程中。

对于工程团队而言，MCP 意味着可以把企业内部系统（文档、工单、监控）直接接入 Claude Code 工作流，无需手动复制粘贴上下文。在 Claude Code 七层架构 中，MCP 是最底层的外部集成接口，而 Skills 和 Hooks 则在其上层编排行为。

## MCP 的工作原理

MCP 采用客户端-服务器架构，与 REST API 的概念类似，但专为 AI 代理设计：

- **MCP Server**：暴露工具和资源的服务端进程，可以是本地进程或远程服务
- **MCP Client**：Claude Code 内置的客户端，负责发现并调用 MCP Server 提供的工具
- **工具调用**：Claude Code 在推理过程中决定何时调用哪个 MCP 工具，结果直接回流到上下文

配置方式是在 `claude_desktop_config.json` 或项目级配置中声明 MCP Server 的启动命令或 URL。详细配置步骤见 如何创建 MCP Server。

如果你想了解 MCP 在整个 Claude Code 扩展体系中的位置，四层架构实战解析 给出了 Skills、Hooks、Agents、MCP 的完整对比。

## 相关术语

- **Agent SDK**：构建多 Agent 系统的 SDK，MCP 是 Agent 间通信的底层协议之一
- **Agentic Coding**：AI 代理自主执行编码任务的工作模式，MCP 扩展了代理的感知范围
- **Claude Code**：Anthropic 的终端 AI 编程代理，MCP 是其核心扩展机制

---

*觉得有用？[订阅 LoreAI](/subscribe)，每天 5 分钟掌握 AI 动态。*