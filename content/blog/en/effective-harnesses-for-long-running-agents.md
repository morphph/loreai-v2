---
title: "Effective Harnesses for Long-Running Agents: How to Keep AI Coding Across Sessions"
date: 2026-03-10
slug: effective-harnesses-for-long-running-agents
description: "How Anthropic solved the long-running agent problem with initializer agents, progress files, and incremental coding sessions that span hours or days."
keywords: ["long-running agents", "Claude Agent SDK", "agent harness", "multi-session agents", "AI coding agents"]
category: DEV
related_newsletter: 2026-03-10
related_glossary: [claude-code, claude-agent-sdk, context-window]
related_compare: []
related_topics: [claude-code]
lang: en
video_ready: true
video_hook: "Your AI agent forgets everything between sessions — here's how to fix that"
video_status: published
source_type: video
---

# Effective Harnesses for Long-Running Agents: How to Keep AI Coding Across Sessions

The biggest unsolved problem in AI coding isn't model intelligence — it's **memory across sessions**. When a task takes hours or days, agents must work across multiple [context windows](/glossary/context-window), and each new window starts blank. Anthropic tackled this head-on with a two-part harness for the [Claude Agent SDK](/glossary/claude-agent-sdk): an initializer agent that sets up the environment, and a coding agent that makes incremental progress while leaving structured breadcrumbs for the next session. The approach draws directly from how effective human engineers manage shift handoffs — and it works.

## What Happened

Anthropic published a detailed guide on building **effective harnesses for long-running agents**, addressing a core limitation: agents working across multiple context windows lose all memory between sessions. Even with compaction (which summarizes prior context to avoid exhausting the window), frontier models like Claude Opus 4.5 running in a loop would fail at complex, multi-session tasks.

The failures followed two predictable patterns. First, agents tried to **one-shot** the entire project — attempting to build everything at once, running out of context mid-implementation, and leaving the next session to untangle half-finished code. Second, later agent sessions would survey existing progress and **prematurely declare the project complete**, missing remaining work.

Anthropic's solution splits the problem into two specialized agent roles:

1. **Initializer agent**: Runs once on the first session. Sets up an `init.sh` script, creates a `claude-progress.txt` tracking file, generates a comprehensive feature list, and makes an initial git commit.

2. **Coding agent**: Runs on every subsequent session. Reads the progress file and git history to understand current state, makes incremental progress on one feature at a time, updates the progress log, and leaves the codebase in a clean, merge-ready state.

The accompanying quickstart code is available alongside the Claude Agent SDK documentation.

## Why It Matters

This isn't just an Anthropic-specific pattern — it's a blueprint for anyone building agent systems that need to work beyond a single context window. And that's increasingly every serious agent deployment.

The shift-handoff analogy is powerful. Human engineering teams solved this problem decades ago: write documentation, keep a log, commit clean code, and brief the next person. The insight is that agents need the same discipline, enforced through prompts and structured artifacts rather than team culture.

The **feature list pattern** is particularly clever. By having the initializer agent decompose a high-level prompt like "build a clone of claude.ai" into 200+ specific, testable features — each marked as passing or failing — later agents get an unambiguous picture of what "done" looks like. No more premature completion. No more scope confusion.

For teams building with competing frameworks — [LangGraph](https://langchain.com/langgraph), [CrewAI](https://crewai.com), or custom orchestrators — the principles transfer directly. The specific implementation uses the Claude Agent SDK, but the architecture (initializer + incremental worker + progress artifacts) is framework-agnostic.

The competitive angle matters too. As agents take on larger codebases and longer projects, the harness quality becomes the differentiator. Raw model capability hits diminishing returns; **orchestration quality** determines whether a 10-hour agent run produces a working app or a mess of abandoned branches.

## Technical Deep-Dive

The harness architecture has three critical components that work together:

### Progress tracking with `claude-progress.txt`

Each coding agent session reads this file first, gaining instant context on what's been done and what's next. The file serves as a lightweight, human-readable alternative to trying to reconstruct state from code alone. Combined with git history, it gives the agent two complementary views: the narrative log (what was intended) and the diff history (what actually changed).

### Feature decomposition as a contract

The initializer generates a structured feature list in JSON format:

```json
{
    "category": "functional",
    "description": "New chat button creates a fresh conversation",
    "steps": [
      "Navigate to main interface",
      "Click the 'New Chat' button",
      "Verify a new conversation is created"
    ],
    "passes": false
}
```

Coding agents can only flip `passes` from `false` to `true` — they cannot remove or edit feature definitions. This constraint prevents a common failure mode where agents "pass" tests by weakening the criteria rather than implementing the feature. Strong prompt language enforces this boundary.

### Clean-state discipline

Each session must leave the codebase in a merge-ready state: no half-implemented features, no broken builds, no undocumented changes. This mirrors the engineering practice of "always commit to main in a deployable state." If an agent can't finish a feature within a session, it should revert to the last clean state and document what was attempted in the progress file.

### Why compaction alone fails

Context compaction — summarizing earlier conversation to free up tokens — helps extend a single session but doesn't solve cross-session continuity. Compacted summaries lose implementation details, architectural decisions, and the specific state of partially-completed work. The progress file and feature list provide **structured** context that survives session boundaries intact, unlike the lossy compression of compaction.

One limitation worth noting: this approach adds overhead. The initializer step, progress file maintenance, and clean-state requirements all consume tokens and time that could theoretically go toward coding. For short tasks that fit in a single context window, this harness is unnecessary. The payoff comes specifically on multi-session projects where the alternative is chaotic, context-free restarts.

## What You Should Do

1. **Adopt the two-agent pattern** for any task that might exceed a single context window. Even if you're not using the Claude Agent SDK, implement an initializer step that decomposes the task and a worker step that reads progress artifacts.

2. **Create a progress file** in your agent workflows. A simple markdown or text log that each session reads and updates is the single highest-leverage addition you can make to a multi-session agent.

3. **Decompose prompts into testable features** before the first coding session. The more specific and verifiable each feature definition, the less likely agents are to one-shot or declare premature completion.

4. **Enforce clean-state boundaries** between sessions. Prompt your agents to commit working code, revert incomplete changes, and document what's next.

5. **Review the [Claude Agent SDK quickstart](https://docs.anthropic.com/en/docs/agents-and-tools/claude-agent-sdk)** for reference implementations of these patterns.

**Related**: [Today's newsletter](/newsletter/2026-03-10) covers the broader AI landscape. See also: [What is the Claude Agent SDK](/glossary/claude-agent-sdk).

---

*Found this useful? [Subscribe to AI News](/subscribe) for daily AI briefings.*