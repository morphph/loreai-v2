import { describe, it, expect } from 'vitest';
import {
  baseMetadata,
  pageMetadata,
  newsletterMetadata,
  blogMetadata,
  glossaryMetadata,
  faqMetadata,
  compareMetadata,
  topicMetadata,
} from '../metadata';

describe('baseMetadata', () => {
  it('has required fields', () => {
    const meta = baseMetadata();
    expect(meta.title).toBeDefined();
    expect(meta.description).toBeDefined();
    expect(meta.openGraph).toBeDefined();
  });
});

describe('pageMetadata', () => {
  it('sets title and canonical URL', () => {
    const meta = pageMetadata('Test Page', 'A test page', '/test');
    expect(meta.title).toBe('Test Page');
    expect(meta.alternates?.canonical).toBe('https://loreai.dev/test');
  });

  it('sets hreflang alternates for EN', () => {
    const meta = pageMetadata('Test', 'Desc', '/blog/post', 'en');
    const langs = meta.alternates?.languages as Record<string, string>;
    expect(langs.en).toBe('https://loreai.dev/blog/post');
    expect(langs.zh).toBe('https://loreai.dev/zh/blog/post');
  });

  it('sets hreflang alternates for ZH', () => {
    const meta = pageMetadata('测试', '描述', '/zh/blog/post', 'zh');
    const langs = meta.alternates?.languages as Record<string, string>;
    expect(langs.en).toBe('https://loreai.dev/blog/post');
    expect(langs.zh).toBe('https://loreai.dev/zh/blog/post');
  });
});

describe('newsletterMetadata', () => {
  it('constructs correct newsletter path', () => {
    const meta = newsletterMetadata('Daily AI', 'Today news', '2026-01-15');
    expect(meta.alternates?.canonical).toBe('https://loreai.dev/newsletter/2026-01-15');
  });

  it('constructs ZH newsletter path', () => {
    const meta = newsletterMetadata('AI日报', '今日新闻', '2026-01-15', 'zh');
    expect(meta.alternates?.canonical).toBe('https://loreai.dev/zh/newsletter/2026-01-15');
  });
});

describe('blogMetadata', () => {
  it('constructs correct blog path', () => {
    const meta = blogMetadata('My Post', 'A post', 'my-post');
    expect(meta.alternates?.canonical).toBe('https://loreai.dev/blog/my-post');
  });
});

describe('glossaryMetadata', () => {
  it('constructs correct glossary path with term title', () => {
    const meta = glossaryMetadata('Transformer', 'Neural net arch', 'transformer');
    expect(meta.title).toBe('Transformer — AI Glossary');
    expect(meta.alternates?.canonical).toBe('https://loreai.dev/glossary/transformer');
  });
});

describe('faqMetadata', () => {
  it('constructs correct FAQ path', () => {
    const meta = faqMetadata('What is RAG?', 'RAG explained', 'what-is-rag');
    expect(meta.alternates?.canonical).toBe('https://loreai.dev/faq/what-is-rag');
  });
});

describe('compareMetadata', () => {
  it('constructs correct compare path', () => {
    const meta = compareMetadata('GPT vs Claude', 'Comparison', 'gpt-vs-claude');
    expect(meta.alternates?.canonical).toBe('https://loreai.dev/compare/gpt-vs-claude');
  });
});

describe('topicMetadata', () => {
  it('constructs correct topics path', () => {
    const meta = topicMetadata('LLMs', 'All about LLMs', 'llms');
    expect(meta.alternates?.canonical).toBe('https://loreai.dev/topics/llms');
  });

  it('constructs ZH topics path', () => {
    const meta = topicMetadata('大语言模型', '关于LLM', 'llms', 'zh');
    expect(meta.alternates?.canonical).toBe('https://loreai.dev/zh/topics/llms');
  });
});
