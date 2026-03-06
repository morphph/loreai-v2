import { execSync } from 'child_process';
import { writeFileSync, unlinkSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import { randomBytes } from 'crypto';
import 'dotenv/config';

// --- Model mapping (API ID → CLI ID) ---

const MODEL_MAP: Record<string, string> = {
  'claude-opus-4-20250514': 'claude-opus-4-6',
  'claude-sonnet-4-20250514': 'claude-sonnet-4-6',
};

function resolveModel(model: string): string {
  return MODEL_MAP[model] || model;
}

// --- Claude CLI ---

// Resolve full path to `claude` binary at startup so cron (minimal PATH) can find it
let CLAUDE_BIN = 'claude';
try {
  CLAUDE_BIN = execSync('which claude', { encoding: 'utf-8' }).trim();
} catch {
  // Fallback: local dev where PATH already includes claude
}

export interface AIResponse {
  content: string;
  model: string;
  usage?: { input_tokens: number; output_tokens: number };
}

export async function callClaude(
  systemPrompt: string,
  userPrompt: string,
  options: {
    model?: string;
    maxTokens?: number;
    temperature?: number;
  } = {}
): Promise<AIResponse> {
  const model = resolveModel(options.model || 'claude-opus-4-20250514');

  // Write prompt to a temp file
  const tmpFile = join(tmpdir(), `claude-prompt-${randomBytes(8).toString('hex')}.txt`);
  const noToolsDirective = '\n\nIMPORTANT: Output the content directly. Do NOT use tools, file reads, or any actions. Just generate the requested content immediately.';
  const prompt = `${systemPrompt}${noToolsDirective}\n\n---\n\n${userPrompt}`;
  writeFileSync(tmpFile, prompt, 'utf-8');

  try {
    // Clean env to avoid nested Claude Code session errors
    const cleanEnv = { ...process.env };
    delete cleanEnv.CLAUDECODE;

    const stdout = execSync(
      `cat "${tmpFile}" | ${CLAUDE_BIN} --model ${model} --output-format text --max-turns 1 --print`,
      {
        timeout: 3 * 60 * 1000, // 3 minutes
        maxBuffer: 10 * 1024 * 1024, // 10 MB
        encoding: 'utf-8',
        stdio: ['pipe', 'pipe', 'pipe'],
        env: cleanEnv,
      }
    );

    // Strip ANSI escape sequences
    const content = stdout.replace(/\x1b\[[0-9;]*[a-zA-Z]/g, '').trim();

    return {
      content,
      model,
      usage: undefined,
    };
  } finally {
    try { unlinkSync(tmpFile); } catch {}
  }
}

export async function callClaudeWithRetry(
  systemPrompt: string,
  userPrompt: string,
  options: {
    model?: string;
    maxTokens?: number;
    temperature?: number;
    maxRetries?: number;
    validate?: (content: string) => { valid: boolean; errors: string[] };
  } = {}
): Promise<AIResponse> {
  const maxRetries = options.maxRetries ?? 3;
  let lastError: Error | null = null;
  let lastResponse: AIResponse | null = null;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const response = await callClaude(systemPrompt, userPrompt, options);

      if (options.validate) {
        const { valid, errors } = options.validate(response.content);
        if (!valid) {
          console.warn(`Attempt ${attempt + 1}/${maxRetries} validation failed:`, errors);
          lastResponse = response;
          lastError = new Error(`Validation failed: ${errors.join(', ')}`);
          continue;
        }
      }

      return response;
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
      console.warn(`Attempt ${attempt + 1}/${maxRetries} failed:`, lastError.message);
    }
  }

  // Return last response if we had one (validation failed but content exists)
  if (lastResponse) return lastResponse;
  throw lastError || new Error('All retries exhausted');
}

// --- ZH Newsletter Fallback Cascade ---
// Order: Claude Opus → Claude Sonnet

export async function callZhNewsletterWithFallback(
  systemPrompt: string,
  userPrompt: string,
  validate?: (content: string) => { valid: boolean; errors: string[] }
): Promise<AIResponse> {
  // 1. Claude Opus (2 attempts)
  try {
    const response = await callClaudeWithRetry(systemPrompt, userPrompt, {
      model: 'claude-opus-4-20250514',
      maxRetries: 2,
      validate,
    });
    console.log('ZH newsletter: Claude Opus succeeded');
    return response;
  } catch (err) {
    console.warn('ZH newsletter: Claude Opus failed, trying Claude Sonnet...', err);
  }

  // 2. Claude Sonnet (fallback)
  const response = await callClaude(systemPrompt, userPrompt, {
    model: 'claude-sonnet-4-20250514',
  });
  console.log('ZH newsletter: Claude Sonnet succeeded (fallback)');
  return response;
}
