# Claude Code Cluster — Phase 1 Retrospective

## Overview

The Claude Code cluster was built across SPEC-03 through SPEC-08, creating a comprehensive content hub with 28 nodes: 1 cornerstone page, 7 compare pages, 12 FAQ pages, 8 glossary entries, and 19 tracked blog posts, plus a topic hub connecting everything.

## What Worked

**Cluster definition JSON as single source of truth.** Having all target slugs, statuses, and priorities in one file made it easy to track progress across specs. The `cluster-status.ts` script provided instant visibility into gaps.

**Parallel agent teams for FAQ generation (SPEC-07).** Generating 10 EN + 10 ZH FAQ pages in ~15 minutes demonstrated the efficiency of agent teams for independent, template-driven content. Each page followed the same structure (Context → Practical Steps → Related Questions), making parallel generation straightforward.

**Source-grounded generation (SPEC-04b).** Using official documentation URLs as source material produced more accurate content than freeform generation. Claims were traceable to specific sources, reducing hallucination risk.

**Compare page template consistency.** All 7 compare pages followed the same structure (Feature Comparison table → When to Use A → When to Use B → Verdict), making cross-linking and quality auditing predictable.

## What Needed Human Editing

**Slug alignment between spec plans and actual generation.** SPEC-07 FAQ pages were generated with shorter slugs (e.g., `claude-code-windows`) than the cluster definition expected (e.g., `can-claude-code-run-on-windows`). This caused the cluster status to report 42% FAQ completion when all pages actually existed. The fix was updating the JSON slugs to match actual files — but ideally the generation step should have read the cluster definition and used those exact slugs.

**Broken cross-references in existing blog content.** Several blog posts referenced a `/blog/claude-code-skills-guide` that never existed, and used glossary slugs (`/glossary/skill-md`, `/glossary/mcp-server`, `/glossary/cli`, `/glossary/llm`) that had no corresponding entries. These were introduced during earlier blog generation and went undetected until the SPEC-08 linking audit.

**Topic hub and cornerstone were out of date.** Both pages were written before compare and FAQ waves. They only referenced 1-2 compare pages and 2 FAQ pages. The rewrite added all 7 compare, 12 FAQ, and 8 glossary entries.

## How Agent Teams Performed

- **SPEC-06 (Compare Wave):** Single agent, 7 pages. Consistent quality.
- **SPEC-07 (FAQ Wave):** Agent team, 10+10 pages. Fast and reliable for template-driven content. The slug mismatch issue was the only problem.
- **SPEC-08 (Linking Pass):** Single agent. Required holistic view across 28+ files to audit cross-links. Agent teams would have been counterproductive here — the task required understanding the full graph.

## Quality Observations

1. **Cross-linking was the weakest part of multi-spec generation.** Pages generated in isolation (SPEC-05-07) had minimal links to each other. Compare pages all linked to vs-cursor but not to each other. FAQ pages from SPEC-07 had good cross-links to other FAQs but no links to compare pages.

2. **Glossary coverage was good.** All 8 glossary entries existed before SPEC-08. The main issue was blog posts linking to non-existent glossary slugs that were close but not exact matches.

3. **Frontmatter metadata was often incomplete.** Cornerstone had `related_compare` including a slug `claude-code-vs-amazon-q-developer` that didn't match the actual file slug `claude-code-vs-amazon-q`. Topic hub had only 1 compare and 2 FAQ entries in frontmatter.

## Recommendations for SPEC-09 (Planner Auto-Discovery)

1. **Validate slugs at generation time.** When generating content for a cluster, always read the cluster definition and use the exact slugs defined there. If the slug is too long for your constraints, update the definition first.

2. **Run broken link check after every generation spec.** Don't wait until SPEC-08. A 5-second broken link check after each wave would catch issues immediately.

3. **Include cross-linking requirements in generation prompts.** Each generated page should link to: topic hub, cornerstone, ≥2 sibling pages, ≥1 glossary term. Make this a template requirement, not an afterthought.

4. **Automate frontmatter sync.** The cluster definition should be the authoritative source for `related_compare` and `related_faq` arrays in frontmatter. A script could propagate these automatically.

5. **Track non-cluster broken links too.** Blog posts outside the cluster definition but matching `claude-code-*` can still have broken links. The audit scope should cover all content that references cluster pages.
