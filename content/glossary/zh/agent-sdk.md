---
title: "Agent SDK — AI术语表"
slug: agent-sdk
description: "什么是Agent SDK？专为构建自主AI智能体而设计的开源编程库，提供代理循环、工具调用、上下文管理等核心能力，支持Python和TypeScript等多种语言。"
term: agent-sdk
display_term: "Agent SDK"
category: frameworks
related_glossary: [agentic-coding, ai-safety]
related_blog: [codex-vscode]
lang: zh
---

# Agent SDK — AI术语表

**Agent SDK** 是用于快速构建自主AI智能体应用的编程库和框架。最知名的实现包括Anthropic的Claude Agent SDK（从Claude Code SDK更名）和OpenAI的Agents SDK，都提供了代理循环、工具调用和上下文管理等核心基础设施，使开发者能够用Python、TypeScript或其他语言创建能读取文件、执行命令、搜索网络和编辑代码的智能体。

## 为什么Agent SDK重要

Agent SDK 大幅降低了构建智能体应用的门槛。传统方式需要从零开始编写完整的代理循环和工具集成，而SDK提供了即用的基础设施——自动处理工具调用、结果反馈和多轮交互。这让开发者能聚焦业务逻辑而非底层实现。

对企业应用而言，Agent SDK支持多种部署场景，如Microsoft 365 Copilot、Microsoft Teams等，让智能体更容易集成到现有系统。同时，SDK内置的防护栏（Guardrails）和验证机制确保了生产环境的安全性。通过使用Agent SDK，团队可以快速构建[代理式编程](/glossary/agentic-coding)应用。

## Agent SDK如何工作

Agent SDK的核心包含三个主要部分：**智能体**（配有指令和工具的LLM）、**工具集成**（函数工具或MCP服务器）和**代理循环**（自动调度执行）。

开发者定义智能体并为其指配工具和指令后，SDK的代理循环会自动处理完整流程：接收用户请求 → 调用LLM推理 → 执行相应工具 → 将结果返回给LLM → 迭代直到任务完成。这个自动化的循环消除了重复的工程工作。

## 相关术语

- **[代理式编程](/glossary/agentic-coding)**：智能体自主规划和执行多步任务的编程范式
- **[AI安全](/glossary/ai-safety)**：确保AI系统可控、对齐和可靠的研究和工程实践
- **[ChatGPT](/glossary/chatgpt)**：OpenAI开发的对话AI模型，是Agent SDK应用的基础

---

*觉得有用？[订阅 LoreAI](/subscribe)，每天 5 分钟掌握 AI 动态。*