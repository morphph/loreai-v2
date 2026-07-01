---
title: "Subagents in Codex vs Claude Code: Which Multi-Agent Coding Tool Delivers?"
slug: use-subagents-and-custom-agents-in-codex
description: "Compare subagent and custom agent capabilities in OpenAI Codex vs Claude Code — architecture, orchestration, and practical workflows."
item_a: OpenAI Codex
item_b: Claude Code
category: tools
related_glossary: [agent-sdk, agentic-coding]
related_blog: [claude-code-subagents-examples, claude-code-agent-teams, codex-complete-guide, claude-code-extension-stack-skills-hooks-agents-mcp, con-u-pour-des-workflows-multi-agents]
related_compare: []
related_topics: [codex]
lang: en
---

# Subagents in Codex vs Claude Code: Which Multi-Agent Coding Tool Delivers?

**TL;DR:** If you want a built-in subagent and custom agent system for multi-agent coding workflows, **Claude Code is the clear winner** — it offers typed agent definitions, deterministic workflow orchestration, and parallel subagent execution from the terminal. **OpenAI Codex** takes a different approach: each task runs as an isolated cloud sandbox, and you achieve parallelism by launching multiple independent tasks rather than orchestrating subagents within a single session. Both tools let you run work concurrently, but the architectures — and the level of control you get — are fundamentally different.

## Overview: OpenAI Codex

**OpenAI Codex** is OpenAI's cloud-based [agentic coding](/glossary/agentic-coding) tool that executes software engineering tasks in sandboxed environments. Rather than running on your local machine, each Codex task spins up in an isolated cloud container with its own filesystem, shell access, and a snapshot of your repository. You submit a task — "fix the auth bug," "add pagination to the API" — and Codex works asynchronously, returning a pull request or a set of changes when it finishes.

Codex is available through ChatGPT (for Plus, Pro, and Team subscribers) and through the Codex CLI for terminal-based workflows. Its pricing is usage-based, drawing from your OpenAI API budget or your ChatGPT subscription's included usage. The [complete guide to Codex](/blog/codex-complete-guide) covers setup and pricing in detail.

The key architectural decision: Codex does not have a native subagent or custom agent system. Each task is a self-contained unit of work. If you want multiple things done in parallel, you launch multiple tasks — each gets its own sandbox, its own context, and its own output. There is no built-in mechanism for one task to spawn child tasks, share intermediate results, or orchestrate a multi-step workflow across coordinated agents.

## Overview: Claude Code

**Claude Code** is Anthropic's terminal-based AI coding agent with a rich, programmable multi-agent architecture. Unlike Codex's cloud-first model, Claude Code runs locally in your terminal with full access to your codebase, shell, and development environment. Its defining feature for this comparison is its built-in subagent system — the ability to spawn specialized child agents that run concurrently, each with their own tools, context, and constraints.

Claude Code's [extension stack](/blog/claude-code-extension-stack-skills-hooks-agents-mcp) includes custom agent types defined in `.claude/agents/` directories, deterministic workflow scripts that orchestrate dozens of agents, and typed structured output for reliable data passing between agents. You can define an `Explore` agent for read-only code search, a `Plan` agent for architecture design, a `code-reviewer` agent for automated review — each with specific tool permissions and system prompts.

The [agent teams](/blog/claude-code-agent-teams) feature enables parallel sub-agent execution on large codebases, making it practical to fan out work across multiple files, modules, or dimensions of analysis simultaneously.

## Feature Comparison

| Feature | OpenAI Codex | Claude Code | Winner |
|---------|-------------|-------------|--------|
| **Multi-agent model** | Parallel independent tasks | Hierarchical subagent tree | Claude Code |
| **Custom agent types** | Not supported | `.claude/agents/` definitions | Claude Code |
| **Parallel execution** | Multiple cloud sandboxes | Concurrent subagents (capped at ~16) | Tie |
| **Workflow orchestration** | Manual (launch separate tasks) | Deterministic scripts with `pipeline()`/`parallel()` | Claude Code |
| **Inter-agent communication** | None (isolated sandboxes) | Return values, structured schemas | Claude Code |
| **Execution environment** | Cloud sandbox (isolated) | Local terminal (shared filesystem) | Context-dependent |
| **Agent specialization** | Task-level prompt differences | Typed agents with tool restrictions | Claude Code |
| **Git integration** | Auto-generates PRs per task | Agents share working tree or use worktrees | Tie |
| **Pricing** | Usage-based / subscription included | Usage-based API billing | Tie |
| **Setup complexity** | Minimal (cloud-managed) | Requires local agent definitions | Codex |

## Multi-Agent Architecture: Detailed Analysis

The fundamental architectural difference between these tools determines everything about how you use subagents and custom agents — or whether you can use them at all.

**Codex's model is task-level parallelism.** Each task you submit to Codex runs in its own isolated container. The container gets a fresh clone of your repo, installs dependencies, and executes the task independently. This means you can launch five tasks simultaneously — say, fixing five different bugs — and each runs without interfering with the others. The isolation is a feature: tasks cannot corrupt each other's state, and failures are contained. But it also means there is no coordination. Task A cannot say "wait for Task B's output before proceeding." Task A cannot spawn Tasks C and D as subtasks. There is no parent-child relationship between tasks.

If you want to approximate a multi-agent workflow in Codex, you do it manually: launch Task A, wait for its PR, then launch Task B that builds on those changes. Or launch Tasks A through E in parallel and manually merge the results. The orchestration layer is you.

**Claude Code's model is hierarchical agent orchestration.** A single Claude Code session can spawn subagents using the `Agent()` tool, and those subagents can be of different types with different capabilities. A parent agent can launch an `Explore` agent to search the codebase, wait for its findings, then launch a `Plan` agent to design a solution, then fan out multiple implementation agents in parallel — all within one session, with full data flow between stages.

The `Workflow` system takes this further with deterministic scripting. You write JavaScript that calls `agent()`, `parallel()`, and `pipeline()` to define exactly how agents coordinate. For example, a code review workflow might fan out five reviewer agents (each checking a different dimension — bugs, performance, security, style, tests), collect all findings, deduplicate them, then fan out verifier agents to adversarially check each finding. This entire pipeline runs as a single orchestrated workflow with automatic concurrency management.

For practical examples of subagent patterns — including fan-out review, pipeline processing, and loop-until-dry discovery — see our [subagent examples guide](/blog/claude-code-subagents-examples).

## Custom Agent Definitions: Detailed Analysis

Custom agents are where Claude Code pulls significantly ahead. The `.claude/agents/` directory lets you define reusable agent types with specific capabilities, tool access, and behavioral instructions. A custom agent definition is a markdown file that specifies the agent's system prompt, which tools it can access, and how it should behave.

For example, you might define:

- A **pipeline-reviewer** agent that only has read access (no `Edit`, no `Write`) and is loaded with your project's known-issues registry, so it can catch regressions without accidentally modifying code
- An **Explore** agent optimized for fast, read-only code search — it can grep, glob, and read files but cannot execute arbitrary shell commands
- A **security-reviewer** agent with a system prompt focused on OWASP top 10 vulnerabilities and access to security scanning tools via MCP

These custom agent types are invoked by name. When you call `Agent({subagent_type: "pipeline-reviewer"})`, Claude Code loads that agent's definition and spawns a subagent with the specified constraints. This means the specialization is not just prompt-level — it is enforced at the tool-access level. A read-only agent literally cannot edit files.

**Codex has no equivalent to custom agent types.** Every Codex task uses the same underlying agent with the same capabilities. You can vary the prompt — "act as a security reviewer" — but you cannot restrict tool access, define reusable agent templates, or enforce behavioral constraints at the system level. The differentiation between tasks is purely in the natural language instructions you provide.

This matters in practice because tool-level restrictions prevent entire categories of errors. A code review agent that cannot write files cannot accidentally "fix" the code instead of just reporting issues. An exploration agent that cannot run arbitrary commands cannot accidentally trigger side effects. Claude Code's [seven programmable layers](/blog/claude-code-seven-programmable-layers) — from user-level config to system-level constraints — give you fine-grained control over what each agent can and cannot do.

## Orchestration and Data Flow: Detailed Analysis

Orchestration is the ability to coordinate multiple agents into a coherent workflow with defined data flow, error handling, and concurrency control. This is where the architectural difference has the most practical impact.

**Codex offers no built-in orchestration.** Tasks are fire-and-forget. You submit a task, and it either succeeds (producing a PR or code changes) or fails. There is no mechanism to chain tasks, pass structured data between them, or conditionally branch based on a task's output. If you need a pipeline — "first analyze the codebase, then based on the analysis, make changes" — you implement that pipeline yourself, outside of Codex, by parsing task outputs and submitting follow-up tasks.

**Claude Code offers two levels of orchestration:**

*Implicit orchestration* happens when a Claude Code session spawns subagents conversationally. The parent agent decides when to spawn a subagent, what to ask it, and how to use its response. This is flexible but model-driven — the orchestration logic is in Claude's reasoning, not in deterministic code.

*Explicit orchestration* uses the `Workflow` system. You write a script that defines exactly how agents coordinate:

```javascript
// Fan out reviewers, then verify each finding
const results = await pipeline(
  DIMENSIONS,
  d => agent(d.prompt, {phase: 'Review', schema: FINDINGS_SCHEMA}),
  review => parallel(review.findings.map(f => () =>
    agent(`Verify: ${f.title}`, {phase: 'Verify', schema: VERDICT_SCHEMA})
  ))
)
```

This script runs deterministically. `pipeline()` processes each dimension through all stages independently — no barrier between stages, so Dimension A's findings can be verified while Dimension B is still being reviewed. `parallel()` runs tasks concurrently with a barrier, collecting all results before proceeding. Structured schemas (`schema: FINDINGS_SCHEMA`) force agents to return validated JSON objects, eliminating parsing errors.

The `Workflow` system also supports loop-until-dry patterns (keep searching until no new results), budget-aware scaling (adjust agent count based on token budget), and resume from checkpoint (re-run a modified workflow and skip unchanged agent calls). None of these patterns are possible in Codex without external tooling.

The [multi-agent workflow revolution](/blog/con-u-pour-des-workflows-multi-agents) blog post explores how these orchestration patterns are reshaping how teams approach complex engineering tasks.

## Isolation and Safety

The two tools make opposite tradeoffs on isolation, and both choices are defensible depending on your needs.

**Codex isolates by default.** Each task runs in its own cloud container with its own filesystem. Tasks cannot interfere with each other, cannot access your local machine, and cannot see each other's intermediate state. This is excellent for safety — a rogue task cannot corrupt your working directory or leak data to another task. It is poor for coordination — tasks that need to share context must do so through the repository (one task commits, another reads the commit).

**Claude Code shares by default, isolates on demand.** Subagents run in the same local environment as the parent agent. They can read the same files, run the same commands, and see each other's changes in real-time. This enables tight coordination but requires care — two agents editing the same file simultaneously will conflict. Claude Code mitigates this with `isolation: 'worktree'`, which creates a temporary git worktree for the agent. The agent works on an isolated copy and its changes are merged back only if it succeeds. But worktree creation has overhead (~200-500ms per agent), so it is reserved for parallel mutation scenarios.

For read-heavy workflows — code review, analysis, search — Claude Code's shared-environment model is strictly better. All agents see the current state of the codebase without any synchronization overhead. For write-heavy parallel workflows, Codex's default isolation avoids merge conflicts at the cost of requiring manual integration.

## When to Choose OpenAI Codex

**Choose Codex when your work naturally decomposes into independent, parallel tasks that do not need to coordinate.** The classic Codex workflow is a backlog of discrete issues — bug fixes, feature additions, documentation updates — where each task can be completed independently and produces its own PR.

Codex excels when:

- You have **10+ independent tasks** to complete and want them all running simultaneously in the cloud
- Tasks are **self-contained** — each can be described, executed, and reviewed without context from other tasks
- You want **zero local resource usage** — everything runs in the cloud, freeing your machine
- You prefer **PR-per-task granularity** — each task produces a reviewable, mergeable unit of work
- Your team is already in the **ChatGPT/OpenAI ecosystem** and wants integrated task management

The lack of subagent orchestration is not a limitation if your tasks are naturally independent. Codex's cloud sandbox model is purpose-built for this pattern, and it handles it well.

## When to Choose Claude Code

**Choose Claude Code when your work requires coordinated multi-agent workflows, specialized agent roles, or orchestrated pipelines.** Claude Code's subagent system is designed for tasks where agents need to communicate, share intermediate results, or follow a defined sequence.

Claude Code excels when:

- You need **hierarchical task decomposition** — a parent agent that breaks work into subtasks and synthesizes results
- Different parts of the work require **different agent specializations** — a searcher, a planner, an implementer, a reviewer
- Your workflow has **dependencies between steps** — analysis must complete before implementation, implementation before review
- You want **deterministic orchestration** — scripted workflows that run the same way every time, with structured data flow
- You need **adversarial verification** — multiple independent agents checking each other's work
- You are working on a **large codebase** where understanding the full context requires parallel exploration

The [agent harnesses](/blog/agent-harnesses-2026) landscape is evolving rapidly, and Claude Code's programmable harness — with skills, hooks, agents, and MCP — represents the most complete implementation of the multi-agent coding paradigm available today.

## Migration Path: Codex Users Who Want Subagents

If you are currently using Codex and want subagent capabilities, you have two practical options:

**Option 1: Add external orchestration to Codex.** Use a scripting layer (Python, shell scripts, or a CI pipeline) to submit Codex tasks in sequence, parse their outputs, and submit follow-up tasks based on results. This approximates multi-stage workflows but lacks the tight integration of native subagents. You handle all error recovery, data formatting, and conditional logic yourself.

**Option 2: Move multi-agent workflows to Claude Code.** Keep Codex for independent parallel tasks where its cloud model shines, and use Claude Code for workflows that require coordination. The two tools are not mutually exclusive — many teams use both, choosing the right tool based on whether the task is independent (Codex) or coordinated (Claude Code).

The [Agent SDK](/glossary/agent-sdk) ecosystem is also worth watching. As agent frameworks mature, the gap between tools may narrow — but as of mid-2026, Claude Code's native subagent system remains significantly ahead of what Codex offers for orchestrated workflows.

## Verdict

**For subagents and custom agents, Claude Code is the substantially stronger tool.** It offers a complete multi-agent system — custom agent types with enforced tool restrictions, deterministic workflow orchestration with `pipeline()` and `parallel()`, structured data flow between agents via JSON schemas, and practical patterns like adversarial verification and loop-until-dry discovery. Codex does not have a native subagent or custom agent system; its parallelism model is task-level isolation in cloud sandboxes.

That said, **Codex's cloud sandbox model is genuinely better for independent parallel tasks.** If you have a backlog of 20 unrelated bug fixes, launching them all as separate Codex tasks is simpler and more efficient than orchestrating 20 Claude Code subagents. The right choice depends on whether your tasks need to talk to each other.

**If your workflow involves any of these patterns — fan-out/fan-in, multi-stage pipelines, specialized agent roles, or adversarial verification — Claude Code is the tool to use.** If your work is a queue of independent tasks, Codex handles that well. For teams doing both, the practical answer is to use both tools for their respective strengths.

## Frequently Asked Questions

### Can OpenAI Codex spawn subagents within a single task?

No. As of mid-2026, Codex tasks run as single agents in isolated cloud sandboxes. There is no built-in mechanism for a Codex task to spawn child tasks, delegate subtasks, or orchestrate multi-agent workflows. Parallelism comes from launching multiple independent tasks, not from within-task agent orchestration.

### How many subagents can Claude Code run simultaneously?

Claude Code caps concurrent subagent execution at approximately 16 agents (calculated as CPU cores minus 2) per workflow. You can submit more — passing 100 items to `pipeline()` or `parallel()` works fine — but only ~16 run at any moment, with the rest queued. The total agent count across a workflow's lifetime is capped at 1,000.

### Can I define custom agent types in Codex?

Codex does not support custom agent type definitions. Every Codex task uses the same underlying agent with the same tool capabilities. You can customize behavior through prompts — instructing the agent to "act as a security reviewer" — but you cannot restrict tool access or enforce behavioral constraints at the system level the way Claude Code's `.claude/agents/` definitions do.

### Is it possible to pass data between Codex tasks?

Not directly. Codex tasks are isolated — they cannot read each other's state or intermediate results. The practical workaround is to have one task commit its output to the repository, then launch a subsequent task that reads those changes. This works but requires manual orchestration and introduces latency between stages.

### Do I need to choose one tool or can I use both?

Many teams use both tools for their respective strengths. Codex handles independent parallel tasks efficiently with its cloud sandbox model — great for bug fix backlogs and feature queues. Claude Code handles coordinated multi-agent workflows with its subagent system — ideal for code reviews, complex refactoring, and multi-stage pipelines. The tools are complementary, not mutually exclusive.

---

*Want more AI insights? [Subscribe to LoreAI](/subscribe) for daily briefings.*