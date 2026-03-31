---
title: "CLAUDE.md — AI 术语表"
slug: claude-md
description: "什么是 CLAUDE.md？Claude Code 的项目级配置文件，用于定义 AI 编码助手的行为规则和项目上下文。"
term: claude-md
display_term: "CLAUDE.md"
category: tools
related_glossary: [claude-code, skill-md, mcp-server]
related_blog: [claude-code-extension-stack-skills-hooks-agents-mcp, mcp-vs-cli-vs-skills-extend-claude-code]
related_compare: [claude-code-vs-cursor]
lang: zh
related_topics: [claude-code]
---

# CLAUDE.md — AI 术语表

**CLAUDE.md** 是 [Anthropic](/glossary/anthropic) 旗下 AI 编码工具 Claude Code 的项目级配置文件。它以 Markdown 格式存放在项目根目录，向 Claude Code 提供项目背景、编码规范、构建命令和工作流约束等关键上下文。简单来说，CLAUDE.md 就是你写给 AI 的「项目说明书」——让它在第一次接触代码库时就知道该怎么做、不该做什么。

## 为什么 CLAUDE.md 重要

传统 AI 编码助手每次对话都从零开始，不了解你的项目架构、技术栈选型或团队约定。CLAUDE.md 解决了这个「失忆」问题。把编码规范、质量门禁、禁止事项写进 CLAUDE.md 后，Claude Code 每次启动都会自动读取，确保生成的代码符合项目标准。

对团队协作而言，这意味着所有成员使用 Claude Code 时获得一致的 AI 行为——不需要每个人重复输入同样的提示词。CLAUDE.md 随代码库版本控制，与 [SKILL.md](/glossary/skill-md) 配合使用，构成完整的 AI 行为配置体系。详细的配置实践可参考我们的 [Claude Code 扩展栈指南](/blog/claude-code-extension-stack-skills-hooks-agents-mcp)。

## CLAUDE.md 的工作原理

Claude Code 启动时按优先级加载多层配置：

- **项目级** `CLAUDE.md`：放在仓库根目录，定义全局规则——技术栈、构建命令、代码风格、质量门禁
- **目录级** `CLAUDE.md`：放在子目录中，覆盖或补充上级规则，适合 monorepo 中不同模块有不同约定的场景
- **用户级** `~/.claude/CLAUDE.md`：个人偏好设置，跨项目生效

文件内容是纯 Markdown，没有特殊语法要求。Claude Code 将其作为系统上下文注入对话，配合 [MCP 服务器](/glossary/mcp-server)的外部工具能力，实现对项目环境的全面理解。与 [Cursor](/compare/claude-code-vs-cursor) 等 IDE 工具的 rules 文件相比，CLAUDE.md 支持更丰富的层级结构和上下文控制。

## 相关术语

- **[SKILL.md](/glossary/skill-md)**：任务级指令文件，定义 Claude Code 执行特定任务（写测试、生成内容）的详细步骤
- **[MCP Server](/glossary/mcp-server)**：模型上下文协议服务器，为 Claude Code 扩展外部工具和数据源接入能力
- **[Claude Code](/glossary/claude-code)**：Anthropic 的终端 AI 编码智能体，CLAUDE.md 的宿主工具

---

*觉得有用？[订阅 LoreAI](/subscribe)，每天 5 分钟掌握 AI 动态。*