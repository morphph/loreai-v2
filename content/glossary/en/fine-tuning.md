---
title: "Fine-Tuning — AI Glossary"
slug: fine-tuning
description: "The process of further training a pre-trained language model on a specific dataset to adapt it for a particular task or domain."
term: fine-tuning
display_term: "Fine-Tuning"
category: concepts
date: "2025-03-01"
related_glossary:
  - rag
  - transformer
  - llama
related_blog: []
related_compare:
  - rag-vs-fine-tuning
related_faq:
  - how-to-fine-tune-llm
lang: en
---

# Fine-Tuning

**Fine-tuning** is the process of taking a pre-trained language model and further training it on a smaller, task-specific or domain-specific dataset to improve its performance on particular use cases. This adapts the model's general knowledge to specialized requirements.

## Why It Matters

Pre-trained LLMs are generalists. They know about many topics but may not excel at specific tasks like generating code in a particular framework, writing in a company's brand voice, or classifying domain-specific documents. Fine-tuning bridges this gap by teaching the model patterns from curated examples.

Fine-tuning is particularly important for scenarios where prompt engineering and RAG are insufficient: when you need the model to consistently follow a specific output format, adopt a particular tone, or handle domain terminology that appears nowhere in its training data. It bakes knowledge into the model weights rather than injecting it at inference time.

## How It Works

Fine-tuning involves several approaches of increasing sophistication:

- **Full fine-tuning**: Updates all model parameters. Produces the highest quality results but requires significant compute and a complete copy of the model weights.
- **LoRA (Low-Rank Adaptation)**: Adds small trainable adapter layers while keeping the base model frozen. This reduces memory and compute requirements by 10-100x while preserving most of the quality.
- **QLoRA**: Combines LoRA with quantization, enabling fine-tuning of large models on consumer GPUs.
- **RLHF (Reinforcement Learning from Human Feedback)**: Uses human preference data to align model outputs with desired behavior. This is how models like ChatGPT and Claude are trained to be helpful and safe.

The fine-tuning workflow typically involves preparing a dataset of input-output pairs, selecting a base model, choosing a training method, running training for several epochs, and evaluating the results on a held-out test set. Platforms like OpenAI, Together AI, and Hugging Face provide managed fine-tuning services.

## Related Terms

- [RAG](/glossary/rag) — An alternative approach to domain adaptation
- [Transformer](/glossary/transformer) — The architecture being fine-tuned
- [LLaMA](/glossary/llama) — A popular open-source model for fine-tuning

---
*Want to stay updated on AI training techniques? [Subscribe to AI News](/subscribe) for daily briefings.*
