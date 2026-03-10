---
title: "LangChain — AI 术语表"
slug: langchain
description: "什么是 LangChain？用于构建大语言模型应用的开源框架，提供链式调用、RAG、Agent 等核心能力。"
term: langchain
display_term: "LangChain"
category: frameworks
related_glossary: [fine-tuning, agentic-coding, chatgpt]
related_blog: [restaurant-voice-agent-gpt-realtime-tutorial]
related_compare: []
lang: zh
---

# LangChain — AI 术语表

**LangChain** 是一个用于构建大语言模型（LLM）应用的开源框架，由 Harrison Chase 于 2022 年发起。它将模型调用、数据检索、工具使用等步骤封装为可组合的模块，让开发者用几十行代码就能搭建出复杂的 AI 应用——从问答机器人到自主 Agent。

## 为什么 LangChain 重要

LLM 本身只做文本生成，但实际产品需要连接数据库、调用 API、处理多轮对话状态。LangChain 填补了"裸模型"到"可用产品"之间的工程缺口。它是目前 LLM 应用开发生态中最活跃的框架之一，GitHub star 数超过 10 万，周下载量长期位居同类工具前列。

无论你用 OpenAI、Claude 还是开源模型，LangChain 都提供统一的接口抽象，降低了切换模型的成本。对于需要构建 [RAG 检索增强生成](/glossary/fine-tuning)或[语音 Agent](/blog/restaurant-voice-agent-gpt-realtime-tutorial) 等复杂管线的团队，它显著缩短了从原型到生产的周期。

## LangChain 如何工作

LangChain 的核心抽象包括几个层次：

- **Model I/O**：统一封装各家 LLM 和 Embedding 模型的调用接口
- **Chains**：将提示词模板、模型调用、输出解析串联成可复用的处理链
- **Retrieval**：内置向量数据库集成（Chroma、Pinecone 等），支持 RAG 架构
- **Agents**：让 LLM 自主决定调用哪些工具、按什么顺序执行，实现[智能体编程](/glossary/agentic-coding)范式

2024 年后 LangChain 拆分为核心库 `langchain-core` 和生态包，并推出 LangGraph（用于构建有状态 Agent 工作流）和 LangSmith（用于可观测性和评估），形成完整工具链。

## 相关术语

- **[Agentic Coding](/glossary/agentic-coding)**：LangChain Agents 是智能体编程的典型实现方式之一
- **[Fine-tuning](/glossary/fine-tuning)**：当 LangChain 的提示词工程不够用时，微调是提升模型表现的下一步
- **[ChatGPT](/glossary/chatgpt)**：LangChain 最常搭配的模型之一，也是其早期流行的重要推动力

---

*觉得有用？[订阅 LoreAI](/subscribe)，每天 5 分钟掌握 AI 动态。*