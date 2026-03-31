---
title: Codex 和 ChatGPT 有什么区别？
slug: codex-vs-chatgpt
description: Codex 是 ChatGPT 内置的专业编程 Agent，两者定位和能力完全不同。
category: tools
related_glossary:
  - codex
related_blog:
  - codex-complete-guide
lang: zh
related_topics:
  - codex
---

# Codex 和 ChatGPT 有什么区别？

**[Codex](/glossary/codex)** 是一个住在 [ChatGPT](/zh/glossary/chatgpt) *内部*的云端编程 Agent，专为软件工程任务设计。**ChatGPT** 是 OpenAI 的通用对话 AI。核心区别：ChatGPT 处理开放式对话，[Codex](/zh/blog/codex-complete-guide) 专注读代码、写代码、跑测试、提 PR。

## 背景

两者共享入口容易混淆，但底层跑的是不同模型。ChatGPT 用 GPT-4o 等通用模型对话，Codex 由 **codex-1**（基于 o3 的编程专用模型）驱动。

使用 ChatGPT 是在对话——提问、生成文本、分析文档。使用 Codex 是在派任务——每个任务启动一个独立沙箱，预装 GitHub 仓库，Agent 在其中读写文件、执行终端命令、提交变更，全程禁用外网访问。

ChatGPT 秒级响应，Codex 任务耗时 1-30 分钟，但支持并行多任务。更多细节参见 [Codex 完整指南](/blog/codex-complete-guide)。

## 实用建议

1. **一般问答和写作** → 用 ChatGPT
2. **需要 Agent 在仓库中工作** → 用 Codex
3. 在 ChatGPT 侧边栏点击「Code」分配编码任务
4. 点击「Ask」向 Codex 查询代码库问题
5. 用 `AGENTS.md` 定义项目约定，统一 Agent 行为

## 相关问题

- [什么是 Codex？](/faq/what-is-codex)
- [Codex 免费吗？](/faq/is-codex-free)
- [Codex 怎么收费？](/faq/codex-pricing)

---

*觉得有用？[订阅 LoreAI](/subscribe)，每天 5 分钟掌握 AI 动态。*
