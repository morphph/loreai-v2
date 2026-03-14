---
title: "Qualcomm — AI 术语表"
slug: qualcomm
description: "Qualcomm 是全球领先的移动芯片和无线技术公司，其 AI 引擎驱动端侧智能推理。"
term: qualcomm
display_term: "Qualcomm"
category: frameworks
related_glossary: [chatgpt]
related_blog: [openai-computer-access-agents-lessons]
related_compare: []
lang: zh
---

# Qualcomm — AI 术语表

**Qualcomm**（高通）是一家总部位于美国圣迭戈的半导体与无线技术公司，以其 Snapdragon（骁龙）系列移动处理器闻名。在 AI 领域，Qualcomm 通过集成于芯片的 **AI Engine** 和专用神经网络处理单元（NPU），让大语言模型和生成式 AI 能够直接在手机、PC 和边缘设备上运行，而无需依赖云端算力。

## 为什么 Qualcomm 重要

端侧 AI 推理正在成为行业关键趋势。相比云端方案，在设备本地运行模型意味着更低延迟、更好的隐私保护，以及在无网络环境下的可用性。Qualcomm 的 Snapdragon 8 系列和 Snapdragon X Elite（面向笔记本电脑）芯片，已经能够在设备端运行数十亿参数的语言模型。

这对 AI 应用开发者意味着：未来的 [AI 智能体](/blog/openai-computer-access-agents-lessons)不仅运行在云端，还将直接嵌入用户手中的硬件。三星、小米、微软 Surface 等主流终端都搭载骁龙平台，覆盖数十亿设备。

## Qualcomm 的 AI 技术栈

Qualcomm 的端侧 AI 能力由几个关键组件构成：

- **Hexagon NPU**：专用神经网络加速器，负责高效执行矩阵运算和模型推理
- **Qualcomm AI Engine**：统一调度 CPU、GPU 和 NPU 的异构计算框架，自动为不同算子选择最优硬件
- **Qualcomm AI Hub**：提供预优化模型库，开发者可以直接部署经过量化和编译优化的模型到骁龙设备
- **Snapdragon X Elite**：面向 Windows PC 的 Arm 架构芯片，支持在笔记本上本地运行 Stable Diffusion、Llama 等模型

Qualcomm 同时与 Meta、微软、Google 等合作，将主流开源模型适配到其硬件平台。

## 相关术语

- **[ChatGPT](/glossary/chatgpt)**：OpenAI 的对话式 AI，云端推理与端侧推理形成互补路线
- **[AI 监管](/glossary/ai-regulation)**：端侧 AI 的隐私优势正在影响各国 AI 数据合规政策的走向

---

*觉得有用？[订阅 LoreAI](/subscribe)，每天 5 分钟掌握 AI 动态。*