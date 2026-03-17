---
title: "如何使用 Codex API？"
slug: codex-api-access
description: "Codex API 通过 codex-mini-latest 模型开放，支持 Responses API 调用，附带定价和接入指南。"
category: tools
related_glossary: [codex]
related_blog: [codex-complete-guide]
lang: zh
---

# 如何使用 Codex API？

OpenAI 通过 **codex-mini-latest** 模型开放了 [Codex](/glossary/codex) 的 API 访问。该模型基于 o4-mini 针对代码场景优化，支持通过 **Responses API** 调用，适用于代码问答、编辑和自动化工作流集成。

## 背景

很多开发者了解 Codex 是 ChatGPT 里的云端编程智能体，但不清楚它也提供 API 接口。实际上，OpenAI 将 Codex 能力拆分为两个产品形态：ChatGPT 内的交互式智能体（面向终端用户）和 API 模型（面向开发者构建自定义工具链）。

API 端提供的是 **codex-mini-latest**——一个专为低延迟代码问答和编辑优化的模型。它保留了 Codex 在指令遵循和代码风格上的核心能力，同时响应速度更快。该模型的底层快照会随改进持续更新。

需要注意的是，API 访问与 ChatGPT 内的 Codex 智能体是独立的产品。API 模型不包含沙箱环境、GitHub 集成等智能体功能——这些仅限于 ChatGPT 产品内使用。更多 Codex 功能解析参见我们的[完整指南](/blog/codex-complete-guide)。

## 接入步骤

1. **获取 API 密钥**：登录 OpenAI 平台，创建或选择一个 API organization，生成 API key
2. **调用 Responses API**：使用模型名 `codex-mini-latest` 发起请求
3. **了解定价**：输入 token 价格为 **$1.50 / 百万 token**，输出为 **$6 / 百万 token**，启用 prompt caching 可享受 **75% 折扣**
4. **快速体验**：ChatGPT Plus 用户可通过 Codex CLI 登录 ChatGPT 账号，自动配置 API key，并领取 **$5 免费额度**（Pro 用户为 $50），有效期 30 天
5. **本地开发**：安装 Codex CLI 后，codex-mini-latest 已作为默认模型可直接使用

## 相关问题

- [Codex 是什么？](/faq/what-is-codex)
- [Codex 是免费的吗？](/faq/is-codex-free)
- [Codex 定价方案详解](/faq/codex-pricing)

---

*觉得有用？[订阅 LoreAI](/subscribe)，每天 5 分钟掌握 AI 动态。*