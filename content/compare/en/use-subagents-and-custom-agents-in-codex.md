---
title: "Codex vs Claude Code: How to Use Subagents and Custom Agents for Multi-Agent Coding"
slug: use-subagents-and-custom-agents-in-codex
description: "Compare how to use subagents and custom agents in Codex vs Claude Code — architecture, orchestration, and practical workflows."
item_a: OpenAI Codex
item_b: Claude Code
category: tools
related_glossary: [agent-sdk, agentic-coding]
related_blog: [claude-code-subagents-examples, claude-code-agent-teams, codex-complete-guide, claude-code-complete-guide]
related_compare: []
related_topics: [codex]
lang: en
---

# Codex vs Claude Code: How to Use Subagents and Custom Agents for Multi-Agent Coding

**TL;DR:** If you want to **use subagents and custom agents in Codex**, you are working within a cloud-based task model where each job runs in its own sandbox — there is no native sub-agent orchestration layer. **Claude Code wins on multi-agent orchestration** with its Agent tool, Workflow scripts, and custom agent types defined in `.claude/agents/`. **Codex wins on zero-config sandboxing** — every task gets an isolated environment automatically. Choose Claude Code for complex, multi-step pipelines that need coordination between agents. Choose Codex for parallelizing independent tasks with built-in cloud isolation.

## Overview: OpenAI Codex

**OpenAI Codex** is a cloud-based [agentic coding](/glossary/agentic-coding) tool that runs tasks in sandboxed environments on OpenAI's infrastructure. Each task you submit gets its own isolated container with a full development environment — dependencies installed, files cloned, commands executed — all without touching your local machine.

Codex integrates directly with GitHub, pulling code from your repositories and submitting pull requests when work is complete. The interaction model is asynchronous: you describe a task, Codex spins up a sandbox, executes the work, and returns the result. This makes it well-suited for fire-and-forget operations like bug fixes, test generation, or small feature implementations where you do not need real-time oversight.

The key architectural difference from local coding agents is that Codex tasks are fundamentally independent units. Each task runs in its own container with no shared state between them. This isolation is a strength for safety and reproducibility, but it means that coordinating work across multiple tasks — the core use case for subagents — requires external orchestration. For a deeper look at Codex's architecture and capabilities, see our [complete guide to OpenAI Codex](/blog/codex-complete-guide).

## Overview: Claude Code

**Claude Code** is Anthropic's terminal-based AI coding agent that runs locally on your machine with full shell access. Unlike cloud-sandboxed tools, Claude Code operates directly in your development environment — it reads your project structure, executes commands, edits files, and commits changes in real time.

What sets Claude Code apart for multi-agent workflows is its built-in orchestration layer. The Agent tool spawns sub-agents that can work in parallel on different parts of a codebase. The Workflow tool provides deterministic scripting for complex pipelines with `parallel()`, `pipeline()`, and `phase()` primitives. Custom agent types — defined in `.claude/agents/` directories — let teams create specialized agents for code review, exploration, planning, or domain-specific tasks.

This architecture means Claude Code treats multi-agent orchestration as a first-class feature, not an afterthought. Sub-agents inherit tool access, can use worktree isolation for parallel file mutations, and return structured data to the orchestrating agent. For practical examples, read our guide to [Claude Code sub-agent patterns](/blog/claude-code-subagents-examples). For a full overview of the platform, see the [complete guide to Claude Code](/blog/claude-code-complete-guide).

## Feature Comparison

| Feature | OpenAI Codex | Claude Code | Winner |
|---------|-------------|-------------|--------|
| **Sub-agent orchestration** | No native support — tasks are independent | Built-in Agent tool + Workflow scripts | Claude Code |
| **Custom agent types** | Not supported | `.claude/agents/` with custom tool sets | Claude Code |
| **Task isolation** | Automatic cloud sandboxing per task | Optional worktree isolation per sub-agent | Codex |
| **Parallel execution** | Submit multiple tasks independently | `parallel()` and `pipeline()` with barriers | Claude Code |
| **Structured output** | Task returns diffs and PRs | Sub-agents return typed JSON via schema | Claude Code |
| **Execution environment** | Cloud containers (OpenAI infrastructure) | Local terminal (your machine) | Tie |
| **GitHub integration** | Native PR creation from tasks | Full git integration via shell | Tie |
| **Setup overhead** | Zero — cloud-managed | Requires local environment + config | Codex |
| **Real-time control** | Asynchronous — check results later | Synchronous — observe and intervene | Claude Code |
| **Pricing** | Usage-based (ChatGPT Pro/Team plans) | Usage-based (API token billing) | Tie |

## Multi-Agent Architecture: Detailed Analysis

The most significant difference between these tools is how they approach multi-agent work. This matters because modern codebases increasingly demand tasks that span multiple files, require different expertise at each step, and benefit from parallel execution.

### Codex's Task-Per-Sandbox Model

Codex does not have a native concept of subagents. Each task you submit runs in its own isolated sandbox with no awareness of other running tasks. If you want to parallelize work — say, fix three bugs simultaneously — you submit three separate tasks. Each gets its own container, its own copy of the repository, and its own execution context.

This architecture has clear advantages for safety. There is no risk of one task corrupting another's work. Each sandbox starts from a clean state, making results reproducible. The cloud infrastructure handles resource allocation, so you never worry about local CPU or memory constraints.

The limitation is coordination. If task B depends on task A's output — for example, if you want one agent to identify bugs and another to fix them — you must orchestrate this yourself. You wait for task A to complete, parse its output, and then submit task B with the relevant context. There is no built-in mechanism for agents to communicate, share findings, or coordinate their work within a single session.

For teams that want multi-agent workflows in Codex, the practical approach is to build orchestration externally. You can use the Codex API (or the [VS Code extension](/blog/codex-vscode)) to programmatically submit tasks, wait for results, and chain subsequent tasks based on outputs. This works, but it puts the orchestration burden on you rather than the tool. Our analysis of [multi-agent workflow patterns](/blog/con-u-pour-des-workflows-multi-agents) explores how teams are building these external coordination layers.

### Claude Code's Orchestrated Agent Model

Claude Code treats sub-agent orchestration as a core capability. The Agent tool spawns child agents that run concurrently, each with access to the project's tools and context. A parent agent can delegate work to specialized sub-agents, wait for results, and make decisions based on their combined output — all within a single session.

The Workflow tool adds deterministic control flow. A workflow script can fan out work across dozens of sub-agents using `pipeline()` for streaming execution or `parallel()` for barrier-synchronized batches. Each sub-agent can be assigned a specific agent type (Explore for read-only search, Plan for architecture decisions, or custom types for domain-specific work), a JSON schema for structured output, and optional worktree isolation so parallel agents do not conflict when editing files.

Custom agent types, defined in `.claude/agents/` markdown files, let teams encode institutional knowledge into reusable agent configurations. A `pipeline-reviewer` agent might know your project's known-issues list and automatically cross-reference changes against past bugs. An `explore` agent might be restricted to read-only tools so it cannot accidentally modify files. These custom agents compose with the rest of the system — a workflow can mix built-in and custom agent types freely.

The trade-off is complexity. Setting up custom agents, writing workflow scripts, and managing agent communication requires more upfront investment than simply submitting independent tasks. For a team already using Claude Code, this investment pays off quickly. For teams evaluating from scratch, the learning curve is steeper. Our deep dive into [Claude Code's extension stack](/blog/claude-code-extension-stack-skills-hooks-agents-mcp) covers how skills, hooks, agents, and MCP servers fit together.

## Custom Agents and Specialization: Detailed Analysis

The ability to define custom agents — specialized AI workers with specific tools, constraints, and domain knowledge — is increasingly important as teams move beyond single-prompt coding toward multi-step engineering workflows.

### Custom Agents in Codex

Codex does not currently support user-defined custom agent types. Every task uses the same underlying agent configuration: a cloud sandbox with access to shell commands, file editing, and GitHub integration. You cannot restrict a Codex task to read-only operations, assign it a specialized system prompt, or give it access to custom tools.

The workaround is prompt engineering. When submitting a task, you can include detailed instructions that effectively specialize the agent's behavior — telling it to only analyze code without modifying it, or to focus on security review rather than feature implementation. This works for simple specialization but lacks enforcement. There is no mechanism to guarantee that a "review-only" task will not accidentally edit a file.

For teams using Codex through its API, you can build custom agent-like behavior in your orchestration layer. Submit tasks with different system prompts and constraints, parse their outputs differently, and route work based on task type. This provides functional specialization at the cost of building and maintaining the orchestration code yourself. The [Codex for open source](/blog/codex-for-open-source) program shows how maintainers are adapting these patterns for community projects.

### Custom Agents in Claude Code

Claude Code's custom agent system operates at a different level of abstraction. Agent types are defined as markdown files in `.claude/agents/`, each specifying a system prompt, available tools, and behavioral constraints. When a workflow or parent agent spawns a sub-agent with `agentType: 'pipeline-reviewer'`, that sub-agent loads the corresponding agent definition and operates within its constraints.

This enables several patterns that are difficult to replicate with prompt-only specialization. A `pipeline-reviewer` agent can be restricted to `Read`, `Grep`, `Glob`, and `Bash` tools — it physically cannot edit files, eliminating an entire class of accidental modifications. An `Explore` agent gets fast read-only search capabilities optimized for code navigation. A `Plan` agent has access to everything except file-editing tools, ensuring it produces architectural plans rather than jumping to implementation.

Custom agents also compose with structured output schemas. A workflow can spawn a review agent that must return findings as a typed JSON object matching a predefined schema — the runtime validates the output and forces retries on schema mismatches. This turns flaky, free-text agent outputs into reliable, machine-parseable data that downstream pipeline stages can consume.

The practical workflow looks like this: define your custom agents once in `.claude/agents/`, reference them in workflow scripts or ad-hoc agent calls, and iterate on their system prompts as your team's needs evolve. Our guide to [Claude Code agent teams](/blog/claude-code-agent-teams) walks through real-world configurations with parallel sub-agent execution.

## Practical Workflow Patterns

Understanding the architectural differences is useful, but what matters is how they translate into real workflows. Here are the most common multi-agent patterns and how each tool handles them.

### Pattern 1: Parallel Bug Fixing

**Codex approach:** Submit three independent tasks, each targeting a specific bug. Each task gets its own sandbox, fixes the bug, and creates a PR. You review three separate PRs. Tasks cannot coordinate — if two bugs are related, each fix is developed in isolation.

**Claude Code approach:** A parent agent identifies the three bugs, spawns three sub-agents with worktree isolation, and each sub-agent fixes its assigned bug in a separate git worktree. The parent agent can then review all three fixes for consistency, check for conflicts, and create a single coordinated PR or three clean individual PRs.

**Verdict:** Codex is simpler for truly independent bugs. Claude Code is better when bugs might interact or when you want coordinated review.

### Pattern 2: Code Review Across Dimensions

**Codex approach:** Submit separate review tasks — one for security, one for performance, one for correctness. Each reviews the same diff independently. You manually synthesize their findings, deduplicating overlapping issues.

**Claude Code approach:** A workflow fans out review agents — each with a different prompt lens (security, performance, correctness) — collects all findings at a barrier, deduplicates, then spawns verification agents to adversarially check each finding. The output is a single, deduplicated list of confirmed issues with verdicts.

**Verdict:** Claude Code's orchestration eliminates manual synthesis. Codex works for teams that prefer human-in-the-loop review aggregation.

### Pattern 3: Codebase-Wide Refactoring

**Codex approach:** Identify all files that need changes, submit individual tasks for each file or module. Each task operates in isolation, so you must ensure consistency across tasks manually. If the refactoring requires coordinated changes across files (renaming an interface that is imported in 30 places), this becomes difficult.

**Claude Code approach:** A workflow discovers all affected files via an Explore agent, then uses `pipeline()` to process each file through a transform agent with worktree isolation. A final verification agent checks that all transformations are consistent and the build still passes. The entire pipeline runs as a single coordinated operation.

**Verdict:** Claude Code handles coordinated refactoring significantly better. Codex's isolation model works against you when changes must be consistent across files.

### Pattern 4: Research and Implementation

**Codex approach:** Submit a research task to analyze requirements, wait for it to complete, then submit an implementation task with the research as context. Two round-trips, two sandboxes, manual context passing between them.

**Claude Code approach:** A parent agent spawns a Plan sub-agent for research, receives structured findings, then spawns implementation sub-agents based on the plan. Context flows naturally between stages without manual intervention. The parent can adjust the implementation plan based on intermediate results.

**Verdict:** Claude Code's synchronous model handles multi-stage workflows with data dependencies more naturally.

## When to Choose OpenAI Codex

**Codex is the right choice when:**

- **Tasks are truly independent.** If you are parallelizing work that does not need coordination — fixing unrelated bugs, generating tests for separate modules, reviewing independent PRs — Codex's sandbox-per-task model is simpler and requires no orchestration setup.

- **You want zero local setup.** Codex runs entirely in the cloud. There is no local environment to configure, no agent definitions to write, and no workflow scripts to maintain. Submit a task and get a result. This matters for teams that want to try AI coding without committing to infrastructure.

- **Safety isolation is critical.** Every Codex task runs in a sandboxed container with no access to your local machine. For security-sensitive codebases where you do not want an AI agent running shell commands locally, Codex's isolation model provides stronger default boundaries.

- **You are already in the ChatGPT ecosystem.** If your team uses ChatGPT for other workflows and your developers are comfortable in that interface, Codex integrates naturally. The [VS Code extension](/blog/codex-vscode) adds IDE integration without switching tools.

- **Asynchronous workflows fit your process.** If your team prefers to submit tasks, context-switch to other work, and review results later, Codex's async model matches that workflow. There is no need to watch an agent work in real time.

## When to Choose Claude Code

**Claude Code is the right choice when:**

- **You need coordinated multi-agent workflows.** If your task requires agents that communicate, share findings, or depend on each other's output, Claude Code's Agent tool and Workflow scripts provide the orchestration primitives you need. This is the fundamental capability gap — Codex has no equivalent.

- **Custom agent specialization matters.** If you want to define agents with specific tool restrictions, specialized prompts, and structured output schemas — and reuse them across your team — Claude Code's `.claude/agents/` system is purpose-built for this. Teams that have invested in [Claude Code skills](/blog/5-claude-code-skills-i-use-every-single-day) and agent configurations get compounding returns as their library grows.

- **Complex pipelines require deterministic control flow.** Workflow scripts give you loops, conditionals, fan-out, barriers, and pipeline stages — all with deterministic execution. If you need "run N agents in parallel, deduplicate their findings, then verify each finding with 3 independent skeptics," you can express that directly. Read our [examples of sub-agent patterns](/blog/claude-code-subagents-examples) for production implementations.

- **Real-time oversight is important.** Claude Code runs synchronously in your terminal. You see what each agent is doing, can intervene mid-execution, and approve or deny actions as they happen. For sensitive operations — production deployments, large refactors, security-critical changes — this visibility matters.

- **Your workflow spans more than code.** Claude Code's [MCP server](/glossary/agent-sdk) integrations connect sub-agents to external tools — databases, monitoring systems, APIs, documentation platforms. A workflow agent can query your database, check monitoring metrics, and update documentation as part of the same pipeline.

## Migration Path: Codex Users Who Want Sub-Agents

If you are currently using Codex and want multi-agent capabilities, there are two paths forward:

**Path 1: External orchestration on top of Codex.** Build a script or CI pipeline that submits Codex tasks programmatically, waits for results, and chains subsequent tasks. This preserves Codex's cloud isolation while adding coordination. The trade-off: you are building and maintaining orchestration code that Claude Code provides out of the box.

**Path 2: Adopt Claude Code for orchestrated workflows, keep Codex for independent tasks.** Many teams use both tools. Codex handles quick, independent tasks (fix this bug, add this test). Claude Code handles complex, multi-step pipelines (refactor this module across 15 files, review this PR across 4 dimensions, migrate this API). The tools are not mutually exclusive.

For teams exploring this hybrid approach, our analysis of [agent harnesses](/blog/agent-harnesses-2026) explains why the orchestration layer matters more than the underlying model for production coding workflows.

## Verdict

The question "how to use subagents and custom agents in Codex" has a direct answer: **Codex does not natively support subagents or custom agent types.** Each task runs as an independent unit in its own sandbox, and coordination between tasks requires external orchestration.

**Claude Code is the clear choice for multi-agent coding workflows.** Its Agent tool, Workflow scripts, and custom agent types provide a complete orchestration system that Codex lacks. If your work involves coordinated multi-step pipelines, specialized agent roles, or structured data flowing between agents, Claude Code delivers these capabilities as built-in features.

**Codex remains strong for independent, parallelized tasks** where cloud isolation and zero-config setup outweigh orchestration needs. Not every workflow needs subagents — and for those that do not, Codex's simplicity is an advantage.

For most teams investing in [agentic coding](/glossary/agentic-coding) as a core practice, the recommendation is to start with Claude Code's agent system for orchestrated work and use Codex for quick, isolated tasks. As both platforms evolve, expect Codex to add coordination features and Claude Code to add optional cloud execution — but as of mid-2026, the orchestration gap is significant.

## Frequently Asked Questions

### Can you create custom agents in OpenAI Codex?
Codex does not support user-defined custom agent types. Every task uses the same agent configuration with full sandbox access. You can specialize behavior through task prompts, but there is no mechanism to restrict tool access or enforce output schemas the way Claude Code's `.claude/agents/` system does.

### How do Claude Code sub-agents communicate with each other?
Sub-agents do not communicate directly. A parent agent or workflow script orchestrates the flow — spawning sub-agents, collecting their results, and passing relevant context to subsequent agents. The Workflow tool's `pipeline()` and `parallel()` primitives handle data flow between stages, with structured JSON schemas ensuring type-safe output.

### Is it possible to run Claude Code sub-agents in the cloud like Codex?
Claude Code runs locally by default. Sub-agents with `isolation: 'worktree'` get their own git worktree for file isolation, but they still execute on your machine. For cloud-based execution, teams typically run Claude Code on remote servers or CI environments. Codex's cloud-native model provides automatic sandboxing without infrastructure management.

### Which tool is better for a solo developer?
For solo developers, Codex is faster to start with — no setup, no agent configuration, just submit tasks. Claude Code's multi-agent system pays off when your workflows become complex enough to need coordination, specialization, or structured pipelines. If you are fixing individual bugs and generating tests, Codex works well. If you are refactoring modules, running multi-dimensional reviews, or building automated pipelines, invest in Claude Code's agent system.

### Can you use both Codex and Claude Code on the same project?
Yes. Many teams use Codex for quick, independent tasks submitted through the ChatGPT interface or VS Code, and Claude Code for complex orchestrated workflows run from the terminal. The tools operate independently and do not conflict — they work on the same git repository through standard version control.

---

*Want more AI insights? [Subscribe to LoreAI](/subscribe) for daily briefings.*