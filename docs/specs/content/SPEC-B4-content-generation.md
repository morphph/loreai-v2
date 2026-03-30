---
title: "SPEC-B4 — Source-Grounded Content Generation"
status: active
category: spec
last-updated: 2026-03-20
depends-on: ["SPEC-B3"]
---

# SPEC-B4 — Source-Grounded Content Generation

> **Files:**
> - `scripts/generate-content.ts` — CLI entry point（替代旧 `generate-seo.ts`）
> - `scripts/lib/content-gen.ts` — Core orchestration logic（testable）
> - `scripts/lib/link-validator.ts` — Post-generation link validation
>
> **Depends on:** A2 (serper.ts), A3 (exa.ts), B3 (score-queue — populated `create_queue` table), `scripts/lib/ai.ts` (Claude calls), `scripts/lib/gemini-research.ts` (Deep Research), `scripts/lib/validate.ts` (existing validators), `skills/seo/SKILL.md` (existing SEO skill)
> **Consumed by:** C1 (discovery cycle), C4 (daily pipeline reorg)

---

## 1. Purpose

从 `create_queue` 表取 pending jobs，按 `research_pipeline` 分流到 **Standard** 或 **Deep Research** pipeline，用真实 source material 驱动 Claude 生成内容，最后验证内部链接并写入文件系统 + DB。

这是 keyword engine 的 **生产终端**——它回答 "How do we create trustworthy, high-quality content?" 的问题（STRATEGY §4.6）。B3 决定做什么、按什么顺序做，B4 负责执行生产。

**与旧 `generate-seo.ts` 的关系：**

| 旧模型（generate-seo.ts） | 新模型（generate-content.ts） |
|---|---|
| 从 `topic_clusters` 表扫描 content gaps | 从 `create_queue` 表取已排序的 jobs |
| Content type 决定了生产顺序 | Priority score 决定生产顺序（B3 已排好） |
| 没有 source grounding——Claude 从记忆生成 | 两条 pipeline 均使用真实 source material |
| 固定的 4 种 page types | 7 种 content types（faq, compare, glossary, topic-hub, news-blog, deep-dive, cornerstone） |
| 不验证内部链接 | Post-generation link validation |

**核心设计原则：**
- `scripts/lib/content-gen.ts` 只做 orchestration（取 job → research → generate → validate → write）
- Research pipeline 和 content skill 是正交的两个维度——pipeline 决定 source depth，skill 决定 output format
- 所有生成内容都经过 source grounding，不存在 "从 AI 记忆生成" 的路径

---

## 2. CLI Interface

```bash
# 基本用法：从 create_queue 取 top N pending jobs 并执行
npx tsx scripts/generate-content.ts --limit=5

# 只处理特定 job
npx tsx scripts/generate-content.ts --job=42

# 只处理特定 content type
npx tsx scripts/generate-content.ts --type=faq --limit=10

# Dry run（不调 AI、不写文件、不更新 DB）
npx tsx scripts/generate-content.ts --limit=5 --dry-run

# 跳过 ZH 生成（只生成 EN）
npx tsx scripts/generate-content.ts --limit=5 --en-only

# 跳过 link validation
npx tsx scripts/generate-content.ts --limit=5 --skip-validation
```

### Arguments

| Arg | Required | Default | Description |
|---|---|---|---|
| `--limit` | No（与 `--job` 二选一） | 5 | 从 queue 取 top N 个 pending jobs |
| `--job` | No | — | 指定 job_id，只执行这一个 |
| `--type` | No | 全部 | 过滤 content_type（faq, compare, glossary, topic-hub, news-blog, deep-dive, cornerstone） |
| `--dry-run` | No | false | 不调 AI、不写文件、不更新 DB，只输出 job 信息 + research plan |
| `--en-only` | No | false | 只生成 EN，跳过 ZH |
| `--skip-validation` | No | false | 跳过 post-generation link validation |

---

## 3. 核心流程

```
┌─────────────────────────────────────────────────────────┐
│  Stage 1: Load Jobs                                      │
│    SELECT * FROM create_queue                            │
│    WHERE status = 'pending'                              │
│    ORDER BY priority_score DESC                          │
│    LIMIT ?                                               │
│    + JOIN keyword_groups for primary_keyword, intent     │
├─────────────────────────────────────────────────────────┤
│  Stage 2: Research (per job)                             │
│    if research_pipeline = 'standard':                    │
│      → Serper search (primary keyword)                   │
│      → Exa getContents (top 5 URLs)                      │
│      → assemble SourcePack                               │
│    if research_pipeline = 'deep_research':               │
│      → Gemini Deep Research (primary keyword + context)  │
│      → assemble SourcePack                               │
├─────────────────────────────────────────────────────────┤
│  Stage 3: Generate (per job, per lang)                   │
│    → Build prompt: skill + source material + context     │
│    → callClaudeWithRetry (EN)                            │
│    → Validate output (existing validators)               │
│    → callClaudeWithRetry (ZH)                            │
│    → Validate output                                     │
├─────────────────────────────────────────────────────────┤
│  Stage 4: Link Validation (per generated page)           │
│    → Extract all internal links from markdown            │
│    → Check each link target exists (file or DB)          │
│    → Remove broken links, flag missing glossary links    │
├─────────────────────────────────────────────────────────┤
│  Stage 5: Write & Update                                 │
│    → Write markdown to content/{type}/{lang}/{slug}.md   │
│    → upsertContent() to DB                               │
│    → UPDATE create_queue SET status='completed'          │
│    → UPDATE keywords SET content_exists=1                │
└─────────────────────────────────────────────────────────┘
```

---

## 4. Stage 2: Research Pipelines

### 4.1 Standard Pipeline

```typescript
export interface SourcePack {
  primary_keyword: string;
  serp_results: Array<{
    title: string;
    link: string;
    snippet: string;
    position: number;
  }>;
  source_pages: Array<{
    url: string;
    title: string;
    text: string;         // clean full text from Exa
    word_count: number;
  }>;
  paa_questions: string[];       // People Also Ask
  related_searches: string[];    // Serper related
  serp_depth: {
    depth: 'short_answer' | 'long_form' | 'mixed';
    avg_snippet_length: number;
    has_answer_box: boolean;
  };
  research_pipeline: 'standard' | 'deep_research';
}
```

**流程：**

1. **Serper `searchFull(primaryKeyword)`** → 获取 organic results + PAA + related searches
2. **Serper `detectSERPDepth(primaryKeyword)`** → 获取 SERP depth signal（如果 B3 已经做过，从 `create_queue` 读取缓存）
3. **Exa `getContents(top5URLs)`** → 获取 top 5 organic results 的 clean full text
   - `text: { maxCharacters: 3000 }` per page（控制 token 用量）
   - 过滤掉 word_count < 100 的页面（太短无价值）
4. **组装 SourcePack** → 传入 prompt builder

**API 成本控制：**
- Serper: 1 search call + 1 depth call = 2 credits per job（B3 可能已调过 depth，缓存复用）
- Exa: 1 getContents call（batch 5 URLs）= 5 credits per job
- 总计：~7 API credits + 1 Claude call per job per lang

### 4.2 Deep Research Pipeline

**流程：**

1. **Gemini Deep Research** via `runGeminiDeepResearch(topic, outputPath)`
   - topic = `{primary_keyword} — comprehensive guide for {content_type}`
   - 输出到 `tmp/research/{slug}.md`
2. **Read research output** → parse into SourcePack
   - `source_pages` = `[{ url: 'gemini-research', title: topic, text: researchOutput, word_count }]`
   - `paa_questions` = extracted from research output（如果有）
   - `research_pipeline` = `'deep_research'`
3. **可选：补充 Serper PAA** → 即使用了 Deep Research，PAA questions 仍然有价值（帮助结构化内容）

**Deep Research budget：** B3 的 `create_queue` 中 `research_pipeline = 'deep_research'` 的 jobs 每周最多处理 5 个。CLI 不做 budget enforcement——这是 C1 (discovery-cycle) 的责任。

---

## 5. Stage 3: Content Generation

### 5.1 Prompt 结构

```typescript
function buildGenerationPrompt(
  contentType: ContentType,
  sourcePack: SourcePack,
  context: GenerationContext,
  lang: 'en' | 'zh',
): { system: string; user: string }
```

**System prompt 三段式：**

```
[1. Skill]
加载 skills/seo/SKILL.md（现有的 SEO content writing skill）

[2. Content Type Instructions]
根据 content_type 选择对应的 page type template（SKILL.md 中已定义 glossary/faq/compare/topic-hub）
对于新类型（news-blog, deep-dive, cornerstone）：在 prompt 中 inline 定义 structure

[3. Source Material]
## Source Material — DO NOT fabricate beyond these sources

### SERP Analysis
- Top results: {serp_results}
- People Also Ask: {paa_questions}
- Related searches: {related_searches}
- SERP depth: {serp_depth.depth}

### Source Pages (full text from Exa / Deep Research)
{source_pages — each with title, URL, and text}

### Context
- Primary keyword: {primary_keyword}
- Secondary keywords: {secondary_keywords from keyword_group}
- Target intent: {intent}
- Cluster: {cluster_slug}
- Available internal links: {from getRelatedSlugs()}
```

**User prompt：**

```
Write a {content_type} page for the keyword "{primary_keyword}".
Use ONLY the source material provided above. Do not fabricate details, benchmarks, or capabilities not found in the sources.
If sources are insufficient, note limitations honestly rather than inventing information.
```

### 5.2 Content Type Routing

| content_type | Research Pipeline | Skill Section | Word Count (EN) | Word Count (ZH) | Claude Model |
|---|---|---|---|---|---|
| `faq` | Standard | SKILL.md Page Type 2 | 200–800 | 200–450 | haiku |
| `compare` | Standard | SKILL.md Page Type 3 | 800–1500 | 350–700 | sonnet |
| `glossary` | Standard | SKILL.md Page Type 1 | 200–500 | 200–350 | haiku |
| `topic-hub` | Standard | SKILL.md Page Type 4 | 1000–2000 | 450–900 | sonnet |
| `news-blog` | Standard | Inline (§5.3) | 800–1500 | 600–1200 | sonnet |
| `deep-dive` | Deep Research | Inline (§5.3) | 2500–4000 | 2000–3500 | opus |
| `cornerstone` | Deep Research | Inline (§5.3) | 2500–4000 | 2000–3500 | opus |

**Model 选择逻辑：**
- faq / glossary → haiku（短内容，结构化强，haiku 足够）
- compare / topic-hub / news-blog → sonnet（需要分析判断）
- deep-dive / cornerstone → opus（长内容，需要深度综合）

### 5.3 新 Content Type 的 Inline Prompt 补充

**news-blog:**

```markdown
## Generation Task — News Blog Post
- Lead with the news event, then provide analysis
- First paragraph must state: WHAT happened, WHO is involved, WHEN
- Structure: News lead → Analysis → Impact → What's next
- Word count: 800-1500
- Include source attribution: "According to [source]..."
- Must use source material — no speculation
```

**deep-dive:**

```markdown
## Generation Task — Deep-Dive Blog Post
- Workflow-oriented: explain HOW to use/apply the topic, not just WHAT it is
- Include code examples where relevant
- Structure: Problem → Context → Implementation → Tradeoffs → Takeaways
- Word count: 2500-4000
- Bold key terms, use H2/H3 hierarchy, short paragraphs
- Based on Gemini Deep Research output — synthesize and structure, don't summarize
```

**cornerstone:**

```markdown
## Generation Task — Cornerstone Page
- The definitive guide to {topic} on our site
- Comprehensive but scannable: clear H2 headings, direct answers at section tops
- Structure: Overview → Core concepts → Key features → Common questions → Getting started → Resources
- Word count: 2500-4000
- Must link to all supporting cluster pages (glossary, FAQ, compare)
- Every H2 section should be independently valuable (quotable by AI systems)
```

### 5.4 ZH Generation

遵循现有 `generate-seo.ts` 的 ZH 模式：

- ZH 是独立创作，不是翻译
- slug 保持与 EN 相同
- 技术术语保留英文
- 内部链接路径不变
- CTA 使用中文版：`*觉得有用？[订阅 LoreAI](/subscribe)，每天 5 分钟掌握 AI 动态。*`
- 使用 `buildZhSystemAddendum()` 逻辑（现有 generate-seo.ts 中已有）

**生成顺序：** 先 EN 后 ZH。如果 EN 生成失败，ZH 跳过（不会出现只有 ZH 没有 EN 的情况）。

### 5.5 Validation

复用现有 validators（`scripts/lib/validate.ts`）：

| content_type | Validator |
|---|---|
| `faq` | `validateFaq()` |
| `compare` | `validateCompare()` |
| `glossary` | `validateGlossary()` |
| `topic-hub` | `validateTopicHub()` |
| `news-blog` | `validateBlogPost()` |
| `deep-dive` | `validateBlogPost({ maxWords: 5000 })` |
| `cornerstone` | `validateBlogPost({ maxWords: 5000 })` |

`callClaudeWithRetry` 最多重试 3 次（EN）/ 2 次（ZH），每次 retry 传入 validation errors 让 Claude 修正。

---

## 6. Stage 4: Link Validation

### 6.1 `scripts/lib/link-validator.ts`

```typescript
export interface LinkValidationResult {
  total_links: number;
  valid_links: number;
  broken_links: Array<{ link: string; reason: string }>;
  missing_glossary_links: Array<{ term: string; slug: string }>;
  fixed_markdown: string;  // broken links removed
}

export function validateLinks(
  markdown: string,
  contentType: string,
  lang: string,
): LinkValidationResult
```

### 6.2 检查逻辑

1. **Extract all internal links** — regex: `/\[([^\]]+)\]\((\/[^)]+)\)/g`
2. **For each link**, check target exists:
   - `/glossary/{slug}` → `content/glossary/{lang}/{slug}.md` exists OR DB `content` table has record
   - `/faq/{slug}` → `content/faq/{lang}/{slug}.md` exists OR DB record
   - `/compare/{slug}` → `content/compare/{lang}/{slug}.md` exists OR DB record
   - `/blog/{slug}` → `content/blog/{lang}/{slug}.md` exists OR DB record
   - `/topics/{slug}` → `content/topics/{lang}/{slug}.md` exists OR DB record
   - `/newsletter/{date}` → `content/newsletter/{lang}/{date}.md` exists
   - `/subscribe` → always valid（硬编码 whitelist）
3. **Broken links** → 从 markdown 中移除（保留 anchor text，去掉 link wrapper）
4. **Missing glossary links** → 扫描 body text，查找已存在的 glossary terms 但未被链接的，输出 warning（不自动修复，避免过度链接）

### 6.3 调用时机

- 每个生成的 page（EN + ZH 分别验证）
- 如果 `--skip-validation` 则跳过
- Validation result 写入 console log

---

## 7. Stage 5: Write & DB Update

### 7.1 File Output

```
content/{type}/{lang}/{slug}.md
```

沿用现有 `generate-seo.ts` 的文件组织方式。`fs.mkdirSync(dir, { recursive: true })` 确保目录存在。

### 7.2 DB Updates

每个成功生成的 page：

```sql
-- 1. Upsert content record
INSERT INTO content (type, slug, lang, title, body_markdown, meta_json)
VALUES (?, ?, ?, ?, ?, ?)
ON CONFLICT(type, slug, lang) DO UPDATE SET ...

-- 2. Update create_queue status
UPDATE create_queue
SET status = 'completed', completed_at = CURRENT_TIMESTAMP
WHERE job_id = ?

-- 3. Mark keywords as covered
UPDATE keywords
SET content_exists = 1, content_type = ?, content_slug = ?
WHERE keyword_group_id = ?
```

如果 EN 成功但 ZH 失败：
- `create_queue.status` = `'partial'`（不标记为 completed，下次 run 时只重试 ZH）

如果 EN 失败：
- `create_queue.status` 保持 `'pending'`
- 失败原因写入 console error

---

## 8. 与旧 pipeline 的共存

### 8.1 不改动的文件

- `scripts/generate-seo.ts` — 保留不动，旧 cron 继续运行直到 C4 切换
- `skills/seo/SKILL.md` — B4 复用，不修改
- `scripts/lib/validate.ts` — B4 复用，不修改
- `scripts/lib/ai.ts` — B4 复用 `callClaudeWithRetry()`

### 8.2 新建文件

| 文件 | 职责 |
|---|---|
| `scripts/generate-content.ts` | CLI entry point（类似 `score-and-queue.ts` 的模式） |
| `scripts/lib/content-gen.ts` | Core orchestration：loadJobs → research → generate → validate → write |
| `scripts/lib/link-validator.ts` | Post-generation link validation |

### 8.3 迁移路径

1. **B4 实现完成后**，两个 pipeline 并行运行（旧的 via cron，新的手动）
2. **C4 阶段** 切换 cron 为 `generate-content.ts`，retire `generate-seo.ts`

---

## 9. Types

```typescript
// ── Content Types ──

export type ContentType =
  | 'faq'
  | 'compare'
  | 'glossary'
  | 'topic-hub'
  | 'news-blog'
  | 'deep-dive'
  | 'cornerstone';

// ── Queue Job (from DB) ──

export interface QueueJob {
  job_id: number;
  keyword_group_id: number;
  content_type: ContentType;
  research_pipeline: 'standard' | 'deep_research';
  priority_score: number;
  status: string;

  // Joined from keyword_groups
  primary_keyword: string;
  intent: string;
  cluster_slug: string | null;

  // Joined from keywords
  secondary_keywords: string[];
}

// ── Generation Context ──

export interface GenerationContext {
  job: QueueJob;
  sourcePack: SourcePack;
  relatedSlugs: {
    glossary: string[];
    blog: string[];
    compare: string[];
    faq: string[];
  };
}

// ── Generation Result ──

export interface GenerationResult {
  job_id: number;
  content_type: ContentType;
  slug: string;
  en: { success: boolean; filePath?: string; errors?: string[] };
  zh: { success: boolean; filePath?: string; errors?: string[] };
  link_validation?: LinkValidationResult;
}

// ── Run Summary ──

export interface ContentGenRunResult {
  jobs_processed: number;
  pages_generated: { en: number; zh: number };
  pages_failed: { en: number; zh: number };
  broken_links_removed: number;
  api_calls: { serper: number; exa: number; claude: number; gemini: number };
}
```

---

## 10. 测试策略

### 10.1 Unit Tests — `scripts/lib/__tests__/content-gen.test.ts`

**Mock 策略：** Mock 所有外部调用（Serper, Exa, Claude, Gemini, DB, filesystem），验证 orchestration logic。

**测试用例：**

```typescript
// ── Standard Pipeline Tests ──

test('standard pipeline: assembles SourcePack from Serper + Exa', async () => {
  // Mock Serper searchFull → returns organic results + PAA
  // Mock Exa getContents → returns page text
  // Verify SourcePack structure matches interface
});

test('standard pipeline: skips Exa pages with word_count < 100', async () => {
  // Mock Exa returning a very short page
  // Verify it's filtered out of SourcePack
});

test('standard pipeline: handles Exa failure gracefully', async () => {
  // Mock Exa throwing ExaAPIError
  // Verify pipeline continues with Serper data only (degraded but not failed)
});

// ── Deep Research Pipeline Tests ──

test('deep research pipeline: uses Gemini output as source', async () => {
  // Mock runGeminiDeepResearch → writes research file
  // Verify SourcePack uses research output as source_pages
});

test('deep research pipeline: falls back on Gemini failure', async () => {
  // Mock Gemini returning false (failure)
  // Verify fallback to standard pipeline (Serper + Exa)
});

// ── Content Generation Tests ──

test('generates EN markdown with correct frontmatter', async () => {
  // Mock Claude response with valid markdown
  // Verify output has frontmatter, H1, correct word count
});

test('generates ZH independently (not translation)', async () => {
  // Mock Claude response for ZH
  // Verify lang: zh in frontmatter, CJK content present
});

test('skips ZH when EN fails', async () => {
  // Mock Claude failing for EN (validation fails 3x)
  // Verify ZH generation is skipped
  // Verify create_queue status stays 'pending'
});

test('sets create_queue status to partial when EN succeeds but ZH fails', async () => {
  // Mock EN success, ZH validation fails
  // Verify status = 'partial'
});

// ── Prompt Building Tests ──

test('prompt includes source material from SourcePack', () => {
  // Build prompt with mock SourcePack
  // Verify system prompt contains source page text
  // Verify "DO NOT fabricate" instruction present
});

test('prompt selects correct skill section by content_type', () => {
  // Test each content_type maps to correct SKILL.md template
});

test('prompt includes secondary keywords', () => {
  // Verify all secondary keywords appear in prompt context
});

// ── Content Type Routing Tests ──

test('routes faq to haiku model', () => {
  // Verify model selection for faq
});

test('routes deep-dive to opus model', () => {
  // Verify model selection for deep-dive
});

test('routes each content_type to correct validator', () => {
  // Verify validator mapping matches §5.5 table
});

// ── Queue Processing Tests ──

test('processes jobs in priority_score DESC order', async () => {
  // Mock DB with multiple pending jobs
  // Verify processing order
});

test('respects --limit flag', async () => {
  // Mock 10 pending jobs, --limit=3
  // Verify only 3 processed
});

test('respects --type filter', async () => {
  // Mock mixed jobs, --type=faq
  // Verify only faq jobs processed
});

test('--job flag processes single specific job', async () => {
  // Mock specific job_id
  // Verify only that job is processed
});
```

### 10.2 Unit Tests — `scripts/lib/__tests__/link-validator.test.ts`

```typescript
test('extracts internal links from markdown', () => {
  const md = 'See [Claude Code](/glossary/claude-code) and [pricing FAQ](/faq/claude-code-pricing).';
  // Verify 2 links extracted
});

test('marks link as broken when target file does not exist', () => {
  // Mock fs.existsSync → false, DB query → null
  // Verify link in broken_links array
});

test('removes broken links from markdown (keeps anchor text)', () => {
  const md = 'See [Claude Code](/glossary/nonexistent) for details.';
  // Verify fixed_markdown = 'See Claude Code for details.'
});

test('/subscribe is always valid', () => {
  const md = '[Subscribe to LoreAI](/subscribe)';
  // Verify no broken links
});

test('detects missing glossary links', () => {
  // Mock: glossary entry "claude-code" exists, but text mentions "Claude Code" without linking
  // Verify missing_glossary_links includes { term: "Claude Code", slug: "claude-code" }
});

test('handles ZH content paths correctly', () => {
  // Verify checks content/{type}/zh/{slug}.md for lang='zh'
});
```

### 10.3 Integration Test（手动，VPS 上跑）

```bash
# 1. 确保 create_queue 有 pending jobs（先跑 B1 → B2 → B3）
npx tsx scripts/score-and-queue.ts --topic=claude-code

# 2. Dry run — 查看会处理哪些 jobs
npx tsx scripts/generate-content.ts --limit=3 --dry-run

# 3. 真实生成 1 个 FAQ（最便宜的测试）
npx tsx scripts/generate-content.ts --type=faq --limit=1

# 4. 验证输出
cat content/faq/en/{slug}.md   # 检查 frontmatter + body + CTA
cat content/faq/zh/{slug}.md   # 检查 ZH 版本

# 5. 验证 DB 更新
sqlite3 loreai.db "SELECT status FROM create_queue WHERE job_id = ?"
sqlite3 loreai.db "SELECT content_exists FROM keywords WHERE keyword_group_id = ?"
```

---

## 11. Error Handling

| Scenario | Behavior |
|---|---|
| Serper API 失败 | Log warning，用空 SERP data 继续（Claude 从 skill 知识生成，质量降级但不中断） |
| Exa API 失败 | Log warning，用 Serper snippets 替代 full text（降级） |
| Gemini 失败 | Fallback 到 Standard pipeline（Serper + Exa），log warning |
| Claude 生成失败（validation 全部 fail） | Mark job as `'pending'`，不写文件，log error，继续下一个 job |
| EN 成功 ZH 失败 | Mark job as `'partial'`，写 EN 文件，skip ZH |
| Link validation 发现 broken links | 自动移除，log warning，不阻塞写入 |
| DB write 失败 | Throw（严重错误，停止当前 job） |

**不会发生的 cascade failure：** 每个 job 独立处理，一个 job 失败不影响其他 jobs。

---

## 12. Output Example

```
📝 Content Generation — processing 3 jobs
==================================================

📥 Job 1/3: [faq] "how much does claude code cost" (score: 450.0)
  🔍 Standard Pipeline: Serper search...
    Found 10 organic results, 4 PAA questions
  📄 Exa getContents: fetching 5 URLs...
    4/5 pages fetched (1 failed: timeout)
  ✏️  Generating EN...
    EN generated (model: claude-haiku-4-5, 312→842 tokens)
    Validation: ✓ passed
  ✏️  Generating ZH...
    ZH generated (model: claude-haiku-4-5, 356→768 tokens)
    Validation: ✓ passed
  🔗 Link validation:
    8 links checked: 7 valid, 1 broken (/glossary/nonexistent → removed)
  💾 Written: content/faq/en/how-much-does-claude-code-cost.md
  💾 Written: content/faq/zh/how-much-does-claude-code-cost.md
  ✅ Job 42 → completed

📥 Job 2/3: [deep-dive] "claude code agent teams guide" (score: 380.0)
  🔬 Deep Research Pipeline: Gemini research...
    [RESEARCH] Starting Gemini Deep Research...
    [RESEARCH] This may take 10-20 minutes...
    [RESEARCH] Success: tmp/research/claude-code-agent-teams-guide.md
  ✏️  Generating EN...
    EN generated (model: claude-opus-4-6, 4521→6234 tokens)
    Validation: ✓ passed
  ...

==================================================
💾 Summary
  3 jobs processed
  EN: 3 generated, 0 failed
  ZH: 2 generated, 1 failed (partial)
  1 broken link removed
  API calls: 4 Serper, 2 Exa, 8 Claude, 1 Gemini
```
