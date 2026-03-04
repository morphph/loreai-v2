---
title: "Claude — AI 术语表"
slug: claude
description: "什么是 Claude？Anthropic 开发的大语言模型系列，以安全性和长上下文能力著称。"
term: claude
display_term: "Claude"
category: models
related_glossary: [anthropic, claude-code, google]
related_blog: [anthropic-claude-memory-upgrades-importing, anthropic-cowork-claude-desktop-agent]
related_compare: []
lang: zh
---

# Claude — AI 术语表

**Claude** 是 [Anthropic](/glossary/anthropic) 开发的大语言模型系列。从最初的 Claude 1 到目前的 Claude 4 家族，Claude 以对话能力、长上下文窗口和安全对齐设计为核心特点，支持文本生成、代码编写、文档分析等多种任务。

## 为什么 Claude 重要

Claude 是当前最具竞争力的通用大模型之一，与 GPT-4、Gemini 形成三足鼎立格局。Anthropic 对 Constitutional AI 等安全研究的投入，使 Claude 在可控性和有害内容拒绝方面表现突出。

对开发者而言，Claude 的长上下文能力（支持最高 200K token 输入）意味着可以一次性处理完整代码库或长篇文档，无需繁琐的分块策略。结合 [Claude Code](/glossary/claude-code) 等工具，Claude 已从对话助手演进为能自主完成工程任务的 AI 代理。更多关于 Claude 最新能力的分析，参见我们的 [Anthropic Claude 记忆升级报道](/blog/anthropic-claude-memory-upgrades-importing)。

## Claude 的工作原理

Claude 基于 Transformer 架构，通过大规模预训练和 RLHF（人类反馈强化学习）进行对齐。Anthropic 独创的 Constitutional AI 方法让模型在训练阶段就内化了一套行为准则，减少对人工标注的依赖。

Claude 当前模型家族包括多个层级：

- **Opus**：最强推理能力，适合复杂分析和代理任务
- **Sonnet**：性能与速度的平衡点，适合大多数开发场景
- **Haiku**：轻量快速，适合高吞吐、低延迟的应用

所有模型均支持 tool use（工具调用）、视觉理解和结构化输出，通过 Anthropic API 或 [Amazon](/glossary/amazon) Bedrock、[Google](/glossary/google) Vertex AI 等云平台接入。

## 相关术语

- **[Anthropic](/glossary/anthropic)**：Claude 的开发公司，专注于 AI 安全研究
- **[Claude Code](/glossary/claude-code)**：基于 Claude 构建的终端编程代理工具
- **[Google](/glossary/google)**：Gemini 系列模型的开发者，Claude 的主要竞争对手之一

---

*觉得有用？[订阅 LoreAI](/subscribe)，每天 5 分钟掌握 AI 动态。*