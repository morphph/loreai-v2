---
title: "Codex Subagents vs Claude Code Subagents: Multi-Agent Coding Compared"
slug: use-subagents-and-custom-agents-in-codex
description: "Compare how subagents and custom agents work in OpenAI Codex vs Claude Code. Architecture, configuration, and workflow differences explained."
item_a: OpenAI Codex
item_b: Claude Code
category: tools
related_glossary: [agent-sdk, agentic-coding]
related_blog: [claude-code-subagents-examples, codex-complete-guide, claude-code-agent-teams]
related_compare: []
related_topics: [codex]
lang: en
---

# Codex Subagents vs Claude Code Subagents: Multi-Agent Coding Compared

**TL;DR:** Both OpenAI Codex and Claude Code support multi-agent workflows where a primary agent delegates tasks to specialized subagents. **Claude Code wins on local configurability** — you define custom agents via CLAUDE.md files and skill definitions that ship with your repo. **Codex wins on cloud isolation** — each agent runs in a sandboxed container with no local system access. Choose based on whether you need deep local integration or secure cloud-first execution.

## Overview: OpenAI Codex Subagents

**OpenAI Codex** is a cloud-based [agentic coding](/glossary/agentic-coding) platform that executes tasks in sandboxed containers. Subagents in Codex operate as independent task units spawned by the primary coding agent to handle parallel workstreams — running tests in one container while refactoring in another, or researching documentation while generating implementation code.

Codex's agent model is container-native: each subagent gets its own isolated environment with a full filesystem snapshot of your repository. This means subagents cannot interfere with each other's work, and failed tasks don't corrupt the primary workspace. The tradeoff is latency — spinning up containers and syncing state adds overhead compared to local execution.

Custom agents in Codex are configured through the platform's task system. You define agent behavior through detailed prompts and environment specifications, but the customization layer is thinner than Claude Code's file-based system. Codex agents are best understood as cloud workers you dispatch, not local collaborators you configure. For a full breakdown of the platform, see our [OpenAI Codex complete guide](/blog/codex-complete-guide).

## Overview: Claude Code Subagents

**Claude Code** runs subagents locally in your terminal environment through its [Agent tool](/glossary/agent-sdk). Subagents are spawned as specialized teammates — each with a defined role, tool access, and optional git worktree isolation. The primary agent orchestrates these subagents based on task decomposition, running them in parallel or sequentially as dependencies require.

What makes Claude Code's approach distinct is the programmable layer stack. Custom agents are defined through skill files, CLAUDE.md instructions, and explicit agent type declarations that live in your repository. This means your multi-agent configuration is version-controlled, portable across team members, and evolves with your codebase.

Claude Code subagents share the local filesystem by default but can operate in isolated git worktrees for safe parallel editing. They inherit project context from CLAUDE.md files and can be scoped to specific tools and permissions. The system favors composability — you build specialized agents for your workflow and invoke them by name. Our [Claude Code subagents examples](/blog/claude-code-subagents-examples) cover practical patterns in detail.

## Feature Comparison

| Feature | OpenAI Codex | Claude Code | Winner |
|---------|-------------|-------------|--------|
| **Execution environment** | Cloud containers (sandboxed) | Local terminal (+ optional worktrees) | Depends on need |
| **Isolation model** | Full container isolation per agent | Git worktree isolation (optional) | Codex |
| **Custom agent definition** | Prompt-based task configuration | File-based skills + CLAUDE.md + agent types | Claude Code |
| **Parallel execution** | Native (separate containers) | Native (parallel tool calls + background agents) | Tie |
| **Version control of agent config** | Not repo-native | Lives in repo (skills/, CLAUDE.md) | Claude Code |
| **Shell/tool access** | Sandboxed shell per container | Full local shell (permission-gated) | Claude Code |
| **Latency** | Higher (container spin-up) | Lower (local process spawn) | Claude Code |
| **Security model** | Zero local access, cloud-only | Local access with permission prompts | Codex |
| **Pricing** | Token-based (ChatGPT Pro/Team/Enterprise) | Token-based (API usage) | Varies |
| **Platform support** | Web UI + VS Code extension | Terminal (macOS, Linux) | Codex (broader) |

## Agent Architecture: Detailed Analysis

The fundamental architectural difference between Codex and Claude Code subagents is where computation happens and how agents are defined.

**Codex's cloud-first model** treats each agent task as a disposable compute unit. When you ask Codex to handle a complex task, the system may break it into subtasks that run in parallel containers. Each container starts from a snapshot of your repository at the time of task creation. Agents cannot observe each other's in-progress work — they operate on frozen state and merge results at completion. This makes the system predictable and safe but means agents cannot dynamically coordinate mid-task.

The custom agent story in Codex is primarily prompt-driven. You describe what you want in natural language, and the platform determines how to decompose and execute. There's no declarative configuration file that defines "this is my test agent" or "this is my refactoring agent" — the intelligence lives in Codex's task planning rather than user-defined agent specifications.

**Claude Code's local-first model** gives you direct control over agent composition. The [Agent tool](https://docs.anthropic.com) accepts parameters for agent type, description, prompt, isolation mode, and execution model (foreground vs background). Available agent types include specialized variants — `Explore` for code search, `Plan` for architecture design, `codex:codex-rescue` for second-opinion diagnosis — each with different tool access and behavioral profiles.

Custom agents in Claude Code emerge from the [extension stack](/blog/claude-code-extension-stack-skills-hooks-agents-mcp): skill files define reusable instructions, CLAUDE.md provides project context, and hooks add deterministic automation around agent actions. This layered system means you can build a "test-writer" agent that follows your project's testing conventions, a "reviewer" agent that applies your team's code standards, or a "deploy" agent that handles your specific CI/CD workflow — all defined in files that travel with your repo.

For teams, this is the key differentiator. Claude Code's agent definitions are collaborative artifacts: a senior engineer writes the skill file, and every team member's Claude Code instance uses it consistently. Codex's agent behavior is determined per-session by the platform's own task decomposition logic. See our [Claude Code agent teams deep dive](/blog/claude-code-agent-teams) for multi-agent orchestration patterns.

## Customization and Configuration: Detailed Analysis

How you teach each platform about your specific workflows determines long-term productivity.

**Codex custom agents** are configured through:
- **System prompts**: Instructions provided at task creation time
- **Environment setup**: Specifying dependencies, build tools, and test commands
- **Repository context**: The platform reads your codebase structure

The customization ceiling is the prompt itself. You cannot define persistent agent personas that survive across sessions or create reusable agent templates that other team members inherit. Each Codex task starts relatively fresh — the platform has some memory of prior interactions, but agent specialization must be re-established through prompting. The [Codex VS Code extension](/blog/codex-vscode) provides a tighter feedback loop but the same fundamental model applies.

**Claude Code custom agents** are configured through:
- **Skill files** (`skills/*/SKILL.md`): Detailed instruction sets for specific tasks — formatting rules, quality gates, output templates. These are loaded into the agent's context when invoked.
- **CLAUDE.md files**: Project-level and directory-level instructions that every agent inherits automatically
- **Agent type declarations**: Predefined agent types with specific tool access (Explore gets read-only tools; Plan gets architecture tools but no edit capability)
- **Hooks**: Shell commands that execute before/after agent actions — adding deterministic guardrails like linting or test runs

The practical difference: in Claude Code, you invest upfront in defining your agent configurations, and that investment compounds across every session and team member. A well-crafted skill file for code review means every invocation of your review agent applies the same standards — no drift, no forgotten instructions. Read about [writing effective skills](/blog/9-principles-writing-claude-code-skills) for the methodology behind this.

In Codex, you get faster time-to-first-result with less configuration, but the ceiling on specialization is lower. The platform handles orchestration intelligently, but you trade fine-grained control for convenience.

## Isolation and Safety: Detailed Analysis

Multi-agent systems introduce coordination risks — agents can conflict, corrupt shared state, or execute unintended actions. Each platform addresses this differently.

**Codex's safety model** is architecturally enforced:
- Each agent runs in a container with no network access by default
- Agents cannot modify your local filesystem directly
- Results are presented for review before merging
- No shell access to your actual development machine
- Failed agents are simply discarded — no cleanup needed

This makes Codex the safer choice for teams where agents might be operating on production-adjacent code or where developers want zero risk of unintended side effects. The containment is absolute — a malicious or confused agent cannot escape its sandbox.

**Claude Code's safety model** is permission-based:
- Agents request tool access and users approve/deny
- Git worktree isolation prevents file conflicts between parallel agents
- Hooks can enforce pre-commit validation (tests must pass, linter must succeed)
- Background agents can be monitored and stopped
- Permission modes control what agents can do without asking

Claude Code's model is more powerful but requires more trust. A misconfigured agent with broad permissions could make unwanted changes. The [hooks system](/blog/claude-code-hooks-a-complete-guide-to-automating-your-ai-coding-workflow) mitigates this by adding deterministic checkpoints — but the responsibility for configuring these guardrails falls on you.

For security-sensitive environments, Codex's container isolation is objectively stronger. For developer productivity where you trust the tool and want deep system integration, Claude Code's permission model is less restrictive.

## Workflow Integration: Detailed Analysis

How subagents fit into your daily development workflow matters as much as raw capability.

**Codex workflow patterns:**
- Open the web UI or VS Code extension
- Describe a task or select from suggested actions
- Codex spawns agents in the cloud, works asynchronously
- You receive results (PR, diff, analysis) for review
- Approve, request changes, or iterate

This async model works well for tasks you want to fire-and-forget: "write tests for this module", "refactor this service to use the new API", "investigate why CI is failing." You don't need to be at your terminal while agents work. The [Codex for open source](/blog/codex-for-open-source) program demonstrates this workflow for maintainers handling issue triage across multiple repos.

**Claude Code workflow patterns:**
- Stay in your terminal, invoke agents as part of your flow
- Spawn background agents for parallel tasks while you continue working
- Agents report back inline — you see results immediately
- Foreground agents block until complete (use for dependent tasks)
- Combine with `/loop` for recurring checks and monitoring

Claude Code's model keeps you in the loop during execution. You can redirect agents mid-task, provide additional context, or spawn follow-up agents based on intermediate results. The [remote control capability](/blog/claude-code-remote-control-mobile) extends this — kick off agents from your phone while away from your desk.

For developers who context-switch frequently and want async batch processing, Codex fits better. For developers who stay in flow and want real-time agent collaboration, Claude Code fits better.

## When to Choose OpenAI Codex

**Choose Codex for subagents and custom agents when:**

- **Security is paramount**: Your team requires container-level isolation and zero local filesystem access. Regulated industries, production codebases, or situations where agent containment must be guaranteed architecturally.
- **Async batch work**: You want to dispatch multiple tasks (test writing, documentation, refactoring) and review results hours later. Codex's async model excels at "fire and forget" workflows.
- **Cross-platform teams**: Team members use Windows, macOS, and Linux. Codex's web UI and VS Code extension work everywhere without terminal requirements.
- **Lower configuration investment**: You want multi-agent capabilities without building a custom skill/hook/CLAUDE.md stack. Codex handles orchestration automatically.
- **Student or open-source work**: The [Codex for students](/blog/codex-for-students) program provides free credits, making it accessible for learning multi-agent patterns.

## When to Choose Claude Code

**Choose Claude Code for subagents and custom agents when:**

- **Deep customization matters**: You want to define exactly how agents behave for your specific project — coding standards, test patterns, review criteria, deployment procedures. The skill file + CLAUDE.md + hooks stack gives you full control.
- **Team consistency**: You need every developer's AI agents to follow the same conventions. Agent definitions live in the repo and apply automatically.
- **Real-time collaboration**: You want to interact with agents during execution — redirecting, providing context, chaining tasks based on intermediate results.
- **Local tool integration**: Your workflow depends on local tools, databases, Docker containers, or custom scripts that agents need shell access to run. See how the [extension stack](/blog/claude-code-extension-stack-skills-hooks-agents-mcp) enables this.
- **Iterative development**: You're building agent workflows incrementally — testing a skill, adjusting behavior, adding hooks — and need the fast feedback loop of local execution.

## Verdict

**For subagents and custom agents, Claude Code offers more configurability and tighter workflow integration; Codex offers stronger isolation and simpler async dispatch.**

If you're building a team workflow where agent behavior must be consistent, version-controlled, and deeply integrated with your local tools — **choose Claude Code**. The upfront investment in skill files and agent configuration pays dividends across every session.

If you need guaranteed sandboxing, async batch processing, or cross-platform support without terminal requirements — **choose Codex**. The container model is architecturally safer and the async workflow suits teams that dispatch work and review later.

Many teams are adopting both: Claude Code for real-time pair-programming and local automation, Codex for batch tasks and secure code generation in reviewed environments. The [multi-agent workflow patterns](/blog/con-u-pour-des-workflows-multi-agents) emerging across both platforms suggest this hybrid approach will become standard.

## Frequently Asked Questions

### Can Codex subagents access my local filesystem?

No. Codex agents run in isolated cloud containers with a snapshot of your repository. They cannot read or modify files on your local machine. Results are delivered as diffs or pull requests for you to review and merge.

### How do I create a custom agent in Claude Code?

Define a skill file in `skills/your-agent/SKILL.md` with instructions for the agent's behavior, add relevant context to your project's CLAUDE.md, and invoke the agent using the Agent tool with the appropriate `subagent_type` parameter. The configuration is file-based and version-controlled.

### Do Codex subagents work with the VS Code extension?

Yes. The [Codex VS Code extension](/blog/codex-vscode) provides access to the same cloud-based agent system available through the web interface. You can dispatch tasks and review agent results without leaving your editor.

### Can Claude Code subagents run in parallel without conflicts?

Yes. Claude Code supports git worktree isolation for parallel agents — each agent works on a separate copy of the repo. For read-only tasks (research, exploration), agents can run in parallel without isolation since they don't modify files.

### Which platform is better for enterprise teams?

It depends on your priority. Codex offers stronger security guarantees through container isolation, making compliance teams more comfortable. Claude Code offers deeper workflow customization through its [programmable layer stack](/blog/claude-code-seven-programmable-layers), making engineering teams more productive. Evaluate based on whether security isolation or workflow integration is your binding constraint.

---

*Want more AI insights? [Subscribe to LoreAI](/subscribe) for daily briefings.*