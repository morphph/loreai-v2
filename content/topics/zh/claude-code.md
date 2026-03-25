---
title: "Claude Code — 你需要知道的一切"
slug: claude-code
description: "Claude Code 完整指南：Anthropic 的 AI 编程 Agent，直接在终端运行，支持多文件编辑、命令执行与 Git 工作流。"
pillar_topic: Claude Code
category: tools
related_glossary: [agentic-coding, chatgpt]
related_blog: [integrate-claude-code-into-your-development-workflow]
related_compare: [claude-code-remote-vs-ssh]
related_faq: [claude-code-install, how-do-i-set-up-claude-code-remote-control-on-my-phone, can-i-approve-or-reject-code-changes-from-my-mobile-device-w]
lang: zh
---

# Claude Code — 你需要知道的一切

**Claude Code** 是 Anthropic 推出的 [Agentic 编程工具](/glossary/agentic-coding)，运行在你的终端里。它不是那种给你补全下一行代码的 Copilot——而是一个能读懂整个代码库、跨文件编辑、执行 shell 命令、自动完成 Git 工作流的自主 Agent。你用自然语言描述任务，它来规划并执行。除终端 CLI 外，Claude Code 还支持 VS Code、JetBrains、Web、桌面应用、Slack，以及通过 GitHub Actions / GitLab 接入 CI/CD 流程。

## 最新动态

Claude Code 自 2025 年 2 月发布以来持续快速迭代，GitHub 仓库已累计超过 **82,000 stars**，发布了 66 个版本，最新版本为 v2.1.81（2026 年 3 月）。

近期重要更新包括：原生支持 Windows（通过 PowerShell 或 WinGet 安装，不再强依赖 WSL）；VS Code 扩展新增内联 diff、@-mentions、Plan Review 和对话历史；MCP 服务器集成进一步扩展了外部工具的接入能力。

想跟踪 Claude Code 的最新功能，可以参考我们的[开发者工作流集成指南](/blog/integrate-claude-code-into-your-development-workflow)。

## 核心功能与能力

Claude Code 的核心优势在于它把 AI 能力嵌入到真实的开发环境里，而不是一个独立的聊天窗口：

- **全项目上下文理解**：读取整个代码库结构，理解文件间的依赖关系，而不仅仅是当前打开的文件
- **多文件编辑**：一次任务可以跨多个文件规划并执行变更，适合重构、测试生成等场景
- **完整 shell 访问**：运行构建工具、测试框架、Linter、部署脚本，用户确认后执行
- **Git 工作流集成**：自动 stage、commit、创建 PR，遵循你的仓库提交规范
- **MCP 服务器扩展**：通过 Model Context Protocol 连接外部工具——数据库、API、浏览器自动化等
- **多平台支持**：终端、VS Code、JetBrains、Web、桌面 App、Slack、GitHub Actions 均可使用

**安装方式**（推荐 Native Install，支持自动后台更新）：

```bash
# macOS / Linux
curl -fsSL https://claude.ai/install.sh | bash

# Windows PowerShell
irm https://claude.ai/install.ps1 | iex
```

进入项目目录后直接运行 `claude` 即可开始。

## 常见问题

- **[如何安装 Claude Code？](/faq/claude-code-install)**：支持 Native Install、Homebrew、WinGet 多种方式，首次运行时登录账号即可
- **如何在手机上远程控制 Claude Code？**：可通过远程配置在移动端管理任务
- **[能从移动设备审批或拒绝代码变更吗？](/faq/can-i-approve-or-reject-code-changes-from-my-mobile-device-w)**：支持远程审批工作流

## Claude Code 的横向对比

- **[Claude Code Remote vs SSH](/compare/claude-code-remote-vs-ssh)**：本地直连与远程 SSH 工作流的差异，适合不同的团队协作场景

## 计费与访问

Claude Code 需要 Claude 订阅（Pro、Max、Teams 或 Enterprise）或 Anthropic Console 账号。终端 CLI 和 VS Code 扩展也支持第三方云供应商接入。

Pro 计划起步价为 $17/月（年付），Max 计划提供 5–20x 更高的使用额度，适合重度用户。

## Claude Code 全部资源

### 博客文章
- [将 Claude Code 集成进你的开发工作流](/blog/integrate-claude-code-into-your-development-workflow)

### 术语表
- [Agentic Coding](/glossary/agentic-coding) — 让 AI Agent 自主规划并执行多步骤编程任务的范式

### 常见问题
- [如何安装 Claude Code](/faq/claude-code-install)
- 如何在手机上设置 Claude Code 远程控制
- [能从移动设备审批或拒绝代码变更吗](/faq/can-i-approve-or-reject-code-changes-from-my-mobile-device-w)

---

*觉得有用？[订阅 LoreAI](/subscribe)，每天 5 分钟掌握 AI 动态。*