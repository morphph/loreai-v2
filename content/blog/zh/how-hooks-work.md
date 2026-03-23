---
title: "Hooks 是怎么工作的：从 React 到 Claude Code 的统一视角"
slug: how-hooks-work
description: "Hooks 是软件系统中的预定义扩展点，让开发者无需修改核心代码即可拦截和控制执行流程。"
lang: zh
category: tools
related_glossary: [what-are-claude-code-hooks, agentic-coding]
related_blog: [claude-code-hooks-mastery]
related_faq: [claude-code-hooks-reddit]
---

# Hooks 是怎么工作的：从 React 到 Claude Code 的统一视角

**Hooks** 这个词在不同技术栈里反复出现——React 有 hooks，PyTorch 有 hooks，Claude Code 也有 hooks。表面看是同一个词，底层逻辑却高度一致：**在系统执行流程的预定义节点插入自定义逻辑，而不需要改动核心代码本身**。

理解这个共同机制，能让你在切换技术栈时少走很多弯路。

## Hooks 的本质：执行流程的拦截点

所有 hooks 系统都解决同一个问题：系统内部有一套固定的运行逻辑，但开发者需要在某些节点注入自己的代码——无论是读取状态、修改数据，还是执行副作用。

直接改源码显然不可行。Hooks 提供了一种更干净的答案：系统在关键节点主动"回调"你注册的函数，你的逻辑在这里运行，然后系统继续。

这个模式在三个主流技术生态中有着截然不同的实现形态。

## React Hooks：函数组件的状态革命

React Hooks 于 2018 年提出，2019 年随 React 16.8 正式发布。在此之前，函数组件是"哑组件"——没有状态，没有生命周期。Class 组件垄断了复杂逻辑，但随着应用规模增长，class 的继承链和 `this` 绑定问题让代码越来越难维护。

`useState`、`useEffect`、`useContext` 这三个核心 hooks 改变了游戏规则。`useState` 让函数组件持有局部状态；`useEffect` 取代了 `componentDidMount` / `componentDidUpdate` 等生命周期方法，统一了副作用管理；`useContext` 让组件直接消费上下文，不再需要层层传递 props。

React Hooks 的规则严格：只能在函数组件顶层调用，不能在条件语句或循环内部调用。这不是任意限制——React 依赖 hooks 的调用顺序来维持状态关联，破坏顺序会导致状态错乱。

React 发布后，Vue、SolidJS 等框架迅速跟进了类似的 Composition API 设计，这说明 hooks 模式解决了前端开发中的普遍痛点。

## PyTorch Hooks：深入自动微分图

PyTorch 的 hooks 工作在完全不同的层面：`torch.autograd` 计算图。

在神经网络训练中，前向传播计算输出，反向传播计算梯度。PyTorch hooks 允许你在这两个阶段的特定张量或模块节点上注册回调，用于检测梯度消失、监控激活分布、或在反向传播中修改梯度值。

`register_forward_hook` 在模块前向传播后触发，可以拿到输入和输出张量。`register_backward_hook` 则在梯度计算后触发——但值得注意的是，这个 API 已被 PyTorch 标记为废弃，社区反馈它在某些场景下行为不符合预期，推荐迁移到 `register_full_backward_hook`。

这种 API 变化带来了真实的维护摩擦，是 PyTorch hooks 使用中最常见的坑之一。

## Claude Code Hooks：AI Agent 的确定性护栏

Claude Code 的 hooks 是 2026 年前后出现的新范式，解决的问题本质上是：**如何在概率性的 LLM 输出上叠加确定性的业务约束**。

[什么是 Claude Code Hooks](/glossary/what-are-claude-code-hooks)？简单说，它们是 AI agent 执行流程中的中间件——在工具调用前后、文件修改前后、命令执行前后触发你的 shell 脚本或程序。

这个设计的价值在于：LLM 的输出永远是概率性的，你无法保证它 100% 遵循安全规范或格式要求。但 hooks 是确定性代码，它可以在 agent 执行任何动作之前强制检查——阻断危险命令、记录审计日志、触发通知。

更多实战用法参见[Claude Code Hooks 实战指南](/blog/claude-code-hooks-mastery)，以及[社区对 hooks 的常见疑问](/faq/claude-code-hooks-reddit)。

这是 [agentic coding](/glossary/agentic-coding) 走向生产环境的关键一步：不是"信任 AI"，而是"信任 AI + 确定性护栏"。

## 三种 Hooks 的共同模式

| 生态 | 触发时机 | 主要用途 |
|------|----------|----------|
| React | 渲染/状态更新周期 | 状态管理、副作用 |
| PyTorch | 前向/反向传播节点 | 梯度调试、监控 |
| Claude Code | Agent 工具调用前后 | 安全审计、强制约束 |

三者的共同逻辑：**系统提供扩展点，开发者注册回调，核心逻辑保持干净**。区别只在于"执行流程"是 UI 渲染、数学计算，还是 AI agent 行为。

## 使用 Hooks 最常见的错误

- **在 React 中违反调用顺序规则**：把 `useState` 放进 `if` 语句，导致状态关联错乱
- **在 PyTorch 中使用废弃 API**：`register_backward_hook` 已废弃，梯度修改应迁移到 `register_full_backward_hook`  
- **在 Claude Code 中 hook 脚本阻塞过长**：hooks 同步执行，耗时过长会卡住整个 agent 流程
- **忘记清理 hook 注册**：PyTorch 中未 remove 的 hook 会持续占用内存，React 中 `useEffect` 未返回清理函数会导致内存泄漏

理解这些跨生态的共性模式，是写出更可靠、更可维护代码的基础。

---

*觉得有用？[订阅 LoreAI](/subscribe)，每天 5 分钟掌握 AI 动态。*