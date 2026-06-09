---
title: "loreai-content CLI — Hermes Contract"
status: active
category: guide
last-updated: 2026-06-09
depends-on: []
---

# `loreai-content` CLI

Agent-native CLI that exposes LoreAI's publishing surface to the **Hermes** orchestration
layer through a **stable, machine-readable JSON contract**. Hermes does not need to
understand this repo's internals — it only calls these verbs and reads the JSON envelope.

> This repo is a **content surface, not an orchestrator**. The CLI never auto-publishes,
> never `git push`es, never calls Blog2Video directly, and never writes the Hermes
> SQLite ledger. Publishing stays human-gated.

## Invocation

```bash
npx tsx scripts/loreai-content.ts <verb> [flags]
# or
npm run content -- <verb> [flags]
```

Source: `scripts/loreai-content.ts` · Contract: `scripts/lib/cli-contract.ts` (single source of truth for shape + version).

## Verbs

| Verb | Purpose | Writes | LLM | Push |
|------|---------|--------|-----|------|
| `draft` | Scaffold a draft from a structured brief | `data/drafts/<lang>/<slug>.md` (staging, invisible to the site build) | no | no |
| `import-approved` | Import an **approved** draft into the publishing surface | `content/blog/<lang>/<slug>.md` + SQLite `content` | no (opt-in `--with-seo`) | no |
| `mark-video-ready` | Set `video_ready: true` (+ optional hook) on a blog post | blog frontmatter | no | no |
| `video-candidates` | Return ranked candidates for Blog2Video | reads/writes `data/video-queue/candidates.json` | no | no |
| `update-video-status` | Update `video_status` / `video_url` after render/publish | blog frontmatter | no | no |

### `draft`
Creates a draft markdown file from a structured brief. **Does not publish.** No LLM is run —
the brief supplies the body (a stub is written if `body` is omitted, with a warning).

```bash
npx tsx scripts/loreai-content.ts draft --brief=brief.json [--lang=en] [--dry-run] [--task-id=ID]
# or pipe the brief on stdin:
cat brief.json | npx tsx scripts/loreai-content.ts draft --stdin
```

Brief JSON: `{ slug, title, lang?, category?, description?, keywords?, body?, video_hook?, related_* }`.
`slug` and `title` are required. The draft is written with `approved: false` — the import gate.

### `import-approved`
Imports a draft into the live `content/blog/` surface + DB. **Human-gated:** refuses unless the
draft has `approved: true` in its frontmatter, or the caller passes `--approved` to assert
explicit human approval. Wraps the battle-tested `import-blog.ts` **always with `--no-git`
and `--no-seo`** (SEO entity extraction is LLM-backed; enable only with `--with-seo`).

```bash
npx tsx scripts/loreai-content.ts import-approved --slug=SLUG [--lang=en] [--dry-run] [--force] [--with-seo] [--task-id=ID]
```

### `mark-video-ready`
Idempotently sets `video_ready: true` (and `video_status: none` if absent, optional
`--video-hook`) on `content/blog/{en,zh}/<slug>.md`. Metadata-only edit, no push.

```bash
npx tsx scripts/loreai-content.ts mark-video-ready --slug=SLUG [--video-hook="..."] [--lang=en] [--dry-run] [--task-id=ID]
```

### `video-candidates`
Returns the ranked candidate list for Blog2Video under `data.candidates`. Reads the cached
`data/video-queue/candidates.json` by default; `--refresh` re-runs the picker
(`pick-video-candidates.ts`). This is the **only** Blog2Video integration point — an artifact
contract, never a direct call.

```bash
npx tsx scripts/loreai-content.ts video-candidates [--top=5] [--refresh] [--task-id=ID]
```

### `update-video-status`
Idempotently updates `video_status` (`none|scripted|recorded|published`) and optional
`--video-url`. No-op (`data.changed=false`) when already at the target state. Metadata-only, no push.

```bash
npx tsx scripts/loreai-content.ts update-video-status --slug=SLUG --status=published [--video-url=URL] [--lang=en] [--dry-run] [--task-id=ID]
```

## JSON output shape

Every verb prints **one JSON line** to stdout:

```json
{
  "contract_version": "1.0",
  "ok": true,
  "verb": "draft",
  "slug": "my-post",
  "task_id": "hermes-task-123",
  "dry_run": false,
  "artifacts": [{ "type": "draft", "path": "data/drafts/en/my-post.md", "lang": "en", "exists": true }],
  "content_hash": "sha256:…",
  "data": { },
  "warnings": [],
  "errors": []
}
```

- `contract_version` — bump only in `cli-contract.ts`. Hermes should assert it.
- `ok` — overall success.
- `task_id` — correlation/idempotency key, echoed verbatim from `--task-id`.
- `artifacts[]` — `{type, path, lang?, exists}`; paths are repo-relative.
- `content_hash` — `sha256:` of the canonical content produced/inspected (stable across idempotent re-runs).
- `data` — verb-specific payload (e.g. `data.candidates`, `data.changed`).
- `warnings` / `errors` — human-readable strings; `errors` is non-empty iff `ok=false`.

## Exit codes

| Code | Meaning |
|------|---------|
| `0` | success (`ok: true`) |
| `1` | handled failure — not found, not approved, validation rejected |
| `2` | usage error — unknown/missing verb, missing required flag |
| `3` | unexpected/internal error |

Hermes should branch on the exit code first, then read `errors[]` for detail.

## Idempotency

All verbs are safe to retry:
- `draft` — same brief → identical `content_hash`; overwrites the draft file.
- `import-approved` — rides `upsertContent`'s `ON CONFLICT(type,slug,lang)` upsert.
- `mark-video-ready` / `update-video-status` — no-op when already in target state (`data.changed=false` + warning).
- `video-candidates` — pure read unless `--refresh`.

Pass a stable `--task-id` per logical operation; it is echoed back for ledger correlation
(Hermes owns the ledger — this CLI never writes it).

## Dry-run

Every mutating verb accepts `--dry-run`: it computes artifacts + `content_hash` and reports
what *would* change, writing nothing. Use it to preview before committing a real run.

## Human-approval boundaries

- **Drafting ≠ publishing.** `draft` only stages into `data/drafts/` (invisible to the Next.js build).
- **Import requires approval.** `import-approved` refuses an un-approved draft. Approval is a human
  setting `approved: true`, or a caller explicitly asserting `--approved`.
- **No auto-push.** All file edits stay in the working tree; a human reviews and commits/pushes.
- **No auto-LLM.** SEO extraction is opt-in (`--with-seo`); no other verb runs an LLM.

## How Hermes should call this CLI

1. Spawn `npx tsx scripts/loreai-content.ts <verb> … --task-id=<hermes-task-id>` in this repo's root.
2. Parse the single-line JSON on stdout; assert `contract_version`.
3. Branch on exit code (`0` ok, `1/2` handled, `3` internal); read `errors[]`/`warnings[]`.
4. Record `artifacts[]` + `content_hash` against the task in the Hermes ledger (Hermes-side only).
5. For publish, drive: `draft` → human approval → `import-approved` → human commit/push.
6. For video, drive: `video-candidates` → (Blog2Video renders) → `update-video-status`.

## Smoke checks

```bash
# usage (exit 2)
npx tsx scripts/loreai-content.ts

# draft dry-run from a brief file
npx tsx scripts/loreai-content.ts draft --brief=brief.json --dry-run

# approval gate (exit 1 until approved)
npx tsx scripts/loreai-content.ts import-approved --slug=my-post

# preview a status change without writing
npx tsx scripts/loreai-content.ts update-video-status --slug=my-post --status=scripted --dry-run

# contract unit test
npx vitest run scripts/__tests__/cli-contract.test.ts
```
