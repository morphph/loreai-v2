import { describe, expect, it } from 'vitest';
import { sanitizeOutput } from '../sanitize';

describe('newsletter output cleanup', () => {
  it.each(['Today: models, tools, and research.', '今天聊：模型、工具和研究。'])('preserves headline and preview before a horizontal rule', (preview) => {
    const md = `# Builders Get New Models And Better Tools\n\n**2026-09-28**\n\n${preview}\n\n---\n\n## News\n\nContent`;
    expect(sanitizeOutput(md)).toBe(md);
    expect(sanitizeOutput(`Here is the newsletter:\n\n${md}`)).toBe(md);
    expect(sanitizeOutput('```markdown\n' + md + '\n```')).toBe(md);
  });
  it('still removes commentary before genuine frontmatter', () => {
    const md = '---\ntitle: Sample\nlang: en\n---\n\n# Article\n\nBody';
    expect(sanitizeOutput('Here is your article:\n\n' + md)).toBe(md);
    expect(sanitizeOutput(md)).toBe(md);
  });
});
