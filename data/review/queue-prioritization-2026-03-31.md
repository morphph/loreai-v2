# Keyword Queue Prioritization Report
**Date**: 2026-03-31 | **Total pending**: 608 items across 60 clusters

---

## Executive Summary

After reviewing all 608 queued keyword groups, I've identified **three tiers** of priority. The queue has significant quality issues — roughly 40% of items are **off-topic generic keywords** that got pulled in by keyword expansion tools (Serper/Exa) and have nothing to do with our actual product coverage. These should be dropped entirely.

**Key recommendation**: Focus on Claude Code-specific and Codex-specific content where we have genuine authority. Drop generic tech keywords that any site could rank for.

---

## TIER 1: GENERATE NOW (High confidence, strong ROI)

These are keywords with clear search intent, directly relevant to our coverage area, and likely to rank.

### 1. `claude-code-vs-alternatives` — COMPARE pages
**Why**: Head-to-head comparisons are commercial-intent gold. Searchers are ready to choose a tool.
| Keyword Group | Recommended Type | Priority |
|---|---|---|
| claude code vs github copilot | **compare** | HIGHEST |
| claude code vs windsurf | **compare** | HIGH |
| is claude code better than cursor | **compare** | HIGH |
| claude code vs cline | **compare** | HIGH |
| claude code free alternatives | **blog** (roundup) | HIGH |
| claude code pros and cons | **blog** | MEDIUM |
| switching from cursor to claude code | **blog** (migration guide) | MEDIUM |

**DROP**: "alternative of vs code" (too generic, not about Claude Code)

### 2. `claude-code-cost-pricing` — FAQ + Compare
**Why**: Pricing queries have very high conversion intent. People searching this are evaluating purchase.
| Keyword Group | Recommended Type | Priority |
|---|---|---|
| how much does claude code cost | **faq** | HIGHEST |
| claude code max vs pro plan | **compare** | HIGH |
| is claude code worth it | **faq** | HIGH |
| reduce claude code costs | **blog** (tips) | MEDIUM |

**DROP**: "cursor tokens limit", "cursor how to reduce token usage", "openai api cost pricing" — these are about OTHER products, not ours

### 3. `claude-code-hooks` — Blog + Glossary
**Why**: Hooks is a differentiating Claude Code feature with growing search interest.
| Keyword Group | Recommended Type | Priority |
|---|---|---|
| what are hooks in claude code | **glossary** | HIGH |
| claude code hooks: complete guide to workflow automation | **blog** (pillar) | HIGH |
| how to use hooks in claude code (2026) | **blog** (tutorial) | HIGH |

**DROP**: "how to effectively prompt a claude code" and "whats so special about the claude code" — misplaced in this cluster

### 4. `claude-code-mcp-servers` — Blog + Glossary
**Why**: MCP is a hot topic, Claude Code has strong MCP integration, high search interest.
| Keyword Group | Recommended Type | Priority |
|---|---|---|
| what is mcp claude code | **glossary** | HIGH |
| claude code mcp setup | **blog** (tutorial) | HIGH |
| how to integrate a mcp server | **blog** | MEDIUM |
| claude code mcp tools | **blog** | MEDIUM |

**DROP**: Generic MCP integration keywords (python, fastapi, langgraph) — off-topic

### 5. `codex` + `codex-cli` — Blog + FAQ + Compare
**Why**: Codex/OpenAI's new coding agent is a major news topic. We cover AI tools — this is our wheelhouse.
| Keyword Group | Recommended Type | Priority |
|---|---|---|
| codex vs claude code | **compare** | HIGHEST |
| how codex works | **blog** (explainer) | HIGH |
| guide to codex cli | **blog** (tutorial) | HIGH |
| codex pricing | **faq** | HIGH |
| is codex cli safe to use | **faq** | HIGH |
| codex cli vs claude code | **compare** | HIGH |
| what is codex cli | **glossary** | MEDIUM |

**DROP**: "codex definition", "codex vaticanus", "codex sinaiticus", "codex gigas", "what does codex mean in aztec" — these are about ANCIENT MANUSCRIPTS, not OpenAI Codex. Major noise pollution.
**DROP**: "gpt 5.4 (with 1m context) is officialy out", "codex lol", "codex, chatgpt" — noise

### 6. `claude-code-computer-use` — Blog + Glossary
**Why**: Computer use is brand new (just launched), very few articles exist, timely opportunity.
| Keyword Group | Recommended Type | Priority |
|---|---|---|
| how does claude code computer use work | **blog** (tutorial) | HIGHEST |
| computer use tool | **blog** (deep dive) | HIGH |
| what is gui automation | **glossary** | MEDIUM |

**DROP**: "what are the top 10 automation tools", "copilot computer use agent" — off-topic

### 7. `claude-code-installation-setup` — Blog
**Why**: Every new user searches this. High-volume, easy to rank for brand queries.
| Keyword Group | Recommended Type | Priority |
|---|---|---|
| how to install claude code | **blog** (tutorial) | HIGH |
| claude code setup guide | **blog** | HIGH |
| claude code prerequisites | **faq** | MEDIUM |

**DROP**: "installation & setup" (too generic), "windows installation setup" / "setup installation windows 10" — these are about WINDOWS OS installation, not Claude Code

### 8. `claude-code-output-styles` — Blog
**Why**: Unique Claude Code feature, good tutorial opportunity.
| Keyword Group | Recommended Type | Priority |
|---|---|---|
| built-in output styles | **blog** (guide) | HIGH |
| change your output style | **blog** (tutorial) | HIGH |
| claude code response customization | **blog** | MEDIUM |

---

## TIER 2: GENERATE SOON (Good but lower urgency)

### 9. `claude-code-common-workflows`
**Keep**: "how to debug with claude code", "claude code for product managers", "common dev workflows examples"
**DROP**: "the disasters every developer faces", "importance of efficient workflows" — generic fluff

### 10. `claude-code-plan-mode`
**Keep**: "claude code plan mode" specific keywords
**DROP**: Most items are generic ("ask for a high-level overview", "fix bugs efficiently") — not real search queries

### 11. `claude-code-subagents`
**Keep**: "claude code subagents examples", "approvals and sandbox controls"
**DROP**: Generic agent keywords

### 12. `claude-code-skills`
**Keep**: "skill.md structure", "the built-in skills"
**DROP**: "how good is the claude code actually" — misplaced

### 13. `claude-code-memory`
**Keep**: "how to use CLAUDE.md", "claude code project instructions file"
**DROP**: "claude memory vs claude md" — confusing naming

### 14. `claude-code-parallel-sessions`
**Keep**: "claude code parallel sessions", "how to run claude code in parallel", "claude code git worktree"
**DROP**: Generic git worktree keywords ("git worktree list", "git worktree lock") — we're not a git tutorial site

### 15. `claude-code-prompt-engineering`
**Keep**: "how to prompt claude code effectively", "context loading strategies"
**DROP**: Generic prompt engineering keywords

### 16. `claude-code-tdd-autonomous-testing`
**Keep**: "benefits of test-driven agent development"
**DROP**: "the babysitting tax", "stay in the loop" — these are article titles, not keywords

### 17. `codex-security`
**Keep**: "how codex security works", "codex security reviews"
**DROP**: "codex security printing house ltd" (a PRINT SHOP company, not OpenAI), "learn to find hidden vulnerabilities in autonomous ai agents" (article title), "dependency risk management" (generic)

### 18. `claude-code-agent-sdk`
**Keep**: "build autonomous agent claude sdk", "claude agent sdk python"
Most items are low-score but the topic is important as it grows.

---

## TIER 3: DROP OR DEPRIORITIZE

These clusters are mostly noise from keyword expansion and should be cancelled:

### Entire clusters to drop:
| Cluster | Why Drop |
|---|---|
| `claude-code-authentication` | 90% generic auth keywords ("add authenticator to verify sign-in", "login gov authenticator setup", "authentication and account setup google") — nothing about Claude Code auth |
| `claude-code-ci-cd-integration` | 80% generic CI/CD ("benefits of the ci/cd pipeline", "what is continuous integration") — keep only "claude code github actions" and "how to run claude code in ci" |
| `claude-code-cli-reference` | 70% generic CLI keywords ("10 examples of command line interface", "cli flags golang") — keep only Claude Code-specific ones |
| `claude-code-permissions` | 90% generic security ("what is access control", "role-based access control (rbac)", "data perimeter controls") — keep only "claude code permissions guide" |
| `claude-code-ide-integrations` | 70% generic ("autofix directly in your ide", "copilot ide integrations") — keep Claude Code-specific only |
| `claude-code-scheduled-tasks` | 100% off-topic ("how to create a recurring task in outlook 365", "how to schedule recurring tasks in planner") — NOTHING about Claude Code |
| `claude-code-slack-linear-integrations` | 90% generic ("connect multiple slack workspaces", "keep linear and slack in sync with unito") |
| `claude-code-remote-control` | 95% off-topic ("is there a way to remotely control an android phone", "can someone be watching everything i do on my phone") |
| `claude-code-desktop-app` | 70% generic ("best desktop app", "how do i open an app on desktop") |
| `claude-code-git-workflow` | 80% generic git keywords, not Claude Code specific |
| `claude-code-plugins` | 60% generic ("plugin development course", "wordpress plugin development") — keep Claude Code plugin keywords |
| `claude-code-non-technical-use-cases` | "what non-coding skills are in demand" and "6 figure non coding tech jobs" are clickbait, not our content |
| `codex-openai` | "codex linux" is ambiguous, and the rest are generic |
| All `codex-*` clusters scoring < 100 | Too granular, low volume. Merge into main codex clusters |

---

## Recommended Content Generation Order (Top 20)

Based on: relevance to our brand, search intent quality, ranking potential, topical timeliness.

| # | Keyword Group | Content Type | Cluster | Rationale |
|---|---|---|---|---|
| 1 | codex vs claude code | **compare** | codex | Hottest comparison query right now |
| 2 | how does claude code computer use work | **blog** | computer-use | Brand new feature, first-mover advantage |
| 3 | claude code vs github copilot | **compare** | vs-alternatives | High commercial intent, perennial |
| 4 | how much does claude code cost | **faq** | cost-pricing | Every buyer searches this |
| 5 | what are hooks in claude code | **glossary** | hooks | Differentiating feature |
| 6 | claude code mcp setup | **blog** | mcp-servers | MCP is trending topic |
| 7 | how codex works | **blog** | codex | Timely explainer for news topic |
| 8 | claude code vs windsurf | **compare** | vs-alternatives | Active competitor |
| 9 | how to install claude code | **blog** | installation | Entry-level funnel |
| 10 | is claude code better than cursor | **compare** | vs-alternatives | High-intent comparison |
| 11 | claude code hooks guide | **blog** | hooks | Tutorial pillar content |
| 12 | codex pricing | **faq** | codex-cli | Buyers searching for info |
| 13 | what is mcp claude code | **glossary** | mcp-servers | Definitional, ranks well |
| 14 | claude code max vs pro plan | **compare** | cost-pricing | Purchase decision query |
| 15 | built-in output styles | **blog** | output-styles | Unique feature tutorial |
| 16 | how to debug with claude code | **blog** | common-workflows | Practical workflow content |
| 17 | claude code for product managers | **blog** | common-workflows | Expands audience |
| 18 | is codex cli safe to use | **faq** | codex-cli | Trust/safety query |
| 19 | codex cli vs claude code | **compare** | codex-cli | Direct comparison |
| 20 | claude code parallel sessions | **blog** | parallel-sessions | Power user feature |

---

## Content Type Corrections

Many keyword groups have wrong content type assignments from B2 grouping. Key corrections:

| Current Assignment | Should Be | Examples |
|---|---|---|
| blog → for simple questions | **faq** | "is codex cli safe to use", "how much does claude code cost" |
| faq → for deep topics | **blog** | "claude code plugin.json manifest" (needs tutorial, not Q&A) |
| glossary → for comparisons | **compare** | None found |
| blog → for definitional | **glossary** | "what is gui automation", "what are hooks" |

---

## Items to Cancel (Recommended ~200 items)

**Category 1: Ancient manuscript / wrong "codex"** (~8 items)
- codex definition, codex gigas, codex sinaiticus, codex vaticanus, what does codex mean in aztec, what is a codex in christianity

**Category 2: Other products entirely** (~40 items)  
- Outlook/Planner recurring tasks, Windows installation, Google authenticator setup, login.gov, WordPress plugins, Databricks workflows, TeamViewer, RealVNC

**Category 3: Generic tech keywords not about our products** (~80 items)
- "what is access control", "role-based access control", "benefits of ci/cd pipeline", "10 examples of command line interface", "git worktree list", "what is continuous integration"

**Category 4: Article titles / press releases scraped as keywords** (~30 items)
- "openai launches codex security: a new era for app security", "learn to find hidden vulnerabilities in autonomous ai agents", "the babysitting tax"

**Category 5: Extremely generic** (~40 items)
- "what is a workflow", "installation & setup", "start a new project", "desktop application"

---

## Summary Stats After Recommended Pruning

| Metric | Before | After (est.) |
|---|---|---|
| Total pending | 608 | ~400 |
| Genuinely relevant | ~400 | ~400 |
| Content worth generating | ~150 | ~150 |
| Junk/off-topic | ~200 | 0 |
| Days of backlog (at 5/day) | 122 | 80 |
