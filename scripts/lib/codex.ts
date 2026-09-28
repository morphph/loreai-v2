import { execFile } from 'child_process';
import { mkdtempSync, readFileSync, rmSync, realpathSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import type { AIResponse } from './ai';

export interface CodexOptions {
  model: string;
  binary?: string;
  timeoutMs?: number;
  reasoningEffort?: 'low' | 'medium' | 'high';
}

// Do not give content generation the pipeline's database, email or collector credentials.
function codexEnvironment(): NodeJS.ProcessEnv {
  const env: NodeJS.ProcessEnv = {};
  for (const key of ['PATH', 'HOME', 'USER', 'TMPDIR', 'CODEX_HOME', 'CODEX_API_KEY',
    'HTTPS_PROXY', 'HTTP_PROXY', 'NO_PROXY', 'SSL_CERT_FILE']) {
    if (process.env[key]) env[key] = process.env[key];
  }
  return env;
}

function run(binary: string, args: string[], cwd: string, input: string, timeout: number): Promise<void> {
  return new Promise((resolve, reject) => {
    const child = execFile(binary, args, {
      cwd, env: codexEnvironment(), timeout, killSignal: 'SIGKILL',
      maxBuffer: 10 * 1024 * 1024, encoding: 'utf-8',
    }, (error) => {
      // execFile errors include the command/input or service output. Never log them verbatim.
      if (error) reject(new Error(`Codex CLI failed (${error.killed ? 'timeout or output limit' : `exit ${error.code ?? 'unknown'}`})`));
      else resolve();
    });
    child.stdin?.on('error', () => { /* early CLI exit is reported by the callback */ });
    child.stdin?.end(input);
  });
}

export async function callCodex(systemPrompt: string, userPrompt: string, options: CodexOptions): Promise<AIResponse> {
  if (!options.model.trim()) throw new Error('NEWSLETTER_CODEX_MODEL must be set for Codex generation');
  const workspace = mkdtempSync(join(realpathSync(tmpdir()), 'loreai-codex-'));
  const outputPath = join(workspace, 'answer.txt');
  try {
    await run(options.binary || 'codex', [
      'exec', '--ignore-user-config', '--ephemeral', '--skip-git-repo-check',
      '--sandbox', 'read-only', '--color', 'never', '--model', options.model,
      ...(options.reasoningEffort ? ['-c', `model_reasoning_effort="${options.reasoningEffort}"`] : []),
      '-c', 'approval_policy="never"', '-c', 'project_doc_max_bytes=0',
      '-c', 'features.shell_tool=false', '-c', 'features.unified_exec=false',
      '-c', 'web_search="disabled"', '--output-last-message', outputPath, '-',
    ], workspace, `${systemPrompt}\n\nOutput only the requested content. Use only the supplied sources. Do not use tools or take actions.\n\n---\n\n${userPrompt}`, options.timeoutMs ?? 300_000);
    let content: string;
    try { content = readFileSync(outputPath, 'utf-8').trim(); }
    catch { throw new Error('Codex CLI completed without a final answer file'); }
    if (!content) throw new Error('Codex CLI returned an empty final answer');
    return { content, model: options.model };
  } finally {
    rmSync(workspace, { recursive: true, force: true });
  }
}

/** Installation check only: does not verify login, quota or model access. */
export async function checkCodexHealth(binary = 'codex'): Promise<void> {
  await run(binary, ['--version'], tmpdir(), '', 15_000);
}
