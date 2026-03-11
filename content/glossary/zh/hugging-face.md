---
title: "Hugging Face — AI 术语表"
slug: hugging-face
description: "什么是 Hugging Face？全球最大的开源 AI 模型与数据集共享平台。"
term: hugging-face
display_term: "Hugging Face"
category: frameworks
related_glossary: [chatgpt, cursor]
related_blog: [claude-code-enterprise-engineering-ramp-shopify-spotify]
related_compare: []
lang: zh
---

# Hugging Face — AI 术语表

**Hugging Face** 是全球最大的开源机器学习平台，提供模型托管、数据集共享和推理部署服务。开发者可以在 Hugging Face Hub 上发布、下载和使用数十万个预训练模型，涵盖自然语言处理、计算机视觉、语音识别等各领域。它同时也是 Transformers、Diffusers、Datasets 等核心开源库的维护方。

## 为什么 Hugging Face 重要

Hugging Face 大幅降低了 AI 开发的门槛。过去训练或使用一个大型语言模型需要从头搭建基础设施，现在只需几行代码就能加载社区共享的模型。它在开源 AI 生态中扮演了类似 GitHub 在软件开发中的角色——既是代码仓库，也是协作社区。

从 Meta 的 LLaMA 到 Stability AI 的 Stable Diffusion，主流开源模型几乎都选择 Hugging Face 作为首发平台。对企业而言，它提供的 Inference Endpoints 和 Spaces 让模型部署变得简单可控。了解更多 AI 工具在企业落地的实践，可以参考我们关于 [Claude Code 企业应用](/blog/claude-code-enterprise-engineering-ramp-shopify-spotify)的分析。

## Hugging Face 如何运作

Hugging Face 的核心是 **Hub**——一个托管模型、数据集和 Spaces（交互式应用）的平台。开发者通过 `transformers` 库可以用统一的 API 调用不同架构的模型：

```python
from transformers import pipeline
classifier = pipeline("sentiment-analysis")
result = classifier("Hugging Face is amazing")
```

关键组件包括：

- **Model Hub**：托管超过 50 万个模型，支持 PyTorch、TensorFlow、JAX 等框架
- **Datasets**：标准化的数据集加载和处理工具
- **Spaces**：基于 Gradio 或 Streamlit 的在线 Demo 托管
- **Inference API**：无需部署即可通过 HTTP 调用模型

## 相关术语

- **[ChatGPT](/glossary/chatgpt)**：OpenAI 的对话式 AI 产品，与 Hugging Face 上的开源替代品形成竞争
- **[Cursor](/glossary/cursor)**：AI 辅助编码工具，底层可使用 Hugging Face 托管的模型
- **[Agentic Coding](/glossary/agentic-coding)**：AI 代理式编程范式，Hugging Face 提供的开源模型是其重要基础设施

---

*觉得有用？[订阅 LoreAI](/subscribe)，每天 5 分钟掌握 AI 动态。*