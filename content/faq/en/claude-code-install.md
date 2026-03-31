---
title: How Do I Install Claude Code?
slug: claude-code-install
description: >-
  Install Claude Code on macOS, Linux, or Windows with native install, Homebrew,
  or WinGet.
category: tools
related_glossary:
  - claude-code
  - agentic-coding
related_blog:
  - how-to-build-a-production-ready-claude-code-skill
lang: en
related_topics:
  - claude-code
---

# How Do I Install Claude Code?

**[Claude Code](/glossary/claude-code)** installation takes about two minutes and works on macOS, Linux, and Windows. The native install (recommended) is a single-line command that auto-updates in the background. You'll also need a Claude subscription (Pro, Max, Teams, or Enterprise), a Claude Console account, or access through a supported cloud provider to log in after installation.

## Context

Installation is your first step to using [Claude Code](/blog/claude-code-complete-guide) as an [agentic coding](/blog/claude-code-seven-programmable-layers) tool. Before installing, check your system requirements: **4GB+ RAM**, an internet connection, and one of these operating systems — macOS 13.0+, Windows 10 1809+, Ubuntu 20.04+, Debian 10+, or Alpine 3.19+. On Windows, you'll need Git for Windows installed first; **ripgrep** is an additional dependency (usually included automatically). Claude Code runs in your terminal with Bash, Zsh, PowerShell, or CMD.

The native installer is recommended because it automatically updates you to the latest version in the background. If you prefer package managers like Homebrew or WinGet, you'll need to manually run upgrade commands periodically. Note: NPM installation is deprecated — use one of the methods below instead.

## Practical Steps

**Step 1: Install Claude Code**

Choose your platform:

**macOS/Linux (Native Install — Recommended):**
```bash
curl -fsSL https://claude.ai/install.sh | bash
```

**Windows PowerShell (Native Install — Recommended):**
```powershell
irm https://claude.ai/install.ps1 | iex
```

**Windows CMD:**
```batch
curl -fsSL https://claude.ai/install.cmd -o install.cmd && install.cmd && del install.cmd
```

**Homebrew (macOS/Linux):**
```bash
brew install --cask claude-code
```
Note: Run `brew upgrade claude-code` periodically to get updates.

**WinGet (Windows):**
```powershell
winget install Anthropic.ClaudeCode
```
Note: Run `winget upgrade Anthropic.ClaudeCode` periodically to get updates.

**Step 2: Log In**

Open your terminal and run:
```bash
claude
```

You'll be prompted to log in on first use. Follow the prompts with your Claude Pro, Max, Teams, Enterprise account, or Claude Console credentials.

**Step 3: Verify Installation**

After logging in, you're ready to use Claude Code. Navigate to any code project and run `claude` again to start an interactive session.

## Related Questions

- How do I check if Claude Code is installed correctly?
- How do I update Claude Code to the latest version?
- Can I install Claude Code on Windows without using PowerShell?

---

*Want more AI insights? [Subscribe to LoreAI](/subscribe) for daily briefings.*
