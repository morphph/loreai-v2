# Run Daily Pipeline

Run the full daily content pipeline with verification after each step.

## Usage

```
/run-daily              # Run for today
/run-daily 2026-03-04   # Run for specific date
```

## Pipeline Sequence

Run these steps IN ORDER. Stop and report if any step fails.

### Step 1: Collect News
```bash
npx tsx scripts/collect-news.ts
npx tsx scripts/validate-pipeline.ts --date={DATE} --step=collect
```

### Step 2: Write Newsletter
```bash
npx tsx scripts/write-newsletter.ts --date={DATE}
npx tsx scripts/validate-pipeline.ts --date={DATE} --step=newsletter
```

### Step 3: Write Blog
```bash
npx tsx scripts/write-blog.ts --date={DATE}
npx tsx scripts/validate-pipeline.ts --date={DATE} --step=blog
```

### Step 4: Generate SEO
```bash
npx tsx scripts/generate-seo.ts --date={DATE}
npx tsx scripts/validate-pipeline.ts --date={DATE} --step=seo
```

## After All Steps

Print a summary table:

| Step | Status | Output |
|------|--------|--------|
| Collect | OK/FAIL | {N} items collected |
| Newsletter | OK/FAIL | EN: {words}w, ZH: {words}w, {links} links |
| Blog | OK/FAIL | {N} posts ({slugs}) |
| SEO | OK/FAIL | {N} pages generated |

If all steps passed, ask if user wants to `git add + commit + push`.

## Important

- Run from the project root directory: `/Users/yufanp/Desktop/Project/loreai-v2`
- Default date is today unless specified
- If a step fails, diagnose the ROOT CAUSE (check the script logic, not the rendering), fix it, then re-run that step
- Do NOT skip verification — every step must be checked before moving to the next
