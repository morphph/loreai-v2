---
title: "如何启动 Claude Code？"
slug: start-claude-code
description: "Claude Code 的启动方法：安装后在项目根目录运行 claude 命令，即可开始 AI 辅助编程。"
category: tools
related_glossary: [agentic-coding]
related_blog: [claude-code-memory, claude-code-hooks-mastery]
related_topics: [claude-code]
lang: zh
---

# 如何启动 Claude Code？

在终端进入你的项目根目录，直接运行 `claude` 命令即可启动。Claude Code 会读取当前目录的代码结构和 `CLAUDE.md` 配置文件，建立项目上下文后进入交互模式。

## 启动前的准备

Claude Code 是一个终端工具，需要 Node.js 环境。通过 npm 全局安装：

```bash
npm install -g @anthropic-ai/claude-code
```

安装完成后，**必须先导航到项目根目录**，再运行 `claude`。这一步很关键——Claude Code 以当前目录为工作根，会扫描项目文件、读取 `CLAUDE.md` 和 `skills/` 目录下的指令文件来理解项目规范。

```bash
cd /path/to/your-project
claude
```

## 启动后能做什么

进入交互模式后，你可以用自然语言描述任务。Claude Code 会规划步骤、编辑文件、运行命令，并在需要执行高风险操作（如写入文件、运行脚本）时请求确认。

Claude Code 记忆系统详解中介绍了如何通过 `CLAUDE.md` 让 Claude Code 在每次启动时自动加载项目规范，避免重复说明背景。Hooks 机制则可以在工具调用前后自动触发自定义脚本，适合需要自动格式化或测试的团队。

如果你是第一次接触 Claude Code，我每天都在用的 5 个 Claude Code 技巧是很好的起点。

## 相关问题

- Claude Code 的记忆系统如何工作？
- Claude Code Hooks 如何配置？

---

*觉得有用？[订阅 LoreAI](/subscribe)，每天 5 分钟掌握 AI 动态。*