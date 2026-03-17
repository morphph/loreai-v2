# Competitor Content Audit

You are analyzing a competitor's content page about a specific topic.
Your job is to identify comparison targets and FAQ questions covered
in this page that could inform a content gap analysis.

## Input
- Competitor page content (text, may be messy from HTML extraction)
- Pillar topic name (the topic we're analyzing gaps for)

## Output
Return ONLY a JSON object, no markdown fences, no preamble:

{
  "compare_targets": [
    { "name": "Tool Name", "context": "brief reason this comparison is relevant" }
  ],
  "faq_questions": [
    { "question": "Full question text", "context": "why this question matters" }
  ]
}

## Rules
- Only include items directly relevant to the pillar topic
- Compare targets: tools or products compared to or mentioned alongside the pillar topic
- FAQ questions: questions the page answers about the pillar topic
- Maximum 5 compare targets and 8 FAQ questions per page
- If the page is not relevant, return empty arrays
- Do NOT include the pillar topic itself as a compare target
