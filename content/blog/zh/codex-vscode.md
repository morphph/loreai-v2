---
title: OpenAI Codex VS Code 扩展：在 IDE 里用上编程 Agent
slug: codex-vscode
date: "2026-03-31"
description: OpenAI Codex 现已登陆 VS Code、Cursor 和 JetBrains。本文带你了解如何安装、如何用好它，以及避免哪些坑。
lang: zh
category: tools
related_glossary:
  - chatgpt
  - agentic-coding
related_blog:
  - codex-for-students
related_faq:
  - codex
---

# OpenAI Codex VS Code 扩展：在 IDE 里用上编程 Agent

**[OpenAI Codex](/zh/blog/codex-complete-guide)** 不再只是 [ChatGPT](/zh/glossary/chatgpt) 网页上的聊天框——它现在是一个可以直接嵌入编辑器的[编程 Agent](/glossary/agentic-coding)，能读取、编辑、运行代码，也能把更大的任务扔到云端异步执行。VS Code 扩展已有 **638 万次安装**，支持 VS Code、[Cursor](/zh/glossary/cursor)、[Windsurf](/zh/glossary/windsurf) 和 JetBrains 全系列 IDE。

## Codex VS Code 扩展是什么

[Codex](/zh/faq/codex) 扩展把 [ChatGPT](/glossary/chatgpt) 的编程能力带进编辑器侧边栏。你可以：

- **Pair 模式**：在 IDE 里实时对话，Codex 能感知当前打开的文件和选中的代码，不用反复粘贴上下文
- **Cloud 委托模式**：把大任务（比如重构整个模块）交给 Codex Cloud 在后台跑，你继续干别的，完成后在 IDE 里 review 结果

两种模式可以混用。小改动直接 Pair，大任务丢云端。

## 安装方式

从 Visual Studio Code Marketplace 搜索"Codex"（发布者 openai）即可安装，也可以直接下载对应 IDE 的版本：

- VS Code / VS Code Insiders
- Cursor
- Windsurf
- JetBrains（Rider、IntelliJ、PyCharm、WebStorm）

**平台支持**：macOS 和 Linux 原生支持，Windows 属于实验性支持，官方建议在 WSL workspace 下使用体验更好。

安装后在编辑器侧边栏找到 Codex 图标，用 ChatGPT 账号或 API key 登录即可。**ChatGPT Plus、Pro、Business、Edu、Enterprise** 计划均包含 Codex 使用额度。

### Cursor 用户注意

Cursor 的 Activity Bar 默认横向排列，Codex 图标可能被折叠隐藏。需要手动 pin 并调整顺序才能看到。如果要把 Codex 移到右侧边栏，需要先把 Activity Bar 改成 vertical 方向，重启编辑器，拖动图标后再改回 horizontal。

## 用好 Codex 的关键：不要让它腐蚀你的代码库

Codex 能快速产出代码，但快速产出也意味着快速累积技术债。Medium 上一篇被广泛讨论的文章（作者 Mohsen Nasiri）直接点出了这个问题：Codex 的修改局部正确、全局错误。Bug 消失了，但架构在悄悄退化。

作者的建议很实用：

**把规则写进仓库，不要只放在聊天框里。** 如果你对 Codex 说"别用全局状态"，这个要求只存在于这一次对话。下次新建对话，它不记得。规则必须落地成文件——类似 `CLAUDE.md` 的项目级配置，或者 `.cursor/rules` 之类的约定文件，随仓库版本控制走。

核心原则：**AI 能写代码，但架构判断必须是你的。** Codex 适合执行有明确意图的任务，不适合帮你做架构决策。

## Codex Cloud：异步委托的用法

Cloud 模式是 Codex 扩展的差异化功能。你描述一个任务，Codex 在云端独立执行，完成后你在 IDE 里 review diff，满意了再合并到本地。这个流程适合：

- 大规模重构（跨多个文件）
- 写测试覆盖
- 代码审查 + 修改建议落地

对于有在终端用 Claude Code 习惯的开发者来说，这个模式逻辑上很相似——区别在于 Codex 的 Cloud 任务通过 IDE 界面管理，不需要切换到终端。

更多关于编程 Agent 的使用方式，可以看[这篇关于 Codex 学生使用场景的分析](/blog/codex-for-students)，或者查阅 [Codex 常见问题解答](/faq/codex)。

## 适合谁用

- 已经是 ChatGPT 付费用户，想把 AI 用进日常编码流程的开发者
- 用 Cursor 或 Windsurf 的用户，想试试 OpenAI 官方 Agent 能力的
- 需要把大任务异步化、不想一直盯着 AI 输出的开发者

不适合：想要免费方案的用户（需要 ChatGPT 付费计划），或者在 Windows 原生环境工作且不想配置 WSL 的用户。

---

*觉得有用？[订阅 LoreAI](/subscribe)，每天 5 分钟掌握 AI 动态。*
