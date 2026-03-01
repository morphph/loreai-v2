---
title: "Context Window — AI Glossary"
slug: context-window
description: "The maximum number of tokens a language model can process in a single input-output interaction, determining how much information it can consider at once."
term: context-window
display_term: "Context Window"
category: concepts
date: "2025-03-01"
related_glossary:
  - tokenizer
  - transformer
  - rag
related_blog: []
related_compare: []
related_faq: []
lang: en
---

# Context Window

**The context window** (also called context length) is the maximum number of tokens a language model can process in a single interaction. It includes both the input (system prompt, conversation history, and user query) and the output (the model's response). Everything the model "knows" during a conversation must fit within this window.

## Why It Matters

Context window size is one of the most practical constraints when working with LLMs. A model with a 4K token context window cannot process a 10-page document in one call, while a model with a 200K context window can process an entire book. This directly impacts what applications are feasible: code review across large files, document summarization, long conversations, and RAG pipelines all benefit from larger context windows.

The race to expand context windows has been a major competitive dimension among model providers. Claude offers 200K tokens, Gemini 1.5 Pro supports up to 1M tokens, and GPT-4o provides 128K tokens. Larger context windows enable new use cases but also increase inference costs and may reduce accuracy for information located in the middle of very long contexts (the "lost in the middle" phenomenon).

## How It Works

Context windows are measured in tokens, not words or characters. A token is a subword unit produced by the model's tokenizer. In English, one token is roughly 3-4 characters or 0.75 words. Other languages may require more tokens per word.

The context window limitation stems from the transformer's self-attention mechanism, which has quadratic memory and compute cost with respect to sequence length. Processing 100K tokens requires significantly more memory than processing 10K tokens. Several techniques address this:

- **Efficient attention**: Algorithms like Flash Attention reduce the memory overhead of self-attention without changing the output.
- **Sparse attention**: Patterns like sliding window attention limit which tokens attend to which, reducing computational cost.
- **RoPE scaling**: Rotary position embedding interpolation allows models trained on shorter contexts to extrapolate to longer ones.
- **KV cache optimization**: Techniques like PagedAttention efficiently manage the key-value cache during inference.

In practice, effective context usage matters as much as raw window size. Studies show that models retrieve information most reliably from the beginning and end of the context, with accuracy dropping for information placed in the middle.

## Related Terms

- [Tokenizer](/glossary/tokenizer) — Determines how text maps to tokens within the window
- [Transformer](/glossary/transformer) — The architecture that defines context window mechanics
- [RAG](/glossary/rag) — An alternative to fitting everything in the context window

---
*Want to stay updated on LLM capabilities? [Subscribe to AI News](/subscribe) for daily briefings.*
