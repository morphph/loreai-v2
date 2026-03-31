---
title: >-
  Claude Code Remote vs SSH: Which Remote Development Approach Fits Your
  Workflow?
slug: claude-code-remote-vs-ssh
description: >-
  Comparing Claude Code Remote and SSH for remote development — features,
  workflows, and when to use each.
item_a: Claude Code Remote
item_b: SSH
category: tools
related_glossary:
  - agentic-coding
related_blog:
  - google-colab-mcp-server-cloud-gpu-ai-agents
lang: en
related_topics:
  - claude-code
---

# Claude Code Remote vs SSH: Which Remote Development Approach Fits Your Workflow?

**[Claude Code Remote](/blog/claude-code-remote-control-mobile)** and **SSH** both let you work on code that lives on a different machine, but they operate at fundamentally different layers. [Claude Code](/blog/claude-code-complete-guide) Remote is a managed remote session feature built into Claude Code — you start a task on one device and continue it from your phone, browser, or another terminal without configuring anything. SSH is a general-purpose protocol for secure shell access to remote machines, giving you raw terminal control over any server. The core distinction: Claude Code Remote abstracts away the infrastructure; SSH gives you the infrastructure directly.

## Feature Comparison

| Feature | Claude Code Remote | SSH |
|---------|-------------------|-----|
| **Primary purpose** | Continue AI coding sessions across devices | General-purpose remote shell access |
| **Setup required** | None — built into Claude Code | SSH keys, server config, firewall rules |
| **Device support** | Browser, iOS app, terminal, desktop app | Any SSH client (terminal, PuTTY, etc.) |
| **Session continuity** | Native — sessions persist and transfer between surfaces | Manual (tmux/screen/mosh required) |
| **AI integration** | Full [agentic coding](/glossary/agentic-coding) capabilities included | None — you bring your own tools |
| **File editing** | AI-assisted multi-file editing with diffs | Manual editing via vim/nano/VS Code Remote |
| **Infrastructure control** | Managed by Anthropic | Full control over your own servers |
| **Use cases** | AI-assisted development, task handoff | Server admin, deployment, tunneling, any remote work |
| **Offline access** | Requires internet connection | Works on local networks, no external dependency |

## When to Use Claude Code Remote

Choose Claude Code Remote when your goal is **AI-assisted development without infrastructure overhead**. The standout feature is seamless session handoff — kick off a long-running refactoring task from your terminal at work, then check progress from your phone on the train using the web interface or iOS app. The `/teleport` command pulls a web session into your local terminal, and `/desktop` hands it off to the desktop app for visual diff review.

Claude Code Remote makes sense when you don't have the repo cloned locally, want to run multiple AI tasks in parallel from the browser, or need to hand off work between devices throughout the day. It pairs well with teams using [cloud-based GPU environments](/blog/google-colab-[mcp](/glossary/mcp)-server-cloud-gpu-ai-agents) where spinning up a local dev environment is impractical.

## When to Use SSH

Choose SSH when you need **direct, unrestricted access to a remote machine**. SSH is the foundational protocol for server administration, deployment pipelines, CI/CD infrastructure, port forwarding, and any workflow where you need full control over what runs on the remote host.

SSH is the right choice when you're managing production servers, running custom build environments, tunneling database connections, or working in air-gapped networks where managed cloud services aren't an option. It's also essential when your workflow involves tools beyond coding — monitoring processes, managing containers, configuring services, or debugging live systems.

Pair SSH with tmux or mosh for session persistence, and VS Code Remote or JetBrains Gateway for IDE-level editing over SSH connections. The ecosystem is mature, universally supported, and imposes no vendor dependency.

## Verdict

These tools solve different problems and work well together. If you want to **run AI coding sessions across devices with zero setup**, use Claude Code Remote — it eliminates the friction of configuring remote access and keeps your AI context intact as you switch surfaces. If you need **general-purpose remote shell access** with full infrastructure control, SSH remains indispensable and irreplaceable.

The practical pattern for most developers: SSH into your development server, run Claude Code there, and use Claude Code Remote to pick up that session from other devices when you step away. You get the infrastructure control of SSH and the session mobility of Claude Code Remote without choosing between them.

For more on Claude Code, see the [Claude Code topic hub](/topics/claude-code).

---

*Want more AI insights? [Subscribe to LoreAI](/subscribe) for daily briefings.*
