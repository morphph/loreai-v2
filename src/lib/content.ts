import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { remark } from 'remark';
import remarkGfm from 'remark-gfm';
import html from 'remark-html';

const CONTENT_DIR = path.join(process.cwd(), 'content');

const VALID_LANGS = new Set(['en', 'zh']);
const SAFE_SLUG = /^[a-z0-9][a-z0-9_-]*$/i;

/** Validate lang is in whitelist */
function assertLang(lang: string): void {
  if (!VALID_LANGS.has(lang)) throw new Error(`Invalid lang: ${lang}`);
}

/** Validate slug/date contains only safe characters (no path traversal) */
function assertSlug(slug: string): void {
  if (!SAFE_SLUG.test(slug)) throw new Error(`Invalid slug: ${slug}`);
}

export interface ContentMeta {
  title: string;
  date: string;
  slug: string;
  lang: string;
  description?: string;
  [key: string]: unknown;
}

export interface ContentItem {
  meta: ContentMeta;
  content: string;
  rawMarkdown: string;
}

export function readMarkdownFile(filePath: string): ContentItem | null {
  if (!fs.existsSync(filePath)) return null;
  const raw = fs.readFileSync(filePath, 'utf-8');
  const { data, content } = matter(raw);

  // Normalize dates: gray-matter parses YAML date-like values as Date objects
  for (const key of Object.keys(data)) {
    if (data[key] instanceof Date) {
      data[key] = (data[key] as Date).toISOString().split('T')[0];
    }
  }

  // Fallback: if no date field, use file modification time
  if (!data.date) {
    const stat = fs.statSync(filePath);
    data.date = stat.mtime.toISOString().split('T')[0];
  }

  // Auto-compute word_count if not set
  if (typeof data.word_count !== 'number') {
    // Strip markdown syntax for cleaner count
    const plain = content.replace(/```[\s\S]*?```/g, '').replace(/[#*_`\[\]()>|~-]/g, '');
    // CJK characters count as 1 word each; English words split by whitespace
    const cjk = (plain.match(/[\u4e00-\u9fff\u3400-\u4dbf]/g) || []).length;
    const english = plain.replace(/[\u4e00-\u9fff\u3400-\u4dbf]/g, '').split(/\s+/).filter(Boolean).length;
    data.word_count = cjk + english;
  }

  return {
    meta: data as ContentMeta,
    content,
    rawMarkdown: raw,
  };
}

export function listContentFiles(subdir: string): string[] {
  const dir = path.join(CONTENT_DIR, subdir);
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((f) => f.endsWith('.md') && !f.startsWith('.'))
    .sort()
    .reverse();
}

export function getAllNewsletters(lang: string = 'en'): ContentItem[] {
  assertLang(lang);
  const files = listContentFiles(`newsletters/${lang}`);
  return files
    .map((f) => readMarkdownFile(path.join(CONTENT_DIR, `newsletters/${lang}`, f)))
    .filter((item): item is ContentItem => item !== null);
}

export function getNewsletter(date: string, lang: string = 'en'): ContentItem | null {
  assertLang(lang);
  assertSlug(date);
  return readMarkdownFile(path.join(CONTENT_DIR, `newsletters/${lang}/${date}.md`));
}

export function getAllBlogPosts(lang: string = 'en'): ContentItem[] {
  assertLang(lang);
  const files = listContentFiles(`blog/${lang}`);
  return files
    .map((f) => readMarkdownFile(path.join(CONTENT_DIR, `blog/${lang}`, f)))
    .filter((item): item is ContentItem => item !== null);
}

export function getBlogPost(slug: string, lang: string = 'en'): ContentItem | null {
  assertLang(lang);
  assertSlug(slug);
  return readMarkdownFile(path.join(CONTENT_DIR, `blog/${lang}/${slug}.md`));
}

export function getAllGlossary(lang: string = 'en'): ContentItem[] {
  assertLang(lang);
  const files = listContentFiles(`glossary/${lang}`);
  return files
    .map((f) => readMarkdownFile(path.join(CONTENT_DIR, `glossary/${lang}`, f)))
    .filter((item): item is ContentItem => item !== null);
}

export function getGlossaryTerm(term: string, lang: string = 'en'): ContentItem | null {
  assertLang(lang);
  assertSlug(term);
  return readMarkdownFile(path.join(CONTENT_DIR, `glossary/${lang}/${term}.md`));
}

export function getFaq(slug: string, lang: string = 'en'): ContentItem | null {
  assertLang(lang);
  assertSlug(slug);
  return readMarkdownFile(path.join(CONTENT_DIR, `faq/${lang}/${slug}.md`));
}

export function getAllFaq(lang: string = 'en'): ContentItem[] {
  assertLang(lang);
  const files = listContentFiles(`faq/${lang}`);
  return files
    .map((f) => readMarkdownFile(path.join(CONTENT_DIR, `faq/${lang}`, f)))
    .filter((item): item is ContentItem => item !== null);
}

export function getCompare(slug: string, lang: string = 'en'): ContentItem | null {
  assertLang(lang);
  assertSlug(slug);
  return readMarkdownFile(path.join(CONTENT_DIR, `compare/${lang}/${slug}.md`));
}

export function getAllCompare(lang: string = 'en'): ContentItem[] {
  assertLang(lang);
  const files = listContentFiles(`compare/${lang}`);
  return files
    .map((f) => readMarkdownFile(path.join(CONTENT_DIR, `compare/${lang}`, f)))
    .filter((item): item is ContentItem => item !== null);
}

export function getTopic(slug: string, lang: string = 'en'): ContentItem | null {
  assertLang(lang);
  assertSlug(slug);
  return readMarkdownFile(path.join(CONTENT_DIR, `topics/${lang}/${slug}.md`));
}

export function getAllTopics(lang: string = 'en'): ContentItem[] {
  assertLang(lang);
  const files = listContentFiles(`topics/${lang}`);
  return files
    .map((f) => readMarkdownFile(path.join(CONTENT_DIR, `topics/${lang}`, f)))
    .filter((item): item is ContentItem => item !== null);
}

export function getWeeklyNewsletters(lang: string = 'en'): ContentItem[] {
  assertLang(lang);
  const files = listContentFiles(`newsletters/weekly/${lang}`);
  return files
    .map((f) => readMarkdownFile(path.join(CONTENT_DIR, `newsletters/weekly/${lang}`, f)))
    .filter((item): item is ContentItem => item !== null);
}

export function getWeeklyNewsletter(slug: string, lang: string = 'en'): ContentItem | null {
  assertLang(lang);
  assertSlug(slug);
  return readMarkdownFile(path.join(CONTENT_DIR, `newsletters/weekly/${lang}/${slug}.md`));
}

export interface AggregatedTopicContent {
  blogs: { title: string; slug: string; description: string }[];
  faqs: { title: string; slug: string; description: string }[];
  glossary: { title: string; slug: string; description: string }[];
  comparisons: { title: string; slug: string; description: string }[];
}

export function getRelatedContentForTopic(
  topicSlug: string,
  lang: string = 'en'
): AggregatedTopicContent {
  const hasTopicRef = (item: ContentItem) => {
    const topics = item.meta.related_topics;
    if (!topics) return false;
    if (typeof topics === 'string') return topics === topicSlug;
    if (Array.isArray(topics)) return topics.includes(topicSlug);
    return false;
  };

  const toEntry = (item: ContentItem) => ({
    title: item.meta.title,
    slug: item.meta.slug,
    description: (item.meta.description as string) || '',
  });

  return {
    blogs: getAllBlogPosts(lang).filter(hasTopicRef).map(toEntry),
    faqs: getAllFaq(lang).filter(hasTopicRef).map(toEntry),
    glossary: getAllGlossary(lang).filter(hasTopicRef).map(toEntry),
    comparisons: getAllCompare(lang).filter(hasTopicRef).map(toEntry),
  };
}

export async function markdownToHtml(md: string): Promise<string> {
  const result = await remark().use(remarkGfm).use(html, { sanitize: true }).process(md);
  return result.toString();
}
