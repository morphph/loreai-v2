---
title: "RAG — AI Glossary"
slug: rag
description: "Retrieval-Augmented Generation — a technique that enhances LLM responses by retrieving relevant documents from an external knowledge base before generating answers."
term: rag
display_term: "RAG"
category: concepts
date: "2025-03-01"
related_glossary:
  - vector-database
  - embeddings
  - context-window
related_blog: []
related_compare:
  - rag-vs-fine-tuning
related_faq:
  - how-to-use-rag
lang: en
---

# RAG

**RAG (Retrieval-Augmented Generation)** is a technique that improves the accuracy and relevance of large language model responses by first retrieving pertinent documents from an external knowledge base, then providing those documents as context when generating an answer.

## Why It Matters

Large language models are trained on static datasets and have a knowledge cutoff date. RAG solves two critical problems: it gives models access to up-to-date information, and it grounds their responses in verifiable source documents. This dramatically reduces hallucinations and makes LLMs practical for enterprise use cases where accuracy is essential.

RAG has become the dominant pattern for building production AI applications because it provides the benefits of a custom-trained model without the cost and complexity of fine-tuning. A company can point a RAG pipeline at their internal documentation, and the LLM instantly becomes knowledgeable about their specific domain.

## How It Works

A RAG system operates in two phases:

**Indexing phase**: Documents are split into chunks, converted to vector embeddings using an embedding model, and stored in a vector database. This creates a searchable index of the knowledge base.

**Query phase**: When a user asks a question, the query is converted to an embedding, and the most similar document chunks are retrieved from the vector database. These chunks are then injected into the LLM's prompt as context, and the model generates an answer grounded in the retrieved information.

Key components of a RAG pipeline include chunk size optimization, embedding model selection, retrieval strategies (semantic search, hybrid search, reranking), and prompt engineering to instruct the model on how to use the retrieved context. Advanced RAG techniques include multi-step retrieval, query decomposition, and self-reflection loops that verify answer quality.

## Related Terms

- [Vector Database](/glossary/vector-database) — Stores embeddings for similarity search
- [Embeddings](/glossary/embeddings) — Numerical representations used for retrieval
- [Context Window](/glossary/context-window) — The input size that limits how much context can be provided

---
*Want to stay updated on RAG and AI architecture? [Subscribe to AI News](/subscribe) for daily briefings.*
