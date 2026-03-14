---
title: "Claude Code Headless Mode: Run AI Coding Agents Programmatically"
date: 2026-03-11
slug: headless-mode
description: "How to run Claude Code programmatically with the -p flag and Agent SDK CLI for CI/CD pipelines, automated reviews, and scripted workflows."
keywords: ["Claude Code headless mode", "Agent SDK CLI", "claude -p", "programmatic Claude Code"]
category: DEV
related_newsletter: 2026-03-11
related_glossary: [claude-code, agent-sdk]
related_compare: []
related_topics: [claude-code]
lang: en
video_ready: true
video_hook: "Claude Code isn't just interactive — run it headless for CI/CD, batch ops, and automated workflows"
video_status: published
source_type: video
---

# Claude Code Headless Mode: Run AI Coding Agents Programmatically

Most developers use **Claude Code** interactively — chatting in the terminal, approving tool calls, watching it edit files in real-time. But the real power unlock comes when you remove the human from the loop entirely. The [Agent SDK](https://platform.claude.com/docs/en/agent-sdk/overview) CLI lets you run Claude Code programmatically with a single flag: `-p`. Same tools, same agent loop, same context management — just no interactive prompts. This turns Claude Code from a pair programmer into an automatable workhorse for CI/CD pipelines, batch code reviews, and scripted refactoring jobs.

## What Happened

Anthropic formalized what was previously known as "headless mode" into the **Agent SDK** — available as a CLI (`claude -p`), plus full [Python](https://platform.claude.com/docs/en/agent-sdk/python) and [TypeScript](https://platform.claude.com/docs/en/agent-sdk/typescript) packages for deeper integration. The `-p` (or `--print`) flag is the entry point: pass it a prompt string and Claude Code runs non-interactively, printing results to stdout.

The CLI supports the full feature set you'd expect from a scriptable interface:

- **Structured output** via `--output-format json` with optional `--json-schema` for typed responses
- **Streaming** with `--output-format stream-json` for real-time token delivery
- **Tool auto-approval** through `--allowedTools` with prefix-matching syntax
- **Conversation continuity** using `--continue` or `--resume` with session IDs
- **System prompt customization** via `--append-system-prompt` or `--system-prompt`

A simple invocation looks like this:

```bash
claude -p "Find and fix the bug in auth.py" --allowedTools "Read,Edit,Bash"
```

That single line gives Claude Code permission to read files, edit them, and run shell commands — all without human intervention. The agent loop handles tool selection, error recovery, and multi-step reasoning exactly as it would in interactive mode.

## Why It Matters

Interactive AI coding assistants hit a ceiling: they require a human sitting at the terminal. For one-off tasks that's fine, but engineering teams have dozens of repetitive workflows that benefit from AI but can't justify a human babysitter — pre-commit reviews, test-fix loops, documentation generation, migration scripts.

**Headless mode** removes that constraint. You can wire Claude Code into GitHub Actions, cron jobs, or any CI/CD system. A post-merge hook that reviews code for security vulnerabilities. A nightly job that runs your test suite and auto-fixes failures. A PR bot that generates structured summaries. These become straightforward bash scripts rather than complex integrations.

The `--json-schema` flag is particularly significant. It transforms Claude Code from a text generator into a structured data extraction tool. Need to pull function signatures from a codebase? Parse configuration files? Generate typed migration plans? Define a JSON Schema and get guaranteed-shape output:

```bash
claude -p "Extract the main function names from auth.py" \
  --output-format json \
  --json-schema '{"type":"object","properties":{"functions":{"type":"array","items":{"type":"string"}}},"required":["functions"]}'
```

The competitive landscape matters here too. GitHub Copilot's CLI integration is limited to completions. [Cursor](/glossary/cursor) has no headless mode at all. Claude Code's `-p` flag gives it a unique position as both an interactive assistant and a scriptable agent — the same tool for both use cases, with identical behavior guarantees.

## Technical Deep-Dive

### Tool Permission Syntax

The `--allowedTools` flag uses a prefix-matching system that balances security with usability. The syntax `Bash(git diff *)` — note the space before the asterisk — allows any command starting with `git diff `. Without the space, `Bash(git diff*)` would also match `git diff-index`, which is a different command entirely.

For a commit workflow, the permission set looks like:

```bash
claude -p "Look at my staged changes and create an appropriate commit" \
  --allowedTools "Bash(git diff *),Bash(git log *),Bash(git status *),Bash(git commit *)"
```

This grants exactly the git operations needed — no more. Claude can't run arbitrary shell commands, install packages, or modify files outside of git's scope.

### Conversation Continuity

Headless sessions support multi-turn conversations through session IDs. The pattern for multi-step workflows:

```bash
# First pass — capture session ID
session_id=$(claude -p "Review this codebase for performance issues" \
  --output-format json | jq -r '.session_id')

# Follow-up prompts in the same context
claude -p "Now focus on the database queries" --resume "$session_id"
claude -p "Generate a summary of all issues found" --resume "$session_id"
```

Each `--resume` call picks up the full conversation history, so Claude retains context about previous findings. For simpler cases, `--continue` resumes the most recent session without needing to track IDs.

### Streaming for Real-Time UIs

The `stream-json` output format emits newline-delimited JSON events as tokens arrive. Combined with `--verbose` and `--include-partial-messages`, you get granular control over the agent's output stream:

```bash
claude -p "Write a poem" --output-format stream-json --verbose --include-partial-messages | \
  jq -rj 'select(.type == "stream_event" and .event.delta.type? == "text_delta") | .event.delta.text'
```

This is the foundation for building custom UIs, logging dashboards, or progress indicators on top of Claude Code's agent loop without using the full Python/TypeScript SDK.

### System Prompt Control

Two flags shape Claude's behavior: `--append-system-prompt` adds instructions while preserving Claude Code's defaults (tool use, safety guidelines), while `--system-prompt` replaces the entire system prompt. The append variant is safer for most use cases:

```bash
gh pr diff "$1" | claude -p \
  --append-system-prompt "You are a security engineer. Review for vulnerabilities." \
  --output-format json
```

Piping input through stdin works naturally — Claude receives the PR diff as context alongside the system prompt instructions.

## What You Should Do

1. **Start with `claude -p` for one repeatable task** you currently do manually — test fixing, commit message generation, or code review. Get it working in a bash script before building anything more complex.
2. **Use `--json-schema` for any output that feeds into another system**. Unstructured text breaks downstream parsers. Structured output doesn't.
3. **Lock down tool permissions** with `--allowedTools` and prefix matching. Grant the minimum set of tools each script needs — don't default to allowing everything.
4. **Capture session IDs** when building multi-step pipelines. Conversation continuity eliminates redundant context and keeps token costs down.
5. **Pipe `--output-format json` through `jq`** for clean integration with shell scripts: `jq -r '.result'` extracts the text response, `jq '.structured_output'` gets schema-conforming data.

**Related**: [Today's newsletter](/newsletter/2026-03-11) covers more Claude Code updates. See also: [Claude Code glossary entry](/glossary/claude-code) for background on the tool's capabilities.

---

*Found this useful? [Subscribe to AI News](/subscribe) for daily AI briefings.*