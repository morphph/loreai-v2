---
title: "Claude Code Remote vs SSH：远程开发该怎么选？"
slug: claude-code-remote-vs-ssh
description: "Claude Code Remote 与 SSH 远程开发对比：功能、适用场景与选择建议。"
item_a: Claude Code Remote
item_b: SSH
category: tools
related_glossary: [agentic-coding]
related_blog: [google-colab-mcp-server-cloud-gpu-ai-agents]
lang: zh
---

# Claude Code Remote vs SSH：远程开发该怎么选？

**Claude Code Remote** 是 Anthropic 推出的云端远程开发方案——你可以在浏览器、手机或桌面端启动一个 Claude Code 会话，无需本地环境配置，直接对远程仓库进行编码、调试和提交。**SSH** 则是存在数十年的远程连接标准协议，开发者通过终端登录远程服务器，在服务器上运行编辑器和工具链。两者解决的核心问题相同：让你不在本地也能写代码。但实现路径截然不同——一个是 AI 原生的云端代理，一个是通用的远程 shell 通道。

## 功能对比

| 特性 | Claude Code Remote | SSH |
|------|-------------------|-----|
| **连接方式** | 浏览器 / iOS 应用 / 桌面端 / CLI `/teleport` | 终端 SSH 客户端 |
| **环境配置** | 零配置，云端托管 | 需手动配置服务器环境 |
| **AI 编码能力** | 内置 Claude 代理，自动读写代码、运行命令 | 无内置 AI，需额外安装工具 |
| **跨设备切换** | 原生支持——手机开始、电脑接手 | 需 tmux/mosh 等工具辅助 |
| **项目上下文** | 自动读取 CLAUDE.md、[MCP](/glossary/agentic-coding) 配置 | 依赖手动维护的配置文件 |
| **协议开放性** | Anthropic 专有平台 | 开放标准，任何服务器都支持 |
| **离线可用** | 否，依赖网络连接 | 可通过 mosh 保持断线重连 |
| **适用范围** | 编码任务为主 | 任意远程操作（运维、部署、调试等） |

## 什么时候用 Claude Code Remote

当你的核心需求是**远程 AI 辅助编码**，Claude Code Remote 是更顺滑的选择：

- **没有本地开发环境时**：出差途中用浏览器或手机打开 [claude.ai/code](https://claude.ai/code)，对着仓库提需求，Claude 自动完成代码修改并提交。参考我们对 [云端 GPU 与 AI 代理协作](/blog/google-colab-mcp-server-cloud-gpu-ai-agents)的分析，无本地环境的开发正在成为趋势。
- **长时间运行任务**：在网页端启动一个大规模重构任务，关掉浏览器去开会，回来查看结果。这是传统 SSH + 编辑器难以匹敌的体验。
- **跨设备无缝切换**：用 `/teleport` 命令把终端会话转移到桌面应用，或反过来在手机上继续。无需 tmux attach、无需记住 session 名。

Claude Code Remote 最大的优势在于**零配置**——你不需要在远程机器上安装任何东西，所有 AI 能力和项目上下文（CLAUDE.md、SKILL.md、MCP 服务器）都由平台托管。

## 什么时候用 SSH

SSH 的适用场景远比编码广泛，而且在某些方面仍然不可替代：

- **服务器运维与基础设施管理**：部署应用、排查生产事故、管理容器——这些操作需要对远程机器的完全控制权，SSH 提供的是一个真正的 shell，不是一个受限的代理环境。
- **网络受限或安全合规环境**：企业内网、涉密服务器、无法使用第三方云服务的场景，SSH 是唯一选项。它是开放标准，不依赖任何商业平台。
- **自定义工具链**：如果你的开发工作流深度依赖 Vim/Neovim、tmux、自定义脚本等终端工具，SSH 直接提供完整的远程 shell 环境，没有任何抽象层。
- **离线与弱网环境**：搭配 mosh 使用，SSH 连接可以在网络中断后自动恢复，而云端服务在断网时完全不可用。

## 结论

如果你的目标是**远程写代码并希望 AI 代理全程辅助**，Claude Code Remote 提供了更现代、更低摩擦的体验——尤其适合跨设备、无本地环境的场景。如果你需要**通用的远程服务器访问**，或者工作在网络受限的环境中，SSH 仍然是基础设施级别的标准工具，没有替代品。

对多数开发者来说，两者并非二选一：用 SSH 管理服务器和基础设施，用 Claude Code Remote 处理 AI 辅助编码任务，各取所长。更多关于 Claude Code 的能力详解，参见 [Claude Code 专题页](/topics/claude-code)。

---

*觉得有用？[订阅 LoreAI](/subscribe)，每天 5 分钟掌握 AI 动态。*