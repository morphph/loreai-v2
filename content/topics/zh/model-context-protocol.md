---
title: "MCP（Model Context Protocol）— 你需要知道的一切"
slug: model-context-protocol
description: "MCP 完全指南：Anthropic 提出的开放协议，让 AI 模型连接外部工具和数据源。"
pillar_topic: MCP
category: frameworks
related_glossary: [model-context-protocol, agentic-coding]
related_blog: [claude-code-remote-sessions-phone, coding-agents-reshaping-epd]
related_compare: []
related_faq: []
lang: zh
---

# MCP（Model Context Protocol）— 你需要知道的一切

**[MCP（Model Context Protocol）](/glossary/model-context-protocol)**是 Anthropic 在 2024 年底推出的开放协议，定义了 AI 模型与外部工具、数据源之间的标准通信方式。在 MCP 出现之前，每个 AI 应用要接入一个新工具——数据库、API、文件系统——都需要写一套定制化的集成代码。MCP 用一套统一的 JSON-RPC 协议解决了这个问题：工具开发者只需实现一个 MCP server，任何支持 MCP 的 AI 客户端都能直接调用。这个思路类似于 USB 对硬件外设的标准化，或者 LSP（Language Server Protocol）对编辑器语言支持的标准化。目前 Claude Code、Claude Desktop 等 Anthropic 产品原生支持 MCP，第三方工具如 Cursor、Zed 编辑器也在接入。

## 最新动态

2026 年初，MCP 生态进入快速增长期。社区已发布数百个开源 MCP server，覆盖 GitHub、Slack、PostgreSQL、Notion、Linear 等主流开发工具。Anthropic 持续迭代协议规范，增加了 **Streamable HTTP transport** 以支持远程部署场景，补充了 **OAuth 2.1 认证流程**，使企业级安全需求得以满足。

[Agentic coding](/glossary/agentic-coding) 的兴起是 MCP 快速普及的关键推动力。当 AI 编程助手从单纯的代码补全进化为自主执行多步骤任务的 agent 时，它们需要访问数据库、监控系统、项目管理工具等外部资源——MCP 正好提供了这条标准化通道。我们在[编程 Agent 如何重塑工程团队](/blog/coding-agents-reshaping-epd)一文中详细分析了这一趋势。

## 核心架构与能力

MCP 采用经典的 **客户端-服务器** 架构：

- **MCP Host**：最终用户使用的 AI 应用（如 Claude Code、Claude Desktop），负责管理与 MCP server 的连接
- **MCP Client**：Host 内部的协议客户端，与单个 MCP server 维持一对一连接
- **MCP Server**：轻量级程序，暴露特定工具或数据源的能力。每个 server 通过标准化接口声明自己提供哪些 **tools**（可调用的操作）、**resources**（可读取的数据）和 **prompts**（预定义的交互模板）

通信基于 **JSON-RPC 2.0**，支持两种传输方式：本地场景使用 **stdio**（标准输入输出），远程场景使用 **Streamable HTTP**。这意味着 MCP server 既可以作为本地进程运行，也可以部署为远程服务。

**实际使用示例**：在 Claude Code 中，你可以通过配置文件添加一个 PostgreSQL MCP server。之后 Claude Code 就能直接查询数据库、分析表结构、生成优化建议——无需你手动复制粘贴 SQL 结果。

MCP 的设计哲学是**安全优先**。所有工具调用都需要 Host 层面的用户确认，MCP server 本身无法主动向模型发送指令，避免了 prompt injection 的风险。

## 常见问题

- **MCP 和 function calling 有什么区别？** Function calling 是模型层面的能力——模型决定调用什么函数、传什么参数。MCP 是应用层面的协议——定义了工具如何被发现、描述和调用。两者是互补关系：MCP server 暴露工具，模型通过 function calling 决定何时使用这些工具
- **MCP server 难写吗？** 不难。Anthropic 提供了 TypeScript 和 Python 的官方 SDK，一个最小可用的 MCP server 只需几十行代码。社区也有大量开源模板可以参考
- **MCP 只能和 Claude 一起用吗？** 不是。MCP 是开放协议，任何 AI 模型或应用都可以实现。目前已有多个非 Anthropic 产品支持 MCP

## 相关对比

目前暂无 MCP 相关的对比页面。随着更多协议和标准出现，我们将补充 MCP 与其他 AI 工具集成方案的详细对比。

## 所有 MCP 相关资源

### 博客文章
- [编程 Agent 如何重塑工程团队](/blog/coding-agents-reshaping-epd)
- [Claude Code 远程会话：从手机写代码](/blog/claude-code-remote-sessions-phone)

### 术语表
- [Model Context Protocol](/glossary/model-context-protocol) — AI 模型与外部工具的标准通信协议
- [Agentic Coding](/glossary/agentic-coding) — AI 自主完成多步骤编程任务的开发范式

---

*觉得有用？[订阅 LoreAI](/subscribe)，每天 5 分钟掌握 AI 动态。*