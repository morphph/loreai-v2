---
title: How to use Claude Code with Git?
slug: claude-code-with-git
description: >-
  Claude Code integrates natively with Git. It can stage changes, write commit
  messages, create branches, resolve merge conflicts, and open pull requests.
category: tools
related_glossary:
  - claude-code
  - agentic-coding
  - claude-md
related_blog:
  - claude-code-complete-guide
  - claude-code-review-agents
  - claude-code-agent-teams
lang: en
related_topics:
  - claude-code
---

# How to use Claude Code with Git?

[Claude Code](/blog/lessons-from-building-claude-code-agent-tools) has built-in Git integration and can handle the full Git workflow. It stages files, writes commit messages based on actual changes, creates and switches branches, resolves merge conflicts, and can even create pull requests using the GitHub CLI.

## Context

One of the core strengths of [Claude Code](/glossary/claude-code) as an [agentic coding](/glossary/agentic-coding) tool is that it operates directly in your terminal where Git lives. Unlike IDE-based AI assistants that work in a sandboxed environment, Claude Code runs real Git commands and sees the full state of your repository, including diffs, logs, branch history, and remote status.

This makes Claude Code particularly effective for tedious Git tasks. Merge conflicts that would take minutes to untangle manually can be resolved in seconds because Claude reads both sides of the conflict and the surrounding code context. Commit messages are generated from the actual diff, not guessed from file names. You can even define Git workflow rules in a [CLAUDE.md](/glossary/claude-md) file so Claude follows your team's branching and commit conventions automatically.

For team workflows, Claude Code's [code review agents](/blog/claude-code-review-agents) can review pull requests, and [agent teams](/blog/claude-code-agent-teams) can work across multiple branches simultaneously. The [Claude Code complete guide](/blog/claude-code-complete-guide) covers advanced Git patterns including automated PR creation and CI integration.

## Practical Steps

1. Run `claude` inside any Git repository to start a session with full repo awareness.
2. Ask Claude to commit: it will review the diff, stage relevant files, and write a descriptive commit message.
3. For merge conflicts, ask Claude to resolve them. It reads both sides and the base version to make informed decisions.
4. To create a pull request, ask Claude directly. It uses `gh` (GitHub CLI) to open the PR with a summary derived from your commits.
5. Add Git conventions to your project's `[CLAUDE.md](/blog/claude-code-memory)` file, such as commit message format or branch naming rules, and Claude will follow them. See the [topics hub](/topics/claude-code) for more workflow patterns.

## Related Questions

- [What is Claude Code?](/faq/what-is-claude-code)
- [How to install Claude Code?](/faq/how-to-install-claude-code)
- [How much does Claude Code cost?](/faq/how-much-does-claude-code-cost)

---

*Want more AI insights? [Subscribe to LoreAI](/subscribe) for daily briefings.*
