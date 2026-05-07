---
title: "Use Subagents and Custom Agents in Codex vs Claude Code: Multi-Agent AI Coding Compared"
slug: use-subagents-and-custom-agents-in-codex
description: "Compare subagent and custom agent workflows in OpenAI Codex vs Claude Code — architecture, orchestration, and when to use each."
item_a: OpenAI Codex
item_b: Claude Code
category: tools
related_glossary: [agent-sdk, agentic-coding]
related_blog: [codex-complete-guide, claude-code-agent-teams, claude-code-subagents-examples, claude-code-extension-stack-skills-hooks-agents-mcp, claude-code-complete-guide]
related_compare: []
related_topics: [codex]
lang: en
---

<!-- Pre-Draft Planning
1. Target keyword: use subagents and custom agents in codex
2. Page type: comparison
3. Keyword intent: commercial — user wants to evaluate multi-agent capabilities before choosing a coding agent platform
4. Likely official-doc competitor: OpenAI Codex docs (tasks API), Anthropic Claude Code docs (Agent tool reference)
5. Likely non-official competitor pattern: thin "Codex vs Claude Code" listicles that compare pricing and ignore agent architecture entirely
6. LoreAI standout angle: We break down the actual orchestration models — Codex's task-based parallelism vs Claude Code's in-process subagent spawning — and give concrete decision rules based on workflow type, team size, and codebase complexity
-->

# Use Subagents and Custom Agents in Codex vs Claude Code: Multi-Agent AI Coding Compared

**TL;DR:** If you want to **use subagents and custom agents in Codex**, you're working with a task-based model — each Codex task runs in an isolated cloud sandbox, and you orchestrate multiple tasks externally. **Claude Code** takes a fundamentally different approach with native in-process subagents that share context and can be customized via agent definition files. **Choose Codex** for fire-and-forget parallel tasks on well-scoped issues. **Choose Claude Code** for interactive multi-agent workflows where subagents need to coordinate, share findings, and feed results back into a parent session.

## Overview: OpenAI Codex

**[OpenAI Codex](/blog/codex-complete-guide)** is a cloud-based AI coding agent that executes tasks in sandboxed environments. Each task gets its own container with a full development environment — cloned repo, installed dependencies, and shell access — running asynchronously in the cloud. Codex is designed around a task-dispatch model: you describe what you want done (fix a bug, write a test, refactor a module), and Codex spins up an isolated environment to execute it.

Codex doesn't expose a formal "subagent" API in the way traditional multi-agent frameworks do. Instead, its multi-agent capability comes from **task-level parallelism** — you can dispatch multiple Codex tasks simultaneously, each operating independently on its own copy of the repository. This is closer to a job queue than an agent orchestra. Each task produces a pull request or diff as output, and the human developer reviews and merges the results.

The platform integrates with ChatGPT's interface and the [Codex VS Code extension](/blog/codex-vscode), making it accessible to developers who prefer GUI-driven workflows. Pricing follows OpenAI's usage-based model, with [free credits available for students](/blog/codex-for-students) and [open-source maintainers](/blog/codex-for-open-source).

## Overview: Claude Code

**[Claude Code](/blog/claude-code-complete-guide)** is Anthropic's terminal-based AI coding agent with a native subagent system built into its core architecture. Unlike Codex's external task dispatch, Claude Code spawns subagents as in-process workers within the same session. The parent agent can launch specialized subagents — Explore agents for codebase search, Plan agents for architecture design, general-purpose agents for complex tasks — and receive their results directly.

Claude Code's [extension stack](/blog/claude-code-extension-stack-skills-hooks-agents-mcp) goes further with custom agent definitions: you define agent types in files with specific capabilities, tool access, and behavioral instructions. These custom agents become first-class citizens that the parent agent can invoke by name. Combined with [agent teams](/blog/claude-code-agent-teams) for parallel sub-agent execution and git worktree isolation for safe concurrent edits, Claude Code provides a full multi-agent orchestration layer within a single terminal session.

Claude Code runs locally on your machine (macOS, Linux) with API-based billing per token. It reads project context from CLAUDE.md files and skill definitions, giving every subagent access to your project's conventions and constraints.

## Feature Comparison

| Feature | OpenAI Codex | Claude Code | Winner |
|---------|-------------|-------------|--------|
| **Agent model** | Task-based (isolated containers) | In-process subagents (shared session) | Depends on use case |
| **Parallelism** | Multiple independent tasks | Parallel subagents with result aggregation | Claude Code |
| **Custom agents** | Not natively supported | Agent definition files with custom tools | Claude Code |
| **Agent specialization** | Single general-purpose agent per task | Typed agents (Explore, Plan, general-purpose, custom) | Claude Code |
| **Context sharing** | None between tasks | Parent ↔ subagent context passing | Claude Code |
| **Isolation** | Full container isolation per task | Optional worktree isolation per subagent | Codex |
| **Execution environment** | Cloud (sandboxed) | Local machine | Tie |
| **Output format** | PR / diff per task | In-session results, edits, or PRs | Tie |
| **Interface** | ChatGPT UI, VS Code extension, CLI | Terminal CLI | Tie |
| **Pricing** | Usage-based (OpenAI tokens) | Usage-based (Anthropic tokens) | Tie |

## Agent Architecture: Detailed Analysis

The most important difference between these two platforms is *how* they implement multi-agent workflows — and this architectural decision shapes everything else.

**Codex's task-based model** treats each unit of work as an independent job. When you create a Codex task, the platform provisions a fresh sandbox container, clones your repository into it, installs dependencies, and hands control to the agent. The agent works autonomously — reading files, running commands, making edits — then produces a result (typically a git diff or PR). Crucially, tasks don't communicate with each other. If you dispatch five tasks in parallel, each one operates in complete isolation. There's no shared memory, no message passing, no coordination.

This design has a clear upside: **safety through isolation**. A Codex task cannot accidentally corrupt another task's work. Each task operates on its own copy of the codebase, so concurrent modifications don't create conflicts until merge time. For teams using Codex to parallelize independent bug fixes or feature implementations, this model works well — it's essentially a CI pipeline where the "build step" is an AI agent.

The downside is equally clear: **no inter-agent coordination**. If task A discovers something that task B needs to know, there's no mechanism for that communication. The human developer becomes the coordination layer, reviewing outputs from multiple tasks and manually synthesizing them. For workflows that require iterative exploration — where one agent's findings inform another agent's work — Codex requires the developer to chain tasks sequentially, passing context manually between runs.

**Claude Code's in-process subagent model** takes the opposite approach. The parent agent spawns subagents within the same logical session using the Agent tool. Each subagent receives a prompt with context, executes its work, and returns results to the parent. The parent can then synthesize findings across multiple subagents, make decisions based on their collective output, and spawn additional agents as needed.

For example, a parent Claude Code session might launch three subagents in parallel: one to search for all usages of a deprecated API, one to review the migration guide, and one to check test coverage for affected modules. When all three return, the parent combines their findings into a unified migration plan and begins executing it — potentially spawning more subagents to handle different parts of the refactoring.

This model enables **emergent coordination patterns** that aren't possible with isolated tasks. The parent agent acts as an orchestrator, routing information between subagents and making higher-level decisions. The tradeoff is reduced isolation — subagents share the parent's environment, and without worktree isolation, concurrent file edits could conflict.

Claude Code mitigates this with optional **worktree isolation**, where subagents operate on separate git worktrees. This provides file-level isolation without losing the communication channel back to the parent. It's a middle ground between Codex's full container isolation and unrestricted shared access.

## Custom Agent Creation: Detailed Analysis

The ability to define custom agents — specialized workers with specific capabilities, tools, and behavioral instructions — is where the two platforms diverge most sharply.

**Codex does not currently offer a custom agent definition system.** Each Codex task runs the same general-purpose coding agent. You customize behavior through the task prompt: describing what you want done, what constraints to follow, and what output format to produce. You can also influence behavior through repository-level configuration (like a `AGENTS.md` or setup script that runs before the agent starts work). But there's no mechanism to define a "test-writing agent" or "security-review agent" as a reusable, named entity that Codex invokes with different tool permissions or behavioral rules.

For teams that want specialized agents in a Codex workflow, the pattern is to encode specialization in the prompt. You might have a set of saved prompts — one for test generation, one for code review, one for documentation — and dispatch the appropriate prompt as a Codex task. This works, but the specialization lives outside the platform: in your prompt library, your CI scripts, or your team's workflow documentation.

**Claude Code provides a formal custom agent system.** You can define agent types in agent definition files that specify the agent's name, description, available tools, model, and behavioral instructions. These definitions are loaded into the session, and the parent agent can spawn them by name. A custom agent might have access only to read-only tools (for a research agent), or full edit/write access with specific skill files loaded (for a refactoring agent).

This matters for several reasons:

1. **Reusability**: Define a "security-review" agent once, use it across all sessions. The agent's behavior is versioned in your repository alongside your code.

2. **Tool scoping**: Custom agents can be restricted to specific tools. An Explore agent gets read-only search tools. A Plan agent gets read tools plus architecture-planning capabilities. A general-purpose agent gets everything. This follows the principle of least privilege — agents only have access to what they need.

3. **Behavioral consistency**: Custom agent definitions include behavioral instructions that persist across invocations. Your "test-writer" agent always follows your testing conventions because those conventions are encoded in the agent definition, not remembered from a prompt.

4. **Team standardization**: [Skills](/blog/5-claude-code-skills-i-use-every-single-day) and agent definitions travel with the repo. When a new team member runs Claude Code, they get the same custom agents as everyone else — no prompt sharing or onboarding friction required.

The practical impact: teams using Claude Code for multi-agent workflows can build increasingly sophisticated agent ecosystems over time, with each custom agent encoding domain-specific expertise. Teams using Codex rely on external orchestration and prompt engineering to achieve similar specialization.

## Parallel Execution and Orchestration: Detailed Analysis

Both platforms support parallel work, but the orchestration model differs in ways that affect real workflows.

**Codex parallelism** is straightforward: dispatch N tasks, get N results. You can submit multiple tasks through the ChatGPT interface, the [VS Code extension](/blog/codex-vscode), or the API. Each task runs independently in its own container. The platform handles provisioning, execution, and result collection. You don't need to think about resource contention, file locking, or coordination — because there is none.

This simplicity is a feature for certain workflows. If you have ten independent bug fixes, each touching different parts of the codebase, Codex's parallel task dispatch is ideal. You describe each fix, dispatch all ten, and review the results as they come in. The lack of coordination isn't a problem because the tasks are genuinely independent.

The limitation emerges with **dependent workflows**. Consider a large refactoring: rename a core type, update all consumers, fix tests, update documentation. These steps depend on each other — you can't update consumers until the type is renamed. In Codex, this becomes a sequential chain of tasks, with the developer manually bridging each step: run task 1, review result, merge, run task 2, review, merge, and so on. The developer is the orchestrator.

**Claude Code parallelism** operates at the subagent level within a session. The parent agent decides which subagents to launch, whether they should run in parallel or sequentially, and how to use their results. This enables patterns like:

- **Fan-out/fan-in**: Spawn five Explore agents to search different parts of the codebase, collect results, then make a unified plan
- **Pipeline**: Agent A researches → parent synthesizes → Agent B implements → Agent C tests
- **Conditional branching**: Spawn a diagnostic agent; based on findings, spawn either a fix agent or a deeper investigation agent

The orchestration logic lives in the parent agent's reasoning, not in an external system. This makes complex workflows expressible as natural conversations rather than pipeline configurations.

For [effective long-running agent workflows](/blog/effective-harnesses-for-long-running-agents), Claude Code's approach means the agent can adapt its strategy mid-execution. If a subagent reports that a planned approach won't work, the parent can pivot immediately — spawning different agents with a revised strategy. Codex would require the human developer to recognize the issue, cancel remaining tasks, and re-plan.

## When to Choose OpenAI Codex

Choose Codex when your multi-agent needs align with independent, parallel task execution:

- **Batch processing independent issues**: You have a backlog of self-contained bugs or small features, and you want to throw AI at all of them simultaneously. Codex's container isolation means each task can't break the others.

- **Team-wide task distribution**: Multiple developers dispatching tasks through a shared interface (ChatGPT or [VS Code](/blog/codex-vscode)). Codex's cloud-based model means no local setup beyond the extension.

- **Strict isolation requirements**: Your security model requires that AI agents operate in sandboxed environments with no local machine access. Codex's cloud containers provide this by default.

- **GUI-preferred workflows**: Your team prefers visual interfaces over terminal interactions. Codex's ChatGPT integration and VS Code extension provide approachable entry points.

- **Open-source projects**: If you maintain open-source software, [Codex for Open Source](/blog/codex-for-open-source) provides free access to Pro-tier tools — a significant cost advantage for multi-task workflows.

## When to Choose Claude Code

Choose Claude Code when your workflows require coordination, customization, or iterative multi-agent reasoning:

- **Complex refactoring across modules**: Tasks where one agent's findings inform another's work. Claude Code's parent-subagent communication eliminates the manual bridging that Codex requires.

- **Custom agent ecosystems**: Your team has specialized workflows — security review, test generation, documentation — that benefit from reusable agent definitions with scoped tool access. Claude Code's [extension stack](/blog/claude-code-extension-stack-skills-hooks-agents-mcp) makes this possible.

- **Interactive exploration**: You don't know the full scope of the work upfront. Claude Code's subagent model lets you start with an Explore agent, refine your understanding, then spawn implementation agents based on discoveries.

- **Codebase-aware automation**: Projects with rich CLAUDE.md and [skill configurations](/blog/9-principles-writing-claude-code-skills) that should propagate to all subagents. Every Claude Code subagent inherits project context automatically.

- **Local-first development**: You want AI agents running on your machine, with your tools, your shell environment, and your git configuration. Claude Code's terminal-native approach keeps everything local.

- **Agentic orchestration without external tooling**: You want the agent itself to decide when to parallelize, when to serialize, and when to pivot — without building a separate orchestration layer.

## Verdict

**For independent, parallel task execution, Codex's container-isolated model is simpler and safer.** You dispatch tasks, each runs in its own sandbox, and you review the results. No coordination overhead, no risk of cross-task interference.

**For coordinated multi-agent workflows with custom specialization, Claude Code is the stronger platform.** Its native subagent system, custom agent definitions, typed agent specializations, and in-session orchestration provide capabilities that Codex's task-based model doesn't match. If you need agents that talk to each other, share findings, and adapt strategy mid-execution, Claude Code is the tool to use.

The deciding question: **are your AI coding tasks independent or interdependent?** Independent tasks favor Codex's isolation model. Interdependent tasks favor Claude Code's coordination model. Many teams will find that both patterns appear in their workflows — using Codex for batch bug fixes and Claude Code for complex, multi-step engineering projects. For deeper examples of subagent patterns in practice, see our guide on [Claude Code subagent workflows](/blog/claude-code-subagents-examples).

## Frequently Asked Questions

### Can Codex tasks communicate with each other during execution?

No. Each Codex task runs in an isolated container with no inter-task communication channel. Tasks execute independently and produce separate outputs (typically PRs or diffs). If one task's result should inform another, you need to review the first task's output and manually pass relevant context into the second task's prompt.

### How do Claude Code custom agents differ from prompt templates?

Custom agents in Claude Code are defined in agent definition files that specify tool access, model selection, and behavioral instructions — not just prompt text. A custom agent might be restricted to read-only tools (for research) or granted specific write permissions (for implementation). This scoping persists across invocations and is version-controlled in your repository, unlike prompt templates stored externally.

### Is there a limit to how many subagents Claude Code can spawn?

Claude Code doesn't impose a hard limit on subagent count, but practical constraints apply. Each subagent consumes context window capacity and API tokens. Running many subagents in parallel increases cost and can slow response times. The recommended pattern is to spawn 2-5 focused subagents per task, using fan-out for research and sequential chains for implementation.

### Can I use Codex and Claude Code together?

Yes. A practical combined workflow: use Claude Code locally for interactive exploration and coordinated refactoring (where subagent communication matters), then dispatch well-scoped implementation tasks to Codex for parallel execution in the cloud. Review Codex's PRs, then return to Claude Code for integration testing and follow-up work.

### Do Codex tasks inherit repository configuration automatically?

Codex tasks clone your repository and can run setup scripts, so configuration files like `AGENTS.md` or dependency manifests are available. However, there's no equivalent to Claude Code's CLAUDE.md context propagation system, where project instructions and skill definitions automatically inform every subagent's behavior without explicit prompt inclusion.

---

*Want more AI insights? [Subscribe to LoreAI](/subscribe) for daily briefings.*