---
title: Claude Code 能在 Windows 上用吗？
slug: claude-code-windows
description: >-
  Claude Code 不支持原生 Windows，需要通过 WSL2（Windows 子系统 Linux）来运行，装好 WSL2 后体验跟
  Mac/Linux 一样。
category: tools
related_glossary:
  - claude-code
  - anthropic
  - agentic-coding
related_blog:
  - claude-code-complete-guide
  - claude-code-remote-control-mobile
lang: zh
related_topics:
  - claude-code
---

# Claude Code 能在 Windows 上用吗？

[Claude Code](/zh/blog/9-principles-writing-claude-code-skills) 不能直接在 Windows 上跑，它依赖 Unix 环境。Windows 用户需要先装 WSL2（Windows Subsystem for Linux），装好之后使用体验跟 macOS 和 Linux 完全一样，没有任何功能限制。

## 背景

[Claude Code](/glossary/claude-code) 是一个基于终端的[智能编程](/glossary/agentic-coding)工具，由 [Anthropic](/glossary/anthropic) 开发，底层依赖 Unix shell 来操作文件和执行命令。Windows 的 PowerShell 和 CMD 是完全不同的 shell 体系，所以没法直接兼容。

好消息是 WSL2 提供了一个完整的 Linux 内核运行在 Windows 里，Claude Code 需要的环境它全有。实际上 Anthropic 官方推荐的就是这条路线，而且很多 Windows 开发者本来就在用 WSL2 做 Node.js 开发。WSL2 的文件系统在 Windows 资源管理器里直接能看到，VS Code 也原生支持 WSL2，工作流很顺畅。

如果不想装 WSL2，还有一条路：把 Claude Code 跑在远程服务器上，通过[远程控制功能](/blog/claude-code-remote-control-mobile)或 headless 模式来连接。这样不管什么设备都能用，Windows、平板、手机都行。完整的配置方案可以看 [Claude Code 完全指南](/blog/claude-code-complete-guide)。

## 实用步骤

1. 以管理员身份打开 PowerShell，运行 `wsl --install`。
2. 按提示重启电脑。
3. 启动 WSL2，设置 Linux 发行版（默认 Ubuntu，够用了）。
4. 在 WSL2 终端里安装 Node.js 18+：`curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash - && sudo apt-get install -y nodejs`。
5. 安装 Claude Code：`npm install -g @anthropic-ai/claude-code`。
6. 进入项目目录，输入 `claude` 开始使用。

## 相关问题

- [怎么安装 Claude Code？](/faq/how-to-install-claude-code)
- [Claude Code 是什么？](/faq/what-is-claude-code)
- [Claude Code 免费吗？](/faq/is-claude-code-free)

---

*觉得有用？[订阅 LoreAI](/subscribe)，每天 5 分钟掌握 AI 动态。*
