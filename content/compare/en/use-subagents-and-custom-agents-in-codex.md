---
title: "Codex Subagents vs Claude Code Agent Teams: How to Use Custom Agents in Each Platform"
slug: use-subagents-and-custom-agents-in-codex
description: "Compare how OpenAI Codex and Claude Code handle subagents and custom agents — configuration, orchestration, and practical workflows."
item_a: OpenAI Codex
item_b: Claude Code
category: tools
related_glossary: [agent-sdk, agentic-coding]
related_blog: [claude-code-subagents-examples, codex-complete-guide, claude-code-agent-teams]
related_compare: []
related_topics: [codex]
lang: en
---

# Codex Subagents vs Claude Code Agent Teams: How to Use Custom Agents in Each Platform

**TL;DR:** Both OpenAI Codex and Claude Code support multi-agent workflows, but they approach the problem differently. **Codex uses `AGENTS.md` files** to define custom agent personas that run in sandboxed cloud environments — ideal for asynchronous, fire-and-forget task delegation. **Claude Code uses a built-in Agent tool** with typed subagent roles (Explore, Plan, code-reviewer) plus custom agent definitions — better for real-time, interactive orchestration where you need results mid-session. Choose Codex for team-wide async task queues; choose Claude Code for live, session-level multi-agent coordination.

## Overview: OpenAI Codex

OpenAI Codex is a [cloud-based AI coding agent](/blog/codex-complete-guide) that runs tasks in sandboxed environments within the ChatGPT interface. Each Codex task spins up an isolated container with your repository cloned, executes the work, and returns results as a pull request or diff. Codex targets teams that want to delegate coding tasks asynchronously — you describe a task, assign it, and check back later.

The custom agent system in Codex centers on **`AGENTS.md`** files committed to your repository. These files define specialized agent personas with specific instructions, constraints, and behavioral guidelines. When a Codex task runs, it reads the relevant `AGENTS.md` configuration to shape how it approaches the work — similar to how system prompts configure an LLM, but scoped to your repository's conventions.

Codex is available to ChatGPT Pro, Team, and Enterprise users. Tasks consume compute time billed against your plan's allocation. The [VS Code extension](/blog/codex-vscode) provides an alternative interface for launching tasks without leaving your editor.

## Overview: Claude Code

**[Claude Code](/blog/claude-code-complete-guide)** is Anthropic's terminal-based [agentic coding](/glossary/agentic-coding) tool that runs locally on your machine. Unlike Codex's cloud-first approach, Claude Code operates in your actual development environment — it has direct access to your filesystem, shell, and running processes. This makes it fundamentally different in how it handles multi-agent workflows.

Claude Code's subagent system uses a built-in **Agent tool** that spawns specialized subagents within your session. These come in predefined types — Explore for codebase search, Plan for architecture design, code-reviewer for review — plus support for fully custom agent definitions. The key distinction: subagents run concurrently within your live session and return results that inform the parent agent's next steps. This is interactive orchestration, not async task delegation.

Claude Code's [agent teams](/blog/claude-code-agent-teams) feature extends this by enabling parallel sub-agent execution across large codebases. Combined with the [extension stack](/blog/claude-code-extension-stack-skills-hooks-agents-mcp) — Skills, Hooks, MCP servers — Claude Code's agent system is deeply programmable.

## Feature Comparison

| Feature | OpenAI Codex | Claude Code | Winner |
|---------|-------------|-------------|--------|
| **Agent definition format** | `AGENTS.md` in repo | Agent tool + custom definitions | Tie |
| **Execution environment** | Sandboxed cloud container | Local machine (your terminal) | Context-dependent |
| **Orchestration model** | Async task queue | Real-time session subagents | Claude Code |
| **Built-in agent types** | Single configurable persona | Explore, Plan, code-reviewer, general-purpose | Claude Code |
| **Parallel execution** | Multiple tasks in parallel | Agent teams with concurrent subagents | Tie |
| **Custom agent behavior** | Via `AGENTS.md` instructions | Via SKILL.md + agent definitions | Tie |
| **Git integration** | Auto-creates PRs from tasks | Commits, pushes, creates PRs in-session | Codex |
| **Isolation** | Full container isolation | Worktree isolation (optional) | Codex |
| **Visibility into agent work** | Post-hoc task results | Real-time streaming in terminal | Claude Code |
| **Team collaboration** | Shared task queue in ChatGPT | Single-user terminal sessions | Codex |
| **Pricing** | Included in ChatGPT Pro/Team/Enterprise | Usage-based API billing | Context-dependent |

## Custom Agent Configuration: Detailed Analysis

Both platforms let you define how agents behave through repository-committed configuration files, but the mechanisms differ significantly in scope and flexibility.

### Codex: AGENTS.md

Codex custom agents are configured through `AGENTS.md` files placed in your repository root. These files use natural language instructions to define agent personas — you describe what the agent should focus on, what conventions to follow, what to avoid, and how to approach specific types of tasks. When you launch a Codex task, the agent reads this configuration and applies it to its work.

A typical `AGENTS.md` might specify:

- Coding standards and style preferences for your project
- Testing requirements (e.g., "always write tests for new functions")
- Framework-specific conventions (e.g., "use server components by default in Next.js")
- File organization rules
- Review checklists the agent should self-apply before submitting

The strength of this approach is simplicity — any developer on the team can read and edit `AGENTS.md` in plain English. The limitation is that Codex currently treats this as a single agent configuration per task. You define *how* the agent works, but you don't orchestrate *multiple* specialized agents within a single task execution. Each Codex task is essentially one agent running one job.

For teams, this means `AGENTS.md` functions more like a project-wide system prompt than a multi-agent orchestration layer. It standardizes behavior across all tasks but doesn't enable the kind of agent-to-agent delegation you might expect from the term "subagents."

### Claude Code: Agent Tool + SKILL.md

Claude Code takes a layered approach to custom agent behavior. At the foundation, [CLAUDE.md](/blog/claude-code-memory) provides project-level context — similar to Codex's `AGENTS.md`. But the agent customization goes deeper through multiple mechanisms.

**SKILL.md files** define task-specific instructions that can be loaded on demand. A skill for writing tests behaves differently from a skill for security review or content generation. These are reusable across sessions and team members. As covered in our guide on [writing effective skills](/blog/9-principles-writing-claude-code-skills), well-crafted skills encode institutional knowledge — not just what to do, but how your team specifically does it.

**The Agent tool** provides runtime subagent spawning with typed specialization:

- `Explore`: Read-only search agent optimized for locating code across large repos
- `Plan`: Architecture agent that designs implementation strategies
- `code-reviewer`: Specialized for code review with security and quality focus
- `general-purpose`: Flexible agent for research and multi-step tasks

Each subagent type has access to different tool sets — an Explore agent can search but can't edit files, for instance. This enforced separation of concerns prevents a search agent from accidentally modifying code during investigation.

**Custom agent definitions** let you go beyond built-in types. You can define agents with specific tools, permissions, and behavioral instructions. Combined with the [seven programmable layers](/blog/claude-code-seven-programmable-layers) in Claude Code's architecture, this creates a highly configurable multi-agent system.

The practical difference: Claude Code lets you compose multiple specialized agents within a single session. A parent agent can spawn an Explore agent to find relevant code, a Plan agent to design the approach, then execute the changes itself — all in one interactive workflow.

## Subagent Orchestration: Detailed Analysis

The orchestration model — how agents coordinate, communicate, and hand off work — is where these platforms diverge most sharply.

### Codex: Async Task Parallelism

Codex's orchestration model is built around **asynchronous task parallelism**. You can launch multiple Codex tasks simultaneously, each running in its own isolated container. This is genuine parallelism — five tasks run on five separate containers at the same time, each with its own clone of your repository.

The workflow looks like this:

1. You (or your team) submit tasks through ChatGPT or the VS Code extension
2. Each task gets its own sandboxed environment with your repo cloned
3. Tasks execute independently — they don't communicate with each other
4. Results come back as PRs, diffs, or explanations
5. You review and merge

This model excels for **batch workloads**: "Fix these five bugs," "Add tests to these three modules," "Refactor these four files to use the new API." Each task is independent, so parallelism is natural. The [Codex for open source](/blog/codex-for-open-source) program leverages this pattern, enabling maintainers to delegate issue triage and fix generation at scale.

The limitation is that tasks can't coordinate. If Task A discovers that the bug it's fixing actually requires changes in a module that Task B is also modifying, there's no mechanism for them to negotiate. You handle conflicts during review and merge. For workflows where agent-to-agent communication matters — "search the codebase, then design an approach based on what you found, then implement it" — Codex requires you to run these as sequential tasks, manually passing context between them.

### Claude Code: Session-Level Agent Teams

Claude Code's orchestration is **synchronous and hierarchical**. A parent agent spawns subagents, waits for results (or runs them in the background), and makes decisions based on what they return. This is agent-to-agent delegation within a single session.

The [agent teams](/blog/claude-code-agent-teams) feature enables this at scale:

```
Parent Agent
├── Explore Agent → "Find all API endpoints that handle auth"
├── Explore Agent → "Find the test coverage for auth modules"  
└── Plan Agent → "Design a migration strategy for the auth layer"
    (runs in parallel, results feed back to parent)
```

The parent agent receives results from all three subagents and synthesizes them into a coherent plan before executing changes. Subagents can also be run in the background — the parent continues working and gets notified when background agents complete.

**Worktree isolation** provides Codex-like sandboxing when needed. An agent spawned with `isolation: "worktree"` operates in a temporary Git worktree — an isolated copy of the repo. This prevents subagents from stepping on each other's changes while still allowing real-time result communication.

The tradeoff: Claude Code's orchestration is more powerful but more complex. Codex's "submit task, get PR" model is dead simple. Claude Code's "spawn agents, compose results, make decisions" model requires understanding the agent system's capabilities and limitations. For [example workflows using subagents](/blog/claude-code-subagents-examples), the learning curve is real but the payoff is significant for complex, multi-step engineering tasks.

## Development Workflow Integration

### Codex in Practice

A typical Codex workflow integrates with your team's existing PR-based development process:

1. **Task creation**: Developer describes the task in natural language via ChatGPT or VS Code
2. **Agent execution**: Codex runs in a cloud container, following `AGENTS.md` conventions
3. **Output**: A PR appears in your repository with the proposed changes
4. **Review**: Team reviews the PR through normal code review processes
5. **Iteration**: If changes are needed, submit a follow-up task or edit manually

This fits naturally into teams already using GitHub/GitLab PR workflows. The async nature means developers can submit tasks and context-switch to other work. The [complete guide to Codex](/blog/codex-complete-guide) covers setup and configuration in detail.

Codex also supports **[student workflows](/blog/codex-for-students)** with free credits, making it accessible for learning environments where async task submission works well.

### Claude Code in Practice

Claude Code's workflow is more interactive and immediate:

1. **Session start**: Developer opens terminal, starts Claude Code in their project
2. **Task description**: Natural language description of the goal
3. **Agent orchestration**: Claude Code spawns subagents as needed (search, plan, review)
4. **Live execution**: Changes happen in real-time on your local filesystem
5. **In-session review**: You see changes as they're made, can redirect mid-task
6. **Commit**: Claude Code stages, commits, and optionally pushes

The key difference is **feedback loop speed**. With Claude Code, you can watch an agent work, notice it's heading in the wrong direction, and course-correct immediately. With Codex, you wait for the task to complete, review the PR, and submit corrections as new tasks.

Claude Code's [hooks system](/blog/claude-code-hooks-a-complete-guide-to-automating-your-ai-coding-workflow) adds deterministic automation around agent actions — pre-commit validation, post-edit linting, notification triggers. This compensates for the "agent running on your actual machine" risk by adding guardrails the agent can't bypass.

## Isolation and Safety

### Codex: Container-Level Isolation

Every Codex task runs in a fresh container. The agent cannot access your local filesystem, running processes, environment variables, or credentials beyond what you explicitly provide. If a task goes wrong — infinite loop, accidental deletion, corrupted state — it's contained. Your local environment is untouched.

This makes Codex inherently safer for untrusted or experimental tasks. You can ask it to try risky refactoring without worrying about local damage. The tradeoff: the agent can't access tools or services that exist only in your local environment (local databases, running dev servers, custom CLI tools).

### Claude Code: Permission-Based Safety

Claude Code runs locally, which means it *can* access everything on your machine — but it uses a **permission system** to gate dangerous actions. Tool calls that modify files, run commands, or access external services require user approval unless pre-authorized.

The worktree isolation option for subagents provides a middle ground: the subagent works on an isolated copy of the repo, and changes only merge back if the agent succeeds and the parent approves. This gives you Codex-like isolation for specific subtasks while keeping the parent agent's local access for everything else.

For teams concerned about [security](/blog/claude-code-security-vulnerability-scanning), Claude Code's approach is "trust but verify" — the agent has broad capabilities but every action is auditable and approvable.

## When to Choose OpenAI Codex

**Codex is the better choice when:**

- **Your team wants async task delegation.** Submit tasks, switch context, review PRs later. No one needs to babysit the agent.
- **You're processing batch workloads.** Five bugs to fix, ten files to test, three modules to refactor — launch them all and come back to review.
- **Isolation is critical.** Tasks run in sandboxed containers with zero access to your local environment. Nothing can go wrong locally.
- **You're already in the ChatGPT ecosystem.** If your team uses ChatGPT Pro or Enterprise, Codex is included in your plan. No additional billing setup required.
- **You want simple agent customization.** Write an `AGENTS.md` in plain English, commit it, and every task follows those conventions. No complex configuration.
- **Your workflow is PR-centric.** Codex outputs map directly to pull requests, fitting naturally into existing code review processes.

## When to Choose Claude Code

**Claude Code is the better choice when:**

- **Your task requires multi-step coordination.** Search the codebase, design an approach based on findings, implement changes, verify with tests — all in one session with agents handing off results to each other.
- **You need real-time feedback.** Watch the agent work, redirect when it goes off track, ask clarifying questions mid-task. The interactive loop is tighter.
- **You need specialized agent types.** Built-in Explore, Plan, and code-reviewer agents give you purpose-built tools without custom configuration. Each has enforced tool restrictions appropriate to its role.
- **Your project uses complex tooling.** Claude Code runs on your local machine with access to your dev server, database, custom CLI tools, and MCP integrations. Codex's sandboxed containers can't reach these.
- **You want deep programmability.** The [extension stack](/blog/claude-code-extension-stack-skills-hooks-agents-mcp) — Skills, Hooks, MCP servers, agent definitions — gives you fine-grained control over agent behavior at every layer.
- **You're working solo on complex tasks.** Claude Code's interactive model shines for individual developers tackling large, ambiguous problems where the path isn't clear upfront.

## Verdict

**For teams managing async coding workloads, choose Codex.** Its cloud-sandboxed, PR-output model fits naturally into team workflows. `AGENTS.md` is simple to set up and easy for everyone to understand. The limitation is that tasks are independent — no inter-agent communication during execution.

**For developers who need real-time multi-agent orchestration, choose Claude Code.** Its Agent tool, typed subagents, and agent teams enable workflows that Codex's async model can't replicate — coordinated search, planning, and execution within a single session. The tradeoff is complexity: you need to understand the agent system to use it effectively.

The deeper question is whether your work patterns are **batch** (many independent tasks) or **compositional** (multi-step tasks where each step informs the next). Codex optimizes for batch. Claude Code optimizes for composition. Most teams will benefit from understanding both models — many developers already use [multiple AI coding tools](/blog/claude-code-subagents-examples) for different parts of their workflow.

## Frequently Asked Questions

### Can Codex subagents communicate with each other during execution?

No. Each Codex task runs in an isolated container with no shared state or communication channel to other tasks. If Task A's findings should influence Task B, you need to run them sequentially and manually pass context between tasks. Claude Code's agent teams solve this with in-session result passing between parent and child agents.

### Do I need to write code to configure custom agents in either platform?

Neither platform requires code for basic agent customization. Codex uses `AGENTS.md` files written in plain English. Claude Code uses `CLAUDE.md` and `SKILL.md` files, also in natural language. For advanced Claude Code agent definitions with custom tool restrictions and isolation settings, you'll work with structured configuration — but it's declarative, not programmatic.

### Can I use both Codex and Claude Code on the same project?

Yes. The configuration files are independent — `AGENTS.md` for Codex and `CLAUDE.md`/`SKILL.md` for Claude Code. A common pattern is using Codex for batch tasks like test generation and bug fixes (async, PR-based output) while using Claude Code for interactive architecture work and complex refactoring (real-time, session-based). Both can commit to the same repository without conflicts.

### Which platform handles large monorepos better for multi-agent workflows?

Claude Code's Explore subagent type is specifically optimized for searching large codebases without loading the full context. Its worktree isolation keeps subagents from conflicting on shared files. Codex handles monorepos by cloning the full repo into each container, which can be slower for very large repositories but provides complete isolation. For monorepos over 1GB, Claude Code's local execution avoids the clone overhead entirely.

### Is the `AGENTS.md` format in Codex the same as Claude Code's `CLAUDE.md`?

They serve a similar purpose — project-level AI agent instructions committed to your repo — but they're platform-specific. `AGENTS.md` is read by OpenAI Codex. `CLAUDE.md` is read by Claude Code. Neither platform reads the other's configuration file. If you use both tools, maintain both files with your project's conventions expressed in each format.

---

*Want more AI insights? [Subscribe to LoreAI](/subscribe) for daily briefings.*