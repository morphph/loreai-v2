---
title: "MCP、CLI、Skills：Claude Code 扩展的三条路，80% 的人选错了"
date: 2026-03-12
slug: mcp-vs-cli-vs-skills-extend-claude-code
description: "MCP 服务器、CLI 脚本、Skills 是 Claude Code 的三种扩展机制。搞清楚什么时候该用哪个，能帮你省掉 80% 的过度工程。"
keywords: ["Claude Code 扩展", "MCP 模型上下文协议", "Claude Code Skills 技能", "AI 编程工具扩展性"]
category: DEV
related_newsletter: 2026-03-12
related_glossary: [mcp, claude-code]
related_compare: [claude-code-vs-cursor]
lang: zh
video_ready: true
video_hook: "为什么你不需要写 MCP 服务器？因为一个 Markdown 文件就够了"
video_status: none
---

# MCP、CLI、Skills：Claude Code 扩展的三条路，80% 的人选错了

**MCP**（Model Context Protocol，模型上下文协议）是 2025 年 AI 工具圈最火的关键词。但实际情况是：大多数开发者写了 200 行 MCP 服务器去做一件事——而这件事用一个 10 行的 Markdown 文件就能搞定。这很像当年微服务刚火的时候，有人给一个待办事项 App 拆了 12 个服务。**Claude Code** 有三种扩展机制，它们不是竞争关系，而是层级关系。搞清楚这个层级，是避免过度工程的关键。

## 发生了什么

Anthropic 在 2024 年 11 月[开源了 MCP 协议](https://www.anthropic.com/news/model-context-protocol)，到 2026 年初已经被 OpenAI、Google DeepMind 采纳，集成到 VS Code、JetBrains、Cursor 等 20 多个开发工具中。MCP 确实解决了一个真实问题：让 AI 工具通过统一协议访问外部数据和服务。

但与此同时，**Claude Code** 自身的扩展体系其实有三层：

- **Skills**：`.claude/commands/` 目录下的 Markdown 文件，用 `/命令名` 调用，零依赖、零运行时进程。本质是 prompt 注入——Claude Code 加载这个 Markdown 作为系统提示词。
- **CLI / Bash**：Claude Code 内置了 Bash 工具，能直接执行任何 shell 命令。`curl`、`jq`、`git`、`docker`，系统 PATH 上的一切都可用。
- **MCP 服务器**：通过 JSON-RPC 协议（stdio 或 HTTP）与 Claude Code 通信的长驻进程，支持有状态交互和跨工具互操作。

这三层的设置成本天差地别：Skill 只需 30 秒（创建一个 `.md` 文件），CLI 脚本大约 5 分钟（写个脚本加执行权限），而一个正经的 MCP 服务器需要 2-8 小时（脚手架、实现、配置、调试传输层）。

## 为什么重要

AI 工具生态正在重演"微服务泛滥"的历史。团队花几个小时搭 MCP 服务器，只为包装一个 `curl` 就能搞定的 API 调用；部署一个持久进程，只为提供一个该放在 Markdown 文件里的 Prompt 模板。

关键判断标准只有一个：**你的需求落在哪一层？**

| 需求类型 | 推荐方案 | 设置时间 |
|---------|---------|---------|
| 复用 Prompt / 工作流模板 | Skill | 30 秒 |
| 调用外部 API、执行系统命令 | CLI / Bash | 5 分钟 |
| 跨工具互操作、有状态服务 | MCP 服务器 | 2-8 小时 |

现实中大约 80% 的扩展需求落在前两类。你不需要为了让 Claude Code 跑一个 `git log --oneline` 去写 MCP 服务器——它本来就能做。你也不需要为了让它按固定格式写代码审查报告去搞 JSON-RPC 通信——一个 Skill 文件就够了。

和国内开发者的使用场景对比：如果你用 [Cursor](/glossary/cursor) 或 Windsurf 这类工具，MCP 的跨工具兼容性确实有价值，因为一个 MCP 服务器能同时服务多个 AI 编辑器。但如果你的团队主力工具就是 Claude Code，Skills 的投入产出比远高于 MCP。

## 技术细节

三种机制的架构差异值得仔细看：

**Skills** 的运行机制最简单。文件放在 `.claude/commands/foo.md`（项目级）或 `~/.claude/commands/foo.md`（全局），开发者输入 `/foo` 时，Claude Code 把文件内容注入为系统提示词。没有进程启动，没有网络调用。一个典型的 Skill 长这样：

```markdown
# 代码审查
审查当前 diff，按以下标准打分：
- 安全性（是否有注入风险）
- 可维护性（命名、结构）
- 测试覆盖
输出格式：每个问题一行，标注严重级别。
```

10 行 Markdown，团队里每个人 `/code-review` 就能用。

**CLI / Bash** 的优势在于 Claude Code 天然拥有整个 Unix 工具链。它可以直接执行 `curl -s https://api.example.com/data | jq '.items[]'`，不需要你写任何封装。如果某个操作需要反复执行，把它包成 shell 脚本放在项目的 `bin/` 目录，Claude Code 随时可调。

**MCP 服务器**是重量级方案。最小可用的 MCP 服务器需要三个组件：JSON-RPC 传输层、工具 Schema 定义（JSON Schema 格式）、处理逻辑。Node.js 或 Python 实现通常需要 50-200 行样板代码，还没算业务逻辑。但它的优势也很明确：有状态（数据库连接、会话缓存可以跨对话保持）、有类型（输入参数经过 JSON Schema 校验）、跨工具（同一个服务器能同时给 Claude Code、Cursor、VS Code Copilot 用）。

核心架构区别：Skills 和 CLI 是**无状态、短暂**的，MCP 是**有状态、持久**的。这正是 MCP 对大多数场景来说过重的原因。

## 你现在该做什么

1. **审计你现有的 MCP 服务器**。如果它只是包装一个 API 调用，换成 Skill + `curl` 指令。如果它只是提供一个 Prompt 模板，直接改成 `.claude/commands/` 下的 Markdown 文件。
2. **从 Skill 开始，而不是从 MCP 开始**。下一次你想扩展 Claude Code 的能力时，先问自己：一个 Markdown 文件能解决吗？
3. **只在三种场景用 MCP**：需要跨多个 AI 工具共享同一个扩展、需要跨对话的持久状态、需要带类型校验的复杂工具 Schema。
4. **警惕 Skill 膨胀**。不要把所有可复用的 Prompt 都塞进 `.claude/commands/`——保持命名清晰，定期清理不用的 Skill。
5. **关注 [MCP 协议规范](https://modelcontextprotocol.io/specification)的演进**。协议仍在快速迭代，远程 MCP 服务器和认证机制还在完善中。

**相关阅读**：[今日简报](/newsletter/2026-03-12) 有更多 Claude Code 动态。另见：[MCP 协议](/glossary/mcp) 术语解释。

---

*觉得有用？[订阅 AI 简报](/subscribe)，每天 5 分钟掌握 AI 动态。*
