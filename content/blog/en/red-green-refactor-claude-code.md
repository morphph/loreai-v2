---
title: "Red Green Refactor: Why TDD Is the Best Way to Control AI Coding Agents"
date: 2026-03-10
slug: red-green-refactor-claude-code
description: "Red Green Refactor — a 20-year-old TDD practice — turns out to be the most effective way to get reliable, high-quality code from AI coding agents like Claude Code."
keywords: ["Red Green Refactor", "TDD AI coding", "Claude Code TDD", "test-driven development AI", "AI coding agents"]
category: TECHNIQUE
related_newsletter: 2026-03-10
related_glossary: [claude-code, tdd]
related_compare: []
related_topics: [claude-code]
lang: en
video_ready: true
video_hook: "A 20-year-old practice is the secret to getting reliable code from AI agents"
video_status: published
source_type: video
---

# Red Green Refactor: Why TDD Is the Best Way to Control AI Coding Agents

The most effective technique for getting reliable code from AI agents isn't a new prompting trick or a fancy framework — it's **Red Green Refactor**, a practice that's been around for over two decades. Originally popularized by Kent Beck in *Extreme Programming Explained*, [test-driven development](/glossary/tdd) turns out to be a near-perfect fit for controlling AI coding agents. The tight feedback loop of write-a-failing-test, make-it-pass, then refactor gives you exactly the kind of back pressure that eager code-generating models need. Here's how to apply it with **Claude Code** and why it matters more now than ever.

## What Red Green Refactor Actually Means

The cycle has three steps, and the colors come from CI status indicators:

1. **Red**: Write a failing test. Your test suite goes red. You're specifying the behavior you want *before* any implementation exists. You might write a test asserting that a database fetch returns the right shape of data — before the API method or even the DB schema exists.

2. **Green**: Write the minimal implementation to make the test pass. No more, no less. The CI goes green. The key word here is *minimal* — you're not writing beautiful code yet, just code that works.

3. **Refactor**: Now that you have a passing test suite acting as a safety net, reshape the code into something clean. Extract functions, rename variables, reorganize modules. The tests catch any regressions immediately.

This cycle repeats for each unit of behavior. It's simple, it's disciplined, and it produces code that's both correct and well-structured.

## Why TDD Is a Perfect Fit for AI Agents

For experienced engineers, Red Green Refactor has always been valuable. But it becomes *dramatically* more important when an AI agent is writing the code instead of you.

The core insight: **watching an agent go red-then-green gives you confidence without reading every line of code.**

Consider this sequence: Claude Code writes a test, you see it fail in the terminal output, then the agent writes an implementation — without modifying the test — and the test passes. If the agent didn't change the test assertion to game the result, it's genuinely hard to fake that cycle. The code actually does what the test says it should.

This changes your review workflow fundamentally. Instead of reading every implementation line, you can skim the test titles to understand *what* is being tested, trust that the red-to-green transition validates correctness, and then QA the completed chunk of work at the end to catch anything tests might have missed.

As Simon Willison has noted, the most disciplined form of TDD — test-first development where you confirm failure before implementing — is a "fantastic fit for coding agents." The practice provides exactly the structured feedback loop that keeps AI-generated code honest.

## The One-Test-at-a-Time Rule

Here's where most people get TDD with AI agents wrong: they let the model write all the tests at once.

LLMs love to create massive horizontal layers. Given the chance, an agent will happily generate 90 tests in a single file edit, then attempt to one-shot an implementation that passes all of them. The result? A pile of shallow, redundant tests that don't actually guide the implementation.

The fix is a simple constraint: **one test at a time.**

A well-structured TDD skill for [Claude Code](/glossary/claude-code) enforces this loop:

1. Write the next test (singular) for the next behavior
2. Run it — confirm it fails
3. Write the minimal code to pass that one test
4. Run the full suite — confirm everything is green
5. Repeat for the next behavior

This incremental approach produces tests that genuinely guide implementation. Each test captures a specific behavior that matters, rather than being one of 90 assertions generated in a batch. The tests become documentation of design decisions, not just coverage checkboxes.

After all behaviors are implemented and all tests pass, you enter the refactor phase: look for duplication, extract shared patterns, clean up naming. The full test suite protects you throughout.

## Technical Deep-Dive: Building a TDD Skill

To make Red Green Refactor systematic with Claude Code, you can encode it as a **SKILL.md** file. The key instructions:

```markdown
## Incremental Loop
For each remaining behavior:
1. Write ONE test that captures the next behavior
2. Run the test suite — confirm the new test FAILS
3. Write the MINIMAL implementation to make it pass
4. Run the full test suite — confirm ALL tests PASS
5. Do NOT proceed to the next behavior until green

## Rules
- Only one test at a time — never batch
- Never modify a test to make it pass
- Implementation should be minimal — refactor comes later
- If a test fails unexpectedly, fix the implementation, not the test
```

The "never modify a test to make it pass" rule is critical. Without it, agents will sometimes adjust test assertions when their implementation doesn't match — defeating the entire purpose. The "minimal implementation" rule prevents the agent from over-engineering during the green phase, keeping refactoring as a separate, protected step.

You can pair this with TypeScript's type system for additional back pressure. Strong types plus unit tests create two independent verification layers that constrain the agent's output quality from different angles.

## Why Code Quality Matters More Than Ever

There's an underappreciated dynamic at play: LLMs replicate the patterns they see in your codebase. If your existing code is well-structured with clear naming, consistent patterns, and good test coverage, the agent produces code that matches that standard. If your codebase is messy, the agent is happy to play in the mud.

This creates a virtuous or vicious cycle. Red Green Refactor actively builds the virtuous version — each cycle produces tested, then refactored code that raises the baseline quality of your codebase, which in turn improves the quality of future AI-generated code.

The broader principle: **AI agents need back pressure.** Models are eager to find the fastest path to "done." Without constraints, that eagerness produces working-but-fragile code. TDD, strong types, and linting rules aren't overhead — they're the guardrails that channel AI speed into AI quality.

## What You Should Do

1. **Add a TDD skill to your project today.** Create `skills/tdd/SKILL.md` with the one-test-at-a-time loop described above. The setup takes 10 minutes; the payoff is immediate.
2. **Enforce the red-green sequence explicitly.** Tell your agent to run tests after writing each test *and* after each implementation. Don't let it skip the "confirm it fails" step.
3. **Watch the output, not just the result.** The red-to-green transition is your primary verification signal. If you never see red, the agent isn't doing real TDD.
4. **Keep your codebase clean.** The quality of AI-generated code mirrors the quality of your existing code. Invest in refactoring — it compounds.
5. **Start with one feature.** Pick your next small feature, enforce Red Green Refactor, and compare the output quality to your usual workflow. The difference will convince you.

**Related**: [Today's newsletter](/newsletter/2026-03-10) covers the broader AI development landscape. See also: [Claude Code Skills Guide](/blog/claude-code-skills-guide) for how to build effective SKILL.md files.

---

*Found this useful? [Subscribe to AI News](/subscribe) for daily AI briefings.*