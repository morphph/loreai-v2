---
title: "What is RAG (Retrieval-Augmented Generation)?"
date: 2026-01-12
slug: what-is-rag
description: "RAG explained: how retrieval-augmented generation works."
---

# What is RAG (Retrieval-Augmented Generation)?

RAG is a technique that combines information retrieval with text generation. Instead of relying solely on a language model's training data, RAG first searches a knowledge base for relevant documents, then passes those documents as context to the model when generating a response.

## How RAG Works

The typical RAG pipeline has three steps: indexing, retrieval, and generation. During indexing, documents are split into chunks and converted into vector embeddings stored in a vector database. At query time, the user's question is also embedded and compared against stored vectors to find the most relevant chunks. These chunks are then included in the prompt sent to the language model.

## When to Use RAG

RAG is ideal when you need accurate, up-to-date answers from specific knowledge sources. Common use cases include customer support bots, internal documentation search, and domain-specific Q&A systems. It reduces hallucination by grounding responses in actual source material.

## Limitations

RAG quality depends heavily on retrieval quality. If the retriever fails to find relevant documents, the generator will produce poor answers. Chunk size, embedding model choice, and re-ranking strategies all significantly impact performance.

[Subscribe to LoreAI](/subscribe) for more AI explainers.
