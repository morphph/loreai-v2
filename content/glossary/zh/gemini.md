---
title: "Gemini — AI 术语表"
slug: gemini
description: "什么是 Gemini？Google DeepMind 开发的多模态大语言模型系列。"
term: gemini
display_term: "Gemini"
category: models
related_glossary: [claude, anthropic]
related_blog: [anthropic-cowork-claude-desktop-agent]
related_compare: []
lang: zh
---

# Gemini — AI 术语表

**Gemini** 是 Google DeepMind 推出的多模态大语言模型系列，能够同时处理文本、图像、音频、视频和代码。它是 Google 在 AI 领域的核心产品，直接集成到 Google Search、Workspace、Android 等产品生态中，也通过 API 向开发者开放。

## 为什么 Gemini 重要

Gemini 是当前大模型竞争格局中的关键玩家。与 [Anthropic](/glossary/anthropic) 的 [Claude](/glossary/claude) 和 OpenAI 的 GPT 系列并列，Gemini 构成了 AI 模型"三足鼎立"的局面。

它的独特优势在于与 Google 生态的深度绑定——搜索、Gmail、Google Docs 都内置了 Gemini 能力，这意味着数十亿用户可以零门槛使用 AI。对开发者而言，Gemini 提供了从轻量级到旗舰级的完整模型矩阵，配合 Google Cloud 的基础设施，在企业级应用中具备强竞争力。关于 Anthropic 在智能体方向的最新动作，可以参考我们的[深度分析](/blog/anthropic-cowork-claude-desktop-agent)。

## Gemini 的工作原理

Gemini 基于 Transformer 架构，从训练阶段就原生支持多模态输入，而非后期拼接。这意味着模型在理解图文混合内容时，具备更自然的跨模态推理能力。

当前 Gemini 系列包含多个规格：

- **Gemini Ultra / 1.5 Pro**：旗舰模型，支持超长上下文窗口（最高可达百万 token 级别），适合复杂推理和长文档分析
- **Gemini Flash**：轻量高速版本，针对低延迟场景优化，适合实时应用
- **Gemini Nano**：端侧模型，直接运行在 Pixel 手机等设备上，无需云端调用

Gemini 通过 Google AI Studio 和 Vertex AI 两个平台对外提供 API 服务，开发者可以根据需求选择不同模型规格。

## 相关术语

- **[Claude](/glossary/claude)**：Anthropic 开发的大语言模型系列，在代码生成和长文本理解方面与 Gemini 直接竞争
- **[Anthropic](/glossary/anthropic)**：专注 AI 安全的公司，Claude 系列模型的开发者，是 Google 在 AI 领域的主要竞争对手之一

---

*觉得有用？[订阅 LoreAI](/subscribe)，每天 5 分钟掌握 AI 动态。*