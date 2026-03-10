---
title: "LangChain — AI Glossary"
slug: langchain
description: "What is LangChain? An open-source framework for building applications powered by large language models."
term: langchain
display_term: "LangChain"
category: frameworks
related_glossary: [fine-tuning, agentic-coding]
related_blog: [restaurant-voice-agent-gpt-realtime-tutorial]
related_compare: []
lang: en
---

# LangChain — AI Glossary

**LangChain** is an open-source framework for building applications powered by large language models (LLMs). It provides a standardized interface for chaining together LLM calls, tool usage, memory, and retrieval — letting developers compose complex AI workflows without writing boilerplate integration code. Available in both Python and JavaScript/TypeScript, LangChain has become one of the most widely adopted frameworks for LLM application development.

## Why LangChain Matters

Before LangChain, building an LLM-powered application meant writing custom glue code for every component: prompt formatting, API calls, output parsing, document retrieval, and conversation memory. LangChain abstracts these into composable modules with consistent interfaces.

The framework is particularly valuable for **retrieval-augmented generation (RAG)** pipelines, where you need to fetch relevant documents from a vector store and inject them into prompts. It also simplifies building [agentic workflows](/glossary/agentic-coding) where an LLM decides which tools to call and in what order. For a practical example of tool-calling architectures, see our [voice agent tutorial](/blog/restaurant-voice-agent-gpt-realtime-tutorial).

## How LangChain Works

LangChain's architecture centers on a few core abstractions:

- **Chains**: Sequential pipelines that pass output from one step as input to the next — prompt template → LLM call → output parser
- **Agents**: LLM-driven decision loops that select and invoke tools dynamically based on the task
- **Retrievers**: Interfaces to vector databases (Pinecone, Chroma, FAISS) for semantic document search
- **Memory**: Conversation history management, from simple buffer memory to summarized long-term memory

The newer **LangGraph** extension adds support for stateful, multi-actor workflows with branching and cycles — addressing limitations of the original linear chain model. **LangSmith** provides observability and evaluation tooling for debugging and monitoring production LLM applications.

## Related Terms

- **[Agentic Coding](/glossary/agentic-coding)**: AI-driven development workflows where models autonomously plan and execute tasks — LangChain's agent module enables this pattern
- **[Fine-Tuning](/glossary/fine-tuning)**: Customizing model weights on domain-specific data — an alternative to LangChain's prompt-based approach for specialization
- **[ChatGPT](/glossary/chatgpt)**: OpenAI's conversational AI product — LangChain supports ChatGPT's underlying models as one of many LLM backends

---

*Want more AI insights? [Subscribe to LoreAI](/subscribe) for daily briefings.*