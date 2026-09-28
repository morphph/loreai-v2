#!/usr/bin/env npx tsx
/** Fixed-input writer evaluation. Prepare is offline; --run makes exactly two model attempts. */
import fs from 'fs';
import path from 'path';
import { createHash } from 'crypto';
import { z } from 'zod';
import { buildENNewsletterPrompts, buildZHNewsletterPrompts } from './lib/newsletter-prompts';
import { callCodex } from './lib/codex';
import { sanitizeOutput } from './lib/sanitize';
import { validateNewsletter, validateZhNewsletter, validateNewsletterQuality } from './lib/validate';
import { extractBoldTitles } from './lib/dedup';

const itemSchema = z.object({
  id: z.number(), title: z.string(), url: z.string(), source: z.string(),
  category: z.string(), score: z.number(), why_it_matters: z.string(), action: z.string(),
  engagement_likes: z.number(), engagement_retweets: z.number(), engagement_downloads: z.number(),
  detected_at: z.string().optional(),
});
const promptSchema = z.object({ systemPrompt: z.string().min(1), userPrompt: z.string().min(1) });
const snapshotSchema = z.object({
  version: z.literal(1), scope: z.literal('writer-only'), date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  items: z.array(itemSchema).min(1), previousTitles: z.array(z.string()),
  prompts: z.object({ en: promptSchema, zh: promptSchema }),
  historicalReference: z.object({ en: z.string(), zh: z.string() }),
});
const fixtureSchema = z.object({ sha256: z.string(), snapshot: snapshotSchema });
const hash = (value: unknown) => createHash('sha256').update(JSON.stringify(value)).digest('hex');
const root = process.cwd();
const args = process.argv.slice(2);
const arg = (name: string) => args.find(a => a.startsWith(`--${name}=`))?.slice(name.length + 3);

function outputDirectory(prefix: string): string {
  const dir = path.join(root, 'tmp', 'newsletter-eval');
  fs.mkdirSync(dir, { recursive: true });
  return fs.mkdtempSync(path.join(dir, prefix));
}

async function main() {
  if (args.includes('--prepare') === args.includes('--run')) {
    throw new Error('Choose --prepare --date=YYYY-MM-DD OR --run --fixture=FILE --model=MODEL');
  }
  if (args.includes('--prepare')) {
    const date = arg('date');
    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) throw new Error('An explicit --date=YYYY-MM-DD is required');
    const items = z.array(itemSchema).min(1).parse(JSON.parse(fs.readFileSync(path.join(root, 'data', 'filtered-items', `${date}.json`), 'utf-8')));
    const historyDir = path.join(root, 'content', 'newsletters', 'en');
    const previousTitles = fs.readdirSync(historyDir)
      .filter(f => /^\d{4}-\d{2}-\d{2}\.md$/.test(f) && f.slice(0, 10) < date)
      .sort().reverse().slice(0, 7)
      .flatMap(f => extractBoldTitles(fs.readFileSync(path.join(historyDir, f), 'utf-8')));
    const readSkill = (lang: string) => fs.readFileSync(path.join(root, 'skills', `newsletter-${lang}`, 'SKILL.md'), 'utf-8');
    const readReference = (lang: string) => fs.readFileSync(path.join(root, 'content', 'newsletters', lang, `${date}.md`), 'utf-8');
    // Fixed curated items, no new outline or SEO-page queries. Both languages write independently.
    const snapshot = snapshotSchema.parse({
      version: 1, scope: 'writer-only', date, items, previousTitles,
      prompts: {
        en: buildENNewsletterPrompts(date, readSkill('en'), items, null),
        zh: buildZHNewsletterPrompts(date, readSkill('zh'), items, null),
      },
      historicalReference: { en: readReference('en'), zh: readReference('zh') },
    });
    const dir = outputDirectory(`fixture-${date}-`);
    fs.writeFileSync(path.join(dir, 'fixture.json'), JSON.stringify({ sha256: hash(snapshot), snapshot }, null, 2), { flag: 'wx' });
    console.log(`Prepared ${items.length} curated items, EN/ZH prompts, and historical references. No model calls.\n${path.join(dir, 'fixture.json')}`);
    return;
  }

  const fixturePath = arg('fixture');
  const model = arg('model')?.trim();
  const reasoningEffort = 'medium' as const;
  if (!fixturePath || !model) throw new Error('--run requires --fixture=FILE and an explicit --model=MODEL');
  const fixture = fixtureSchema.parse(JSON.parse(fs.readFileSync(fixturePath, 'utf-8')));
  if (hash(fixture.snapshot) !== fixture.sha256) throw new Error('Fixture checksum mismatch; prepare a new snapshot rather than mutating a frozen input');
  const dir = outputDirectory(`run-${fixture.snapshot.date}-`);
  type Result = { lang: string; elapsed_ms: number; structure?: { valid: boolean; errors: string[] }; quality?: { valid: boolean; errors: string[] }; error?: string };
  const results: Result[] = [];
  const saveReport = () => fs.writeFileSync(path.join(dir, 'report.json'), JSON.stringify({
    scope: 'writer-only', fixture_sha256: fixture.sha256, provider: 'codex', model, reasoning_effort: reasoningEffort,
    max_calls: 2, results, editorial_review: 'pending',
    limitations: 'Historical reference is not a controlled Claude rerun. Selection, outline generation, news freshness, email rewriting and publishing are not evaluated.',
  }, null, 2));
  saveReport();
  for (const lang of ['en', 'zh'] as const) {
    const start = Date.now();
    try {
      const { systemPrompt, userPrompt } = fixture.snapshot.prompts[lang];
      const response = await callCodex(systemPrompt, userPrompt, { model, reasoningEffort, binary: process.env.NEWSLETTER_CODEX_BIN });
      const content = sanitizeOutput(response.content);
      fs.writeFileSync(path.join(dir, `${lang}.md`), content, { flag: 'wx' });
      const structure = (lang === 'en' ? validateNewsletter : validateZhNewsletter)(content);
      const quality = validateNewsletterQuality({ md: content, lang, previousBoldTitles: fixture.snapshot.previousTitles });
      results.push({ lang, elapsed_ms: Date.now() - start, structure, quality });
    } catch (error) {
      results.push({ lang, elapsed_ms: Date.now() - start, error: error instanceof Error ? error.message : 'Evaluation failed' });
    }
    saveReport();
  }
  console.log(`Local evaluation artifacts: ${dir}`);
  if (results.some(r => r.error || !r.structure?.valid)) process.exitCode = 1;
}

main().catch(error => { console.error(error instanceof Error ? error.message : 'Evaluation failed'); process.exitCode = 1; });
