---
title: "Fine-Tuning — AI Glossary"
slug: fine-tuning
description: "What is fine-tuning? The process of training a pre-trained AI model on task-specific data to improve its performance."
term: fine-tuning
display_term: "Fine-Tuning"
category: techniques
related_glossary: [gpt-54, cursor]
related_blog: [claude-code-security-vulnerability-scanning]
related_compare: []
lang: en
---

# Fine-Tuning — AI Glossary

**Fine-tuning** is the process of taking a pre-trained foundation model and further training it on a smaller, task-specific dataset to improve performance on a particular domain or use case. Rather than training a model from scratch — which requires massive compute and data — fine-tuning adapts an existing model's learned representations to new tasks with a fraction of the resources.

## Why Fine-Tuning Matters

Foundation models like [GPT-5.4](/glossary/gpt-54) are trained on broad internet-scale data, making them strong generalists but sometimes inconsistent on specialized tasks. Fine-tuning bridges that gap. A legal firm can fine-tune a model on contract language to get reliable clause extraction. A medical team can adapt one for radiology report generation. The result is a model that retains general language understanding while excelling at the target task.

Fine-tuning is also how organizations enforce specific output formats, reduce hallucinations in narrow domains, and align model behavior with internal guidelines — without prompt engineering workarounds. For a look at how specialized AI tooling is evolving alongside these techniques, see our coverage of [Claude Code's security scanning capabilities](/blog/claude-code-security-vulnerability-scanning).

## How Fine-Tuning Works

The standard fine-tuning process starts with a pre-trained model's weights and continues gradient descent on new labeled examples. Key approaches include:

- **Full fine-tuning**: Updates all model parameters. Produces the strongest adaptation but requires significant GPU memory and risks catastrophic forgetting of general capabilities.
- **LoRA (Low-Rank Adaptation)**: Freezes original weights and injects small trainable matrices into attention layers. Drastically reduces memory and compute — a 70B-parameter model can be fine-tuned on a single high-end GPU.
- **RLHF (Reinforcement Learning from Human Feedback)**: A specialized fine-tuning stage where human preference rankings guide the model toward more helpful, harmless outputs. This is how most chat-oriented models are aligned after pre-training.

Typical fine-tuning datasets range from a few hundred to tens of thousands of examples, depending on task complexity and the technique used.

## Related Terms

- **[GPT-5.4](/glossary/gpt-54)**: OpenAI's latest model, itself a product of extensive pre-training and fine-tuning stages
- **[Cursor](/glossary/cursor)**: An AI-enhanced IDE that leverages fine-tuned models for code-specific assistance
- **Transfer Learning**: The broader paradigm that fine-tuning belongs to — reusing learned features across tasks

---

*Want more AI insights? [Subscribe to LoreAI](/subscribe) for daily briefings.*