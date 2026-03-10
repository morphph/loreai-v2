---
title: "Claude Code Scheduled Tasks: Automate Recurring Prompts with /loop and Cron"
date: 2026-03-10
slug: scheduled-tasks
description: "How to use Claude Code's /loop command and cron scheduling tools to automate recurring prompts, poll deployments, and set reminders within a session."
keywords: ["Claude Code scheduled tasks", "/loop command", "Claude Code cron", "Claude Code automation"]
category: DEV
related_newsletter: 2026-03-10
related_glossary: [claude-code, mcp-server]
related_compare: [claude-code-vs-cursor]
lang: en
video_ready: true
video_hook: "Stop babysitting your builds — let Claude Code watch them for you"
video_status: published
source_type: video
flow_source: manual-curate
---

# Claude Code Scheduled Tasks: Automate Recurring Prompts with /loop and Cron

**Claude Code** now lets you schedule prompts that run automatically on an interval — no terminal babysitting required. The `/loop` command and underlying **CronCreate** tool turn your coding session into a lightweight automation engine: poll a deployment, watch a PR's CI status, re-run a review workflow every 20 minutes, or set a one-shot reminder to push the release branch at 3pm. Tasks are session-scoped, fire between your turns, and clean themselves up after three days. If you've ever left a terminal open just to periodically check something, this feature replaces that workflow entirely.

## What Happened

Anthropic shipped scheduled task support as a built-in capability of Claude Code. The feature has two entry points: the **`/loop`** skill for quick interval-based scheduling, and the lower-level `CronCreate`, `CronList`, and `CronDelete` tools for full cron-expression control.

`/loop` accepts a natural-language prompt with an optional interval:

```
/loop 5m check if the deployment finished and tell me what happened
```

Claude parses the interval, converts it to a standard 5-field [cron](/glossary/claude-code) expression, schedules the job, and confirms what it picked. Supported units include seconds (`s`), minutes (`m`), hours (`h`), and days (`d`). If you omit the interval entirely, it defaults to every 10 minutes.

The scheduled prompt can itself invoke another command or skill. Running `/loop 20m /review-pr 1234` fires the PR review workflow every 20 minutes automatically — useful for long-running CI pipelines where you want periodic status checks without manual intervention.

For one-shot tasks, natural language works directly: "remind me at 3pm to push the release branch" or "in 45 minutes, check whether the integration tests passed." Claude schedules a single-fire task that deletes itself after running.

Under the hood, three tools handle everything:

| Tool | Purpose |
|------|---------|
| **CronCreate** | Schedule a new task with a 5-field cron expression |
| **CronList** | List all active tasks with IDs, schedules, and prompts |
| **CronDelete** | Cancel a task by its 8-character ID |

A session supports up to 50 concurrent scheduled tasks.

## Why It Matters

The core problem this solves is context switching. Developers routinely leave terminals open to check build status, poll deployment progress, or monitor CI results. Each check breaks focus. Scheduled tasks eliminate that overhead — Claude watches for you and reports back when something changes.

This is particularly valuable for workflows that involve waiting: deployment rollouts, long test suites, PR review cycles, or dependency update checks. Instead of alt-tabbing every few minutes, you set a `/loop` and keep coding. Claude interrupts you only when the scheduled prompt produces output worth reading.

The composability angle is underappreciated. Because `/loop` can invoke other skills and commands, you can chain existing workflows into recurring automations without writing any scripts. A team that already has a `/review-pr` skill gets periodic PR monitoring for free. A `/check-deploy` workflow becomes a deployment watchdog with one line.

Compared to external automation tools like GitHub Actions or dedicated cron jobs, scheduled tasks trade durability for immediacy. They're session-scoped — exit Claude Code and they're gone. That's a feature, not a bug. These are meant for ad-hoc, in-session automation, not permanent infrastructure. For durable scheduling, Anthropic points users toward Desktop scheduled tasks or CI/CD pipelines.

The three-day automatic expiry is a smart guardrail. Forgotten loops can't run indefinitely, consuming API calls and generating noise. If you need something longer-lived, the explicit cancel-and-recreate workflow forces intentionality.

## Technical Deep-Dive

**Cron expressions** follow the standard 5-field format: `minute hour day-of-month month day-of-week`. All fields support wildcards (`*`), single values (`5`), step values (`*/15`), ranges (`1-5`), and comma-separated lists (`1,15,30`). Extended syntax like `L`, `W`, or name aliases (`MON`, `JAN`) is not supported.

Common patterns:

| Expression | Meaning |
|-----------|---------|
| `*/5 * * * *` | Every 5 minutes |
| `0 * * * *` | Every hour on the hour |
| `0 9 * * 1-5` | Weekdays at 9am local |
| `30 14 15 3 *` | March 15 at 2:30pm |

All times use your **local timezone**, not UTC. A cron expression `0 9 * * *` means 9am wherever you're running Claude Code.

**Execution model**: The scheduler checks every second for due tasks and enqueues them at low priority. Scheduled prompts fire *between* your turns — never while Claude is mid-response. If Claude is busy when a task comes due, the prompt waits until the current turn completes. This prevents scheduling from interrupting active work.

**Jitter** prevents API thundering herds across sessions. Recurring tasks fire up to 10% of their period late, capped at 15 minutes. An hourly job might fire anywhere from `:00` to `:06`. One-shot tasks at the top or bottom of the hour fire up to 90 seconds early. The offset is deterministic per task ID — the same task always gets the same jitter.

If precise timing matters, pick an off-minute like `3 9 * * *` instead of `0 9 * * *` to avoid the one-shot jitter window.

**Interval parsing** handles edge cases gracefully. Seconds are rounded up to the nearest minute (cron's minimum granularity). Intervals that don't divide evenly — like `7m` or `90m` — get rounded to the nearest clean interval, and Claude tells you what it chose. The interval can appear as a leading token (`/loop 30m check the build`), a trailing clause (`/loop check the build every 2 hours`), or be omitted entirely (defaults to 10 minutes).

## What You Should Do

1. **Start with deployment polling.** Next time you deploy, run `/loop 5m check if the deployment finished` instead of watching the terminal. This is the easiest way to feel the value immediately.

2. **Wrap existing skills in loops.** If you have a `/review-pr` or similar skill, try `/loop 20m /review-pr {number}` for hands-free CI monitoring on long-running PRs.

3. **Use one-shot reminders for time-sensitive tasks.** "Remind me in 30 minutes to check the staging environment" keeps you focused without a separate timer app.

4. **Prefer off-minute scheduling** for time-critical one-shots. Use `3 9 * * *` instead of `0 9 * * *` to avoid jitter adjustments.

5. **Don't rely on scheduled tasks for anything that must survive a session restart.** They're ephemeral by design. Use GitHub Actions or Desktop scheduled tasks for durable automation.

**Related**: [Today's newsletter](/newsletter/2026-03-10) covers the broader AI tooling landscape. See also: [Claude Code Skills System](/blog/claude-code-skills-guide) for building reusable workflows that pair well with `/loop`.

---

*Found this useful? [Subscribe to AI News](/subscribe) for daily AI briefings.*