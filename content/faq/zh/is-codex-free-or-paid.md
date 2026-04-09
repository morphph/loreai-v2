---
title: "OpenAI Codex 是免费的还是付费的？"
slug: is-codex-free-or-paid
description: "OpenAI Codex 按 API 用量计费，无固定月费。学生可获 $100 免费额度，开源项目有专属申请通道。"
category: tools
related_glossary: [what-does-codex-mean, agentic-coding]
related_blog: [codex-complete-guide, codex-for-students, first-few-days-with-codex-cli]
related_compare: []
related_topics: [codex]
lang: zh
---

# OpenAI Codex 是免费的还是付费的？

**OpenAI Codex** 是付费工具，采用 API 用量计费模式——没有固定月费，按实际消耗的 token 量付费。对学生和开源项目有专项免费额度，普通用户需配置 API 密钥后按量付费。

## 定价模式与免费通道

Codex 是 OpenAI 的云端编程 Agent，计费方式与 ChatGPT 订阅完全独立。你不需要购买固定套餐，使用多少付多少。这对间歇性使用的开发者友好，但高频跑大型任务时成本会累积得比较快。

想低成本入门，目前有两条路：

- **学生免费额度**：OpenAI 为在校学生提供 $100 免费 API 额度，足够体验完整的 Codex 工作流，无需预先绑定信用卡。这是目前门槛最低的方式。
- **开源项目申请**：符合条件的开源项目可申请专项配额，OpenAI 将此定位为对社区的回馈，但审核标准未完全公开。

除以上两类外，普通用户直接调 API，费用计入 OpenAI 账户。具体单价会随模型版本调整，以官方定价页为准。

想了解 Codex 整体能力和典型场景，可以看完全指南；如果想知道实际上手感受如何，初识 Codex CLI 的前几天会更直接。

## 常见问题

### Codex 订阅 ChatGPT Plus 就能用吗？

不能。Codex CLI 通过 OpenAI API 独立计费，与 ChatGPT Plus 或 Pro 订阅是两条账单。即使你已经订阅 ChatGPT，使用 Codex 仍会产生额外 API 费用。

### 在 VS Code 里用 Codex 也要单独付费吗？

是的。Codex VS Code 扩展同样走 API 计费，和 CLI 版本计费逻辑一致，费用都计入你的 OpenAI API 账户。

### 什么场景下 Codex 的性价比最好？

Codex 适合跨多文件的批量任务——测试生成、代码重构、自动化修复。如果主要是在编辑器里做行级补全，性价比会相对低，可以对比其他更适合 inline 场景的工具。

## 相关问题

- Codex 定价详解
- 如何下载和安装 Codex

---

*觉得有用？[订阅 LoreAI](/subscribe)，每天 5 分钟掌握 AI 动态。*