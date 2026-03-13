---
title: "开放权重模型（Open-Weight Models） — AI 术语表"
slug: open-weight-models
description: "什么是开放权重模型？指公开发布模型权重、允许下载和部署的 AI 模型。"
term: open-weight-models
display_term: "开放权重模型（Open-Weight Models）"
category: models
related_glossary: [chatgpt, claude-desktop]
related_blog: [openai-computer-access-agents-lessons]
related_compare: []
lang: zh
---

# 开放权重模型（Open-Weight Models） — AI 术语表

**开放权重模型（Open-Weight Models）** 是指将训练完成的模型权重公开发布，允许开发者自由下载、部署和微调的 AI 模型。与完全闭源的 API 服务不同，开放权重模型让用户可以在自己的硬件上运行推理，拥有对模型行为更直接的控制权。代表项目包括 Meta 的 Llama 系列、Mistral 以及阿里的 Qwen 系列。

## 为什么开放权重模型重要

开放权重模型正在重塑 AI 行业的竞争格局。对企业而言，它意味着数据不需要离开自己的服务器，解决了隐私和合规问题；对研究者而言，公开的权重让模型可解释性研究和安全对齐实验成为可能。

值得注意的是，"开放权重"并不等于"开源"。大多数开放权重模型只公开了推理所需的参数，但训练数据、训练代码和完整的复现流程往往仍然保密。这一区别直接影响社区能否真正审计和改进这些模型。更多关于 AI 工具生态的分析，可以阅读我们的[代理型工具深度报道](/blog/openai-computer-access-agents-lessons)。

## 开放权重模型如何运作

开放权重模型通常以标准格式（如 safetensors、GGUF）发布在 Hugging Face 等平台上。开发者下载权重后，通过 vLLM、llama.cpp 或 Ollama 等推理框架在本地 GPU 上加载运行。

核心使用方式包括：

- **直接推理**：加载原始权重，用于对话、代码生成、文本分析等任务
- **微调（Fine-tuning）**：在特定领域数据上继续训练，让模型适配垂直场景——如法律文书、医疗问答
- **量化部署**：通过 INT4/INT8 量化压缩模型体积，使其能在消费级显卡甚至 CPU 上运行

模型许可证各有不同——Llama 使用自定义商用许可，Mistral 采用 Apache 2.0，Qwen 则有自己的许可条款。部署前务必确认许可证的具体限制。

## 相关术语

- **[ChatGPT](/glossary/chatgpt)**：OpenAI 的闭源对话模型，与开放权重模型形成商业模式上的对比
- **[Claude Desktop](/glossary/claude-desktop)**：Anthropic 的桌面端 AI 助手，采用 API 闭源模式运行

---

*觉得有用？[订阅 LoreAI](/subscribe)，每天 5 分钟掌握 AI 动态。*