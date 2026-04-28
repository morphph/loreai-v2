---
title: "如何下载和安装 Codex CLI？"
slug: codex-cli-download
description: "Codex CLI 通过 npm 一条命令安装，支持 macOS、Linux 和 Windows（WSL），需要 Node.js 18+ 和 OpenAI API Key。"
category: tools
related_glossary: [agentic-coding, agent-sdk]
related_blog: [first-few-days-with-codex-cli, codex-complete-guide, codex-vscode]
related_compare: [codex-cli-vs-claude-code]
related_topics: [codex]
lang: zh
---

# 如何下载和安装 Codex CLI？

**Codex CLI** 通过 npm 安装，一条命令搞定：`npm install -g @openai/codex`。前提是本机已安装 Node.js 18+，并准备好有效的 OpenAI API Key。

## 背景

Codex CLI 是 OpenAI 开源的终端编程 Agent，托管在 GitHub（`openai/codex`），通过 npm 公开分发。它在终端中运行，可以读取代码库、规划多步骤任务、跨文件编辑并提交变更——定位与 Claude Code 类似，但底层模型和计费体系不同。

安装本身免费，实际费用来自 OpenAI API 的 token 消耗，按使用量计费，没有固定月费。

想了解上手后的真实体验和常见坑点，可以参考初识 Codex CLI：前几天你需要知道的一切。更全面的功能介绍见 OpenAI Codex 完全指南。

## 安装步骤

1. 确认 Node.js 版本 ≥ 18：`node -v`
2. 全局安装 CLI：`npm install -g @openai/codex`
3. 配置 API Key：`export OPENAI_API_KEY=sk-...`
4. 验证安装成功：`codex --version`

**Windows 用户**：推荐通过 WSL（Windows Subsystem for Linux）运行，原生 Windows 支持目前有限。

**macOS / Linux 用户**：按上述步骤直接操作，无需额外配置。

如果你更习惯在编辑器里使用，也可以看看 Codex VS Code 扩展方案。

## 相关问题

- Codex CLI 安全吗？
- 如何在 VS Code 中使用 Codex？
- Codex CLI 怎么用？

---

*觉得有用？[订阅 LoreAI](/subscribe)，每天 5 分钟掌握 AI 动态。*