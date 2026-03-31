---
title: AI Safety — AI 术语表
slug: ai-safety
description: 什么是 AI Safety？研究如何确保人工智能系统安全、可控、符合人类意图的技术领域。
term: ai-safety
display_term: AI Safety
category: concepts
related_glossary:
  - ai-regulation
  - autonomous-weapons
related_blog:
  - run-ai-coding-agents-locally
related_compare: []
lang: zh
---

# AI Safety — AI 术语表

**AI Safety**（AI 安全）是一个研究领域，核心目标是确保人工智能系统按照设计者的意图运行，不会对人类造成意外伤害。它涵盖从当前模型的对齐技术到未来超级智能风险的防范，是 AI 发展中最关键的基础性课题之一。

## 为什么 AI Safety 重要

随着大语言模型和[自主编程代理](/glossary/agentic-coding)的能力快速增长，AI 系统已经在代码执行、内容生成、决策辅助等场景中拥有实际影响力。如果模型产生有害输出、泄露敏感信息，或者在自主运行时偏离目标，后果可能从数据泄露到基础设施损坏不等。

Anthropic、OpenAI、DeepMind 等头部实验室均将安全研究作为核心投入方向。[AI 监管](/glossary/ai-regulation)框架（如欧盟 AI Act）的推进也在制度层面推动行业重视这一领域。我们在[本地运行 AI 编程代理](/blog/run-ai-coding-agents-locally)的分析中讨论了代理工具的安全边界问题。

## AI Safety 的核心机制

AI Safety 研究包含多个子方向：

- **对齐（Alignment）**：让模型的行为与人类价值观和意图一致，常用方法包括 [RLHF](/zh/glossary/rlhf)（基于人类反馈的强化学习）和 Constitutional AI
- **可解释性（Interpretability）**：理解模型内部的决策过程，而不是将其视为黑箱
- **红队测试（Red Teaming）**：主动寻找模型的漏洞和有害行为模式
- **沙箱与权限控制**：限制 AI 代理的系统访问范围，防止未授权操作

这些方法并非互相替代，而是构成多层防御体系。

## 相关术语

- **[AI Regulation](/glossary/ai-regulation)**：从法律和政策角度规范 AI 开发与部署，与技术层面的 safety 研究互为补充
- **[Agentic Coding](/glossary/agentic-coding)**：AI 代理自主执行编程任务，安全边界设计是其关键挑战
- **[Autonomous Weapons](/glossary/autonomous-weapons)**：AI Safety 讨论中最具争议的应用场景之一

---

*觉得有用？[订阅 LoreAI](/subscribe)，每天 5 分钟掌握 AI 动态。*
