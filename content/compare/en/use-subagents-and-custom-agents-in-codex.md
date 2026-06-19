---
title: "Claude Code Subagents vs Codex: Multi-Agent AI Coding Compared"
slug: use-subagents-and-custom-agents-in-codex
description: "Compare subagent and custom agent capabilities in OpenAI Codex vs Claude Code. Architecture, workflows, and practical recommendations."
item_a: Claude Code
item_b: OpenAI Codex
category: tools
related_glossary: [agent-sdk, agentic-coding]
related_blog: [claude-code-subagents-examples, claude-code-agent-teams, codex-complete-guide, claude-code-extension-stack-skills-hooks-agents-mcp, con-u-pour-des-workflows-multi-agents]
related_compare: []
related_topics: [codex]
lang: en
---

<!-- Pre-Draft Planning
Target keyword: use subagents and custom agents in codex
Page type: compare
Keyword intent: commercial — user wants to evaluate multi-agent coding capabilities
Likely official-doc competitor: OpenAI Codex docs (task API), Anthropic Claude Code docs (Agent tool)
Likely non-official competitor: tutorials showing single-task Codex usage, Claude Code skill guides
LoreAI standout angle: Side-by-side architectural comparison of how each platform handles multi-agent orchestration, with clear decision rules based on team size, workflow complexity, and isolation requirements
-->

# Claude Code Subagents vs Codex: Multi-Agent AI Coding Compared

**TL;DR:** If you want to **use subagents and custom agents in Codex**, you'll find that OpenAI Codex takes a task-level orchestration approach — each task runs in an isolated cloud sandbox, and multi-agent patterns emerge by composing multiple tasks externally. **Claude Code** has a native subagent system built directly into the runtime, letting you spawn typed agents, define custom agent behaviors in your repo, and orchestrate deterministic multi-agent workflows from a single session. **Claude Code wins on built-in multi-agent depth**; **Codex wins on cloud isolation and async task execution**.

## Overview: Claude Code

**[Claude Code](/glossary/agentic-coding)** is Anthropic's terminal-based AI coding agent that includes a full subagent architecture as a first-class feature. From any Claude Code session, you can spawn specialized subagents — Explore agents for read-only search, Plan agents for architecture design, code-reviewer agents for PR checks — and define your own custom agent types in `.claude/agents/` files that ship with your repository.

The subagent system supports both interactive use (spawn an agent mid-conversation to investigate a question) and programmatic orchestration through Workflows, a scripting layer that lets you define deterministic fan-out patterns with `agent()`, `parallel()`, and `pipeline()` primitives. Agents can run in isolated git worktrees for conflict-free parallel edits and return structured output via JSON Schema validation.

Claude Code's multi-agent capabilities are available across all access tiers — CLI, desktop app, web interface, and IDE extensions. Pricing follows Anthropic's usage-based API billing, with subagent token consumption counting against your session budget.

## Overview: OpenAI Codex

**[OpenAI Codex](/blog/codex-complete-guide)** is OpenAI's cloud-based coding agent platform where each task runs in a sandboxed Linux environment. Rather than offering an in-session subagent primitive, Codex treats each task submission as an independent agent execution — you describe what you want done, Codex spins up an isolated environment with your repo cloned, and the agent works autonomously until it produces a result (typically a PR diff or set of file changes).

To build multi-agent workflows with Codex, you orchestrate at the task level: submit multiple tasks that each handle a portion of the work, then merge their outputs. This external orchestration model means you use Codex's API or CLI to compose multi-agent patterns rather than having them built into the agent runtime itself. Each task gets full isolation — its own filesystem, its own environment — which prevents conflicts but requires coordination logic outside Codex.

Codex is available through ChatGPT Pro, Team, and Enterprise plans, with a [VS Code extension](/blog/codex-vscode) for IDE integration. The platform also offers [free access for open-source maintainers](/blog/codex-for-open-source) and [student credits](/blog/codex-for-students).

## Feature Comparison

| Feature | Claude Code | OpenAI Codex | Winner |
|---------|-------------|--------------|--------|
| **Built-in subagent spawning** | Native `Agent()` tool with typed agents | No in-task subagent primitive | Claude Code |
| **Custom agent definitions** | `.claude/agents/` files in repo | External orchestration only | Claude Code |
| **Multi-agent orchestration** | Workflows with `parallel()`, `pipeline()` | Task-level API composition | Claude Code |
| **Task isolation** | Optional worktree isolation | Full cloud sandbox per task | Codex |
| **Async execution** | Background agents with notifications | Cloud tasks run independently | Codex |
| **Structured output** | JSON Schema validation on agent returns | Task produces diffs/PRs | Claude Code |
| **Agent type registry** | Explore, Plan, code-reviewer, custom | Single general-purpose agent | Claude Code |
| **Parallel execution** | Up to 16 concurrent agents per workflow | Multiple concurrent tasks | Tie |
| **Cost model** | Per-token, subagents share session budget | Per-task, included in plan | Codex |
| **Git integration** | Direct commits from agents | PR-based output per task | Tie |

## Subagent Architecture: Detailed Analysis

Claude Code's subagent system is the deepest multi-agent architecture available in any mainstream coding tool today. When you spawn an agent in Claude Code, you're creating a child process that inherits the session context but operates with its own tool permissions and optional isolation boundaries. This is fundamentally different from simply making multiple API calls — each subagent maintains conversation state, can use tools, and returns structured results.

The agent type system provides specialization without configuration. An **Explore agent** is optimized for read-only codebase search — it can grep, glob, and read files but cannot edit, making it safe to unleash on unfamiliar codebases. A **Plan agent** designs implementation strategies with access to all read tools but no write access. A **code-reviewer agent** focuses on diff analysis. Each type has a curated tool set that prevents the agent from doing things outside its role.

Custom agents extend this system into your project's domain. By creating a markdown file in `.claude/agents/`, you define a new agent type with a custom system prompt and tool access pattern. For example, a `pipeline-reviewer` agent could be configured to cross-check pipeline script changes against a known-issues registry — triggered automatically after editing specific files. These definitions travel with your repository, so every team member's Claude Code session has access to the same specialized agents.

For a practical walkthrough of building custom agents and composing them into workflows, see our [Claude Code subagents guide with examples](/blog/claude-code-subagents-examples).

Codex's approach is architecturally different. Each Codex task is a fully isolated execution — the agent gets a fresh clone of your repo, a clean Linux environment, and works independently. There is no mechanism for one Codex task to spawn a child task or communicate with a sibling task during execution. Multi-agent patterns in Codex are built by your external orchestration layer: submit Task A and Task B in parallel via the API, wait for both to complete, merge their results.

This isolation-first model has real advantages. There is zero risk of agent interference — Task A cannot accidentally overwrite Task B's work because they're in separate sandboxes. Environment consistency is guaranteed since each task starts from a known state. And the cloud execution model means tasks run even when your laptop is closed.

But the tradeoff is significant for complex workflows. Any coordination logic — deduplication across agent findings, conditional execution based on previous agent results, structured data flow between stages — must live outside Codex, in your own scripts or CI pipeline.

## Workflow Orchestration: Detailed Analysis

The second major differentiator is how each platform handles multi-step, multi-agent orchestration.

Claude Code provides a **Workflow** scripting layer that lets you define deterministic orchestration patterns in JavaScript. A workflow script can fan out work across multiple agents, collect structured results, and make decisions based on those results — all within a single execution context. Key primitives include:

- **`agent(prompt, opts)`**: Spawn a subagent with optional schema for structured returns, model override, isolation mode, and agent type selection
- **`parallel(thunks)`**: Run multiple agent calls concurrently with a barrier — wait for all to complete before proceeding
- **`pipeline(items, ...stages)`**: Process items through multiple stages without barriers — Item A can be in Stage 3 while Item B is in Stage 1
- **`phase(title)`**: Group agents under labeled progress phases for observability

A typical pattern — reviewing code changes across multiple dimensions with adversarial verification — looks like this: fan out reviewer agents (one per dimension), then pipeline each finding through a verification agent that tries to refute it. Findings that survive verification are returned as confirmed issues. The entire flow is deterministic and resumable.

Claude Code Workflows also support budget-aware execution. If a user specifies a token budget, the workflow can dynamically scale — spawning more agents when budget permits and stopping gracefully when it runs low. This prevents runaway costs while maximizing coverage.

For more on how Claude Code's [extension stack](/blog/claude-code-extension-stack-skills-hooks-agents-mcp) — skills, hooks, agents, and MCP — composes into programmable workflows, see our detailed breakdown.

Codex's orchestration story is task-level composition via the API. You submit tasks, poll for completion, and handle results in your own code. This is a valid pattern — and it's how many teams already orchestrate CI/CD pipelines — but it means the orchestration logic lives outside the AI system. You can't express "if the bug-finding agent returns zero results, skip the verification phase" inside Codex; that conditional lives in your wrapper script.

The [multi-agent workflow patterns emerging around Codex](/blog/con-u-pour-des-workflows-multi-agents) tend to use external orchestrators (GitHub Actions, custom scripts, or third-party platforms like Dispatch) to compose Codex tasks into larger pipelines. This works, but adds integration complexity that Claude Code's built-in Workflow system eliminates.

## Custom Agent Definitions: Detailed Analysis

Defining custom, project-specific agent behaviors is where Claude Code's architecture shows its strongest advantage for teams.

In Claude Code, a custom agent is a markdown file placed in `.claude/agents/` within your repository. The file contains a system prompt that defines the agent's personality, focus area, and behavioral constraints. When any team member spawns this agent type, they get consistent behavior shaped by your project's needs. Custom agents compose naturally with Claude Code's other extension points — a custom agent can reference Skills for task-specific prompts and connect to MCP servers for external data.

Practical examples of custom agents include:

- **A migration reviewer** that checks database migrations against a project-specific safety checklist
- **A security auditor** that scans changes for patterns matching your organization's threat model
- **A documentation checker** that verifies code changes have corresponding doc updates per your project's rules

These agent definitions are version-controlled, reviewed in PRs, and evolve with your codebase. New team members get your entire agent library by cloning the repo.

Codex does not currently offer an equivalent mechanism for defining custom agent behaviors that persist across tasks. Each Codex task receives the same general-purpose agent. You can customize behavior through detailed task prompts, and you can include setup scripts that run before the agent starts, but there is no declarative "agent type" system. If you want a Codex task to behave like a security reviewer, you encode that entirely in the task prompt — which works, but doesn't benefit from the discoverability and composability of a typed agent system.

## When to Choose Claude Code

Choose Claude Code for multi-agent workflows when:

- **Your task requires agent coordination**: Reviewing code across multiple dimensions, running parallel investigations that feed into a synthesis step, or any pattern where Agent B needs Agent A's output. Claude Code's Workflow system handles this natively.
- **You want project-specific agent types**: If your team would benefit from specialized agents — a migration checker, a style enforcer, a domain-specific reviewer — Claude Code's `.claude/agents/` system lets you define and version-control them.
- **You need structured data flow between agents**: Claude Code agents can return validated JSON objects via schema enforcement, making it straightforward to chain agent outputs into downstream logic.
- **You prefer terminal-based workflows**: Claude Code runs locally with full access to your development environment. Subagents share this context, seeing the same files and tools you do.

Claude Code is the stronger choice for teams building sophisticated [agentic coding](/glossary/agentic-coding) workflows where the agents need to collaborate, not just run in parallel. See how teams are using [agent teams for parallel sub-agent execution](/blog/claude-code-agent-teams) at scale.

## When to Choose OpenAI Codex

Choose Codex for multi-agent patterns when:

- **You need strong isolation guarantees**: Each Codex task runs in a fully sandboxed cloud environment. If your workflow requires that parallel agents cannot interfere with each other's filesystem or environment state, Codex provides this by architecture rather than by convention.
- **You want async, fire-and-forget execution**: Submit tasks from your phone, close your laptop, and check results later. Codex tasks run in the cloud independently of your local machine.
- **Your orchestration already lives in CI/CD**: If you already have GitHub Actions, Jenkins, or another pipeline tool managing your development workflows, adding Codex tasks as steps is natural. The task API integrates with existing infrastructure.
- **You're on an OpenAI plan with included Codex access**: Pro, Team, and Enterprise plans include Codex usage. If your team is already on OpenAI's platform, the marginal cost of multi-task patterns may be lower than adding Claude Code API spend.

Codex is the right fit when you want cloud-isolated task execution and your multi-agent coordination needs are handled by existing infrastructure. Read our [complete Codex guide](/blog/codex-complete-guide) for setup details.

## Verdict

**For built-in subagent and custom agent capabilities, Claude Code is the clear winner.** Its native Agent tool, typed agent system, custom agent definitions, and Workflow orchestration layer provide a complete multi-agent development platform out of the box. If you searched for how to use subagents and custom agents in Codex, the honest answer is that Codex does not offer an equivalent in-session subagent system — multi-agent patterns require external orchestration.

**Codex wins on isolation and async execution.** Its cloud sandbox model guarantees zero interference between parallel tasks, and the fire-and-forget execution model fits teams that want to submit work and review results later.

For most teams exploring multi-agent coding workflows, **start with Claude Code's subagent system** — the barrier to entry is lower (spawn an agent inline, no external orchestration needed), the custom agent definitions scale with your team, and the Workflow scripting layer handles complex fan-out patterns that would require significant custom code to replicate on top of Codex. If you later need cloud-isolated execution for specific workloads, Codex tasks can complement a Claude Code workflow rather than replace it. Learn more about combining tools in our [agent harness comparison](/blog/agent-harnesses-2026).

## Frequently Asked Questions

### Can you use subagents inside a single Codex task?

Codex does not currently support spawning subagents within a single task execution. Each task runs as one agent in an isolated sandbox. To achieve multi-agent patterns, you submit multiple tasks via the Codex API or CLI and coordinate their outputs externally through your own scripts or CI pipeline.

### How do Claude Code custom agents differ from Skills?

Custom agents (`.claude/agents/` files) define a new agent **type** with a specialized system prompt and tool access pattern — they change how the agent thinks and what it can do. Skills (`.claude/skills/` files) define **task instructions** that any agent type can follow — they change what the agent is asked to do. You can combine both: a custom security-reviewer agent can invoke a vulnerability-scanning skill.

### Is Claude Code's multi-agent orchestration available on all plans?

Claude Code's Agent tool and custom agent definitions work across all access methods — CLI, desktop app, web app, and IDE extensions. Workflows (the scripting layer for deterministic multi-agent orchestration) are also available to all users. Token consumption from subagents counts against your session's API usage budget.

### Can Codex tasks communicate with each other during execution?

No. Each Codex task runs in complete isolation — separate filesystem, separate environment, no shared state. Tasks cannot send messages to or read results from sibling tasks during execution. All inter-task coordination happens after task completion, managed by your external orchestration layer.

### Which platform is better for a team of 5-10 developers?

For a team that wants consistent multi-agent behaviors across developers, **Claude Code** is more practical. Custom agent definitions in `.claude/agents/` are version-controlled and shared via the repo — every developer gets the same specialized agents automatically. With Codex, achieving consistent agent behavior across team members requires standardizing task prompts externally, which adds coordination overhead.

---

*Want more AI insights? [Subscribe to LoreAI](/subscribe) for daily briefings.*