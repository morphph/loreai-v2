# LoreAI v2 Workflow Guide

We've built a Superpowers-style autonomous development loop inside Claude Code. Four commands (`/brainstorm`, `/plan`, `/build`, `/debug`) + Ralph script = structured, self-correcting development workflow.

## Core Architecture

```
Human idea
  → /brainstorm (understand + design)
  → /plan (gap analysis + task breakdown)
  → /build (TDD + auto-fix loop + code review)
  → /debug (systematic root cause analysis)
```

**Key upgrades over vanilla Claude Code:**
- Subagents for code reading/review (keeps main context clean)
- Self-healing iteration loops (test fail → fix → retry, max 5 rounds)
- Fallback strategies on every task (never get permanently stuck)
- Two-phase automated code review (spec compliance + quality)

## The 4 Phases

### Phase 1: Local Development (brainstorm → plan → build)

**When**: Adding features, fixing bugs, refactoring.

```bash
# Interactive — inside Claude Code
/brainstorm    # Discuss design, get approval
/plan          # Generate implementation plan
/build         # Execute one task at a time

# Autonomous — Ralph loop (headless)
./scripts/ralph.sh plan       # Auto-generate plan
./scripts/ralph.sh build 10   # Auto-build, 10 iterations
```

**What happens**: Code changes are made locally, tests pass, build succeeds, commits are created. Vercel auto-deploys from main.

### Phase 2: Vercel Deployment

**When**: After pushing to main, Vercel auto-deploys the Next.js frontend.

**Workflow**: Push → Vercel builds SSG → Site live. No manual steps needed. If build fails, Vercel keeps the previous deployment.

### Phase 3: Content + Pipeline

**When**: Daily content generation (newsletters, blogs, SEO pages).

```bash
# Daily pipeline (cron on VPS, SGT timezone)
4am  → npx tsx scripts/collect-news.ts
5am  → npx tsx scripts/write-newsletter.ts --date=YYYY-MM-DD
7am  → npx tsx scripts/write-blog.ts --date=YYYY-MM-DD
9am  → npx tsx scripts/generate-seo.ts --date=YYYY-MM-DD
# Saturday
5am  → npx tsx scripts/write-weekly.ts
```

After pipeline runs, always validate:
```bash
npx tsx scripts/validate-pipeline.ts --date=YYYY-MM-DD --step=all
npx tsx scripts/generate-review.ts --date=YYYY-MM-DD
```

If content quality issues arise → `/debug` to diagnose, then iterate the relevant `skills/` prompt.

### Phase 4: VPS Automation

**When**: Setting up or maintaining the production pipeline on VPS.

The VPS runs cron jobs that execute the pipeline scripts. Ralph can also run on VPS for autonomous development tasks. Key concerns:
- Timezone: VPS may differ from local — always use explicit `--date` params
- API keys: Managed via environment variables on VPS
- Monitoring: Check logs/ directory and validate-pipeline.ts output

## Ralph Script

`./scripts/ralph.sh` is the autonomous loop runner. It feeds prompts from `docs/prompts/` to Claude in headless mode:

- `ralph.sh plan` — reads `PROMPT_plan.md`, generates/updates the implementation plan
- `ralph.sh build N` — reads `PROMPT_build.md`, executes N tasks sequentially, commits and pushes after each

Each PROMPT file mirrors its corresponding `/command` but is optimized for headless execution (no human interaction needed).

## Quick Reference

| Scenario | Command |
|----------|---------|
| New feature idea | `/brainstorm` |
| Ready to plan | `/plan` |
| Implement next task | `/build` |
| Something broke | `/debug` |
| Autonomous planning | `./scripts/ralph.sh plan` |
| Autonomous building | `./scripts/ralph.sh build 10` |
| Pipeline failed | Use pipeline-fix skill or `/debug` |
| Content quality issue | Use content-review skill |
