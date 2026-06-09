/**
 * scripts/lib/cli-contract.ts — Stable machine-readable CLI contract for Hermes.
 *
 * Every `loreai-content` verb emits a single JSON envelope on stdout matching the
 * shape below, then exits with a stable code. This module is the ONLY place that
 * defines the contract version and the envelope shape — keep it the single source
 * of truth so Hermes can rely on it.
 *
 * Boundaries (enforced by callers, documented here):
 *   - never auto-publish, never `git push`, never write the Hermes ledger.
 *   - mutating verbs must support --dry-run and must not push.
 */
import crypto from 'crypto';

export const CONTRACT_VERSION = '1.0';

export interface Artifact {
  /** logical kind: 'draft' | 'blog' | 'candidates' | 'frontmatter' */
  type: string;
  /** repo-relative or absolute path to the artifact */
  path: string;
  lang?: string;
  /** whether the path exists on disk at emit time */
  exists?: boolean;
}

export interface Envelope {
  contract_version: string;
  ok: boolean;
  verb: string;
  slug: string | null;
  /** idempotency / correlation key passed through from Hermes (--task-id) */
  task_id: string | null;
  dry_run: boolean;
  artifacts: Artifact[];
  /** sha256 of the canonical content this verb produced/inspected, or null */
  content_hash: string | null;
  /** verb-specific structured payload (e.g. candidates list) */
  data: unknown;
  warnings: string[];
  errors: string[];
}

/** Exit codes — stable part of the contract. */
export const EXIT = {
  OK: 0,
  /** handled failure: not found, not approved, validation rejected */
  FAILURE: 1,
  /** bad invocation: unknown verb, missing required flag */
  USAGE: 2,
  /** unexpected/internal error */
  INTERNAL: 3,
} as const;

export function contentHash(input: string): string {
  return 'sha256:' + crypto.createHash('sha256').update(input, 'utf8').digest('hex');
}

export interface ParsedArgs {
  /** positional args (verb is _[0]) */
  _: string[];
  flags: Record<string, string | boolean>;
}

/** Parse `verb --key=value --boolflag positional` into {_, flags}. */
export function parseArgs(argv: string[]): ParsedArgs {
  const _: string[] = [];
  const flags: Record<string, string | boolean> = {};
  for (const a of argv) {
    if (a.startsWith('--')) {
      const body = a.slice(2);
      const eq = body.indexOf('=');
      if (eq === -1) flags[body] = true;
      else flags[body.slice(0, eq)] = body.slice(eq + 1);
    } else {
      _.push(a);
    }
  }
  return { _, flags };
}

export function makeEnvelope(verb: string, partial: Partial<Envelope> = {}): Envelope {
  return {
    contract_version: CONTRACT_VERSION,
    ok: partial.ok ?? false,
    verb,
    slug: partial.slug ?? null,
    task_id: partial.task_id ?? null,
    dry_run: partial.dry_run ?? false,
    artifacts: partial.artifacts ?? [],
    content_hash: partial.content_hash ?? null,
    data: partial.data ?? null,
    warnings: partial.warnings ?? [],
    errors: partial.errors ?? [],
  };
}

/** Print the envelope as a single JSON line and exit. */
export function emit(env: Envelope, code: number = env.ok ? EXIT.OK : EXIT.FAILURE): never {
  process.stdout.write(JSON.stringify(env) + '\n');
  process.exit(code);
}
