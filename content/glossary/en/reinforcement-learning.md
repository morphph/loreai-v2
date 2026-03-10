---
title: "Reinforcement Learning — AI Glossary"
slug: reinforcement-learning
description: "What is reinforcement learning? A training paradigm where AI agents learn optimal behavior through trial-and-error interactions with an environment."
term: reinforcement-learning
display_term: "Reinforcement Learning"
category: techniques
related_glossary: [fine-tuning, google-deepmind, agentic-coding]
related_blog: [gpt-54-pro-vs-claude-opus-vs-gemini-deepthink-comparison]
related_compare: []
lang: en
---

# Reinforcement Learning — AI Glossary

**Reinforcement learning** (RL) is a machine learning paradigm where an agent learns to make decisions by interacting with an environment, receiving reward or penalty signals after each action, and adjusting its strategy to maximize cumulative reward over time. Unlike supervised learning, which requires labeled examples, RL discovers optimal behavior through trial and error — making it uniquely suited for sequential decision-making problems where the correct action depends on context and long-term consequences.

## Why Reinforcement Learning Matters

RL is the technique behind some of AI's most visible breakthroughs. [Google DeepMind's](/glossary/google-deepmind) AlphaGo used RL to defeat the world Go champion. More recently, **reinforcement learning from human feedback** (RLHF) became the standard method for aligning large language models — including ChatGPT and Claude — with human preferences, turning raw text predictors into useful assistants.

Beyond language models, RL powers robotics control, autonomous driving, game-playing agents, and resource optimization systems. Its ability to handle environments with delayed rewards and incomplete information makes it applicable where supervised approaches fall short. Our [model comparison coverage](/blog/gpt-54-pro-vs-claude-opus-vs-gemini-deepthink-comparison) explores how RLHF differences affect reasoning quality across frontier models.

## How Reinforcement Learning Works

An RL system has four core components: an **agent**, an **environment**, **actions**, and **rewards**. At each timestep, the agent observes the environment's state, selects an action based on its current policy, receives a reward signal, and transitions to a new state.

Key algorithms fall into two families:

- **Value-based methods** (e.g., Q-learning, DQN): estimate the expected reward of each action in each state, then act greedily
- **Policy-gradient methods** (e.g., PPO, REINFORCE): directly optimize the policy function that maps states to actions

Modern RL often combines both approaches — **actor-critic architectures** use a policy network (actor) guided by a value network (critic). [Fine-tuning](/glossary/fine-tuning) LLMs with RLHF uses PPO or similar policy-gradient methods to update model weights based on human preference rankings.

## Related Terms

- **[Fine-Tuning](/glossary/fine-tuning)**: Adapting a pretrained model to specific tasks — RLHF is a fine-tuning method that uses reinforcement learning signals
- **[Google DeepMind](/glossary/google-deepmind)**: Pioneered deep reinforcement learning with DQN, AlphaGo, and AlphaFold
- **[Agentic Coding](/glossary/agentic-coding)**: AI agents that autonomously execute coding tasks — often drawing on RL-inspired exploration and planning strategies

---

*Want more AI insights? [Subscribe to LoreAI](/subscribe) for daily briefings.*