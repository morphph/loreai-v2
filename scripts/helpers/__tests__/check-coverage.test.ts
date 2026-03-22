import { describe, it, expect } from 'vitest';
import { execSync } from 'child_process';

const CWD = process.cwd();

describe('check-coverage.ts', () => {
  it('prints usage and exits 1 without --topic', () => {
    try {
      execSync('npx tsx scripts/helpers/check-coverage.ts', {
        encoding: 'utf-8',
        cwd: CWD,
        stdio: 'pipe',
      });
      expect.fail('Should have exited with code 1');
    } catch (err: unknown) {
      expect((err as { status: number }).status).toBe(1);
      expect((err as { stderr: string }).stderr).toContain('Usage');
    }
  });

  it('outputs valid JSON with matches array', () => {
    const output = execSync(
      'npx tsx scripts/helpers/check-coverage.ts --topic="Claude" --days=3',
      { encoding: 'utf-8', cwd: CWD, stdio: 'pipe' }
    );
    const result = JSON.parse(output);
    expect(result.query).toBe('Claude');
    expect(result.days).toBe(3);
    expect(Array.isArray(result.matches)).toBe(true);
  });

  it('returns empty matches for non-existent topics', () => {
    const output = execSync(
      'npx tsx scripts/helpers/check-coverage.ts --topic="ZZZZNONEXISTENT999" --days=3',
      { encoding: 'utf-8', cwd: CWD, stdio: 'pipe' }
    );
    const result = JSON.parse(output);
    expect(result.matches).toHaveLength(0);
  });

  it('respects --days parameter', () => {
    const output = execSync(
      'npx tsx scripts/helpers/check-coverage.ts --topic="AI" --days=1',
      { encoding: 'utf-8', cwd: CWD, stdio: 'pipe' }
    );
    const result = JSON.parse(output);
    expect(result.days).toBe(1);
    // days=1 reads 1 file per source (newsletter + filtered-items), so up to 2 dates
    const uniqueDates = new Set(result.matches.map((m: { date: string }) => m.date));
    expect(uniqueDates.size).toBeLessThanOrEqual(2);
  });
});
