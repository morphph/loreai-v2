---
title: "Ollama — AI 术语表"
slug: ollama
description: "什么是 Ollama？一款在本地运行大语言模型的开源工具，支持 Llama、Mistral 等主流模型。"
term: ollama
display_term: "Ollama"
category: tools
related_glossary: [llama, anthropic, agent-teams]
related_blog: [mcp-vs-cli-vs-skills-extend-claude-code]
related_compare: []
lang: zh
---

# Ollama — AI 术语表

**Ollama** 是一款开源的本地大语言模型运行工具，让开发者无需云端 API 即可在自己的机器上运行 Llama、Mistral、Gemma、Phi 等开源模型。它封装了模型下载、量化、推理服务的全流程，一条命令就能启动一个本地 LLM 服务。

## 为什么 Ollama 重要

在 AI 开发中，并非所有场景都适合调用云端 API——隐私敏感的数据处理、离线环境开发、快速原型迭代，都需要本地推理能力。Ollama 把原本复杂的模型部署简化到了 `ollama run llama3` 这样一条命令，大幅降低了本地 LLM 的使用门槛。

对于构建 [agentic](/glossary/agentic) 应用的开发者来说，Ollama 提供了一个兼容 OpenAI API 格式的本地端点，方便与现有工具链集成。许多开发者用它搭配 [MCP 协议](/blog/mcp-vs-cli-vs-skills-extend-claude-code)做本地工具调用实验。

## Ollama 的工作原理

Ollama 基于 llama.cpp 构建推理引擎，支持 CPU 和 GPU（NVIDIA、Apple Silicon）加速。核心机制包括：

- **Modelfile 系统**：类似 Dockerfile 的声明式格式，定义模型来源、系统提示词、温度等参数，实现可复现的模型配置
- **模型仓库**：维护一个公开的模型库，支持 `ollama pull` 直接下载预量化模型（GGUF 格式）
- **REST API**：默认在 `localhost:11434` 提供 HTTP 接口，兼容 OpenAI chat completions 格式
- **多模型并发**：支持同时加载多个模型，按需在内存中切换

Ollama 支持 macOS、Linux 和 Windows，对 Apple Silicon 的 Metal 加速支持尤其成熟。

## 相关术语

- **[Agentic](/glossary/agentic)**：Ollama 提供的本地推理能力是构建 agentic 工作流的基础组件之一
- **[Agent Teams](/glossary/agent-teams)**：本地模型可作为轻量级子 agent 运行，降低 API 调用成本
- **[Anthropic](/glossary/anthropic)**：与 Ollama 运行的开源模型不同，Anthropic 的 Claude 系列通过云端 API 提供服务

---

*觉得有用？[订阅 LoreAI](/subscribe)，每天 5 分钟掌握 AI 动态。*