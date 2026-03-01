---
title: "GPT — AI Glossary"
slug: gpt
description: "Generative Pre-trained Transformer — OpenAI's family of large language models that pioneered the modern era of AI chatbots and text generation."
term: gpt
display_term: "GPT"
category: models
date: "2025-03-01"
related_glossary:
  - transformer
  - context-window
  - function-calling
related_blog: []
related_compare:
  - gpt-vs-claude
related_faq: []
lang: en
---

# GPT

**GPT (Generative Pre-trained Transformer)** is a family of large language models developed by OpenAI. The series includes GPT-2, GPT-3, GPT-3.5, GPT-4, GPT-4o, and subsequent models, each representing significant advances in language understanding and generation capabilities.

## Why It Matters

GPT is arguably the most influential AI model family in history. GPT-3 demonstrated that scaling language models could produce emergent capabilities far beyond what smaller models could achieve. ChatGPT (powered by GPT-3.5 and later GPT-4) brought AI into mainstream awareness and catalyzed the current wave of AI investment and adoption.

The GPT series established several paradigms that now define the industry: the chat-based interface for AI interaction, the API-as-a-service model for AI deployment, and the concept of instruction-following as a core model capability. Nearly every competing model is benchmarked against GPT variants.

## How It Works

GPT models are based on the transformer architecture, specifically the decoder-only variant that generates text autoregressively (one token at a time, left to right). Key aspects include:

- **Pre-training**: The model is trained on a massive corpus of internet text to learn language patterns, factual knowledge, and reasoning capabilities.
- **Instruction tuning**: After pre-training, the model is fine-tuned on instruction-following examples to make it useful as an assistant.
- **RLHF**: Reinforcement Learning from Human Feedback further aligns the model with human preferences for helpfulness, accuracy, and safety.

GPT-4 and later models are believed to use a Mixture of Experts (MoE) architecture, where different subsets of the model activate for different inputs, allowing massive total parameter counts while keeping per-inference compute manageable.

OpenAI offers GPT models through their API with different pricing tiers based on model capability and context window size. GPT-4o provides multimodal capabilities including vision, audio, and text generation in a single model.

## Related Terms

- [Transformer](/glossary/transformer) — The architecture underpinning GPT
- [Context Window](/glossary/context-window) — A key differentiator between GPT variants
- [Function Calling](/glossary/function-calling) — A capability that GPT models support natively

---
*Want to stay updated on GPT and OpenAI developments? [Subscribe to AI News](/subscribe) for daily briefings.*
