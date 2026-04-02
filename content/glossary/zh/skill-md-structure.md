---
title: "SKILL.md 结构 — AI 词汇表"
slug: skill-md-structure
description: "什么是 SKILL.md 结构？Claude Code 技能文件的格式规范，定义 AI Agent 执行特定任务的指令与行为边界。"
term: skill-md-structure
display_term: "SKILL.md 结构"
category: tools
related_glossary: [agent-sdk, agentic-coding]
related_blog: [how-skills-work, do-skills-actually-improve-your-agents-output, claude-code-extension-stack-skills-hooks-agents-mcp]
related_compare: []
related_topics: [claude-code]
lang: zh
---

# SKILL.md 结构 — AI 词汇表

**SKILL.md 结构**是 Claude Code 技能文件的格式规范——每个技能以独立的 `SKILL.md` 文件存储，通过 frontmatter 元数据和正文指令，告诉 AI Agent 在执行某类任务时应遵循什么逻辑、输出什么格式、避免哪些行为。

## 为什么 SKILL.md 结构很重要

SKILL.md 是 Claude Code 可编程层架构中的核心组件。它解决的核心问题是：如何让 AI Agent 在团队中保持一致的行为——不依赖每次手动重复提示词，而是将工程规范编码为可复用的指令文件，随代码仓库一起版本管理。

正确设计 SKILL.md 结构直接影响 Agent 输出质量。关于这一点，可参考《Skills 真的能提升 AI Agent 的输出质量吗？》中的实测分析。

## SKILL.md 如何工作

一个标准的 SKILL.md 文件包含以下部分：

- **frontmatter**：声明技能名称、触发条件（`trigger`）、适用范围
- **角色与目标**：定义 Agent 在此技能下的身份和核心任务
- **执行步骤**：分阶段描述 Agent 应该做什么、以什么顺序做
- **禁止行为**：明确列出不允许的输出或操作
- **输出格式**：规定返回结果的结构（如 Markdown、JSON、代码块）

技能文件通常存放在项目根目录的 `skills/` 文件夹下，路径格式为 `skills/{skill-name}/SKILL.md`。**个人全局技能**（Personal Skill）则存放在 `~/.claude/skills/` 下，跨项目生效。

关于技能文件的实战最佳实践，参见《Claude Code Skills 最佳实践：从结构设计到生产级落地》。

## 相关术语

- **Agent SDK**：调用和编排技能的底层框架
- **Agentic Coding**：SKILL.md 是 Agentic Coding 工作流中指令持久化的标准方式

---

*觉得有用？[订阅 LoreAI](/subscribe)，每天 5 分钟掌握 AI 动态。*