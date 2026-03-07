/**
 * Clean raw Claude output into valid markdown content.
 * Handles common Claude output issues:
 * 1. ```markdown code fences wrapping the entire output
 * 2. Preamble text before frontmatter ("Here's the newsletter:")
 * 3. Trailing commentary after content ("Let me know if...")
 */
export function sanitizeOutput(raw: string): string {
  let s = raw.trim();

  // 1. Remove opening ```markdown or ```yaml or ``` at start
  s = s.replace(/^```(?:markdown|yaml|md)?\s*\n/, '');
  // Remove closing ``` at end
  s = s.replace(/\n```\s*$/, '');
  s = s.trim();

  // 2. If content has frontmatter but doesn't start with it,
  //    Claude added preamble text — strip everything before first ---
  if (!s.startsWith('---') && s.includes('\n---\n')) {
    const idx = s.indexOf('\n---\n');
    s = s.slice(idx + 1);
  }
  // Also handle: preamble text followed by # heading (no frontmatter case, like newsletters)
  if (!s.startsWith('---') && !s.startsWith('#') && s.includes('\n# ')) {
    const idx = s.indexOf('\n# ');
    s = s.slice(idx + 1);
  }

  // 3. Strip trailing Claude commentary
  //    Pattern: content ends, then a blank line, then "Let me know..." / "I hope..." / "Note:" / "---\n\nNote:"
  s = s.replace(/\n{2,}(?:Let me know|I hope|Note:|---\s*\n\s*(?:Let|Note|I |This ))[\s\S]*$/i, '');

  return s.trim();
}
