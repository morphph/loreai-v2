---
title: "Claude Code Skills 是怎么工作的？"
slug: how-skills-work
description: "Claude Code 的 Skills 系统让你把可复用的指令打包成模块，按需加载到 AI 的上下文中。本文拆解其工作原理。"
category: tools
lang: zh
---

# Claude Code Skills 是怎么工作的？

**Skills** 是 Claude Code 的模块化指令系统——把一段可复用的行为规范打包成独立文件，需要时加载进上下文，不需要时不占资源。简单说：你把"怎么写 newsletter"、"怎么做 code review"这类操作流程写进 `SKILL.md`，Claude 就会按照这套规范执行，不用每次重复解释。

## 从"写死的 prompt"到"按需加载的模块"

传统做法是把所有指令塞进一个大 system prompt。项目变复杂，prompt 就变成几千 token 的怪物——每次对话都要全量加载，浪费上下文窗口，Claude 也容易在信息过载中跑偏。

Skills 的核心设计是**渐进式披露（progressive disclosure）**：Claude 先读取 skill 的元数据，只有真正需要执行某个任务时，才把对应的完整指令加载进来。上下文保持干净，相关指令在对话中精准出现。

这套思路类似软件工程里的懒加载——把大型模块拆成独立单元，按需引入。

## SKILL.md 的结构

一个 skill 通常是一个目录，核心文件是 `SKILL.md`。Anthropic 在 2025 年 10 月推出这套规范，同年 12 月在 agentskills.io 开源。

典型结构：

```
skills/
  newsletter-en/
    SKILL.md        # 指令主体：角色、流程、质量标准
    examples/       # 参考样本（可选）
  code-review/
    SKILL.md
```

`SKILL.md` 里写什么？**角色定义**（这个 skill 扮演什么角色）、**执行流程**（分几步、每步做什么）、**质量标准**（什么算合格）、**禁止事项**（边界约束）。

关于这套 [agentic coding](/glossary/agentic-coding) 范式，我们在 [5 个每天必用的 Claude Code Skills](/blog/5-claude-code-skills-i-use-every-single-day) 里有具体实例可以参考。

## Claude 怎么找到 Skills？

Claude Code 会读取项目根目录下的 `CLAUDE.md`，其中可以声明有哪些 skills 可用、分别负责什么任务。执行任务时，Claude 根据任务类型匹配对应的 skill，加载其 `SKILL.md` 内容，然后按照里面的规范行事。

关键点：**skills 的存在让 AI 行为变得可审计、可版本控制**。你在 git 里看得到每一次指令变更，团队成员用的是同一套规范，不会因为"每个人 prompt 方式不同"而得到不一致的结果。

## 为什么不直接用 tool calling？

这是开发者社区里常见的疑问：skills 和普通的 function calling 有什么本质区别？

区别在于粒度和目的。Tool calling 解决的是"调用外部能力"的问题（执行代码、查数据库、搜索网页）。Skills 解决的是"编码工作流知识"的问题——把人类专家的操作流程、判断标准、风格规范转化为机器可执行的结构化指令。

两者可以结合：一个 skill 里可以描述"在哪些情况下调用哪些工具、调用后如何处理结果"。

## 生态系统：机遇与风险

随着 skills 开源，去中心化的 skill 注册表（如 Vercel 的 skills.sh）开始出现，开发者可以分享和复用社区 skills。研究人员将其类比为 AI 代理的"npm 时刻"。

但这也带来了安全隐患。网络安全研究人员已在公开注册表中发现恶意 skill 包——这些包被设计为持久性修改代理行为，类似软件供应链攻击。使用来源不明的社区 skills 前，务必审查 `SKILL.md` 的实际内容。

## 实际收益

一套维护良好的 skills 系统能带来什么？

- **一致性**：Claude 每次执行同类任务的方式可预期，不依赖"今天 prompt 写得好不好"
- **复用性**：一次写好，全团队共享，新成员上手成本低
- **可维护性**：指令变更有版本记录，出问题能追溯到具体改动
- **上下文效率**：不用的 skill 不加载，长对话中 Claude 不会被无关指令干扰

对于有固定工作流的项目——内容生产、代码审查、测试生成——skills 是把 AI 行为规范化的最直接方式。

---

*觉得有用？[订阅 LoreAI](/subscribe)，每天 5 分钟掌握 AI 动态。*