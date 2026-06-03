---
title: "Codex Subagents vs Claude Code Agent Teams: Multi-Agent AI Coding Compared"
slug: use-subagents-and-custom-agents-in-codex
description: "Compare how Codex and Claude Code handle subagents and custom agents for multi-agent coding workflows, with practical setup guidance."
item_a: OpenAI Codex
item_b: Claude Code
category: tools
related_glossary: [agent-sdk, agentic-coding]
related_blog: [codex-complete-guide, claude-code-agent-teams, claude-code-subagents-examples, claude-code-extension-stack-skills-hooks-agents-mcp]
related_compare: []
related_topics: [codex]
lang: en
---

# Codex Subagents vs Claude Code Agent Teams: Multi-Agent AI Coding Compared

**TL;DR:** Both **OpenAI Codex** and **Claude Code** support multi-agent workflows, but their architectures diverge sharply. **Claude Code wins on customization and local control** — its agent teams, custom subagent types, and workflow orchestration give you fine-grained control over how agents collaborate. **Codex wins on zero-setup cloud execution** — tasks run in sandboxed cloud environments with no local resource cost. Choose Codex for fire-and-forget parallel tasks; choose Claude Code for complex, multi-phase orchestration where you need to define agent behavior precisely.

## Overview: OpenAI Codex

**OpenAI Codex** is a cloud-based [agentic coding](/glossary/agentic-coding) tool that runs tasks in sandboxed environments on OpenAI's infrastructure. Each task spins up an isolated container with your repository cloned, executes the work, and returns a diff or pull request. Codex is designed for asynchronous workflows — you submit a task, walk away, and review the results later.

Codex's multi-agent capability comes from its ability to run multiple independent tasks in parallel. You can queue several tasks simultaneously, each operating in its own sandbox with its own copy of the codebase. This is conceptually similar to subagents, but the orchestration is implicit rather than explicit — you launch tasks individually rather than defining relationships between them. For a full breakdown of Codex's architecture, see our [complete guide to OpenAI Codex](/blog/codex-complete-guide).

Codex is available through ChatGPT Pro and Team plans, with a [VS Code extension](/blog/codex-vscode) for IDE integration. OpenAI has also made Codex [available to open-source maintainers](/blog/codex-for-open-source) and [students](/blog/codex-for-students) with free credits.

## Overview: Claude Code

**Claude Code** is Anthropic's terminal-based AI coding agent that runs locally on your machine. Unlike cloud-first tools, Claude Code operates directly in your development environment — it reads your file system, runs shell commands, and interacts with your toolchain in real time. Its multi-agent system is explicit and programmable: you define subagent types, orchestration workflows, and coordination patterns.

Claude Code's [agent teams](/blog/claude-code-agent-teams) feature lets the main agent spawn sub-agents that work in parallel across your codebase. Custom agent types (defined in `.claude/agents/`) carry specialized system prompts and tool access. The Workflow system goes further — you write JavaScript orchestration scripts that define fan-out patterns, pipelines, barriers, and structured output schemas. This is a fundamentally different approach from Codex: rather than launching independent tasks, you define how agents relate to each other. See how [skills, hooks, agents, and MCP compose](/blog/claude-code-extension-stack-skills-hooks-agents-mcp) into a programmable platform.

## Feature Comparison

| Feature | OpenAI Codex | Claude Code | Winner |
|---------|-------------|-------------|--------|
| **Multi-agent model** | Implicit — parallel independent tasks | Explicit — orchestrated agent teams | Claude Code |
| **Custom agent types** | Not supported | `.claude/agents/` with custom prompts and tools | Claude Code |
| **Orchestration language** | None — manual task queuing | JavaScript workflow scripts with `pipeline()`, `parallel()`, `phase()` | Claude Code |
| **Execution environment** | Cloud sandboxes (isolated containers) | Local machine (with optional git worktree isolation) | Codex |
| **Async / fire-and-forget** | Native — submit and review later | Supported via background agents and remote sessions | Codex |
| **Structured output** | Task returns diffs/PRs | Schema-validated JSON via `agent()` with `schema` option | Claude Code |
| **Max concurrency** | Multiple tasks in parallel (plan-dependent) | Up to 16 concurrent agents per workflow | Claude Code |
| **Resource cost** | Cloud-side (no local CPU/memory) | Local CPU and memory per agent | Codex |
| **Setup complexity** | Minimal — cloud-managed | Requires local config (agents, workflows, skills) | Codex |
| **Pricing** | Included in ChatGPT Pro/Team plans | Usage-based API billing | Tie |

## Multi-Agent Architecture: Detailed Analysis

Multi-agent architecture is the most important differentiator between these two tools, and it reflects fundamentally different philosophies about how AI agents should collaborate on code.

**Codex takes the "task queue" approach.** You define discrete, independent units of work — "fix this bug," "add tests for this module," "refactor this file" — and Codex runs each in its own sandbox. There is no built-in mechanism for one task to communicate with another, share intermediate results, or coordinate sequencing. Each task sees a fresh clone of your repository at the point of submission. This model is simple and effective for embarrassingly parallel work: if you have ten independent bugs to fix, you launch ten tasks and review ten PRs.

The limitation surfaces when tasks have dependencies. If task B needs the output of task A, you must wait for A to complete, merge its changes, and then launch B against the updated codebase. Codex provides no orchestration primitive for expressing "run A, then fan out B and C using A's results, then merge." You handle that sequencing manually.

**Claude Code takes the "orchestration" approach.** The `Agent` tool spawns subagents within a single session, and the Workflow system lets you define complex coordination patterns in JavaScript. A typical multi-phase workflow looks like:

```javascript
phase('Analyze')
const findings = await parallel(files.map(f => () =>
  agent(`Review ${f} for security issues`, {
    schema: FINDINGS_SCHEMA,
    agentType: 'security-reviewer'
  })
))

phase('Verify')
const verified = await pipeline(
  findings.filter(Boolean).flatMap(f => f.issues),
  issue => agent(`Verify: ${issue.description}`, { schema: VERDICT_SCHEMA }),
  (verdict, issue) => ({ ...issue, confirmed: verdict.isReal })
)
```

This script fans out security reviewers across files, collects structured results, then pipelines each finding through verification — all within a single orchestrated run. The `agentType: 'security-reviewer'` parameter loads a custom agent definition from `.claude/agents/`, giving that subagent a specialized system prompt and tool configuration.

Claude Code's approach costs more in local resources — each subagent consumes CPU, memory, and API tokens on your machine. But it enables workflow patterns that Codex simply cannot express: conditional fan-out, cross-agent data flow, adversarial verification, and loop-until-converge patterns. For teams building sophisticated [agentic coding](/glossary/agentic-coding) pipelines, this programmability is the deciding factor.

## Custom Agent Types: Detailed Analysis

Custom agents are where the two tools diverge most starkly. Codex has no concept of agent specialization — every task runs with the same base model and system context. Claude Code lets you define entirely different agent personas, each with its own instructions, tool access, and behavioral constraints.

**How Claude Code custom agents work.** You create markdown files in `.claude/agents/` that define specialized agent types. For example, a `pipeline-reviewer` agent might carry instructions specific to reviewing data pipeline code, awareness of known issues, and access to validation tools. When spawned via the `Agent` tool or a Workflow script, the subagent inherits these instructions as its system prompt.

This composability is powerful for team workflows. A codebase might define:

- A `code-reviewer` agent focused on correctness and style
- A `security-reviewer` agent trained on OWASP patterns
- An `Explore` agent optimized for fast read-only search
- A `docs-writer` agent that follows the team's documentation standards

Each agent type can be invoked programmatically, combined with structured output schemas, and orchestrated through workflows. The result is a reusable library of AI behaviors that travels with your repository — any team member who clones the repo gets the same agent definitions.

**What Codex offers instead.** Codex relies on repository-level configuration (similar to Claude Code's `CLAUDE.md`) to provide task context, and it uses the `AGENTS.md` convention for defining agent behavior. However, this is a single configuration layer — you cannot define multiple distinct agent types with different tool access or behavioral profiles within the same Codex setup. Every task runs as the same generalist agent.

Codex's strength here is simplicity. You don't need to design an agent architecture before getting value — just describe the task and let Codex figure out the approach. For teams that want AI assistance without the overhead of defining agent types, this lower friction matters.

## Workflow Orchestration: Detailed Analysis

Workflow orchestration determines how much control you have over multi-step, multi-agent processes. This is where Claude Code's programmability creates the widest gap.

**Claude Code Workflows** are JavaScript scripts that define deterministic control flow over non-deterministic agent calls. The key primitives are:

- `pipeline(items, ...stages)` — process items through sequential stages with no barrier between stages. Item A can be in stage 3 while item B is still in stage 1.
- `parallel(thunks)` — run tasks concurrently with a barrier, waiting for all to complete before returning results.
- `agent(prompt, opts)` — spawn a subagent with optional structured output, custom agent type, and worktree isolation.
- `phase(title)` — group agents under named phases for progress tracking.

These primitives compose into sophisticated patterns. A code review workflow might fan out reviewers across dimensions (bugs, performance, security), verify each finding adversarially with independent skeptics, dedup across all findings, and synthesize a final report — all expressed in ~30 lines of JavaScript. The workflow handles concurrency caps, error recovery (failed agents return `null`), and structured output validation automatically.

**Codex has no workflow equivalent.** Multi-step processes must be orchestrated externally — through CI/CD pipelines, shell scripts, or manual sequencing. If you want "analyze the codebase, then fix the top 5 issues, then write tests for the fixes," you run three separate Codex tasks sequentially, manually bridging the output of each into the input of the next.

For teams already embedded in CI/CD systems, this external orchestration may be acceptable. GitHub Actions or similar can trigger Codex tasks in sequence. But the cognitive overhead is higher — you're stitching together cloud API calls rather than writing a self-contained orchestration script.

## Execution Environment and Isolation

The execution model affects safety, reproducibility, and resource management for multi-agent workflows.

**Codex runs every task in an isolated cloud sandbox.** Each sandbox is a containerized environment with network restrictions — Codex cannot make arbitrary outbound requests during execution. This provides strong isolation by default: one task cannot interfere with another, and a rogue task cannot damage your local machine or access sensitive local files. The tradeoff is that Codex cannot interact with your local development environment — it works on a snapshot of your repository, not your live file system.

**Claude Code runs agents locally** with optional git worktree isolation. When you set `isolation: 'worktree'` on a subagent, Claude Code creates a temporary git worktree so the agent edits an isolated copy of the repository. This prevents parallel agents from creating conflicting file edits. Without worktree isolation, all agents share the same working directory — useful when agents need to see each other's changes, but risky if coordination isn't careful.

The local execution model means Claude Code agents can access your full development environment: local databases, running services, environment variables, and custom toolchains. This is both a strength (agents can run your actual test suite, hit your local API, inspect your running containers) and a responsibility (you must review agent actions before approving them).

For security-sensitive workflows, Codex's cloud sandbox provides stronger default isolation. For integration-heavy workflows where agents need real environment access, Claude Code's local execution is essential.

## When to Choose Codex Subagents

Choose Codex's multi-task approach when your workflow matches these patterns:

- **Independent, parallelizable tasks**: You have a backlog of bugs, feature requests, or refactoring jobs that don't depend on each other. Launch them all at once and review the resulting PRs.
- **Async review workflows**: You want to submit tasks before leaving your desk and review results later. Codex's cloud execution means tasks run without keeping your terminal open.
- **Minimal setup tolerance**: Your team wants multi-agent benefits without designing agent architectures, writing orchestration scripts, or managing local resource consumption.
- **Untrusted or experimental work**: The sandboxed execution model means a badly-prompted task cannot damage your local environment. Useful when experimenting with aggressive refactoring or unfamiliar codebases.
- **Open-source contributions**: With Codex [free for open-source maintainers](/blog/codex-for-open-source), it is a cost-effective way to parallelize maintenance work across multiple repos.

Codex is the right choice when you think of multi-agent as "batch processing" — many independent jobs running in parallel with human review at the end.

## When to Choose Claude Code Agent Teams

Choose Claude Code's agent teams and workflows when your needs go beyond independent task parallelism:

- **Multi-phase orchestration**: Your workflow has stages — analyze, then plan, then implement, then verify — where each stage depends on the previous stage's output. Claude Code's `pipeline()` and `parallel()` primitives express these dependencies directly.
- **Custom agent specialization**: You need different agents for different jobs — a security reviewer, a performance auditor, a documentation writer — each with distinct instructions and tool access. Claude Code's `.claude/agents/` directory makes this a first-class concept.
- **Structured output and data flow**: You need agents to return validated JSON objects that downstream code can process, filter, and route. Claude Code's `schema` option on `agent()` calls enforces output structure at the tool-call layer.
- **Adversarial verification**: You want to verify findings by spawning independent skeptics that attempt to refute each claim. This pattern — central to high-quality code review and security auditing — requires orchestration that Codex cannot express. See practical [subagent examples](/blog/claude-code-subagents-examples) for implementation patterns.
- **Integration with local tools**: Your workflow needs agents to interact with local databases, running services, or custom CLI tools that aren't available in a cloud sandbox.
- **Workflow reuse across repos**: Orchestration scripts and agent definitions live in your repository and travel with it. Any team member gets the same multi-agent capabilities on clone. Read about how Claude Code's [seven programmable layers](/blog/claude-code-seven-programmable-layers) compose for team-wide consistency.

Claude Code is the right choice when you think of multi-agent as "orchestrated collaboration" — agents with defined roles working together on a shared problem under programmatic coordination.

## Practical Setup: Codex Multi-Task Workflow

Setting up multi-task execution in Codex requires minimal configuration:

1. **Create an `AGENTS.md` file** in your repository root with project-specific instructions — coding standards, architecture notes, and task conventions. This is analogous to Claude Code's `CLAUDE.md`.
2. **Submit tasks** through the ChatGPT interface, Codex VS Code extension, or API. Each task description should be self-contained since tasks cannot reference each other.
3. **Queue parallel tasks** by submitting multiple tasks before the first one completes. Codex runs them concurrently in separate sandboxes.
4. **Review results** as PRs or diffs. Approve, request changes, or iterate on individual tasks independently.

There is no orchestration step because Codex does not support it — you manage task dependencies through your own review process.

## Practical Setup: Claude Code Agent Teams

Setting up multi-agent workflows in Claude Code involves several layers:

1. **Define custom agent types** in `.claude/agents/`. Each file is a markdown document with a system prompt that specializes the agent's behavior.
2. **Use the `Agent` tool** in conversation to spawn subagents for specific tasks. Specify `subagent_type` to load a custom agent definition.
3. **Write Workflow scripts** for repeatable multi-phase processes. Scripts use `agent()`, `pipeline()`, and `parallel()` to define orchestration patterns.
4. **Define structured output schemas** for agents that need to return machine-parseable results. The `schema` option validates output at the tool-call layer.
5. **Configure worktree isolation** for parallel agents that edit files, preventing conflicts.

The initial setup cost is higher, but the result is a reusable, version-controlled multi-agent system that any team member can invoke.

## Verdict

**For straightforward parallel task execution, choose Codex.** Its cloud sandbox model, async execution, and minimal setup make it ideal for teams that want to parallelize independent coding tasks without building orchestration infrastructure. If your multi-agent needs are "run N independent jobs and review N PRs," Codex delivers with less friction.

**For complex, multi-phase agent orchestration, choose Claude Code.** Its workflow system, custom agent types, structured output, and local execution model enable patterns that Codex cannot express — conditional fan-out, adversarial verification, cross-agent data flow, and specialized agent roles. If your multi-agent needs involve coordination, sequencing, or specialization, Claude Code is the only option with first-class support.

Many teams will benefit from both. Use Codex for batch processing independent tasks across repositories. Use Claude Code for orchestrated workflows within a single codebase where agent coordination matters. For a deeper look at how multi-agent patterns are evolving across tools, see our analysis of [agent harnesses in 2026](/blog/agent-harnesses-2026) and the broader [multi-agent workflow revolution](/blog/con-u-pour-des-workflows-multi-agents).

## Frequently Asked Questions

### Can Codex subagents communicate with each other during execution?

No. Each Codex task runs in an isolated cloud sandbox with no mechanism for inter-task communication. Tasks cannot share intermediate results, coordinate sequencing, or reference each other's output. If task B depends on task A's output, you must wait for A to complete, merge its changes, and then launch B against the updated repository.

### How many concurrent agents can Claude Code run in a workflow?

Claude Code caps concurrent agent execution at the lesser of 16 or your CPU core count minus 2. You can pass more items to `pipeline()` or `parallel()` — they queue and execute as slots free up. The total agent count per workflow lifetime is capped at 1,000, which serves as a runaway-loop backstop rather than a practical limit.

### Do I need a paid plan to use multi-agent features in Codex?

Codex is available on ChatGPT Pro and Team plans. OpenAI has also made Codex [free for open-source maintainers](/blog/codex-for-open-source) and offers [student credits](/blog/codex-for-students). The number of concurrent tasks you can run depends on your plan tier and current capacity.

### Can Claude Code custom agents use different models?

Yes. The `agent()` function in Claude Code workflows accepts a `model` parameter that overrides the default model for that specific subagent. This lets you assign heavier models to complex analysis tasks and lighter models to simple retrieval or formatting work within the same workflow.

---

*Want more AI insights? [Subscribe to LoreAI](/subscribe) for daily briefings.*