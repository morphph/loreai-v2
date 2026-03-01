---
title: "LangChain — AI Glossary"
slug: langchain
description: "An open-source framework for building applications powered by large language models, providing abstractions for chains, agents, and memory."
term: langchain
display_term: "LangChain"
category: frameworks
date: "2025-03-01"
related_glossary:
  - rag
  - agent
  - function-calling
related_blog: []
related_compare:
  - langchain-vs-llamaindex
related_faq: []
lang: en
---

# LangChain

**LangChain** is an open-source framework for building applications powered by large language models. It provides modular abstractions for common LLM patterns including chains (sequential LLM calls), agents (autonomous tool-using systems), memory (conversation persistence), and retrieval (RAG pipelines).

## Why It Matters

Building production LLM applications requires more than API calls. You need prompt management, output parsing, error handling, memory across conversations, tool integration, and retrieval pipelines. LangChain provides standardized building blocks for all of these, significantly accelerating development time.

LangChain has become the most popular LLM application framework, with a massive ecosystem of integrations covering nearly every LLM provider, vector database, tool, and data source. Its adoption has made it a de facto standard for prototyping and building AI applications in Python and JavaScript.

## How It Works

LangChain is organized into several core modules:

- **Models**: Unified interfaces for chat models, LLMs, and embedding models from any provider (OpenAI, Anthropic, open-source, etc.).
- **Prompts**: Template management with variable substitution, few-shot example selection, and prompt composition.
- **Chains**: Sequential pipelines that connect multiple LLM calls and processing steps. LangChain Expression Language (LCEL) provides a declarative way to compose chains.
- **Agents**: Autonomous systems that use LLMs to decide which tools to call and in what order. Agents can search the web, query databases, execute code, and more.
- **Retrieval**: RAG pipeline components including document loaders, text splitters, embedding integrations, and vector store connectors.

LangChain also offers LangSmith for observability and debugging, and LangGraph for building stateful multi-actor agent systems. The framework is available in Python (primary) and JavaScript/TypeScript, with the JS version covering most of the same functionality.

## Related Terms

- [RAG](/glossary/rag) — A core use case that LangChain simplifies
- [Agent](/glossary/agent) — Autonomous systems built with LangChain
- [Function Calling](/glossary/function-calling) — The model capability LangChain agents use

---
*Want to stay updated on AI frameworks? [Subscribe to AI News](/subscribe) for daily briefings.*
