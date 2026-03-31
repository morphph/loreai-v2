---
title: 如何使用 Codex？
slug: using-codex
description: Codex 是 OpenAI 的云端 AI 编程助手。通过 ChatGPT 侧边栏或 CLI 即可开始使用。
category: tools
related_glossary:
  - agentic-coding
  - chatgpt
related_blog:
  - codex-for-students
  - codex-for-open-source
lang: zh
related_topics:
  - codex
---

# 如何使用 Codex？

**[Codex](/zh/faq/codex)** 是 OpenAI 推出的云端软件工程 AI 助手，由 [codex-1](/zh/blog/codex-complete-guide)（基于 OpenAI o3 优化）驱动。最直接的方式是通过 [ChatGPT](/zh/glossary/chatgpt) 侧边栏访问，选择你的代码库后，就可以分配编程任务给 Codex 处理——无论是写新功能、回答代码问题、修复 bug，还是生成拉取请求供审查。

## 背景信息

Codex 的核心优势在于它能在隔离的沙箱环境中自主完成任务。你无需在本地运行代码，所有工作都在云端进行。每个任务通常需要 1 到 30 分钟完成，具体取决于复杂度。任务完成后，Codex 会提供详细的执行日志和终端输出作为证据，让你能追踪每一步的动作。

你还可以在代码库中放置 **AGENTS.md** 文件，用来指导 Codex 理解你的项目结构、编码规范和最佳实践——就像给 Codex 留下的团队笔记。此外，Codex 支持多种访问方式，包括 ChatGPT Web 界面、[CLI](/faq/configuration) 和 IDE 扩展，方便你选择最适合的工作流。

## 实际步骤

1. **在 ChatGPT 中打开 Codex**：ChatGPT Pro、Business、Enterprise 用户可直接在侧边栏找到 Codex
2. **选择你的代码库**：指定一个本地文件夹或 Git 仓库
3. **分配任务或提问**：
   - 点击 **"Code"** 按钮输入任务（如"添加用户认证功能"）
   - 点击 **"Ask"** 按钮提问代码库相关问题
4. **监控进度**：在侧边栏实时查看 Codex 的执行过程
5. **审查和集成**：完成后可以审查改动、请求修订、创建 PR 或直接合并

## 相关问题

- [如何配置 Codex 的开发环境？](/faq/configuration)
- [Codex 支持哪些编程语言？](/faq/configuration)
- [Codex 可以在 CLI 中使用吗？](/faq/configuration)

---

*觉得有用？[订阅 LoreAI](/subscribe)，每天 5 分钟掌握 AI 动态。*
