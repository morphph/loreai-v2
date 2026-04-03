---
title: "Claude Code 支持 Computer Use（计算机操控）吗？"
slug: claude-code-computer-use
description: "Claude Code 本身专注终端操作，Anthropic 另有 Computer Use API 支持 GUI 控制。了解两者区别与适用场景。"
category: tools
related_glossary: [agentic-coding]
related_blog: [anthropic-cowork-claude-desktop-agent, claude-code-is-not-a-coding-tool, claude-code-seven-programmable-layers]
related_compare: []
related_topics: [claude-code]
lang: zh
---

# Claude Code 支持 Computer Use（计算机操控）吗？

**Claude Code** 本身不提供 Computer Use（图形界面操控）功能——它是一个终端代理，通过 shell 命令、文件读写和 Git 操作完成工程任务，不直接控制鼠标或窗口。Anthropic 将 GUI 交互能力单独封装在 **Computer Use API** 中，两者定位不同。

## 背景说明

这个问题频繁出现，因为 Anthropic 同时拥有两套"操控电脑"的技术路线，容易混淆。

**Claude Code** 的交互界面是终端。它能运行构建工具、测试套件、linter，能跨文件重构代码并自动提交——但所有操作都通过命令行完成。如果你想让 AI 帮你写代码、跑测试、推代码，Claude Code 就够了。关于它的能力边界，可以参考《Claude Code 不是一个编程工具》这篇文章，里面对其本质有清晰的重新定位。

**Computer Use** 则是另一回事：它让 Claude 能"看见"屏幕截图，并模拟鼠标点击、键盘输入来操作 GUI 应用。这套能力通过 Anthropic 的 API 独立提供，适合自动化浏览器操作、表单填写、桌面软件控制等场景。

2026 年初，Anthropic 推出了 Cowork 功能，让 Claude Desktop 也具备了一定的桌面代理能力——不写代码也能操作文件，是 Computer Use 思路在桌面端的延伸。

如果你的需求是纯工程任务，Claude Code 已经足够；如果需要操控 GUI，参考 Computer Use API 文档或关注 Claude Desktop 的代理功能更新。

关于 Claude Code 七层架构的完整能力图谱，可参考这篇深度解析。

## 相关问题

- Claude Code 是什么？
- 如何搭建 Claude Code MCP 服务器？

---

*觉得有用？[订阅 LoreAI](/subscribe)，每天 5 分钟掌握 AI 动态。*