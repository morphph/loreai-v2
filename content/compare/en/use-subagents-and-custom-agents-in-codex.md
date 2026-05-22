---
title: "Claude Code Subagents vs Codex Custom Agents: Which Multi-Agent Approach Wins?"
slug: use-subagents-and-custom-agents-in-codex
description: "Compare subagents and custom agents in Codex vs Claude Code. Architecture, workflows, and which multi-agent approach fits your team."
item_a: Claude Code Subagents
item_b: Codex Custom Agents
category: tools
related_glossary: [agent-sdk, agentic-coding]
related_blog: [claude-code-subagents-examples, codex-complete-guide, claude-code-agent-teams]
related_compare: []
related_faq: []
related_topics: [codex]
lang: en
---

<!--
Pre-Draft Planning:
1. Target keyword: use subagents and custom agents in codex
2. Page type: compare
3. Keyword intent: commercial — developers evaluating which multi-agent platform to adopt
4. Likely official-doc competitor: OpenAI Codex docs on agent configuration; Anthropic Claude Code docs on agent teams
5. Likely non-official competitor pattern: thin "Codex vs Claude Code" listicles that compare surface features without explaining the agent architecture differences
6. LoreAI standout angle: We break down the actual multi-agent execution models — how subagents spawn, what custom agents can configure, where each approach fails — and give a concrete recommendation by team type and project scale
-->

# Claude Code Subagents vs Codex Custom Agents: Which Multi-Agent Approach Wins?

**TL;DR:** **Claude Code subagents** win for real-time, interactive multi-agent workflows where you need parallel task execution inside a single coding session. **Codex custom agents** win for asynchronous, batch-style work where you define agent behavior upfront and let it run in a cloud sandbox. Choose Claude Code if you want fine-grained control mid-task; choose Codex if you want fire-and-forget delegation.

If you want to **use subagents and custom agents in Codex** or Claude Code effectively, the decision comes down to how your team works: synchronous terminal sessions or asynchronous cloud tasks. Both platforms have invested heavily in multi-agent capabilities, but they've taken fundamentally different architectural paths. This guide breaks down the execution models, configuration surfaces, and real-world tradeoffs so you can pick the right tool — or combine both.

## Overview: Claude Code Subagents

Claude Code's subagent system lets a primary agent spawn specialized child agents that work in parallel during a single coding session. Each subagent gets its own context window and toolset, operating as an independent worker that reports results back to the orchestrating agent.

The architecture is built around [agent teams](/blog/claude-code-agent-teams) — a feature that became central to Claude Code's approach to large-scale refactoring and multi-file tasks. When you give Claude Code a complex instruction like "refactor the auth module, update all imports, and fix the tests," the primary agent can spawn an Explore agent to locate files, a Plan agent to design the approach, and worker agents to execute changes in parallel across different parts of the codebase.

Subagents are typed. Claude Code ships with built-in agent types — Explore for read-only search, Plan for architecture design, code-reviewer for quality checks, and general-purpose for catch-all tasks. You can also define custom agents via `.claude/agents/` files in your repo, giving them specific instructions, tool access, and behavioral constraints. This means the multi-agent system is both opinionated out of the box and extensible for team-specific workflows.

The key constraint: Claude Code subagents run locally. They share your machine's resources, your shell environment, and your file system. This makes them fast and deeply integrated but limits horizontal scaling.

## Overview: Codex Custom Agents

[OpenAI's Codex](/blog/codex-complete-guide) takes a different approach to multi-agent work. Rather than spawning subagents within a live session, Codex runs each task as an isolated agent in a cloud sandbox. Custom agents in Codex are configured through the ChatGPT interface or API, where you define the agent's instructions, environment setup, and repository access before dispatching it.

Codex custom agents execute asynchronously. You submit a task — "add input validation to all API endpoints" — and Codex spins up a sandboxed environment with your repo cloned, dependencies installed, and the agent running independently. It produces a pull request or diff when finished, which you review after the fact. This is fundamentally different from Claude Code's interactive model.

The customization surface in Codex centers on system instructions and environment configuration. You can specify which files the agent should focus on, what coding conventions to follow, and how to handle testing. The [Codex VS Code extension](/blog/codex-vscode) adds a tighter feedback loop, letting you dispatch tasks from your editor and review results inline, but the execution still happens in the cloud.

Codex's strength is parallelism at the task level. You can dispatch multiple independent agents simultaneously — one fixing bugs, another writing tests, a third updating documentation — each running in its own sandbox without resource contention.

## Feature Comparison

| Feature | Claude Code Subagents | Codex Custom Agents | Winner |
|---------|----------------------|---------------------|--------|
| **Execution model** | Local, synchronous, interactive | Cloud, asynchronous, fire-and-forget | Depends on workflow |
| **Agent spawning** | Dynamic — primary agent spawns as needed | Manual — user dispatches each task | Claude Code |
| **Built-in agent types** | Explore, Plan, code-reviewer, general-purpose | Single general-purpose type with custom instructions | Claude Code |
| **Custom agent definition** | `.claude/agents/` files in repo | System instructions via UI or API | Tie |
| **Parallel execution** | Shares local resources (CPU, memory) | Independent cloud sandboxes | Codex |
| **Context sharing** | Subagents inherit project context via CLAUDE.md | Each agent gets fresh repo clone | Claude Code |
| **Git integration** | Direct — stages, commits, pushes in real-time | Produces PRs for review after completion | Tie |
| **Cost model** | Token-based API billing (per agent) | Included in ChatGPT Pro/Team subscription | Codex |
| **Isolation** | Optional git worktree isolation | Full sandbox isolation by default | Codex |
| **Iteration speed** | Real-time feedback, mid-task correction | Review after completion, re-dispatch if wrong | Claude Code |

## Use Subagents and Custom Agents in Codex: The Execution Model Difference

The most important distinction between these platforms is not feature lists — it is how agents execute. Claude Code subagents and Codex custom agents represent two fundamentally different philosophies about how AI should collaborate with developers, and choosing the wrong model for your workflow creates friction that no configuration can fix.

**Claude Code's synchronous model** means you are in the loop. When the primary agent spawns an Explore subagent to search your codebase, it waits for results and adapts its plan in real-time. If the Explore agent finds an unexpected dependency, the primary agent can change course immediately — spawning a different worker, asking you for clarification, or revising its approach. This creates a tight feedback loop where the agent's behavior evolves during execution.

The [Claude Code extension stack](/blog/claude-code-extension-stack-skills-hooks-agents-mcp) makes this even more powerful. Subagents respect the same CLAUDE.md instructions, skill files, hooks, and MCP server connections as the primary agent. A subagent spawned to review code follows your team's review checklist. A subagent writing tests follows your testing conventions. There's no configuration drift between agents because they share the same project context layer.

**Codex's asynchronous model** optimizes for throughput over interaction. Each agent runs independently in a clean sandbox, which means you can dispatch five tasks and come back to five pull requests. The tradeoff is that each agent works in isolation — it cannot ask you questions mid-task, cannot coordinate with other running agents, and cannot adapt if it discovers something unexpected. If the agent goes down the wrong path, you find out when you review the output.

This distinction matters most for exploratory work. If you're not sure exactly what needs to change — debugging a subtle issue, refactoring code where the scope isn't clear, or working through a design decision — Claude Code's interactive subagents let the AI collaborate with you in real-time. If you know exactly what you want and can specify it upfront, Codex's fire-and-forget model saves you from sitting in a terminal watching agents work.

## Agent Configuration and Customization: Depth vs Simplicity

Both platforms let you customize agent behavior, but the configuration surfaces differ significantly in depth and complexity. This is where team size and engineering culture become deciding factors.

**Claude Code custom agents** are defined as markdown files in `.claude/agents/` within your repository. Each file specifies the agent's name, description, available tools, and behavioral instructions. Because these files live in your repo, they're version-controlled, reviewed in PRs, and shared across the team automatically. You can reference [skill files](/blog/claude-code-subagents-examples) to compose agent behavior from reusable instruction modules.

A Claude Code custom agent definition might specify that a `pipeline-reviewer` agent should only have read access (no Edit or Write tools), should always check against a known-issues registry, and should format output as a checklist. This level of tool-access control lets you create agents that are genuinely constrained — not just instructed to behave a certain way, but architecturally limited in what they can do.

The tradeoff is complexity. Defining effective custom agents requires understanding Claude Code's tool system, context propagation model, and agent type hierarchy. There's a learning curve, and poorly configured agents can be worse than no agents at all.

**Codex custom agents** are simpler to configure. You write system instructions in natural language — "Follow the Google TypeScript style guide, always add unit tests for new functions, focus on the src/api/ directory" — and Codex applies them to the agent's behavior. The configuration happens through the ChatGPT UI or API, which is more accessible but less powerful.

Codex doesn't offer tool-level access control for custom agents. You can't restrict an agent to read-only mode or prevent it from modifying certain files at the platform level. The agent's behavior is guided by instructions rather than enforced by architecture. For teams that need strict guardrails — compliance-sensitive codebases, monorepos with protected paths — this is a real limitation.

Where Codex excels is onboarding speed. A developer can configure a custom agent in minutes through the UI without learning a configuration format or committing files to the repo. For smaller teams or individual developers, this accessibility advantage is significant.

## Parallel Execution and Scaling

Parallel execution is where the architectural differences between these platforms become most visible in daily use. Both support running multiple agents simultaneously, but the constraints and performance characteristics differ substantially.

**Claude Code subagents** run on your local machine. When the primary agent spawns three worker agents to edit different parts of your codebase, they share your CPU, memory, and file system. Claude Code mitigates file conflicts through git worktree isolation — each subagent can operate on an isolated copy of the repo — but the resource ceiling is your local hardware. On a powerful development machine, this works well for 3-5 parallel agents. Beyond that, you'll hit context window limits and resource contention.

The upside is speed. Local execution means no network latency, no waiting for cloud environments to spin up, and no cold starts. A subagent spawned to search your codebase returns results in seconds because it's reading files directly from disk.

**Codex custom agents** run in independent cloud sandboxes. Each agent gets its own compute resources, its own clone of the repo, and its own isolated environment. You can dispatch ten agents simultaneously without worrying about local resource limits. Each sandbox sets up the environment from scratch — cloning the repo, installing dependencies, configuring tools — which adds startup latency but guarantees clean isolation.

The practical limit for Codex parallelism is your subscription tier and queue priority, not your hardware. During peak hours, agents may queue before execution starts. During off-peak hours, you can run many agents simultaneously with minimal wait.

For [agentic coding](/glossary/agentic-coding) workflows that involve large-scale changes — migrating a codebase from one framework to another, adding tests across dozens of modules, or applying a code style change across hundreds of files — Codex's cloud-based parallelism is the stronger approach. For focused, interactive sessions where you need 2-3 agents collaborating on a single coherent task, Claude Code's local subagents are faster and more coordinated.

## Context and Knowledge Sharing Between Agents

How agents share knowledge about your codebase directly affects output quality. An agent that understands your project conventions produces better code than one working from a generic system prompt.

**Claude Code's context model** is hierarchical and persistent. The primary agent loads your CLAUDE.md file, skill definitions, and project context at session start. When it spawns a subagent, that subagent inherits the project context automatically. A custom agent defined in `.claude/agents/` can reference additional skill files, adding layer-specific knowledge. This means every agent in a Claude Code session understands your coding standards, architecture decisions, and naming conventions without you repeating them.

The [Agent SDK](/glossary/agent-sdk) underlying Claude Code's multi-agent system handles context propagation transparently. When a primary agent briefs a subagent, it includes relevant findings from earlier in the session — files already read, decisions already made, constraints already discovered. This prevents subagents from duplicating work or contradicting earlier decisions.

**Codex's context model** is task-scoped. Each agent starts fresh with the repo clone and the system instructions you provided. There's no automatic knowledge sharing between simultaneously running agents. If Agent A discovers that a dependency is pinned to a specific version, Agent B working on a related task won't know unless you included that information in the instructions.

This makes Codex agents more predictable — each one operates from a clean, known state — but less adaptive. For tasks that are truly independent (add tests to module A, fix a bug in module B), the isolation is fine. For tasks that interact (refactor the data layer, then update the API endpoints that depend on it), the lack of inter-agent communication means you need to sequence tasks manually rather than running them in parallel.

## When to Choose Claude Code Subagents

Choose Claude Code's subagent system when your work requires real-time collaboration between you and the AI, or between multiple AI agents working on related parts of a task.

**Best scenarios for Claude Code subagents:**

- **Complex refactoring** where the scope isn't fully known upfront. The primary agent can explore, plan, and delegate dynamically as it discovers the true scope of changes.
- **Interactive debugging** where you need agents to investigate, report findings, and adjust the debugging strategy in real-time based on what they discover.
- **Tightly coupled changes** that span multiple files but need to be coordinated — renaming a core interface and updating every consumer, for example.
- **Team workflows** where custom agents are version-controlled and code-reviewed alongside the codebase. The `.claude/agents/` system integrates agent definitions into your existing development process.
- **Sessions where you want to stay in control**. Claude Code's synchronous model means you can redirect, cancel, or refine agent behavior at any point during execution.

If you're already using Claude Code for daily development, subagents are a natural extension. The [complete guide to Claude Code](/blog/claude-code-complete-guide) covers how agent teams fit into broader workflows. For practical examples of subagent patterns, see our [Claude Code subagents examples](/blog/claude-code-subagents-examples).

## When to Choose Codex Custom Agents

Choose Codex when your tasks are well-defined, independent, and benefit from asynchronous execution. Codex's strength is turning a backlog of coding tasks into a queue of pull requests.

**Best scenarios for Codex custom agents:**

- **Batch task processing** — you have 15 modules that need the same kind of update (add error handling, add tests, update imports). Dispatch 15 agents and review 15 PRs.
- **Overnight work queues** — submit tasks at end of day, review results the next morning. Codex runs while you sleep.
- **Teams with mixed skill levels**. Codex's UI-based configuration is more accessible than Claude Code's file-based agent definitions. Junior developers can dispatch tasks without learning a configuration format.
- **Large-scale codebase sweeps** where you need more parallel capacity than a single machine provides. Codex's cloud sandboxes scale horizontally without local resource constraints.
- **Isolated, well-scoped tasks** where each task has clear inputs and expected outputs — the kind of work where you'd write a detailed ticket before handing it to a human developer.

The [Codex for open source](/blog/codex-for-open-source) program demonstrates this model well — maintainers dispatch agents to handle issue triage, documentation updates, and dependency bumps across repos they maintain.

## Verdict

**For interactive, exploratory development sessions: choose Claude Code subagents.** The synchronous execution model, built-in agent types, and deep context sharing make it the stronger platform when you need agents that collaborate with each other and with you in real-time. The `.claude/agents/` system gives teams a version-controlled, reviewable way to encode agent behavior.

**For batch processing and async task delegation: choose Codex custom agents.** The cloud sandbox model, simple configuration surface, and horizontal scaling make it the better fit when you have well-defined tasks that can run independently.

Many teams will use both. Claude Code for the daily interactive session — debugging, refactoring, feature development — and Codex for the overnight batch of well-scoped tasks. The platforms aren't mutually exclusive, and the multi-agent landscape is evolving rapidly. What matters is matching the execution model to your workflow, not picking a single winner.

## Frequently Asked Questions

### Can you use Claude Code subagents and Codex custom agents in the same project?

Yes. The tools operate independently — Claude Code runs locally in your terminal while Codex runs in cloud sandboxes. You can use Claude Code for interactive development during the day and dispatch Codex agents for batch tasks overnight. Both connect to the same Git repository, so results from either platform appear as commits or PRs in your normal workflow.

### How many subagents can Claude Code run in parallel?

Claude Code doesn't enforce a hard limit on parallel subagents, but practical performance depends on your local machine's resources and the context window budget. Most workflows run 2-5 subagents effectively. Beyond that, context window fragmentation and resource contention reduce quality. Git worktree isolation helps with file-level conflicts but doesn't eliminate resource sharing.

### Do Codex custom agents share context with each other?

No. Each Codex agent runs in an isolated sandbox with its own repo clone and environment. Agents dispatched simultaneously cannot communicate or share discoveries. If tasks are interdependent, you need to sequence them manually — wait for Agent A to finish, then dispatch Agent B with the updated codebase.

### Which platform is cheaper for multi-agent workflows?

Codex custom agents are included in ChatGPT Pro and Team subscriptions, making them effectively flat-rate for batch work. Claude Code subagents bill per-token for each agent spawned, so costs scale with usage. For high-volume batch processing, Codex's subscription model is typically cheaper. For focused interactive sessions with a few subagents, Claude Code's per-token cost is often modest.

### Can you define custom agent types in Codex like Claude Code's Explore or Plan agents?

Codex doesn't offer typed agents with different tool-access profiles. Custom agents in Codex are configured through natural language instructions rather than architectural constraints. You can instruct an agent to "only read files, don't make changes," but this is behavioral guidance, not enforced at the platform level. Claude Code's agent type system provides stronger guarantees about what each agent can and cannot do.

---

*Want more AI insights? [Subscribe to LoreAI](/subscribe) for daily briefings.*