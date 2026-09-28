---
title: "Codex newsletter migration and validation"
status: draft
category: guide
last-updated: 2026-09-28
depends-on: ["PIPELINE", "DEPLOY"]
---

# Codex newsletter migration

## Scope and current state

Development configuration and the newsletter-only runtime adapter are implemented locally. Claude remains the default. Production has not been switched and no subscriber messages have been sent. The standalone CLI initially rejected authorized GPT-6 Sol sample attempts; the desktop-bundled CLI successfully generated both local samples. No database schema changes are needed.

The 2026-09-28 read-only audit found the latest stored daily newsletters dated 2026-08-09 even though collection was current. Diagnose the existing failure separately; an installed cron entry is not proof of successful publication.

## Configuration

Set `NEWSLETTER_AI_PROVIDER=codex` and an explicit `NEWSLETTER_CODEX_MODEL` only for the newsletter process. Set `NEWSLETTER_CODEX_BIN` to an absolute binary path for cron. An optional `NEWSLETTER_CODEX_FALLBACK_MODEL` applies to ZH only and never falls back to Claude. Other pipelines and the weekly digest still use Claude.

The Codex adapter uses saved CLI authentication, an ephemeral temporary working directory, no developer project instructions, a read-only sandbox and disabled command execution/web search. It passes source material in the prompt and reads only the final-answer file, not progress output. This is not a general tool-capable agent adapter. Codex filtering receives five prior EN editions plus their filtered-item files instead of running the history helper.

Changing `AGENTS.md` or opening the repository in Codex does not change any production provider.

## Local verification without model calls

Use Node 22 and install the lockfile dependencies. The new tests mock child processes and model calls; they cover literal stdin prompts, final-answer extraction, missing/empty output, failure/timeout cleanup, credential separation, provider selection, corrective retries, ZH fallback provenance, historical date boundaries and newsletter header preservation.

```bash
npm exec vitest run scripts/lib/__tests__/codex.test.ts scripts/lib/__tests__/newsletter-ai.test.ts scripts/lib/__tests__/sanitize.test.ts
npm run lint
RUN_LIVE_MODEL_TESTS=0 EXA_API_KEY= SERPER_API_KEY= GSC_SITE_URL= npm test
npm run build
npm exec -- tsx scripts/validate-pipeline.ts --step=newsletter --date=2026-07-22
```

The last command validates existing historical artifacts only. Use a date with both language editions and filtered-item data; it does not establish Codex content quality. The newsletter validation step reads files and does not initialize a database.

Do not use `write-newsletter.ts --dry-run` as a guarantee of zero writes: its DB initialization and optional blog-seed stage can still write. `--diff` still generates content and saves intermediate outline data, so it is not a production-safe preview either.

## Fixed-input writing evaluation

Prepare a snapshot offline using a date with curated items and both language editions:

```bash
npm exec -- tsx scripts/evaluate-newsletter.ts --prepare --date=2026-07-22
```

This freezes 19 historical curated items, current application prompts and historical reference articles in a checksummed fixture under ignored `tmp/newsletter-eval/`. The writer and evaluator share prompt builders; no prompt wording was changed for the evaluation. No database is opened. Prompts use the curated items without a newly generated outline or SEO-page suggestions.

After the user selects a model and authorizes the two sample calls, use the fixture path printed by preparation:

```bash
npm exec -- tsx scripts/evaluate-newsletter.ts --run --fixture=PATH_TO_FIXTURE_JSON --model=EXPLICIT_MODEL_ID
```

Run mode makes one EN and one ZH model attempt with explicitly configured medium reasoning, without retries, and writes drafts plus a report in a new local output directory. The report records the model, reasoning effort, fixture checksum, elapsed time, structural checks, heuristic warnings and pending editorial review. Failed or invalid output is retained for inspection, and structural failure produces a nonzero exit code.

This evaluates writing only. It does not evaluate selection, outline generation, news freshness, email rewriting or publication. Historical articles are reference material, not a controlled Claude rerun. Compare attribution, links, tone and independent Chinese writing manually; passing structural checks alone does not establish editorial quality. The GPT-6 Sol sample run uses the desktop-bundled CLI after resolving a standalone CLI model-catalog mismatch.

## Further model and pipeline evaluation

1. Select a fixed Codex model and explicitly authorize a bounded number of sample calls. Verify the intended service account's authentication, CLI version and model access; `--version` alone does not test these.
2. Use a disposable workspace and database. Prepare one frozen candidate set, matching prior coverage, and source timestamps relative to the evaluation date. Never compare providers by rerunning against the live DB: each successful production run marks candidate items as used.
3. Replay the same inputs and application prompts for each provider. Keep all output local. Check EN/ZH structure, attribution, stale/duplicate events, Chinese punctuation, links, selection quality, tone and email rendering. Structural validators are necessary but do not prove editorial quality.
4. Record model IDs, elapsed time, validation results and human observations. Do not upload private prompts or runtime data to Git.

## Production prerequisites and rollback

Before switching, finish all project quality gates and obtain explicit production authorization. Perform a SQLite-consistent backup and restore rehearsal with read-back checks; retain the original and rollback path. Do not copy an open SQLite/WAL pair as separate ordinary files.

Check the production checkout and schedule through `ssh loreai`. Record and pin the tested revision for the production task. The legacy daily wrapper automatically pulls `main`; an authorized rollout must address that behavior before claiming the task is pinned. Do not start a second scheduler or production writer.

Switch only the newsletter provider after successful sample evaluation. Start with a controlled run before allowing the publishing wrapper, which commits/pushes content and sends Buttondown emails. Monitor generation, validation, website output and delivery as distinct outcomes.

For rollback, stop the new run, restore the previously verified code/runtime configuration and select `NEWSLETTER_AI_PROVIDER=claude`. Do not reset selection markers, overwrite content or resend emails automatically. If a run partially persisted, inspect its artifacts and delivery status before deciding the recovery action.

## Development workflow notes

Codex development skills are maintained under `.agents/skills/`; application prompts remain under `skills/`. Legacy `.claude/` files are retained. The Codex reviewer reads the existing `.claude/known-issues.md` registry. No equivalent Codex environment-file blocking hook is currently installed; agent instructions prohibit those edits, but this is not a tool-level guarantee.

Official references: [non-interactive execution](https://learn.chatgpt.com/docs/non-interactive-mode), [configuration](https://learn.chatgpt.com/docs/config-file/config-reference), [skill discovery](https://learn.chatgpt.com/docs/build-skills).

## Verification record — 2026-09-28

- Focused runtime/sanitizer suite: 19 tests passed without model calls.
- Final offline full suite: 918 tests passed; 30 external-service integration tests not enabled. The suite includes a real successful `npm run build`.
- All five development skills passed skill metadata validation; Codex TOML/JSON parsed successfully.
- Historical newsletter validation (2026-07-22): passed, with one existing duplicate-link warning per language.
- Newsletter/runtime files passed focused lint and strict TypeScript checks.
- Pipeline reviewer found no remaining blocking or high-risk migration issues after the sanitizer correction.
- Initial full test run exposed two pre-existing report tests tied to the real current date. They now freeze the clock at their fixture date and assert the exact expected date range; no failing tests were disabled.
- All 130 pre-existing lint errors across six files were corrected: prototype quote escaping/syntax, constant declarations, typed report fixtures and learning-page URL state subscription. Full repository lint now passes with zero errors and 65 non-blocking warnings. No rules were disabled.
- Fixed-input evaluation tests and related review suites: 157 tests passed with a fake CLI; the evaluator and newsletter writer passed focused strict TypeScript checks.
- Local browser smoke test against the production build: initial chapter deep link, next chapter, hash changes, invalid-hash fallback and reload passed without browser runtime errors.
- The user authorized GPT-6 Sol with medium reasoning. Both local sample attempts failed before generation. One diagnostic replay confirmed HTTP 400: the model is not supported with this CLI's ChatGPT account login. The standalone CLI model list (0.153.4) includes GPT-6 Astra and GPT-5.6 Sol, but not GPT-6 Sol. A read-only model/list query through desktop-bundled CLI 0.155.0-alpha.9.2 includes GPT-6 Sol. The retry successfully used that binary, without changing login or substituting a model.
- After pinning medium reasoning, 12 focused offline tests passed and changed files passed lint; pipeline review found no blockers. The full-suite record above predates this small follow-up.
- GPT-6 Sol / medium produced EN in 54.9 seconds and ZH in 66.7 seconds. Both passed structure checks and preserved all 19 source URLs. The English short-bold warning and Chinese 35% overlap warning mostly matched emphasized names rather than defective headlines or repeated events; they remain in the raw report. ZH repeats one source in the daily pick. Editorial review found readable but cautious prose, repetitive testing advice, and one unsupported growth claim based on a static engagement snapshot. Continue evaluating Sol; this is not production approval.
- Local samples and the detailed assistant review are retained in ignored evaluation output. No token usage was captured, so cost was not estimated. User editorial acceptance, broader sample testing, VPS model access, backup/restore rehearsal and production switching remain pending.

## Pre-launch audit — 2026-09-28

The user accepted the current-news Chinese preview. It used manually verified selection; this does not establish fully automated selection or end-to-end readiness. During final checks the production adapter was found to omit the evaluator's medium reasoning setting; all local Codex newsletter calls now explicitly use medium, including retries and the optional fallback. The provider-routing regression assertions cover both models.

Production remains on the legacy runtime and has not received the local migration. Required release work:

1. Install and authenticate a Linux Codex binary that can run the exact selected model under the service account and cron environment. Confirm real model access with a bounded smoke call; installation and login status alone are insufficient. Use the [official authentication guide](https://learn.chatgpt.com/docs/auth) for headless login and automation credentials. Do not copy the macOS app binary to Linux.
2. Create a SQLite-consistent backup and prove restoration/read-back in a disposable database. Retain the original, job configuration and code rollback reference.
3. Rehearse selection, deduplication, outline, EN/ZH writing, validation and email rendering using a disposable checkout/database with publishing disabled. In particular, verify actual publication dates rather than relying only on collection timestamps.
4. Separate fixed application code from automatic generated-content publication; the legacy wrapper currently pulls main before execution and again before pushing. A failed pull/push must not lead to email delivery. Commit/push only after all gates; then explicitly switch the production release.
5. Confirm the intended Singapore-time schedule, keep one writer, and verify both language pages after the deployment corresponding to the generated content. Treat successful Git push and live-page availability as separate checks.
6. If subscriber delivery is included, verify language audiences and add a durable date/language delivery record with an ambiguous-result reconciliation path. Never retry a partially sent issue blindly. The current sender does not supply a language audience and creates a fresh email on each invocation.
7. Establish a monitored success deadline with notifications for failure/missing output. Alert destinations and email delivery scope remain user decisions. Weekly digest and other pipelines still use Claude and require separate verification if included in launch.

No production writes, deployment, subscriber messages or new schedules were performed by this audit. Detailed operational evidence and validation logs are stored in the ignored local readiness report directory.
