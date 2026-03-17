---
title: "GLM-OCR 开源：智谱系高性能图文识别模型上线 HuggingFace"
date: 2026-03-17
slug: glm-ocr-open-source-image-to-text-model
description: "GLM-OCR 是 zai-org 发布的开源图文识别模型，登上 HuggingFace 热榜。支持图片和视频输入，具备工具调用和推理能力，适合文档处理和 OCR 场景。"
keywords: ["GLM-OCR", "开源 OCR 模型", "图文识别", "HuggingFace 热榜"]
category: MODEL
related_newsletter: 2026-03-17
related_glossary: [ocr, open-source-model]
related_compare: []
lang: zh
video_ready: true
video_hook: "开源 OCR 又有新选手，GLM-OCR 登上 HuggingFace 热榜"
video_status: none
---

# GLM-OCR 开源：智谱系高性能图文识别模型上线 HuggingFace

**GLM-OCR** 登上了 [HuggingFace 热榜](https://huggingface.co/zai-org/GLM-OCR)。这是 zai-org 发布的一款开源图文识别模型，基于 GLM 架构，支持图片和视频输入，还内置了工具调用和推理链能力。对于做文档处理、票据识别、内容提取的开发者来说，又多了一个值得评估的开源选项。

## 发生了什么

zai-org 在 HuggingFace 上发布了 **GLM-OCR** 模型，迅速登上趋势榜。从模型配置来看，GLM-OCR 基于 GLM 系列架构（与智谱 **ChatGLM** 同源），专门针对 [OCR](/glossary/ocr) 场景进行了优化。

模型的核心能力包括：

- **多模态输入**：支持图片（`<|begin_of_image|>`）和视频（`<|begin_of_video|>`）两种视觉输入格式
- **工具调用**：内置 function calling 能力，可以在识别流程中调用外部工具
- **推理链**：支持 `<think></think>` 推理模式，模型可以在输出结果前进行中间推理

模型以开源形式发布在 HuggingFace 上，权重可直接下载部署。这是 GLM 生态在视觉理解方向的又一次延伸——从对话大模型到专项视觉任务模型。

## 为什么重要

OCR 是 AI 落地最成熟的场景之一，但开源社区一直缺少"好用且现代"的选择。传统方案如 Tesseract 精度有限，商业 API（Google Vision、Azure OCR、百度文字识别）按量计费成本不低。近一年涌现的多模态大模型虽然能做 OCR，但用 70B 参数的通用模型跑票据识别，性价比显然不合理。

GLM-OCR 的定位卡在一个实用的空档：专注 OCR 场景的[开源模型](/glossary/open-source-model)，同时具备现代多模态架构的能力。推理链功能意味着它能处理复杂版面——比如表格、多列排版、混合图文——先"想"清楚文档结构，再输出识别结果。

工具调用的加入也值得关注。这意味着 GLM-OCR 可以嵌入到更复杂的工作流中：识别发票后直接调用 API 录入系统，解析合同后触发审核流程。不再只是"输入图片，输出文字"的单一管道。

对国内开发者而言，GLM 系列模型的生态和社区支持一直不错，部署文档、微调工具链相对完善。相比直接使用海外模型，本地化适配的摩擦更小。

## 技术细节

从 HuggingFace 上公开的模型配置来看，GLM-OCR 的几个技术特点值得关注：

**Chat Template 设计**：模型使用 `[gMASK]<sop>` 作为序列起始标记，这是 GLM 家族的标准做法。多模态输入通过特殊 token 标记——图片用 `<|begin_of_image|><|image|><|end_of_image|>` 包裹，视频类似。这种设计让模型可以在同一个对话中混合处理文本和视觉内容。

**推理模式**：模型支持可选的思考链（thinking）功能。通过 `/nothink` 后缀可以关闭推理过程，直接输出结果。这个设计很实用——简单场景跳过推理降低延迟，复杂版面开启推理提升精度。

**工具调用格式**：采用 XML 风格的 `<tool_call>` 标签，支持在识别流程中调用外部函数。这让 GLM-OCR 可以作为 Agent 工作流的视觉感知模块，而不只是一个独立的识别引擎。

部署方面，模型权重直接从 HuggingFace 下载，使用标准的 Transformers 推理管线即可加载。对于有 GPU 资源的团队，本地部署后可以实现零 API 成本的批量文档处理。

需要注意的是，目前 HuggingFace 页面上尚未公开详细的跑分对比数据和参数量信息。在实际投入生产前，建议在自己的数据集上做充分的评估测试。

## 你现在该做什么

1. **跑个 demo 试试**。从 [HuggingFace 模型页](https://huggingface.co/zai-org/GLM-OCR) 下载权重，用你自己的文档样本测试识别效果，重点关注中文场景、复杂表格和手写体的表现。
2. **和你现有方案对比**。如果你在用商业 OCR API，拿同样的测试集跑一下 GLM-OCR，看看精度差距能否接受——能接受的话，成本节省会很可观。
3. **关注社区反馈**。模型刚上热榜，HuggingFace 讨论区和 GitHub Issues 里的实际使用报告会陆续出现，这些真实场景的反馈比官方跑分更有参考价值。
4. **评估工具调用集成**。如果你的业务有"识别 + 后处理"的管线需求，GLM-OCR 的 function calling 能力可能让你省掉一层胶水代码。

**相关阅读**：[今日简报](/newsletter/2026-03-17) 有更多 AI 动态。

---

*觉得有用？[订阅 AI 简报](/subscribe)，每天 5 分钟掌握 AI 动态。*