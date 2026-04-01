---
title: "Claude Code — Everything You Need to Know"
slug: claude-code
description: "Complete guide to Claude Code: Anthropic's agentic coding tool for terminal, IDE, and browser."
pillar_topic: Claude Code
category: tools
related_glossary: [agentic-coding, chatgpt]
related_blog: [integrate-claude-code-into-your-development-workflow]
related_compare: [claude-code-remote-vs-ssh]
related_faq: [claude-code-install, how-do-i-set-up-claude-code-remote-control-on-my-phone, can-i-approve-or-reject-code-changes-from-my-mobile-device-w]
lang: en
---

# Claude Code — Everything You Need to Know

**Claude Code** is Anthropic's [agentic coding](/glossary/agentic-coding) tool that lives in your terminal, reads your entire codebase, edits files, runs commands, and integrates with your development tools. Unlike autocomplete-style AI assistants, Claude Code operates as an autonomous agent — you describe a task in natural language, and it plans and executes the entire workflow across multiple files and tools. It's available as a terminal CLI, VS Code extension, JetBrains plugin, desktop app, browser interface, and via GitHub Actions and GitLab CI/CD. The project has accumulated over 82,000 GitHub stars since its February 2025 launch, with 66 releases shipped as of March 2026.

## Latest Developments

Claude Code v2.1.81 shipped on March 20, 2026 — the project ships multiple releases per week. Recent additions include the **Cowork** mode, which lets Claude power through extended tasks autonomously while you focus elsewhere. The VS Code extension now offers inline diffs, @-mentions, plan review, and conversation history directly in the editor. GitHub Actions and GitLab CI/CD integration lets you tag `@claude` on pull requests for automated code review.

For a hands-on look at integrating Claude Code into real development workflows, see our [blog post on development workflow integration](/blog/integrate-claude-code-into-your-development-workflow). Anthropic also offers a free [Claude Code in Action course](https://anthropic.skilljar.com/claude-code-in-action) covering architecture, context management, MCP servers, and GitHub integration.

## Key Features and Capabilities

Claude Code handles the full range of coding tasks through natural language commands:

- **Multi-file editing**: Plans and executes changes across your entire codebase — refactoring, renaming, import updates — in a single session
- **Shell execution**: Runs build tools, test runners, linters, and deployment scripts with user approval
- **Git workflows**: Stages, commits, pushes, and creates PRs with structured commit messages following your repo's conventions
- **[MCP server](/glossary/agentic-coding) integration**: Connects to external tools and services — browser automation, databases, specialized workflows — via the Model Context Protocol
- **Context management**: Understands your project structure and maintains relevant context throughout long sessions
- **GitHub integration**: Tag `@claude` on GitHub issues and PRs for automated assistance in your existing version control workflow

Installation takes one command. On macOS/Linux:

```bash
curl -fsSL https://claude.ai/install.sh | bash
```

Windows is supported natively via PowerShell or WinGet — no WSL required. After installing, run `claude` inside any project directory to start.

## Common Questions

- **[How do I install Claude Code?](/faq/claude-code-install)**: One-command install via curl, Homebrew, or WinGet — requires a Claude Pro, Max, Teams, or Enterprise subscription, or a Console API account
- **[How do I set up Claude Code remote control on my phone?](/faq/how-do-i-set-up-claude-code-remote-control-on-my-phone)**: Claude Code can be accessed remotely — see the setup guide for phone-based control options
- **[Can I approve or reject code changes from my mobile device?](/faq/can-i-approve-or-reject-code-changes-from-my-mobile-device-w)**: Yes — Claude Code surfaces proposed changes for review before applying them, including from mobile

## How Claude Code Compares

- **[Claude Code Remote vs SSH](/compare/claude-code-remote-vs-ssh)**: When to use Claude Code's built-in remote access versus a traditional SSH tunnel to your development machine

## All Claude Code Resources

### Blog Posts
- [Integrate Claude Code Into Your Development Workflow](/blog/integrate-claude-code-into-your-development-workflow)

### Deep Dives
- [Claude Code 设计哲学：从51万行泄漏源码学习 AI Agent 架构](/learn/claude-code-design-philosophy) — Deep analysis of Claude Code's Agent Harness architecture, three-layer memory system, Prompt Engineering methodology, and anti-distillation defense from the leaked source code

### Glossary
- [Agentic Coding](/glossary/agentic-coding) — The paradigm of AI tools that autonomously plan and execute multi-step coding tasks

### FAQs
- [How do I install Claude Code?](/faq/claude-code-install)
- [How do I set up Claude Code remote control on my phone?](/faq/how-do-i-set-up-claude-code-remote-control-on-my-phone)
- [Can I approve or reject code changes from my mobile device?](/faq/can-i-approve-or-reject-code-changes-from-my-mobile-device-w)

---

*Want more AI insights? [Subscribe to LoreAI](/subscribe) for daily briefings.*