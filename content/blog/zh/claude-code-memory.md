---
title: "Claude Code 记忆系统详解：CLAUDE.md 规则手册 + Auto Memory 自动笔记"
date: 2026-03-10
slug: claude-code-memory
description: "Claude Code 的记忆系统分两层：CLAUDE.md 是你写给 AI 的规则手册，Auto Memory 是它自己积累的工作笔记。本文详解三层作用域体系、200 行限制、实操配置要点。"
keywords: ["Claude Code", "CLAUDE.md", "Auto Memory", "AI 编程", "AI 开发工具"]
category: DEV
related_newsletter: 2026-03-10
related_glossary: [claude-code, ai-coding-assistant]
related_compare: []
related_topics: [claude-code]
lang: zh
video_ready: true
video_hook: "每次新会话都要重复交代项目规范？CLAUDE.md 让你只说一次。"
video_status: published
source_type: video
flow_source: manual-curate
---

# Claude Code 记忆系统详解：CLAUDE.md 规则手册 + Auto Memory 自动笔记

每次开新会话都要重新交代一遍项目规范、代码风格、架构约定——这是大多数 **Claude Code** 用户的日常。问题不在 AI 不够聪明，而在它没有持久记忆。Claude Code 的记忆系统正是为此设计：**CLAUDE.md** 让你把规则写一次、永久生效；**Auto Memory** 让 Claude 自己积累工作经验。两套机制配合，彻底消除重复沟通。

## 发生了什么

Claude Code 的记忆系统由两部分组成。

**CLAUDE.md 是你写给 Claude 的规则手册。** 放在项目根目录，每次会话自动加载，不需要手动提醒。它是一套三层作用域体系：

- **项目级**（`./CLAUDE.md` 或 `./.claude/CLAUDE.md`）：团队共享的编码规范、项目架构、工作流程，提交到 git，所有人拉代码即同步规则。
- **用户级**（`~/.claude/CLAUDE.md`）：个人偏好，比如回答风格、注释习惯，只影响自己。
- **组织级**（macOS 路径 `/Library/Application Support/ClaudeCode/CLAUDE.md`）：IT 部门统一下发，任何人都无法通过个人设置排除——公司层面管控 AI 使用方式的终极手段。

三层规则层层叠加、各司其职，像集团规章、部门制度、个人习惯的关系。

**Auto Memory 是 Claude 写给自己的笔记。** 默认开启，无需配置。Claude 在工作过程中自动判断哪些信息值得记录——构建命令、调试中发现的坑、你的代码风格偏好——然后写入 `~/.claude/projects/{项目名}/memory/MEMORY.md`。

## 为什么重要

对个人开发者来说，这意味着**上下文不再是一次性的**。你在第一次会话里踩过的坑、确立的规范，会自动沉淀为后续所有会话的基础知识。不再需要每次都写一段 system prompt 来"教育"AI。

对团队来说，CLAUDE.md 的价值更大。它把隐性的团队共识变成了显式的、版本控制的规则文件。新人 clone 代码、打开 Claude Code，编码规范就已经在那里了。组织级配置更进一步——安全策略、合规要求可以强制生效，开发者无法绕过。

两套系统的分工也很清晰：CLAUDE.md 是**你的主动规划**，Auto Memory 是 **Claude 的被动积累**。一个自上而下，一个自下而上，互补而不冲突。

## 技术细节

**CLAUDE.md 的实操要点：**

- 文件控制在 **200 行以内**，超过这个长度 Claude 对指令的遵循度会下降。内容多时用 `@path/to/import` 语法引用其他文件，最多支持 5 层嵌套。
- 指令必须具体。"格式化代码"没用，要写成"用两空格缩进"、"函数超过 50 行就拆分"。
- 项目规模大时，用 `.claude/rules/` 目录拆分规则文件，通过 YAML frontmatter 的 `paths` 字段指定作用范围——比如只对 TypeScript 文件生效的规则单独一个文件。
- **规则不能互相矛盾。** 冲突的指令会导致 Claude 随机选择，结果完全不可预测。

**Auto Memory 的关键设计：**

- 每次新会话只加载 MEMORY.md 的**前 200 行**，超出部分直接不读。Claude 会主动把详细内容拆到独立文件（如 `debugging.md`、`api-conventions.md`），MEMORY.md 只保留索引。
- Memory 按项目隔离，项目 A 的笔记不会出现在项目 B 里。但同一个 git 仓库的不同 worktree 共享同一份 memory。
- 所有 memory 文件都是普通 markdown，可以随时打开审查、编辑、删除。
- 不想用可以关掉：在 `/memory` 里操作，或设置环境变量 `CLAUDE_CODE_DISABLE_AUTO_MEMORY=1`。

## 你现在该做什么

三步立刻上手：

1. **在项目根目录创建 `CLAUDE.md`**，把编码规范、架构约定、工作流程写进去，提交到 git。把那些你反复解释的规则优先写入。
2. **运行 `/memory` 命令**，翻翻 Claude 已经自动积累了哪些内容。记错的删掉，有用的留下。
3. **主动告诉 Claude 需要记住的事**，比如"记住，这个项目只用 pnpm"。它会存入 Auto Memory，后续会话自动生效。

核心原则：CLAUDE.md 管规则，Auto Memory 管经验。两个配合用，Claude 就从"每次都要教的实习生"变成了"熟悉项目的老同事"。

**相关阅读**：[什么是 Claude Code](/glossary/zh/claude-code) · [AI 编程助手对比](/compare/zh/ai-coding-assistants)

---

*觉得有用？[订阅 AI 简报](/subscribe)，每天 5 分钟掌握 AI 动态。*