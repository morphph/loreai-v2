---
title: "Codex 怎么设置？"
slug: codex-setup
description: "Codex 设置指南：从连接 GitHub 仓库到配置 AGENTS.md，快速上手 OpenAI 云端编程代理。"
category: tools
related_glossary: [codex]
related_blog: [codex-complete-guide]
lang: zh
related_topics: [codex]
---

# Codex 怎么设置？

设置 **[Codex](/glossary/codex)** 只需要一个支持的 ChatGPT 账号和一个 GitHub 仓库。Codex 是云端服务，不需要在本地安装任何软件——在 ChatGPT 侧边栏连接你的代码库，就可以开始分配任务。

## 背景

Codex 是 OpenAI 推出的云端软件工程代理，每个任务在独立的沙箱环境中运行，预加载你的仓库代码。目前支持 ChatGPT Pro、Enterprise、Business、Plus 和 Edu 用户。与本地编程工具不同，Codex 不需要配置本地开发环境——所有计算都在 OpenAI 的云端容器中完成。

真正影响 Codex 表现的是你的仓库准备工作。OpenAI 建议提供完善的测试配置、清晰的文档，以及配置好的开发环境。就像给一个新同事交接工作一样，准备越充分，Codex 的产出质量越高。详细的功能介绍可以参考我们的 [Codex 完整指南](/blog/codex-complete-guide)。

## 设置步骤

1. **确认账号权限**：确保你使用的是 ChatGPT Pro、Business、Enterprise、Plus 或 Edu 版本
2. **连接 GitHub 仓库**：在 ChatGPT 侧边栏找到 Codex 入口，授权并关联你的目标仓库
3. **编写 AGENTS.md 文件**：在仓库根目录创建 `AGENTS.md`，告诉 Codex 项目结构、测试命令、编码规范等关键信息——类似 `README.md`，但面向 AI 代理
4. **配置环境脚本**：通过 setup script 预装项目需要的依赖，确保 Codex 的沙箱环境与你的实际开发环境一致
5. **发起第一个任务**：输入提示词后点击 "Code"（编码任务）或 "Ask"（代码库问答），Codex 会在独立容器中执行
6. **审查结果**：任务完成后，检查 Codex 提供的终端日志和测试输出，确认无误后可以直接创建 GitHub Pull Request

如果你更偏好命令行工作流，OpenAI 还提供了开源的 **Codex CLI**。安装后可以直接用 ChatGPT 账号登录，无需手动配置 API Token——系统会自动生成并配置密钥。Pro 和 Plus 用户还可以领取免费 API 额度。

## 相关问题

- [什么是 Codex？](/faq/what-is-codex)
- [Codex 多少钱？](/faq/codex-pricing)
- [Codex 免费吗？](/faq/is-codex-free)

---

*觉得有用？[订阅 LoreAI](/subscribe)，每天 5 分钟掌握 AI 动态。*