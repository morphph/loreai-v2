---
title: "Claude Code Agent Teams 怎么用？"
slug: claude-code-agent-teams
description: "Claude Code Agent Teams 让主 Agent 派发多个子 Agent 并行工作，适用于批量文件生成、跨模块重构、并行测试等大规模任务场景。"
category: tools
related_glossary: [claude-code, agent-teams, multi-agent-systems]
related_blog: [claude-code-agent-teams, claude-code-extension-stack-skills-hooks-agents-mcp]
lang: zh
---

# Claude Code Agent Teams 怎么用？

Claude Code Agent Teams 是一种多 Agent 协作模式：一个主 Agent 负责拆解任务并分派给多个子 Agent，子 Agent 各自独立并行执行，完成后由主 Agent 汇总合并结果。这种模式特别适合需要同时处理多个文件、并行跑测试、或者对整个代码库做重构的大型任务。

## 背景

单个 Agent 处理任务有天然瓶颈——让一个 Agent 依次处理二十个文件，不仅慢，而且随着上下文窗口被撑满，后面的输出质量会明显下降。[Agent Teams](/glossary/agent-teams) 通过引入并行机制突破了这个上限。

这个概念源自 [多 Agent 系统](/glossary/multi-agent-systems)的研究，但在 [Claude Code](/glossary/claude-code) 中被做成了一个非常实用的实现。没有复杂的 Agent 间协商协议，就是简单直接的"主 Agent + 工作 Agent"模式。主 Agent 分析任务、拆分为独立的工作单元，然后给每个子 Agent 下达明确的指令。每个子 Agent 在自己独立的上下文中工作，职责边界清晰。

典型场景包括：批量 FAQ 页面生成（每个页面由独立 Agent 撰写）、跨文件重构（每个模块独立处理）、并行代码审查（测试、逻辑、文档分别由不同 Agent 审查）。详细的生产环境实践可参考 [Agent Teams 深度解读](/blog/claude-code-agent-teams)。关于 Agent Teams 如何与 Skills、Hooks、MCP 协同工作，参见[扩展体系指南](/blog/claude-code-extension-stack-skills-hooks-agents-mcp)和 [Claude Code 完整指南](/blog/claude-code-complete-guide)。

## 实用步骤

1. **确定任务拆分方式**：找出任务中哪些部分是互相独立的、可以并行执行——文件边界、测试套件、功能模块都是天然的拆分点
2. **使用 Task 工具**：主 Agent 通过 Task 工具派发子 Agent，给每个子 Agent 指定明确的指令和文件访问范围
3. **控制子 Agent 的职责范围**：每个子 Agent 应该有清晰的边界——生成一个文件、审查一个模块、或者跑一类测试
4. **由主 Agent 负责合并**：主 Agent 收集所有子 Agent 的输出，解决可能的冲突，确保最终结果的一致性
5. **提前定好约束**：在主 Agent 的指令中明确输出格式、命名规范和质量标准，这样子 Agent 产出的结果才能无缝拼合

关于如何为长时间运行的 Agent Teams 构建可靠的管理框架，参考[长时间运行 Agent 的有效框架](/blog/effective-harnesses-for-long-running-agents)。更多资源见 [Claude Code 专题页](/topics/claude-code)。

## 相关问题

- [Claude Code Skills 是什么？](/faq/claude-code-skills)
- [Claude Code 怎么接入 CI/CD？](/faq/claude-code-ci-cd)
- [Claude Code 是什么？](/faq/what-is-claude-code)

---

*觉得有用？[订阅 LoreAI](/subscribe)，每天 5 分钟掌握 AI 动态。*