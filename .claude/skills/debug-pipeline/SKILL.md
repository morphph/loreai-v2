# Debug Pipeline

Diagnose and fix pipeline failures. Always trace to root cause.

## Usage

```
/debug-pipeline newsletter    # Debug newsletter pipeline
/debug-pipeline blog          # Debug blog pipeline
/debug-pipeline seo           # Debug SEO pipeline
/debug-pipeline collect       # Debug data collection
/debug-pipeline weekly        # Debug weekly digest
```

## Debugging Philosophy

**ALWAYS fix at the source.** Do NOT:
- Add defensive rendering code to mask missing data
- Add filters/hacks downstream when the upstream logic is wrong
- Patch the output file manually — fix the script that generates it

**DO:**
- Trace the data flow from input to output
- Identify which stage produced wrong/missing data
- Fix the root cause in the script or prompt
- Re-run to verify the fix

## Debug Procedure

### Step 1: Reproduce

Run the pipeline with today's date and capture the full output:
```bash
npx tsx scripts/{script}.ts --date={DATE} 2>&1 | tee /tmp/pipeline-debug.log
```

### Step 2: Identify Failed Stage

Each script logs stage numbers. Find where it fails or produces bad output:
- Check console output for errors, warnings, "skipped" messages
- Check if output files exist and have expected content
- Check database for expected records

### Step 3: Trace Data Flow

For each pipeline, trace data through these stages:

**Newsletter:**
```
news.db (72h items) → Stage 2 (pre-filter) → Stage 3 (agent filter) → Stage 4 (EN gen) → Stage 5 (ZH gen) → Stage 6 (blog seeds) → .md files
```
Key files: `scripts/write-newsletter.ts`, `lib/ai.ts`, `lib/validate.ts`, `skills/newsletter-en/SKILL.md`, `skills/newsletter-zh/SKILL.md`

**Blog:**
```
blog-seeds/{DATE}.json → Stage 2 (pick top 2) → Stage 3a (fetch URL) → Stage 3b (related items) → Stage 3c (EN gen) → Stage 3d (ZH gen) → .md files
```
Key files: `scripts/write-blog.ts`, `lib/ai.ts`, `skills/blog-en/SKILL.md`, `skills/blog-zh/SKILL.md`

**SEO:**
```
topic_clusters (DB) → keywords (DB) → gap analysis → generate pages → .md files
```
Key files: `scripts/generate-seo.ts`, `lib/ai.ts`, `skills/seo/SKILL.md`

**Collect:**
```
External APIs (Tier 0-6) → dedup → news.db
```
Key files: `scripts/collect-news.ts`, `lib/twitter.ts`, `lib/dedup.ts`, `lib/db.ts`

**Weekly:**
```
Mon-Fri newsletters + filtered-items → rank stories → top 5 → EN gen → ZH gen → .md files
```
Key files: `scripts/write-weekly.ts`, `skills/newsletter-en/SKILL.md`

### Step 4: Fix Root Cause

- If AI generation produces bad output → check/fix the prompt in the script or the SKILL.md
- If data is missing → check the upstream pipeline (collect → newsletter → blog → seo)
- If API fails → check rate limits, env vars, retry logic
- If validation fails → check `lib/validate.ts` rules
- If dedup is too aggressive/lenient → check `lib/dedup.ts`

### Step 5: Verify Fix

1. Re-run the failed pipeline step
2. Run `/check-output {DATE}` to verify the output
3. Show the diff of what you changed

## Common Issues Reference

| Symptom | Likely Root Cause | Where to Fix |
|---------|-------------------|--------------|
| Stale models in newsletter | Agent filter prompt missing date context | `write-newsletter.ts` Stage 3 prompt |
| Missing source links | SKILL.md not enforcing link format | `skills/newsletter-*/SKILL.md` |
| ZH generation fails | API fallback cascade exhausted | `write-newsletter.ts` Stage 5 |
| No blog seeds | Newsletter Stage 6 failed silently | `write-newsletter.ts` extractBlogSeeds() |
| SEO pages empty | No active topic clusters (mention < 3) | `write-newsletter.ts` Stage 7 |
| Collect returns 0 items | API key expired or rate limited | Check env vars + API status |
| Duplicate items across days | Dedup window too short | `lib/dedup.ts` |
