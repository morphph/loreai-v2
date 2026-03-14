---
title: "Claude Code 远程控制功能是否在所有 Anthropic 套餐中可用？"
slug: is-claude-code-remote-control-available-on-all-anthropic-pla
description: "Claude Code 的远程控制功能并非所有套餐都支持，需要 Max 或 API 付费计划。"
category: tools
related_glossary: [claude-desktop, agentic-coding]
related_blog: [claude-excel-powerpoint-skills-context]
lang: zh
---

# Claude Code 远程控制功能是否在所有 Anthropic 套餐中可用？

**[Claude Code](/glossary/agentic-coding)** 的远程控制（Remote Control）功能并非所有 Anthropic 套餐都可用。该功能允许通过 [Claude Desktop](/glossary/claude-desktop) 或其他客户端远程触发 Claude Code 执行任务，但需要支持 agentic 工作流的付费计划才能使用。免费版（Free）和基础 Pro 套餐不包含此能力。

## 背景

Claude Code 本身是一个终端级 AI 编程代理，核心使用方式是通过 API 按量计费。Anthropic 在 2025-2026 年间逐步推出了多种订阅计划：

- **Free / Pro 套餐**：主要面向 Claude 对话功能，不包含 Claude Code 的完整 agentic 能力
- **Max 套餐**：包含 Claude Code 使用额度，支持远程控制等高级功能
- **API 直接调用**：按 token 计费，功能最完整，远程控制能力取决于你的集成方式

远程控制功能的核心价值在于：你可以在 [Claude Desktop](/glossary/claude-desktop) 中发起一个任务，由运行在服务器或开发机上的 Claude Code 实例来执行。这对需要访问特定环境（如 VPS、CI 服务器）的开发者特别有用。更多关于 Claude 代理能力的发展方向，可参考我们的[相关报道](/blog/claude-excel-powerpoint-skills-context)。

## 实际操作建议

1. **确认你的套餐**：登录 Anthropic 控制台，查看当前订阅是否为 Max 或有 API 访问权限
2. **API 用户**：如果你通过 API 使用 Claude Code，远程控制能力取决于你的部署架构，不受套餐类型限制
3. **Max 用户**：直接在 Claude Desktop 中启用 Claude Code 集成，即可使用远程控制功能
4. **升级路径**：如需此功能，从 Pro 升级到 Max 是最直接的方式

注意：Anthropic 的定价和功能分级可能随时调整，建议以官网最新信息为准。

## 相关问题

- [什么是 agentic coding？](/glossary/agentic-coding)
- [Claude Desktop 是什么？](/glossary/claude-desktop)

---

*觉得有用？[订阅 LoreAI](/subscribe)，每天 5 分钟掌握 AI 动态。*