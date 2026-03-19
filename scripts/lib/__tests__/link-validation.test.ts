import { describe, it, expect } from 'vitest';
import { validateAndFixLinks } from '../seo/generation';

describe('validateAndFixLinks', () => {
  it('preserves valid internal links', () => {
    // /subscribe is a single-segment path — always valid
    const content = 'Check out [Subscribe](/subscribe) for updates.';
    const result = validateAndFixLinks(content);
    expect(result.brokenCount).toBe(0);
    expect(result.content).toBe(content);
  });

  it('removes broken content links', () => {
    // /glossary/nonexistent-term won't exist on disk
    const content = 'Learn about [some term](/glossary/nonexistent-xyz-term-12345) today.';
    const result = validateAndFixLinks(content);
    expect(result.brokenCount).toBe(1);
    expect(result.content).toBe('Learn about some term today.');
    expect(result.fixedLinks).toContain('/glossary/nonexistent-xyz-term-12345');
  });

  it('handles multiple broken links', () => {
    const content = `See [A](/compare/fake-a-vs-b) and [B](/faq/fake-question-xyz).`;
    const result = validateAndFixLinks(content);
    expect(result.brokenCount).toBe(2);
    expect(result.content).toBe('See A and B.');
  });

  it('does not modify external links', () => {
    const content = 'Visit [Anthropic](https://anthropic.com) for details.';
    const result = validateAndFixLinks(content);
    expect(result.brokenCount).toBe(0);
    expect(result.content).toBe(content);
  });
});
