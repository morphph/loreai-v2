---
title: "Codex Subagents vs Claude Code Subagents: Multi-Agent AI Coding Compared"
slug: use-subagents-and-custom-agents-in-codex
description: "Compare subagents and custom agents in OpenAI Codex vs Claude Code. Architecture, workflows, and when to use each multi-agent system."
item_a: OpenAI Codex
item_b: Claude Code
category: tools
related_glossary: [agent-sdk, agentic-coding]
related_blog: [codex-complete-guide, claude-code-agent-teams, claude-code-subagents-examples, claude-code-extension-stack-skills-hooks-agents-mcp, claude-code-complete-guide, agent-harnesses-2026]
related_compare: []
related_topics: [codex]
lang: en
---

<!-- Pre-Draft Planning
Target keyword: use subagents and custom agents in codex
Page type: compare
Keyword intent: commercial — users want to evaluate multi-agent capabilities before committing to a platform
Likely official-doc competitor: OpenAI Codex docs on task orchestration; Anthropic Claude Code docs on Agent tool
Likely non-official competitor pattern: Thin tutorials that restate official docs; listicles comparing surface features without real workflow analysis
LoreAI standout angle: Concrete architectural comparison of how each system spawns, isolates, and coordinates subagents — with decision rules by team size, task complexity, and infrastructure preference
-->

# Codex Subagents vs Claude Code Subagents: Multi-Agent AI Coding Compared

**TL;DR:** Both OpenAI Codex and Claude Code support multi-agent workflows, but they approach the problem from opposite directions. **Codex runs each subagent as an isolated cloud task** in a sandboxed container — ideal for teams that want fire-and-forget parallelism with zero local resource usage. **Claude Code spawns subagents as local processes** with typed specializations (Explore, Plan, code review) and optional git worktree isolation — better for developers who want fine-grained control and real-time interaction. Choose Codex for async batch workflows; choose Claude Code for interactive, tightly-orchestrated agent teams.

## Overview: Subagents and Custom Agents in OpenAI Codex

OpenAI Codex is a cloud-based [agentic coding](/glossary/agentic-coding) platform that executes coding tasks in sandboxed environments. When you submit a task to Codex, it spins up an isolated container with a snapshot of your repository, installs dependencies, and lets a GPT-powered agent work through the problem independently. The agent can read files, write code, run tests, and produce a diff — all without touching your local machine.

The multi-agent dimension of Codex emerges through its task decomposition model. You can submit multiple Codex tasks simultaneously, each operating on its own container with its own branch. This is Codex's version of subagents: parallel, isolated task runners that each produce an independent pull request or diff. For teams using Codex through the ChatGPT interface, this means queuing up several tasks — "fix the auth bug," "add pagination to the API," "write tests for the billing module" — and letting them execute concurrently in the cloud.

Codex also integrates with OpenAI's [Agent SDK](/glossary/agent-sdk), which provides a framework for building custom agent workflows with tool use, handoffs between agents, and structured output. This SDK-level integration means developers can build custom orchestration layers on top of Codex's execution environment, defining how agents coordinate, share context, and hand off work. For a deeper look at Codex's architecture, see our [complete Codex guide](/blog/codex-complete-guide).

## Overview: Subagents in Claude Code

Claude Code is Anthropic's terminal-based AI coding agent that runs directly in your development environment. Its subagent system is built around the `Agent` tool — a first-class primitive that lets the primary Claude Code session spawn specialized child agents for specific tasks. Each subagent runs as a separate context window, keeping the parent's context clean while the child handles focused work.

What sets Claude Code's approach apart is **typed agent specialization**. Rather than spawning generic workers, Claude Code offers purpose-built agent types: `Explore` for fast read-only codebase search, `Plan` for architecture design, `codex:codex-rescue` for delegating to OpenAI's Codex as a second opinion, and a general-purpose agent for everything else. Each type has access to different tool sets — the Explore agent can search and read but cannot edit files, while a general-purpose agent has full tool access.

Claude Code subagents support both foreground (blocking) and background execution, git worktree isolation for safe parallel edits, and direct communication via `SendMessage` for ongoing coordination. This architecture is detailed in our [Claude Code agent teams](/blog/claude-code-agent-teams) coverage and the [extension stack deep dive](/blog/claude-code-extension-stack-skills-hooks-agents-mcp).

## Feature Comparison

| Feature | OpenAI Codex | Claude Code | Winner |
|---------|-------------|-------------|--------|
| **Execution environment** | Cloud containers (sandboxed) | Local machine (terminal) | Depends on preference |
| **Agent specialization** | Generic task runners | Typed agents (Explore, Plan, etc.) | Claude Code |
| **Parallelism model** | Multiple cloud tasks, fully isolated | Foreground/background agents, worktree isolation | Tie |
| **Context isolation** | Complete (separate containers) | Separate context windows, shared filesystem | Codex |
| **Custom agent SDK** | OpenAI Agent SDK (Python) | Agent tool with prompt-based customization | Codex |
| **Real-time interaction** | Async — submit and wait | Interactive — send messages to running agents | Claude Code |
| **Resource usage** | Zero local compute | Uses local CPU/memory | Codex |
| **Git integration** | Produces PRs from cloud | Worktree branches, local commits | Claude Code |
| **Cost model** | Included in ChatGPT Pro/Team plans | Usage-based API billing | Codex |
| **Platform** | Web-based (ChatGPT), VS Code extension | Terminal (macOS, Linux) | Tie |

## Subagent Architecture: Detailed Analysis

The most fundamental difference between these two systems is where and how subagents execute. This architectural choice cascades into every aspect of the multi-agent experience — from latency to isolation to how much control you retain during execution.

**Codex's cloud-container model** treats each subagent as a fully independent job. When you create a Codex task, OpenAI provisions a container, clones your repo at the current commit, sets up the environment (including `install` and `test` commands you've configured), and hands the task description to a GPT agent. The agent works in complete isolation — it cannot see what other Codex tasks are doing, cannot access your local filesystem, and cannot interact with you until it finishes. The output is a git diff, a summary of changes, and optionally a pull request.

This isolation is both Codex's greatest strength and its primary limitation. Strength: there's zero risk of one subagent corrupting another's work, and you can queue dozens of tasks without worrying about resource contention. Limitation: the agents can't coordinate. If task A discovers that the billing module needs a schema change, task B (which is writing billing tests) won't know about it until both tasks complete and you manually reconcile.

**Claude Code's local-agent model** takes the opposite approach. When the primary Claude Code session spawns a subagent via the `Agent` tool, the child agent runs as a new context window on your local machine. It has access to your actual filesystem — including uncommitted changes, environment variables, and running services. The parent agent can choose to run the child in the foreground (blocking until it returns) or in the background (continuing its own work while the child executes).

For parallel editing safety, Claude Code offers `isolation: "worktree"`, which creates a temporary git worktree so the subagent works on an isolated copy of the repo. This provides Codex-like isolation without leaving your local machine. When the subagent finishes, the worktree is either cleaned up (if no changes were made) or returned with its branch name for merging.

The coordination advantage is significant. A parent agent can spawn multiple background subagents, continue its own analysis, receive results as each child completes, and make decisions based on the combined output — all within a single interactive session. You can even send follow-up messages to running subagents via `SendMessage`, redirecting their work based on new information. For practical examples of these patterns, see our [Claude Code subagents examples](/blog/claude-code-subagents-examples).

## Agent Specialization and Customization: Detailed Analysis

How you define what a subagent does — its role, capabilities, and constraints — differs sharply between the two platforms.

**Codex relies on task-level prompting.** Each Codex task gets a natural language description of what to accomplish, plus optional configuration: which files to focus on, what commands to run for validation, and repository-level instructions (similar to a `.codex` or setup file). There's no built-in concept of agent "types" — every Codex task runner has the same capabilities. Customization happens at the orchestration layer: if you're using the OpenAI Agent SDK, you can define agent classes with specific tools, system prompts, handoff rules, and guardrails. This gives you maximum flexibility but requires writing Python code to set up the orchestration.

The Agent SDK approach is powerful for teams building custom CI/CD integrations or specialized review pipelines. You can define a "security reviewer" agent that only has access to static analysis tools, a "test writer" agent that focuses on test files, and an "orchestrator" agent that routes tasks between them. But this is a build-it-yourself proposition — Codex doesn't ship these specializations out of the box.

**Claude Code ships typed agent specializations as built-in primitives.** The `subagent_type` parameter lets you select from pre-defined agent roles:

- **Explore**: Read-only search agent optimized for finding code. Has access to Glob, Grep, and Read but cannot edit files. Use it for "where is X defined?" or "which files reference Y?" queries without polluting your main context with search results.
- **Plan**: Architecture agent for designing implementation strategies. Returns step-by-step plans with critical file identification and tradeoff analysis. Cannot edit files directly.
- **codex:codex-rescue**: Delegates work to OpenAI's Codex runtime as a second implementation pass. Useful when Claude Code is stuck or when you want an independent diagnosis from a different model.
- **General-purpose**: Full tool access including file editing, shell commands, and web search. The default when no type is specified.

Custom specialization in Claude Code happens through the prompt itself — you brief the subagent like "a smart colleague who just walked into the room," providing full context, file paths, and clear success criteria. The typed agent system constrains what tools are available, while the prompt constrains what the agent focuses on. This prompt-based customization doesn't require writing SDK code, making it accessible to any developer who can write clear instructions.

The practical difference: Codex's SDK approach lets you build reusable, production-grade agent pipelines with formal handoff protocols. Claude Code's built-in types let you get multi-agent benefits immediately without writing orchestration code, but complex custom workflows require careful prompt engineering rather than programmatic control.

## Parallel Execution and Coordination

Both platforms support parallel subagent execution, but the coordination patterns differ meaningfully.

**Codex parallelism is batch-oriented.** You submit multiple tasks, they execute independently in the cloud, and you review the results when they're done. There's no mechanism for one Codex task to signal another, share intermediate results, or dynamically spawn follow-up tasks based on what it discovers. This maps well to workflows where tasks are genuinely independent: "fix these five bugs," "write tests for these three modules," or "refactor each of these services." The cloud execution means there's effectively no limit on parallelism — your local machine isn't the bottleneck.

The [Codex VS Code extension](/blog/codex-vscode) integrates this parallel task model into the editor, letting you manage multiple running tasks from a sidebar and review diffs as they complete. For teams, Codex tasks can be assigned and tracked like any other work item, with the cloud infrastructure handling all the compute.

**Claude Code parallelism is orchestrated.** The parent agent explicitly decides which subagents to spawn, whether they run in foreground or background, and how to combine their results. You can launch multiple agents in a single response (they run concurrently), wait for specific agents before spawning dependent ones, and route decisions based on intermediate results.

This enables patterns that Codex can't express natively:

1. **Research-then-implement**: Spawn an Explore agent to find all relevant files, use its results to brief an implementation agent with exact file paths and line numbers.
2. **Parallel investigation with synthesis**: Launch three background agents to investigate different hypotheses for a bug, then synthesize their findings into a single fix.
3. **Review-during-development**: Run a Plan agent to design the approach, implement in the foreground, then spawn a background review agent to check the implementation against the plan.

The tradeoff is resource consumption. Each Claude Code subagent uses local compute and API tokens. Spawning ten parallel agents on a complex codebase will consume significant context window capacity and may slow down your machine. Codex offloads all of this to the cloud. For large-scale parallel work (dozens of independent tasks), Codex's cloud model is more practical. For sophisticated multi-step orchestration (3-5 coordinated agents), Claude Code's interactive model is more capable.

## Developer Experience and Workflow Integration

The day-to-day experience of using subagents differs substantially between the two platforms, reflecting their broader design philosophies.

**Working with Codex subagents** feels like delegating to an async team. You write a task description, submit it, and context-switch to other work. Minutes later (Codex tasks typically take 1-10 minutes depending on complexity), you get a notification with the result. You review the diff, approve or reject it, and move on. This async model integrates naturally with code review workflows — a Codex-generated PR goes through the same review process as any human PR.

For teams, this is powerful. A tech lead can break down a large feature into independent tasks, submit them all to Codex, and review the results as they come in. The [Codex for open source](/blog/codex-for-open-source) program extends this to maintainers managing large backlogs of issues. The limitation is interactivity: if Codex misunderstands the task, you can't redirect it mid-execution. You review the result, write a better prompt, and resubmit.

**Working with Claude Code subagents** feels like pair-programming with a team. You're in the terminal, the parent agent is talking to you, and subagents are executing in the background. You can watch progress, intervene when something goes off track, and provide real-time guidance. The `SendMessage` capability means you can send a running subagent new information ("actually, check the v2 branch, not main") without restarting from scratch.

Claude Code's [CLAUDE.md and SKILL.md system](/blog/claude-code-complete-guide) adds another dimension to subagent customization. Project-level instructions in CLAUDE.md are inherited by all subagents, ensuring they follow your coding standards, test requirements, and architectural constraints. Skill files let you define reusable task templates — a "write tests" skill, a "security review" skill — that any subagent can invoke. See our [skills guide](/blog/5-claude-code-skills-i-use-every-single-day) for practical examples.

The harness architecture also matters here. As covered in our [agent harnesses analysis](/blog/agent-harnesses-2026), the wrapper around the model — how it manages context, tools, and permissions — often matters more than the model itself. Claude Code's harness gives subagents structured access to the full development environment, while Codex's harness optimizes for safe, isolated execution.

## Cost and Resource Considerations

Multi-agent workflows multiply your AI spending, so understanding the cost models is important.

**Codex billing** is bundled into ChatGPT plan pricing. ChatGPT Pro ($200/month) and Team ($30/user/month) plans include Codex access with usage limits. Each Codex task consumes compute in OpenAI's cloud, but you don't see per-token billing — it's included in your plan. This makes costs predictable but means heavy subagent usage may hit rate limits rather than generating unexpected bills.

**Claude Code billing** is usage-based. Every subagent spawned consumes API tokens — the prompt you send, the context the agent reads, and the response it generates all count toward your Anthropic API bill. Spawning five parallel agents on a large codebase can consume significant tokens, especially if each agent needs to read many files for context. The tradeoff: you pay exactly for what you use, with no rate limits beyond what your API tier allows.

For teams evaluating cost: if you're already on a ChatGPT Pro or Team plan, Codex subagents come at no marginal cost (within plan limits). If you're on Anthropic's API with moderate usage, Claude Code subagents offer more control but require monitoring token consumption. The [Codex for students](/blog/codex-for-students) program offers free credits for evaluating the platform.

## When to Choose Codex Subagents

**Use Codex subagents when:**

- **Tasks are independent and parallelizable.** You have a backlog of bugs, features, or refactoring tasks that don't depend on each other. Codex's cloud containers let you run dozens simultaneously with zero local resource usage.
- **You want async workflows.** Submit tasks before a meeting, review results after. Codex fits naturally into teams that already use async code review processes.
- **Isolation is critical.** Each Codex task gets a clean environment with no risk of cross-contamination. For security-sensitive codebases or compliance requirements, this container-level isolation is valuable.
- **You're building custom pipelines with the Agent SDK.** If your team has the engineering capacity to build orchestration layers in Python, the OpenAI Agent SDK gives you programmatic control over agent coordination, tool access, and handoff logic.
- **Your team is already on ChatGPT Pro or Team plans.** Codex is included — there's no marginal cost for trying subagent workflows.

## When to Choose Claude Code Subagents

**Use Claude Code subagents when:**

- **Tasks require coordination.** The output of one subagent informs the next. Claude Code's foreground/background model and `SendMessage` capability let you build sophisticated multi-step workflows where agents share context and build on each other's results.
- **You need specialized agent types.** The built-in Explore, Plan, and review agent types give you immediate multi-agent benefits without writing orchestration code. The `codex:codex-rescue` type even lets you delegate to Codex as a fallback.
- **Real-time interaction matters.** You want to watch agents work, redirect them mid-task, and provide guidance based on intermediate results. Claude Code's interactive model keeps you in the loop.
- **Your codebase relies on local state.** If builds depend on local services, environment variables, or uncommitted changes, Claude Code subagents have access to your actual development environment — not a cloud snapshot.
- **You use CLAUDE.md and SKILL.md for project standards.** These configuration files propagate automatically to all subagents, ensuring consistent behavior without per-task configuration.

## Verdict

**For independent, batch-style parallel tasks, choose Codex.** Its cloud-container model handles unlimited parallelism with zero local resource usage, and the async workflow fits naturally into team code review processes. If you're building production-grade agent pipelines, the OpenAI Agent SDK provides programmatic orchestration that Claude Code's prompt-based approach can't match.

**For coordinated, interactive multi-agent workflows, choose Claude Code.** Its typed agent specializations, real-time communication, and worktree isolation give you fine-grained control over how agents collaborate. The ability to spawn an Explore agent for research, feed its results to an implementation agent, and run a review agent on the output — all in one interactive session — is something Codex's async model doesn't support natively.

Many advanced teams use both. Claude Code even has a built-in `codex:codex-rescue` subagent type that delegates work to Codex when a second opinion or independent implementation pass is needed. The platforms are complementary, not mutually exclusive. For a deeper look at multi-agent patterns in practice, see our [Claude Code subagents examples](/blog/claude-code-subagents-examples).

## Frequently Asked Questions

### Can you use Codex subagents and Claude Code subagents together?

Yes. Claude Code includes a `codex:codex-rescue` subagent type that delegates tasks to OpenAI's Codex runtime. This lets you use Codex as a second-opinion engine within a Claude Code session — useful when you want an independent diagnosis or alternative implementation from a different model.

### How many subagents can you run in parallel on each platform?

Codex runs tasks in cloud containers, so parallelism is limited by your plan's rate limits rather than local resources. Claude Code subagents run locally, so practical limits depend on your machine's memory and CPU — typically 3-5 concurrent agents work well for most development machines.

### Do Codex subagents have access to my local environment?

No. Each Codex task runs in an isolated cloud container with a snapshot of your repository at the current commit. It cannot access local services, environment variables, or uncommitted changes. Claude Code subagents run locally and have full access to your development environment.

### Which platform is better for code review workflows?

Codex produces pull request diffs that integrate directly into GitHub review workflows — ideal for teams with established review processes. Claude Code's subagents can run review-style analysis interactively but produce results within the terminal session rather than as standalone PRs.

### Is there a free way to try subagents on either platform?

Codex is included with ChatGPT Pro and Team plans, and OpenAI offers [free Codex access for open source maintainers](/blog/codex-for-open-source) and [credits for students](/blog/codex-for-students). Claude Code uses Anthropic API billing — you pay per token with no free tier specifically for subagent usage, though Anthropic occasionally offers promotional credits.

---

*Want more AI insights? [Subscribe to LoreAI](/subscribe) for daily briefings.*