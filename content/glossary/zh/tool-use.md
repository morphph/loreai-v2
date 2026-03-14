---
title: "Tool Use（工具使用） — AI 术语表"
slug: tool-use
description: "什么是 Tool Use？AI 模型调用外部工具完成任务的核心能力机制。"
term: tool-use
display_term: "Tool Use（工具使用）"
category: techniques
related_glossary: [agentic, agent-teams, claude]
related_blog: [mcp-vs-cli-vs-skills-extend-claude-code, claude-code-agent-teams]
related_compare: []
lang: zh
---

# Tool Use（工具使用） — AI 术语表

**Tool Use（工具使用）** 是大语言模型在对话过程中主动调用外部工具——如搜索引擎、代码执行器、数据库查询、API 接口——来获取信息或执行操作的能力。模型不再局限于文本生成，而是根据用户意图选择合适的工具、构造参数、发起调用，并将工具返回的结果整合进最终回答。这是现代 [agentic](/glossary/agentic) AI 系统的基础能力之一。

## 为什么 Tool Use 重要

纯文本生成的大模型存在明显边界：无法获取实时数据、无法执行精确计算、无法与外部系统交互。Tool Use 打破了这些限制。

当 [Claude](/glossary/claude) 等模型具备工具使用能力后，它们可以查天气、跑代码、读文件、调 API——从"只会说"变成"能动手"。这直接催生了 [Claude Code](/glossary/claude) 这类终端 AI agent：它能读取项目代码、执行 shell 命令、提交 Git 变更，背后依赖的就是 tool use 机制。更多工具集成方式可参考我们对 [MCP、CLI 与 Skills 三种扩展模式的对比分析](/blog/mcp-vs-cli-vs-skills-extend-claude-code)。

## Tool Use 如何工作

典型的 tool use 流程分三步：

1. **意图识别**：模型分析用户请求，判断是否需要调用工具以及调用哪个工具
2. **参数构造**：模型按照工具的 JSON Schema 定义生成结构化的调用参数
3. **结果整合**：工具执行后返回结果，模型将其融入上下文继续推理或直接输出

Anthropic 的 Claude API 通过在请求中声明 `tools` 数组来暴露可用工具，模型返回 `tool_use` 类型的 content block 来发起调用。MCP（Model Context Protocol）则进一步标准化了工具发现和调用协议，使 [agent teams](/glossary/agent-teams) 等多智能体架构能动态接入外部能力。

## 相关术语

- **[Agentic](/glossary/agentic)**：Tool use 是 agentic AI 的核心支撑——没有工具调用能力，agent 无法与真实环境交互
- **[Agent Teams](/glossary/agent-teams)**：多个 agent 协作时，每个 agent 可拥有不同的工具集，实现并行任务分工
- **[Claude](/glossary/claude)**：Anthropic 的大模型家族，原生支持 tool use，驱动 Claude Code 等 agentic 产品

---

*觉得有用？[订阅 LoreAI](/subscribe)，每天 5 分钟掌握 AI 动态。*