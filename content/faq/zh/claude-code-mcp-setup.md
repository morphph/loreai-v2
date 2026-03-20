---
title: "Claude Code 怎么配置 MCP？"
slug: claude-code-mcp-setup
description: "在 Claude Code 配置文件中添加 MCP 服务器，就能让 AI agent 通过标准化协议连接数据库、调用 API 和使用第三方工具。"
category: tools
related_glossary: [model-context-protocol, claude-code, agentic-coding]
related_blog: [mcp-vs-cli-vs-skills-extend-claude-code, claude-code-extension-stack-skills-hooks-agents-mcp]
lang: zh
---

# Claude Code 怎么配置 MCP？

MCP（Model Context Protocol）让 Claude Code 通过标准化的服务器接口连接外部工具和数据源。你只需要在配置文件里声明 MCP 服务器，agent 就能在编码过程中直接调用这些工具——查数据库、调 API、操作第三方服务，全程不用离开终端。

## 背景

[MCP](/glossary/model-context-protocol) 是 [Anthropic](/glossary/anthropic) 推出的开放标准，定义了 AI agent 和外部工具之间的通信方式。没有 MCP 之前，想让 [agentic coding](/glossary/agentic-coding) 工具连外部服务，每个都得写自定义集成，维护成本很高。MCP 把这件事标准化了：[Claude Code](/glossary/claude-code) 作为 MCP 客户端，每个外部工具跑一个 MCP 服务器，通过统一接口暴露能力。

实际开发中，很多任务光靠本地代码是不够的——你可能需要查线上数据库、看部署状态、搜文档、或者跟项目管理工具交互。MCP 让这些操作都能在 Claude Code 里直接完成。

一个常见误区是觉得 MCP 会替代 Skills 或 CLI 工具。实际上它们各有所长：MCP 擅长有状态的、需要认证的外部服务连接，Skills 和 Hooks 更适合本地工作流自动化。想搞清楚什么时候用哪个，推荐看[MCP vs CLI vs Skills 对比分析](/blog/mcp-vs-cli-vs-skills-extend-claude-code)和[扩展体系完整指南](/blog/claude-code-extension-stack-skills-hooks-agents-mcp)。

## 实用步骤

1. 确定你要连接的 MCP 服务器——社区已有 GitHub、Slack、PostgreSQL 等常用服务的实现
2. 安装 MCP 服务器包，通常通过 npm 或独立二进制文件
3. 在项目的 `.mcp.json` 或全局配置中添加服务器信息，包括启动命令、参数和环境变量
4. 重启 Claude Code，让它在启动时发现新的 MCP 服务器
5. 让 Claude Code 列出可用工具，确认 MCP 服务器的工具已经出现
6. 正常对话使用即可，Claude Code 会在需要时自动调用 MCP 工具

## 相关问题

- [CLAUDE.md 是什么？](/faq/what-is-claude-md)
- [Claude Code Skills 是什么？](/faq/claude-code-skills)
- [什么是 Claude Code？](/faq/what-is-claude-code)

---

*觉得有用？[订阅 LoreAI](/subscribe)，每天 5 分钟掌握 AI 动态。*