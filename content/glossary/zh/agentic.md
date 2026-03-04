---
title: "Agentic（智能体化）— AI 术语表"
slug: agentic
description: "什么是 Agentic？指 AI 系统具备自主规划、决策和执行多步骤任务的能力。"
term: agentic
display_term: "Agentic（智能体化）"
category: concepts
related_glossary: [claude-code, claude, anthropic]
related_blog: [anthropic-cowork-claude-desktop-agent]
related_compare: []
lang: zh
---

# Agentic（智能体化）— AI 术语表

**Agentic** 描述的是 AI 系统能够自主规划、做出决策并执行多步骤任务的特性。与传统的「一问一答」模式不同，agentic AI 不需要人类逐步指令，而是接收一个高层目标后，自行拆解任务、调用工具、处理中间结果，直到完成整个工作流。

## 为什么 Agentic 很重要

Agentic 代表了 AI 应用从「辅助工具」到「自主协作者」的关键转变。传统 AI 每次只处理一个请求，开发者需要手动串联每个步骤。而 agentic 系统能够独立完成复杂工程任务——比如 [Claude Code](/glossary/claude-code) 可以读取整个代码库、规划重构方案、修改多个文件并提交代码，全程几乎不需要人工干预。

[Anthropic](/glossary/anthropic) 在 2026 年初推出的 [桌面智能体和 Cowork 模式](/blog/anthropic-cowork-claude-desktop-agent)进一步扩展了 agentic 的边界，让 AI 从终端走向了 GUI 操作。这种能力正在重新定义开发者与 AI 的协作方式。

## Agentic 的工作原理

Agentic 系统的核心架构包含三个关键组件：

- **规划模块**：将高层目标分解为可执行的子任务序列
- **工具调用**：通过函数调用、Shell 命令或 API 请求与外部环境交互
- **反馈循环**：根据每步执行结果动态调整后续计划

以 [Claude](/glossary/claude) 为例，它通过扩展上下文窗口理解项目全貌，利用 tool use 能力执行文件编辑、命令运行等操作，并在遇到错误时自动修正策略。这种「感知-规划-执行-反思」的循环是 agentic 行为的本质特征。

## 相关术语

- **[Claude Code](/glossary/claude-code)**：Anthropic 的终端智能体编程工具，是 agentic AI 在软件开发领域的典型应用
- **[Claude](/glossary/claude)**：Anthropic 开发的大语言模型系列，为 agentic 系统提供底层推理能力
- **[Anthropic](/glossary/anthropic)**：专注于 AI 安全的公司，推动 agentic AI 的前沿发展

---

*觉得有用？[订阅 LoreAI](/subscribe)，每天 5 分钟掌握 AI 动态。*