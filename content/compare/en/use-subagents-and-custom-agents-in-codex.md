---
title: "Codex Subagents vs Claude Code Subagents: Multi-Agent Coding Compared"
slug: use-subagents-and-custom-agents-in-codex
description: "Compare subagents and custom agents in OpenAI Codex vs Claude Code. Architecture, customization, and practical multi-agent coding workflows."
item_a: OpenAI Codex
item_b: Claude Code
category: tools
related_glossary: [agent-sdk, agentic-coding]
related_blog: [claude-code-subagents-examples, claude-code-agent-teams, codex-complete-guide, con-u-pour-des-workflows-multi-agents, claude-code-extension-stack-skills-hooks-agents-mcp]
related_compare: []
related_topics: [codex]
lang: en
---

# Codex Subagents vs Claude Code Subagents: Multi-Agent Coding Compared

**TL;DR:** Both OpenAI Codex and Claude Code support multi-agent workflows, but the architectures differ sharply. **Codex runs subagents as isolated cloud tasks** — fire-and-forget sandboxed environments suited for parallelizing independent work items across a repository. **Claude Code runs subagents locally as typed specialist agents** — Explore, Plan, code-review, and general-purpose agents that share your terminal session and can be composed into custom workflows. Choose Codex subagents for batch-style cloud delegation; choose Claude Code subagents for interactive, fine-grained orchestration during a live coding session.

## Overview: OpenAI Codex Subagents

OpenAI **[Codex](/blog/codex-complete-guide)** is a cloud-based coding agent that executes tasks in sandboxed environments. Each Codex task runs in its own isolated container with a snapshot of your repository, meaning it cannot interfere with other tasks or your local state. This architecture naturally extends to subagents: when Codex decomposes a large task, each subtask becomes an independent cloud execution with its own sandbox, file system, and tool access.

Codex's subagent model is fundamentally **task-oriented**. You describe what you need — "refactor the auth module," "write tests for the payment service," "update all deprecated API calls" — and Codex can split that into parallel subtasks that each run in their own container. The results are collected, reviewed, and merged. This makes Codex subagents well-suited for batch processing: large-scale refactoring, codebase-wide migrations, or generating tests across many modules simultaneously.

Custom agents in Codex are configured through task descriptions and system instructions rather than through a file-based skill system. You shape agent behavior by providing detailed prompts at task creation time, and the agent operates within the constraints of its sandboxed environment.

## Overview: Claude Code Subagents

**Claude Code** takes a different approach to subagents. Rather than cloud sandboxes, Claude Code spawns subagents as specialized processes within your local terminal session. Each subagent has a defined type — **Explore** for fast read-only codebase search, **Plan** for architecture design, **code-review** for PR analysis, and **general-purpose** for multi-step tasks — and each type comes with specific tools and capabilities.

The key differentiator is **composability**. Claude Code subagents can be launched in parallel or sequentially, in the foreground (blocking until results return) or background (notifying when complete). They can operate on isolated git worktrees for safe experimentation, or share the main working tree for collaborative editing. The [Agent Teams](/blog/claude-code-agent-teams) feature enables multiple subagents to work simultaneously on different parts of a codebase, coordinated by a parent agent that synthesizes their results.

Custom agents in Claude Code are defined through [SKILL.md files](/blog/claude-code-extension-stack-skills-hooks-agents-mcp) and CLAUDE.md project configuration. These files travel with your repository, meaning any team member who opens Claude Code gets the same custom agent behaviors without re-prompting.

## Feature Comparison

| Feature | OpenAI Codex | Claude Code | Winner |
|---------|-------------|-------------|--------|
| **Execution environment** | Cloud sandboxes (isolated containers) | Local terminal (shared or worktree-isolated) | Depends on use case |
| **Subagent types** | Generic task executors | Typed specialists (Explore, Plan, Review, General) | Claude Code |
| **Parallel execution** | Native — each subtask is a separate container | Native — foreground, background, or concurrent | Tie |
| **Custom agent definition** | Task-level prompts and system instructions | File-based SKILL.md + CLAUDE.md (version-controlled) | Claude Code |
| **Isolation model** | Full sandbox per task (filesystem, network) | Git worktree isolation or shared workspace | Codex |
| **Async operation** | Built-in — tasks run while you're away | Background agents with notification on completion | Codex |
| **Cost model** | Per-task cloud compute + token usage | Token usage only (local compute) | Claude Code |
| **Repository access** | Snapshot at task creation time | Live access to current working tree | Claude Code |
| **Max parallel agents** | Platform-limited (varies by plan) | Limited by context and system resources | Tie |
| **Team consistency** | Re-prompt per session or use saved prompts | SKILL.md files in repo, auto-loaded | Claude Code |

## Execution Architecture: Detailed Analysis

The most fundamental difference between Codex and Claude Code subagents is where and how they run. This architectural choice cascades into every other capability.

**Codex's cloud sandbox model** means each subagent operates on a frozen snapshot of your repository. When you create a Codex task, the platform clones your repo into an isolated container. If you split a task into three subtasks, you get three independent containers, each with their own copy of the code. This provides strong isolation — one subagent cannot corrupt another's work — but it also means subagents cannot see each other's changes in real time. Results must be collected and merged after all subtasks complete.

This model excels for **embarrassingly parallel** work: generating tests for 20 modules, applying a migration pattern across 50 files, or running security audits on independent services. Each subtask is self-contained, and the merge step is straightforward. For teams that want to fire off work and come back to results hours later, Codex's async cloud execution is a natural fit.

**Claude Code's local agent model** keeps everything in your terminal session. When you spawn an Explore agent and a Plan agent in parallel, both operate against your actual working directory. If one agent makes a change, the other can see it (unless you use worktree isolation). This enables **conversational multi-agent workflows** — launch a research agent to find all usages of a deprecated API, get the results, then launch a refactoring agent with that context. The parent agent synthesizes findings and coordinates next steps.

The tradeoff is clear: Codex gives you stronger isolation and true async execution at the cost of live collaboration between agents. Claude Code gives you real-time coordination and iterative workflows at the cost of running on your local machine. For practical examples of Claude Code's approach, see our [subagent examples guide](/blog/claude-code-subagents-examples).

## Custom Agent Configuration: Detailed Analysis

How you define and customize agent behavior differs substantially between the two platforms, and this has real implications for team workflows and consistency.

**Codex custom agents** are configured primarily through natural language instructions provided at task creation time. You write a system prompt describing the agent's role, constraints, and expected behavior, and attach it to the task. Codex also supports saved configurations that can be reused across tasks. The advantage is simplicity — you describe what you want in plain English, and the agent adapts. The limitation is that these configurations live outside your codebase. Team members need to share prompts through external channels, and there's no built-in versioning tied to your repository's evolution.

**Claude Code custom agents** use a file-based configuration system that integrates directly with your repository. The [extension stack](/blog/claude-code-extension-stack-skills-hooks-agents-mcp) consists of several layers:

- **CLAUDE.md**: Project-level instructions loaded automatically when Claude Code opens your repo. Defines coding standards, architecture constraints, and workflow rules.
- **SKILL.md files**: Specialized instruction sets stored in a `skills/` directory. Each skill defines how Claude Code (and its subagents) should approach a specific task type — writing tests, generating content, reviewing PRs, or handling deployments.
- **Agent type selection**: When spawning a subagent, you specify a type (`Explore`, `Plan`, `code-review`, `general-purpose`), and the subagent inherits the appropriate tool set and behavioral constraints for that role.
- **Hooks**: Deterministic shell commands that fire before or after agent actions — linting on save, tests before commit, notifications on completion.

The SKILL.md approach means custom agent behavior is **version-controlled alongside your code**. When you update your testing strategy, you update the testing skill file, and every team member's subagents immediately follow the new pattern. This eliminates the prompt drift problem where different team members use slightly different instructions and get inconsistent results. For a deeper look at how these layers compose, see our [seven programmable layers analysis](/blog/claude-code-seven-programmable-layers).

## Subagent Orchestration Patterns: Detailed Analysis

Both platforms support parallel agent execution, but the orchestration patterns they enable differ in important ways.

**Codex orchestration** follows a **map-reduce pattern**. You define a set of tasks, Codex distributes them across sandboxed environments, each runs independently, and results are collected. This works well for homogeneous tasks — apply the same transformation to many files, run the same analysis on many modules. The platform handles scheduling and resource allocation. You review the aggregated results and approve or reject changes.

For heterogeneous workflows — where step 2 depends on step 1's output — Codex requires you to chain tasks sequentially. You submit task A, wait for results, then submit task B with task A's output as context. This is functional but introduces latency between steps and requires manual (or scripted) coordination.

**Claude Code orchestration** supports both **parallel independent** and **sequential dependent** patterns natively within a single session. A parent agent can:

1. Launch three Explore agents in parallel to search for different patterns across the codebase
2. Wait for all three to return results
3. Synthesize the findings
4. Launch a single general-purpose agent to implement changes based on the combined analysis
5. Run a code-review agent on the resulting diff

This entire workflow happens in one interactive session. The parent agent maintains context across all steps, which means it can make judgment calls about how to combine results or handle conflicts. For large-scale parallel work, Claude Code's [agent teams](/blog/claude-code-agent-teams) feature formalizes this pattern with structured coordination between multiple subagents.

The worktree isolation option adds another dimension: you can launch a subagent in a separate git worktree, let it experiment freely, and only merge its changes if the results pass review. This gives you sandbox-like isolation without leaving your local environment.

## When to Choose Codex Subagents

**Batch processing at scale.** If you need to apply the same operation across dozens or hundreds of files — migrating API versions, adding type annotations, generating boilerplate tests — Codex's cloud sandbox model handles this efficiently. Each subtask runs independently without competing for local resources.

**Async workflows.** Codex shines when you want to fire off work and come back later. Submit a complex refactoring task before lunch, review the results after. The cloud execution model means your laptop can be closed while work continues. This is particularly valuable for long-running tasks like codebase-wide dependency upgrades or comprehensive test generation.

**Strong isolation requirements.** If your workflow demands that each agent cannot see or affect other agents' work — perhaps for security audits where you want independent assessments — Codex's container isolation guarantees this by architecture. There's no risk of one subagent accidentally reading another's intermediate state.

**Teams already in the OpenAI ecosystem.** If your organization uses ChatGPT Enterprise and has existing OpenAI API integrations, Codex subagents fit naturally into that workflow. The [VS Code extension](/blog/codex-vscode) provides a familiar interface for developers who prefer IDE-based interactions.

## When to Choose Claude Code Subagents

**Interactive, iterative development.** If your workflow involves exploring code, making decisions based on what you find, and then implementing changes — all in one session — Claude Code's typed subagents are purpose-built for this. The Explore agent finds what you need, the Plan agent designs the approach, and the general-purpose agent implements it, all coordinated by the parent session.

**Team consistency through version-controlled skills.** If you need every developer to follow the same patterns — coding standards, test strategies, review checklists — Claude Code's [SKILL.md system](/blog/5-claude-code-skills-i-use-every-single-day) ensures subagents behave consistently across the team. Skills live in your repo and evolve with your codebase, eliminating prompt drift.

**Complex multi-step workflows.** When later steps depend on earlier results and require judgment calls about how to proceed, Claude Code's parent-child agent coordination handles this naturally. The parent agent maintains full context and can adapt the plan based on what subagents discover. See our [multi-agent workflow analysis](/blog/con-u-pour-des-workflows-multi-agents) for practical patterns.

**Cost-sensitive workloads.** Claude Code subagents run on your local machine, so you only pay for API token usage — no cloud compute costs. For frequent, small-scale subagent usage (quick searches, file exploration, targeted reviews), this is significantly cheaper than spinning up cloud sandboxes.

**Customization depth.** If you need fine-grained control over agent behavior — specific tool access per agent type, hooks that fire on agent actions, project-aware context loading — Claude Code's [extension stack](/blog/claude-code-extension-stack-skills-hooks-agents-mcp) provides more configuration surface area than Codex's prompt-based customization.

## Practical Workflow Example

To make the comparison concrete, here's how a typical multi-agent task — "update all deprecated API calls and verify nothing breaks" — plays out in each system.

**In Codex:** You create a task describing the migration. Codex analyzes the codebase, identifies deprecated calls, and spawns subtasks for each module or service. Each subtask runs in its own sandbox: it updates the deprecated calls, runs the module's tests, and reports results. You review a dashboard of completed subtasks, approve the changes, and Codex creates a PR with all modifications. Total elapsed time might be 30-60 minutes, most of it unattended.

**In Claude Code:** You start a session and spawn an Explore agent to find all deprecated API calls. It returns a categorized list in seconds. You review the findings, then spawn parallel general-purpose agents — one per service boundary — each in its own git worktree. Each agent updates its assigned files and runs relevant tests. The parent agent collects results, identifies any conflicts or shared dependencies, and handles the merge. You review the combined diff interactively, ask follow-up questions, and commit. Total elapsed time might be 15-30 minutes, mostly interactive.

The Codex approach optimizes for **developer time** (you can walk away). The Claude Code approach optimizes for **total time** and **control** (you stay engaged but finish faster with more oversight).

## Verdict

**For batch, async, and large-scale parallel work, choose Codex subagents.** The cloud sandbox model handles embarrassingly parallel tasks efficiently, and the async execution means you're not blocked while agents work. If your primary use case is "apply X across the entire codebase and come back to review," Codex is the better fit.

**For interactive, multi-step, and team-standardized workflows, choose Claude Code subagents.** The typed agent system, SKILL.md customization, and real-time orchestration make it superior for workflows where steps depend on each other and you want fine-grained control. If your team values consistency through version-controlled agent behavior, Claude Code's extension stack is unmatched.

Many teams will benefit from using both: Codex for overnight batch jobs and large migrations, Claude Code for daily interactive development with subagent-assisted research, planning, and implementation. For a deeper dive into [agentic coding](/glossary/agentic-coding) patterns and how these tools fit into the broader landscape, see our coverage of [agent harness design](/blog/agent-harnesses-2026).

## Frequently Asked Questions

### Can Codex subagents communicate with each other during execution?

No. Each Codex subagent runs in an isolated sandbox with its own filesystem snapshot. Subagents cannot see each other's changes in real time. Results are collected and merged only after all subtasks complete, which provides strong isolation but prevents real-time collaboration between agents.

### How many subagents can Claude Code run in parallel?

Claude Code can launch multiple subagents concurrently using parallel tool calls. The practical limit depends on your system resources and context window size rather than a hard platform cap. For most workflows, 3-5 parallel agents is effective; beyond that, the parent agent's ability to synthesize results becomes the bottleneck.

### Do I need to pay extra for subagent usage in either tool?

Codex charges for cloud compute time per sandbox plus token usage, so subagents multiply your costs proportionally to the number of parallel tasks. Claude Code subagents run locally, so you only pay for the additional API tokens each subagent consumes — no compute surcharge. For frequent, lightweight subagent usage, Claude Code is more cost-effective.

### Can I define custom agent types in Claude Code beyond the built-in ones?

Claude Code's built-in agent types (Explore, Plan, code-review, general-purpose) cover most workflows, but you customize behavior extensively through SKILL.md files and CLAUDE.md instructions. Each subagent inherits project-level configuration automatically. You can also configure specific prompts and constraints when spawning any agent, effectively creating task-specific custom agents within the existing type system.

### Which tool is better for a solo developer vs. a team?

Solo developers often prefer Claude Code subagents because the interactive workflow fits a single-person iteration loop — explore, decide, implement, review, all in one session. Teams benefit more from Codex's async model for parallelizing independent work streams, but Claude Code's version-controlled SKILL.md system provides stronger team consistency. The best choice depends on whether your bottleneck is coordination (favor Codex) or consistency (favor Claude Code).

---

*Want more AI insights? [Subscribe to LoreAI](/subscribe) for daily briefings.*