---
title: "Claude Code — 你需要知道的一切"
slug: claude-code
description: "Claude Code 完整指南：Anthropic 终端 AI 编程智能体的功能详解、实战教程、最佳实践和所有相关资源。"
pillar_topic: Claude Code
category: tools
related_glossary: [claude-code, anthropic, claude, model-context-protocol, multi-agent-systems, agentic-coding]
related_blog:
  - claude-code-agent-teams
  - claude-code-btw-side-chain-conversations
  - claude-code-claude-ai-login-errors-performance
  - claude-code-ctrl-s-prompt-stashing
  - claude-code-enterprise-engineering-ramp-shopify-spotify
  - claude-code-extension-stack-skills-hooks-agents-mcp
  - claude-code-memory
  - claude-code-remote-control-mobile
  - claude-code-review-agents
  - claude-code-security-vulnerability-scanning
  - claude-code-simplify-batch-skills
  - claude-code-voice-mode
  - headless-mode
  - mcp-vs-cli-vs-skills-extend-claude-code
  - effective-harnesses-for-long-running-agents
  - scheduled-tasks
  - red-green-refactor-claude-code
  - obsidian-claude-code-life
  - superpowers
related_compare: []
related_faq: []
lang: zh
---

# Claude Code — 你需要知道的一切

**[Claude Code](/zh/glossary/claude-code)** 是 [Anthropic](/zh/glossary/anthropic) 的终端原生 AI 编程智能体。它直接跑在你的 shell 里，能读懂整个项目结构、规划多步骤工程任务、执行命令、跨文件编辑代码、自动提交——全程自主完成。跟 IDE 里的代码补全不是一个物种：你说目标，它自己想方案、自己干活。

## Claude Code 的工作原理

Claude Code 通过三层机制接入你的项目。

**[CLAUDE.md](/zh/glossary/claude-md) 项目配置**是第一层。在仓库根目录放一个 CLAUDE.md，写上编码规范、架构约定、构建命令，Claude Code 每次启动自动读取。不用每次重复解释"我们用 tabs 不用 spaces"。

**[MCP 服务器](/zh/glossary/model-context-protocol)**是第二层。通过 Model Context Protocol，Claude Code 能连接数据库、API、监控面板、文档服务器——你工作流里涉及的外部系统都能接进来。

**[Agent Teams](/zh/blog/claude-code-agent-teams)** 是第三层。Claude Code 能生成多个子智能体并行工作，每个子 agent 在独立的 git worktree 里操作，互不干扰。主 agent 负责拆任务、分配、合并结果。大型 monorepo 重构从"理论上可行"变成"真的能用"。

## Claude Code 核心功能

**[智能体团队](/zh/blog/claude-code-agent-teams)** — 生成并行子 agent，各自在独立 git worktree 里工作，适合大规模重构。

**[记忆系统](/zh/blog/claude-code-memory)** — CLAUDE.md 存规则，auto memory 存 Claude 自己的笔记。跨会话保持上下文。

**[语音模式](/zh/blog/claude-code-voice-mode)** — 用嘴说编程指令，直接执行。同样的工具链，换个输入方式。

**[远程遥控](/zh/blog/claude-code-remote-control-mobile)** — 终端启动任务，手机上监控和操控。出门在外也能推代码。

**[代码审查](/zh/blog/claude-code-review-agents)** — 多 agent 协作的 PR Review，凌晨三点也不会漏看 bug。

**[安全扫描](/blog/claude-code-security-vulnerability-scanning)** — 让 Claude Code 带着全项目上下文扫描漏洞，比孤立的 SAST 工具更懂业务逻辑。

**[无头模式](/zh/blog/headless-mode)** — 一个 `-p` 参数让 Claude Code 变成自动化引擎，接入 CI/CD、批处理任意工作流。

**[Skills & Hooks](/zh/blog/claude-code-extension-stack-skills-hooks-agents-mcp)** — Skills 把工作流编码为斜杠命令；Hooks 在 AI 行为上加确定性约束。

**[/simplify 和 /batch](/zh/blog/claude-code-simplify-batch-skills)** — 内置技能，自动清理 PR + 批量执行多任务。

**[定时任务](/zh/blog/scheduled-tasks)** — 用 `/loop` 和 cron 自动化周期性 prompt。

**[Ctrl+S 暂存](/zh/blog/claude-code-ctrl-s-prompt-stashing)** — Claude 还在干活时提前排队下一个 prompt。

**[/btw 侧链对话](/zh/blog/claude-code-btw-side-chain-conversations)** — 正事没干完时插一句快速提问，不打断主任务。

## 最佳实践

**TDD 是你控制 AI agent 的最佳手段。** 给 Claude Code 一个失败的测试，它就有了明确靶心。放它自由发挥？你会得到看起来对但不一定对的代码。[Red Green Refactor 工作流](/zh/blog/red-green-refactor-claude-code)展示了 TDD 如何把 Claude Code 从"代码生成器"变成"可靠的工程工具"。

**先组织知识，再喂给 Claude Code。** [Superpowers 项目](/zh/blog/superpowers)用 15 份 SKILL.md 文件替代了几千行 prompt engineering。搭配 [Obsidian 做第二大脑](/zh/blog/obsidian-claude-code-life)，Claude Code 就能接入你整个知识图谱，不只是当前项目。

**选对扩展机制。** 大多数人上来就搞 MCP server，其实 10 行 skill 文件就够了。动手前先看 [MCP vs CLI vs Skills 对比](/zh/blog/mcp-vs-cli-vs-skills-extend-claude-code)。跑长任务时，按照[长时间运行 Agent 的工程实践](/zh/blog/effective-harnesses-for-long-running-agents)搭好框架——初始化 agent、进度文件、增量会话，扛得住 context window 限制。

## Claude Code 企业落地

Claude Code 不只是个人玩具。[Ramp、Shopify、Spotify 等公司](/zh/blog/claude-code-enterprise-engineering-ramp-shopify-spotify)已经在数百人的团队中部署，有结构化的 onboarding、CLAUDE.md 治理和可量化的产出提升。什么模式有效、什么坑要避开，那篇深度分析里都有。

## LoreAI 上的所有 Claude Code 资源

### 深度文章

- [智能体团队：多 Agent 并行编程](/zh/blog/claude-code-agent-teams)
- [/btw 侧链对话：AI 干活时也能插嘴](/zh/blog/claude-code-btw-side-chain-conversations)
- [登录异常与性能下降：发生了什么](/zh/blog/claude-code-claude-ai-login-errors-performance)
- [Ctrl+S 暂存提示词：多任务效率翻倍](/zh/blog/claude-code-ctrl-s-prompt-stashing)
- [企业落地实录：Ramp、Shopify、Spotify 的工程实践](/zh/blog/claude-code-enterprise-engineering-ramp-shopify-spotify)
- [扩展栈拆解：Skills、Hooks、Agents、MCP 四层架构](/zh/blog/claude-code-extension-stack-skills-hooks-agents-mcp)
- [记忆系统：CLAUDE.md + Auto Memory 详解](/zh/blog/claude-code-memory)
- [远程遥控：用手机操控终端里的 AI](/zh/blog/claude-code-remote-control-mobile)
- [代码审查：多 Agent 协作的 PR Review](/zh/blog/claude-code-review-agents)
- [安全扫描：用 Claude Code 挖漏洞](/blog/claude-code-security-vulnerability-scanning)
- [/simplify 和 /batch：代码审查与批量操作](/zh/blog/claude-code-simplify-batch-skills)
- [语音模式：用嘴写代码](/zh/blog/claude-code-voice-mode)
- [无头模式：-p 参数让 AI 变自动化引擎](/zh/blog/headless-mode)
- [MCP vs CLI vs Skills：80% 的人选错了](/zh/blog/mcp-vs-cli-vs-skills-extend-claude-code)
- [长时间运行 Agent 不翻车的工程实践](/zh/blog/effective-harnesses-for-long-running-agents)
- [定时任务：别再盯着 CI/CD 傻等了](/zh/blog/scheduled-tasks)
- [Red Green Refactor：用 TDD 拴住 AI Agent](/zh/blog/red-green-refactor-claude-code)
- [Obsidian + Claude Code：AI 驱动的知识管理](/zh/blog/obsidian-claude-code-life)
- [Superpowers：用 Markdown 管住 AI 助手](/zh/blog/superpowers)

### 术语表

- [Claude Code](/zh/glossary/claude-code) — Anthropic 终端 AI 编程智能体
- [Anthropic](/zh/glossary/anthropic) — 开发 Claude 的 AI 安全公司
- [Claude](/zh/glossary/claude) — Anthropic 大语言模型系列
- [Model Context Protocol (MCP)](/zh/glossary/model-context-protocol) — AI 工具连接外部数据源的开放协议
- [多智能体系统](/zh/glossary/multi-agent-systems) — 多个 AI agent 协作完成任务的架构
- [Agentic Coding](/zh/glossary/agentic-coding) — AI 驱动的自主软件开发范式

### 对比

即将推出：Claude Code vs Cursor、Claude Code vs Codex、Claude Code vs GitHub Copilot。

### 常见问题

即将推出。

---

*想深入了解 Claude Code？[订阅 LoreAI](/subscribe)，每天 5 分钟掌握 AI 动态。*
