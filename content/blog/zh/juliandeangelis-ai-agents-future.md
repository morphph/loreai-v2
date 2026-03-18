---
title: "Spec-Driven Development：AI编程时代，规格说明才是你真正的代码"
date: 2026-03-18
slug: juliandeangelis-ai-agents-future
description: "AI Agent写代码总是返工？Julián提出的Spec-Driven Development（规格驱动开发）通过四步法消灭模糊性，让Agent一次写对。本文解析SDD三个层级和ROI计算。"
keywords: ["Spec-Driven Development", "AI编程", "SDD", "Coding Agent", "规格驱动开发", "AI开发工作流"]
category: DEV
related_newsletter: 2026-03-18
related_glossary: [ai-agent, prompt-engineering]
related_compare: []
lang: zh
video_ready: true
video_hook: "AI帮你写代码，返工三次才搞定？问题不在AI，在你的需求说明。"
video_status: published
source_type: video
---

# Spec-Driven Development：AI编程时代，规格说明才是你真正的代码

让 **Coding Agent** 帮你加个后台功能，结果它猜错数据库、猜错权限模型、猜错 API 接口，改了三轮还不如自己写。问题不在 AI 的能力，而在你给它的输入。Julián 提出的 **Spec-Driven Development**（规格驱动开发）给出了一套系统解法：把模糊性在写代码之前彻底消灭。

## 发生了什么

Julián 在一篇 Twitter 长文中提出了 **SDD（Spec-Driven Development）** 框架，核心论点是：在 AI 编程时代，人类写的规格说明才是真正的代码。

SDD 分四个阶段：**Specify**（定义需求和边界）、**Plan**（设计架构和技术选型）、**Tasks**（拆分为可执行的具体任务）、**Implement**（Agent 执行写代码、测试、部署）。从第一步到第四步，模糊性逐步递减。整套流程的目的，就是在 Agent 动手之前把不确定性清零。

更进一步，SDD 还分三个递进层级。**Level 1 Spec-First**：写一份临时规格，开发完即弃。**Level 2 Spec-Anchored**：规格留在代码仓库，成为与代码同步的活文档。**Level 3 Spec-as-Source**：规格本身成为核心资产，代码从规格派生，随时可重新生成。

## 为什么重要

模糊性是 AI 编程真正的瓶颈。一句"给后台加个管理功能"，Agent 被迫在四个关键问题上瞎猜：用哪个后台系统、调哪个 API、用什么权限模型、错误处理怎么做。结果就是猜错用户权限、数据模型对不上、架构冲突，反复返工。

换成一份明确的规格说明——接口满足幂等性要求、仅管理员可访问、只调用内部 API、请求和响应有 **JSON Schema** 定义——Agent 拿到后一次就能写对。

**Level 3** 的意义尤其深远。传统开发中代码是核心资产、文档是附属品，但在 Spec-as-Source 模式下完全反转：规格文件才是核心资产，代码成了副产品。就像 3D 打印中 CAD 设计文件才是真正的资产，打印出来的实物随时可以重新生成。这意味着，未来开发者的核心竞争力将从"写代码"转向"写规格"。

## 技术细节

具体操作上，每次用 AI Agent 写代码之前，需要检查四项关键信息是否已明确写入规格：

1. **架构决策**：明确指定技术栈，例如使用 NextJS 的 App Router，而非让 Agent 自己猜
2. **数据模型**：指定复用已有的 `UserEntity`，只需加一个 `provider` 字段
3. **权限模式**：指定遵循项目中的 `auth-rules` 模式
4. **性能约束**：量化要求，例如登录接口响应时间小于 100ms

Julián 展示了一个对比：没有规格时，Agent 连"这到底是 NextJS 还是普通 React"都搞不清楚；有规格时，组件结构一致、权限模式集成成功、性能测试通过，甚至 **Figma MCP** 设计稿都能匹配。

成本方面，SDD 的 Token 消耗确实会增加 2-3 倍，前期规划时间也更长。但关键在于场景区分：小改动、修 Bug、改配置，直接用 Plan Mode 写一句 prompt 就行；复杂功能、多文件变更、跨领域逻辑（同时涉及权限验证、数据库、API 和前端），SDD 省下的返工成本远超多花的 Token。就像盖房子请建筑师画图纸，画图纸要多花钱，但比建了拆、拆了建便宜十倍。

## 你现在该做什么

从 **Level 1** 开始：下次碰到复杂功能（多文件变更、跨模块逻辑），先花十分钟写一份临时规格，覆盖架构、数据模型、权限和性能约束四个维度。不需要一步到位，先体验到"Agent 一次写对"的价值，再决定是否升级到 Level 2 或 Level 3。

简单任务不必用 SDD，一句清晰的 prompt 足矣。把精力花在真正需要消灭模糊性的场景上。

**相关阅读**：[什么是 AI Agent](/glossary/ai-agent) · [Prompt Engineering 指南](/glossary/prompt-engineering)

---

*觉得有用？[订阅 AI 简报](/subscribe)，每天 5 分钟掌握 AI 动态。*