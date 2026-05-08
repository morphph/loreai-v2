---
title: "Subagents and Custom Agents in Codex vs Claude Code: Multi-Agent AI Coding Compared"
slug: use-subagents-and-custom-agents-in-codex
description: "Compare subagents and custom agents in OpenAI Codex vs Claude Code's agent teams for multi-agent AI coding workflows."
item_a: OpenAI Codex
item_b: Claude Code
category: tools
related_glossary: [agent-sdk, agentic-coding]
related_blog: [claude-code-subagents-examples, codex-complete-guide, claude-code-agent-teams]
related_compare: []
related_topics: [codex]
lang: en
---

# Subagents and Custom Agents in Codex vs Claude Code: Multi-Agent AI Coding Compared

**TL;DR:** Both OpenAI Codex and Claude Code support multi-agent workflows, but they take fundamentally different architectural approaches. **Codex runs each agent task as an isolated cloud container** with a full sandboxed environment, making it well-suited for parallelizing independent coding tasks across a repository. **Claude Code spawns subagents as lightweight in-process agents** that share your local runtime, giving you tighter integration with your development environment and faster feedback loops. Choose Codex when you want fire-and-forget cloud tasks; choose Claude Code when you need agents that collaborate in real time within a single session.

## Overview: OpenAI Codex

**OpenAI Codex** is a cloud-based [agentic coding](/glossary/agentic-coding) platform that executes coding tasks in sandboxed containerized environments. Each task you submit to Codex runs independently — it gets its own isolated container with a copy of your repository, installs dependencies, and executes the work without affecting your local machine. This architecture naturally extends to multi-agent patterns: you can submit multiple tasks simultaneously, and each one runs as its own agent in parallel.

Codex positions itself as an asynchronous coding assistant. You describe what you need — "add input validation to the user registration endpoint," "write tests for the payment module" — and Codex spins up an environment, does the work, and returns a pull request or diff. The [complete guide to Codex](/blog/codex-complete-guide) covers the full platform architecture. Codex is available through ChatGPT Pro and Team plans, with a [VS Code extension](/blog/codex-vscode) that integrates directly into the IDE.

The subagent and custom agent capabilities in Codex stem from this container-first design. Rather than a single agent orchestrating sub-tasks internally, Codex's model encourages spinning up multiple independent tasks — each effectively a subagent — that work in parallel on different parts of your codebase.

## Overview: Claude Code

**Claude Code** is Anthropic's terminal-based AI coding agent that runs locally in your development environment. Unlike Codex's cloud container model, Claude Code operates directly in your shell — reading files, running commands, editing code, and committing changes in your actual working directory. Its multi-agent system, called [agent teams](/blog/claude-code-agent-teams), spawns subagents as parallel workers within the same session.

Claude Code's subagents are lightweight by design. When you give Claude Code a complex task, it can spawn specialized subagents — each with a defined role and toolset — that work on different aspects of the problem simultaneously. These subagents share the same filesystem and can coordinate through the parent agent. The result is a tightly coupled multi-agent system where agents collaborate rather than working in isolation.

The [Agent SDK](/glossary/agent-sdk) underpinning Claude Code's architecture provides structured primitives for spawning, managing, and collecting results from subagents. Custom agents can be defined through configuration files that specify the agent's role, available tools, and behavioral constraints. This makes Claude Code's multi-agent system highly programmable — teams can encode their specific workflows into reusable agent definitions.

## Feature Comparison

| Feature | OpenAI Codex | Claude Code | Winner |
|---------|-------------|-------------|--------|
| **Agent execution model** | Cloud containers (isolated) | Local process (shared runtime) | Depends on use case |
| **Parallelism** | Multiple independent containers | In-process subagent spawning | Codex for isolation; Claude Code for coordination |
| **Environment access** | Sandboxed copy of repo | Full local environment | Claude Code |
| **Custom agent definitions** | Task-level instructions per submission | SKILL.md files + agent type configs | Claude Code |
| **Agent communication** | No inter-task communication | Parent-child coordination | Claude Code |
| **Setup overhead** | Cloud-managed, zero local setup | Runs in your terminal | Codex |
| **Result format** | Pull request / diff | Direct file edits + commits | Tie |
| **Offline support** | Requires internet | Requires internet (API calls) | Tie |
| **Cost model** | Included in Pro/Team plan | Usage-based API billing | Codex for predictable costs |
| **Platform support** | Web + VS Code | Terminal (macOS, Linux) | Codex for accessibility |

## Subagent Architecture: Detailed Analysis

**Codex and Claude Code define "subagent" differently, and the distinction shapes every downstream workflow decision.** In Codex, a subagent is essentially an independent task submission — a separate container that runs in parallel with no awareness of other running tasks. In Claude Code, a subagent is a child process spawned by a parent agent, with explicit coordination and shared context.

### How Codex Subagents Work

Codex's subagent model follows a task-queue pattern. When you submit multiple tasks to Codex — either through the web interface, the API, or the VS Code extension — each task spins up its own containerized environment. The container gets a fresh clone of your repository, installs the dependencies defined in your project, and executes the task using OpenAI's models.

This isolation has clear advantages for safety and reproducibility. Each subagent cannot interfere with another's work. If one task fails or produces bad output, it does not corrupt the environment for other tasks. The tradeoff is that subagents cannot collaborate. If Task A discovers that a function signature needs to change and Task B depends on that function, Codex cannot propagate that insight between tasks — you will get conflicting diffs that require manual reconciliation.

In practice, Codex subagents work best for embarrassingly parallel work: writing tests for independent modules, adding documentation across files, applying a consistent code style change, or scaffolding multiple independent features. The [Codex for open source](/blog/codex-for-open-source) initiative demonstrates this pattern — maintainers submit batches of independent tasks and review the resulting pull requests.

### How Claude Code Subagents Work

Claude Code's subagent model is parent-orchestrated. When Claude Code encounters a task that benefits from parallelism, it spawns subagents using the Agent tool — each subagent gets a description, a prompt, and optionally a specific agent type (like `Explore` for read-only search, or `codex-rescue` for debugging). The parent agent decides when to spawn subagents, what context to give them, and how to synthesize their results.

The key architectural difference is that Claude Code subagents share the local filesystem. A subagent can read files that another subagent just modified. The parent agent can wait for one subagent's results before spawning another. This enables multi-step workflows where subagent B's work depends on subagent A's findings — something impossible in Codex's isolated container model.

Claude Code also supports different isolation modes. The `worktree` isolation mode creates a temporary git worktree so the subagent works on an isolated copy of the repo — closer to Codex's container model. Without isolation, subagents operate directly on the working directory. This flexibility lets you choose the right isolation level per task.

For practical examples of Claude Code's subagent patterns — including parallel research, coordinated refactoring, and agent-driven code review — see our [Claude Code subagent examples guide](/blog/claude-code-subagents-examples).

## Custom Agent Definitions: Detailed Analysis

**Custom agents let you encode specialized workflows into reusable configurations, but the two platforms take radically different approaches to customization.** Codex customizes at the task-instruction level; Claude Code customizes at the agent-definition level with persistent configuration files.

### Custom Agents in Codex

Codex's customization model centers on task-level instructions. When you submit a task, you provide natural language instructions that guide how the agent approaches the work. You can specify coding standards, preferred libraries, testing requirements, and architectural constraints in the task description. Codex also reads configuration files in your repository — like `AGENTS.md` or setup scripts — to understand project-specific conventions.

The `codex.md` file (analogous to Claude Code's `CLAUDE.md`) provides persistent project-level instructions that apply to every task submitted against that repository. This is where teams define their coding standards, preferred patterns, and constraints that every Codex agent should follow.

For more advanced customization, Codex supports custom setup commands that run when the container initializes. You can specify dependency installation steps, environment variable configuration, and pre-task scripts that prepare the environment. This is particularly useful for projects with complex build systems or non-standard toolchains.

However, Codex does not currently support defining distinct agent "types" or "roles" with different tool access, different model configurations, or different behavioral profiles. Every Codex task uses the same underlying agent architecture with the same capabilities — differentiation comes purely from the natural language instructions you provide.

### Custom Agents in Claude Code

Claude Code's custom agent system is significantly more granular. The platform supports multiple layers of agent customization, each serving a different purpose.

**SKILL.md files** define task-specific instruction sets that can be loaded on demand. A skill file might encode how to write tests for your project, how to generate API documentation, or how to review security-sensitive code. Skills are reusable across sessions and team members — they travel with your repository. Our guides on [writing effective skills](/blog/9-principles-writing-claude-code-skills) and [practical skill usage](/blog/5-claude-code-skills-i-use-every-single-day) cover these patterns in depth.

**Agent type definitions** go further by specifying the tools available to a subagent. An `Explore` agent has read-only access — it can search files and read code but cannot edit anything. A `Plan` agent can analyze and design but cannot write code. A `codex-rescue` agent has full access to a sandboxed Bash environment for investigation. These type constraints prevent subagents from exceeding their intended scope — a research agent cannot accidentally modify production code.

**Hooks** add a deterministic automation layer. Claude Code [hooks](/blog/claude-code-hooks-a-complete-guide-to-automating-your-ai-coding-workflow) are shell commands that execute in response to agent events — before a tool runs, after a tool runs, or when certain conditions are met. Hooks let you enforce policies (block commits without tests), automate workflows (run linters after every edit), and extend agent capabilities without modifying the agent itself.

This layered customization means Claude Code's custom agents can be precisely scoped for specific workflows. A "security review" agent might have read-only file access, access to a vulnerability scanner via hooks, and a SKILL.md that encodes your organization's security review checklist. A "feature implementation" agent might have full file access, git integration, and a skill file that enforces your team's coding standards.

## Workflow Integration: How Each Platform Fits Development Processes

**The choice between Codex and Claude Code subagents often comes down to where you want the work to happen — in the cloud or on your machine.** This affects everything from feedback speed to how you review and merge results.

### Codex Workflow: Asynchronous Task Submission

Codex fits naturally into an asynchronous development workflow. You submit tasks, context-switch to other work, and return to review the results. This mirrors how teams already use CI/CD pipelines — kick off a job and check back later.

A typical multi-agent Codex workflow looks like:

1. Identify several independent tasks across your codebase
2. Submit each as a separate Codex task with clear instructions
3. Continue working on other things while Codex processes the tasks
4. Review the generated pull requests or diffs
5. Merge, request changes, or iterate

This workflow excels when you have a backlog of well-defined, independent tasks. [Codex for students](/blog/codex-for-students) demonstrates this pattern at scale — students submit multiple assignment components as parallel tasks and review the results.

The asynchronous model also means Codex works well for teams across time zones. A developer in Singapore can submit tasks at the end of their day and have results ready for review the next morning.

### Claude Code Workflow: Interactive Agent Orchestration

Claude Code's subagent workflow is synchronous and interactive. You work alongside the agents in real time, providing guidance, approving actions, and steering the work as it progresses.

A typical multi-agent Claude Code workflow looks like:

1. Describe a complex task to Claude Code
2. Claude Code spawns subagents for parallel research or implementation
3. Subagents report findings back to the parent agent
4. The parent agent synthesizes results and proposes next steps
5. You approve, redirect, or refine the approach
6. Claude Code executes the final implementation with your oversight

This workflow excels for complex, interconnected tasks where the path forward is not fully clear upfront. When building a new feature that touches authentication, database schema, API routes, and frontend components, Claude Code's coordinated subagents can explore the codebase, identify dependencies, and implement changes that account for cross-cutting concerns.

The interactive model also supports a debugging pattern where Claude Code spawns an `Explore` subagent to investigate a bug in one area while the parent agent continues analyzing another area. Results flow back in real time, and the parent agent can adjust its approach based on what the subagents discover.

## Practical Comparison: Running the Same Task on Both Platforms

To illustrate the difference concretely, consider this task: "Add input validation to all API endpoints in the project."

### On Codex

You would identify each API endpoint, then submit separate tasks:

- Task 1: "Add input validation to POST /api/users"
- Task 2: "Add input validation to PUT /api/users/:id"
- Task 3: "Add input validation to POST /api/orders"

Each task runs in its own container, generates its own diff, and produces its own pull request. You review and merge each independently. If the validation approach needs to be consistent (shared validation library, common error format), you need to specify that in every task's instructions — the agents cannot coordinate on a shared approach.

### On Claude Code

You would give a single high-level instruction:

- "Add input validation to all API endpoints. Use zod schemas. Return consistent error responses."

Claude Code might then:
1. Spawn an Explore subagent to find all API endpoints
2. Spawn a second subagent to check existing validation patterns
3. Synthesize findings and propose a validation approach
4. Implement validation across all endpoints with a consistent pattern
5. Run tests and commit

The result is a single, coordinated set of changes rather than independent diffs that might conflict.

## Error Handling and Recovery

**How each platform handles agent failures has significant implications for production workflows.** A subagent that crashes, produces incorrect output, or exceeds resource limits needs graceful recovery.

### Codex Error Handling

Codex's container isolation provides natural error boundaries. If a task fails — the container crashes, tests do not pass, or the agent produces invalid output — that failure is contained. Other running tasks are unaffected. You can simply re-submit the failed task with adjusted instructions.

Codex also provides visibility into what went wrong. Each task's execution log shows the commands run, files modified, and test results. You can review why a task failed and adjust your instructions accordingly.

The limitation is that Codex has no automatic retry or self-correction mechanism across tasks. If Task 3 fails because it depends on changes from Task 1 that were not anticipated, you need to manually sequence the work — submit Task 1 first, wait for its result, then submit Task 3 with the updated context.

### Claude Code Error Handling

Claude Code's parent-child agent model enables more sophisticated error recovery. If a subagent fails or produces unexpected results, the parent agent can:

- Retry the subagent with different instructions
- Spawn a different type of subagent to investigate the failure
- Adjust its overall approach based on what the failure revealed
- Fall back to handling the task directly without subagents

The [Claude Code extension stack](/blog/claude-code-extension-stack-skills-hooks-agents-mcp) enables hooks that can intercept failures and trigger automated recovery steps. For example, a hook could automatically run a linter after every file edit, catching formatting issues before they compound across subagent work.

The tradeoff is complexity. Claude Code's error handling is more powerful but also more opaque — when a parent agent decides to retry a subagent or change its approach, the reasoning is embedded in the conversation context rather than a clear execution log.

## When to Choose Codex

Choose OpenAI Codex for subagent and custom agent workflows when:

- **Your tasks are independent.** If each task can run without knowledge of other tasks' results, Codex's parallel container model is ideal. Batch processing of independent changes — adding tests, updating documentation, applying formatting fixes — runs efficiently in parallel.

- **You prefer asynchronous workflows.** If you want to submit work and return to review results later, Codex fits naturally. This works well for teams that treat AI-generated code like pull requests from a junior developer — review, request changes, merge.

- **You want predictable costs.** Codex is included in ChatGPT Pro and Team subscriptions, so you know your monthly spend upfront. For teams running many agent tasks, this can be more cost-effective than Claude Code's usage-based API billing.

- **Your team uses VS Code.** The [Codex VS Code extension](/blog/codex-vscode) integrates task submission directly into the IDE, reducing context-switching overhead.

## When to Choose Claude Code

Choose Claude Code for subagent and custom agent workflows when:

- **Your tasks are interconnected.** When changing a database schema requires updating API routes, service layers, and tests in coordination, Claude Code's parent-orchestrated subagents can propagate context between agents and maintain consistency across changes.

- **You need fine-grained agent customization.** Claude Code's layered system — SKILL.md files, agent types with tool constraints, hooks for deterministic automation — provides significantly more control over agent behavior than Codex's task-instruction model. Teams with complex coding standards or compliance requirements benefit from this precision.

- **You want interactive control.** If you prefer to steer agent work in real time — approving changes, redirecting approaches, providing context as questions arise — Claude Code's synchronous model keeps you in the loop. This is especially valuable for complex refactoring where the right approach depends on discoveries made during the work.

- **You work in the terminal.** Claude Code is built for developers who live in the command line. If your workflow already centers on terminal-based tools, Claude Code's subagent system integrates seamlessly without switching to a web interface or IDE.

## Verdict

**For independent, parallelizable tasks, Codex's cloud container model is simpler and more cost-effective.** Submit your tasks, let them run in isolated environments, and review the pull requests when they are ready. The fire-and-forget pattern works well for teams with large backlogs of well-defined work.

**For complex, coordinated multi-agent workflows, Claude Code's subagent system is more capable.** The ability to spawn specialized agents with different tool access, coordinate between parent and child agents, and customize behavior through SKILL.md files and hooks gives you significantly more control. If your tasks involve cross-cutting changes where agents need to share context and coordinate their work, Claude Code is the stronger choice.

Many teams will use both: Codex for batch processing independent tasks across a codebase, and Claude Code for interactive sessions tackling complex, interconnected problems. The tools are complementary rather than competitive when used for their respective strengths. For a deeper look at multi-agent coding patterns, see our [guide to Claude Code subagent examples](/blog/claude-code-subagents-examples) and the [complete Codex guide](/blog/codex-complete-guide).

## Frequently Asked Questions

### Can Codex subagents communicate with each other during execution?

No. Each Codex task runs in its own isolated container with no inter-task communication channel. If Task B depends on Task A's output, you must wait for Task A to complete, review its changes, and then submit Task B with the updated context. Claude Code subagents can coordinate through their parent agent within the same session.

### How do I define a custom agent in Claude Code?

Custom agents in Claude Code are defined through a combination of SKILL.md files for task-specific instructions, agent type parameters that control tool access (read-only, full access, sandboxed), and hooks for deterministic automation. You specify the agent type when spawning a subagent, and SKILL.md files are loaded into the agent's context to guide its behavior.

### Is Codex or Claude Code cheaper for running multiple agent tasks?

Codex is included in ChatGPT Pro ($200/month) and Team plans, making costs predictable regardless of how many tasks you run. Claude Code uses per-token API billing, so costs scale with usage. For high-volume workflows with many parallel tasks, Codex's flat-rate model is typically more cost-effective. For occasional complex sessions, Claude Code's pay-per-use model may be cheaper.

### Can I use both Codex and Claude Code on the same project?

Yes. Many teams use Codex for batch tasks — generating tests, updating documentation, applying lint fixes — and Claude Code for interactive sessions requiring coordination and real-time decision-making. Both tools can work against the same repository without conflict, as long as you manage the resulting branches and pull requests through your normal git workflow.

### Do Codex custom agents persist across sessions?

Codex reads project-level configuration files (like setup scripts and instruction files in your repository) on every task submission, so your customizations persist as long as they are committed to the repo. Claude Code's SKILL.md files and hooks similarly persist in the repository, but Claude Code also maintains session-level memory that can carry context across interactions within a session.

---

*Want more AI insights? [Subscribe to LoreAI](/subscribe) for daily briefings.*