---
title: "RLHF — AI 术语表"
slug: rlhf
description: "什么是 RLHF？通过人类反馈强化学习，让 AI 模型的输出更符合人类偏好的核心训练技术。"
term: rlhf
display_term: "RLHF"
category: techniques
related_glossary: [claude, anthropic, google]
related_blog: [anthropic-claude-memory-upgrades-importing]
related_compare: []
lang: zh
---

# RLHF — AI 术语表

**RLHF**（Reinforcement Learning from Human Feedback，基于人类反馈的强化学习）是一种用人类偏好信号来微调大语言模型的训练技术。它的核心思路是：先让模型生成多个候选回答，再由人类标注员评判哪个更好，最后用强化学习算法让模型学会生成人类更满意的输出。

## 为什么 RLHF 重要

预训练阶段的语言模型只学会了"预测下一个 token"，但这不等于"给出有用、安全的回答"。RLHF 解决的正是这个对齐问题——让模型从"能说话"进化到"说人话"。

OpenAI 的 ChatGPT、[Anthropic](/glossary/anthropic) 的 [Claude](/glossary/claude)、[Google](/glossary/google) 的 Gemini 都依赖 RLHF 或其变体来提升模型的实用性和安全性。可以说，RLHF 是当前 AI 产品体验的关键推手。Anthropic 在这一领域的研究尤为深入，其 [Constitutional AI 方法](/blog/anthropic-claude-memory-upgrades-importing)就是 RLHF 思想的延伸。

## RLHF 的工作原理

RLHF 通常分三步：

1. **监督微调（SFT）**：用高质量的人工标注数据对预训练模型做初步微调，让它学会基本的对话格式和指令遵循能力。

2. **训练奖励模型（Reward Model）**：让 SFT 模型对同一问题生成多个回答，人类标注员对这些回答排序。用排序数据训练一个奖励模型，学会预测人类的偏好打分。

3. **强化学习优化（PPO）**：用 PPO（Proximal Policy Optimization）等算法，以奖励模型的打分为信号，进一步优化语言模型的输出策略。同时通过 KL 散度约束防止模型偏离太远。

近期业界也在探索 DPO（Direct Preference Optimization）等替代方案，跳过奖励模型直接从偏好数据优化，降低训练复杂度。

## 相关术语

- **[Claude](/glossary/claude)**：Anthropic 开发的 AI 助手，使用 RLHF 及 Constitutional AI 进行对齐训练
- **[Anthropic](/glossary/anthropic)**：RLHF 和 AI 安全研究的领先机构，多位创始成员参与了 RLHF 的早期研究
- **[Google](/glossary/google)**：在 Gemini 等模型中广泛应用 RLHF 技术

---

*觉得有用？[订阅 LoreAI](/subscribe)，每天 5 分钟掌握 AI 动态。*