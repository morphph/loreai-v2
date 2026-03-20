---
title: "RAG（检索增强生成）— 你需要知道的一切"
slug: rag
description: "RAG 完全指南：架构原理、核心组件、实战应用与最新进展。"
pillar_topic: RAG
category: techniques
related_glossary: [rag, agentic-coding, ai-regulation, ai-safety, autonomous-weapons]
related_blog: [run-ai-coding-agents-locally, intercom-claude-code-plugins-skills-hooks, dispatch-launch-claude-code-sessions]
related_compare: []
related_faq: []
lang: zh
---

# RAG（检索增强生成）— 你需要知道的一切

**[RAG](/glossary/rag)**（Retrieval-Augmented Generation，检索增强生成）是当前大语言模型落地最关键的技术架构之一。核心思路很直接：在模型生成回答之前，先从外部知识库中检索相关文档，把检索结果作为上下文注入 prompt，让模型基于真实数据回答问题。这解决了 LLM 最大的痛点——幻觉和知识过时。无论是企业内部知识问答、客服系统、还是代码文档搜索，RAG 已经成为生产级 AI 应用的标准范式。相比微调（fine-tuning），RAG 不需要重新训练模型，数据更新只需刷新索引，部署成本和迭代速度都有明显优势。

## 最新进展

2025 到 2026 年，RAG 技术经历了快速迭代。几个值得关注的方向：

**Agentic RAG** 正在成为主流。传统 RAG 是单轮检索——查一次、生成一次。Agentic RAG 让模型具备多轮检索和推理能力：如果第一次检索结果不够好，agent 会自动改写查询、切换数据源、甚至调用工具验证答案。这种模式和[智能编程](/glossary/agentic-coding)的思路一脉相承——让 AI 不只是执行指令，而是自主规划和迭代。

**混合检索**（向量检索 + 关键词检索 + 重排序）已经替代了早期纯向量搜索的方案。实践表明，单靠 embedding 相似度检索的召回率不够稳定，结合 BM25 等传统检索方法效果显著提升。

**长上下文窗口的冲击**也值得关注。Claude、Gemini 等模型的上下文窗口已经扩展到百万 token 级别，部分场景可以直接把整个文档塞进 prompt，无需检索。但对于企业级知识库（数十万文档）和需要精确溯源的场景，RAG 仍然不可替代。

## 核心架构与组件

一个生产级 RAG 系统通常包含以下环节：

**文档处理层**：将原始数据（PDF、网页、代码、数据库记录）切分为 chunk。分块策略直接影响检索质量——按语义段落切分通常优于固定长度切分。Markdown 标题、代码函数边界都是天然的分块锚点。

**索引与检索层**：对 chunk 做 embedding 后存入向量数据库（Pinecone、Weaviate、pgvector 等）。查询时，用户问题同样做 embedding，通过近似最近邻（ANN）搜索找到最相关的文档片段。生产系统通常会加入 **reranker**（如 Cohere Rerank、cross-encoder 模型）对初步检索结果做二次排序。

**生成层**：将检索到的 top-K 文档片段拼接到 prompt 中，交给 LLM 生成最终回答。好的 RAG 系统会在回答中标注引用来源，方便用户验证。

**评估与监控**：用 faithfulness（忠实度）、relevance（相关性）、answer correctness 等指标持续评估系统表现。RAGAS 等框架提供了标准化的评估流程。

关键设计决策包括：chunk 大小（通常 256-1024 token）、top-K 值（3-10）、是否使用 query expansion、是否做 hypothetical document embedding（HyDE）等。这些参数没有万能值，需要根据具体数据和场景调优。

## 常见问题

目前暂无 RAG 相关的 FAQ 页面。我们正在整理社区中最常见的技术问题——如何选择向量数据库、chunk 大小如何确定、RAG vs 长上下文窗口的取舍等，敬请关注后续更新。

## 相关对比

目前暂无 RAG 相关的对比页面。我们计划推出 RAG vs Fine-tuning、主流向量数据库对比等内容。

## 所有 RAG 相关资源

### 术语表
- [RAG](/glossary/rag) — 检索增强生成技术详解
- [Agentic Coding](/glossary/agentic-coding) — 智能编程 agent 的工作模式
- [AI Regulation](/glossary/ai-regulation) — AI 监管与合规框架
- [AI Safety](/glossary/ai-safety) — AI 安全研究与对齐
- [Autonomous Weapons](/glossary/autonomous-weapons) — 自主武器系统与 AI 伦理

### 博客文章
- [本地运行 AI 编程 Agent](/blog/run-ai-coding-agents-locally)
- [Intercom 的 Claude Code 插件与技能系统](/blog/intercom-claude-code-plugins-skills-hooks)
- [Dispatch：批量启动 Claude Code 会话](/blog/dispatch-launch-claude-code-sessions)

---

*觉得有用？[订阅 LoreAI](/subscribe)，每天 5 分钟掌握 AI 动态。*