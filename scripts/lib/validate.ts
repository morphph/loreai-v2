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
  if (!md.match(/\[.*(subscribe|订阅).*\]/i)) errors.push('Missing newsletter CTA');

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

// ============================================================
// SEO Page Validators
// ============================================================

const FORBIDDEN_PHRASES = /in conclusion|as we can see|it's worth noting|in this article|without further ado|let's dive in|let's break it down|game-changing|revolutionary|unprecedented|stay tuned|in today's post|as we all know|it goes without saying|at the end of the day|moving forward/i;

function countWords(md: string): number {
  const stripped = md
    .replace(/^---[\s\S]*?---/m, '') // strip frontmatter
    .replace(/^#+.+$/gm, '')          // strip headings
    .replace(/\|[^|]*\|/g, '')        // strip table cells
    .replace(/[*_`~\[\]()#>|-]/g, ''); // strip markdown formatting

  // Count CJK characters (each ≈ 1 word)
  const cjkChars = (stripped.match(/[\u4e00-\u9fff\u3400-\u4dbf]/g) || []).length;
  // Count non-CJK words (English, numbers, etc.)
  const nonCjk = stripped.replace(/[\u4e00-\u9fff\u3400-\u4dbf]/g, ' ');
  const enWords = nonCjk.split(/\s+/).filter((w) => w.length > 0).length;

  return cjkChars + enWords;
}

export function validateGlossary(md: string): ValidationResult {
  const errors: string[] = [];

  // Must have H1
  if (!md.match(/^# .+/m)) errors.push('Missing H1 title');

  // Word count: 200-400
  const wordCount = countWords(md);
  if (wordCount < 150) errors.push(`Too short: ${wordCount} words (min 200, hard floor 150)`);
  if (wordCount > 600) errors.push(`Too long: ${wordCount} words (max 400, hard ceiling 600)`);

  // No forbidden phrases
  if (md.match(FORBIDDEN_PHRASES)) errors.push('Forbidden phrase detected');

  // Should have subscribe CTA
  if (!md.match(/\[.*(subscribe|订阅).*\]/i)) errors.push('Missing newsletter CTA');

  return { valid: errors.length === 0, errors };
}

export function validateFaq(md: string): ValidationResult {
  const errors: string[] = [];

  // Must have H1
  if (!md.match(/^# .+/m)) errors.push('Missing H1 title');

  // Word count: 200-500
  const wordCount = countWords(md);
  if (wordCount < 150) errors.push(`Too short: ${wordCount} words (min 200, hard floor 150)`);
  if (wordCount > 600) errors.push(`Too long: ${wordCount} words (max 500, hard ceiling 600)`);

  // No forbidden phrases
  if (md.match(FORBIDDEN_PHRASES)) errors.push('Forbidden phrase detected');

  // Should have subscribe CTA
  if (!md.match(/\[.*(subscribe|订阅).*\]/i)) errors.push('Missing newsletter CTA');

  return { valid: errors.length === 0, errors };
}

export function validateCompare(md: string): ValidationResult {
  const errors: string[] = [];

  // Must have H1
  if (!md.match(/^# .+/m)) errors.push('Missing H1 title');

  // Must have >= 2 H2 sections
  const h2Count = (md.match(/^## .+/gm) || []).length;
  if (h2Count < 2) errors.push(`Only ${h2Count} H2 sections (need >= 2)`);

  // Word count: 400-800
  const wordCount = countWords(md);
  if (wordCount < 300) errors.push(`Too short: ${wordCount} words (min 400, hard floor 300)`);
  if (wordCount > 1000) errors.push(`Too long: ${wordCount} words (max 800, hard ceiling 1000)`);

  // No forbidden phrases
  if (md.match(FORBIDDEN_PHRASES)) errors.push('Forbidden phrase detected');

  // Should have a comparison table
  if (!md.match(/\|.*\|.*\|/)) errors.push('Missing comparison table');

  // Should have subscribe CTA
  if (!md.match(/\[.*(subscribe|订阅).*\]/i)) errors.push('Missing newsletter CTA');

  return { valid: errors.length === 0, errors };
}

export function validateTopicHub(md: string): ValidationResult {
  const errors: string[] = [];

  // Must have H1
  if (!md.match(/^# .+/m)) errors.push('Missing H1 title');

  // Must have >= 2 H2 sections
  const h2Count = (md.match(/^## .+/gm) || []).length;
  if (h2Count < 2) errors.push(`Only ${h2Count} H2 sections (need >= 2)`);

  // Word count: 500-1000
  const wordCount = countWords(md);
  if (wordCount < 350) errors.push(`Too short: ${wordCount} words (min 500, hard floor 350)`);
  if (wordCount > 1200) errors.push(`Too long: ${wordCount} words (max 1000, hard ceiling 1200)`);

  // No forbidden phrases
  if (md.match(FORBIDDEN_PHRASES)) errors.push('Forbidden phrase detected');

  // Should have internal links
  if (!md.match(/\[.+?\]\(\/.+?\)/)) errors.push('No internal links found');

  // Should have subscribe CTA
  if (!md.match(/\[.*(subscribe|订阅).*\]/i)) errors.push('Missing newsletter CTA');

  return { valid: errors.length === 0, errors };
}
