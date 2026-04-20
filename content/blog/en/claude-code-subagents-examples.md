---
title: "Claude Code Subagents: Practical Examples for Multi-Agent Coding Workflows"
slug: claude-code-subagents-examples
description: "Practical examples of Claude Code subagents for parallel research, code exploration, and multi-file refactoring workflows."
lang: en
category: tools
related_glossary: [agentic-coding, agent-sdk]
related_blog: [claude-code-agent-teams, claude-code-complete-guide, claude-code-extension-stack-skills-hooks-agents-mcp, claude-code-seven-programmable-layers]
related_compare: []
related_topics: [claude-code]
---

# Claude Code Subagents: Practical Examples for Multi-Agent Coding Workflows

Claude Code's **subagent system** lets a single coding session spawn specialized child agents that work independently — each with its own tools, context, and task scope. Instead of one agent sequentially reading files, searching code, and making edits, you can fan out multiple agents in parallel: one exploring the codebase, another planning the implementation, a third making changes in an isolated worktree. The result is faster, more structured work on complex engineering tasks.

This guide walks through practical subagent patterns with real examples you can adapt to your own projects. If you're new to Claude Code, start with our [complete guide](/blog/claude-code-complete-guide) first.

## What Are Claude Code Subagents?

**Subagents** are child agents spawned by Claude Code's `Agent` tool during a session. Each subagent runs with its own context window, a defined set of tools, and a focused prompt. The parent agent delegates work, receives results, and synthesizes them — without polluting its own context with raw search output or intermediate exploration.

Claude Code ships with several specialized subagent types:

- **Explore** — fast codebase exploration using glob patterns, grep searches, and file reads. No edit capabilities.
- **Plan** — software architecture agent that designs implementation strategies, identifies critical files, and considers tradeoffs. Read-only.
- **general-purpose** — full-capability agent for research, search, and multi-step execution.
- **codex:codex-rescue** — hands off investigation or implementation to a Codex companion for a second opinion.

The key architectural insight: subagents don't share the parent's context window. This means you can send an Explore agent to read 50 files without those files consuming space in your main conversation. The agent returns a summary, and you work from that.

## Example 1: Parallel Codebase Research

The most common subagent pattern is fanning out multiple Explore agents to answer independent questions simultaneously. Instead of sequentially searching for database schemas, then API routes, then test files, you launch all three searches at once.

**Scenario:** You need to understand how authentication works across the backend before refactoring the session middleware.

```
User: How does our auth system work end to end?

Claude Code spawns three agents in parallel:

Agent 1 (Explore): "Find all authentication middleware,
  session handling, and token validation code.
  Check src/middleware/, src/auth/, and server/ directories."

Agent 2 (Explore): "Find all API routes that check
  authentication. Look for auth guards, session checks,
  and permission decorators."

Agent 3 (Explore): "Find all test files related to
  authentication. Report what's covered and what's missing."
```

Each Explore agent returns a focused summary. The parent agent synthesizes all three into a coherent picture of the auth system — without reading dozens of files sequentially in the main context.

**When to use this pattern:** Any time you need to understand a system that spans multiple directories or concerns. Onboarding to a new codebase, investigating a bug across layers, or auditing test coverage.

## Example 2: Plan-Then-Execute Workflow

For non-trivial changes, the **Plan** subagent type designs an implementation strategy before any code is modified. This prevents the common failure mode where an agent starts editing files, realizes the approach is wrong, and has to backtrack.

**Scenario:** You need to add WebSocket support to an existing REST API.

```
Step 1 — Plan agent:
"Design the implementation strategy for adding WebSocket
support to our Express API. The server is in server/app.ts,
routes are in server/routes/. We need real-time updates
for the /notifications endpoint. Identify which files
need changes, what new files are needed, and flag any
architectural risks."

Step 2 — Parent reviews the plan, gets user approval

Step 3 — general-purpose agent (with worktree isolation):
"Implement the WebSocket layer as designed in the plan.
Create server/ws/handler.ts, modify server/app.ts to
attach the WS server, and add the notification broadcast
in server/routes/notifications.ts."
```

The Plan agent has access to all read tools but cannot edit files — it's structurally prevented from jumping ahead. This separation of planning and execution mirrors how experienced engineers work: design first, code second.

## Example 3: Isolated Worktree Edits

Claude Code supports **worktree isolation** for subagents, which creates a temporary `git worktree` so the agent works on a separate copy of the repository. If the agent's changes don't work out, the worktree is automatically cleaned up. If the changes are good, the worktree path and branch are returned for review.

**Scenario:** You want to try two different approaches to a performance optimization and compare results.

```
Agent A (worktree isolation):
"Refactor the data processing pipeline in
scripts/process.ts to use streaming instead of
loading everything into memory. Run the test suite
to verify correctness."

Agent B (worktree isolation):
"Refactor the data processing pipeline in
scripts/process.ts to use worker threads for
parallel processing. Run the test suite to
verify correctness."
```

Both agents work on isolated copies of the repo simultaneously. Neither can interfere with the other or with your working tree. You compare results and merge the winner.

**When to use this pattern:** Risky refactors, experimental approaches, or any change where you want a clean rollback path. It's also useful when you want a "second opinion" implementation from a separate agent that starts fresh.

## Example 4: Background Agents for Long Tasks

Subagents can run in the background while the parent continues other work. This is valuable for tasks that take time — running test suites, building projects, or performing comprehensive code audits.

**Scenario:** You're fixing a bug and want a full test run happening while you investigate.

```
Agent (background, general-purpose):
"Run the full test suite with npm test.
If any tests fail, read the failing test files
and the source files they test. Report which
tests failed, why, and whether the failures
are related to recent changes in the auth module."

Meanwhile, the parent agent continues:
- Reading the bug report
- Examining the relevant source code
- Drafting a fix
```

When the background agent completes, a notification arrives with the results. The parent integrates the test findings into its ongoing work. No polling, no waiting.

## Example 5: Multi-Agent PR Review

Subagents shine in code review workflows where different aspects of a change need independent evaluation.

**Scenario:** A large pull request touches API routes, database migrations, and frontend components.

```
Agent 1 (Explore): "Review the database migration
  files in this PR. Check for: reversibility, index
  coverage, data loss risks, and compatibility with
  the existing schema."

Agent 2 (Explore): "Review the API route changes.
  Check for: authentication guards on new endpoints,
  input validation, error handling, and breaking
  changes to existing response shapes."

Agent 3 (Explore): "Review the frontend changes.
  Check for: accessibility, error states, loading
  states, and whether new API calls handle failures."
```

Each agent focuses on its domain expertise. The parent collects all three reviews and presents a unified assessment. This mirrors how engineering teams naturally split review responsibilities.

For more on Claude Code's review capabilities, see our coverage of [Claude Code review agents](/blog/claude-code-review-agents).

## Best Practices for Subagent Prompts

Writing effective subagent prompts differs from writing prompts for the main agent. The subagent starts with **zero context** — it hasn't seen your conversation, doesn't know what you've tried, and doesn't understand why the task matters.

**Be explicit about context.** Include file paths, what you've already learned, and what specifically to look for. "Find the auth bug" is too vague. "Check `src/auth/session.ts` lines 45-80 for why the token refresh fails when the Redis TTL expires before the JWT expiry" gives the agent enough to work independently.

**Specify the output format.** Tell the agent whether you want a short summary, a detailed report, or specific file paths. "Report in under 200 words" prevents context window bloat when the results come back.

**Match agent type to task.** Use Explore for read-only research, Plan for architecture design, and general-purpose only when the agent needs to execute commands or make changes. Over-privileging agents slows them down — an Explore agent with fewer tools runs faster than a general-purpose agent doing the same search.

**Don't delegate understanding.** Write prompts that prove you've done the thinking. "Based on your findings, fix the bug" pushes synthesis onto the agent. "The bug is in the token refresh logic at `session.ts:52` — the TTL comparison uses seconds but the JWT expiry is in milliseconds. Fix the comparison" produces reliable results.

For more on structuring agent workflows, see how Claude Code's [extension stack](/blog/claude-code-extension-stack-skills-hooks-agents-mcp) connects skills, hooks, agents, and MCP into a programmable platform.

## When Subagents Are Overkill

Not every task needs subagents. If you're making a single-file change, fixing a typo, or asking a question about one function, the parent agent handles it faster than spawning a child. The overhead of creating a subagent — context initialization, tool setup, result synthesis — only pays off when the task involves multiple independent steps or would consume significant context window space.

A useful rule: if the task requires reading more than 5-10 files or involves genuinely parallel work streams, reach for subagents. Otherwise, keep it simple.

## Frequently Asked Questions

### How many subagents can Claude Code run in parallel?

Claude Code can spawn multiple subagents simultaneously by including multiple Agent tool calls in a single response. There's no hard-coded limit on parallel agents, but practical throughput depends on API rate limits and the complexity of each agent's task. Launching 2-4 parallel agents for independent research tasks is the most common pattern.

### Do subagents share context with the parent agent?

No. Each subagent starts with a fresh context window and only sees the prompt provided when it's spawned. This is a feature, not a limitation — it prevents context window pollution and lets agents work independently. The parent receives a summary result and must synthesize findings itself.

### Can subagents edit files in the main working tree?

Yes, general-purpose subagents can edit files in the main working tree by default. For risky changes, use the `isolation: "worktree"` parameter to create a temporary git worktree, so the agent works on an isolated copy. If the agent makes no changes, the worktree is automatically cleaned up.

---

*Want more AI insights? [Subscribe to LoreAI](/subscribe) for daily briefings.*