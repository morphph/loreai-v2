---
title: "Copilot — AI 术语表"
slug: copilot
description: "什么是 Copilot？AI 辅助编程工具的统称，最早由 GitHub Copilot 定义这一品类。"
term: copilot
display_term: "Copilot"
category: tools
related_glossary: [claude-code, agentic]
related_blog: [claude-code-extension-stack-skills-hooks-agents-mcp]
related_compare: []
lang: zh
---

# Copilot — AI 术语表

**Copilot** 泛指嵌入开发环境的 AI 编程助手，能根据上下文自动补全代码、生成函数、解释逻辑。这一概念由 GitHub Copilot 在 2021 年推出后迅速普及，现已成为 AI 辅助编程工具的代名词——微软、Google、Anthropic 等公司都推出了各自的 copilot 类产品。

## 为什么 Copilot 重要

Copilot 类工具从根本上改变了开发者写代码的方式。传统开发中，程序员需要在文档、Stack Overflow 和代码库之间反复切换；copilot 把这些知识压缩到了编辑器的 Tab 键里。

但 copilot 的能力边界也很明确：它擅长行级补全和单文件编辑，对跨文件重构、端到端任务执行力有限。这正是 [agentic](/glossary/agentic) 编程工具（如 [Claude Code](/glossary/claude-code)）出现的原因——它们不只是「副驾驶」，而是能独立规划和执行多步骤任务的「自动驾驶」。关于这两种范式的差异，可以参考我们的 [Claude Code 技术栈解析](/blog/claude-code-extension-stack-skills-hooks-agents-mcp)。

## Copilot 的工作原理

主流 copilot 产品基于大语言模型（LLM），核心流程：

1. **上下文采集**：读取当前文件、光标位置、打开的标签页，构建 prompt
2. **模型推理**：将上下文发送给后端 LLM，生成代码补全建议
3. **内联展示**：在编辑器中以灰色文本或 diff 形式呈现，用户按 Tab 接受

GitHub Copilot 最初基于 OpenAI Codex，后升级为 GPT-4 系列。Google 的 Gemini Code Assist、Amazon 的 CodeWhisperer 采用类似架构但使用各自模型。核心差异在于上下文窗口大小、支持的语言数量以及与 IDE 的集成深度。

## 相关术语

- **[Claude Code](/glossary/claude-code)**：Anthropic 的终端 AI 编程代理，与 copilot 的行级补全不同，采用 agentic 方式执行完整任务
- **[Agentic](/glossary/agentic)**：AI 系统具备自主规划和执行能力的特性，是 copilot 之后的下一代编程辅助范式

---

*觉得有用？[订阅 LoreAI](/subscribe)，每天 5 分钟掌握 AI 动态。*