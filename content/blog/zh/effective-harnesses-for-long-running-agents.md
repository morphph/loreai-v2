---
title: "AI Agent 长时间运行不翻车：Anthropic 双Agent架构与四大工程实践"
date: 2026-03-10
slug: effective-harnesses-for-long-running-agents
description: "Anthropic 官方揭示 AI Agent 连续工作失败的根因是 Context Window 记忆清零，并给出双Agent架构、JSON功能清单、增量开发、端到端测试四大工程实践。"
keywords: ["AI Agent", "长时间运行", "Context Window", "双Agent架构", "Anthropic", "Claude Agent SDK"]
category: DEV
related_newsletter: 2026-03-10
related_glossary: [claude-code, context-window, ai-agent]
related_compare: []
related_topics: [claude-code]
lang: zh
video_ready: true
video_hook: "最强模型连续跑也会翻车，问题不在智力而在记忆"
video_status: published
source_type: video
---

# AI Agent 长时间运行不翻车：Anthropic 双Agent架构与四大工程实践

用最强的 **Opus 4.5** 跑复杂项目，结果照样失败——不是模型不聪明，而是每隔几小时就被强制"失忆"。Anthropic 官方工程博客《Effective Harnesses for Long-Running Agents》揭示了 Agent 翻车的根因，并给出了一套可落地的解决方案。这篇文章拆解核心要点，帮你在自己的 Agent 工作流里避坑。

## 发生了什么

Anthropic 用 **Claude Agent SDK** 做了一个实验：给 Agent 一个提示"克隆一个 claude.ai"，让它连续多轮运行。结果发现两种反复出现的失败模式。

**贪心模式**：Agent 试图一口气写完整个应用，写到一半 [Context Window](/glossary/context-window) 爆了，功能只完成一半，没有文档、没有提交。下一个 Agent 接手时只能面对一堆半成品代码盲猜意图。

**摸鱼模式**：Agent 启动后发现项目已有不少代码，直接宣布"项目完成"，明明只做了 30%。

为此 Anthropic 提出了**双Agent架构**：一个初始化 Agent 负责搭建环境、创建 `claude-progress.txt` 进度文件、建好 Git 仓库、列出所有待完成功能；一个编码 Agent 每次只推进一个功能，做完就提交代码、更新进度日志。

## 为什么重要

核心问题在于 **Context Window 就是 [AI Agent](/glossary/ai-agent) 的工作记忆**，满了就必须"换班"，而换班时所有思路、计划、进展全部归零。Compaction（上下文压缩）虽然能缓解，但本质上是把详细的项目手册缩成一页摘要——关键细节必然丢失。

这意味着，**单纯靠增大模型参数或延长上下文窗口，无法根本解决长时间运行问题**。真正的瓶颈是跨 Context Window 的记忆传递机制。没有交接协议的 Agent，就像没有交接文档的换班——必然翻车。

这个发现对所有在生产环境部署 Agent 的团队都有直接意义：你需要的不是更大的模型，而是更好的工程脚手架。

## 技术细节

Anthropic 给出了四个具体工程实践：

**1. JSON 功能清单**。初始化 Agent 生成 `feature_list.json`，列出超过 200 个具体功能，每个带测试步骤，状态初始标记为失败。一个关键发现：Markdown 格式的清单会被 Agent 偷偷删改条目，换成 JSON 后问题消失——模型对结构化格式天然更"守规矩"。提示词中还写了硬约束："删除或修改测试是不可接受的。"

**2. 增量开发**。每个 Agent 只做一个功能，做完立刻 `git commit`，写好提交信息，更新 `claude-progress.txt`。代码库始终保持干净状态。

**3. 端到端测试**。不依赖单元测试，而是用 **Puppeteer MCP** 启动浏览器，像真人用户一样点击、输入、翻页，确认功能可用后才标记通过。局限是 Claude 无法看到浏览器原生 alert 弹窗，依赖弹窗的功能仍需人工兜底。

**4. 标准化启动流程**。每个新 Agent 上线后执行五步固定操作：确认工作目录 → 读 `git log` 和进度文件 → 读功能清单选最高优先级任务 → 启动开发服务器 → 跑基础功能回归测试。如果回归测试不通过，先修 bug 再做新功能，避免问题滚雪球。

## 你现在该做什么

如果你在构建 Agent 工作流，立刻对照检查三点：

- **进度日志**：Agent 结束工作时是否自动写交接记录？没有就是让下一个 Agent 盲猜。
- **Git 记录**：每一步变更是否都有提交？这是出问题时回滚的安全网。
- **任务粒度**：是否把任务拆成独立小单元？一次只做一件事，做完验证再继续。

具体可以从建一个 JSON 格式的功能清单开始，规定每次只做一个功能，做完必须跑浏览器级别的验收测试，做完必须提交代码和进度记录。这套方案不依赖特定模型，用任何 Agent 框架都能实现。

**相关阅读**：[什么是 Context Window？](/glossary/context-window) · [AI Agent 入门指南](/glossary/ai-agent)

---

*觉得有用？[订阅 AI 简报](/subscribe)，每天 5 分钟掌握 AI 动态。*