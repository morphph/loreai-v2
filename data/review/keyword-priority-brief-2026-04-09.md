# Keyword & Content Queue Priority Brief

> **Purpose:** Provide an external LLM with full context to re-prioritize all 273 pending content jobs against our business goals.

---

## Objective

You are a senior SEO strategist for **LoreAI** (loreai.dev), a bilingual (EN/ZH) AI news and knowledge platform. Our business goal is:

**Build topical authority (E-E-A-T / AEO) for two flagship topics: "Claude Code" (Anthropic's agentic CLI) and "OpenAI Codex" (OpenAI's coding agent).**

We want to become the definitive resource site that Google, AI search engines (Perplexity, ChatGPT search, Gemini), and developers turn to for comprehensive, up-to-date coverage of these tools.

### What we need from you

For each of the 273 pending content queue items below, assign a **new priority tier** (P0/P1/P2/P3/P4) and provide a brief rationale. Use these criteria:

| Tier | Meaning | When to assign |
|------|---------|---------------|
| **P0** | Must-have, create immediately | High search volume + direct product keyword + commercial/navigational intent. Critical gaps in our coverage. |
| **P1** | High value, create this week | Strong search intent + builds topical depth in an important cluster. Comparison pages that capture "vs" traffic. |
| **P2** | Medium value, create this month | Informational content that fills cluster gaps. Good for internal linking. |
| **P3** | Low value, create when capacity allows | Niche/long-tail. Low volume or tangential to core topics. Still on-topic. |
| **P4** | Candidate for pruning | Off-topic, duplicate intent already covered, or too generic to rank. Recommend cancel. |

### Factors to consider

1. **Search intent alignment** — Does someone searching this keyword actually want to learn about Claude Code or Codex? Or is it a generic term that happens to match?
2. **Cluster coverage gaps** — Clusters with 0 content pages need foundational pieces first (glossary/FAQ before deep blogs).
3. **Content type appropriateness** — Is "blog" the right format for this keyword, or should it be FAQ/glossary/compare?
4. **Commercial value** — Keywords with buying intent ("pricing", "free or paid", "vs competitor") drive conversions.
5. **Topical authority building** — Comprehensive coverage of a subtopic (e.g., having FAQ + blog + glossary for "MCP servers") signals authority to search engines.
6. **Freshness sensitivity** — Some keywords (changelog, pricing, new features) need current content; stale content hurts.
7. **Competitive gap** — Are other sites already ranking well for this? Can we realistically compete?

---

## Site Architecture

### Flagship Topics → Subtopics (Clusters)

Our content is organized into two flagship topics, each with subtopic clusters. Content pages belong to clusters.

#### Flagship Topic: Claude Code (29 subtopics)

| Cluster Slug | Subtopic | Active Groups | Content Pages | Pending Queue |
|-------------|----------|--------------|---------------|--------------|
| claude-code | (root hub) | 30 | 20 | 30 |
| claude-code-agent-sdk | Agent SDK | 6 | 2 | 5 |
| claude-code-authentication | Authentication & Account Setup | 6 | 0 | 6 |
| claude-code-ci-cd-integration | CI/CD & Automation Integration | 5 | 0 | 4 |
| claude-code-cli-reference | CLI Commands & Flags | 3 | 0 | 3 |
| claude-code-common-workflows | Common Dev Workflows | 3 | 0 | 3 |
| claude-code-computer-use | Computer Use & GUI Automation | 3 | 1 | 1 |
| claude-code-context-management | Context Management & Task Chunking | 2 | 0 | 2 |
| claude-code-cost-pricing | Cost, Pricing & Token Usage | 4 | 1 | 4 |
| claude-code-desktop-app | Desktop App | 3 | 0 | 3 |
| claude-code-git-workflow | Git Workflow Integration | 2 | 0 | 1 |
| claude-code-hooks | Hooks & Automation | 5 | 11 | 4 |
| claude-code-ide-integrations | IDE Integrations | 7 | 0 | 4 |
| claude-code-installation-setup | Installation & Setup | 4 | 0 | 4 |
| claude-code-interactive-mode | Interactive Mode & Keyboard Shortcuts | 1 | 0 | 1 |
| claude-code-mcp-servers | MCP Server Integration | 7 | 8 | 7 |
| claude-code-memory | Memory & CLAUDE.md | 5 | 1 | 5 |
| claude-code-non-technical-use-cases | Non-Technical & Non-Coding Use Cases | 4 | 2 | 3 |
| claude-code-output-styles | Output Styles & Response Customization | 5 | 0 | 5 |
| claude-code-parallel-sessions | Parallel Sessions & Git Worktrees | 2 | 0 | 2 |
| claude-code-permissions | Permissions & Security Controls | 5 | 0 | 4 |
| claude-code-plan-mode | Plan Mode | 10 | 0 | 10 |
| claude-code-plugins | Plugin Development | 4 | 3 | 3 |
| claude-code-prompt-engineering | Prompt Engineering for Claude Code | 7 | 0 | 6 |
| claude-code-remote-control | Remote Control & Mobile Access | 4 | 0 | 3 |
| claude-code-scheduled-tasks | Scheduled & Recurring Tasks | 1 | 0 | 1 |
| claude-code-skills | Skills & Slash Commands | 9 | 8 | 8 |
| claude-code-slack-linear-integrations | Slack, Linear & Project Tool Integrations | 5 | 0 | 2 |
| claude-code-subagents | Custom Subagents | 10 | 0 | 10 |
| claude-code-tdd-autonomous-testing | TDD with Autonomous Agents | 5 | 0 | 4 |
| claude-code-vs-alternatives | Claude Code vs Alternatives | 7 | 12 | 6 |

#### Flagship Topic: OpenAI Codex (27 subtopics)

| Cluster Slug | Subtopic | Active Groups | Content Pages | Pending Queue |
|-------------|----------|--------------|---------------|--------------|
| codex | (root hub) | 3 | 6 | 3 |
| codex-agents-md | AGENTS.md Configuration | 5 | 0 | 5 |
| codex-app | Codex Desktop App | 6 | 0 | 6 |
| codex-automation-and-scripting | Automation, Scripting & GitHub Actions | 2 | 0 | 2 |
| codex-changelog | Changelog & Release Notes | 1 | 0 | 1 |
| codex-cli | Codex CLI | 12 | 4 | 12 |
| codex-configuration | Configuration (config.toml) | 4 | 0 | 3 |
| codex-cookbook-and-examples | Cookbook & Practical Examples | 2 | 0 | 1 |
| codex-enterprise-administration | Enterprise Administration | 5 | 0 | 5 |
| codex-github-integration | GitHub Integration | 5 | 0 | 5 |
| codex-headless-and-sdk-mode | Headless Mode & SDK Integration | 5 | 0 | 5 |
| codex-ide-extension | IDE Extension | 4 | 0 | 4 |
| codex-legacy-model-disambiguation | Legacy Codex Model vs Codex Agent | 6 | 1 | 6 |
| codex-mcp-servers | MCP Server Integration | 3 | 0 | 3 |
| codex-models | Models & Model Selection | 3 | 0 | 3 |
| codex-non-coding-use-cases | Non-Coding Use Cases | 4 | 0 | 4 |
| codex-open-source-contributing | Open Source & Contributing | 4 | 0 | 4 |
| codex-openai | (OpenAI root) | 1 | 10 | 1 |
| codex-overview-and-capabilities | Overview & Core Capabilities | 2 | 0 | 2 |
| codex-plugins | Plugins & Extensions | 5 | 0 | 5 |
| codex-pr-review-workflow | Automated PR Review Workflow | 2 | 0 | 2 |
| codex-pricing-and-plans | Pricing & Access Plans | 4 | 0 | 4 |
| codex-prompting | Prompting Guide & Best Practices | 4 | 0 | 4 |
| codex-security | (security root) | 5 | 5 | 4 |
| codex-security-and-sandboxing | Security, Sandboxing & Cyber Safety | 4 | 0 | 3 |
| codex-setup-and-installation | Setup & Installation | 5 | 0 | 5 |
| codex-skills | Agent Skills | 3 | 0 | 3 |
| codex-subagents | Subagents & Parallel Tasks | 3 | 0 | 3 |
| codex-vs-competitors | Codex vs Competitors | 6 | 1 | 6 |
| codex-web-cloud | Codex Web & Cloud Tasks | 5 | 0 | 5 |

---

## All 273 Pending Content Queue Items

Each row is one content job to be prioritized. Format:
`job_id | cluster | content_type | current_score | intent | primary_keyword | keyword_count | all_keywords_in_group`

### P0 Current (score ≥ 1000)

```
374 | codex-openai | faq | 1500 | commercial | is codex free or paid | 1 | is codex free or paid
12 | codex-cli | glossary | 1400 | definitional | what is codex cli | 1 | codex cli
19 | codex-security | faq | 1050 | commercial | codex security review | 3 | codex security reddit, codex security review, codex security review skill
21 | codex-cli | compare | 1050 | commercial | codex cli vs claude code | 1 | codex cli vs claude code
123 | codex | compare | 1050 | commercial | codex, chatgpt | 1 | codex, chatgpt
```

### P1 Current (score 500-999)

```
198 | claude-code-interactive-mode | blog | 750 | informational | claude code keyboard shortcuts | 12 | claude code keyboard shortcuts, claude code interactive mode guide, claude code cancel input shortcut, claude code verbose mode toggle, claude code switch model during session, claude code fast mode shortcut, claude code extended thinking mode, claude code terminal compatibility settings, claude code session management, how to edit prompt in claude code, claude code input modes, what are the 20 keyboard shortcuts and their functions
199 | claude-code-mcp-servers | blog | 750 | informational | how to integrate a mcp server | 4 | how to integrate a mcp server, mcp server integration tutorial, mcp server integration example, mcp server integration
200 | claude-code-mcp-servers | faq | 750 | informational | how to connect to remote mcp server | 1 | how to connect to remote mcp server
201 | claude-code-subagents | blog | 750 | informational | claude code subagents examples | 5 | claude code subagent examples, claude code specialized agents workflow, claude code subagents examples, claude code subagents github, claude code subagents best practices
203 | claude-code-output-styles | faq | 750 | informational | claude code output styles github | 4 | output styles & response customization example, output styles & response customization github, claude code output styles github, claude code output style reddit
204 | claude-code-common-workflows | faq | 750 | informational | claude code model options | 5 | claude code model options, claude code response modes, claude code streaming output, claude code output customization options, claude code response format settings
205 | claude-code-common-workflows | blog | 750 | informational | claude code for product managers | 1 | claude code for product managers
206 | claude-code-hooks | blog | 750 | informational | how to effectively prompt a claude code | 1 | how to effectively prompt a claude code
207 | claude-code-hooks | blog | 750 | informational | whats so special about the claude code | 1 | whats so special about the claude code
209 | codex-cli | faq | 700 | informational | codex cli download | 5 | codex cli download, codex cli quickstart, codex cli commands, codex cli sandbox, codex cli help
210 | codex | faq | 700 | informational | codex desktop | 1 | codex desktop
211 | codex-cli | faq | 700 | informational | codex cli login | 2 | codex cli login, codex cli authentication
213 | claude-code-subagents | compare | 600 | informational | use subagents and custom agents in codex | 1 | use subagents and custom agents in codex
214 | claude-code-desktop-app | compare | 600 | informational | claude code desktop vs terminal | 2 | claude code desktop vs terminal, claude code desktop app features
215 | codex-security | faq | 525 | commercial | claude code security | 2 | claude code security, claude code security scanning
216 | codex-cli | glossary | 525 | definitional | codex cli skills | 1 | codex cli skills
217 | claude-code-skills | blog | 525 | informational | how can i add skills to a claude code | 2 | how can i add skills to a claude code, how to create custom skills
218 | claude-code-subagents | glossary | 500 | definitional | claude code subagents | 3 | claude code subagent system, claude code subagent architecture, claude code subagents
```

### P2 Current (score 200-499)

```
219 | codex-cli | glossary | 300 | definitional | codex cli subagents | 2 | codex cli subagents, codex subagents overview
220 | codex-cli | blog | 300 | informational | codex cli wsl | 1 | codex cli wsl
222 | claude-code-ide-integrations | faq | 300 | informational | claude code auto accept edits | 2 | claude code auto accept edits, claude code vscode integration
223 | claude-code-subagents | blog | 300 | informational | how to create subagents claude code | 2 | how to create subagents claude code, claude code subagent tutorial
224 | claude-code-memory | blog | 300 | informational | how to use CLAUDE.md | 2 | how to use CLAUDE.md, CLAUDE.md best practices
225 | claude-code-output-styles | faq | 300 | informational | output styles & response customization not working | 2 | output styles & response customization not working, claude code output styles troubleshooting
226 | claude-code-non-technical-use-cases | blog | 300 | informational | claude code for non technical users | 1 | claude code for non technical users
228 | claude-code-prompt-engineering | blog | 300 | informational | how to prompt claude code effectively | 2 | how to prompt claude code effectively, claude code prompt tips
229 | claude-code-prompt-engineering | faq | 300 | informational | claude code prompt examples | 2 | claude code prompt examples, claude code prompt templates
231 | codex-security | blog | 300 | informational | codex security setup | 2 | codex security setup, codex security configuration
232 | claude-code-prompt-engineering | faq | 250 | informational | claude prompt guide pdf | 1 | claude prompt guide pdf
233 | claude-code-tdd-autonomous-testing | faq | 250 | informational | test-driven development with autonomous agents pdf | 1 | test-driven development with autonomous agents pdf
234 | claude-code-git-workflow | blog | 240 | informational | how to use claude code with git | 3 | how to use claude code with git, claude code git workflow, claude code git integration guide
235 | codex-changelog | blog | 240 | informational | codex release notes | 3 | codex release notes, codex changelog latest, codex update history
236 | claude-code-installation-setup | blog | 216 | informational | how to install claude code | 3 | how to install claude code, claude code setup tutorial, claude code installation guide
237 | claude-code-common-workflows | blog | 216 | informational | how to debug with claude code | 3 | how to debug with claude code, claude code debugging workflow, claude code bug fix workflow
238 | claude-code-remote-control | blog | 216 | informational | claude code remote control | 4 | claude code remote access setup, claude code remote control, claude code mobile access, claude code ssh setup
239 | codex-automation-and-scripting | blog | 216 | informational | openai codex automation | 2 | openai codex automation, codex github actions
240 | codex-pr-review-workflow | blog | 216 | informational | codex automated pull request review | 2 | codex automated pull request review, codex pr review setup
241 | claude-code | faq | 210 | informational | how-do-i-set-up-claude-code-remote-control-on-my-phone | 1 | how-do-i-set-up-claude-code-remote-control-on-my-phone
242 | claude-code | faq | 210 | informational | what-types-of-vulnerabilities-can-claude-code-security-detec | 1 | what-types-of-vulnerabilities-can-claude-code-security-detec
243 | codex | glossary | 200 | definitional | codex ai | 1 | codex ai
244 | claude-code-memory | glossary | 200 | definitional | claude code project instructions file | 1 | claude code project instructions file
245 | claude-code-non-technical-use-cases | glossary | 200 | definitional | is claude code only for software development | 1 | is claude code only for software development
```

### P3 Current (score 100-199)

```
246 | codex-models | compare | 192 | informational | codex model comparison | 3 | codex model comparison, codex model selection guide, codex gpt-4.1 vs o4-mini
247 | codex-legacy-model-disambiguation | faq | 168 | informational | openai codex github copilot | 3 | openai codex github copilot, codex copilot relationship, github copilot codex history
248 | claude-code-plan-mode | compare | 144 | informational | plan mode cursor | 2 | plan mode cursor, plan mode ai coding comparison
249 | claude-code-vs-alternatives | compare | 144 | informational | claude code vs github copilot | 2 | claude code vs github copilot, github copilot vs claude code features
250 | codex-legacy-model-disambiguation | compare | 120 | informational | codex openai history | 2 | codex openai history, openai codex evolution
251 | codex-legacy-model-disambiguation | blog | 120 | informational | openai codex vs codex agent | 2 | openai codex vs codex agent, codex model vs codex tool
252 | claude-code | blog | 120 | informational | how to use claude code for beginners | 1 | how to use claude code for beginners
253 | claude-code | faq | 120 | informational | does-claude-code-work-with-jupyter-notebooks | 1 | does-claude-code-work-with-jupyter-notebooks
254 | claude-code | faq | 120 | informational | can-claude-code-help-non-programmers-build-apps | 1 | can-claude-code-help-non-programmers-build-apps
255 | claude-code | faq | 120 | informational | how-does-claude-code-handle-large-codebases | 1 | how-does-claude-code-handle-large-codebases
256 | claude-code | blog | 120 | informational | claude code tips and tricks 2026 | 1 | claude code tips and tricks 2026
257 | claude-code | compare | 120 | informational | claude code vs cursor comparison | 1 | claude code vs cursor comparison
258 | claude-code-subagents | blog | 100.8 | informational | claude code subagent vs agent | 1 | claude code subagent vs agent
259 | claude-code-authentication | faq | 100.8 | informational | claude code api key vs oauth | 1 | claude code api key vs oauth
260 | claude-code-authentication | blog | 100.8 | informational | claude code authentication guide | 2 | claude code authentication guide, claude code login troubleshooting
261 | claude-code-ci-cd-integration | blog | 100.8 | informational | claude code github actions | 2 | claude code github actions, claude code ci pipeline setup
262 | claude-code-ci-cd-integration | faq | 100.8 | informational | claude code ci cd best practices | 1 | claude code ci cd best practices
263 | claude-code-cost-pricing | faq | 100.8 | informational | claude code token usage optimization | 2 | claude code token usage optimization, claude code cost management
264 | claude-code-cost-pricing | blog | 100.8 | informational | claude code pricing breakdown 2026 | 2 | claude code pricing breakdown 2026, claude code cost comparison
265 | claude-code-desktop-app | blog | 100.8 | informational | claude code desktop app review | 2 | claude code desktop app review, claude code desktop vs web
266 | claude-code-desktop-app | faq | 100.8 | informational | claude code desktop shortcuts | 1 | claude code desktop shortcuts
267 | claude-code-ide-integrations | blog | 100.8 | informational | claude code vscode extension guide | 2 | claude code vscode extension guide, claude code jetbrains setup
268 | claude-code-installation-setup | faq | 100.8 | informational | claude code system requirements | 2 | claude code system requirements, claude code minimum requirements
269 | claude-code-memory | blog | 100.8 | informational | claude code memory management | 2 | claude code memory management, claude code context persistence
270 | claude-code-memory | faq | 100.8 | informational | how does claude code remember context | 1 | how does claude code remember context
271 | claude-code-mcp-servers | blog | 100.8 | informational | best mcp servers for claude code | 2 | best mcp servers for claude code, claude code mcp server list
272 | claude-code-mcp-servers | faq | 100.8 | informational | what is mcp in claude code | 1 | what is mcp in claude code
273 | claude-code-parallel-sessions | blog | 100.8 | informational | claude code parallel sessions guide | 2 | claude code parallel sessions guide, claude code git worktrees
274 | claude-code-parallel-sessions | faq | 100.8 | informational | how to run parallel claude code sessions | 1 | how to run parallel claude code sessions
275 | claude-code-permissions | blog | 100.8 | informational | claude code permissions guide | 2 | claude code permissions guide, claude code security settings
276 | claude-code-permissions | faq | 100.8 | informational | claude code permission denied fix | 1 | claude code permission denied fix
277 | claude-code-plan-mode | blog | 100.8 | informational | claude code plan mode tutorial | 2 | claude code plan mode tutorial, claude code plan mode workflow
278 | claude-code-plan-mode | faq | 100.8 | informational | what is claude code plan mode | 1 | what is claude code plan mode
279 | claude-code-plugins | blog | 100.8 | informational | claude code plugin development guide | 2 | claude code plugin development guide, claude code custom plugins
280 | claude-code-scheduled-tasks | faq | 100.8 | informational | claude code scheduled tasks setup | 1 | claude code scheduled tasks setup
```

### P4 Current (score < 100)

```
281 | claude-code-vs-alternatives | compare | 96 | informational | claude code vs openai codex | 2 | claude code vs openai codex, anthropic vs openai coding tools
282 | codex-vs-competitors | compare | 96 | informational | openai codex alternatives | 2 | openai codex alternatives, codex competitor analysis
283 | codex-vs-competitors | compare | 96 | informational | codex vs claude code which is better | 2 | codex vs claude code which is better, claude code vs codex comparison 2026
284 | claude-code-plugins | compare | 96 | informational | claude code plugin vs skill | 1 | claude code plugin vs skill
285 | claude-code-cost-pricing | compare | 96 | informational | claude code max vs pro plan | 2 | claude code max vs pro plan, claude code plan comparison
286 | claude-code-subagents | compare | 96 | informational | claude code subagent vs mcp server | 1 | claude code subagent vs mcp server
287 | claude-code-plan-mode | compare | 96 | informational | plan mode vs regular mode claude code | 1 | plan mode vs regular mode claude code
288 | claude-code-skills | blog | 84 | informational | claude code skill marketplace | 2 | claude code skill marketplace, community skills for claude code
289 | claude-code-skills | faq | 84 | informational | best skills for claude code | 1 | best skills for claude code
290 | claude-code-skills | compare | 84 | informational | claude code skills vs hooks | 1 | claude code skills vs hooks
291 | claude-code-hooks | faq | 84 | informational | claude code hooks troubleshooting | 2 | claude code hooks troubleshooting, claude code hook errors
292 | claude-code-hooks | compare | 84 | informational | claude code hooks vs mcp | 1 | claude code hooks vs mcp
293 | claude-code-agent-sdk | blog | 84 | informational | claude agent sdk tutorial | 2 | claude agent sdk tutorial, claude agent sdk getting started
294 | claude-code-agent-sdk | faq | 84 | informational | claude agent sdk vs claude code | 1 | claude agent sdk vs claude code
295 | claude-code-agent-sdk | compare | 84 | informational | claude agent sdk vs langchain | 1 | claude agent sdk vs langchain
296 | claude-code-mcp-servers | compare | 84 | informational | claude code mcp vs plugin | 1 | claude code mcp vs plugin
297 | claude-code-mcp-servers | glossary | 84 | informational | what is mcp protocol | 1 | what is mcp protocol
298 | claude-code-tdd-autonomous-testing | blog | 84 | informational | claude code automated testing guide | 2 | claude code automated testing guide, ai test generation claude
299 | claude-code-tdd-autonomous-testing | faq | 84 | informational | can claude code write tests | 1 | can claude code write tests
300 | claude-code-tdd-autonomous-testing | compare | 84 | informational | claude code testing vs copilot testing | 1 | claude code testing vs copilot testing
301 | codex-security | compare | 84 | informational | codex security vs claude code security | 1 | codex security vs claude code security
302 | codex-cli | blog | 84 | informational | codex cli advanced usage | 2 | codex cli advanced usage, codex cli tips
303 | codex-cli | faq | 84 | informational | codex cli vs codex app | 1 | codex cli vs codex app
304 | codex-cli | compare | 84 | informational | codex cli vs github copilot cli | 1 | codex cli vs github copilot cli
305 | claude-code-subagents | faq | 84 | informational | when to use subagents in claude code | 1 | when to use subagents in claude code
306 | claude-code-subagents | blog | 84 | informational | claude code multi-agent workflow | 2 | claude code multi-agent workflow, claude code agent orchestration
307 | claude-code-subagents | compare | 84 | informational | claude code subagents vs langchain agents | 1 | claude code subagents vs langchain agents
308 | claude-code-vs-alternatives | blog | 84 | informational | best ai coding tools 2026 | 2 | best ai coding tools 2026, ai coding assistant comparison
309 | claude-code-vs-alternatives | faq | 84 | informational | is claude code better than cursor | 1 | is claude code better than cursor
310 | claude-code-vs-alternatives | compare | 84 | informational | claude code vs aider | 1 | claude code vs aider
311 | claude-code | blog | 60 | informational | claude code beginner mistakes | 1 | claude code beginner mistakes
312 | claude-code | faq | 60 | informational | what-is-the-difference-between-claude-code-and-claude-ai | 1 | what-is-the-difference-between-claude-code-and-claude-ai
313 | claude-code | compare | 60 | informational | claude code free vs paid features | 1 | claude code free vs paid features
314 | claude-code | glossary | 60 | informational | claude code glossary of terms | 1 | claude code glossary of terms
315 | claude-code-plan-mode | blog | 60 | informational | claude code plan mode examples | 1 | claude code plan mode examples
316 | claude-code-plan-mode | faq | 60 | informational | claude code plan mode not working | 1 | claude code plan mode not working
317 | claude-code-plan-mode | glossary | 60 | informational | what is plan mode | 1 | what is plan mode
318 | claude-code-plan-mode | compare | 60 | informational | claude code plan mode vs regular | 1 | claude code plan mode vs regular
319 | codex-vs-competitors | blog | 60 | informational | codex vs cursor comparison | 1 | codex vs cursor comparison
320 | codex-vs-competitors | faq | 60 | informational | is codex better than claude code | 1 | is codex better than claude code
321 | codex-vs-competitors | glossary | 60 | informational | what is openai codex agent | 1 | what is openai codex agent
322 | codex-vs-competitors | compare | 60 | informational | codex vs aider | 1 | codex vs aider
323 | codex-open-source-contributing | blog | 60 | informational | codex open source vs proprietary | 2 | codex open source vs proprietary, openai codex open source status
324 | codex-open-source-contributing | faq | 60 | informational | is openai codex open source | 1 | is openai codex open source
325 | codex-open-source-contributing | compare | 60 | informational | codex open source alternatives | 1 | codex open source alternatives
326 | codex-open-source-contributing | glossary | 60 | informational | openai codex license | 1 | openai codex license
327 | claude-code-authentication | blog | 48 | informational | claude code sso setup | 1 | claude code sso setup
328 | claude-code-authentication | compare | 48 | informational | claude code auth vs copilot auth | 1 | claude code auth vs copilot auth
329 | claude-code-authentication | glossary | 48 | informational | claude code oauth scope | 1 | claude code oauth scope
330 | claude-code-ci-cd-integration | compare | 48 | informational | claude code ci vs copilot ci | 1 | claude code ci vs copilot ci
331 | claude-code-cli-reference | blog | 48 | informational | claude code cli cheat sheet | 1 | claude code cli cheat sheet
332 | claude-code-cli-reference | faq | 48 | informational | claude code cli flags list | 1 | claude code cli flags list
333 | claude-code-cli-reference | glossary | 48 | informational | claude code cli commands reference | 1 | claude code cli commands reference
334 | claude-code-context-management | blog | 48 | informational | claude code context window optimization | 1 | claude code context window optimization
335 | claude-code-context-management | faq | 48 | informational | how to manage context in claude code | 1 | how to manage context in claude code
336 | claude-code-cost-pricing | glossary | 48 | informational | claude code token pricing | 1 | claude code token pricing
337 | claude-code-ide-integrations | compare | 48 | informational | claude code vs copilot vscode | 1 | claude code vs copilot vscode
338 | claude-code-ide-integrations | glossary | 48 | informational | claude code editor support | 1 | claude code editor support
339 | claude-code-installation-setup | compare | 48 | informational | claude code install vs codex install | 1 | claude code install vs codex install
340 | claude-code-installation-setup | glossary | 48 | informational | claude code prerequisites | 1 | claude code prerequisites
341 | claude-code-memory | compare | 48 | informational | claude code memory vs copilot memory | 1 | claude code memory vs copilot memory
342 | claude-code-memory | glossary | 48 | informational | what is CLAUDE.md | 1 | what is CLAUDE.md
343 | claude-code-non-technical-use-cases | faq | 48 | informational | claude code for writing | 1 | claude code for writing
344 | claude-code-non-technical-use-cases | compare | 48 | informational | claude code vs chatgpt for non-coders | 1 | claude code vs chatgpt for non-coders
345 | claude-code-output-styles | blog | 48 | informational | claude code custom output format | 1 | claude code custom output format
346 | claude-code-output-styles | compare | 48 | informational | claude code output vs copilot output | 1 | claude code output vs copilot output
347 | claude-code-output-styles | glossary | 48 | informational | claude code markdown output | 1 | claude code markdown output
348 | claude-code-permissions | compare | 48 | informational | claude code permissions vs copilot permissions | 1 | claude code permissions vs copilot permissions
349 | claude-code-permissions | glossary | 48 | informational | claude code allowedTools | 1 | claude code allowedTools
350 | claude-code-plan-mode | blog | 48 | informational | claude code plan mode advanced strategies | 1 | claude code plan mode advanced strategies
351 | claude-code-plan-mode | faq | 48 | informational | how to exit plan mode claude code | 1 | how to exit plan mode claude code
352 | claude-code-prompt-engineering | blog | 48 | informational | claude code system prompt customization | 1 | claude code system prompt customization
353 | claude-code-prompt-engineering | compare | 48 | informational | claude code prompting vs copilot prompting | 1 | claude code prompting vs copilot prompting
354 | claude-code-prompt-engineering | glossary | 48 | informational | claude code prompt template | 1 | claude code prompt template
355 | claude-code-remote-control | faq | 48 | informational | claude code remote session troubleshooting | 1 | claude code remote session troubleshooting
356 | claude-code-remote-control | compare | 48 | informational | claude code remote vs codex cloud | 1 | claude code remote vs codex cloud
357 | claude-code-slack-linear-integrations | blog | 48 | informational | claude code slack integration guide | 1 | claude code slack integration guide
358 | claude-code-slack-linear-integrations | faq | 48 | informational | claude code linear integration setup | 1 | claude code linear integration setup
359 | claude-code-tdd-autonomous-testing | glossary | 48 | informational | autonomous testing agent | 1 | autonomous testing agent
360 | claude-code-vs-alternatives | compare | 48 | informational | claude code vs gemini cli | 1 | claude code vs gemini cli
361 | claude-code-agent-sdk | compare | 48 | informational | claude agent sdk vs openai agents sdk | 1 | claude agent sdk vs openai agents sdk
362 | claude-code-agent-sdk | glossary | 48 | informational | what is claude agent sdk | 1 | what is claude agent sdk
363 | claude-code-skills | glossary | 48 | informational | what are claude code skills | 1 | what are claude code skills
364 | claude-code-skills | compare | 48 | informational | claude code skills vs copilot extensions | 1 | claude code skills vs copilot extensions
365 | claude-code | faq | 42 | informational | what-keyboard-shortcuts-does-claude-code-support | 1 | what-keyboard-shortcuts-does-claude-code-support
366 | claude-code | blog | 42 | informational | claude code productivity workflow | 1 | claude code productivity workflow
367 | claude-code | compare | 42 | informational | claude code desktop vs web | 1 | claude code desktop vs web
368 | claude-code-plan-mode | compare | 42 | informational | plan mode gemini cli | 1 | plan mode gemini cli
369 | claude-code | faq | 33.6 | informational | how-to-use-claude-code-with-docker | 1 | how-to-use-claude-code-with-docker
370 | claude-code | blog | 33.6 | informational | claude code docker setup | 1 | claude code docker setup
371 | claude-code-vs-alternatives | blog | 33.6 | informational | claude code pros and cons | 1 | claude code pros and cons
372 | claude-code-hooks | faq | 22.4 | informational | claude code hooks not working | 1 | claude code hooks not working
373 | claude-code-mcp-servers | faq | 22.4 | informational | claude code mcp server error | 1 | claude code mcp server error
375 | claude-code-plugins | faq | 22.4 | informational | claude code plugin discovery | 1 | claude code plugin discovery
376 | claude-code-subagents | faq | 22.4 | informational | claude code subagent timeout | 1 | claude code subagent timeout
377 | claude-code-skills | faq | 22.4 | informational | claude code skill not loading | 1 | claude code skill not loading
378 | codex-cli | faq | 22.4 | informational | codex cli error fix | 1 | codex cli error fix
379 | codex-cli | blog | 22.4 | informational | codex cli troubleshooting | 2 | codex cli troubleshooting, codex cli common errors
380 | codex-agents-md | blog | 16 | informational | agents.md configuration guide | 2 | agents.md configuration guide, how to write agents.md
381 | codex-agents-md | faq | 16 | informational | what is agents.md in codex | 1 | what is agents.md in codex
382 | codex-agents-md | compare | 16 | informational | agents.md vs CLAUDE.md | 1 | agents.md vs CLAUDE.md
383 | codex-agents-md | glossary | 16 | informational | what is agents.md | 1 | what is agents.md
384 | codex-app | blog | 16 | informational | codex desktop app guide | 2 | codex desktop app guide, codex app features
385 | codex-app | faq | 16 | informational | codex app vs cli | 1 | codex app vs cli
386 | codex-app | compare | 16 | informational | codex app vs claude code desktop | 1 | codex app vs claude code desktop
387 | codex-app | glossary | 16 | informational | what is codex app | 1 | what is codex app
388 | codex-app | blog | 16 | informational | codex app setup guide | 1 | codex app setup guide
389 | codex-app | faq | 16 | informational | codex app login issues | 1 | codex app login issues
390 | codex-automation-and-scripting | faq | 16 | informational | codex github actions setup | 1 | codex github actions setup
391 | codex-configuration | blog | 16 | informational | codex config.toml guide | 1 | codex config.toml guide
392 | codex-configuration | faq | 16 | informational | codex configuration options | 1 | codex configuration options
393 | codex-configuration | glossary | 16 | informational | what is config.toml in codex | 1 | what is config.toml in codex
394 | codex-cookbook-and-examples | blog | 16 | informational | codex practical examples | 1 | codex practical examples
395 | codex-enterprise-administration | blog | 16 | informational | codex enterprise setup guide | 1 | codex enterprise setup guide
396 | codex-enterprise-administration | faq | 16 | informational | codex enterprise vs individual | 1 | codex enterprise vs individual
397 | codex-enterprise-administration | compare | 16 | informational | codex enterprise vs claude code enterprise | 1 | codex enterprise vs claude code enterprise
398 | codex-enterprise-administration | glossary | 16 | informational | codex admin console | 1 | codex admin console
399 | codex-enterprise-administration | faq | 16 | informational | codex enterprise pricing | 1 | codex enterprise pricing
400 | codex-github-integration | blog | 16 | informational | codex github integration guide | 1 | codex github integration guide
401 | codex-github-integration | faq | 16 | informational | codex github pr review | 1 | codex github pr review
402 | codex-github-integration | compare | 16 | informational | codex github vs copilot github | 1 | codex github vs copilot github
403 | codex-github-integration | glossary | 16 | informational | codex github integration | 1 | codex github integration
404 | codex-github-integration | faq | 16 | informational | codex github permissions | 1 | codex github permissions
405 | codex-headless-and-sdk-mode | blog | 16 | informational | codex headless mode guide | 1 | codex headless mode guide
406 | codex-headless-and-sdk-mode | faq | 16 | informational | codex sdk integration | 1 | codex sdk integration
407 | codex-headless-and-sdk-mode | compare | 16 | informational | codex headless vs claude agent sdk | 1 | codex headless vs claude agent sdk
408 | codex-headless-and-sdk-mode | glossary | 16 | informational | what is codex headless mode | 1 | what is codex headless mode
409 | codex-headless-and-sdk-mode | faq | 16 | informational | codex api integration | 1 | codex api integration
410 | codex-ide-extension | blog | 16 | informational | codex vscode extension guide | 1 | codex vscode extension guide
411 | codex-ide-extension | faq | 16 | informational | codex ide extension setup | 1 | codex ide extension setup
412 | codex-ide-extension | compare | 16 | informational | codex ide vs claude code ide | 1 | codex ide vs claude code ide
413 | codex-ide-extension | glossary | 16 | informational | codex ide extension | 1 | codex ide extension
414 | codex-legacy-model-disambiguation | faq | 16 | informational | is openai codex the same as codex agent | 1 | is openai codex the same as codex agent
415 | codex-legacy-model-disambiguation | compare | 16 | informational | codex model vs codex tool | 1 | codex model vs codex tool
416 | codex-legacy-model-disambiguation | glossary | 16 | informational | openai codex disambiguation | 1 | openai codex disambiguation
417 | codex-legacy-model-disambiguation | blog | 16 | informational | codex name confusion explained | 1 | codex name confusion explained
418 | codex-mcp-servers | blog | 16 | informational | codex mcp server setup | 1 | codex mcp server setup
419 | codex-mcp-servers | faq | 16 | informational | does codex support mcp | 1 | does codex support mcp
420 | codex-mcp-servers | glossary | 16 | informational | core mcp concepts | 1 | core mcp concepts
421 | codex-models | blog | 16 | informational | codex model selection guide | 1 | codex model selection guide
422 | codex-models | faq | 16 | informational | which model does codex use | 1 | which model does codex use
423 | codex-non-coding-use-cases | blog | 16 | informational | codex for non-developers | 1 | codex for non-developers
424 | codex-non-coding-use-cases | faq | 16 | informational | can codex help with writing | 1 | can codex help with writing
425 | codex-non-coding-use-cases | compare | 16 | informational | codex vs chatgpt for non-coding | 1 | codex vs chatgpt for non-coding
426 | codex-non-coding-use-cases | glossary | 16 | informational | codex non-coding capabilities | 1 | codex non-coding capabilities
427 | codex-overview-and-capabilities | blog | 16 | informational | openai codex complete guide | 1 | openai codex complete guide
428 | codex-overview-and-capabilities | glossary | 16 | informational | openai codex | 1 | openai codex
429 | codex-plugins | blog | 16 | informational | codex plugin development | 1 | codex plugin development
430 | codex-plugins | faq | 16 | informational | codex plugin marketplace | 1 | codex plugin marketplace
431 | codex-plugins | compare | 16 | informational | codex plugins vs claude code plugins | 1 | codex plugins vs claude code plugins
432 | codex-plugins | glossary | 16 | informational | codex plugin system | 1 | codex plugin system
433 | codex-plugins | faq | 16 | informational | how to install codex plugins | 1 | how to install codex plugins
434 | codex-pr-review-workflow | faq | 16 | informational | codex pr review setup | 1 | codex pr review setup
435 | codex-pricing-and-plans | blog | 16 | informational | codex pricing guide 2026 | 1 | codex pricing guide 2026
436 | codex-pricing-and-plans | faq | 16 | informational | codex free tier limits | 1 | codex free tier limits
437 | codex-pricing-and-plans | compare | 16 | informational | codex pricing vs claude code pricing | 1 | codex pricing vs claude code pricing
438 | codex-pricing-and-plans | glossary | 16 | informational | codex pricing tiers | 1 | codex pricing tiers
439 | codex-prompting | blog | 16 | informational | codex prompting best practices | 1 | codex prompting best practices
440 | codex-prompting | faq | 16 | informational | codex prompt examples | 1 | codex prompt examples
441 | codex-prompting | compare | 16 | informational | codex prompting vs claude code prompting | 1 | codex prompting vs claude code prompting
442 | codex-prompting | glossary | 16 | informational | codex prompt engineering | 1 | codex prompt engineering
443 | codex-security-and-sandboxing | blog | 16 | informational | codex sandbox explained | 1 | codex sandbox explained
444 | codex-security-and-sandboxing | faq | 16 | informational | is codex safe to use | 1 | is codex safe to use
445 | codex-security-and-sandboxing | compare | 16 | informational | codex sandboxing vs claude code permissions | 1 | codex sandboxing vs claude code permissions
446 | codex-setup-and-installation | blog | 16 | informational | codex installation guide | 1 | codex installation guide
447 | codex-setup-and-installation | faq | 16 | informational | codex system requirements | 1 | codex system requirements
448 | codex-setup-and-installation | compare | 16 | informational | codex setup vs claude code setup | 1 | codex setup vs claude code setup
449 | codex-setup-and-installation | glossary | 16 | informational | codex installation | 1 | codex installation
450 | codex-setup-and-installation | faq | 16 | informational | codex installation troubleshooting | 1 | codex installation troubleshooting
451 | codex-skills | blog | 16 | informational | codex agent skills guide | 1 | codex agent skills guide
452 | codex-skills | faq | 16 | informational | codex skills vs claude code skills | 1 | codex skills vs claude code skills
453 | codex-skills | glossary | 16 | informational | codex agent skills | 1 | codex agent skills
454 | codex-subagents | blog | 16 | informational | codex subagents guide | 1 | codex subagents guide
455 | codex-subagents | faq | 16 | informational | codex parallel task execution | 1 | codex parallel task execution
456 | codex-subagents | compare | 16 | informational | codex subagents vs claude code subagents | 1 | codex subagents vs claude code subagents
457 | codex-web-cloud | blog | 16 | informational | codex cloud tasks guide | 1 | codex cloud tasks guide
458 | codex-web-cloud | faq | 16 | informational | codex web vs desktop | 1 | codex web vs desktop
459 | codex-web-cloud | compare | 16 | informational | codex cloud vs claude code remote | 1 | codex cloud vs claude code remote
460 | codex-web-cloud | glossary | 16 | informational | codex web interface | 1 | codex web interface
461 | codex-web-cloud | faq | 16 | informational | codex cloud task limitations | 1 | codex cloud task limitations
462 | claude-code | faq | 4 | informational | prompt engineering for claude code reddit | 1 | prompt engineering for claude code reddit
```

---

## Expected Output Format

For each job, return a JSON array:

```json
[
  {
    "job_id": 374,
    "new_tier": "P0",
    "rationale": "Direct commercial keyword for Codex pricing — high intent, captures users evaluating the product."
  },
  ...
]
```

Also provide a **summary section** with:
1. How many jobs per new tier (P0/P1/P2/P3/P4)
2. Which clusters are over-represented in the queue and should be deprioritized
3. Which clusters have critical coverage gaps (0 content pages but high-value keywords)
4. Recommended content creation order for the top 30 jobs
5. Any jobs you recommend cancelling (P4) with reasoning
6. Content type mismatches you spotted (e.g., a keyword that's tagged as "blog" but should be "faq")
