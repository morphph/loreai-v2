import { execSync } from 'child_process';

const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 5000;

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

function runGit(args: string, cwd?: string): string {
  return execSync(`git ${args}`, {
    cwd: cwd || process.cwd(),
    encoding: 'utf-8',
    timeout: 30000,
  }).trim();
}

export async function gitPull(cwd?: string): Promise<void> {
  for (let i = 1; i <= MAX_RETRIES; i++) {
    try {
      runGit('pull --rebase', cwd);
      return;
    } catch (err) {
      console.warn(`git pull attempt ${i}/${MAX_RETRIES} failed:`, err);
      if (i < MAX_RETRIES) await sleep(RETRY_DELAY_MS);
    }
  }
  throw new Error('git pull failed after retries');
}

export function gitAdd(files: string[], cwd?: string): void {
  runGit(`add ${files.join(' ')}`, cwd);
}

export function gitCommit(message: string, cwd?: string): boolean {
  try {
    runGit(`commit -m "${message.replace(/"/g, '\\"')}"`, cwd);
    return true;
  } catch {
    // Nothing to commit
    return false;
  }
}

export async function gitPush(cwd?: string): Promise<void> {
  for (let i = 1; i <= MAX_RETRIES; i++) {
    try {
      runGit('push', cwd);
      return;
    } catch (err) {
      console.warn(`git push attempt ${i}/${MAX_RETRIES} failed:`, err);
      if (i < MAX_RETRIES) await sleep(RETRY_DELAY_MS);
    }
  }
  throw new Error('git push failed after retries');
}

export async function gitAddCommitPush(
  files: string[],
  message: string,
  cwd?: string
): Promise<boolean> {
  gitAdd(files, cwd);
  const committed = gitCommit(message, cwd);
  if (committed) {
    await gitPush(cwd);
  }
  return committed;
}
