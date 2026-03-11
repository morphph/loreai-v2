---
title: "Claude Code Agent Teams：你的 AI 编程助手，学会了自己招团队"
date: 2026-03-11
slug: claude-code-agent-teams
description: "Claude Code 的 Agent Teams 让 AI 编程助手能并行派遣多个子智能体，各自在独立 git worktree 中工作。多智能体协作如何重塑开发流程？"
keywords: ["Claude Code 多智能体", "AI 编程助手", "智能体团队协作", "代码智能体"]
category: DEV
related_newsletter: 2026-03-11
related_glossary: [claude-code, agentic-coding]
related_compare: [claude-code-vs-cursor]
lang: zh
video_ready: true
video_hook: "一个 AI 自己拉了五个 AI 同事，还用 git worktree 防止互相踩脚"
video_status: none
---

# Claude Code Agent Teams：你的 AI 编程助手，学会了自己招团队

**Claude Code** 现在可以自己组建 AI 团队了——一个主智能体（Agent）同时派遣多个子智能体，每个子智能体在独立的 git worktree 里并行工作，互不干扰。这不是"多开几个终端窗口"那种伪并行，而是有分工、有协调、有隔离的多智能体协作系统。如果你还在一个对话窗口里让 AI 一个文件一个文件地改，是时候了解一下新的工作方式了。

## 发生了什么

Anthropic 在 2025 年 2 月推出 **Claude Code** CLI 工具时，就把多智能体编排（Multi-Agent Orchestration）作为区别于 [Cursor](/glossary/cursor)、GitHub Copilot、Windsurf 的核心差异点。其中最关键的能力就是 **Agent Teams**：父智能体通过 Agent 工具派遣子智能体，子智能体可以同时运行 5 个以上，每个在独立的 [git worktree](/glossary/git-worktree) 中工作。

子智能体分为三种类型，权限各不相同：

- **Explore 智能体**：只读权限，能用 Glob、Grep、Read 工具快速搜索代码库，适合做调研和定位
- **Plan 智能体**：能读取和分析代码但不能编辑，专门做架构设计和方案规划
- **通用智能体**（General-purpose）：拥有全部工具权限，包括 Bash、Edit、Write，甚至能再派遣自己的子智能体

每个子智能体拥有独立的上下文窗口，可以指定不同的模型——让 **Haiku** 跑简单查询，**Opus** 处理复杂推理，实现成本最优分配。这套系统的设计参考了 Anthropic 工程博客发布的[最佳实践文档](https://www.anthropic.com/engineering/claude-code-best-practices)。

## 为什么重要

AI 编程助手一直有个根本瓶颈：**单线程**。一个 AI、一个对话、一次改一个文件。Copilot 和 Cursor 把自动补全和内联对话做得很好，但一旦涉及跨多个文件的复杂任务——比如重构一个组件的接口，需要同时改定义、调用方、测试和文档——你还是得手动拆任务、切上下文、一步步指挥。

Agent Teams 改变了开发者和 AI 的协作模式。你的角色从"和 AI 一起写代码"变成了"管理一个 AI 团队"——拆任务、分派、审查结果。这更像是一个技术主管带团队，而不是一个程序员用工具。

实际效果是什么？一个涉及 10+ 个文件的重构任务，原来需要 30 分钟的顺序对话，现在分给几个子智能体并行执行，10 分钟内完成。一个 Explore 智能体在扫描代码库的同时，Plan 智能体已经在设计方案，通用智能体已经开始改那些显而易见的部分——全部同时进行。

从竞品角度看，Cursor 的 [Agent 模式](/glossary/cursor-agent) 和 Copilot Workspace 都在往智能体方向走，但目前没有哪家做到了"类型化子智能体 + git worktree 隔离 + 模型混合调度"这个组合。

## 技术细节

核心机制是 **git worktree 隔离**。当父智能体通过 Agent 工具（设置 `isolation: "worktree"`）派遣子智能体时，系统会创建一个临时的 git worktree——仓库的完整拷贝，在一个独立分支上运行。子智能体在这个隔离环境中工作，完成后返回分支名和变更内容，供父智能体或开发者审查合并。如果子智能体没有做任何改动，worktree 自动清理。

一次 Agent 调用的典型参数：

```typescript
// 父智能体在一条消息中同时派遣多个子智能体
Agent({
  subagent_type: "Explore",     // 类型：只读搜索
  model: "haiku",               // 用便宜模型跑搜索
  prompt: "找到所有使用 deprecated API 的文件"
})

Agent({
  subagent_type: "general-purpose",
  model: "opus",                // 复杂任务用强模型
  isolation: "worktree",        // 独立 worktree
  prompt: "重构 UserService 的错误处理逻辑"
})
```

成本方面需要注意：每个子智能体消耗独立的上下文窗口和输出 Token。但通过模型混合策略可以优化——3 个 Haiku 搜索智能体 + 1 个 Opus 实现智能体的总成本，可能比全程用 Opus 顺序执行还低，而且更快。Haiku 的价格大约是 Opus 的 1/60，这个差距让合理的任务分配变得很有经济意义。

**限制和风险**也很明确：子智能体之间完全隔离，看不到彼此的工作进度，可能产生重复劳动或方案不一致。如果两个智能体编辑了同一个文件，合并时仍然需要手动解决冲突。智能体还能递归派遣子智能体（Agent 套 Agent），如果不设边界，有失控的风险。父智能体需要提前规划好任务的依赖关系，这实际上要求开发者像项目经理一样思考。

## 你现在该做什么

1. **先在一个小任务上试试**。用 Claude Code 的 Agent 工具派遣一个 Explore 子智能体做代码搜索，感受基本的交互模式。
2. **把大重构任务拆成独立子任务**。关键原则：每个子智能体的工作范围不重叠，尤其避免两个智能体改同一个文件。
3. **善用模型混合**。搜索和定位用 Haiku，规划用 Sonnet，实现用 Opus。别让 Opus 干查文件名这种活。
4. **关注 [Anthropic 的 Claude Code 文档](https://docs.anthropic.com/en/docs/claude-code/overview)**，Agent Teams 的能力还在快速迭代中。
5. **审查习惯需要升级**。并行输出意味着你需要同时审查多个分支的改动，考虑建立更结构化的 Code Review 流程。

**相关阅读**：[今日简报](/newsletter/2026-03-11) 有更多 AI 开发工具动态。另见：[Claude Code 完全指南](/blog/claude-code-overview)。

---

*觉得有用？[订阅 AI 简报](/subscribe)，每天 5 分钟掌握 AI 动态。*
