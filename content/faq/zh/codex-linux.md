---
title: "OpenAI Codex 能在 Linux 上运行吗？"
slug: codex-linux
description: "OpenAI Codex CLI 原生支持 Linux，是云端编程 Agent 的核心运行环境之一。"
category: tools
related_glossary:
  - agentic-coding
  - agent-sdk
related_blog:
  - codex-complete-guide
  - first-few-days-with-codex-cli
  - codex-vscode
related_compare: []
related_topics:
  - codex-openai
lang: zh
---

# OpenAI Codex 能在 Linux 上运行吗？

**OpenAI Codex CLI 原生支持 Linux**，可以直接在终端中安装和使用，无需额外配置。Linux 也是 Codex 云端沙箱任务的底层执行环境。

## 背景与使用方式

Codex 分为两个产品形态：**Codex CLI**（本地命令行工具）和 **云端 Codex Agent**（在 OpenAI 托管的沙箱中运行任务）。两者都与 Linux 深度兼容。

Codex CLI 通过 `npm install -g @openai/codex` 安装，支持 macOS 和 Linux，目前不支持 Windows 原生环境（Windows 用户需通过 WSL 使用）。安装后，你可以在任意 Linux 终端中调用它，读取本地代码库、执行 shell 命令、提交变更。

云端 Codex Agent 的任务在 OpenAI 托管的 Linux 沙箱中运行——这意味着它能执行真实的系统命令、运行测试、操作文件系统，而不仅仅是生成代码文本。这种架构让 Codex 真正成为一个自主编程 Agent，而不是一个补全工具。

如果你使用 VS Code，也可以通过 Codex VS Code 扩展 在 Linux IDE 环境中使用相同能力。想了解 Codex 的完整架构，参考这篇深度解析。

关于初次上手的注意事项，《初识 Codex CLI》 整理了实际使用前几天最常遇到的问题。

## 实际操作步骤

1. 确认 Node.js 版本 ≥ 18（`node -v`）
2. 运行 `npm install -g @openai/codex` 安装 CLI
3. 设置环境变量 `OPENAI_API_KEY`
4. 在项目目录执行 `codex` 启动交互式 Agent

## 相关问题

- OpenAI Codex 是什么？
- OpenAI Codex 怎么收费？

---

*觉得有用？[订阅 LoreAI](/subscribe)，每天 5 分钟掌握 AI 动态。*