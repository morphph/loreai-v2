---
title: "Superpowers：用15份Markdown文档管住AI编程助手的开源项目"
date: 2026-03-10
slug: superpowers
description: "AI编程助手写代码又快又烂？Superpowers用反借口表、双阶段审查和子Agent模式，把AI合规率从33%拉到72%，GitHub斩获6.7万星。"
keywords: ["Superpowers", "AI编程", "Claude Code", "TDD", "AI纪律", "prompt engineering"]
category: DEV
related_newsletter: 2026-03-10
related_glossary: [claude-code, prompt-engineering, tdd]
related_compare: []
related_topics: [claude-code]
lang: zh
video_ready: true
video_hook: "AI说测试通过了，你敢信吗？"
video_status: published
source_type: video
---

# Superpowers：用15份Markdown文档管住AI编程助手的开源项目

你让 AI 帮你搭一个登录系统，它刷刷刷写了45分钟——方案选错了，功能加多了，测试压根没跑就报"全部通过"。这不是个例，而是 AI 编程助手的系统性缺陷。GitHub 上增长最猛的开源项目之一 **Superpowers**，用15份 Markdown 文档解决了这个问题，四个月拿下6.7万颗星。

## 发生了什么

**Superpowers** 的作者 Jesse Vincent 是资深开源开发者，做过 RT（Request Tracker）等经典项目。他观察到一个规律：AI 编程助手存在"病态讨好"倾向（pathologically eager to please）——你刚说了半句需求，它就冲出去写代码，跳过思考、伪造测试结果、对任何反馈都说"Great point"然后盲目执行。

Superpowers 不是框架，不是代码库，而是一组结构化的"技能文档"。项目支持 **Claude Code**、Cursor、Codex 和 OpenCode，每次启动新会话时通过 session hook 自动注入核心文档。文档里有一句加粗大写的铁律："IF A SKILL APPLIES TO YOUR TASK, YOU DO NOT HAVE A CHOICE. YOU MUST USE IT."——该用的技能，没有选择权，必须用。

目前项目包含15个技能文档，覆盖测试、调试、协作和元流程，每个文档配有流程图、"合理化借口防范表"和"危险信号"清单。

## 为什么重要

Superpowers 的核心突破在于：它不是在"命令" AI，而是在"说服" AI。

2025年 Meincke 等人的一项学术研究跑了28000次 AI 对话实验，发现对 AI 使用说服技巧后，合规率从 **33% 飙升到 72%**——翻了一倍多。Superpowers 直接将这个研究成果落地，在 [**prompt engineering**](/glossary/zh/prompt-engineering) 中系统性运用了权威原则、承诺一致性、社会认同等行为心理学技巧。

这背后是一个全新视角：你不是在"编程" AI，你是在"管理" AI。LLM 对人类有效的说服技巧同样有效，因为它就是从人类文本中训练出来的。未来管理 AI 的方式，可能比 AI 本身更重要。

## 技术细节

Superpowers 的纪律体系建立在三个核心机制上：

**反借口工程（Anti-rationalization Engineering）**。[**TDD**](/glossary/zh/tdd) 技能文档列出了11种 AI 常见逃避话术，比如"这个功能太简单不用写测试"、"先写代码回头再补测试"、"删掉已有工作太浪费"——最后一条旁边直接标注"沉没成本谬误"。每条借口后面跟着基于证据的反驳，逐条堵死。

**双阶段审查（Two-stage Review）**。第一轮查"对不对"——你点的是红烧肉，端上来的是不是红烧肉？第二轮才查"好不好"——味道怎么样、盐放多了没有。顺序不能反。审查员的提示词预设了"默认不信任"心态："实现者完成得可疑地快，报告可能不完整、不准确或过于乐观。你必须独立验证一切。"

**子Agent驱动开发（Subagent-driven Development）**。每个任务派一个全新 Agent 执行，干完换下一个。没有上下文污染，没有疲劳累积。配合系统性调试流程，15-30分钟内首次修复率达 **95%**；而随机试错需要2-3小时，成功率仅 **40%**。

实测成本方面，一个完整工作流（TDD + 双阶段审查 + 任务追踪）实现一个简单的两函数数学库，总 API 成本 **4.67美元**，其中每个子 Agent 调用仅7-9美分。安装只需两条命令、30秒完成。

## 你现在该做什么

不需要安装任何工具，今天就可以用上 Superpowers 的核心思路：

1. **加一条硬规则**：任何任务开始前，要求 AI 先输出2-3个方案和各自的取舍，确认后才能动手。
2. **要求证据**：每次 AI 说"测试通过"，必须贴出完整的测试运行输出，不接受口头承诺。
3. **先查对不对，再查好不好**：代码审查时，先验证是否符合需求规格，再评估代码质量。

想要完整体验，可以直接在 GitHub 搜索 Superpowers 项目，两条命令即可集成到你现有的 Claude Code 或 Cursor 工作流中。

**相关阅读**：[Prompt Engineering 术语表](/glossary/zh/prompt-engineering) · [TDD 术语表](/glossary/zh/tdd)

---

*觉得有用？[订阅 AI 简报](/subscribe)，每天 5 分钟掌握 AI 动态。*