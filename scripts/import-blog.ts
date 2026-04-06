#!/usr/bin/env npx tsx
/**
 * scripts/import-blog.ts — Import offline-created blog articles
 *
 * Normalizes frontmatter, strips HTML comments, inserts mermaid visualizations,
 * injects internal links, populates related content, upserts to DB,
 * and extracts SEO entities.
 *
 * Usage:
 *   npx tsx scripts/import-blog.ts --file=article.md [options]
 *
 * Options:
 *   --file=PATH          Path to the offline markdown article (required)
 *   --date=YYYY-MM-DD    Override publish date (default: today SGT)
 *   --category=DEV       Override category (default: DEV)
 *   --max-words=10000    Override word count ceiling (default: 10000)
 *   --dry-run            Preview only, no writes
 *   --no-seo             Skip SEO entity extraction
 *   --no-git             Skip git add/commit/push
 *   --force              Overwrite if slug already exists
 */
import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';

import { validateBlogPost, countWords } from './lib/validate';
import { upsertContent, upsertKeyword, closeDb } from './lib/db';
import { todaySGT } from './lib/date.js';
import { gitAddCommitPush } from './lib/git';
import { loadTargets, injectLinks } from './lib/link-inject';

const ROOT = process.cwd();

// ============================================================
// CLI args
// ============================================================

const args = process.argv.slice(2);
function getArg(name: string): string | undefined {
  const flag = args.find((a) => a.startsWith(`--${name}=`));
  return flag ? flag.split('=').slice(1).join('=') : undefined;
}

const FILE = getArg('file');
const DATE_OVERRIDE = getArg('date');
const CATEGORY = getArg('category') || 'DEV';
const MAX_WORDS = parseInt(getArg('max-words') || '10000', 10);
const DRY_RUN = args.includes('--dry-run');
const NO_SEO = args.includes('--no-seo');
const NO_GIT = args.includes('--no-git');
const FORCE = args.includes('--force');

if (!FILE) {
  console.error('Usage: npx tsx scripts/import-blog.ts --file=article.md [--date=YYYY-MM-DD] [--category=DEV] [--dry-run] [--no-seo] [--no-git] [--force]');
  process.exit(1);
}

const filePath = path.isAbsolute(FILE) ? FILE : path.join(ROOT, FILE);
if (!fs.existsSync(filePath)) {
  console.error(`File not found: ${filePath}`);
  process.exit(1);
}

// ============================================================
// Types
// ============================================================

interface NormalizedFrontmatter {
  title: string;
  date: string;
  slug: string;
  description: string;
  keywords: string[];
  category: string;
  related_newsletter: string;
  related_glossary: string[];
  related_compare: string[];
  related_blog: string[];
  related_topics: string[];
  lang: string;
  video_ready: boolean;
  video_hook: string;
  video_status: string;
  source_type: string;
}

interface ExtraMetadata {
  series?: string;
  episode?: string;
  author?: string;
  canonical_url?: string;
  [key: string]: unknown;
}

// ============================================================
// Main
// ============================================================

async function main() {

// ============================================================
// Stage 0: Parse
// ============================================================

console.log(`\n📄 Import Blog: ${path.basename(filePath)}`);
const raw = fs.readFileSync(filePath, 'utf-8');
const parsed = matter(raw);
const data = parsed.data as Record<string, unknown>;
let body = parsed.content;

console.log(`  Title: ${data.title || '(missing)'}`);
console.log(`  Slug: ${data.slug || '(missing)'}`);
console.log(`  Lang: ${data.lang || '(missing)'}`);

// ============================================================
// Stage 1: Normalize frontmatter
// ============================================================

console.log('\n🔧 Stage 1: Normalize frontmatter');

function resolveDate(rawDate: unknown): string {
  if (DATE_OVERRIDE) return `${DATE_OVERRIDE}T00:00:00.000Z`;
  if (typeof rawDate === 'string') {
    // Detect placeholder dates like "2026-04-XX"
    if (rawDate.includes('XX') || rawDate.includes('xx') || !Date.parse(rawDate)) {
      const today = todaySGT();
      console.log(`  Date placeholder "${rawDate}" → ${today}`);
      return `${today}T00:00:00.000Z`;
    }
    // Ensure ISO format
    if (!rawDate.includes('T')) return `${rawDate}T00:00:00.000Z`;
    return rawDate;
  }
  if (rawDate instanceof Date) return rawDate.toISOString();
  return `${todaySGT()}T00:00:00.000Z`;
}

function normalizeLang(rawLang: unknown): string {
  const lang = String(rawLang || 'en').toLowerCase();
  // Strip region suffix: zh-CN → zh, en-US → en
  return lang.split('-')[0];
}

function toStringArray(val: unknown): string[] {
  if (Array.isArray(val)) return val.map(String);
  if (typeof val === 'string') return [val];
  return [];
}

const resolvedDate = resolveDate(data.date);
const lang = normalizeLang(data.lang);

// Map tags → keywords
const keywords = toStringArray(data.keywords || data.tags);

// Extract extra metadata (preserved in DB meta_json, stripped from published frontmatter)
const EXTRA_FIELDS = ['series', 'episode', 'author', 'canonical_url'];
const extras: ExtraMetadata = {};
for (const field of EXTRA_FIELDS) {
  if (data[field] !== undefined) {
    extras[field] = data[field] as string;
    console.log(`  Extra: ${field} = ${data[field]}`);
  }
}

const frontmatter: NormalizedFrontmatter = {
  title: String(data.title || ''),
  date: resolvedDate,
  slug: String(data.slug || ''),
  description: String(data.description || ''),
  keywords,
  category: String(data.category || CATEGORY),
  related_newsletter: resolvedDate.slice(0, 10) + 'T00:00:00.000Z',
  related_glossary: toStringArray(data.related_glossary),
  related_compare: toStringArray(data.related_compare),
  related_blog: toStringArray(data.related_blog),
  related_topics: toStringArray(data.related_topics),
  lang,
  video_ready: false,
  video_hook: '',
  video_status: 'none',
  source_type: 'offline',
};

// Validate required fields
if (!frontmatter.title || !frontmatter.slug) {
  console.error('  ❌ Missing required fields: title and slug are mandatory');
  process.exit(1);
}

console.log(`  → lang: ${frontmatter.lang}`);
console.log(`  → date: ${frontmatter.date}`);
console.log(`  → category: ${frontmatter.category}`);
console.log(`  → keywords: ${frontmatter.keywords.join(', ')}`);

// ============================================================
// Stage 2: Insert visualizations (replace illustration placeholders)
// ============================================================

console.log('\n🎨 Stage 2: Insert visualizations');

const VISUALIZATIONS: Record<string, string> = {
  // Timeline → compact table with emoji anchors
  '【插图 2】': `| 时间 | 事件 |
|------|------|
| 3/31 凌晨 | 🔍 Chaofan Shou 发现 59.8MB source map 指向完整源码 |
| 数小时内 | 📦 代码被镜像到多个 GitHub 仓库 |
| 3/31 | ⚖️ Anthropic 确认泄漏，发布 DMCA 删除通知 |
| 4/1 | 💥 GitHub 误删数千相关仓库；Claw Code 开源重写获 50K stars |
| 4/1~03 | 📊 社区分析爆发，17 章架构拆解发布 |`,

  // Architecture overview → table + tiny flow diagram
  '【插图 3】': `| 层级 | 解决什么 | 核心模块 | 代码规模 |
|------|---------|---------|---------|
| 🧠 核心 | Agent 循环 | QueryEngine（while loop） | ~1,296 行 |
| 📋 第一层 | 模型该看什么 | 微压缩 · 会话记忆 · 完整压缩 · 工具系统 42+ | ~46K 行 |
| 🛡️ 第二层 | 模型不能做什么 | 四层权限 · Bash 分类器 · YOLO 分类器 · Hooks | 9.5K 行 + 300KB |
| 🤝 第三层 | 一个模型不够用 | Swarm · Coordinator Mode · MCP 协议 | ~25K 行 |
| 🔮 未发布 | 未来形态 | KAIROS · Speculation · ULTRAPLAN · Buddy | 44 个 flags |

\`\`\`mermaid
flowchart LR
    A["🧠 核心"] --> B["📋 上下文"] --> C["🛡️ 安全"] --> D["🤝 多Agent"]
    D -.-> E["🔮 未发布"]
\`\`\``,

  // Engine vs car → blockquote comparison table
  '【插图 4】': `> **⚙️ 引擎 vs. 🏎️ 整辆车**
>
> | | 引擎（LLM 模型） | 整辆车（Harness） |
> |--|-----------|----------------|
> | **代码量** | ~1,296 行 | 470,000+ 行 |
> | **占比** | 0.3% | 99.7% |
> | **做什么** | 核心推理循环 | 上下文管理 · 安全权限 · 工具系统 · 错误恢复 · 多 Agent 协作 · 监控日志 |`,

  // 3-stage pipeline → flat LR chain (no subgraphs)
  '【插图 5】': `\`\`\`mermaid
flowchart LR
    A["对话历史"] --> B["微压缩\\n规则驱动 · 零成本"] --> C["会话记忆\\n提取结构化事实"] --> D["完整压缩\\nLLM 生成摘要"] --> E["~200K tokens"]
\`\`\``,

  // 7-layer security → compact table
  '【插图 6】': `| # | 防线 | 机制 | 特点 |
|---|------|------|------|
| 1 | 配置规则 | 权限模式选择 | 逐一确认 → 半自动 → YOLO |
| 2 | AST 分析 | 解析命令结构 | 静态分析 |
| 3 | Bash 分类器 | 纯规则匹配 | 只读命令自动放行，极速 |
| 4 | YOLO 分类器 | LLM-as-Judge | 两阶段：快判 → 完整推理 |
| 5 | OS 沙箱 | 操作系统级隔离 | 系统级防线 |
| 6 | Hooks 拦截 | 可插拔回调 | ~8K 行，USB 式热插拔 |
| 7 | 硬编码安全检查 | 23 条规则 | 300KB+ 安全代码 |

> **全部通过 → ✅ 安全执行。** 任一层失败 → 默认拦截（宁可误杀不可放过）。`,

  // Swarm architecture → simplified LR mermaid (drop Coordinator to prose)
  '【插图 7】': `\`\`\`mermaid
flowchart LR
    L["🎯 Leader\\n拆解 · 分配 · 收集"] -->|指令| T1["Teammate 1"]
    L -->|指令| T2["Teammate 2"]
    L -->|指令| T3["Teammate 3"]
    T1 & T2 & T3 -->|关键发现| M["📝 Memory Sync"]
    M -->|同步| L
\`\`\``,
};

let vizCount = 0;
for (const [marker, diagram] of Object.entries(VISUALIZATIONS)) {
  // Match the comment placeholder: <!-- 【插图 N】... -->
  const escaped = marker.replace(/[[\]]/g, '\\$&');
  const pattern = new RegExp(`<!--\\s*${escaped}[^>]*-->`, 'g');
  const before = body;
  body = body.replace(pattern, diagram);
  if (body !== before) {
    vizCount++;
    console.log(`  + Replaced ${marker}`);
  }
}
console.log(`  Inserted ${vizCount} mermaid diagrams`);

// ============================================================
// Stage 3: Strip remaining HTML comments
// ============================================================

console.log('\n🧹 Stage 3: Strip HTML comments');
const commentsBefore = (body.match(/<!--[\s\S]*?-->/g) || []).length;
body = body.replace(/<!--[\s\S]*?-->/g, '').replace(/\n{3,}/g, '\n\n').trim();
console.log(`  Stripped ${commentsBefore} HTML comment blocks`);

// ============================================================
// Stage 4: Inject internal links
// ============================================================

console.log('\n🔗 Stage 4: Inject internal links');
const targets = loadTargets(ROOT);
if (Object.keys(targets).length > 0) {
  const { result, added, details } = injectLinks(body, targets, frontmatter.slug, frontmatter.lang, 8);
  body = result;
  console.log(`  Injected ${added} internal links`);
  for (const d of details) console.log(d);
} else {
  console.log('  ⚠ No link targets found — run build-link-targets.ts first. Skipping.');
}

// ============================================================
// Stage 5: Auto-populate related_* frontmatter
// ============================================================

console.log('\n📎 Stage 5: Auto-populate related content');

function findRelatedSlugs(type: string): string[] {
  const dir = path.join(ROOT, 'content', type, frontmatter.lang);
  if (!fs.existsSync(dir)) return [];

  const slugs: string[] = [];
  const kwLower = frontmatter.keywords.map((k) => k.toLowerCase());

  for (const file of fs.readdirSync(dir)) {
    if (!file.endsWith('.md')) continue;
    const slug = file.replace(/\.md$/, '');
    if (slug === frontmatter.slug) continue; // skip self

    // Check if slug contains any of our keywords
    const slugWords = slug.toLowerCase();
    for (const kw of kwLower) {
      const kwSlug = kw.replace(/\s+/g, '-').toLowerCase();
      if (slugWords.includes(kwSlug) || kwSlug.includes(slugWords)) {
        slugs.push(slug);
        break;
      }
    }
  }
  return slugs;
}

if (frontmatter.related_glossary.length === 0) {
  frontmatter.related_glossary = findRelatedSlugs('glossary').slice(0, 5);
  if (frontmatter.related_glossary.length > 0)
    console.log(`  → related_glossary: ${frontmatter.related_glossary.join(', ')}`);
}

if (frontmatter.related_compare.length === 0) {
  frontmatter.related_compare = findRelatedSlugs('compare').slice(0, 3);
  if (frontmatter.related_compare.length > 0)
    console.log(`  → related_compare: ${frontmatter.related_compare.join(', ')}`);
}

if (frontmatter.related_blog.length === 0) {
  frontmatter.related_blog = findRelatedSlugs('blog').slice(0, 3);
  if (frontmatter.related_blog.length > 0)
    console.log(`  → related_blog: ${frontmatter.related_blog.join(', ')}`);
}

if (frontmatter.related_topics.length === 0) {
  frontmatter.related_topics = findRelatedSlugs('topics').slice(0, 2);
  if (frontmatter.related_topics.length > 0)
    console.log(`  → related_topics: ${frontmatter.related_topics.join(', ')}`);
}

// ============================================================
// Stage 6: Validate
// ============================================================

console.log('\n✅ Stage 6: Validate');

// Auto-append CTA if missing
if (!body.match(/\[.*(subscribe|订阅).*\]/i)) {
  const cta = frontmatter.lang === 'zh'
    ? '\n\n---\n\n*觉得有用？[订阅 AI 简报](/subscribe)，每天 5 分钟掌握 AI 动态。*'
    : '\n\n---\n\n*Found this useful? [Subscribe to AI News](/subscribe) for daily AI briefings.*';
  body += cta;
  console.log('  + Auto-appended newsletter CTA');
}

const wordCount = countWords(body);
console.log(`  Word count: ${wordCount}`);

const validation = validateBlogPost(body, { maxWords: MAX_WORDS });
if (validation.valid) {
  console.log('  ✓ Validation passed');
} else {
  console.warn('  ⚠ Validation warnings (proceeding — human-authored content):');
  for (const err of validation.errors) console.warn(`    - ${err}`);
}

// ============================================================
// Build output
// ============================================================

// Build clean frontmatter (without extra fields)
const cleanFm: Record<string, unknown> = { ...frontmatter };
// Remove empty arrays to keep frontmatter clean
if (frontmatter.related_blog.length === 0) delete cleanFm.related_blog;
if (frontmatter.related_topics.length === 0) delete cleanFm.related_topics;

const outputMarkdown = matter.stringify('\n' + body, cleanFm);

if (DRY_RUN) {
  console.log('\n📋 DRY RUN — would write:');
  console.log(`  File: content/blog/${frontmatter.lang}/${frontmatter.slug}.md`);
  console.log(`  Title: ${frontmatter.title}`);
  console.log(`  Date: ${frontmatter.date}`);
  console.log(`  Words: ${wordCount}`);
  console.log(`  Keywords: ${frontmatter.keywords.join(', ')}`);
  console.log(`  Related glossary: ${frontmatter.related_glossary.join(', ') || '(none)'}`);
  console.log(`  Related compare: ${frontmatter.related_compare.join(', ') || '(none)'}`);
  console.log(`  Related blog: ${frontmatter.related_blog.join(', ') || '(none)'}`);
  console.log(`  Related topics: ${frontmatter.related_topics.join(', ') || '(none)'}`);
  console.log('\n  First 500 chars of output:\n');
  console.log(outputMarkdown.slice(0, 500));
  console.log('\n  ...\n');
  process.exit(0);
}

// ============================================================
// Stage 7: Write file
// ============================================================

console.log('\n📝 Stage 7: Write file');

const outDir = path.join(ROOT, 'content', 'blog', frontmatter.lang);
fs.mkdirSync(outDir, { recursive: true });
const outPath = path.join(outDir, `${frontmatter.slug}.md`);

if (fs.existsSync(outPath) && !FORCE) {
  console.error(`  ❌ File already exists: ${outPath}`);
  console.error('  Use --force to overwrite.');
  process.exit(1);
}

fs.writeFileSync(outPath, outputMarkdown, 'utf-8');
console.log(`  Written: ${outPath}`);

const writtenFiles = [outPath];

// ============================================================
// Stage 8: DB upsert
// ============================================================

console.log('\n💾 Stage 8: DB upsert');

try {
  upsertContent({
    type: 'blog',
    slug: frontmatter.slug,
    lang: frontmatter.lang,
    title: frontmatter.title,
    body_markdown: outputMarkdown,
    meta_json: JSON.stringify({
      category: frontmatter.category,
      keywords: frontmatter.keywords,
      source_type: 'offline',
      ...extras,
    }),
    generated_by: 'human',
  });
  console.log('  ✓ Content upserted to DB');

  // Upsert keywords
  for (const keyword of frontmatter.keywords) {
    const kwSlug = keyword
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .slice(0, 60);
    if (kwSlug) {
      upsertKeyword(kwSlug, `offline-blog:${frontmatter.slug}`, kwSlug);
    }
  }
  console.log(`  ✓ ${frontmatter.keywords.length} keywords upserted`);
} catch (err) {
  console.warn(`  ⚠ DB upsert failed (may be running locally without DB): ${(err as Error).message}`);
}

// ============================================================
// Stage 9: SEO extraction
// ============================================================

if (!NO_SEO) {
  console.log('\n🔍 Stage 9: SEO entity extraction');
  try {
    const { extractSEOEntities, saveSEOEntities } = await import('./lib/seo-extract');
    const entities = await extractSEOEntities(frontmatter.title, body);
    saveSEOEntities(entities, frontmatter.slug, frontmatter.title);
    console.log('  ✓ SEO entities extracted and saved');
  } catch (err) {
    console.warn(`  ⚠ SEO extraction failed: ${(err as Error).message}`);
  }
} else {
  console.log('\n⏭️  Stage 9: SEO extraction (skipped — --no-seo)');
}

// ============================================================
// Stage 11: Git
// ============================================================

if (!NO_GIT) {
  console.log('\n📦 Stage 11: Git add/commit/push');
  try {
    await gitAddCommitPush(writtenFiles, `Add offline blog: ${frontmatter.slug}`);
    console.log('  ✓ Committed and pushed');
  } catch (err) {
    console.warn(`  ⚠ Git failed: ${(err as Error).message}`);
  }
} else {
  console.log('\n⏭️  Stage 11: Git (skipped — --no-git)');
}

// ============================================================
// Done
// ============================================================

try { closeDb(); } catch { /* ok if db not open */ }

console.log(`\n✅ Import complete: ${frontmatter.slug}`);
console.log(`  File: content/blog/${frontmatter.lang}/${frontmatter.slug}.md`);
console.log(`  Words: ${wordCount}`);
console.log(`  Diagrams: ${vizCount}`);

} // end main

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
