---
title: "Human-in-the-Loop Guide"
status: active
category: guide
last-updated: 2026-03-27
depends-on: ["PIPELINE"]
---

# Human-in-the-Loop Guide

All manual touchpoints across the LoreAI pipeline. One place to know what needs your attention, when, and how.

---

## Daily: Nothing Required

The daily pipeline (Collect → Newsletter → Extract → Freshness → Generate) runs fully automated on VPS cron. No human action needed unless something breaks (you'll see errors in cron logs or C5 health alerts).

---

## Weekly Touchpoints

### 1. Flagship Subtopic Pack Approval

| | |
|---|---|
| **What** | Approve the weekly subtopic pack draft for each flagship topic |
| **When** | Saturday morning (after 7:30am SGT), when convenient |
| **Where** | VPS via SSH |
| **Time** | ~2 minutes per topic |
| **If skipped** | Previous approved pack stays active. Pipeline continues normally. C5 warns after 14 days of no fresh approval. Next Saturday generates a new draft. |

**Flow:**
1. VPS cron runs full discovery Saturday 7:30am SGT, commits draft pack to repo
2. SSH into VPS when convenient:
   ```bash
   ssh loreai
   cd /home/ubuntu/loreai-v2
   # Review the draft
   cat data/flagship-packs/claude-code.json | jq '.diff, .subtopics[].name'
   # Approve + auto-materialize
   npx tsx scripts/flagship-discovery.ts --topic=claude-code --approve
   ```
3. Done — materializes into topic_clusters + seeds keywords

**When to reject:** If the subtopics look wrong (hallucinated categories, missing obvious ones), don't run `--approve`. Fix the SKILL prompt or config, then re-run:
```bash
npx tsx scripts/flagship-discovery.ts --topic=claude-code
```

### 2. C5 Strategic Review (Sunday)

| | |
|---|---|
| **What** | Review the weekly strategic context package |
| **When** | Sunday evening (after 10pm SGT) |
| **Where** | `data/review/` in the repo, or VPS logs |
| **Time** | 5–10 minutes |
| **If skipped** | No pipeline impact. You lose visibility into weekly trends. |

**Flow:**
1. VPS cron runs `review-strategic` Sunday 10pm SGT
2. Output saved to `data/review/` and committed to repo
3. Pull latest on your Mac, review the report
4. Optionally adjust strategy — add/remove flagship topics, tweak pipeline config

---

## On New Flagship Topic

### 3. Add & Approve New Flagship Topic

| | |
|---|---|
| **What** | Add a new topic to the pipeline and approve its first subtopic pack |
| **When** | Whenever you decide to track a new flagship topic |
| **Where** | Code editor (config change) + VPS via SSH (approval) |
| **Time** | ~15 minutes |
| **If skipped** | N/A — this is a one-time setup |

**Flow:**
1. Add entry to `FLAGSHIP_TOPICS` in `scripts/lib/discovery.ts`:
   ```typescript
   {
     slug: 'new-topic',
     name: 'New Topic',
     cornerstoneUrl: 'https://loreai.dev/new-topic',
     excludeDomains: ['loreai.dev'],
   }
   ```
2. Commit + push
3. On VPS: `git pull && npx tsx scripts/flagship-discovery.ts --topic=new-topic`
4. Telegram notification arrives with draft pack
5. Review + Approve
6. Done — freshness mode and B1→B4 automatically pick it up

---

## As-Needed Touchpoints

### 4. Newsletter Quality Spot-Check

| | |
|---|---|
| **What** | Skim today's newsletter for quality issues |
| **When** | After 2am SGT, if you want to check |
| **Where** | `https://loreai.dev/newsletter/YYYY-MM-DD` |
| **Time** | 2 minutes |
| **If skipped** | Quality gates catch most issues. C5 health check runs nightly. |

### 5. C5 Health/Quality Alerts

| | |
|---|---|
| **What** | Respond to health check warnings |
| **When** | After nightly C5 run (9–9:30pm SGT Mon–Fri) |
| **Where** | `data/review/health-YYYY-MM-DD.json` or cron logs |
| **Time** | Varies — 0 if clean, 10–30 min if issues found |
| **If skipped** | Issues accumulate. `--fix` flag auto-resolves deterministic issues. |

### 6. Performance Cycle Review (Saturday)

| | |
|---|---|
| **What** | Review GSC-based anomaly detection and refresh recommendations |
| **When** | Saturday after 10am SGT |
| **Where** | Dashboard at `https://loreai.dev/dashboard?key=aeodashboard` |
| **Time** | 5 minutes |
| **If skipped** | Refresh jobs still auto-queue. You lose strategic oversight. |

---

## Summary Calendar

| Day | Time | Action | Required? |
|---|---|---|---|
| Mon–Fri | Auto | Daily pipeline runs | No action needed |
| Mon–Fri | 9pm+ | C5 health/quality alerts | Check if notified |
| Saturday | 7:30am+ | SSH + approve flagship packs | Yes (when convenient) |
| Saturday | 10am+ | Skim performance dashboard | Optional |
| Sunday | 10pm+ | Read strategic review | Optional |

**Bottom line:** The only weekly action that truly requires your input is **SSH + `--approve` for flagship packs on Saturday**. Everything else is automated or optional monitoring. Telegram one-tap approval can be added later if the SSH step feels too heavy.
