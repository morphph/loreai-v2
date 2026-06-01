---
title: "Codex vs Claude Code: Subagents and Custom Agents Compared"
slug: use-subagents-and-custom-agents-in-codex
description: "Compare how to use subagents and custom agents in Codex vs Claude Code — architecture, configuration, and multi-agent workflows."
item_a: OpenAI Codex
item_b: Claude Code
category: tools
related_glossary: [agent-sdk, agentic-coding]
related_blog: [claude-code-subagents-examples, claude-code-agent-teams, codex-complete-guide, claude-code-extension-stack-skills-hooks-agents-mcp]
related_compare: []
related_topics: [codex]
lang: en
---

<!-- Pre-Draft Planning
1. Target keyword: use subagents and custom agents in codex
2. Page type: compare
3. Keyword intent: commercial — searchers want to evaluate and adopt multi-agent coding workflows, comparing Codex's approach against alternatives
4. Likely official-doc competitor: OpenAI Codex documentation on agents, Anthropic Claude Code docs on agent teams
5. Likely non-official competitor pattern: thin rewrites of official docs, shallow feature lists, outdated comparisons from before Codex's agent customization shipped
6. LoreAI standout angle: Side-by-side architectural comparison with concrete workflow examples, clear recommendations by team size and use case, and honest assessment of each platform's maturity for multi-agent orchestration
-->

# Codex vs Claude Code: Subagents and Custom Agents Compared

**TL;DR:** Both OpenAI Codex and Claude Code support multi-agent workflows, but their architectures differ fundamentally. **Codex runs subagents as isolated cloud tasks** — each agent gets its own sandboxed environment, making it safer but higher-latency. **Claude Code runs subagents locally as spawned processes** with shared filesystem access and deterministic workflow orchestration, giving you lower latency and tighter control. For teams that want fire-and-forget cloud agents, Codex is simpler to start with. For developers who need programmable multi-agent pipelines with custom agent types, Claude Code's system is more mature.

## Overview: OpenAI Codex

**OpenAI Codex** is a cloud-based [agentic coding](/glossary/agentic-coding) platform that runs coding tasks in isolated sandboxed environments. Each task you submit to Codex spins up a dedicated container with a full development environment — your repository code, dependencies, and tools — then executes the work asynchronously. You can submit multiple tasks in parallel, effectively creating a pool of subagents that work independently on different parts of your codebase.

Codex's agent customization system lets you define custom agents with specific instructions, tool access, and behavioral constraints. These agents can be configured through the ChatGPT interface or the [VS Code extension](/blog/codex-vscode), making it accessible to developers who prefer a GUI-driven workflow. The cloud-native architecture means you don't need a powerful local machine — Codex handles compute, dependency installation, and environment setup remotely. For a full breakdown of Codex's capabilities, see our [complete guide to OpenAI Codex](/blog/codex-complete-guide).

## Overview: Claude Code

**Claude Code** is Anthropic's terminal-based AI coding agent that runs directly on your machine. Its [subagent system](/blog/claude-code-subagents-examples) spawns child processes that share access to your local filesystem, enabling parallel task execution without the overhead of cloud provisioning. Claude Code supports multiple built-in agent types — Explore for codebase search, code-reviewer for PR analysis, Plan for architecture design — and lets you define custom agents via markdown files in your repository's `.claude/agents/` directory.

The key differentiator is Claude Code's **Workflow engine**, a deterministic orchestration layer that lets you script multi-agent pipelines with fan-out, barriers, and structured output schemas. This goes beyond simple task parallelism — you can build review pipelines where multiple agents analyze code from different angles, then synthesize their findings. Claude Code's [extension stack](/blog/claude-code-extension-stack-skills-hooks-agents-mcp) (skills, hooks, agents, and MCP) creates a programmable platform where custom agents integrate with the rest of your development toolchain.

## Feature Comparison

| Feature | OpenAI Codex | Claude Code | Winner |
|---------|-------------|-------------|--------|
| **Agent execution** | Cloud-sandboxed containers | Local spawned processes | Tie — depends on use case |
| **Custom agent config** | GUI + system prompt instructions | Markdown files in `.claude/agents/` | Claude Code |
| **Multi-agent orchestration** | Parallel task submission | Workflow engine with `pipeline()`, `parallel()`, `phase()` | Claude Code |
| **Built-in agent types** | General-purpose coding agent | Explore, code-reviewer, Plan, pipeline-reviewer, general-purpose | Claude Code |
| **Structured output** | JSON mode on responses | Schema-validated `StructuredOutput` tool with retry | Claude Code |
| **Isolation** | Full container isolation per task | Optional git worktree isolation | Codex |
| **Async execution** | Native — tasks run in background | Background agents with notification | Tie |
| **IDE integration** | VS Code extension, ChatGPT web | Terminal CLI, VS Code extension, JetBrains | Tie |
| **Pricing model** | Included with ChatGPT Pro/Team/Enterprise | Usage-based API billing | Codex (for Pro subscribers) |
| **Internet access** | Disabled by default in sandbox | Full network access (controllable via hooks) | Context-dependent |

## Agent Architecture: How Subagents Actually Work

The most important difference between Codex and Claude Code subagents isn't features — it's execution architecture, and this shapes everything downstream.

**Codex's cloud-container model** means each subagent runs in a fresh, isolated environment. When you submit a task, Codex provisions a container with your repository code, installs dependencies, and executes the agent's work. The agent can read and modify files, run tests, and use shell commands — all within its sandbox. Once the task completes, Codex presents the results (typically a diff or a set of file changes) for your review. You can submit multiple tasks simultaneously, and they execute in parallel on separate infrastructure.

This architecture provides strong isolation guarantees. One subagent can't interfere with another's work, and a failing task doesn't affect your local environment. The tradeoff is latency — container provisioning and dependency installation add overhead, especially for tasks that need a complex build environment. For quick operations that take a few seconds locally, the cloud round-trip can dominate total execution time.

**Claude Code's local-process model** spawns subagents as child processes on your machine. Each subagent inherits access to your local filesystem, environment variables, and installed tools. The parent agent can pass structured prompts to subagents and receive typed results back through the schema validation system. Claude Code's [agent teams](/blog/claude-code-agent-teams) can run up to `min(16, cpu_cores - 2)` agents concurrently, with excess calls queuing automatically.

The local model enables tighter integration patterns. A subagent can read the latest state of files modified by another subagent (when not using worktree isolation), tools discovered via MCP are available to all agents, and the orchestrating workflow can make real-time decisions based on intermediate results. The tradeoff is that you need sufficient local compute, and agents without worktree isolation can create file conflicts when editing the same files in parallel.

## Custom Agent Configuration: Defining Specialized Agents

Both platforms let you create agents with custom instructions and behaviors, but the configuration mechanisms differ significantly.

### Codex Custom Agents

In Codex, custom agents are configured primarily through the interface. You define an agent by specifying:

- A system prompt that sets the agent's role, constraints, and behavioral guidelines
- Tool access permissions — which commands and files the agent can interact with
- Repository context — which parts of your codebase the agent should focus on

This GUI-driven approach is straightforward for teams that want to create a few specialized agents (a test writer, a documentation updater, a code reviewer) without writing configuration files. The limitation is programmatic control — you can't version-control agent definitions alongside your code in the same way, and you can't dynamically compose agents based on runtime conditions.

### Claude Code Custom Agents

Claude Code takes a code-as-configuration approach. Custom agents are defined as markdown files in `.claude/agents/`, checked into your repository:

```markdown
# test-writer

You are a test generation specialist. When given a source file,
analyze its public API surface and generate comprehensive test
coverage using the project's existing test framework.

## Constraints
- Follow existing test naming conventions
- Use the project's mock/stub patterns
- Generate both happy-path and edge-case tests
```

These agent definitions are version-controlled, reviewable in PRs, and automatically available to anyone who clones the repo. You invoke a custom agent by specifying its `agentType` when spawning:

```javascript
const result = await agent('Generate tests for src/auth.ts', {
  agentType: 'test-writer',
  schema: TEST_SCHEMA
})
```

Beyond static definitions, Claude Code's Workflow engine lets you compose agents dynamically. You can loop over a list of files, spawn a custom agent per file, collect structured results, and feed them into a synthesis agent — all in a deterministic script that runs reproducibly.

## Multi-Agent Orchestration: Pipelines vs Parallel Tasks

This is where the two platforms diverge most sharply. Orchestration — coordinating multiple agents to accomplish a larger goal — is the difference between running agents and building with agents.

### Codex's Task-Parallel Model

Codex's orchestration model is implicit. You submit multiple tasks, and they run in parallel. There's no built-in mechanism for task dependencies, result aggregation, or conditional branching between tasks. If you need agent B's output to inform agent C's input, you manage that coordination externally — submitting task B, waiting for its result, then submitting task C with the relevant context.

This model works well for independent, embarrassingly parallel tasks: reviewing 10 different files, generating tests for 5 modules, fixing lint errors across a repository. Each task is self-contained, and you review the combined results when all tasks complete.

For more complex workflows — like a staged code review where a first pass identifies issues, a second pass verifies them, and a third pass proposes fixes — you'd need to manually chain tasks or build external orchestration. Codex doesn't provide a native workflow scripting layer.

### Claude Code's Workflow Engine

Claude Code provides a full orchestration runtime with three core primitives:

**`pipeline(items, ...stages)`** processes each item through a sequence of stages independently. No barrier between stages — item A can be in stage 3 while item B is still in stage 1. This is the default for multi-stage work and minimizes wall-clock time.

**`parallel(thunks)`** runs tasks concurrently with a barrier — it awaits all tasks before returning. Use this when you genuinely need all results together before proceeding (deduplication, cross-item analysis, early-exit decisions).

**`phase(title)`** groups agents under labeled progress sections for visibility.

A concrete example — a multi-dimensional code review that verifies findings adversarially:

```javascript
const DIMENSIONS = [
  { key: 'bugs', prompt: 'Find correctness bugs...' },
  { key: 'perf', prompt: 'Find performance issues...' },
  { key: 'security', prompt: 'Find security vulnerabilities...' }
]

const results = await pipeline(
  DIMENSIONS,
  d => agent(d.prompt, {
    label: `review:${d.key}`,
    phase: 'Review',
    schema: FINDINGS_SCHEMA
  }),
  (review, d) => parallel(
    review.findings.map(f => () =>
      agent(`Adversarially verify: ${f.title}`, {
        label: `verify:${f.file}`,
        phase: 'Verify',
        schema: VERDICT_SCHEMA
      })
    )
  )
)
```

This pipeline spawns three review agents in parallel, and as each one returns findings, immediately spawns verification agents for those findings — without waiting for the other reviewers to finish. The security reviewer's findings get verified while the performance reviewer is still analyzing. This pipelining eliminates the idle time that a barrier-based approach would create.

For teams building automated CI workflows, scheduled audits, or complex refactoring operations, this orchestration layer is a significant advantage. Our coverage of [multi-agent coding patterns](/blog/claude-code-subagents-examples) includes more real-world examples.

## Isolation and Safety: Sandboxes vs Worktrees

When multiple agents modify files simultaneously, isolation prevents conflicts and ensures safety.

### Codex: Container Isolation

Every Codex task runs in its own container. Agents cannot see each other's changes, access each other's processes, or interfere with your local environment. Internet access is disabled by default in the sandbox, preventing data exfiltration or unintended network calls. This is the strongest isolation model — each agent operates in a clean-room environment.

The cost is flexibility. Agents can't share intermediate results through the filesystem. If agent A generates a schema file that agent B needs to reference, you must wait for agent A to complete, extract its output, and pass it as context to agent B. This makes tightly coupled multi-agent workflows more difficult to implement.

### Claude Code: Worktree Isolation

Claude Code offers optional git worktree isolation. When you spawn a subagent with `isolation: 'worktree'`, it runs in a temporary git worktree — a separate working directory linked to your repository. The agent can read and modify files without affecting your main working directory or other agents' worktrees.

```javascript
const result = await agent('Refactor the auth module', {
  isolation: 'worktree',
  label: 'refactor-auth'
})
```

Worktree isolation is opt-in, not default. For read-only agents (search, analysis, review), skipping isolation avoids the ~200-500ms setup cost per agent. For agents that mutate files in parallel, worktrees prevent conflicts. This granular control lets you match isolation level to task requirements.

Without worktree isolation, Claude Code agents share the local filesystem. This enables patterns like streaming intermediate results through temp files or having a supervisor agent monitor progress — but requires careful prompt design to avoid file conflicts.

## Practical Workflows: What You Can Build

### With Codex Subagents

Codex's model excels at **batch processing independent tasks**:

- Submit 10 bug reports as separate tasks, get patches for each
- Generate test files for every module in a directory
- Apply a code style migration across multiple files in parallel
- Review a large PR by assigning different file groups to different agents

Each task runs asynchronously, and you review the results in the Codex interface. For teams using [Codex through VS Code](/blog/codex-vscode), tasks integrate directly into the editor workflow.

The sweet spot is work where each unit is independent and the coordination overhead is minimal. If you're thinking "I wish I could just hand each of these to a separate developer," Codex's model maps naturally.

### With Claude Code Subagents

Claude Code's orchestration engine enables **structured multi-phase workflows**:

- **Staged code review**: Scan for issues → adversarially verify each finding → synthesize a report with only confirmed bugs
- **Codebase migration**: Discover all affected files → transform each in a worktree → run tests per worktree → merge passing changes
- **Research synthesis**: Search multiple documentation sources in parallel → deep-read the most relevant → cross-reference and synthesize
- **Exhaustive auditing**: Loop until no new findings emerge, with deduplication across rounds

The [seven programmable layers](/blog/claude-code-seven-programmable-layers) of Claude Code — from user-level CLAUDE.md files to system-level hooks — mean custom agents inherit project context automatically. A custom `security-reviewer` agent defined in `.claude/agents/` picks up your project's security policies from CLAUDE.md without additional configuration.

For teams that want to encode their engineering processes as reproducible, version-controlled agent workflows, Claude Code's system is significantly more capable. See our deep dive on the [extension stack](/blog/claude-code-extension-stack-skills-hooks-agents-mcp) for the full architecture.

## When to Choose Codex

**Choose OpenAI Codex** for subagent workflows when:

- **Your team prefers GUI-driven configuration.** Codex's ChatGPT and VS Code interfaces let you define and manage agents without writing configuration files or scripts. Non-terminal-native developers can participate in multi-agent workflows through familiar interfaces.

- **Strong isolation is a hard requirement.** If your security posture demands that each agent runs in a fully sandboxed container with no local filesystem access and no internet connectivity, Codex's architecture provides this by default. No configuration needed.

- **Tasks are naturally independent.** When your workload decomposes into self-contained units — fix this bug, write this test, review this file — Codex's parallel task submission is simple and effective. You don't need a workflow engine if there's no workflow to orchestrate.

- **You're already on ChatGPT Pro or Team.** Codex is included in existing OpenAI subscriptions at certain tiers, which can make it more cost-effective than usage-based billing for moderate workloads. The [student program](/blog/codex-for-students) also provides free credits for educational use.

## When to Choose Claude Code

**Choose Claude Code** for subagent workflows when:

- **You need programmable multi-agent orchestration.** If your workflow has stages, dependencies, conditional logic, or result aggregation, Claude Code's `pipeline()` and `parallel()` primitives let you script exactly the coordination pattern you need. No external orchestration layer required.

- **Custom agent types are core to your process.** Claude Code's `.claude/agents/` directory lets you define, version-control, and share specialized agents across your team. Combined with skills and hooks, custom agents integrate into a [complete automation stack](/blog/claude-code-hooks-a-complete-guide-to-automating-your-ai-coding-workflow).

- **You want structured, schema-validated output.** Claude Code's `StructuredOutput` system forces subagents to return typed JSON that matches your schema, with automatic retry on validation failure. This is essential for workflows where agent output feeds into the next stage programmatically.

- **Low latency matters.** Local process spawning is faster than cloud container provisioning. For iterative workflows where you're running agents in tight loops or making real-time decisions based on intermediate results, the local execution model eliminates round-trip overhead.

- **Your workflow needs filesystem coordination.** When agents need to read each other's intermediate results, share context through the filesystem, or operate on the latest state of files being actively modified, Claude Code's shared-filesystem model (with optional worktree isolation) enables patterns that container isolation makes difficult.

## Verdict

**For most developers exploring multi-agent coding workflows, start with the platform you're already using.** If you're a ChatGPT Pro subscriber, Codex gives you parallel task execution with zero setup. If you're already using Claude Code, its subagent system is more powerful and doesn't require learning a new tool.

**For teams building serious multi-agent automation** — CI pipelines, scheduled audits, structured review workflows, or codebase-wide migrations — **Claude Code's Workflow engine and custom agent system are substantially more mature.** The combination of deterministic orchestration, typed inter-agent communication, version-controlled agent definitions, and the broader extension stack (skills, hooks, MCP) creates a programmable platform rather than a task runner.

**Codex's strength is simplicity and isolation.** If you want to hand off independent coding tasks to cloud agents and review the results, Codex does this well with minimal configuration. Its container isolation model is also stronger than Claude Code's worktree approach for security-sensitive environments.

The multi-agent coding space is evolving rapidly — both platforms are shipping updates monthly. What matters most is whether you need an orchestration engine (Claude Code) or a task parallelism layer (Codex). That architectural difference will determine which platform fits your workflows. For ongoing coverage of both platforms, check our [analysis of agent harnesses](/blog/agent-harnesses-2026) and the [Claude Code complete guide](/blog/claude-code-complete-guide).

## Frequently Asked Questions

### How do you create a custom agent in Codex?
Custom agents in Codex are configured through the ChatGPT interface or API by defining a system prompt with role-specific instructions, tool permissions, and repository context. You set up the agent's behavioral constraints and focus areas, then submit tasks that route to that agent configuration. The process is GUI-driven rather than file-based.

### Can Codex subagents communicate with each other during execution?
No. Each Codex subagent runs in an isolated container with no direct communication channel to other agents. If you need one agent's output to inform another's input, you must wait for the first task to complete, extract the results, and pass them as context when submitting the second task. This is a fundamental constraint of the container isolation model.

### How many subagents can Claude Code run simultaneously?
Claude Code caps concurrent subagent execution at `min(16, cpu_cores - 2)` per workflow. Excess agent calls queue automatically and run as slots free up. You can pass hundreds of items to `pipeline()` or `parallel()` — they all complete, but only the capped number run at any moment. The total agent count per workflow lifetime is capped at 1,000.

### Is Codex or Claude Code better for code review workflows?
For simple "review this file" tasks run in parallel, Codex works fine — submit each file as a separate task. For structured review workflows with adversarial verification, cross-file analysis, or multi-dimensional review (bugs, performance, security), Claude Code's pipeline orchestration is significantly more capable. See our coverage of [Claude Code's review agents](/blog/claude-code-review-agents) for detailed examples.

### Do custom agents in Claude Code persist across sessions?
Yes. Custom agents defined in `.claude/agents/` are markdown files checked into your repository. They persist across sessions, are available to any team member who clones the repo, and can be reviewed and updated through normal pull request workflows. This makes agent definitions a first-class part of your codebase, not ephemeral configuration.

---

*Want more AI insights? [Subscribe to LoreAI](/subscribe) for daily briefings.*