---
title: "How to use Claude Code in CI/CD?"
slug: claude-code-ci-cd
description: "Run Claude Code in CI/CD pipelines using headless mode or the SDK for automated code review, test generation, and documentation updates."
category: tools
related_glossary: [claude-code, agentic-coding, anthropic]
related_blog: [headless-mode, claude-code-review-agents]
lang: en
---

# How to use Claude Code in CI/CD?

Claude Code integrates into CI/CD pipelines through headless mode, which runs non-interactively without a terminal UI. You can use the single-prompt flag for simple tasks or the Claude Code SDK for full programmatic control over automated workflows like code review, test generation, and documentation updates.

## Context

Most developers know [Claude Code](/glossary/claude-code) as an interactive terminal tool, but its real power in engineering organizations comes from running it as part of automated pipelines. CI/CD integration turns Claude Code from a personal assistant into an infrastructure-level tool that can review every pull request, generate tests for new code, or flag documentation gaps — all without human intervention.

The key mechanism is [headless mode](/blog/headless-mode), which strips away the interactive UI and lets Claude Code operate as a command-line tool that reads input and writes output. This makes it compatible with any CI system — GitHub Actions, GitLab CI, Jenkins, CircleCI — since it behaves like any other CLI tool in a pipeline step.

Common use cases include automated PR review (where Claude Code analyzes diffs and posts comments), test scaffolding for new functions, and enforcing coding standards defined in a [CLAUDE.md](/glossary/claude-md) file. For teams scaling this across many repositories, the [enterprise ramp-up patterns](/blog/claude-code-enterprise-engineering-ramp-shopify-spotify) used by companies like Shopify and Spotify provide a proven blueprint. See the [complete guide](/blog/claude-code-complete-guide) for the full picture of Claude Code capabilities.

## Practical Steps

1. **Single-prompt mode**: Use `claude --print "Review this diff for bugs"` in your CI script — it runs one prompt and exits with the response on stdout
2. **SDK integration**: Import the Claude Code SDK in a Node.js script for multi-step workflows — parse diffs, generate review comments, post them to your PR
3. **Set up authentication**: Store your [Anthropic](/glossary/anthropic) API key as a CI secret and pass it via the `ANTHROPIC_API_KEY` environment variable
4. **Define guardrails**: Place a `CLAUDE.md` in your repo root with coding standards so Claude Code enforces your team's conventions automatically
5. **Scope permissions**: Use the `--allowedTools` flag to restrict which tools Claude Code can access in your pipeline for security

For deeper patterns on building reliable long-running CI agents, see the guide on [effective harnesses for long-running agents](/blog/effective-harnesses-for-long-running-agents). The [Claude Code topics hub](/topics/claude-code) collects all related resources.

## Related Questions

- [How to use Claude Code agent teams?](/faq/claude-code-agent-teams)
- [What are Claude Code skills?](/faq/claude-code-skills)
- [What is Claude Code?](/faq/what-is-claude-code)

---

*Want more AI insights? [Subscribe to LoreAI](/subscribe) for daily briefings.*
