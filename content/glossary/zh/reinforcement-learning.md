---
title: "强化学习（Reinforcement Learning）— AI 术语表"
slug: reinforcement-learning
description: "什么是强化学习？一种通过试错和奖励信号让智能体学会最优决策的机器学习方法。"
term: reinforcement-learning
display_term: "强化学习（Reinforcement Learning）"
category: concepts
related_glossary: [agentic-coding, chatgpt]
related_blog: [claude-code-enterprise-engineering-ramp-shopify-spotify]
related_compare: []
lang: zh
---

# 强化学习（Reinforcement Learning）— AI 术语表

**强化学习（Reinforcement Learning, RL）** 是机器学习的一个分支，核心思路是让智能体（agent）在环境中不断试错，通过奖励信号学习如何做出最优决策。与监督学习需要标注数据不同，RL 的训练信号来自行动的结果——做对了得奖励，做错了受惩罚，智能体据此调整策略。

## 为什么强化学习重要

RL 是当今大模型对齐的关键技术之一。OpenAI 用 RLHF（基于人类反馈的强化学习）训练 [ChatGPT](/glossary/chatgpt)，使模型输出更符合人类偏好；Anthropic 的 Claude 同样依赖 RL 技术实现安全对齐。除了 LLM，RL 在机器人控制、游戏 AI、自动驾驶和推荐系统等领域都有成熟应用。DeepMind 的 AlphaGo 和 AlphaFold 是 RL 的标志性成果。

在 [AI 编程工具](/glossary/agentic-coding)领域，RL 思想也在渗透——智能体通过执行代码、观察测试结果来迭代改进方案，本质上就是一个试错-反馈循环。我们在[企业级 AI 编程实践](/blog/claude-code-enterprise-engineering-ramp-shopify-spotify)中也观察到了类似模式。

## 强化学习如何运作

RL 系统包含几个核心要素：

- **智能体（Agent）**：做出决策的主体
- **环境（Environment）**：智能体交互的外部世界
- **状态（State）**：环境在某一时刻的描述
- **动作（Action）**：智能体可以执行的操作
- **奖励（Reward）**：环境对动作的反馈信号

智能体的目标是学到一个**策略（Policy）**，使长期累积奖励最大化。经典算法包括 Q-learning、Policy Gradient 和 PPO（Proximal Policy Optimization）。PPO 因为训练稳定、效果好，成为 RLHF 中最常用的算法。

## 相关术语

- **[Agentic Coding](/glossary/agentic-coding)**：AI 智能体自主编写和调试代码，其迭代逻辑与 RL 的试错-反馈机制一脉相承
- **[ChatGPT](/glossary/chatgpt)**：OpenAI 基于 RLHF 训练的对话模型，是 RL 在大模型领域最知名的应用

---

*觉得有用？[订阅 LoreAI](/subscribe)，每天 5 分钟掌握 AI 动态。*