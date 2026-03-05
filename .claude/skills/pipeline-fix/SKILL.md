# Pipeline Fix Skill

When a daily pipeline step fails or produces low-quality output, follow this systematic process.

## Diagnosis Steps
1. Run `npx tsx scripts/validate-pipeline.ts --date=YYYY-MM-DD --step=all` to get exact failures
2. Run `npx tsx scripts/generate-review.ts --date=YYYY-MM-DD` to inspect rendered output
3. Check `logs/` directory for error output
4. Categorize: Logic Bug vs Content Quality vs API Failure vs Data Issue

## Fix by Category

### Logic Bug (scripts/*.ts)
- Find the exact function that produces wrong output
- Write a test in `scripts/lib/__tests__/` that reproduces the bug
- Fix the bug, ensure test passes
- Verify: `npm test` + `validate-pipeline.ts`

### Content Quality (skills/*.md)
- Compare output against gold standard examples in `__fixtures__/`
- Identify which prompt section produced the bad output
- ITERATE the prompt: add constraint, example, or anti-pattern
- NEVER rewrite skills/ from scratch — they are battle-tested
- Re-run the pipeline step and validate

### API Failure (scripts/lib/ai.ts)
- Check which model/provider failed
- Verify fallback cascade worked correctly
- ZH newsletter has 3-level fallback: Opus → Kimi K2.5 → Sonnet
- If new failure mode: add handling in ai.ts + update CLAUDE.md gotchas

### Data Issue (collect-news.ts / DB)
- Check if source API changed format
- Verify dedup is not too aggressive/lenient (Jaccard threshold 0.5)
- Check DB query time windows (48h primary, 72h buffer)
- Check source tier quotas: Reddit MAX 2, GitHub MAX 4, HuggingFace 3-5
