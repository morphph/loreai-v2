/**
 * B4 — Source-Grounded Content Generation (Core Orchestration)
 *
 * Loads pending jobs from create_queue, researches via Standard or Deep Research
 * pipeline, generates EN+ZH content via Claude, validates links, and writes output.
 *
 * @see docs/plans/specs/SPEC-B4-content-generation.md
 */

import fs from 'fs';
import path from 'path';
import { getDb } from './db';
import { upsertContent } from './db';
import { callClaudeWithRetry } from './ai';
import { sanitizeOutput } from './sanitize';
import { validateLinks } from './link-validator';
import {
  validateFaq,
  validateCompare,
  validateGlossary,
  validateTopicHub,
  validateBlogPost,
} from './validate';

import type { SerperSearchResponse, SERPDepthResult } from './serper';
import type { ContentsResult } from './exa';

// ── Types ──

export type ContentType =
  | 'faq'
  | 'compare'
  | 'glossary'
  | 'topic-hub'
  | 'blog'
  | 'deep-dive'      // future / manual-only — not auto-assigned by B2
  | 'cornerstone';    // future / manual-only — not auto-assigned by B2

export interface RefreshMeta {
  anomaly_type?: string;
  suggested_action?: string;
  detail?: string;
}

export interface QueueJob {
  job_id: number;
  keyword_group_id: number;
  content_type: ContentType;
  research_pipeline: 'standard' | 'deep_research';
  priority_score: number;
  status: string;
  primary_keyword: string;
  intent: string;
  cluster_slug: string | null;
  secondary_keywords: string[];
  is_refresh: boolean;
  existing_content?: string;
  refresh_meta?: RefreshMeta;
}

export interface SourcePack {
  primary_keyword: string;
  serp_results: Array<{
    title: string;
    link: string;
    snippet: string;
    position: number;
  }>;
  source_pages: Array<{
    url: string;
    title: string;
    text: string;
    word_count: number;
  }>;
  paa_questions: string[];
  related_searches: string[];
  serp_depth: {
    depth: 'short_answer' | 'long_form' | 'mixed';
    avg_snippet_length: number;
    has_answer_box: boolean;
  };
  research_pipeline: 'standard' | 'deep_research';
}

export interface GenerationContext {
  job: QueueJob;
  sourcePack: SourcePack;
  relatedSlugs: {
    glossary: string[];
    blog: string[];
    compare: string[];
    faq: string[];
  };
}

export interface GenerationResult {
  job_id: number;
  content_type: ContentType;
  slug: string;
  en: { success: boolean; filePath?: string; errors?: string[] };
  zh: { success: boolean; filePath?: string; errors?: string[] };
  link_validation?: {
    total_links: number;
    valid_links: number;
    broken_links_removed: number;
  };
}

export interface ContentGenRunResult {
  jobs_processed: number;
  pages_generated: { en: number; zh: number };
  pages_failed: { en: number; zh: number };
  broken_links_removed: number;
  api_calls: { serper: number; exa: number; claude: number; gemini: number };
}

export interface ContentGenOptions {
  limit: number;
  jobId?: number;
  contentType?: ContentType;
  dryRun: boolean;
  enOnly: boolean;
  skipValidation: boolean;
}

// ── Model Selection ──

const MODEL_MAP: Record<ContentType, string> = {
  faq: 'claude-haiku-4-5-20251001',
  glossary: 'claude-haiku-4-5-20251001',
  compare: 'claude-sonnet-4-20250514',
  'topic-hub': 'claude-sonnet-4-20250514',
  blog: 'claude-sonnet-4-20250514',
  'deep-dive': 'claude-opus-4-20250514',
  cornerstone: 'claude-opus-4-20250514',
};

// ── Validator Selection ──

export function getValidatorForType(
  contentType: ContentType,
): (md: string) => { valid: boolean; errors: string[] } {
  switch (contentType) {
    case 'faq':
      return validateFaq;
    case 'compare':
      return validateCompare;
    case 'glossary':
      return validateGlossary;
    case 'topic-hub':
      return validateTopicHub;
    case 'blog':
      return validateBlogPost;
    case 'deep-dive':
      return (md) => validateBlogPost(md, { maxWords: 5000 });
    case 'cornerstone':
      return (md) => validateBlogPost(md, { maxWords: 5000 });
  }
}

// ── ZH Word Ranges ──

const ZH_WORD_RANGES: Record<ContentType, string> = {
  faq: '200-450',
  compare: '350-700',
  glossary: '200-350',
  'topic-hub': '450-900',
  blog: '600-1200',
  'deep-dive': '2000-3500',
  cornerstone: '2000-3500',
};

const ZH_TYPE_LABELS: Record<ContentType, string> = {
  faq: '常见问题',
  compare: '对比分析',
  glossary: '术语表',
  'topic-hub': '专题中心',
  blog: '博客文章',
  'deep-dive': '深度分析',
  cornerstone: '基石页面',
};

// ── Stage 1: Load Jobs ──

export function loadJobs(opts: ContentGenOptions): QueueJob[] {
  const db = getDb();

  let sql: string;
  const params: unknown[] = [];

  if (opts.jobId) {
    sql = `
      SELECT cq.job_id, cq.keyword_group_id, cq.content_type, cq.research_pipeline,
             cq.priority_score, cq.status, cq.refresh_meta,
             kg.primary_keyword, kg.intent, kg.cluster_slug
      FROM create_queue cq
      JOIN keyword_groups kg ON cq.keyword_group_id = kg.group_id
      WHERE cq.job_id = ?
    `;
    params.push(opts.jobId);
  } else {
    sql = `
      SELECT cq.job_id, cq.keyword_group_id, cq.content_type, cq.research_pipeline,
             cq.priority_score, cq.status, cq.refresh_meta,
             kg.primary_keyword, kg.intent, kg.cluster_slug
      FROM create_queue cq
      JOIN keyword_groups kg ON cq.keyword_group_id = kg.group_id
      WHERE cq.status IN ('pending', 'partial')
    `;

    if (opts.contentType) {
      sql += ' AND cq.content_type = ?';
      params.push(opts.contentType);
    }

    sql += ' ORDER BY cq.priority_score DESC LIMIT ?';
    params.push(opts.limit);
  }

  const rows = db.prepare(sql).all(...params) as Array<{
    job_id: number;
    keyword_group_id: number;
    content_type: string;
    research_pipeline: string;
    priority_score: number;
    status: string;
    refresh_meta: string | null;
    primary_keyword: string;
    intent: string;
    cluster_slug: string | null;
  }>;

  // Prepared statements for refresh resolution
  const findContentBySlug = db.prepare(
    "SELECT type, body_markdown FROM content WHERE slug = ? AND lang = 'en' LIMIT 1",
  );
  const findGroupType = db.prepare(
    'SELECT content_type FROM keyword_groups WHERE group_id = ?',
  );

  // Load secondary keywords for each job
  return rows.map((row) => {
    const secondaryKws = db
      .prepare(
        'SELECT keyword FROM keywords WHERE keyword_group_id = ? AND keyword != ?',
      )
      .all(row.keyword_group_id, row.primary_keyword) as Array<{ keyword: string }>;

    const isRefresh = row.content_type === 'refresh';
    let resolvedType: ContentType = row.content_type as ContentType;
    let existingContent: string | undefined;
    let refreshMeta: RefreshMeta | undefined;

    if (isRefresh) {
      // Parse refresh_meta
      if (row.refresh_meta) {
        try { refreshMeta = JSON.parse(row.refresh_meta); } catch { /* ignore malformed */ }
      }

      // Resolve original content type from existing content
      const slug = row.primary_keyword.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
      const content = findContentBySlug.get(slug) as { type: string; body_markdown: string | null } | undefined;

      if (content) {
        resolvedType = dirTypeToContentType(content.type);
        if (content.body_markdown) existingContent = content.body_markdown;
      } else {
        // Fallback: check keyword_group's own content_type
        const group = findGroupType.get(row.keyword_group_id) as { content_type: string } | undefined;
        if (group && group.content_type !== 'refresh' && isValidContentType(group.content_type)) {
          resolvedType = group.content_type as ContentType;
        } else {
          resolvedType = 'blog';
        }
      }
    }

    return {
      job_id: row.job_id,
      keyword_group_id: row.keyword_group_id,
      content_type: resolvedType,
      research_pipeline: row.research_pipeline as 'standard' | 'deep_research',
      priority_score: row.priority_score,
      status: row.status,
      primary_keyword: row.primary_keyword,
      intent: row.intent,
      cluster_slug: row.cluster_slug,
      secondary_keywords: secondaryKws.map((k) => k.keyword),
      is_refresh: isRefresh,
      existing_content: existingContent,
      refresh_meta: refreshMeta,
    };
  });
}

const VALID_CONTENT_TYPES = new Set<string>(['faq', 'compare', 'glossary', 'topic-hub', 'blog', 'deep-dive', 'cornerstone']);

function isValidContentType(t: string): t is ContentType {
  return VALID_CONTENT_TYPES.has(t);
}

// ── Stage 2: Research Pipelines ──

export async function runStandardResearch(
  job: QueueJob,
): Promise<{ sourcePack: SourcePack; apiCalls: { serper: number; exa: number } }> {
  const apiCalls = { serper: 0, exa: 0 };

  // Dynamic import to avoid hard dependency
  let searchFull: typeof import('./serper').searchFull;
  let detectSERPDepth: typeof import('./serper').detectSERPDepth;
  let getContents: typeof import('./exa').getContents;
  let countWords: typeof import('./exa').countWords;

  try {
    const serperMod = await import('./serper');
    searchFull = serperMod.searchFull;
    detectSERPDepth = serperMod.detectSERPDepth;
  } catch {
    throw new Error('Failed to import serper module');
  }

  try {
    const exaMod = await import('./exa');
    getContents = exaMod.getContents;
    countWords = exaMod.countWords;
  } catch {
    throw new Error('Failed to import exa module');
  }

  // Step 1: Serper search
  let serpData: SerperSearchResponse;
  try {
    serpData = await searchFull(job.primary_keyword);
    apiCalls.serper++;
    console.log(
      `    Found ${serpData.organic?.length ?? 0} organic results, ${serpData.peopleAlsoAsk?.length ?? 0} PAA questions`,
    );
  } catch (err) {
    console.warn(`    Serper search failed: ${(err as Error).message}`);
    serpData = {
      searchParameters: { q: job.primary_keyword, gl: 'us', hl: 'en', type: 'search' },
      organic: [],
    };
  }

  // Step 2: SERP depth detection
  let serpDepth: SERPDepthResult | null = null;
  try {
    serpDepth = await detectSERPDepth(job.primary_keyword);
    apiCalls.serper++;
  } catch (err) {
    console.warn(`    SERP depth detection failed: ${(err as Error).message}`);
  }

  // Step 3: Exa getContents for top 5 URLs
  const top5Urls = (serpData.organic || []).slice(0, 5).map((r) => r.link);
  let sourcePages: SourcePack['source_pages'] = [];

  if (top5Urls.length > 0) {
    try {
      const contentsResult: ContentsResult = await getContents(top5Urls, {
        text: { maxCharacters: 3000 },
      });
      apiCalls.exa++;

      sourcePages = contentsResult.pages
        .filter((p) => countWords(p.text) >= 100)
        .map((p) => ({
          url: p.url,
          title: p.title,
          text: p.text,
          word_count: p.word_count,
        }));

      const filtered = contentsResult.pages.length - sourcePages.length;
      console.log(
        `    ${sourcePages.length}/${contentsResult.pages.length} pages fetched${filtered > 0 ? ` (${filtered} filtered < 100 words)` : ''}`,
      );
    } catch (err) {
      console.warn(`    Exa getContents failed: ${(err as Error).message}`);
      // Fallback: use Serper snippets as degraded source
      sourcePages = (serpData.organic || []).slice(0, 5).map((r) => ({
        url: r.link,
        title: r.title,
        text: r.snippet,
        word_count: r.snippet.split(/\s+/).length,
      }));
    }
  }

  const sourcePack: SourcePack = {
    primary_keyword: job.primary_keyword,
    serp_results: (serpData.organic || []).map((r) => ({
      title: r.title,
      link: r.link,
      snippet: r.snippet,
      position: r.position,
    })),
    source_pages: sourcePages,
    paa_questions: (serpData.peopleAlsoAsk || []).map((p) => p.question),
    related_searches: (serpData.relatedSearches || []).map((r) => r.query),
    serp_depth: {
      depth: serpDepth?.depth ?? 'mixed',
      avg_snippet_length: serpDepth?.avg_snippet_length ?? 0,
      has_answer_box: serpDepth?.has_answer_box ?? false,
    },
    research_pipeline: 'standard',
  };

  return { sourcePack, apiCalls };
}

export async function runDeepResearch(
  job: QueueJob,
): Promise<{
  sourcePack: SourcePack;
  apiCalls: { serper: number; exa: number; gemini: number };
  usedFallback: boolean;
}> {
  const apiCalls = { serper: 0, exa: 0, gemini: 0 };

  // Dynamic import
  let runGeminiDeepResearch: typeof import('./gemini-research').runGeminiDeepResearch;
  try {
    const geminiMod = await import('./gemini-research');
    runGeminiDeepResearch = geminiMod.runGeminiDeepResearch;
  } catch {
    throw new Error('Failed to import gemini-research module');
  }

  const slug = job.primary_keyword.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  const outputDir = path.join(process.cwd(), 'tmp', 'research');
  fs.mkdirSync(outputDir, { recursive: true });
  const outputPath = path.join(outputDir, `${slug}.md`);

  const topic = `${job.primary_keyword} — comprehensive guide for ${job.content_type}`;
  const success = await runGeminiDeepResearch(topic, outputPath);
  apiCalls.gemini++;

  if (success && fs.existsSync(outputPath)) {
    const researchOutput = fs.readFileSync(outputPath, 'utf-8');
    const wordCount = researchOutput.split(/\s+/).filter(Boolean).length;

    // Optionally supplement with Serper PAA
    let paaQuestions: string[] = [];
    try {
      const serperMod = await import('./serper');
      const paaResult = await serperMod.searchPAA(job.primary_keyword);
      apiCalls.serper++;
      paaQuestions = paaResult.questions.map((q) => q.question);
    } catch {
      // PAA supplement is optional
    }

    const sourcePack: SourcePack = {
      primary_keyword: job.primary_keyword,
      serp_results: [],
      source_pages: [
        {
          url: 'gemini-research',
          title: topic,
          text: researchOutput,
          word_count: wordCount,
        },
      ],
      paa_questions: paaQuestions,
      related_searches: [],
      serp_depth: {
        depth: 'long_form',
        avg_snippet_length: 0,
        has_answer_box: false,
      },
      research_pipeline: 'deep_research',
    };

    return { sourcePack, apiCalls, usedFallback: false };
  }

  // Fallback to standard pipeline
  console.warn('    Deep Research failed, falling back to Standard pipeline');
  const standardResult = await runStandardResearch(job);
  return {
    sourcePack: {
      ...standardResult.sourcePack,
      research_pipeline: 'deep_research', // Keep original label
    },
    apiCalls: {
      ...apiCalls,
      serper: apiCalls.serper + standardResult.apiCalls.serper,
      exa: apiCalls.exa + standardResult.apiCalls.exa,
    },
    usedFallback: true,
  };
}

// ── Stage 3: Prompt Building ──

let _skillContent: string | null = null;

export function setSkillContent(content: string): void {
  _skillContent = content;
}

function loadSkill(): string {
  if (_skillContent) return _skillContent;
  const skillPath = path.join(process.cwd(), 'skills', 'seo', 'SKILL.md');
  return fs.readFileSync(skillPath, 'utf-8');
}

let _refreshSkillContent: string | null = null;

export function setRefreshSkillContent(content: string): void {
  _refreshSkillContent = content;
}

function loadRefreshSkill(): string {
  if (_refreshSkillContent) return _refreshSkillContent;
  const skillPath = path.join(process.cwd(), 'skills', 'seo-refresh', 'SKILL.md');
  return fs.readFileSync(skillPath, 'utf-8');
}

function dirTypeToContentType(dirType: string): ContentType {
  if (dirType === 'topics') return 'topic-hub';
  return dirType as ContentType;
}

function getRelatedSlugs(clusterSlug: string | null): {
  glossary: string[];
  blog: string[];
  compare: string[];
  faq: string[];
} {
  if (!clusterSlug) return { glossary: [], blog: [], compare: [], faq: [] };

  const db = getDb();
  const keywords = db
    .prepare(
      'SELECT keyword, content_type, content_slug FROM keywords WHERE cluster_slug = ? AND content_exists = 1',
    )
    .all(clusterSlug) as Array<{
    keyword: string;
    content_type: string | null;
    content_slug: string | null;
  }>;

  const glossary: string[] = [];
  const blog: string[] = [];
  const compare: string[] = [];
  const faq: string[] = [];

  for (const kw of keywords) {
    if (kw.content_type === 'glossary' && kw.content_slug) glossary.push(kw.content_slug);
    if (kw.content_type === 'blog' && kw.content_slug) blog.push(kw.content_slug);
    if (kw.content_type === 'compare' && kw.content_slug) compare.push(kw.content_slug);
    if (kw.content_type === 'faq' && kw.content_slug) faq.push(kw.content_slug);
  }

  // Also check content table directly
  const glossaryContent = db
    .prepare("SELECT slug FROM content WHERE type = 'glossary' AND lang = 'en' LIMIT 10")
    .all() as Array<{ slug: string }>;
  for (const c of glossaryContent) {
    if (!glossary.includes(c.slug)) glossary.push(c.slug);
  }

  const blogContent = db
    .prepare(
      "SELECT slug FROM content WHERE type = 'blog' AND lang = 'en' ORDER BY created_at DESC LIMIT 5",
    )
    .all() as Array<{ slug: string }>;
  for (const c of blogContent) {
    if (!blog.includes(c.slug)) blog.push(c.slug);
  }

  return {
    glossary: glossary.slice(0, 5),
    blog: blog.slice(0, 3),
    compare: compare.slice(0, 3),
    faq: faq.slice(0, 3),
  };
}

function buildSourceMaterialSection(sourcePack: SourcePack): string {
  let section = `## Source Material — DO NOT fabricate beyond these sources\n\n`;

  // SERP Analysis
  section += `### SERP Analysis\n`;
  if (sourcePack.serp_results.length > 0) {
    section += `- Top results:\n`;
    for (const r of sourcePack.serp_results.slice(0, 5)) {
      section += `  ${r.position}. [${r.title}](${r.link}) — ${r.snippet.slice(0, 150)}\n`;
    }
  }
  if (sourcePack.paa_questions.length > 0) {
    section += `- People Also Ask:\n`;
    for (const q of sourcePack.paa_questions) {
      section += `  - ${q}\n`;
    }
  }
  if (sourcePack.related_searches.length > 0) {
    section += `- Related searches: ${sourcePack.related_searches.join(', ')}\n`;
  }
  section += `- SERP depth: ${sourcePack.serp_depth.depth}\n\n`;

  // Source Pages
  if (sourcePack.source_pages.length > 0) {
    section += `### Source Pages\n`;
    for (const page of sourcePack.source_pages) {
      section += `#### ${page.title} (${page.url})\n`;
      section += `${page.text.slice(0, 3000)}\n\n`;
    }
  }

  return section;
}

function getContentTypeInstructions(contentType: ContentType): string {
  switch (contentType) {
    case 'blog':
      return `## Generation Task — Blog Post
- Lead with the news event or key insight, then provide analysis
- First paragraph must state: WHAT happened, WHO is involved, WHEN
- Structure: News lead → Analysis → Impact → What's next
- Word count: 800-1500
- Include source attribution: "According to [source]..."
- Must use source material — no speculation`;

    case 'deep-dive':
      return `## Generation Task — Deep-Dive Blog Post
- Workflow-oriented: explain HOW to use/apply the topic, not just WHAT it is
- Include code examples where relevant
- Structure: Problem → Context → Implementation → Tradeoffs → Takeaways
- Word count: 2500-4000
- Bold key terms, use H2/H3 hierarchy, short paragraphs
- Based on research output — synthesize and structure, don't summarize`;

    case 'cornerstone':
      return `## Generation Task — Cornerstone Page
- The definitive guide to this topic on our site
- Comprehensive but scannable: clear H2 headings, direct answers at section tops
- Structure: Overview → Core concepts → Key features → Common questions → Getting started → Resources
- Word count: 2500-4000
- Must link to all supporting cluster pages (glossary, FAQ, compare)
- Every H2 section should be independently valuable (quotable by AI systems)`;

    default:
      return ''; // SKILL.md already defines glossary, faq, compare, topic-hub
  }
}

function getSkillPageTypeLabel(contentType: ContentType): string {
  switch (contentType) {
    case 'glossary':
      return 'Glossary';
    case 'faq':
      return 'FAQ';
    case 'compare':
      return 'Comparison';
    case 'topic-hub':
      return 'Topic Hub';
    default:
      return '';
  }
}

export function buildGenerationPrompt(
  contentType: ContentType,
  sourcePack: SourcePack,
  context: GenerationContext,
  lang: 'en' | 'zh',
): { system: string; user: string } {
  const { job, relatedSlugs } = context;
  const slug = job.primary_keyword
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

  // Build system prompt — use refresh skill for refresh jobs, base SEO skill otherwise
  let system: string;

  if (job.is_refresh) {
    system = loadRefreshSkill() + '\n\n';

    // Add anomaly-specific context
    if (job.refresh_meta) {
      system += `## Refresh Context\n`;
      system += `- Anomaly type: ${job.refresh_meta.anomaly_type || 'unknown'}\n`;
      system += `- Recommended action: ${job.refresh_meta.suggested_action || 'general improvement'}\n`;
      system += `- Detail: ${job.refresh_meta.detail || 'none'}\n\n`;
    }

    // Add page type structure rules from base SEO skill
    const inlineInstructions = getContentTypeInstructions(contentType);
    if (inlineInstructions) {
      system += inlineInstructions + '\n\n';
    } else {
      const pageTypeLabel = getSkillPageTypeLabel(contentType);
      if (pageTypeLabel) {
        system += `## Page Type: ${pageTypeLabel}\nThis is a ${pageTypeLabel} page refresh. Maintain the ${pageTypeLabel} structure.\n\n`;
      }
    }

    // Add existing content as reference
    if (job.existing_content) {
      const truncated = job.existing_content.length > 4000
        ? job.existing_content.slice(0, 4000) + '\n\n[... truncated ...]'
        : job.existing_content;
      system += `## Current Page Content (reference)\n\n\`\`\`markdown\n${truncated}\n\`\`\`\n\n`;
    }
  } else {
    system = loadSkill() + '\n\n';

    // Content type instructions
    const inlineInstructions = getContentTypeInstructions(contentType);
    if (inlineInstructions) {
      system += inlineInstructions + '\n\n';
    } else {
      const pageTypeLabel = getSkillPageTypeLabel(contentType);
      system += `## Generation Task — ${pageTypeLabel} Page
Generate a ${pageTypeLabel} page for "${job.primary_keyword}".
Output the FULL markdown file including the --- frontmatter block ---.\n\n`;
    }
  }

  // Source material
  system += buildSourceMaterialSection(sourcePack);

  // Context — available internal links + full link targets
  const prefix = lang === 'en' ? '' : '/zh';
  system += `### Context
- Primary keyword: ${job.primary_keyword}
- Secondary keywords: ${job.secondary_keywords.join(', ') || 'none'}
- Target intent: ${job.intent}
- Cluster: ${job.cluster_slug || 'none'}
- Available internal links (from same cluster):
  - Glossary: ${relatedSlugs.glossary.map((s) => `${prefix}/glossary/${s}`).join(', ') || 'none yet'}
  - Blog: ${relatedSlugs.blog.map((s) => `${prefix}/blog/${s}`).join(', ') || 'none yet'}
  - Compare: ${relatedSlugs.compare.map((s) => `${prefix}/compare/${s}`).join(', ') || 'none yet'}
  - FAQ: ${relatedSlugs.faq.map((s) => `${prefix}/faq/${s}`).join(', ') || 'none yet'}
`;

  // Load full link targets for richer internal linking
  const linkTargetsPath = path.join(process.cwd(), 'data', 'link-targets.json');
  if (fs.existsSync(linkTargetsPath)) {
    try {
      const allTargets = JSON.parse(fs.readFileSync(linkTargetsPath, 'utf-8')) as Record<string, { title: string; keywords: string[]; type: string }>;
      // Filter to same language, limit to 50 most relevant entries
      const langTargets = Object.entries(allTargets)
        .filter(([url]) => lang === 'en' ? !url.startsWith('/zh') : url.startsWith('/zh'))
        .slice(0, 50)
        .map(([url, t]) => `  - ${url} — "${t.title}"`)
        .join('\n');
      if (langTargets) {
        system += `- Full link target list (use these URLs for internal links in body text):\n${langTargets}\n`;
      }
    } catch { /* ignore parse errors */ }
  }

  // Determine related_topics based on keyword
  const kwLower = job.primary_keyword.toLowerCase();
  const topicHints: string[] = [];
  if (kwLower.includes('claude code') || kwLower.includes('claude-code')) topicHints.push('claude-code');
  if (kwLower.includes('codex')) topicHints.push('codex');
  const topicLine = topicHints.length > 0 ? `\n- Include in frontmatter: related_topics: [${topicHints.join(', ')}]` : '';

  system += `
## Output Requirements
- Output the FULL markdown file including the --- frontmatter block ---
- Frontmatter must include: title, slug (${slug}), description (120-160 chars), lang (${lang}), category
- Include related_glossary, related_blog, related_compare fields pointing to the most relevant links above
- slug must be: ${slug}
- lang must be: ${lang}${topicLine}
- Use 3-8 internal links in body text, selecting from the available links above
`;

  // ZH addendum
  if (lang === 'zh') {
    system += `
## 中文生成要求
- lang: zh
- 用中文撰写，不是翻译——基于同一主题独立创作中文版本
- 保持相同的 frontmatter 结构（lang 字段改为 zh）
- slug 保持与英文版相同: ${slug}
- 页面类型: ${ZH_TYPE_LABELS[contentType]}
- 正文字数: ${ZH_WORD_RANGES[contentType]} 字（中文字符计数，不含 frontmatter）
- 正文使用中文，但技术术语可保留英文
- 内部链接路径不变
- 必须以以下 CTA 结尾:

---

*觉得有用？[订阅 LoreAI](/subscribe)，每天 5 分钟掌握 AI 动态。*`;
  }

  // User prompt
  let user = `Write a ${contentType} page for the keyword "${job.primary_keyword}".
Use ONLY the source material provided above. Do not fabricate details, benchmarks, or capabilities not found in the sources.
If sources are insufficient, note limitations honestly rather than inventing information.`;

  if (lang === 'zh') {
    user = `用中文撰写以下内容（不是翻译英文版）：\n\n${user}`;
  }

  return { system, user };
}

// ── Stage 3: Generate Content ──

function extractFrontmatter(content: string): string {
  const match = content.match(/^---\n([\s\S]*?)\n---/);
  return match ? match[0] : '';
}

function extractBody(content: string): string {
  return content.replace(/^---[\s\S]*?---\n*/, '');
}

export async function generateContent(
  job: QueueJob,
  sourcePack: SourcePack,
  relatedSlugs: GenerationContext['relatedSlugs'],
  lang: 'en' | 'zh',
): Promise<{ success: boolean; filePath?: string; markdown?: string; errors?: string[] }> {
  const context: GenerationContext = { job, sourcePack, relatedSlugs };
  const { system, user } = buildGenerationPrompt(job.content_type, sourcePack, context, lang);
  const validate = getValidatorForType(job.content_type);
  const model = MODEL_MAP[job.content_type];
  const maxRetries = lang === 'en' ? 3 : 2;

  const fullValidate = (raw: string) => {
    const content = sanitizeOutput(raw);
    if (!content.match(/^---\n[\s\S]*?\n---/)) {
      return { valid: false, errors: ['Missing frontmatter block'] };
    }
    const body = extractBody(content);
    return validate(body);
  };

  try {
    const response = await callClaudeWithRetry(system, user, {
      model,
      maxRetries,
      validate: fullValidate,
    });

    const cleaned = sanitizeOutput(response.content);

    // Check ZH validation strictly
    if (lang === 'zh') {
      const result = fullValidate(response.content);
      if (!result.valid) {
        console.warn(`    ZH validation failed: ${result.errors.join(', ')}`);
        return { success: false, errors: result.errors };
      }
    }

    const frontmatter = extractFrontmatter(cleaned);
    if (!frontmatter) {
      return { success: false, errors: ['Failed to parse frontmatter'] };
    }

    // Determine output path
    const slug = job.primary_keyword
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');

    // Map content_type to directory name
    const dirType = job.content_type === 'topic-hub' ? 'topics' :
      job.content_type === 'deep-dive' ? 'blog' :
        job.content_type === 'cornerstone' ? 'blog' :
          job.content_type;

    const dir = path.join(process.cwd(), 'content', dirType, lang);
    fs.mkdirSync(dir, { recursive: true });
    const filePath = path.join(dir, `${slug}.md`);
    fs.writeFileSync(filePath, cleaned);

    console.log(`    ${lang.toUpperCase()} generated (model: ${response.model})`);

    return { success: true, filePath, markdown: cleaned };
  } catch (err) {
    const msg = (err as Error).message;
    console.warn(`    ${lang.toUpperCase()} generation failed: ${msg}`);
    return { success: false, errors: [msg] };
  }
}

// ── Stage 5: Write & DB Update ──

function updateDbAfterGeneration(
  job: QueueJob,
  enResult: { success: boolean; filePath?: string; markdown?: string },
  zhResult: { success: boolean } | null,
): void {
  const db = getDb();
  const slug = job.primary_keyword
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

  const dirType =
    job.content_type === 'topic-hub'
      ? 'topics'
      : job.content_type === 'deep-dive'
        ? 'blog'
        : job.content_type === 'cornerstone'
          ? 'blog'
          : job.content_type;

  if (enResult.success) {
    // Upsert EN content record
    upsertContent({
      type: dirType,
      slug,
      lang: 'en',
      title: job.primary_keyword,
      body_markdown: enResult.markdown || null,
      meta_json: JSON.stringify({
        content_type: job.content_type,
        cluster_slug: job.cluster_slug,
        intent: job.intent,
        ...(job.is_refresh ? { is_refresh: true, refresh_meta: job.refresh_meta } : {}),
      }),
      generated_by: job.is_refresh
        ? (job.research_pipeline === 'deep_research' ? 'gemini-deep-research-refresh' : 'claude-refresh')
        : (job.research_pipeline === 'deep_research' ? 'gemini-deep-research' : 'claude'),
    });

    // Update create_queue status
    if (zhResult === null || zhResult.success) {
      db.prepare(
        "UPDATE create_queue SET status = 'completed', completed_at = CURRENT_TIMESTAMP WHERE job_id = ?",
      ).run(job.job_id);
    } else {
      db.prepare("UPDATE create_queue SET status = 'partial' WHERE job_id = ?").run(job.job_id);
    }

    // Mark keywords as covered
    db.prepare(
      'UPDATE keywords SET content_exists = 1, content_type = ?, content_slug = ? WHERE keyword_group_id = ?',
    ).run(dirType, slug, job.keyword_group_id);

    // Mark keyword group as completed
    db.prepare(
      "UPDATE keyword_groups SET status = 'completed' WHERE group_id = ?",
    ).run(job.keyword_group_id);
  }
  // If EN failed, status stays 'pending' — no DB changes
}

// ── Main Orchestration ──

export async function runContentGeneration(
  opts: ContentGenOptions,
): Promise<ContentGenRunResult> {
  const result: ContentGenRunResult = {
    jobs_processed: 0,
    pages_generated: { en: 0, zh: 0 },
    pages_failed: { en: 0, zh: 0 },
    broken_links_removed: 0,
    api_calls: { serper: 0, exa: 0, claude: 0, gemini: 0 },
  };

  // Stage 1: Load jobs
  console.log('\n📥 Stage 1: Load Jobs');
  const jobs = loadJobs(opts);

  if (jobs.length === 0) {
    console.log('  No pending jobs found');
    return result;
  }

  console.log(`  Found ${jobs.length} jobs to process`);
  for (const job of jobs) {
    console.log(
      `    [${job.content_type}] "${job.primary_keyword}" (score: ${job.priority_score.toFixed(1)}, pipeline: ${job.research_pipeline})`,
    );
  }

  if (opts.dryRun) {
    console.log('\n🧪 DRY RUN — stopping here');
    result.jobs_processed = jobs.length;
    return result;
  }

  // Process each job
  for (let i = 0; i < jobs.length; i++) {
    const job = jobs[i];
    console.log(
      `\n📥 Job ${i + 1}/${jobs.length}: [${job.content_type}] "${job.primary_keyword}" (score: ${job.priority_score.toFixed(1)})`,
    );

    // Stage 2: Research
    let sourcePack: SourcePack;
    if (job.research_pipeline === 'deep_research') {
      console.log('  🔬 Deep Research Pipeline');
      const deepResult = await runDeepResearch(job);
      sourcePack = deepResult.sourcePack;
      result.api_calls.serper += deepResult.apiCalls.serper;
      result.api_calls.exa += deepResult.apiCalls.exa;
      result.api_calls.gemini += deepResult.apiCalls.gemini;
    } else {
      console.log('  🔍 Standard Pipeline');
      const stdResult = await runStandardResearch(job);
      sourcePack = stdResult.sourcePack;
      result.api_calls.serper += stdResult.apiCalls.serper;
      result.api_calls.exa += stdResult.apiCalls.exa;
    }

    const relatedSlugs = getRelatedSlugs(job.cluster_slug);

    // Stage 3: Generate EN
    console.log('  ✏️  Generating EN...');
    const enResult = await generateContent(job, sourcePack, relatedSlugs, 'en');
    result.api_calls.claude++;

    if (!enResult.success) {
      console.warn(`  ❌ EN failed: ${enResult.errors?.join(', ')}`);
      result.pages_failed.en++;
      result.jobs_processed++;
      continue; // Skip ZH if EN fails
    }
    result.pages_generated.en++;

    // Stage 4: Link Validation (EN)
    if (!opts.skipValidation && enResult.markdown) {
      console.log('  🔗 Link validation (EN)...');
      const linkResult = validateLinks(enResult.markdown, job.content_type, 'en');
      if (linkResult.broken_links.length > 0) {
        console.log(
          `    ${linkResult.total_links} links checked: ${linkResult.valid_links} valid, ${linkResult.broken_links.length} broken`,
        );
        for (const bl of linkResult.broken_links) {
          console.log(`      Removed: ${bl.link} (${bl.reason})`);
        }
        // Rewrite file with fixed markdown
        if (enResult.filePath) {
          fs.writeFileSync(enResult.filePath, linkResult.fixed_markdown);
          enResult.markdown = linkResult.fixed_markdown;
        }
        result.broken_links_removed += linkResult.broken_links.length;
      }
      if (linkResult.missing_glossary_links.length > 0) {
        console.log(
          `    ⚠️  Missing glossary links: ${linkResult.missing_glossary_links.map((l) => l.term).join(', ')}`,
        );
      }
    }

    // Stage 3b: Generate ZH
    let zhResult: { success: boolean; filePath?: string; markdown?: string; errors?: string[] } | null =
      null;
    if (!opts.enOnly) {
      console.log('  ✏️  Generating ZH...');
      zhResult = await generateContent(job, sourcePack, relatedSlugs, 'zh');
      result.api_calls.claude++;

      if (zhResult.success) {
        result.pages_generated.zh++;

        // Link validation (ZH)
        if (!opts.skipValidation && zhResult.markdown) {
          const zhLinkResult = validateLinks(zhResult.markdown, job.content_type, 'zh');
          if (zhLinkResult.broken_links.length > 0) {
            if (zhResult.filePath) {
              fs.writeFileSync(zhResult.filePath, zhLinkResult.fixed_markdown);
              zhResult.markdown = zhLinkResult.fixed_markdown;
            }
            result.broken_links_removed += zhLinkResult.broken_links.length;
          }
        }

        // Upsert ZH content record
        const slug = job.primary_keyword
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-|-$/g, '');
        const dirType =
          job.content_type === 'topic-hub'
            ? 'topics'
            : job.content_type === 'deep-dive'
              ? 'blog'
              : job.content_type === 'cornerstone'
                ? 'blog'
                : job.content_type;
        upsertContent({
          type: dirType,
          slug,
          lang: 'zh',
          title: job.primary_keyword,
          body_markdown: zhResult.markdown || null,
          meta_json: JSON.stringify({
            content_type: job.content_type,
            cluster_slug: job.cluster_slug,
            intent: job.intent,
          }),
          generated_by: job.research_pipeline === 'deep_research' ? 'gemini-deep-research' : 'claude',
        });
      } else {
        console.warn(`  ⚠️  ZH failed: ${zhResult.errors?.join(', ')}`);
        result.pages_failed.zh++;
      }
    }

    // Stage 5: DB Update
    updateDbAfterGeneration(job, enResult, opts.enOnly ? null : zhResult);
    const status = !opts.enOnly && zhResult && !zhResult.success ? 'partial' : 'completed';
    console.log(`  ✅ Job ${job.job_id} → ${status}`);

    result.jobs_processed++;
  }

  return result;
}
