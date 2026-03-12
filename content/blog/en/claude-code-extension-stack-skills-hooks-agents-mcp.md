---
title: "Claude Code's Extension Stack: How Skills, Hooks, MCP, and Agent Teams Built an OS for Code"
date: 2026-03-12
slug: claude-code-extension-stack-skills-hooks-agents-mcp
description: "How Claude Code's layered extension stack — Skills, Hooks, MCP, and Agent Teams — turned a CLI into an operating system for software engineering."
keywords: ["Claude Code architecture", "agent teams", "Model Context Protocol MCP", "AI coding assistant", "multi-agent orchestration"]
category: DEV
related_newsletter: 2026-03-12
related_glossary: [claude-code, mcp, agentic-coding]
related_compare: []
lang: en
video_ready: true
video_hook: "16 AI agents wrote a C compiler for $20K — the architecture behind it matters more than the stunt"
video_status: none
---

# Claude Code's Extension Stack: How Skills, Hooks, MCP, and Agent Teams Built an OS for Code

On February 9, 2026, researcher Nicholas Carlini orchestrated 16 **Claude Code** agents to write a C compiler from scratch in Rust — one capable of compiling the Linux kernel. Total cost: $20,000. The headline obscures the real story. The compiler wasn't possible because Opus 4.6 is smarter. It was possible because Anthropic spent a year building a layered extension architecture — **Skills**, **Hooks**, **MCP**, and **Agent Teams** — that turned a CLI preview into composable infrastructure for software engineering. That architecture, not any single model upgrade, is what matters.

## What Happened

**Claude Code** launched in February 2025 as a terminal-based [agentic coding](/glossary/agentic-coding) tool — impressive, but fundamentally single-threaded. One model, one conversation, one task. Over the next twelve months, Anthropic systematically added extension layers.

May 2025 brought General Availability alongside Claude 4 and the **[Model Context Protocol (MCP)](/glossary/mcp)** — an open standard replacing bespoke plugin systems with universal connectors to Jira, Slack, Google Drive, and custom enterprise tooling. By July, [Claude Code](/glossary/claude-code) revenue had surged 5.5x, with engineers at Microsoft, Google, and even OpenAI actively using a competitor's product.

The configuration layer matured in parallel. `CLAUDE.md` files became project-level rulesets parsed at session startup. **Skills** (packaged as `SKILL.md` files) turned complex workflows like `/review-pr` or `/deploy-staging` into reusable slash commands. **Hooks** wired shell commands to AI actions — auto-formatting after edits, running linters before commits.

Then, on February 5, 2026, Anthropic shipped Claude Opus 4.6 with [**agent teams**](/blog/claude-code-agent-teams): the ability for a lead agent to spawn multiple subagents working concurrently on different parts of a task. Four days later, Carlini's 16-agent compiler experiment proved the concept wasn't theoretical. In December 2025, NASA had already trusted Claude Code to [plan a 400-meter route](https://www.anthropic.com/research/claude-on-mars) for the Perseverance Mars rover — the first known use of an AI coding agent in active space exploration.

## Why It Matters

The significance isn't that AI can write a compiler. It's that the extension stack makes complex multi-agent engineering *composable*.

Consider what Carlini's experiment actually required: 16 agents needed coordinated access to the same codebase, shared understanding of project constraints (via `CLAUDE.md`), the ability to run builds and tests (via Hooks), and a lead agent capable of decomposing a macro-task into coherent subtasks (via the Agent SDK). No single feature enables this. The layers compose.

This is the insight most coverage misses. GitHub Copilot suggests code inline. Cursor embeds AI in an editor. Claude Code is neither — it's infrastructure. It follows Unix philosophy: pipe logs into it, run it in CI/CD, chain it with other tools. The configuration lives in version-controlled markdown files that travel with your repo, not in a settings panel that dies with your session.

The economic implications are stark. If 16 agents can write a compiler for $20,000 in hours, tasks that occupy senior engineering teams for weeks face a fundamentally different cost curve. The 5.5x revenue surge and cross-competitor adoption signal that developers already see this. NASA trusting it for Mars rover operations signals reliability beyond toy demos.

But composability compounds risk as readily as capability. In August 2025, threat actor GTG-2002 [weaponized Claude Code for cyberattacks](/blog/claude-code-security-vulnerability-scanning) — an agentic CLI with full shell access is inherently dual-use. Anthropic's February 2026 response included [Claude Code Security](https://www.anthropic.com/news/responsible-scaling-policy-v3), proactive vulnerability scanning, and Responsible Scaling Policy v3.0. The fundamental tension remains: you cannot grant an AI agent shell access, git control, and enterprise system connectivity without creating an attack surface.

## Technical Deep-Dive

Claude Code's extension stack has five distinct layers, each handling a different concern:

**1. CLAUDE.md (Project Rules):** Parsed at session start. Defines build commands, coding standards, architecture constraints, and mandatory checklists. Every agent in a team inherits these rules — a single file governs behavior across all subagents.

**2. Skills (Reusable Workflows):** `SKILL.md` files in `skills/{name}/` directories package domain-specific instructions — tone guidelines, output templates, validation rules, few-shot examples. Claude Code auto-loads the relevant skill based on context. Skills are [composable with MCP and Hooks](/blog/mcp-vs-cli-vs-skills-extend-claude-code), not isolated features.

**3. Hooks (Local Automation):** Shell commands that fire before or after AI actions. Pre-commit hooks run linters. Post-edit hooks trigger formatters. This bridges the gap between AI-generated code and your team's existing toolchain without modifying either side.

**4. MCP (External Data):** The Model Context Protocol provides standardized connectors — pull Jira tickets into working memory, read Google Drive specs, extract Slack context. Because MCP is an open standard, third-party servers can bridge any data source. This is what prevents agents from operating in a vacuum.

**5. Agent Teams (Parallel Execution):** A lead agent decomposes tasks and delegates to subagents via the Agent SDK. Subagents work concurrently on separate concerns — one handles the parser, another the code generator, a third writes tests. The lead merges outputs. Carlini's compiler experiment used 16 such agents; the architecture supports arbitrary depth.

The critical design choice: each layer is independent but composable. You can use Skills without MCP, Hooks without Agent Teams, or the full stack together. A misconfigured `CLAUDE.md`, however, propagates errors across every agent in the team — the same composability that enables power also amplifies mistakes.

## What You Should Do

1. **Start with `CLAUDE.md`**. Define your project's build commands, coding standards, and constraints in a single file. This is the highest-leverage configuration — every agent session reads it.
2. **Build one Skill for your most repetitive workflow**. Code review, PR descriptions, changelog generation — pick the task you repeat weekly and encode it as a `SKILL.md` with a few-shot example.
3. **Wire Hooks to your existing toolchain**. Auto-format on edit, lint on commit. Hooks eliminate the gap between AI output and your team's standards without changing either.
4. **Evaluate MCP connectors for your stack**. If your team lives in Jira and Slack, connecting Claude Code to those systems via MCP transforms it from a code tool into a project-aware agent.
5. **Treat agent teams as a force multiplier, not a default**. Multi-agent orchestration suits large decomposable tasks. For focused work, a single agent with good Skills and Hooks is faster and cheaper.

**Related**: [Today's newsletter](/newsletter/2026-03-12) covers the broader AI landscape. See also: [MCP vs CLI vs Skills: How to Extend Claude Code](/blog/mcp-vs-cli-vs-skills-extend-claude-code) and [Claude Code Agent Teams](/blog/claude-code-agent-teams).

---

*Found this useful? [Subscribe to AI News](/subscribe) for daily AI briefings.*
