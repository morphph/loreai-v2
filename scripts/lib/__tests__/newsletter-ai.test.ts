import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { createNewsletterAI, readNewsletterHistory } from '../newsletter-ai';

const mocks = vi.hoisted(() => ({
  callCodex: vi.fn(), checkCodexHealth: vi.fn(), callClaudeWithRetry: vi.fn(),
  callClaudeAgent: vi.fn(), callZhNewsletterWithFallback: vi.fn(), checkClaudeHealth: vi.fn(),
}));
vi.mock('../codex', () => mocks);
vi.mock('../ai', () => mocks);

const config = { NEWSLETTER_AI_PROVIDER: 'codex', NEWSLETTER_CODEX_MODEL: 'primary' };
const valid = (text: string) => ({ valid: text === 'valid', errors: text === 'valid' ? [] : ['missing section'] });
let root: string;
beforeEach(() => {
  vi.clearAllMocks();
  root = mkdtempSync(join(tmpdir(), 'newsletter-history-test-'));
  mocks.callCodex.mockImplementation(async (_s, _p, opts) => ({ content: 'valid', model: opts.model }));
});
afterEach(() => { vi.useRealTimers(); rmSync(root, { recursive: true, force: true }); });

describe('newsletter provider routing', () => {
  it('defaults to Claude and preserves legacy callers', async () => {
    const runtime = createNewsletterAI({});
    expect(runtime.provider).toBe('claude');
    await runtime.checkHealth();
    await runtime.generate('s', 'p', { maxTokens: 100 });
    await runtime.writeZh('s', 'p', valid);
    await runtime.filter('claude rules', 'codex rules', 'p', root, '2026-09-28');
    expect(mocks.callClaudeWithRetry).toHaveBeenCalledWith('s', 'p', { maxTokens: 100 });
    expect(mocks.callClaudeAgent).toHaveBeenCalledWith('claude rules', 'p', { timeoutMs: 180_000 });
    expect(mocks.callZhNewsletterWithFallback).toHaveBeenCalled();
    expect(mocks.checkClaudeHealth).toHaveBeenCalled();
    expect(mocks.callCodex).not.toHaveBeenCalled();
  });

  it('fails on an invalid provider or missing Codex model before checking binaries', async () => {
    expect(() => createNewsletterAI({ NEWSLETTER_AI_PROVIDER: 'typo' })).toThrow('claude or codex');
    await expect(createNewsletterAI({ NEWSLETTER_AI_PROVIDER: 'codex' }).checkHealth()).rejects.toThrow('NEWSLETTER_CODEX_MODEL');
    expect(mocks.checkCodexHealth).not.toHaveBeenCalled();
  });

  it('selects Codex for generation and history-based filtering without Claude', async () => {
    const runtime = createNewsletterAI(config);
    await runtime.checkHealth();
    const response = await runtime.generate('s', 'p', { validate: valid });
    expect(response.model).toBe('primary');
    await runtime.filter('claude rules', 'codex rules', 'candidates', root, '2026-09-28');
    await runtime.writeZh('s', 'p', valid);
    for (const call of mocks.callCodex.mock.calls) {
      expect(call[2]).toMatchObject({ model: 'primary', reasoningEffort: 'medium' });
    }
    expect(mocks.callCodex.mock.calls[1][0]).toBe('codex rules');
    expect(mocks.callCodex.mock.calls[1][1]).toContain('No previous newsletter editions');
    expect(mocks.callClaudeWithRetry).not.toHaveBeenCalled();
    expect(mocks.callClaudeAgent).not.toHaveBeenCalled();
  });

  it('retries invalid content with corrective feedback and returns the valid result', async () => {
    vi.useFakeTimers();
    mocks.callCodex.mockResolvedValueOnce({ content: 'invalid', model: 'primary' });
    const result = createNewsletterAI(config).generate('s', 'original', { validate: valid, maxRetries: 2 });
    await vi.runAllTimersAsync();
    await expect(result).resolves.toMatchObject({ content: 'valid' });
    expect(mocks.callCodex.mock.calls[1][1]).toContain('missing section');
    expect(mocks.callCodex.mock.calls[1][1]).toContain('original');
  });

  it('rejects exhausted validation without returning invalid content or falling back to Claude', async () => {
    mocks.callCodex.mockResolvedValue({ content: 'invalid', model: 'primary' });
    await expect(createNewsletterAI(config).generate('s', 'p', { validate: valid, maxRetries: 1 })).rejects.toThrow('validation failed');
    expect(mocks.callClaudeWithRetry).not.toHaveBeenCalled();
  });

  it('records the actual configured fallback model for Chinese generation', async () => {
    vi.useFakeTimers();
    mocks.callCodex.mockRejectedValueOnce(new Error('unavailable')).mockRejectedValueOnce(new Error('unavailable'));
    const result = createNewsletterAI({ ...config, NEWSLETTER_CODEX_FALLBACK_MODEL: 'fallback' }).writeZh('s', 'p', valid);
    await vi.runAllTimersAsync();
    await expect(result).resolves.toEqual({ content: 'valid', model: 'fallback' });
    expect(mocks.callCodex.mock.calls.at(-1)?.[2]).toMatchObject({ model: 'fallback', reasoningEffort: 'medium' });
    expect(mocks.callZhNewsletterWithFallback).not.toHaveBeenCalled();
  });

  it('does not use same-day or future editions when assembling history', () => {
    const dir = join(root, 'content/newsletters/en'); mkdirSync(dir, { recursive: true });
    for (const day of ['25', '26', '27', '28', '29']) writeFileSync(join(dir, `2026-09-${day}.md`), `edition-${day}`);
    writeFileSync(join(dir, 'notes.md'), 'private notes');
    const history = readNewsletterHistory(root, '2026-09-28');
    expect(history).toContain('edition-27');
    expect(history).not.toMatch(/edition-28|edition-29|private notes/);
    expect(history.indexOf('edition-27')).toBeLessThan(history.indexOf('edition-25'));
  });
});
