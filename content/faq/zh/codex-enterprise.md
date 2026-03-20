---
title: "Codex 支持企业团队使用吗？"
slug: codex-enterprise
description: "支持。Codex 面向 ChatGPT Enterprise 和 Business 用户开放，提供安全隔离的执行环境。"
category: tools
related_glossary: [codex, agentic]
related_blog: [codex-complete-guide]
lang: zh
---

# Codex 支持企业团队使用吗？

支持。**[Codex](/glossary/codex)** 面向 ChatGPT Enterprise 和 Business 用户全面开放。OpenAI 在 2025 年 5 月首先向 Enterprise、Business、Pro 用户开放，随后扩展到 Plus 和 Edu。团队成员可直接在 ChatGPT 侧边栏向 Codex Agent 分配编码任务，每个任务在安全隔离的云端沙箱中执行。

## 背景

企业采用 [agentic](/glossary/agentic) 编程工具最关心安全和可控性。Codex 每个任务运行在独立容器中，**执行期间禁用外网访问**，Agent 只能操作通过 GitHub 显式提供的代码和预装依赖，不能访问外部网站或 API。

Cisco、Temporal 等企业已在生产环境使用 Codex。通过在仓库中放置 **AGENTS.md** 文件，团队可以统一 Agent 行为——定义编码规范、测试命令和项目约定，确保不同成员分配的任务输出一致。详见 [Codex 完整指南](/blog/codex-complete-guide)。

## 实用建议

1. 确认组织使用 ChatGPT Enterprise 或 Business 套餐
2. 连接 GitHub 仓库让 Codex 访问代码
3. 添加 `AGENTS.md` 定义团队编码标准
4. 在 ChatGPT 侧边栏分配任务，点击「Code」或「Ask」
5. 审查 Agent 输出的终端日志和测试结果后再合并

## 相关问题

- [什么是 Codex？](/faq/what-is-codex)
- [Codex 怎么收费？](/faq/codex-pricing)
- [怎么设置 Codex？](/faq/codex-setup)

---

*觉得有用？[订阅 LoreAI](/subscribe)，每天 5 分钟掌握 AI 动态。*
