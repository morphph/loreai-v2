---
title: "Subagents and Custom Agents in Codex vs Claude Code: Multi-Agent Coding Compared"
slug: use-subagents-and-custom-agents-in-codex
description: "Compare subagent and custom agent capabilities in OpenAI Codex vs Claude Code for multi-agent AI coding workflows."
item_a: OpenAI Codex
item_b: Claude Code
category: tools
related_glossary: [agent-sdk, agentic-coding]
related_blog: [claude-code-subagents-examples, codex-complete-guide, claude-code-agent-teams, claude-code-extension-stack-skills-hooks-agents-mcp, agent-harnesses-2026, con-u-pour-des-workflows-multi-agents]
related_compare: []
related_topics: [codex]
lang: en
---

# Subagents and Custom Agents in Codex vs Claude Code: Multi-Agent Coding Compared

**TL;DR:** If you need hierarchical, orchestrated multi-agent workflows — subagents spawning subagents, deterministic pipelines, parallel fan-out with structured output — **Claude Code is the clear leader**. Its Agent tool, Workflow engine, and custom agent definitions give you fine-grained control over multi-agent orchestration directly from the terminal. **OpenAI Codex** takes a different approach: parallel independent tasks running in sandboxed cloud environments, configured through AGENTS.md files and system prompts. Codex is simpler to set up for basic parallelism but lacks the deep orchestration primitives that Claude Code provides.

## Overview: OpenAI Codex

**OpenAI Codex** is OpenAI's cloud-based [agentic coding](/glossary/agentic-coding) tool that runs tasks in sandboxed environments. Each Codex task operates in an isolated container with its own copy of your repository, executes commands, edits files, and returns results — all without touching your local machine. You interact with Codex through the ChatGPT interface, the Codex CLI (open-source), or the VS Code extension.

For multi-agent work, Codex's model is fundamentally task-parallel: you launch multiple independent Codex tasks that each run in their own sandbox. There is no native mechanism for one Codex task to spawn child tasks or coordinate with sibling tasks mid-execution. Custom agent behavior is configured through AGENTS.md files in your repository — similar in concept to Claude Code's CLAUDE.md — which define instructions, constraints, and personas that shape how Codex approaches work. You can also pass custom system prompts per task via the CLI or API. For a full breakdown of Codex's architecture and capabilities, see our [complete guide to OpenAI Codex](/blog/codex-complete-guide).

Codex pricing follows OpenAI's usage-based model, with tasks consuming tokens from your ChatGPT Pro, Team, or Enterprise subscription.

## Overview: Claude Code

**Claude Code** is Anthropic's terminal-based AI coding agent with built-in multi-agent orchestration. Unlike Codex's cloud-first approach, Claude Code runs locally in your terminal and connects directly to your codebase. What sets it apart for multi-agent work is its layered extension system: the Agent tool for spawning subagents, the Workflow engine for deterministic multi-agent pipelines, and custom agent definitions via `.claude/agents/` files.

Claude Code's subagent system is hierarchical — a main agent can spawn specialized subagents (Explore, Plan, code-reviewer, or custom types), each with their own tools and context. These subagents can run in parallel or sequentially, return structured output via JSON schemas, and even operate in isolated git worktrees to avoid file conflicts. The Workflow engine adds another layer: scripted orchestration with `pipeline()`, `parallel()`, and `phase()` primitives that let you build deterministic multi-agent workflows with fan-out, barriers, and loop-until-done patterns.

For a deeper look at Claude Code's programmable layers, read our [guide to Claude Code's extension stack](/blog/claude-code-extension-stack-skills-hooks-agents-mcp). Pricing is usage-based through Anthropic's API.

## Feature Comparison

| Feature | OpenAI Codex | Claude Code | Winner |
|---------|-------------|-------------|--------|
| **Subagent spawning** | No native subagent hierarchy | Built-in Agent tool with typed subagents | Claude Code |
| **Custom agent types** | AGENTS.md + system prompts | `.claude/agents/` files with tool restrictions | Claude Code |
| **Parallel execution** | Multiple independent tasks via dashboard/API | `parallel()` and `pipeline()` with barrier control | Claude Code |
| **Orchestration engine** | Manual (launch tasks separately) | Workflow engine with deterministic scripting | Claude Code |
| **Isolation model** | Each task gets its own sandbox | Optional git worktree isolation per subagent | Tie |
| **Structured output** | Standard OpenAI function calling | Schema-validated subagent returns | Tie |
| **Setup complexity** | AGENTS.md file in repo root | `.claude/agents/` directory + CLAUDE.md | Codex |
| **Cloud execution** | Native — all tasks run in cloud | Local by default, remote sessions available | Codex |
| **Open-source CLI** | Yes (Codex CLI) | No (proprietary) | Codex |
| **Git integration** | Auto-creates PRs from sandbox | Local git operations + PR creation | Tie |

## Subagent Architecture: Deep Comparison

The most fundamental difference between Codex and Claude Code for multi-agent work is architectural. Codex uses a flat, task-parallel model. Claude Code uses a hierarchical, orchestrated model. This distinction affects everything from how you design workflows to what kinds of problems each tool can solve.

### Codex: Flat Task Parallelism

In Codex, there is no concept of a "subagent" in the traditional sense. Each Codex task is a top-level, independent unit of work. When you want parallelism, you launch multiple tasks — either through the web interface, the API, or by queuing them via the CLI. Each task:

- Gets its own sandboxed environment with a fresh clone of your repo
- Runs independently with no awareness of other concurrent tasks
- Returns results (code changes, PR drafts) that you merge manually or through Codex's PR workflow
- Cannot communicate with or coordinate with other running tasks

This model is simple and robust. There is no orchestration overhead, no coordination bugs, and no risk of subagents interfering with each other. For problems that decompose cleanly into independent units — "fix these five bugs," "add tests to these three modules," "refactor each of these services" — Codex's flat parallelism works well.

The limitation becomes apparent when tasks have dependencies. If task B needs the output of task A, or if you want to fan out results from a discovery phase into a verification phase, Codex requires you to orchestrate that externally — through scripts, CI pipelines, or manual sequencing.

### Claude Code: Hierarchical Orchestration

Claude Code's subagent system is designed for exactly the dependent, multi-phase workflows that Codex struggles with. The Agent tool lets a main agent spawn typed subagents with specific capabilities:

- **Explore agents**: Read-only search agents for locating code, finding patterns, and answering "where is X defined?" questions. Fast and cheap — they cannot edit files.
- **Plan agents**: Architect agents that design implementation strategies, identify critical files, and consider tradeoffs. They return structured plans, not code changes.
- **General-purpose agents**: Full-capability agents that can read, write, search, and execute commands. Used for substantial subtasks that need autonomy.
- **Custom agents**: User-defined agent types with specific system prompts, tool restrictions, and behavioral constraints. Defined in `.claude/agents/` markdown files.

The key differentiator is that these subagents are hierarchical. The parent agent spawns them, receives their results, and makes decisions based on those results — including spawning more subagents. This enables patterns like:

1. Spawn three Explore agents to find all API endpoints, database queries, and test files in parallel
2. Synthesize the results into a refactoring plan
3. Spawn general-purpose agents to implement changes to each module
4. Spawn a code-reviewer agent to verify the changes

Each step uses the output of the previous step. This is difficult to replicate in Codex without external orchestration.

For real-world examples of these patterns in action, see our [guide to Claude Code subagent examples](/blog/claude-code-subagents-examples).

## Custom Agent Configuration: How Each Tool Does It

Both Codex and Claude Code let you define custom agent behavior through configuration files in your repository. The approaches differ significantly in scope and flexibility.

### Codex: AGENTS.md and System Prompts

Codex uses AGENTS.md files — placed in your repository root or in subdirectories — to define how the agent should behave. An AGENTS.md file typically contains:

- Project context and coding standards
- File-level instructions (which directories to focus on, which to avoid)
- Testing requirements and build commands
- Language and framework preferences

You can also pass custom system prompts via the Codex CLI's `--instructions` flag or through the API, overriding or augmenting the AGENTS.md configuration. This gives you per-task customization without modifying repository files.

The simplicity here is a strength: one markdown file, human-readable, version-controlled. But AGENTS.md controls a single agent's behavior — there is no mechanism to define multiple agent types with different tool access, different models, or different behavioral constraints within the same repository.

### Claude Code: `.claude/agents/` Directory

Claude Code's custom agent system is more granular. You create markdown files in `.claude/agents/`, each defining a distinct agent type with:

- A system prompt describing the agent's role and behavior
- Tool restrictions (which tools the agent can and cannot use)
- Model overrides (use a different Claude model for this agent type)
- Behavioral constraints specific to the agent's purpose

For example, a repository might define a `pipeline-reviewer` agent that only has access to Read, Grep, and Bash tools (no editing), is loaded with knowledge of known pipeline bugs, and is automatically invoked after changes to pipeline scripts. Another agent definition might create a `security-auditor` type with specific security-focused prompts and access to web search tools.

These custom agents compose with Claude Code's broader extension stack. A Skill file can invoke a custom agent type. A Workflow script can spawn custom agents alongside built-in types. A hook can trigger a custom agent in response to file changes. This layered composition — covered in depth in our [analysis of Claude Code's extension stack](/blog/claude-code-extension-stack-skills-hooks-agents-mcp) — is where Claude Code's multi-agent system becomes significantly more powerful than Codex's flat configuration model.

## Workflow Orchestration: The Decisive Gap

The largest capability gap between Codex and Claude Code for multi-agent work is orchestration. Claude Code's Workflow engine provides deterministic, scripted control over multi-agent execution. Codex has no equivalent.

### Claude Code's Workflow Engine

The Workflow tool accepts JavaScript scripts that orchestrate multiple subagents with explicit control flow. The core primitives are:

- **`agent(prompt, opts)`**: Spawn a subagent with optional schema validation, model override, phase grouping, and worktree isolation
- **`pipeline(items, ...stages)`**: Process items through sequential stages independently — no barrier between stages, so item A can be in stage 3 while item B is in stage 1
- **`parallel(thunks)`**: Run tasks concurrently with a barrier — awaits all before returning
- **`phase(title)`**: Group agents under named phases for progress tracking

These primitives enable sophisticated patterns. Consider a code review workflow that needs to check for bugs, performance issues, and security vulnerabilities, then verify each finding:

```javascript
const DIMENSIONS = [
  {key: 'bugs', prompt: 'Find correctness bugs...'},
  {key: 'perf', prompt: 'Find performance issues...'},
  {key: 'security', prompt: 'Find security vulnerabilities...'}
];

const results = await pipeline(
  DIMENSIONS,
  d => agent(d.prompt, {label: `review:${d.key}`, schema: FINDINGS_SCHEMA}),
  (review, d) => parallel(review.findings.map(f => () =>
    agent(`Verify: ${f.title}`, {label: `verify:${f.file}`, schema: VERDICT_SCHEMA})
  ))
);
```

Each dimension reviews independently, and its findings start verification immediately — without waiting for other dimensions to finish. This is wall-clock optimal in a way that sequential task launching (Codex's model) cannot match.

The Workflow engine also supports loop-until-done patterns for unknown-size discovery, budget-aware scaling based on token targets, and nested workflow composition. For teams building custom development automation, this is a programmable multi-agent runtime, not just a coding assistant.

Our analysis of [agent harnesses in 2026](/blog/agent-harnesses-2026) explores why this kind of deterministic orchestration layer is becoming essential as agent workflows grow more complex.

### Codex: External Orchestration Required

Codex does not have an internal orchestration engine. To achieve multi-step, dependent workflows, you need external tooling:

- **CI/CD pipelines**: Use GitHub Actions or similar to chain Codex tasks, passing outputs between steps
- **API scripting**: Write scripts that call the Codex API, wait for results, and launch follow-up tasks
- **Manual sequencing**: Launch tasks in order through the dashboard, reviewing results between steps

This works, but it moves orchestration complexity out of the coding tool and into your infrastructure. You lose the tight feedback loop of an agent that can inspect results and make decisions within the same session. The Codex CLI's open-source nature means the community could build orchestration layers on top, but as of mid-2026, no widely adopted solution exists.

For teams already invested in CI/CD-based automation, Codex's approach may integrate well with existing workflows. For teams that want multi-agent orchestration as a first-class feature of their coding tool, Claude Code is the clear choice. The [multi-agent workflow revolution](/blog/con-u-pour-des-workflows-multi-agents) is increasingly favoring tools with built-in orchestration.

## Isolation and Safety: Sandboxes vs Worktrees

Both tools address the fundamental challenge of parallel agent execution: preventing agents from stepping on each other's changes. They solve it differently.

### Codex: Full Sandbox Isolation

Every Codex task runs in its own container with a fresh copy of your repository. This provides strong isolation by default — there is no possibility of two tasks conflicting because they never share a filesystem. The tradeoff is that each sandbox requires setup time (cloning, installing dependencies) and cannot access local state, environment variables, or services running on your machine unless explicitly configured.

This model is ideal for untrusted or experimental changes. If a Codex task makes a mess, the sandbox is disposable. But it also means tasks cannot easily share intermediate results or build on each other's work within a single session.

### Claude Code: Optional Worktree Isolation

Claude Code runs locally by default — all agents share the same filesystem. For parallel execution where agents edit files, this creates conflict risk. The solution is optional **git worktree isolation**: when you spawn a subagent with `isolation: 'worktree'`, it gets a temporary git worktree — a separate working directory linked to the same repository. Changes are isolated but lightweight (no full clone needed), and unchanged worktrees are automatically cleaned up.

The advantage is flexibility. Read-only agents (Explore, Plan) don't need isolation and run with zero overhead. Write agents that touch different parts of the codebase can share the main worktree. Only agents that might conflict need worktree isolation. This granular control reduces overhead compared to Codex's all-or-nothing sandbox model.

The tradeoff is trust: Claude Code agents have access to your local environment unless you restrict their tools. For security-sensitive contexts, Codex's mandatory sandboxing provides a stronger default boundary.

## Practical Workflow Comparison

To make the differences concrete, here is how you would implement the same multi-agent task — "review all API endpoints for security issues and fix the confirmed vulnerabilities" — in each tool.

### In Codex

1. Launch a Codex task: "List all API endpoints in this repository and identify potential security vulnerabilities"
2. Wait for the task to complete and review the findings
3. For each confirmed vulnerability, launch a separate Codex task: "Fix the security issue in [file] at [line]"
4. Review each task's PR independently
5. Merge the PRs that pass review

Total tasks: 1 discovery + N fix tasks, launched sequentially with manual review between phases.

### In Claude Code

1. Run a single Workflow that:
   - Spawns an Explore agent to find all API endpoints
   - Fans out security review agents (one per endpoint or group) in parallel
   - Filters results through an adversarial verification stage to eliminate false positives
   - Spawns fix agents for confirmed vulnerabilities, each in a worktree
   - Returns a summary of all changes made

Total interaction: one command, one approval step, automated coordination between phases.

The Claude Code approach requires more upfront workflow design but executes faster and with less manual intervention. For teams that run similar workflows repeatedly, the Workflow script becomes a reusable asset. Our [guide to Claude Code agent teams](/blog/claude-code-agent-teams) walks through building these kinds of multi-agent workflows step by step.

## When to Choose OpenAI Codex

Codex is the better choice when:

- **Your tasks are naturally independent**: Bug fixes, test additions, or refactoring tasks that don't depend on each other. Codex's flat parallelism handles these cleanly without orchestration overhead.
- **You want cloud-native execution**: If you need tasks to run without a local machine — triggered from CI, scheduled via API, or launched from mobile — Codex's cloud sandbox model is purpose-built for this.
- **You prefer the OpenAI ecosystem**: If your team already uses ChatGPT, GPT-4, and OpenAI's API, Codex integrates naturally. AGENTS.md configuration is familiar to anyone who has written system prompts.
- **Simplicity matters more than control**: Codex's one-task-one-sandbox model is easy to reason about. No subagent hierarchies, no orchestration scripts, no worktree management. For teams new to agentic coding, this lower complexity ceiling is an advantage.
- **You need open-source tooling**: The [Codex CLI is open source](/blog/codex-complete-guide), which means you can inspect, modify, and extend its behavior. Claude Code's CLI is proprietary.

## When to Choose Claude Code

Claude Code is the better choice when:

- **Your workflows have dependencies between steps**: Discovery → analysis → implementation → verification chains require orchestration that Claude Code provides natively through its Workflow engine.
- **You need specialized agent types**: Custom agents with restricted tools, specific models, or domain-focused prompts. A security auditor agent that cannot edit files. A documentation agent that cannot run shell commands. Claude Code's agent type system supports this granularity.
- **You want terminal-native development**: If your workflow is already terminal-centric (git, make, docker, ssh), Claude Code fits without context-switching to a web dashboard. Subagents inherit your local environment, tools, and configuration.
- **You build reusable automation**: Workflow scripts, Skill files, and custom agent definitions are version-controlled assets that compound over time. Teams that invest in Claude Code's extension stack get increasingly powerful automation as their library grows. Read about this compounding effect in our [exploration of Claude Code's seven programmable layers](/blog/claude-code-seven-programmable-layers).
- **You need structured output from agents**: Claude Code's schema-validated subagent returns ensure you get typed, parseable data — not free-text that needs post-processing. This is critical for multi-stage workflows where stage N parses stage N-1's output.

## Verdict

For multi-agent coding workflows, **Claude Code is the significantly more capable tool**. Its hierarchical subagent system, Workflow orchestration engine, custom agent types, and composable extension stack provide a level of control that Codex's flat task model cannot match. If your work involves dependent, multi-phase workflows — review-then-fix, discover-then-implement, analyze-then-refactor — Claude Code's architecture is purpose-built for this.

**Codex wins on simplicity and cloud execution.** Its sandboxed, independent task model is easier to understand, requires less configuration, and runs entirely in the cloud. For teams that need basic parallelism across independent tasks without orchestration complexity, Codex is the more pragmatic choice.

The practical recommendation: if you are searching for "use subagents and custom agents in Codex" because you want Codex to do multi-agent orchestration, evaluate whether Claude Code's native capabilities better match your needs. If your tasks are truly independent and you value cloud execution, Codex serves well. If you need agents that coordinate, share context, and build on each other's work, Claude Code is where the multi-agent tooling is most mature. For a hands-on walkthrough, see our [Claude Code subagent examples](/blog/claude-code-subagents-examples).

## Frequently Asked Questions

### Does OpenAI Codex support subagents?
Codex does not have a native subagent hierarchy. Each Codex task runs as an independent, top-level unit in its own sandbox. You can achieve parallelism by launching multiple tasks simultaneously, but they cannot spawn child tasks or coordinate mid-execution. Multi-step orchestration requires external scripting or CI pipeline integration.

### How do you define custom agents in Claude Code?
Create a markdown file in your repository's `.claude/agents/` directory. Each file defines an agent type with a system prompt, tool restrictions, and optional model overrides. These custom agents can then be spawned by the main agent or invoked from Workflow scripts using the `agentType` parameter. They are version-controlled and travel with your repo.

### Can Codex and Claude Code be used together?
Yes. Some teams use Codex for cloud-based, fire-and-forget tasks (background refactoring, bulk test generation) and Claude Code for interactive, multi-step workflows that require local context and orchestration. The tools operate on different models and runtimes, so there is no technical conflict — though you will need to manage configuration files for both (AGENTS.md for Codex, CLAUDE.md for Claude Code).

### What is the Workflow engine in Claude Code?
The Workflow engine is a deterministic orchestration layer that lets you script multi-agent workflows in JavaScript. It provides primitives like `pipeline()` for streaming items through stages, `parallel()` for concurrent execution with barriers, and `agent()` for spawning typed subagents with structured output. Unlike ad-hoc agent spawning, Workflows are repeatable, resumable, and budget-aware.

### Is the Codex CLI open source?
Yes. OpenAI released the Codex CLI as an open-source tool, allowing developers to inspect, modify, and extend its behavior. Claude Code's CLI is proprietary. For teams that need to customize the agent runtime itself — not just configure its behavior — Codex's open-source CLI provides more flexibility at the infrastructure level.

---

*Want more AI insights? [Subscribe to LoreAI](/subscribe) for daily briefings.*