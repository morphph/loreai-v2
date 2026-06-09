#!/usr/bin/env npx tsx
/**
 * scripts/loreai-content.ts — `loreai-content` agent-native CLI.
 *
 * Stable JSON contract for the Hermes orchestration layer. This repo exposes
 * safe wrappers for drafting, importing approved content, and managing video
 * readiness/status. It is NOT an orchestrator and never touches the Hermes
 * ledger, never auto-publishes, never `git push`es, and never calls Blog2Video
 * directly (it only emits the candidates.json artifact contract).
 *
 * Usage:
 *   npx tsx scripts/loreai-content.ts <verb> [flags]
 *
 * Verbs: draft | import-approved | mark-video-ready | video-candidates | update-video-status
 * See docs/guides/CONTENT-CLI.md for the full contract.
 */
import fs from 'fs';
import path from 'path';
import { execFileSync } from 'child_process';
import matter from 'gray-matter';

import {
  CONTRACT_VERSION,
  EXIT,
  Artifact,
  Envelope,
  contentHash,
  parseArgs,
  makeEnvelope,
  emit,
} from './lib/cli-contract';

const ROOT = process.cwd();
const DRAFTS_DIR = path.join(ROOT, 'data', 'drafts');
const BLOG_DIR = path.join(ROOT, 'content', 'blog');
const CANDIDATES_PATH = path.join(ROOT, 'data', 'video-queue', 'candidates.json');
const VALID_VIDEO_STATUS = ['none', 'scripted', 'recorded', 'published'];
const LANGS = ['en', 'zh'];

function rel(p: string): string {
  return path.relative(ROOT, p) || p;
}

function readStdin(): string {
  try {
    return fs.readFileSync(0, 'utf-8');
  } catch {
    return '';
  }
}

// ============================================================
// draft — scaffold a draft from a structured brief. No LLM, no publish.
// ============================================================

interface Brief {
  slug: string;
  title: string;
  lang?: string;
  category?: string;
  description?: string;
  keywords?: string[];
  body?: string; // markdown body; if absent, a stub is written
  video_hook?: string;
  related_glossary?: string[];
  related_blog?: string[];
  related_compare?: string[];
  related_topics?: string[];
}

function verbDraft(flags: Record<string, string | boolean>, taskId: string | null): never {
  const warnings: string[] = [];

  let raw = '';
  const briefPath = typeof flags.brief === 'string' ? flags.brief : undefined;
  if (briefPath) {
    const abs = path.isAbsolute(briefPath) ? briefPath : path.join(ROOT, briefPath);
    if (!fs.existsSync(abs)) {
      return emit(makeEnvelope('draft', { task_id: taskId, errors: [`brief file not found: ${abs}`] }), EXIT.FAILURE);
    }
    raw = fs.readFileSync(abs, 'utf-8');
  } else if (flags.stdin) {
    raw = readStdin();
  } else {
    return emit(
      makeEnvelope('draft', { task_id: taskId, errors: ['provide --brief=<path.json> or --stdin'] }),
      EXIT.USAGE,
    );
  }

  let brief: Brief;
  try {
    brief = JSON.parse(raw);
  } catch (e) {
    return emit(makeEnvelope('draft', { task_id: taskId, errors: [`invalid brief JSON: ${(e as Error).message}`] }), EXIT.FAILURE);
  }

  if (!brief.slug || !brief.title) {
    return emit(makeEnvelope('draft', { task_id: taskId, errors: ['brief requires "slug" and "title"'] }), EXIT.FAILURE);
  }

  const lang = (typeof flags.lang === 'string' ? flags.lang : brief.lang) || 'en';
  if (!LANGS.includes(lang)) {
    return emit(makeEnvelope('draft', { slug: brief.slug, task_id: taskId, errors: [`unsupported lang: ${lang}`] }), EXIT.FAILURE);
  }

  const frontmatter: Record<string, unknown> = {
    title: brief.title,
    slug: brief.slug,
    lang,
    description: brief.description || '',
    category: brief.category || 'DEV',
    keywords: brief.keywords || [],
    related_glossary: brief.related_glossary || [],
    related_blog: brief.related_blog || [],
    related_compare: brief.related_compare || [],
    related_topics: brief.related_topics || [],
    // CLI-managed staging metadata — gate for import-approved:
    approved: false,
    source: 'hermes-draft',
    generated_by: 'loreai-content/draft',
  };
  if (brief.video_hook) frontmatter.video_hook = brief.video_hook;

  const body = brief.body && brief.body.trim().length > 0
    ? brief.body
    : `<!-- draft scaffold for "${brief.title}". Body to be written before approval. -->\n`;
  if (!brief.body) warnings.push('brief had no "body" — wrote a stub. Fill in before approval.');

  const fileText = matter.stringify(body, frontmatter);

  const outDir = path.join(DRAFTS_DIR, lang);
  const outPath = path.join(outDir, `${brief.slug}.md`);
  const dryRun = flags['dry-run'] === true;
  const hash = contentHash(fileText);

  if (!dryRun) {
    fs.mkdirSync(outDir, { recursive: true });
    fs.writeFileSync(outPath, fileText);
  }

  const artifact: Artifact = { type: 'draft', path: rel(outPath), lang, exists: !dryRun };
  return emit(
    makeEnvelope('draft', {
      ok: true,
      slug: brief.slug,
      task_id: taskId,
      dry_run: dryRun,
      artifacts: [artifact],
      content_hash: hash,
      data: { approved: false, drafts_dir: rel(DRAFTS_DIR) },
      warnings,
    }),
    EXIT.OK,
  );
}

// ============================================================
// import-approved — import an explicitly-approved draft into the publishing surface.
// Human-gated: requires approved:true in the draft (or explicit --approved).
// Always --no-git and --no-seo (no auto-push, no LLM cost). Supports --dry-run.
// ============================================================

function verbImportApproved(flags: Record<string, string | boolean>, taskId: string | null): never {
  const warnings: string[] = [];
  const slug = typeof flags.slug === 'string' ? flags.slug : undefined;
  if (!slug) {
    return emit(makeEnvelope('import-approved', { task_id: taskId, errors: ['--slug is required'] }), EXIT.USAGE);
  }
  const lang = (typeof flags.lang === 'string' ? flags.lang : 'en');
  if (!LANGS.includes(lang)) {
    return emit(makeEnvelope('import-approved', { slug, task_id: taskId, errors: [`unsupported lang: ${lang}`] }), EXIT.FAILURE);
  }

  const draftPath = path.join(DRAFTS_DIR, lang, `${slug}.md`);
  if (!fs.existsSync(draftPath)) {
    return emit(
      makeEnvelope('import-approved', { slug, task_id: taskId, errors: [`draft not found: ${rel(draftPath)} (run draft first)`] }),
      EXIT.FAILURE,
    );
  }

  // Approval gate — the human boundary.
  const { data: fm } = matter(fs.readFileSync(draftPath, 'utf-8'));
  const approvedInFile = fm.approved === true;
  const approvedFlag = flags.approved === true;
  if (!approvedInFile && !approvedFlag) {
    return emit(
      makeEnvelope('import-approved', {
        slug,
        task_id: taskId,
        errors: ['draft is not approved. Set `approved: true` in the draft frontmatter, or pass --approved to assert explicit human approval.'],
        data: { approved: false },
      }),
      EXIT.FAILURE,
    );
  }
  if (!approvedInFile && approvedFlag) warnings.push('approval asserted via --approved flag (draft frontmatter still approved:false)');

  const dryRun = flags['dry-run'] === true;
  const force = flags.force === true;
  const withSeo = flags['with-seo'] === true; // opt-in only; off by default to avoid LLM cost

  // Shell the battle-tested import-blog.ts — never with git, never with SEO unless opted in.
  const importArgs = ['tsx', 'scripts/import-blog.ts', `--file=${draftPath}`, '--no-git'];
  if (!withSeo) importArgs.push('--no-seo');
  if (dryRun) importArgs.push('--dry-run');
  if (force) importArgs.push('--force');

  let importOutput = '';
  let importOk = true;
  try {
    importOutput = execFileSync('npx', importArgs, { cwd: ROOT, encoding: 'utf-8', stdio: ['ignore', 'pipe', 'pipe'] });
  } catch (e) {
    importOk = false;
    const err = e as { stdout?: string; stderr?: string; message?: string };
    importOutput = (err.stdout || '') + (err.stderr || err.message || '');
  }

  if (!importOk) {
    return emit(
      makeEnvelope('import-approved', {
        slug,
        task_id: taskId,
        dry_run: dryRun,
        errors: ['import-blog failed', importOutput.trim().split('\n').slice(-5).join(' | ')],
      }),
      EXIT.FAILURE,
    );
  }

  // Report resulting publish-surface artifacts (import-blog writes en + zh).
  const artifacts: Artifact[] = [];
  let primaryHash: string | null = null;
  for (const l of LANGS) {
    const p = path.join(BLOG_DIR, l, `${slug}.md`);
    const exists = !dryRun && fs.existsSync(p);
    artifacts.push({ type: 'blog', path: rel(p), lang: l, exists });
    if (exists && primaryHash === null) primaryHash = contentHash(fs.readFileSync(p, 'utf-8'));
  }
  if (dryRun) {
    primaryHash = contentHash(fs.readFileSync(draftPath, 'utf-8'));
    warnings.push('dry-run: no files written, no DB upsert');
  }

  return emit(
    makeEnvelope('import-approved', {
      ok: true,
      slug,
      task_id: taskId,
      dry_run: dryRun,
      artifacts,
      content_hash: primaryHash,
      data: { seo: withSeo ? 'extracted' : 'skipped', git: 'not-pushed (human-gated)' },
      warnings,
    }),
    EXIT.OK,
  );
}

// ============================================================
// mark-video-ready — set video_ready:true (+ optional hook) on published blog frontmatter.
// Idempotent, metadata-only, no git. Supports --dry-run.
// ============================================================

function setFrontmatterKey(content: string, key: string, value: string): string {
  const line = `${key}: ${value}`;
  const re = new RegExp(`^${key}:[ \\t]*.*$`, 'm');
  if (re.test(content)) return content.replace(re, line);
  // No existing key — insert before the closing --- of the frontmatter block.
  const fm = content.match(/^(---\r?\n[\s\S]*?\r?\n)(---[ \t]*\r?\n)/);
  if (fm && fm.index === 0) {
    const cut = fm[1].length;
    return content.slice(0, cut) + `${line}\n` + content.slice(cut);
  }
  // No frontmatter block at all — create one.
  return `---\n${line}\n---\n\n${content}`;
}

function verbMarkVideoReady(flags: Record<string, string | boolean>, taskId: string | null): never {
  const warnings: string[] = [];
  const slug = typeof flags.slug === 'string' ? flags.slug : undefined;
  if (!slug) {
    return emit(makeEnvelope('mark-video-ready', { task_id: taskId, errors: ['--slug is required'] }), EXIT.USAGE);
  }
  const hook = typeof flags['video-hook'] === 'string' ? (flags['video-hook'] as string) : undefined;
  const dryRun = flags['dry-run'] === true;

  const targetLangs = typeof flags.lang === 'string' && LANGS.includes(flags.lang) ? [flags.lang] : LANGS;
  const artifacts: Artifact[] = [];
  let changed = false;
  let primaryHash: string | null = null;

  for (const l of targetLangs) {
    const p = path.join(BLOG_DIR, l, `${slug}.md`);
    if (!fs.existsSync(p)) continue;
    let text = fs.readFileSync(p, 'utf-8');
    const before = text;

    text = setFrontmatterKey(text, 'video_ready', 'true');
    // ensure a video_status exists so the picker can see it
    if (!/^video_status:\s*.*$/m.test(text)) text = setFrontmatterKey(text, 'video_status', 'none');
    if (hook) text = setFrontmatterKey(text, 'video_hook', JSON.stringify(hook));

    const fileChanged = text !== before;
    if (fileChanged && !dryRun) fs.writeFileSync(p, text);
    if (fileChanged) changed = true;
    artifacts.push({ type: 'frontmatter', path: rel(p), lang: l, exists: true });
    if (primaryHash === null) primaryHash = contentHash(text);
  }

  if (artifacts.length === 0) {
    return emit(
      makeEnvelope('mark-video-ready', { slug, task_id: taskId, errors: [`no blog files found for slug: ${slug}`] }),
      EXIT.FAILURE,
    );
  }
  if (!changed) warnings.push('already video-ready (no change)');
  if (dryRun) warnings.push('dry-run: no files written');

  return emit(
    makeEnvelope('mark-video-ready', {
      ok: true,
      slug,
      task_id: taskId,
      dry_run: dryRun,
      artifacts,
      content_hash: primaryHash,
      data: { changed, video_ready: true },
      warnings,
    }),
    EXIT.OK,
  );
}

// ============================================================
// video-candidates — return machine-readable candidates for Blog2Video.
// Read-mostly: reads cached candidates.json; --refresh re-runs the picker.
// ============================================================

function verbVideoCandidates(flags: Record<string, string | boolean>, taskId: string | null): never {
  const warnings: string[] = [];
  const refresh = flags.refresh === true;
  const top = typeof flags.top === 'string' ? flags.top : undefined;

  const needRun = refresh || !fs.existsSync(CANDIDATES_PATH);
  if (!fs.existsSync(CANDIDATES_PATH) && !refresh) warnings.push('no cached candidates.json — running picker once');

  if (needRun) {
    const pickerArgs = ['tsx', 'scripts/pick-video-candidates.ts'];
    if (top) pickerArgs.push(`--top=${top}`);
    try {
      execFileSync('npx', pickerArgs, { cwd: ROOT, encoding: 'utf-8', stdio: ['ignore', 'pipe', 'pipe'] });
    } catch (e) {
      const err = e as { stderr?: string; message?: string };
      return emit(
        makeEnvelope('video-candidates', { task_id: taskId, errors: ['picker failed', (err.stderr || err.message || '').trim()] }),
        EXIT.FAILURE,
      );
    }
  }

  if (!fs.existsSync(CANDIDATES_PATH)) {
    return emit(makeEnvelope('video-candidates', { task_id: taskId, errors: ['candidates.json not produced'] }), EXIT.INTERNAL);
  }

  const rawJson = fs.readFileSync(CANDIDATES_PATH, 'utf-8');
  let candidates: unknown;
  try {
    candidates = JSON.parse(rawJson);
  } catch (e) {
    return emit(makeEnvelope('video-candidates', { task_id: taskId, errors: [`candidates.json invalid: ${(e as Error).message}`] }), EXIT.INTERNAL);
  }

  const count = Array.isArray(candidates) ? candidates.length : 0;
  return emit(
    makeEnvelope('video-candidates', {
      ok: true,
      task_id: taskId,
      artifacts: [{ type: 'candidates', path: rel(CANDIDATES_PATH), exists: true }],
      content_hash: contentHash(rawJson),
      data: { count, candidates },
      warnings,
    }),
    EXIT.OK,
  );
}

// ============================================================
// update-video-status — idempotently update video_status / video_url.
// Metadata-only, no git. Supports --dry-run.
// ============================================================

function verbUpdateVideoStatus(flags: Record<string, string | boolean>, taskId: string | null): never {
  const warnings: string[] = [];
  const slug = typeof flags.slug === 'string' ? flags.slug : undefined;
  const status = typeof flags.status === 'string' ? flags.status : undefined;
  const videoUrl = typeof flags['video-url'] === 'string' ? (flags['video-url'] as string) : undefined;
  const dryRun = flags['dry-run'] === true;

  if (!slug || !status) {
    return emit(makeEnvelope('update-video-status', { slug: slug ?? null, task_id: taskId, errors: ['--slug and --status are required'] }), EXIT.USAGE);
  }
  if (!VALID_VIDEO_STATUS.includes(status)) {
    return emit(
      makeEnvelope('update-video-status', { slug, task_id: taskId, errors: [`invalid status "${status}". Must be one of: ${VALID_VIDEO_STATUS.join(', ')}`] }),
      EXIT.FAILURE,
    );
  }

  const targetLangs = typeof flags.lang === 'string' && LANGS.includes(flags.lang) ? [flags.lang] : LANGS;
  const artifacts: Artifact[] = [];
  let changed = false;
  let primaryHash: string | null = null;

  for (const l of targetLangs) {
    const p = path.join(BLOG_DIR, l, `${slug}.md`);
    if (!fs.existsSync(p)) continue;
    let text = fs.readFileSync(p, 'utf-8');
    const before = text;

    text = setFrontmatterKey(text, 'video_status', status);
    if (videoUrl) text = setFrontmatterKey(text, 'video_url', JSON.stringify(videoUrl));

    const fileChanged = text !== before;
    if (fileChanged && !dryRun) fs.writeFileSync(p, text);
    if (fileChanged) changed = true;
    artifacts.push({ type: 'frontmatter', path: rel(p), lang: l, exists: true });
    if (primaryHash === null) primaryHash = contentHash(text);
  }

  if (artifacts.length === 0) {
    return emit(
      makeEnvelope('update-video-status', { slug, task_id: taskId, errors: [`no blog files found for slug: ${slug}`] }),
      EXIT.FAILURE,
    );
  }
  if (!changed) warnings.push(`already at status "${status}" (no change)`);
  if (dryRun) warnings.push('dry-run: no files written');

  return emit(
    makeEnvelope('update-video-status', {
      ok: true,
      slug,
      task_id: taskId,
      dry_run: dryRun,
      artifacts,
      content_hash: primaryHash,
      data: { changed, video_status: status, video_url: videoUrl ?? null },
      warnings,
    }),
    EXIT.OK,
  );
}

// ============================================================
// dispatch
// ============================================================

function usage(): never {
  const env: Envelope = makeEnvelope('help', {
    errors: ['unknown or missing verb'],
    data: {
      contract_version: CONTRACT_VERSION,
      verbs: ['draft', 'import-approved', 'mark-video-ready', 'video-candidates', 'update-video-status'],
      docs: 'docs/guides/CONTENT-CLI.md',
    },
  });
  return emit(env, EXIT.USAGE);
}

function main(): void {
  const { _, flags } = parseArgs(process.argv.slice(2));
  const verb = _[0];
  const taskId = typeof flags['task-id'] === 'string' ? (flags['task-id'] as string) : null;

  try {
    switch (verb) {
      case 'draft':
        return verbDraft(flags, taskId);
      case 'import-approved':
        return verbImportApproved(flags, taskId);
      case 'mark-video-ready':
        return verbMarkVideoReady(flags, taskId);
      case 'video-candidates':
        return verbVideoCandidates(flags, taskId);
      case 'update-video-status':
        return verbUpdateVideoStatus(flags, taskId);
      default:
        return usage();
    }
  } catch (e) {
    return emit(
      makeEnvelope(verb || 'unknown', { task_id: taskId, errors: ['internal error', (e as Error).message] }),
      EXIT.INTERNAL,
    );
  }
}

main();
