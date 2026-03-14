---
title: "Agent Teams — AI 术语表"
slug: agent-teams
description: "什么是 Agent Teams？多智能体协作模式，让 AI 编码助手并行处理复杂任务。"
term: agent-teams
display_term: "Agent Teams"
category: techniques
related_glossary: [agentic, anthropic, claude]
related_blog: [claude-code-agent-teams, claude-code-extension-stack-skills-hooks-agents-mcp]
related_compare: []
lang: zh
---

# Agent Teams — AI 术语表

**Agent Teams**（智能体团队）是一种多智能体协作架构，允许一个主智能体（orchestrator）将复杂任务拆分后分派给多个子智能体并行执行。在 [Claude Code](/glossary/claude) 的实现中，主进程可以 spawn 出独立的子 agent，每个子 agent 拥有自己的上下文窗口和工具权限，完成后将结果汇报给主 agent 统一整合。

## 为什么 Agent Teams 重要

单个 AI agent 处理大型代码库时面临两个瓶颈：上下文窗口有限，串行执行速度慢。Agent Teams 同时解决了这两个问题——每个子 agent 独立持有自己的上下文，多个子 agent 并行工作，整体吞吐量成倍提升。

对于 monorepo 级别的重构、跨模块测试生成、大规模代码审查等场景，这种模式尤为关键。我们在 [Claude Code Agent Teams 深度解析](/blog/claude-code-agent-teams) 中详细分析了实际应用案例。

## Agent Teams 的工作原理

典型的 Agent Teams 执行流程分三步：

1. **任务分解**：主 agent 分析目标，将其拆成可独立完成的子任务
2. **并行派发**：每个子任务交给一个独立子 agent，子 agent 拥有受限的工具集（如只读文件、只搜索不编辑）
3. **结果汇总**：子 agent 完成后返回结果，主 agent 合并输出并做最终决策

在 Claude Code 中，子 agent 的隔离性是关键设计——它们无法互相干扰，也不会污染主 agent 的上下文窗口。这种架构与 [Agentic](/glossary/agentic) 编程范式一脉相承，是 [Anthropic](/glossary/anthropic) 推进 AI 编码能力的核心方向之一。更多关于 agent 扩展机制的技术细节，参见 [Claude Code 扩展技术栈](/blog/claude-code-extension-stack-skills-hooks-agents-mcp)。

## 相关术语

- **[Agentic](/glossary/agentic)**：描述 AI 系统自主规划和执行任务的能力，Agent Teams 是其多体扩展
- **[Anthropic](/glossary/anthropic)**：Claude 和 Claude Code 的开发公司，Agent Teams 架构的设计者
- **[Claude](/glossary/claude)**：驱动 Agent Teams 中每个子 agent 的底层大语言模型

---

*觉得有用？[订阅 LoreAI](/subscribe)，每天 5 分钟掌握 AI 动态。*