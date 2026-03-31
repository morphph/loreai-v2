---
title: 手机上能审批 Claude Code 的代码改动吗？
slug: can-i-approve-or-reject-code-changes-from-my-mobile-device-w
description: 可以。通过 Remote Control 和 Web 端，你能在手机上实时审批或拒绝 Claude Code 的代码变更。
category: tools
related_glossary:
  - claude-code
  - agentic-coding
related_blog:
  - google-colab-mcp-server-cloud-gpu-ai-agents
lang: zh
related_topics:
  - claude-code
---

# 手机上能审批 Claude Code 的代码改动吗？

**可以。** [Claude Code](/zh/blog/9-principles-writing-claude-code-skills) 提供了 **Remote Control** 功能和 **Web 端**访问，让你在手机浏览器或 Claude iOS App 上查看、审批或拒绝代码变更。你不需要随身带着笔记本电脑，也能对正在运行的编码任务保持控制。

## 背景

[Claude Code](/glossary/claude-code) 是一个自主编码代理，能够读取项目结构、编辑多个文件、执行 shell 命令。这种强大的自主能力意味着开发者需要一种方式在任何地方监控和审批它的操作——尤其是当你离开工位但任务还在跑的时候。

Claude Code 的设计理念是**会话不绑定单一设备**。你可以在终端启动一个任务，然后通过 Remote Control 从手机接管，继续审批或拒绝代码改动。同样，你也可以在 Web 端（[claude.ai/code](https://claude.ai/code)）或 Claude iOS App 上启动长时间运行的任务，随时用手机检查进度。

这对[自主编码](/glossary/agentic-coding)工作流特别有价值——你可以在通勤、开会间隙、甚至周末散步时快速审批一个 PR 的改动，不用打开电脑。更多关于 Claude Code 的功能和生态，参见 [Claude Code 专题](/topics/claude-code)。

## 具体操作

1. **使用 Remote Control**：在本地终端启动 Claude Code 会话后，通过 Remote Control 功能从手机浏览器连接到同一会话，实时查看代码差异并审批或拒绝
2. **使用 Web 端**：直接在 [claude.ai/code](https://claude.ai/code) 上发起编码任务，手机浏览器即可访问，无需本地环境
3. **使用 iOS App**：在 Claude iOS App 中启动或继续编码任务，适合移动场景
4. **跨设备接力**：用 `/teleport` 命令将 Web 端任务拉回本地终端，或用 `/desktop` 切换到桌面应用做更细致的 diff 审查

需要注意的是，手机端适合快速审批和监控，复杂的代码审查和调试仍建议回到电脑上完成。

## 相关问题

- Claude Code 和 [Cursor](/zh/glossary/cursor) 有什么区别？
- [Claude Code vs Cursor 对比](/compare/claude-code-vs-cursor)

---

*觉得有用？[订阅 LoreAI](/subscribe)，每天 5 分钟掌握 AI 动态。*
