---
title: "RLHF — AI Glossary"
slug: rlhf
description: "What is RLHF? Reinforcement Learning from Human Feedback aligns AI models with human preferences."
term: rlhf
display_term: "RLHF"
category: techniques
related_glossary: [anthropic, claude, google]
related_blog: [anthropic-claude-memory-upgrades-importing]
related_compare: []
lang: en
---

# RLHF — AI Glossary

**RLHF (Reinforcement Learning from Human Feedback)** is a training technique that fine-tunes large language models using human preference signals rather than static datasets. Human evaluators rank model outputs, and those rankings train a reward model that guides the LLM toward responses humans find more helpful, honest, and harmless.

## Why RLHF Matters

RLHF is the core technique behind the behavioral alignment of models like [Claude](/glossary/claude), GPT-4, and Gemini. Without it, base language models produce text that's statistically plausible but often unhelpful, toxic, or off-topic. RLHF bridges the gap between "predicts the next token well" and "actually useful assistant."

[Anthropic](/glossary/anthropic) pioneered much of the safety-focused RLHF research, including Constitutional AI (CAI), which extends the approach by having AI systems help generate preference data. The technique is now standard practice — virtually every commercial LLM ships with some form of RLHF or its derivatives. For a deeper look at how Anthropic applies these methods, see our coverage of [Claude's latest updates](/blog/anthropic-claude-memory-upgrades-importing).

## How RLHF Works

The process follows three stages:

1. **Supervised fine-tuning (SFT)**: A pretrained model is fine-tuned on high-quality demonstration data — human-written examples of ideal responses.
2. **Reward model training**: Human annotators compare pairs of model outputs and select the better one. These preference pairs train a separate reward model that scores response quality.
3. **Policy optimization**: The LLM is further trained using reinforcement learning (typically PPO — Proximal Policy Optimization) to maximize the reward model's score while staying close to the SFT baseline via a KL-divergence penalty.

The KL penalty prevents "reward hacking" — where the model exploits quirks in the reward model rather than genuinely improving output quality.

## Related Terms

- **[Anthropic](/glossary/anthropic)**: AI safety company that advanced RLHF research with Constitutional AI and iterative preference learning
- **[Claude](/glossary/claude)**: Anthropic's family of LLMs, trained using RLHF and Constitutional AI techniques
- **[Google](/glossary/google)**: Applies RLHF across its Gemini model family for instruction following and safety alignment

---

*Want more AI insights? [Subscribe to LoreAI](/subscribe) for daily briefings.*