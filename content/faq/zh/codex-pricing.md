---
title: "Codex 定价是怎样的？"
slug: codex-pricing
description: "OpenAI Codex CLI 的定价基于 API token 用量，通过 OpenAI API key 计费。本文解释收费逻辑与免费额度。"
category: tools
related_glossary: [agentic-coding, agent-sdk]
related_blog: [codex-complete-guide, first-few-days-with-codex-cli, codex-for-students]
related_compare: []
related_topics: [codex]
lang: zh
---

# Codex 定价是怎样的？

**Codex CLI** 本身是开源免费工具，但运行时需要消耗 OpenAI API token，费用按实际用量计算。你绑定自己的 API key，每次任务的成本取决于调用的模型和上下文长度——没有固定月费，也没有座位订阅。

## 收费逻辑

Codex CLI 是一个在本地运行的编程 Agent，它的每一步推理都通过 OpenAI API 完成。这意味着：

- **按 token 计费**：输入 + 输出 token 合并计算，具体单价取决于你选择的底层模型（如 `o4-mini`、`o3` 等）
- **任务复杂度决定成本**：简单的单文件修改消耗少，跨仓库重构或多轮对话消耗显著更高
- **没有平台抽成**：你直接向 OpenAI 付费，Codex CLI 工具本身不收取额外费用

详细的单价表请参考 OpenAI 官方 API 定价页面，因为模型价格会随时调整。

## 有没有免费额度？

OpenAI 面向特定用户群体提供免费或优惠额度：

- **学生**：OpenAI Codex for Students 项目为在校学生提供 $100 免费 API 额度，用于 Codex CLI 的学习和实验
- **开源项目**：Codex for Open Source 计划为符合条件的开源项目提供额外资源支持
- **新账户**：OpenAI 通常为新注册账户提供有限的试用额度，具体以官网公告为准

如果你刚开始上手，可以先读初识 Codex CLI：前几天你需要知道的一切，了解如何控制任务规模、避免不必要的 token 消耗。

## 实际使用成本高吗？

这取决于工作模式。Codex CLI 完整指南中提到，日常轻度使用（调试、小功能开发）通常成本可控；但如果将其用于大型代码库的自动化重构或长对话任务，成本会快速增加。建议先用 `--dry-run` 模式预估任务复杂度，再正式运行。

## 相关问题

- 如何开始使用 Codex？
- Codex CLI 怎么在 VS Code 里用？
- Codex CLI 怎么配置？

---

*觉得有用？[订阅 LoreAI](/subscribe)，每天 5 分钟掌握 AI 动态。*