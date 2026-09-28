import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { execFileSync, spawnSync } from 'child_process';
import { mkdtempSync, mkdirSync, readFileSync, readdirSync, writeFileSync, rmSync, existsSync, chmodSync } from 'fs';
import { tmpdir } from 'os';
import path from 'path';

const repo = process.cwd();
const cli = path.join(repo, 'scripts/evaluate-newsletter.ts');
const tsx = path.join(repo, 'node_modules/tsx/dist/cli.mjs');
let root: string;
const date = '2026-07-22';
const item = { id: 1, title: 'Example releases a local coding assistant', url: 'https://example.com/release',
  source: 'blog:Example', category: 'TOOL', score: 80, why_it_matters: 'Runs locally.', action: 'Read the release.',
  engagement_likes: 10, engagement_retweets: 0, engagement_downloads: 0 };

function put(file: string, content: string) {
  const dest = path.join(root, file); mkdirSync(path.dirname(dest), { recursive: true }); writeFileSync(dest, content);
}
function prepare() {
  execFileSync(process.execPath, [tsx, cli, '--prepare', `--date=${date}`], { cwd: root });
  const base = path.join(root, 'tmp/newsletter-eval');
  const dirs = readdirSync(base).filter(f => f.startsWith('fixture-'));
  return dirs.map(dir => path.join(base, dir, 'fixture.json'));
}

beforeEach(() => {
  root = mkdtempSync(path.join(tmpdir(), 'loreai-eval-test-'));
  put(`data/filtered-items/${date}.json`, JSON.stringify([item]));
  for (const lang of ['en', 'zh']) {
    put(`skills/newsletter-${lang}/SKILL.md`, `Write in ${lang}. Use only source facts.`);
    put(`content/newsletters/${lang}/${date}.md`, '# Historical reference');
  }
  put('content/newsletters/en/2026-07-21.md', '**Previous coverage**');
});
afterEach(() => rmSync(root, { recursive: true, force: true }));

describe('fixed-input newsletter evaluation', () => {
  it('prepares repeatable complete prompts offline without creating a DB or changing source content', () => {
    const first = JSON.parse(readFileSync(prepare()[0], 'utf-8'));
    const fixtures = prepare();
    expect(fixtures).toHaveLength(2);
    const hashes = fixtures.map(file => JSON.parse(readFileSync(file, 'utf-8')).sha256);
    expect(new Set(hashes).size).toBe(1);
    expect(first.snapshot.prompts.en.userPrompt).toContain(item.url);
    expect(first.snapshot.prompts.en.systemPrompt).toContain(date);
    expect(first.snapshot.prompts.zh.systemPrompt).toContain('只输出 Newsletter 正文');
    expect(first.snapshot.previousTitles).toContain('Previous coverage');
    expect(existsSync(path.join(root, 'loreai.db'))).toBe(false);
    expect(readFileSync(path.join(root, `content/newsletters/en/${date}.md`), 'utf-8')).toBe('# Historical reference');
  });

  it('refuses ambiguous mode, missing model and a mutated frozen input before any CLI generation', () => {
    const file = prepare()[0];
    const invoke = (...args: string[]) => spawnSync(process.execPath, [tsx, cli, ...args], { cwd: root, encoding: 'utf-8' });
    expect(invoke('--prepare', '--run').status).toBe(1);
    expect(invoke('--run', `--fixture=${file}`).stderr).toContain('explicit --model');
    const fixture = JSON.parse(readFileSync(file, 'utf-8'));
    fixture.snapshot.prompts.en.userPrompt = 'changed'; writeFileSync(file, JSON.stringify(fixture));
    expect(invoke('--run', `--fixture=${file}`, '--model=test-only').stderr).toContain('checksum mismatch');
  });

  it('runs at most two attempts with a fake CLI and saves invalid samples for review without publishing', () => {
    const file = prepare()[0];
    const counter = path.join(root, 'fake-calls');
    const binary = path.join(root, 'fake-codex');
    writeFileSync(binary, `#!${process.execPath}\nconst fs=require('fs');\nlet input='';\nprocess.stdin.on('data', c=>input+=c);\nprocess.stdin.on('end',()=>{fs.appendFileSync(${JSON.stringify(counter)},'call\\n');const a=process.argv.slice(2);fs.writeFileSync(a[a.indexOf('--output-last-message')+1],'# Incomplete sample');console.log('progress noise');});\n`);
    chmodSync(binary, 0o755);
    const result = spawnSync(process.execPath, [tsx, cli, '--run', `--fixture=${file}`, '--model=test-only'], {
      cwd: root, encoding: 'utf-8', env: { ...process.env, NEWSLETTER_CODEX_BIN: binary },
    });
    expect(result.status).toBe(1); // Structural checks fail, but evidence is retained.
    expect(readFileSync(counter, 'utf-8')).toBe('call\ncall\n');
    const base = path.join(root, 'tmp/newsletter-eval');
    const dir = path.join(base, readdirSync(base).find(f => f.startsWith('run-'))!);
    const report = JSON.parse(readFileSync(path.join(dir, 'report.json'), 'utf-8'));
    expect(report.model).toBe('test-only');
    expect(report.reasoning_effort).toBe('medium');
    expect(report.results).toHaveLength(2);
    expect(report.editorial_review).toBe('pending');
    expect(readFileSync(path.join(dir, 'en.md'), 'utf-8')).toBe('# Incomplete sample');
    expect(existsSync(path.join(root, 'loreai.db'))).toBe(false);
  });
});
