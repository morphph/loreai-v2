---
title: "Diffusers — 你需要知道的一切"
slug: diffusers
description: "Diffusers 完全指南：Hugging Face 扩散模型库的功能、架构与实战资源。"
pillar_topic: Diffusers
category: frameworks
related_glossary: [diffusers]
related_blog: []
related_compare: []
related_faq: []
lang: zh
---

# Diffusers — 你需要知道的一切

**Diffusers** 是 Hugging Face 推出的开源 Python 库，专门用于扩散模型（diffusion models）的推理与训练。它提供了统一的 API 来加载和运行 Stable Diffusion、SDXL、Kandinsky、DeepFloyd IF 等主流图像生成模型，同时支持音频、视频、3D 等多模态生成任务。Diffusers 的设计哲学是**可用性优先**——三行代码就能跑通一个文生图 pipeline，同时保留了底层组件的完全可定制性，方便研究者替换 scheduler、修改 UNet 架构或实现新的采样策略。自 2022 年发布以来，Diffusers 已成为扩散模型生态中事实上的标准工具库，在 GitHub 上拥有超过 26,000 颗星。

## 最新动态

2025 年以来，Diffusers 的迭代重心明显转向了**视频生成**和**加速推理**。库中陆续集成了多个视频扩散模型的支持，包括 Stable Video Diffusion 和社区贡献的 AnimateDiff pipeline。在推理性能方面，Diffusers 深度整合了 PyTorch 2.0 的 `torch.compile` 和 scaled dot-product attention（SDPA），在不损失质量的前提下将推理速度提升了 30-50%。

另一个值得关注的方向是**LoRA 和适配器生态**的成熟。Diffusers 原生支持加载、融合和切换 LoRA 权重，配合 Hugging Face Hub 上数以万计的社区 LoRA 模型，开发者可以用极低成本实现风格定制和领域微调。

## 核心功能与架构

**Pipeline 抽象层**是 Diffusers 最重要的设计。每个 pipeline 封装了完整的推理流程——从文本编码、噪声调度到最终解码——开发者只需调用 `pipe(prompt)` 即可获得生成结果。库内置了超过 30 种 pipeline 类型，覆盖文生图、图生图、inpainting、controlnet、img2img 等场景。

底层组件采用**模块化设计**：

- **模型层**：UNet2DConditionModel、Transformer2DModel 等骨干网络，支持从 Hugging Face Hub 直接加载预训练权重
- **Scheduler**：DDPM、DDIM、Euler、DPM-Solver 等 20+ 种采样调度器，可即插即用地替换，无需修改其他代码
- **训练工具**：提供 `diffusers.training_utils` 和官方训练脚本，支持 DreamBooth、Textual Inversion、LoRA 微调等主流训练范式

Diffusers 还与 Hugging Face 生态深度集成——`Accelerate` 处理分布式训练，`Safetensors` 保障模型文件安全，`Spaces` 提供一键部署 demo 的能力。

## 常见问题

- **Diffusers 和 ComfyUI 有什么区别？** Diffusers 是 Python 代码库，面向开发者和研究者；ComfyUI 是节点式可视化工具，面向创作者和非技术用户
- **Diffusers 支持哪些硬件？** 支持 NVIDIA GPU（CUDA）、Apple Silicon（MPS）和 CPU 推理，部分模型还支持 AMD GPU（ROCm）
- **如何用 Diffusers 训练自己的模型？** 官方提供了 DreamBooth 和 LoRA 训练脚本，配合 Accelerate 库可在单卡或多卡上完成微调

## 对比

- **Diffusers vs ComfyUI**：代码优先 vs 节点式 UI——Diffusers 适合集成到产品和研究 pipeline，ComfyUI 适合快速实验和艺术创作
- **Diffusers vs AUTOMATIC1111 WebUI**：Diffusers 是底层库，WebUI 是基于 Diffusers（部分）构建的上层应用，功能更面向终端用户

## 所有 Diffusers 资源

### 术语表
- [Diffusers](/glossary/diffusers) — Hugging Face 扩散模型开源库

### 相关术语
- [Agentic](/glossary/agentic) — AI 自主代理范式
- [Agent Teams](/glossary/agent-teams) — 多代理协作架构

---

*觉得有用？[订阅 LoreAI](/subscribe)，每天 5 分钟掌握 AI 动态。*