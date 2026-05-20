---
title: "Claude Code Subagents vs Codex Custom Agents: Multi-Agent Coding Workflows Compared"
slug: use-subagents-and-custom-agents-in-codex
description: "Compare how to use subagents and custom agents in Codex vs Claude Code for multi-agent coding workflows, with architecture and practical tradeoffs."
item_a: Claude Code Subagents
item_b: Codex Custom Agents
category: tools
related_glossary: [agent-sdk, agentic-coding]
related_blog: [claude-code-subagents-examples, claude-code-agent-teams, codex-complete-guide]
related_compare: []
related_topics: [codex]
lang: en
---

# Claude Code Subagents vs Codex Custom Agents: Multi-Agent Coding Workflows Compared

**TL;DR:** If you need to **use subagents and custom agents in Codex** or Claude Code, the two platforms take fundamentally different approaches. **Claude Code wins on local, interactive multi-agent orchestration** — you spawn typed subagents inline during a session, each with its own tools and isolation model. **Codex wins on cloud-based, asynchronous task delegation** — you define custom agent configurations that run in sandboxed containers, ideal for fire-and-forget jobs. The right choice depends on whether your workflow is conversational or batch-oriented.

## Overview: Claude Code Subagents

[Claude Code's subagent system](/blog/claude-code-agent-teams) lets a primary agent spawn specialized child agents during a single coding session. Each subagent has a defined type — Explore for read-only codebase search, Plan for architecture design, code-reviewer for PR analysis, and a general-purpose catch-all. The parent agent delegates tasks by writing a self-contained prompt, and the subagent executes independently with its own tool access before returning results.

The key architectural decision is that subagents run **within the same local environment** as the parent. They share the filesystem, git state, and project context. An Explore agent can grep your codebase; a general-purpose agent can edit files and run shell commands. For isolation, Claude Code offers a `worktree` mode that creates a temporary git worktree so the subagent works on an isolated copy of the repo — changes only persist if the agent actually modifies files.

This design makes subagents ideal for interactive development workflows where you need parallel research, concurrent edits across modules, or a second opinion on a code change without context-switching out of your terminal session.

## Overview: Codex Custom Agents

[OpenAI's Codex](/blog/codex-complete-guide) takes a different approach to multi-agent work. Rather than spawning child agents inline, Codex runs each task in a **cloud-hosted sandboxed container**. You submit a task — a bug fix, a feature request, a refactoring job — and Codex provisions an isolated environment, clones your repo, installs dependencies, and works autonomously. The result is a pull request or a set of changes you review asynchronously.

Custom agents in Codex extend this model by letting you define **reusable agent configurations** — specifying setup scripts, environment variables, dependency installations, and behavioral instructions that apply every time you launch a task. Think of them as templates for your sandboxed coding environments. You configure a custom agent once (for example, "always run `npm install` and `npm test` before proposing changes"), and every Codex task you launch with that agent inherits the configuration.

This architecture optimizes for **batch workflows**: submit multiple tasks, let them run in parallel across cloud containers, review the PRs when they're ready. It trades the interactive, conversational feel of Claude Code for throughput and isolation.

## Feature Comparison

| Feature | Claude Code Subagents | Codex Custom Agents | Winner |
|---------|----------------------|---------------------|--------|
| **Execution model** | Local, in-process | Cloud, sandboxed containers | Depends on use case |
| **Agent specialization** | Built-in typed agents (Explore, Plan, code-reviewer) | User-defined configuration templates | Claude Code |
| **Parallelism** | Multiple subagents in one message | Multiple tasks across cloud containers | Tie |
| **Isolation** | Optional git worktree | Full container sandbox per task | Codex |
| **Context sharing** | Subagents inherit filesystem and project state | Each task gets a fresh repo clone | Claude Code |
| **Interactivity** | Real-time, conversational | Asynchronous, fire-and-forget | Claude Code |
| **Output format** | Returns results to parent agent inline | Generates PRs or code patches | Codex |
| **Setup overhead** | Zero — use built-in types or write a prompt | Requires defining agent config and setup scripts | Claude Code |
| **Cost model** | Token-based, per-session | Task-based, tied to ChatGPT Pro/Team plan | Codex |
| **Platform** | Terminal (macOS, Linux) | Web UI + VS Code extension | Codex |

## Agent Architecture: Detailed Analysis

Claude Code and Codex represent two distinct philosophies for how coding agents should coordinate work, and understanding the architectural difference is essential before choosing one for your team.

**Claude Code's subagent model is parent-child, single-session.** The primary agent acts as an orchestrator. When it encounters a task that benefits from specialization — searching a large codebase, reviewing a diff, or planning an implementation — it spawns a subagent with a self-contained prompt. The subagent has no memory of the parent's conversation; it starts fresh with only the context the parent provides. This forces good prompt discipline: you must brief the subagent like a colleague who just walked into the room, explaining what you're trying to accomplish and why.

Each subagent type has a defined tool surface. An Explore agent gets read-only tools — Grep, Glob, Read, Bash — making it safe for parallel search without risk of file mutations. A general-purpose agent gets everything, including Edit and Write. The parent can run multiple subagents concurrently by issuing parallel tool calls, and each returns a single result message. This enables patterns like "search for the bug in module A while searching module B" or "have one agent write the implementation while another writes the tests."

The worktree isolation option creates a temporary git branch so the subagent's file edits don't interfere with the parent's working tree. If the subagent makes no changes, the worktree is automatically cleaned up. This is particularly useful for speculative work — "try refactoring this module and see if the tests still pass" — where you want to evaluate an approach without committing to it.

**Codex's model is task-queue, multi-session.** Each task runs in its own container with a fresh clone of your repository. There's no parent-child relationship between tasks — they're independent jobs submitted to a queue. Custom agents define the environment configuration: what gets installed, what scripts run before the agent starts working, what constraints apply to its behavior.

This means Codex tasks are inherently isolated. Two tasks can't step on each other's changes because they operate on separate clones. The tradeoff is that tasks can't easily share intermediate results. If task A discovers a bug in module X and task B is refactoring module X, they won't coordinate — you'll get two independent PRs that may conflict.

For teams evaluating both systems, the practical question is: **do you need agents that talk to each other during work, or agents that work independently on separate jobs?** Claude Code's subagents are the former. Codex's custom agents are the latter. For a deeper look at how [agentic coding](/glossary/agentic-coding) patterns are evolving across both platforms, see our glossary entry.

## Workflow Integration: Detailed Analysis

How each system fits into your actual development workflow matters more than raw feature lists.

**Claude Code subagents integrate into a conversational loop.** You're working in your terminal, hit a complex task, and the primary agent decides (or you instruct it) to delegate. The subagent runs, returns results, and the parent incorporates them into its next action. The entire flow happens within one session — you see the delegation, the result, and the follow-up in a continuous stream. This is powerful for exploratory work: "search the codebase for all uses of this deprecated API, then plan the migration, then execute it." Each step feeds the next.

The [Claude Code extension stack](/blog/claude-code-extension-stack-skills-hooks-agents-mcp) means subagents also inherit project-level configuration. CLAUDE.md files, skill definitions, and MCP server connections are available to subagents, so they follow the same coding standards and have access to the same external tools as the parent agent.

**Codex custom agents integrate into a PR-review loop.** You submit tasks from the ChatGPT web interface or the [VS Code extension](/blog/codex-vscode), and Codex works in the background. When it's done, you get a PR to review. This fits teams that batch their AI-assisted work: file a set of issues, assign them to Codex, review the PRs during your next code review cycle.

Custom agent configurations make this repeatable. Once you've defined an agent that knows how to set up your project — install dependencies, configure test databases, set environment variables — every task inherits that setup. You don't re-explain your project structure each time.

The tradeoff is latency versus throughput. Claude Code subagents give you results in seconds to minutes, inline. Codex tasks may take minutes to hours depending on complexity, but you can submit dozens in parallel and batch-review the output. Teams that [use Claude Code for enterprise engineering](/blog/claude-code-enterprise-engineering-ramp-shopify-spotify) often pair it with Codex-style batch workflows for different stages of development.

## Customization and Configuration

Both platforms allow you to shape agent behavior, but through different mechanisms.

**Claude Code** uses a layered configuration system. At the project level, `CLAUDE.md` files set constraints, coding standards, and architectural context. [Skill files](/blog/5-claude-code-skills-i-use-every-single-day) (SKILL.md) define reusable instruction sets for specific task types — writing tests, generating content, reviewing security. When you spawn a subagent, it inherits these project-level configs and you can further specialize it through the prompt you write. The subagent_type parameter selects a built-in specialization, and you can name agents to send follow-up messages to them mid-session.

**Codex** custom agents are configured through a setup interface where you define: a name, a description, setup commands (shell scripts that run before the agent starts), and behavioral instructions. Setup commands handle environment preparation — installing dependencies, running database migrations, configuring API keys. Behavioral instructions guide what the agent does and how it approaches tasks. You can create multiple custom agents for different types of work: one for frontend tasks, one for backend, one for documentation.

The difference in approach reflects the execution model. Claude Code's configuration is **declarative and contextual** — it lives in your repo and applies automatically. Codex's configuration is **imperative and explicit** — you define setup steps that run in sequence. Claude Code's approach is lower-maintenance for projects that already have CLAUDE.md files. Codex's approach gives you more control over the sandboxed environment.

## When to Choose Claude Code Subagents

Choose Claude Code subagents when your work is **interactive, exploratory, or requires coordination between subtasks**.

**Complex refactoring with dependencies.** When renaming a module means updating imports, fixing tests, and adjusting documentation — and each step depends on the last — subagents in a single session handle this naturally. The parent agent delegates search to an Explore subagent, gets results, then delegates the actual edits to a general-purpose subagent with worktree isolation.

**Code review and quality checks.** Spawning a code-reviewer subagent while continuing other work lets you get an independent assessment without breaking your flow. The reviewer operates on the same codebase state you're working on, so its feedback is immediately relevant.

**Rapid prototyping.** When you're iterating on an approach and want to test multiple strategies in parallel — "try approach A in a worktree while I work on approach B" — subagents with worktree isolation let you explore without committing to either path.

**Teams already using Claude Code.** If your project has [CLAUDE.md configuration, skills, and hooks](/blog/claude-code-hooks-a-complete-guide-to-automating-your-ai-coding-workflow), subagents inherit all of that context automatically. The marginal cost of adding multi-agent workflows is near zero.

## When to Choose Codex Custom Agents

Choose Codex custom agents when your work is **batch-oriented, requires strong isolation, or spans many independent tasks**.

**Issue triage at scale.** If you have 20 open issues that are each independent bug fixes or small features, submitting them as Codex tasks with a custom agent configuration lets you process them in parallel. Review the PRs when they're ready, merge the ones that pass CI.

**Environments that require complex setup.** If your project needs specific system dependencies, database configurations, or API credentials to function, a custom agent's setup scripts ensure every task starts from a known-good state. Claude Code subagents work in your local environment, which may already be configured — but Codex's explicit setup is more reproducible across team members.

**Teams that prefer async review workflows.** If your development process centers on PR review rather than pair-programming, Codex's output model — a PR per task — fits naturally. You're not watching the agent work in real time; you're reviewing its output through your normal code review process. The [complete guide to Codex](/blog/codex-complete-guide) covers how teams are integrating this into existing CI/CD pipelines.

**Strict sandboxing requirements.** If you need absolute guarantees that AI-generated code can't affect your local environment — can't read files outside the repo, can't make network calls you didn't authorize — Codex's container isolation provides stronger boundaries than Claude Code's local execution model.

## Verdict

**For interactive, conversational coding workflows, Claude Code subagents are the better tool.** The ability to spawn specialized agents inline, share project context automatically, and coordinate subtasks within a single session makes them ideal for the kind of exploratory, iterative work that dominates day-to-day development. The typed agent system (Explore, Plan, code-reviewer) means you get useful specialization without configuration overhead.

**For batch processing and asynchronous task delegation, Codex custom agents have the edge.** The cloud-hosted, sandboxed execution model handles independent tasks at scale, and custom agent configurations make setup reproducible across your team. If your workflow centers on submitting tasks and reviewing PRs, Codex fits that pattern naturally.

Many teams will benefit from using both. Claude Code for the hands-on development session where you need agents collaborating in real time. Codex for the backlog of independent tasks you want processed overnight. The tools aren't competitors — they're complementary approaches to the same goal: making [agentic coding](/glossary/agentic-coding) work at the scale of real engineering teams. For practical examples of multi-agent patterns in action, see our [Claude Code subagents examples guide](/blog/claude-code-subagents-examples).

## Frequently Asked Questions

### Can Claude Code subagents and Codex custom agents be used together?

Yes. Teams commonly use Claude Code subagents for interactive development — refactoring, debugging, code review — and Codex custom agents for batch processing independent tasks like bug fixes and documentation updates. The outputs complement each other: Claude Code changes land directly in your working tree, while Codex produces PRs for async review.

### How many subagents can Claude Code run in parallel?

Claude Code can spawn multiple subagents concurrently by issuing parallel tool calls in a single message. There's no hard limit published by Anthropic, but practical limits come from context window size and token costs — each subagent consumes tokens independently. For most workflows, two to four parallel subagents cover the common patterns: search plus edit, or implementation plus testing.

### Do Codex custom agents persist between tasks?

Custom agent configurations persist — you define them once and reuse them across tasks. But each task execution starts from a fresh environment. The container is provisioned, your setup scripts run, the agent works, and the container is torn down after producing its output. There's no state carried between task runs, which ensures reproducibility but means each task pays the setup cost.

### Is there a cost difference between subagents and custom agents?

Claude Code subagents are billed per token through Anthropic's API pricing — each subagent consumes tokens independently, so parallel agents multiply your token usage for that session. Codex custom agents are included with ChatGPT Pro and Team plans on a task-based model. For high-volume batch work, Codex's flat-rate plan may be more predictable. For occasional interactive use, Claude Code's per-token model can be more economical.

---

*Want more AI insights? [Subscribe to LoreAI](/subscribe) for daily briefings.*