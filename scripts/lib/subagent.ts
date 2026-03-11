/**
 * Subagent Runner — Claude Code Subagent via stdin pipe
 *
 * Replicated from hot2content-init orchestrator.ts (lines 105-135, 412-418).
 * Uses temp file + cat pipe to avoid shell escaping issues with long prompts.
 */

import { spawn } from 'child_process';
import { execSync } from 'child_process';
import { writeFileSync, unlinkSync } from 'fs';
import { join } from 'path';
import { randomBytes } from 'crypto';

// Resolve full path to `claude` binary at startup (cron has minimal PATH)
let CLAUDE_BIN = 'claude';
try {
  CLAUDE_BIN = execSync('which claude', { encoding: 'utf-8' }).trim();
} catch {
  // Fallback: local dev where PATH already includes claude
}

export interface SubagentResult {
  ok: boolean;
  output: string;
}

/**
 * Run a Claude Code subagent with a prompt piped via stdin.
 * Replicates hot2content-init's runClaudePipe().
 */
export function runSubagent(
  prompt: string,
  cwd: string,
  timeoutMs: number = 10 * 60 * 1000
): Promise<SubagentResult> {
  return new Promise((resolve) => {
    const tmpFile = join('/tmp', `claude-subagent-${randomBytes(8).toString('hex')}.txt`);
    writeFileSync(tmpFile, prompt);

    // Clean CLAUDECODE env to avoid nested session errors (from ai.ts pattern)
    const cleanEnv = { ...process.env };
    delete cleanEnv.CLAUDECODE;

    const child = spawn('bash', ['-c',
      `cat "${tmpFile}" | ${CLAUDE_BIN} -p --allowedTools Read,Write,Bash`
    ], {
      cwd,
      stdio: ['pipe', 'pipe', 'pipe'],
      env: cleanEnv,
    });

    let output = '';
    let stderr = '';
    child.stdout?.on('data', (d: Buffer) => {
      output += d.toString();
      process.stdout.write(d);
    });
    child.stderr?.on('data', (d: Buffer) => {
      stderr += d.toString();
      process.stderr.write(d);
    });

    const timer = setTimeout(() => {
      child.kill('SIGTERM');
      try { unlinkSync(tmpFile); } catch {}
      resolve({ ok: false, output: `Timeout after ${timeoutMs / 1000}s` });
    }, timeoutMs);

    child.on('close', (code) => {
      clearTimeout(timer);
      try { unlinkSync(tmpFile); } catch {}
      resolve({ ok: code === 0, output: output + stderr });
    });
  });
}

/**
 * Retry wrapper: try once, wait 10s, try again.
 * Replicates hot2content-init's withRetry() (lines 412-418).
 */
export async function runSubagentWithRetry(
  name: string,
  prompt: string,
  cwd: string,
  timeoutMs: number = 10 * 60 * 1000,
  retryDelayMs: number = 10000
): Promise<SubagentResult> {
  const result = await runSubagent(prompt, cwd, timeoutMs);
  if (result.ok) return result;

  console.warn(`[${name}] Failed, retrying in ${retryDelayMs / 1000}s...`);
  await new Promise((r) => setTimeout(r, retryDelayMs));
  return runSubagent(prompt, cwd, timeoutMs);
}
