---
title: "如何连接远程 MCP Server？"
slug: how-to-connect-to-remote-mcp-server
description: "在 Claude Code 中连接远程 MCP Server：配置文件添加服务器 URL 和传输类型（SSE 或 HTTP），几步完成工具接入。"
category: tools
related_glossary: [what-is-mcp-claude-code, agent-sdk]
related_blog: [create-an-mcp-server, claude-code-mcp-setup, claude-code-extension-stack-skills-hooks-agents-mcp]
related_compare: []
related_topics: [claude-code-mcp-servers]
lang: zh
---

# 如何连接远程 MCP Server？

在 Claude Code 配置文件中添加远程服务器的 URL 和传输类型即可完成连接。与本地 MCP Server 需要启动本地进程不同，远程 **MCP Server** 通过网络地址访问，配置完成后 Claude Code 会在启动时自动建立连接。

## 背景

**MCP**（Model Context Protocol）是 Anthropic 推出的开放协议，让 Claude Code 能够调用外部工具——数据库、API、第三方服务等。远程 MCP Server 指部署在网络上的标准化接口端点，团队可以将内部工具暴露为 MCP 接口，供 Claude 在任意工作环境中调用。

关于 MCP 的完整架构，参见如何创建 MCP Server：从零开始的完整指南。要了解 MCP 在 Claude Code 整体扩展栈中的定位，可阅读 Claude Code 扩展栈拆解：Skills、Hooks、Agents、MCP 四层架构实战。

## 操作步骤

1. **打开配置文件**：Claude Code 的 MCP 配置写在 `~/.claude.json`（全局）或项目根目录的 `.claude/settings.json`（项目级）中。
2. **添加远程服务器条目**：
   ```json
   {
     "mcpServers": {
       "my-remote-server": {
         "type": "sse",
         "url": "https://your-server.example.com/mcp"
       }
     }
   }
   ```
3. **选择传输类型**：`sse`（Server-Sent Events，适合实时流式响应）或 `http`（标准请求/响应）。大多数公开 MCP 服务使用 SSE 传输。
4. **重启 Claude Code**：配置更改后需要重启才能加载新服务器。
5. **验证连接**：在 Claude Code 中运行 `/mcp`，确认远程服务器显示为 `connected` 状态。

如果服务器需要鉴权，在配置中添加 `headers` 字段传入 Authorization token。

## 相关问题

- 什么是 MCP Server？
- 如何创建自己的 MCP Server？

---

*觉得有用？[订阅 LoreAI](/subscribe)，每天 5 分钟掌握 AI 动态。*