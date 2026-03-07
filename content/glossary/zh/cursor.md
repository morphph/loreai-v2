---
title: "Cursor — AI 术语表"
slug: cursor
description: "什么是 Cursor？基于 VS Code 的 AI 代码编辑器，深度集成大语言模型辅助开发。"
term: cursor
display_term: "Cursor"
category: tools
related_glossary: [claude-code, gpt-54]
related_blog: [claude-code-voice-mode]
related_compare: []
lang: zh
---

# Cursor — AI 术语表

**Cursor** 是一款基于 VS Code 分支构建的 AI 代码编辑器，由 Anysphere 公司开发。它将大语言模型能力直接嵌入编辑器工作流，提供智能补全、内联编辑和代码对话功能，开发者无需离开编辑器即可获得 AI 辅助。

## 为什么 Cursor 值得关注

在 AI 辅助编程工具爆发的 2025-2026 年，Cursor 迅速成为最受欢迎的选择之一。它的核心优势在于**零迁移成本**——因为直接基于 VS Code，开发者可以沿用已有的插件、快捷键和配置。与传统的代码补全工具不同，Cursor 支持选中代码后用自然语言描述修改意图，编辑器直接生成 diff 供审阅。

对于习惯 IDE 工作流的团队来说，Cursor 比终端类工具（如 [Claude Code](/glossary/claude-code)）的上手门槛更低。关于 AI 编程工具的最新动态，可以参考我们对 [Claude Code 语音模式的报道](/blog/claude-code-voice-mode)。

## Cursor 的工作原理

Cursor 在 VS Code 的基础上增加了三层 AI 能力：

- **Tab 补全**：基于当前文件和项目上下文，预测并补全多行代码，类似 GitHub Copilot 但上下文理解更深
- **Cmd+K 内联编辑**：选中代码段后输入指令，模型生成修改建议并以 diff 形式展示
- **Chat 侧边栏**：对话式交互，可引用当前文件、符号或整个代码库回答问题

Cursor 支持多种后端模型，包括 Claude 和 [GPT 系列](/glossary/gpt-54)，用户可根据任务切换。它通过代码库索引和嵌入向量实现项目级上下文理解，而非仅依赖当前打开的文件。

## 相关术语

- **[Claude Code](/glossary/claude-code)**：Anthropic 的终端 AI 编程代理，与 Cursor 的 IDE 路线形成互补
- **[GPT-5.4](/glossary/gpt-54)**：OpenAI 最新模型，Cursor 支持的后端模型之一

---

*觉得有用？[订阅 LoreAI](/subscribe)，每天 5 分钟掌握 AI 动态。*