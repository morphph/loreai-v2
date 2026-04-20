---
title: "Claude Code Subagents 实战指南：用子智能体把编程效率拉满"
slug: claude-code-subagents-examples
description: "Claude Code Subagents 实战示例：从代码探索到并行重构，掌握子智能体的正确用法与最佳实践。"
lang: zh
category: tools
related_glossary: [agentic-coding, agent-sdk]
related_blog: [claude-code-agent-teams, claude-code-extension-stack-skills-hooks-agents-mcp, claude-code-seven-programmable-layers]
related_compare: []
related_topics: [claude-code]
---

# Claude Code Subagents 实战指南：用子智能体把编程效率拉满

Claude Code 的 **Subagents**（子智能体）是它区别于普通 AI 编码助手的核心能力之一。主智能体可以动态生成专门的子智能体来并行处理任务——代码搜索、测试执行、文件重构各自独立运行，互不阻塞。这不是简单的"多开窗口"，而是一个有调度、有隔离、有回传机制的多智能体协作系统。

理解 Subagents 的工作方式和使用场景，是从"会用 Claude Code"到"用好 Claude Code"的关键一步。

## 什么是 Claude Code Subagents

**Subagents 是 Claude Code 在运行时动态创建的专用子智能体**，每个子智能体有独立的上下文、工具权限和任务目标。主智能体（你在终端里对话的那个）充当调度器，把复杂任务拆分成子任务，分配给不同类型的子智能体执行，最后汇总结果。

这套机制的设计逻辑很直接：主智能体的上下文窗口是有限的。如果让它独自处理一个涉及 50 个文件的重构任务，上下文很快就会被大量文件内容挤满，导致后续推理质量下降。Subagents 解决的正是这个问题——把信息密集的搜索和探索工作卸载到子智能体，只把摘要结果返回主上下文。

根据 Claude Code 七层架构的设计，Subagents 属于"Agent 层"，是整个扩展栈中最具弹性的一层。

## 五种内置子智能体类型

Claude Code 目前提供五种专用子智能体，每种有明确的能力边界：

**1. Explore（探索型）**
专门用于代码库探索。拥有 Glob、Grep、Read 等搜索工具，但没有文件编辑权限。适合快速定位文件、搜索关键词、回答"这个函数在哪里被调用"之类的问题。三个彻底性级别可选：quick、medium、very thorough。

**2. General-purpose（通用型）**
拥有全部工具权限，包括文件编辑。适合需要独立完成多步骤任务的场景，比如"调查这个 bug 并修复它"。

**3. Plan（规划型）**
专门用于设计实现方案。拥有所有只读工具，但没有编辑权限。返回分步计划、关键文件列表和架构权衡分析。

**4. codex:codex-rescue（Codex 救援型）**
当 Claude Code 自身陷入困境时使用。通过共享运行时环境，让 Codex 提供第二意见或更深层的根因调查。

**5. statusline-setup（状态栏配置型）**
专门处理状态栏设置的轻量级子智能体。

## 实战示例：从简单到复杂

### 示例一：快速代码搜索

最常见的 Subagent 使用场景是代码库搜索。当你问 Claude Code "项目里所有 API 端点在哪里"，它会自动派出一个 Explore 类型的子智能体：

```
Agent(Explore): "Find all API route definitions in this Next.js project.
Search for files matching src/app/api/**/route.ts and server/**/*.ts.
Report the HTTP methods and paths for each endpoint."
```

子智能体独立搜索，把结果摘要返回主智能体。你的主上下文窗口只收到一段简洁的汇总，而不是几十个文件的完整内容。

### 示例二：并行独立调查

Subagents 真正发力的场景是并行执行。假设你要同时了解项目的测试覆盖率和数据库 schema：

```
// 两个独立任务，同时启动
Agent(Explore): "Audit test coverage: find all test files,
check which modules have tests and which don't."

Agent(Explore): "Map the database schema: find all migration files
and schema definitions, summarize tables and relationships."
```

两个子智能体同时工作，各自完成后把结果返回。这比串行执行快一倍，而且每个子智能体只关注自己的任务，搜索更精准。

### 示例三：Git Worktree 隔离重构

对于需要修改代码的高风险任务，可以用 `isolation: "worktree"` 让子智能体在独立的 Git 工作树中操作：

```
Agent(general-purpose, isolation: "worktree"):
"Refactor the auth middleware to use the new session token format.
Update all affected route handlers and their tests.
Run the test suite to verify nothing breaks."
```

子智能体在隔离的工作树中完成所有修改和测试。如果结果不满意，工作树自动清理；如果通过了，返回分支名称供你合并。这就像给 AI 一个安全的沙盒——搞砸了不影响你的工作分支。

### 示例四：多 Agent 协作重构

这是最复杂也最强大的模式。Claude Code Agent Teams 的核心就是这种用法——主智能体作为调度器，多个子智能体并行处理一个大任务的不同部分：

```
// 第一步：规划
Agent(Plan): "Design a plan to migrate from REST to tRPC
for the 12 API endpoints in src/app/api/."

// 第二步：并行执行（基于规划结果）
Agent(general-purpose, worktree): "Migrate /api/users endpoints to tRPC"
Agent(general-purpose, worktree): "Migrate /api/posts endpoints to tRPC"
Agent(general-purpose, worktree): "Update all client-side API calls to use tRPC"
```

每个子智能体在自己的工作树中独立工作，主智能体负责协调和合并。

## 最佳实践：写好 Subagent Prompt

Subagents 没有你和主智能体之间的对话历史。每次启动都是全新的——它不知道你之前讨论了什么，不知道你试过什么方案，不知道这个任务的背景。

**所以 Prompt 的质量直接决定 Subagent 的输出质量。**

几个关键原则：

**1. 提供完整上下文**
不要写"根据之前的讨论修复这个 bug"。要写"在 `src/lib/auth.ts` 的第 42 行，`validateToken()` 函数在 token 过期时返回 null 而不是抛出异常，导致下游的 `getUser()` 收到 null 后静默失败。修改 `validateToken()` 使其在 token 无效时抛出 `AuthError`。"

**2. 区分研究和执行**
明确告诉子智能体你要它做什么："只搜索和报告，不要修改任何文件"或者"找到问题后直接修复"。

**3. 用对子智能体类型**
搜索用 Explore，不需要 general-purpose 的全套工具权限。规划用 Plan，让它专注于方案设计而不是急于动手。关于 Claude Code 扩展栈中各层的能力边界，选对类型能显著提升效果。

**4. 独立任务才并行**
如果任务 B 依赖任务 A 的结果，就串行执行。只有真正独立的任务才适合并行。强行并行只会让子智能体在缺少信息的情况下做出错误判断。

## 什么时候不该用 Subagents

Subagents 不是万能的。以下场景直接用主智能体更合适：

- **简单的单文件编辑**：改一个函数签名，不需要派出子智能体
- **已经知道目标文件**：直接用 Read/Edit 工具，比启动子智能体快
- **需要连续对话的调试**：Subagent 是一次性的，无法和你来回讨论

经验法则：如果任务需要搜索超过 3 个文件，或者可以拆成两个独立的子任务，就考虑用 Subagent。否则，直接做。

## 从工具使用者到系统设计者

Subagents 的意义不仅是"让 AI 干活更快"。它改变了你和 AI 协作的模式——从线性的一问一答，变成了你作为架构师设计任务分解策略，AI 作为团队并行执行。正如 Claude Code 不是一个编程工具这篇文章所说，真正的价值在于把 Claude Code 当作一个可编程的工程系统来使用。

掌握 Subagents 的用法，配合 Skills 定义任务标准、Hooks 定义自动化触发器，你就拥有了一个完整的 AI 工程协作框架。

---

*觉得有用？[订阅 LoreAI](/subscribe)，每天 5 分钟掌握 AI 动态。*