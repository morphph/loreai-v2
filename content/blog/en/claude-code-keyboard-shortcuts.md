---
title: "Claude Code Keyboard Shortcuts: The Complete Reference for 2026"
slug: claude-code-keyboard-shortcuts
description: "Master every Claude Code keyboard shortcut — from input control to session management. The complete reference for power users."
lang: en
category: tools
related_glossary: [claude-code, agentic-coding]
related_blog: [claude-code-complete-guide, claude-code-ctrl-s-prompt-stashing, claude-code-voice-mode, claude-code-memory]
related_compare: []
related_topics: [claude-code]
---

# Claude Code Keyboard Shortcuts: The Complete Reference for 2026

**Claude Code** runs in your terminal, which means your keyboard is the entire interface. Knowing the right shortcuts is the difference between fighting the tool and flowing with it. This reference covers every keyboard shortcut available in [Claude Code](/blog/claude-code-complete-guide) — from basic input control to advanced session management — organized by what you're actually trying to do.

Most developers discover Claude Code's shortcuts piecemeal, stumbling on them in docs or watching someone else's workflow. This guide puts them all in one place with the context you need: not just *what* each shortcut does, but *when* to reach for it.

## Input Control: Writing and Editing Prompts

Claude Code's input line behaves differently from a standard shell prompt, and mastering its input shortcuts is the first step toward an efficient workflow. These shortcuts control how you compose, edit, and submit prompts before Claude starts processing.

**Enter** submits your current prompt. This is straightforward, but the nuance matters: once you press Enter, Claude begins processing immediately. There is no confirmation step.

**Shift+Enter** (or typing a backslash `\` at the end of a line) inserts a newline without submitting. Use this for multi-line prompts — pasting code blocks, writing detailed instructions, or structuring complex requests. Multi-line input is essential for giving Claude Code the context it needs for [agentic coding](/glossary/agentic-coding) tasks that span multiple files.

**Up Arrow** recalls your previous prompt, similar to shell history. You can press it repeatedly to scroll through earlier prompts in the current session. This is invaluable when you need to retry a prompt with slight modifications — edit the recalled prompt and submit again.

**Ctrl+A** and **Ctrl+E** jump to the beginning and end of the current line, following standard terminal conventions. **Ctrl+W** deletes the word before the cursor. These work the same as they do in bash or zsh.

**Tab** triggers autocomplete for file paths and slash commands. When typing a file path in your prompt, Tab completes it against your project's actual file system. When typing a `/` command, Tab shows available options.

## Cancellation and Interruption

Knowing how to stop Claude Code mid-task is as important as knowing how to start it. These shortcuts give you precise control over cancellation at different stages of execution.

**Escape** cancels your current input without submitting it, clearing the input line. If you've typed a long prompt and change your mind, Escape is faster than selecting and deleting. During Claude's response, pressing Escape once will request a soft stop — Claude finishes its current thought and pauses, giving you a chance to redirect.

**Ctrl+C** is the harder interrupt. If Claude is actively generating a response or executing a tool, Ctrl+C sends an interrupt signal. Press it once to stop the current operation gracefully. Press it twice in quick succession to force-stop. This is your emergency brake when Claude is running a command you want to halt immediately, like a runaway build process or an unintended destructive operation.

The distinction between Escape and Ctrl+C matters in practice. Escape is a polite "pause here" — Claude retains context and you can continue the conversation. Ctrl+C is a firmer "stop now" — use it when Claude is executing shell commands you need to terminate. If you find yourself reaching for Ctrl+C frequently during tool execution, consider tightening your [Claude Code hooks](/blog/claude-code-hooks-a-complete-guide-to-automating-your-ai-coding-workflow) to add approval gates on risky commands.

## Mode Switching: Fast Mode, Verbose Mode, and Models

Claude Code supports several runtime modes you can toggle with keyboard-driven commands during a session. These aren't traditional hotkeys — they're slash commands — but they function as mode toggles that change Claude's behavior instantly.

**/fast** toggles Fast Mode on and off. Fast Mode uses the same Claude model but optimizes for faster output, which is useful when you need quick answers or are iterating rapidly. The tradeoff: responses may be less thorough. Toggle it on for simple queries ("what does this function do?") and off for complex multi-file tasks where you want Claude to think carefully.

**/verbose** toggles verbose output. When enabled, Claude Code shows more detail about its internal reasoning, tool calls, and execution steps. This is critical for debugging when Claude does something unexpected — you can see *why* it chose a particular approach. Turn it off when you're confident in the workflow and don't need the extra output.

**/model** allows you to switch the underlying model during a session. You can move between Claude Opus, Sonnet, and Haiku without restarting. The practical application: use a faster, cheaper model (Haiku) for simple lookups and switch to Opus for complex reasoning tasks. This is a cost-optimization lever that most developers underuse.

**/compact** compresses your conversation context. When your session grows long and responses slow down, /compact summarizes the conversation history to free up context window space. Use it proactively in long sessions rather than waiting for degraded performance.

## Session Management

Long-running Claude Code sessions require active management. These shortcuts and commands help you control session state without losing context or work in progress.

**Ctrl+L** clears the terminal screen without affecting your session state. Your conversation history, context, and any in-progress work remain intact — it only clears the visual output. Use this when your terminal gets cluttered with long tool outputs or verbose logs.

**Ctrl+D** exits the current Claude Code session. This is a clean exit — Claude Code will not prompt for confirmation, so make sure your work is committed before pressing it. If you have uncommitted changes, use `/commit` first or Claude will simply exit without saving.

**/clear** resets the conversation context entirely. Unlike Ctrl+L (which is cosmetic), /clear wipes the conversation history so Claude starts fresh with only your project's CLAUDE.md context. Use this when you're switching to an unrelated task within the same project and don't want prior conversation polluting Claude's reasoning.

The [prompt stashing feature](/blog/claude-code-ctrl-s-prompt-stashing) activated by **Ctrl+S** deserves special attention. When Claude is actively working on a task, Ctrl+S lets you queue up your next prompt without interrupting the current operation. This is a significant workflow improvement — instead of waiting for Claude to finish before typing your next instruction, you stash it and Claude picks it up automatically when the current task completes.

## Tool Approval Shortcuts

Claude Code's permission system involves approving or denying tool executions — file edits, shell commands, and other actions. These shortcuts speed up the approval flow so it doesn't become a bottleneck.

When Claude proposes an action and waits for approval, **y** or **Enter** approves the action. **n** denies it. These single-key responses keep the approval loop tight.

For batch operations where Claude is making many similar changes (like updating imports across 20 files), you can approve all remaining actions of the same type in one go rather than pressing Enter repeatedly. Watch for the prompt offering "allow all" options — accepting it tells Claude Code to proceed without per-action approval for that tool type during the current session.

You can also configure persistent permissions in your [Claude Code settings](/blog/claude-code-hooks-mastery) so that trusted operations (like reading files or running your test suite) never prompt for approval. This is a significant productivity gain once you've established trust with your workflow.

## Navigation and Context

These shortcuts help you explore and navigate within Claude Code's interface and output.

**Ctrl+R** triggers a reverse search through your prompt history, similar to bash's reverse-i-search. Type a fragment and it finds matching previous prompts. This is faster than pressing Up Arrow repeatedly when you need to find a specific prompt from earlier in the session.

**/help** displays all available slash commands and their descriptions. If you forget a command mid-session, this is your reference. It's context-aware — the list includes any custom skills loaded from your project's [SKILL.md files](/blog/5-claude-code-skills-i-use-every-single-day).

**/status** shows your current session state: which model you're using, whether fast mode is on, token usage, and other diagnostic information. Check this when you're unsure what mode you're operating in or want to monitor costs.

## Terminal Compatibility Tips

Claude Code's keyboard shortcuts depend on your terminal emulator passing key sequences correctly. If a shortcut isn't working, the issue is almost always your terminal configuration, not Claude Code.

**iTerm2 on macOS** works out of the box. All shortcuts, including Shift+Enter for multi-line input, function correctly with default settings.

**macOS Terminal.app** handles most shortcuts but may require enabling "Use Option as Meta key" in Preferences > Profiles > Keyboard for Alt-based shortcuts to work.

**tmux and screen users** need to be aware that these multiplexers intercept certain key sequences. Ctrl+B (tmux's default prefix) and Ctrl+A (screen's default prefix) will be captured by the multiplexer, not passed to Claude Code. If you use Ctrl+A for beginning-of-line in Claude Code, you'll need to either remap your tmux/screen prefix or press it twice.

**Windows Terminal via WSL** supports all shortcuts. The native Windows Terminal correctly passes Shift+Enter, Ctrl+C, and other sequences through to WSL. Older terminals like ConEmu may have issues with some key combinations.

If Shift+Enter doesn't create a newline in your terminal, use the backslash `\` at the end of a line as a fallback — it works universally across all terminal emulators.

## Quick Reference Table

| Shortcut | Action | When to Use |
|----------|--------|-------------|
| **Enter** | Submit prompt | Ready to send |
| **Shift+Enter** / `\` | New line | Multi-line prompts |
| **Escape** | Cancel input / soft stop | Change your mind or pause Claude |
| **Ctrl+C** | Hard interrupt | Stop a running command |
| **Ctrl+S** | Stash prompt | Queue next task while Claude works |
| **Ctrl+L** | Clear screen | Declutter terminal |
| **Ctrl+D** | Exit session | Done working |
| **Ctrl+R** | Reverse search history | Find a previous prompt |
| **Up Arrow** | Previous prompt | Retry or edit last input |
| **Tab** | Autocomplete | File paths and slash commands |
| **/fast** | Toggle fast mode | Quick queries vs deep tasks |
| **/verbose** | Toggle verbose output | Debug Claude's decisions |
| **/model** | Switch model | Optimize cost vs capability |
| **/compact** | Compress context | Long sessions slowing down |
| **/clear** | Reset conversation | Switch to unrelated task |

## Customizing Keybindings

Claude Code supports custom keybindings via `~/.claude/keybindings.json`. You can remap any default shortcut or add chord bindings (multi-key sequences) for commands you use frequently. This is particularly useful if Claude Code's defaults conflict with your terminal emulator or tmux configuration.

The keybindings file uses a straightforward JSON format where you specify the key combination and the action it triggers. If your workflow involves frequently switching between [extended thinking mode](/blog/claude-code-seven-programmable-layers) and fast mode, binding those to single keystrokes eliminates friction.

## Frequently Asked Questions

### How do I cancel input in Claude Code?

Press **Escape** to cancel your current input and clear the line. If Claude is already generating a response, Escape requests a soft stop. For a hard interrupt during command execution, press **Ctrl+C** once for a graceful stop or twice for a force-stop.

### Can I write multi-line prompts in Claude Code?

Yes. Press **Shift+Enter** to insert a newline without submitting your prompt. If your terminal doesn't support Shift+Enter, type a backslash `\` at the end of the line and press Enter — this works as a universal fallback across all terminal emulators.

### How do I switch models during a Claude Code session?

Type **/model** to change the underlying model without restarting your session. You can switch between Claude Opus, Sonnet, and Haiku on the fly. Use faster models for simple lookups and more capable models for complex multi-file reasoning tasks.

### What does Ctrl+S do in Claude Code?

**Ctrl+S** activates prompt stashing — it lets you type and queue your next instruction while Claude is still working on the current task. Claude picks up the stashed prompt automatically when it finishes, eliminating idle wait time between tasks.

### How do I toggle fast mode in Claude Code?

Type **/fast** to toggle fast mode on or off during any session. Fast mode uses the same Claude model but optimizes for faster output at the cost of thoroughness. It does not switch to a different, less capable model.

---

*Want more AI insights? [Subscribe to LoreAI](/subscribe) for daily briefings.*