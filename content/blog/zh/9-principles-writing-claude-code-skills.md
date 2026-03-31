---
title: Claude Code Skills 最佳实践：从结构设计到生产级落地
date: 2026-03-18T00:00:00.000Z
slug: 9-principles-writing-claude-code-skills
description: >-
  Anthropic 工程师总结的 Claude Code Skills 设计指南：9 大类型、4 个结构原则、5 个生产级技巧，让 AI
  编码助手不再重复犯错。
keywords:
  - Claude Code
  - Skills
  - SKILL.md
  - AI 编码
  - Anthropic
category: DEV
related_newsletter: 2026-03-18T00:00:00.000Z
related_glossary:
  - claude-code
  - ai-coding-assistant
related_compare: []
lang: zh
video_ready: true
video_hook: 一个 Markdown 文件，让 Claude 永远不再犯同样的错
video_status: published
source_type: video
flow_source: manual-curate
---

# Claude Code Skills 最佳实践：从结构设计到生产级落地

你用 **[Claude Code](/zh/blog/agent-harnesses-2026)** 写退款接口，它把 invoice ID 传进去了，你纠正了，第二天同样的错误又来。一个 Markdown 文件就能让它永远记住——这就是 SKILL.md。Anthropic 工程师 Thariq 发布了一份 Skills 设计指南，覆盖 9 大类型、4 个结构原则和 5 个生产级技巧。这篇文章帮你一次读透。

## 发生了什么

**SKILL.md** 的定位类似于给新同事写的交接文档：不教他用 Git，而是告诉他"退款要用 charge ID，不是 invoice ID"。这种踩坑经验官方文档没有，而 Claude 每次启动都会读取 SKILL.md。

Thariq 将 Skill 归纳为 **9 大类别**：

- **Library / API 参考**（如 billing-lib）
- **Product Verification**（如 signup-driver）
- **Data / Analysis**（如 funnel-query）
- **Business Automation**（如 standup）
- **Scaffolding**（如 new-app）
- **Code Quality**（如 bughunt）
- **CI/CD**（如 babysit-pr）
- **Incident Runbooks**（如 oncall）
- **Infrastructure Ops**（如 orphans）

核心判断标准：一个好的 Skill 应当归入一类；如果横跨三类，就该拆分。

## 为什么重要

SKILL.md 解决的是 **[AI 编码助手](/glossary/ai-coding-assistant)** 最大的痛点——上下文遗忘。每次新会话，模型对你项目的业务陷阱一无所知。靠人工每次重复提示不可持续，而 SKILL.md 将团队的踩坑经验固化成模型可读的格式，实现"错一次，永远记住"。

更关键的是 **description 字段的设计哲学**。它不是给人看的文档，而是给模型看的触发词。就像外卖 App 的搜索标签——商家标签写"奶茶"，用户搜"奶茶"就能找到店，而不是写"基于茶叶的冷饮制品"。babysit-pr 这个 Skill，description 从正式描述改成 `"babysit, watch CI"` 加一句 `"make sure this lands"`，用户说"帮我盯着这个 PR"，Claude 立刻匹配上。**一个字段的改动，激活率完全不同。**

## 技术细节

### 4 个结构原则

**Skip Obvious**——[Claude Code](/glossary/claude-code) 本来就会用 Git，只写它猜不到的东西。

**Build a Gotchas Section**——这是最有价值的部分。以 billing Skill 为例：第 1 天 Gotchas 为空；第 2 周加了一条"退款向下取整，不是四舍五入"；到第 3 个月积累了 4 条，包括"幂等 key 过期是 24 小时不是 7 天""退款要用 charge ID 不是 invoice ID"。每次 Claude 犯错就加一行，清单越来越值钱。

**[Progressive Disclosure](/zh/blog/lessons-from-building-claude-code-agent-tools)**——采用 hub-and-spoke 模式。SKILL.md 只有 30 行，像分诊台：任务 pending 去读 `stuck-jobs.md`，消息进死信队列去读 `dead-letters.md`。Claude 只加载需要的上下文。

**Don't Railroad**——不要规定每一步。cherry-pick 的好写法只有一句话："挑到干净分支，保留意图，搞不定就说原因。"给目标，不给脚本。

### 5 个生产级技巧

1. **description 写触发短语**，用用户会说的话，而非正式定义
2. **缓存首次配置**——像微信登录扫一次码，之后自动。SKILL.md 嵌入 shell 命令读取 `config.json`，文件不存在就问你，问完保存，下次直接用
3. **用 `CLAUDE_PLUGIN_DATA` 存数据**——该目录跨会话持久保存，Skill 升级了数据还在。日报 Skill 每次发完追加日志，下次就能对比昨天的内容
4. **给代码不给描述**——在 docstring 里直接嵌入 gotchas（如"要用 `signup_completed` 不是 `signup_started`""按 `anonymous_id` 去重"），Claude 直接 import 组合，坑都写在注释里
5. **加按需钩子做安全护栏**——防住危险操作，会话结束自动解除

## 你现在该做什么

1. 打开你最常用的项目，创建第一个 `SKILL.md`
2. 写下 Claude 最近犯的 **3 个错误**，作为 Gotchas 起点
3. 把 description 改成用户会说的话，而非正式描述
4. 加上首次配置的自动保存机制（读 `config.json`，不存在就交互创建）
5. 每次 Claude 犯新错，补一行 gotcha——最好的 Skill 不是一次写对的，是越踩坑越值钱的

**相关阅读**：[Claude Code 是什么](/glossary/claude-code) · [AI 编码助手对比](/glossary/ai-coding-assistant)

---

*觉得有用？[订阅 AI 简报](/subscribe)，每天 5 分钟掌握 AI 动态。*
