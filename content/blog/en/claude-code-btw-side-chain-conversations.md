---
title: "Claude Code /btw: Side Chain Conversations While Your Agent Works"
date: 2026-03-12
slug: claude-code-btw-side-chain-conversations
description: "Claude Code's new /btw command lets you have side chain conversations while your agent keeps working — no more waiting to ask questions."
keywords: ["Claude Code /btw", "side chain conversations", "Claude Code commands", "Claude Code multitasking"]
category: DEV
related_newsletter: 2026-03-12
related_glossary: [claude-code, agentic-coding]
related_compare: [claude-code-vs-cursor]
lang: en
video_ready: true
video_hook: "You no longer have to wait for Claude Code to finish before asking it something else"
video_status: none
---

# Claude Code /btw: Side Chain Conversations While Your Agent Works

**Claude Code** just shipped `/btw` — a command that lets you start a side conversation with Claude while it's in the middle of executing a task. Instead of waiting for a long-running operation to finish before asking a follow-up question or pivoting to a different topic, you can now interrupt with context that doesn't derail the main thread. It's a small UX addition that solves one of the most persistent friction points in agentic coding: the forced serialization of human thought.

## What Happened

Anthropic engineer [@trq212 announced on X](https://x.com/trq212/status/2031506296697131352) that `/btw` is now available in Claude Code. The command creates what the team calls "side chain conversations" — a secondary dialogue channel that runs parallel to whatever Claude Code is currently doing.

The mechanic is straightforward: while Claude Code is running a build, writing tests, or refactoring a module, you type `/btw` followed by your message. Claude processes your side request without abandoning or corrupting the in-progress task. When the main task completes, your primary conversation continues as if uninterrupted.

This lands alongside a string of rapid **Claude Code** updates. In recent weeks, Anthropic has shipped [HTTP hooks](https://x.com/bcherny/status/2029339111212126458) for more secure extensibility, [Claude Code Remote](https://x.com/bcherny/status/2027462787358949679) for Pro users, new built-in skills like `/simplify` and `/batch`, and scheduled tasks in Cowork mode. The pace of iteration suggests Anthropic is treating Claude Code less as a product and more as a platform — each feature building on the agentic foundation.

The `/btw` command fits a pattern: removing artificial bottlenecks between human intent and AI execution. Previous options were limited — you could either wait, cancel the current task, or open a separate Claude Code session.

## Why It Matters

Agentic coding tools have a serialization problem. When Claude Code is running a 90-second build-and-test cycle, your brain doesn't stop. You notice a typo in a different file. You wonder if the API you're about to use has rate limits. You want to ask about a deployment config. But the current interaction model forces you to queue these thoughts mentally and hope you remember them later.

`/btw` breaks that forced serialization. It acknowledges a fundamental asymmetry in human-AI collaboration: the human's context-switching cost is low (you can think about multiple things), but the tool's UX previously imposed an artificial single-thread constraint.

The competitive angle matters too. [Cursor](/glossary/cursor) and similar tools handle this through multi-pane UIs or separate chat windows, but those require explicit window management. `/btw` is inline — you stay in the same terminal, the same flow, the same mental context. It's closer to how you'd tap a colleague on the shoulder while they're running a deploy: "btw, do you know where the staging credentials are?"

For teams running complex pipelines — builds that take minutes, test suites with dozens of files, multi-step refactors — the cumulative time savings add up. Every "wait and remember" becomes "ask now and move on."

## Technical Deep-Dive

The implementation challenge behind `/btw` is non-trivial. Claude Code operates as a [stateful agentic loop](/glossary/agentic-coding) — it maintains context about what it's doing, what tools it's called, and what it expects to happen next. Injecting a side conversation means managing two concurrent context threads without letting them interfere.

From a user perspective, the interaction model works like this:

```
> Claude Code is running: npm test (23 tests passing, 2 remaining...)

> /btw what's the difference between vitest's vi.fn() and vi.spyOn()?

Claude (side): vi.fn() creates a standalone mock function.
vi.spyOn() wraps an existing method, preserving the original
implementation unless you override it. Use spyOn when you
want to track calls without changing behavior.

> Tests complete. All 25 passed. ✓
> (main conversation continues)
```

The key architectural decision is isolation: the side chain doesn't modify the main task's state. You can ask questions, get explanations, or request information, but the side chain doesn't trigger file edits or tool calls that would conflict with the running operation. This prevents race conditions where a side request might modify a file that the main task is actively working on.

This design mirrors a pattern familiar in concurrent systems: read-only side channels. The side chain can read context (your codebase, documentation, conversation history) but writes are reserved for the main thread. It's a pragmatic trade-off — full concurrent write access would require conflict resolution logic that could introduce more problems than it solves.

One consideration: side chain conversations share the same context window. Complex side discussions during long-running tasks could theoretically consume tokens that the main task needs for its final steps. In practice, most `/btw` interactions are short queries — the "quick question" pattern that the feature is designed for.

## What You Should Do

1. **Use `/btw` for knowledge queries** while Claude Code runs long tasks. "What does this error code mean?" or "What's the syntax for X?" are ideal candidates — they don't require file modifications.
2. **Don't use `/btw` for task pivots**. If you need Claude to change direction entirely, it's better to let the current task finish or cancel it explicitly. Side chains are for tangential questions, not course corrections.
3. **Pair with Claude Code Remote** for maximum benefit. If you're running Claude Code on a remote server with longer build times, side chains become even more valuable — those idle minutes are now usable.
4. **Combine with the new `/simplify` and `/batch` skills** to create efficient workflows: batch your changes, simplify the output, and ask clarifying questions via `/btw` — all without breaking flow.
5. **Update Claude Code** to the latest version to access `/btw`. Check your version with `claude --version` and update if needed.

**Related**: [Today's newsletter](/newsletter/2026-03-12) covers the broader context of this week's Claude Code updates. See also: [Claude Code Skills System](/blog/claude-code-skills-guide).

---

*Found this useful? [Subscribe to AI News](/subscribe) for daily AI briefings.*