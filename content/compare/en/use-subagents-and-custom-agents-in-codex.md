---
title: "Claude Code Subagents vs Codex Custom Agents: Multi-Agent AI Coding Compared"
slug: use-subagents-and-custom-agents-in-codex
description: "Compare how to use subagents and custom agents in Codex vs Claude Code for multi-agent AI coding workflows."
item_a: Claude Code Subagents
item_b: Codex Custom Agents
category: tools
related_glossary: [agent-sdk, agentic-coding]
related_blog: [claude-code-agent-teams, claude-code-subagents-examples, codex-complete-guide, claude-code-extension-stack-skills-hooks-agents-mcp]
related_compare: []
related_topics: [codex]
lang: en
---

# Claude Code Subagents vs Codex Custom Agents: Multi-Agent AI Coding Compared

**TL;DR:** If you want to **use subagents and custom agents in Codex**, you get cloud-based task agents that run asynchronously in sandboxed environments — ideal for parallelizing independent coding tasks across a team. **Claude Code subagents** run locally in your terminal with fine-grained control over agent specialization, isolation modes, and real-time orchestration — better for complex, multi-step engineering workflows where agents need to coordinate. Claude Code wins on customization depth and local control; Codex wins on cloud scalability and zero-setup parallel execution.

## Overview: Claude Code Subagents

Claude Code's subagent system lets you spawn specialized AI agents directly from your terminal session. Each subagent runs as an independent Claude instance with its own context, tools, and permissions — but reports results back to the parent agent that spawned it. This is not a theoretical framework; it is a production feature built into Claude Code's [extension stack](/blog/claude-code-extension-stack-skills-hooks-agents-mcp).

The architecture is local-first. When you invoke the `Agent` tool in Claude Code, you specify a prompt, an optional agent type (like `Explore`, `Plan`, or `codex-rescue`), and an isolation mode. The subagent inherits access to your local filesystem, shell, and git state. You can run multiple subagents in parallel by dispatching them in a single message, and each one works on its slice of the problem independently. Results flow back to the parent, which synthesizes findings and continues.

What makes this system powerful is the specialization layer. Claude Code ships with built-in agent types — `Explore` for fast read-only codebase search, `Plan` for architecture design, `pipeline-reviewer` for domain-specific validation — and you can define custom agents in your project's `.claude/agents/` directory. These custom agents carry their own instructions, tool access, and behavioral constraints, making them reusable across sessions and team members.

## Overview: Codex Custom Agents

**OpenAI Codex** takes a fundamentally different approach to multi-agent coding. Rather than spawning local subagents from a terminal session, Codex operates as a [cloud-based coding agent](/blog/codex-complete-guide) that runs tasks asynchronously in isolated sandboxed environments. Each task gets its own container with a full development environment — dependencies installed, tests runnable, code changes committed to a branch.

Codex's agent model is task-centric rather than session-centric. You submit a coding task — "refactor the auth module," "fix this failing test," "add input validation to the API endpoints" — and Codex spins up an environment, clones your repository, and works on the task independently. Multiple tasks can run simultaneously, each in its own sandbox. When a task completes, Codex produces a pull request with the changes for you to review.

The customization layer in Codex centers on environment configuration and task instructions. You define the setup commands, test commands, and system-level instructions that shape how the agent approaches work. The `codex.md` (or equivalent) configuration file in your repository provides project context. While Codex does not expose the same agent-type taxonomy that Claude Code uses, its sandboxed execution model means each task effectively runs as its own isolated agent with consistent environment guarantees.

## Feature Comparison

| Feature | Claude Code Subagents | Codex Custom Agents | Winner |
|---------|----------------------|---------------------|--------|
| **Execution model** | Local terminal, real-time | Cloud sandbox, async | Tie — different tradeoffs |
| **Agent specialization** | Built-in types + custom `.claude/agents/` | Task-level instructions + env config | Claude Code |
| **Parallel execution** | Multiple subagents in one message | Multiple tasks in parallel containers | Tie |
| **Isolation** | Optional git worktree isolation | Full container isolation per task | Codex |
| **Context sharing** | Subagents share filesystem access | Tasks are fully isolated from each other | Claude Code |
| **Customization depth** | Agent types, tools, permissions, prompts | Environment setup, system instructions | Claude Code |
| **Setup required** | Terminal + API key | GitHub integration + ChatGPT Pro/Team | Codex (simpler) |
| **Output format** | Real-time results in terminal | Pull requests with diffs | Codex |
| **Cost model** | API token usage per agent | Included in ChatGPT Pro/Team plan | Codex |
| **IDE integration** | Terminal-native, [VS Code extension](/blog/codex-vscode) available | VS Code extension, ChatGPT web | Tie |

## Agent Customization: Detailed Analysis

The most significant architectural difference between these platforms is how deeply you can customize agent behavior. Claude Code treats agent customization as a first-class system with multiple layers. Codex treats customization as environment and instruction configuration around a single agent type.

### Claude Code's Multi-Layer Agent System

Claude Code's [seven programmable layers](/blog/claude-code-seven-programmable-layers) give you granular control over how subagents behave. At the agent definition level, you create markdown files in `.claude/agents/` that specify an agent's purpose, available tools, and behavioral constraints. A `pipeline-reviewer` agent, for example, might have access to `Read`, `Grep`, and `Glob` but not `Edit` or `Write` — making it a read-only auditor that cannot accidentally modify your codebase.

The built-in agent types add another dimension. The `Explore` agent is optimized for fast, read-only search — it can find files by pattern, grep for symbols, and answer "where is X defined" questions without the overhead of a full agent session. The `Plan` agent focuses on architecture design, producing step-by-step implementation plans without making changes. You select the right agent type for each subtask, and the system allocates capabilities accordingly.

Custom agents can also inherit project context from [CLAUDE.md](/blog/claude-code-memory) files and [skill files](/blog/5-claude-code-skills-i-use-every-single-day), which means your agents follow the same coding standards, architectural decisions, and workflow conventions as your main session. This is not just prompt injection — it is a structured context system that persists across sessions and team members.

The practical upshot: you can build a team of specialized agents where one searches the codebase for affected files, another plans the implementation, a third writes the code in an isolated worktree, and a fourth reviews the changes against known issues. Each agent has exactly the tools and context it needs, no more.

### Codex's Task-Oriented Customization

Codex customization works differently because its execution model is different. Each Codex task runs in a fresh container, so customization focuses on making that container match your development environment. You specify setup commands (install dependencies, configure databases, set environment variables), test commands (how to validate changes), and system-level instructions (coding style, constraints, priorities).

The `codex.md` or `AGENTS.md` file in your repository root serves a similar purpose to Claude Code's `CLAUDE.md` — it provides project-level context and conventions. Codex reads this file when starting a task and uses it to inform its approach. You can include architecture notes, style guidelines, and specific constraints ("never modify the auth module directly, always go through the middleware layer").

Where Codex's customization model shines is in its simplicity. You do not need to think about agent types, tool permissions, or isolation modes. Every task gets the same treatment: a clean environment, your repo, your instructions, and a mandate to produce a working PR. For teams that want to parallelize coding tasks without building an orchestration layer, this flat model is effective.

The tradeoff is flexibility. You cannot create a read-only search agent in Codex — every task has full write access. You cannot share intermediate results between concurrent tasks — each sandbox is isolated. And you cannot customize the agent's tool access or reasoning approach — it is one agent type with one execution model.

## Multi-Agent Orchestration: Detailed Analysis

How you coordinate multiple agents determines whether multi-agent coding is genuinely useful or just a novelty. Both platforms support parallel agent execution, but the orchestration models differ fundamentally.

### Claude Code: Real-Time Orchestration

Claude Code's [agent teams](/blog/claude-code-agent-teams) system enables real-time multi-agent orchestration within a single terminal session. The parent agent acts as an orchestrator — it analyzes the task, decides which subtasks can run in parallel, spawns subagents with specific instructions, and synthesizes their results.

A practical example from the [Claude Code subagents guide](/blog/claude-code-subagents-examples): refactoring a module that touches 15 files. The parent agent spawns an `Explore` agent to identify all affected files, waits for the result, then spawns three subagents in parallel — each handling a different subset of files in isolated git worktrees. The parent reviews the combined changes and runs the test suite.

This orchestration is explicit. You see what each subagent is doing, you can inspect intermediate results, and you can redirect the strategy mid-execution. If a subagent finds something unexpected — a circular dependency, an untested edge case — the parent can adjust the plan before other subagents proceed.

The worktree isolation feature is particularly valuable for multi-agent coding. Each subagent can work in its own git worktree — a separate working directory linked to the same repository. This means agents can edit the same files without conflicts, and the parent agent can merge or cherry-pick changes selectively. If a subagent's changes do not pass review, the worktree is automatically cleaned up.

Background execution adds another coordination option. You can dispatch a subagent in the background and continue working on other tasks. The system notifies you when the background agent completes, and you can incorporate its results without blocking your main workflow.

### Codex: Asynchronous Task Parallelism

Codex's orchestration model is asynchronous by design. You submit multiple tasks, each runs independently in its own cloud sandbox, and results arrive as completed pull requests. There is no parent agent coordinating between tasks — each task operates with full autonomy.

This model excels when tasks are genuinely independent. Need to add input validation to five different API endpoints? Submit five Codex tasks, each targeting a specific endpoint. They run simultaneously, produce five PRs, and you review them in parallel. No orchestration logic needed, no context window pressure, no local compute costs.

The limitation is coordination. If Task A's output should inform Task B's approach, you cannot express that dependency in Codex's current model. Each task starts from the same repository snapshot and produces changes independently. Conflicting changes between concurrent tasks must be resolved during PR review, not during execution.

For teams already using GitHub-centric workflows, Codex's PR-based output model integrates naturally. Each task's changes are visible in a standard PR with diffs, commit history, and CI results. Code review follows existing team processes. The agent's work products look identical to human contributions.

## When to Choose Claude Code Subagents

Claude Code's subagent system is the right choice when your coding tasks require coordination, specialization, or real-time decision-making across multiple agents.

**Complex refactoring with dependencies.** When changes in one part of the codebase affect another — renaming an interface used by 20 consumers, migrating a database schema that touches multiple services — you need agents that can share context and coordinate. Claude Code's parent-child agent model handles this naturally.

**Custom agent workflows.** If your team has specific review processes, validation steps, or domain constraints, Claude Code lets you encode these as custom agents. A security-review agent that checks for OWASP vulnerabilities. A docs-update agent that ensures documentation stays in sync with code changes. A [pipeline reviewer](/blog/claude-code-hooks-mastery) that cross-references against known issues. These agents become reusable team assets.

**Exploratory tasks.** When you do not know the full scope of a task upfront — "find everywhere we use deprecated API X and propose a migration plan" — Claude Code's ability to spawn search agents, analyze results, and adapt the plan mid-execution is essential. Codex requires you to define the task precisely before submission.

**Local-first development.** If your code cannot leave your machine — proprietary codebases, compliance requirements, air-gapped environments — Claude Code's local execution model is the only option. All agent computation happens on your hardware and through your API calls.

## When to Choose Codex Custom Agents

Codex's agent model wins when you need scalable, independent task execution without orchestration overhead.

**Parallel independent tasks.** When you have a backlog of self-contained coding tasks — fix these 10 bugs, add tests to these 8 modules, update these 12 API endpoints — Codex lets you submit them all and get PRs back without managing agent coordination. The cloud execution model means you are not limited by local compute.

**Team-scale coding assistance.** Codex's integration with ChatGPT Team and Enterprise plans means multiple team members can submit tasks simultaneously. Each task runs in its own sandbox with consistent environment configuration. The output (PRs) fits into existing code review workflows without requiring team members to learn agent orchestration.

**Standardized environments.** If your project has complex setup requirements — specific database versions, external service dependencies, custom build toolchains — Codex's container-based isolation guarantees a clean, reproducible environment for every task. Claude Code subagents inherit the parent's local environment, which may have diverged from the canonical setup.

**Low-context-window pressure.** Each Codex task gets a fresh context window. For large repositories where the full codebase context would exceed a single session's capacity, Codex's task-per-container model avoids the context management challenges that arise when orchestrating many subagents in a single Claude Code session.

**[Open source contributions](/blog/codex-for-open-source).** OpenAI offers Codex access for open source maintainers, making it practical to use Codex agents for triaging issues, writing tests, and handling routine maintenance across community projects.

## Architecture and Execution Model

Understanding the infrastructure differences helps explain why each tool makes the tradeoffs it does.

Claude Code runs as a local process in your terminal. Subagents are additional Claude API calls managed by the local client. Your filesystem, git state, shell environment, and network access are all available to every agent. The [agentic coding](/glossary/agentic-coding) model here is fundamentally about extending a single developer's capabilities — you are the orchestrator, and subagents are your specialized assistants.

Codex runs as a cloud service. Each task spins up a container in OpenAI's infrastructure, clones your repository from GitHub, installs dependencies, and executes the task. The agent has no access to your local machine — it works entirely within its sandbox. Results are pushed as git branches and surfaced as PRs. The model here is closer to a managed CI pipeline that writes code instead of just testing it.

This architectural split creates cascading differences. Local execution means Claude Code subagents can access local databases, read environment-specific configuration, interact with running services, and use any CLI tool installed on your machine. Cloud execution means Codex tasks are reproducible, parallelizable without local resource constraints, and isolated from each other and your development environment.

For teams evaluating both, the question is not which architecture is "better" but which matches your workflow. If your development process centers on a terminal and you need agents that understand your specific local setup, Claude Code's model fits. If your process centers on GitHub and you want agents that produce reviewable PRs from a clean environment, Codex's model fits.

## Pricing and Access

Claude Code subagents consume API tokens from your Anthropic account. Each subagent is a separate API call — spawning five parallel subagents means five concurrent sessions billed at standard Claude API rates. For heavy multi-agent usage, costs scale with the number and complexity of subagents. There is no separate subscription; you pay for what you use.

Codex is included in ChatGPT Pro ($200/month) and ChatGPT Team ($30/user/month) plans, with usage limits that vary by tier. The Pro plan includes substantial Codex usage, while the Team plan provides a per-user allocation. Enterprise plans offer custom limits. For teams already paying for ChatGPT, Codex adds multi-agent coding without incremental per-task costs up to the plan's limits — a meaningful pricing advantage for high-volume usage.

The cost calculation depends on your usage pattern. If you run a few complex multi-agent sessions per day, Claude Code's pay-per-use model may be cheaper. If you run dozens of parallel tasks daily across a team, Codex's flat-rate inclusion in existing ChatGPT plans is more predictable. Note that pricing structures for both platforms are subject to change — verify current rates on the official pricing pages.

## Verdict

**Choose Claude Code subagents** if you need deep customization, real-time orchestration, and specialized agent types for complex engineering workflows. The ability to define custom agents, control tool access per agent, and coordinate agents through a parent orchestrator makes it the more powerful system for sophisticated multi-agent coding. It demands more setup and orchestration knowledge, but rewards that investment with flexibility no other coding tool currently matches.

**Choose Codex custom agents** if you want scalable, zero-orchestration parallel task execution that produces standard PRs. Codex's cloud-based model removes local resource constraints, simplifies environment management, and fits naturally into GitHub-centric team workflows. It is the simpler system — which is a strength when your tasks are independent and well-defined.

For many teams, the answer is both. Use Claude Code's [agent teams](/blog/claude-code-agent-teams) for complex, coordinated refactoring sessions. Use Codex for parallelizing independent bug fixes and feature tasks across the team. The tools complement each other because they optimize for different points in the multi-agent coding spectrum — Claude Code for depth and control, Codex for breadth and simplicity.

## Frequently Asked Questions

### Can you use Claude Code subagents and Codex agents together?

Yes. Claude Code even includes a built-in `codex-rescue` agent type designed for delegating tasks to Codex from within a Claude Code session. In practice, many teams use Claude Code for complex orchestrated workflows and Codex for parallelizing independent tasks, combining both platforms in their development process.

### How many subagents can Claude Code run in parallel?

Claude Code does not impose a hard limit on parallel subagents, but practical limits come from API rate limits and context window management. Spawning multiple subagents in a single message runs them concurrently. For most workflows, three to five parallel subagents strikes the right balance between parallelism and result quality.

### Does Codex support custom agent types like Claude Code?

Codex does not currently offer a typed agent system comparable to Claude Code's `Explore`, `Plan`, or custom agent definitions. Codex customization focuses on environment configuration and task-level instructions rather than agent specialization. Each task runs the same agent type with the same capabilities.

### Which platform is better for open source projects?

Codex has an edge for open source work thanks to OpenAI's [Codex for Open Source](/blog/codex-for-open-source) program, which provides free access for maintainers. Claude Code's subagent system works with any codebase but requires an Anthropic API account with usage-based billing, making Codex more accessible for unfunded open source projects.

### Do subagents in Claude Code share memory across sessions?

Subagents within a single Claude Code session share filesystem access, meaning they can read the same project files and git state. However, each subagent starts with a fresh context — it does not inherit the parent's conversation history. Project-level context comes from CLAUDE.md and skill files, which all agents in the project can read.

---

*Want more AI insights? [Subscribe to LoreAI](/subscribe) for daily briefings.*