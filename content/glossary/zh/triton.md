---
title: "Triton — AI 术语表"
slug: triton
description: "什么是 Triton？OpenAI 开源的 GPU 编程语言，用 Python 语法编写高性能 GPU 内核。"
term: triton
display_term: "Triton"
category: frameworks
related_glossary: [fine-tuning]
related_blog: [openai-updated-model-spec-2026]
related_compare: []
lang: zh
---

# Triton — AI 术语表

**Triton** 是 OpenAI 开源的 GPU 编程语言和编译器，让开发者用类 Python 的语法编写高性能 GPU 内核（kernel），而不需要直接写 CUDA C/C++。它大幅降低了 GPU 编程的门槛，同时生成的代码性能接近甚至匹敌手写 CUDA。

## 为什么 Triton 重要

深度学习的训练和推理都依赖 GPU 加速，但传统 CUDA 编程要求开发者理解线程调度、共享内存管理、内存合并等底层细节——学习曲线陡峭，调试困难。Triton 把这些复杂性封装到编译器层面，研究者只需关注算法逻辑本身。

PyTorch 2.0 的 `torch.compile` 后端就使用 Triton 作为默认的代码生成目标，这意味着整个 PyTorch 生态已经在大规模依赖 Triton。对于需要自定义算子的场景——比如 Flash Attention、量化推理内核、[模型微调](/glossary/fine-tuning)中的特殊操作——Triton 已经成为事实上的标准工具。更多 OpenAI 技术动态可参见我们的[相关报道](/blog/openai-updated-model-spec-2026)。

## Triton 的工作原理

Triton 采用基于 block 的编程模型。开发者用 Python 装饰器 `@triton.jit` 标记内核函数，在函数内部以数据块（block）为单位操作张量，而非逐线程编写逻辑。Triton 编译器负责自动处理：

- **内存合并**：优化全局内存访问模式
- **共享内存分配**：自动管理 on-chip 缓存
- **线程调度与同步**：将 block 操作映射到 GPU 硬件的线程网格

编译流程上，Triton 将 Python DSL 先转为自有的中间表示（Triton-IR），经过多轮优化后生成 PTX 指令，最终由 NVIDIA 驱动编译为 GPU 机器码。目前主要支持 NVIDIA GPU，AMD GPU 支持正在推进中。

## 相关术语

- **[Fine-tuning](/glossary/fine-tuning)**：模型微调中常需自定义 GPU 内核，Triton 是编写这类内核的首选工具
- **[Google DeepMind](/glossary/google-deepmind)**：作为 AI 研究机构，同样在探索替代 CUDA 的 GPU 编程方案

---

*觉得有用？[订阅 LoreAI](/subscribe)，每天 5 分钟掌握 AI 动态。*