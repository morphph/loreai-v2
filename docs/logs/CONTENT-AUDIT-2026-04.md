---
title: "Content Audit — April 2026"
status: active
category: log
last-updated: 2026-04-01
depends-on: []
---

# Content Audit — April 2026

**Date**: 2026-04-01
**Goal**: Build topical authority for Claude Code, Codex, and Gemini (competitive intelligence)
**Result**: Sunset 92 off-topic pages (EN+ZH combined), raised on-topic % from ~79% to ~97%

---

## Summary

| Category | Before | Sunset | After |
|---|---|---|---|
| Blog EN | 86 | 8 | 78 |
| Blog ZH | 80 | 7 | 73 |
| Glossary EN | 66 | 33 | 33 |
| Glossary ZH | 63 | 29 | 34 |
| Compare EN | 27 | 5 | 22 |
| Compare ZH | 25 | 3 | 22 |
| FAQ EN | 42 | 7 | 35 |
| FAQ ZH | 34 | 5 | 29 |
| **Total** | **423** | **~97** | **~326** |

---

## Blogs Sunset (8 EN + 7 ZH = 15 files)

All → 410 Gone via rewrite to `/api/gone`

| Slug | Reason |
|---|---|
| `a-unified-identity-defense-layer-why-pam-with-itdr-is-the-foundation-for-2026-security` | Enterprise PAM/ITDR security — zero relevance to AI coding tools |
| `add-explicit-threat-model-sync-step-per-repo` | Generic DevSecOps threat modeling |
| `edit-or-complete-a-recurring-task` | About Outlook/Google Tasks — spawned from junk keyword |
| `glm-ocr-open-source-image-to-text-model` | Chinese OCR model (ZhipuAI) |
| `google-ai-open-source-security-tools` | Google security tooling |
| `ivanhzhao-notion-thoughts` | Notion CEO thoughts on AI |
| `restaurant-voice-agent-gpt-realtime-tutorial` | GPT voice agent for restaurants |
| `tensorflow-trending-2026` | TensorFlow trending (EN only, no ZH) |

**Kept as Gemini flagship candidate**: `gemini-3-1-pro-complex-tasks` (linked from 52 files)

---

## Glossary Sunset (33 EN + 29 ZH = 62 files)

**Heavily-linked terms → 301 redirect to best equivalent:**
- `chatgpt` → `/glossary/openai`
- `ai-safety` → `/glossary/anthropic`
- `fine-tuning`, `reinforcement-learning`, `rlhf`, `huggingface`, `hugging-face`, `transformers`, `rag` → `/glossary`
- `gpt-54`, `whisper` → `/glossary/openai`

**All other terms → 301 redirect to `/glossary` index:**
`amazon`, `apple`, `qualcomm`, `figma`, `grammarly`, `meta`, `microsoft`, `nvidia`, `sakana-ai`, `openclaw`, `deepseek`, `gpt-2`, `gpt`, `qwen`, `qwen3`, `qwen35`, `ltx`, `dpo`, `diffusers`, `triton`, `open-weight-models`, `ai-regulation`, `autonomous-weapons`

---

## Compare Sunset (5 EN + 3 ZH = 8 files)

| Slug | Action |
|---|---|
| `anthropic-developer-program-vs-vercel-community` | 410 Gone |
| `anthropic-vs-google-ai-partnerships` | 301 → `/compare` |
| `openssf-scorecard-vs-slsa` | 410 Gone |
| `anthropic-partner-network-vs-openai-partner-program` | 410 Gone |
| `claude-partner-network-vs-openai-partner-program` | 410 Gone |

---

## FAQ Sunset (7 EN + 5 ZH = 12 files)

All → 410 Gone. Anthropic corporate/military policy FAQs unrelated to coding tools.

| Slug |
|---|
| `how-do-consulting-firms-join-the-claude-partner-network` |
| `how-does-anthropics-defense-engagement-differ-from-openais-a` |
| `how-much-is-anthropic-investing-in-the-claude-partner-networ` |
| `what-funding-and-resources-does-anthropic-provide-for-claude` |
| `what-guardrails-does-anthropic-propose-for-military-ai-use` |
| `what-is-anthropics-position-on-providing-ai-to-the-departmen` |
| `what-is-the-claude-partner-network` |

---

## Internal Link Rewiring

Files edited to remove links to sunset pages:

| File | Change |
|---|---|
| `glossary/en/google.md` | Unlinked TensorFlow reference |
| `glossary/en/langchain.md` | Removed restaurant-voice-agent from frontmatter + body |
| `glossary/zh/langchain.md` | Same + replaced voice agent link with agentic-coding |
| `glossary/en/ollama.md` | Unlinked Apple reference |
| `glossary/zh/ollama.md` | Same |
| `glossary/en/model-context-protocol.md` | Unlinked Figma reference |
| `glossary/zh/langchain.md` | Unlinked RAG glossary reference |
| `blog/en/gemini-3-1-pro-complex-tasks.md` | Unlinked TensorFlow reference |
| `blog/en/how-codex-security-works.md` | Removed threat-model + PAM links from frontmatter + body |
| `blog/zh/how-codex-security-works.md` | Removed from frontmatter |
| `blog/zh/integrate-claude-code-into-your-development-workflow.md` | Removed threat-model link |

---

## GSC Data

No per-URL GSC data available at time of audit (performance-cycle hasn't ingested per-page metrics yet). All sunset pages are recent (created March 2026) and unlikely to have meaningful Google impressions. Defaulted to 410 Gone for most, with 301 redirects for heavily-interlinked glossary terms.

---

## Flagship Topics After Audit

1. **Claude Code** — primary authority target
2. **Codex** — competitive intelligence + product coverage
3. **Gemini** — new flagship candidate (content exists, build out later)
