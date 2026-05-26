---
title: "Codex Subagents vs Claude Code Agent Teams: Multi-Agent AI Coding Compared"
slug: use-subagents-and-custom-agents-in-codex
description: "Compare subagents and custom agents in OpenAI Codex vs Claude Code agent teams — architecture, customization, and real workflows."
item_a: OpenAI Codex
item_b: Claude Code
category: tools
related_glossary: [agent-sdk, agentic-coding]
related_blog: [claude-code-subagents-examples, claude-code-agent-teams, codex-complete-guide, claude-code-extension-stack-skills-hooks-agents-mcp, con-u-pour-des-workflows-multi-agents]
related_compare: []
related_topics: [codex]
lang: en
---

<!-- Pre-draft planning
Target keyword: use subagents and custom agents in codex
Page type: compare
Keyword intent: commercial — reader is evaluating whether to use Codex or Claude Code for multi-agent coding workflows
Likely official-doc competitor: OpenAI Codex docs on agent configuration; Anthropic's Claude Code agent teams documentation
Likely non-official competitor pattern: thin rewrites of official docs, generic "top AI coding tools" listicles
LoreAI standout angle: Side-by-side architectural comparison of how each platform implements subagents, with concrete decision rules for which to choose based on team size, workflow type, and customization needs
-->

# Codex Subagents vs Claude Code Agent Teams: Multi-Agent AI Coding Compared

**TL;DR:** Both OpenAI Codex and Claude Code support multi-agent workflows, but their architectures differ fundamentally. **Codex runs each agent as an isolated cloud task** in a sandboxed environment — great for parallelizing independent work items at scale. **Claude Code runs agents locally with shared project context** — better for tightly coupled tasks where agents need to coordinate in real time. Choose Codex if you want fire-and-forget cloud tasks across repos; choose Claude Code if you need agents that read each other's output and share a live codebase.

## Overview: OpenAI Codex Subagents

**OpenAI Codex** is a [cloud-based AI coding agent](/blog/codex-complete-guide) that runs tasks in sandboxed environments on OpenAI's infrastructure. Each Codex task spins up in its own isolated container with a snapshot of your repository, executes autonomously, and produces a diff or pull request when finished. Subagents in Codex extend this model — you can configure custom agent definitions that specialize in particular task types, then dispatch multiple tasks in parallel.

The cloud-first architecture means Codex tasks don't block your local machine. You can fire off five refactoring tasks, close your laptop, and review the results later. Custom agents in Codex are defined through configuration files (like `AGENTS.md`) that specify the agent's role, constraints, and tool access. Each agent inherits the base Codex capabilities — code reading, file editing, test execution — but operates within the boundaries you define.

Codex targets teams that want asynchronous, parallelized code generation without tying up local compute. The tradeoff: each task runs against a snapshot, not a live repo, so agents can't see each other's in-progress changes.

## Overview: Claude Code Agent Teams

**Claude Code** is Anthropic's terminal-based [agentic coding](/glossary/agentic-coding) tool that runs directly on your machine. Its [agent teams system](/blog/claude-code-agent-teams) lets you spawn sub-agents — specialized workers that handle specific parts of a larger task — from within a single session. Unlike Codex's cloud-isolated model, Claude Code agents share the same filesystem and can pass results back to the orchestrating agent in real time.

Claude Code ships with built-in agent types: `Explore` for fast read-only codebase search, `Plan` for architecture design, `code-reviewer` for review tasks, and `general-purpose` for anything else. Beyond these defaults, you can define [custom agents](/blog/claude-code-subagents-examples) in your repository's `.claude/agents/` directory — each agent file specifies its name, description, available tools, and behavioral instructions. The orchestrating agent decides which sub-agent to dispatch based on the task at hand.

The local-first architecture means agents see live file state, coordinate through the orchestrator, and can react to each other's changes immediately. The tradeoff: tasks run on your machine, consuming local resources and blocking until complete unless explicitly backgrounded.

## Feature Comparison

| Feature | OpenAI Codex | Claude Code | Winner |
|---------|-------------|-------------|--------|
| **Execution model** | Cloud sandboxed containers | Local terminal process | Depends on use case |
| **Agent isolation** | Full — each agent gets a repo snapshot | Shared filesystem with optional worktree isolation | Codex for safety, Claude Code for coordination |
| **Custom agent definition** | Config files (AGENTS.md) | `.claude/agents/` directory with markdown specs | Tie |
| **Built-in agent types** | General-purpose task runner | Explore, Plan, code-reviewer, general-purpose, and more | Claude Code |
| **Parallel execution** | Native — multiple cloud tasks simultaneously | Supported — multiple agents in one message | Tie |
| **Real-time coordination** | No — agents run independently | Yes — orchestrator receives sub-agent results | Claude Code |
| **Async/offline support** | Yes — tasks complete while you're away | Limited — requires active terminal session | Codex |
| **IDE integration** | [VS Code extension](/blog/codex-vscode), web dashboard | Terminal-native, IDE extensions available | Codex for GUI, Claude Code for terminal |
| **Git integration** | Produces PRs/diffs automatically | Full git access — stage, commit, push | Tie |
| **Cost model** | Included in ChatGPT Pro/Team/Enterprise | Usage-based API billing | Depends on volume |

## Execution Architecture: Cloud vs Local

The most fundamental difference between Codex and Claude Code subagents is where code runs. This single architectural choice cascades into every other difference between the two systems.

**Codex creates a fresh sandboxed environment for each task.** When you dispatch a Codex agent, OpenAI spins up a container with a clone of your repository at its current state. The agent works in complete isolation — it can install dependencies, run tests, modify files, and execute arbitrary commands without any risk to your local environment or other running agents. When it finishes, Codex presents the resulting diff for your review.

This isolation model has clear advantages for safety: a buggy agent can't corrupt your working directory or interfere with another agent's output. It also means you can dispatch dozens of tasks in parallel without worrying about resource contention. The downside is latency — spinning up a container, cloning a repo, and installing dependencies adds overhead to every task. And because each agent works against a snapshot, two agents editing the same file will produce conflicting diffs that you need to reconcile manually.

**Claude Code runs agents as child processes on your local machine.** When you spawn a sub-agent, it inherits access to your actual project directory (or an isolated git worktree if you specify `isolation: "worktree"`). The orchestrating agent can send multiple sub-agents in a single message, receive their results, and synthesize a coordinated response. Because agents share the filesystem, the orchestrator can ensure they don't step on each other's work — assigning different files or directories to different agents.

The local model excels when tasks are interdependent. An `Explore` agent can search the codebase, report its findings to the orchestrator, which then dispatches a `Plan` agent to design the implementation, followed by a coding agent to execute it. Each step builds on the previous one's output without round-trips to a cloud service. The tradeoff: you need a capable local machine, and long-running agents keep your terminal busy.

For teams evaluating these approaches, the question is straightforward: **if your tasks are independent and can run in parallel without coordination, Codex's cloud model is more efficient.** If your tasks require tight feedback loops and shared context, Claude Code's local orchestration model produces better results.

## Custom Agent Definition: Configuration Compared

Both platforms let you define custom agents that specialize in particular tasks — code review, test generation, documentation, security scanning, and more. The mechanism differs, but the concept is similar: you write a specification that shapes how the agent behaves.

### Codex Custom Agents

Codex supports custom agent configuration through dedicated files in your repository. You define an agent's role, the types of tasks it should handle, and any constraints or instructions it should follow. These definitions travel with your codebase, so every team member gets the same agent behavior.

A Codex custom agent typically specifies:
- **Role description**: What the agent specializes in
- **File access patterns**: Which parts of the repo the agent should focus on
- **Tool permissions**: What commands the agent can execute
- **Output format**: How the agent should present its results

Because Codex agents run in isolated containers, custom agent definitions are primarily about shaping the agent's reasoning and output — the execution environment is standardized.

### Claude Code Custom Agents

Claude Code custom agents live in `.claude/agents/` as markdown files. Each file defines the agent's name, description, tools, and behavioral instructions. The [extension stack](/blog/claude-code-extension-stack-skills-hooks-agents-mcp) means custom agents compose with other Claude Code features — they can invoke skills, use MCP servers, and access project context from `CLAUDE.md` files.

A Claude Code custom agent file typically includes:
- **Agent type and model**: Which base model and configuration to use
- **Tool access list**: Specific tools the agent can call (Read, Edit, Bash, Grep, etc.)
- **Behavioral instructions**: Markdown-formatted guidelines for the agent's approach
- **Path restrictions**: Which files or directories the agent should operate on

The key difference from Codex: Claude Code agents can be invoked automatically based on triggers. For example, the `pipeline-reviewer` agent auto-activates after editing pipeline scripts, cross-checking changes against a known-issues registry. This event-driven model means custom agents aren't just passive task runners — they're active guardrails in your development workflow.

### Which Approach Is More Flexible?

Claude Code's agent definition system is more expressive because agents participate in a larger ecosystem. A custom agent can call skills, connect to MCP servers, spawn its own sub-agents, and interact with the orchestrator. Codex agents are more self-contained — each is a focused task runner that produces a discrete output. For simple, repeatable tasks, Codex's simplicity is an advantage. For complex, multi-step workflows, Claude Code's composability wins.

## Multi-Agent Coordination: Independent vs Orchestrated

How agents coordinate — or don't — is where the two platforms diverge most sharply. This matters because real-world coding tasks are rarely fully independent.

### Codex: Parallel but Independent

Codex's [multi-agent workflows](/blog/con-u-pour-des-workflows-multi-agents) run tasks in parallel without inter-agent communication. You dispatch multiple tasks — "refactor the auth module," "add tests for the payment service," "update the API documentation" — and each runs independently in its own sandbox. Results come back as separate PRs or diffs.

This works well when:
- Tasks touch different parts of the codebase
- Each task is self-contained with clear inputs and outputs
- You want maximum parallelism without orchestration overhead
- Review and merge order doesn't matter

It breaks down when:
- Tasks have dependencies (agent B needs agent A's output)
- Multiple agents need to modify the same files
- The task requires iterative refinement across steps
- You need a coherent, unified change rather than separate diffs

### Claude Code: Orchestrated Agent Teams

Claude Code's [agent teams](/blog/claude-code-agent-teams) operate through an explicit orchestration model. The main agent acts as a coordinator — it analyzes the task, decides which sub-agents to spawn, dispatches them (in parallel if independent, sequentially if dependent), receives their results, and synthesizes a unified response.

A typical multi-agent workflow in Claude Code:

1. **Explore agent** scans the codebase to locate relevant files and understand the architecture
2. **Plan agent** designs the implementation approach based on exploration results
3. **Multiple coding agents** execute changes in parallel, each assigned to different files
4. **Review agent** checks the combined changes for consistency and correctness

The orchestrator ensures agents don't conflict — it assigns non-overlapping work areas and resolves any coordination issues. The result is a single, coherent set of changes rather than multiple independent diffs.

This orchestrated model adds complexity but produces better outcomes for tasks that span multiple files or require multi-step reasoning. The overhead is justified when the alternative — manually merging independent agent outputs — would take longer than the orchestration itself.

## When to Choose Codex for Subagents

**Choose Codex when your workflow matches its strengths:**

- **Large-scale, independent tasks**: You have a backlog of 10+ discrete tasks that don't depend on each other. Codex can run them all in parallel in the cloud while you focus on other work.
- **Asynchronous workflows**: Your team dispatches tasks during the day and reviews results in batches. Codex's async model fits naturally — no terminal sessions to keep alive.
- **Resource-constrained local machines**: You're working on a laptop without the compute power to run multiple AI agents locally. Codex offloads everything to the cloud.
- **Cross-repository tasks**: You need similar changes applied across multiple repos. Each Codex task can target a different repository independently.
- **Standardized, repeatable operations**: Migration scripts, dependency updates, boilerplate generation — tasks where each agent follows the same pattern on different targets.

Codex is also the better choice for teams already embedded in the OpenAI ecosystem, with [VS Code integration](/blog/codex-vscode) providing a familiar interface for dispatching and reviewing agent work. The [open-source availability](/blog/codex-for-open-source) makes it accessible for maintainers managing large projects across multiple repos.

## When to Choose Claude Code for Agent Teams

**Choose Claude Code when your tasks require coordination and context:**

- **Tightly coupled refactoring**: Renaming a module, updating all imports, fixing tests, and adjusting documentation — tasks where each step depends on the previous one. Claude Code's orchestrator handles the sequencing automatically.
- **Exploration-driven development**: You don't know exactly what needs to change until an agent investigates. Claude Code's `Explore` → `Plan` → `Execute` pattern handles uncertainty gracefully.
- **Custom workflow guardrails**: You want agents that auto-activate based on file changes — like a [pipeline reviewer](/blog/claude-code-subagents-examples) that checks every script edit against known issues. Claude Code's event-driven agents provide this out of the box.
- **Live codebase interaction**: Your agents need to run tests, check build output, and adjust their approach based on results — all within a single session against the live codebase.
- **Skill-augmented agents**: You've invested in [Claude Code skills](/blog/5-claude-code-skills-i-use-every-single-day) and want agents that leverage those skills. Claude Code's composable architecture means custom agents inherit your entire extension stack.

Claude Code is the better fit for individual developers and small teams who want tight control over agent behavior and prefer terminal-based workflows. The [seven programmable layers](/blog/claude-code-seven-programmable-layers) give you fine-grained control over every aspect of agent execution.

## Verdict

The choice between Codex subagents and Claude Code agent teams comes down to your coordination needs and execution preferences.

**If you need independent, parallelized cloud tasks — choose Codex.** Its sandboxed execution model is ideal for dispatching many self-contained tasks without worrying about conflicts or local resource limits. Teams managing large backlogs or multiple repositories will appreciate the async, fire-and-forget workflow.

**If you need orchestrated, context-aware multi-agent workflows — choose Claude Code.** Its local orchestration model with typed sub-agents, real-time coordination, and composable extension stack produces more coherent results for complex, interdependent tasks. Developers who want custom agents that integrate with skills, hooks, and MCP servers will find Claude Code's architecture more powerful.

Many teams use both: Codex for bulk operations across repos, Claude Code for deep, coordinated work within a single project. The tools aren't mutually exclusive — they solve different shapes of the same problem. For a deeper look at how Claude Code's [agent SDK](/glossary/agent-sdk) enables these workflows, see our glossary entry on the underlying architecture.

## Frequently Asked Questions

### Can Codex subagents communicate with each other during execution?
No. Each Codex task runs in an isolated sandbox with its own repository snapshot. Agents cannot see each other's in-progress changes or exchange messages. You coordinate by reviewing and merging their separate outputs after completion.

### How many sub-agents can Claude Code run in parallel?
Claude Code can dispatch multiple agents in a single message, and they run concurrently. The practical limit depends on your local machine's resources — CPU, memory, and disk I/O. Using `isolation: "worktree"` for each agent reduces filesystem conflicts but increases disk usage.

### Do custom agents in either platform persist across sessions?
Yes, in both platforms. Codex custom agent configurations live in your repository and are available whenever you use Codex with that repo. Claude Code custom agents in `.claude/agents/` persist in your project directory and are loaded automatically in every session.

### Is one platform cheaper than the other for multi-agent workflows?
Codex is included in ChatGPT Pro, Team, and Enterprise subscriptions — you pay a flat rate regardless of agent count. Claude Code uses usage-based API billing, so costs scale with the number and duration of agent sessions. For high-volume, many-task workflows, Codex's flat pricing may be more predictable. For occasional, deep sessions, Claude Code's per-use billing may cost less.

---

*Want more AI insights? [Subscribe to LoreAI](/subscribe) for daily briefings.*