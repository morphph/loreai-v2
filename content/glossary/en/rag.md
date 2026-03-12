---
title: "RAG — AI Glossary"
slug: rag
description: "What is RAG? Retrieval-Augmented Generation combines LLM reasoning with external knowledge retrieval for accurate, grounded responses."
term: rag
display_term: "RAG"
category: techniques
related_glossary: [chatgpt, cursor, agentic-coding]
related_blog: [claude-code-btw-side-chain-conversations]
related_compare: []
lang: en
---

# RAG — AI Glossary

**RAG (Retrieval-Augmented Generation)** is a technique that enhances large language model outputs by retrieving relevant documents from an external knowledge base before generating a response. Instead of relying solely on what a model learned during training, RAG grounds its answers in specific, up-to-date source material — reducing hallucinations and enabling responses backed by verifiable references.

## Why RAG Matters

LLMs have a fundamental limitation: their knowledge is frozen at training time, and they can confidently fabricate information they don't actually know. RAG solves both problems by giving the model access to a live corpus of documents at inference time.

This makes RAG essential for enterprise applications where accuracy is non-negotiable — legal research, medical Q&A, internal knowledge bases, and customer support. Teams building [agentic coding](/glossary/agentic-coding) tools also use RAG to give AI assistants access to project documentation and codebases that didn't exist when the model was trained. For a practical example of how context retrieval shapes AI-assisted workflows, see our coverage of [side-chain conversations in Claude Code](/blog/claude-code-btw-side-chain-conversations).

## How RAG Works

A RAG system has two core components: a **retriever** and a **generator**.

1. **Indexing**: Documents are split into chunks and converted into vector embeddings using an embedding model, then stored in a vector database (Pinecone, Weaviate, Chroma, pgvector, etc.)
2. **Retrieval**: When a user query arrives, it's embedded using the same model and matched against the vector store via similarity search. The top-k most relevant chunks are returned.
3. **Generation**: The retrieved chunks are injected into the LLM's prompt as context. The model generates its response grounded in this retrieved material.

Advanced RAG pipelines add re-ranking (scoring retrieved chunks for relevance before passing them to the LLM), hybrid search (combining vector similarity with keyword matching), and query decomposition (breaking complex questions into sub-queries for better retrieval coverage).

## Related Terms

- **[ChatGPT](/glossary/chatgpt)**: OpenAI's conversational AI, which uses retrieval-based features in its browse and file-upload capabilities
- **[Agentic Coding](/glossary/agentic-coding)**: AI-driven development workflows that often rely on RAG to access codebase context beyond the model's training data
- **[Cursor](/glossary/cursor)**: An AI-enhanced IDE that uses codebase indexing and retrieval to provide context-aware completions

---

*Want more AI insights? [Subscribe to LoreAI](/subscribe) for daily briefings.*