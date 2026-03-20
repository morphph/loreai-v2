---
title: "Claude Code Skills 是什么？"
slug: claude-code-skills
description: "Claude Code Skills 是存放在项目 skills 目录中的可复用提示词模板，通过斜杠命令调用，让团队统一处理代码审查、提交、测试等重复任务。"
category: tools
related_glossary: [claude-code, claude-md, agentic-coding]
related_blog: [claude-code-simplify-batch-skills, claude-code-extension-stack-skills-hooks-agents-mcp]
lang: zh
---

# Claude Code Skills 是什么？

Claude Code Skills 是一套可复用的提示词模板机制，以文件形式存放在项目的 skills 目录中。每个 skill 定义一个具体工作流，比如代码审查、提交格式化、测试生成等，通过斜杠命令（如 /commit、/review-pr）直接调用。它解决的核心问题是让团队里每个人用 Claude Code 做同一件事时，都能得到一致且高质量的输出。

## 背景

当团队开始大规模使用 [Claude Code](/glossary/claude-code) 之后，一个很现实的问题浮出水面：同样是让 AI 审查代码，张三写的提示词得到详细的逐行分析，李四写的提示词只拿到一句"看起来没问题"。差异不在 AI 的能力，而在提示词的质量。

Skills 的思路是把经过验证的提示词沉淀为文件，放在 `skills/` 目录下通过版本控制共享。可以理解为"经过实战检验的配方"——团队发现某个工作流的最佳提示词之后，编码成 skill 文件，所有人直接复用。这和 [CLAUDE.md](/glossary/claude-md) 共同构成了 [Claude Code 扩展体系](/blog/claude-code-extension-stack-skills-hooks-agents-mcp)的核心部分。

每个 skill 文件包含结构化的提示词模板和上下文占位符。调用时，Claude Code 加载模板、填入当前项目的上下文信息，然后执行整个工作流。这种 [agentic coding](/glossary/agentic-coding) 方式比依赖个人 prompt 工程能力的扩展性好得多。完整的 Claude Code 能力图谱可参考[完整指南](/blog/claude-code-complete-guide)。

## 实用步骤

1. **创建 skills 目录**：在项目根目录下新建 `skills/` 文件夹
2. **编写 skill 文件**：创建 markdown 文件（如 `skills/review-pr/prompt.md`），写入提示词模板，包括指令和期望的输出格式
3. **用斜杠命令调用**：在 Claude Code 会话中输入对应的斜杠命令（如 `/review-pr`）即可触发
4. **迭代优化，不要重写**：基于实际使用反馈微调现有 skill，小的提示词改进会随时间累积出显著效果
5. **跨项目共享**：把验证过的 skill 复制到其他仓库，或维护一个组织级别的共享 skills 库

关于 simplify 和 batch 两种进阶 skill 模式的实际案例，参考 [simplify 与 batch skills 详解](/blog/claude-code-simplify-batch-skills)。更多资源见 [Claude Code 专题页](/topics/claude-code)。

## 相关问题

- [Claude Code 怎么接入 CI/CD？](/faq/claude-code-ci-cd)
- [Claude Code 怎么安装？](/faq/how-to-install-claude-code)

---

*觉得有用？[订阅 LoreAI](/subscribe)，每天 5 分钟掌握 AI 动态。*