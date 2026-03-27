---
title: "Claude Code 是否会泄露你的代码？"
slug: does-claude-code-expose-your-code
description: "Claude Code 会将代码发送到 Anthropic 服务器进行处理。了解数据风险、.env 文件安全和如何保护敏感信息。"
category: tools
related_glossary: [agentic-coding, ai-safety]
related_blog: [integrate-claude-code-into-your-development-workflow]
related_faq: [how-do-i-set-up-claude-code-remote-control-on-my-phone]
lang: zh
---

# Claude Code 是否会泄露你的代码？

**Claude Code 会将你的代码发送到 Anthropic 的服务器进行分析和处理**。任何 Claude Code 读取的文件都会完整地传输到服务器，包括文件名、目录结构和对话内容。这意味着你的代码安全取决于如何使用这个工具。

## 背景信息

这个问题很常见，因为很多开发者不清楚 Claude Code 的数据流向。关键风险在于两个方面：

首先，**Claude Code 会自动读取 .env 文件**，包括 .env、.env.local 等，这些文件通常包含 API 密钥、令牌和代理配置等敏感信息。用户往往不知道这些密钥已被自动加载到内存中。如果 Claude Code 的安全被破坏，这些密钥就会暴露。

其次，Anthropic 的文档指出，**文件访问可能被传输到 Anthropic 系统**。虽然你可以通过删除对话来触发 30 天的数据保留期满后删除，但数据在保留期内仍然存在。

好消息是，**只有 Claude Code 显式读取的文件才会被发送** — 其他项目文件、本地环境变量和系统配置保持在本地。此外，Claude Code 有 [权限系统](/glossary/agentic-coding)，敏感操作需要显式批准，写入操作也被限制在项目文件夹内。更多详情见 [如何集成 Claude Code 到开发流程](/blog/integrate-claude-code-into-your-development-workflow)。

## 实践建议

1. **永远不要分享包含敏感信息的文件** — 将 .env 文件移出项目目录，或至少将其从 Claude Code 的访问范围内排除
2. **避免在对话中粘贴 API 密钥或凭证** — 即使看起来是"测试"环境也要谨慎
3. **使用完后立即删除对话** — Anthropic 的 30 天保留期意味着删除后数据最终会被清除，但期间仍可能被访问
4. **检查 Claude Code 的权限请求** — 在批准任何命令前审查其安全性，因为用户对权限负责

## 相关问题

- 如何在手机上设置 Claude Code 远程控制？
- [Claude Code 的定价是多少？](/faq/claude-code-pricing)

---

*觉得有用？[订阅 LoreAI](/subscribe)，每天 5 分钟掌握 AI 动态。*