---
title: >-
  Claude Opus 4.6 1M Context Now Default for Claude Code on Max, Team, and
  Enterprise
date: 2026-03-18T00:00:00.000Z
slug: opus-4-6-1m-default-claude-code
description: >-
  Claude Opus 4.6 with 1M context window is now the default model for Claude
  Code users on Max, Team, and Enterprise plans — here's what changes.
keywords:
  - Claude Opus 4.6
  - Claude Code 1M context
  - Anthropic Claude Code
  - Claude Code enterprise
category: DEV
related_newsletter: 2026-03-18T00:00:00.000Z
related_glossary:
  - claude-code
  - context-window
related_compare:
  - claude-code-vs-cursor
lang: en
video_ready: true
video_hook: Claude Code just silently upgraded every paying user to a 1M context model
video_status: none
---

# Claude Opus 4.6 1M Context Now Default for Claude Code on Max, Team, and Enterprise

**[Claude Opus 4.6](/blog/claude-1-million-context-window-ga)** with its full **1 million token context window** is now the default Opus model for all [Claude Code](/glossary/claude-code) users on Max, Team, and Enterprise plans. No toggle, no opt-in — it's just there. For developers working on large codebases, this eliminates the single biggest friction point in AI-assisted development: running out of context mid-task. The upgrade rolled out to 100% of eligible users, making Opus 4.6 1M the baseline rather than the exception.

## What Happened

Anthropic quietly flipped the switch to make **Opus 4.6 1M** the default model selection for [Claude Code](/blog/claude-code-complete-guide) across its paid tiers. Previously, users on Max, Team, and Enterprise plans had access to Opus 4.6 but with a shorter default [context window](/glossary/context-window). The 1M variant was available but required explicit selection.

The change was [confirmed by Boris Cherny](https://x.com/bcherny/status/2032514807388123255), who noted the rollout is now at 100% of users. This isn't a new model — Opus 4.6 has been available since its launch — but making the 1M context version the *default* signals Anthropic's confidence in both the model's stability at that context length and the infrastructure's ability to handle the load at scale.

The timing aligns with a broader wave of Claude platform updates. In the same week, Anthropic shipped interactive charts and diagrams in Claude's chat interface, Excel-PowerPoint sync capabilities, and the `/btw` sidebar feature in Claude Code that lets developers run parallel conversations while a primary task executes. The pattern is clear: Anthropic is pushing Claude Code from "useful coding assistant" toward "full development environment."

For context, 1 million tokens translates to roughly 750,000 words — enough to hold an entire medium-sized codebase in a single conversation. That's the equivalent of loading ~3,000 source files simultaneously.

## Why It Matters

Context window size is the invisible ceiling on what AI coding tools can actually accomplish. A 200K context model can handle a few files and some conversation history. A 1M context model can hold an entire microservice, its test suite, its documentation, and still have room for a multi-turn debugging session.

The practical impact shows up in three places:

**Large refactors become viable.** Renaming a pattern across 50 files, migrating an API version, or restructuring a module hierarchy — these tasks require the model to see the full picture. At 200K, you hit the wall. At 1M, most projects fit entirely within context.

**Fewer "I lost track" moments.** Every Claude Code user has experienced the model forgetting a constraint mentioned 20 messages ago. With 1M context, conversations can run significantly longer before context pressure forces compression or truncation.

**Enterprise adoption gets easier.** Teams evaluating AI coding tools care about consistency across long sessions. A model that degrades as context fills up is a hard sell for production workflows. Making 1M the default, not an upsell, removes a common objection.

The competitive angle matters too. [Cursor](/glossary/cursor) and [GitHub Copilot](/glossary/github-[copilot](/glossary/copilot)) operate with significantly shorter context windows. Google's Gemini offers 1M+ context but lacks a dedicated CLI coding tool with Claude Code's depth of integration. By defaulting to 1M, Anthropic sets a new baseline that competitors must match.

## Technical Deep-Dive

The jump to 1M default raises legitimate questions about performance and cost tradeoffs.

**Latency**: Longer context windows mean more tokens to process on every turn. Opus 4.6 uses efficient attention mechanisms, but users should expect marginally higher latency on turns where the full context is active. In practice, Claude Code's context management — which compresses older messages and selectively loads file content — means most requests don't actually hit the 1M ceiling.

**Quality at depth**: Not all context is created equal. Research consistently shows that LLMs attend more strongly to the beginning and end of their context window, with a "lost in the middle" effect for information buried deep in the sequence. Anthropic has invested heavily in mitigating this for Claude models, but developers should still front-load critical constraints (in `[CLAUDE.md](/blog/claude-code-memory)` or early in the conversation) rather than relying on the model to perfectly recall a detail from 800K tokens ago.

**Cost implications**: For Max plan users ($100/month or $200/month tiers), the 1M context is included — no per-token billing. Team and Enterprise plans have their own rate structures, but the model itself is now the same across all paid tiers. This is a significant value increase for Max subscribers who were previously choosing between Opus quality and context length.

**What didn't change**: The model's core capabilities — code generation quality, reasoning depth, instruction following — remain identical. This is a context window expansion for the default configuration, not a model upgrade. If you were already using Opus 4.6 1M by explicit selection, nothing changes for you.

One practical note: Claude Code's automatic context management means the 1M window is a ceiling, not a constant. The system dynamically manages what's in context based on relevance, compressing older conversation turns and selectively including file contents. The 1M capacity means it has more headroom before it *must* compress.

## What You Should Do

1. **Stop manually selecting models.** If you've been switching to Opus 4.6 1M in Claude Code settings, you can remove that step — it's now the default.
2. **Try longer sessions.** Test a multi-file refactor or extended debugging session that you'd previously broken into smaller chunks. The extra context should reduce the need to re-explain constraints.
3. **Front-load your `CLAUDE.md`** with the most critical project rules and conventions. Even with 1M context, information at the top of the window gets the strongest attention.
4. **Review your plan tier.** If you're on a free or Pro plan without Claude Code access, this is another reason to evaluate Max — the 1M default makes the coding experience meaningfully better for complex projects.
5. **Monitor latency** on your specific workflows. If you notice slowdowns on very long sessions, consider using `/clear` strategically to reset context when switching between unrelated tasks.

**Related**: [Today's newsletter](/newsletter/2026-03-18) covers the broader context of this week's Anthropic updates. See also: [Claude Code overview](/glossary/claude-code).

---

*Found this useful? [Subscribe to AI News](/subscribe) for daily AI briefings.*
