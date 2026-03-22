---
title: "Claude Code 免费吗？"
slug: is-claude-code-free
description: "Claude Code 不免费，使用需要 Anthropic API 按量付费或订阅 Claude Pro/Max 计划，安装本身不收钱但调用模型要花钱。"
category: tools
related_glossary: [claude-code, anthropic, claude]
related_blog: [claude-code-complete-guide, claude-code-enterprise-engineering-ramp-shopify-spotify]
lang: zh
---

# Claude Code 免费吗？

Claude Code 不免费。虽然安装不花钱，但实际使用需要付费，要么走 Anthropic API 按 token 计费，要么开通 Claude Pro 或 Max 订阅。每次跟 Claude 交互都会消耗 token，最终体现在你的账单上。

## 背景

[Claude Code](/glossary/claude-code) 是 [Anthropic](/glossary/anthropic) 的终端编程工具，npm 包随便装，但底层的 [Claude](/glossary/claude) 模型调用是收费服务。很多人在这里踩坑——装好了以为能直接用，结果发现没配好付费凭证就会报错。

付费方式主要两种。API 路线按 token 用量计费，用多少付多少，适合偶尔用用的场景。订阅路线走 Claude Pro（约 $20/月）或 Claude Max（$100-200/月），打包了 Claude Code 的使用额度，日常高频使用更划算。企业团队大规模使用可以谈专属方案，具体可以看[企业采用指南](/blog/claude-code-enterprise-engineering-ramp-shopify-spotify)。

关于详细的价格对比和省钱技巧，推荐看 [Claude Code 多少钱？](/faq/how-much-does-claude-code-cost)和 [Claude Code 完全指南](/blog/claude-code-complete-guide)。

## 实用步骤

1. 去 [Anthropic 控制台](https://console.anthropic.com) 查看你当前的计划。
2. 偶尔用的话，API 按量付费是最便宜的起步方式。
3. 每天都在用的话，Pro 或 Max 订阅通常更合算。
4. 每次会话结束后 Claude Code 会显示本次消耗的 token 费用，注意关注。
5. 更多省钱技巧可以浏览 [Claude Code 专题页](/topics/claude-code)。

## 相关问题

- [Claude Code 多少钱？](/faq/how-much-does-claude-code-cost)
- [Claude Code 是什么？](/faq/what-is-claude-code)
- [怎么安装 Claude Code？](/faq/how-to-install-claude-code)

---

*觉得有用？[订阅 LoreAI](/subscribe)，每天 5 分钟掌握 AI 动态。*
