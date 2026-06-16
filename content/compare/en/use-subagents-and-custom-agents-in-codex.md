---
title: "Claude Code Subagents vs Codex Agents: Multi-Agent AI Coding Compared"
slug: use-subagents-and-custom-agents-in-codex
description: "Compare subagents and custom agents in Claude Code vs OpenAI Codex — architecture, orchestration, and practical multi-agent workflows."
item_a: Claude Code
item_b: OpenAI Codex
category: tools
related_glossary: [agent-sdk, agentic-coding]
related_blog: [claude-code-agent-teams, claude-code-subagents-examples, codex-complete-guide, claude-code-complete-guide, claude-code-extension-stack-skills-hooks-agents-mcp]
related_compare: []
related_topics: [codex]
lang: en
---

# Claude Code Subagents vs Codex Agents: Multi-Agent AI Coding Compared

**TL;DR:** If you need orchestrated multi-agent workflows where subagents run in parallel, share context, and follow custom-defined behaviors, **Claude Code is the clear leader** — its Agent tool, custom agent definitions, and Workflow scripting engine give you fine-grained control over how agents coordinate. **OpenAI Codex** runs tasks in isolated cloud sandboxes and handles one task per container, making it reliable for independent parallel jobs but limited when tasks need to communicate or follow project-specific agent roles. Choose Claude Code for orchestration depth; choose Codex for fire-and-forget cloud execution.

## Overview: Claude Code Subagents

**Claude Code** is Anthropic's terminal-based [agentic coding](/glossary/agentic-coding) tool that includes a built-in multi-agent system. Subagents are spawned via the `Agent` tool — each runs as an independent Claude instance with its own context window, tool access, and optional git worktree isolation. You can define **custom agent types** in `.claude/agents/` directories, giving each agent a specialized system prompt, restricted tool access, and a defined role in your workflow.

The subagent system supports three orchestration levels. At the simplest level, you spawn a single subagent for a focused task — searching the codebase, reviewing a diff, or generating a test file. At the intermediate level, you launch multiple agents in parallel from your main session, each handling independent work. At the advanced level, **Workflow scripts** let you write deterministic orchestration logic — fan-out with `parallel()`, chain stages with `pipeline()`, enforce structured output with JSON schemas, and loop until convergence conditions are met.

Claude Code subagents inherit the parent session's MCP server connections, permissions, and project context. They can read CLAUDE.md files, use skills, and access any tool the parent session has available. This makes them effective for tasks that need deep project awareness — not just raw code generation, but understanding conventions, running validation gates, and following team-specific workflows. For a deeper look at how teams use this in practice, see our [guide to Claude Code subagent examples](/blog/claude-code-subagents-examples).

## Overview: OpenAI Codex

**OpenAI Codex** is OpenAI's cloud-based coding agent, launched in 2025 and integrated into ChatGPT. Each Codex task runs in an isolated cloud sandbox — a containerized environment with its own filesystem, shell access, and network restrictions. You submit a task (via the ChatGPT interface or API), Codex clones your repository into a fresh container, works on the problem, and returns a diff or pull request when finished.

Codex's agent model is fundamentally **single-task per container**. Each sandbox is independent — it cannot communicate with other running Codex tasks, share intermediate results, or coordinate multi-step workflows across containers. You can launch multiple Codex tasks simultaneously (they run in parallel cloud containers), but each operates in complete isolation. There is no built-in orchestration layer, no way to define custom agent types, and no mechanism for one Codex task to spawn or delegate to another.

This design makes Codex excellent for batch-processing independent tasks: "Fix this bug," "Add tests to this module," "Refactor this file." Each task gets a clean environment, consistent behavior, and a reviewable output. But it limits what you can do when tasks need to share context or follow a coordinated plan. For a full overview of Codex's capabilities, see our [complete Codex guide](/blog/codex-complete-guide).

## Feature Comparison

| Feature | Claude Code | OpenAI Codex | Winner |
|---------|-------------|--------------|--------|
| **Subagent spawning** | Built-in Agent tool, spawn from any session | No native subagent mechanism | Claude Code |
| **Custom agent types** | `.claude/agents/` with custom prompts and tool restrictions | Not supported | Claude Code |
| **Parallel execution** | `parallel()` and `pipeline()` in Workflow scripts | Multiple independent cloud containers | Tie |
| **Inter-agent communication** | Subagents return structured results to parent | No communication between containers | Claude Code |
| **Orchestration scripting** | Full JavaScript Workflow engine with loops, conditionals, schemas | No orchestration layer | Claude Code |
| **Execution environment** | Local terminal (or remote session) | Cloud sandbox (isolated container) | Codex |
| **Git integration** | Full — agents commit, push, create PRs | Full — each task produces a PR/diff | Tie |
| **Project context** | CLAUDE.md, skills, MCP servers inherited by subagents | Repository cloned per task, no persistent context system | Claude Code |
| **Structured output** | JSON schema enforcement on agent returns | Task returns diffs and text | Claude Code |
| **Cost model** | Token-based (per-agent API usage) | Included with ChatGPT Pro/Team/Enterprise | Codex |
| **Setup complexity** | Local install + configuration | Zero setup — cloud-hosted | Codex |

## Subagent Architecture: Detailed Analysis

Claude Code's subagent system is the most sophisticated multi-agent architecture available in a mainstream coding tool as of mid-2026. Understanding the architecture explains why the orchestration gap between Claude Code and Codex is so wide.

**How Claude Code subagents work.** When you call the `Agent` tool, Claude Code spawns a new Claude instance in a separate context window. The parent session passes a prompt describing the task, and optionally specifies an agent type, a JSON schema for structured output, a model override, and an isolation mode. The subagent executes independently — it can read files, run shell commands, search code, and use any MCP tool available to the parent session. When it finishes, its final output (text or structured JSON) is returned to the parent as the tool result.

Key architectural properties:

- **Context isolation**: Each subagent has its own context window. It does not see the parent's conversation history — only the prompt it receives. This is by design: it prevents context pollution and lets you brief each agent precisely.
- **Tool inheritance**: Subagents access the same tools as the parent, including MCP servers that were connected at session start. This means a subagent can query a database, fetch web content, or interact with external APIs without additional setup.
- **Worktree isolation**: For agents that mutate files in parallel, the `isolation: "worktree"` option creates a temporary git worktree. Each agent edits its own copy of the repo, preventing merge conflicts. The worktree is automatically cleaned up if no changes are made.
- **Custom agent types**: Files in `.claude/agents/` define specialized agents with custom system prompts and tool restrictions. For example, a `pipeline-reviewer` agent might only have access to Read, Grep, and Bash tools, with a system prompt that instructs it to cross-check pipeline changes against a known-issues registry.

**How Codex agents work.** Codex takes a different approach — each task runs in a fully isolated cloud container. The container gets a fresh clone of your repository, installs dependencies based on your setup commands, and executes the task. The agent (powered by OpenAI's codex-1 model, a variant of o3) works inside this sandbox until it produces a result.

There is no parent-child relationship between Codex tasks. If you submit five tasks simultaneously, they run in five separate containers with no shared state. Each container has network access restricted to specific allowlisted domains (for package installation), which provides security but prevents agents from communicating with each other or external orchestration systems.

This isolation model has a clear advantage: **reproducibility**. Every Codex task starts from a clean state, runs in a controlled environment, and produces a deterministic output. There is no risk of one agent's work interfering with another's. But the tradeoff is equally clear: you cannot build workflows where agent B depends on agent A's output, or where a coordinator agent dynamically decides what to do based on intermediate results.

For a look at how Claude Code's [extension stack](/blog/claude-code-extension-stack-skills-hooks-agents-mcp) — skills, hooks, agents, and MCP — creates these orchestration capabilities, see our detailed breakdown.

## Custom Agents and Workflow Orchestration: Detailed Analysis

The biggest practical gap between Claude Code and Codex is what happens when you need agents to work together on a coordinated plan. This is where Claude Code's Workflow engine and custom agent definitions pull decisively ahead.

**Claude Code Workflows** are JavaScript scripts that orchestrate multiple subagents with deterministic control flow. You write a script that defines phases, spawns agents, collects results, and makes decisions based on those results. The core primitives are:

- `agent(prompt, opts)` — spawn a subagent and await its result
- `parallel([...thunks])` — run multiple agents concurrently, wait for all to complete
- `pipeline(items, stage1, stage2, ...)` — process items through sequential stages without barriers
- `phase(title)` — group agents under labeled phases for progress tracking

A real workflow might look like this: scan a codebase for security issues using three different analysis angles (parallel), deduplicate findings (code logic), then verify each finding by spawning adversarial agents that try to refute it (pipeline). The entire sequence runs as a single orchestrated operation, with structured JSON schemas enforcing output formats at every stage.

**Custom agent types** extend this further. By defining agent types in `.claude/agents/`, you create reusable agent roles with specific system prompts and tool access. A `code-reviewer` agent sees different instructions than an `Explore` agent. When spawned in a Workflow, these custom types bring domain-specific behavior to each stage — the reviewer knows your coding standards, the explorer knows how to search efficiently, and a `pipeline-reviewer` knows your project's known issues.

**Codex has no equivalent to any of this.** You cannot define custom agent types, write orchestration scripts, or build workflows where one task's output feeds into another. The closest approximation is submitting multiple independent tasks and manually reviewing the results — but there is no programmatic way to coordinate them.

This matters most for complex engineering tasks: large-scale refactoring across dozens of files, comprehensive security audits with verification passes, or automated content pipelines where quality gates depend on intermediate results. These workflows require coordination that Codex's isolated-container model cannot provide.

Our [deep dive into Claude Code agent teams](/blog/claude-code-agent-teams) covers real-world patterns for multi-agent orchestration in production codebases.

## When to Choose Claude Code

Choose Claude Code's subagent system when your work requires **coordination between agents** or **project-specific agent behavior**:

- **Multi-file refactoring with verification**: Spawn agents to refactor in parallel (with worktree isolation), then run a verification agent that checks the combined result against your test suite and lint rules
- **Code review across dimensions**: Fan out review agents for correctness, performance, and security — each with a specialized prompt — then synthesize findings into a single report
- **Custom team workflows**: Define agent types that encode your team's engineering standards — a reviewer that checks your style guide, a test generator that follows your coverage conventions, a documentation agent that updates your docs spec
- **Pipeline orchestration**: Build multi-stage content or data pipelines where each stage's output feeds the next, with structured schemas ensuring data integrity between stages
- **Iterative exploration**: Spawn search agents to explore a codebase from multiple angles, collect results, and decide dynamically what to investigate next

Claude Code is ideal for senior engineers and teams who want to program their AI's behavior, not just prompt it. The investment in setting up CLAUDE.md files, custom agents, and workflow scripts pays off when you run these workflows repeatedly. Read about how engineers at Ramp, Shopify, and Spotify are using these capabilities in our [enterprise engineering analysis](/blog/claude-code-enterprise-engineering-ramp-shopify-spotify).

## When to Choose OpenAI Codex

Choose Codex when your work consists of **independent, well-defined tasks** that benefit from cloud execution:

- **Batch bug fixes**: Submit a list of independent bug reports as separate Codex tasks. Each runs in a clean container and produces a reviewable PR — no coordination needed
- **Test generation at scale**: Point Codex at individual modules and let it generate test files. Each task is self-contained, making the isolated-container model a natural fit
- **Low-setup environments**: Codex requires zero local installation. If you need to hand off coding tasks from a non-developer context (product managers filing bug fixes, for example), Codex's ChatGPT integration removes all friction
- **Reproducible, auditable runs**: Every Codex task starts from a clean repository state. This makes outputs more predictable and easier to review compared to agents that accumulate state across a session
- **Cost-predictable workflows**: With ChatGPT Pro or Team subscriptions, Codex usage is included. For teams already paying for ChatGPT, there is no marginal cost per task — unlike Claude Code's per-token billing

Codex is the right choice when you value simplicity, isolation, and zero-configuration execution over orchestration depth. For teams already in the OpenAI ecosystem, it is the path of least resistance for AI-assisted coding. See our [Codex VS Code extension guide](/blog/codex-vscode) for how to integrate it into existing IDE workflows, or our analysis of [Codex for open source maintainers](/blog/codex-for-open-source) who need to process community contributions efficiently.

## Verdict

**For subagent orchestration and custom agent workflows, Claude Code is definitively ahead.** Its Agent tool, custom agent types, and Workflow scripting engine provide a level of multi-agent coordination that Codex simply does not offer. If your engineering work involves complex, multi-step tasks where agents need to communicate, follow project-specific roles, or run in orchestrated pipelines, Claude Code is the only option between these two that supports it natively.

**Codex wins on simplicity and accessibility.** Its cloud-hosted, zero-setup model is genuinely easier to start with, and the isolated-container approach produces clean, reproducible results for independent tasks. If your needs are "give the AI a well-scoped task and review the PR," Codex handles that efficiently without requiring you to learn orchestration concepts.

The practical recommendation: **start with Claude Code if you are building repeatable, multi-agent workflows** — the upfront investment in agent definitions and workflow scripts compounds over time. **Start with Codex if you want immediate, low-friction AI task execution** and your tasks are naturally independent. Many teams will find value in both: Codex for quick, isolated fixes; Claude Code for the complex orchestration work that requires agents to think together. For the full picture of how [agentic coding](/glossary/agentic-coding) tools are evolving, follow our ongoing [Claude Code coverage](/blog/claude-code-complete-guide).

## Frequently Asked Questions

### Can OpenAI Codex spawn subagents like Claude Code?
No. Codex runs each task in an isolated cloud container with no mechanism for one task to spawn, delegate to, or communicate with another task. If you need multi-agent orchestration, Claude Code's Agent tool and Workflow scripts are the current solution.

### How do custom agents work in Claude Code?
Custom agents are defined as markdown files in `.claude/agents/` directories. Each file specifies a system prompt and optionally restricts which tools the agent can access. When you spawn an agent with `agentType: "your-agent"`, it loads that definition automatically — giving you reusable, project-specific agent roles.

### Is Claude Code's subagent system free?
Claude Code subagents consume API tokens like any other Claude API call. Each subagent runs its own context window, so a workflow that spawns ten agents uses roughly ten times the tokens of a single-agent session. There is no separate subagent pricing — it is standard per-token billing.

### Can I use Codex and Claude Code together?
Yes. A practical pattern is using Claude Code for orchestrated workflows during active development (refactoring, reviews, test generation with verification) and Codex for independent task batches (bug fixes, documentation updates, simple feature additions). The tools operate in different environments and do not conflict.

### What is the concurrency limit for Claude Code subagents?
Claude Code caps concurrent subagents at the minimum of 16 or your CPU core count minus 2. Excess agents queue and run as slots free. A single workflow can spawn up to 1,000 agents total across its lifetime — more than enough for any practical orchestration pattern.

---

*Want more AI insights? [Subscribe to LoreAI](/subscribe) for daily briefings.*