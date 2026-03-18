---
title: "Is Codex Available for Enterprise Teams?"
slug: codex-enterprise
description: "Yes — OpenAI Codex is available to ChatGPT Enterprise and Business users with secure, isolated execution."
category: tools
related_glossary: [codex, agentic]
related_blog: [codex-complete-guide]
lang: en
---

# Is Codex Available for Enterprise Teams?

Yes. **[Codex](/glossary/codex)** is available to ChatGPT Enterprise and Business users today. OpenAI rolled out access to Enterprise, Business, and Pro tiers at launch in May 2025, with Plus and Edu users gaining access shortly after in June 2025. Enterprise teams can assign coding tasks to Codex agents directly from the ChatGPT sidebar, with each task running in a secure, isolated cloud sandbox preloaded with your repository.

## Context

Enterprise adoption of [agentic](/glossary/agentic) coding tools hinges on security and control — two areas OpenAI specifically prioritized for Codex. Every Codex task executes inside an isolated container with **internet access disabled** during task execution. The agent can only interact with code explicitly provided via GitHub repositories and pre-installed dependencies configured through a setup script. It cannot reach external websites, APIs, or services. This sandboxed architecture addresses common enterprise concerns around data exfiltration and supply chain risk.

Several large organizations are already using Codex in production workflows. **Cisco** is an early design partner evaluating Codex across their product portfolio. **Temporal** uses it to accelerate feature development, debug issues, and refactor large codebases. These early adopters report that Codex works best when engineers assign well-scoped tasks to multiple agents simultaneously — a workflow that fits naturally into enterprise team structures where task delegation and code review are standard practice.

Enterprise teams can also standardize agent behavior across their organization using **AGENTS.md** files placed in repositories. These files define coding conventions, testing commands, and project-specific instructions that every Codex agent follows — ensuring consistent output regardless of which team member assigns the task. For a deeper look at capabilities, see our [complete Codex guide](/blog/codex-complete-guide).

## Practical Steps

1. **Verify your plan**: Confirm your organization is on ChatGPT Enterprise or Business — Codex access is included at no additional cost during the initial preview period
2. **Connect GitHub**: Link your organization's repositories so Codex can access your codebase in its sandboxed environment
3. **Add AGENTS.md files**: Place instruction files in your repos to define coding standards, test commands, and project conventions for consistent agent behavior
4. **Assign tasks from the sidebar**: Type a prompt in the ChatGPT Codex panel and click "Code" for implementation tasks or "Ask" for codebase questions
5. **Review before merging**: Codex provides terminal logs, test outputs, and citations — review these before opening a pull request

## Related Questions

- [What is Codex?](/faq/what-is-codex)
- [How much does Codex cost?](/faq/codex-pricing)
- [How do I set up Codex?](/faq/codex-setup)

For a complete overview, see the [Codex topic hub](/topics/codex).

---

*Want more AI insights? [Subscribe to LoreAI](/subscribe) for daily briefings.*