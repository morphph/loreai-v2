---
title: "A Practical Guide to the Codex CLI: Running AI Coding Agents in Your Terminal"
slug: guide-to-codex-cli
description: "Learn how to use the Codex CLI: installation, running with input prompts, and using it with your ChatGPT plan."
lang: en
category: tools
related_glossary: [agentic-coding, agent-sdk, model-context-protocol]
related_blog: [codex-complete-guide, first-few-days-with-codex-cli, codex-vscode]
related_compare: []
related_topics: [codex]
---

# A Practical Guide to the Codex CLI: Running AI Coding Agents in Your Terminal

**Codex CLI** is OpenAI's terminal-based coding agent — a command-line tool that takes a natural-language prompt, reads your codebase, and executes multi-step engineering tasks autonomously. It's the developer-facing companion to OpenAI's cloud Codex environment, designed for engineers who prefer to work where code actually lives: the terminal.

If you've been curious about [agentic coding](/glossary/agentic-coding) but haven't found a reason to leave the command line, Codex CLI makes a strong case. This guide covers how it works, how to run it with an input prompt, and how it fits your existing ChatGPT plan.

## What Codex CLI Actually Does

Codex CLI connects OpenAI's models to your local development environment. You give it a task — "add error handling to `fetchUser.ts`" or "write tests for the payment module" — and it reads the relevant files, plans a series of edits, and executes them.

Unlike autocomplete tools, it doesn't suggest the next line. It reasons about your whole project and acts across multiple files in a single session. The [OpenAI Codex complete guide](/blog/codex-complete-guide) covers the cloud-hosted side in depth; the CLI is the local runtime that brings the same agent loop to your own machine.

There's also a VS Code extension, but the CLI is where the agent model fully expresses itself — no UI abstraction, full shell access, and scriptable into your existing workflows. See [how the VS Code extension compares](/blog/codex-vscode) if you're not fully committed to the terminal.

## Using Codex CLI with Your ChatGPT Plan

If you're on **ChatGPT Pro**, you already have access to Codex CLI without separate API billing. OpenAI tied Codex access to the Pro subscription tier, which means your $20/month subscription covers CLI usage within plan limits.

For heavier users — running Codex across large codebases, CI pipelines, or long agentic sessions — API billing kicks in once you exceed plan quotas. The CLI supports both authentication paths: session-based (for ChatGPT Pro users) and API key-based (for direct billing).

To authenticate with your ChatGPT plan:

```bash
codex auth login
```

This opens a browser flow that links your ChatGPT account. After that, `codex` commands use your Pro plan quota automatically.

## Installation

```bash
npm install -g @openai/codex
```

Requires Node.js 18+. After installation, run `codex --version` to confirm. On first run, you'll go through the auth flow above.

## Running Codex CLI with an Input Prompt

The core interaction is simple:

```bash
codex "refactor the auth module to use async/await throughout"
```

Codex reads your project context, identifies relevant files, and proposes a plan before executing. You'll see a diff preview — approve it to apply the changes.

For non-interactive execution (useful in scripts or CI), pass `--yes` to skip approval prompts:

```bash
codex --yes "add JSDoc comments to all exported functions in src/utils/"
```

You can also pipe content as context:

```bash
cat error.log | codex "diagnose this error and suggest a fix"
```

**Running from a specific directory**: Codex infers project context from your working directory. Run it from the project root, not a subdirectory, unless you want it to work on a scoped area. For monorepos, `cd` into the relevant package first.

**Providing a file as context**: Use `--context` to explicitly include files the agent should read:

```bash
codex --context src/api/users.ts "write integration tests for this file"
```

This is useful when the agent might not find the right files on its own in a large codebase.

## Why the CLI Approach Works

The honest case for a CLI-first coding agent isn't that it's more powerful than IDE integrations — it's that it's more composable.

When Codex runs in the terminal, it fits into the same environment as your build tools, test runners, and deployment scripts. You can chain it:

```bash
codex "fix the failing test in auth.test.ts" && npm test && git add -p
```

You can wrap it in a shell script, call it from a Makefile, or trigger it from a CI step. IDE plugins can't do this cleanly — they're designed for interactive use, not scripting.

There's also the focus argument. The terminal is where engineers context-switch the least. Running Codex without opening a new application keeps you in flow. You describe the task, review the diff, approve, and move on. The [agent harnesses post](/blog/agent-harnesses-2026) covers this workflow pattern in depth — how the wrapper around your AI agent shapes the quality of the output as much as the model itself.

For comparison: Claude Code takes a similar terminal-first approach. See [Claude Code: The Complete Guide](/blog/claude-code-complete-guide) for how the two agents differ in architecture and workflow.

## Codex CLI Configuration

Codex respects a `codex.json` (or `.codexrc`) config file at the project root. Key settings:

```json
{
  "model": "codex-1",
  "approval": "suggest",
  "contextFiles": ["AGENTS.md", "README.md"],
  "ignore": ["node_modules", "dist", ".next"]
}
```

- **`approval`**: `"suggest"` (show diff, wait for input), `"auto"` (apply immediately), or `"none"` (dry run, print only)
- **`contextFiles`**: Files Codex always reads for project context — equivalent to Claude Code's `CLAUDE.md`
- **`ignore`**: Directories to skip when building file context

For teams, check in a `codex.json` so every developer gets consistent agent behavior. The [FAQ on Codex configuration](/faq/configuration) has the full option reference.

## What Codex CLI Does Well (and Where It Struggles)

**Strengths:**
- Single-file and focused multi-file edits — reliable and fast
- Test generation — give it a module, get coverage
- Boilerplate elimination — scaffolding, type definitions, repetitive patterns
- Scripting and CI integration — composable via shell

**Limitations (based on reported experience):**
- Large, sprawling codebases with complex cross-module dependencies need careful scoping — send it to the right directory with the right context files
- It doesn't maintain persistent memory across sessions by default — each run starts fresh unless you pass explicit context
- Approval flow can slow down fast iteration; use `--yes` only when you trust the scope you've defined

The [first few days with Codex CLI](/blog/first-few-days-with-codex-cli) piece covers the learning curve more honestly than the official docs do — worth reading before you commit to a workflow.

## Practical Starting Points

If you're new to Codex CLI, start with well-scoped tasks where you can review the output easily:

1. **Test generation**: `codex "write vitest unit tests for src/lib/parser.ts"` — reviewable, bounded scope
2. **Documentation**: `codex "add JSDoc to all exports in src/api/"` — low risk, high value
3. **Refactoring**: `codex "convert callbacks to async/await in src/legacy/"` — mechanical transformation Codex handles well

Avoid starting with "redesign the architecture" or "fix all the TypeScript errors" — broad tasks produce broad, hard-to-review diffs. Narrow the scope until you're comfortable with how the agent reasons about your codebase.

Once you've built that intuition, the [agent harnesses and long-running workflows](/blog/effective-harnesses-for-long-running-agents) patterns become relevant — structuring Codex CLI into repeatable, reliable automation rather than one-off tasks.

## What's Next for Codex CLI

OpenAI has been expanding Codex access — [free tools for open source maintainers](/blog/codex-for-open-source) and [student credits](/blog/codex-for-students) signal a push toward broader adoption. The CLI is the power-user interface; expect the tool to grow as the underlying model improves.

The [Model Context Protocol](/glossary/model-context-protocol) integration is the next frontier — connecting Codex CLI to external data sources and tools the way Claude Code uses MCP servers today.

---

*Want more AI insights? [Subscribe to LoreAI](/subscribe) for daily briefings.*