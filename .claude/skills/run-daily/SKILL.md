# Run Daily Pipeline

Run the full daily content pipeline with verification and self-correction after each step.

## Usage

```
/run-daily              # Run for today
/run-daily 2026-03-04   # Run for specific date
```

## 重要：先 validate 再 commit
每个阶段必须 validate 通过后才 git commit+push。
绝不 commit 未通过 validation 的内容。

## Pipeline Sequence

Run these steps IN ORDER. Each step has a validate → retry loop.

### Step 1: Collect News
```bash
npx tsx scripts/collect-news.ts
npx tsx scripts/validate-pipeline.ts --date={DATE} --step=collect
```
Collect 不重试。如果 validation 失败，报告问题并继续（下游会自行处理数据不足的情况）。

### Step 2: Write Newsletter
```bash
npx tsx scripts/write-newsletter.ts --date={DATE}
npx tsx scripts/validate-pipeline.ts --date={DATE} --step=newsletter
```

**如果 validation 失败（最多重试 2 次）：**
1. 读 validation 错误输出，定位具体问题（结构缺失？forbidden phrase？外链不足？）
2. 用 Agent 子任务并行诊断：一个检查生成的 .md 文件内容，一个检查 filtered-items 数据
3. 根据诊断结果决定：
   - 内容质量问题 → 直接重跑 `write-newsletter.ts`（AI 生成有随机性，重跑常能修复）
   - 数据问题 → 检查 collect 阶段输出，可能需要先修 collect
   - 脚本 bug → 修复代码后重跑
4. 重跑后再次 validate，通过才继续

Validation 通过后再 commit+push。

### Step 3: Write Blog
```bash
npx tsx scripts/write-blog.ts --date={DATE}
npx tsx scripts/validate-pipeline.ts --date={DATE} --step=blog
```

**如果 validation 失败（最多重试 2 次）：**
1. 读 validation 错误输出，定位具体问题（词数不足？frontmatter 缺字段？文件缺失？）
2. 用 Agent 子任务并行诊断：一个检查生成的 blog .md 文件，一个检查 blog-seeds 数据
3. 根据诊断结果决定：
   - 内容质量问题 → 直接重跑 `write-blog.ts`
   - seed 数据问题 → 检查 blog-seeds，可能需要重跑 newsletter 的 seed 提取
   - 脚本 bug → 修复代码后重跑
4. 重跑后再次 validate，通过才继续

Validation 通过后再 commit+push。

### Step 4: Generate SEO
```bash
npx tsx scripts/generate-seo.ts --date={DATE}
npx tsx scripts/validate-pipeline.ts --date={DATE} --step=seo
```

**如果 validation 失败（最多重试 1 次）：**
1. 读 validation 错误输出，定位具体问题（类型专属标准：glossary/faq/compare/topics）
2. 根据诊断结果决定：
   - 内容质量问题 → 直接重跑 `generate-seo.ts`
   - 脚本 bug → 修复代码后重跑
3. 重跑后再次 validate，通过才继续

Validation 通过后再 commit+push。

## After All Steps

Print a summary table:

| Step | Status | Retries | Output |
|------|--------|---------|--------|
| Collect | OK/FAIL | 0 | {N} items collected |
| Newsletter | OK/FAIL | 0-2 | EN: {words}w, ZH: {words}w, {links} links |
| Blog | OK/FAIL | 0-2 | {N} posts ({slugs}) |
| SEO | OK/FAIL | 0-1 | {N} pages generated |

If all steps passed, ask if user wants to `git add + commit + push`.

## Important

- Run from the project root directory: `/Users/yufanp/Desktop/Project/loreai-v2`
- Default date is today unless specified
- If a step fails after max retries, stop and report — do NOT continue to downstream steps
- Do NOT skip verification — every step must be validated before moving to the next
- Do NOT commit content that hasn't passed validation
