---
title: "Claude Code 新技能 /simplify 和 /batch：代码审查和批量操作的效率飞跃"
date: 2026-03-08
slug: claude-code-simplify-batch-skills
description: "Claude Code 即将上线 /simplify 和 /batch 两个内置 Skills，分别解决代码精简和批量文件操作的痛点。实测体验和使用建议。"
keywords: ["Claude Code skills", "/simplify", "/batch", "Claude Code 新功能", "AI 编程工具"]
category: DEV
related_newsletter: 2026-03-08
related_glossary: [claude-code, skill-md]
related_compare: [claude-code-vs-cursor]
lang: zh
video_ready: true
video_hook: "Claude Code 两个新 Skill，让 PR 从提交到合并快一倍"
video_status: none
---

# Claude Code 新技能 /simplify 和 /batch：代码审查和批量操作的效率飞跃

**Claude Code** 团队宣布下一版本将内置两个新 Skills：**/simplify** 和 **/batch**。前者自动审查代码变更，精简冗余、提升质量；后者对多个文件批量执行同一操作。这两个功能直击日常开发中最耗时的两个环节 — 把 PR 打磨到可合并状态，以及在大量文件上重复执行相似操作。如果你每天都在用 Claude Code 写代码，这两个 Skill 会显著改变你的工作流。

## 发生了什么

Claude Code 工程负责人 Boris Cherny 在推特上[宣布](https://x.com/bcherny/status/2027534984534544489)，下一版本的 Claude Code 将引入 `/simplify` 和 `/batch` 两个内置 [Skills](/glossary/skill-md)。他表示自己已经每天都在使用这两个功能。

**/simplify** 的定位是代码精简助手。当你完成一轮开发后，执行 `/simplify`，Claude Code 会审查你的变更，寻找可以复用的模式、可以提升的代码质量问题，以及可以优化的效率瓶颈，然后自动修复。本质上，它把 Code Review 中最机械的部分自动化了。

**/batch** 则解决批量操作问题。当你需要对项目中的多个文件执行类似的修改 — 比如批量更新 import 路径、统一错误处理模式、给多个组件加上相同的 props — `/batch` 让你描述一次操作，然后批量应用。

这两个 Skill 随 [Claude Code](/glossary/claude-code) 内置发布，不需要手动配置 `skills/` 目录，开箱即用。

值得注意的时间点：这个发布恰好在 Claude Code 一周年之际。Boris 同时提到，目前 GitHub 上 4% 的公开提交来自 Claude Code，这个数字还在快速增长。

## 为什么重要

写代码和把代码送上生产之间，隔着大量的打磨工作。重命名不一致的变量、抽取重复逻辑、简化过度设计的抽象、统一错误处理 — 这些工作重要但枯燥，占据了 PR 从提交到合并的大部分时间。`/simplify` 把这个环节从手动审查变成了一键操作。

`/batch` 解决的则是另一个痛点：大规模重构。在一个几百个文件的项目里，把所有 `console.log` 换成结构化日志，或者给所有 API 路由加上统一的错误处理，传统做法要么写脚本，要么用 IDE 的查找替换再逐个检查。`/batch` 让你用自然语言描述意图，AI 理解语义后批量执行。

从竞品角度看，[Cursor](/glossary/cursor) 和 GitHub Copilot 目前都没有类似的内置工作流 Skill。Cursor 的 Tab 补全和 Cmd+K 编辑聚焦在单点操作，没有"审查整个 PR 并优化"这个粒度的功能。`/simplify` 和 `/batch` 让 Claude Code 在工作流层面拉开了差距。

更深层的意义在于，这证明了 Skills 系统的可扩展性。Anthropic 不只是把 Skills 作为用户自定义的配置机制，还在用它来交付官方的工作流功能。未来大概率会看到更多内置 Skill。

## 技术细节

从已有的 [SKILL.md 规范](/glossary/skill-md)推断，`/simplify` 和 `/batch` 的实现应该遵循同样的架构：Markdown 文件定义行为规则，Claude Code 运行时加载并执行。

**/simplify** 的工作流大致是：

1. 读取当前 Git diff（未提交的变更或指定的 PR）
2. 逐文件分析：是否有重复代码可抽取、命名是否一致、是否有不必要的复杂度
3. 生成修改建议并自动应用
4. 用户确认后提交

这和手动写 Code Review 提示词的区别在于，内置 Skill 经过大量的 Prompt 工程优化，知道哪些模式值得改、哪些改动是过度优化。Boris 提到他"每天都在用"，说明经过了充分的内部测试。

**/batch** 的核心挑战是保持语义一致性。简单的文本替换用 `sed` 就能搞定，但如果你要"把所有错误处理从 try-catch 改成 Result 类型"，每个文件的上下文不同，需要 AI 逐个理解再修改。`/batch` 的价值在于它能处理这类需要语义理解的批量操作。

目前已知的限制：这两个 Skill 还在下一版本中，具体的参数配置（比如 `/simplify` 的激进程度、`/batch` 的并发策略）尚未公开。预计会随正式发布一起出文档。

对于已经在用自定义 Skills 的团队，官方内置 Skill 的优先级通常高于用户自定义 Skill。如果你有自己的 `skills/simplify/SKILL.md`，可能需要在正式发布后调整命名以避免冲突。

## 你现在该做什么

1. **关注 Claude Code 更新**。`/simplify` 和 `/batch` 在下一版本发布，确保你的 Claude Code 保持最新。
2. **现在就可以用自定义 Skill 模拟类似功能**。在 `skills/` 目录下创建你自己的代码审查 Skill，定义你团队的质量标准和常见问题模式。官方版本发布后可以做对比。
3. **梳理你的批量操作需求**。想想过去一个月你做过哪些"对很多文件做类似修改"的工作，这些都是 `/batch` 上线后的第一批使用场景。
4. **如果还没用 Claude Code 的 Skills 系统，现在是最好的入门时机**。从 [SKILL.md 文档](https://docs.anthropic.com/claude-code/skills)开始，先写一个最简单的 Skill 跑通流程。

**相关阅读**：[今日简报](/newsletter/2026-03-08) 有更多 Claude Code 生态动态。另见：[Claude Code Skills 系统完全指南](/blog/claude-code-skills-guide)。

---

*觉得有用？[订阅 AI 简报](/subscribe)，每天 5 分钟掌握 AI 动态。*