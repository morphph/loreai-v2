---
title: "Codex 是什么意思 — AI 术语表"
slug: what-does-codex-mean
description: "Codex 是 OpenAI 推出的代码生成 AI 模型，也是其云端编程智能体平台的名称。本文解释 Codex 的含义与用法。"
term: what-does-codex-mean
display_term: "Codex"
category: tools
related_glossary: [agent-sdk, agentic-coding]
related_blog: [codex-complete-guide, codex-for-students, codex-for-open-source]
related_compare: []
related_topics: [codex]
lang: zh
---

# Codex 是什么意思 — AI 术语表

**Codex** 是 OpenAI 推出的 AI 系统，专门用于理解和生成代码。在不同语境下，这个词有两层含义：其一指 OpenAI 早期发布的代码生成基础模型（GPT 系列的代码特化版本）；其二指 OpenAI 近期推出的**云端编程智能体平台**，能够在隔离环境中自主执行编程任务。

## 为什么 Codex 重要

Codex 代表了 AI 辅助编程从"补全建议"到"自主执行"的范式转变。早期的 Codex 模型是 GitHub Copilot 的底层引擎，让 AI 代码补全大规模普及。新一代的 Codex 平台则更进一步——它可以接收自然语言任务描述，在云端沙箱中并行运行多个编程任务，无需占用本地开发环境。

对于学生和开源开发者，OpenAI 提供了专项支持计划。详情见 OpenAI Codex for Students：$100 免费额度背后的 AI 编程教育赌注 与 Codex for Open Source 的战略分析。

## Codex 如何工作

新版 Codex 平台采用 **agentic coding** 架构：用户提交任务后，Codex 在云端独立的容器环境中克隆代码仓库、执行代码、运行测试，并将结果以 Pull Request 的形式返回。它支持多任务并行，适合需要同时处理多个 Issue 的团队。

完整的技术架构解析参见 OpenAI Codex 完全指南：云端编程智能体深度解析。

## 相关术语

- **Agent SDK**：构建 AI 编程智能体的开发框架，与 Codex 的智能体架构密切相关
- **Agentic Coding**：AI 自主完成编程任务的工作范式，Codex 是其代表性实现

---

*觉得有用？[订阅 LoreAI](/subscribe)，每天 5 分钟掌握 AI 动态。*