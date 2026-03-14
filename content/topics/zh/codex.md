---
title: "Codex — 你需要知道的一切"
slug: codex
description: "OpenAI Codex 完整指南：从代码生成模型到云端编程智能体的演进。"
pillar_topic: Codex
category: models
related_glossary: [chatgpt, agentic-coding]
related_blog: [openai-computer-access-agents-lessons]
related_compare: []
related_faq: []
lang: zh
---

# Codex — 你需要知道的一切

**Codex** 是 OpenAI 推出的代码智能产品线，经历了两个截然不同的阶段。最初的 Codex 是 2021 年发布的代码生成模型，基于 GPT-3 微调而成，能够将自然语言指令转换为可执行代码，是 GitHub Copilot 背后的核心引擎。2025 年，OpenAI 重新启用 Codex 品牌，推出了全新的**云端编程智能体**——它不再是简单的代码补全工具，而是一个能在沙盒环境中独立完成多步骤软件工程任务的 [agentic coding](/glossary/agentic-coding) 系统。这个转变标志着 AI 辅助编程从「自动补全」向「自主执行」的范式跃迁。

## 最新进展

2025 年 5 月，OpenAI 发布了全新的 Codex 智能体产品，集成在 [ChatGPT](/glossary/chatgpt) 界面中。与早期 API-only 的模型不同，新 Codex 作为云端智能体运行——用户提交任务描述后，它在隔离的云端沙盒中克隆代码仓库、分析代码结构、编写和运行代码、执行测试，最终提交 pull request。

新 Codex 基于 OpenAI 专门为编程优化的 **codex-1** 模型，支持并行处理多个任务。OpenAI 将其定位为与 Anthropic 的 Claude Code 和 Google 的 Jules 直接竞争的产品。关于 OpenAI 在智能体领域的布局，可参阅我们的[深度分析](/blog/openai-computer-access-agents-lessons)。

值得注意的是，早期的 Codex API（基于 GPT-3 的代码模型）已于 2023 年正式下线，被 GPT-4 系列的代码能力取代。新 Codex 是完全独立的产品，共享的只是品牌名称。

## 核心能力

### 云端沙盒执行

新 Codex 的核心架构区别于本地工具：每个任务在独立的云端容器中运行，具有完整的文件系统和终端访问权限。这意味着它可以安装依赖、运行构建工具、执行测试套件，而不会影响开发者的本地环境。

### 多步骤任务规划

Codex 不是逐行生成代码，而是理解高层次目标后自主拆解任务：

- **Bug 修复**：分析错误日志 → 定位问题代码 → 编写修复 → 验证测试通过
- **功能开发**：理解需求 → 设计实现方案 → 编写代码和测试 → 提交 PR
- **代码重构**：识别模式 → 跨文件修改 → 确保测试不回归

### 安全与审查

所有代码变更在合并前都需人工审查。Codex 在隔离环境中运行，无法访问外部网络（执行阶段），降低了供应链攻击风险。

### 与 ChatGPT 深度集成

通过 ChatGPT 界面直接触发 Codex 任务，不需要额外的 CLI 工具或 IDE 插件。任务完成后，结果以可审查的 diff 形式呈现在对话中。

## 常见问题

- **Codex 和 GitHub Copilot 是什么关系？** 早期 Codex 模型曾是 Copilot 的底层引擎，但 Copilot 后来迁移到了 GPT-4 系列。新 Codex 是独立产品，与 Copilot 无直接技术关联
- **Codex 支持哪些编程语言？** 基于大规模代码训练，主流语言（Python、JavaScript/TypeScript、Go、Java、C++ 等）均有较好支持，但在小众语言上能力有限
- **Codex 是免费的吗？** 新 Codex 智能体目前面向 ChatGPT Pro、Team 和 Enterprise 用户开放，具体使用配额因套餐而异

## Codex 与其他工具对比

目前 AI 编程智能体赛道竞争激烈。Codex 的云端架构与 [Claude Code](/glossary/agentic-coding) 的本地终端方案形成鲜明对比——前者强调零配置和隔离安全，后者强调对本地环境的深度控制。Google 的 Jules 同样采用云端方案，但集成在 Gemini 生态中。选择哪个工具，取决于团队的工作流偏好和已有的平台生态。

## 所有 Codex 资源

### 博客文章
- [OpenAI 智能体战略深度解析](/blog/openai-computer-access-agents-lessons)

### 术语表
- [Agentic Coding](/glossary/agentic-coding) — AI 驱动的自主编程范式
- [ChatGPT](/glossary/chatgpt) — OpenAI 的对话式 AI 产品，Codex 的宿主平台

---

*觉得有用？[订阅 LoreAI](/subscribe)，每天 5 分钟掌握 AI 动态。*