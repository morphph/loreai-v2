---
title: "Gemini — 你需要知道的一切"
slug: gemini
description: "Google Gemini 全面指南：多模态架构、最新动态与开发者资源汇总。"
pillar_topic: Gemini
category: models
related_glossary: [gemini, anthropic, claude, agentic]
related_blog: [claude-code-extension-stack-skills-hooks-agents-mcp, claude-code-agent-teams]
related_compare: []
related_faq: []
lang: zh
---

# Gemini — 你需要知道的一切

**[Gemini](/glossary/gemini)** 是 Google DeepMind 推出的多模态大语言模型家族，从设计之初就原生支持文本、图像、音频、视频和代码的理解与生成。与先做文本再补多模态的路线不同，Gemini 的训练架构从第一天起就将多种模态统一处理。模型分为 Ultra、Pro、Flash 三个级别，分别面向最高性能、日常开发和低延迟高吞吐场景。Gemini 深度整合进 Google 生态——从 Workspace 到 Android，从 Cloud Vertex AI 到开发者工具，是 Google 在 AI 领域与 [Anthropic](/glossary/anthropic) 的 [Claude](/glossary/claude) 和 OpenAI 的 GPT 系列正面竞争的核心产品。

## 最新动态

2025 年以来，Google 持续加速 Gemini 的迭代。**Gemini 2.5 Pro** 在推理和编程基准上刷新纪录，引入"深度思考"模式，直接对标 Claude 和 OpenAI o1 的推理能力。**Gemini 2.5 Flash** 则在速度和成本之间找到新平衡点，成为开发者高频调用的首选。

Google 还将 Gemini 全面嵌入开发者工具链：**Gemini Code Assist** 在 VS Code 和 JetBrains 中提供代码补全和对话辅助；**AI Studio** 和 **Vertex AI** 让开发者可以通过 API 直接调用所有 Gemini 模型。值得关注的是 **Gemini Deep Research** 功能——可以自动执行多步网络搜索并生成结构化研究报告，这在 [agentic](/glossary/agentic) AI 方向上走出了明确的一步。

关于 AI 工具生态的演进趋势，可以参考我们对 [Claude Code 扩展体系](/blog/claude-code-extension-stack-skills-hooks-agents-mcp) 的深度分析。

## 核心能力与架构

**原生多模态**：Gemini 可以在同一个对话中处理文本、图片、PDF、音频片段和视频帧，不需要分别调用不同模型。这让它在文档理解、视频分析等跨模态任务上有天然优势。

**超长上下文窗口**：Gemini 2.5 Pro 支持最高 100 万 token 的上下文窗口，是目前商用模型中最大的之一。处理整个代码库、长篇论文或数小时的会议记录不再需要分块。

**模型梯度**：
- **Ultra/Pro**：面向需要最强推理能力的复杂任务——数学证明、多步代码生成、深度分析
- **Flash**：低延迟、低成本，适合实时对话、批量处理和预算敏感场景
- **Nano**：端侧模型，运行在 Pixel 手机和 Chrome 浏览器中，无需云端调用

**工具使用与 Grounding**：Gemini 支持函数调用（function calling）、Google 搜索 grounding 和代码执行，可以在生成过程中实时查询外部数据或运行代码验证结果。

**Google 生态整合**：Gmail 中的邮件摘要、Docs 中的写作辅助、Sheets 中的数据分析——Gemini 已经渗透到数亿用户的日常工具中。

## 常见问题

- **Gemini 和 ChatGPT 有什么区别？** Gemini 原生多模态且深度绑定 Google 生态；ChatGPT 背靠 OpenAI 的 GPT 系列，插件生态更成熟。选择取决于你的主要工作场景
- **Gemini API 怎么收费？** 通过 Google AI Studio 免费额度入门，生产环境通过 Vertex AI 按 token 计费，Flash 模型价格极具竞争力
- **Gemini 适合写代码吗？** Gemini 2.5 Pro 在编程基准上表现优秀，配合 Gemini Code Assist 可用于 IDE 内辅助开发。但在终端 [agentic](/glossary/agentic) 编程场景下，专门的 agent 工具（如 [Claude Code agent teams](/blog/claude-code-agent-teams)）仍然更成熟

## Gemini 与其他模型

Gemini 在 AI 模型格局中处于独特位置：它是唯一由同时拥有搜索引擎、移动操作系统和云平台的公司推出的大模型。与 [Claude](/glossary/claude) 相比，Gemini 在多模态广度和上下文长度上有优势，Claude 则在代码生成质量和安全对齐上更受开发者信赖。与 GPT-4o 相比，Gemini 的 Google 生态整合是差异化卖点，而 OpenAI 在第三方集成和社区生态上积累更深。

## 所有 Gemini 资源

### 博客文章
- [Claude Code 扩展体系：Skills、Hooks、Agents 与 MCP](/blog/claude-code-extension-stack-skills-hooks-agents-mcp)
- [Claude Code Agent Teams 深度解析](/blog/claude-code-agent-teams)

### 术语表
- [Gemini](/glossary/gemini) — Google DeepMind 的多模态大语言模型家族
- [Anthropic](/glossary/anthropic) — Claude 背后的 AI 安全公司
- [Claude](/glossary/claude) — Anthropic 的大语言模型系列
- [Agentic](/glossary/agentic) — AI 系统自主执行多步任务的能力范式

---

*觉得有用？[订阅 LoreAI](/subscribe)，每天 5 分钟掌握 AI 动态。*