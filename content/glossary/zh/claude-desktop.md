---
title: "Claude Desktop — AI 术语表"
slug: claude-desktop
description: "什么是 Claude Desktop？Anthropic 推出的桌面端 AI 助手应用，支持文件处理与多模态交互。"
term: claude-desktop
display_term: "Claude Desktop"
category: tools
related_glossary: [claude-code, chatgpt]
related_blog: [claude-excel-powerpoint-sync]
related_compare: []
lang: zh
---

# Claude Desktop — AI 术语表

**Claude Desktop** 是 Anthropic 推出的桌面端应用程序，让用户无需通过浏览器即可直接与 Claude 模型交互。它支持文件上传、图片识别、长文档处理等多模态能力，并通过 MCP（Model Context Protocol）协议连接外部工具和数据源，将 Claude 从一个对话窗口扩展为本地工作流的核心节点。

## 为什么 Claude Desktop 重要

对于日常依赖 AI 辅助工作的用户来说，浏览器标签页切换是效率的隐形杀手。Claude Desktop 作为独立应用常驻系统，随时可用——拖入一份 PDF 就能获得摘要，贴一张截图就能分析内容。

更关键的是 MCP 集成能力。通过配置 MCP 服务器，Claude Desktop 可以读取本地文件系统、查询数据库、调用内部 API，真正融入你的工作环境而非停留在聊天框里。我们在 [Claude 处理 Excel 和 PowerPoint 的实测](/blog/claude-excel-powerpoint-sync) 中详细分析了这种本地文件处理能力的实际表现。

## Claude Desktop 如何工作

Claude Desktop 本质上是 Claude 模型的原生客户端，核心机制包括：

- **多模态输入**：支持文本、图片、PDF、代码文件等多种格式的直接上传和分析
- **MCP 协议**：通过本地配置文件定义可连接的外部工具，实现文件读取、命令执行等扩展功能
- **对话记忆**：支持项目级上下文管理，在同一项目的多轮对话中保持连贯性
- **跨平台支持**：覆盖 macOS 和 Windows，提供系统级快捷键唤起

与 [Claude Code](/glossary/claude-code) 的终端代理模式不同，Claude Desktop 面向更广泛的用户群体——不只是开发者，还包括研究人员、分析师和内容创作者。

## 相关术语

- **[Claude Code](/glossary/claude-code)**：Anthropic 的终端编程代理，面向开发者的命令行工具，与 Claude Desktop 的图形界面形成互补
- **[ChatGPT](/glossary/chatgpt)**：OpenAI 的对话式 AI 产品，同样提供桌面客户端，是 Claude Desktop 的主要竞品
- **[Agentic Coding](/glossary/agentic-coding)**：AI 代理式编程范式，Claude Desktop 通过 MCP 集成正在向这个方向演进

---

*觉得有用？[订阅 LoreAI](/subscribe)，每天 5 分钟掌握 AI 动态。*