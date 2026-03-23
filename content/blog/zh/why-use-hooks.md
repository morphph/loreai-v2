---
title: "为什么要用 Claude Code Hooks？"
slug: why-use-hooks
description: "Claude Code Hooks 让你在 AI 执行操作时自动触发自定义脚本，实现质量把关、日志记录和流程自动化。"
lang: zh
category: tools
---

# 为什么要用 Claude Code Hooks？

大多数开发者用 Claude Code 一段时间后，都会遇到同一个问题：AI 帮你改了代码，但你不确定它有没有跑 lint、有没有格式化、有没有触发某个必须执行的检查。每次都要手动提醒它，或者事后补救——这正是 **Claude Code Hooks** 要解决的问题。

## Hooks 是什么

[Claude Code Hooks](/glossary/what-are-claude-code-hooks) 是一套配置在 Claude Code 设置里的 shell 命令，在特定事件发生时自动执行。比如每次 Claude 调用工具前后、提交代码前、或者会话结束时，你可以让它自动运行格式化、测试、或者通知脚本。

它不是插件，不是扩展，就是普通的 shell 命令——只是绑定在 Claude Code 的行为事件上。

## 为什么不用 Hooks 会让你痛苦

不用 Hooks 的团队通常面临三个重复出现的问题：

**一致性问题**：Claude Code 有时会忘记你在系统提示里说的"每次改完都要跑 `npm run lint`"。每隔几轮对话就需要重新提醒，摩擦感很强。

**可见性问题**：AI 在后台做了什么，你只能通过输出猜测。没有结构化的日志，审计和调试都很难。

**流程断层**：AI 改完代码，但你的 CI/CD 前置检查没有自动触发，等到 push 后才发现问题，又要回头修。

## Hooks 真正的价值在哪里

用过 [Claude Code Hooks 进阶用法](/blog/claude-code-hooks-mastery) 的开发者普遍反馈，Hooks 的核心价值不是"自动化"——而是**把质量保证嵌进 AI 的行为循环里**。

举几个实际场景：

- **格式化守门**：每次 Claude 编辑文件后，自动跑 `prettier` 或 `gofmt`，杜绝风格问题进入代码库
- **测试触发**：在 Claude 提交代码前，强制跑单元测试，失败则阻断
- **操作审计**：把每次工具调用记录到日志文件，方便复盘 AI 做了什么决策
- **通知集成**：任务完成时发 Slack 消息，适合长时间运行的后台任务

这些事情你当然可以手动做，但一旦绑定在 Hooks 里，它就变成了不依赖记忆的系统——AI 再也"忘不了"。

## 什么时候不需要 Hooks

Hooks 不是万能的。几个不适合用 Hooks 的场景：

- **一次性任务**：如果你只是临时问 Claude 一个问题，不涉及文件操作，没必要配置 Hooks
- **过度复杂的逻辑**：Hooks 是 shell 命令，不是脚本平台。复杂的业务逻辑应该放在独立脚本里，Hooks 只负责调用入口
- **调试阶段**：Hooks 会在每次操作时触发，调试时可能干扰信号，建议临时禁用

社区里也有讨论 [Hooks 的常见误区](/faq/claude-code-hooks-reddit)，最常见的一个错误是把太多逻辑堆进单个 Hook 脚本，导致 Claude Code 响应变慢。保持 Hooks 轻量，把重活交给它调用的脚本。

## 从哪里开始

最简单的入门方式：先加一个格式化 Hook。每次 Claude 编辑 TypeScript 文件后，自动跑 `npx prettier --write`。配置两行，立刻感受到差异。

然后观察你的工作流里，哪些步骤是"Claude 做完后我需要手动做的"——那些就是 Hooks 的目标。

用 [Agentic Coding](/glossary/agentic-coding) 的方式思考：不是教 AI 记住规则，而是把规则编码进系统，让它没法绕过。

---

*觉得有用？[订阅 LoreAI](/subscribe)，每天 5 分钟掌握 AI 动态。*