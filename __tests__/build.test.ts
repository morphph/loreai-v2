import { describe, it, expect } from 'vitest';
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

describe('Build verification', () => {
  const projectRoot = process.cwd();

  it('npm run build succeeds', () => {
    // This test runs the actual build — it's slow but critical
    const result = execSync('npm run build 2>&1', {
      cwd: projectRoot,
      timeout: 120000,
      encoding: 'utf-8',
    });
    expect(result).toContain('Generating static pages');
  }, 120000);

  it('build output directory exists', () => {
    expect(fs.existsSync(path.join(projectRoot, '.next'))).toBe(true);
  });

  it('sitemap route exists', () => {
    const sitemapPath = path.join(projectRoot, 'src/app/sitemap.ts');
    expect(fs.existsSync(sitemapPath)).toBe(true);
  });

  it('robots route exists', () => {
    const robotsPath = path.join(projectRoot, 'src/app/robots.ts');
    expect(fs.existsSync(robotsPath)).toBe(true);
  });

  it('feed.xml route exists', () => {
    const feedPath = path.join(projectRoot, 'src/app/feed.xml');
    const feedRoute = path.join(projectRoot, 'src/app/feed.xml/route.ts');
    expect(fs.existsSync(feedPath) || fs.existsSync(feedRoute)).toBe(true);
  });

  it('subscribe API route exists', () => {
    const apiPath = path.join(projectRoot, 'src/app/api/subscribe/route.ts');
    expect(fs.existsSync(apiPath)).toBe(true);
  });

  it('all key page routes exist', () => {
    const requiredPages = [
      'src/app/page.tsx',
      'src/app/newsletter/page.tsx',
      'src/app/newsletter/[date]/page.tsx',
      'src/app/blog/page.tsx',
      'src/app/blog/[slug]/page.tsx',
      'src/app/glossary/page.tsx',
      'src/app/glossary/[term]/page.tsx',
      'src/app/faq/page.tsx',
      'src/app/faq/[slug]/page.tsx',
      'src/app/compare/page.tsx',
      'src/app/compare/[slug]/page.tsx',
      'src/app/topics/page.tsx',
      'src/app/topics/[slug]/page.tsx',
      'src/app/subscribe/page.tsx',
    ];
    for (const pagePath of requiredPages) {
      expect(
        fs.existsSync(path.join(projectRoot, pagePath)),
        `Missing: ${pagePath}`
      ).toBe(true);
    }
  });

  it('ZH mirror routes exist', () => {
    const zhPages = [
      'src/app/zh/newsletter/page.tsx',
      'src/app/zh/newsletter/[date]/page.tsx',
      'src/app/zh/blog/page.tsx',
      'src/app/zh/blog/[slug]/page.tsx',
      'src/app/zh/glossary/page.tsx',
      'src/app/zh/glossary/[term]/page.tsx',
      'src/app/zh/faq/page.tsx',
      'src/app/zh/faq/[slug]/page.tsx',
      'src/app/zh/compare/page.tsx',
      'src/app/zh/compare/[slug]/page.tsx',
      'src/app/zh/topics/page.tsx',
      'src/app/zh/topics/[slug]/page.tsx',
    ];
    for (const pagePath of zhPages) {
      expect(
        fs.existsSync(path.join(projectRoot, pagePath)),
        `Missing ZH: ${pagePath}`
      ).toBe(true);
    }
  });
});
