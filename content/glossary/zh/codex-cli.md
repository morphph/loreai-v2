---
title: Codex CLI — AI 术语表
slug: codex-cli
description: 什么是 Codex CLI？OpenAI 开源的终端 AI 编程代理，可自主读写代码并执行命令。
term: codex-cli
display_term: Codex CLI
category: tools
related_glossary:
  - codex
  - agentic
  - agent-teams
related_blog:
  - codex-complete-guide
related_compare: []
lang: zh
related_topics:
  - codex
---

# Codex CLI — AI 术语表

**[Codex](/zh/blog/codex-complete-guide) CLI** 是 OpenAI 推出的开源终端编程代理工具。它直接在命令行中运行，利用 OpenAI 的模型（默认 o4-mini）读取项目代码、规划修改方案、编写代码并执行 shell 命令——整个过程在沙箱环境中完成，兼顾自主性与安全性。项目以 Apache 2.0 协议开源，开发者可自由查看和修改源码。

## 为什么 Codex CLI 值得关注

Codex CLI 代表了 OpenAI 在[代理式](/glossary/agentic)编程工具领域的正式布局。与 IDE 插件不同，它采用终端优先的交互方式，更贴合资深开发者的工作习惯。开源策略也让它在透明度和可定制性上具备独特优势——开发者可以审计每一行代码，了解代理的实际行为。

对于已经在使用 OpenAI API 的团队来说，Codex CLI 提供了一条从"对话式问答"到"自主编程代理"的升级路径。我们在 [Codex 完整指南](/blog/codex-complete-guide)中对其能力和使用场景做了详细分析。

## Codex CLI 的工作原理

Codex CLI 启动后会读取当前项目的文件结构和代码内容，将其作为上下文发送给 OpenAI 模型。用户用自然语言描述任务，模型生成执行计划并逐步实施。

核心机制包括：

- **沙箱执行**：通过网络隔离和目录限制，防止代理执行危险操作
- **多级审批模式**：提供 suggest、auto-edit、full-auto 三种自主级别，用户可按需控制代理权限
- **多模型支持**：默认使用 o4-mini，也可切换至 o3 等更强模型处理复杂任务
- **项目指令文件**：通过 `codex.md` 文件定义项目级约束和编码规范

## 相关术语

- **[Codex](/glossary/codex)**：OpenAI 的代码生成模型系列，Codex CLI 的技术基础
- **[Agentic](/glossary/agentic)**：代理式 AI 范式，Codex CLI 是该理念在编程领域的典型实现
- **[Agent Teams](/glossary/agent-teams)**：多代理协作架构，与 Codex CLI 的单代理模式形成互补

---

*觉得有用？[订阅 LoreAI](/subscribe)，每天 5 分钟掌握 AI 动态。*
