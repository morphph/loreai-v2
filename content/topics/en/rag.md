---
title: "RAG — Everything You Need to Know"
slug: rag
description: "Complete guide to RAG (Retrieval-Augmented Generation): how it works, key techniques, and resources."
pillar_topic: RAG
category: techniques
related_glossary: [rag, agentic-coding, ai-safety]
related_blog: [run-ai-coding-agents-locally, intercom-claude-code-plugins-skills-hooks, dispatch-launch-claude-code-sessions]
related_compare: []
related_faq: []
lang: en
---

# RAG — Everything You Need to Know

**[Retrieval-Augmented Generation (RAG)](/glossary/rag)** is an architecture pattern that grounds large language model outputs in external knowledge by retrieving relevant documents at inference time. Instead of relying solely on what a model learned during training, RAG systems query a knowledge base — vector databases, search indexes, or structured data stores — and inject the retrieved context into the model's prompt. This solves two fundamental LLM limitations: knowledge cutoff dates and hallucination. RAG has become the default approach for building production AI applications that need accurate, up-to-date, and source-backed responses, from enterprise search to customer support bots to [AI-powered coding tools](/glossary/agentic-coding).

## Latest Developments

RAG architectures have evolved significantly since the original 2020 research paper from Meta AI. The current generation — often called **RAG 2.0** or **agentic RAG** — moves beyond simple retrieve-then-generate pipelines. Modern systems use multi-step retrieval with query rewriting, re-ranking, and iterative refinement. LLM agents now decide when and how to retrieve, making retrieval a tool call rather than a fixed pipeline stage.

Embedding models have gotten substantially better and cheaper. Open-source options like BGE, GTE, and Nomic Embed match or exceed earlier proprietary embeddings at a fraction of the cost. Hybrid search — combining dense vector retrieval with sparse keyword matching (BM25) — has emerged as the practical default, outperforming either approach alone.

On the infrastructure side, vector databases have matured rapidly. Pinecone, Weaviate, Qdrant, and Chroma all support production-scale deployments with filtering, multi-tenancy, and hybrid search built in. For teams running AI coding workflows locally, RAG patterns are increasingly embedded directly into development tools — see our coverage of [running AI coding agents locally](/blog/run-ai-coding-agents-locally).

## Key Features and Capabilities

**Retrieval pipeline**: The core RAG loop has three stages — **chunk**, **embed**, **retrieve**. Documents are split into chunks (typically 256–1024 tokens), converted to vector embeddings, and stored in a vector database. At query time, the user's input is embedded and matched against stored vectors using cosine similarity or approximate nearest neighbor (ANN) search.

**Chunking strategies**: How you split documents matters more than which embedding model you use. Fixed-size chunking is simple but loses semantic boundaries. Recursive character splitting respects paragraph and sentence breaks. Semantic chunking groups sentences by embedding similarity. The right strategy depends on your document types — structured API docs need different chunking than long-form articles.

**Re-ranking**: First-pass retrieval optimizes for recall (finding all potentially relevant chunks). A re-ranker — typically a cross-encoder model — then scores each retrieved chunk against the original query for precision. This two-stage approach consistently improves answer quality by 10–25% in benchmarks.

**Context window management**: With models now supporting 100K+ token context windows, a common question is whether RAG is still necessary. The answer is yes — retrieval is still more cost-effective and accurate than stuffing entire knowledge bases into a prompt. Long-context models complement RAG by allowing more retrieved chunks per query, not replacing retrieval.

**Evaluation**: RAG systems need domain-specific evaluation. Key metrics include **retrieval recall** (did we find the right chunks?), **answer faithfulness** (does the response match the retrieved context?), and **answer relevance** (does it actually address the question?). Frameworks like RAGAS and DeepEval automate these measurements.

**Agentic RAG**: The latest evolution integrates RAG into agent loops. Instead of a fixed retrieve-then-generate pipeline, an [AI agent](/glossary/agentic-coding) decides dynamically whether to retrieve, which sources to query, and whether the retrieved context is sufficient — or if it needs to refine the query and search again. This pattern powers tools like [Claude Code plugins](/blog/intercom-claude-code-plugins-skills-hooks) that pull context from external systems on demand.

## Common Questions

No dedicated FAQ pages exist yet for RAG. Check back soon — we're building out answers to the most common questions developers ask about retrieval-augmented generation, including chunking best practices, vector database selection, and when RAG is overkill.

## How RAG Compares

No dedicated comparison pages exist yet. We're working on head-to-head comparisons covering RAG vs. fine-tuning, RAG vs. long-context prompting, and popular vector database matchups.

## All RAG Resources

### Blog Posts
- [Run AI Coding Agents Locally](/blog/run-ai-coding-agents-locally)
- [Intercom, Claude Code Plugins, Skills & Hooks](/blog/intercom-claude-code-plugins-skills-hooks)
- [Dispatch: Launch Claude Code Sessions](/blog/dispatch-launch-claude-code-sessions)

### Glossary
- [RAG](/glossary/rag) — Retrieval-Augmented Generation architecture pattern
- [Agentic Coding](/glossary/agentic-coding) — AI agents that autonomously write and modify code
- [AI Regulation](/glossary/ai-regulation) — Governance frameworks for artificial intelligence
- [AI Safety](/glossary/ai-safety) — Research and practices ensuring AI systems behave as intended
- [Autonomous Weapons](/glossary/autonomous-weapons) — Weapons systems with AI-driven targeting capabilities

---

*Want more AI insights? [Subscribe to LoreAI](/subscribe) for daily briefings.*