/**
 * Flagship Topics Configuration
 *
 * Shared constant extracted to avoid circular dependencies between
 * keyword-expand.ts and discovery.ts.
 */

export interface FlagshipTopic {
  slug: string;
  name: string;
  cornerstoneUrl: string;
  excludeDomains: string[];
}

export const FLAGSHIP_TOPICS: FlagshipTopic[] = [
  {
    slug: 'claude-code',
    name: 'Claude Code',
    cornerstoneUrl: 'https://loreai.dev/claude-code',
    excludeDomains: ['loreai.dev'],
  },
  {
    slug: 'codex',
    name: 'OpenAI Codex',
    cornerstoneUrl: 'https://loreai.dev/codex',
    excludeDomains: ['loreai.dev'],
  },
];
