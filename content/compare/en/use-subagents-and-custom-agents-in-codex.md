---
title: "Subagents in Codex vs Claude Code: Which Multi-Agent System Fits Your Workflow?"
slug: use-subagents-and-custom-agents-in-codex
description: "Compare subagent and custom agent capabilities in OpenAI Codex vs Claude Code — architecture, configuration, and practical multi-agent workflows."
item_a: OpenAI Codex
item_b: Claude Code
category: tools
related_glossary: [agent-sdk, agentic-coding]
related_blog: [claude-code-subagents-examples, claude-code-agent-teams, codex-complete-guide, claude-code-extension-stack-skills-hooks-agents-mcp, agent-harnesses-2026]
related_compare: []
related_topics: [codex]
lang: en
---

# Subagents in Codex vs Claude Code: Which Multi-Agent System Fits Your Workflow?

**TL;DR:** Both **OpenAI Codex** and **Claude Code** support multi-agent workflows, but they approach the problem from opposite directions. **Claude Code wins on local configurability** — custom agent types defined in `.claude/agents/` Markdown files, deterministic workflow scripts, and worktree isolation for parallel edits. **Codex wins on cloud-native parallelism** — every task runs in a sandboxed cloud environment, making it natural to fire off multiple independent coding jobs without local resource constraints. Choose Claude Code if you want fine-grained control over agent behavior; choose Codex if you want fire-and-forget parallel tasks in the cloud.

## Overview: OpenAI Codex

**OpenAI Codex** is a cloud-based [agentic coding](/glossary/agentic-coding) tool that runs each task in an isolated sandbox environment. When you submit a task to Codex, it spins up a containerized environment with your repository, executes the work asynchronously, and returns a diff or pull request when done. This architecture naturally supports parallelism — you can submit multiple tasks simultaneously and each runs independently in its own sandbox.

Codex's multi-agent capability is implicit rather than explicit. Rather than defining named "subagent" types, you launch multiple Codex tasks that run concurrently. Each task gets its own environment, its own copy of the repository, and its own execution context. The [Codex VS Code extension](/blog/codex-vscode) makes this workflow accessible directly from your editor, while the ChatGPT interface lets you queue tasks conversationally. For a full breakdown of Codex's architecture, see our [Codex complete guide](/blog/codex-complete-guide).

## Overview: Claude Code

**Claude Code** is Anthropic's terminal-based AI coding agent with a deeply configurable multi-agent system. Unlike Codex's implicit parallelism, Claude Code provides explicit primitives for defining, spawning, and orchestrating subagents. You create custom agent types as Markdown files in `.claude/agents/`, each with its own system prompt, tool access permissions, and model configuration. The `Agent` tool spawns these subagents, while the `Workflow` tool orchestrates deterministic multi-agent pipelines with fan-out, barriers, and structured output.

This architecture lets teams encode specialized agent behaviors — a `pipeline-reviewer` agent that checks changes against known issues, an `Explore` agent optimized for fast read-only search, a `Plan` agent for architecture design — and invoke them by name. Claude Code's [extension stack](/blog/claude-code-extension-stack-skills-hooks-agents-mcp) treats agents as one programmable layer alongside skills, hooks, and MCP servers, forming a composable platform rather than a monolithic tool.

## Feature Comparison

| Feature | OpenAI Codex | Claude Code | Winner |
|---------|-------------|-------------|--------|
| **Agent definition** | Implicit (multiple tasks) | Explicit (`.claude/agents/*.md` files) | Claude Code |
| **Execution environment** | Cloud sandbox per task | Local terminal + optional worktrees | Codex |
| **Parallelism model** | Fire multiple cloud tasks | `parallel()` / `pipeline()` in Workflow scripts | Tie |
| **Custom agent types** | Limited — task-level instructions | Full — Markdown files with frontmatter config | Claude Code |
| **Orchestration** | Manual (submit multiple tasks) | Deterministic scripts with `phase()`, `agent()`, `pipeline()` | Claude Code |
| **Tool access control** | Sandbox-scoped | Per-agent-type tool allowlists | Claude Code |
| **Model selection** | Codex model (fixed) | Per-agent model override (Opus, Sonnet, Haiku) | Claude Code |
| **Isolation** | Full (cloud container) | Optional (`isolation: "worktree"`) | Codex |
| **Resource constraints** | Cloud-managed | Local CPU/memory, capped concurrency | Codex |
| **Setup complexity** | Near-zero (cloud-native) | Requires agent file authoring | Codex |

## Custom Agent Configuration: Detailed Analysis

The biggest architectural difference between these tools is how you define and configure agent behavior. This matters because multi-agent systems are only useful if each agent can be specialized for its role.

**Codex** keeps configuration minimal. You write a task description, optionally attach context or instructions, and Codex figures out the rest. There's no persistent "agent type" concept — each task is a one-off. This simplicity is a feature for teams that want to submit ad-hoc parallel tasks without maintaining configuration files. The tradeoff: you can't encode reusable agent behaviors that travel with your repository. Every task starts from a generic baseline.

**Claude Code** takes the opposite approach. A custom agent is a Markdown file with YAML frontmatter specifying the agent's name, model, tools, and system prompt. For example, a `pipeline-reviewer` agent might have access only to `Read`, `Grep`, and `Bash` tools, use the Sonnet model for cost efficiency, and carry a system prompt that cross-references a known-issues registry. Teams check these files into version control, so agent definitions are reviewed, versioned, and shared like any other code artifact.

The practical impact: Claude Code teams build libraries of [specialized agents](/blog/claude-code-subagents-examples) — code reviewers, test generators, documentation writers, security scanners — each tuned for its task. Codex teams rely on prompt engineering at task submission time, which is faster to start but harder to standardize across a team.

## Orchestration and Workflow Control: Detailed Analysis

Multi-agent systems need coordination. Running five agents in parallel is easy; making their outputs feed into each other, deduplicating results, and handling failures gracefully is hard.

**Codex** has no built-in orchestration layer. You submit tasks independently and collect results when they complete. If Task B depends on Task A's output, you wait for Task A, review the result, then manually submit Task B. This works for embarrassingly parallel workloads — "fix these five independent bugs" — but breaks down for pipelines where stages depend on each other.

**Claude Code** provides the `Workflow` tool: a JavaScript-based orchestration engine that supports `pipeline()` for streaming multi-stage work, `parallel()` for barrier-synchronized fan-out, `phase()` for progress tracking, and structured output schemas for type-safe inter-agent communication. A workflow script can fan out ten code reviewers, collect their findings, deduplicate across results, then fan out verifiers — all in a single deterministic script. The [agent harness pattern](/blog/agent-harnesses-2026) that Claude Code implements is becoming an industry standard for managing long-running agent workflows.

Claude Code also supports `isolation: "worktree"` on individual agent calls, creating a temporary git worktree so agents can edit files in parallel without conflicting. This bridges the gap between Codex's full cloud isolation and local execution — you get parallel file mutations without cloud infrastructure costs.

## Practical Multi-Agent Patterns

Both tools support multi-agent patterns, but the idioms differ significantly.

**In Codex**, a typical multi-agent workflow looks like this: open the Codex interface, describe three independent tasks ("add input validation to the signup form," "write unit tests for the payment module," "update the README with new API endpoints"), submit all three, and wait for diffs. Each task produces a separate PR or commit. You review and merge independently. This pattern works well for teams managing backlogs of independent issues.

**In Claude Code**, the equivalent might use the [Agent Teams](/blog/claude-code-agent-teams) pattern: spawn a `general-purpose` subagent for each task within a single session, or author a Workflow script that pipelines the work. A more sophisticated pattern uses specialized agent types — send the validation task to a `security-reviewer` agent, the tests to a `test-writer` agent, and the docs to a `docs-updater` agent — each carrying domain-specific instructions. Results flow back into the parent context for synthesis.

The key difference: Codex treats agents as isolated workers producing independent outputs. Claude Code treats agents as collaborators within a single orchestrated session, where one agent's output can directly inform another's input.

## When to Choose OpenAI Codex

**Codex is the better choice when:**

- You want to submit multiple independent tasks and walk away — Codex's cloud sandbox model means no local resource usage and no babysitting
- Your team prefers a low-configuration setup — no agent files to author or maintain
- Tasks are naturally independent: separate bugs, separate features, separate repos
- You need full environment isolation (specific dependencies, OS-level requirements) that cloud containers provide automatically
- You're already in the [ChatGPT or VS Code](/blog/codex-vscode) ecosystem and want multi-agent workflows without switching tools

Codex excels as a task queue for engineering teams. Submit ten issues in the morning, review ten PRs in the afternoon. The cloud-native architecture means your laptop stays free for other work.

## When to Choose Claude Code

**Claude Code is the better choice when:**

- You need agents that follow project-specific conventions — custom agent types encode institutional knowledge in version-controlled Markdown files
- Your workflow has dependencies between stages — Workflow scripts handle fan-out, barriers, and inter-agent data flow
- You want per-agent model selection — use Opus for complex architecture decisions, Haiku for fast mechanical tasks, Sonnet for the middle ground
- You need agents with restricted tool access — a review agent that can only read, not write, prevents accidental mutations
- You're building reusable multi-agent pipelines that run repeatedly (CI integration, scheduled reviews, content pipelines)

Claude Code's [seven programmable layers](/blog/claude-code-seven-programmable-layers) — from CLAUDE.md project context through skills, hooks, agents, MCP servers, and workflows — create a platform where multi-agent orchestration is a first-class feature rather than an emergent property of parallel task submission.

## Verdict

**For ad-hoc parallel task execution, choose Codex.** Its cloud sandbox model makes it trivial to fire off independent coding tasks without configuration overhead. You don't need to define agent types, write orchestration scripts, or manage local resources.

**For orchestrated multi-agent workflows with specialized roles, choose Claude Code.** The `.claude/agents/` system, Workflow scripts, and per-agent configuration give you the control needed to build reliable, repeatable multi-agent pipelines. If your use case involves agents that need to communicate, share context, or follow project-specific rules, Claude Code's explicit agent architecture is significantly more capable.

For teams using both tools: delegate independent, self-contained tasks to Codex and use Claude Code for complex, multi-stage workflows where agent specialization and orchestration matter. See our [subagents examples guide](/blog/claude-code-subagents-examples) for practical patterns you can adopt today.

## Frequently Asked Questions

### Can Codex run custom agents with specific instructions?

Codex supports task-level instructions and context attachments, but does not have a persistent "agent type" system. Each task starts from a generic baseline with your repository context. You can include detailed instructions in the task description, but these aren't reusable or version-controlled like Claude Code's `.claude/agents/*.md` files.

### How many subagents can Claude Code run in parallel?

Claude Code caps concurrent agent execution at the lesser of 16 or your CPU core count minus two. You can pass hundreds of items to `parallel()` or `pipeline()` and they all complete — the runtime queues excess agents and runs them as slots free. Total agent count per workflow is capped at 1,000.

### Do Codex subagents share context with each other?

No. Each Codex task runs in its own isolated sandbox with a fresh copy of the repository. There is no built-in mechanism for one task to access another task's working state. Claude Code subagents, by contrast, can return structured data to the parent context, which then passes relevant information to downstream agents.

### Which tool is cheaper for multi-agent workloads?

Codex uses OpenAI's usage-based pricing with tasks running on cloud infrastructure. Claude Code runs locally with API-based token billing per agent call. For high-volume parallel work, Codex's cloud compute adds cost beyond token pricing. For orchestrated workflows where agents share context, Claude Code avoids redundant context loading. The cost comparison depends on your workload shape — independent parallel tasks may favor Codex's pricing; multi-stage pipelines with shared context typically favor Claude Code.

---

*Want more AI insights? [Subscribe to LoreAI](/subscribe) for daily briefings.*