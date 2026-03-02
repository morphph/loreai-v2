import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import fs from 'fs';
import path from 'path';
import {
  readMarkdownFile,
  listContentFiles,
  getAllNewsletters,
  getNewsletter,
  getAllBlogPosts,
  getBlogPost,
  getAllGlossary,
  getGlossaryTerm,
  getAllFaq,
  getFaq,
  getAllCompare,
  getCompare,
  getAllTopics,
  getTopic,
  getWeeklyNewsletters,
  getWeeklyNewsletter,
  markdownToHtml,
} from '../content';

// Point content functions to our fixtures directory
const FIXTURES_DIR = path.resolve(__dirname, '../../../__fixtures__');
const CONTENT_DIR = path.join(process.cwd(), 'content');

// We'll create symlinks or copy fixtures into the real content dir
// Actually, since content.ts uses process.cwd()/content, we need to
// temporarily set up content there.

let originalContentExists: boolean;
let backedUp = false;

beforeAll(() => {
  originalContentExists = fs.existsSync(CONTENT_DIR);

  if (originalContentExists) {
    // Content dir exists — check if it has actual files we'd overwrite
    // If it's mostly empty (no newsletters), we can safely add fixtures
    const enDir = path.join(CONTENT_DIR, 'newsletters/en');
    if (fs.existsSync(enDir) && fs.readdirSync(enDir).filter(f => f.endsWith('.md')).length > 0) {
      // Has real content — back it up
      fs.renameSync(CONTENT_DIR, CONTENT_DIR + '.bak');
      backedUp = true;
    } else {
      // Empty content dir — remove it
      fs.rmSync(CONTENT_DIR, { recursive: true });
    }
  }

  // Copy fixtures to content dir
  copyDirSync(FIXTURES_DIR, CONTENT_DIR);
});

afterAll(() => {
  // Clean up: remove test content and restore backup if needed
  if (fs.existsSync(CONTENT_DIR)) {
    fs.rmSync(CONTENT_DIR, { recursive: true });
  }
  if (backedUp) {
    fs.renameSync(CONTENT_DIR + '.bak', CONTENT_DIR);
  } else if (originalContentExists) {
    fs.mkdirSync(CONTENT_DIR, { recursive: true });
  }
});

function copyDirSync(src: string, dest: string) {
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyDirSync(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

// ── readMarkdownFile ───────────────────────────────────────────────────

describe('readMarkdownFile', () => {
  it('parses frontmatter and content from valid markdown', () => {
    const filePath = path.join(CONTENT_DIR, 'newsletters/en/2026-01-15.md');
    const result = readMarkdownFile(filePath);
    expect(result).not.toBeNull();
    expect(result!.meta.title).toBe('AI Moves Fast: Jan 15 Briefing');
    expect(result!.content).toContain('## Model Releases');
    expect(result!.rawMarkdown).toContain('---');
  });

  it('returns null for nonexistent file', () => {
    const result = readMarkdownFile('/nonexistent/path/file.md');
    expect(result).toBeNull();
  });

  it('normalizes Date objects to string', () => {
    const filePath = path.join(CONTENT_DIR, 'newsletters/en/2026-01-15.md');
    const result = readMarkdownFile(filePath);
    expect(result).not.toBeNull();
    // gray-matter parses YAML dates as Date objects; our code converts them
    expect(typeof result!.meta.date).toBe('string');
  });
});

// ── Newsletter functions ───────────────────────────────────────────────

describe('getAllNewsletters', () => {
  it('returns sorted array (descending)', () => {
    const newsletters = getAllNewsletters('en');
    expect(newsletters.length).toBeGreaterThanOrEqual(2);
    // Descending: 2026-01-15 before 2026-01-14
    const dates = newsletters.map((n) => n.meta.date);
    for (let i = 0; i < dates.length - 1; i++) {
      expect(dates[i] >= dates[i + 1]).toBe(true);
    }
  });

  it('returns ZH newsletters from ZH path', () => {
    const newsletters = getAllNewsletters('zh');
    expect(newsletters.length).toBeGreaterThanOrEqual(1);
    expect(newsletters[0].meta.title).toContain('AI快报');
  });
});

describe('getNewsletter', () => {
  it('returns content for existing date', () => {
    const result = getNewsletter('2026-01-15', 'en');
    expect(result).not.toBeNull();
    expect(result!.meta.title).toContain('Jan 15');
  });

  it('returns null for missing date', () => {
    const result = getNewsletter('9999-12-31', 'en');
    expect(result).toBeNull();
  });
});

// ── Weekly Newsletter ──────────────────────────────────────────────────

describe('getWeeklyNewsletters', () => {
  it('returns weekly newsletters list', () => {
    const weeklies = getWeeklyNewsletters('en');
    expect(weeklies.length).toBeGreaterThanOrEqual(1);
  });
});

describe('getWeeklyNewsletter', () => {
  it('resolves YYYY-WXX slug', () => {
    const result = getWeeklyNewsletter('2026-W03', 'en');
    expect(result).not.toBeNull();
    expect(result!.meta.title).toContain('Week 3');
  });
});

// ── Blog ───────────────────────────────────────────────────────────────

describe('Blog content loading', () => {
  it('getAllBlogPosts returns posts', () => {
    const posts = getAllBlogPosts('en');
    expect(posts.length).toBeGreaterThanOrEqual(1);
  });

  it('getBlogPost returns specific post', () => {
    const post = getBlogPost('gpt5-turbo-review', 'en');
    expect(post).not.toBeNull();
    expect(post!.meta.title).toContain('GPT-5 Turbo');
  });
});

// ── Glossary ───────────────────────────────────────────────────────────

describe('Glossary content loading', () => {
  it('getAllGlossary returns terms', () => {
    const terms = getAllGlossary('en');
    expect(terms.length).toBeGreaterThanOrEqual(1);
  });

  it('getGlossaryTerm returns specific term', () => {
    const term = getGlossaryTerm('transformer', 'en');
    expect(term).not.toBeNull();
    expect(term!.meta.title).toBe('Transformer');
  });
});

// ── FAQ ────────────────────────────────────────────────────────────────

describe('FAQ content loading', () => {
  it('getAllFaq returns items', () => {
    const items = getAllFaq('en');
    expect(items.length).toBeGreaterThanOrEqual(1);
  });

  it('getFaq returns specific item', () => {
    const item = getFaq('what-is-rag', 'en');
    expect(item).not.toBeNull();
    expect(item!.meta.title).toContain('RAG');
  });
});

// ── Compare ────────────────────────────────────────────────────────────

describe('Compare content loading', () => {
  it('getAllCompare returns items', () => {
    const items = getAllCompare('en');
    expect(items.length).toBeGreaterThanOrEqual(1);
  });

  it('getCompare returns specific item', () => {
    const item = getCompare('gpt4-vs-claude3', 'en');
    expect(item).not.toBeNull();
    expect(item!.meta.title).toContain('GPT-4 vs Claude 3');
  });
});

// ── Topics ─────────────────────────────────────────────────────────────

describe('Topics content loading', () => {
  it('getAllTopics returns items', () => {
    const items = getAllTopics('en');
    expect(items.length).toBeGreaterThanOrEqual(1);
  });

  it('getTopic returns specific item', () => {
    const item = getTopic('large-language-models', 'en');
    expect(item).not.toBeNull();
    expect(item!.meta.title).toContain('Large Language Models');
  });
});

// ── markdownToHtml ─────────────────────────────────────────────────────

describe('markdownToHtml', () => {
  it('converts markdown to HTML', async () => {
    const html = await markdownToHtml('# Hello\n\nWorld');
    expect(html).toContain('<h1>Hello</h1>');
    expect(html).toContain('<p>World</p>');
  });

  it('handles bold and links', async () => {
    const html = await markdownToHtml('**bold** and [link](https://example.com)');
    expect(html).toContain('<strong>bold</strong>');
    expect(html).toContain('<a href="https://example.com">link</a>');
  });
});
