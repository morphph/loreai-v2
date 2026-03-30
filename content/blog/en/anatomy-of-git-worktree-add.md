---
title: "Anatomy of git worktree add: How Git's Linked Working Trees Work"
slug: anatomy-of-git-worktree-add
description: "How git worktree add works under the hood: shared object databases, isolated HEADs, and why AI agents love it."
lang: en
category: tools
---

# Anatomy of `git worktree add`: How Git's Linked Working Trees Work

**`git worktree add`** provisions a linked working tree that shares your repository's core object database while maintaining a completely isolated filesystem path, branch checkout, staging area, and HEAD pointer. The result: two fully independent working directories from a single `.git` directory — no duplication of history, no second clone.

Introduced formally in Git 2.5 (July 2015), the feature solved a problem that had plagued developers for years. It recently found a second life as the foundational infrastructure for parallel AI coding agents like Claude Code.

## The Architecture: What Gets Shared, What Gets Isolated

The elegance of `git worktree add` is in what it separates and what it reuses.

**Shared across all worktrees:**
- The object database (all commits, trees, blobs)
- Refs (branches, tags, remotes)
- Configuration (`.git/config`)
- Hooks

**Isolated per worktree:**
- `HEAD` — each worktree can be on a different branch simultaneously
- The index (staging area)
- The working directory files themselves
- Worktree-specific state files

This means checking out a branch in one worktree has zero effect on another. Git tracks each linked worktree under `.git/worktrees/<name>/`, storing a separate `HEAD`, `index`, and `gitdir` pointer file.

A typical invocation:

```bash
git worktree add ../my-project-hotfix origin/main
```

This creates a new directory at `../my-project-hotfix` — outside your current working tree — checked out to `origin/main`, sharing the same `.git` object store. You can immediately `cd` into it and start working without disturbing whatever is in progress in your primary directory.

## Before Worktrees: The `git stash` and Clone Era

Before Git 2.5, developers had two options when they needed to context-switch mid-task:

1. **`git stash`**: Shelve uncommitted changes, switch branches, do the urgent work, pop the stash. Fragile — stash conflicts and lost context were common.
2. **Full repository clone**: Duplicate the entire repo to a second directory. Works, but wastes disk space proportional to your object database size and requires managing two remotes.

The pre-2015 workaround was a shell script called `git-new-workdir`, which attempted to replicate the linked-tree behavior manually by symlinking parts of `.git`. It was unofficial, brittle, and not included in standard Git distributions.

`git worktree add` replaced all of this with a first-class, safe implementation baked into Git itself.

## Why Agentic AI Tools Rediscovered It

`git worktree` remained a niche power-user feature for nearly a decade. The resurgence came with agentic AI coding tools in the mid-2020s.

When an AI agent like [Claude Code](/glossary/agentic-coding) works on a task autonomously, it needs an isolated environment — it cannot share a working directory with a human developer or another agent without creating race conditions. Full clones are too expensive and slow to provision for every task. `git worktree add` threads the needle: fast to create, zero object-database duplication, fully isolated branch state.

The pattern that emerged: spin up a worktree per agent, per task. Each agent gets its own directory and branch. They all share the same underlying repository history. When the task is done, the worktree is pruned with `git worktree remove` and the branch is merged or discarded.

This architectural fit — shared object store, isolated execution context — makes `git worktree` the natural primitive for parallel AI agent workflows in a way that `git stash` and clones simply cannot match.

## Bare Repository Setup

A common pattern for worktree-heavy workflows is initializing with a **bare repository** instead of a standard clone:

```bash
git clone --bare https://github.com/org/repo.git repo.git
cd repo.git
git worktree add ../repo-feature feature-branch
git worktree add ../repo-hotfix main
```

A bare repository has no default working directory — it's just the `.git` contents. Every working directory is a worktree. This is cleaner than the standard setup for workflows where you never intend to work directly in the "main" clone, only in named worktrees.

## Practical Constraints

A few hard rules that `git worktree` enforces:

- **A branch can only be checked out in one worktree at a time.** Attempting to check out an already-checked-out branch in a second worktree fails with an error. You must use a new branch or a detached HEAD.
- **Worktrees are local.** They are entries in your local `.git/worktrees/` directory, not something you push to a remote.
- **Pruning is manual or semi-automatic.** If you delete a worktree directory without running `git worktree remove`, the metadata persists. Run `git worktree prune` to clean up stale entries.

## The Right Mental Model

Think of `git worktree add` as creating a new checkout — not a new repository. The object database is the repository. Working trees are just windows into it at a specific branch and commit. You can have as many windows open as you need, each showing something different, without duplicating what's behind them.

For developers juggling hotfixes against active feature work, this is cleaner than `git stash`. For AI agents running parallel tasks across the same codebase, it's the only architecture that scales.

---

*Want more AI insights? [Subscribe to LoreAI](/subscribe) for daily briefings.*