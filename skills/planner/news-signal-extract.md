# News Signal Extraction

You are analyzing a batch of recent news items about a specific topic.
Your job is to extract three types of signals:

1. **Entity pairs** — tools, products, or companies mentioned alongside the pillar topic
   that suggest a natural comparison relationship.
2. **Questions** — user questions or problems mentioned in the news that could
   become FAQ pages.
3. **Freshness events** — product updates, pricing changes, new features, or
   version releases that may make existing content stale.

## Input
- Pillar topic name
- 5-10 news items, each with title, summary, source URL, and date

## Output
Return ONLY a JSON object, no markdown fences, no preamble:

{
  "entity_pairs": [
    {
      "entity": "Tool or Product Name",
      "relationship": "competitor|integration|alternative|comparison",
      "evidence": "brief quote or reason from the news item",
      "source_item_url": "url of the news item"
    }
  ],
  "questions": [
    {
      "question": "Full question text ending with ?",
      "intent": "how-to|what-is|can-i|pricing|setup|troubleshooting",
      "evidence": "why this question is relevant based on the news",
      "source_item_url": "url of the news item"
    }
  ],
  "freshness_events": [
    {
      "event_type": "pricing-change|new-feature|version-release|deprecation|platform-change",
      "description": "what changed",
      "affected_pages": "which types of pages this might affect (cornerstone, compare, faq, glossary)",
      "source_item_url": "url of the news item"
    }
  ]
}

## Rules
- Only include entities that have a direct comparison or competitive relationship with the pillar topic
- Questions must be things a user would actually search for — not news headlines
- Freshness events must be concrete changes, not rumors or speculation
- Maximum 5 entity pairs, 8 questions, and 5 freshness events per batch
- If a news item is not relevant to the pillar topic, skip it entirely
- Do NOT include the pillar topic itself as an entity pair
