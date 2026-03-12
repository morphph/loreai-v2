---
title: "Claude Code /btw 命令：AI 编码时也能「插嘴」了"
date: 2026-03-12
slug: claude-code-btw-side-chain-conversations
description: "Claude Code 新增 /btw 命令，支持在 AI 执行任务时发起侧链对话，不打断主流程。这对多任务开发工作流意味着什么？"
keywords: ["Claude Code /btw", "side chain conversation", "Claude Code 新功能", "AI 编码工具"]
category: DEV
related_newsletter: 2026-03-12
related_glossary: [claude-code]
related_compare: [claude-code-vs-cursor]
lang: zh
video_ready: true
video_hook: "Claude Code 终于解决了 AI 干活时你只能干等的问题"
video_status: none
---

# Claude Code /btw 命令：AI 编码时也能「插嘴」了

**Claude Code** 新增了 `/btw` 命令，解决一个真实痛点：当 Claude 正在执行复杂任务时，你想问个不相关的问题，以前只能等它做完或者打断它。现在可以发起一条「侧链对话」，主任务继续跑，你的问题同步得到回答。这个看似简单的功能，实际上改变了人和 AI 编码助手的协作模式。

## 发生了什么

Anthropic 工程师 [trq212 在推特上宣布](https://x.com/trq212/status/2031506296697131352)，Claude Code 正式加入 `/btw` 命令，支持 side chain conversations（侧链对话）。

使用方式很直接：当 Claude 正在执行任务（比如重构一个模块、跑测试、生成代码）时，你输入 `/btw` 加上你的问题，Claude 会在不中断当前任务的情况下回答你。主任务的上下文不受影响，侧链对话独立运行。

这是 Claude Code 近期密集更新的一部分。过去一周，团队还发布了 HTTP hooks（比现有的 command hooks 更安全易用）、语音模式编码、`/simplify` 和 `/batch` 两个新 Skill，以及 Claude Code Remote 对 Pro 用户的开放。产品迭代节奏非常快——根据 SemiAnalysis 的数据，GitHub 上 4% 的公开 commit 已经由 Claude Code 生成。

## 为什么重要

用过任何 AI 编码工具的人都遇到过这个场景：Claude 正在帮你重构一个 500 行的文件，跑到一半你突然想问「这个项目的 CI 配置在哪？」或者「帮我查一下这个 API 的参数格式」。

以前你有两个选择：等它做完（浪费时间），或者打断它（丢失进度和上下文）。两个都不理想。

`/btw` 本质上实现了**异步多任务对话**。这和操作系统从单任务进化到多任务是同一个逻辑——当 AI 助手足够强大、单次任务足够长时，阻塞式交互就成了瓶颈。

对比 [Cursor](/glossary/cursor) 和 GitHub Copilot，目前都没有类似的侧链对话能力。Cursor 的 Composer 模式虽然支持多文件编辑，但交互仍然是单线程的。Claude Code 在这个方向上走在了前面。

从更大的视角看，这反映了 AI 编码工具正在从「问答式」向「协作式」演进。你不再是在和一个聊天机器人对话，而是和一个正在干活的同事协作——你可以随时拍拍他肩膀问个问题，他不需要放下手里的活。

## 技术细节

侧链对话的核心挑战是**上下文隔离**。主任务和侧链需要共享项目上下文（文件系统、代码库状态），但对话状态必须独立，否则侧链的问答会污染主任务的推理链。

从 Claude Code 的架构来看，这和最近发布的 Agent 子进程机制有关。Claude Code 已经支持通过 Agent 工具启动独立的子代理来处理并行任务，`/btw` 很可能复用了这套基础设施——在同一个项目上下文中启动一个轻量级的侧链代理，独立处理用户的临时问题。

实际使用场景举几个例子：

- Claude 在跑测试套件时，你用 `/btw` 问一个不相关的 API 用法
- Claude 在重构大文件时，你用 `/btw` 让它帮你查另一个文件的某个函数签名
- Claude 在生成代码时，你用 `/btw` 讨论架构决策，不影响当前生成

需要注意的是，侧链对话大概率是轻量级的——适合快速问答，不适合再启动一个复杂的多步骤任务。如果你需要真正的并行任务执行，应该用 `/batch` 或者手动启动 Agent 子进程。

## 你现在该做什么

1. **更新 Claude Code 到最新版本**，确保 `/btw` 命令可用。
2. **养成使用习惯**：下次 Claude 在执行长任务时，不要干等，试试 `/btw` 问你想问的问题。
3. **区分场景**：快速问答用 `/btw`，并行任务用 `/batch`，独立子任务用 Agent。三者互补，不是替代关系。
4. **结合 HTTP hooks 和 Skills 一起用**：`/btw` + `/simplify` + HTTP hooks 组合起来，可以构建相当高效的开发工作流。

**相关阅读**：[今日简报](/newsletter/2026-03-12) 有更多 Claude Code 动态。另见：[Claude Code 完全指南](/glossary/claude-code)。

---

*觉得有用？[订阅 AI 简报](/subscribe)，每天 5 分钟掌握 AI 动态。*