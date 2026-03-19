/**
 * scripts/lib/seo/prompts.ts — Prompt construction for all SEO page types
 */
import {
  validateGlossary,
  validateFaq,
  validateCompare,
  validateTopicHub,
} from '../validate';
import { getRelatedSlugs, loadSkill, loadBlogSkill } from './helpers';
import type { SEOPageType, PageJob, ClusterDefinition, RefreshFlag } from './types';

// ============================================================
// Prompt builders for each page type
// ============================================================

export function buildGlossaryPrompt(job: PageJob, skill: string): { system: string; user: string } {
  const related = getRelatedSlugs(job.clusterSlug);

  const system = `${skill}

## Generation Task
Generate a GLOSSARY page for the term "${job.displayTerm}".

## Requirements
- Page type: Glossary (/glossary/${job.slug})
- Display term: ${job.displayTerm}
- Word count: 200-400 words (body only, not counting frontmatter)
- Structure: Definition -> Why it matters -> How it works -> Related terms
- First 1-2 sentences must directly answer "What is ${job.displayTerm}?"
- Output the FULL markdown file including the --- frontmatter block ---
- Frontmatter must include: title, slug, description, term, display_term, category, related_glossary, related_blog, related_compare, lang

## Available Internal Links
- Glossary: ${related.glossary.map(s => `/glossary/${s}`).join(', ') || 'none yet'}
- Blog: ${related.blog.map(s => `/blog/${s}`).join(', ') || 'none yet'}
- Compare: ${related.compare.map(s => `/compare/${s}`).join(', ') || 'none yet'}`;

  const user = `Write a glossary entry for "${job.displayTerm}" for LoreAI, an AI news platform. The term slug is "${job.slug}". Use only facts you are confident about — do not fabricate benchmarks, pricing, or capabilities.`;

  return { system, user };
}

export function buildFaqPrompt(job: PageJob, skill: string): { system: string; user: string } {
  const related = getRelatedSlugs(job.clusterSlug);
  const question = (job.context.question as string) || job.displayTerm;

  // Source grounding (populated by cluster mode source resolution)
  const sourceBlock = job.context._sourceGrounding
    ? (job.context._sourceGrounding as string)
    : '';

  const system = `${skill}

## Generation Task
Generate an FAQ page answering the question: "${question}"

## Requirements
- Page type: FAQ (/faq/${job.slug})
- Word count: 200-500 words (body only, not counting frontmatter)
- Structure: Direct answer first -> Context -> Practical steps (if applicable) -> Related questions
- First 1-2 sentences must directly answer the question
- Output the FULL markdown file including the --- frontmatter block ---
- Frontmatter must include: title, slug, description, category, related_glossary, related_blog, lang

## Available Internal Links
- Glossary: ${related.glossary.map(s => `/glossary/${s}`).join(', ') || 'none yet'}
- Blog: ${related.blog.map(s => `/blog/${s}`).join(', ') || 'none yet'}
- FAQ: ${related.faq.map(s => `/faq/${s}`).join(', ') || 'none yet'}
- Topic hub: /topics/${job.clusterSlug}

## Parent Topic
This question relates to the topic cluster: "${job.pillarTopic}"

## Interlinking Rules
- The page MUST link back to the topic hub: [${job.pillarTopic} topic hub](/topics/${job.clusterSlug})
- Include 2-3 related FAQ or compare links in a "Related Questions" section at the end${sourceBlock}`;

  const groundedInstruction = sourceBlock
    ? 'Ground your answer in the source material provided above.'
    : 'Use only facts you are confident about — do not fabricate details.';
  const user = `Write an FAQ page answering "${question}" for LoreAI, an AI news platform. ${groundedInstruction}`;

  return { system, user };
}

export function buildComparePrompt(job: PageJob, skill: string): { system: string; user: string } {
  const related = getRelatedSlugs(job.clusterSlug);
  const itemA = (job.context.item_a as string) || 'Item A';
  const itemB = (job.context.item_b as string) || 'Item B';

  // Source grounding (populated by cluster mode source resolution)
  const sourceBlock = job.context._sourceGrounding
    ? (job.context._sourceGrounding as string)
    : '';

  const system = `${skill}

## Generation Task
Generate a COMPARISON page: "${itemA} vs ${itemB}"

## Requirements
- Page type: Comparison (/compare/${job.slug})
- Item A: ${itemA}
- Item B: ${itemB}
- Word count: 400-800 words (body only, not counting frontmatter)
- Structure: Overview -> Feature table -> When to use A -> When to use B -> Verdict
- Must include a feature comparison table in markdown
- Be balanced, opinionated but fair — state a clear verdict
- Output the FULL markdown file including the --- frontmatter block ---
- Frontmatter must include: title, slug, description, item_a, item_b, category, related_glossary, related_blog, lang

## Available Internal Links
- Glossary: ${related.glossary.map(s => `/glossary/${s}`).join(', ') || 'none yet'}
- Blog: ${related.blog.map(s => `/blog/${s}`).join(', ') || 'none yet'}
- Compare: ${related.compare.map(s => `/compare/${s}`).join(', ') || 'none yet'}
- Topic hub: /topics/${job.clusterSlug}

## Interlinking Rules
- The Verdict section MUST end with a line linking to the topic hub and 2-3 sibling compare pages, e.g.: "For more on ${job.pillarTopic}, see the [${job.pillarTopic} topic hub](/topics/${job.clusterSlug}). Also see [X vs Y](/compare/...) and [X vs Z](/compare/...)."
- Use the Compare links listed above as sibling cross-links (pick 2-3 that are most relevant)${sourceBlock}`;

  const groundedInstruction = sourceBlock
    ? 'Ground all feature claims, pricing, and capabilities in the source material provided above.'
    : 'Use only facts you are confident about — do not fabricate benchmarks, pricing, or capabilities. If you are unsure about specific details, say so.';
  const user = `Write a comparison page for "${itemA} vs ${itemB}" for LoreAI, an AI news platform. Be fair to both products. ${groundedInstruction}`;

  return { system, user };
}

export function buildTopicHubPrompt(job: PageJob, skill: string): { system: string; user: string } {
  const related = getRelatedSlugs(job.clusterSlug);
  const relatedKeywords = (job.context.related_keywords as string[]) || [];
  const discussions = (job.context.discussions as string[]) || [];

  const system = `${skill}

## Generation Task
Generate a TOPIC HUB page for "${job.displayTerm}"

## Requirements
- Page type: Topic Hub (/topics/${job.slug})
- Pillar topic: ${job.displayTerm}
- Word count: 500-1000 words (body only, not counting frontmatter)
- Structure: Overview -> Latest developments -> Key features -> Common questions -> Comparisons -> All resources
- This is the central hub for all "${job.displayTerm}" content on the site
- Output the FULL markdown file including the --- frontmatter block ---
- Frontmatter must include: title, slug, description, pillar_topic, category, related_glossary, related_blog, related_compare, related_faq, lang

## Available Internal Links
- Glossary: ${related.glossary.map(s => `/glossary/${s}`).join(', ') || 'none yet'}
- Blog: ${related.blog.map(s => `/blog/${s}`).join(', ') || 'none yet'}
- Compare: ${related.compare.map(s => `/compare/${s}`).join(', ') || 'none yet'}
- FAQ: ${related.faq.map(s => `/faq/${s}`).join(', ') || 'none yet'}

## Interlinking Rules
- The "All Resources" section MUST link to ALL available glossary, compare, FAQ, and blog pages listed above — no orphan pages
- The "Comparisons" section MUST list ALL available compare pages
- The "Frequently Asked Questions" section MUST list ALL available FAQ pages

## Additional Context
- Mention count: ${job.context.mention_count || 'unknown'}
- Related search keywords: ${relatedKeywords.slice(0, 10).join(', ') || 'none'}
- Community discussions: ${discussions.slice(0, 5).join('; ') || 'none'}`;

  const user = `Write a topic hub page for "${job.displayTerm}" for LoreAI, an AI news platform. This should be the definitive overview page for this topic on our site. Use only facts you are confident about — do not fabricate details.`;

  return { system, user };
}

// ============================================================
// Cornerstone prompt
// ============================================================

export function buildCornerstonePrompt(
  cluster: ClusterDefinition,
  date: string,
  sourceGrounding?: string
): { system: string; user: string } {
  const blogSkill = loadBlogSkill();

  // Build list of cluster nodes for internal linking
  const clusterNodes: string[] = [];
  for (const c of cluster.target_compare) {
    clusterNodes.push(`- [${c.item_a} vs ${c.item_b}](/compare/${c.slug})`);
  }
  for (const f of cluster.target_faq) {
    clusterNodes.push(`- [${f.question}](/faq/${f.slug})`);
  }
  for (const g of cluster.target_glossary) {
    clusterNodes.push(`- [${g.display_term}](/glossary/${g.slug})`);
  }
  for (const b of cluster.tracked_blogs) {
    clusterNodes.push(`- [${b.title}](/blog/${b.slug})`);
  }

  const sourceBlock = sourceGrounding || '';

  const system = `${blogSkill}

## OVERRIDE: Cornerstone Page Mode

This is NOT a regular blog post. This is a **cornerstone page** — the definitive "everything you need to know" article for ${cluster.pillar_topic}. It should be the single best page on the internet for someone wanting to understand ${cluster.pillar_topic}.

### Cornerstone Requirements
- **Word count**: 1500-2500 words (significantly longer than a regular blog post)
- **Tone**: Authoritative guide, not a news article
- **Frontmatter**: Include \`cornerstone: true\` flag and \`category: DEV\`
- **Date**: Use today's date (${date})
- **Target keywords**: ${cluster.cornerstone.target_keywords.join(', ')}

### Required Structure
1. **What is ${cluster.pillar_topic}?** — Comprehensive overview (200-300 words)
2. **Getting Started** — Installation, setup, first steps (200-300 words)
3. **Key Features** — Core capabilities with examples (300-400 words)
4. **Common Workflows** — Practical usage patterns (200-300 words)
5. **Best Practices** — Tips from real usage (200-300 words)
6. **Resources** — Links to all cluster content (100-200 words)

### Cluster Content — MUST Link To
${clusterNodes.join('\n')}

Include these internal links naturally throughout the article. The Resources section should list all of them.${sourceBlock}`;

  const groundedInstruction = sourceBlock
    ? 'Ground all facts in the source material provided above.'
    : 'Use only facts you are confident about.';
  const user = `Write the definitive cornerstone page for "${cluster.pillar_topic}" for LoreAI. This page should be the ultimate guide that someone would bookmark. Slug: "${cluster.cornerstone.slug}". ${groundedInstruction}`;

  return { system, user };
}

// ============================================================
// Refresh prompts
// ============================================================

export function buildRefreshPrompt(
  flag: RefreshFlag,
  skill: string,
  existingContent: string,
  freshSources: string,
  clusterLinks: string
): { system: string; user: string } {
  const system = `${skill}

## REFRESH MODE — Updating Existing Page

You are REFRESHING an existing page, not creating from scratch.

### What's stale
${flag.reason}

### Affected sections
${flag.affected_sections.join(', ')}

### Fresh source material
${freshSources}

### Existing page content (for reference)
${existingContent}

### Cluster internal links (must be preserved)
${clusterLinks}

### CRITICAL REFRESH RULES
1. PRESERVE the page slug, title structure, and frontmatter schema exactly
2. PRESERVE all existing internal links that are still valid
3. UPDATE the affected sections with facts from the fresh source material
4. PRESERVE sections that are NOT affected — don't rewrite what isn't broken
5. Keep the same tone, length, and structure as the original
6. Update the date in frontmatter to today's date
7. If a fact from the old page contradicts the fresh source material, use the fresh source
8. If a detail is not in the fresh source material, keep the old version unless it's flagged as stale`;

  const user = `Refresh this ${flag.page_type} page. The stale sections are: ${flag.affected_sections.join(', ')}.
Reason for refresh: ${flag.reason}
Ground all updates in the fresh source material provided above.`;

  return { system, user };
}

export function buildRefreshZhAddendum(flag: RefreshFlag, newEnContent: string): string {
  const pageType = flag.page_type;
  if (pageType === 'blog') {
    return `

## 中文生成要求
- lang: zh
- 用中文撰写，不是翻译——基于刚刚更新的英文版内容独立创作中文版本
- 保持相同的 frontmatter 结构（lang 字段改为 zh）
- slug 保持不变: ${flag.slug}
- 正文字数: 1500-2500 字（中文字符计数，不含 frontmatter）
- 正文使用中文，但技术术语可保留英文
- 内部链接路径不变

## 刚更新的英文版内容（参考）
${newEnContent}`;
  }

  const typeLabels: Record<string, string> = {
    glossary: '术语表',
    faq: '常见问题',
    compare: '对比分析',
  };
  const wordRanges: Record<string, string> = {
    glossary: '200-350',
    faq: '200-450',
    compare: '350-700',
  };

  return `

## 中文生成要求
- lang: zh
- 用中文撰写，不是翻译——基于刚刚更新的英文版内容独立创作中文版本
- 保持相同的 frontmatter 结构（lang 字段改为 zh）
- slug 保持不变: ${flag.slug}
- 页面类型: ${typeLabels[pageType] || pageType}
- 正文字数: ${wordRanges[pageType] || '300-600'} 字（中文字符计数，不含 frontmatter）
- 正文使用中文，但技术术语可保留英文
- 内部链接路径不变
- 必须以以下 CTA 结尾:

---

*觉得有用？[订阅 LoreAI](/subscribe)，每天 5 分钟掌握 AI 动态。*

## 刚更新的英文版内容（参考）
${newEnContent}`;
}

// ============================================================
// Routing helpers
// ============================================================

export function buildPrompt(job: PageJob, skill: string): { system: string; user: string } {
  switch (job.type) {
    case 'glossary': return buildGlossaryPrompt(job, skill);
    case 'faq': return buildFaqPrompt(job, skill);
    case 'compare': return buildComparePrompt(job, skill);
    case 'topics': return buildTopicHubPrompt(job, skill);
  }
}

export function getValidatorForType(type: SEOPageType): (md: string) => { valid: boolean; errors: string[] } {
  switch (type) {
    case 'glossary': return validateGlossary;
    case 'faq': return validateFaq;
    case 'compare': return validateCompare;
    case 'topics': return validateTopicHub;
  }
}

export function getRefreshValidator(pageType: string): (md: string) => { valid: boolean; errors: string[] } {
  switch (pageType) {
    case 'compare': return validateCompare;
    case 'faq': return validateFaq;
    case 'glossary': return validateGlossary;
    default: {
      // Blog/cornerstone: basic frontmatter + length check
      return (body: string) => {
        const wordCount = body.split(/\s+/).length;
        if (wordCount < 200) return { valid: false, errors: [`Content too short: ${wordCount} words`] };
        return { valid: true, errors: [] };
      };
    }
  }
}

export function buildZhSystemAddendum(job: PageJob): string {
  const typeLabels: Record<SEOPageType, string> = {
    glossary: '术语表',
    faq: '常见问题',
    compare: '对比分析',
    topics: '专题中心',
  };
  const wordRanges: Record<SEOPageType, string> = {
    glossary: '200-350',
    faq: '200-450',
    compare: '350-700',
    topics: '450-900',
  };
  return `
## 中文生成要求
- lang: zh
- 用中文撰写，不是翻译——基于同一主题独立创作中文版本
- 保持相同的 frontmatter 结构（lang 字段改为 zh）
- slug 保持与英文版相同: ${job.slug}
- 页面类型: ${typeLabels[job.type]}
- 正文字数: ${wordRanges[job.type]} 字（中文字符计数，不含 frontmatter）
- 正文使用中文，但技术术语可保留英文（如 Claude Code, MCP, SKILL.md）
- 内部链接路径不变
- 必须以以下 CTA 结尾:

---

*觉得有用？[订阅 LoreAI](/subscribe)，每天 5 分钟掌握 AI 动态。*`;
}
