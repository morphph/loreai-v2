---
title: "GPT-2 — AI 术语表"
slug: gpt-2
description: "什么是 GPT-2？OpenAI 发布的 15 亿参数语言模型，开启了大规模文本生成的新时代。"
term: gpt-2
display_term: "GPT-2"
category: models
related_glossary: [anthropic, claude]
related_blog: []
related_compare: []
lang: zh
---

# GPT-2 — AI 术语表

**GPT-2** 是 OpenAI 于 2019 年发布的自回归语言模型，基于 Transformer 解码器架构，拥有 15 亿参数。它是首个在多项自然语言任务上展现出强大零样本（zero-shot）能力的通用文本生成模型，标志着大语言模型从「专用」走向「通用」的关键转折点。

## 为什么 GPT-2 重要

GPT-2 的发布改变了整个 AI 行业对语言模型的认知。OpenAI 最初以「生成效果过于逼真、可能被滥用」为由延迟公开完整权重，这一决定本身就引发了关于 AI 安全与开放研究的广泛讨论——也间接推动了 [Anthropic](/glossary/anthropic) 等以安全为核心的 AI 公司的成立。

从技术影响看，GPT-2 验证了「scaling law」的早期直觉：更大的模型 + 更多的数据 = 更强的涌现能力。这条路线最终催生了 GPT-3、GPT-4，以及 [Claude](/glossary/claude) 等竞争模型。今天几乎所有主流大语言模型的架构设计都能追溯到 GPT-2 奠定的范式。

## GPT-2 的工作原理

GPT-2 采用纯 Transformer 解码器（decoder-only）架构，通过自回归方式逐 token 生成文本——每一步预测下一个最可能的词元。

核心技术细节：

- **训练数据**：WebText 数据集，约 800 万网页，经过质量筛选
- **模型规模**：四个版本，从 1.17 亿到 15 亿参数
- **上下文窗口**：1024 个 token
- **关键创新**：证明了无需任务特定微调，仅通过扩大预训练规模就能在摘要、翻译、问答等任务上取得可用结果

GPT-2 的权重现已完全开源，成为研究社区最常用的基准模型之一，广泛用于文本生成、模型蒸馏和安全性研究实验。

## 相关术语

- **[Anthropic](/glossary/anthropic)**：由前 OpenAI 研究人员创立的 AI 安全公司，其成立部分受 GPT-2 时代关于 AI 安全讨论的推动
- **[Claude](/glossary/claude)**：Anthropic 开发的大语言模型系列，与 GPT 系列形成直接竞争关系

---

*觉得有用？[订阅 LoreAI](/subscribe)，每天 5 分钟掌握 AI 动态。*