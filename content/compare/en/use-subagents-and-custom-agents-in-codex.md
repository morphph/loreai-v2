---
title: "Claude Code Subagents vs Codex Custom Agents: Multi-Agent Coding Compared"
slug: use-subagents-and-custom-agents-in-codex
description: "Compare subagents in Claude Code vs custom agents in Codex: architecture, flexibility, and when to use each multi-agent approach."
item_a: Claude Code Subagents
item_b: Codex Custom Agents
category: tools
related_glossary: [agent-sdk, agentic-coding]
related_blog: [claude-code-subagents-examples, claude-code-agent-teams, codex-complete-guide]
related_compare: []
related_topics: [codex]
lang: en
---

# Claude Code Subagents vs Codex Custom Agents: Multi-Agent Coding Compared

**TL;DR:** Claude Code subagents run locally in your terminal with real-time spawning of specialized child agents during a session — ideal for interactive, multi-step workflows you supervise. Codex custom agents run in isolated cloud sandboxes with pre-configured instructions — better for fire-and-forget batch tasks. **Claude Code wins on flexibility and real-time orchestration; Codex wins on isolation and async parallel execution.**

## Overview: Claude Code Subagents

Claude Code's subagent system lets you spawn specialized child agents mid-session using the Agent tool. Each subagent type has a defined role: Explore agents for fast read-only code search, Plan agents for architecture design, general-purpose agents for multi-step research, and custom-defined agents for domain-specific tasks. Subagents inherit your local environment — they read your files, run your shell, and operate on your actual codebase.

The key architectural choice: subagents are ephemeral and session-scoped. They spin up when needed, execute their task, and return results to the parent agent. You can run multiple subagents in parallel for independent work, or chain them sequentially when outputs feed into the next step. This makes Claude Code's approach fundamentally interactive — you're in the loop, approving actions and steering direction. For a deeper look at how teams use this in practice, see our [Claude Code subagents examples guide](/blog/claude-code-subagents-examples).

## Overview: Codex Custom Agents

OpenAI's Codex takes a different architectural approach to multi-agent work. Custom agents in Codex are pre-configured task runners that execute in isolated cloud sandboxes. You define an agent's instructions, give it a repository and environment, and dispatch it to work independently. Each Codex agent gets its own containerized environment with pinned dependencies — complete isolation from your local machine.

Codex custom agents are designed for asynchronous workflows. You send a task, Codex spins up the environment, clones your repo, executes the work, and returns results (typically a PR or diff). You can run multiple custom agents simultaneously on different tasks without them interfering with each other. The tradeoff: less real-time control, more autonomous execution. See our [complete Codex guide](/blog/codex-complete-guide) for full platform details.

## Feature Comparison

| Feature | Claude Code Subagents | Codex Custom Agents | Winner |
|---------|----------------------|--------------------:|--------|
| **Execution environment** | Local terminal, your machine | Cloud sandbox, isolated container | Codex (isolation) |
| **Spawning model** | On-demand during session | Pre-configured, dispatched | Claude Code (flexibility) |
| **Parallelism** | Multiple subagents in single message | Multiple agents on different tasks | Tie |
| **Context sharing** | Shared filesystem, parent context | Isolated per agent, repo snapshot | Claude Code |
| **Real-time control** | Full — approve/deny each action | Async — review results after | Claude Code |
| **Custom instructions** | SKILL.md files + agent definitions | Agent configuration + system prompts | Tie |
| **Git integration** | Direct commits to your working tree | Returns PRs/diffs for review | Codex (safety) |
| **Cost model** | Per-token during session | Per-task cloud compute | Varies |

## Agent Orchestration: Detailed Analysis

Claude Code's orchestration model is built around the concept of a parent agent delegating to child agents within a single conversation. The parent agent — the one you interact with directly — decides when to spawn subagents based on task complexity. For example, when facing a codebase-wide refactoring, the parent might spawn an Explore agent to locate all affected files, then spawn multiple general-purpose agents in parallel to handle independent modules simultaneously.

This architecture is documented in Anthropic's [agent teams system](/blog/claude-code-agent-teams), which enables parallel sub-agent execution for large codebases. The critical design choice: subagents share the same filesystem and git state as the parent. One subagent's file edits are immediately visible to another. This enables tight coordination but requires careful sequencing to avoid conflicts.

Codex's orchestration works differently. Each custom agent operates on its own snapshot of the repository. There's no shared mutable state between concurrent agents. This eliminates coordination bugs entirely — two agents working on different features can't accidentally conflict — but it also means you can't easily chain dependent tasks without manual intervention between steps. The isolation-first model trades flexibility for safety.

For teams using [agentic coding](/glossary/agentic-coding) workflows at scale, this architectural difference determines your entire workflow pattern. Claude Code suits "pair programming with AI" where you stay engaged. Codex suits "ticket queue" workflows where you dispatch and review.

## Customization and Extensibility: Detailed Analysis

Both platforms support custom agent definitions, but the mechanisms differ significantly.

Claude Code uses a file-based customization system. SKILL.md files define task-specific instructions that any subagent can reference. Custom agent types can be defined with specific tool access and behavioral constraints. The [extension stack](/blog/claude-code-extension-stack-skills-hooks-agents-mcp) — Skills, Hooks, Agents, and MCP — provides four layers of programmability. You can define an agent that only has read access, or one that can execute arbitrary shell commands but never touches git. This granularity matters for enterprise environments where different team members need different capability levels.

Codex custom agents are configured through the platform's interface or API. You specify system-level instructions, environment setup (dependencies, build commands), and access permissions. The customization is task-oriented rather than capability-oriented — you describe what the agent should do, and the platform handles sandboxing and resource allocation. This is simpler to set up but offers less fine-grained control over agent behavior during execution.

The [Agent SDK](/glossary/agent-sdk) approach used by Claude Code also allows for community-shared agent definitions that travel with your repository. Any developer who clones the repo gets the same agent configurations — no platform-specific setup required.

## When to Choose Claude Code Subagents

Choose Claude Code's subagent system when you need:

- **Interactive multi-step workflows** where each step's output informs the next — debugging sessions, exploratory refactoring, or architecture decisions that require human judgment at branch points
- **Tight codebase integration** where agents need to read test results, check build output, and react to the current state of your working tree in real time
- **Custom orchestration patterns** — chaining Explore → Plan → implementation agents in sequences tailored to your specific workflow
- **Local-first development** where code never leaves your machine and you maintain full control over what gets committed

Teams that treat AI coding as collaborative pair programming — watching the agent work, redirecting when it goes off track, approving changes incrementally — will get more value from Claude Code's interactive model. The subagent system shines when tasks are exploratory or require judgment calls the agent can't make alone.

## When to Choose Codex Custom Agents

Choose Codex custom agents when you need:

- **Batch processing of independent tasks** — spinning up 10 agents to handle 10 unrelated bug fixes simultaneously, then reviewing all PRs at once
- **Strict isolation guarantees** — each agent gets a clean environment, eliminating concerns about one task corrupting state for another
- **Async workflows for distributed teams** — dispatching work before you go offline, reviewing results when you return
- **Standardized task execution** — repeatable agent configurations that any team member can trigger without understanding the underlying orchestration

Organizations running [Codex for open source projects](/blog/codex-for-open-source) or using it as a [VS Code extension](/blog/codex-vscode) in team settings benefit from the dispatch-and-review model. It fits naturally into existing PR review workflows — the agent is just another contributor submitting code for review.

## Verdict

**If you need real-time orchestration with multiple specialized agents working on your live codebase, Claude Code subagents are the stronger choice.** The ability to spawn, coordinate, and redirect agents mid-session — combined with the SKILL.md and [hooks system](/blog/claude-code-hooks-mastery) for deterministic guardrails — gives you more control over complex multi-agent workflows.

**If you need isolated, async execution where multiple agents work independently on separate tasks, Codex custom agents are the better fit.** The cloud sandbox model eliminates coordination overhead and fits naturally into PR-based team workflows.

Many teams are adopting both: Claude Code for interactive development sessions requiring real-time judgment, Codex for batch task processing and overnight work queues. The architectures are complementary rather than competing — they optimize for different points on the control-vs-autonomy spectrum.

## Frequently Asked Questions

### Can Claude Code subagents and Codex custom agents work on the same repository?

Yes. Claude Code operates on your local checkout while Codex works on cloud snapshots. You can use Claude Code subagents for real-time development, then dispatch Codex agents for independent tasks like test generation or documentation updates without conflicts.

### How many subagents can Claude Code run in parallel?

Claude Code supports spawning multiple subagents in a single message for independent work. The practical limit depends on your machine's resources and the complexity of each subagent's task. For CPU-intensive work like builds or test runs, 3-5 parallel agents is typical.

### Do Codex custom agents support MCP server connections?

Codex agents run in isolated cloud sandboxes with network access for package installation and API calls. Claude Code's MCP server integrations provide richer tool connectivity for local development, including database access, monitoring systems, and external service integrations via the Model Context Protocol.

### Which approach is more cost-effective for large refactoring tasks?

Claude Code's token-based pricing means you pay for the full interactive session including agent coordination overhead. Codex's per-task model can be more predictable for well-defined tasks. For exploratory refactoring requiring many direction changes, Claude Code's interactive model often costs less because you catch wrong paths early.

---

*Want more AI insights? [Subscribe to LoreAI](/subscribe) for daily briefings.*