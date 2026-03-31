#!/usr/bin/env npx tsx
/**
 * Build a link-targets.json file that maps every published page URL
 * to its title and keywords. Used by content generation pipelines
 * to inject internal links.
 *
 * Usage:
 *   npx tsx scripts/build-link-targets.ts
 *   npx tsx scripts/build-link-targets.ts --lang=en   # single language
 */

import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';

const ROOT = process.cwd();
const CONTENT_DIR = path.join(ROOT, 'content');
const OUT_FILE = path.join(ROOT, 'data', 'link-targets.json');

const langArg = process.argv.find((a) => a.startsWith('--lang='));
const LANGS = langArg ? [langArg.split('=')[1]] : ['en', 'zh'];

interface LinkTarget {
  title: string;
  keywords: string[];
  type: string;
}

type LinkTargetMap = Record<string, LinkTarget>;

function slugToKeywords(slug: string): string[] {
  return [slug.replace(/-/g, ' ')];
}

function readDir(dir: string): string[] {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir).filter((f) => f.endsWith('.md') && !f.startsWith('.'));
}

function buildForLang(lang: string): LinkTargetMap {
  const prefix = lang === 'en' ? '' : `/${lang}`;
  const targets: LinkTargetMap = {};

  // Blog posts
  const blogDir = path.join(CONTENT_DIR, 'blog', lang);
  for (const file of readDir(blogDir)) {
    const raw = fs.readFileSync(path.join(blogDir, file), 'utf-8');
    const { data } = matter(raw);
    const slug = data.slug || file.replace(/\.md$/, '');
    const url = `${prefix}/blog/${slug}`;
    const keywords = [
      ...slugToKeywords(slug),
      ...(Array.isArray(data.keywords) ? data.keywords : []),
    ];
    targets[url] = { title: data.title || slug, keywords, type: 'blog' };
  }

  // FAQ
  const faqDir = path.join(CONTENT_DIR, 'faq', lang);
  for (const file of readDir(faqDir)) {
    const raw = fs.readFileSync(path.join(faqDir, file), 'utf-8');
    const { data } = matter(raw);
    const slug = data.slug || file.replace(/\.md$/, '');
    const url = `${prefix}/faq/${slug}`;
    targets[url] = { title: data.title || slug, keywords: slugToKeywords(slug), type: 'faq' };
  }

  // Glossary
  const glossDir = path.join(CONTENT_DIR, 'glossary', lang);
  for (const file of readDir(glossDir)) {
    const raw = fs.readFileSync(path.join(glossDir, file), 'utf-8');
    const { data } = matter(raw);
    const term = data.term || data.slug || file.replace(/\.md$/, '');
    const displayTerm = data.display_term || data.title || term;
    const url = `${prefix}/glossary/${term}`;
    targets[url] = {
      title: displayTerm,
      keywords: [displayTerm.toLowerCase(), ...slugToKeywords(term)],
      type: 'glossary',
    };
  }

  // Compare
  const compDir = path.join(CONTENT_DIR, 'compare', lang);
  for (const file of readDir(compDir)) {
    const raw = fs.readFileSync(path.join(compDir, file), 'utf-8');
    const { data } = matter(raw);
    const slug = data.slug || file.replace(/\.md$/, '');
    const url = `${prefix}/compare/${slug}`;
    const keywords = slugToKeywords(slug);
    if (data.item_a) keywords.push(`${data.item_a} vs ${data.item_b}`.toLowerCase());
    targets[url] = { title: data.title || slug, keywords, type: 'compare' };
  }

  // Topics
  const topicDir = path.join(CONTENT_DIR, 'topics', lang);
  for (const file of readDir(topicDir)) {
    const raw = fs.readFileSync(path.join(topicDir, file), 'utf-8');
    const { data } = matter(raw);
    const slug = data.slug || file.replace(/\.md$/, '');
    const url = `${prefix}/topics/${slug}`;
    const pillar = data.pillar_topic || data.title || slug;
    targets[url] = {
      title: pillar,
      keywords: [pillar.toLowerCase(), ...slugToKeywords(slug)],
      type: 'topic',
    };
  }

  return targets;
}

// ---------------------------------------------------------------------------

function main() {
  const allTargets: LinkTargetMap = {};

  for (const lang of LANGS) {
    const langTargets = buildForLang(lang);
    Object.assign(allTargets, langTargets);
  }

  // Ensure data/ directory exists
  const dataDir = path.dirname(OUT_FILE);
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

  fs.writeFileSync(OUT_FILE, JSON.stringify(allTargets, null, 2));
  console.log(`Wrote ${Object.keys(allTargets).length} link targets to ${OUT_FILE}`);
}

main();
