---
title: "如何高效地给 Claude Code 写 Prompt：从入门到精通的完整指南"
slug: how-to-effectively-prompt-a-claude-code
description: "掌握 Claude Code 提示词技巧：从 CLAUDE.md 规则到 SKILL.md 模板，系统化提升 AI 编程效率。"
lang: zh
category: tools
related_glossary: [claude-code, agentic-coding, agent-sdk]
related_blog: [claude-code-memory, claude-code-seven-programmable-layers, claude-code-extension-stack-skills-hooks-agents-mcp, do-skills-actually-improve-your-agents-output, 9-principles-writing-claude-code-skills, 5-claude-code-skills-i-use-every-single-day, claude-code-is-not-a-coding-tool]
related_compare: []
related_topics: [claude-code]
---

# 如何高效地给 Claude Code 写 Prompt：从入门到精通的完整指南

大多数开发者用 Claude Code 的方式是错的。他们把它当成一个更聪明的搜索框——输入一句模糊的需求，期待它自动理解所有上下文。结果要么得到一堆泛泛的代码，要么陷入反复修正的循环。问题不在工具本身，而在于你和它对话的方式。**高效地给 Claude Code 写 prompt**，本质上是一种工程实践：把需求拆解清楚，把上下文喂到位，让 agent 在正确的约束下自主行动。

这篇文章会从日常 prompt 技巧讲到系统化的 prompt 架构，帮你真正释放 Claude Code 的生产力。

## 第一原则：Claude Code 不是聊天机器人

在写任何 prompt 之前，你需要理解一件事：Claude Code 不是一个编程工具，它是一个 agentic system。它能读取整个项目结构、执行 shell 命令、跨文件编辑、运行测试、提交代码。这意味着你给它的 prompt 不应该是「帮我写一个函数」，而应该是「完成这个任务」。

好的 prompt 和差的 prompt 之间的区别，往往不是措辞优雅与否，而是你有没有提供足够的**决策上下文**。Claude Code 是一个自主 agent，它需要知道的不仅是「做什么」，还有「为什么做」和「边界在哪里」。

## 日常 Prompt 的五个黄金法则

### 1. 先说目标，再说约束

差的 prompt：
```
改一下 auth 模块
```

好的 prompt：
```
重构 src/auth/middleware.ts，把 session token 存储从 cookie 改成 HTTP-only cookie + refresh token 模式。
约束：不要改现有的 API 接口签名，所有现有测试必须继续通过。
```

目标在前，约束在后。Claude Code 会先理解你要达成的结果，然后在约束范围内规划执行路径。

### 2. 提供具体的文件路径和上下文

Claude Code 能读取整个代码库，但你主动指出相关文件会大幅减少它的搜索时间和误判概率。与其说「修复登录 bug」，不如说「`src/app/api/login/route.ts` 第 42 行的 token 验证在 refresh token 过期时没有正确返回 401」。

### 3. 用验收标准代替实现指令

不要告诉 Claude Code 怎么写代码，告诉它什么算「完成」：

```
添加用户头像上传功能。
验收标准：
- 支持 JPG/PNG，最大 5MB
- 上传后自动裁剪为 200x200
- 存储到 S3，URL 写入 user.avatar_url
- 添加对应的单元测试
```

这种 prompt 给了 Claude Code 足够的自主空间去选择最佳实现方式，同时确保结果符合你的预期。

### 4. 一次一件事

Claude Code 的 agent 架构擅长处理复杂的多步骤任务，但前提是这些步骤属于**同一个目标**。不要在一个 prompt 里塞进不相关的需求：「修复登录 bug，顺便把首页的 banner 颜色改成蓝色，还有帮我看看为什么 CI 挂了。」

拆开来，每个任务一个清晰的 prompt。Claude Code 会为每个任务独立规划执行路径，结果更可靠。

### 5. 利用 follow-up 迭代而非重启

Claude Code 在同一个会话中保持完整的上下文。如果第一次输出不完美，用后续 prompt 精调，而不是重新描述整个需求。比如：「测试覆盖率不够，给边界情况加几个 test case」或「这个实现可以工作但性能不行，用 streaming 方式重写数据处理部分」。

## 系统化 Prompt：CLAUDE.md 和 SKILL.md

日常 prompt 技巧能解决即时问题，但真正的效率飞跃来自**系统化的 prompt 架构**。Claude Code 提供了两层持久化上下文机制。

### CLAUDE.md：项目级规则手册

CLAUDE.md 是 Claude Code 的记忆系统核心。它是一个放在项目根目录的 Markdown 文件，定义了项目级的规则、约束和上下文。每次 Claude Code 启动时都会自动读取。

把你反复在 prompt 里强调的规则写进 CLAUDE.md：代码风格、测试要求、架构约束、部署流程。这样你的日常 prompt 就可以专注于具体任务，而不用每次重复基础规则。

一个好的 CLAUDE.md 应该包含：
- 构建和测试命令（`npm run build`、`npm test`）
- 质量门禁（提交前必须通过的检查）
- 架构约束（不要在 pipeline 脚本里 import Next.js 模块）
- 命名规范和代码风格

### SKILL.md：可复用的任务模板

如果 CLAUDE.md 是「通用规则」，那么 SKILL.md 就是「专用模板」。每个 SKILL.md 定义了 Claude Code 处理特定类型任务的方式——语气、结构、质量标准、输出格式。

比如你可以为代码审查、博客撰写、测试生成各创建一个 SKILL.md。当你触发对应技能时，Claude Code 自动加载这些指令，相当于给它装上了一套专业工具包。实际使用中，好的 SKILL.md 能把 prompt 质量从个人技巧变成团队标准。

## 进阶：Claude Code 七层架构的 Prompt 策略

理解 Claude Code 的七层可编程架构能帮你在正确的层级写 prompt。从底层的 CLAUDE.md 到顶层的 Hooks 和 MCP Server，每一层都有对应的 prompt 策略：

- **CLAUDE.md 层**：写规则和约束，而非具体任务
- **SKILL.md 层**：写模板和输出格式，定义「好」的标准
- **会话 prompt 层**：写具体任务和验收标准
- **Hooks 层**：自动化触发检查，不需要手动 prompt
- **Agent 层**：定义子 agent 的职责边界

核心思路是：**把不变的规则下沉到底层，把变化的需求留在会话层**。这样每次 prompt 只需要描述「这次要做什么」，而不用重复「怎么做才符合标准」。

## 常见反模式：这些 Prompt 习惯正在拖慢你

**过度指定实现细节**：「用 reduce 而不是 for 循环」「先创建一个 utils 文件夹然后……」。除非有明确的技术原因，让 Claude Code 自己选择实现方式。

**缺少失败条件**：只说了成功场景，没说边界情况。「添加表单验证」不如「添加表单验证，邮箱格式错误时显示具体错误信息，提交频率超过 3 次/分钟时显示 rate limit 提示」。

**上下文过载**：把整个需求文档粘贴进去。Claude Code 能处理长上下文，但信噪比低会导致它抓不住重点。提炼关键信息，指向相关文件，让它自己去读。

**模糊的质量标准**：「写好一点的代码」「优化性能」。好是什么？性能目标是多少？给出可衡量的标准：「响应时间从 800ms 降到 200ms 以下」「测试覆盖率达到 80%」。

## Frequently Asked Questions

### Claude Code prompt 和普通 ChatGPT prompt 有什么区别？

Claude Code 是 agentic system，具备文件读写、shell 执行、Git 操作能力。prompt 应该描述**任务目标和验收标准**，而非逐步指令。它能自主规划执行路径，你需要提供的是决策上下文和边界约束，而不是实现步骤。

### CLAUDE.md 应该写多长？

没有硬性限制，但实践中 50-200 行最有效。重点写规则和约束，不写教程。过长的 CLAUDE.md 会稀释关键信息的权重。按优先级排列，把最重要的规则放在最前面。

### 如何判断一个 prompt 写得够不够好？

最简单的标准：如果 Claude Code 第一次执行的结果需要你做大量修正，说明 prompt 缺少关键上下文或约束。好的 prompt 应该在 1-2 轮迭代内达到预期结果。反复出现的修正模式应该被写进 CLAUDE.md 或 SKILL.md。

---

*觉得有用？[订阅 LoreAI](/subscribe)，每天 5 分钟掌握 AI 动态。*