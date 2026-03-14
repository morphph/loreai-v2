---
title: "MCP vs CLI vs Skills: How to Extend Claude Code Without Over-Engineering"
date: 2026-03-12
slug: mcp-vs-cli-vs-skills-extend-claude-code
description: "Compare MCP servers, CLI tools, and Skills — the three ways to extend Claude Code. Learn when each fits and avoid the over-engineering trap."
keywords: ["claude code extensions", "model context protocol mcp", "claude code skills", "claude code mcp server", "ai coding tool extensibility"]
category: DEV
related_newsletter: 2026-03-12
related_glossary: [claude-code, mcp]
related_compare: []
related_topics: [claude-code]
lang: en
video_ready: true
video_hook: "80% of MCP servers should be a 10-line markdown file"
video_status: none
---

# MCP vs CLI vs Skills: How to Extend Claude Code Without Over-Engineering

**MCP** is the new microservices: everyone's building servers for problems a 5-line bash script already solves. Since Anthropic open-sourced the [Model Context Protocol](/glossary/mcp) in November 2024, developers have defaulted to building MCP servers for every [Claude Code](/glossary/claude-code) extension — prompt templates, API wrappers, shell automations. But Claude Code ships with three distinct extensibility mechanisms, and choosing the wrong one is the most expensive mistake in the ecosystem right now. The complexity gradient is real: Skills take 30 seconds, CLI wrappers take 5 minutes, MCP servers take hours. Roughly 80% of real-world use cases fit in the first two categories.

## What Happened

When Anthropic launched Claude Code in February 2025, it shipped with a powerful but opaque extensibility story. Three mechanisms — **MCP servers**, **CLI/Bash tools**, and **Skills** — each solve different problems, but the documentation treats them as separate features rather than a coherent decision framework. The community noticed: by early 2026, MCP had been adopted by OpenAI, Google DeepMind, and integrated into 20+ developer tools including VS Code, JetBrains, and [Cursor](/glossary/cursor).

The attention imbalance is stark. MCP gets the conference talks, the blog posts, the YouTube tutorials. Skills — single markdown files in `.claude/commands/` with zero dependencies, zero runtime processes, invokable via `/slash-commands` — remain largely unknown. Most developers skip them entirely and jump straight to building MCP servers.

This is the classic golden hammer problem replaying in the AI tooling ecosystem. A developer hears about MCP at a meetup, builds a server to wrap a single API call, deploys a persistent Node.js process to serve what amounts to a prompt template. The server works. It's also 200 lines of boilerplate for something a 10-line markdown file handles better.

The [MCP specification](https://modelcontextprotocol.io/specification) defines a full protocol layer: JSON-RPC transport, typed tool schemas with JSON Schema parameters, persistent server processes communicating over stdio or HTTP. That's genuine infrastructure — and genuinely necessary for some use cases. The problem isn't MCP itself. It's reaching for MCP first.

## Why It Matters

The AI tooling ecosystem is repeating the exact same over-engineering cycle that produced the "microservices for a todo app" era. Teams are building MCP servers to wrap a single API call that `curl` handles in one line. They're deploying persistent processes to serve a prompt template that belongs in a markdown file.

The setup cost difference is staggering. A new Skill takes 30 seconds: create a `.md` file in `.claude/commands/`, write a prompt, done. A CLI wrapper takes 5 minutes: write a shell script, `chmod +x`, put it on PATH. A proper MCP server takes 2-8 hours: scaffold the project, implement JSON-RPC transport, define tool schemas, write handler logic, configure Claude Code to connect, debug the inevitable transport issues.

For the 80% of use cases that are prompt reuse or simple automation, the Skill/CLI path isn't just faster to build — it's more maintainable, more portable across team members, and easier to understand when someone new joins the project. A markdown file in your repo explains itself. A Node.js MCP server with JSON-RPC transport requires context that lives outside the code.

The competitive dynamics matter too. Skills are checked into git. They go through code review. They travel with the project. When your AI assistant's behavior is defined in version-controlled markdown files rather than a running process on someone's laptop, you get reproducibility that a locally configured MCP server can't match.

## Technical Deep-Dive

The three mechanisms form a clear architectural spectrum, each with distinct runtime characteristics.

**Skills** live as markdown files in `.claude/commands/` (project-scoped) or `~/.claude/commands/` (global). When you type `/skill-name`, Claude Code loads the markdown as a system prompt injection. No process spawning, no network calls, no dependencies. The Skill tells Claude *what to do* — and Claude's built-in tools handle the *how*. A Skill that says "fetch the latest deployment status using `curl`" works because Claude Code already has Bash access. You're composing capabilities, not building new ones.

```markdown
# /deploy-status
Check the deployment status and summarize any failures.
Run: curl -s https://api.vercel.com/v6/deployments?limit=5 | jq '.deployments[] | {state, url, created}'
Format the output as a markdown table.
```

That's a complete Skill. Zero boilerplate.

**CLI/Bash tools** are the next layer. Claude Code's built-in Bash tool already exposes the entire Unix toolkit — `curl`, `jq`, `git`, `docker`, any CLI on your PATH. Wrapping common workflows in shell scripts or Makefiles makes them instantly available. No registration, no configuration. If it's executable, Claude can run it.

**MCP servers** are the heavyweight option: a long-running process (typically Node.js or Python) communicating via JSON-RPC, exposing typed tool definitions, maintaining state across invocations. A minimal server requires three components — transport layer, tool schema definitions, and handler logic — before doing anything useful. That's 50-200 lines of boilerplate as a starting cost.

The critical architectural difference: Skills and CLI are stateless and ephemeral, while MCP servers are stateful and persistent. That's exactly why MCP is overkill for most use cases — and exactly why it's essential for the cases that genuinely need it.

## What You Should Do

1. **Audit your existing MCP servers.** For each one, ask: does this need persistent state or cross-tool compatibility? If no, decompose it into a Skill + shell script.
2. **Start with Skills for prompt reuse.** Create `.claude/commands/` in your project. Every reusable prompt pattern — code review checklists, commit message formats, deployment procedures — belongs here first.
3. **Use CLI for side effects.** API calls, file transformations, build commands — wrap them in shell scripts. Claude already has Bash access; you don't need a protocol layer.
4. **Reserve MCP for genuine interop.** If the same tool must work in Claude Code, Cursor, VS Code Copilot, and custom agents, MCP earns its complexity. If it only runs in Claude Code, it probably doesn't.
5. **Watch for Skill sprawl.** As your `.claude/commands/` directory grows, organize by domain (`review/`, `deploy/`, `test/`) to keep the slash-command namespace discoverable.

**Related**: See how [Claude Code Agent Teams](/blog/claude-code-agent-teams) leverage Skills for multi-agent workflows. For background on Claude Code's architecture, check [Claude Code](/glossary/claude-code) and [MCP](/glossary/mcp) in our glossary.

---

*Found this useful? [Subscribe to AI News](/subscribe) for daily AI briefings.*
