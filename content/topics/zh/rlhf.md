---
title: "RLHF — 你需要知道的一切"
slug: rlhf
description: "RLHF（人类反馈强化学习）完整指南：原理、最新进展与相关资源汇总。"
pillar_topic: RLHF
category: techniques
related_glossary: [anthropic, claude]
related_blog: [gemini-3-1-pro-complex-tasks]
related_compare: []
related_faq: []
lang: zh
---

# RLHF — 你需要知道的一切

**RLHF**（Reinforcement Learning from Human Feedback，人类反馈强化学习）是当前大语言模型对齐的核心技术。它解决了一个根本性问题：如何让模型的输出符合人类的偏好和价值观，而不仅仅是预测下一个 token。从 OpenAI 的 InstructGPT 到 [Anthropic](/glossary/anthropic) 的 [Claude](/glossary/claude)，几乎所有主流对话式 AI 产品都依赖 RLHF 或其变体来实现"有用、无害、诚实"的行为准则。这项技术将预训练语言模型从一个强大但不可控的文本生成器，转变为能够遵循指令、拒绝有害请求、给出结构化回答的实用工具。

## 最新进展

RLHF 领域在 2025-2026 年经历了快速迭代。几个关键趋势值得关注：

**DPO 及其变体的崛起**。Direct Preference Optimization（DPO）绕过了传统 RLHF 中训练奖励模型的步骤，直接从偏好数据优化策略模型。这大幅降低了训练复杂度和计算成本。Meta 的 Llama 3 系列和多个开源模型已采用 DPO 作为默认对齐方案。

**Constitutional AI 的演进**。Anthropic 在 RLHF 基础上发展出 Constitutional AI（CAI），用 AI 自身来生成反馈信号，减少对人工标注的依赖。这一方法在 Claude 系列模型中持续迭代，推动了更高效的对齐流程。

**多模态对齐**。随着视觉-语言模型的普及，RLHF 技术正从纯文本扩展到图像生成、视频理解等多模态场景。[Google 的 Gemini](/blog/gemini-3-1-pro-complex-tasks) 等模型在多模态对齐上投入了大量工程资源。

**过程奖励模型（PRM）**。区别于只评估最终输出的结果奖励模型，PRM 对推理过程的每一步进行评分，在数学和编程等需要严谨推理的场景中表现出显著优势。

## 核心原理与关键技术

RLHF 的训练流程分为三个阶段：

**阶段一：监督微调（SFT）**。用高质量的指令-回答对数据对预训练模型进行微调，让模型学会基本的对话格式和指令遵循能力。这一步建立了模型行为的基线。

**阶段二：奖励模型训练**。收集人类标注者对模型输出的偏好排序数据——给定同一个提示词，标注者对多个回答进行排序。基于这些偏好数据训练一个奖励模型（Reward Model），它学会预测人类对任意回答的评分。

**阶段三：强化学习优化**。使用 PPO（Proximal Policy Optimization）等强化学习算法，以奖励模型的评分作为反馈信号，进一步优化语言模型的策略。训练过程中加入 KL 散度约束，防止模型为了迎合奖励模型而偏离预训练分布太远——这被称为"奖励黑客"（reward hacking）问题。

**关键挑战**包括：标注者之间的一致性问题、奖励模型的泛化能力、训练稳定性，以及如何在有用性与安全性之间找到平衡。这些问题推动了 DPO、RLAIF、KTO 等替代方案的发展。

## 常见问题

- **RLHF 和 DPO 有什么区别？**：RLHF 需要单独训练奖励模型再做强化学习优化；DPO 将偏好学习简化为一个直接优化步骤，省去了奖励模型和 PPO 训练
- **为什么 RLHF 对 AI 安全很重要？**：RLHF 是目前最成熟的对齐技术，能有效减少模型的有害输出、幻觉生成和指令违反行为
- **RLHF 的训练成本有多高？**：主要成本来自人工标注（偏好数据收集）和 GPU 训练时间，DPO 等替代方案正在显著降低后者

## RLHF 对比其他技术

目前没有专门的对比页面，以下是快速参考：

- **RLHF vs DPO**：RLHF 更灵活但更复杂，DPO 更简单但在某些场景下表现力受限
- **RLHF vs Constitutional AI**：CAI 用 AI 替代部分人类反馈，适合大规模对齐，但仍以 RLHF 框架为基础

## 所有 RLHF 相关资源

### 博客文章
- [Gemini 3.1 Pro 在复杂任务中的表现](/blog/gemini-3-1-pro-complex-tasks)

### 术语表
- [Anthropic](/glossary/anthropic) — RLHF 和 Constitutional AI 的主要推动者
- [Claude](/glossary/claude) — 基于 RLHF/CAI 训练的大语言模型系列

---

*觉得有用？[订阅 LoreAI](/subscribe)，每天 5 分钟掌握 AI 动态。*