---
title: "Codex 是怎么工作的：从 App 到编辑器再到终端的完整工作流"
slug: how-codex-works
description: "Codex 如何工作？本文拆解 OpenAI Codex 的核心机制：云端 Agent 架构、三端工作流与实际使用逻辑。"
lang: zh
category: tools
related_topics: [codex]
related_glossary: [agentic-coding, agent-sdk]
related_blog: [codex-complete-guide, codex-vscode, first-few-days-with-codex-cli]
related_compare: []
---

# Codex 是怎么工作的：从 App 到编辑器再到终端的完整工作流

**Codex** 是 OpenAI 推出的云端编程 Agent——不是补全工具，不是聊天机器人，而是一个可以接收任务、自主规划、执行代码的 AI 系统。它的核心设计哲学是：你描述想要什么结果，Codex 负责把它做出来。

理解 Codex 怎么工作，先要搞清楚它的三个入口：**Codex App**（浏览器端）、**VS Code 扩展**、**Codex CLI**（终端）。三者不是互相替代的关系，而是同一个工作流在不同阶段的不同界面。

## Codex 的核心架构：云端沙箱 Agent

Codex 的运行不在你的本地机器上——任务被发送到 OpenAI 的云端环境，在一个隔离的沙箱里执行。这个沙箱可以：

- **读写代码文件**：克隆你的仓库，理解文件结构和依赖关系
- **执行命令**：运行测试、安装依赖、调用构建工具
- **提交变更**：生成 diff，创建 PR，或直接推送到分支

这种架构意味着 Codex 不需要占用你本地的 CPU 或内存，任务可以在后台异步执行，你可以同时做别的事。详细的架构拆解可以参考《OpenAI Codex 完全指南》。

## 三端工作流：在 App、编辑器和终端之间流转

### 第一步：在 Codex App 里启动任务

Codex App 是最适合启动新任务的地方。你用自然语言描述需求——"帮我实现用户登录的单元测试"或者"重构这个模块，把同步调用改成异步"——App 会把任务排队，在云端沙箱里执行，并展示执行过程和结果 diff。

App 的优势是**并行性**：你可以同时提交多个任务，每个任务在独立的沙箱里运行，互不干扰。

### 第二步：在编辑器里接手和细化

任务执行完毕后，你可以把结果拉回 VS Code。Codex VS Code 扩展让你在 IDE 里直接看到 Codex 生成的变更、审查 diff、接受或拒绝修改，同时继续用熟悉的编辑器界面做调整。

这一步的价值是**精细控制**：Codex 做了大框架，你在编辑器里做最后一公里的打磨——改变量名、调整注释、处理边缘情况。

### 第三步：用 CLI 在终端里继续推进

对于需要深度集成本地工具链的场景，Codex CLI 是最灵活的选项。终端里可以直接把 Codex 接入你现有的 shell 工作流：

```bash
codex "fix the failing tests in auth module"
```

CLI 可以访问本地文件系统，调用本地安装的工具，适合那些任务依赖本地环境配置的情况。

## Codex 的 Agentic Coding 模型

Codex 和传统代码补全工具的根本区别在于任务粒度。GitHub Copilot 帮你补全下一行；Codex 处理的是"完成这个功能"级别的任务。

这背后是**多步规划**的能力：Codex 会先分析代码库结构，确定需要修改哪些文件，然后按顺序执行，每一步都有依据。这和多 Agent 工作流的工程范式一脉相承——把复杂任务拆解成可执行的子步骤，而不是一次性输出所有内容。

## 实际使用中的关键细节

**任务描述的质量直接影响结果**。越具体越好——"给 `UserAuth` 类的 `login()` 方法写单元测试，覆盖成功登录和密码错误两个场景"比"写测试"的结果质量高出一个数量级。

**并行任务是 Codex 的核心优势**。不要串行地等一个任务完成再提交下一个——同时提交多个独立任务，等待结果，然后一起审查。这是 Codex 和本地 Agent 工具最大的工作流差异。

**审查每个 diff 是必要步骤**，不是可选项。Codex 的执行结果可能完全正确，也可能在边缘情况上有遗漏。在 App 或 VS Code 里逐个审查变更，比盲目合并要安全得多。

## 适合用 Codex 的场景

- **批量测试生成**：指定模块，让 Codex 生成覆盖率测试，然后逐个审查
- **代码库重构**：跨文件的命名规范统一、接口升级、依赖替换
- **文档生成**：读取现有代码，生成 README 或 API 文档草稿
- **Bug 修复**：给出错误信息和复现步骤，让 Codex 定位并修复

学生用户和开源项目有专项支持，详情见 Codex for Students 和 Codex for Open Source。

---

*觉得有用？[订阅 LoreAI](/subscribe)，每天 5 分钟掌握 AI 动态。*