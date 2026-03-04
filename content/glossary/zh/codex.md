---
title: "Codex — AI 术语表"
slug: codex
description: "什么是 Codex？OpenAI 推出的代码生成 AI 模型，GitHub Copilot 背后的核心技术。"
term: codex
display_term: "Codex"
category: models
related_glossary: [claude-code, agentic]
related_blog: [anthropic-cowork-claude-desktop-agent]
related_compare: []
lang: zh
---

# Codex — AI 术语表

**Codex** 是 OpenAI 基于 GPT 系列开发的代码生成模型，也是 GitHub Copilot 最初版本背后的核心引擎。它能根据自然语言描述生成代码，支持 Python、JavaScript、Go 等数十种编程语言，是最早将大语言模型能力大规模应用于软件开发的产品之一。

## 为什么 Codex 重要

Codex 的出现标志着 AI 辅助编程从学术研究走向主流开发者工具。2021 年 GitHub Copilot 的发布让数百万开发者第一次体验到 AI 代码补全，而 Copilot 的底层正是 Codex。这直接推动了整个 AI 编码工具赛道的爆发——从 IDE 内置补全到如今的[智能体式编程工具](/glossary/claude-code)，Codex 是这条演进路径的起点。

如今 OpenAI 已将 Codex 的能力整合进更新的模型中，但它对行业的影响持续存在。关于当前 AI 编码工具的最新动态，可以参考我们的[每日简报](/blog/anthropic-cowork-claude-desktop-agent)。

## Codex 的工作原理

Codex 基于 GPT-3 微调而成，训练数据包含大量公开的代码仓库。它的核心机制是**序列到序列生成**——接收自然语言 prompt 或部分代码片段，预测并输出后续代码。

关键技术细节：
- **训练数据**：数十亿行公开源代码，覆盖主流编程语言
- **上下文理解**：能解析函数签名、注释和已有代码结构来生成匹配的实现
- **API 形态**：最初作为独立 API 提供，后整合进 GPT-4 等后续模型

与当前的[智能体式](/glossary/agentic)编码工具不同，Codex 本身不具备执行命令、读取项目结构或多步规划的能力——它专注于代码生成这一个环节。

## 相关术语

- **[Claude Code](/glossary/claude-code)**：[Anthropic](/glossary/anthropic) 的终端 AI 编程智能体，代表了从代码补全到自主执行的演进方向
- **[Agentic](/glossary/agentic)**：智能体式 AI 范式，Codex 之后的编码工具正朝这个方向发展

---

*觉得有用？[订阅 LoreAI](/subscribe)，每天 5 分钟掌握 AI 动态。*