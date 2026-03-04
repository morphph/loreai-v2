---
title: "Qwen — AI 术语表"
slug: qwen
description: "什么是 Qwen？阿里巴巴开源的大语言模型系列，覆盖文本、视觉和代码生成。"
term: qwen
display_term: "Qwen"
category: models
related_glossary: [claude, anthropic]
related_blog: []
related_compare: []
lang: zh
---

# Qwen — AI 术语表

**Qwen**（通义千问）是阿里巴巴集团推出的开源大语言模型系列。该系列覆盖多种模态和规模，从轻量级的 Qwen2.5-0.5B 到旗舰级的 Qwen2.5-72B，支持文本生成、代码编写、数学推理和多模态理解。Qwen 采用 Apache 2.0 开源协议，开发者可自由商用。

## 为什么 Qwen 重要

Qwen 是目前中文能力最强的开源模型之一，同时在英文基准测试中也表现出色。对于需要部署私有化大模型的企业来说，Qwen 提供了一条成本可控的路径——无需依赖闭源 API，就能获得接近 [Claude](/glossary/claude) 等商业模型的效果。

阿里巴巴通过 Hugging Face 和 ModelScope 同步发布模型权重，配合活跃的社区生态，Qwen 已成为国内外开发者微调和二次开发的热门基座模型。

## Qwen 的工作原理

Qwen 基于 Transformer 架构，采用 decoder-only 设计。Qwen2.5 系列在训练数据和对齐方法上做了大幅升级：

- **多语言训练**：预训练语料涵盖中、英、日、韩等多种语言，中文语料占比显著高于同类开源模型
- **长上下文支持**：部分版本支持 128K token 的上下文窗口，适合长文档处理
- **多模态扩展**：Qwen-VL 系列支持图文混合输入，Qwen-Audio 支持语音理解
- **代码能力**：Qwen2.5-Coder 专门针对代码任务优化，支持多种编程语言

模型通过 SFT（监督微调）和 RLHF（人类反馈强化学习）完成对齐，提供 base 和 chat 两种版本。

## 相关术语

- **[Claude](/glossary/claude)**：[Anthropic](/glossary/anthropic) 的闭源大语言模型系列，在推理和安全性方面有独特优势
- **[Anthropic](/glossary/anthropic)**：专注 AI 安全的公司，开发了 Claude 系列模型

---

*觉得有用？[订阅 LoreAI](/subscribe)，每天 5 分钟掌握 AI 动态。*