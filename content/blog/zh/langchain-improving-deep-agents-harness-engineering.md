---
title: "LangChain Harness Engineering 实战：同一模型，排名从第30跳到第5"
date: 2026-03-20
slug: langchain-improving-deep-agents-harness-engineering
description: "LangChain 用 Harness Engineering 方法，不换模型把 coding agent 在 Terminal Bench 2.0 的分数从 52.8% 提升到 66.5%。三个中间件加一套推理三明治策略，拆解具体做法。"
keywords: ["harness engineering", "coding agent", "LangChain", "推理预算分配", "agent中间件"]
category: DEV
related_newsletter: 2026-03-20
related_glossary: [agent, prompt-engineering]
related_compare: []
lang: zh
video_ready: true
video_hook: "模型一行代码没换，排名从第30跳到第5"
video_status: published
source_type: video
---

# LangChain Harness Engineering 实战：同一模型，排名从第30跳到第5

模型一行代码没换，**LangChain** 的 coding agent 在 **Terminal Bench 2.0** 排行榜上从第30名冲到第5名，分数从 52.8% 涨到 66.5%，提升 13.7 个百分点。用的是同一个 **GPT-5.2-Codex**。秘密在模型外面那一圈系统——他们把这套方法叫 **Harness Engineering**。这篇文章拆解他们做了什么、为什么有效、你现在就能抄的具体做法。

## 发生了什么

LangChain 在工程博客中公开了他们优化 coding agent 的完整过程。核心思路借用了赛车改装的隐喻：引擎（模型）不换，改空气动力学套件、调悬挂、换轮胎，圈速照样快一大截。

他们把优化空间压缩到三个旋钮：**System Prompt**、**Tools** 和 **Middleware**。但怎么知道该调哪个？靠 Trace 分析——把 [Agent](/glossary/agent) 每次运行的输入输出全部记录下来，批量分析失败案例。

分析结果指向一个最普遍的失败模式：Agent 写完代码，自己看一遍觉得没问题就交卷，根本不跑测试。

针对这个发现，他们设计了三个中间件：

- **PreCompletionChecklistMiddleware**：在 Agent 准备退出时拦截它，强制对照任务要求做一轮验证。效果最显著——模型本身就是优秀的自我改进机器，不是不会修 bug，是没人提醒它去检查。
- **LocalContextMiddleware**：Agent 启动时自动注入目录结构、可用工具信息和时间预算。本质上是给 Agent 做"入职培训"，避免浪费大量 Token 探索环境。
- **LoopDetectionMiddleware**：跟踪每个文件被编辑的次数，同一文件被改十几遍就提醒 Agent 换思路，防止死循环。

## 为什么重要

这组实验揭示了一个反直觉的事实：**全力推理的 Agent，反而拿了最低分。**

GPT-5.2-Codex 有四种推理模式：low、medium、high、xhigh。全程 xhigh 只拿到 53.9%，而 high 模式拿到 63.6%，差了近十个百分点。原因很直接——每一步都深度思考，直接超时了。推理越深，留给写代码和验证的时间越少。

这意味着提升 Agent 性能最大的杠杆，不在模型本身的推理能力，而在于**把算力花在对的节点**。对于整个行业来说，这个结论的含义很明确：在模型能力趋于饱和的阶段，[Prompt Engineering](/glossary/prompt-engineering) 和系统工程的投入产出比远高于单纯堆算力。

## 技术细节

LangChain 找到的最优策略叫**"推理三明治"**，把时间预算切成三段：

| 阶段 | 时间占比 | 推理模式 | 目标 |
|------|---------|---------|------|
| 规划 | 前 25% | xhigh | 搞清楚任务到底要什么 |
| 执行 | 中间 50% | high | 快速写代码、跑测试 |
| 验证 | 最后 25% | xhigh | 最终检查和修复 |

这套策略拿到了 66.5% 的最高分。

除了推理三明治，他们还总结了五条 harness 设计的通用原则：

1. **帮 Agent 做上下文工程**——提前注入目录结构、可用工具、编码规范，减少在陌生环境里瞎摸索。
2. **逼 Agent 自我验证**——模型天生相信自己的第一个方案，必须强制它跑测试、对照原始需求检查。
3. **用 Trace 做反馈信号**——每次运行的 Trace 存进 LangSmith，用分析 Agent 批量诊断失败原因，看数据说话而非凭感觉调参。
4. **短期打补丁，别追求完美**——循环检测、超时提醒这类 guardrail 现在有用，模型进化后可以拆掉。
5. **每个模型需要不同的 harness**——LangChain 用早期为 Codex 优化的 harness 跑 Claude Opus 4.6，只拿到 59.6%。不是模型不行，是 harness 不匹配。

## 你现在该做什么

三件事可以立刻动手：

1. **加退出前检查中间件**：在你的 Agent 提交结果之前，强制它跑一轮测试验证。这是投入最小、回报最大的一招。
2. **按三明治分配推理预算**：开头高推理做规划，中间低推理快速执行，结尾高推理做验证。避免全程拉满导致超时。
3. **存好每次运行的 Trace**：定期复盘失败案例，针对你用的模型持续迭代 harness。不同模型需要不同的调优策略，没有银弹。

**相关阅读**：[Agent 是什么？](/glossary/agent) · [Prompt Engineering 入门](/glossary/prompt-engineering)

---

*觉得有用？[订阅 AI 简报](/subscribe)，每天 5 分钟掌握 AI 动态。*