---
title: "How Do You Log In to the Codex CLI?"
slug: codex-cli-login
description: "Log in to the Codex CLI by setting your OpenAI API key or running codex login. Full steps, both auth methods, and troubleshooting tips."
category: tools
related_glossary: [agentic-coding]
related_blog: [codex-complete-guide, codex-for-open-source, codex-for-students]
related_compare: [codex-cli-vs-claude-code]
related_topics: [codex]
lang: en
---

# How Do You Log In to the Codex CLI?

The **Codex CLI** authenticates via your OpenAI API key. The fastest path: set the `OPENAI_API_KEY` environment variable before running any `codex` command. Alternatively, run `codex login` to launch an interactive browser-based OAuth flow that stores credentials locally so you don't need to set the variable in every session.

## Context

The Codex CLI is OpenAI's open-source terminal agent — installed as an npm package (`@openai/codex`) and driven entirely by API calls. Authentication is not tied to a ChatGPT subscription; it runs against the OpenAI API and bills per token. This catches new users off guard: having a ChatGPT Plus account does not grant access to the Codex CLI. You need a separate API key from [platform.openai.com](https://platform.openai.com/api-keys) with active billing.

Two auth paths exist, and each suits a different workflow. The environment variable method is better for CI/CD pipelines and shared servers where you don't want a stored credential file. The `codex login` interactive flow is better for local developer machines — it writes credentials to `~/.codex/config.json` so the key persists across sessions without re-exporting.

For a full breakdown of what the Codex CLI can do once authenticated, see our [complete Codex guide](/blog/codex-complete-guide). If you're evaluating whether to use Codex CLI or a different terminal agent, the [Codex CLI vs Claude Code comparison](/compare/codex-cli-vs-claude-code) covers the core tradeoffs.

## Practical Steps

**Option A — environment variable (recommended for servers/CI):**

1. Get an API key from `platform.openai.com` under API Keys
2. Export it in your shell: `export OPENAI_API_KEY=sk-...`
3. To persist across sessions, add that line to `~/.zshrc` or `~/.bashrc`
4. Run `codex` — authentication is implicit from the env var

**Option B — interactive login (recommended for local dev):**

1. Run `codex login` in your terminal
2. A browser window opens to OpenAI's OAuth flow — log in and authorize
3. Credentials are saved to `~/.codex/config.json` automatically
4. Subsequent `codex` calls use the saved credentials with no env var required

**To update the CLI to the latest version:**
```
npm update -g @openai/codex
```
Run this whenever you see deprecation warnings or want the latest model and feature support.

**Common auth failures:**
- `401 Unauthorized` → key is invalid or expired; generate a new one at platform.openai.com
- `429 Too Many Requests` → rate limit or billing not configured; check your OpenAI usage dashboard
- `Command not found: codex` → installation issue, not an auth issue; see [how to download the Codex CLI](/faq/codex-cli-download) first

## Related Questions

- [How do I download and install the Codex CLI?](/faq/codex-cli-download)
- [Is the Codex CLI safe to use?](/faq/is-codex-cli-safe-to-use)
- [How do I start using Codex?](/faq/using-codex)

---

*Want more AI insights? [Subscribe to LoreAI](/subscribe) for daily briefings.*