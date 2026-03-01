---
title: "Transformer — AI Glossary"
slug: transformer
description: "A neural network architecture based on self-attention that forms the foundation of all modern large language models."
term: transformer
display_term: "Transformer"
category: concepts
date: "2025-03-01"
related_glossary:
  - gpt
  - llama
  - embeddings
related_blog: []
related_compare: []
related_faq: []
lang: en
---

# Transformer

**The transformer** is a neural network architecture introduced in the 2017 paper "Attention Is All You Need" by Vaswani et al. It uses self-attention mechanisms to process sequential data in parallel, replacing the recurrent (RNN) and convolutional (CNN) approaches that previously dominated natural language processing.

## Why It Matters

The transformer is the single most important architectural innovation in modern AI. Every major language model -- GPT, Claude, LLaMA, Gemini, Mistral -- is built on the transformer architecture. It also underpins vision transformers (ViT), audio models, protein folding systems (AlphaFold), and multimodal models. Understanding transformers is essential for understanding how any modern AI system works.

The key breakthrough was enabling parallel processing of entire sequences, which made training dramatically faster on modern GPUs compared to sequential RNN architectures. This parallelism, combined with the ability to capture long-range dependencies through attention, is what allowed language models to scale to hundreds of billions of parameters.

## How It Works

The transformer architecture consists of two main components:

**Self-attention**: For each position in the input sequence, the model computes attention weights against all other positions. This allows every token to "attend to" every other token, capturing relationships regardless of distance. The attention mechanism uses queries (Q), keys (K), and values (V) matrices derived from the input, computing attention as: Attention(Q,K,V) = softmax(QK^T / sqrt(d_k))V.

**Feed-forward networks**: After attention, each position passes through an independent feed-forward neural network. This is where much of the model's knowledge is believed to be stored.

Modern LLMs typically use the decoder-only variant (GPT-style), which processes text left-to-right and generates one token at a time. Each transformer block consists of a masked self-attention layer followed by a feed-forward layer, with residual connections and layer normalization. Models stack dozens to over a hundred of these blocks to achieve increasing capability.

Key innovations since the original transformer include multi-head attention, rotary position embeddings, KV caching for faster inference, flash attention for memory efficiency, and mixture of experts for parameter efficiency.

## Related Terms

- [GPT](/glossary/gpt) — A decoder-only transformer family
- [LLaMA](/glossary/llama) — An open-weight transformer family
- [Embeddings](/glossary/embeddings) — Produced by transformer encoder models

---
*Want to stay updated on AI architectures? [Subscribe to AI News](/subscribe) for daily briefings.*
