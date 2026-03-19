/**
 * scripts/lib/seo/generation.ts — AI generation and file writing for SEO pages
 *
 * All factual content types (compare, FAQ) get source grounding automatically.
 * Flagship clusters use curated URLs; auto clusters search the web.
 * Glossary and topic hubs don't need source grounding (definitions + link pages).
 */
import fs from 'fs';
import path from 'path';
import { callClaudeWithRetry } from '../ai';
import { sanitizeOutput } from '../sanitize.js';
import { upsertContent } from '../db';
import { resolveSource, buildGroundingInstruction } from '../source-fetch';
import { extractInternalLinks, checkLinkExists } from '../link-check';
import {
  loadSkill,
  extractFrontmatter,
  extractBody,
  contentFileExists,
} from './helpers';
import {
  buildPrompt,
  buildZhSystemAddendum,
  buildCornerstonePrompt,
  getValidatorForType,
} from './prompts';
import type { SEOPageType, PageJob, GeneratedPage, ClusterDefinition } from './types';

// ============================================================
// Post-generation link validation
// ============================================================

/**
 * Validate and fix internal links in generated content.
 * Removes broken links (replaces [text](/broken) with just text).
 * Returns the cleaned content and logs any fixes.
 */
export function validateAndFixLinks(content: string): { content: string; brokenCount: number; fixedLinks: string[] } {
  const links = extractInternalLinks(content);
  const fixedLinks: string[] = [];
  let fixed = content;

  for (const link of links) {
    if (!checkLinkExists(link)) {
      // Replace the markdown link with just the text
      // Pattern: [any text](this-specific-link)
      const escapedLink = link.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const linkRegex = new RegExp(`\\[([^\\]]*)\\]\\(${escapedLink}\\)`, 'g');
      fixed = fixed.replace(linkRegex, '$1');
      fixedLinks.push(link);
    }
  }

  if (fixedLinks.length > 0) {
    console.log(`    Link validation: removed ${fixedLinks.length} broken link(s)`);
    for (const link of fixedLinks) {
      console.log(`      ✗ ${link}`);
    }
  }

  return { content: fixed, brokenCount: fixedLinks.length, fixedLinks };
}

// ============================================================
// Single page generation
// ============================================================

export async function generatePage(
  job: PageJob,
  skill: string,
  lang: 'en' | 'zh'
): Promise<GeneratedPage | null> {
  const { system: baseSystem, user: baseUser } = buildPrompt(job, skill);
  const validate = getValidatorForType(job.type);

  let systemPrompt = baseSystem;
  let userPrompt = baseUser;

  if (lang === 'zh') {
    systemPrompt = baseSystem + buildZhSystemAddendum(job);
    userPrompt = `用中文撰写以下内容（不是翻译英文版）：\n\n${baseUser}`;
  }

  const fullValidate = (raw: string) => {
    const content = sanitizeOutput(raw);
    if (!content.match(/^---\n[\s\S]*?\n---/)) {
      return { valid: false, errors: ['Missing frontmatter block'] };
    }
    const body = extractBody(content);
    return validate(body);
  };

  try {
    let response;
    if (lang === 'en') {
      response = await callClaudeWithRetry(systemPrompt, userPrompt, {
        maxTokens: 4096,
        temperature: 0.4,
        maxRetries: 3,
        validate: fullValidate,
      });
    } else {
      // ZH: retry with validation (2 attempts)
      response = await callClaudeWithRetry(systemPrompt, userPrompt, {
        maxTokens: 4096,
        temperature: 0.4,
        maxRetries: 2,
        validate: fullValidate,
      });
      const result = fullValidate(response.content);
      if (!result.valid) {
        console.warn(`    ZH validation failed: ${result.errors.join(', ')}`);
        return null;
      }
    }

    const cleaned = sanitizeOutput(response.content);
    console.log(`    ${lang.toUpperCase()} generated (model: ${response.model})`);
    console.log(`    Tokens: ${response.usage?.input_tokens} in / ${response.usage?.output_tokens} out`);

    const frontmatter = extractFrontmatter(cleaned);
    const body = extractBody(cleaned);

    if (!frontmatter) {
      console.warn(`    Failed to parse frontmatter for ${lang}`);
      return null;
    }

    // Validate and fix internal links before writing
    const { content: validatedContent } = validateAndFixLinks(cleaned);

    // Write file
    const dir = path.join(process.cwd(), 'content', job.type, lang);
    fs.mkdirSync(dir, { recursive: true });
    const filePath = path.join(dir, `${job.slug}.md`);
    fs.writeFileSync(filePath, validatedContent);

    // Re-extract after link fixes
    const finalFrontmatter = extractFrontmatter(validatedContent);
    const finalBody = extractBody(validatedContent);

    return {
      type: job.type,
      slug: job.slug,
      lang,
      frontmatter: finalFrontmatter,
      body: finalBody,
      filePath,
    };
  } catch (err) {
    console.warn(`    ${lang.toUpperCase()} generation failed: ${(err as Error).message}`);
    return null;
  }
}

// ============================================================
// Auto source grounding for daily mode
// ============================================================

/**
 * Resolve source material for a job that doesn't already have grounding.
 * Compare and FAQ pages get web search grounding; glossary and topics don't need it.
 */
async function resolveSourcesForJob(job: PageJob): Promise<void> {
  // Skip if already grounded (e.g., cluster mode already set _sourceGrounding)
  if (job.context._sourceGrounding) return;
  // Only compare and FAQ need source grounding
  if (job.type !== 'compare' && job.type !== 'faq') return;

  console.log('  Resolving source material...');

  if (job.type === 'compare') {
    const itemA = (job.context.item_a as string) || '';
    const itemB = (job.context.item_b as string) || '';
    // Search for both items
    const sourceA = await resolveSource(undefined, `${itemA} official documentation features`, []);
    const sourceB = await resolveSource(undefined, `${itemB} official documentation features`, []);
    if (sourceA || sourceB) {
      job.context._sourceGrounding = buildGroundingInstruction([
        { label: itemA, content: sourceA },
        { label: itemB, content: sourceB },
      ]);
      console.log(`    Sources: ${itemA} (${sourceA.length} chars), ${itemB} (${sourceB.length} chars)`);
    }
  } else if (job.type === 'faq') {
    const question = (job.context.question as string) || job.displayTerm;
    const source = await resolveSource(undefined, `${job.pillarTopic} ${question}`, []);
    if (source) {
      job.context._sourceGrounding = buildGroundingInstruction([
        { label: job.pillarTopic, content: source },
      ]);
      console.log(`    Source: ${job.pillarTopic} (${source.length} chars)`);
    }
  }
}

// ============================================================
// Batch page generation (was stage4_generatePages)
// ============================================================

export async function generatePages(
  jobs: PageJob[],
  dryRun: boolean = false
): Promise<GeneratedPage[]> {
  console.log('\n✍️  Stage 4: Generate Pages');

  if (jobs.length === 0) {
    console.log('  No pages to generate');
    return [];
  }

  const skill = loadSkill();
  const generated: GeneratedPage[] = [];

  for (let i = 0; i < jobs.length; i++) {
    const job = jobs[i];
    console.log(`\n--- Page ${i + 1}/${jobs.length}: [${job.type}] ${job.slug} ---`);

    if (dryRun) {
      console.log(`  [DRY RUN] Would generate ${job.type} page for "${job.displayTerm}"`);
      console.log(`    EN: content/${job.type}/en/${job.slug}.md`);
      console.log(`    ZH: content/${job.type}/zh/${job.slug}.md`);
      continue;
    }

    // Resolve source material for factual content types
    await resolveSourcesForJob(job);

    // Generate EN (skip if already exists on disk)
    const enFileExists = contentFileExists(job.type, job.slug, 'en');
    if (enFileExists) {
      console.log('  EN already exists, skipping');
    } else {
      console.log('  Generating EN...');
      const enPage = await generatePage(job, skill, 'en');
      if (!enPage) {
        console.warn('  EN generation failed, skipping this page');
        continue;
      }
      generated.push(enPage);
      console.log(`  Written: ${enPage.filePath}`);

      const enContentId = upsertContent({
        type: job.type,
        slug: job.slug,
        lang: 'en',
        title: job.displayTerm,
        body_markdown: `${enPage.frontmatter}\n\n${enPage.body}`,
        meta_json: JSON.stringify({
          category: job.type,
          cluster_slug: job.clusterSlug,
          pillar_topic: job.pillarTopic,
        }),
      });
      console.log(`  EN DB record id=${enContentId}`);
    }

    // Generate ZH (retry with validation)
    console.log('  Generating ZH...');
    const zhPage = await generatePage(job, skill, 'zh');
    if (zhPage) {
      generated.push(zhPage);
      console.log(`  Written: ${zhPage.filePath}`);

      const zhContentId = upsertContent({
        type: job.type,
        slug: job.slug,
        lang: 'zh',
        title: job.displayTerm,
        body_markdown: `${zhPage.frontmatter}\n\n${zhPage.body}`,
        meta_json: JSON.stringify({
          category: job.type,
          cluster_slug: job.clusterSlug,
          pillar_topic: job.pillarTopic,
        }),
      });
      console.log(`  ZH DB record id=${zhContentId}`);
    } else {
      console.log('  ZH generation skipped (failed)');
    }
  }

  return generated;
}

// ============================================================
// Cornerstone page generation
// ============================================================

export async function generateCornerstonePage(
  cluster: ClusterDefinition,
  lang: 'en' | 'zh',
  date: string,
  sourceGrounding?: string
): Promise<{ slug: string; lang: string; filePath: string } | null> {
  const { system: enSystem, user: enUser } = buildCornerstonePrompt(cluster, date, sourceGrounding);

  let systemPrompt: string;
  let userPrompt: string;

  if (lang === 'en') {
    systemPrompt = enSystem;
    userPrompt = enUser;
  } else {
    systemPrompt = enSystem + `

## 中文生成要求
- lang: zh
- 用中文撰写，不是翻译——基于同一主题独立创作中文版本
- 保持相同的 frontmatter 结构（lang 字段改为 zh）
- slug 保持与英文版相同: ${cluster.cornerstone.slug}
- 正文字数: 1500-2500 字（中文字符计数，不含 frontmatter）
- 正文使用中文，但技术术语可保留英文（如 Claude Code, MCP, SKILL.md）
- 内部链接路径不变
- 必须以以下 CTA 结尾:

---

*觉得有用？[订阅 LoreAI](/subscribe)，每天 5 分钟掌握 AI 动态。*`;
    userPrompt = `用中文撰写关于"${cluster.pillar_topic}"的权威基石页面（不是翻译英文版）。Slug: "${cluster.cornerstone.slug}"。只使用你确信的事实。`;
  }

  const fullValidate = (raw: string) => {
    const content = sanitizeOutput(raw);
    if (!content.match(/^---\n[\s\S]*?\n---/)) {
      return { valid: false, errors: ['Missing frontmatter block'] };
    }
    const body = extractBody(content);
    const wordCount = lang === 'en'
      ? body.split(/\s+/).length
      : body.replace(/[\s\n]/g, '').length;
    if (wordCount < 800) {
      return { valid: false, errors: [`Content too short: ${wordCount} words/chars (min 800)`] };
    }
    return { valid: true, errors: [] };
  };

  try {
    const response = await callClaudeWithRetry(systemPrompt, userPrompt, {
      maxTokens: 8192,
      temperature: 0.4,
      maxRetries: 2,
      validate: fullValidate,
    });

    const cleaned = sanitizeOutput(response.content);
    console.log(`    ${lang.toUpperCase()} cornerstone generated (model: ${response.model})`);
    console.log(`    Tokens: ${response.usage?.input_tokens} in / ${response.usage?.output_tokens} out`);

    const frontmatter = extractFrontmatter(cleaned);
    if (!frontmatter) {
      console.warn(`    Failed to parse frontmatter for ${lang} cornerstone`);
      return null;
    }

    // Validate and fix internal links
    const { content: validatedContent } = validateAndFixLinks(cleaned);

    // Write file to content/blog/{lang}/
    const dir = path.join(process.cwd(), 'content', 'blog', lang);
    fs.mkdirSync(dir, { recursive: true });
    const filePath = path.join(dir, `${cluster.cornerstone.slug}.md`);
    fs.writeFileSync(filePath, validatedContent);

    return { slug: cluster.cornerstone.slug, lang, filePath };
  } catch (err) {
    console.warn(`    ${lang.toUpperCase()} cornerstone generation failed: ${(err as Error).message}`);
    return null;
  }
}
