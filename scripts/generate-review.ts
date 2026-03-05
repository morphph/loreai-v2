#!/usr/bin/env npx tsx
/**
 * Pipeline Review Report Generator
 *
 * Produces a self-contained HTML report with rendered content, validation
 * checks, and data tables for reviewing a day's pipeline output.
 *
 * Usage:
 *   npx tsx scripts/generate-review.ts --date=2026-03-05
 *   npx tsx scripts/generate-review.ts --date=2026-03-05 --no-open
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import matter from 'gray-matter';
import { remark } from 'remark';
import html from 'remark-html';
import { getDb, closeDb } from './lib/db.js';
import {
  validateNewsletter,
  validateZhNewsletter,
  validateBlogPost,
  validateGlossary,
  validateFaq,
  validateCompare,
  validateTopicHub,
} from './lib/validate.js';

// ---------------------------------------------------------------------------
// CLI args
// ---------------------------------------------------------------------------

const args = process.argv.slice(2);
function getArg(name: string): string | undefined {
  const flag = args.find((a) => a.startsWith(`--${name}=`));
  return flag ? flag.split('=')[1] : undefined;
}
const hasFlag = (name: string) => args.includes(`--${name}`);

const DATE = getArg('date') || new Date().toISOString().slice(0, 10);
const NO_OPEN = hasFlag('no-open');
const ROOT = process.cwd();

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function fileExists(rel: string): boolean {
  return fs.existsSync(path.join(ROOT, rel));
}

function readFile(rel: string): string {
  return fs.readFileSync(path.join(ROOT, rel), 'utf-8');
}

function normalizeDate(d: unknown): string {
  if (d instanceof Date) return d.toISOString().slice(0, 10);
  return String(d).slice(0, 10);
}

function countWords(md: string): number {
  const stripped = md.replace(/^---[\s\S]*?---/m, '').replace(/^#+.+$/gm, '');
  const cjkChars = (stripped.match(/[\u4e00-\u9fff\u3400-\u4dbf]/g) || []).length;
  const nonCjk = stripped.replace(/[\u4e00-\u9fff\u3400-\u4dbf]/g, ' ');
  const enWords = nonCjk.split(/\s+/).filter((w) => w.length > 0).length;
  return cjkChars + enWords;
}

function extractExternalLinks(md: string): string[] {
  const matches = md.match(/\[.*?\]\((https?:\/\/[^)]+)\)/g) || [];
  return matches.map((m) => {
    const u = m.match(/\((https?:\/\/[^)]+)\)/);
    return u ? u[1] : '';
  }).filter(Boolean);
}

function mdToHtml(md: string): string {
  // Synchronous: remark processSync
  const result = remark().use(html, { sanitize: false }).processSync(md);
  return result.toString();
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function findFilesByFrontmatterDate(dir: string, date: string): { slug: string; content: string }[] {
  const absDir = path.join(ROOT, dir);
  if (!fs.existsSync(absDir)) return [];
  const files = fs.readdirSync(absDir).filter((f) => f.endsWith('.md'));
  const results: { slug: string; content: string }[] = [];
  for (const file of files) {
    const content = fs.readFileSync(path.join(absDir, file), 'utf-8');
    try {
      const { data } = matter(content);
      if (data.date && normalizeDate(data.date) === date) {
        results.push({ slug: file.replace(/\.md$/, ''), content });
      }
    } catch { /* skip */ }
  }
  return results;
}

function findFilesModifiedToday(dir: string, date: string): { slug: string; content: string }[] {
  const absDir = path.join(ROOT, dir);
  if (!fs.existsSync(absDir)) return [];
  const files = fs.readdirSync(absDir).filter((f) => f.endsWith('.md'));
  const results: { slug: string; content: string }[] = [];
  for (const file of files) {
    const stat = fs.statSync(path.join(absDir, file));
    if (stat.mtime.toISOString().slice(0, 10) === date) {
      const content = fs.readFileSync(path.join(absDir, file), 'utf-8');
      results.push({ slug: file.replace(/\.md$/, ''), content });
    }
  }
  return results;
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface DashboardCard {
  label: string;
  status: 'pass' | 'fail' | 'missing';
  detail: string;
  errors: string[];
}

interface SeoFile { slug: string; enContent: string; zhContent: string | null; errors: string[] }

// ---------------------------------------------------------------------------
// Data collectors
// ---------------------------------------------------------------------------

function collectNewsletterData(date: string) {
  const results: { lang: string; exists: boolean; content: string; words: number; links: number; errors: string[] }[] = [];
  for (const lang of ['en', 'zh']) {
    const filePath = `content/newsletters/${lang}/${date}.md`;
    if (!fileExists(filePath)) {
      results.push({ lang, exists: false, content: '', words: 0, links: 0, errors: [`${filePath} missing`] });
      continue;
    }
    const content = readFile(filePath);
    const validation = lang === 'en' ? validateNewsletter(content) : validateZhNewsletter(content);
    const errors = validation.valid ? [] : validation.errors;
    const words = countWords(content);
    const links = [...new Set(extractExternalLinks(content))].length;
    results.push({ lang, exists: true, content, words, links, errors });
  }
  return results;
}

function collectBlogData(date: string) {
  const enPosts = findFilesByFrontmatterDate('content/blog/en', date);
  const posts: { slug: string; enContent: string; zhContent: string | null; enWords: number; zhWords: number; errors: string[] }[] = [];

  for (const post of enPosts) {
    const errors: string[] = [];
    const validation = validateBlogPost(post.content);
    if (!validation.valid) errors.push(...validation.errors);

    let zhContent: string | null = null;
    let zhWords = 0;
    const zhPath = `content/blog/zh/${post.slug}.md`;
    if (fileExists(zhPath)) {
      zhContent = readFile(zhPath);
      zhWords = countWords(zhContent);
    } else {
      errors.push('Missing ZH version');
    }

    posts.push({
      slug: post.slug,
      enContent: post.content,
      zhContent,
      enWords: countWords(post.content),
      zhWords,
      errors,
    });
  }
  return posts;
}

function collectSeoData(date: string) {
  const seoTypes = [
    { dir: 'content/glossary', label: 'glossary', validator: validateGlossary },
    { dir: 'content/faq', label: 'faq', validator: validateFaq },
    { dir: 'content/compare', label: 'compare', validator: validateCompare },
    { dir: 'content/topics', label: 'topics', validator: validateTopicHub },
  ];

  const result: Record<string, SeoFile[]> = {};

  for (const st of seoTypes) {
    const enFiles = findFilesModifiedToday(`${st.dir}/en`, date);
    const files: SeoFile[] = [];
    for (const f of enFiles) {
      const errors: string[] = [];
      const v = st.validator(f.content);
      if (!v.valid) errors.push(...v.errors);

      let zhContent: string | null = null;
      const zhPath = `${st.dir}/zh/${f.slug}.md`;
      if (fileExists(zhPath)) {
        zhContent = readFile(zhPath);
      } else {
        errors.push('Missing ZH version');
      }
      files.push({ slug: f.slug, enContent: f.content, zhContent, errors });
    }
    result[st.label] = files;
  }
  return result;
}

function collectFilteredItems(date: string) {
  const filePath = `data/filtered-items/${date}.json`;
  if (!fileExists(filePath)) return null;
  try {
    return JSON.parse(readFile(filePath)) as Array<{
      id: number; title: string; url: string; source: string;
      category: string; score: number; engagement_likes: number;
    }>;
  } catch { return null; }
}

function collectBlogSeeds(date: string) {
  const filePath = `data/blog-seeds/${date}.json`;
  if (!fileExists(filePath)) return null;
  try {
    return JSON.parse(readFile(filePath)) as Array<{
      topic: string; url: string; source: string;
      composite_score: number; suggested_angle: string;
    }>;
  } catch { return null; }
}

function collectKeywordsData(date: string) {
  const db = getDb();
  const keywords = db.prepare(`
    SELECT keyword, source, cluster_slug, search_result_count, content_exists, content_type
    FROM keywords WHERE date(discovered_at) = ?
    ORDER BY keyword
  `).all(date) as Array<{
    keyword: string; source: string; cluster_slug: string | null;
    search_result_count: number; content_exists: number; content_type: string | null;
  }>;

  const clusters = db.prepare(`
    SELECT slug, pillar_topic, mention_count, has_topic_hub,
      date(first_seen) as first_seen, date(last_seen) as last_seen
    FROM topic_clusters ORDER BY mention_count DESC
  `).all() as Array<{
    slug: string; pillar_topic: string; mention_count: number;
    has_topic_hub: number; first_seen: string; last_seen: string;
  }>;

  return { keywords, clusters };
}

// ---------------------------------------------------------------------------
// Live site benchmark
// ---------------------------------------------------------------------------

interface BenchmarkData {
  en: { html: string; storyCount: number; wordCount: number; sectionCount: number } | null;
  zh: { html: string; storyCount: number; wordCount: number; sectionCount: number } | null;
}

async function collectLiveSiteBenchmark(date: string): Promise<BenchmarkData> {
  const result: BenchmarkData = { en: null, zh: null };

  for (const lang of ['en', 'zh'] as const) {
    const url = lang === 'en'
      ? `https://loreai.dev/newsletter/${date}`
      : `https://loreai.dev/zh/newsletter/${date}`;
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 10000);
      const res = await fetch(url, {
        signal: controller.signal,
        headers: { 'User-Agent': 'LoreAI-ReviewBot/1.0' },
      });
      clearTimeout(timeout);

      if (!res.ok) {
        console.log(`  Live site ${lang.toUpperCase()}: HTTP ${res.status}`);
        continue;
      }

      const html = await res.text();
      // Extract main content area
      const mainMatch = html.match(/<main[^>]*>([\s\S]*?)<\/main>/i) || html.match(/<article[^>]*>([\s\S]*?)<\/article>/i);
      const content = mainMatch ? mainMatch[1] : html;

      // Count stories (bold items or list items)
      const storyCount = (content.match(/<strong>/gi) || []).length || (content.match(/<li>/gi) || []).length;
      // Count words (strip HTML)
      const text = content.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
      const wordCount = text.split(/\s+/).filter(w => w.length > 0).length;
      // Count sections (h2/h3)
      const sectionCount = (content.match(/<h[23][^>]*>/gi) || []).length;

      result[lang] = { html: content, storyCount, wordCount, sectionCount };
      console.log(`  Live site ${lang.toUpperCase()}: ${storyCount} stories, ${wordCount} words, ${sectionCount} sections`);
    } catch (err) {
      console.log(`  Live site ${lang.toUpperCase()}: ${(err as Error).message}`);
    }
  }

  return result;
}

// ---------------------------------------------------------------------------
// Blog errors
// ---------------------------------------------------------------------------

function collectBlogErrors(date: string): Array<{ lang: string; topic: string; error: string; timestamp: string }> {
  const errPath = `data/blog-errors/${date}.json`;
  if (!fileExists(errPath)) return [];
  try {
    return JSON.parse(readFile(errPath));
  } catch { return []; }
}

// ---------------------------------------------------------------------------
// Source label helper
// ---------------------------------------------------------------------------

function sourceLabel(source: string): string {
  if (source === 'entity-extraction') return 'Newsletter entity extraction';
  if (source === 'brave-related') return 'Brave Search related keywords';
  if (source === 'brave-discussion') return 'Brave People Also Ask';
  if (source.startsWith('blog-faq:')) return `Blog FAQ extraction (${source.slice(9)})`;
  if (source.startsWith('blog-compare:')) return `Blog comparison extraction (${source.slice(13)})`;
  if (source.startsWith('blog:')) return `Blog glossary extraction (${source.slice(5)})`;
  return source;
}

// ---------------------------------------------------------------------------
// Renderers
// ---------------------------------------------------------------------------

function statusBadge(status: 'pass' | 'fail' | 'missing'): string {
  const colors = { pass: '#22c55e', fail: '#ef4444', missing: '#a3a3a3' };
  const labels = { pass: 'PASS', fail: 'FAIL', missing: 'MISSING' };
  return `<span style="background:${colors[status]};color:#fff;padding:2px 8px;border-radius:4px;font-size:12px;font-weight:600">${labels[status]}</span>`;
}

function renderDashboard(cards: DashboardCard[]): string {
  const cardHtml = cards.map((c) => {
    const errHtml = c.errors.length > 0
      ? `<ul style="margin:8px 0 0;padding-left:18px;font-size:12px;color:#ef4444">${c.errors.map((e) => `<li>${escapeHtml(e)}</li>`).join('')}</ul>`
      : '';
    return `
      <div style="background:#fff;border:1px solid #e5e5e5;border-radius:8px;padding:16px;min-width:180px">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
          <strong>${escapeHtml(c.label)}</strong>
          ${statusBadge(c.status)}
        </div>
        <div style="font-size:14px;color:#525252">${escapeHtml(c.detail)}</div>
        ${errHtml}
      </div>`;
  }).join('');

  return `
    <section id="dashboard">
      <h2>Dashboard</h2>
      <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:12px">
        ${cardHtml}
      </div>
    </section>`;
}

function renderSideBySide(enHtml: string, zhHtml: string | null): string {
  const zhCol = zhHtml
    ? `<div style="flex:1;min-width:0"><h4 style="margin:0 0 8px;color:#737373">ZH</h4><div class="md-content">${zhHtml}</div></div>`
    : `<div style="flex:1;min-width:0"><h4 style="margin:0 0 8px;color:#737373">ZH</h4><p style="color:#a3a3a3"><em>Not found</em></p></div>`;
  return `
    <div style="display:flex;gap:24px;flex-wrap:wrap">
      <div style="flex:1;min-width:0"><h4 style="margin:0 0 8px;color:#737373">EN</h4><div class="md-content">${enHtml}</div></div>
      ${zhCol}
    </div>`;
}

function renderNewsletterSection(data: ReturnType<typeof collectNewsletterData>): string {
  const en = data.find((d) => d.lang === 'en');
  const zh = data.find((d) => d.lang === 'zh');

  if (!en?.exists && !zh?.exists) {
    return `<section id="newsletters"><h2>Newsletters</h2><p style="color:#a3a3a3">No newsletters found for ${DATE}</p></section>`;
  }

  const enHtml = en?.exists ? mdToHtml(en.content) : '';
  const zhHtml = zh?.exists ? mdToHtml(zh.content) : null;

  return `
    <section id="newsletters">
      <h2>Newsletters</h2>
      ${renderSideBySide(enHtml, zhHtml)}
    </section>`;
}

function renderBenchmarkSection(
  benchmark: BenchmarkData,
  newsletterData: ReturnType<typeof collectNewsletterData>,
): string {
  if (!benchmark.en && !benchmark.zh) {
    return `
      <section id="benchmark">
        <h2>Benchmark Comparison</h2>
        <p style="color:#a3a3a3">Could not fetch live site newsletters for comparison</p>
      </section>`;
  }

  let rows = '';
  for (const lang of ['en', 'zh'] as const) {
    const live = benchmark[lang];
    const pipeline = newsletterData.find((d) => d.lang === lang);
    if (!live && !pipeline?.exists) continue;

    const pipelineWords = pipeline?.exists ? pipeline.words : 0;
    const pipelineLinks = pipeline?.exists ? pipeline.links : 0;
    const liveWords = live?.wordCount || 0;
    const liveSections = live?.sectionCount || 0;
    const liveStories = live?.storyCount || 0;

    rows += `
      <tr>
        <td style="font-weight:600">${lang.toUpperCase()}</td>
        <td>${pipelineWords}</td>
        <td>${liveWords}</td>
        <td>${pipelineLinks}</td>
        <td>${liveStories}</td>
        <td>${liveSections}</td>
      </tr>`;
  }

  const comparisonTable = rows ? `
    <div style="overflow-x:auto;margin-bottom:16px">
      <table>
        <thead>
          <tr>
            <th>Lang</th>
            <th>Pipeline Words</th>
            <th>Live Words</th>
            <th>Pipeline Links</th>
            <th>Live Stories</th>
            <th>Live Sections</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    </div>` : '';

  // Side-by-side HTML preview
  let sideByEn = '';
  if (benchmark.en) {
    const pipelineHtml = newsletterData.find((d) => d.lang === 'en')?.exists
      ? mdToHtml(newsletterData.find((d) => d.lang === 'en')!.content)
      : '<p style="color:#a3a3a3"><em>Not found</em></p>';
    sideByEn = `
      <h3>EN: Pipeline vs Live</h3>
      <div style="display:flex;gap:16px;flex-wrap:wrap">
        <div style="flex:1;min-width:0">
          <h4 style="margin:0 0 8px;color:#737373">Pipeline Output</h4>
          <div class="md-content">${pipelineHtml}</div>
        </div>
        <div style="flex:1;min-width:0">
          <h4 style="margin:0 0 8px;color:#737373">Live Site</h4>
          <div class="md-content">${benchmark.en.html}</div>
        </div>
      </div>`;
  }

  let sideByZh = '';
  if (benchmark.zh) {
    const pipelineHtml = newsletterData.find((d) => d.lang === 'zh')?.exists
      ? mdToHtml(newsletterData.find((d) => d.lang === 'zh')!.content)
      : '<p style="color:#a3a3a3"><em>Not found</em></p>';
    sideByZh = `
      <h3 style="margin-top:24px">ZH: Pipeline vs Live</h3>
      <div style="display:flex;gap:16px;flex-wrap:wrap">
        <div style="flex:1;min-width:0">
          <h4 style="margin:0 0 8px;color:#737373">Pipeline Output</h4>
          <div class="md-content">${pipelineHtml}</div>
        </div>
        <div style="flex:1;min-width:0">
          <h4 style="margin:0 0 8px;color:#737373">Live Site</h4>
          <div class="md-content">${benchmark.zh.html}</div>
        </div>
      </div>`;
  }

  return `
    <section id="benchmark">
      <h2>Benchmark Comparison</h2>
      ${comparisonTable}
      <details>
        <summary style="cursor:pointer;padding:8px;background:#fafafa;border-radius:4px">
          <strong>Side-by-side preview</strong>
        </summary>
        <div style="padding:12px">
          ${sideByEn}
          ${sideByZh}
        </div>
      </details>
    </section>`;
}

function renderBlogErrorsSection(errors: ReturnType<typeof collectBlogErrors>): string {
  if (errors.length === 0) return '';

  const rows = errors.map((e) => `
    <tr>
      <td>${escapeHtml(e.lang.toUpperCase())}</td>
      <td>${escapeHtml(e.topic.slice(0, 80))}</td>
      <td style="color:#ef4444">${escapeHtml(e.error)}</td>
      <td>${escapeHtml(e.timestamp)}</td>
    </tr>`).join('');

  return `
    <div style="background:#fef2f2;padding:12px;border-radius:8px;margin-bottom:12px">
      <h4 style="margin:0 0 8px;color:#991b1b">Blog Generation Errors (${errors.length})</h4>
      <table>
        <thead><tr><th>Lang</th><th>Topic</th><th>Error</th><th>Time</th></tr></thead>
        <tbody>${rows}</tbody>
      </table>
    </div>`;
}

function renderBlogSection(posts: ReturnType<typeof collectBlogData>, blogErrors?: ReturnType<typeof collectBlogErrors>): string {
  const errorsHtml = blogErrors && blogErrors.length > 0 ? renderBlogErrorsSection(blogErrors) : '';

  if (posts.length === 0) {
    return `<section id="blogs"><h2>Blogs</h2>${errorsHtml}<p style="color:#a3a3a3">No blog posts found for ${DATE}</p></section>`;
  }

  const postsHtml = posts.map((p) => {
    const errBadge = p.errors.length > 0
      ? ` <span style="color:#ef4444;font-size:12px">(${p.errors.length} issue${p.errors.length > 1 ? 's' : ''})</span>`
      : ' <span style="color:#22c55e;font-size:12px">(OK)</span>';
    const enHtml = mdToHtml(p.enContent);
    const zhHtml = p.zhContent ? mdToHtml(p.zhContent) : null;
    const errList = p.errors.length > 0
      ? `<div style="background:#fef2f2;padding:8px 12px;border-radius:4px;margin-bottom:12px;font-size:13px;color:#991b1b">${p.errors.map((e) => `<div>• ${escapeHtml(e)}</div>`).join('')}</div>`
      : '';
    return `
      <details style="margin-bottom:8px">
        <summary style="cursor:pointer;padding:8px;background:#fafafa;border-radius:4px">
          <strong>${escapeHtml(p.slug)}</strong> — ${p.enWords} EN / ${p.zhWords} ZH words${errBadge}
        </summary>
        <div style="padding:12px">
          ${errList}
          ${renderSideBySide(enHtml, zhHtml)}
        </div>
      </details>`;
  }).join('');

  return `<section id="blogs"><h2>Blogs (${posts.length})</h2>${errorsHtml}${postsHtml}</section>`;
}

function renderSeoSection(seo: ReturnType<typeof collectSeoData>): string {
  const totalCount = Object.values(seo).reduce((sum, files) => sum + files.length, 0);
  if (totalCount === 0) {
    return `<section id="seo"><h2>SEO Pages</h2><p style="color:#a3a3a3">No SEO pages modified on ${DATE}</p></section>`;
  }

  const typesHtml = Object.entries(seo).filter(([, files]) => files.length > 0).map(([type, files]) => {
    const filesHtml = files.map((f) => {
      const errBadge = f.errors.length > 0
        ? ` <span style="color:#ef4444;font-size:12px">(${f.errors.length} issue${f.errors.length > 1 ? 's' : ''})</span>`
        : ' <span style="color:#22c55e;font-size:12px">(OK)</span>';
      const enHtml = mdToHtml(f.enContent);
      const zhHtml = f.zhContent ? mdToHtml(f.zhContent) : null;
      const errList = f.errors.length > 0
        ? `<div style="background:#fef2f2;padding:8px 12px;border-radius:4px;margin-bottom:12px;font-size:13px;color:#991b1b">${f.errors.map((e) => `<div>• ${escapeHtml(e)}</div>`).join('')}</div>`
        : '';
      return `
        <details style="margin-bottom:4px;margin-left:16px">
          <summary style="cursor:pointer;padding:6px;background:#fafafa;border-radius:4px">
            ${escapeHtml(f.slug)}${errBadge}
          </summary>
          <div style="padding:12px">
            ${errList}
            ${renderSideBySide(enHtml, zhHtml)}
          </div>
        </details>`;
    }).join('');

    return `
      <details style="margin-bottom:8px" open>
        <summary style="cursor:pointer;padding:8px;background:#f0f0f0;border-radius:4px;font-weight:600">
          ${type} (${files.length})
        </summary>
        <div style="padding:8px 0">${filesHtml}</div>
      </details>`;
  }).join('');

  return `<section id="seo"><h2>SEO Pages (${totalCount})</h2>${typesHtml}</section>`;
}

function renderSourceDistribution(filteredItems: ReturnType<typeof collectFilteredItems>): string {
  if (!filteredItems || filteredItems.length === 0) return '';

  const counts: Record<string, number> = {};
  for (const item of filteredItems) {
    const prefix = item.source.split(':')[0];
    counts[prefix] = (counts[prefix] || 0) + 1;
  }

  const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
  const maxCount = sorted[0]?.[1] || 1;

  const bars = sorted.map(([source, count]) => {
    const pct = Math.round((count / maxCount) * 100);
    const colors: Record<string, string> = {
      twitter: '#1da1f2', rss: '#f97316', blog: '#8b5cf6', github: '#333',
      huggingface: '#fbbf24', hackernews: '#ff6600', reddit: '#ff4500',
    };
    const color = colors[source] || '#6b7280';
    return `
      <tr>
        <td style="width:120px;font-weight:600">${escapeHtml(source)}</td>
        <td>
          <div style="background:#f0f0f0;border-radius:4px;overflow:hidden;height:20px">
            <div style="background:${color};height:100%;width:${pct}%;min-width:2px;border-radius:4px;transition:width 0.3s"></div>
          </div>
        </td>
        <td style="width:50px;text-align:right;font-weight:600">${count}</td>
      </tr>`;
  }).join('');

  return `
    <section id="source-distribution">
      <h2>Source Distribution</h2>
      <table style="border-collapse:collapse;width:100%">
        <tbody>${bars}</tbody>
      </table>
      <p style="font-size:12px;color:#737373">${filteredItems.length} total items across ${sorted.length} source types</p>
    </section>`;
}

function renderDataSection(
  filteredItems: ReturnType<typeof collectFilteredItems>,
  blogSeeds: ReturnType<typeof collectBlogSeeds>,
): string {
  let itemsHtml = '<p style="color:#a3a3a3">No filtered items file found</p>';
  if (filteredItems && filteredItems.length > 0) {
    const rows = filteredItems.map((item) => `
      <tr>
        <td>${item.score}</td>
        <td>${escapeHtml(item.category)}</td>
        <td title="${escapeHtml(item.title)}">${escapeHtml(item.title.slice(0, 80))}${item.title.length > 80 ? '…' : ''}</td>
        <td>${escapeHtml(item.source)}</td>
        <td style="text-align:right">${item.engagement_likes.toLocaleString()}</td>
      </tr>`).join('');
    itemsHtml = `
      <div style="overflow-x:auto">
        <table>
          <thead><tr><th>Score</th><th>Category</th><th>Title</th><th>Source</th><th style="text-align:right">Likes</th></tr></thead>
          <tbody>${rows}</tbody>
        </table>
        <p style="font-size:12px;color:#737373">${filteredItems.length} items</p>
      </div>`;
  }

  let seedsHtml = '<p style="color:#a3a3a3">No blog seeds file found</p>';
  if (blogSeeds && blogSeeds.length > 0) {
    const rows = blogSeeds.map((s) => `
      <tr>
        <td>${s.composite_score.toFixed(1)}</td>
        <td title="${escapeHtml(s.topic)}">${escapeHtml(s.topic.slice(0, 80))}${s.topic.length > 80 ? '…' : ''}</td>
        <td>${escapeHtml(s.source)}</td>
        <td>${escapeHtml(s.suggested_angle)}</td>
      </tr>`).join('');
    seedsHtml = `
      <div style="overflow-x:auto">
        <table>
          <thead><tr><th>Score</th><th>Topic</th><th>Source</th><th>Angle</th></tr></thead>
          <tbody>${rows}</tbody>
        </table>
        <p style="font-size:12px;color:#737373">${blogSeeds.length} seeds</p>
      </div>`;
  }

  return `
    <section id="data">
      <h2>Data</h2>
      <h3>Filtered Items</h3>
      ${itemsHtml}
      <h3 style="margin-top:24px">Blog Seeds</h3>
      ${seedsHtml}
    </section>`;
}

function renderKeywordsSection(data: ReturnType<typeof collectKeywordsData>): string {
  let kwHtml = '<p style="color:#a3a3a3">No keywords discovered today</p>';
  if (data.keywords.length > 0) {
    const rows = data.keywords.map((k) => `
      <tr>
        <td>${escapeHtml(k.keyword)}</td>
        <td>${escapeHtml(sourceLabel(k.source))}</td>
        <td>${k.cluster_slug ? escapeHtml(k.cluster_slug) : '—'}</td>
        <td>${k.content_exists ? `✓ ${k.content_type || ''}` : '—'}</td>
      </tr>`).join('');
    kwHtml = `
      <div style="overflow-x:auto">
        <table>
          <thead><tr><th>Keyword</th><th>Source</th><th>Cluster</th><th>Content</th></tr></thead>
          <tbody>${rows}</tbody>
        </table>
        <p style="font-size:12px;color:#737373">${data.keywords.length} keywords</p>
      </div>`;
  }

  let clusterHtml = '<p style="color:#a3a3a3">No topic clusters</p>';
  if (data.clusters.length > 0) {
    const rows = data.clusters.map((c) => `
      <tr>
        <td>${escapeHtml(c.slug)}</td>
        <td>${escapeHtml(c.pillar_topic)}</td>
        <td style="text-align:right">${c.mention_count}</td>
        <td>${c.has_topic_hub ? '✓' : '—'}</td>
        <td>${c.first_seen}</td>
        <td>${c.last_seen}</td>
      </tr>`).join('');
    clusterHtml = `
      <div style="overflow-x:auto">
        <table>
          <thead><tr><th>Slug</th><th>Pillar Topic</th><th style="text-align:right">Mentions</th><th>Hub</th><th>First Seen</th><th>Last Seen</th></tr></thead>
          <tbody>${rows}</tbody>
        </table>
        <p style="font-size:12px;color:#737373">${data.clusters.length} clusters</p>
      </div>`;
  }

  return `
    <section id="keywords">
      <h2>Keywords</h2>
      <h3>Discovered Today</h3>
      ${kwHtml}
      <h3 style="margin-top:24px">Topic Clusters</h3>
      ${clusterHtml}
    </section>`;
}

// ---------------------------------------------------------------------------
// HTML assembly
// ---------------------------------------------------------------------------

function buildHtml(sections: string[]): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Pipeline Review — ${DATE}</title>
<style>
  * { box-sizing: border-box; }
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0; background: #f5f5f5; color: #171717; line-height: 1.6; }
  nav { position: sticky; top: 0; z-index: 100; background: #171717; color: #fff; padding: 8px 24px; display: flex; gap: 16px; align-items: center; flex-wrap: wrap; }
  nav a { color: #a3a3a3; text-decoration: none; font-size: 13px; padding: 4px 8px; border-radius: 4px; }
  nav a:hover { color: #fff; background: #333; }
  nav .title { font-weight: 700; font-size: 15px; color: #fff; margin-right: 12px; }
  main { max-width: 1400px; margin: 0 auto; padding: 24px; }
  section { background: #fff; border-radius: 8px; padding: 24px; margin-bottom: 16px; border: 1px solid #e5e5e5; }
  h2 { margin-top: 0; padding-bottom: 8px; border-bottom: 2px solid #e5e5e5; }
  h3 { color: #525252; }
  table { width: 100%; border-collapse: collapse; font-size: 13px; }
  th, td { padding: 6px 10px; border-bottom: 1px solid #e5e5e5; text-align: left; }
  th { background: #fafafa; font-weight: 600; position: sticky; top: 44px; }
  tr:hover td { background: #fafafa; }
  .md-content { font-size: 14px; max-height: 600px; overflow-y: auto; padding: 12px; border: 1px solid #e5e5e5; border-radius: 4px; background: #fafafa; }
  .md-content h1 { font-size: 20px; }
  .md-content h2 { font-size: 17px; border: none; padding: 0; }
  .md-content h3 { font-size: 15px; }
  .md-content a { color: #2563eb; }
  .md-content blockquote { border-left: 3px solid #d4d4d4; margin: 8px 0; padding: 4px 12px; color: #525252; }
  .md-content pre { background: #f0f0f0; padding: 8px; border-radius: 4px; overflow-x: auto; font-size: 12px; }
  .md-content code { background: #f0f0f0; padding: 1px 4px; border-radius: 2px; font-size: 12px; }
  .md-content table { margin: 8px 0; }
  details summary { user-select: none; }
  details[open] > summary { margin-bottom: 8px; }
</style>
</head>
<body>
<nav>
  <span class="title">Pipeline Review — ${DATE}</span>
  <a href="#dashboard">Dashboard</a>
  <a href="#newsletters">Newsletters</a>
  <a href="#benchmark">Benchmark</a>
  <a href="#blogs">Blogs</a>
  <a href="#seo">SEO</a>
  <a href="#data">Data</a>
  <a href="#keywords">Keywords</a>
</nav>
<main>
${sections.join('\n')}
</main>
</body>
</html>`;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function run(): Promise<void> {
  console.log(`Generating review report for ${DATE}...`);

  // Collect all data
  const newsletterData = collectNewsletterData(DATE);
  const blogData = collectBlogData(DATE);
  const seoData = collectSeoData(DATE);
  const filteredItems = collectFilteredItems(DATE);
  const blogSeeds = collectBlogSeeds(DATE);
  const keywordsData = collectKeywordsData(DATE);
  const blogErrors = collectBlogErrors(DATE);

  closeDb();

  // Fetch live site benchmark (async)
  console.log('Fetching live site benchmark...');
  const benchmark = await collectLiveSiteBenchmark(DATE);

  // Build dashboard cards
  const cards: DashboardCard[] = [];

  // Newsletter cards
  for (const nl of newsletterData) {
    const label = `Newsletter ${nl.lang.toUpperCase()}`;
    if (!nl.exists) {
      cards.push({ label, status: 'missing', detail: 'File not found', errors: nl.errors });
    } else {
      cards.push({
        label,
        status: nl.errors.length > 0 ? 'fail' : 'pass',
        detail: `${nl.words} words, ${nl.links} links`,
        errors: nl.errors,
      });
    }
  }

  // Blog card
  if (blogData.length === 0) {
    cards.push({ label: 'Blog', status: blogErrors.length > 0 ? 'fail' : 'missing', detail: blogErrors.length > 0 ? `${blogErrors.length} error(s)` : 'No posts found', errors: blogErrors.map(e => `[${e.lang}] ${e.error}`) });
  } else {
    const totalErrors = blogData.reduce((s, p) => s + p.errors.length, 0) + blogErrors.length;
    cards.push({
      label: 'Blog',
      status: totalErrors > 0 ? 'fail' : 'pass',
      detail: `${blogData.length} post(s)${blogErrors.length > 0 ? `, ${blogErrors.length} error(s)` : ''}`,
      errors: [
        ...blogData.flatMap((p) => p.errors.map((e) => `[${p.slug}] ${e}`)),
        ...blogErrors.map(e => `[${e.lang}] ${e.error}`),
      ],
    });
  }

  // SEO card
  const seoTotal = Object.values(seoData).reduce((s, f) => s + f.length, 0);
  const seoErrors = Object.values(seoData).flatMap((files) => files.flatMap((f) => f.errors.map((e) => `[${f.slug}] ${e}`)));
  const seoParts = Object.entries(seoData).filter(([, f]) => f.length > 0).map(([t, f]) => `${f.length} ${t}`);
  cards.push({
    label: 'SEO Pages',
    status: seoErrors.length > 0 ? 'fail' : (seoTotal > 0 ? 'pass' : 'missing'),
    detail: seoParts.length > 0 ? seoParts.join(', ') : 'None today',
    errors: seoErrors,
  });

  // Data card
  cards.push({
    label: 'Filtered Items',
    status: filteredItems ? 'pass' : 'missing',
    detail: filteredItems ? `${filteredItems.length} items` : 'File not found',
    errors: [],
  });
  cards.push({
    label: 'Blog Seeds',
    status: blogSeeds ? 'pass' : 'missing',
    detail: blogSeeds ? `${blogSeeds.length} seeds` : 'File not found',
    errors: [],
  });

  // Keywords card
  cards.push({
    label: 'Keywords',
    status: keywordsData.keywords.length > 0 ? 'pass' : 'missing',
    detail: `${keywordsData.keywords.length} new, ${keywordsData.clusters.length} clusters`,
    errors: [],
  });

  // Render sections
  const sections = [
    renderDashboard(cards),
    renderSourceDistribution(filteredItems),
    renderNewsletterSection(newsletterData),
    renderBenchmarkSection(benchmark, newsletterData),
    renderBlogSection(blogData, blogErrors),
    renderSeoSection(seoData),
    renderDataSection(filteredItems, blogSeeds),
    renderKeywordsSection(keywordsData),
  ];

  const htmlContent = buildHtml(sections);

  // Write output
  const outDir = path.join(ROOT, 'data/review');
  fs.mkdirSync(outDir, { recursive: true });
  const outPath = path.join(outDir, `${DATE}.html`);
  fs.writeFileSync(outPath, htmlContent, 'utf-8');
  console.log(`Report written to ${outPath}`);

  // Open in browser
  if (!NO_OPEN) {
    const platform = process.platform;
    const cmd = platform === 'darwin' ? 'open' : platform === 'win32' ? 'start' : 'xdg-open';
    try {
      execSync(`${cmd} "${outPath}"`);
      console.log('Opened in browser.');
    } catch {
      console.log('Could not auto-open. Please open the file manually.');
    }
  }
}

run().catch((err) => {
  console.error('Review report failed:', err);
  process.exit(1);
});
