---
title: "DPO（直接偏好优化）— AI 术语表"
slug: dpo
description: "什么是 DPO？一种无需训练奖励模型、直接从人类偏好数据优化语言模型的对齐技术。"
term: dpo
display_term: "DPO（Direct Preference Optimization）"
category: techniques
related_glossary: [anthropic, claude]
related_blog: []
related_compare: []
lang: zh
---

# DPO（直接偏好优化）— AI 术语表

**DPO（Direct Preference Optimization）** 是一种语言模型对齐技术，通过直接在人类偏好数据上优化策略模型，跳过传统 RLHF 流程中训练奖励模型和运行强化学习的步骤。由斯坦福研究团队于 2023 年提出，DPO 将偏好学习问题重新定义为一个简单的分类损失函数，大幅降低了对齐训练的复杂度和计算成本。

## 为什么 DPO 重要

在 DPO 出现之前，让大语言模型符合人类意图的主流方法是 RLHF（基于人类反馈的强化学习）。RLHF 需要三步：监督微调、训练奖励模型、再用 PPO 等强化学习算法优化策略——流程复杂、训练不稳定、超参数敏感。

DPO 将这个多阶段流程压缩为单阶段优化。这意味着更少的 GPU 资源、更短的训练周期、更低的工程门槛。包括 [Anthropic](/glossary/anthropic) 的 [Claude](/glossary/claude) 在内，许多主流模型的对齐训练都借鉴了偏好优化的思路。对于资源有限的研究团队和中小公司，DPO 让高质量模型对齐变得可行。

## DPO 的工作原理

DPO 的核心洞察：奖励模型和最优策略之间存在封闭形式的映射关系。利用这个映射，可以把奖励建模问题转化为直接对策略模型的优化。

具体流程：

1. **准备偏好数据**：对同一输入，收集"优选回答"和"劣选回答"的配对
2. **构建损失函数**：用 Bradley-Terry 模型定义偏好概率，推导出策略模型的交叉熵损失
3. **直接优化**：对策略模型做标准梯度下降，使其更倾向于生成优选回答

不需要单独的奖励模型，不需要采样和强化学习循环——一个损失函数、一次训练就够了。

## 相关术语

- **[Anthropic](/glossary/anthropic)**：AI 安全公司，其模型对齐研究广泛采用偏好优化方法
- **[Claude](/glossary/claude)**：Anthropic 的大语言模型系列，训练过程融合了多种对齐技术

---

*觉得有用？[订阅 LoreAI](/subscribe)，每天 5 分钟掌握 AI 动态。*