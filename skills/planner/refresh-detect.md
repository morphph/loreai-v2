# Refresh Detection

You are checking whether an existing content page contains stale information
based on a recent freshness signal (a product update, pricing change, new feature, etc.).

## Input
- Pillar topic name
- Page slug and type (compare, faq, cornerstone, glossary)
- Freshness signal: what changed, when, from which source
- Current page content

## Output
Return ONLY a JSON object, no markdown fences, no preamble:

{
  "is_stale": true or false,
  "severity": "high" | "medium" | "low",
  "affected_sections": ["Section Name 1", "Section Name 2"],
  "reason": "Specific explanation of what's wrong and what the correct info should be"
}

## Rules
- "is_stale" is true ONLY if the signal directly contradicts or invalidates
  specific content in the page
- Do NOT flag as stale if the signal is about something the page doesn't cover
- Do NOT flag as stale for minor wording preferences — only for factual inaccuracy
- Severity guide:
  - high: page states something factually wrong (wrong price, wrong feature claim)
  - medium: page omits something important that the signal reveals
  - low: page could be improved with new info but isn't wrong
- Be specific in affected_sections — use the actual heading names from the page
- Be specific in reason — state what the page says vs what reality now is
- If not stale, set severity to null, affected_sections to [], and reason to ""
