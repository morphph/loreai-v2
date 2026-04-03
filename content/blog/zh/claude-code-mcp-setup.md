---
title: "Claude Code MCP 配置完全指南：从零搭建你的第一个 MCP Server 连接"
slug: claude-code-mcp-setup
description: "手把手教你在 Claude Code 中配置 MCP Server，包括本地和远程连接方式、常见数据源接入及故障排查。"
lang: zh
category: tools
related_glossary: [agent-sdk, agentic-coding]
related_blog: [create-an-mcp-server, claude-code-extension-stack-skills-hooks-agents-mcp, claude-code-seven-programmable-layers]
related_compare: []
related_topics: [claude-code]
---

# Claude Code MCP 配置完全指南：从零搭建你的第一个 MCP Server 连接

**Claude Code** 的核心能力之一，是通过 **MCP（Model Context Protocol）** 连接外部工具和数据源。一个配置好的 MCP Server 能让 Claude Code 直接查询数据库、调用 API、读取文档系统——不再需要手动复制粘贴上下文。本文详细讲解 Claude Code MCP 的配置方法，覆盖本地 Server、远程 Server 和常见数据源接入场景。

## 什么是 MCP，为什么 Claude Code 需要它

**MCP** 是 Anthropic 推出的开放协议，定义了 AI 模型与外部工具之间的标准通信方式。Claude Code 通过 MCP 协议与外部 Server 交互，每个 Server 暴露一组 tools（工具），Claude Code 在对话中按需调用这些工具。

这意味着你可以把数据库查询、监控面板、内部文档检索等能力封装成 MCP Server，Claude Code 就能像使用内置命令一样使用它们。对于日常开发来说，这比反复在终端和浏览器之间切换高效得多。如果你想深入理解 Claude Code 的扩展架构，推荐阅读Claude Code 扩展栈拆解：Skills、Hooks、Agents、MCP 四层架构实战。

## Claude Code MCP 配置的两种方式

Claude Code 支持在两个层级配置 MCP Server：**项目级**和**用户级**。

### 项目级配置（推荐）

在项目根目录的 `.claude/settings.json` 中添加 `mcpServers` 字段：

```json
{
  "mcpServers": {
    "my-db": {
      "command": "npx",
      "args": ["-y", "@anthropic/mcp-server-sqlite", "/path/to/db.sqlite"]
    }
  }
}
```

项目级配置跟随代码仓库，团队成员 clone 后即可使用相同的 MCP Server 设置。

### 用户级配置

在 `~/.claude/settings.json` 中添加同样的 `mcpServers` 字段。用户级配置对所有项目生效，适合个人常用的通用工具（比如 Slack 通知、日历查询等）。

两个层级的配置会合并，项目级优先。如果同名 Server 在两处都有定义，项目级配置覆盖用户级。

## 本地 MCP Server 配置实战

最常见的场景是连接本地运行的 MCP Server。以 SQLite 数据源为例：

**第一步：安装 MCP Server 包**

```bash
npm install -g @anthropic/mcp-server-sqlite
```

**第二步：在配置文件中注册**

```json
{
  "mcpServers": {
    "project-db": {
      "command": "mcp-server-sqlite",
      "args": ["/home/user/project/data.db"]
    }
  }
}
```

**第三步：重启 Claude Code**

配置修改后需要重启 Claude Code 会话，新的 MCP Server 才会加载。启动时 Claude Code 会自动连接所有已配置的 Server，并在工具列表中显示它们暴露的 tools。

配置完成后，你可以直接在对话中说「查询 users 表最近 10 条记录」，Claude Code 会自动调用 `project-db` Server 的查询工具。

## 远程 MCP Server 连接

对于团队共享的服务或云端数据源，Claude Code 支持连接远程 MCP Server。远程 Server 通常通过 SSE（Server-Sent Events）或 HTTP 传输协议暴露端点。

```json
{
  "mcpServers": {
    "remote-docs": {
      "url": "https://mcp.internal.company.com/docs-server"
    }
  }
}
```

远程连接需要注意几点：

- **认证**：如果 Server 需要认证，通常通过环境变量传递 token，在 `env` 字段中配置
- **网络**：确保 Claude Code 运行环境能访问远程 Server 的地址和端口
- **延迟**：远程调用比本地 Server 慢，复杂查询可能需要几秒响应

如果你想从零开始构建自己的 MCP Server，可以参考如何创建 MCP Server：从零开始的完整指南。

## 常用数据源配置示例

### PostgreSQL 数据库

```json
{
  "mcpServers": {
    "pg": {
      "command": "npx",
      "args": ["-y", "@anthropic/mcp-server-postgres"],
      "env": {
        "DATABASE_URL": "postgresql://user:pass@localhost:5432/mydb"
      }
    }
  }
}
```

### GitHub 仓库

```json
{
  "mcpServers": {
    "github": {
      "command": "npx",
      "args": ["-y", "@anthropic/mcp-server-github"],
      "env": {
        "GITHUB_TOKEN": "ghp_xxxxxxxxxxxx"
      }
    }
  }
}
```

### 文件系统搜索

```json
{
  "mcpServers": {
    "files": {
      "command": "npx",
      "args": ["-y", "@anthropic/mcp-server-filesystem", "/path/to/docs"]
    }
  }
}
```

注意：敏感信息（数据库密码、API token）建议通过环境变量引用，不要硬编码在配置文件中。

## 故障排查

配置 MCP Server 时最常遇到的问题：

**Server 没有出现在工具列表中**
- 检查 JSON 语法是否正确（缺少逗号、多余逗号是最常见的错误）
- 确认 `command` 指向的可执行文件在 PATH 中
- 重启 Claude Code 会话

**连接超时**
- 本地 Server：确认进程是否正常启动，检查端口占用
- 远程 Server：检查网络连通性和防火墙规则

**权限错误**
- 确认当前用户对目标数据源有读取权限
- 检查 `env` 中的认证信息是否正确

如果你在使用中遇到更复杂的问题，了解 Claude Code 的七层架构有助于定位问题出在哪一层。

## MCP 与 Claude Code 其他扩展机制的关系

MCP 是 Claude Code 四层扩展体系中的一层。完整的扩展栈包括：

- **CLAUDE.md / Skills**：定义项目上下文和任务指令
- **Hooks**：在特定事件（如工具调用前后）执行自定义脚本
- **Agent Teams**：生成子 Agent 并行处理任务
- **MCP Servers**：连接外部工具和数据源

四层各司其职：Skills 管「怎么做」，Hooks 管「何时触发」，Agent Teams 管「并行扩展」，MCP 管「外部连接」。实际项目中往往需要组合使用。比如一个 Skill 可以指示 Claude Code 调用某个 MCP Server 查询数据，再通过 Hooks 在完成后自动运行验证脚本。

想了解每天都能用到的 Claude Code 实用技巧，推荐看我每天都在用的 5 个 Claude Code 技巧。

## 常见问题

### MCP Server 配置修改后需要重启 Claude Code 吗？

需要。Claude Code 在启动时加载 MCP Server 配置并建立连接。修改 `.claude/settings.json` 中的 `mcpServers` 后，必须重启 Claude Code 会话才能生效。运行中热加载目前不支持。

### 一个项目可以同时连接多少个 MCP Server？

没有硬性上限，但每个 Server 的 tools 都会占用上下文窗口。实际使用中建议控制在 3-5 个 Server，每个 Server 暴露精简的工具集。过多的 tools 会增加 Claude Code 选择正确工具的难度。

### MCP Server 和直接在终端运行命令有什么区别？

Claude Code 本身就有 shell 执行能力，可以直接运行终端命令。MCP Server 的价值在于提供结构化的工具接口——返回类型化的数据而非原始文本输出，Claude Code 能更准确地理解和处理结果。对于数据库查询、API 调用等场景，MCP Server 比 shell 命令更可靠。

---

*觉得有用？[订阅 LoreAI](/subscribe)，每天 5 分钟掌握 AI 动态。*