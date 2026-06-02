---
title: "Codex Subagents vs Claude Code Agent Teams: How to Use Subagents and Custom Agents"
slug: use-subagents-and-custom-agents-in-codex
description: "Compare how to use subagents and custom agents in Codex vs Claude Code — architecture, configuration, and practical workflows."
item_a: OpenAI Codex
item_b: Claude Code
category: tools
related_glossary: [agent-sdk, agentic-coding]
related_blog: [codex-complete-guide, claude-code-agent-teams, claude-code-subagents-examples, con-u-pour-des-workflows-multi-agents, claude-code-extension-stack-skills-hooks-agents-mcp]
related_compare: []
related_topics: [codex]
lang: en
---

# Codex Subagents vs Claude Code Agent Teams: How to Use Subagents and Custom Agents

**TL;DR:** Both **OpenAI Codex** and **Claude Code** support multi-agent workflows, but they take fundamentally different approaches. **Codex runs each task as an isolated cloud sandbox** — you get parallelism by launching multiple tasks, and custom agents are configured through setup scripts and `agents.md` files. **Claude Code runs subagents locally as part of an orchestrated agent team** — you define custom agents in `.claude/agents/`, wire them into workflows with explicit fan-out primitives, and they share your local codebase context. If you want to **use subagents and custom agents in Codex**, you're working within a task-per-sandbox model. If you want fine-grained agent orchestration with typed schemas and pipeline control flow, Claude Code's agent system goes deeper.

## Overview: OpenAI Codex

**[OpenAI Codex](/blog/codex-complete-guide)** is a cloud-based coding agent that runs tasks in isolated sandboxed environments. Each task gets its own container with a full copy of your repository, executes autonomously, and returns a diff or pull request when complete. Codex is designed for asynchronous workflows — you fire off a task, go do something else, and come back to review the result.

Codex's multi-agent story is built around parallel task execution. You can launch multiple Codex tasks simultaneously, each working on a different part of your codebase in its own sandbox. Custom agents are defined through `agents.md` configuration files and setup scripts that pre-install dependencies and configure the environment before the agent starts working. This approach prioritizes isolation and safety — agents cannot interfere with each other because they literally run in separate containers.

The tradeoff is flexibility. Codex agents cannot communicate with each other during execution, cannot share intermediate results, and cannot be composed into multi-stage pipelines. Each task is a self-contained unit of work. For teams that want guardrails and simplicity, this is a feature. For teams that need complex orchestration, it's a constraint.

## Overview: Claude Code

**[Claude Code](/blog/claude-code-complete-guide)** is Anthropic's terminal-based AI coding agent that runs locally on your machine. Its [agent teams system](/blog/claude-code-agent-teams) allows you to spawn subagents that execute in parallel, share project context, and return structured results to a parent orchestrator. Custom agents are defined as markdown files in `.claude/agents/` and can be invoked by name — each with its own system prompt, tool access, and behavioral constraints.

Claude Code's multi-agent architecture is designed for orchestration. You can define workflows that fan out across subagents, collect and merge results, verify findings adversarially, and loop until a quality threshold is met. The `Agent` tool supports typed schemas for structured output, git worktree isolation for parallel file mutations, and explicit phase management for progress tracking.

The tradeoff is operational complexity. Claude Code agents run locally, consume your machine's resources, and require more configuration to set up safely. There's no cloud dashboard to monitor tasks — you watch progress in your terminal. But the payoff is a level of agent composability that Codex's task model doesn't attempt.

## Feature Comparison

| Feature | OpenAI Codex | Claude Code | Winner |
|---------|-------------|-------------|--------|
| **Agent isolation** | Full container sandbox per task | Local process with optional git worktree | Codex |
| **Parallel execution** | Multiple tasks via API/UI | `parallel()` and `pipeline()` primitives | Claude Code |
| **Custom agent definition** | `agents.md` + setup scripts | `.claude/agents/*.md` files | Tie |
| **Inter-agent communication** | None — tasks are isolated | Parent-child result passing, structured schemas | Claude Code |
| **Orchestration primitives** | Launch N tasks, collect diffs | `pipeline()`, `parallel()`, `phase()`, loops | Claude Code |
| **Structured output** | Task returns diff/PR | JSON Schema-validated agent returns | Claude Code |
| **Environment setup** | Setup scripts run before each task | Shared local environment + CLAUDE.md context | Codex |
| **Safety model** | Network-disabled sandbox | Permission prompts + sandboxed shell | Codex |
| **Monitoring** | Web dashboard | Terminal progress tree, `/workflows` | Codex |
| **Pricing** | Included in ChatGPT Pro/Team | Usage-based API billing | Depends on volume |

## Agent Architecture: Detailed Analysis

The deepest difference between these two systems is architectural. Understanding how each platform models "an agent" determines what kinds of multi-agent workflows you can build.

### Codex: Task-as-Agent

In Codex, the unit of work is a **task**. Each task runs in a fresh cloud sandbox with a clone of your repository, a pre-configured environment (via setup scripts), and no network access. The agent reads your instructions, makes changes to the codebase, runs any verification commands you've specified, and produces a diff.

To use subagents and custom agents in Codex, you configure `agents.md` files that define specialized agent personas — for example, a "security reviewer" agent that focuses on vulnerability scanning, or a "test writer" agent that generates test coverage. Each agent definition includes instructions, allowed tools, and environment requirements. When you launch a task, you can specify which agent profile to use.

Parallel execution happens at the task level. You can launch five Codex tasks simultaneously — one to refactor a module, one to write tests, one to update documentation, one to fix lint errors, and one to review security — and each runs independently in its own sandbox. The results come back as separate PRs or diffs that you merge manually.

This model is simple and safe. Agents cannot corrupt each other's work, cannot access each other's intermediate state, and cannot accidentally modify files another agent is working on. But it also means you cannot build workflows where one agent's output feeds into another agent's input without manual intervention. There's no pipeline, no fan-out-then-merge, no adversarial verification loop.

### Claude Code: Orchestrated Agent Teams

In Claude Code, the unit of work is an **agent call** within a larger **workflow**. The [extension stack](/blog/claude-code-extension-stack-skills-hooks-agents-mcp) lets you define custom agents as markdown files that specify a system prompt, available tools, and behavioral constraints. The orchestrator — either the main Claude Code session or a workflow script — spawns subagents, passes them prompts, and collects their results as structured data.

Claude Code's `pipeline()` primitive processes items through multiple stages without barriers — item A can be in stage 3 while item B is still in stage 1. The `parallel()` primitive runs tasks concurrently with a barrier, collecting all results before proceeding. Combined with loops, conditionals, and structured schemas, this enables sophisticated multi-agent patterns.

For example, a code review workflow might fan out five subagents — each reviewing the diff through a different lens (correctness, performance, security, style, test coverage) — then feed each finding into an adversarial verification agent that tries to refute it, then collect only the findings that survive verification. This entire pipeline runs as a single orchestrated workflow with typed inputs and outputs at every stage.

The cost is complexity. You need to understand workflow primitives, manage concurrency caps, handle null results from failed agents, and think carefully about when barriers are appropriate. Claude Code caps concurrent agents at roughly 14 per workflow (min of 16 or CPU cores minus 2), with excess calls queuing automatically.

## Custom Agent Configuration: Detailed Analysis

Both platforms let you define custom agents, but the configuration surface and capabilities differ significantly.

### Defining Custom Agents in Codex

Codex custom agents are configured through two mechanisms:

1. **`agents.md` files**: Markdown documents placed in your repository that define agent personas. Each agent gets a name, description, and set of behavioral instructions. When launching a task, you select which agent to use.

2. **Setup scripts**: Shell scripts that run before the agent starts working. These install dependencies, configure tools, set environment variables, and prepare the sandbox. Because each task gets a fresh container, setup scripts ensure the environment matches the agent's requirements.

The simplicity of this model is its strength. An `agents.md` file is just text — anyone on the team can read and edit it. Setup scripts are standard shell scripts. There's no SDK to learn, no type system to satisfy, no orchestration primitives to master.

The limitation is scope. A Codex custom agent is essentially a specialized prompt with a pre-configured environment. It cannot call other agents, cannot access structured output schemas, and cannot participate in multi-stage workflows. Each agent is a standalone worker.

### Defining Custom Agents in Claude Code

Claude Code custom agents are markdown files in `.claude/agents/` with a structured format. Each file defines a system prompt, and the agent inherits access to all session-connected tools (including MCP servers). Custom agents are invoked by name through the `Agent` tool or within workflow scripts using the `agentType` option.

Beyond custom agents, Claude Code's [SKILL.md system](/blog/claude-code-subagents-examples) provides another layer of specialization. Skills are reusable instruction files that encode how Claude Code approaches specific tasks — writing tests, generating content, reviewing PRs. Skills and custom agents compose: a workflow can invoke a custom agent type that follows a specific skill's guidelines.

The `schema` option on agent calls forces the subagent to return structured JSON matching a provided JSON Schema. This means downstream stages can programmatically process agent output without parsing free-form text. Combined with the [Agent SDK](/glossary/agent-sdk), this enables building custom agent harnesses that go well beyond what either platform provides out of the box.

## Multi-Agent Workflow Patterns: Detailed Analysis

The practical question isn't just "can I run multiple agents?" — it's "what patterns can I build?"

### Codex Workflow Patterns

Codex supports one primary multi-agent pattern: **parallel independent tasks**. You launch N tasks, each works on a separate concern, and you merge the results manually. This covers a surprising amount of real-world use cases.

Common Codex multi-agent workflows include launching separate tasks for feature implementation, test writing, and documentation — then reviewing each PR independently. The [multi-agent workflow model](/blog/con-u-pour-des-workflows-multi-agents) works well for teams that want to batch work and review asynchronously.

What Codex cannot do is chain agents. There's no way to say "run agent A, feed its output to agent B, then verify with agent C." Each task is fire-and-forget. If you need iterative refinement — where an agent reviews its own output and improves it — you'd need to manually re-launch tasks with updated context.

### Claude Code Workflow Patterns

Claude Code supports a much richer set of [multi-agent patterns](/blog/claude-code-subagents-examples):

**Fan-out-then-merge**: Spawn N agents to analyze different aspects of a problem, collect all results, deduplicate, and synthesize. Useful for code review, bug hunting, and research tasks.

**Pipeline processing**: Route items through sequential stages — each item progresses independently without waiting for others. A test generation pipeline might discover test targets, generate tests for each target, and verify each test compiles — all flowing without barriers.

**Adversarial verification**: After a finder agent surfaces claims, spawn skeptic agents that attempt to refute each finding. Only claims that survive verification get reported. This pattern dramatically reduces false positives in code review and security scanning.

**Loop-until-dry**: Keep spawning finder agents until K consecutive rounds return nothing new. Useful when you don't know the size of the search space — bug discovery, dead code detection, unused dependency scanning.

**Judge panel**: Generate N independent solutions from different angles, score each with parallel judges, and synthesize from the winner. Better than single-attempt iteration when the solution space is wide.

These patterns compose. A thorough audit might fan out finders, adversarially verify each finding, loop until dry, then synthesize a final report — all as a single orchestrated workflow.

## When to Choose OpenAI Codex

Choose Codex for subagent and custom agent workflows when:

- **Safety is the top priority**: Codex's sandboxed containers mean agents literally cannot interfere with each other or your local machine. Network access is disabled by default. This is the strongest isolation model available in any coding agent platform.

- **Your team works asynchronously**: Codex tasks run in the cloud and persist until you review them. Launch tasks before lunch, review PRs after. No terminal session to keep alive.

- **Tasks are naturally independent**: If your multi-agent workflow is "do five separate things and merge the results," Codex handles this cleanly without orchestration overhead.

- **You want a managed experience**: The Codex web dashboard provides monitoring, task history, and PR management. No local setup beyond connecting your repository.

- **You're already in the OpenAI ecosystem**: If your team uses ChatGPT Pro or Team, Codex is included in your subscription. The integration with GitHub is straightforward.

## When to Choose Claude Code

Choose Claude Code for subagent and custom agent workflows when:

- **You need agent-to-agent communication**: If one agent's output feeds into another agent's input — verification chains, iterative refinement, pipeline processing — Claude Code's orchestration primitives are purpose-built for this.

- **Structured output matters**: When downstream code needs to programmatically process agent results (not just read diffs), Claude Code's JSON Schema-validated agent returns eliminate parsing headaches.

- **You're building complex workflows**: Fan-out, adversarial verification, loop-until-dry, judge panels — these patterns require orchestration primitives that Codex's task model doesn't provide.

- **Local execution is acceptable**: If you're comfortable running agents on your own machine and don't need cloud-managed sandboxes.

- **You want deep customization**: Between `.claude/agents/`, SKILL.md files, MCP servers, hooks, and the Agent SDK, Claude Code offers more surfaces for customizing agent behavior than any other coding agent platform.

## Verdict

**If you want to use subagents and custom agents in Codex**, you get a clean, safe, cloud-managed model where each agent runs in its own sandbox and tasks execute independently. This works well for parallel-but-independent workflows and teams that prefer asynchronous review. **Choose Codex when isolation and simplicity matter most.**

**If you need orchestrated multi-agent workflows** — pipelines, verification chains, structured output, iterative loops — **Claude Code's [agent teams system](/blog/claude-code-agent-teams) is significantly more capable.** The tradeoff is operational complexity and local execution, but the payoff is agent composability that Codex's task model doesn't attempt.

For many teams, the answer is both. Use Codex for safe, fire-and-forget tasks like bulk test generation and documentation updates. Use Claude Code when you need agents that talk to each other, verify each other's work, and produce structured results you can process programmatically. Read our [complete guide to Codex](/blog/codex-complete-guide) and our deep dive on [Claude Code subagent examples](/blog/claude-code-subagents-examples) to see both systems in action.

## Frequently Asked Questions

### Can Codex subagents communicate with each other during execution?

No. Each Codex task runs in an isolated sandbox with no inter-process communication. Agents cannot share intermediate results or coordinate during execution. If you need agent-to-agent communication, you must manually pass outputs between tasks or use a platform like Claude Code that supports orchestrated agent teams with parent-child result passing.

### How do you define a custom agent in Codex?

Custom agents in Codex are defined through `agents.md` files placed in your repository. These markdown files specify agent personas with names, descriptions, and behavioral instructions. You pair them with setup scripts that configure the sandbox environment — installing dependencies, setting variables, and preparing tools before the agent begins work.

### Does Claude Code support running subagents in isolated environments?

Yes. Claude Code offers git worktree isolation for subagents that need to modify files in parallel without conflicts. Each agent gets its own working copy of the repository. However, this is opt-in per agent call (via `isolation: 'worktree'`), not the default — and it's local filesystem isolation, not a full container sandbox like Codex provides.

### Which platform is better for enterprise multi-agent workflows?

It depends on the workflow pattern. For teams that want managed, cloud-based task execution with strong isolation guarantees, Codex fits enterprise security requirements more naturally. For teams building sophisticated agent pipelines with verification steps, structured schemas, and iterative refinement, Claude Code provides orchestration capabilities that Codex lacks. Many enterprise teams adopt both for different use cases.

### Is there a cost difference between running subagents on Codex vs Claude Code?

Codex tasks are included in ChatGPT Pro ($200/month) and Team subscriptions, with usage limits. Claude Code uses per-token API billing — subagent costs scale with the number of agents spawned and tokens consumed per agent. For high-volume multi-agent workflows, Claude Code costs can exceed a flat Codex subscription, but you get finer control over what runs and when.

---

*Want more AI insights? [Subscribe to LoreAI](/subscribe) for daily briefings.*