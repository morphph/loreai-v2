---
title: "用 GPT Realtime API 搭建餐厅语音 Agent：实战教程解读"
date: 2026-03-10
slug: restaurant-voice-agent-gpt-realtime-tutorial
description: "OpenAI 官方演示如何用 gpt-realtime-1.5 构建餐厅语音订餐 Agent。本文拆解技术架构、关键实现细节，以及语音 Agent 的实际落地建议。"
keywords: ["GPT Realtime API", "语音 Agent", "gpt-realtime-1.5", "AI 语音助手", "OpenAI Realtime"]
category: DEV
related_newsletter: 2026-03-10
related_glossary: [voice-agent, realtime-api]
related_compare: [gpt-4o-vs-claude-sonnet]
lang: zh
video_ready: true
video_hook: "OpenAI 官方手把手教你用 Realtime API 做一个能接电话订餐的 AI"
video_status: none
---

# 用 GPT Realtime API 搭建餐厅语音 Agent：实战教程解读

OpenAI 官方发布了一个完整的实战案例：用 **gpt-realtime-1.5** 构建餐厅语音订餐 Agent。这不是概念演示，而是一个能处理真实对话场景的语音系统 — 接听电话、理解菜单询问、完成下单流程。对于想把语音 AI 落地到具体业务场景的开发者来说，这是目前最值得参考的官方教程。

## 发生了什么

OpenAI 开发者团队在 [Twitter 上分享](https://x.com/OpenAIDevs/status/2027132023442489661)了他们用 **GPT Realtime API** 构建餐厅语音 Agent 的完整过程。这个 Agent 基于 **gpt-realtime-1.5** 模型，能够实时处理语音输入，理解用户的订餐意图，查询菜单信息，处理特殊要求（比如过敏忌口），并完成订单确认。

**GPT Realtime API** 是 OpenAI 在 2025 年推出的实时语音交互接口，与传统的 STT → LLM → TTS 三段式流程不同，它直接处理音频流，实现真正的端到端语音对话。gpt-realtime-1.5 是该系列的最新版本，在多轮对话理解、函数调用和延迟控制方面都有明显提升。

这个案例的意义在于：语音 Agent 正在从"能说话的聊天机器人"进化为"能干活的业务系统"。餐厅场景恰好是验证这个转变的理想测试场 — 对话轮次短、意图明确、容错空间小。

## 为什么重要

语音 Agent 是 2026 年 AI 应用落地的热门方向之一，但大多数项目卡在两个地方：延迟太高导致对话不自然，以及复杂业务逻辑难以嵌入语音流程。

**Realtime API** 的核心价值是解决第一个问题。传统架构需要先把语音转文字、送给 [LLM](/glossary/llm) 处理、再把文字转语音，三个环节叠加延迟通常在 2-4 秒。Realtime API 直接在音频层面交互，端到端延迟可以压到 500ms 以内，接近人类对话的自然节奏。

第二个问题通过 **function calling**（函数调用）解决。语音 Agent 可以在对话过程中调用外部函数 — 查菜单、算价格、创建订单 — 而不只是生成文本回复。这意味着语音 Agent 可以真正嵌入业务系统，而不只是做一个"语音前端"。

从竞争格局来看，语音 AI 赛道现在相当拥挤。国内有字节的豆包语音、阿里的通义语音，以及一批专做电话 Agent 的创业公司（比如 Bland AI、Vapi）。OpenAI 的优势在于模型能力和开发者生态，但 API 在国内的访问稳定性仍然是实际部署时必须考虑的问题。

## 技术细节

构建一个可用的餐厅语音 Agent，核心架构分三层：

**1. 语音交互层**：通过 **Realtime API** 建立 WebSocket 连接，实时传输音频流。API 支持语音活动检测（VAD），自动识别用户说完了没有，不需要手动处理静音检测。

**2. 业务逻辑层**：通过 function calling 定义工具集。一个典型的餐厅 Agent 至少需要这些函数：

```typescript
// 核心工具定义
const tools = [
  { name: "query_menu", description: "查询菜单和菜品详情" },
  { name: "check_availability", description: "检查菜品是否有库存" },
  { name: "add_to_order", description: "将菜品添加到订单" },
  { name: "confirm_order", description: "确认并提交订单" },
  { name: "get_order_summary", description: "获取当前订单摘要" }
];
```

**3. 状态管理层**：语音对话是有状态的。用户可能说"再加一份刚才那个"，Agent 需要追踪对话历史和当前订单状态。Realtime API 通过 session 管理这个上下文，但复杂的业务状态（比如多桌并发）需要在服务端自己维护。

性能方面，gpt-realtime-1.5 的首字延迟（Time to First Token）在理想网络条件下约 300-500ms。但实际部署中，网络波动和函数调用的耗时都会增加端到端延迟。建议对所有外部函数做异步预取和缓存优化。

**局限性**：Realtime API 目前不支持多语言混合（比如中英夹杂的点餐场景），对方言和口音的识别准确率也低于标准普通话/英语。另外，API 计费按音频时长算，成本比纯文本 API 高出不少 — 餐厅场景下每通电话的 API 成本大约在 $0.05-0.15。

## 你现在该做什么

1. **先跑通官方示例**。去 OpenAI 的 Cookbook 找 Realtime API 的 quickstart，本地搭一个最简单的语音对话 demo，感受延迟和交互体验。
2. **定义你的工具集**。语音 Agent 的质量 80% 取决于 function calling 的设计。先把业务流程拆成离散的函数，再接入语音层。
3. **评估成本和延迟**。在目标网络环境下做压力测试，确认端到端延迟和每次调用的成本是否在可接受范围内。
4. **关注国内替代方案**。如果你的用户主要在国内，可以同时评估通义实时语音 API 和豆包的语音交互能力，作为备选或主力方案。
5. **先做内部工具，再做客户产品**。语音 Agent 的容错空间很小，建议先在内部场景验证（比如内部订餐系统），再推向外部用户。

**相关阅读**：[今日简报](/newsletter/2026-03-10) 有更多 AI 动态。另见：[语音 Agent](/glossary/voice-agent) 术语详解。

---

*觉得有用？[订阅 AI 简报](/subscribe)，每天 5 分钟掌握 AI 动态。*