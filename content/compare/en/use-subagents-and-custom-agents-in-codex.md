---
title: "Codex Subagents vs Claude Code Agent Teams: Which Multi-Agent Coding System Wins?"
slug: use-subagents-and-custom-agents-in-codex
description: "Compare subagents and custom agents in Codex vs Claude Code. Architecture, configuration, and which multi-agent system fits your workflow."
item_a: OpenAI Codex
item_b: Claude Code
category: tools
related_glossary: [agent-sdk, agentic-coding]
related_blog: [codex-complete-guide, claude-code-agent-teams, claude-code-subagents-examples, claude-code-extension-stack-skills-hooks-agents-mcp]
related_compare: []
related_topics: [codex]
lang: en
---

<!--
Pre-draft planning:
1. Target keyword: use subagents and custom agents in codex
2. Page type: compare
3. Keyword intent: commercial — users evaluating multi-agent coding architectures, deciding between Codex and Claude Code for team/project workflows
4. Likely official-doc competitor: OpenAI Codex docs on AGENTS.md and custom agent configuration; Anthropic docs on Claude Code agent teams and subagent spawning
5. Likely non-official competitor pattern: Thin rewrites of docs, surface-level "Codex vs Claude Code" listicles without agent-specific depth
6. LoreAI standout angle: We explain the actual architectural differences in how each tool handles subagents — cloud-sandboxed task agents vs local terminal agent spawning — and give concrete decision rules based on project type, team size, and workflow needs
-->

# Codex Subagents vs Claude Code Agent Teams: Which Multi-Agent Coding System Wins?

**TL;DR:** **OpenAI Codex** uses cloud-sandboxed custom agents configured via `AGENTS.md` files — each task spins up an isolated environment, making it strong for async, fire-and-forget workflows. **Claude Code** runs subagents locally from your terminal with deterministic orchestration via workflows and typed agent roles — better for real-time, multi-step tasks where you need control over execution. **Choose Codex for parallel cloud tasks with simple agent personas. Choose Claude Code for complex orchestration with branching logic and live feedback.**

## Overview: OpenAI Codex

**OpenAI Codex** is OpenAI's cloud-based [agentic coding](/glossary/agentic-coding) platform that executes software engineering tasks in sandboxed environments. Each task runs in its own isolated container with a full development environment — the agent can read files, write code, run tests, and propose changes as a pull request. Codex's multi-agent approach centers on **custom agents** defined through `AGENTS.md` files, which let you create specialized personas (a "frontend agent," a "security reviewer," a "test writer") that inherit specific instructions and constraints.

The key architectural decision: Codex agents run in the cloud, not on your machine. You submit a task, the agent works asynchronously, and you review the output when it's done. This cloud-first model means you can fire off multiple tasks in parallel without tying up your local environment. Codex is available through ChatGPT Pro, Team, and Enterprise plans, with the [complete guide to Codex](/blog/codex-complete-guide) covering setup and pricing in detail.

Custom agents in Codex are defined per-repository. An `AGENTS.md` file at the root of your repo (or in subdirectories for scoped agents) tells Codex how to behave for different task types. You can define multiple agent profiles, each with its own system instructions, tool permissions, and behavioral guidelines. When you assign a task, you select which agent profile handles it.

## Overview: Claude Code

**Claude Code** is Anthropic's terminal-based AI coding agent that takes a fundamentally different approach to multi-agent work. Instead of cloud containers, Claude Code spawns **subagents** directly from your terminal session — lightweight agent instances that share your local environment, access your filesystem, and report results back to the parent agent. The [Agent tool](/blog/claude-code-agent-teams) provides typed agent roles (`Explore`, `code-reviewer`, `pipeline-reviewer`, `Plan`, and general-purpose), each with specific tool access and behavioral constraints.

Claude Code's orchestration layer goes deeper than simple agent profiles. The **Workflow** system lets you write JavaScript scripts that deterministically control agent execution — fan-out patterns, pipelines, parallel barriers, adversarial verification loops, and budget-aware scaling. This is not "tell the AI what to do and hope" — it is programmatic control over multi-agent coordination with typed schemas, structured output, and explicit phase management.

The system is local-first. Subagents run on your machine, access your git state, read your `CLAUDE.md` and `SKILL.md` files, and operate within your permission boundaries. For teams, Claude Code's [extension stack](/blog/claude-code-extension-stack-skills-hooks-agents-mcp) — skills, hooks, agents, and MCP servers — creates a programmable platform where agent behavior is version-controlled alongside your code.

## Feature Comparison

| Feature | OpenAI Codex | Claude Code | Winner |
|---------|-------------|-------------|--------|
| **Agent definition** | `AGENTS.md` files per repo | Typed agent roles + custom `.md` definitions | Claude Code |
| **Execution environment** | Cloud sandbox (isolated container) | Local terminal (shared filesystem) | Depends on use case |
| **Orchestration** | Task queue — one agent per task | Workflow scripts with `pipeline()`, `parallel()`, `phase()` | Claude Code |
| **Parallelism** | Multiple cloud tasks simultaneously | Up to 16 concurrent subagents per workflow | Tie |
| **Structured output** | JSON responses | Schema-validated structured output with retry | Claude Code |
| **Agent specialization** | Free-form instructions in AGENTS.md | Typed roles (Explore, code-reviewer, Plan) + custom | Claude Code |
| **Git integration** | Creates PRs from cloud environment | Direct local git access, commits, pushes | Codex |
| **Async capability** | Native — fire and forget | Requires background agents or `/loop` | Codex |
| **IDE integration** | [VS Code extension](/blog/codex-vscode), ChatGPT web | Terminal CLI, VS Code extension, JetBrains, web | Tie |
| **Cost model** | Included in ChatGPT Pro ($200/mo) or API billing | API usage-based billing | Depends on volume |
| **Isolation between agents** | Full container isolation | Shared filesystem with optional git worktree isolation | Codex |

## Agent Definition and Configuration: Detailed Analysis

The way each tool defines and configures agents reveals their core philosophy. Codex uses a declarative, file-based approach where agent behavior is described in natural language. Claude Code uses a hybrid of typed agent roles and programmable orchestration.

### Codex: AGENTS.md

Codex custom agents are defined in `AGENTS.md` files placed at the root of your repository or in subdirectories. Each agent profile gets a name, description, and set of instructions — essentially a system prompt that Codex follows when executing tasks under that profile. You might define a `frontend-agent` that focuses on React components and styling, a `backend-agent` that handles API routes and database queries, and a `reviewer-agent` that checks for security issues.

The format is straightforward markdown. You describe what the agent should focus on, what tools it can use, what patterns it should follow, and what it should avoid. When submitting a task through the Codex interface, you select which agent handles it. The agent inherits your repository context plus its specific instructions.

The strength of this approach is simplicity. Anyone can write an `AGENTS.md` file — it is just markdown with natural language instructions. There is no programming required, no schema definitions, no orchestration logic. The limitation: you cannot compose agents into multi-step workflows. Each Codex task is one agent working on one problem. If you need agent A's output to feed into agent B's input, you manage that coordination manually.

### Claude Code: Typed Roles and Custom Agents

Claude Code takes a layered approach. At the base level, the Agent tool provides built-in agent types with specific capabilities:

- **Explore**: Read-only search agent optimized for locating code — fast file-pattern matching, symbol grep, codebase navigation. Cannot edit files.
- **code-reviewer**: Reviews diffs against known-issues registries, checks for regressions, validates patterns.
- **pipeline-reviewer**: Auto-invoked after editing pipeline scripts, cross-references against documented known bugs.
- **Plan**: Software architect agent that designs implementation strategies without making changes.
- **general-purpose**: Full-capability agent for research, coding, and multi-step tasks.

Beyond built-in types, you can define custom agents in `.claude/agents/` with markdown files specifying behavior, tool access, and trigger conditions. These agents can be auto-invoked based on file patterns — edit a file matching `scripts/*.ts` and the `pipeline-reviewer` agent activates automatically.

The real differentiator is **Workflow orchestration**. Claude Code workflows are JavaScript scripts that programmatically control agent spawning:

```javascript
const results = await pipeline(
  files,
  f => agent(`Review ${f} for security issues`, {
    label: `review:${f}`,
    phase: 'Review',
    schema: FINDINGS_SCHEMA
  }),
  (review, file) => agent(`Verify findings in ${file}`, {
    label: `verify:${file}`,
    phase: 'Verify',
    schema: VERDICT_SCHEMA
  })
);
```

This gives you deterministic control over fan-out patterns, barrier synchronization, pipeline stages, adversarial verification, and budget-aware scaling. No natural-language coordination — the control flow is code.

## Orchestration and Multi-Agent Workflows: Detailed Analysis

The orchestration gap between these tools is the most significant architectural difference. It determines what kinds of multi-agent work each tool can handle.

### Codex: Task-Level Parallelism

Codex's multi-agent model is task-level parallelism. You submit multiple tasks, each assigned to an agent profile, and they execute concurrently in separate cloud containers. Task A might be "refactor the auth module" handled by the backend-agent, while Task B is "update the login UI" handled by the frontend-agent. Both run simultaneously, both produce PRs.

This works well for independent tasks. The isolation is real — each container has its own filesystem snapshot, so agents cannot step on each other's changes. The tradeoff: there is no built-in way to coordinate between tasks. If Task B depends on Task A's output, you wait for Task A to finish, merge its PR, and then submit Task B. The orchestration happens in your head, not in the system.

For teams using Codex at scale, this means maintaining a mental model of task dependencies and sequencing work manually. The [Codex for open source](/blog/codex-for-open-source) program demonstrates this pattern — maintainers submit independent issues as separate Codex tasks and review the resulting PRs individually.

### Claude Code: Programmatic Orchestration

Claude Code's Workflow system supports patterns that Codex cannot express:

**Pipeline processing**: Items flow through stages independently — no barrier between stages. Item A can be in stage 3 while item B is still in stage 1.

**Parallel barriers**: When you genuinely need all results before proceeding (deduplication, cross-item analysis), `parallel()` awaits all thunks.

**Adversarial verification**: Spawn multiple independent agents to challenge each finding — a pattern where N skeptics try to refute a claim, and only claims surviving majority vote proceed.

**Loop-until-dry**: Keep spawning finder agents until K consecutive rounds return nothing new — critical for unknown-size discovery tasks like bug hunting or security audits.

**Budget-aware scaling**: Workflows can check `budget.remaining()` and dynamically adjust how many agents to spawn, scaling depth to available resources.

These patterns matter because real engineering tasks are rarely independent. A codebase-wide refactoring needs coordination. A security audit needs findings from one pass to inform the next. A migration needs per-file transforms verified against the whole. Claude Code's subagent system handles this natively; Codex requires external orchestration.

## Isolation and Safety: Detailed Analysis

Both tools address the fundamental tension in agentic coding: agents need enough access to be useful, but unconstrained access creates risk.

### Codex: Container Isolation

Codex runs each task in a fresh cloud container with network disabled by default. The agent gets a snapshot of your repository at task submission time. It can read files, write code, install dependencies, and run tests — all within the container. When done, it produces a diff that you review before merging.

This sandboxing provides strong isolation guarantees. A rogue agent cannot access your local filesystem, your credentials, your other projects, or the network. The limitation: it also cannot access local development services, proprietary packages behind your VPN, or integration test environments that require network access. For projects with complex local setup requirements, the cloud sandbox may lack necessary context.

### Claude Code: Permission-Based Control

Claude Code runs locally with a layered permission system. The user configures which tools agents can access, which commands they can run, and which files they can modify. Hooks provide deterministic enforcement — a `PreToolUse` hook can block specific operations (like editing `.env` files) regardless of what the agent attempts.

For multi-agent workflows, Claude Code offers **git worktree isolation** — each subagent operates on an isolated copy of the repository, preventing parallel agents from conflicting with each other's file changes. This is lighter than Codex's full container isolation but sufficient for most parallel editing scenarios.

The tradeoff is clear: Codex provides stronger default isolation but less flexibility. Claude Code provides weaker default isolation but granular control. For enterprise environments with strict security requirements, Codex's container model may satisfy compliance requirements more easily. For teams that need agents to access local tools and services, Claude Code's permission model is more practical.

## When to Choose OpenAI Codex

**Codex is the better choice when your multi-agent needs are simple and async.**

Choose Codex for subagents and custom agents when:

- **Your tasks are independent**: You need multiple agents working on separate issues simultaneously, with no inter-task dependencies. Submit five bug fixes, review five PRs.
- **You want fire-and-forget execution**: Submit tasks before lunch, review results after. Cloud execution means your machine is free.
- **Your team is non-technical or mixed**: `AGENTS.md` files are plain markdown — no programming required to define agent behavior. Product managers and designers can write agent profiles.
- **Security isolation is paramount**: Each task runs in its own container with no network access. Suitable for compliance-heavy environments.
- **You use ChatGPT Pro already**: Codex is included in the $200/month Pro plan, making it cost-effective for moderate usage without API billing complexity.

Codex's sweet spot is teams that generate a high volume of independent, well-scoped tasks — bug fixes, feature implementations, documentation updates — where each task can be handled by a single agent with clear instructions. The [Codex student program](/blog/codex-for-students) shows this pattern working well for learning environments where tasks are naturally isolated.

## When to Choose Claude Code

**Claude Code is the better choice when you need real orchestration between agents.**

Choose Claude Code for subagents and custom agents when:

- **Your tasks have dependencies**: Agent B needs Agent A's output. A review must happen before a fix. Findings need cross-referencing. Claude Code's pipeline and parallel primitives handle this natively.
- **You need specialized agent types**: Built-in roles like `Explore` (read-only search), `Plan` (architecture design), and `code-reviewer` (diff analysis) provide purpose-built capabilities — not just different system prompts.
- **You want deterministic orchestration**: Workflow scripts give you programmatic control — loops, conditionals, fan-out, barrier synchronization, budget scaling. The control flow is code, not hope.
- **You work locally with complex setups**: Agents access your local filesystem, development services, VPN resources, and custom tooling through MCP servers.
- **Quality gates matter**: Adversarial verification patterns — multiple independent agents challenging each finding — catch false positives that single-agent systems miss. Read about practical [subagent examples](/blog/claude-code-subagents-examples) for implementation patterns.
- **You are building reusable agent systems**: The [extension stack](/blog/claude-code-extension-stack-skills-hooks-agents-mcp) — skills, hooks, agents, MCP — lets you build organization-specific agent platforms that version-control alongside code.

Claude Code's sweet spot is senior developers and teams tackling complex, multi-step engineering tasks — migrations, audits, large refactors, and cross-cutting changes where coordination between agents is not optional. Our coverage of [agent harnesses](/blog/agent-harnesses-2026) explores why this orchestration layer increasingly matters more than the underlying model.

## Cost Comparison

Pricing for multi-agent work differs structurally between the two platforms.

**Codex** is included in ChatGPT Pro ($200/month) with usage limits, or available through API billing. Each cloud task consumes compute in an isolated container. Multiple concurrent tasks multiply the cost linearly. For teams, ChatGPT Team ($25/user/month) and Enterprise plans include Codex access with varying limits.

**Claude Code** uses Anthropic's API billing — you pay per input and output token across all agents. A workflow spawning 10 subagents costs roughly 10x a single-agent call in tokens, though caching and structured output reduce redundant context loading. There is no fixed monthly fee for Claude Code itself — only API usage.

For light usage (a few tasks per day), Codex on a Pro plan is likely cheaper. For heavy multi-agent orchestration (workflows with dozens of agents), Claude Code's per-token billing can add up but provides more granular cost control. Budget-aware workflows can dynamically limit agent spawning to stay within a token target.

## Verdict

**If you need simple, async multi-agent task execution with strong isolation, choose Codex.** Its `AGENTS.md` configuration is accessible, cloud sandboxing is secure by default, and the fire-and-forget model works well for independent tasks. Teams already on ChatGPT Pro get it included.

**If you need real multi-agent orchestration — pipelines, verification loops, typed agent roles, deterministic control flow — choose Claude Code.** Its subagent system is architecturally more sophisticated, supporting patterns (adversarial verification, budget-aware scaling, pipeline processing) that Codex's task-queue model cannot express. The tradeoff is complexity: you need to write workflow scripts, not just markdown files.

For many teams, the answer is both. Use Codex for the backlog of independent bug fixes and feature requests. Use Claude Code for the complex migration, the security audit, the cross-cutting refactor where agents need to coordinate. The tools solve different problems, and recognizing which problem you are facing is the real decision.

## Frequently Asked Questions

### Can Codex agents communicate with each other during execution?

No. Each Codex task runs in an isolated cloud container with no inter-task communication. If Task B depends on Task A's output, you must wait for Task A to complete, merge its changes, and submit Task B separately. Claude Code's workflow system supports inter-agent data passing natively through pipeline stages and parallel barriers.

### How many subagents can Claude Code run simultaneously?

Claude Code caps concurrent agents at the minimum of 16 or your CPU core count minus 2 per workflow. You can pass hundreds of items to `pipeline()` or `parallel()` — they queue and execute as slots free up. Total agent count per workflow lifetime is capped at 1,000, far above typical usage.

### Do I need programming skills to set up custom agents in Codex?

No. Codex custom agents are defined in `AGENTS.md` files using plain markdown with natural language instructions. You describe what the agent should focus on, what patterns to follow, and what to avoid. No code, no schemas, no orchestration logic required — though this simplicity limits what you can express compared to Claude Code's programmatic workflows.

### Can I use both tools on the same project?

Yes. Codex and Claude Code operate independently — Codex through cloud containers, Claude Code through your local terminal. Some teams use Codex for async task queues (bug fixes, documentation) and Claude Code for interactive, multi-step work (refactoring, audits). Both read from the same repository; just ensure you pull the latest changes before switching between tools.

### What is the AGENTS.md file in Codex?

`AGENTS.md` is Codex's agent configuration file, placed at your repository root or in subdirectories. It defines named agent profiles with instructions, tool permissions, and behavioral guidelines. When you submit a task to Codex, you select which profile handles it. Think of it as a system prompt scoped to a specific type of work — similar in concept to Claude Code's `SKILL.md` files but without programmatic orchestration capabilities.

---

*Want more AI insights? [Subscribe to LoreAI](/subscribe) for daily briefings.*