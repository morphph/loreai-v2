---
title: Opus 4.6 1M 正式成为 Claude Code 默认模型：百万上下文时代来了
date: 2026-03-18T00:00:00.000Z
slug: opus-4-6-1m-default-claude-code
description: >-
  Anthropic 将 Opus 4.6 1M 设为 Claude Code 默认模型，Max、Team 和 Enterprise 用户直接获得百万
  token 上下文窗口，对大型工程项目意味着什么？
keywords:
  - Opus 4.6
  - Claude Code
  - 1M context window
  - Anthropic
category: DEV
related_newsletter: 2026-03-18T00:00:00.000Z
related_glossary:
  - claude-code
  - context-window
related_compare:
  - claude-code-vs-cursor
lang: zh
video_ready: true
video_hook: Claude Code 默认模型换成 Opus 4.6 1M，百万上下文到底能干什么？
video_status: none
---

# Opus 4.6 1M 正式成为 Claude Code 默认模型：百万上下文时代来了

**Opus 4.6** 的 1M 上下文版本现在是 **[Claude Code](/zh/blog/9-principles-writing-claude-code-skills)** 在 Max、Team 和 Enterprise 计划上的默认模型。这意味着付费用户不需要任何配置，直接获得百万 token 的上下文窗口。对于日常在大型代码库里工作的开发者来说，这是一个实质性的能力跃升——不是新功能发布，而是把最强配置变成了默认体验。

## 发生了什么

Anthropic 工程师 Boris Cherny [在 Twitter 上宣布](https://x.com/bcherny/status/2032514807388123255)，Opus 4.6 1M 已经成为 Claude Code 的默认 Opus 模型，覆盖 Max、Team 和 Enterprise 三个付费计划。随后他确认该变更已[面向 100% 用户完成灰度](https://x.com/bcherny/status/2032238378389840018)。

这里的关键不是 Opus 4.6 本身——它已经发布一段时间了——而是 **1M 上下文窗口成为默认配置**。此前用户需要手动选择长上下文版本，现在直接开箱即用。

同期 Claude 生态还有几个值得注意的动态：Claude 聊天界面[新增了交互式图表功能](https://x.com/adocomplete/status/2032125588677542165)，Claude for Excel 和 PowerPoint [实现了跨文件协同](https://x.com/bcherny/status/2031829285028446651)，Claude Code 还上线了 `/btw` 侧边栏对话功能，让你在主任务运行时同时开启另一个对话。Anthropic 正在全线提升产品体验。

## 为什么重要

上下文窗口的大小直接决定了 AI 编码助手的天花板。200K token 大约对应一个中型项目的核心代码；1M token 则可以一次性装下大型 monorepo 中多个模块的完整实现，包括测试、配置和文档。

**从 200K 到 1M 的实际差距远不止 5 倍。** 很多时候 200K 刚好不够——你需要加载 3-4 个关联文件来理解一个跨模块的 bug，加上对话历史，上下文就爆了。1M 让这种场景从"需要精心管理上下文"变成"直接扔进去就行"。

对比竞品：[Cursor](/glossary/cursor) 目前默认上下文窗口远小于 1M，虽然通过 [RAG](/zh/glossary/rag) 和智能索引弥补，但在需要同时理解多个文件完整逻辑的场景下，原生长上下文仍然有不可替代的优势。[GitHub Copilot](/zh/glossary/github-[copilot](/zh/glossary/copilot)) 的上下文管理则更加保守。

把最强配置设为默认值而不是付费附加项，这个产品决策本身也值得注意——Anthropic 在用模型能力的普惠来建立 Claude Code 的竞争壁垒。

## 技术细节

**Opus 4.6** 是 Anthropic 当前最强的推理模型，model ID 为 `claude-opus-4-6`。1M 版本支持最大 100 万 token 的输入上下文，这在 Claude Code 的场景下意味着：

- **完整项目加载**：一个典型的 Next.js 全栈项目（50-80 个核心文件）可以一次性全部放入上下文
- **跨文件重构**：修改一个接口定义时，所有调用方的代码都在上下文里，减少遗漏
- **长对话保持**：复杂的调试会话不会因为上下文截断丢失之前的分析

需要注意的是，1M 上下文并不意味着每次调用都会用满。Claude Code 的上下文管理系统会自动压缩历史消息，实际使用中大部分时间消耗远低于上限。但关键是——当你真正需要的时候，容量在那里。

配合同期上线的 `/btw` 功能（侧边栏对话），工作流变得更加流畅：主线程让 Claude 处理一个耗时任务，你可以同时在侧边栏问另一个问题，两个对话共享项目上下文但独立运行。

从成本角度，1M 上下文的推理开销显然更高。Anthropic 把它设为默认值意味着他们判断推理成本已经降到可以大规模承受的水平，或者他们愿意用利润换市场份额。

## 你现在该做什么

1. **确认你的 Claude Code 已更新到最新版本。** 如果你在 Max、Team 或 Enterprise 计划上，Opus 4.6 1M 应该已经是默认模型，无需手动切换。
2. **重新审视你的 [CLAUDE.md](/zh/blog/claude-code-memory) 和 Skills 配置。** 更大的上下文窗口意味着你可以在 [SKILL.md](/glossary/skill-md) 中放入更详细的指令和更长的示例，而不用担心挤占工作上下文。
3. **尝试加载整个模块而不是单个文件。** 以前需要精心挑选哪些文件放入上下文，现在可以更大胆——把整个 `src/` 目录相关模块一起扔进去，让 Claude 自己找关联。
4. **试试 `/btw` 侧边栏功能。** 配合长上下文，多线程工作的体验会好很多。
5. **如果你还在用免费计划**，这是一个考虑升级的好时机。模型能力的差距正在拉大。

**相关阅读**：[今日简报](/newsletter/2026-03-18) 有更多 Claude 生态动态。另见：[Claude Code 完全指南](/blog/claude-code-guide)。

---

*觉得有用？[订阅 AI 简报](/subscribe)，每天 5 分钟掌握 AI 动态。*
