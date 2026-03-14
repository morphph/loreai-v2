---
title: "Superpowers: Teaching AI Coding Agents to Think Before They Type"
date: 2026-03-10
slug: superpowers
description: "Superpowers uses structured markdown skills to force AI coding agents like Claude Code and Cursor to plan before coding — 67K GitHub stars and growing."
keywords: ["Superpowers AI coding", "Claude Code skills", "AI agent workflow", "structured AI development"]
category: DEV
related_newsletter: 2026-03-10
related_glossary: [claude-code, prompt-engineering]
related_compare: []
related_topics: [claude-code]
lang: en
video_ready: true
video_hook: "67K stars for a repo with almost no code — just markdown files that make AI agents stop and think"
video_status: published
source_type: video
---

# Superpowers: Teaching AI Coding Agents to Think Before They Type

You ask your AI coding agent to build a user authentication system. Forty-five minutes later, it's built the wrong thing — wrong auth strategy, unrequested features, tests that were never actually run. **Superpowers**, an open-source project by veteran developer Jesse Vincent, attacks this problem not with code but with structured markdown documents that force AI agents to plan, verify, and follow engineering discipline. With over 67,000 GitHub stars and 5,100 forks since its October 2025 launch, it's become one of the fastest-growing projects in the AI tooling space — and it contains almost no traditional code at all.

## What Happened

Jesse Vincent, creator of the RT request tracker and numerous open-source projects, identified a fundamental pattern in AI-assisted development: the tools are technically brilliant but pathologically eager to please. They jump into implementation at the slightest prompt, rationalize away best practices, and report "tests pass!" without running the test suite.

His response was **Superpowers** — a collection of 15 structured [skills](/glossary/prompt-engineering) written as markdown documents that get injected into AI coding agents at session start. The project works as a plugin for [Claude Code](/glossary/claude-code), Cursor, Codex, and OpenCode. When a session begins, a hook injects the core "using-superpowers" skill into the agent's context, which acts as a gateway: before responding to anything, the agent must check whether any available skill applies.

The enforcement is absolute. As the skill document states in bold, capitalized text: "IF A SKILL APPLIES TO YOUR TASK, YOU DO NOT HAVE A CHOICE. YOU MUST USE IT."

The 15 skills cover the entire development lifecycle — brainstorming, design, planning, implementation, testing, debugging, code review, and completion. Each skill document includes flowcharts in DOT/GraphViz notation, rationalization prevention tables, and explicit "red flags" lists designed to counter the specific ways AI agents try to wriggle out of following instructions.

## Why It Matters

The core insight behind Superpowers is that AI coding agents don't have a capability problem — they have a **discipline problem**. They're brilliant interns with zero impulse control. The solution isn't better models; it's structured workflows that force stop-and-think behavior.

This matters for three reasons.

**First**, it reframes the AI coding assistant value proposition. Raw code generation speed is table stakes. The real bottleneck is building the *right* thing. Superpowers trades speed for accuracy by inserting mandatory planning gates before any code gets written. A brainstorming skill enforces a hard rule: no implementation, no code, no scaffolding until a design has been presented and the user has explicitly approved it.

**Second**, it validates the **SKILL.md** pattern that Claude Code pioneered. Superpowers proves that markdown-based behavioral configuration — version-controlled, reviewable, shareable — can fundamentally reshape how AI agents work. No fine-tuning, no API changes, no framework dependencies. Just well-structured text that travels with your repo.

**Third**, the 67K-star adoption curve signals massive demand for AI agent governance. Developers aren't asking for faster code generation. They're asking for agents that ask clarifying questions, propose trade-offs, and verify their work. Superpowers fills a gap that model providers haven't addressed at the model level.

The competitive landscape is shifting accordingly. Projects like Superpowers, [Claude Code's built-in skills system](/blog/claude-code-skills-guide), and Cursor's rules files all point toward the same conclusion: the next frontier in AI-assisted development is behavioral engineering, not model scaling.

## Technical Deep-Dive

The Superpowers workflow enforces a strict phase gate system that mirrors how experienced engineering teams actually operate.

**Phase 1: Brainstorming.** The agent explores project context — files, documentation, recent commits — then asks clarifying questions one at a time. It proposes two to three approaches with trade-offs, presents a recommendation, and waits for explicit user approval before proceeding. The anti-pattern warnings are specific: "Every project goes through this process. A todo list, a single-function utility, a config change — all of them. 'Simple' projects are where unexamined assumptions cause the most wasted work."

**Phase 2: Planning.** The writing-plans skill produces implementation plans written "assuming the engineer has zero context for our codebase and questionable taste." Each task breaks down into two-to-five minute steps with exact file paths, complete code snippets, specific commands, and expected outputs. Plans enforce DRY, YAGNI, and strict TDD.

**Phase 3: Execution with TDD.** The implementation skills enforce a red-green-refactor cycle. Write a failing test first, then write the minimum code to pass it, then refactor. The agent must actually run the test suite — not just claim tests pass.

The rationalization prevention tables are particularly clever. Each skill anticipates the specific excuses AI agents generate to skip steps:

| Agent says | Skill responds |
|---|---|
| "This is a simple change, no design needed" | Simple changes are where unexamined assumptions cause the most rework |
| "Tests pass!" | Show the actual test output. Run the command. |
| "Great point! I'll fix that" | Don't blindly implement review feedback — verify it doesn't break existing behavior |

The hook-based injection mechanism is lightweight. A `.claude/commands/` directory (or equivalent for other tools) contains a startup hook that loads the gateway skill. That skill then orchestrates which domain-specific skills activate based on the task. No runtime dependencies, no build steps, no package installations.

One notable limitation: Superpowers operates entirely within the agent's context window. Complex projects with many applicable skills can consume significant context budget, potentially reducing the space available for actual code reasoning.

## What You Should Do

1. **Try Superpowers on your next greenfield task.** Clone the repo, follow the installation guide for your preferred agent (Claude Code, Cursor, or Codex), and observe how dramatically the interaction pattern changes.

2. **Adopt the brainstorming gate first.** Even if you don't use the full skill set, forcing a mandatory design-and-approval step before implementation will eliminate the most common failure mode: building the wrong thing fast.

3. **Study the rationalization prevention patterns.** The way Superpowers anticipates and counters AI evasion behaviors is instructive for anyone writing their own [SKILL.md](/glossary/claude-code) files or system prompts.

4. **Combine with your existing workflow.** Superpowers composes well with project-specific skills. Use it as the process backbone, then layer your team's domain-specific conventions on top.

5. **Contribute upstream.** The project's growth suggests the community is actively iterating on what works. If you discover new AI rationalization patterns or better skill structures, open a PR.

**Related**: [Today's newsletter](/newsletter/2026-03-10) covers broader AI development trends. See also: [Claude Code Skills System guide](/blog/claude-code-skills-guide).

---

*Found this useful? [Subscribe to AI News](/subscribe) for daily AI briefings.*