---
title: "LTX-2.3 — AI 术语表"
slug: ltx
description: "什么是 LTX-2.3？Lightricks 推出的开源视频生成模型，支持文本和图像生成视频。"
term: ltx
display_term: "LTX-2.3"
category: models
related_glossary: [fine-tuning]
related_blog: []
related_compare: []
lang: zh
---

# LTX-2.3 — AI 术语表

**LTX-2.3** 是以色列公司 Lightricks 推出的开源视频生成模型，属于 LTX-Video 系列的最新迭代。它支持文本生成视频（text-to-video）和图像生成视频（image-to-video），能够快速生成高质量的短视频片段。作为一个开源模型，LTX-2.3 可在本地部署运行，也可通过 ComfyUI 等工具链集成使用。

## 为什么 LTX-2.3 值得关注

视频生成是当前 AI 领域竞争最激烈的赛道之一。与 Sora、Kling、Runway 等闭源方案不同，LTX-Video 系列走的是**开源路线**——开发者可以免费下载模型权重，在自己的硬件上运行，甚至进行 [fine-tuning](/glossary/fine-tuning) 以适配特定场景。

LTX-2.3 相比前代版本在视频连贯性、运动自然度和画面质量上均有提升，同时保持了较快的生成速度。对于预算有限但需要视频生成能力的独立开发者和小团队来说，这是一个实用的选择。

## LTX-2.3 的工作原理

LTX-Video 系列基于 **DiT（Diffusion Transformer）** 架构，将扩散模型与 Transformer 结合用于视频生成。模型在潜空间（latent space）中对视频帧进行去噪，通过时空注意力机制确保帧间的时序一致性。

核心特点：

- **实时或接近实时的生成速度**：在消费级 GPU 上即可运行
- **多模态输入**：支持纯文本提示词，也支持以参考图像为起点生成视频
- **开源权重**：通过 Hugging Face 公开发布，社区可自由使用和二次开发
- **ComfyUI 集成**：通过节点式工作流轻松接入现有创作管线

## 相关术语

- **[Fine-tuning](/glossary/fine-tuning)**：可对 LTX-2.3 进行微调，使其适配特定风格或领域的视频生成需求
- **[GPT](/glossary/gpt)**：OpenAI 的语言模型系列，其 Sora 视频模型是 LTX-2.3 在闭源领域的主要竞品
- **[Google DeepMind](/glossary/google-deepmind)**：其 Veo 系列同样是视频生成领域的重要参与者

---

*觉得有用？[订阅 LoreAI](/subscribe)，每天 5 分钟掌握 AI 动态。*