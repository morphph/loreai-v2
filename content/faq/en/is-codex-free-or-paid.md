---
title: "Is OpenAI Codex Free or Paid?"
slug: is-codex-free-or-paid
description: "OpenAI Codex has both free and paid tiers. The CLI is open source, but API usage is billed. Here's how the pricing actually breaks down."
category: tools
related_glossary: [what-does-codex-mean, agentic-coding]
related_blog: [codex-complete-guide, codex-for-open-source, codex-for-students]
related_topics: [codex]
lang: en
---

# Is OpenAI Codex Free or Paid?

**OpenAI Codex is neither fully free nor simply paid** — it depends on which part you're using. The **Codex CLI** is open source and free to download, but it requires an OpenAI API key to run, and API calls are billed by usage. The **cloud-based Codex agent** (the version you access through ChatGPT) is gated behind a ChatGPT subscription. Two specific groups get exceptions: students can get [$100 in free API credits](/blog/codex-for-students), and open source maintainers can qualify for [free Pro tools](/blog/codex-for-open-source).

## Context

The confusion around Codex pricing comes from the fact that OpenAI ships Codex in multiple forms with different access models. Understanding [what Codex actually is](/glossary/what-does-codex-mean) helps clarify which version applies to your situation.

**The Codex CLI** is OpenAI's terminal-based coding agent, released as open source under the Apache 2.0 license. You can clone the repo and install it for free. The catch: it routes requests through the OpenAI API, so every task you run consumes API tokens. There is no flat monthly rate — you pay per token, which makes cost unpredictable if you're running large [agentic coding](/glossary/agentic-coding) sessions across a big codebase.

**The Codex cloud agent** operates differently. It runs in a sandboxed cloud environment and handles multi-step coding tasks asynchronously — you submit a task, it executes in the background, and returns a pull request or result. This version is accessible through ChatGPT for users on qualifying subscription tiers, not through separate API billing.

The [complete Codex guide](/blog/codex-complete-guide) breaks down both products in detail, including how the cloud environment works and what kinds of tasks each version handles best.

**Free access paths do exist**, but they're targeted. OpenAI's [student program](/blog/codex-for-students) offers $100 in free API credits to qualifying students — enough to experiment meaningfully, with real caveats around usage limits and eligibility. For open source maintainers, OpenAI [launched a program](/blog/codex-for-open-source) giving qualifying contributors free access to Pro-tier Codex tools, specifically to encourage use on public repos. Neither path is universally available — both require an application or verification step.

If you're using the [Codex VS Code extension](/blog/codex-vscode), access follows the same model as the cloud agent: it depends on your ChatGPT subscription level, not separate API billing.

## Practical Steps

1. **If you want to experiment cheaply**: Apply for student credits or the open source program if you qualify. Otherwise, start with a small API budget — Codex CLI usage can be capped with OpenAI's usage limits.
2. **If you need predictable costs**: The ChatGPT subscription route (cloud agent) is flat-rate monthly — better for teams running frequent tasks.
3. **If you're evaluating for a team**: Check the [pricing FAQ](/faq/codex-pricing) before committing — enterprise access has different terms than individual plans.
4. **To get started**: See the [Codex download guide](/faq/codex-download) for installation steps for the CLI.

## Related Questions

- [OpenAI Codex pricing details](/faq/codex-pricing)
- [How to download and install Codex](/faq/codex-download)
- [What does Codex mean?](/glossary/what-does-codex-mean)

---

*Want more AI insights? [Subscribe to LoreAI](/subscribe) for daily briefings.*