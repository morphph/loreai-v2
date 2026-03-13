---
title: "Multi-Agent Systems（多智能体系统） — AI 术语表"
slug: multi-agent-systems
description: "什么是 Multi-Agent Systems？多个 AI 智能体协作完成复杂任务的系统架构。"
term: multi-agent-systems
display_term: "Multi-Agent Systems（多智能体系统）"
category: concepts
related_glossary: [agentic-coding, claude-desktop]
related_blog: [openai-computer-access-agents-lessons]
related_compare: []
lang: zh
---

# Multi-Agent Systems（多智能体系统） — AI 术语表

**Multi-Agent Systems（多智能体系统）** 是一种由多个自主 AI 智能体（Agent）组成的系统架构，每个智能体拥有独立的感知、推理和行动能力，通过协作、竞争或协商来完成单一智能体无法高效处理的复杂任务。这一概念源自分布式人工智能研究，如今已成为大模型应用落地的核心范式之一。

## 为什么 Multi-Agent Systems 重要

单个大语言模型擅长对话和推理，但面对涉及多步骤、多工具、多领域的真实任务时，往往力不从心。多智能体系统通过**分工协作**解决这一瓶颈：一个 Agent 负责搜索信息，另一个负责代码生成，第三个负责质量审查——就像一个高效的工程团队。

2025-2026 年，[Anthropic](/glossary/claude-desktop)、OpenAI 等公司纷纷将多智能体能力集成到产品中。Claude Code 的 Agent Teams 功能允许主智能体派生子智能体并行处理任务，显著提升了大型代码库的重构效率。我们在 [OpenAI 智能体实践分析](/blog/openai-computer-access-agents-lessons) 中详细探讨了这一趋势。

## Multi-Agent Systems 如何工作

多智能体系统的核心机制包括：

- **任务分解与分配**：编排层（Orchestrator）将复杂目标拆解为子任务，分派给专长不同的智能体
- **通信协议**：智能体之间通过结构化消息传递中间结果，常见模式包括发布-订阅、请求-响应和黑板系统
- **冲突协调**：当多个智能体的输出矛盾时，系统通过投票、优先级或裁判智能体来达成一致
- **记忆共享**：共享上下文存储让智能体复用彼此的发现，避免重复工作

典型应用场景包括[自主编程](/glossary/agentic-coding)（规划 Agent + 编码 Agent + 测试 Agent）、自动化研究（搜索 + 摘要 + 验证）和企业工作流自动化。

## 相关术语

- **[Agentic Coding](/glossary/agentic-coding)**：多智能体系统在软件开发领域的直接应用，多个 Agent 分工完成编码任务
- **[Claude Desktop](/glossary/claude-desktop)**：Anthropic 的桌面端产品，正在整合多智能体协作能力

---

*觉得有用？[订阅 LoreAI](/subscribe)，每天 5 分钟掌握 AI 动态。*