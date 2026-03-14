---
title: "Diffusers — AI 术语表"
slug: diffusers
description: "什么是 Diffusers？Hugging Face 开源的扩散模型推理与训练库，支持图像、视频、音频生成。"
term: diffusers
display_term: "Diffusers"
category: frameworks
related_glossary: [stable-diffusion, hugging-face, transformers]
related_blog: []
related_compare: []
lang: zh
---

# Diffusers — AI 术语表

**Diffusers** 是 Hugging Face 推出的开源 Python 库，专门用于扩散模型（Diffusion Models）的推理、训练和微调。它提供了统一的 API 来加载和运行 Stable Diffusion、SDXL、Kandinsky、DeepFloyd IF 等主流图像生成模型，同时支持视频和音频生成。开发者只需几行代码就能调用预训练模型，完成文生图、图生图、修复（inpainting）等任务。

## 为什么 Diffusers 重要

扩散模型是当前 AI 生成内容（AIGC）的核心技术之一，但原始模型的推理代码往往分散在各个研究团队的仓库中，接口不统一、依赖复杂。Diffusers 解决了这个碎片化问题——它把数十种扩散模型统一到一个框架下，提供标准化的 Pipeline 接口和调度器（Scheduler）抽象。

对于产品团队来说，Diffusers 大幅降低了将生成式 AI 集成到应用中的门槛。结合 Hugging Face Hub 的模型托管生态，开发者可以一行代码下载并运行社区微调的 LoRA 权重或自定义 checkpoint。

## Diffusers 的工作原理

Diffusers 的架构围绕三个核心组件构建：

- **Pipeline**：端到端的推理封装，包含模型加载、文本编码、去噪迭代和后处理。`StableDiffusionPipeline` 是最常用的入口
- **Scheduler**：控制去噪过程的采样策略（如 DDPM、DDIM、Euler），不同调度器在速度和质量之间做取舍
- **Model**：底层的 UNet、[Transformer](/glossary/transformers) 等神经网络模块，支持 FP16、量化等优化

Diffusers 原生支持 PyTorch，同时兼容 ONNX Runtime 和 Apple Silicon（MPS），方便在不同硬件上部署。

## 相关术语

- **[Stable Diffusion](/glossary/stable-diffusion)**：最广泛使用的开源扩散模型，Diffusers 的核心支持对象
- **[Hugging Face](/glossary/hugging-face)**：Diffusers 的开发方，同时维护 Transformers 等 AI 开源生态
- **[Transformers](/glossary/transformers)**：Hugging Face 的 NLP/多模态模型库，与 Diffusers 共享设计理念和模型加载机制

---

*觉得有用？[订阅 LoreAI](/subscribe)，每天 5 分钟掌握 AI 动态。*