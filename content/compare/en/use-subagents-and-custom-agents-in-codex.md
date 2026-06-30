---
title: "Subagents in Codex vs Claude Code: Multi-Agent AI Coding Compared"
slug: use-subagents-and-custom-agents-in-codex
description: "Compare subagent and custom agent capabilities in OpenAI Codex vs Claude Code for multi-agent AI coding workflows."
item_a: OpenAI Codex
item_b: Claude Code
category: tools
related_glossary: [agent-sdk, agentic-coding]
related_blog: [claude-code-subagents-examples, claude-code-agent-teams, codex-complete-guide, claude-code-extension-stack-skills-hooks-agents-mcp]
related_compare: []
related_topics: [codex]
lang: en
---

# Subagents in Codex vs Claude Code: Multi-Agent AI Coding Compared

**TL;DR:** If you need **subagents and custom agents** for multi-agent coding workflows, **Claude Code is the clear leader** — it ships a native subagent system with custom agent definitions, workflow orchestration, and parallel execution built in. **OpenAI Codex** runs tasks in isolated cloud sandboxes and can queue multiple tasks concurrently, but it does not expose a subagent API or support user-defined custom agent types. Choose Claude Code for orchestrated multi-agent engineering; choose Codex for fire-and-forget async task execution where agent composition is not required.

## Overview: OpenAI Codex

**OpenAI Codex** is a cloud-based [agentic coding](/glossary/agentic-coding) tool that runs each coding task inside an isolated, sandboxed environment. Rather than operating in your local terminal, Codex spins up a containerized workspace with a snapshot of your repository, executes the task using OpenAI's models, and returns a diff or pull request when finished. Tasks run asynchronously — you can queue several and check back when they complete.

Codex is available through ChatGPT Pro, Team, and Enterprise plans. Its core strength is hands-off execution: describe a task, submit it, and move on. The sandbox model provides strong isolation between tasks, meaning one task cannot corrupt another's environment. However, this isolation also means tasks cannot communicate with each other during execution. There is no mechanism for one Codex task to spawn a child task, delegate subtasks, or coordinate with other running agents. Each task is a self-contained, single-agent execution from start to finish. For a deeper look at Codex's architecture, see our [complete Codex guide](/blog/codex-complete-guide).

## Overview: Claude Code

**Claude Code** is Anthropic's terminal-based AI coding agent that runs directly in your development environment. Unlike cloud-sandboxed tools, Claude Code operates with full access to your local filesystem, shell, and git history. It reads your project structure through `CLAUDE.md` configuration files, understands codebase context, and executes multi-step engineering tasks — from editing files to running tests to committing changes.

What sets Claude Code apart for multi-agent work is its native subagent system. Claude Code can spawn specialized sub-agents that run concurrently, each with their own context and toolset. You can define [custom agents](/blog/claude-code-extension-stack-skills-hooks-agents-mcp) in your repository's `.claude/agents/` directory, create reusable skill files, and orchestrate complex workflows with parallel and pipeline execution patterns. Built-in agent types include Explore (fast read-only search), Plan (architecture design), and code-reviewer (PR review), among others. Our coverage of [Claude Code agent teams](/blog/claude-code-agent-teams) details how these sub-agents coordinate on large codebases.

## Feature Comparison

| Feature | OpenAI Codex | Claude Code | Winner |
|---------|-------------|-------------|--------|
| **Subagent spawning** | Not supported | Native — spawn typed sub-agents from any session | Claude Code |
| **Custom agent definitions** | Not supported | `.claude/agents/` directory with custom prompts and tool access | Claude Code |
| **Parallel task execution** | Multiple independent tasks queue concurrently | Orchestrated parallel/pipeline execution with shared context | Claude Code |
| **Task isolation** | Strong — each task runs in its own container | Configurable — worktree isolation available per sub-agent | Codex |
| **Workflow orchestration** | Manual — queue tasks individually | Scripted — `pipeline()`, `parallel()`, `phase()` primitives | Claude Code |
| **Execution environment** | Cloud sandbox (containerized) | Local terminal (full shell access) | Tie |
| **Agent-to-agent communication** | None — tasks are fully isolated | Sub-agents return structured results to parent | Claude Code |
| **Async operation** | Native — tasks run in background | Supported — background agents with notifications | Tie |
| **Pricing model** | Included in ChatGPT Pro ($200/mo) or Team plans | Usage-based API billing (per token) | Depends on volume |
| **Setup complexity** | Zero — runs in ChatGPT interface | Requires terminal setup and CLAUDE.md configuration | Codex |

## Subagent Architecture: The Core Difference

The fundamental difference between these tools comes down to whether they support agent composition — the ability for one agent to create, direct, and consume results from other agents.

**OpenAI Codex operates on a flat task model.** Each task you submit is an independent unit of work. You describe what you want done, Codex creates a sandboxed environment with your repo, runs the task to completion, and returns results. If you submit five tasks, they run concurrently but independently — task three cannot ask task one for help, and no task can spawn subtasks. This is simple and predictable, but it means complex multi-step workflows must be decomposed manually by the user. You become the orchestrator, breaking work into discrete tasks and managing dependencies yourself.

**Claude Code operates on a hierarchical agent model.** A parent agent can spawn child agents with specific roles, tool access, and return type contracts. Sub-agents can themselves spawn further sub-agents. The parent controls execution flow — running children in parallel, pipelining results through sequential stages, or mixing both patterns. Structured output schemas ensure sub-agents return machine-parseable results, not just free text. This means a single Claude Code session can plan a refactoring, dispatch specialized agents to handle different modules concurrently, collect and validate their results, and synthesize the final output — all without human intervention between steps.

For practical examples of how these subagent patterns work in real projects, see our [Claude Code subagents guide](/blog/claude-code-subagents-examples).

## Custom Agents: Defining Specialized Roles

One of the most searched questions around "use subagents and custom agents in Codex" is whether you can define your own agent types — specialized agents with custom instructions, tool access, and behavioral constraints tailored to your project's needs. The two tools diverge sharply here.

### Custom Agents in Codex

Codex does not support custom agent definitions. Every task uses the same underlying agent configuration — OpenAI's coding model with access to the sandboxed repository environment. You can customize behavior through the task prompt itself, and you can set repository-level instructions via a `AGENTS.md` or similar configuration file that Codex reads at task start. But you cannot define distinct agent types with different tool access, system prompts, or behavioral constraints.

This means if you need a "security reviewer" agent that only reads files and never edits them, or a "test generator" agent that follows specific testing conventions, you must encode those constraints in every task prompt individually. There is no reusable abstraction for agent roles.

### Custom Agents in Claude Code

Claude Code provides a file-based custom agent system. You create markdown files in your repository's `.claude/agents/` directory, each defining an agent type with a name, description, system instructions, and tool access permissions. For example:

```
.claude/agents/
├── pipeline-reviewer.md    # Reviews pipeline script changes
├── security-scanner.md     # Read-only security analysis
└── test-generator.md       # Generates tests following project conventions
```

Each agent file specifies which tools the agent can access — a security scanner might get Read, Bash, and Grep but not Edit or Write, ensuring it can analyze code without modifying it. The agent's instructions can reference project-specific conventions, known issues, and architectural constraints.

When Claude Code's main agent or a workflow script spawns a sub-agent with `agentType: 'pipeline-reviewer'`, that sub-agent loads the custom agent definition and operates within its defined constraints. This creates a separation of concerns: the orchestrating agent handles workflow logic while specialized agents handle domain-specific tasks.

Claude Code also ships several built-in agent types — Explore for fast codebase search, Plan for architecture design, and code-reviewer for pull request analysis — that are available without any configuration. Understanding how these layers compose is key to building effective automation; our breakdown of [Claude Code's programmable extension stack](/blog/claude-code-extension-stack-skills-hooks-agents-mcp) covers the full architecture.

## Workflow Orchestration: Sequential, Parallel, and Pipeline

Beyond individual agent capabilities, the orchestration layer — how you compose multiple agents into a coherent workflow — is where these tools show their biggest gap.

### Orchestration in Codex

Codex's orchestration model is manual. You submit tasks through the ChatGPT interface or API, and each runs independently. To create a multi-step workflow, you:

1. Submit task A
2. Wait for task A to complete
3. Review the result
4. Submit task B (possibly incorporating A's output in the prompt)
5. Repeat

There is no scripting layer, no dependency graph, no automatic result passing between tasks. For simple workflows — "fix this bug, then update the tests" — this works fine because the human naturally provides the orchestration. For complex workflows — "review all 47 changed files across 6 dimensions, verify each finding adversarially, then synthesize a report" — manual orchestration becomes the bottleneck.

Codex's [VS Code extension](/blog/codex-vscode) improves the submission experience but does not add workflow automation. You still manage task dependencies yourself.

### Orchestration in Claude Code

Claude Code provides a scripted workflow engine with three core primitives:

- **`parallel()`**: Run multiple agent calls concurrently and wait for all results. Use when you need cross-item context — deduplication, synthesis, or comparison across all results before proceeding.
- **`pipeline()`**: Run each item through sequential stages independently, with no barrier between stages. Item A can be in stage three while item B is still in stage one. This maximizes throughput for independent multi-stage work.
- **`phase()`**: Group agent calls into named phases for progress tracking and display.

A workflow script is plain JavaScript that uses these primitives to define deterministic control flow:

```javascript
// Fan out reviews across dimensions, verify each finding
const results = await pipeline(
  DIMENSIONS,
  d => agent(d.prompt, {label: `review:${d.key}`, schema: FINDINGS}),
  review => parallel(review.findings.map(f => () =>
    agent(`Verify: ${f.title}`, {schema: VERDICT})
  ))
)
```

This script spawns one review agent per dimension. As soon as any dimension's review completes, its findings immediately proceed to verification — no waiting for slower dimensions to finish. Verification agents run concurrently within each dimension. The entire workflow executes with a concurrency cap to prevent resource exhaustion.

The key advantage is that workflow logic is deterministic — loops, conditionals, and fan-out patterns are defined in code, not left to model inference. The model handles each individual task; the script handles coordination.

## Practical Scenarios: Which Tool Wins

### Scenario 1: Large-Scale Code Review

**Task**: Review a 200-file pull request across security, performance, correctness, and style dimensions.

**With Codex**: Submit four separate tasks, one per dimension, each with the full PR context. Wait for all four to complete. Manually cross-reference findings for duplicates. Manually decide which findings to act on. This works but requires active human management.

**With Claude Code**: Define a workflow that spawns four review agents in parallel (one per dimension), pipelines each finding through an adversarial verification agent, deduplicates across dimensions in code, and returns a ranked list of confirmed issues. The entire process runs in one invocation with no human intervention until the final report.

**Winner**: **Claude Code** — the orchestration eliminates manual coordination overhead.

### Scenario 2: Bug Fix in an Unfamiliar Codebase

**Task**: Fix a reported bug when you are not familiar with the codebase.

**With Codex**: Submit a task with the bug report and relevant file paths. Codex investigates in its sandbox, proposes a fix, and returns a diff. Simple, effective, no setup required.

**With Claude Code**: Start a session, let Claude Code explore the codebase using its Explore sub-agent, then propose and implement a fix. More interactive but requires local setup.

**Winner**: **Codex** — for isolated, well-scoped bug fixes, the zero-setup cloud sandbox is faster to start.

### Scenario 3: Cross-Repository Migration

**Task**: Update an API call pattern across 15 microservices.

**With Codex**: Submit 15 independent tasks, one per repository. Each runs in isolation. Review 15 separate diffs. No coordination between tasks — if the pattern in repo 7 reveals a needed change to the approach, you must manually update and resubmit the remaining tasks.

**With Claude Code**: Write a workflow that pipelines all 15 repos through a discovery stage (find affected files), a transformation stage (apply the pattern with worktree isolation), and a verification stage (run tests). If the discovery stage reveals an unexpected pattern, the workflow script handles it in code — no manual intervention.

**Winner**: **Claude Code** — cross-repo coordination requires the orchestration layer.

### Scenario 4: Async Background Tasks

**Task**: Queue several independent coding tasks and check back later.

**With Codex**: Native strength. Submit tasks through the ChatGPT interface, close your laptop, check back in an hour. Each task runs to completion in its cloud sandbox.

**With Claude Code**: Possible with background agents and notifications, but Claude Code is designed primarily for interactive terminal sessions. Long-running unattended execution is less natural.

**Winner**: **Codex** — its cloud-native async model is purpose-built for fire-and-forget workflows.

## The Agent SDK Dimension

For teams building their own AI-powered development tools, the underlying [Agent SDK](/glossary/agent-sdk) capabilities matter as much as the end-user features.

Anthropic's Agent SDK provides the primitives that power Claude Code's subagent system — tool use, structured output, extended thinking, and multi-turn agent loops. Developers can build custom agent harnesses that compose Claude agents in arbitrary patterns. Claude Code itself is essentially a sophisticated harness built on these primitives, and teams can extend it through custom agents and workflow scripts without building from scratch.

OpenAI's Codex API exposes task submission and result retrieval but does not provide agent composition primitives. You can build multi-agent systems using OpenAI's broader API (function calling, assistants API), but Codex itself is a pre-built agent — you use it rather than extend it. For teams that need to customize agent behavior deeply, this means building a separate orchestration layer on top of the Codex API or the Assistants API rather than extending Codex directly.

Our piece on [agent harnesses in 2026](/blog/agent-harnesses-2026) explores why the orchestration layer — not the underlying model — increasingly determines what teams can accomplish with AI coding tools.

## Pricing and Access Considerations

Pricing models differ significantly and affect the economics of multi-agent workflows:

**Codex** is included in ChatGPT Pro ($200/month) and available on Team and Enterprise plans. Since each task runs in a dedicated cloud sandbox, the cost is bundled into the subscription — you do not pay per task or per token for Codex specifically. This makes cost predictable but means heavy multi-task usage does not get cheaper at volume.

**Claude Code** uses per-token API billing. Each sub-agent consumes tokens independently, so a workflow that spawns 20 sub-agents costs roughly 20 times what a single agent call costs (adjusted for varying prompt and completion lengths). For light usage, this can be cheaper than a $200/month subscription. For heavy multi-agent workflows running daily, costs can exceed the subscription model. The tradeoff: you pay exactly for what you use, and you can optimize costs by tuning agent prompts, using appropriate model tiers per agent (Haiku for simple tasks, Opus for complex analysis), and limiting unnecessary agent spawns.

**Decision rule**: If you run fewer than a handful of coding tasks per day and do not need agent orchestration, Codex's bundled pricing is simpler. If you run complex multi-agent workflows but want granular cost control, Claude Code's per-token model offers more optimization levers.

## When to Choose Codex

Codex is the right choice when:

- **You want zero setup**: No terminal configuration, no CLAUDE.md files, no agent definitions. Submit a task through ChatGPT and get results.
- **Your tasks are independent**: Bug fixes, feature implementations, and documentation updates that do not require coordination between tasks.
- **You prefer async workflows**: Submit tasks before lunch, review diffs after. Codex's cloud sandbox model is built for this pattern.
- **You need strong isolation**: Each task runs in a fresh container. There is no risk of one task's side effects corrupting another, and tasks cannot accidentally modify your local environment.
- **Your team is already on ChatGPT Pro or Enterprise**: Codex is included — no additional billing to manage.

Codex works best as a task-execution engine where you handle the orchestration. If your workflow is "fix this, then fix that, then update tests" and you are comfortable managing the sequence, Codex delivers results with minimal friction. See our coverage of [Codex for students](/blog/codex-for-students) and [Codex for open source](/blog/codex-for-open-source) for specific use-case breakdowns.

## When to Choose Claude Code

Claude Code is the right choice when:

- **You need multi-agent orchestration**: Any workflow where agents must coordinate — passing results between stages, running parallel reviews, or making decisions based on aggregated sub-agent output.
- **You want custom agent types**: Project-specific agents with tailored instructions, tool access, and behavioral constraints defined in version-controlled files.
- **Your tasks span multiple files or repos**: Refactoring, migrations, and cross-cutting changes where a single agent cannot hold all the context, and work must be decomposed across specialized sub-agents.
- **You prefer interactive control**: Claude Code runs in your terminal with real-time visibility into what each agent is doing. You can approve, redirect, or abort at any point.
- **You are building on the Agent SDK**: If you need to extend the coding agent with custom tooling, MCP server integrations, or novel agent patterns, Claude Code's programmable layers provide the foundation.

Claude Code is the stronger tool for teams that treat AI coding as an engineering system rather than a chat feature. The investment in CLAUDE.md files, custom agents, and workflow scripts pays off when you are running the same multi-agent patterns repeatedly. For a practical walkthrough, our [subagents examples guide](/blog/claude-code-subagents-examples) demonstrates real-world patterns including fan-out review, adversarial verification, and pipeline-based migrations.

## Verdict

**For subagents and custom agents, Claude Code is the definitive choice.** It provides native sub-agent spawning, custom agent definitions, and workflow orchestration that Codex simply does not offer. If you searched "use subagents and custom agents in Codex" hoping to find that Codex supports these features — it currently does not. Codex is a strong single-agent coding tool with excellent async execution, but it lacks the agent composition primitives needed for multi-agent workflows.

**The practical recommendation**: Use **Codex** for independent, well-scoped coding tasks where you want fire-and-forget simplicity. Use **Claude Code** for any workflow that requires agent coordination, custom agent roles, or programmatic orchestration. Many teams use both — Codex for quick async tasks submitted through ChatGPT, Claude Code for complex multi-agent workflows that require structured coordination. As both tools evolve rapidly, these capabilities are subject to change — check the latest documentation from OpenAI and Anthropic for current feature availability.

## Frequently Asked Questions

### Can you use subagents in OpenAI Codex?
OpenAI Codex does not currently support subagents. Each Codex task runs as an independent, isolated agent in its own cloud sandbox. Tasks cannot spawn child tasks, communicate with other running tasks, or compose results from multiple agents. Multi-step workflows require manual orchestration by the user.

### How do custom agents work in Claude Code?
Custom agents in Claude Code are markdown files placed in your repository's `.claude/agents/` directory. Each file defines an agent type with a name, system instructions, and tool access permissions. When spawned as a sub-agent, the custom agent operates within its defined constraints — a read-only reviewer cannot edit files, a test generator follows project-specific conventions automatically.

### Is Codex or Claude Code better for large-scale refactoring?
Claude Code is better for large-scale refactoring because it can orchestrate multiple sub-agents working on different parts of the codebase simultaneously, with programmatic coordination between them. Codex can handle refactoring within individual tasks but lacks the inter-task coordination needed for changes that span many files or require consistent application of a pattern.

### Can Codex and Claude Code be used together?
Yes. A practical pattern is using Codex for independent async tasks — bug fixes, documentation updates, small feature additions — while using Claude Code for orchestrated multi-agent workflows like cross-repo migrations, multi-dimensional code reviews, or complex refactoring that requires coordination between specialized agents.

### What does subagent orchestration cost in Claude Code?
Claude Code bills per token, so each sub-agent adds to the total cost based on its prompt and completion length. A workflow spawning 10 sub-agents costs roughly 10 times a single agent call. You can optimize by using lighter models (Haiku) for simple sub-tasks and heavier models (Opus) only for complex analysis stages. Codex's cost is bundled into ChatGPT Pro or Team subscriptions regardless of task count.

---

*Want more AI insights? [Subscribe to LoreAI](/subscribe) for daily briefings.*