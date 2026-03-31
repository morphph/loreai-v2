---
title: CLAUDE.md 是什么？
slug: what-is-claude-md
description: CLAUDE.md 是放在项目根目录的配置文件，让 Claude Code 每次启动时自动读取你的编码规范、构建命令和项目上下文，不用反复交代。
category: tools
related_glossary:
  - claude-md
  - claude-code
  - agentic-coding
related_blog:
  - claude-code-memory
  - claude-code-extension-stack-skills-hooks-agents-mcp
lang: zh
related_topics:
  - claude-code
---

# CLAUDE.md 是什么？

[CLAUDE.md](/zh/blog/claude-code-memory) 是一个 Markdown 文件，放在项目根目录下，[Claude Code](/zh/blog/9-principles-writing-claude-code-skills) 每次启动都会自动读取。它相当于给 AI 助手写的一份持久化指令集，包含你的编码规范、构建命令、架构约束和项目注意事项，省得每次开新会话都要重新解释一遍。

## 背景

用过 [Claude Code](/glossary/claude-code) 的人都知道一个痛点：[agentic coding](/glossary/agentic-coding) 工具在会话之间不保留上下文。你上次跟它说的"别改 legacy 目录""测试用 Vitest 不是 Jest""commit message 写英文"，下次全忘了。[CLAUDE.md](/glossary/claude-md) 就是为了解决这个问题——给 AI agent 一个稳定的信息源，让它每次上来就知道该怎么干活。

你可以把它理解成给 AI 看的 README。一个典型的 CLAUDE.md 会包含：构建和测试命令、代码风格要求、架构决策、已知坑点、工作流规则。它还支持层级结构——全局的 `~/.claude/CLAUDE.md` 对所有项目生效，项目级的只对当前仓库生效。关于 Claude Code 记忆系统的完整机制，可以看我们的[深度解析](/blog/claude-code-memory)。

这种"配置优先于逐次提示"的思路，是 [agentic coding](/zh/glossary/agentic-coding) 领域的大趋势。更多关于 Claude Code 扩展能力的内容，参见[扩展体系完整指南](/blog/claude-code-extension-stack-skills-[hooks](/zh/blog/claude-code-seven-programmable-layers)-agents-[mcp](/zh/glossary/mcp))。

## 实用步骤

1. 在项目根目录创建 `CLAUDE.md` 文件
2. 最上面写构建和测试命令，让 agent 能自己验证改动
3. 写明代码风格、命名规范和架构约束
4. 列出项目特有的坑和常见错误
5. 保持精简——agent 每次会话都要读，信息密度比长度更重要
6. 如果有跨项目通用的规则，放到全局配置 `~/.claude/CLAUDE.md` 里

## 相关问题

- [什么是 Claude Code？](/faq/what-is-claude-code)
- [Claude Code Skills 是什么？](/faq/claude-code-skills)
- [Claude Code 怎么配合 Git 使用？](/faq/claude-code-with-git)

---

*觉得有用？[订阅 LoreAI](/subscribe)，每天 5 分钟掌握 AI 动态。*
