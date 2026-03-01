import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { remark } from 'remark';
import html from 'remark-html';

const CONTENT_DIR = path.join(process.cwd(), 'content');

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
  const files = listContentFiles(`newsletters/${lang}`);
  return files
    .map((f) => readMarkdownFile(path.join(CONTENT_DIR, `newsletters/${lang}`, f)))
    .filter((item): item is ContentItem => item !== null);
}

export function getNewsletter(date: string, lang: string = 'en'): ContentItem | null {
  return readMarkdownFile(path.join(CONTENT_DIR, `newsletters/${lang}/${date}.md`));
}

export function getAllBlogPosts(lang: string = 'en'): ContentItem[] {
  const files = listContentFiles(`blog/${lang}`);
  return files
    .map((f) => readMarkdownFile(path.join(CONTENT_DIR, `blog/${lang}`, f)))
    .filter((item): item is ContentItem => item !== null);
}

export function getBlogPost(slug: string, lang: string = 'en'): ContentItem | null {
  return readMarkdownFile(path.join(CONTENT_DIR, `blog/${lang}/${slug}.md`));
}

export function getAllGlossary(lang: string = 'en'): ContentItem[] {
  const files = listContentFiles(`glossary/${lang}`);
  return files
    .map((f) => readMarkdownFile(path.join(CONTENT_DIR, `glossary/${lang}`, f)))
    .filter((item): item is ContentItem => item !== null);
}

export function getGlossaryTerm(term: string, lang: string = 'en'): ContentItem | null {
  return readMarkdownFile(path.join(CONTENT_DIR, `glossary/${lang}/${term}.md`));
}

export function getAllFaq(lang: string = 'en'): ContentItem[] {
  const files = listContentFiles(`faq/${lang}`);
  return files
    .map((f) => readMarkdownFile(path.join(CONTENT_DIR, `faq/${lang}`, f)))
    .filter((item): item is ContentItem => item !== null);
}

export function getAllCompare(lang: string = 'en'): ContentItem[] {
  const files = listContentFiles(`compare/${lang}`);
  return files
    .map((f) => readMarkdownFile(path.join(CONTENT_DIR, `compare/${lang}`, f)))
    .filter((item): item is ContentItem => item !== null);
}

export function getAllTopics(lang: string = 'en'): ContentItem[] {
  const files = listContentFiles(`topics/${lang}`);
  return files
    .map((f) => readMarkdownFile(path.join(CONTENT_DIR, `topics/${lang}`, f)))
    .filter((item): item is ContentItem => item !== null);
}

export function getWeeklyNewsletters(lang: string = 'en'): ContentItem[] {
  const files = listContentFiles(`newsletters/weekly/${lang}`);
  return files
    .map((f) => readMarkdownFile(path.join(CONTENT_DIR, `newsletters/weekly/${lang}`, f)))
    .filter((item): item is ContentItem => item !== null);
}

export async function markdownToHtml(md: string): Promise<string> {
  const result = await remark().use(html, { sanitize: false }).process(md);
  return result.toString();
}
