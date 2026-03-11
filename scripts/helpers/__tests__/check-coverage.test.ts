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
    } catch (err: any) {
      expect(err.status).toBe(1);
      expect(err.stderr).toContain('Usage');
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
    // Even if there are matches, they should only be from at most 1 date
    const uniqueDates = new Set(result.matches.map((m: any) => m.date));
    expect(uniqueDates.size).toBeLessThanOrEqual(1);
  });
});
