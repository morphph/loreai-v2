---
title: "LLaMA — AI Glossary"
slug: llama
description: "Meta's family of open-weight large language models, available in various sizes and widely used as a foundation for fine-tuning and research."
term: llama
display_term: "LLaMA"
category: models
date: "2025-03-01"
related_glossary:
  - transformer
  - fine-tuning
  - mistral
related_blog: []
related_compare:
  - gpt-vs-claude
related_faq:
  - best-open-source-llm-2026
lang: en
---

# LLaMA

**LLaMA (Large Language Model Meta AI)** is a family of open-weight large language models developed by Meta. Starting with the original LLaMA in February 2023, the series has evolved through LLaMA 2, LLaMA 3, and LLaMA 4, with each generation significantly improving capabilities while remaining available for research and commercial use.

## Why It Matters

LLaMA fundamentally changed the AI landscape by demonstrating that open-weight models could compete with proprietary ones. Before LLaMA, the best language models were only available through paid APIs from OpenAI and Google. LLaMA gave the open-source community a high-quality foundation model that could be fine-tuned, modified, and deployed without restrictions.

The impact has been enormous. LLaMA spawned an entire ecosystem of derivative models (Alpaca, Vicuna, CodeLlama, and thousands of community fine-tunes), drove innovation in efficient training and inference techniques, and proved that open-source AI development could keep pace with closed-source efforts.

## How It Works

LLaMA models use the transformer architecture with several optimizations:

- **Pre-normalization**: Uses RMSNorm before each transformer sub-layer for more stable training.
- **SwiGLU activation**: Replaces the standard ReLU activation in feed-forward layers for better performance.
- **Rotary Position Embeddings (RoPE)**: Encodes position information directly into attention computations, enabling better extrapolation to longer sequences.
- **Grouped Query Attention (GQA)**: In LLaMA 2 and later, reduces memory usage during inference by sharing key-value heads across query heads.

LLaMA models come in multiple sizes (1B to 405B parameters in the LLaMA 3 family), allowing users to choose the best trade-off between capability and compute requirements. Smaller models (7B-8B) can run on consumer hardware, while larger models (70B+) rival proprietary models in benchmarks.

The models are available on Hugging Face and can be fine-tuned using techniques like LoRA and QLoRA, making them accessible to individual researchers and small teams.

## Related Terms

- [Transformer](/glossary/transformer) — The architecture LLaMA is built on
- [Fine-Tuning](/glossary/fine-tuning) — How LLaMA models are adapted for specific tasks
- [Mistral](/glossary/mistral) — Another leading open-weight model family

---
*Want to stay updated on open-source AI models? [Subscribe to AI News](/subscribe) for daily briefings.*
