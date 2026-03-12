---
title: "RAG（检索增强生成） — AI 术语表"
slug: rag
description: "什么是 RAG？一种结合外部知识检索与大语言模型生成的技术架构，显著减少幻觉并提升回答准确性。"
term: rag
display_term: "RAG"
category: techniques
related_glossary: [chatgpt, cursor, agentic-coding]
related_blog: [claude-code-btw-side-chain-conversations]
related_compare: []
lang: zh
---

# RAG（检索增强生成） — AI 术语表

**RAG**（Retrieval-Augmented Generation，检索增强生成）是一种将外部知识检索与大语言模型文本生成相结合的技术架构。核心思路：模型在生成回答前，先从知识库中检索相关文档片段作为上下文，而非完全依赖训练时记忆的参数知识。这直接解决了 LLM 最大的痛点——幻觉和知识过时。

## 为什么 RAG 重要

大语言模型的参数知识有截止日期，且无法覆盖企业私有数据。RAG 让模型能够在推理时动态接入最新、最相关的信息源，大幅提升回答的准确性和可追溯性。

对企业而言，RAG 是当前最实用的 LLM 落地方案之一——不需要微调模型，只需搭建检索管道，就能让通用模型变成领域专家。从客服问答到内部知识管理，RAG 已成为生产级 AI 应用的标配架构。我们在[近期的报道](/blog/claude-code-btw-side-chain-conversations)中也讨论了类似的上下文增强思路。

## RAG 的工作原理

RAG 的典型流程分三步：

1. **索引阶段**：将文档切分为 chunk，通过 embedding 模型转化为向量，存入向量数据库（如 Pinecone、Weaviate、pgvector）
2. **检索阶段**：用户提问后，将问题同样转为向量，在数据库中执行相似度搜索，召回最相关的 Top-K 文档片段
3. **生成阶段**：将检索到的片段与原始问题一起注入 LLM 的 prompt，模型基于这些上下文生成最终回答

进阶实践中，还会加入 reranker 重排序、query 改写、混合检索（关键词 + 语义）等策略来提升召回质量。与[智能编程工具](/glossary/agentic-coding)类似，RAG 的核心价值在于让 AI 能够利用外部上下文做出更可靠的判断。

## 相关术语

- **[Agentic Coding](/glossary/agentic-coding)**：AI 代理式编程，同样依赖上下文增强来提升代码生成质量
- **[ChatGPT](/glossary/chatgpt)**：OpenAI 的对话模型，其企业版和自定义 GPT 均支持 RAG 架构
- **[Cursor](/glossary/cursor)**：AI 编程编辑器，内部使用类似 RAG 的代码库检索机制来理解项目上下文

---

*觉得有用？[订阅 LoreAI](/subscribe)，每天 5 分钟掌握 AI 动态。*