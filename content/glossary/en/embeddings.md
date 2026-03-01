---
title: "Embeddings — AI Glossary"
slug: embeddings
description: "Dense numerical vector representations of text, images, or other data that capture semantic meaning in a high-dimensional space."
term: embeddings
display_term: "Embeddings"
category: concepts
date: "2025-03-01"
related_glossary:
  - vector-database
  - rag
  - transformer
related_blog: []
related_compare: []
related_faq: []
lang: en
---

# Embeddings

**Embeddings** are dense numerical vector representations of data (text, images, audio, or other modalities) that capture semantic meaning in a high-dimensional space. Similar items produce vectors that are close together, enabling mathematical comparison of meaning.

## Why It Matters

Embeddings are foundational to modern AI because they translate human-understandable concepts into a format that machines can compute with. Without embeddings, AI systems would be limited to exact string matching and keyword search. With embeddings, they can understand that "automobile" and "car" are semantically identical, that a question about "revenue" is related to documents about "sales figures," and that two images of dogs are more similar to each other than either is to an image of a cat.

Every RAG pipeline, semantic search engine, recommendation system, and clustering application depends on embeddings. They are the bridge between raw data and intelligent retrieval.

## How It Works

Embedding models are neural networks trained to map inputs to fixed-size vectors (typically 256 to 3072 dimensions). The training process uses contrastive learning: the model learns to place similar items close together and dissimilar items far apart in the vector space.

For text embeddings, the process works as follows:

1. Input text is tokenized into subword tokens.
2. Tokens are processed through transformer layers that capture contextual relationships.
3. The model outputs a single vector (typically by pooling the final hidden states) that represents the entire input.

Key embedding models include OpenAI's text-embedding-3 family, Cohere's embed models, and open-source options like sentence-transformers/all-MiniLM and BGE. The choice of model affects the quality of downstream retrieval: better embedding models produce vectors that more accurately capture semantic relationships.

Embeddings can be compared using cosine similarity (most common), Euclidean distance, or dot product. The resulting similarity score indicates how semantically related two inputs are.

## Related Terms

- [Vector Database](/glossary/vector-database) — Stores and queries embeddings at scale
- [RAG](/glossary/rag) — Uses embeddings for document retrieval
- [Transformer](/glossary/transformer) — The architecture behind most embedding models

---
*Want to stay updated on AI fundamentals? [Subscribe to AI News](/subscribe) for daily briefings.*
