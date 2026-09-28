import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { EventEmitter } from 'events';
import { existsSync, writeFileSync } from 'fs';
import { join } from 'path';
import { callCodex, checkCodexHealth } from '../codex';

const { execFile } = vi.hoisted(() => ({ execFile: vi.fn() }));
vi.mock('child_process', () => ({ execFile }));

let input: string;
let workspace: string;
let answer: string | undefined;
let failure: { code?: number | string; killed?: boolean } | undefined;

beforeEach(() => {
  vi.clearAllMocks();
  input = ''; answer = '# Final newsletter'; failure = undefined;
  execFile.mockImplementation((_binary, args, options, callback) => {
    workspace = options.cwd;
    const stdin = new EventEmitter() as EventEmitter & { end: (text: string) => void };
    stdin.end = (text) => {
      input = text;
      const index = args.indexOf('--output-last-message');
      if (index !== -1 && answer !== undefined) writeFileSync(args[index + 1], answer);
      callback(failure, 'progress and event noise', 'private service diagnostics');
    };
    return { stdin };
  });
});
afterEach(() => vi.unstubAllEnvs());

describe('Codex content runner', () => {
  it('pipes literal prompts, uses only final answer, and removes temporary artifacts', async () => {
    const response = await callCodex('system', 'literal $(touch /tmp/never) `echo x`', { model: 'test-model', binary: '/bin/codex with spaces' });
    expect(response).toEqual({ content: '# Final newsletter', model: 'test-model' });
    expect(input).toContain('literal $(touch /tmp/never) `echo x`');
    expect(execFile.mock.calls[0][0]).toBe('/bin/codex with spaces');
    expect(execFile.mock.calls[0][1]).not.toContain(input);
    expect(existsSync(workspace)).toBe(false);
  });

  it('separates production credentials, developer context and model actions', async () => {
    vi.stubEnv('BUTTONDOWN_API_KEY', 'private');
    vi.stubEnv('DB_PATH', '/production.db');
    vi.stubEnv('CLAUDECODE', 'parent-session');
    await callCodex('system', 'prompt', { model: 'test-model', reasoningEffort: 'medium' });
    const [, args, options] = execFile.mock.calls[0];
    expect(args).toEqual(expect.arrayContaining(['--ignore-user-config', '--ephemeral', 'read-only',
      'features.shell_tool=false', 'features.unified_exec=false', 'web_search="disabled"', 'project_doc_max_bytes=0', 'model_reasoning_effort="medium"']));
    expect(options.cwd).not.toBe(process.cwd());
    expect(options.env).not.toHaveProperty('BUTTONDOWN_API_KEY');
    expect(options.env).not.toHaveProperty('DB_PATH');
    expect(options.env).not.toHaveProperty('CLAUDECODE');
    expect(options.shell).toBeUndefined();
  });

  it.each([undefined, '   '])('rejects missing/empty final output instead of accepting stdout', async (value) => {
    answer = value;
    await expect(callCodex('s', 'p', { model: 'test-model' })).rejects.toThrow(/final answer/);
    expect(existsSync(workspace)).toBe(false);
  });

  it.each([{ code: 1 }, { code: 'ENOENT' }, { killed: true }])('cleans up and reports failed CLI calls without private diagnostics', async (error) => {
    failure = error;
    await expect(callCodex('s', 'p', { model: 'test-model', timeoutMs: 123 })).rejects.toThrow(/^Codex CLI failed/);
    expect(execFile.mock.calls[0][2]).toMatchObject({ timeout: 123, killSignal: 'SIGKILL' });
    expect(existsSync(join(workspace, 'answer.txt'))).toBe(false);
  });

  it('requires an explicit model before starting a process', async () => {
    await expect(callCodex('s', 'p', { model: ' ' })).rejects.toThrow('NEWSLETTER_CODEX_MODEL');
    expect(execFile).not.toHaveBeenCalled();
  });

  it('checks installation without generating content', async () => {
    await checkCodexHealth('/custom/codex');
    expect(execFile.mock.calls[0].slice(0, 2)).toEqual(['/custom/codex', ['--version']]);
    expect(input).toBe('');
  });
});
