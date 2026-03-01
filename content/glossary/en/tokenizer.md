---
title: "Tokenizer — AI Glossary"
slug: tokenizer
description: "A component that converts raw text into tokens (subword units) that language models can process, and vice versa."
term: tokenizer
display_term: "Tokenizer"
category: concepts
date: "2025-03-01"
related_glossary:
  - context-window
  - transformer
related_blog: []
related_compare: []
related_faq: []
lang: en
---

# Tokenizer

**A tokenizer** is a preprocessing component that converts raw text into a sequence of tokens (subword units) that a language model can process numerically. It also performs the reverse operation, converting model output tokens back into readable text. Tokenization is the first and last step in every LLM interaction.

## Why It Matters

Tokenization directly impacts model performance, cost, and usability. A good tokenizer efficiently represents text using fewer tokens, which means more content fits within the context window and inference costs are lower (since most APIs charge per token). Poor tokenization can waste context space and degrade model quality, especially for non-English languages, code, and specialized domains.

Understanding tokenization is practical knowledge for AI practitioners. It explains why the same text costs different amounts across providers, why models sometimes produce garbled output at word boundaries, and why certain languages require more tokens per word than English.

## How It Works

Modern tokenizers use subword tokenization algorithms that balance between character-level (flexible but inefficient) and word-level (efficient but brittle) approaches:

- **Byte Pair Encoding (BPE)**: The most common algorithm, used by GPT and LLaMA. Starts with individual bytes and iteratively merges the most frequent pairs into new tokens. Common words become single tokens, while rare words are split into multiple subword pieces.
- **SentencePiece**: A language-agnostic tokenizer that operates on raw text without requiring pre-tokenization. Used by many multilingual models.
- **WordPiece**: Used by BERT and some Google models. Similar to BPE but uses a likelihood-based merging criterion instead of frequency.

Typical vocabulary sizes range from 32K to 128K tokens. The tokenizer is trained on a large corpus before model training begins, and the vocabulary is fixed once training starts. In English, one token is roughly 3-4 characters or 0.75 words, but this ratio varies significantly across languages: Chinese and Japanese characters often map to 1-2 tokens each, while some languages require 2-3x more tokens per word than English.

Special tokens like `<|start|>`, `<|end|>`, and `<|pad|>` serve as control signals that the model uses to understand structure and boundaries in its input.

## Related Terms

- [Context Window](/glossary/context-window) — Measured in tokens produced by the tokenizer
- [Transformer](/glossary/transformer) — Processes the token sequences produced by the tokenizer

---
*Want to stay updated on AI fundamentals? [Subscribe to AI News](/subscribe) for daily briefings.*
