---
title: 如何安装 Claude Code?
slug: claude-code-install
description: >-
  Claude Code 支持多种安装方式：macOS/Linux 推荐原生脚本，Windows 可用 PowerShell，或通过
  Homebrew/WinGet 安装。
category: tools
related_glossary:
  - agentic-coding
related_blog:
  - how-to-build-a-production-ready-claude-code-skill
lang: zh
related_topics:
  - claude-code
---

# 如何安装 Claude Code?

根据操作系统选择对应的安装方式即可。macOS 和 Linux 用户推荐使用原生脚本安装，Windows 用户可通过 PowerShell、WinGet 或 Homebrew 安装，整个过程只需几分钟。

## 背景信息

[Claude Code](/zh/blog/9-principles-writing-claude-code-skills) 是 Anthropic 推出的 [代理编码工具](/glossary/agentic-coding)，直接在终端中运行。安装前需要准备：Claude 账户（Pro、Max、Teams 或 Enterprise 订阅，或 Claude Console 账户）、支持的操作系统（macOS 13.0+、Windows 10 1809+、Ubuntu 20.04+、Debian 10+ 等）和至少 4GB RAM。Windows 用户需提前安装 Git for Windows。安装完成后，在项目目录中运行 `claude` 命令启动，首次使用会提示登录。相比其他编码助手，Claude Code 的安装过程高效便捷，原生安装方式还支持自动后台更新，让你始终使用最新功能。

## 安装步骤

**macOS 和 Linux（推荐）**：打开终端，运行 `curl -fsSL https://claude.ai/install.sh | bash`，原生安装会自动后台更新至最新版本。

**Homebrew（macOS/Linux）**：运行 `brew install --cask claude-code`，之后需定期执行 `brew upgrade claude-code` 保持更新。

**Windows PowerShell（推荐）**：运行 `irm https://claude.ai/install.ps1 | iex`，确保已安装 Git for Windows。

**WinGet（Windows）**：运行 `winget install Anthropic.ClaudeCode`，同样需要定期升级。

安装完成后，在项目目录运行 `claude` 命令即可开始使用。

## 相关问题

- Claude Code 有哪些系统要求？
- 如何更新 Claude Code 到最新版本？

---

*觉得有用？[订阅 LoreAI](/subscribe)，每天 5 分钟掌握 AI 动态。*
