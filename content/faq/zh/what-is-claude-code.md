---
title: "Claude Code 是什么？"
slug: what-is-claude-code
description: "Claude Code 是 Anthropic 推出的终端 AI 编程工具，可以直接在命令行里读写代码、执行命令、管理整个开发流程。"
category: tools
related_glossary: [claude-code, anthropic, agentic-coding, claude-md]
related_blog: [claude-code-complete-guide, claude-code-extension-stack-skills-hooks-agents-mcp]
lang: zh
---

# Claude Code 是什么？

Claude Code 是 Anthropic 做的一个终端编程工具，直接在命令行里跟 Claude 对话就能改代码、跑命令、搜代码库，整个开发流程不用离开终端。它不是普通的聊天机器人，而是一个真正能动手干活的 AI 编程助手。

## 背景

跟传统的 AI 对话窗口或 IDE 插件不同，[Claude Code](/glossary/claude-code) 是一个完整的[智能编程](/glossary/agentic-coding)终端工具。它能读懂你的项目结构，分析文件内容，还会自动读取项目根目录下的 [CLAUDE.md](/glossary/claude-md) 文件来了解你的项目规范和偏好。

[Anthropic](/glossary/anthropic) 做这个工具的思路很直接：开发者大部分时间在终端里，那 AI 就应该在终端里工作。不用再在聊天窗口和编辑器之间来回复制代码了。Claude Code 能帮你写 commit、跑测试、解决 merge conflict，甚至能用多 agent 协作来处理复杂任务。

现在 Claude Code 的生态已经很丰富了，支持 [skills、hooks 和 MCP 集成](/blog/claude-code-extension-stack-skills-hooks-agents-mcp)，有持久化的项目记忆系统，还能用 agent 团队来并行处理任务。完整的使用指南可以看 [Claude Code 完全指南](/blog/claude-code-complete-guide)。

## 实用步骤

1. 全局安装：`npm install -g @anthropic-ai/claude-code`
2. 在终端进入你的项目目录。
3. 输入 `claude` 启动交互会话。
4. 在项目根目录创建 `CLAUDE.md` 文件，写上项目的代码规范、工作流程等信息，Claude 会自动读取并遵守。
5. 更多进阶用法可以浏览 [Claude Code 专题页](/topics/claude-code)。

## 相关问题

- [怎么安装 Claude Code？](/faq/how-to-install-claude-code)
- [Claude Code 免费吗？](/faq/is-claude-code-free)
- [Claude Code 多少钱？](/faq/how-much-does-claude-code-cost)

---

*觉得有用？[订阅 LoreAI](/subscribe)，每天 5 分钟掌握 AI 动态。*
