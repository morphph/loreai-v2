---
title: "Claude Code CLI 是什么？"
slug: claude-code-cli
description: "Claude Code CLI 是 Anthropic 推出的终端命令行工具，让你直接在终端里调用 AI 完成编程任务。"
category: tools
related_glossary: [agentic-coding, agent-sdk]
related_blog: [claude-code-extension-stack-skills-hooks-agents-mcp, claude-code-seven-programmable-layers]
related_compare: [claude-code-vs-cursor, claude-code-remote-vs-ssh]
related_topics: [claude-code]
lang: zh
---

# Claude Code CLI 是什么？

**Claude Code CLI** 是 Anthropic 推出的命令行界面工具，让开发者直接在终端里与 Claude AI 协作完成编程任务——读取代码库、运行命令、修改文件、提交变更，全程无需离开终端。

## 背景

Claude Code CLI 的定位从根本上不同于 IDE 插件或网页聊天。它是一个**自主代理**：你描述任务，它规划并执行——跨文件修改、运行测试、生成 commit，一条指令搞定。

它与 Cursor 等 IDE 工具的核心区别在于交互模型。Cursor 是在编辑器里嵌入 AI 补全，Claude Code CLI 是把 AI 变成你的终端同事。详细对比可以看Claude Code vs Cursor。

通过 Claude Code 七层架构，你可以深入了解它的 Skills、Hooks、MCP 等扩展机制；扩展栈拆解则提供了四层架构的实战说明。

## 如何安装和使用

1. 确保已安装 Node.js（推荐 18+）
2. 运行 `npm install -g @anthropic-ai/claude-code` 全局安装
3. 在项目根目录执行 `claude` 启动交互会话
4. 在项目根目录添加 `CLAUDE.md` 文件，定义项目级规则和上下文

安装遇到问题可以参考安装常见问题。

## 相关问题

- 如何在手机上使用 Claude Code 远程控制？
- 能否在移动端审批或拒绝代码变更？

---

*觉得有用？[订阅 LoreAI](/subscribe)，每天 5 分钟掌握 AI 动态。*