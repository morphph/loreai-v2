---
title: "什么是 OpenAI Codex？"
slug: what-is-codex
description: "OpenAI Codex 是云端软件工程 Agent，可在隔离沙箱中并行执行编码任务。"
category: tools
related_glossary: [codex, agentic]
related_blog: [codex-complete-guide]
lang: zh
---

# 什么是 OpenAI Codex？

**[OpenAI Codex](/glossary/codex)** 是一个云端软件工程 Agent，能同时处理多个编码任务。底层由 codex-1（基于 o3 优化的编程模型）驱动，每个任务在预装代码仓库的隔离沙箱中执行，完成后提交变更供人工审查和合并。

## 背景

Codex 于 2025 年 5 月作为 ChatGPT 侧边栏功能发布，面向 Pro、Business、Enterprise 和 Plus 用户。它代表了 OpenAI 在 [agentic](/glossary/agentic) 编程方向的核心产品——不再是编辑器内的自动补全，而是自主规划和执行完整开发工作流。

每个任务运行在安全隔离的容器中，默认禁用外网访问。Agent 可以读写文件、运行测试和 linter，通常在 1-30 分钟内完成。通过在仓库中添加 `AGENTS.md` 文件，你可以指定项目约定、测试命令和代码规范。

OpenAI 还提供开源的 **Codex CLI**，用于本地终端工作流。详见 [Codex 完整指南](/blog/codex-complete-guide)。

## 实用建议

1. 在 ChatGPT 侧边栏点击「Code」分配任务，或点击「Ask」查询代码库
2. 连接 GitHub 仓库，让 Codex 在沙箱中加载代码
3. 添加 `AGENTS.md` 定义项目级别的指令
4. 分配明确的小任务效果最佳——「给 auth 模块加单测」比「优化整个项目」好
5. 利用并行执行，同时跑多个任务提高效率

## 相关问题

- [Codex vs Claude Code](/compare/codex-vs-claude-code)
- [Codex vs Cursor](/compare/codex-vs-cursor)
- [Codex 怎么收费？](/faq/codex-pricing)

---

*觉得有用？[订阅 LoreAI](/subscribe)，每天 5 分钟掌握 AI 动态。*
