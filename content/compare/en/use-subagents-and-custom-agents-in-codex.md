---
title: "Codex Subagents vs Claude Code Custom Agents: Which Multi-Agent System Fits Your Workflow?"
slug: use-subagents-and-custom-agents-in-codex
description: "Compare subagents and custom agents in OpenAI Codex vs Claude Code. Architecture, configuration, and when to use each multi-agent system."
item_a: OpenAI Codex
item_b: Claude Code
category: tools
related_glossary: [agent-sdk, agentic-coding]
related_blog: [claude-code-subagents-examples, claude-code-agent-teams, codex-complete-guide, claude-code-extension-stack-skills-hooks-agents-mcp, con-u-pour-des-workflows-multi-agents]
related_compare: []
related_faq: []
related_topics: [codex]
lang: en
---

# Codex Subagents vs Claude Code Custom Agents: Which Multi-Agent System Fits Your Workflow?

**TL;DR:** Both OpenAI Codex and Claude Code support multi-agent workflows, but their architectures differ fundamentally. **Claude Code wins on real-time orchestration** — its Agent tool spawns typed subagents in your terminal with fine-grained control over isolation, schemas, and parallel execution. **Codex wins on async delegation** — its cloud-based sandbox model lets you fire off multiple independent tasks and review results later. Choose Claude Code for interactive, complex multi-step orchestration; choose Codex for batch-style, fire-and-forget task distribution.

## Overview: Subagents and Custom Agents in OpenAI Codex

**OpenAI Codex** is a cloud-based [agentic coding](/glossary/agentic-coding) platform that runs tasks in sandboxed environments. Rather than executing in your local terminal, Codex spins up isolated cloud containers where each agent operates independently — reading your repository, making changes, and returning results asynchronously.

Codex's approach to subagents revolves around its **custom agent configuration system**. You define agent personas through `AGENTS.md` files (analogous to Claude Code's `CLAUDE.md`) and configure specialized agents within the Codex interface or API. Each custom agent gets its own instruction set, model configuration, and scope constraints. When you submit a task, Codex routes it to the appropriate agent configuration and executes it in a fresh sandbox.

The key architectural decision: Codex agents are **stateless and cloud-isolated**. Each task runs in its own container with no shared memory between runs. This makes Codex agents naturally parallelizable but limits real-time coordination between agents working on related subtasks. For a [complete guide to Codex's architecture](/blog/codex-complete-guide), see our deep dive.

## Overview: Subagents and Custom Agents in Claude Code

**Claude Code** is Anthropic's terminal-based AI coding agent that runs directly in your development environment. Its multi-agent system is built around the **Agent tool** — a first-class primitive that spawns subagents within your active session, each with access to the full toolkit: file reads, edits, shell commands, MCP servers, and nested agent spawning.

Claude Code's custom agents are defined as `.md` files in `.claude/agents/`, each specifying a system prompt, available tools, and behavioral constraints. When you invoke the Agent tool, you select an agent type — `Explore` for read-only search, `Plan` for architecture design, `pipeline-reviewer` for domain-specific checks, or any custom type you've defined. These agents run in your local environment with real-time streaming output.

The architectural difference from Codex is stark: Claude Code agents are **stateful within a session and locally executed**. A parent agent can spawn children, wait for results, branch on outcomes, and orchestrate complex multi-phase workflows — all in a single interactive session. The [Claude Code extension stack](/blog/claude-code-extension-stack-skills-hooks-agents-mcp) — Skills, Hooks, Agents, and MCP — provides the programmable layers that make this orchestration possible.

## Feature Comparison

| Feature | OpenAI Codex | Claude Code | Winner |
|---------|-------------|-------------|--------|
| **Agent execution environment** | Cloud sandbox (isolated container) | Local terminal (shared session) | Depends on use case |
| **Custom agent definition** | AGENTS.md + UI configuration | `.claude/agents/*.md` files | Tie |
| **Parallel execution** | Native — each task gets its own container | Agent tool with `parallel()` and `pipeline()` | Tie |
| **Real-time orchestration** | Limited — async task submission | Full — parent-child agent coordination | Claude Code |
| **Agent isolation** | Always isolated (separate containers) | Optional via `isolation: "worktree"` | Codex |
| **Structured output** | JSON mode via API | Schema-validated `StructuredOutput` tool | Claude Code |
| **Max concurrent agents** | Platform-dependent (plan tier) | min(16, CPU cores - 2) per workflow | Codex |
| **Agent-to-agent communication** | Not supported (independent tasks) | Via `SendMessage` to named agents | Claude Code |
| **Workflow scripting** | Not available | JavaScript workflow scripts with `phase()`, `log()` | Claude Code |
| **Cost model** | Per-task token billing | Per-token within session | Tie |
| **IDE integration** | VS Code extension for task submission | Terminal-native, IDE extensions available | Tie |
| **Git integration** | Auto-creates branches and PRs per task | Full git access within agent session | Tie |

## Agent Configuration: Detailed Analysis

How you define and configure custom agents is where the two platforms diverge most sharply, and it's the decision that shapes your entire multi-agent workflow.

**Codex** uses a declarative configuration approach. You create an `AGENTS.md` file in your repository root that defines high-level instructions for the agent. Within the Codex platform, you can configure multiple agent presets — each with different system prompts, model selections, and repository access scopes. When you submit a task, you select which agent configuration to use. The agent then operates within those constraints in its cloud sandbox.

This declarative model has a clear advantage: **simplicity**. You don't need to understand orchestration primitives or write workflow scripts. Define the agent, submit the task, get the result. For teams that want to standardize how AI handles specific task types — bug fixes, test generation, documentation — Codex's preset system is straightforward to adopt.

**Claude Code** takes a programmatic approach. Custom agents are defined in `.claude/agents/` as markdown files with a specific structure: a description, tool allowlist, and system prompt. But the real power comes from how you invoke them. The Agent tool accepts parameters for model override, isolation mode, structured output schemas, and agent type selection. A [workflow script](/blog/claude-code-agent-teams) can spawn dozens of typed agents, route their outputs through pipeline stages, and synthesize results — all within deterministic control flow.

Here's what a Claude Code custom agent definition looks like in practice:

```markdown
# pipeline-reviewer

Reviews changes to pipeline scripts against the project's known-issues
registry to prevent re-introducing past bugs.

Tools: Read, Grep, Glob, Bash
```

And how you'd invoke it programmatically in a workflow:

```javascript
const review = await agent('Review the newsletter pipeline changes', {
  agentType: 'pipeline-reviewer',
  schema: REVIEW_SCHEMA,
  phase: 'Review'
});
```

The tradeoff is clear: Codex is easier to set up but less flexible. Claude Code requires more upfront configuration but gives you full programmatic control over agent behavior, composition, and orchestration.

For teams already invested in [Claude Code's seven programmable layers](/blog/claude-code-seven-programmable-layers), custom agents are a natural extension of the Skills and Hooks system. For teams that want multi-agent capabilities without learning an orchestration API, Codex's model is more accessible.

## Orchestration and Workflow Control: Detailed Analysis

The second critical differentiator is what happens when you need multiple agents to work together — not just in parallel, but in coordinated sequences where later steps depend on earlier results.

**Codex operates on a task-per-agent model.** You submit discrete tasks, each executing independently in its own sandbox. There's no built-in mechanism for Agent A to wait for Agent B's output, or for a parent orchestrator to route work based on intermediate results. If you need multi-step workflows, you build them outside Codex — typically in your CI pipeline or a custom script that submits sequential Codex tasks and stitches outputs together.

This constraint is by design. Codex's cloud sandbox model prioritizes **isolation and reproducibility** over orchestration flexibility. Every task runs in a clean environment, which means no state leakage between agents, no race conditions on shared files, and deterministic behavior regardless of what other agents are doing. For teams that need auditable, repeatable agent runs — compliance-sensitive environments, large-scale code migrations — this isolation is a feature, not a limitation.

**Claude Code provides full workflow orchestration** through its Workflow tool. You write JavaScript scripts that use `agent()`, `parallel()`, `pipeline()`, and `phase()` primitives to define complex multi-agent choreography. A workflow can:

- Fan out discovery agents across different subsystems
- Collect and deduplicate their findings
- Route each finding to a verification agent
- Synthesize verified results into a final report

The `pipeline()` primitive is particularly powerful for multi-agent work. Unlike `parallel()` which acts as a barrier (waiting for all agents to complete), `pipeline()` lets each item flow through stages independently — Agent A's findings can start verification while Agent B is still searching. This dramatically reduces wall-clock time for large-scale tasks.

Claude Code also supports **agent-to-agent communication** via `SendMessage`. A named agent can receive messages from the parent or from sibling agents mid-execution, enabling collaborative patterns that aren't possible in Codex's isolated model. Our coverage of [multi-agent workflow patterns](/blog/con-u-pour-des-workflows-multi-agents) explores these orchestration strategies in depth.

The practical implication: if your multi-agent needs are "run five independent code reviews in parallel," both tools work equally well. If your needs are "run a discovery phase, deduplicate across all finders, then verify each finding with three independent skeptics before synthesizing a report," Claude Code's orchestration primitives are purpose-built for that complexity.

## Isolation and Safety: Detailed Analysis

When agents modify code, isolation determines whether a mistake in one agent corrupts another's work. This is especially critical for multi-agent workflows where agents edit files concurrently.

**Codex provides isolation by default.** Every task runs in its own cloud container with a fresh checkout of your repository. Agents cannot interfere with each other because they literally cannot access each other's filesystems. When a task completes, Codex creates a branch and PR with the changes, giving you a clean review boundary. If an agent produces bad output, you reject the PR — no cleanup needed.

This default isolation comes with a cost: **no shared context.** If Agent A discovers something that Agent B needs to know, there's no way to communicate that within the Codex platform. You'd need to build external coordination, such as having Agent A write its findings to a file that Agent B's task description references.

**Claude Code runs agents in your local environment by default**, which means agents share the filesystem. Two agents editing the same file simultaneously will conflict. Claude Code addresses this with the `isolation: "worktree"` option, which creates a temporary git worktree for the agent — an isolated copy of the repo that's automatically cleaned up if unchanged.

```javascript
const results = await parallel([
  () => agent('Refactor auth module', { isolation: 'worktree' }),
  () => agent('Refactor payments module', { isolation: 'worktree' }),
  () => agent('Refactor notifications module', { isolation: 'worktree' }),
]);
```

The worktree approach gives you **opt-in isolation** — you choose which agents need it based on whether they'll modify overlapping files. Read-only agents (like the `Explore` type) don't need isolation at all, saving the ~200-500ms setup cost per worktree.

For security-sensitive workflows, Codex's cloud sandbox is inherently more restrictive — agents can't access your local filesystem, environment variables, or running services. Claude Code agents have full shell access by default, controlled by user-approved permission modes. Teams with strict security requirements may prefer Codex's sandboxed model for that reason alone.

## Developer Experience and Learning Curve

**Codex** optimizes for a low barrier to entry. You open the Codex interface (web or VS Code extension), describe a task in natural language, and submit it. No configuration files, no workflow scripts, no agent type definitions. For a team adopting multi-agent AI coding for the first time, Codex gets you from zero to productive in minutes.

The [Codex VS Code extension](/blog/codex-vscode) further lowers the barrier — you can submit tasks directly from your editor without context-switching to a separate platform. The async model also fits naturally into existing PR-based workflows: Codex creates a branch, you review the PR, merge or reject.

**Claude Code** has a steeper learning curve but rewards investment with deeper capability. Setting up custom agents requires creating markdown files with specific structures. Writing workflows requires JavaScript fluency and understanding of concurrency primitives. The [Skills system](/blog/5-claude-code-skills-i-use-every-single-day) adds another layer of configuration that, while powerful, takes time to master.

That said, Claude Code's interactive model provides faster feedback loops for iterative work. You see agent output streaming in real-time, can interrupt and redirect mid-task, and can inspect intermediate results before committing to the next step. Codex's async model means you wait for the full result before knowing whether the approach was right — leading to more round-trips for complex tasks.

For a practical breakdown of how to compose agents, skills, hooks, and MCP into a coherent development platform, see our analysis of [Claude Code's extension stack architecture](/blog/claude-code-extension-stack-skills-hooks-agents-mcp).

## Practical Examples: Subagent Patterns in Each Tool

### Pattern 1: Parallel Code Review

**In Codex:** Submit three separate tasks — "Review auth module for security issues," "Review auth module for performance issues," "Review auth module for test coverage gaps." Each runs independently in its own sandbox. Collect the three PR comments manually or via the Codex API.

**In Claude Code:** Define a workflow that fans out three review agents with different prompts, collects structured findings, deduplicates by file and line number, and synthesizes a single report. The entire flow executes in one session with real-time progress tracking.

### Pattern 2: Multi-File Refactoring

**In Codex:** Submit a single task with detailed instructions covering all files to modify. The agent works in one sandbox and produces a single PR. For very large refactors, split into multiple tasks by module and submit concurrently.

**In Claude Code:** Use `pipeline()` to process each module through a refactor agent, optionally with `isolation: "worktree"` for concurrent file modifications. A verification agent checks each refactored module before changes are merged back. See [practical subagent examples](/blog/claude-code-subagents-examples) for real-world patterns.

### Pattern 3: Custom Domain Agents

**In Codex:** Configure a custom agent preset with domain-specific instructions — "You are a database migration specialist. Always check for backward compatibility. Never drop columns without a deprecation period." Apply this preset when submitting migration tasks.

**In Claude Code:** Create a `.claude/agents/migration-reviewer.md` file with the same instructions plus a tool allowlist (e.g., only `Read`, `Bash`, `Grep` — no `Edit` or `Write`). Invoke it from workflows or manually with `Agent({ subagent_type: 'migration-reviewer' })`. The agent inherits the session's MCP connections, giving it access to database tools if configured.

## When to Choose Codex Subagents

Pick Codex's multi-agent model when your workflow matches these patterns:

- **Batch task processing**: You have a queue of independent tasks (bug fixes, feature implementations, documentation updates) that don't need to coordinate. Codex excels at processing these in parallel cloud sandboxes with automatic PR creation for each.
- **Team-wide standardization**: You want every engineer to use the same agent configurations without requiring them to learn orchestration APIs. Codex's preset system and AGENTS.md files make this straightforward.
- **Compliance and auditability**: Each task runs in an isolated, reproducible environment with a clean PR trail. No shared state means no side-channel interference between agent runs.
- **Async workflows**: Your team operates asynchronously — submit tasks before leaving for the day, review results in the morning. Codex's cloud model supports this naturally. The [Codex for students](/blog/codex-for-students) program makes this accessible for learning contexts as well.

Codex is also the better choice if your primary multi-agent need is simply running more tasks concurrently rather than orchestrating complex inter-agent workflows. Its cloud infrastructure handles scaling without you managing local compute resources.

## When to Choose Claude Code Custom Agents

Pick Claude Code's multi-agent system when your workflow requires:

- **Coordinated multi-phase work**: Discovery → analysis → verification → synthesis pipelines where each phase depends on the previous one's output. Claude Code's workflow primitives handle this natively.
- **Real-time interaction**: You need to see agent progress, redirect mid-task, or inject human judgment between phases. Claude Code's streaming model and `SendMessage` support this.
- **Deep customization**: You want agents with specific tool allowlists, structured output schemas, model overrides, and isolation controls. Claude Code's Agent tool exposes all these parameters.
- **Existing Claude Code investment**: If your team already uses CLAUDE.md, Skills, and Hooks, custom agents and workflows compose naturally with the existing stack. The nine principles for writing effective skills apply equally to agent definitions.
- **Local-first development**: You want agents operating in your actual development environment with access to local services, databases, and tools — not a cloud sandbox with a snapshot of your repo.

Claude Code is the stronger choice for teams building repeatable, complex [agent harnesses](/blog/agent-harnesses-2026) that go beyond single-task execution. If you're thinking about multi-agent workflows as infrastructure rather than ad-hoc task delegation, Claude Code's programmable layers give you the building blocks.

## Verdict

**For simple multi-agent needs — running independent tasks in parallel — Codex and Claude Code are roughly equivalent.** Both support concurrent agent execution, custom instructions, and structured output. Codex's cloud sandbox model gives you isolation and auditability by default, while Claude Code's local execution gives you faster feedback loops and richer context.

**For complex multi-agent orchestration — coordinated pipelines, conditional routing, adversarial verification, inter-agent communication — Claude Code is the clear winner.** Its Workflow tool, Agent primitives, and custom agent type system provide a level of programmatic control that Codex's async task model doesn't attempt to match.

The practical recommendation: **start with Codex** if your team is new to multi-agent AI coding and wants to get value quickly from parallel task execution. **Graduate to Claude Code's agent system** when you find yourself building external scripts to coordinate Codex tasks — that's the signal that you need orchestration primitives, not just concurrent sandboxes. Many teams end up using both: Codex for batch task processing, Claude Code for interactive orchestration and complex workflows.

## Frequently Asked Questions

### Can Codex subagents communicate with each other during execution?

No. Each Codex task runs in an isolated cloud sandbox with no mechanism for inter-agent communication. If Agent A needs to pass information to Agent B, you must build that coordination externally — typically by having Agent A write results to a file and including that context in Agent B's task description. Claude Code supports direct inter-agent messaging via `SendMessage` to named agents within a session.

### How many custom agents can I define in Claude Code?

There is no hard limit on the number of custom agent types you can define in `.claude/agents/`. Each `.md` file in that directory becomes an available agent type. The practical constraint is the concurrent agent cap: `min(16, CPU cores - 2)` agents can execute simultaneously within a single workflow, with excess calls queued automatically. Total agent count per workflow lifetime is capped at 1,000.

### Is Codex or Claude Code better for large-scale code migrations?

Both can handle migrations, but through different strategies. Codex works well for migrations where each file or module can be transformed independently — submit one task per module and process concurrently in cloud sandboxes. Claude Code is better when migration steps have dependencies — for example, updating an interface definition first, then updating all implementations based on the new interface. Its `pipeline()` primitive handles these sequential-with-fan-out patterns natively.

### Do I need to pay separately for subagent usage in either tool?

Both tools bill subagent usage as standard token consumption. In Codex, each task consumes tokens based on the model used and context processed — there's no separate "subagent surcharge." In Claude Code, spawned agents consume tokens from the same session budget. The cost difference comes from execution model: Codex's cloud sandboxes may have additional compute costs depending on your plan tier, while Claude Code agents run on your local machine at no extra compute cost beyond API tokens.

---

*Want more AI insights? [Subscribe to LoreAI](/subscribe) for daily briefings.*