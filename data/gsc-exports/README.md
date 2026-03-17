# GSC Exports

This directory holds Google Search Console CSV exports for the planner's discovery pipeline.

## Expected CSV Format

Standard Google Search Console export:

```csv
Query,Page,Clicks,Impressions,CTR,Position
claude code vs devin,,0,120,0%,55.2
how to use claude code offline,,0,45,0%,38.1
claude code docker,https://loreai.dev/...,2,80,2.5%,18.3
```

- **Unmatched queries** have an empty `Page` column (impressions but no landing page)
- Only unmatched queries with `Impressions >= 10` are processed
- Queries must contain the pillar topic name to be relevant

## File Convention

- `latest.csv` — symlink or actual file read by the planner by default
- `weekly-YYYY-MM-DD.csv` — weekly snapshots from the GSC export cron

## Usage

```bash
# Planner reads latest.csv automatically
npx tsx scripts/planner.ts --cluster=claude-code

# Or specify a path explicitly
npx tsx scripts/planner.ts --cluster=claude-code --gsc-csv=data/gsc-exports/weekly-2026-03-10.csv
```
