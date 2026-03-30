---
title: "git worktree add: Run Multiple Branches Without the Stash Trap"
slug: git-worktree-add
description: "Learn how git worktree add lets you work on multiple branches simultaneously without stashing or cloning. A practical guide for developers and AI workflows."
lang: en
category: tools
---

# git worktree add: Run Multiple Branches Without the Stash Trap

You're deep in a feature branch when a critical production bug lands in your queue. Your options: `git stash`, context-switch, fix, unstash, get confused about where you were. Or clone the whole repo again. Neither is good. **`git worktree add`** is the third option — and after a decade of maturation, it's become foundational infrastructure for both parallel human development and [agentic coding](/glossary/agentic-coding) platforms running multiple AI agents simultaneously.

## What Is git worktree add?

`git worktree add` creates a new working directory that shares the same repository history as your main checkout. Every worktree is a full working directory with its own branch, index, and HEAD — but they all point to the same `.git` object store. You don't duplicate commits, pack files, or history. You just get a separate directory where you can check out a different branch and work independently.

The command was officially introduced in **Git 2.5 on July 29, 2015**. Before that, developers made do with `contrib/workdir/git-new-workdir`, a fragile shell script that used symlinks to fake multiple working directories. Git 2.5 replaced that with a robust internal pointer system — worktree metadata lives in `.git/worktrees/` and survives restarts, moves, and machine reboots that would have broken the symlink approach.

## Basic Usage

```bash
# Add a new worktree for an existing branch
git worktree add ../my-hotfix hotfix/prod-bug

# Add a worktree and create a new branch simultaneously
git worktree add -b feature/new-api ../feature-work origin/main

# List all active worktrees
git worktree list

# Remove a worktree when done
git worktree remove ../my-hotfix
```

The path (`../my-hotfix`) can be anywhere on your filesystem — it doesn't need to live inside the main repo directory. The branch specified must not be checked out in any other worktree; Git enforces this to prevent index conflicts.

## Why This Beats git stash

The `git stash` workflow has a compounding problem: stashes are unnamed by default, accumulate silently, and get lost or forgotten. More critically, switching branches cleans your working directory — you lose the mental context of what you were looking at, which files were open, and what state the build was in.

With `git worktree add`, your feature branch stays exactly as you left it. You open a new terminal tab, `cd` into the hotfix worktree, fix the bug, commit, push, close the tab. Your feature directory is untouched. No stash, no re-checkout, no lost context.

This is especially valuable for tasks like:

- **Hotfix while mid-feature**: The canonical use case — fix production without disturbing in-progress work
- **Running builds in parallel**: Compile or test two branches simultaneously without serializing on one checkout
- **Code review with context**: Check out a colleague's PR branch in a separate worktree while keeping your own work open
- **Long-running migrations**: Keep a stable branch running while you incrementally rewrite in another worktree

## How git worktree Differs from Cloning

Cloning creates an entirely independent repository copy — separate object stores, separate pack files, separate history. A full clone of a large monorepo can consume gigabytes and take minutes. A worktree adds kilobytes of metadata and takes milliseconds.

The shared object store also means you get immediate access to all local refs. If you've fetched `origin/main` in your primary checkout, the worktree can check it out instantly — no additional network round-trip.

The constraint is symmetrical: you can't check out the same branch in two worktrees simultaneously. Git's index is branch-specific, and two processes writing to the same index would corrupt it. This is a deliberate safety guarantee, not a limitation.

## The AI Agent Use Case

The recent resurgence of interest in `git worktree add` is driven largely by [agentic coding](/glossary/agentic-coding) platforms. According to the research, **OpenAI Codex** uses worktrees in detached HEAD states to run multiple autonomous coding agents simultaneously — each agent gets an isolated sandbox with its own working directory, but all agents share the same repository history without duplication overhead.

This architecture makes sense: if you're running 10 parallel agents tackling 10 different tasks in the same codebase, cloning the repo 10 times is wasteful and slow. Worktrees give you the isolation you need (each agent can't step on another's working directory) with none of the overhead.

Claude Code's [parallel sessions feature](/blog/claude-code-is-not-a-coding-tool) uses a similar model — spawning sub-agents that can work on isolated copies of the codebase without requiring full clones. The worktree becomes the unit of agent isolation.

The research also notes that scaling worktrees for AI agents has introduced new edge cases: **resource leaks** (worktrees not cleaned up after agent crashes) and **branch lock conflicts** (agents trying to check out branches already locked by another worktree). These aren't theoretical problems — they require explicit workflow management, including cleanup scripts and health checks on worktree state.

## IDE Support

`git worktree` has graduated from an obscure CLI trick to first-class IDE support. Both **JetBrains IDEs** and **Visual Studio Code** now have native support for opening and managing worktrees. In VS Code, you can open a worktree directory directly as a workspace — it recognizes the shared Git context and shows the correct branch, diff, and history.

This matters for adoption: the historical barrier to worktree use was that most developers worked in GUIs that didn't understand them. That barrier is largely gone.

## Practical Workflow Tips

**Name your worktree directories clearly.** Use `../repo-hotfix-auth` rather than `../tmp` — you'll have multiple worktrees open and the directory name is often your only navigation cue.

**Clean up aggressively.** Stale worktrees don't cause immediate problems, but they accumulate `.git/worktrees/` metadata and can cause confusion when branches appear locked. Run `git worktree prune` periodically to remove entries for deleted directories.

**Use bare clones for pure agent workflows.** If you're building an automation pipeline that only ever uses worktrees (never the main working directory), clone with `git clone --bare`. This gives you a `.git`-only directory as the "main" repo, and all actual work happens in worktrees. Cleaner separation, no accidental edits to the bare repo.

**Watch for submodule limitations.** The research notes that submodule support was an early limitation when the feature launched in 2015. While support has improved, complex submodule configurations in worktrees can still produce unexpected behavior — test before committing to a worktree-heavy workflow in repos with deep submodule trees.

## What's Next for git worktree

The feature is stable and well-maintained. The interesting development is on the tooling layer: as agentic coding workflows become more common, expect better built-in tooling for worktree lifecycle management — cleanup hooks, lock detection, and resource accounting. Platforms like [MCP servers](/blog/create-an-mcp-server) that orchestrate multi-agent workflows will likely expose worktree management as a first-class primitive.

For individual developers, `git worktree add` is already the right answer to any situation where you'd otherwise reach for `git stash`. The workflow is simpler, safer, and more recoverable. For teams building AI coding infrastructure, it's a foundational building block — one that scales from two parallel branches to hundreds of concurrent agent sandboxes on the same hardware.

---

*Want more AI insights? [Subscribe to LoreAI](/subscribe) for daily briefings.*