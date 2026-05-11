---
title: "Codex Subagents vs Claude Code Agent Teams: Multi-Agent AI Coding Compared"
slug: use-subagents-and-custom-agents-in-codex
description: "Compare subagents and custom agents in OpenAI Codex vs Claude Code agent teams for multi-agent AI coding workflows."
item_a: OpenAI Codex
item_b: Claude Code
category: tools
related_glossary: [agent-sdk, agentic-coding]
related_blog: [claude-code-subagents-examples, claude-code-agent-teams, codex-complete-guide, codex-vscode, con-u-pour-des-workflows-multi-agents]
related_compare: []
related_topics: [codex]
lang: en
---

<!--
Pre-Draft Planning:
1. Target keyword: use subagents and custom agents in codex
2. Page type: comparison
3. Keyword intent: commercial — reader wants to evaluate multi-agent capabilities in Codex (and likely comparing against Claude Code)
4. Likely official-doc competitor: OpenAI's Codex documentation on task parallelism; Anthropic's Claude Code agent teams docs
5. Likely non-official competitor pattern: thin "what is Codex" rewrites that don't explain subagent architecture or give practical configuration guidance
6. LoreAI standout angle: Side-by-side architectural comparison of how each tool handles multi-agent workflows, with concrete configuration examples and a clear recommendation based on team size, workflow type, and autonomy preference
-->

# Codex Subagents vs Claude Code Agent Teams: Multi-Agent AI Coding Compared

**TL;DR:** **OpenAI Codex** runs subagents as parallel cloud-sandboxed tasks — each gets its own isolated environment with a full repo clone, making it strong for high-autonomy batch work you fire and review later. **Claude Code** runs agent teams locally in your terminal with typed sub-agents (Explore, Plan, general-purpose) and optional git worktree isolation, giving you tighter real-time control. Choose Codex subagents for async parallel task queues; choose Claude Code agent teams for interactive multi-agent sessions where you steer the work.

## Overview: OpenAI Codex Subagents

[OpenAI Codex](/blog/codex-complete-guide) is a cloud-based [agentic coding](/glossary/agentic-coding) platform that runs coding tasks in sandboxed environments. Each task you create spins up an isolated container with a clone of your repository, installs dependencies, and executes the work independently. This architecture naturally supports subagents: you launch multiple Codex tasks in parallel, each handling a discrete piece of work — one fixes a bug, another writes tests, a third refactors a module.

Codex's multi-agent model is fundamentally **task-queue-oriented**. You describe what you want done, Codex spins up an environment, and you review the results asynchronously. Custom agents in Codex are configured through `AGENTS.md` files in your repository, which define agent-specific instructions, constraints, and behavioral guidelines. This mirrors the configuration-as-code pattern familiar to CI/CD workflows.

The key tradeoff: Codex subagents are highly autonomous but asynchronous. You don't interact with them in real time — you submit work, wait for results, and review diffs. This makes Codex subagents well-suited for teams that want to parallelize independent tasks without babysitting each one.

## Overview: Claude Code Agent Teams

[Claude Code](/blog/claude-code-agent-teams) is Anthropic's terminal-based AI coding agent that runs directly in your local development environment. Its multi-agent system — called **agent teams** — lets you spawn typed sub-agents from within a session. Each sub-agent has a specific role: Explore agents for read-only codebase search, Plan agents for architecture design, and general-purpose agents for executing multi-step tasks.

Claude Code's subagent model is **session-oriented**. Sub-agents run within your conversation context, share access to your local filesystem, and report results back to the orchestrating agent. For isolation, Claude Code supports git worktree mode, where a sub-agent works on a temporary copy of your repo — similar to Codex's sandboxing but running locally rather than in the cloud.

Custom agents in Claude Code are configured through [CLAUDE.md](/blog/claude-code-memory) project files and [skill files](/blog/5-claude-code-skills-i-use-every-single-day) (`skills/*/SKILL.md`). These define per-project and per-task instructions that all agents in the session follow. The system is more granular than Codex's configuration: you can define different behavioral profiles for different types of work within the same repository.

## Feature Comparison

| Feature | OpenAI Codex | Claude Code | Winner |
|---------|-------------|-------------|--------|
| **Agent isolation** | Cloud sandbox per task | Local process + optional git worktree | Codex |
| **Parallelism** | Native — multiple tasks run simultaneously | Native — multiple sub-agents in one message | Tie |
| **Real-time interaction** | Async only — submit and review | Interactive — steer agents mid-task | Claude Code |
| **Custom agent config** | `AGENTS.md` file | `CLAUDE.md` + `SKILL.md` files | Claude Code |
| **Agent types** | General-purpose tasks | Typed (Explore, Plan, general-purpose, specialized) | Claude Code |
| **Environment access** | Sandboxed clone, no external network | Full local environment + shell | Claude Code |
| **Git integration** | Creates branches and PRs automatically | Full git access, worktree isolation | Tie |
| **Pricing** | Token-based, cloud compute included | Token-based, local compute | Codex |
| **Setup complexity** | GitHub integration required | Terminal install, works immediately | Claude Code |
| **IDE integration** | ChatGPT web UI, [VS Code extension](/blog/codex-vscode) | Terminal-native, IDE extensions available | Tie |

## Architecture: How Subagents Work Under the Hood

The architectural difference between Codex subagents and Claude Code agent teams is the most important distinction for teams evaluating these tools. It determines everything from latency to security to how you structure your workflows.

**Codex** uses a **container-per-task** model. When you create a Codex task, the platform provisions a sandboxed environment — think of it as a lightweight VM with your repo cloned, dependencies installed, and no outbound network access by default. Each subagent (each parallel task) gets its own container. This means subagents cannot interfere with each other: one agent's file changes don't affect another's working directory. The platform handles merge conflict resolution when multiple subagents produce PRs that touch the same files.

This isolation has clear benefits for safety and reproducibility. A subagent that makes a mistake can't corrupt your local environment or another subagent's work. The downside is latency: environment provisioning adds overhead, and you can't interactively guide a subagent while it works.

**Claude Code** uses a **process-per-agent** model within your local terminal session. When the orchestrating agent spawns a sub-agent, that agent runs as a new context within the same machine. By default, sub-agents share the same filesystem — which means an Explore agent can find a file path and a general-purpose agent can immediately edit it without re-cloning anything. For tasks that need isolation, the `worktree` mode creates a temporary git worktree so the sub-agent works on a separate copy.

The local execution model means sub-agents have access to everything your terminal has: local databases, running dev servers, environment variables, custom CLI tools. This is powerful for tasks that require integration testing or interaction with local services, but it demands more trust in the agent's behavior.

## Custom Agent Configuration: AGENTS.md vs CLAUDE.md + SKILL.md

Both platforms support configuration-as-code for custom agents, but the systems differ significantly in granularity and scope.

### Codex: AGENTS.md

Codex reads an `AGENTS.md` file from your repository root. This file defines instructions that apply to all Codex tasks run against the repo. You can specify coding standards, testing requirements, architectural constraints, and behavioral guidelines. The format is markdown — readable by both humans and the model.

The `AGENTS.md` approach is simple and centralized. One file, one set of instructions. For teams that want consistent behavior across all Codex tasks, this works well. The limitation is that you can't easily define different agent profiles for different types of work within the same repository — a test-writing agent and a refactoring agent both read the same instructions.

### Claude Code: CLAUDE.md + Skill Files

Claude Code uses a layered configuration system. The [CLAUDE.md](/blog/claude-code-memory) file at the project root defines global project context — coding standards, architecture constraints, and workflow rules. On top of that, [skill files](/blog/9-principles-writing-claude-code-skills) (`skills/*/SKILL.md`) define task-specific instructions: one skill for writing tests, another for code review, another for SEO content generation.

When spawning a sub-agent, you can specify which skill applies. This means different agents in the same session can follow different behavioral profiles. The orchestrating agent might use a "plan" skill while delegating implementation to a sub-agent with a "code" skill.

The [Claude Code extension stack](/blog/claude-code-extension-stack-skills-hooks-agents-mcp) goes further: hooks let you define deterministic pre/post-processing rules (lint before commit, format after edit) that apply regardless of which agent is running. MCP servers add external tool access. The result is a more programmable system, but with more configuration surface area to manage.

**Practical recommendation:** If your multi-agent needs are straightforward — parallel tasks with consistent instructions — Codex's `AGENTS.md` is simpler to set up and maintain. If you need different agent behaviors for different task types, or you want to compose agents with specific tooling access, Claude Code's layered system offers more control.

## Parallelism and Task Orchestration

Both tools support parallel agent execution, but the orchestration models differ in ways that affect practical workflows.

### Codex: Fire-and-Forget Parallelism

Codex's parallelism is task-level. You create multiple tasks — through the ChatGPT interface, the [VS Code extension](/blog/codex-vscode), or the API — and they run simultaneously in separate containers. There's no built-in orchestration between tasks: each subagent works independently, unaware of what other subagents are doing.

This model works well for **embarrassingly parallel** work: "fix these five independent bugs," "write tests for these six modules," "update documentation for these three APIs." Each task is self-contained, and you review the results as they come in.

The limitation surfaces when tasks have dependencies. If subagent A needs to refactor an interface before subagent B can update the callers, you must sequence them manually — run A, wait for completion, then run B. Codex doesn't currently support task dependency graphs or conditional execution.

### Claude Code: Orchestrated Parallelism

Claude Code's parallelism is agent-level within a session. The orchestrating agent can spawn multiple sub-agents in a single message, and they run concurrently. Crucially, the orchestrating agent coordinates: it can analyze results from sub-agents and decide next steps, chain dependent work, or spawn follow-up agents based on findings.

For [complex multi-agent workflows](/blog/con-u-pour-des-workflows-multi-agents), this orchestration capability is significant. An Explore agent searches the codebase for all callers of a deprecated function, reports back, and the orchestrating agent then spawns multiple general-purpose agents to update each caller in parallel — with each agent receiving the specific context it needs.

The tradeoff is that Claude Code's parallelism is bounded by a single session's context window. Very large codebases with dozens of parallel tasks can push against context limits, while Codex's isolated environments have no such constraint.

## When to Choose OpenAI Codex Subagents

Choose Codex subagents when your workflow matches these patterns:

**Async batch processing.** You have a backlog of independent tasks — bug fixes, test coverage gaps, documentation updates — and you want to process them in parallel without monitoring each one. Codex's fire-and-forget model lets you queue work during a meeting and review PRs afterward.

**High-autonomy environments.** Your team is comfortable reviewing AI-generated PRs rather than steering AI agents interactively. Codex is designed for the "delegate and review" workflow: the agent proposes changes via pull request, and humans approve or request revisions through standard code review.

**Open-source projects.** Codex offers [free access for open-source maintainers](/blog/codex-for-open-source), making it an attractive option for projects that need to process community issues and PRs at scale. The sandboxed execution model is also well-suited for untrusted codebases, since agents can't access your local environment.

**GitHub-native teams.** Codex integrates directly with GitHub — it creates branches, opens PRs, and participates in review workflows. If your team already lives in GitHub's ecosystem, Codex subagents slot in with minimal friction.

**Students and learners.** OpenAI's [Codex for Students](/blog/codex-for-students) program provides credits for educational use. The async model gives students time to review and understand each change, which supports learning better than real-time agent assistance.

## When to Choose Claude Code Agent Teams

Choose Claude Code agent teams when your workflow matches these patterns:

**Interactive development sessions.** You're actively working on a problem and want AI agents to explore, plan, and implement while you steer. Claude Code's session model means you can redirect a sub-agent mid-task, ask follow-up questions, or pivot based on intermediate results.

**Complex, dependent tasks.** Your work involves tasks that depend on each other — refactor a module, then update all callers, then fix the tests that break. Claude Code's orchestrating agent handles dependency sequencing automatically, spawning the right sub-agents at the right time.

**Local environment integration.** Your tasks require access to local services — databases, running servers, custom build tools, environment-specific configuration. Claude Code agents run in your local environment and can interact with anything your terminal can reach.

**Granular agent specialization.** You need different agents to follow different rules. A security review agent should behave differently from a feature implementation agent. Claude Code's [skill system](/blog/do-skills-actually-improve-your-agents-output) and typed sub-agents support this naturally.

**Real-time pair programming.** You want to collaborate with AI agents as a working partner, not a task queue. Claude Code's interactive model supports [voice mode](/blog/claude-code-voice-mode), mid-task redirection, and conversational context that persists across sub-agent calls.

## Security and Isolation

Security is a critical differentiator when running multiple AI agents against your codebase.

**Codex** provides strong isolation by default. Each subagent runs in a sandboxed container with no outbound network access (unless explicitly configured), no access to your local machine, and no ability to affect other running tasks. This makes Codex subagents safe to run against sensitive codebases — a misconfigured agent can't exfiltrate data or corrupt your development environment. The tradeoff is that agents can't access external services (APIs, databases, package registries) unless you configure network permissions.

**Claude Code** runs locally with your user's permissions. Sub-agents have access to your filesystem, environment variables, and network. Claude Code mitigates this through a permission system — users approve or deny tool calls, and configuration in `settings.json` defines allowlists. The [hooks system](/blog/claude-code-hooks-mastery) adds deterministic guardrails: you can enforce that every agent commit passes linting, that certain directories are read-only, or that specific commands require explicit approval.

For teams with strict security requirements or compliance constraints, Codex's sandboxing model requires less configuration to achieve a secure baseline. For teams that need agents to interact with production-like environments during development, Claude Code's local execution model is more capable — but demands more careful permission management.

## Pricing and Access

Both tools use token-based pricing, but the cost structures differ in ways that affect multi-agent workloads.

**Codex** bundles cloud compute with token costs — you pay for the AI model usage, and the sandboxed execution environment is included. This simplifies cost estimation for multi-agent work: spinning up ten subagents costs roughly ten times a single task in tokens, with no additional infrastructure charges. Codex is available through ChatGPT Pro, Plus, and Team plans, with the [student program](/blog/codex-for-students) offering $100 in credits.

**Claude Code** charges for model tokens only — all computation runs on your local machine. For teams with powerful development hardware, this can be significantly cheaper for compute-intensive tasks (long builds, large test suites). The cost scales with token usage across all sub-agents in a session. Claude Code is available through Anthropic's API billing, with no fixed monthly subscription required.

**Cost consideration for multi-agent work:** If you're running many parallel agents, Codex's included compute is convenient but opaque — you can't optimize the execution environment. Claude Code's local execution means you control the hardware, but you're responsible for ensuring your machine can handle multiple concurrent agents. As of mid-2026, exact per-token pricing for both platforms changes frequently — check official pricing pages for current rates.

## Practical Workflow: Running Subagents in Each Tool

### Codex Workflow

1. Configure `AGENTS.md` in your repo with project-level instructions
2. Open the Codex interface (ChatGPT, VS Code, or API)
3. Create multiple tasks describing independent pieces of work
4. Tasks spin up in parallel — each in its own sandboxed environment
5. Monitor progress through the Codex dashboard
6. Review generated PRs through GitHub's standard review workflow
7. Merge, request changes, or close — Codex responds to review comments

### Claude Code Workflow

1. Configure `CLAUDE.md` and optional skill files in your repo
2. Start a Claude Code session in your terminal
3. Describe the high-level task — the orchestrating agent plans the approach
4. The orchestrating agent spawns typed sub-agents: Explore agents search the codebase, Plan agents design the approach, general-purpose agents implement changes
5. Sub-agents report results back to the orchestrator in real time
6. You review intermediate results and redirect if needed
7. The orchestrating agent coordinates final integration and commits

The fundamental difference: Codex treats subagents as **independent workers** that produce PRs. Claude Code treats sub-agents as **collaborative specialists** within a coordinated session.

## Verdict

For teams that want to **parallelize independent coding tasks at scale** with minimal supervision, **OpenAI Codex subagents** are the stronger choice. The cloud-sandboxed model, GitHub-native PR workflow, and fire-and-forget execution pattern fit async engineering teams. You trade real-time control for safety and simplicity.

For teams that need **interactive, orchestrated multi-agent sessions** where agents collaborate on dependent tasks, **Claude Code agent teams** are more capable. The typed sub-agent system, layered configuration, and local environment access support complex workflows that Codex's independent-task model can't express. You trade simplicity for power and granularity.

Many teams will use both: Codex for batch processing backlogs of independent tasks, and Claude Code for interactive sessions tackling complex, cross-cutting changes. The tools aren't mutually exclusive — they optimize for different points on the autonomy-control spectrum. For a deeper look at how these multi-agent patterns play out in practice, see our [Claude Code subagents examples](/blog/claude-code-subagents-examples) and [Codex complete guide](/blog/codex-complete-guide).

## Frequently Asked Questions

### Can you use custom agents in Codex without AGENTS.md?
Yes — Codex tasks accept inline instructions at task creation time. The `AGENTS.md` file provides persistent, repo-level configuration that applies to all tasks by default, but you can override or supplement those instructions per task. For one-off work, inline instructions are sufficient.

### How many subagents can run in parallel in Codex vs Claude Code?
Codex supports multiple concurrent tasks limited by your plan's rate limits — exact numbers vary by subscription tier. Claude Code can spawn multiple sub-agents in a single message with no hard limit, though practical concurrency is bounded by your local machine's resources and the session's context window.

### Do Codex subagents share state with each other?
No. Each Codex subagent runs in an isolated environment with its own repo clone. Subagents cannot read each other's changes during execution. Coordination happens at the PR level — after tasks complete, you merge their branches. Claude Code sub-agents can optionally share the same filesystem, enabling real-time coordination within a session.

### Which tool is better for enterprise multi-agent workflows?
It depends on the workflow. Codex's sandboxed model appeals to enterprises with strict security requirements — agents can't access internal networks or sensitive local data. Claude Code's local execution model appeals to enterprises that need agents integrated with internal tooling. Both offer configuration-as-code for standardizing agent behavior across teams.

### Can you combine Codex and Claude Code subagents in the same project?
Yes. A practical pattern: use Claude Code agent teams for interactive development during the workday, and queue Codex subagents for overnight batch processing of test coverage, documentation updates, and dependency upgrades. Both tools read from the same Git repository without conflict.

---

*Want more AI insights? [Subscribe to LoreAI](/subscribe) for daily briefings.*