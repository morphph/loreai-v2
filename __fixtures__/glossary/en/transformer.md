---
title: "Transformer"
date: 2026-01-10
slug: transformer
description: "What is a Transformer in AI? Architecture explained."
---

# Transformer

A Transformer is a neural network architecture introduced in the 2017 paper "Attention Is All You Need" by Vaswani et al. It processes input sequences using self-attention mechanisms rather than recurrence, enabling parallel computation and better handling of long-range dependencies.

## How It Works

The Transformer consists of an encoder and decoder, each built from layers of multi-head self-attention and feed-forward networks. The self-attention mechanism allows each token in a sequence to attend to every other token, computing relevance scores that determine how much each position contributes to the representation of another.

Modern large language models like GPT and Claude typically use decoder-only Transformer architectures, processing text autoregressively — predicting one token at a time based on all preceding tokens.

## Why It Matters

Transformers revolutionized NLP and now power virtually all state-of-the-art language models. Their parallelizable architecture enables training on massive datasets, leading to emergent capabilities in reasoning, code generation, and multimodal understanding.

[Subscribe to LoreAI](/subscribe) for more AI explanations.
