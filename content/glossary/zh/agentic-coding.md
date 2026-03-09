---
title: "Agentic Coding — AI 术语表"
slug: agentic-coding
description: "什么是 Agentic Coding？让 AI 自主规划、编写、测试代码的智能编程范式。"
term: agentic-coding
display_term: "Agentic Coding"
category: techniques
related_glossary: [cursor, fine-tuning]
related_blog: [claude-connectors-free-150-integrations]
related_compare: []
lang: zh
---

# Agentic Coding — AI 术语表

**Agentic Coding**（智能体编程）是一种让 AI 以自主代理（agent）身份参与软件开发的编程范式。与传统的代码补全或聊天式辅助不同，agentic coding 中的 AI 能够独立理解需求、规划实现路径、跨文件编辑代码、执行终端命令，并根据测试结果自我修正——整个过程只需开发者描述目标，无需逐行指导。

## 为什么 Agentic Coding 重要

传统 AI 编程辅助停留在"你问我答"的层面：开发者写一行代码，AI 补全下一行。Agentic coding 把这个模式彻底翻转——开发者描述一个任务（"重构认证模块并更新所有测试"），AI 自主完成从分析代码库、规划修改方案到执行变更的全流程。

这意味着开发者可以将重复性高、跨文件范围大的工程任务交给 AI 代理，自己专注于架构决策和业务逻辑。Claude Code、[Cursor](/glossary/cursor) 等工具正在推动这一范式落地。我们在[最近的报道](/blog/claude-connectors-free-150-integrations)中分析了相关生态的最新进展。

## Agentic Coding 如何运作

Agentic coding 的核心机制包括：

- **任务规划**：AI 将高层需求拆解为可执行的子任务序列
- **工具调用**：通过 shell 访问构建工具、测试框架、版本控制等开发基础设施
- **上下文感知**：读取项目结构、配置文件和代码依赖关系，理解整体架构
- **反馈闭环**：执行代码后根据编译错误或测试失败自动调整方案

与简单的代码生成不同，agentic coding 强调端到端的任务完成能力——AI 不只是写代码，还要确保代码能跑通。

## 相关术语

- **[Cursor](/glossary/cursor)**：集成 AI 能力的代码编辑器，支持 agentic 工作流
- **[Fine-tuning](/glossary/fine-tuning)**：通过微调提升模型在特定编程任务上的表现

---

*觉得有用？[订阅 LoreAI](/subscribe)，每天 5 分钟掌握 AI 动态。*