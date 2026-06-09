import { describe, it, expect } from 'vitest';
import {
  CONTRACT_VERSION,
  contentHash,
  parseArgs,
  makeEnvelope,
} from '../lib/cli-contract';

describe('cli-contract', () => {
  it('hashes deterministically and is content-sensitive', () => {
    expect(contentHash('abc')).toBe(contentHash('abc'));
    expect(contentHash('abc')).not.toBe(contentHash('abd'));
    expect(contentHash('abc')).toMatch(/^sha256:[0-9a-f]{64}$/);
  });

  it('parses flags, booleans, positionals, and = in values', () => {
    const { _, flags } = parseArgs(['draft', '--slug=x', '--dry-run', '--video-url=https://a?b=c']);
    expect(_[0]).toBe('draft');
    expect(flags.slug).toBe('x');
    expect(flags['dry-run']).toBe(true);
    expect(flags['video-url']).toBe('https://a?b=c');
  });

  it('makeEnvelope returns the stable contract shape', () => {
    const env = makeEnvelope('draft', { ok: true, slug: 's', task_id: 't1' });
    expect(env).toMatchObject({
      contract_version: CONTRACT_VERSION,
      ok: true,
      verb: 'draft',
      slug: 's',
      task_id: 't1',
      dry_run: false,
    });
    // required keys always present
    for (const k of ['artifacts', 'content_hash', 'data', 'warnings', 'errors']) {
      expect(k in env).toBe(true);
    }
    expect(Array.isArray(env.artifacts)).toBe(true);
    expect(Array.isArray(env.warnings)).toBe(true);
    expect(Array.isArray(env.errors)).toBe(true);
  });
});
