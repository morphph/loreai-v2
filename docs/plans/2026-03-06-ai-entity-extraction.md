# AI Entity Extraction — Replace Regex with Sonnet

## Problem

1. **Regex extraction is brittle**: Hardcoded patterns miss novel entities, create duplicates (qwen/qwen3/qwen35), can't extract emerging themes
2. **Funnel too narrow**: Entity extraction runs on ~25 filtered newsletter items instead of ~250 collected items. Combined with `mention_count >= 3`, clusters take 4-5 days to qualify for SEO pages

## Decision

- **Approach A**: New `extract` step in `daily-pipeline.sh` at 6:30am SGT
- One Sonnet 4.6 call on all deduped `news_items` from last 24h (~250 items)
- Returns structured, normalized entities
- Lower SEO threshold from `>= 3` to `>= 2` for all page types
- Cost: ~$0.07/day, ~$2/month

## Data Flow (Before)

```
~300 collected -> ~250 deduped -> ~25 filtered -> regex extraction -> clusters (>=3) -> SEO
```

## Data Flow (After)

```
~300 collected -> ~250 deduped -> Sonnet extraction -> clusters (>=2) -> SEO
                                      |
                              (runs independently of newsletter)
```

## Architecture

### New Files

- `scripts/extract-entities.ts` — standalone extraction script
- `skills/entity-extraction/SKILL.md` — Sonnet prompt for entity extraction

### Modified Files

- `scripts/daily-pipeline.sh` — add `extract` step
- `scripts/lib/topic-cluster.ts` — replace `extractEntities()` regex with AI results consumer, fix normalization
- `scripts/lib/db.ts` — possibly add index on `news_items.detected_at` for query performance
- `scripts/generate-seo.ts` — change threshold from `>= 3` to `>= 2`
- `scripts/lib/topic-cluster.ts` — change new-seed threshold from `>= 3` to `>= 2` in `updateClusters()`
- `docs/DEPLOY.md` — add extract cron entry

### Cron Schedule

```
4:00am SGT  collect
5:00am SGT  newsletter
6:30am SGT  extract    <-- NEW (22:30 UTC prev day)
7:00am SGT  blog
9:00am SGT  seo
```

Cron entry: `30 22 * * 1-5 /home/ubuntu/loreai-v2/scripts/daily-pipeline.sh extract >> /home/ubuntu/loreai-v2/logs/extract.log 2>&1`

### Sonnet Prompt Design

Input: JSON array of `{title, summary, source, score}` for all news_items from last 24h.

Output: JSON array of extracted entities:

```json
[
  {
    "entity": "Qwen 3.5",
    "normalized": "qwen",
    "type": "model",
    "mentions": 7
  },
  {
    "entity": "Model Context Protocol",
    "normalized": "mcp",
    "type": "technology",
    "mentions": 4
  }
]
```

Key prompt instructions:
- Normalize entity families (Qwen 3, Qwen 3.5, Qwen-72B -> "qwen")
- Extract type: company | model | technology | framework | concept
- Count deduplicated mentions (same entity in different items)
- Identify emerging entities not in any predefined list
- Extract cross-item themes ("inference cost war", "open-weight licensing")

### Cluster Update Logic

Current (`updateClusters()` in topic-cluster.ts):
1. For existing cluster -> increment mention_count
2. For new entity -> check 7d history in news_items, promote if >= 3

After:
1. For existing cluster -> increment mention_count
2. For new entity -> promote immediately (AI already validated relevance by extracting it)
3. Normalization handled by AI (no more qwen/qwen3/qwen35 duplication)

### Threshold Changes

| Location | Before | After |
|----------|--------|-------|
| `topic-cluster.ts` new seed creation | `mentionCount.cnt >= 3` | Remove — AI extraction is the gate |
| `generate-seo.ts` daily pipeline | `mention_count >= 3` | `mention_count >= 2` |
| `topic-cluster.ts` `runGapAnalysis()` | `mention_count >= 3` | `mention_count >= 2` |

### Error Handling

- If Sonnet call fails: log error, exit step (no fallback to regex — extraction skipped for the day, clusters still accumulate from previous days)
- If response is malformed JSON: retry once, then fail
- Max retries: 2

### Validation

The existing `validate-pipeline.ts` does not have an `extract` step. Add a minimal check:
- At least 1 entity extracted (sanity check)
- No duplicate normalized slugs in output

## Test Strategy

1. Unit test: mock Sonnet response, verify cluster upsert logic
2. Unit test: verify normalization deduplication
3. Integration: `--dry-run` mode that logs extracted entities without writing to DB
4. Verify `mention_count >= 2` threshold produces SEO pages

## Migration

- Existing clusters (all at mention_count=2) will immediately qualify for SEO on next run
- No schema migration needed — same `topic_clusters` table
- Old regex code in `extractEntities()` can be removed entirely
- `dailyTopicUpdate()` in write-newsletter.ts should be removed (extraction is now a separate step)

## Cost

| Item | Per Day | Per Month |
|------|---------|-----------|
| Sonnet 4.6 call (~12K in, ~2K out) | ~$0.07 | ~$2 |
| Brave expansion (unchanged) | ~$0 | ~$0 (free tier) |
| **Total incremental** | **~$0.07** | **~$2** |
