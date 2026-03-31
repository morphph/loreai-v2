---
title: Claude Code 远程会话：用手机启动笔记本上的编程任务
date: 2026-03-17T00:00:00.000Z
slug: claude-code-remote-sessions-phone
description: Claude Code 现在支持从手机远程启动笔记本电脑上的编程会话。这意味着什么？AI 编程工具正在突破桌面的边界。
keywords:
  - Claude Code 远程会话
  - Claude Code 手机
  - AI 编程工具
category: DEV
related_newsletter: 2026-03-17T00:00:00.000Z
related_glossary:
  - claude-code
related_compare:
  - claude-code-vs-cursor
lang: zh
video_ready: true
video_hook: 躺在沙发上用手机就能让 AI 帮你写代码，Claude Code 做到了
video_status: none
---

# Claude Code 远程会话：用手机启动笔记本上的编程任务

**[Claude Code](/zh/blog/9-principles-writing-claude-code-skills)** 现在支持从手机远程启动笔记本电脑上的编程会话。Anthropic 工程师 Boris Cherny [在推特上宣布](https://x.com/bcherny/status/2032578639276159438)了这个功能。这不只是一个便利性更新 — 它意味着 AI 编程助手正在从"桌面工具"进化为"随时随地可调度的编程代理"。如果你正在用 Claude Code，这个功能会改变你和它的协作方式。

## 发生了什么

Anthropic 推出了 Claude Code 的远程会话功能，允许用户从手机端发起指令，在笔记本电脑上启动并运行完整的 [Claude Code](/glossary/claude-code) 编程会话。

具体来说，你可以在手机上描述任务 — 比如"重构 auth 模块的错误处理"或"给 API 加上 rate limiting" — Claude Code 会在你的笔记本上启动会话，访问本地代码库，执行文件读写、测试运行等操作。你不需要打开笔记本的盖子。

这个功能发布的时间点很有意思。过去一周 Anthropic 密集更新了 Claude Code 的能力：多代理 [Code Review 系统](https://x.com/adocomplete/status/2031083611546591499)上线，内置了 `/loop` 定时调度器，Claude 聊天界面也新增了交互式图表生成。再加上 Anthropic 刚刚宣布[周末和非高峰时段使用量翻倍](https://x.com/bcherny/status/2032922838751928407)的促销 — 很明显，他们在全力推动 Claude Code 成为开发者的默认工作环境。

## 为什么重要

远程会话看起来是个小功能，但它触及了一个根本性的问题：**AI 编程代理的触发方式**。

目前主流的 AI 编程工具 — 无论是 [Cursor](/zh/glossary/cursor)、[GitHub Copilot](/zh/glossary/github-[copilot](/zh/glossary/copilot)) 还是 Claude Code — 都要求你坐在电脑前，打开编辑器或终端，才能开始工作。这是桌面软件时代的思维。

而远程会话打破了这个限制。通勤路上想到一个 bug 的修复思路？掏出手机，让 Claude Code 在你的开发机上跑起来。周末遛狗时突然想到 API 需要加个字段？一条消息搞定。等你回到电脑前，代码已经写好、测试已经跑完。

这和 OpenAI 的 [Codex](/zh/blog/codex-complete-guide) 走的是类似的路线 — 异步、可调度的编程代理 — 但 Claude Code 的优势在于它直接运行在你的本地环境里，能访问真实的文件系统、数据库和工具链，而不是在云端沙箱里猜你的项目结构。

对团队来说，这也意味着代码审查和任务分配的方式可能改变。Tech Lead 可以在手机上快速发起"帮我审一下这个 PR"，Claude Code 的[多代理审查系统](https://x.com/adocomplete/status/2031083611546591499)会在后台完成深度分析。

## 技术细节

虽然 Anthropic 尚未公开完整的技术文档，但从已有信息可以推断远程会话的工作方式：

1. **持久化守护进程**：笔记本上需要运行一个 Claude Code 后台服务，保持与 Anthropic 服务器的连接
2. **手机端下发指令**：通过 Anthropic 的移动端界面（可能是 Claude App）发送任务描述
3. **本地执行**：Claude Code 在笔记本上拥有完整的文件系统访问权限，执行代码生成、测试、Git 操作等

这种架构和纯云端方案（如 Codex）的关键区别在于：你的代码不需要上传到任何第三方服务器。对于处理敏感代码的企业团队，这是一个重要的安全考量。

结合最近上线的 `/loop` 调度器，你甚至可以设置定时任务：每天早上 Claude Code 自动拉取最新代码、跑测试、生成报告 — 这已经很接近一个真正的 AI 团队成员了。

需要注意的是，远程会话的前提是你的笔记本必须开机且联网。如果你需要完全离线的异步执行，目前可能还是需要用云端 CI/CD 方案配合。

## 你现在该做什么

1. **确保你的 Claude Code 是最新版本**。运行 `claude update` 检查更新，远程会话功能可能需要最新的客户端。
2. **配置好你的 CLAUDE.md 和 Skills**。远程发起的会话更依赖预设规则 — 你不在电脑前，没法实时纠偏，所以项目配置必须到位。
3. **尝试小任务先**。别一上来就远程发起大规模重构。从"跑一下测试"、"格式化这个文件"这样的低风险任务开始，熟悉工作流。
4. **关注安全设置**。远程执行意味着你需要认真审视 Claude Code 的权限范围 — 哪些操作需要确认，哪些可以自动执行。
5. **关注 Anthropic 的后续文档**。这个功能刚发布，完整的使用指南和最佳实践应该很快会跟上。

**相关阅读**：[今日简报](/newsletter/2026-03-17) 有更多 Claude Code 生态更新。另见：[Claude Code 完全指南](/blog/claude-code-comprehensive-guide)。

---

*觉得有用？[订阅 AI 简报](/subscribe)，每天 5 分钟掌握 AI 动态。*
