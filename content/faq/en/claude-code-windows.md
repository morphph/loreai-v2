---
title: "Can Claude Code run on Windows?"
slug: claude-code-windows
description: "Claude Code runs on Windows through WSL2, the Windows Subsystem for Linux. Native Windows support is not available, but WSL2 works seamlessly."
category: tools
related_glossary: [claude-code, anthropic, agentic-coding]
related_blog: [claude-code-complete-guide, claude-code-remote-control-mobile]
lang: en
---

# Can Claude Code run on Windows?

Claude Code does not run natively on Windows. It requires a Unix-like environment, so Windows users need to install WSL2, the Windows Subsystem for Linux, to use it. Once WSL2 is set up, Claude Code runs exactly as it does on macOS or Linux with no limitations.

## Context

[Claude Code](/glossary/claude-code) is a terminal-based [agentic coding](/glossary/agentic-coding) tool built by [Anthropic](/glossary/anthropic) that relies on Unix shell conventions for file operations, process management, and command execution. Since Windows uses a fundamentally different shell environment (PowerShell and CMD), Claude Code cannot operate directly on the Windows command line.

WSL2 provides a full Linux kernel running inside Windows, which gives Claude Code everything it needs. This is actually the recommended approach from Anthropic, and many professional developers on Windows already use WSL2 for Node.js and other development tooling. Your WSL2 filesystem is accessible from Windows Explorer and VS Code integrates with it natively, so the workflow is smooth.

For developers who prefer not to install WSL2, another option is running Claude Code on a remote server and accessing it via the [remote control feature](/blog/claude-code-remote-control-mobile) or [headless mode](/blog/headless-mode). This works from any device, including Windows machines, tablets, and even phones. The [Claude Code complete guide](/blog/claude-code-complete-guide) covers all setup options in detail.

## Practical Steps

1. Install WSL2: open PowerShell as administrator and run `wsl --install`.
2. Restart your computer when prompted.
3. Set up your Linux distribution (Ubuntu is the default and works well).
4. Inside the WSL2 terminal, install Node.js 18+: `curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash - && sudo apt-get install -y nodejs`.
5. Install Claude Code: `npm install -g @anthropic-ai/claude-code`.
6. Navigate to your project directory and run `claude` to start.

Browse all resources on the [Claude Code topic hub](/topics/claude-code).

## Related Questions

- [How to install Claude Code?](/faq/how-to-install-claude-code)
- [What is Claude Code?](/faq/what-is-claude-code)
- [Is Claude Code free?](/faq/is-claude-code-free)

---

*Want more AI insights? [Subscribe to LoreAI](/subscribe) for daily briefings.*
