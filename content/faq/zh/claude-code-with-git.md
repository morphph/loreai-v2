---
title: "Claude Code 怎么配合 Git 使用？"
slug: claude-code-with-git
description: "Claude Code 原生集成 Git，能自动暂存文件、写 commit message、建分支、解 merge conflict、开 pull request，全流程不用手动操作。"
category: tools
related_glossary: [claude-code, agentic-coding, claude-md]
related_blog: [claude-code-complete-guide, claude-code-review-agents, claude-code-agent-teams]
lang: zh
related_topics: [claude-code]
---

# Claude Code 怎么配合 Git 使用？

Claude Code 内置了完整的 Git 集成，能处理整个 Git 工作流。它会根据实际代码改动自动 stage 文件、写 commit message、建分支切分支、解 merge conflict，甚至能直接用 GitHub CLI 帮你开 pull request。

## 背景

[Claude Code](/glossary/claude-code) 作为[智能编程](/glossary/agentic-coding)工具的一大优势就是它直接跑在终端里，Git 在哪它就在哪。跟 IDE 里那些在沙盒环境运行的 AI 助手不同，Claude Code 执行的是真实的 Git 命令，能看到仓库的完整状态——diff、log、分支历史、远程状态，全都一清二楚。

这让 Claude Code 在处理那些繁琐的 Git 操作时特别高效。手动解一个 merge conflict 可能要好几分钟，Claude 读完冲突双方的代码和上下文，几秒钟就搞定了。commit message 是根据真实 diff 生成的，不是猜的。你还可以在 [CLAUDE.md](/glossary/claude-md) 文件里定义 Git 工作流规范，比如 commit message 格式、分支命名规则，Claude 会自动遵守。

团队协作方面，Claude Code 的 [code review agent](/blog/claude-code-review-agents) 可以自动审查 PR，[agent 团队](/blog/claude-code-agent-teams)能同时在多个分支上并行工作。更多高级 Git 用法可以看 [Claude Code 完全指南](/blog/claude-code-complete-guide)。

## 实用步骤

1. 在任意 Git 仓库里运行 `claude`，启动带有完整仓库感知的会话。
2. 让 Claude 帮你 commit：它会自动 review diff、stage 相关文件、写出描述准确的 commit message。
3. 遇到 merge conflict 直接让 Claude 解，它会读取冲突双方和 base 版本来做判断。
4. 要开 PR 也直接说，Claude 会用 `gh`（GitHub CLI）创建 PR 并自动生成摘要。
5. 在项目的 `CLAUDE.md` 里写上你们团队的 Git 规范，Claude 会自动遵守。更多工作流模式可以浏览 [Claude Code 专题页](/topics/claude-code)。

## 相关问题

- [Claude Code 是什么？](/faq/what-is-claude-code)
- [怎么安装 Claude Code？](/faq/how-to-install-claude-code)
- [Claude Code 多少钱？](/faq/how-much-does-claude-code-cost)

---

*觉得有用？[订阅 LoreAI](/subscribe)，每天 5 分钟掌握 AI 动态。*
