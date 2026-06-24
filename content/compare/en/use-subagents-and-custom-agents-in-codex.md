---
title: "Subagents and Custom Agents in Codex vs Claude Code: Multi-Agent AI Coding Compared"
slug: use-subagents-and-custom-agents-in-codex
description: "Comparing subagent and custom agent capabilities in OpenAI Codex vs Claude Code for multi-agent coding workflows."
item_a: OpenAI Codex
item_b: Claude Code
category: tools
related_glossary: [agent-sdk, agentic-coding]
related_blog: [claude-code-subagents-examples, claude-code-agent-teams, codex-complete-guide, claude-code-extension-stack-skills-hooks-agents-mcp]
related_compare: []
related_topics: [codex]
lang: en
---

# Subagents and Custom Agents in Codex vs Claude Code: Multi-Agent AI Coding Compared

**TL;DR:** If you're searching for how to use subagents and custom agents in **OpenAI Codex**, you'll find that Codex takes a fundamentally different approach than **Claude Code**. Codex runs each task as an isolated cloud agent in its own sandboxed VM — there's no built-in subagent hierarchy or custom agent definition system. **Claude Code wins decisively on multi-agent orchestration**, with named agent types, custom agent definitions, workflow scripts, and parallel subagent execution built into its core architecture. Codex wins on **asynchronous cloud execution** — fire off tasks and come back later — but treats each task as independent rather than orchestrated.

## Overview: OpenAI Codex

**OpenAI Codex** is a cloud-based [agentic coding](/glossary/agentic-coding) tool that runs tasks in sandboxed virtual environments. Each task you submit to Codex spins up an isolated container with a full copy of your repository, executes the work, and produces a pull request or diff when finished. The key architectural choice is isolation: every Codex task runs independently, with no awareness of other concurrent tasks.

Codex is designed for asynchronous workflows. You describe a task — "fix this bug," "add tests for this module," "refactor this class" — and Codex works on it in the background while you continue with other work. This makes it effective for parallelizing independent tasks across a team, but it's a different paradigm from interactive multi-agent orchestration. For a full breakdown, see our [complete guide to OpenAI Codex](/blog/codex-complete-guide).

Codex is available through ChatGPT Pro, Team, and Enterprise plans, with student and open-source programs expanding access.

## Overview: Claude Code

**Claude Code** is Anthropic's terminal-based AI coding agent with a rich, layered extension system. Unlike Codex's cloud-first approach, Claude Code runs locally in your terminal with direct access to your filesystem, shell, and development tools. Its multi-agent capabilities are built into the core architecture through the [Agent SDK](/glossary/agent-sdk) — you can spawn subagents, define custom agent types, and orchestrate complex workflows with deterministic control flow.

Claude Code's [extension stack](/blog/claude-code-extension-stack-skills-hooks-agents-mcp) includes skills (reusable task instructions), hooks (deterministic automation), custom agents (specialized subagent types), and MCP servers (external tool integrations). The subagent system supports both ad-hoc agent spawning during a session and pre-defined agent configurations that travel with your repository. See our [Claude Code agent teams deep dive](/blog/claude-code-agent-teams) for real-world examples.

Claude Code uses usage-based API billing rather than a fixed subscription, with access through Anthropic's API or the Max plan.

## Feature Comparison

| Feature | OpenAI Codex | Claude Code | Winner |
|---------|-------------|-------------|--------|
| **Subagent spawning** | No native subagent hierarchy | Built-in Agent tool with typed subagents | Claude Code |
| **Custom agent definitions** | Not supported | `.claude/agents/` directory with markdown config | Claude Code |
| **Parallel execution** | Multiple independent cloud tasks | Orchestrated parallel subagents with shared context | Claude Code |
| **Workflow orchestration** | Manual task submission | Deterministic workflow scripts with `pipeline()` and `parallel()` | Claude Code |
| **Execution environment** | Isolated cloud VMs | Local terminal with full shell access | Tie |
| **Async background work** | Native — fire and forget | Supported via background agents | Codex |
| **Repository isolation** | Full sandbox per task | Git worktree isolation per subagent (optional) | Tie |
| **Team/org scaling** | Cloud-native, no local resources | Local compute, shareable agent configs via repo | Codex |
| **Pricing** | Included in ChatGPT Pro/Team/Enterprise | Usage-based API billing | Depends on volume |

## Multi-Agent Architecture: Detailed Analysis

The most important difference between Codex and Claude Code for multi-agent work is architectural. This matters because it determines what kinds of workflows you can build, how agents coordinate, and whether you can create custom specializations.

**Codex's model is task-level parallelism.** You submit multiple tasks to Codex, and each runs in its own sandboxed VM with a clone of your repository. These tasks have zero awareness of each other — there's no shared state, no message passing, no coordination. If Task A refactors a module and Task B writes tests for that same module, they'll produce conflicting diffs that you need to reconcile manually. This is by design: isolation ensures safety and predictability, but it means Codex can't orchestrate multi-step workflows where later stages depend on earlier results.

**Claude Code's model is hierarchical agent orchestration.** The main Claude Code session acts as an orchestrator that can spawn specialized subagents using the Agent tool. These subagents inherit context from the parent, can be assigned specific roles (research, implementation, review), and return structured results that the parent agent uses to make decisions. The Workflow system adds deterministic control flow — `pipeline()` processes items through sequential stages, `parallel()` runs tasks concurrently with barrier synchronization, and `phase()` organizes work into visible progress groups.

Here's what this looks like in practice. In Claude Code, you can define a workflow that:

1. Spawns an Explore agent to find all files matching a pattern
2. Fans out implementation agents — one per file — running in parallel with git worktree isolation
3. Collects all results at a barrier
4. Spawns a review agent that examines all changes together
5. Creates a single coordinated commit

In Codex, the equivalent would require you to manually submit each step as a separate task, wait for results, and coordinate the handoffs yourself. Codex doesn't have a concept of "spawn a sub-task from within a task" — each task is a top-level operation.

For teams evaluating multi-agent capabilities, this architectural difference is the primary decision driver. If your workflow involves independent, parallel tasks that don't need coordination — Codex's model works well. If you need orchestrated, multi-step workflows with dependencies between agents — Claude Code is the only option with native support.

## Custom Agent Definitions: Detailed Analysis

Custom agents let you create specialized AI personas with specific instructions, tool access, and behavioral constraints. This is where the two tools diverge most sharply.

**Codex does not support custom agent definitions.** Every Codex task uses the same base agent configuration. You can customize behavior through your prompt and through repository-level configuration files (like `AGENTS.md` or `codex.md`), but you cannot define named agent types with different tool permissions, system prompts, or specializations. If you want a "security reviewer" agent and a "test writer" agent, you'd express that difference entirely through your task description — the underlying agent has the same capabilities for both.

**Claude Code provides a full custom agent system.** You create agent definitions as markdown files in `.claude/agents/` with structured configuration:

```markdown
# pipeline-reviewer

Reviews changes to pipeline scripts against the project's
known-issues registry to prevent re-introducing past bugs.

Tools: Read, Grep, Glob, Bash
```

These agents become available as named types when spawning subagents. The key properties you can configure include:

- **System prompt**: Domain-specific instructions and constraints
- **Tool access**: Restrict which tools the agent can use (read-only agents, no-write agents, etc.)
- **Automatic triggers**: Agents can be invoked automatically based on file patterns (e.g., editing `scripts/*.ts` triggers the pipeline-reviewer)
- **Structured output schemas**: Force agents to return data in a specific JSON format for programmatic consumption

Custom agents travel with your repository. When you commit `.claude/agents/` to version control, every team member gets the same specialized agent types. This is particularly powerful for enforcing code review standards, security checks, or domain-specific validation — the agent definitions encode institutional knowledge that persists across sessions and team members.

For practical examples of building and using custom agents alongside subagent workflows, see our [Claude Code subagent examples](/blog/claude-code-subagents-examples).

## Workflow Orchestration: Detailed Analysis

Beyond individual agent capabilities, the orchestration layer — how you coordinate multiple agents into a coherent workflow — is where these tools show the starkest contrast.

**Codex relies on external orchestration.** Since each Codex task is an independent cloud operation, any multi-step workflow coordination happens outside of Codex itself. Teams typically use CI/CD pipelines, scripts, or manual processes to chain Codex tasks together. For example, you might use a GitHub Action that submits a Codex task for code generation, waits for the PR, then submits a second Codex task for test generation against the new code. This works, but the orchestration logic lives in your infrastructure rather than in the coding tool.

**Claude Code has a built-in workflow engine.** The Workflow system lets you write JavaScript scripts that deterministically orchestrate subagents:

- **`pipeline(items, ...stages)`**: Process each item through sequential stages independently. Item A can be in stage 3 while item B is still in stage 1. Wall-clock time equals the slowest single-item chain, not the sum of all stages.
- **`parallel(thunks)`**: Run tasks concurrently with a barrier — all must complete before the workflow continues. Use when you need cross-item context (deduplication, synthesis, comparison).
- **`agent(prompt, opts)`**: Spawn a subagent with optional schema validation, model override, worktree isolation, or custom agent type.
- **`phase(title)`**: Organize work into visible progress groups for monitoring.

These primitives compose into sophisticated patterns. A code review workflow might fan out multiple review agents — each examining a different dimension (correctness, security, performance) — then verify each finding with adversarial agents that attempt to refute it, then synthesize surviving findings into a final report. The entire flow is deterministic: control flow is in your script, not in the model's reasoning.

Codex's approach is simpler and requires less setup, but it can't express dependent workflows without external tooling. Claude Code's approach requires learning the workflow API but enables arbitrarily complex orchestration natively.

## Execution Model and Safety

Both tools address the safety question of running AI-generated code, but with different mechanisms.

**Codex sandboxes at the VM level.** Each task runs in a fresh container with network access disabled by default. The agent can't make external API calls, install packages from the internet (unless pre-configured), or affect your local environment. The tradeoff: you can't use Codex for tasks that require network access, running a dev server, or interacting with external services during execution. The sandbox is the safety boundary.

**Claude Code sandboxes at the permission level.** The agent runs locally with access to your real filesystem, but every potentially dangerous action requires explicit user approval. You can configure permission rules in `.claude/settings.json` to allow specific operations automatically (e.g., "allow all `npm test` commands") while blocking others. For subagents, the `isolation: 'worktree'` option creates a temporary git worktree so the agent works on an isolated copy — changes are only merged if the agent produces valid results.

The practical difference: Codex is safer by default (nothing can escape the sandbox), but less capable for workflows that need real environment access. Claude Code is more capable but requires thoughtful permission configuration, especially when running automated workflows with multiple subagents.

## When to Choose OpenAI Codex

**Choose Codex for asynchronous, independent task execution.** Codex excels when you have a backlog of self-contained tasks — bug fixes, test additions, documentation updates — that don't depend on each other. Its cloud-native architecture means:

- **No local compute costs**: Tasks run on OpenAI's infrastructure, freeing your machine
- **True fire-and-forget**: Submit a task before lunch, review the PR after
- **Team-scale parallelism**: Multiple team members can submit tasks simultaneously without resource contention
- **Safe experimentation**: Full VM isolation means a bad task can't damage your environment

Codex is also the better choice if your team is already embedded in the ChatGPT/OpenAI ecosystem and wants coding agent capabilities without switching tools. The [VS Code extension](/blog/codex-vscode) integrates Codex into an existing IDE workflow.

However, if you need agents that coordinate with each other, share context, or execute dependent multi-step workflows — Codex's isolation model becomes a limitation rather than a feature.

## When to Choose Claude Code

**Choose Claude Code for orchestrated multi-agent workflows.** Claude Code is the clear choice when your task requires:

- **Subagent hierarchies**: A parent agent that spawns specialized child agents, collects their results, and makes decisions based on the combined output
- **Custom agent types**: Domain-specific agents (security reviewer, performance auditor, style checker) defined as repository-level configuration
- **Dependent workflows**: Multi-step processes where stage N depends on the output of stage N-1
- **Real-time orchestration**: Interactive sessions where you steer the agent team as work progresses
- **Repository-portable standards**: Agent definitions and skills that travel with your codebase via version control

Claude Code's [seven programmable layers](/blog/claude-code-seven-programmable-layers) — from CLAUDE.md project context through skills, hooks, agents, and MCP servers — provide the most extensible agent architecture available in a coding tool today. For teams building sophisticated development automation, Claude Code's multi-agent capabilities are unmatched.

The tradeoff is complexity. Setting up custom agents, writing workflow scripts, and configuring permissions takes more upfront investment than submitting tasks to Codex. For simple, independent tasks, Codex's simplicity wins.

## Verdict

**For subagents and custom agents, Claude Code is the definitive choice.** Codex doesn't have a subagent system — it runs isolated, independent tasks in cloud sandboxes with no inter-agent coordination. If you searched for "use subagents and custom agents in Codex," the honest answer is that Codex doesn't support these concepts natively.

Claude Code provides a complete multi-agent toolkit: the Agent tool for spawning subagents, `.claude/agents/` for custom agent definitions, Workflows for deterministic orchestration, and built-in agent types (Explore, Plan, code-reviewer) for common tasks. Teams that need coordinated, multi-step AI coding workflows should evaluate Claude Code's [agent teams](/blog/claude-code-agent-teams) capabilities.

**Codex wins on simplicity and async execution.** If your needs are parallel independent tasks with zero configuration, Codex's fire-and-forget cloud model is simpler to adopt. Not every workflow needs subagent orchestration — sometimes you just want to submit a bug fix and move on.

The best approach for many teams: use Claude Code for complex, orchestrated workflows that require agent specialization and coordination, and Codex for batch processing of independent tasks that benefit from cloud execution.

## Frequently Asked Questions

### Can you create custom agents in OpenAI Codex?

Codex does not support custom agent definitions. Every task uses the same base agent, and you customize behavior through prompts and repository-level configuration files rather than named agent types with different tool permissions. Claude Code supports custom agents via `.claude/agents/` markdown files that define specialized roles with specific tool access and instructions.

### How do subagents work in Claude Code?

Claude Code's Agent tool spawns child agents from within a parent session. Each subagent inherits project context, can be assigned a custom agent type, and returns structured results to the parent. Subagents can run in parallel with optional git worktree isolation, and the Workflow system provides `pipeline()` and `parallel()` primitives for deterministic orchestration of multiple subagents.

### Can Codex and Claude Code be used together?

Yes. A practical combination uses Claude Code for interactive, orchestrated development sessions — complex refactors, multi-file changes, code review workflows — and Codex for async batch tasks like fixing a backlog of issues or generating tests across a large codebase. The tools complement each other because they address different workflow patterns.

### What is the difference between Codex tasks and Claude Code subagents?

Codex tasks are independent cloud operations — each runs in its own sandbox with no awareness of other tasks. Claude Code subagents are child processes within a parent session — they share project context, can pass data to each other, and are coordinated by the parent agent or a workflow script. Codex tasks are isolated by design; Claude Code subagents are connected by design.

### Is multi-agent coding worth the complexity?

Multi-agent workflows pay off when tasks have dependencies or require specialization. A code review that checks correctness, security, and performance in parallel with specialized agents produces better results than a single agent trying to cover all dimensions. For simple, independent tasks — submitting a bug fix, adding a test — single-agent execution (Codex or Claude Code without subagents) is simpler and equally effective.

---

*Want more AI insights? [Subscribe to LoreAI](/subscribe) for daily briefings.*