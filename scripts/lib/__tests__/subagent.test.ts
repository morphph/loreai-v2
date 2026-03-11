import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { EventEmitter } from 'events';

// Mock child_process before importing the module
const mockSpawn = vi.fn();
const mockExecSync = vi.fn();

vi.mock('child_process', () => ({
  spawn: (...args: unknown[]) => mockSpawn(...args),
  execSync: (...args: unknown[]) => mockExecSync(...args),
}));

// Mock fs
const mockWriteFileSync = vi.fn();
const mockUnlinkSync = vi.fn();

vi.mock('fs', () => ({
  writeFileSync: (...args: unknown[]) => mockWriteFileSync(...args),
  unlinkSync: (...args: unknown[]) => mockUnlinkSync(...args),
}));

// Import after mocks
import { runSubagent, runSubagentWithRetry } from '../subagent';

function createMockChild(exitCode: number, stdoutData = '', stderrData = '') {
  const child = new EventEmitter() as EventEmitter & {
    stdout: EventEmitter;
    stderr: EventEmitter;
    kill: ReturnType<typeof vi.fn>;
  };
  child.stdout = new EventEmitter();
  child.stderr = new EventEmitter();
  child.kill = vi.fn();

  // Emit data and close asynchronously
  setTimeout(() => {
    if (stdoutData) child.stdout.emit('data', Buffer.from(stdoutData));
    if (stderrData) child.stderr.emit('data', Buffer.from(stderrData));
    child.emit('close', exitCode);
  }, 10);

  return child;
}

describe('runSubagent', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockExecSync.mockReturnValue('/usr/local/bin/claude');
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('writes prompt to temp file and spawns claude', async () => {
    const child = createMockChild(0, 'output text');
    mockSpawn.mockReturnValue(child);

    const result = await runSubagent('test prompt', '/tmp/workspace');

    expect(result.ok).toBe(true);
    expect(result.output).toContain('output text');

    // Verify temp file was written
    expect(mockWriteFileSync).toHaveBeenCalledWith(
      expect.stringMatching(/\/tmp\/claude-subagent-.+\.txt$/),
      'test prompt'
    );

    // Verify spawn was called with correct args
    expect(mockSpawn).toHaveBeenCalledWith('bash', expect.arrayContaining([
      expect.stringContaining('claude -p --allowedTools Read,Write,Bash'),
    ]), expect.objectContaining({
      cwd: '/tmp/workspace',
    }));
  });

  it('cleans up temp file after success', async () => {
    const child = createMockChild(0);
    mockSpawn.mockReturnValue(child);

    await runSubagent('test', '/tmp/workspace');
    expect(mockUnlinkSync).toHaveBeenCalled();
  });

  it('returns ok=false when process exits non-zero', async () => {
    const child = createMockChild(1, '', 'error output');
    mockSpawn.mockReturnValue(child);

    const result = await runSubagent('test', '/tmp/workspace');
    expect(result.ok).toBe(false);
  });

  it('handles timeout by killing process', async () => {
    const child = new EventEmitter() as EventEmitter & {
      stdout: EventEmitter;
      stderr: EventEmitter;
      kill: ReturnType<typeof vi.fn>;
    };
    child.stdout = new EventEmitter();
    child.stderr = new EventEmitter();
    child.kill = vi.fn();
    mockSpawn.mockReturnValue(child);

    // Use very short timeout
    const resultPromise = runSubagent('test', '/tmp/workspace', 50);

    const result = await resultPromise;
    expect(result.ok).toBe(false);
    expect(result.output).toContain('Timeout');
    expect(child.kill).toHaveBeenCalledWith('SIGTERM');
  });

  it('cleans CLAUDECODE from environment', async () => {
    process.env.CLAUDECODE = 'some-value';
    const child = createMockChild(0);
    mockSpawn.mockReturnValue(child);

    await runSubagent('test', '/tmp/workspace');

    const spawnEnv = mockSpawn.mock.calls[0][2].env;
    expect(spawnEnv.CLAUDECODE).toBeUndefined();

    delete process.env.CLAUDECODE;
  });
});

describe('runSubagentWithRetry', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockExecSync.mockReturnValue('/usr/local/bin/claude');
  });

  it('returns on first success without retry', async () => {
    const child = createMockChild(0, 'success');
    mockSpawn.mockReturnValue(child);

    const result = await runSubagentWithRetry('TEST', 'prompt', '/tmp/workspace');
    expect(result.ok).toBe(true);
    expect(mockSpawn).toHaveBeenCalledTimes(1);
  });

  it('retries once on failure', async () => {
    // Create children lazily so setTimeout fires after runSubagent attaches listeners
    mockSpawn
      .mockImplementationOnce(() => createMockChild(1, '', 'error'))
      .mockImplementationOnce(() => createMockChild(0, 'retry success'));

    const result = await runSubagentWithRetry('TEST', 'prompt', '/tmp/workspace', 10 * 60 * 1000, 0);
    expect(result.ok).toBe(true);
    expect(mockSpawn).toHaveBeenCalledTimes(2);
  });
});
