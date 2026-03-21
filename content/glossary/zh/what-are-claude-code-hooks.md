---
title: "Claude Code Hooks — AI 术语表"
slug: what-are-claude-code-hooks
description: "什么是 Claude Code Hooks？在特定时刻自动执行的指令，用于强制项目规则、自动化任务和工具集成。"
term: what-are-claude-code-hooks
display_term: "Claude Code Hooks"
category: tools
related_glossary: [agentic-coding]
related_blog: [run-ai-coding-agents-locally]
lang: zh
---

# Claude Code Hooks — AI 术语表

**Claude Code Hooks** 是在 Claude Code 生命周期特定时刻自动执行的用户定义指令，包括 shell 命令、HTTP 端点或 LLM 提示。不同于依赖 AI 自主判断，Hooks 提供确定性的流程控制，确保代码格式化、测试运行、安全检查等关键步骤总会被执行。

## 为什么 Claude Code Hooks 重要

Claude Code 虽然能写好代码，但容易遗漏代码格式化、运行测试或遵循安全协议等重要步骤。Hooks 让你通过配置一次来自动化这些提醒，避免每次都重复告诉 Claude 同样的步骤。这对于强制项目规则、防止特定文件被意外修改、或与现有工具链集成特别有用。许多团队用 Hooks 来实现文件锁定、数据库查询验证等确定性的工作流控制。

## Claude Code Hooks 怎样工作

Hooks 配置在 `~/.claude/settings.json` 文件中，支持 23 个不同的事件——从会话开始（SessionStart）、工具执行前后（PreToolUse/PostToolUse）到任务完成（TaskCompleted）等。你定义一个"匹配器"来指定触发条件（比如"只有在写入 Python 文件时"），然后关联需要执行的命令。当 Claude Code 执行相应操作时，你的命令会自动运行，获得关于该操作的详细 JSON 上下文，从而做出智能决策。

## 相关术语

- **[Agentic Coding](/glossary/agentic-coding)**: 由 AI 自主规划和执行多步工作流的编码方式
- **[Claude Code](/glossary/claude-code)**: Anthropic 的终端 AI 代理，支持通过 Hooks 自定义工作流
- **[CLAUDE.md](/glossary/claude-code)**: 项目级配置文件，与 Hooks 配合定义项目标准

---

*觉得有用？[订阅 LoreAI](/subscribe)，每天 5 分钟掌握 AI 动态。*