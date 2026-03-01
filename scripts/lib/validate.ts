export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

export function validateNewsletter(md: string): ValidationResult {
  const errors: string[] = [];
  if (!md.match(/^# .+/m)) errors.push('Missing H1 title');
  if ((md.match(/^## .+/gm) || []).length < 2) errors.push('<2 H2 sections');
  if ((md.match(/\*\*.+?\*\*/g) || []).length < 3) errors.push('<3 bold items');
  if (md.match(/in this newsletter|in today's issue/i)) errors.push('Meta-summary detected');
  if (md.match(/^# .*\d{4}-\d{2}-\d{2}/m)) errors.push('Date-based title');
  return { valid: errors.length === 0, errors };
}

export function validateBlogPost(md: string): ValidationResult {
  const errors: string[] = [];
  if (!md.match(/^# .+/m)) errors.push('Missing H1 title');
  if ((md.match(/^## .+/gm) || []).length < 2) errors.push('<2 H2 sections');
  if (md.match(/in this article|without further ado|let's break it down/i))
    errors.push('Forbidden phrase detected');
  if (!md.match(/\[.*subscribe.*\]/i)) errors.push('Missing newsletter CTA');

  // Word count check (800-1500 target)
  const wordCount = md
    .replace(/^---[\s\S]*?---/m, '') // strip frontmatter
    .replace(/^#.+$/gm, '') // strip headers
    .split(/\s+/)
    .filter((w) => w.length > 0).length;

  if (wordCount < 500) errors.push(`Too short: ${wordCount} words (min 500)`);
  if (wordCount > 2000) errors.push(`Too long: ${wordCount} words (max 2000)`);

  return { valid: errors.length === 0, errors };
}

export function validateZhNewsletter(md: string): ValidationResult {
  const errors: string[] = [];
  if (!md.match(/^# .+/m)) errors.push('Missing H1 title');
  if ((md.match(/^## .+/gm) || []).length < 2) errors.push('<2 H2 sections');
  if ((md.match(/\*\*.+?\*\*/g) || []).length < 3) errors.push('<3 bold items');
  if (md.match(/在本期简报中|今天我们来看看/)) errors.push('Meta-summary detected (ZH)');
  if (md.match(/^# .*\d{4}-\d{2}-\d{2}/m)) errors.push('Date-based title');
  return { valid: errors.length === 0, errors };
}
