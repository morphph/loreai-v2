---
title: "我每天都在用的 5 个 Claude Code 技巧"
slug: 5-claude-code-skills-i-use-every-single-day
description: "从 SKILL.md 到 Hooks，这 5 个 Claude Code 技巧让我的开发效率翻倍，每天必用。"
lang: zh
category: tools
related_glossary: [agentic-coding]
related_blog: [how-hooks-work]
---

# 我每天都在用的 5 个 Claude Code 技巧

Claude Code 上手容易，但大多数人只用到了 10% 的能力——在终端里问几个问题，改几行代码，仅此而已。真正的效率差距，在于你有没有把它当成一个**可编程的执行引擎**来用。

以下是我每天都在用的 5 个技巧，不是理论，是实际工作流。

## 1. SKILL.md：给 AI 写标准作业流程

这是影响最大的一个改变。与其每次用 Claude Code 都重复说明「我们项目用 TypeScript，测试用 Vitest，commit message 要用这个格式……」，不如把这些写成 `SKILL.md` 文件放在 `skills/` 目录里。

```
skills/
  write-tests/SKILL.md
  code-review/SKILL.md
  write-newsletter/SKILL.md
```

每个 SKILL.md 定义一个具体任务的完整 SOP：输入是什么、输出格式、质量检查项、常见陷阱。Claude Code 在执行对应任务时自动加载这个上下文。

效果是：你不再是在「提示」AI，而是在给它一份有据可查的操作手册。一致性大幅提升，你也不用反复纠正同样的错误。

关于 [agentic coding](/glossary/agentic-coding) 的核心价值，就体现在这里——不是单次对话，而是可复用的执行流。

## 2. CLAUDE.md：项目级别的长期记忆

`CLAUDE.md` 放在项目根目录，是 Claude Code 每次启动都会读的文件。把以下内容放进去：

- 技术栈和版本约束
- 架构决策和它背后的原因
- 哪些文件不能动、哪些模块有已知问题
- commit 规范、分支策略

这解决了一个真实痛点：你不用每次开新会话都重新解释项目背景。特别是多人协作时，CLAUDE.md 让团队里所有人的 AI 行为保持一致。

## 3. Hooks：在 AI 行动前后插入验证逻辑

Hooks 是 Claude Code 最被低估的功能之一。你可以在特定事件（比如文件保存、命令执行前后）触发自定义脚本。

实际用法举例：

- **Pre-commit hook**：Claude Code 要提交代码前，自动跑 `npm test`，测试不过就拦截
- **Post-edit hook**：每次修改 `.ts` 文件后，自动跑 lint 检查
- **Tool-use hook**：记录 Claude Code 执行的每条 shell 命令，方便审计

详细实现方式可以看这篇：[Claude Code Hooks 工作原理](/blog/how-hooks-work)。

核心思路是：**不要完全信任 AI 的自我审查，用代码来验证**。这让「自主执行」和「人工监督」之间的平衡变得可控。

## 4. 任务分解后再下指令

「帮我重构整个认证模块」这种指令成功率很低。Claude Code 是强大的执行器，但它的规划能力需要你配合。

更好的做法：

1. 先让 Claude Code **只做分析**，输出一份改动计划
2. 你检查、修改、批准这份计划
3. 再让它按计划逐步执行，每步验证

这不是在削减 AI 的能力，而是把人的判断力用在正确的地方——规划层，而不是执行层。大型任务这样做成功率能从 40% 提到 90%。

## 5. 用 `--dangerously-skip-permissions` 配合沙箱环境

这个技巧有点反直觉：在**受控的沙箱环境**里，关掉每次操作的权限确认提示，让 Claude Code 全自动跑完一个任务。

适用场景：CI/CD 流水线、本地 Docker 容器、测试环境的批量操作。

关键前提是「受控环境」——不是在生产服务器上乱用。配合 Hooks 里的审计日志，你既获得了全自动执行的效率，又保留了事后可查的记录。

## 真正的效率差距在哪里

用了这 5 个技巧之后，Claude Code 从「一个智能的命令行工具」变成了「一个理解我项目上下文、遵守我团队规范、执行前自动验证的工程伙伴」。

区别不在于模型能力，在于你有没有给它足够的结构化上下文，以及有没有在执行链路里加入足够的验证节点。

从 SKILL.md 开始，这是投入产出比最高的一步。

---

*觉得有用？[订阅 LoreAI](/subscribe)，每天 5 分钟掌握 AI 动态。*