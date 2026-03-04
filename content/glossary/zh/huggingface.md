---
title: "Hugging Face — AI 术语表"
slug: huggingface
description: "什么是 Hugging Face？全球最大的开源 AI 模型与数据集共享平台。"
term: huggingface
display_term: "Hugging Face"
category: frameworks
related_glossary: [anthropic, claude, google]
related_blog: [anthropic-claude-memory-upgrades-importing]
related_compare: []
lang: zh
---

# Hugging Face — AI 术语表

**Hugging Face** 是全球最大的开源机器学习平台，提供模型托管、数据集共享和推理部署的一站式服务。开发者可以在 Hugging Face Hub 上发布、发现和使用超过数十万个预训练模型，涵盖自然语言处理、计算机视觉、语音识别等领域。

## 为什么 Hugging Face 重要

Hugging Face 极大地降低了 AI 开发的门槛。过去训练或使用一个大模型需要从零搭建流程，现在只要几行代码就能加载社区共享的模型。它已经成为 AI 领域的"GitHub"——无论是 Meta 的 LLaMA、Google 的 Gemma，还是 Mistral 等热门开源模型，首发阵地几乎都是 Hugging Face Hub。

对企业而言，Hugging Face 提供 Inference Endpoints 和 Spaces 等商业服务，让团队无需管理 GPU 基础设施就能部署模型。关于各大 AI 公司的最新动态，可以参考我们的[每日简报](/newsletter/2026-03-04)。

## Hugging Face 的核心机制

Hugging Face 生态围绕几个关键组件构建：

- **Transformers 库**：最广泛使用的开源模型推理与微调框架，支持 PyTorch、TensorFlow 和 JAX 三大后端
- **Hub**：托管模型、数据集和 Spaces 应用的中央仓库，内置版本控制（基于 Git LFS）
- **Tokenizers**：高性能分词库，用 Rust 编写，处理速度远超纯 Python 实现
- **Spaces**：零配置的应用托管服务，支持 Gradio 和 Streamlit，常用于模型 demo 展示

开发者可以通过 `pipeline()` 接口在三行代码内完成文本生成、情感分析、图像分类等任务，也可以用 `Trainer` API 对模型进行微调。

## 相关术语

- **[Anthropic](/glossary/anthropic)**：Claude 系列模型的开发商，与 Hugging Face 生态中的开源模型形成互补
- **[Claude](/glossary/claude)**：Anthropic 的闭源大语言模型，在推理和代码能力上表现突出
- **[Google](/glossary/google)**：通过 Gemma 等开源模型活跃于 Hugging Face 社区

---

*觉得有用？[订阅 LoreAI](/subscribe)，每天 5 分钟掌握 AI 动态。*