---
title: "Agent Teams — AI Glossary"
slug: agent-teams
description: "What are agent teams? Multi-agent architectures where specialized AI agents collaborate on complex tasks."
term: agent-teams
display_term: "Agent Teams"
category: concepts
related_glossary: [agentic, claude-code, claude]
related_blog: [claude-code-agent-teams, claude-code-extension-stack-skills-hooks-agents-mcp]
related_compare: []
lang: en
---

# Agent Teams — AI Glossary

**Agent teams** are multi-agent architectures where multiple AI agents work together on a shared task, each handling a specialized subtask in parallel or sequence. Instead of a single agent processing everything serially, agent teams decompose complex work into independent units — one agent researches, another writes code, a third runs tests — then coordinate their outputs into a unified result.

## Why Agent Teams Matter

Large-scale engineering tasks often exceed what a single agent can handle efficiently within one context window. Agent teams solve this by distributing work across specialized sub-agents, each with its own focused context. This enables parallel execution — a refactoring agent can update module A while a test-generation agent writes coverage for module B simultaneously.

[Claude Code](/glossary/claude-code) implements agent teams natively: a primary agent spawns sub-agents for independent subtasks, each operating in its own context with access to the full codebase. This is particularly valuable for monorepo refactoring, multi-file migrations, and tasks where different parts of the work have no dependencies on each other. Our [deep dive on Claude Code agent teams](/blog/claude-code-agent-teams) covers real-world usage patterns.

## How Agent Teams Work

Agent teams follow a coordinator-worker pattern. A primary [agentic](/glossary/agentic) process analyzes the task, identifies parallelizable subtasks, and spawns specialized sub-agents. Each sub-agent receives a focused prompt, operates within its own context window, and returns results to the coordinator.

Key mechanisms:

- **Task decomposition**: The coordinator breaks work into independent units that can run concurrently
- **Isolated context**: Each sub-agent gets its own context window, preventing context pollution from unrelated subtasks
- **Result aggregation**: The coordinator merges sub-agent outputs, resolving conflicts and ensuring consistency
- **Skill specialization**: Sub-agents can be configured with different [instructions and capabilities](/blog/claude-code-extension-stack-skills-hooks-agents-mcp), optimizing each for its specific role

## Related Terms

- **[Agentic](/glossary/agentic)**: The broader paradigm of AI systems that autonomously plan and execute multi-step tasks — agent teams extend this to multi-agent collaboration
- **[Claude Code](/glossary/claude-code)**: Anthropic's terminal-based coding agent that supports native agent team spawning for parallel task execution
- **[Claude](/glossary/claude)**: Anthropic's family of large language models that powers individual agents within a team

---

*Want more AI insights? [Subscribe to LoreAI](/subscribe) for daily briefings.*