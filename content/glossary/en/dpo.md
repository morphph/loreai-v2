---
title: "DPO (Direct Preference Optimization) — AI Glossary"
slug: dpo
description: "What is DPO? A reinforcement learning alternative that aligns LLMs with human preferences using a simple classification loss."
term: dpo
display_term: "DPO (Direct Preference Optimization)"
category: techniques
related_glossary: [anthropic, claude]
related_blog: []
related_compare: []
lang: en
---

# DPO (Direct Preference Optimization) — AI Glossary

**DPO (Direct Preference Optimization)** is a technique for aligning large language models with human preferences without training a separate reward model. Introduced by Rafailov et al. in 2023, DPO reformulates the reinforcement learning from human feedback (RLHF) objective into a simple binary cross-entropy loss applied directly to the policy model — eliminating the reward modeling and PPO training stages that make traditional RLHF complex and unstable.

## Why DPO Matters

RLHF transformed how companies like [Anthropic](/glossary/anthropic) and OpenAI build safe, helpful AI systems, but the standard pipeline — collect preferences, train a reward model, run PPO against it — is notoriously finicky. Reward model overoptimization, training instability, and high compute costs made alignment engineering a bottleneck.

DPO collapses this multi-stage process into a single supervised learning step. Teams can fine-tune a model on preference pairs (chosen vs. rejected responses) using standard training infrastructure, no RL loops required. This dramatically lowers the barrier to preference-based alignment, making it practical for open-source projects and smaller teams that lack the infrastructure for full RLHF pipelines.

## How DPO Works

DPO derives a closed-form expression for the optimal policy under the RLHF objective. The key insight: the reward function can be expressed analytically in terms of the optimal policy and reference policy, so you never need to learn it explicitly.

Given a dataset of preference pairs (prompt, chosen response, rejected response), DPO optimizes:

- **Increase** the log-probability of chosen responses relative to the reference model
- **Decrease** the log-probability of rejected responses relative to the reference model
- A **KL-divergence constraint** (controlled by parameter β) prevents the model from drifting too far from the reference policy

The reference model is typically the supervised fine-tuned (SFT) checkpoint before alignment. Training uses standard gradient descent — no sampling, no reward scores, no policy gradient variance to manage.

## Related Terms

- **[Anthropic](/glossary/anthropic)**: AI safety company whose alignment research builds on preference optimization techniques including RLHF and its variants
- **[Claude](/glossary/claude)**: Anthropic's model family, aligned using preference-based training methods to be helpful, harmless, and honest

---

*Want more AI insights? [Subscribe to LoreAI](/subscribe) for daily briefings.*