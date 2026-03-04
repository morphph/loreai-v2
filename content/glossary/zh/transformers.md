---
title: "Transformers — AI 术语表"
slug: transformers
description: "什么是 Transformers？基于自注意力机制的深度学习架构，驱动了现代大语言模型的发展。"
term: transformers
display_term: "Transformers"
category: concepts
related_glossary: [anthropic, claude, google]
related_blog: [anthropic-claude-memory-upgrades-importing]
related_compare: []
lang: zh
---

# Transformers — AI 术语表

**Transformers** 是一种基于自注意力（Self-Attention）机制的深度学习架构，由 Google 团队在 2017 年论文《Attention Is All You Need》中提出。它彻底取代了 RNN 和 LSTM 在序列建模任务中的主导地位，成为 GPT、[Claude](/glossary/claude)、Gemini 等现代大语言模型的核心架构。

## 为什么 Transformers 重要

Transformers 的出现直接催生了大语言模型时代。与传统循环网络不同，它能并行处理整个序列，训练效率大幅提升，这让模型规模从数百万参数跨越到数千亿参数成为可能。

从 [Anthropic](/glossary/anthropic) 的 Claude 到 [Google](/glossary/google) 的 Gemini，几乎所有主流 AI 产品都构建在 Transformer 架构之上。无论是文本生成、代码补全、图像理解还是多模态推理，Transformer 都是底层引擎。更多 AI 模型动态可参考我们的 [Claude 记忆功能解析](/blog/anthropic-claude-memory-upgrades-importing)。

## Transformers 的工作原理

Transformer 的核心是**自注意力机制**：序列中的每个 token 都能直接关注其他所有 token，计算它们之间的关联权重。这让模型无需逐步处理，就能捕捉长距离依赖关系。

关键组件：
- **Multi-Head Attention**：多组注意力头并行运算，捕捉不同维度的语义关系
- **位置编码（Positional Encoding）**：为输入注入序列位置信息，弥补并行处理丢失的顺序感知
- **前馈网络（FFN）**：每层中对注意力输出做非线性变换
- **编码器-解码器结构**：原始设计包含两部分，现代 LLM 多采用纯解码器（Decoder-only）变体

## 相关术语

- **[Claude](/glossary/claude)**：Anthropic 开发的大语言模型系列，基于 Transformer 架构构建
- **[Anthropic](/glossary/anthropic)**：Claude 的开发公司，专注于 AI 安全研究
- **[Google](/glossary/google)**：Transformer 架构的发源地，持续推动模型前沿

---

*觉得有用？[订阅 LoreAI](/subscribe)，每天 5 分钟掌握 AI 动态。*