// Cross-day dedup: extract bold titles from existing newsletter markdown
export function extractBoldTitles(markdown: string): string[] {
  const matches = markdown.match(/\*\*([^*]+)\*\*/g) || [];
  return matches.map((m) => m.replace(/\*\*/g, ''));
}
