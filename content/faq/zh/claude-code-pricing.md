---
title: "Claude Code 定价：API vs Max vs Pro 怎么选？"
slug: claude-code-pricing
description: "Claude Code 本身不收费。通过 API 按 token 计费（用多少花多少），Pro 月付 $20（有限额），Max 月付 $100-200（高限额适合重度用户）。"
category: tools
related_glossary: [claude-code, anthropic, claude]
related_blog: [claude-code-complete-guide, claude-code-enterprise-engineering-ramp-shopify-spotify]
lang: zh
---

# Claude Code 定价：API vs Max vs Pro 怎么选？

Claude Code 没有单独的授权费。你通过三种方式付费使用：API 按 token 计费，花多少算多少；Claude Pro 每月 20 美元，包含 Claude Code 但有用量限制；Claude Max 每月 100 到 200 美元，给专业开发者提供高用量上限。

## 背景

[Anthropic](/glossary/anthropic) 这样设计定价是有原因的：[Claude Code](/glossary/claude-code) 的 agentic 编码会话消耗的 token 量远超普通聊天。一次会话里，agent 要读项目代码、规划多文件修改、执行命令、迭代调试，随便一个任务就是几万 token。所以选对定价方案，对你的钱包影响不小。

API 模式按输入和输出 token 分别计费，不同模型价格不同。Opus 单价比 Sonnet 贵，所以把简单任务路由给轻量模型是常见的省钱技巧。活跃开发者的 API 月账单通常在 50 到 150 美元之间，看使用频率和任务复杂度。

[Claude](/glossary/claude) Pro 每月 20 美元包含 Claude Code 使用权限，但限额比较保守，每天只能跑几个会话。重度用户会很快撞到天花板。Claude Max 分两档：100 美元和 200 美元，限额逐级提高，高峰时段还有优先通道。

企业团队还有额外的批量定价和团队管理功能。想看大厂怎么落地 Claude Code 的，可以读我们的[企业工程案例分析](/blog/claude-code-enterprise-engineering-ramp-shopify-spotify)。完整功能介绍在 [Claude Code 完全指南](/blog/claude-code-complete-guide)。

## 实用步骤

1. 先开 Claude Pro（$20/月）试用一两周，看 Claude Code 是否适合你的日常工作流
2. 记录你的使用模式——多久撞一次限额、每天跑几个会话
3. 如果经常在下班前就用完额度，升级到 Claude Max（$100/月）
4. API 用户善用模型路由：Sonnet 处理快速编辑和搜索，Opus 留给多文件重构和复杂调试
5. 通过 Anthropic 后台的用量面板监控消费，按会话维度看 token 消耗
6. 团队用户评估企业计划，有批量折扣和统一账单

## 相关问题

- [Claude Code 免费吗？](/faq/is-claude-code-free)
- [Claude Code 多少钱？](/faq/how-much-does-claude-code-cost)
- [什么是 Claude Code？](/faq/what-is-claude-code)

---

*觉得有用？[订阅 LoreAI](/subscribe)，每天 5 分钟掌握 AI 动态。*