---
title: "Aider — AI 术语表"
slug: aider
description: "什么是 Aider？开源终端 AI 结对编程工具，连接多种大模型直接编辑本地代码。"
term: aider
display_term: "Aider"
category: tools
related_glossary: [codex-cli, agentic, agent-teams]
related_blog: [claude-code-extension-stack-skills-hooks-agents-mcp]
related_compare: []
lang: zh
---

# Aider — AI 术语表

**Aider** 是一款开源的终端 AI 结对编程工具，由 Paul Gauthier 开发。它连接 GPT-4、Claude 等大语言模型，直接在本地 git 仓库中读取、编辑和提交代码——你在终端里用自然语言描述需求，Aider 就能跨文件修改代码并自动生成 git commit。

## 为什么 Aider 值得关注

在 AI 编程工具的格局中，Aider 占据了一个独特位置：它是完全开源的终端方案，不绑定任何特定模型或 IDE。开发者可以自由选择后端模型（OpenAI、Anthropic、本地模型等），保持对数据和工作流的完全控制。

对于习惯命令行的开发者来说，Aider 提供了一种轻量级的 [agentic](/glossary/agentic) 编程体验——不需要安装新的 IDE，不需要订阅额外服务，用 `pip install aider-chat` 就能开始。它在开源社区中积累了大量用户，也成为衡量其他 AI 编程工具的基准之一。更多终端 AI 工具的对比分析见我们的 [Claude Code 扩展生态解析](/blog/claude-code-extension-stack-skills-hooks-agents-mcp)。

## Aider 的工作原理

Aider 启动后会扫描当前 git 仓库的文件结构，构建项目上下文。用户通过对话指定要编辑的文件，Aider 将文件内容和用户指令一起发送给 LLM，再将模型返回的代码变更应用到本地文件。

核心机制：

- **仓库映射（repo map）**：自动分析代码依赖关系，帮助模型理解跨文件引用
- **多文件编辑**：单次对话可同时修改多个文件，处理涉及多模块的重构任务
- **Git 集成**：每次编辑自动生成描述性 commit，保留完整变更历史
- **模型无关**：支持 OpenAI、Anthropic、Google、本地 Ollama 等多种后端，通过命令行参数切换

## 相关术语

- **[Codex CLI](/glossary/codex-cli)**：OpenAI 推出的终端 AI 编程工具，同样走命令行路线但绑定 OpenAI 模型
- **[Agentic](/glossary/agentic)**：Aider 所代表的自主式 AI 编程范式，模型不只是补全代码而是主动规划和执行任务
- **[Agent Teams](/glossary/agent-teams)**：多智能体协作模式，Aider 目前为单智能体架构，与之形成对比

---

*觉得有用？[订阅 LoreAI](/subscribe)，每天 5 分钟掌握 AI 动态。*