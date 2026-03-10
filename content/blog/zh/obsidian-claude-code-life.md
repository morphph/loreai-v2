---
title: "Obsidian + Claude Code：一套让 AI 读懂你整个人生的知识管理系统"
date: 2026-03-10
slug: obsidian-claude-code-life
description: "Internet Vin 用 Obsidian 知识图谱 + Claude Code 自定义命令，让 AI 加载完整人生上下文、发现思维盲区、甚至主动设计工具。三层玩法完整拆解。"
keywords: ["Obsidian", "Claude Code", "知识管理", "AI工作流", "自定义命令", "meta-prompting"]
category: DEV
related_newsletter: 2026-03-10
related_glossary: [context-window, prompt-engineering]
related_compare: []
lang: zh
video_ready: true
video_hook: "一个命令让 AI 加载你的整个人生，项目、日记、工作流全部到位"
video_status: published
source_type: video
---

# Obsidian + Claude Code：一套让 AI 读懂你整个人生的知识管理系统

每次打开新的 AI 对话，你是不是又要从头解释自己是谁、在做什么项目？有人只需要一个命令，AI 就能瞬间加载他的项目描述、播客上下文、个人工作流——一个字都不用解释。这套系统的核心不是什么黑科技，而是 **Obsidian** 的知识图谱加上 **Claude Code** 的自定义命令。拆解这套方案，你会发现 AI 的能力上限，取决于你喂给它的上下文质量。

## 发生了什么

Internet Vin 在一期播客访谈中分享了他用 Obsidian + Claude Code 管理整个人生的完整方案。核心架构分三层。

**第一层：消灭重复解释。** Vin 创建了一个 `/context` 命令，一敲回车，Claude Code 自动读取 README、项目描述、播客上下文、个人工作流，全部加载完毕。每次新对话不需要从头说起。

**第二层：用命令让 AI 成为思维伙伴。** 他造了十多个自定义 slash 命令。`/today` 拉取日历、任务、iMessages 加上过去一周的日记，生成当日计划。`/drift` 对比 30 到 60 天内你说要做的事和实际做的事。`/trace` 追踪一个想法从诞生到成熟的完整演变——Vin 用它发现"使用 Obsidian"这个想法经历了四个阶段，跨度 **13 个月**，连他自己都没意识到。

**第三层：让 AI 反过来给你造工具。** 他对 Claude Code 说"你已经读过我整个 vault，你觉得我需要什么命令？"AI 输出了该造的工具、该见的人、该写的文章——其中一个建议是去找 **Obsidian CEO Steph Ango** 聊"vault 作为一个空间"。

## 为什么重要

这套方案揭示了一个根本性的转变：**从"你指挥 AI"升级到"AI 主动为你定制工具"**。

关键在于 Obsidian 不是普通笔记本，它是一个 **Vault（知识库）**。每个文件之间用双括号互相链接，写得越多链接越密，最终形成一张[知识图谱](/glossary/zh/context-window)。Obsidian 最近发布的 CLI 工具让 Claude Code 不仅能读取每个文件，还能看到文件之间的隐形连线——谁引用了谁，谁和谁相关。

这就像给 AI 装了一副特殊的眼镜。之前它只能一页一页翻你的笔记本，现在它能看到整张关系网。单个文件是碎片，关系网才是记忆。

更值得注意的是 **meta-prompting（元提示）** 的威力。AI 读完 13 个月的笔记后，对 Vin 的理解可能比他自己还全面。AI 提议的 `/graduate` 命令——扫描 daily notes 中标记了 idea 标签但从未独立成文的想法——用的术语和概念全是 Vin 自己在笔记里反复出现的。AI 不是在套模板，它是在用你的语言给你造工具。

## 技术细节

这套系统的技术栈并不复杂，但有几个关键设计决策。

**Obsidian CLI** 是整个方案的基础设施。它让 Claude Code 能以编程方式访问 Vault，包括文件内容和 backlinks 关系图。没有这个 CLI，AI 只能读单个文件，无法理解文件间的关联。

**自定义 slash 命令的分类架构：**
- **日常管理类**：`/today`、`/context`——解决重复劳动
- **思维审计类**：`/ghost`（建立声音画像）、`/challenge`（压力测试信念）、`/drift`（对比意图与行动）
- **深层挖掘类**：`/emerge`（发现未说出的想法）、`/trace`（追踪想法演变）、`/connect`（发现跨领域桥梁）

**一条铁律：绝对不让 AI 往 vault 里写文件。** Vault 必须百分之百是你自己的想法。如果 AI 也往里写东西，下次分析时它找到的可能是自己编的模式，不是你真正的想法。数据被污染，所有后续分析都不可信。正如 Greg Eisenberg 说的：**markdown 文件就是完美记忆**，人的记忆会扭曲，文件不会骗你。

## 你现在该做什么

判断你该不该用这套方案，看三个信号：

1. **你每次开新对话都在复制粘贴同样的背景信息。** 说明你缺的是持久化的上下文，不是更好的[提示词](/glossary/zh/prompt-engineering)。
2. **你的笔记越来越多，但翻旧笔记的频率越来越低。** 散落的文件再多，AI 也只能一个一个读，有了链接才能看到全貌。
3. **你感觉自己在忙，但说不清到底在忙什么。** 你需要的不是更大的 Context Window，而是更结构化的上下文。

**现在就可以做的一件事：** 下载 Obsidian（免费），创建一个 Vault，把你最重要的三个项目各写一个 markdown 文件，用双括号互相链接。然后用 Claude Code 创建你的第一个自定义命令——让它读取你过去一周的笔记，总结你最关心的三件事。看看 AI 的总结和你自己的感觉是否一致。

**相关阅读**：[Context Window 是什么？](/glossary/zh/context-window) | [Prompt Engineering 实战指南](/glossary/zh/prompt-engineering)

---

*觉得有用？[订阅 AI 简报](/subscribe)，每天 5 分钟掌握 AI 动态。*