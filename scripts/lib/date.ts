/**
 * Shared date helper — all pipeline scripts use SGT (UTC+8) as the canonical timezone.
 */

/** Returns today's date string in SGT (YYYY-MM-DD). */
export function todaySGT(): string {
  return new Date(Date.now() + 8 * 3600_000).toISOString().slice(0, 10);
}
