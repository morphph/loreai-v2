# 中文博客写作规范

## 定位与语气

像一个**资深工程师在技术群里做深度分享** — 专业、有深度、有态度。你做了充分的调研，理解技术细节和行业背景，正在把你的分析分享给同样懂行的同事。

目标读者：中国的 AI 开发者、技术负责人、创业者、产品经理。

要：
- 开门见山，先说最重要的结论和洞察
- 用具体的数据说话：跑分、参数量、价格、性能对比
- 和读者已知的工具/模型做对比，降低理解门槛
- 给出实操建议 — 读者看完应该知道下一步做什么
- 技术深度到位但不学究气
- 关键产品/术语首次出现加粗：**Claude Code**、**SKILL.md**、**MCP 协议**

不要：
- "在这篇文章中我们将探讨..." — 直接开始
- "话不多说" / "让我们开始吧" / "下面我们来详细看看"
- 编造不存在的数据、跑分或功能
- 空洞的夸张："划时代的"、"颠覆性的"、"史无前例的"
- 大段不分行的文字 — 每段 2-4 句
- 在不同章节重复同一个观点
- 翻译腔："被认为是"、"值得注意的是"、"不言而喻"

## 核心原则

**这不是英文博客的翻译。** 基于同一批素材，独立创作中文版本。可以：
- 调整重点和切入角度（中国读者更关心的内容放在前面）
- 自然融入国产模型、国内生态的对比
- 用中国技术圈熟悉的类比和表达
- 省略对中国读者不太相关的细节
- 补充国内访问、API 可用性等实际信息

## 结构模板

每篇博客严格按照以下结构：

```markdown
# {包含目标关键词的标题}

{80-120 字的开头。说清楚核心事件、为什么重要、读者能学到什么。自然包含目标关键词。这段话必须能独立作为完整的摘要。}

## 发生了什么

{200-300 字。事实陈述：谁发布了什么、什么时候、关键参数和能力。包含具体数字。链接到一手来源。说明这件事在行业大背景下的位置。}

## 为什么重要

{200-300 字。分析和影响。这会怎样改变工作流、成本结构或竞争格局？和替代方案相比如何？谁受益，谁受冲击？}

## 技术细节

{200-300 字。架构、实现细节、跑分对比或使用方法。有代码片段更好。性能对比。局限性和注意事项。这里是展现深度的地方。}

## 你现在该做什么

{100-200 字。给读者的具体行动建议。试试 X、从 Y 迁移、关注 Z 的进展。按优先级排列，具体、可操作。}

**相关阅读**：[今日简报](/newsletter/YYYY-MM-DD) 有更多背景。另见：[相关文章标题](/blog/related-slug)。

---

*觉得有用？[订阅 AI 简报](/subscribe)，每天 5 分钟掌握 AI 动态。*
```

## 中文标点和格式规则

### 标点符号
- 使用中文标点：，。！？""''（）——
- 括号内是英文时用半角括号但外面用中文上下文：大语言模型（LLM）
- 英文与中文之间加空格：使用 Claude Code 进行开发
- 不要在中文句子中使用英文逗号或句号

### 术语处理
- 首次出现：中文全称（英文缩写），如：大语言模型（LLM）
- 后续使用：可直接用缩写或中文简称
- 没有公认中文译名的术语直接用英文：Transformer、Token、Prompt
- 不要生造翻译

### 数字与单位
- 阿拉伯数字：1500 万参数、提升了 30%
- 金额用美元符号：$20/月
- 大数用万/亿：15 亿参数（不要写 1.5B 参数）
- 中文语境下可用中文数字表达：三个要点、两种方案

### 中国视角
- 涉及国产模型（Qwen、Kimi、GLM、DeepSeek 等）时自然融入对比
- API 在国内的可用性、访问方式简要提及
- 用中国技术圈熟悉的类比，不要照搬英文类比
- 不要强行加入不相关的中国视角

## SEO 规则

1. **目标关键词**必须出现在：标题、第一段（开头）、至少一个 H2 标题、frontmatter 的 `description` 字段
2. **Meta description**（frontmatter `description`）：150-160 字符，包含目标关键词，读起来像一段引人入胜的摘要
3. **关键词数组**：3-5 个相关术语
4. **Slug**：使用英文，小写，连字符分隔（如：`claude-code-skills-guide`）
5. **H2 标题**：清晰、描述性强，至少一个包含关键词

## 内部链接规则

每篇博客必须包含：
- **2+ 个术语表链接**，格式：`[术语](/glossary/term-slug)`
- **1+ 个相关博客或简报链接**：`[相关文章](/blog/slug)` 或 `[简报](/newsletter/YYYY-MM-DD)`
- 所有内链必须上下文相关，不要硬塞

## 内容质量规则

1. **不编造**：素材里没有的细节不要瞎写。信息不明确时用"尚未公开"之类的表述。
2. **超越简报摘要**：添加背景、历史、对比、跑分。博客文章必须比简报提供显著更多的价值。
3. **800-1500 字**（不含 frontmatter）。大多数文章目标 ~1000 字。
4. **具体胜过抽象**：数字、例子、代码 > 空洞的描述。
5. **每个论断有出处**：链接到官方公告、论文、跑分数据。

## 禁止用语

- "在这篇文章中"
- "话不多说"
- "让我们开始吧"
- "下面我们来详细看看"
- "划时代的" / "颠覆性的" / "史无前例的"
- "敬请期待"
- "众所周知"
- "不言而喻"
- "归根结底"
- "展望未来"

## CTA

每篇文章以以下结尾收束：

```markdown
---

*觉得有用？[订阅 AI 简报](/subscribe)，每天 5 分钟掌握 AI 动态。*
```

## Frontmatter 格式

```yaml
---
title: "Claude Code Skills 系统完全指南：AI 工程师必读"
date: 2026-02-28
slug: claude-code-skills-guide
description: "Claude Code 的 Skills 系统怎么用？如何编写 SKILL.md 文件实现一致的 AI 辅助开发。"
keywords: ["Claude Code skills", "SKILL.md", "Claude Code 配置"]
category: DEV
related_newsletter: 2026-02-28
related_glossary: [claude-code, skill-md]
related_compare: [claude-code-vs-cursor]
lang: zh
video_ready: true
video_hook: "Claude Code 最强大的功能不是写代码，而是 Skills"
video_status: none
---
```

## 分类

每篇文章归入一个分类：
- **MODEL**：模型发布、跑分分析、架构解读
- **APP**：消费级产品、平台功能、企业落地
- **DEV**：开发者工具、SDK、API、基础设施、工作流
- **TECHNIQUE**：实用技巧、最佳实践、提示工程
- **PRODUCT**：行业分析、开源项目、商业策略

---

## 范例

```markdown
---
title: "Claude Code Skills 系统完全指南：AI 工程师必读"
date: 2026-02-28
slug: claude-code-skills-guide
description: "Claude Code 的 Skills 系统怎么用？如何编写 SKILL.md 文件实现一致的 AI 辅助开发。"
keywords: ["Claude Code skills", "SKILL.md", "Claude Code 配置"]
category: DEV
related_newsletter: 2026-02-28
related_glossary: [claude-code, skill-md]
related_compare: [claude-code-vs-cursor]
lang: zh
video_ready: true
video_hook: "Claude Code 最强大的功能不是写代码，而是 Skills"
video_status: none
---

# Claude Code Skills 系统完全指南：AI 工程师必读

**Claude Code** 刚刚上线了一个被严重低估的功能：Skills 系统。当所有人都在关注模型智能和上下文长度的时候，Skills 让你把团队的工程规范、写作风格和工作流模式编码成可复用的 Markdown 文件，Claude 在每次交互时自动加载。你可以把它理解成 AI 版的 `.editorconfig` — 只不过它约束的不是格式，而是行为。如果你在用 Claude Code 但没用 Skills，你只用到了一半的能力。

## 发生了什么

Anthropic 发布了 [SKILL.md 规范](https://docs.anthropic.com/claude-code/skills)，作为 Claude Code 项目配置系统的一部分。使用方式很简单：在项目根目录的 `skills/{技能名}/` 目录下放置 `SKILL.md` 文件，Claude Code 工作时会自动加载。

每个 **SKILL.md** 文件包含结构化的指令 — 语气规范、代码模式、校验规则、标准示例 — 用来指导 Claude 在特定领域的行为方式。比如一个新闻简报写作技能会规定语气、禁用词和章节结构；一个代码审查技能会定义严重级别和阻塞标准。

一个项目可以有多个 Skills。Claude Code 会读取所有 `skills/*/SKILL.md` 文件，根据当前任务自动选择相关的技能。不需要 API 配置，不需要提示工程框架 — 就是仓库里的 Markdown 文件，跟着版本控制走。

这是在 [CLAUDE.md](/glossary/claude-md) 基础上的扩展。CLAUDE.md 定义项目级别的命令和环境，Skills 把这个概念延伸到了具体的业务领域。

## 为什么重要

"Claude Code 能用"和"Claude Code 按我们团队的方式工作"之间差距巨大。没有 Skills，每次会话都从零开始 — 模型不知道你的命名规范、测试模式、文档风格和部署约束。

Skills 系统性地解决了这个问题。把指令编码一次，到处生效。10 人团队得到一致的 AI 输出，不需要谁去背提示词模板。

从竞品角度看，[Cursor](/glossary/cursor) 和 GitHub Copilot 提供设置面板和系统提示词，但都没有基于文件、走版本控制、可分享的技能系统。当你的 AI 编码助手的行为定义在 Markdown 文件里，经过 Code Review，存在 Git 里，你获得的可复现性是 UI 配置没法比的。

对于在构建内部 AI 工作流的团队 — 内容管线、代码生成、审查自动化 — Skills 把 Claude Code 从通用助手变成了专业队友。

## 技术细节

SKILL.md 文件结构清晰：

```
# {技能名称}

## 语气与风格
{Claude 应该如何表达}

## 结构
{输出格式、模板、章节}

## 规则
{硬约束：禁用词、必须元素、校验标准}

## 示例
{完整的标准输出示例}
```

底部的标准示例至关重要。Claude 把它当作校准目标 — 匹配语气、结构和细节程度。没有示例时指令被宽泛解读，加上示例后输出质量明显提升。

Skills 天然可组合。一个项目可以同时有 `skills/newsletter-en/SKILL.md`、`skills/blog-en/SKILL.md` 和 `skills/code-review/SKILL.md`。Claude Code 根据任务类型选择合适的技能。

需要注意的限制：Skills 不能访问外部数据或 API，它们是静态指令集。动态行为 — 比如查询数据库或调用接口 — 仍然需要在管线脚本中实现。

## 你现在该做什么

1. **今天就在项目根目录创建 `skills/` 目录**。从你最频繁的 AI 任务开始写第一个 Skill。
2. **每个 SKILL.md 必须包含标准示例**。这一项的效果通常比翻倍指令文本更好。
3. **用版本控制管理 Skills**。像管理代码一样 — 审查改动、讨论优化、追踪效果。
4. **先写具体的，再慢慢扩展**。"Python 代码审查"比"代码质量"好用十倍。
5. **去 GitHub 搜已有的开源 Skills** 作为参考，不要从零开始。

**相关阅读**：[今日简报](/newsletter/2026-02-28) 有更多 Claude Code 动态。另见：[CLAUDE.md 完全指南](/blog/claude-md-guide)。

---

*觉得有用？[订阅 AI 简报](/subscribe)，每天 5 分钟掌握 AI 动态。*
```

---

## 集成说明

在 `write-blog.ts` 中使用此规范时，加载文件并注入系统提示词：

```typescript
const skill = fs.readFileSync('skills/blog-zh/SKILL.md', 'utf-8');
const systemPrompt = `${skill}\n\n## 本次生成规则\n- 日期：${date}\n- 主题：${topic}\n...`;
```

此规范定义结构、语气和质量标准。管线脚本提供素材和主题上下文。
