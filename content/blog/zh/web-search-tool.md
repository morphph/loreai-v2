---
title: "Claude Web Search 工具：动态过滤如何让 AI 搜索省 80% Token"
date: 2026-03-10
slug: web-search-tool
description: "Anthropic 发布 Claude Web Search 新版动态过滤功能，通过代码预处理搜索结果，大幅减少 Token 消耗。本文解析核心原理，并给出 max_uses、域名过滤、缓存等实操配置清单。"
keywords: ["Claude Web Search", "动态过滤", "API 搜索配置", "Token 优化"]
category: DEV
related_newsletter: 2026-03-10
related_glossary: [context-window, token]
related_compare: []
lang: zh
video_ready: true
video_hook: "AI 每搜一次网页，80% 的 Token 都在读垃圾信息——直到动态过滤出现。"
video_status: published
source_type: video
---

# Claude Web Search 工具：动态过滤如何让 AI 搜索省 80% Token

Anthropic 发布了 **Web Search 工具**新版本（web_search_20260209），核心功能是**动态过滤**（Dynamic Filtering）。它让 Claude 在搜索后先用代码筛选内容，再送入[上下文窗口](/glossary/context-window)，大幅降低 [Token](/glossary/token) 消耗的同时提升回答质量。这篇文章拆解原理，并给出完整的配置实操清单。

## 发生了什么

旧版 Claude 搜索的流程是：发起搜索 → 拿到链接 → 把整个网页 HTML 塞进上下文窗口。广告、导航栏、页脚全部涌入，真正有用的信息被噪音淹没。Token 消耗暴增，回答质量反而下降。

新版本引入的**动态过滤**改变了这个流程。Claude 不再直接吞入原始网页，而是先在服务端执行一段代码对搜索结果做预处理，只把筛选后的相关内容送入上下文。相当于从"把整个图书馆搬回来"变成了"只递给你划了重点的段落"。

目前只有 **Claude Opus 4.6** 和 **Sonnet 4.6** 支持动态过滤，其他模型仍使用基础版搜索。定价方面，搜索本身每 1000 次 10 美元，但每次搜索拉回的网页内容按 input token 额外计费。

## 为什么重要

动态过滤解决的不只是成本问题，更是质量问题。信息过载是当前 AI 搜索的核心瓶颈——上下文窗口塞满无关内容后，模型的注意力被稀释，关键信息反而容易被忽略。

一个容易被忽视的细节：基础版（web_search_20250305）支持 **Zero Data Retention**（阅后即焚），但动态过滤版本默认不支持 ZDR，因为代码执行过程中会产生中间数据。对数据合规要求严格的场景，需要手动关闭动态过滤来启用 ZDR。

另一个关键变化是，Claude 会根据问题复杂度自行决定搜索次数。一个复杂问题可能触发十几次搜索，单次对话成本轻松破 1 美元。这使得成本控制变成了必选项，而不是可选项。

## 技术细节

Anthropic 提供了几个关键参数来控制搜索行为：

**max_uses**：限制单次对话的最大搜索次数。设为 3-5 次足以覆盖大多数场景，超出后 API 返回 `max_uses_exceeded` 错误，直接刹车。这是控制成本的第一道防线。

**域名过滤**：`allowed_domains`（白名单）和 `blocked_domains`（黑名单）二选一，不能同时使用。子域名自动继承——设置 `example.com` 会覆盖 `docs.example.com`，反之不行。通配符只能在路径部分使用且仅限一次，`example.com/*` 合法，`*.example.com` 不合法。

**user_location**：支持城市、地区、国家、时区四个维度的地理定位，搜索本地化信息时效果显著。

**Prompt Caching**：在请求中添加 `cache_control` 断点，系统自动缓存到最后一个搜索结果。多轮对话中已搜过的内容不再重复计费。

还有一个边缘情况值得注意：如果搜索耗时过长，API 会返回 **pause_turn** 状态。这不是报错，需要把响应原样提交回去让 Claude 继续执行。

## 你现在该做什么

五步配置清单，下一个 Claude API 项目直接套用：

1. **升级工具版本**：将 `web_search` 的 type 从 `web_search_20250305` 改为 `web_search_20260209`，一行配置启用动态过滤
2. **设置 max_uses 为 3-5**：除非确实需要大量搜索，否则不要放开限制
3. **用 allowed_domains 锁定可信源**：官方文档、权威媒体，精准搜索比大海捞针强一百倍
4. **多轮对话加 cache_control 断点**：省 token 就是省钱
5. **处理 pause_turn 状态**：别把长时间搜索的中间结果当报错丢掉

核心一句话：Web Search 的关键不是"能不能搜"，而是"怎么控制搜索"。用好这几个参数，搜索才能变成生产力工具，而不是烧钱机器。

**相关阅读**：[什么是上下文窗口？](/glossary/context-window) · [Token 计费详解](/glossary/token)

---

*觉得有用？[订阅 AI 简报](/subscribe)，每天 5 分钟掌握 AI 动态。*