---
title: "Claude Code's New /simplify and /batch Skills: Automating PR Cleanup and Multi-Task Workflows"
date: 2026-03-08
slug: claude-code-simplify-batch-skills
description: "Claude Code introduces /simplify and /batch skills to automate pull request cleanup and parallel task execution, streamlining developer workflows."
keywords: ["Claude Code skills", "/simplify", "/batch", "Claude Code workflows"]
category: DEV
related_newsletter: 2026-03-08
related_glossary: [claude-code, skill-md]
related_compare: []
related_topics: [claude-code]
lang: en
video_ready: true
video_hook: "Two new Claude Code skills that eliminate the tedious parts of shipping code"
video_status: none
---

# Claude Code's New /simplify and /batch Skills: Automating PR Cleanup and Multi-Task Workflows

**Claude Code** is adding two built-in skills that target the most time-consuming parts of shipping code: getting a pull request production-ready and running tasks in parallel. The `/simplify` and `/batch` commands, [announced by Anthropic engineer Boris Cherny](https://x.com/bcherny/status/2027534984534544489), automate work that developers currently do manually — reviewing changed code for reuse opportunities, cleaning up quality issues, and orchestrating multiple operations simultaneously. For teams already using Claude Code's [skills system](/glossary/skill-md), these two additions signal Anthropic's push toward opinionated, workflow-level automation rather than just code generation.

## What Happened

Boris Cherny, who works on Claude Code at Anthropic, announced that the next version of **Claude Code** will ship with two new built-in skills: `/simplify` and `/batch`. Cherny noted he's been using both daily, describing them as automating "much of the work it used to take to shepherd a pull request to production."

`/simplify` reviews changed code and checks for opportunities to improve reuse, quality, and efficiency — then fixes any issues it finds. Think of it as an automated code review pass that doesn't just flag problems but resolves them. Instead of manually scanning your diff for redundant logic, missed abstractions, or quality gaps, you invoke `/simplify` and let Claude handle the cleanup.

`/batch` enables running a prompt or slash command on a recurring interval or across multiple targets. This turns Claude Code into a task orchestrator — you can parallelize independent operations, poll for status changes, or apply the same transformation across multiple files.

The announcement comes during a significant period for Claude Code. The tool recently hit a milestone where [4% of GitHub public commits are authored by Claude Code](https://x.com/SemiAnalysis_/status/2027458544493335008), and Anthropic just launched Claude Code Remote for Pro users, HTTP hooks for extensibility, and scheduled tasks in Cowork mode.

## Why It Matters

Most AI coding tools focus on generation — writing new code from a prompt. But experienced developers know that writing code is only part of shipping software. The unglamorous work of reviewing diffs, simplifying abstractions, ensuring consistency, and managing parallel workflows eats enormous amounts of time.

`/simplify` addresses the "last mile" problem of pull requests. After Claude Code (or a human) writes the initial implementation, the code often needs a cleanup pass: extracting shared logic, removing dead code, tightening error handling, improving naming. Developers either do this manually or skip it under time pressure. Having an automated pass that catches these issues before review means cleaner PRs, faster reviews, and less tech debt accumulation.

`/batch` solves a different pain point: orchestration. Developers frequently need to apply changes across multiple files, run the same check against several services, or execute independent tasks simultaneously. Without `/batch`, this means either running commands sequentially (slow) or writing custom scripts (overhead). The skill abstracts this into a simple invocation.

The competitive angle matters too. [Cursor](/glossary/cursor) and GitHub Copilot focus primarily on inline completion and chat-based generation. Neither offers built-in workflow automation at this level. By shipping opinionated skills that encode best practices — not just code generation capabilities — Anthropic is positioning [Claude Code](/glossary/claude-code) as a development workflow tool, not just an AI assistant.

## Technical Deep-Dive

Both skills build on Claude Code's existing [SKILL.md](/glossary/skill-md) architecture. Skills are structured markdown files that define behavior patterns, and Claude Code's built-in skills follow the same convention as user-created ones.

### /simplify

The `/simplify` skill operates on your current working changes. Based on the announcement and Claude Code's skill system patterns, it likely:

1. **Identifies changed files** from your git diff
2. **Analyzes each change** for code quality signals: duplicated logic, overly complex functions, unused imports, inconsistent patterns
3. **Proposes and applies fixes** directly, rather than just reporting issues
4. **Validates results** by ensuring tests still pass after modifications

This is distinct from a linter. Linters catch syntactic issues and style violations. `/simplify` operates at a semantic level — recognizing that two functions share logic that could be extracted, or that a complex conditional could be simplified without changing behavior.

The key design decision is that `/simplify` *fixes* issues rather than just flagging them. This aligns with Claude Code's action-oriented philosophy: the tool should do the work, not create a to-do list for the developer.

### /batch

`/batch` takes a prompt or slash command and runs it across multiple targets or on a schedule. The syntax follows a pattern like:

```
/batch /simplify across src/**/*.ts
```

This enables workflows that were previously manual or required custom scripting:

- Running code review across all changed files in a monorepo
- Applying a refactoring pattern to multiple modules
- Polling a deployment status at regular intervals
- Generating documentation for multiple endpoints

One important constraint: batch operations that modify files need careful handling of conflicts. If two parallel `/simplify` runs both want to extract the same shared utility, the results could conflict. The implementation likely serializes dependent operations while parallelizing independent ones.

### Limitations

Both skills inherit the constraints of Claude Code's skill system. They operate on local context — your codebase, your git state, your file system. They don't reach out to external services unless combined with Claude Code's recently launched [HTTP hooks](https://x.com/bcherny/status/2029339111212126458), which allow triggering external APIs in response to events.

## What You Should Do

1. **Update Claude Code** when the next version drops. These are built-in skills, so no configuration needed — just invoke `/simplify` or `/batch` directly.
2. **Add `/simplify` to your pre-PR workflow**. Run it after completing a feature and before opening a pull request. This catches cleanup opportunities while the code is fresh.
3. **Use `/batch` for repetitive cross-file tasks** instead of writing one-off scripts. Migration patterns, documentation updates, and style changes across modules are ideal candidates.
4. **Combine with custom skills** for maximum leverage. Your team's `/code-review` skill plus `/batch` means automated review across every changed file in a single command.
5. **Watch for the HTTP hooks integration**. Pairing `/batch` with hooks could enable powerful CI-adjacent workflows directly from your terminal.

**Related**: [Today's newsletter](/newsletter/2026-03-08) covers the broader context of Claude Code's latest updates. See also: [Claude Code Skills System Guide](/blog/claude-code-skills-guide).

---

*Found this useful? [Subscribe to AI News](/subscribe) for daily AI briefings.*