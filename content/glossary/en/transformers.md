---
title: "Transformers — AI Glossary"
slug: transformers
description: "What are Transformers? The neural network architecture behind modern LLMs and AI systems."
term: transformers
display_term: "Transformers"
category: concepts
related_glossary: [google, anthropic, claude]
related_blog: []
related_compare: []
lang: en
---

# Transformers — AI Glossary

**Transformers** are a neural network architecture introduced in the 2017 paper "Attention Is All You Need" by researchers at [Google](/glossary/google). Built around a mechanism called **self-attention**, transformers process entire input sequences in parallel rather than sequentially, enabling them to capture long-range dependencies in text, images, and other data. They are the foundational architecture behind virtually every major large language model today, including [Claude](/glossary/claude), GPT, Gemini, and Llama.

## Why Transformers Matter

Before transformers, sequence models like RNNs and LSTMs processed tokens one at a time, creating bottlenecks for long sequences. Transformers eliminated this constraint, unlocking the scaling laws that made modern AI possible — more data, more parameters, better performance.

The architecture powers not just language models but also vision transformers (ViT), speech models, protein folding (AlphaFold), and multimodal systems. Every major AI lab — [Anthropic](/glossary/anthropic), OpenAI, Google DeepMind, Meta — builds on transformer variants. Understanding transformers is prerequisite knowledge for following any development in modern AI.

## How Transformers Work

The core mechanism is **self-attention**: each token in a sequence computes attention scores against every other token, producing a weighted representation that captures contextual relationships. This happens across multiple **attention heads** in parallel, each learning different relationship patterns.

A standard transformer has two main components:
- **Encoder**: Processes input sequences into contextual representations (used in BERT-style models)
- **Decoder**: Generates output tokens autoregressively, attending to both previous outputs and encoder states

Most modern LLMs like Claude use **decoder-only** architectures, where the model generates text one token at a time, attending to all prior tokens in the sequence. Scaling these architectures to billions of parameters — combined with massive training datasets — produces the emergent capabilities seen in today's frontier models.

## Related Terms

- **[Google](/glossary/google)**: Origin of the transformer architecture, developed at Google Brain and Google DeepMind
- **[Anthropic](/glossary/anthropic)**: Builder of Claude, a frontier AI system built on transformer architecture
- **[Claude](/glossary/claude)**: Anthropic's AI assistant, powered by a decoder-only transformer model

---

*Want more AI insights? [Subscribe to LoreAI](/subscribe) for daily briefings.*