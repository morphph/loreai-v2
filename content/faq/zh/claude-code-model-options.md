---
title: "Claude Code 有哪些模型选项？"
slug: claude-code-model-options
description: "Claude Code 支持 Opus、Sonnet、Haiku 三个模型档位，可通过 --model 参数或环境变量切换，满足不同成本与能力需求。"
category: tools
related_glossary:
  - agentic-coding
related_blog:
  - claude-code-seven-programmable-layers
  - claude-code-extension-stack-skills-hooks-agents-mcp
  - 5-claude-code-skills-i-use-every-single-day
related_compare: []
related_topics:
  - claude-code
lang: zh
---

# Claude Code 有哪些模型选项？

**Claude Code** 默认使用 Anthropic 最新的 Claude Sonnet 模型，同时支持通过 `--model` 参数或环境变量切换到 Opus 或 Haiku，分别对应"最强能力"和"最低成本"两个极端。

## 背景

Claude Code 的模型选择直接影响任务质量和 API 费用，这是很多开发者踩坑的地方。Anthropic 目前主线模型分三档：

- **Claude Opus**（如 `claude-opus-4-7`）：推理能力最强，适合复杂重构、架构设计类任务，但 token 成本最高
- **Claude Sonnet**（如 `claude-sonnet-4-6`）：默认选项，能力与成本平衡，覆盖绝大多数日常编码场景
- **Claude Haiku**（如 `claude-haiku-4-5-20251001`）：响应最快、成本最低，适合简单问答或高频批量操作

Claude Code 还提供 **Fast 模式**（`/fast` 命令），底层使用 Opus 4.6 但针对输出速度做了优化，不是降级到更小的模型。

如果你想深入了解 Claude Code 的整体架构，可以参考七层架构深度解析；想看模型与 Skills、Hooks 等扩展层如何协作，参见扩展栈拆解。

## 实操方法

1. **启动时指定模型**：`claude --model claude-opus-4-7`
2. **通过环境变量设置默认值**：`export ANTHROPIC_MODEL=claude-sonnet-4-6`
3. **会话中切换 Fast 模式**：在 Claude Code 内输入 `/fast` 开关
4. **附加系统提示**：使用 `--append-system-prompt` 在不改变模型的前提下注入项目级指令

选型建议：日常功能开发用默认 Sonnet；需要复杂推理（如跨模块重构、安全审计）升级到 Opus；脚本生成、文档补全等低复杂度任务可用 Haiku 降低成本。更多实战技巧见我每天都在用的 5 个 Claude Code 技巧。

## 相关问题

- Claude Code 的 Skills 系统是什么？
- Claude Code 如何使用 Hooks 实现自动化？

---

*觉得有用？[订阅 LoreAI](/subscribe)，每天 5 分钟掌握 AI 动态。*