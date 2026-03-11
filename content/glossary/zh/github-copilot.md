---
title: "GitHub Copilot — AI 术语表"
slug: github-copilot
description: "什么是 GitHub Copilot？微软旗下基于大语言模型的 AI 编程助手，集成于主流 IDE 中。"
term: github-copilot
display_term: "GitHub Copilot"
category: tools
related_glossary: [cursor, agentic-coding, chatgpt]
related_blog: [claude-code-enterprise-engineering-ramp-shopify-spotify]
related_compare: []
lang: zh
---

# GitHub Copilot — AI 术语表

**GitHub Copilot** 是微软与 OpenAI 合作推出的 AI 编程助手，直接嵌入 VS Code、JetBrains 等主流 IDE，通过大语言模型实时生成代码补全、函数建议和整段代码片段。它是目前用户规模最大的 AI 辅助编程工具之一，覆盖了从个人开发者到企业团队的广泛场景。

## 为什么 GitHub Copilot 重要

GitHub Copilot 将 AI 代码生成能力从实验室带入了日常开发流程。开发者在编写代码时可以获得上下文感知的智能补全，减少重复性编码工作，加速原型搭建。

对于企业团队，Copilot Business 和 Enterprise 版本提供了组织级管理、策略控制和知识库索引功能。这使得 AI 辅助编程不再只是个人效率工具，而是团队工程实践的一部分。关于 AI 编程工具如何在企业中落地，可以参考我们对 [Claude Code 企业应用案例的分析](/blog/claude-code-enterprise-engineering-ramp-shopify-spotify)。

## GitHub Copilot 的工作原理

Copilot 基于 OpenAI 的 Codex 系列模型（后续版本已升级为 GPT-4 系列），在海量开源代码上训练。核心机制包括：

- **上下文补全**：分析当前文件、光标位置和注释，生成后续代码建议
- **Chat 模式**：通过 Copilot Chat 在 IDE 内进行自然语言对话，解释代码或生成修改方案
- **[Agentic 能力](/glossary/agentic-coding)**：Copilot Agent 模式可自主完成多步骤编码任务，包括编辑多文件和运行测试

与 [Cursor](/glossary/cursor) 等独立 AI IDE 不同，Copilot 的优势在于与 GitHub 生态的深度整合——Pull Request 摘要、代码审查建议、以及与 GitHub Actions 的联动。

## 相关术语

- **[Cursor](/glossary/cursor)**：另一款主流 AI 编程工具，以 VS Code 分支形式提供更深度的 AI 编辑体验
- **[Agentic Coding](/glossary/agentic-coding)**：AI 自主规划并执行多步编码任务的范式，Copilot Agent 模式属于此类
- **[ChatGPT](/glossary/chatgpt)**：OpenAI 的通用对话 AI，与 Copilot 共享底层模型技术

---

*觉得有用？[订阅 LoreAI](/subscribe)，每天 5 分钟掌握 AI 动态。*