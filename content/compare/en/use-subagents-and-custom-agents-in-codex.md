---
title: "Codex vs Claude Code for Subagents and Custom Agents: Which Multi-Agent Coding Platform Fits Your Workflow?"
slug: use-subagents-and-custom-agents-in-codex
description: "Compare subagents and custom agents in OpenAI Codex vs Claude Code. Architecture, customization, and practical workflows for multi-agent coding."
item_a: OpenAI Codex
item_b: Claude Code
category: tools
related_glossary: [agent-sdk, agentic-coding]
related_blog: [claude-code-subagents-examples, claude-code-agent-teams, codex-complete-guide, claude-code-complete-guide, claude-code-extension-stack-skills-hooks-agents-mcp]
related_compare: []
related_topics: [codex]
lang: en
---

<!--
Pre-Draft Planning:
1. Target keyword: use subagents and custom agents in codex
2. Page type: comparison
3. Keyword intent: commercial — users evaluating which multi-agent coding platform to adopt
4. Likely official-doc competitor: OpenAI's Codex documentation on agents and the Anthropic docs on Claude Code agent teams
5. Likely non-official competitor pattern: thin "Codex vs Claude Code" listicles comparing surface features; few deep-dives on multi-agent architecture differences
6. LoreAI standout angle: We compare the actual subagent and custom agent primitives side by side — execution models, customization depth, isolation strategies — and recommend which platform fits which team shape, rather than listing features without a verdict.
-->

# Codex vs Claude Code for Subagents and Custom Agents: Which Multi-Agent Coding Platform Fits Your Workflow?

**TL;DR:** Both OpenAI Codex and Claude Code support multi-agent patterns, but they take fundamentally different approaches. **Codex runs subagents as cloud-sandboxed tasks** — you fire off work asynchronously and review results later. **Claude Code spawns subagents locally in your terminal** with real-time interaction, git worktree isolation, and deep project context via CLAUDE.md files. Choose Codex for batch-style delegation across a team; choose Claude Code for interactive, context-rich multi-agent sessions on a single codebase.

## Overview: OpenAI Codex

**OpenAI Codex** is a cloud-based [agentic coding](/glossary/agentic-coding) platform that runs coding tasks in sandboxed environments. Each task gets its own isolated container with a snapshot of your repository, meaning agents operate on a frozen copy of your code rather than your live working directory. You assign a task — "refactor the auth module," "write tests for the payments service" — and Codex executes it asynchronously, returning a diff or pull request when finished.

Codex's multi-agent capability comes from its ability to run multiple tasks in parallel across separate sandboxes. Each task is effectively a subagent: an independent execution context with its own environment, dependencies, and file state. You can customize agent behavior through system prompts and repository-level instruction files (similar in concept to Claude Code's CLAUDE.md, but configured through the Codex dashboard or API). For a full walkthrough, see our [OpenAI Codex complete guide](/blog/codex-complete-guide).

The pricing model is usage-based, bundled with ChatGPT Pro and Team plans, with additional credits available for API access. Codex also offers [free access for open-source maintainers](/blog/codex-for-open-source) and [student credits](/blog/codex-for-students).

## Overview: Claude Code

**Claude Code** is Anthropic's terminal-native AI coding agent that runs directly in your shell. Unlike cloud-sandboxed approaches, Claude Code operates on your live codebase with full access to your file system, build tools, test runners, and git history. Its multi-agent system — called [agent teams](/blog/claude-code-agent-teams) — lets you spawn specialized subagents that run in parallel, each with its own context window and optional git worktree isolation.

Claude Code's custom agent system goes deeper than task delegation. Through [SKILL.md files and the extension stack](/blog/claude-code-extension-stack-skills-hooks-agents-mcp), you define reusable agent personas with specific tools, instructions, and permission scopes. A "review agent" can have different capabilities than a "refactor agent," and both inherit project context from your CLAUDE.md configuration. Subagents can be typed — Explore agents for read-only search, Plan agents for architecture design, general-purpose agents for implementation — each with constrained tool access.

Claude Code uses API-based billing through Anthropic's usage tiers. For a deeper look at its capabilities, see our [Claude Code complete guide](/blog/claude-code-complete-guide).

## Feature Comparison

| Feature | OpenAI Codex | Claude Code | Winner |
|---------|-------------|-------------|--------|
| **Execution model** | Cloud-sandboxed containers | Local terminal + optional worktrees | Depends on workflow |
| **Subagent parallelism** | Multiple tasks across sandboxes | Agent teams with typed sub-agents | Claude Code |
| **Custom agent configuration** | System prompts + dashboard config | SKILL.md files + typed agent definitions | Claude Code |
| **Repository context** | Snapshot-based, per-task | Live codebase + CLAUDE.md inheritance | Claude Code |
| **Isolation** | Full container isolation per task | Git worktree isolation (optional) | Codex |
| **Async operation** | Native — fire and review later | Foreground or background agents | Codex |
| **IDE integration** | ChatGPT UI, VS Code extension, CLI | Terminal-native, VS Code/JetBrains extensions | Tie |
| **Multi-model support** | GPT-4.1 family, o3, o4-mini | Claude model family only | Codex |
| **Pricing** | Bundled with ChatGPT Pro ($200/mo) | Usage-based API billing | Depends on volume |
| **Team collaboration** | Built-in team task queue | Single-developer focus, shareable via git | Codex |

## Subagent Architecture: How Each Platform Handles Multi-Agent Workflows

The core architectural difference between Codex and Claude Code subagents determines everything else — how you configure them, how they share context, and what failure modes you encounter.

**Codex takes a task-queue approach.** Each subagent is a standalone task running in its own cloud sandbox. The sandbox gets a fresh clone of your repository, installs dependencies, and executes the assigned work in complete isolation. Subagents cannot communicate with each other during execution. When a task completes, it produces a diff that you merge back into your codebase. This model is inherently safe — a subagent cannot corrupt your working directory or interfere with another subagent's work — but it also means subagents cannot coordinate in real time.

**Claude Code takes an orchestrated-agent approach.** The main Claude Code session acts as an orchestrator that spawns typed sub-agents within the same terminal environment. These sub-agents share the same filesystem (unless run with worktree isolation) and can pass results back to the orchestrator for synthesis. The orchestrator decides what to delegate, reviews sub-agent results, and coordinates multi-step workflows. This model enables tighter coordination — one sub-agent's research informs another's implementation — but requires more careful isolation management.

In practice, this means Codex subagents are better for independent, parallelizable tasks ("write tests for these five modules"), while Claude Code subagents excel at dependent workflows ("research the API, then design the schema, then implement the adapter"). For real-world [subagent examples and patterns](/blog/claude-code-subagents-examples), our coverage breaks down specific orchestration strategies.

## Custom Agent Configuration: Depth and Flexibility

Both platforms let you customize agent behavior, but they differ significantly in how much control you get and where that configuration lives.

### Codex Custom Agents

Codex customization happens primarily through system prompts and repository-level configuration. You can set instructions at the organization level (applying to all tasks), the repository level (applying to tasks on a specific repo), or the task level (one-off instructions for a single agent run). The Codex dashboard provides a UI for managing these configurations, and the API accepts custom instructions programmatically.

The limitation is granularity. Every Codex task runs with the same fundamental capability set — it gets a sandbox, a repo snapshot, and shell access within that sandbox. You cannot restrict a subagent to read-only operations, limit its tool access, or give it a specialized persona with different capabilities than other agents. Customization is instruction-based, not capability-based.

### Claude Code Custom Agents

Claude Code offers a layered customization system. At the foundation, [CLAUDE.md files](/blog/claude-code-memory) provide project-level context that all agents inherit. On top of that, [SKILL.md files](/blog/5-claude-code-skills-i-use-every-single-day) define reusable instruction sets for specific tasks — editorial guidelines, code review standards, migration playbooks. When writing effective skills, the 9 principles for writing great skills guide covers the key patterns.

The deeper customization comes from typed subagents. When spawning a sub-agent via the Agent tool, you specify:

- **Agent type**: Explore (read-only search), Plan (architecture design), general-purpose (full implementation), or specialized types like codex-rescue
- **Permission mode**: From fully autonomous to requiring human approval for each action
- **Isolation**: Optional git worktree so the agent works on a separate copy of the repo
- **Model override**: Different sub-agents can use different Claude models (Opus for complex reasoning, Haiku for fast lookups)

This means you can build a custom multi-agent pipeline where a fast Haiku-powered Explore agent does research, passes findings to an Opus-powered Plan agent for architecture design, and then hands off to a general-purpose agent for implementation — all orchestrated within a single session. The [extension stack deep-dive](/blog/claude-code-extension-stack-skills-hooks-agents-mcp) covers how skills, hooks, agents, and MCP servers compose together.

**Winner: Claude Code.** The typed agent system with capability-level restrictions, model overrides, and isolation controls gives significantly more configuration depth than Codex's instruction-only customization.

## Execution Model: Cloud Sandboxes vs Local Terminal

This is the most consequential architectural difference and where teams should focus their evaluation.

### Codex: Cloud-First Execution

Codex runs every agent task in a cloud container. You submit work, Codex provisions a sandbox, clones your repo, and executes. Benefits include:

- **Zero local resource consumption**: Your machine is free while agents work
- **Full environment isolation**: No risk of corrupting your working directory or conflicting with your local tools
- **Asynchronous workflows**: Submit ten tasks before lunch, review results after — the platform manages queuing and execution
- **Team visibility**: Multiple team members can submit and review tasks through a shared dashboard

The tradeoff is latency and context freshness. Each task starts from a repo snapshot, so if you have uncommitted local changes, the agent does not see them. Environment setup (dependency installation, build tool configuration) runs every time, adding cold-start overhead. And because agents cannot interact with your running development server, database, or local services, certain debugging and integration tasks are off-limits.

### Claude Code: Terminal-Native Execution

Claude Code runs on your machine, in your terminal, with your tools. Benefits include:

- **Live codebase access**: Agents see uncommitted changes, running servers, and current git state
- **Instant feedback loops**: Run a sub-agent, see its output, redirect — no waiting for cloud provisioning
- **Full tool access**: Anything your terminal can do, the agent can do — database queries, API calls, Docker commands, custom scripts
- **Context continuity**: Sub-agents inherit the orchestrator's understanding of what you are trying to accomplish

The tradeoff is resource consumption and isolation risk. Agents use your machine's compute. Without worktree isolation, a sub-agent editing files can conflict with your own edits or another sub-agent's work. And long-running agent sessions tie up your terminal (though background execution is supported).

**Winner: Depends on workflow.** Codex wins for batch delegation and team-scale task distribution. Claude Code wins for interactive development sessions where context and speed matter more than isolation.

## Developer Experience: Setup to First Subagent

### Getting Started with Codex Subagents

Setting up Codex for multi-agent work requires:

1. A ChatGPT Pro, Team, or Enterprise subscription (or API access)
2. Connecting your GitHub repository through the Codex dashboard
3. Configuring environment setup scripts (dependency installation, build commands)
4. Writing system-level instructions for agent behavior

Once configured, creating a subagent is as simple as submitting a task through the UI, CLI, or API. The [Codex VS Code extension](/blog/codex-vscode) brings task submission into the editor. The learning curve is gentle — the task-queue model is intuitive, and the dashboard provides visibility into running and completed tasks.

### Getting Started with Claude Code Subagents

Setting up Claude Code for multi-agent work requires:

1. Installing Claude Code (npm or direct download)
2. Creating a CLAUDE.md file with project context
3. Optionally creating SKILL.md files for specialized agent behaviors
4. Understanding the Agent tool's parameters (type, isolation, permissions)

Spawning a subagent happens within a Claude Code session — you describe what you need, and Claude Code decides whether to delegate to a sub-agent or handle it directly. You can also explicitly request agent teams for parallel work. The learning curve is steeper because the typed agent system, permission modes, and isolation options require understanding to use effectively. Our [subagent examples guide](/blog/claude-code-subagents-examples) walks through common patterns.

**Winner: Codex for initial setup simplicity. Claude Code for power-user configurability once you invest in learning the system.**

## Use Case Analysis: When Subagents Make the Difference

### Codebase-Wide Refactoring

Both platforms handle refactoring, but differently. Codex lets you submit parallel refactoring tasks across modules — "update all API handlers to use the new error format" — and each task runs independently. Claude Code's orchestrator can research the current patterns first, design a consistent refactoring plan, and then delegate implementation to sub-agents that follow the same plan.

**Edge: Claude Code**, because the orchestrator ensures consistency across sub-agent outputs. Codex sub-agents may produce inconsistent approaches since they cannot coordinate.

### Test Generation at Scale

Generating tests for a large codebase is an embarrassingly parallel task — perfect for Codex's model. Submit one task per module, let them all run simultaneously, review the test suites when they complete. Claude Code can parallelize this too, but is bounded by local compute resources and context window limits.

**Edge: Codex**, because cloud sandboxes scale horizontally without local resource constraints.

### Complex Bug Investigation

Debugging a production issue often requires iterative research — reading logs, checking git blame, testing hypotheses, running specific scenarios. This is where Claude Code's interactive sub-agents shine. An Explore agent searches for relevant code paths, the orchestrator synthesizes findings, a general-purpose agent implements and tests a fix. The tight feedback loop between orchestrator and sub-agents enables rapid iteration.

**Edge: Claude Code**, because interactive debugging requires real-time coordination and access to live system state.

### Team Task Distribution

For engineering teams that want to distribute AI-assisted tasks across members, Codex provides built-in team features — shared task queues, assignment, and review workflows. Claude Code is fundamentally a single-developer tool; team coordination happens through git, not through the agent platform.

**Edge: Codex**, because team-scale task management is a first-class feature.

## When to Choose OpenAI Codex

Choose Codex for subagents and custom agents when your workflow matches these patterns:

- **Batch processing**: You have a backlog of independent coding tasks that do not need to coordinate — test generation, documentation updates, lint fixes across modules
- **Team-scale delegation**: Multiple developers submit and review AI-generated work through a shared queue
- **Environment isolation is critical**: You need absolute certainty that agent work cannot affect your local development environment or other agents' work
- **Async-first culture**: Your team is comfortable reviewing diffs hours after submission rather than interacting with agents in real time
- **Multi-model flexibility**: You want to choose between GPT-4.1, o3, o4-mini, or other models for different task types

Codex's cloud execution model means you pay for compute through your subscription rather than local resources, which can be more cost-effective for high-volume, parallelizable workloads.

## When to Choose Claude Code

Choose Claude Code for subagents and custom agents when your workflow matches these patterns:

- **Dependent workflows**: Your tasks have sequential dependencies — research feeds into design, design feeds into implementation — and agents need to pass context between steps
- **Deep customization**: You need typed agents with different capability scopes, model tiers, and isolation levels within the same session
- **Interactive development**: You want to guide agent work in real time, redirecting when an approach is not working rather than waiting for a completed result
- **Live system access**: Your debugging or development requires interaction with running servers, databases, or local services that cloud sandboxes cannot reach
- **Skill-driven consistency**: You have well-defined engineering standards encoded in SKILL.md files that agents should follow, with different skills for different task types

Claude Code's terminal-native model means you get instant feedback and full environment access, which matters most for complex, context-heavy engineering work. For teams using [hooks to automate workflows](/blog/claude-code-hooks-a-complete-guide-to-automating-your-ai-coding-workflow), the sub-agent system integrates with the broader automation layer.

## Verdict

The right choice depends on your development style, not on which platform is "better." **If you work in a team that batches AI coding tasks and reviews results asynchronously, Codex's cloud-sandboxed subagents are the simpler, more scalable choice.** The task-queue model maps naturally to team workflows, and full container isolation eliminates coordination risks.

**If you are a solo developer or a small team that values interactive, context-rich multi-agent sessions, Claude Code's typed agent system offers significantly more depth.** The ability to compose Explore, Plan, and implementation agents with different models, permissions, and isolation levels enables workflows that Codex's uniform task model cannot replicate. The [agent teams architecture](/blog/claude-code-agent-teams) is designed for exactly this kind of orchestrated, multi-step engineering work.

For many developers, the answer is both — Codex for batch delegation of independent tasks, Claude Code for interactive sessions on complex problems. The platforms serve different moments in the development cycle rather than competing head-to-head.

## Frequently Asked Questions

### Can Codex subagents communicate with each other during execution?

No. Each Codex task runs in an isolated sandbox with its own repository snapshot. Subagents cannot share state, pass messages, or coordinate during execution. Results are merged after completion. This guarantees isolation but prevents real-time multi-agent coordination patterns.

### How does Claude Code prevent subagent conflicts when editing the same files?

Claude Code offers git worktree isolation — each sub-agent can work on a separate copy of the repository on its own branch. Without worktree isolation, the orchestrator agent is responsible for sequencing sub-agent work to avoid file conflicts. The orchestrator reviews sub-agent output before applying changes.

### Which platform is more cost-effective for multi-agent workflows?

Codex bundles agent usage into ChatGPT Pro subscriptions ($200/month) with additional API credits available separately. Claude Code charges per-token through Anthropic's API. For high-volume, parallelized tasks, Codex's subscription model may be cheaper. For targeted, interactive sessions, Claude Code's pay-per-use model avoids paying for idle capacity.

### Can I use custom models with subagents on either platform?

Codex supports multiple OpenAI models including GPT-4.1, o3, and o4-mini — you can select the model per task. Claude Code sub-agents can use different Claude models (Opus for complex work, Haiku for fast lookups) via model overrides, but is limited to Anthropic's model family.

### Do I need to restructure my repository to use subagents on either platform?

Neither platform requires repository restructuring. Codex works with any GitHub-connected repo. Claude Code works with any local repository. Both benefit from configuration files (Codex setup scripts, Claude Code's CLAUDE.md) but function without them using sensible defaults.

---

*Want more AI insights? [Subscribe to LoreAI](/subscribe) for daily briefings.*