# Pipeline Stage Gates — 各阶段通过/失败标准

## Stage 1: Collect（数据采集）

| 维度 | 通过 | 失败 |
|------|------|------|
| 当天入库量 | ≥ 20 条 news items | < 20 条 |
| 来源多样性 | ≥ 3 个 source tiers | < 3 个 tier |
| 重试？ | 否（数据源问题，非重试能解决） | — |

校验命令：`npx tsx scripts/validate-pipeline.ts --date={DATE} --step=collect`

---

## Stage 2: Newsletter（EN + ZH）

### 结构完整性

| 维度 | 通过 | 失败 |
|------|------|------|
| 文件存在 | `content/newsletters/{en,zh}/{DATE}.md` 都存在 | 任一缺失 |
| H1 标题 | 存在，>4 词（EN），包含中文（ZH） | 缺失或不合格 |
| H2 sections | ≥ 2 个 | < 2 个 |
| Bold items | ≥ 3 个 | < 3 个 |
| 必备 section（EN） | `## 🎓 MODEL LITERACY` + `## 🎯 PICK OF THE DAY` | 任一缺失 |
| 必备 section（ZH） | `## 🎓 模型小课堂` + `## 🎯 今日精选` | 任一缺失 |
| **Intro 段落** | H1 和第一个 H2 之间有 ≥2 行非空文本（日期行 + intro 描述 + "Today:" preview） | H1 后直接跳到 H2 |

### Frontmatter

| 维度 | 通过 | 失败 |
|------|------|------|
| 必填字段 | title + date + description 齐全 | 任一缺失 |
| description | 非空，用于列表页 preview 显示 | 空或缺失 |

### 外部链接

| 维度 | 通过 | 失败 |
|------|------|------|
| 唯一外链数（EN） | ≥ 10 个不重复的 https:// URL | < 10 |

"唯一外链"= newsletter 正文中 `[...](https://...)` 格式的链接去重后的数量，代表引用了多少条独立新闻源。

### 内容质量

| 维度 | 通过 | 失败 |
|------|------|------|
| EN Forbidden phrases | 无以下词句 | 出现任一即失败 |
| ZH Forbidden phrases | 无以下词句 | 出现任一即失败 |

**EN Forbidden phrases（空洞套话黑名单）**：
> game-changing, revolutionary, unprecedented, in this newsletter, in today's issue, let's dive in, without further ado, stay tuned, as we can see, it's worth noting, at the end of the day, moving forward, in conclusion, as we all know, it goes without saying

**ZH Forbidden phrases**：
> 划时代的, 颠覆性的, 里程碑式的, 在本期简报中, 今天我们来看看, 让我们开始吧, 话不多说, 敬请期待, 众所周知, 不言而喻, 归根结底, 总而言之

这些是在历次 debug session 中观察到的 Claude 常用空话，逐条积累加入黑名单。目的是守护"sharp tech insider"的语气风格。

### 中间产物

| 维度 | 通过 | 失败 | 级别 |
|------|------|------|------|
| `data/filtered-items/{DATE}.json` | 存在且 ≥ 15 条 | 缺失或 < 15 条 | **Error**（硬性） |
| `data/outlines/{DATE}.json` | 存在且结构正确 | 缺失（graceful degradation, 不阻断） | **Warning**（非硬性） |
| `data/blog-seeds/{DATE}.json` | 存在且 ≥ 1 条 | 缺失或空 | **Warning**（非硬性） |

filtered-items 是硬性要求，因为它是 newsletter 选题的中间记录，缺失意味着 Stage 3（agent filter）没有正常运行。outline 和 blog-seeds 缺失只是提醒，不会阻断管线。outline 失败时 writers 回退到自由模式（无大纲指导）。

### Agent Filter 三级降级

| Tier | 模式 | 能力 | 超时 | 降级条件 |
|------|------|------|------|---------|
| 1 | Agent (带工具) | 读历史 newsletter, 运行 check-coverage.ts | 180s | 超时/错误 → Tier 2 |
| 2 | Single-shot (无工具) | 依赖 prompt 中的 bold titles 列表 | 300s | 超时/错误 → Tier 3 |
| 3 | Rule-based | 纯规则：按 source 分桶 + score 排序 | 即时 | 最终兜底 |

### Outline 阶段 (Stage 3b)

| 维度 | 通过 | 失败 |
|------|------|------|
| JSON 解析 | 有效 JSON 对象 | 无法解析 |
| 必需字段 | date, headline_hook, preview_topics, sections, quick_links, total_items, pick_of_the_day, model_literacy | 任一缺失 |
| headline_hook | ≥6 词且含动词 | 太短或无动词 |
| preview_topics | 正好 3 个 | 数量不对 |
| total_items | 15-25 | 超出范围 |
| hero items | ≥2 个 prominence='hero' | <2 个 |

Outline 失败时 graceful degradation：writers 按当前无大纲模式运行，不阻断管线。

### 重试策略
- 最多重试 2 次
- 重试对象：write-newsletter.ts 重跑（不需要重跑 collect）

校验命令：`npx tsx scripts/validate-pipeline.ts --date={DATE} --step=newsletter`

---

## Stage 3: Blog（深度文章）

| 维度 | 通过 | 失败 | 级别 |
|------|------|------|------|
| 文章数量 | ≥ 1 篇 EN post（按 frontmatter date 匹配） | 0 篇 | Error |
| 结构完整 | H1 + ≥ 2 H2 + 有 newsletter CTA | 任一缺失 | Error |
| Frontmatter | title, date, slug, description, category, keywords 齐全 | 任一缺失 | Error |
| 字数 | 500-2000 词（硬限） | < 500 或 > 2000 | Error |
| 字数（建议） | 800-1500 词 | 超出建议区间 | Warning |
| 内链：glossary | ≥ 2 个 `/glossary/` 链接 | < 2 | Warning |
| 内链：blog/newsletter | ≥ 1 个 `/blog/` 或 `/newsletter/` 链接 | 0 | Warning |
| ZH 版本 | 对应 ZH 文件存在 | 缺失 | Warning |
| Forbidden phrases | 无 | 出现即失败 | Error |

### 重试策略
- 最多重试 2 次

校验命令：`npx tsx scripts/validate-pipeline.ts --date={DATE} --step=blog`

---

## Stage 4: SEO（Glossary / FAQ / Compare / Topics）

**特殊说明**：不是每天都生成 SEO 页面，0 个 page 不算失败（`0 pages (ok)`）。只有生成了但质量不合格才算失败。

### 通用标准（所有类型）

| 维度 | 通过 | 失败 |
|------|------|------|
| H1 标题 | 存在 | 缺失 |
| Forbidden phrases | 无 | 出现即失败 |
| Newsletter CTA | 有 subscribe/订阅 链接 | 缺失 |
| ZH 版本 | 对应 ZH 文件存在 | 缺失（Warning） |
| 内链 | ≥ 2 个指向其他 SEO 页面或 blog 的内链 | < 2 |

### 类型专属标准

| 类型 | 字数范围 | 额外要求 |
|------|---------|---------|
| **Glossary** | 150-600 词 | 第一段必须是定义句（"X is..." 或 "X 是..."） |
| **FAQ** | 150-600 词 | ≥ 3 个问答对（H2/H3 标题含 `?`） |
| **Compare** | 300-1000 词 | ≥ 2 个 H2 section + 必须有对比表格（markdown table） |
| **Topics** | 350-1200 词 | ≥ 2 个 H2 section + 必须有内链 |

### AEO（Answer Engine Optimization）说明
- **FAQ Q&A 格式**：AI 搜索引擎（Perplexity、ChatGPT Search）偏好结构化的问答对
- **Glossary 定义句**：Google Featured Snippet 和 AI 引擎偏好 "X is..." 开头的定义

### 重试策略
- 最多重试 1 次

校验命令：`npx tsx scripts/validate-pipeline.ts --date={DATE} --step=seo`

---

## 标准落地位置

| 标准 | 代码实现 | 文件 |
|------|---------|------|
| Collect: 数量 + tiers | ✅ 已实现 | `validate-pipeline.ts` checkCollect() |
| Newsletter: 结构 + forbidden | ✅ 已实现 | `validate.ts` validateNewsletter() |
| Newsletter: frontmatter + 外链 | ✅ 已实现 | `validate-pipeline.ts` checkNewsletter() |
| **Newsletter: intro 段落** | ❌ 未实现 | 需新增到 `validate.ts` |
| Blog: 结构 + 字数 + frontmatter | ✅ 已实现 | `validate.ts` + `validate-pipeline.ts` |
| SEO: 结构 + 字数 + CTA | ✅ 已实现 | `validate.ts` 各 SEO validator |
| **SEO: FAQ ≥3 Q&A** | ❌ 未实现 | 需新增到 `validate.ts` validateFaq() |
| **SEO: Glossary 定义句** | ❌ 未实现 | 需新增到 `validate.ts` validateGlossary() |
