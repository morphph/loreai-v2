# CODEX_MIGRATION.md — loreai-v2

## Locations
- **Old directory:** `/Users/yufanp/Desktop/Project/loreai-v2` (untouched; its extra worktrees `v2-engine`, `worktree-content`, `elastic-mcnulty`, `kind-borg` were left alone)
- **New directory:** `/Users/yufanp/Developer/loreai-v2`
- **GitHub:** https://github.com/morphph/loreai-v2.git
- **Branch:** `main`
- **Tip commit:** `797b72b` (`📰 AI News 2026-07-22`). New clone == `origin/main`. Old local `main` was 23 commits **behind** remote (auto daily-news commits; nothing unpushed) — the fresh clone is current.

## Clone method
Standard full clone (`git clone --branch main --single-branch`) — ~18 MB / 1,576 files, completed cleanly.

## ⚠️ Secret incident (needs your decision — not auto-remediated)
`​.env.bak.20260419_0759` (858 bytes, 14 `KEY=` lines) is **committed to git and present in this public repo's history.** `.gitignore` covered `.env` / `.env.*.local` but not `.env.bak*`, so the backup slipped in.
- I did **not** print, copy, delete, or rewrite history for it (secret-handling + no-history-rewrite rules).
- I **did** add `.env.bak` / `.env.bak.*` to `.gitignore` to prevent recurrence.
- **Recommended remediation (do on the Mac, with your authorization):** rotate every key that was in that file, then purge the file from history (e.g. `git filter-repo` / GitHub secret-scanning removal) and force-clean the remote. Removing it from HEAD alone does not undo the exposure.

## Codex files created / modified
- **AGENTS.md** — already existed and was good; extended with repository structure, setup commands, explicit safety constraints, and a Definition-of-Done (backpressure) section. Existing NEVER/Style/Skills content preserved.
- **.gitignore** — added `.env.bak` / `.env.bak.*`.
- **CODEX_MIGRATION.md** — this report.

**`.codex/config.toml`** already exists (`[shell_environment_policy] inherit="core"` + sets `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1`). Left as-is; note that the env var it sets is Claude-Code-specific and inert for OpenAI Codex — harmless, no change made.

## Old-path cleanup
No hardcoded `~/Desktop` / `~/Documents` execution paths were found in code, scripts, specs, or config. Matches existed only under `content/`, `data/`, `docs/`, and handoff notes (generated/narrative content) — left untouched per the rules.

## Claude Code capability analysis
- `.claude/skills/` — `commit-with-gates`, `implement-spec`, `import-blog`, `pipeline-flow`, `pipeline-health`. Kept for Claude Code.
- `.claude/agents/pipeline-reviewer` — auto-invoked after editing `scripts/*.ts`; cross-checks `.claude/known-issues.md`. Kept.
- `.claude/settings*.json` — contains a PreToolUse hook that blocks editing `.env*` (good guardrail). Claude-Code-specific.
- `.mcp.json` — registers the public `context7` HTTP MCP (docs lookup); agent-agnostic, no secret. Usable by Codex via its own MCP config if desired.
- `skills/` (19 root generation prompts) — battle-tested; AGENTS.md instructs "iterate, never rewrite." These are **Codex skill candidates** but were not mechanically converted (no functional need yet).
- No API keys or tokens were copied into AGENTS.md or any migration file.

## Not migrated (and why)
- `.claude/` skills/agents/hooks — Claude-Code-specific; kept for Claude Code.
- The tracked `.env.bak` — deliberately not touched beyond the gitignore fix (see Secret incident).

## Validation (safe, local; performed in an isolated copy, no external side effects)
| Check | Result |
|-------|--------|
| Clone integrity: `git status` | clean (`## main...origin/main`) |
| Tip SHA vs `origin/main` | `797b72b` == `797b72b` ✅ |
| Write/delete in new dir (EPERM probe) | succeeds ✅ |
| Config sanity (`node --check` mjs, JSON parse) | eslint/postcss/.mcp.json/tsconfig OK ✅ |
| `npm install` (743 pkgs) + `npm rebuild better-sqlite3` | OK ✅ |
| `npm run build` (Next SSG, via `__tests__/build.test.ts`) | **passes** (~32s) ✅ |
| `npm test` — unit only (excl. `*.integration` + build) | **832 / 834 pass** ✅ |
| 2 failing unit tests (`review-strategic`: cleanOldReports / loadReportsInRange) | date-window tests sensitive to the system clock (env date 2026-07-22) — **not migration-related** |
| `npm run lint` | runs; reports 130 pre-existing errors in project source — **not introduced by migration** (only AGENTS.md + .gitignore were changed) |
| `*.integration.test.ts` (Claude CLI / Exa) | **intentionally not run** — attempt live/paid model calls; excluded per loreai-v2 safety rules |
| `npm run content` / pipeline runners / Vercel deploy | **not run** (paid/production side effects) |

## TCC / EPERM status
New location `~/Developer/loreai-v2` is fully read/write/delete capable — **no TCC/EPERM risk**.

## Ready for Codex?
**Yes, for development** — repo is clean/synced, `npm install` + `npm run build` + 832 unit tests pass, AGENTS.md is Codex-ready. **Two manual items:** (1) resolve the `.env.bak` secret exposure (rotate keys + purge history); (2) the project's own ESLint currently reports pre-existing errors — unrelated to this migration but worth a cleanup pass.
