---
title: "Codex CLI 完全上手指南：从安装到实战"
slug: guide-to-codex-cli
description: "Codex CLI 的完整使用指南：安装配置、ChatGPT 套餐绑定、命令行工作流与实战技巧，帮你快速掌握这款编程 Agent。"
lang: zh
category: tools
related_glossary:
  - agentic-coding
  - agent-sdk
  - model-context-protocol
related_blog:
  - first-few-days-with-codex-cli
  - codex-complete-guide
  - codex-vscode
related_compare: []
related_topics: [codex]
---

# Codex CLI 完全上手指南：从安装到实战

**Codex CLI** 是 OpenAI 推出的命令行编程 Agent，直接运行在你的终端里。它不是代码补全工具，而是一个能读懂你的项目结构、执行多步任务、修改多个文件的自主 Agent。如果你刚接触 Codex CLI，这篇指南帮你跳过踩坑阶段，直接进入生产状态。

## 为什么我喜欢 CLI 这种方式

很多人第一反应是：为什么不用 VS Code 扩展？原因很简单——CLI 更干净。

你不需要管 IDE 状态、不需要担心插件冲突，一个终端窗口就是全部上下文。对于跨多个文件的重构任务、批量生成测试、或者自动化脚本，CLI 的管道式思维更贴近工程师的实际工作流。如果你用过 [Claude Code](zh/blog/claude-code-is-not-a-coding-tool)，会发现这套逻辑是一致的：把 AI 当成一个能执行命令的同事，而不是一个只会提示的自动补全。

如果你更偏好 IDE 环境，Codex VS Code 扩展是另一个选项，但 CLI 在自动化工作流中的灵活性明显更高。

## 安装与初始化

```bash
npm install -g @openai/codex
codex --version
```

安装后，配置 API Key：

```bash
export OPENAI_API_KEY=your_key_here
```

如果你使用 ChatGPT Plus 或 Pro 套餐，Codex CLI 可以绑定你的 ChatGPT 账户额度——这意味着你不需要单独购买 API 额度，直接用订阅权益即可。在 OpenAI 设置页面关联账号后，CLI 会自动识别对应套餐的 Codex 使用额度。

## 基础用法：用 Input Prompt 跑起来

最直接的方式是传入一个 `--input` 提示词：

```bash
codex --input "帮我写一个读取 CSV 并按日期排序输出的 Python 脚本"
```

Codex CLI 会分析请求，规划步骤，然后在你的工作目录下执行。每一步操作都会展示给你确认，你可以选择批准或拒绝。

几个实用参数：

- `--approval-mode auto-edit`：自动批准文件编辑，但执行命令仍需确认
- `--approval-mode full-auto`：完全自动（适合 CI/CD 场景）
- `--quiet`：减少输出噪音，只显示关键操作

对于重复性任务，可以把常用提示词存成 shell 脚本或 Makefile 命令，配合 `--input` 参数复用。

## 在真实项目中的工作流

**场景一：快速生成测试**

```bash
codex --input "为 src/utils/format.ts 里的所有函数生成 Jest 单元测试"
```

Codex CLI 会读取文件内容，理解函数签名，生成对应测试文件，并自动写入 `__tests__` 目录。

**场景二：多文件重构**

```bash
codex --input "把项目里所有用 var 声明的变量改成 const 或 let，保持语义不变"
```

这类全局性修改用传统搜索替换容易出错，Codex CLI 能理解上下文后做出正确判断。

**场景三：生成 README 文档**

```bash
codex --input "根据项目结构和 package.json，生成一份完整的 README.md"
```

如果你在多 Agent 工作流中使用 Codex，可以参考为多智能体工作流而生：OpenAI Codex 的工程范式革命，了解更复杂的编排模式。

## 上下文控制：让 Codex 了解你的项目

Codex CLI 会自动读取工作目录下的项目文件，但你可以通过 `AGENTS.md` 文件（类似 Claude Code 的 `CLAUDE.md`）提供项目级别的指令——技术栈说明、编码规范、禁止修改的文件路径等。

这个文件放在项目根目录，Codex CLI 每次启动时会优先加载。越具体越好：与其写"遵循最佳实践"，不如写"使用 ESLint airbnb 规范，测试覆盖率不低于 80%"。

关于 agentic coding 的上下文管理思路，这套逻辑在不同工具间是通用的。

## 常见问题

**Q: 免费用户能用 Codex CLI 吗？**

ChatGPT 免费套餐目前不包含 Codex CLI 的额度，需要 Plus 及以上套餐，或者直接使用 API Key 计费。详细的套餐对应关系见使用 Codex FAQ。

**Q: 如何处理敏感文件？**

在 `.gitignore` 同级目录创建 `.codexignore`，语法相同。Codex CLI 会跳过这些文件。

**Q: 配置相关问题在哪里找答案？**

参考配置 FAQ，覆盖了模型选择、代理设置、权限控制等常见配置项。

## 下一步

如果你刚完成安装，建议先看初识 Codex CLI：前几天你需要知道的一切——那篇文章讲的是真实使用过程中遇到的问题，而不是文档式的功能列举。

想要更全面了解 Codex 作为云端 Agent 的能力边界，OpenAI Codex 完全指南值得一读。

---

*觉得有用？[订阅 LoreAI](/subscribe)，每天 5 分钟掌握 AI 动态。*