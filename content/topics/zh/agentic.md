---
title: "Agentic AI — 你需要知道的一切"
slug: agentic
description: "Agentic AI 完全指南：从概念到实践，理解自主智能体如何改变软件开发与工作流程。"
pillar_topic: Agentic
category: concepts
related_glossary: [agentic, anthropic, claude, claude-code]
related_blog: [claude-code-extension-stack-skills-hooks-agents-mcp, mcp-vs-cli-vs-skills-extend-claude-code, claude-code-agent-teams]
related_compare: []
related_faq: []
lang: zh
---

# Agentic AI — 你需要知道的一切

**[Agentic AI](/glossary/agentic)** 描述的是一种 AI 系统设计范式：模型不再只是被动回答问题，而是能够自主规划任务、调用工具、执行多步操作并根据反馈动态调整策略。与传统的"输入-输出"式对话不同，agentic 系统拥有目标导向的推理能力——你给它一个任务描述，它自己拆解步骤、选择工具、执行命令、验证结果，直到任务完成。这个概念已经从学术讨论走入生产环境，[Anthropic](/glossary/anthropic) 的 [Claude Code](/glossary/claude-code)、OpenAI 的 Codex 等工具正在将 agentic 架构落地到真实的软件工程工作流中。

## 最新进展

2026 年是 agentic AI 大规模落地的一年。Anthropic 在 Claude Code 中引入了 **agent teams** 机制，允许主智能体生成多个子智能体并行处理任务——比如在重构大型代码库时，不同子智能体可以同时处理不同模块的修改和测试。我们在 [Claude Code Agent Teams 深度解析](/blog/claude-code-agent-teams) 中详细分析了这一架构。

与此同时，agentic 系统的工具生态也在快速成熟。[MCP（Model Context Protocol）](/glossary/claude-code)成为连接智能体与外部工具的标准协议，支持数据库查询、API 调用、监控系统接入等能力扩展。我们在 [MCP vs CLI vs Skills](/blog/mcp-vs-cli-vs-skills-extend-claude-code) 一文中对比了不同扩展方式的适用场景。

行业趋势上，[Amazon](/glossary/amazon) 等云厂商也在将 agentic 能力集成到自家开发者平台中，表明这不再是某一家公司的实验性功能，而是整个行业的方向。

## 核心特征与能力

Agentic AI 与传统 AI 助手的本质区别在于以下几个关键能力：

**自主规划与分解**：面对复杂任务时，agentic 系统会先制定执行计划，将大目标拆解为可管理的子任务。这不是简单的模板匹配，而是基于对任务上下文的深度理解。

**工具调用（Tool Use）**：智能体可以调用外部工具——运行终端命令、读写文件、查询数据库、发起 API 请求。[Claude Code](/glossary/claude-code) 通过 [MCP server](/glossary/claude-code) 实现这一能力，支持几乎无限的工具扩展。我们在 [Claude Code 扩展栈详解](/blog/claude-code-extension-stack-skills-hooks-agents-mcp) 中完整介绍了这套扩展体系。

**反馈循环与自修正**：agentic 系统不是"生成即完成"。它会检查执行结果——测试是否通过、构建是否成功、输出是否符合预期——并根据反馈修正策略。这种闭环能力是传统 chatbot 不具备的。

**多智能体协作**：前沿的 agentic 架构支持多个智能体并行工作。一个主智能体负责全局调度，子智能体各自处理具体模块，最后汇总结果。这种并行能力极大提升了处理大规模任务的效率。

**持久记忆与上下文管理**：通过 CLAUDE.md 等项目配置文件和记忆系统，agentic 工具可以跨会话保持对项目的理解，避免每次都从零开始。

## 常见问题

- **Agentic AI 和普通 AI 聊天有什么区别？** Agentic AI 具备自主规划和工具调用能力，能独立完成多步任务；普通聊天 AI 只能在单轮对话中回答问题
- **Agentic 系统安全吗？** 主流工具（如 Claude Code）采用人类审批机制——智能体在执行敏感操作前会请求用户确认，用户保持最终控制权
- **哪些场景最适合使用 agentic 工具？** 跨文件重构、自动化测试生成、项目搭建、批量代码迁移——任何涉及多步骤、多文件协调的工程任务

## 所有 Agentic 资源

### 博客文章
- [Claude Code 扩展栈：Skills、Hooks、Agent Teams 与 MCP](/blog/claude-code-extension-stack-skills-hooks-agents-mcp)
- [MCP vs CLI vs Skills：如何扩展 Claude Code](/blog/mcp-vs-cli-vs-skills-extend-claude-code)
- [Claude Code Agent Teams 深度解析](/blog/claude-code-agent-teams)

### 术语表
- [Agentic](/glossary/agentic) — 自主智能体 AI 范式
- [Claude Code](/glossary/claude-code) — Anthropic 的终端 AI 编程工具
- [Claude](/glossary/claude) — Anthropic 的大语言模型系列
- [Anthropic](/glossary/anthropic) — 构建 Claude 的 AI 安全公司

---

*觉得有用？[订阅 LoreAI](/subscribe)，每天 5 分钟掌握 AI 动态。*