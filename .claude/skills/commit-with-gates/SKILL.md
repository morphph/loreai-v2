---
name: commit-with-gates
description: Run all CLAUDE.md quality gates (build, test, validate-pipeline) and only commit + push if every gate passes. User-only invocation — never auto-commit.
disable-model-invocation: true
---

# /commit-with-gates

Enforce the CLAUDE.md backpressure rule before committing. This skill is the **single allowed commit path** for loreai-v2 — it guarantees nothing reaches main without passing every gate.

## Why this exists

CLAUDE.md says:

> Before ANY commit, ALL of these must pass:
> 1. npm run build — SSG build succeeds
> 2. npm test — All vitest tests pass
> 3. validate-pipeline.ts — Content validation (for pipeline changes)
> Do NOT skip failing tests. Do NOT comment out lint rules.

…but the rule was previously enforced by memory alone. This skill makes it executable.

## Procedure

### Step 0 — Refuse if no changes
```bash
git status --porcelain
```
If output is empty, say "Nothing to commit" and stop.

### Step 1 — Always pull first (user's global git workflow rule)
```bash
git pull --rebase
```
If conflicts, stop and ask user to resolve manually. Do NOT auto-resolve.

### Step 2 — Detect what changed
```bash
git diff --cached --name-only
git diff --name-only
git ls-files --others --exclude-standard
```
Categorize:
- **Pipeline change**: any file under `scripts/` or `skills/`
- **Frontend change**: any file under `src/`, `public/`, or root config like `next.config.*`, `tsconfig.json`
- **Content-only change**: only files under `content/` or `data/` (often the result of a pipeline run — gates may not all apply)
- **Docs-only change**: only files under `docs/` or `*.md` at root

### Step 3 — Run gates conditionally

Decide which gates to run based on the categorization above. Always show the user which gates you will run and why, BEFORE running them.

| Change type | Build | Test | validate-pipeline | Extra |
|------------|-------|------|-------------------|-------|
| Pipeline | ✅ | ✅ | ✅ | Also: invoke `pipeline-reviewer` subagent |
| Frontend | ✅ | ✅ | ⏭️ skip | — |
| Content-only | ⏭️ skip | ⏭️ skip | ✅ if any newsletter/blog file | — |
| Docs-only | ⏭️ skip | ⏭️ skip | ⏭️ skip | — |

Run in this order (cheapest gate first so we fail fast):
```bash
# Gate A: lint (always fast)
npm run lint

# Gate B: tests
npm test

# Gate C: build (slowest)
npm run build

# Gate D: pipeline validator (only if pipeline files changed)
npx tsx scripts/validate-pipeline.ts
```

If ANY gate fails:
- Stop immediately. Do NOT proceed to commit.
- Report which gate failed and the last ~30 lines of output.
- Ask the user how to proceed. **Never** suggest skipping a gate.

### Step 4 — Stage + commit

Only after all required gates pass.

```bash
# Stage explicitly — never `git add -A` (could pick up .env.bak files).
git add <files-from-step-2>
```

Draft the commit message:
- Look at recent commits for style: `git log --oneline -10`
- Use a 1-line summary (under 70 chars), then a blank line, then 1-3 bullets explaining WHY (not WHAT)
- Always append the Co-Authored-By trailer

```bash
git commit -m "$(cat <<'EOF'
<summary>

<bullets>

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

### Step 5 — Push

User's global rule: "有任何改动后立即 git commit + push". After commit succeeds:
```bash
git push
```

If the push triggers a Vercel deploy (frontend changes), tell the user the deploy is in flight and offer to verify with WebFetch once it lands.

### Step 6 — Report

Output a 3-line summary:
```
✅ Gates passed: lint, test, build [, validate-pipeline]
✅ Commit: <short-sha> <summary>
✅ Pushed to origin/main [Vercel deploy may take ~60s]
```

## Hard Rules

- **NEVER** use `git commit --no-verify`, `--no-gpg-sign`, or `git push --force`.
- **NEVER** stage with `git add -A` or `git add .` — always list files explicitly.
- **NEVER** amend a previous commit. Always create a new one (per user's CLAUDE.md).
- **NEVER** continue past a failing gate without explicit user instruction in this turn.
- If you discover untracked files that look like secrets (`.env*`, `*.key`, `*credentials*`), refuse to stage them and warn the user.

## Edge cases

- **Pre-commit hook fails**: The commit did NOT happen. Fix the issue, re-stage, create a NEW commit. Never `--amend`.
- **No git remote configured**: Stop after commit, tell user to set up `origin` first.
- **On a non-main branch**: Allow push, but warn that the user is not on main.
- **Detached HEAD**: Refuse to commit. Tell user to `git checkout main` first.

## Invocation

User-only. Invoke as `/commit-with-gates` or `/commit-with-gates <optional message hint>`.

If `disable-model-invocation` is honored, Claude cannot auto-invoke this — meaning every commit is intentional.
