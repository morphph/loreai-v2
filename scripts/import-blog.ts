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
  '【插图 2】': `\`\`\`mermaid
timeline
    title 泄漏事件时间线
    2026-03-31 凌晨 : Chaofan Shou 发现 source map
                    : 59.8MB 调试文件指向完整源码
    数小时内 : 代码被镜像到多个 GitHub 仓库
    2026-03-31 : Anthropic 确认并发布 DMCA
    2026-04-01 : GitHub 误删数千个相关仓库
              : Claw Code 开源重写获 50K stars
    2026-04-01~03 : 社区分析爆发
                  : 17 章架构拆解发布
\`\`\``,

  '【插图 3】': `\`\`\`mermaid
flowchart TB
    subgraph core["🧠 核心 — Agent Loop ~1,296 行"]
        QE["QueryEngine: while 循环<br/>调用模型 → 执行工具 → 重复"]
    end

    subgraph ctx["📋 第一层 Harness — 上下文管理"]
        MC["微压缩<br/>规则驱动 · 零成本"]
        SM["会话记忆<br/>提取结构化事实"]
        FC["完整压缩<br/>LLM 生成摘要"]
        TS["工具系统 42+<br/>Zod 校验 · 按需加载"]
    end

    subgraph sec["🛡️ 第二层 Harness — 安全与约束"]
        PM["四层权限模式"]
        BC["Bash 分类器<br/>规则匹配"]
        YC["YOLO 分类器<br/>LLM-as-Judge"]
        HC["23 条硬编码安全规则"]
        HK["Hooks 系统 ~8K 行"]
    end

    subgraph ext["🤝 第三层 Harness — 多 Agent 与扩展"]
        SW["Swarm 架构 ~6.8K 行"]
        CO["Coordinator Mode"]
        MP["MCP 协议 ~11K 行"]
    end

    subgraph future["🔮 未发布功能 (44 Feature Flags)"]
        KA["KAIROS 永远在线"]
        SP["Speculation 投机执行"]
        UP["ULTRAPLAN 云端规划"]
        BD["Buddy 电子宠物"]
    end

    core --> ctx
    ctx --> sec
    sec --> ext
    ext -.-> future
\`\`\``,

  '【插图 4】': `\`\`\`mermaid
flowchart LR
    subgraph engine["⚙️ 引擎 = LLM 模型"]
        E["~1,296 行<br/>核心推理循环"]
    end

    subgraph car["🏎️ 整辆车 = Harness (47 万行)"]
        direction TB
        A["方向盘: 上下文管理"]
        B["刹车: 安全与权限"]
        C["导航: 工具系统"]
        D["安全气囊: 错误恢复"]
        F["变速箱: 多 Agent 协作"]
        G["仪表盘: 监控与日志"]
    end

    engine --> car
\`\`\``,

  '【插图 5】': `\`\`\`mermaid
flowchart LR
    INPUT["对话历史<br/>无限长"] --> L1

    subgraph L1["第一级: 微压缩"]
        R1["规则驱动 · 零成本<br/>清理旧工具结果<br/>保护 prompt 缓存"]
    end

    L1 --> L2

    subgraph L2["第二级: 会话记忆"]
        R2["提取结构化事实<br/>项目结构 · 用户偏好 · 任务进度<br/>持久化到本地目录"]
    end

    L2 --> L3

    subgraph L3["第三级: 完整压缩"]
        R3["独立模型调用<br/>生成摘要边界消息<br/>旧消息移出视野"]
    end

    L3 --> OUTPUT["精简上下文<br/>~200K tokens"]
\`\`\``,

  '【插图 6】': `\`\`\`mermaid
flowchart TB
    L1["1️⃣ 配置规则<br/>权限模式: 逐一确认 → 半自动 → 大部分自动 → YOLO"]
    L2["2️⃣ AST 分析<br/>解析命令结构"]
    L3["3️⃣ Bash 分类器<br/>纯规则匹配 · 只读命令自动放行"]
    L4["4️⃣ YOLO 分类器<br/>LLM-as-Judge · 两阶段架构"]
    L5["5️⃣ OS 沙箱<br/>操作系统级隔离"]
    L6["6️⃣ Hooks 拦截<br/>可插拔回调 · ~8K 行"]
    L7["7️⃣ 硬编码安全检查<br/>23 条规则 · 300KB+ 安全代码"]

    L1 --> L2 --> L3 --> L4 --> L5 --> L6 --> L7
    L7 --> SAFE["✅ 安全执行"]
\`\`\``,

  '【插图 7】': `\`\`\`mermaid
flowchart TB
    LEADER["🎯 Leader Agent<br/>任务拆解 · 分配 · 收集"]

    LEADER -->|"指令"| T1["Teammate 1"]
    LEADER -->|"指令"| T2["Teammate 2"]
    LEADER -->|"指令"| T3["Teammate 3"]

    T1 -.->|"上下文隔离"| T2
    T2 -.->|"上下文隔离"| T3

    T1 -->|"关键发现"| MEM["📝 Team Memory Sync<br/>重要信息跨 Agent 流动"]
    T2 -->|"关键发现"| MEM
    T3 -->|"关键发现"| MEM

    MEM -->|"同步"| LEADER

    COORD["🔄 Coordinator Mode<br/>纯编排: 自己不干活<br/>只拆任务 · 派任务 · 收结果"]
    COORD -.->|"模式切换"| LEADER
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
