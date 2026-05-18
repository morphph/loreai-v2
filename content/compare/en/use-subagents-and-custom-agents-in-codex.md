---
title: "Codex Custom Agents vs Claude Code Subagents: Multi-Agent AI Coding Compared"
slug: use-subagents-and-custom-agents-in-codex
description: "Compare how to use subagents and custom agents in Codex vs Claude Code for multi-agent coding workflows, setup, and real-world use cases."
item_a: OpenAI Codex
item_b: Claude Code
category: tools
related_glossary: [agent-sdk, agentic-coding]
related_blog: [codex-complete-guide, claude-code-agent-teams, claude-code-complete-guide, claude-code-extension-stack-skills-hooks-agents-mcp]
related_compare: []
related_topics: [codex]
lang: en
---

# Codex Custom Agents vs Claude Code Subagents: Multi-Agent AI Coding Compared

**TL;DR:** If you want to **use subagents and custom agents in Codex**, you configure sandboxed cloud environments with setup scripts and natural-language instructions — each Codex task runs as an isolated agent but without built-in sub-agent orchestration. **Claude Code** takes a different approach: it provides a native subagent system where you spawn specialized agents in parallel from a single session, each with its own tools and context. **Codex wins on isolation and async workflows; Claude Code wins on real-time multi-agent orchestration and customizability.**

## Overview: OpenAI Codex Custom Agents

[OpenAI Codex](/blog/codex-complete-guide) is a cloud-based coding agent that runs each task inside a sandboxed Linux container. When people search for how to **use subagents and custom agents in Codex**, they're typically looking at Codex's agent configuration system — the ability to define custom environments, setup scripts, and behavioral instructions that shape how the agent approaches tasks.

Codex custom agents are configured through two mechanisms: a `codex-setup.sh` script that prepares the container environment (installing dependencies, setting up databases, configuring tools), and a natural-language instruction set (similar to a system prompt) that tells the agent how to approach work. Each task you assign to Codex spins up as an independent agent in its own container, with no shared state between tasks unless you configure it explicitly.

This architecture means Codex custom agents are inherently isolated — great for security and reproducibility, but limited when you need agents to coordinate or share intermediate results during a single workflow.

## Overview: Claude Code Subagents

**[Claude Code](/blog/claude-code-complete-guide)** is Anthropic's terminal-based [agentic coding](/glossary/agentic-coding) tool that includes a first-class subagent system called **agent teams**. Unlike Codex's one-agent-per-task model, Claude Code lets you spawn multiple specialized sub-agents from within a single session, each with its own tool set, permissions, and context window.

The subagent system is built around the `Agent` tool, which accepts a prompt, an optional `subagent_type` (Explore, Plan, code-reviewer, and others), and configuration for isolation (like git worktrees). Sub-agents run either in the foreground — blocking until they return results — or in the background, notifying the parent when complete. This enables genuinely parallel multi-agent workflows: search one part of the codebase while editing another, or run a build validator alongside a test suite.

Claude Code also supports fully custom agent definitions through [SKILL.md](/blog/9-principles-writing-claude-code-skills) files and agent configuration, letting teams encode specialized behaviors (security reviewer, docs updater, migration assistant) that travel with the repository.

## Feature Comparison

| Feature | Codex Custom Agents | Claude Code Subagents | Winner |
|---------|--------------------|-----------------------|--------|
| **Agent isolation** | Full container sandbox per task | Git worktree or shared workspace | Codex |
| **Multi-agent orchestration** | Not built-in — one agent per task | Native — spawn parallel sub-agents | Claude Code |
| **Custom agent types** | Setup scripts + instructions | Typed sub-agents + SKILL.md definitions | Claude Code |
| **Async execution** | Built-in — tasks queue and run in cloud | Background agents with notifications | Codex |
| **Real-time interaction** | Review results after completion | Interactive — foreground agents return mid-session | Claude Code |
| **Environment control** | Full Linux container (install anything) | Host terminal with permission controls | Codex |
| **Context sharing** | No shared state between tasks | Sub-agents inherit parent context via prompts | Claude Code |
| **Pricing model** | Included with ChatGPT Pro/Team/Enterprise | Usage-based API billing | Depends on volume |
| **Platform** | Cloud-only (browser + VS Code) | Local terminal (macOS, Linux) | Tie |

## Agent Configuration: Detailed Analysis

The most important difference between these systems is how you define and configure custom agents. This determines how much control you have over agent behavior and how maintainable your multi-agent workflows are over time.

### Codex: Environment-First Configuration

Codex custom agents are configured primarily through environment setup. The `codex-setup.sh` script runs before each task, preparing the container with the right dependencies, database state, and toolchain. You pair this with a set of natural-language instructions that guide the agent's behavior — coding standards, preferred libraries, testing requirements.

This approach is powerful for standardizing how Codex interacts with your codebase. Every team member who assigns a task gets the same agent behavior because the configuration lives in the repository. The container isolation also means experiments can't break your local environment.

The limitation is that these are single-purpose configurations. You can't define a "security reviewer" agent and a "test writer" agent and have them collaborate on the same PR. Each Codex task is an independent unit of work.

### Claude Code: Typed Sub-Agents with Behavioral Specialization

Claude Code's approach is more granular. The built-in `subagent_type` parameter lets you spawn purpose-built agents: `Explore` for fast read-only codebase search, `Plan` for architecture design, `codex:codex-rescue` for handing off to a different model for a second opinion. Each type has a predefined tool set — the Explore agent, for instance, has access to Glob, Grep, and Read but cannot Edit or Write, enforcing read-only behavior structurally rather than by instruction.

Beyond built-in types, teams create custom agent behaviors through [Claude Code's extension stack](/blog/claude-code-extension-stack-skills-hooks-agents-mcp) — SKILL.md files that encode domain-specific instructions. A security review skill, a migration assistant skill, and a documentation updater skill can all be invoked as specialized sub-agents within a single coding session. The parent agent decides which specialists to call, passes them focused context, and synthesizes their results.

This composability is what makes Claude Code's system more flexible for complex workflows. The tradeoff is complexity — you need to design your prompt carefully to brief each sub-agent, since they start with no conversation history.

## Multi-Agent Orchestration: Detailed Analysis

The second critical differentiator is whether and how multiple agents coordinate. This matters for workflows like "refactor this module, update the tests, and verify the build" — tasks that have both independent and dependent steps.

### Codex: Parallel Tasks, Independent Agents

Codex supports running multiple tasks simultaneously, but each task is an isolated agent. You can assign five tasks to Codex at once, and they'll all run in parallel in separate containers. This is excellent for batch operations — review five PRs, write tests for five modules, or fix five independent bugs.

What Codex doesn't support (as of mid-2026) is intra-task agent coordination. A single Codex task cannot spawn helper agents, delegate subtasks, or split work across specialized workers. The agent handles everything itself within its container. For workflows that need step-by-step coordination — "search the codebase first, then plan the changes, then implement" — the single agent must do all three sequentially.

This makes Codex better suited to well-scoped, independent tasks that can be reviewed asynchronously. The [Codex VS Code extension](/blog/codex-vscode) reinforces this pattern: you assign work, context-switch to something else, and review the results later.

### Claude Code: Nested Sub-Agent Orchestration

Claude Code's agent teams enable nested, coordinated multi-agent execution within a single session. The parent agent acts as an orchestrator:

1. **Parallel research**: Spawn two Explore agents simultaneously — one to find all API routes, another to locate test files
2. **Sequential planning**: Feed both results to a Plan agent that designs the implementation strategy
3. **Parallel execution**: Spawn multiple implementation agents in isolated worktrees, each handling a different part of the change
4. **Validation**: Run a build-validator agent and test-runner agent in parallel to verify the combined changes

The key architectural choice is that sub-agents return their results to the parent, which synthesizes and directs the next step. This enables adaptive workflows — if the Explore agent finds unexpected code structure, the parent can adjust the plan before spawning implementation agents.

The `isolation: "worktree"` parameter creates a temporary git worktree for agents that write code, so parallel agents don't conflict on file edits. Worktrees with no changes are automatically cleaned up.

The tradeoff is latency and token cost. Each sub-agent consumes its own context window and API tokens. For simple tasks, orchestrating multiple agents adds overhead that a single agent could handle directly.

## Custom Agent Creation: Setup and Workflow

### Setting Up Codex Custom Agents

To create a custom agent configuration in Codex:

1. **Write `codex-setup.sh`** in your repository root — install dependencies, configure environment variables, seed test databases
2. **Define agent instructions** in the Codex configuration — coding style, testing requirements, framework preferences
3. **Assign tasks** through the Codex interface (web or VS Code) — each task uses your configuration automatically
4. **Review results** asynchronously — Codex creates PRs or provides diffs for review

The setup is straightforward and repository-scoped. The agent configuration is versioned alongside your code, so it evolves with your project. Teams using [Codex for open source](/blog/codex-for-open-source) benefit from this since contributors get consistent agent behavior without local setup.

### Setting Up Claude Code Sub-Agents

To use sub-agents in Claude Code:

1. **Use built-in types** for common patterns — `Explore` for search, `Plan` for design, agent types matching your installed skills
2. **Create SKILL.md files** for custom specializations — encode review criteria, documentation standards, or migration procedures
3. **Write prompts that brief agents** as if they're a colleague who just walked in — include file paths, what you've tried, what specifically to check
4. **Choose foreground vs. background** based on dependencies — foreground when you need results before proceeding, background for independent work
5. **Use worktree isolation** for agents that write code in parallel

The learning curve is steeper because you're designing agent interactions, not just configuring an environment. But the payoff is workflows that adapt in real-time rather than following a fixed script. For a deep dive into practical patterns, see our [Claude Code subagents examples](/blog/claude-code-subagents-examples).

## Practical Use Cases

### Use Case 1: Large Codebase Refactoring

**Codex approach**: Break the refactoring into independent chunks. Assign each chunk as a separate Codex task. Review the resulting PRs individually and merge them in sequence. Works well when chunks don't have cross-dependencies.

**Claude Code approach**: Spawn an Explore agent to map the blast radius. Feed the results to a Plan agent. Then spawn parallel implementation agents in worktrees for independent modules, with a final validation agent to check the combined result. Better when changes are interdependent and need real-time coordination.

**Winner**: Claude Code for interdependent changes; Codex for embarrassingly parallel refactoring with clean boundaries.

### Use Case 2: PR Review Pipeline

**Codex approach**: Assign each PR as a review task. Codex reads the diff, runs tests in its container, and posts comments. Each review is independent — perfect for Codex's async model.

**Claude Code approach**: Spawn a code-reviewer sub-agent for the diff analysis, an Explore agent to check for pattern violations across the codebase, and a security-focused agent if the changes touch auth or data handling. The parent synthesizes findings into a single review. See [Claude Code's review agents](/blog/claude-code-review-agents) for how Anthropic uses this internally.

**Winner**: Codex for high-volume independent reviews; Claude Code for deep, multi-perspective reviews on critical changes.

### Use Case 3: Test Generation Across a Module

**Codex approach**: Assign test generation as a single task with your custom agent configuration specifying testing framework, coverage targets, and test style. Codex generates tests in its container, runs them to verify, and returns the results.

**Claude Code approach**: Spawn an Explore agent to analyze the module's public API surface and edge cases. Then spawn an implementation agent to write the tests, and a validation agent to run them. The parent reviews coverage gaps and iterates.

**Winner**: Codex for straightforward test generation where the module is well-scoped; Claude Code when you need iterative refinement and coverage analysis.

## When to Choose Codex Custom Agents

**Choose Codex** when your workflow matches these patterns:

- **Async, batch-style work**: You want to assign tasks and review results later — not sit in a terminal watching execution. Codex's cloud containers run independently while you do other work.
- **Strong isolation requirements**: Each task runs in a fresh container. No risk of agents polluting your local environment or conflicting with each other's file changes.
- **Standardized team workflows**: Your `codex-setup.sh` and agent instructions ensure every team member gets identical agent behavior. Configuration lives in the repo and requires no local setup.
- **High-volume independent tasks**: Reviewing 20 PRs, writing tests for 10 modules, or fixing 15 linting issues — tasks that are structurally identical and don't depend on each other.
- **Students and open-source contributors**: [Codex for students](/blog/codex-for-students) includes free credits, and the cloud model means no local GPU or API key management.

## When to Choose Claude Code Subagents

**Choose Claude Code** when your workflow requires:

- **Real-time multi-agent coordination**: Tasks where agents need to share intermediate results — the output of a search agent informs what an implementation agent builds. Claude Code's parent-child architecture handles this natively.
- **Deep codebase exploration before acting**: The Explore sub-agent type does fast, read-only codebase search with structural guarantees (can't accidentally edit files). Useful before committing to an implementation plan.
- **Custom specialist agents**: Your team has domain-specific review criteria, migration procedures, or documentation standards encoded in [SKILL.md files](/blog/5-claude-code-skills-i-use-every-single-day) that should be invoked as specialized sub-agents.
- **Interactive, iterative workflows**: You want to direct agents in real-time — adjusting the plan based on what the first agent found, spawning additional agents as needed, and synthesizing results yourself.
- **Complex orchestration patterns**: Nested agent hierarchies, conditional branching ("if the security agent finds issues, spawn a fix agent"), and parallel-then-merge workflows that Codex's independent-task model doesn't support.

For teams already invested in [Claude Code's programmable extension stack](/blog/claude-code-extension-stack-skills-hooks-agents-mcp) — hooks, skills, MCP servers — sub-agents are a natural extension of that architecture.

## Pricing and Access

**Codex** is included with ChatGPT Pro ($200/month), Team ($30/user/month with limited usage), and Enterprise plans. Each task consumes compute in OpenAI's cloud. The pricing is predictable for teams already on ChatGPT plans, but heavy users on Pro may hit usage limits.

**Claude Code** uses usage-based API billing — you pay per token for both the parent session and each sub-agent's context. Sub-agents consume their own tokens, so multi-agent workflows cost more than single-agent ones. The tradeoff is granular control: you only pay for the agents you spawn. Teams on Anthropic's Max plan get Claude Code included.

**Cost comparison**: For a team running 50 small, independent tasks per day, Codex's flat-rate plan is likely cheaper. For a team running 5 complex, multi-agent orchestration sessions per day, Claude Code's per-token billing may be more cost-effective since you're not paying for idle containers.

Pricing for both products changes frequently — verify current rates on the official pricing pages before making purchasing decisions.

## Verdict

**Use subagents and custom agents in Codex** when you need isolated, async, batch-style agent workflows with strong environment control. Codex's container-per-task model is ideal for teams that want to assign work and review results later, with standardized agent behavior across the organization.

**Choose Claude Code's subagent system** when you need real-time multi-agent orchestration — specialized agents that coordinate, share results, and adapt during execution. The typed sub-agent system, worktree isolation, and SKILL.md integration make it the more powerful platform for complex, interdependent coding workflows.

For many teams, the answer is both. Use Codex for high-volume independent tasks (PR reviews, test generation, bug triage) and Claude Code for deep, orchestrated sessions (architecture refactoring, security audits, multi-system migrations). The tools complement rather than replace each other. For a broader look at how [agent teams](/blog/claude-code-agent-teams) are reshaping development workflows, and how [effective harnesses for long-running agents](/blog/effective-harnesses-for-long-running-agents) keep these systems productive across sessions, explore our coverage.

## Frequently Asked Questions

### Can Codex spawn sub-agents within a single task?

No. As of mid-2026, each Codex task runs as a single agent in its own container. You can run multiple tasks in parallel, but they operate independently without shared state or coordination. Multi-agent orchestration within a single workflow requires a different tool like Claude Code's agent teams.

### How many sub-agents can Claude Code run in parallel?

There is no hard-coded limit on concurrent sub-agents, but practical limits come from API token costs and context window sizes. Each sub-agent consumes its own token budget. Most workflows use 2-4 parallel agents — enough for meaningful parallelism without excessive cost. Background agents are best for independent work; foreground agents for tasks where results inform the next step.

### Do Codex custom agents persist between tasks?

The agent configuration (setup script and instructions) persists in your repository, but the runtime environment does not. Each task starts with a fresh container, re-runs `codex-setup.sh`, and begins with no memory of previous tasks. This ensures reproducibility but means agents can't learn from prior task results without explicit context in the task description.

### Can I use Claude Code sub-agents with the Codex model?

Yes. Claude Code includes a `codex:codex-rescue` sub-agent type that delegates work to OpenAI's Codex runtime for a second implementation pass or deeper diagnosis. This hybrid approach lets you use Claude Code's orchestration layer while leveraging Codex's execution environment for specific subtasks.

---

*Want more AI insights? [Subscribe to LoreAI](/subscribe) for daily briefings.*