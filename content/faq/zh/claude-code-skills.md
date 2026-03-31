---
title: 什么是 Claude Code Skills?
slug: claude-code-skills
description: Claude Code Skills 是教会 Claude 如何执行特定任务的指令文件，可通过 /skill-name 调用。
category: tools
related_glossary:
  - claude-code
related_blog:
  - 5-claude-code-skills-i-use-every-single-day
lang: zh
related_topics:
  - claude-code
---

# 什么是 Claude Code Skills?

**[Claude Code Skills](/zh/blog/claude-code-extension-stack-skills-[hooks](/zh/blog/claude-code-seven-programmable-layers)-agents-[mcp](/zh/glossary/mcp))** 是包含在 `[SKILL.md](/zh/blog/9-principles-writing-claude-code-skills)` 文件中的指令集，教会 Claude 如何执行特定的重复工作。你可以通过 `/skill-name` 的方式调用任何技能，Claude 会根据你的工作流程、代码风格和业务规范来执行任务，一次编写，永久生效。

## 背景

不用 Skills 时，你需要在每次对话中重复说明你的要求——"用主动语态写""遵循我们的代码规范""按照品牌指南排版"。Claude 无法记住这些细节。

有了 Skills 后，你只需说"执行这个任务"，Claude 就能自动应用你预设的所有规则和流程。比如你可以创建一个"线性任务管理"技能，包含团队结构、项目规范和相关文档的引用，之后只需说"记录这个 bug"，它就会自动创建带有正确标签、深度链接和团队分配的任务。

Skills 采用渐进式加载设计：技能的名称和描述始终被加载（约 50 tokens），但完整指令和参考文件只在需要时才加载，不会占用额外的上下文空间。

[Claude Code](/zh/blog/agent-harnesses-2026) 中包含多个内置技能，如 `/batch`（并行处理大规模代码变更）和 `/claude-api`（加载 Claude API 参考文档）。你也可以在 `.claude/skills/` 目录中创建自定义技能，跨会话自动加载。

## 实践步骤

1. **创建技能文件夹**: 在 `.claude/skills/` 下新建文件夹，如 `my-skill/`
2. **添加 SKILL.md**: 在文件顶部添加 YAML 前置元数据，包括 `name`（功能名称）和 `description`（何时使用）
3. **编写指令**: 在文件中详细描述 Claude 应该如何执行这个任务，包括格式要求、工作流步骤等
4. **添加参考资源**: 可选地在 `references/` 目录中放置文档，在需要时 Claude 会自动读取
5. **在项目中使用**: Claude 会自动检测并加载你的技能，通过 `/skill-name` 调用

## 相关问题

- Claude Code 和 Cursor 有什么区别?
- Claude Code 免费吗?
- [我如何在 Claude Code 中使用 Skills?](/blog/5-claude-code-skills-i-use-every-single-day)

---

*觉得有用？[订阅 LoreAI](/subscribe)，每天 5 分钟掌握 AI 动态。*
