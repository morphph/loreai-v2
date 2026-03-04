---
title: "Claude Code — AI 术语表"
slug: claude-code
description: "什么是 Claude Code？Anthropic 推出的终端 AI 编程智能体工具。"
term: claude-code
display_term: "Claude Code"
category: tools
related_glossary: [anthropic, claude]
related_blog: [anthropic-cowork-claude-desktop-agent]
related_compare: []
lang: zh
---

# Claude Code — AI 术语表

**Claude Code** 是 [Anthropic](/glossary/anthropic) 推出的命令行 AI 编程工具。它直接在终端中运行，能读取整个项目代码库，理解文件间的依赖关系，并自主执行多步骤的工程任务——从编写代码、运行测试到提交 Git 变更，全程无需离开终端。与嵌入 IDE 的代码补全工具不同，Claude Code 是一个拥有完整 Shell 访问权限的自主智能体。

## 为什么 Claude Code 重要

Claude Code 代表了 AI 辅助编程从「逐行补全」向「任务级自动化」的转变。你不再需要逐条审阅建议，而是可以描述一个完整目标——重构某个模块、修复一组失败测试、在多个文件间搭建新功能——然后让智能体自主规划并执行。

对团队而言，Claude Code 通过 CLAUDE.md 项目配置文件和 SKILL.md 技能文件实现工程规范的标准化。这些文件随代码仓库分发，确保每位成员获得一致的 AI 行为，无需反复调整提示词。更多实践细节可参考我们的[博客报道](/blog/anthropic-cowork-claude-desktop-agent)。

## Claude Code 如何工作

Claude Code 基于 [Claude](/glossary/claude) 模型的扩展上下文和工具调用能力运行。它解析项目结构、追踪文件关系，并通过沙箱化的 Shell 环境执行命令。

核心机制包括：

- **项目上下文**：自动读取 `CLAUDE.md` 和 `skills/*/SKILL.md`，获取项目级指令与约束
- **MCP 协议**：通过 Model Context Protocol 连接外部工具和数据源，扩展终端之外的能力边界
- **智能体团队**：可派生子智能体并行处理大型代码库中的不同任务
- **Git 集成**：自动暂存、提交和推送变更，生成结构化的提交信息

## 相关术语

- **[Anthropic](/glossary/anthropic)**：Claude Code 的开发公司，专注于 AI 安全研究与大模型开发
- **[Claude](/glossary/claude)**：驱动 Claude Code 的底层大语言模型系列

---

*觉得有用？[订阅 LoreAI](/subscribe)，每天 5 分钟掌握 AI 动态。*