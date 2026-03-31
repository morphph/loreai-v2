---
title: "Codex 怎么收费？"
slug: codex-pricing
description: "Codex 包含在 ChatGPT Pro/Plus/Business/Enterprise 订阅中，API 模型 codex-mini-latest 按 token 计费。"
category: tools
related_glossary: [codex]
related_blog: [codex-complete-guide]
lang: zh
related_topics: [codex]
---

# Codex 怎么收费？

**[Codex](/glossary/codex)** 目前包含在 ChatGPT Pro、Plus、Business 和 Enterprise 订阅中，无需额外付费即可使用。API 开发者则可通过 codex-mini-latest 模型按 token 计费：输入 $1.50/百万 token，输出 $6/百万 token，prompt 缓存享 75% 折扣。

## 背景

OpenAI 在 2025 年 5 月发布 Codex 研究预览版时，首先向 Pro、Enterprise 和 Business 用户开放，随后在 6 月扩展到 Plus 用户。发布初期，OpenAI 提供了"慷慨的免费额度"供用户探索，并表示后续会推出限速访问和灵活的按需付费选项。

需要注意的是，Codex 的使用成本实际取决于你的使用方式：

- **ChatGPT 内使用**：通过 ChatGPT 侧边栏使用 Codex，费用包含在你现有的 ChatGPT 订阅中。Pro 用户（$200/月）和 Plus 用户（$20/月）均可访问，但具体的速率限制因套餐而异。
- **API 调用**：开发者通过 Responses API 调用 codex-mini-latest，按实际 token 用量计费。75% 的 prompt 缓存折扣对重复调用场景（如 CI/CD 集成）非常有价值。
- **Codex CLI**：命令行工具本身开源免费，但底层调用 API 会产生费用。Plus 和 Pro 用户首次登录可分别领取 $5 和 $50 的免费 API 额度（30 天有效）。

Codex 的定价策略仍在演进中——OpenAI 明确表示会推出更灵活的付费选项。关于 Codex 的完整功能介绍，参见我们的[深度解析](/blog/codex-complete-guide)。

## 实用建议

1. **已有 ChatGPT 订阅**：直接在 ChatGPT 侧边栏启用 Codex，无需额外操作
2. **开发者集成**：使用 codex-mini-latest 模型，善用 prompt 缓存降低成本
3. **CLI 用户**：用 ChatGPT 账号登录 Codex CLI，领取免费 API 额度试用
4. **控制成本**：合理拆分任务粒度，避免单次任务消耗过多 token

## 相关问题

- [什么是 Codex？](/faq/what-is-codex)

---

*觉得有用？[订阅 LoreAI](/subscribe)，每天 5 分钟掌握 AI 动态。*