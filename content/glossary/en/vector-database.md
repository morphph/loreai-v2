---
title: "Vector Database — AI Glossary"
slug: vector-database
description: "A database optimized for storing, indexing, and querying high-dimensional vector embeddings for similarity search."
term: vector-database
display_term: "Vector Database"
category: tools
date: "2025-03-01"
related_glossary:
  - embeddings
  - rag
related_blog: []
related_compare:
  - pinecone-vs-chromadb
related_faq:
  - what-is-vector-database
lang: en
---

# Vector Database

**A vector database** is a specialized database system designed to efficiently store, index, and query high-dimensional vector embeddings. These databases enable similarity search at scale, making them a critical component of RAG pipelines, recommendation systems, and semantic search applications.

## Why It Matters

Traditional databases excel at exact matching queries (find the row where id = 42), but AI applications require a fundamentally different kind of search: finding items that are semantically similar to a query. Vector databases solve this by comparing the mathematical distance between embedding vectors, enabling queries like "find documents that discuss similar topics" or "find images that look like this one."

The explosive growth of LLM-powered applications has made vector databases one of the fastest-growing database categories. Every RAG pipeline needs one, and as more organizations build AI features, demand for efficient vector storage and retrieval continues to increase.

## How It Works

Vector databases store data as high-dimensional vectors (arrays of floating-point numbers, typically 256 to 3072 dimensions). When a query comes in, the database converts it to a vector and finds the nearest neighbors using distance metrics like cosine similarity, Euclidean distance, or dot product.

To achieve fast retrieval at scale, vector databases use approximate nearest neighbor (ANN) algorithms rather than brute-force comparison. Common indexing algorithms include:

- **HNSW (Hierarchical Navigable Small World)**: A graph-based algorithm that provides excellent recall and speed.
- **IVF (Inverted File Index)**: Partitions the vector space into clusters for faster search.
- **Product Quantization**: Compresses vectors to reduce memory usage while maintaining search quality.

Popular vector databases include Pinecone (fully managed), ChromaDB (open-source, developer-friendly), Weaviate (open-source with hybrid search), Milvus (open-source, enterprise-scale), and pgvector (PostgreSQL extension for teams already using Postgres).

## Related Terms

- [Embeddings](/glossary/embeddings) — The vectors stored in vector databases
- [RAG](/glossary/rag) — The primary use case for vector databases

---
*Want to stay updated on AI infrastructure? [Subscribe to AI News](/subscribe) for daily briefings.*
