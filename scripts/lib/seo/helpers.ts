/**
 * scripts/lib/seo/helpers.ts — Utility functions for the SEO pipeline
 */
import fs from 'fs';
import path from 'path';
import { getDb } from '../db';
import type { SEOPageType, ClusterDefinition } from './types';

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 60);
}

export function contentFileExists(type: SEOPageType, slug: string, lang: string): boolean {
  const filePath = path.join(process.cwd(), 'content', type, lang, `${slug}.md`);
  return fs.existsSync(filePath);
}

export function contentExistsInDb(type: SEOPageType, slug: string, lang: string): boolean {
  const db = getDb();
  const row = db
    .prepare('SELECT id FROM content WHERE type = ? AND slug = ? AND lang = ?')
    .get(type, slug, lang);
  return !!row;
}

export function contentExists(type: SEOPageType, slug: string): boolean {
  // Both EN and ZH must exist for the content to be considered complete
  const enExists = contentFileExists(type, slug, 'en') || contentExistsInDb(type, slug, 'en');
  const zhExists = contentFileExists(type, slug, 'zh') || contentExistsInDb(type, slug, 'zh');
  return enExists && zhExists;
}

export function loadSkill(): string {
  const skillPath = path.join(process.cwd(), 'skills', 'seo', 'SKILL.md');
  return fs.readFileSync(skillPath, 'utf-8');
}

export function loadBlogSkill(): string {
  const skillPath = path.join(process.cwd(), 'skills', 'blog-en', 'SKILL.md');
  return fs.readFileSync(skillPath, 'utf-8');
}

export function getWeekNumber(date: Date): string {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return `${d.getUTCFullYear()}-W${String(weekNo).padStart(2, '0')}`;
}

export function extractFrontmatter(content: string): string {
  const match = content.match(/^---\n([\s\S]*?)\n---/);
  return match ? match[0] : '';
}

export function extractBody(content: string): string {
  return content.replace(/^---[\s\S]*?---\n*/, '');
}

export function getRelatedSlugs(clusterSlug: string): {
  glossary: string[];
  blog: string[];
  compare: string[];
  faq: string[];
} {
  const db = getDb();

  // Find related content in DB for this cluster
  const keywords = db
    .prepare('SELECT keyword, content_type, content_slug FROM keywords WHERE cluster_slug = ? AND content_exists = 1')
    .all(clusterSlug) as Array<{ keyword: string; content_type: string | null; content_slug: string | null }>;

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
    .prepare("SELECT slug FROM content WHERE type = 'blog' AND lang = 'en' ORDER BY created_at DESC LIMIT 5")
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

export function buildClusterLinksString(cluster: ClusterDefinition): string {
  const links: string[] = [];
  links.push(`- Topic hub: /topics/${cluster.topic_slug}`);
  links.push(`- Cornerstone: /blog/${cluster.cornerstone.slug}`);
  for (const c of cluster.target_compare) {
    if (c.status === 'exists') links.push(`- /compare/${c.slug}`);
  }
  for (const f of cluster.target_faq) {
    if (f.status === 'exists') links.push(`- /faq/${f.slug}`);
  }
  for (const g of cluster.target_glossary) {
    if (g.status === 'exists') links.push(`- /glossary/${g.slug}`);
  }
  for (const b of cluster.tracked_blogs) {
    links.push(`- /blog/${b.slug}`);
  }
  return links.join('\n');
}
