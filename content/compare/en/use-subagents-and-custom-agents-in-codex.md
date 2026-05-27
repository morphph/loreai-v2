---
title: "Codex Custom Agents vs Claude Code Subagents: Which Multi-Agent Coding System Fits Your Workflow?"
slug: use-subagents-and-custom-agents-in-codex
description: "Compare how to use subagents and custom agents in Codex vs Claude Code — configuration, execution models, and practical workflows."
item_a: Codex Custom Agents
item_b: Claude Code Subagents
category: tools
related_glossary: [agent-sdk, agentic-coding]
related_blog: [claude-code-subagents-examples, codex-complete-guide, claude-code-agent-teams, claude-code-extension-stack-skills-hooks-agents-mcp]
related_compare: []
related_topics: [codex]
lang: en
---

<!-- Pre-Draft Planning
1. Target keyword: use subagents and custom agents in codex
2. Page type: compare
3. Keyword intent: commercial — developers evaluating which multi-agent coding system to adopt
4. Likely official-doc competitor: OpenAI's Codex documentation on agents.md configuration; Anthropic's Claude Code agent teams docs
5. Likely non-official competitor pattern: thin tutorials showing a single agents.md example, listicles of "top AI coding tools", outdated pre-launch speculation
6. LoreAI standout angle: Side-by-side architectural comparison with concrete decision rules by team size, workflow type, and infrastructure constraints — neither vendor's docs compare themselves to the competitor
-->

# Codex Custom Agents vs Claude Code Subagents: Which Multi-Agent Coding System Fits Your Workflow?

**TL;DR:** Both OpenAI Codex and Claude Code now support multi-agent workflows, but the architectures diverge sharply. **Codex custom agents** run in cloud-sandboxed containers with asynchronous task queuing — best for teams that want fire-and-forget task delegation with strong isolation. **Claude Code subagents** run locally with real-time orchestration and deep project context — best for developers who need interactive, context-rich agent collaboration in the terminal. Choose Codex agents for parallelized batch work across repos; choose Claude Code subagents for complex, context-heavy tasks within a single codebase.

## Overview: Codex Custom Agents

To **use subagents and custom agents in Codex**, you define agent configurations that tell Codex how to behave when processing specific types of tasks. OpenAI's [Codex](/blog/codex-complete-guide) is a cloud-based [agentic coding](/glossary/agentic-coding) platform that executes tasks in sandboxed environments — each task spins up an isolated container with a snapshot of your repository, runs the agent's instructions, and produces a diff or set of changes you can review and merge.

Custom agents in Codex are configured through `agents.md` files placed in your repository. Each agent definition specifies a system prompt, the tools and commands the agent can use, and any constraints on its behavior. When you assign a task through the Codex dashboard or CLI, you can route it to a specific agent configuration. This means a single repository can have a "frontend agent" that understands React conventions, a "backend agent" that follows your API design patterns, and a "test agent" that focuses purely on test generation — each with tailored instructions and permissions.

The execution model is fundamentally asynchronous. You submit a task, Codex queues it, spins up the sandboxed environment, runs the agent, and notifies you when the result is ready. This cloud-first architecture means agents can run in parallel without consuming local resources, but it also means there's no real-time back-and-forth during execution.

## Overview: Claude Code Subagents

Claude Code takes a different architectural approach to multi-agent workflows. Rather than cloud-sandboxed containers, Claude Code's [agent teams](/blog/claude-code-agent-teams) run locally in your terminal with full access to your project context. Subagents are spawned by a parent agent to handle specific subtasks — searching code, running tests, editing files in parallel — and report results back to the orchestrating session.

The subagent system in Claude Code operates through several complementary mechanisms. The [Agent SDK](/glossary/agent-sdk) provides programmatic control over agent spawning. [Skills](/blog/5-claude-code-skills-i-use-every-single-day) (defined in `SKILL.md` files) encode reusable instructions that any agent can invoke. Custom agents (defined in `.claude/agents/`) create project-specific agent personas. And the broader [extension stack](/blog/claude-code-extension-stack-skills-hooks-agents-mcp) — including hooks, MCP servers, and memory — gives each agent access to rich project context and external tooling.

The execution model is synchronous and interactive. Subagents run in real time, the parent agent coordinates their outputs, and you can observe and intervene during execution. This local-first approach means deeper context awareness but also means agents consume your machine's resources and API tokens in real time.

## Feature Comparison

| Feature | Codex Custom Agents | Claude Code Subagents | Advantage |
|---------|--------------------|-----------------------|-----------|
| **Configuration** | `agents.md` in repo root | `.claude/agents/*.md` + `SKILL.md` files | Claude Code — more granular layering |
| **Execution environment** | Cloud sandbox (isolated container) | Local terminal (full project access) | Codex — stronger isolation |
| **Task model** | Asynchronous queue | Synchronous orchestration | Depends on workflow |
| **Parallelism** | Multiple tasks across cloud workers | Sub-agents via `Agent` tool + git worktrees | Codex — easier horizontal scaling |
| **Context access** | Repo snapshot at task creation | Full live project + CLAUDE.md + memory | Claude Code — richer real-time context |
| **Inter-agent communication** | Indirect (via task results) | Direct (parent-child message passing) | Claude Code — tighter coordination |
| **Tool integration** | Codex-provided sandbox tools | MCP servers + shell access + hooks | Claude Code — broader extensibility |
| **Cost model** | Included in ChatGPT Pro/Team/Enterprise | Usage-based API billing | Codex — more predictable for teams |
| **Platform** | Web dashboard + CLI + VS Code | Terminal + IDE extensions | Tie |
| **Isolation** | Container-level per task | Git worktree-level per subagent | Codex — stronger guarantees |

## Agent Configuration: Detailed Analysis

The way you define and configure agents reveals the core philosophy of each platform. This is where the practical daily experience diverges most.

**Codex** uses a single `agents.md` file (or individual markdown files in an `agents/` directory) at the repository root. Each agent definition is a markdown section with a name, description, and system instructions. The format is deliberately simple — you write natural language instructions describing how the agent should behave, what tools it should use, and what conventions to follow. Codex reads these at task creation time and uses them to shape the agent's behavior within the sandboxed environment.

This simplicity is a strength for onboarding. Any developer who can write a README can configure a Codex agent. The tradeoff is limited composability — there's no built-in mechanism for one agent definition to inherit from or reference another. Each agent configuration is self-contained.

**Claude Code** uses a layered configuration system. Custom agents live in `.claude/agents/*.md` files, each defining a specialized persona with its own tools and instructions. Skills (`SKILL.md` files in `skills/` directories) define reusable task-specific instruction sets that any agent can invoke. The top-level `CLAUDE.md` provides project-wide context that all agents inherit. And [hooks](/blog/claude-code-hooks-a-complete-guide-to-automating-your-ai-coding-workflow) add deterministic automation that runs before or after agent actions.

This layered approach means you can compose behaviors: a "code reviewer" agent inherits project conventions from `CLAUDE.md`, uses the `code-review` skill for methodology, respects hooks that enforce linting, and connects to external services through MCP servers. The cost is complexity — there are [seven programmable layers](/blog/claude-code-seven-programmable-layers) to understand, and misconfiguration at any level can produce unexpected behavior.

**Decision rule:** If your team wants agents configured in under 15 minutes with minimal learning curve, Codex's flat `agents.md` approach wins. If you need agents that compose behaviors from shared conventions, reusable skills, and external tool integrations, Claude Code's layered system provides more power at the cost of more setup.

## Execution Model: Detailed Analysis

How agents actually run — where, when, and with what level of isolation — determines which workflows each system handles well.

**Codex** runs every agent task in an isolated cloud container. The container gets a fresh clone of your repository at the commit you specify, installs dependencies, and executes the agent's work. The agent can run shell commands, read and write files, and execute tests — all within the sandbox. When done, the result is a set of file changes presented as a reviewable diff.

This architecture has three key implications. First, **isolation is strong** — a misbehaving agent cannot corrupt your local environment, break other running tasks, or access files outside the repo snapshot. Second, **parallelism scales horizontally** — you can submit 10 tasks simultaneously without impacting your machine. Third, **context is frozen** — the agent works against a snapshot, not your live working directory, so it cannot see changes you make after task submission and you cannot see its intermediate progress.

The frozen-context tradeoff matters most for complex, multi-step tasks where you might want to course-correct mid-execution. If a Codex agent takes 20 minutes to complete a refactoring task and goes down the wrong path at minute 3, you won't know until it finishes.

**Claude Code** runs subagents as parallel processes on your local machine. The parent agent uses the `Agent` tool to spawn children, optionally in isolated [git worktrees](/blog/anatomy-of-git-worktree-add) to prevent file conflicts. Subagents communicate results back to the parent through message passing, allowing the orchestrating agent to synthesize outputs, resolve conflicts, and make decisions based on combined results.

This architecture also has three key implications. First, **context is live** — subagents see your current working directory, recent edits, and project state in real time. Second, **coordination is tight** — the parent agent can route subtask results, handle failures, and adjust strategy dynamically. Third, **resources are local** — running five subagents means five concurrent Claude API sessions drawing on your token budget and network bandwidth.

For concrete examples of Claude Code's subagent orchestration patterns, see our [subagent examples guide](/blog/claude-code-subagents-examples), which covers parallel research, divide-and-conquer refactoring, and review delegation workflows.

**Decision rule:** If you need strong task isolation and don't require real-time interaction during execution, Codex's cloud sandbox model is cleaner. If you need agents that react to live project state and coordinate with each other mid-task, Claude Code's local orchestration model is more capable.

## Workflow Integration: Practical Patterns

Beyond configuration and execution, the day-to-day workflow integration determines whether multi-agent coding actually saves time or adds overhead.

**Codex workflow patterns** center on the task queue. A typical pattern: a team lead reviews incoming GitHub issues, creates Codex tasks with appropriate agent assignments, and Codex processes them asynchronously. Developers review the resulting PRs as they would any human contribution. The [VS Code extension](/blog/codex-vscode) streamlines this by allowing task submission from the editor, but the core interaction remains submit-and-review.

This queue-based model works well for standardized, repeatable tasks: generating tests for a new module, migrating API endpoints to a new schema, updating documentation after a refactor. These are tasks where the requirements are clear upfront and human intervention during execution adds little value.

**Claude Code workflow patterns** center on interactive sessions. A developer starts a Claude Code session, describes a complex task, and the agent decides when to spawn subagents. The developer can observe intermediate results, provide feedback, and redirect the agent's approach. [Skills](/blog/9-principles-writing-claude-code-skills) encode team conventions so agents follow consistent patterns across sessions.

This interactive model works well for exploratory and complex tasks: investigating a production bug across multiple services, refactoring a module where the final architecture isn't known upfront, or implementing a feature that requires design decisions during development. These are tasks where real-time human judgment during execution prevents wasted work.

**Hybrid pattern:** Some teams use both systems. Codex handles the backlog of well-defined tasks — test generation, documentation updates, routine migrations — while developers use Claude Code interactively for complex feature work and debugging. The two systems don't directly integrate, but they operate on the same codebase through Git without conflict.

## Scaling and Team Considerations

Multi-agent systems behave differently at team scale versus individual use. The scaling characteristics of each platform favor different organizational structures.

**Codex scales with the team.** Because agents run in the cloud, adding more developers doesn't increase infrastructure load. Agent configurations in `agents.md` are version-controlled and shared automatically across the team. Task routing is centralized through the Codex dashboard, giving engineering managers visibility into what agents are working on and how they're performing. Codex is included in ChatGPT Team and Enterprise plans, making cost predictable per seat rather than per token.

**Claude Code scales with the developer.** Each developer runs their own Claude Code sessions with their own API token allocation. Agent configurations (`.claude/agents/`, skills, CLAUDE.md) are version-controlled and shared through the repo, but execution is fully local and individual. There's no centralized dashboard for tracking what agents across the team are doing. The [memory system](/blog/claude-code-memory) helps individual developers maintain context across sessions, but this memory is per-developer, not team-shared.

**Decision rule:** If you're an engineering manager looking to deploy multi-agent coding across a team of 10+ developers with centralized oversight, Codex's cloud infrastructure and dashboard provide better operational visibility. If you're a senior developer or small team that values individual agent customization and deep project context over centralized management, Claude Code's local-first approach offers more flexibility.

## Security and Isolation

When agents execute code autonomously, security becomes a critical differentiator.

**Codex** provides container-level isolation for every task. Agents cannot access the network by default (configurable), cannot interact with other running tasks, and cannot modify anything outside the sandbox. The resulting changes are presented as diffs for human review before any merge. This defense-in-depth approach means even a compromised agent prompt cannot cause lasting damage — the worst case is a bad diff that gets rejected in review.

**Claude Code** runs agents with the same permissions as your terminal session. While Claude Code has a permission system that requires user approval for shell commands, file edits, and other actions, the isolation boundary is the developer's machine. Git worktree isolation prevents file-level conflicts between subagents, but agents still have access to the full filesystem (within permission boundaries). [Hooks](/blog/claude-code-hooks-mastery) provide deterministic guardrails — you can block specific commands, enforce linting, or require approval for sensitive operations — but the responsibility for configuring these guardrails falls on the developer or team.

**Decision rule:** If your security posture requires that AI agents never have access to production credentials, secrets, or network resources beyond the repository, Codex's sandboxed model provides stronger guarantees out of the box. If you trust your existing terminal permission model and want agents that can interact with local services, databases, and tools during execution, Claude Code's permissioned local access is more practical — but requires careful hook and permission configuration.

## When to Choose Codex Custom Agents

Choose Codex's multi-agent system when:

- **Batch processing well-defined tasks.** You have a queue of issues, migrations, or test generation tasks with clear requirements that don't need real-time human input. Codex agents process these in parallel cloud containers while your team focuses on higher-judgment work.
- **Team-wide deployment.** You want centralized agent management, predictable per-seat pricing, and a dashboard that shows what agents are doing across the organization. Codex's infrastructure handles the scaling.
- **Strong isolation requirements.** Your security policy requires that AI agents run in sandboxed environments without access to local credentials, network resources, or production systems. Codex's container model enforces this architecturally.
- **VS Code-centric workflows.** Your team works primarily in VS Code and wants agent task submission integrated into the editor. The [Codex VS Code extension](/blog/codex-vscode) provides this with minimal setup.

Codex custom agents are particularly effective for teams transitioning from manual code review to AI-assisted development — the submit-review-merge workflow matches existing PR-based processes.

## When to Choose Claude Code Subagents

Choose Claude Code's multi-agent system when:

- **Complex, context-heavy tasks.** You're working on problems that require deep project understanding — debugging across multiple modules, refactoring with unclear final architecture, or implementing features that need design decisions during development. Claude Code's live context and interactive orchestration prevent wasted agent cycles.
- **Rich tool integration.** You need agents that connect to databases, monitoring systems, external APIs, or custom tooling during execution. Claude Code's MCP server ecosystem and full shell access enable workflows that Codex's sandboxed environment cannot support.
- **Composable agent behaviors.** You want agents that inherit project conventions from CLAUDE.md, use shared skills for consistent methodology, trigger hooks for deterministic automation, and adapt to project-specific custom agents. The [layered extension stack](/blog/claude-code-extension-stack-skills-hooks-agents-mcp) enables this composition.
- **Terminal-first development.** You work primarily in the terminal and want agents that operate in your existing environment with access to your full development toolchain — build systems, test runners, linters, deployment scripts.

Claude Code subagents excel for experienced developers who want AI that operates at the same level of project access they have, with real-time oversight and intervention capability. Our [agent teams deep dive](/blog/claude-code-agent-teams) covers advanced orchestration patterns.

## Verdict

**For teams processing defined tasks at scale, Codex custom agents deliver better isolation, simpler configuration, and predictable pricing.** Submit tasks, review diffs, merge — the workflow maps cleanly to existing engineering processes.

**For developers tackling complex, context-rich work, Claude Code subagents provide deeper project understanding, richer tool integration, and real-time orchestration.** The interactive model catches wrong turns early and enables tighter human-agent collaboration.

The strongest position is using both: Codex for the task backlog, Claude Code for the hard problems. They complement rather than compete — Codex handles breadth, Claude Code handles depth. Start with whichever matches your most pressing workflow bottleneck, then expand.

## Frequently Asked Questions

### How do you set up custom agents in Codex?
Create an `agents.md` file in your repository root with markdown sections defining each agent's name, description, and instructions. When submitting tasks through the Codex dashboard or CLI, select which agent configuration to use. Each agent runs in an isolated cloud sandbox with access only to your repository snapshot and the tools you've specified in the configuration.

### Can Claude Code subagents run in parallel without file conflicts?
Yes. Claude Code supports git worktree isolation for subagents — each subagent operates in a separate linked working tree of the same repository, preventing file conflicts. The parent agent orchestrates the results and merges changes. For tasks that don't modify overlapping files, subagents can also run against the same working directory.

### Is one system significantly faster than the other?
Codex tasks have startup latency from container provisioning — typically 30–90 seconds before execution begins — but multiple tasks run in parallel across cloud infrastructure without competing for resources. Claude Code subagents start near-instantly since they run locally, but compete for your machine's resources and API token throughput. For a single complex task, Claude Code is faster. For 10 parallel tasks, Codex often finishes the batch sooner.

### Can you use Codex agents and Claude Code subagents on the same repository?
Yes. Both systems interact with your codebase through Git and standard development tooling. Codex agent configurations (`agents.md`) and Claude Code configurations (`.claude/` directory) coexist without conflict. Many teams use Codex for batch task processing and Claude Code for interactive development on the same repository.

---

*Want more AI insights? [Subscribe to LoreAI](/subscribe) for daily briefings.*