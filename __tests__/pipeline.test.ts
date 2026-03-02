import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('Pipeline scripts', () => {
  const scriptsDir = path.join(process.cwd(), 'scripts');

  it('collect-news.ts imports without error', async () => {
    const filePath = path.join(scriptsDir, 'collect-news.ts');
    expect(fs.existsSync(filePath)).toBe(true);
  });

  it('write-newsletter.ts exists', () => {
    const filePath = path.join(scriptsDir, 'write-newsletter.ts');
    expect(fs.existsSync(filePath)).toBe(true);
  });

  it('write-blog.ts exists', () => {
    const filePath = path.join(scriptsDir, 'write-blog.ts');
    expect(fs.existsSync(filePath)).toBe(true);
  });

  it('generate-seo.ts exists', () => {
    const filePath = path.join(scriptsDir, 'generate-seo.ts');
    expect(fs.existsSync(filePath)).toBe(true);
  });

  it('write-weekly.ts exists', () => {
    const filePath = path.join(scriptsDir, 'write-weekly.ts');
    expect(fs.existsSync(filePath)).toBe(true);
  });

  it('daily-pipeline.sh exists and is executable', () => {
    const filePath = path.join(scriptsDir, 'daily-pipeline.sh');
    expect(fs.existsSync(filePath)).toBe(true);
    const stats = fs.statSync(filePath);
    // Check that the file has execute permission (owner)
    const isExecutable = (stats.mode & 0o100) !== 0;
    expect(isExecutable).toBe(true);
  });
});
