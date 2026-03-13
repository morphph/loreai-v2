import { describe, it, expect } from 'vitest';
import {
  websiteJsonLd,
  articleJsonLd,
  faqPageJsonLd,
  definedTermJsonLd,
  breadcrumbJsonLd,
  jsonLdScript,
} from '../seo';

describe('websiteJsonLd', () => {
  it('returns valid WebSite schema', () => {
    const ld = websiteJsonLd();
    expect(ld['@context']).toBe('https://schema.org');
    expect(ld['@type']).toBe('WebSite');
    expect(ld.name).toBe('LoreAI');
    expect(ld.url).toBe('https://loreai.dev');
  });

  it('does not include SearchAction (no /search route)', () => {
    const ld = websiteJsonLd();
    expect(ld).not.toHaveProperty('potentialAction');
  });

  it('does not include logo (no logo.png in public)', () => {
    const ld = websiteJsonLd();
    expect(ld.publisher).not.toHaveProperty('logo');
  });
});

describe('articleJsonLd', () => {
  it('defaults to NewsArticle type', () => {
    const ld = articleJsonLd(
      'Test Article',
      '2026-01-15',
      'A test description',
      'https://loreai.dev/blog/test'
    );
    expect(ld['@context']).toBe('https://schema.org');
    expect(ld['@type']).toBe('NewsArticle');
    expect(ld.headline).toBe('Test Article');
    expect(ld.datePublished).toBe('2026-01-15');
    expect(ld.description).toBe('A test description');
    expect(ld.url).toBe('https://loreai.dev/blog/test');
  });

  it('uses Article type when specified', () => {
    const ld = articleJsonLd(
      'Blog Post',
      '2026-02-01',
      'A blog post',
      'https://loreai.dev/blog/post',
      'Article'
    );
    expect(ld['@type']).toBe('Article');
  });

  it('does not include logo in publisher', () => {
    const ld = articleJsonLd(
      'Test',
      '2026-01-15',
      'desc',
      'https://loreai.dev/blog/test'
    );
    expect(ld.publisher).not.toHaveProperty('logo');
  });
});

describe('faqPageJsonLd', () => {
  it('returns correct FAQPage structure', () => {
    const questions = [
      { q: 'What is AI?', a: 'Artificial Intelligence.' },
      { q: 'What is ML?', a: 'Machine Learning.' },
    ];
    const ld = faqPageJsonLd(questions);
    expect(ld['@type']).toBe('FAQPage');
    expect(ld.mainEntity).toHaveLength(2);
    expect(ld.mainEntity[0]['@type']).toBe('Question');
    expect(ld.mainEntity[0].name).toBe('What is AI?');
    expect(ld.mainEntity[0].acceptedAnswer['@type']).toBe('Answer');
    expect(ld.mainEntity[0].acceptedAnswer.text).toBe('Artificial Intelligence.');
  });
});

describe('definedTermJsonLd', () => {
  it('has term and definition', () => {
    const ld = definedTermJsonLd('Transformer', 'A neural network architecture.');
    expect(ld['@type']).toBe('DefinedTerm');
    expect(ld.name).toBe('Transformer');
    expect(ld.description).toBe('A neural network architecture.');
  });
});

describe('breadcrumbJsonLd', () => {
  it('returns ordered list with positions', () => {
    const ld = breadcrumbJsonLd([
      { name: 'Home', url: 'https://loreai.dev' },
      { name: 'Blog', url: 'https://loreai.dev/blog' },
      { name: 'Post', url: 'https://loreai.dev/blog/post' },
    ]);
    expect(ld['@type']).toBe('BreadcrumbList');
    expect(ld.itemListElement).toHaveLength(3);
    expect(ld.itemListElement[0].position).toBe(1);
    expect(ld.itemListElement[1].position).toBe(2);
    expect(ld.itemListElement[2].position).toBe(3);
  });
});

describe('jsonLdScript', () => {
  it('outputs valid parseable JSON string', () => {
    const data = websiteJsonLd();
    const output = jsonLdScript(data);
    const parsed = JSON.parse(output);
    expect(parsed['@context']).toBe('https://schema.org');
    expect(parsed['@type']).toBe('WebSite');
  });
});
