---
title: "如何登录 Codex CLI？"
slug: codex-cli-login
description: "Codex CLI 通过 OpenAI API Key 完成身份验证，无需传统账号密码。设置方法简单，一条命令即可完成。"
category: tools
related_glossary: [agentic-coding, agent-sdk]
related_blog: [first-few-days-with-codex-cli, codex-complete-guide]
related_compare: [codex-cli-vs-claude-code]
related_faq: [using-codex, is-codex-cli-safe-to-use, codex-cli-download]
related_topics: [codex]
lang: zh
---

# 如何登录 Codex CLI？

**Codex CLI 不使用传统的用户名/密码登录**，而是通过 OpenAI API Key 完成身份验证。你需要在 OpenAI 平台生成一个 API Key，然后通过环境变量或 `codex login` 命令将其配置到本地环境中。

## 操作步骤

1. **获取 API Key**：前往 [platform.openai.com](https://platform.openai.com/api-keys)，创建一个新的 API Key
2. **配置认证**：运行 `codex login`，按提示粘贴你的 API Key；或者直接设置环境变量：

```bash
export OPENAI_API_KEY="sk-..."
```

3. **验证登录状态**：运行 `codex --version` 或执行一个简单任务，确认 CLI 能正常调用 API

如果使用的是 Azure OpenAI 或其他兼容端点，还需要额外配置 `OPENAI_BASE_URL` 等环境变量。

## 常见问题

**API Key 应该保存在哪里？** 推荐写入 `~/.bashrc` 或 `~/.zshrc`，避免每次新开终端都要重新设置。不要将 Key 提交到代码仓库。

**登录后提示 401 错误怎么办？** 通常是 Key 过期或权限不足。回到 OpenAI 平台检查 Key 状态，确认账户有足够的额度。

关于 Codex CLI 的整体上手体验，可以参考初识 Codex CLI：前几天你需要知道的一切；如果你在 Claude Code 和 Codex CLI 之间犹豫，这篇对比能帮你做决定。

## 相关问题

- 如何下载和安装 Codex CLI？
- Codex CLI 安全吗？
- 如何使用 Codex CLI？

---

*觉得有用？[订阅 LoreAI](/subscribe)，每天 5 分钟掌握 AI 动态。*