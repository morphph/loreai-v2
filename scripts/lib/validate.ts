export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

const NEWSLETTER_FORBIDDEN = /game-changing|revolutionary|unprecedented|in this newsletter|in today's issue|let's dive in|without further ado|stay tuned|as we can see|it's worth noting|at the end of the day|moving forward|in conclusion|as we all know|it goes without saying/i;

export function validateNewsletter(md: string): ValidationResult {
  const errors: string[] = [];
  if (!md.match(/^# .+/m)) errors.push('Missing H1 title');
  if ((md.match(/^## .+/gm) || []).length < 2) errors.push('<2 H2 sections');
  if ((md.match(/\*\*.+?\*\*/g) || []).length < 3) errors.push('<3 bold items');
  if (md.match(/in this newsletter|in today's issue/i)) errors.push('Meta-summary detected');
  if (md.match(/^# .*\d{4}-\d{2}-\d{2}/m)) errors.push('Date-based title');
  if (!md.match(/## 🎓 MODEL LITERACY/)) errors.push('Missing MODEL LITERACY section');
  if (!md.match(/## 🎯 PICK OF THE DAY/)) errors.push('Missing PICK OF THE DAY section');
  if (md.match(NEWSLETTER_FORBIDDEN)) errors.push('Forbidden phrase detected');

  // Title quality: reject "Introducing X" and bare product-name titles
  const titleMatch = md.match(/^# (.+)/m);
  if (titleMatch) {
    const title = titleMatch[1].trim();
    if (/^introducing\s/i.test(title)) errors.push('Title starts with "Introducing" — use an editorial hook instead');
    // Reject very short titles (≤4 words) that are likely just a product name
    const words = title.split(/\s+/);
    if (words.length <= 4) {
      errors.push('Title too short — needs an editorial hook, not just a product name');
    }
  }

  return { valid: errors.length === 0, errors };
}

export function validateBlogPost(md: string, options?: { maxWords?: number }): ValidationResult {
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

  const maxWords = options?.maxWords ?? 2000;
  if (wordCount < 500) errors.push(`Too short: ${wordCount} words (min 500)`);
  if (wordCount > maxWords) errors.push(`Too long: ${wordCount} words (max ${maxWords})`);

  return { valid: errors.length === 0, errors };
}

const ZH_NEWSLETTER_FORBIDDEN = /划时代的|颠覆性的|里程碑式的|在本期简报中|今天我们来看看|让我们开始吧|话不多说|敬请期待|众所周知|不言而喻|归根结底|总而言之/;

export function validateZhNewsletter(md: string): ValidationResult {
  const errors: string[] = [];
  if (!md.match(/^# .+/m)) errors.push('Missing H1 title');
  if ((md.match(/^## .+/gm) || []).length < 2) errors.push('<2 H2 sections');
  if ((md.match(/\*\*.+?\*\*/g) || []).length < 3) errors.push('<3 bold items');
  if (md.match(/在本期简报中|今天我们来看看/)) errors.push('Meta-summary detected (ZH)');
  if (md.match(/^# .*\d{4}-\d{2}-\d{2}/m)) errors.push('Date-based title');
  if (!md.match(/## 🎓 模型小课堂/)) errors.push('Missing MODEL LITERACY (ZH)');
  if (!md.match(/## 🎯 今日精选/)) errors.push('Missing PICK OF THE DAY (ZH)');
  if (md.match(ZH_NEWSLETTER_FORBIDDEN)) errors.push('Forbidden phrase detected (ZH)');

  // ZH title must contain CJK characters — reject English-only titles
  const titleMatch = md.match(/^# (.+)/m);
  if (titleMatch) {
    const title = titleMatch[1].trim();
    if (!/[\u4e00-\u9fff\u3400-\u4dbf]/.test(title)) {
      errors.push('ZH title has no Chinese characters — must be in Chinese');
    }
  }

  return { valid: errors.length === 0, errors };
}

// ============================================================
// Weekly Newsletter Validators
// ============================================================

export function validateWeeklyNewsletter(md: string): ValidationResult {
  const errors: string[] = [];
  if (!md.match(/^# .+/m)) errors.push('Missing H1 title');
  if ((md.match(/^## .+/gm) || []).length < 5) errors.push('<5 H2 sections');
  if ((md.match(/\*\*.+?\*\*/g) || []).length < 3) errors.push('<3 bold items');
  if (!md.match(/## .*Quick Takes/i)) errors.push('Missing Quick Takes section');
  if (md.match(/^# .*\d{4}-\d{2}-\d{2}/m)) errors.push('Date-based title');
  if (md.match(NEWSLETTER_FORBIDDEN)) errors.push('Forbidden phrase detected');
  return { valid: errors.length === 0, errors };
}

export function validateWeeklyZhNewsletter(md: string): ValidationResult {
  const errors: string[] = [];
  if (!md.match(/^# .+/m)) errors.push('Missing H1 title');
  if ((md.match(/^## .+/gm) || []).length < 5) errors.push('<5 H2 sections');
  if ((md.match(/\*\*.+?\*\*/g) || []).length < 3) errors.push('<3 bold items');
  if (!md.match(/## .*速览/)) errors.push('Missing Quick Takes (速览) section');
  if (md.match(/^# .*\d{4}-\d{2}-\d{2}/m)) errors.push('Date-based title');
  if (md.match(ZH_NEWSLETTER_FORBIDDEN)) errors.push('Forbidden phrase detected (ZH)');
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

// ============================================================
// Newsletter Content Quality Validation
// ============================================================
// These checks catch the actual bugs that have occurred repeatedly:
// stale news, cross-day repeats, bad titles, ZH punctuation, attribution

export interface QualityCheckOptions {
  /** The newsletter markdown (EN or ZH) */
  md: string;
  /** 'en' or 'zh' */
  lang: 'en' | 'zh';
  /** Filtered items JSON for this date (from data/filtered-items/{DATE}.json) */
  filteredItems?: Array<{
    id: number;
    title: string;
    url: string;
    source: string;
    detected_at?: string;
    engagement_likes: number;
    engagement_retweets: number;
    engagement_downloads: number;
  }>;
  /** Bold titles from previous newsletters (for cross-day dedup check) */
  previousBoldTitles?: string[];
}

export function validateNewsletterQuality(opts: QualityCheckOptions): ValidationResult {
  const { md, lang, filteredItems, previousBoldTitles } = opts;
  const errors: string[] = [];

  // --- Check 0: Preview line presence (soft warning, not retry-worthy) ---
  if (lang === 'en' && !md.match(/Today:\s/i)) {
    errors.push('Missing "Today:" preview line');
  }
  if (lang === 'zh' && !md.match(/(?:今天聊|今日看点)[：:]/)) {
    errors.push('Missing preview line (今天聊:)');
  }

  // --- Check 1: News freshness (>72h items are stale) ---
  if (filteredItems) {
    const now = Date.now();
    const staleItems: string[] = [];
    for (const item of filteredItems) {
      if (item.detected_at) {
        const age = now - new Date(item.detected_at).getTime();
        if (age > 72 * 60 * 60 * 1000) {
          staleItems.push(item.title.slice(0, 60));
        }
      }
    }
    if (staleItems.length > 3) {
      errors.push(`${staleItems.length} stale items (>72h old): ${staleItems.slice(0, 3).join('; ')}...`);
    }
  }

  // --- Check 2: Cross-day repetition (>20% overlap with previous days) ---
  if (previousBoldTitles && previousBoldTitles.length > 0) {
    const currentBoldMatches = md.match(/\*\*([^*]+)\*\*/g) || [];
    const currentTitles = currentBoldMatches.map((m) => m.replace(/\*\*/g, '').toLowerCase());
    const prevSet = previousBoldTitles.map((t) => t.toLowerCase());

    let overlapCount = 0;
    for (const current of currentTitles) {
      // Simple word overlap check (not Jaccard — just >60% word overlap)
      const currentWords = new Set(current.split(/\s+/).filter((w) => w.length > 3));
      for (const prev of prevSet) {
        const prevWords = new Set(prev.split(/\s+/).filter((w) => w.length > 3));
        if (currentWords.size === 0 || prevWords.size === 0) continue;
        let shared = 0;
        for (const w of currentWords) {
          if (prevWords.has(w)) shared++;
        }
        if (shared / Math.min(currentWords.size, prevWords.size) > 0.6) {
          overlapCount++;
          break;
        }
      }
    }

    if (currentTitles.length > 0) {
      const overlapRate = overlapCount / currentTitles.length;
      if (overlapRate > 0.2) {
        errors.push(`Cross-day overlap ${(overlapRate * 100).toFixed(0)}% (${overlapCount}/${currentTitles.length} titles repeat from previous days)`);
      }
    }
  }

  // --- Check 3: Bold title quality (must contain entity name + action) ---
  const boldMatches = md.match(/\*\*([^*]+)\*\*/g) || [];
  const boldTitles = boldMatches.map((m) => m.replace(/\*\*/g, ''));
  let shortTitleCount = 0;
  for (const title of boldTitles) {
    const words = title.split(/\s+/);
    if (words.length <= 3 && lang === 'en') {
      shortTitleCount++;
    }
  }
  if (shortTitleCount > 2) {
    errors.push(`${shortTitleCount} bold titles have ≤3 words — need entity + action`);
  }

  // --- Check 4: ZH punctuation consistency ---
  if (lang === 'zh') {
    // Strip frontmatter and code blocks before checking
    const body = md.replace(/^---[\s\S]*?---/m, '').replace(/```[\s\S]*?```/g, '').replace(/`[^`]+`/g, '');

    // Find lines with CJK text that use ASCII punctuation
    const lines = body.split('\n');
    const mixedPuncLines: number[] = [];
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      // Skip headings, links, URLs, engagement metrics like "(1,234 likes | 56 RTs)"
      if (/^#/.test(line) || /^\s*$/.test(line)) continue;
      // Must contain CJK characters
      if (!/[\u4e00-\u9fff\u3400-\u4dbf]/.test(line)) continue;
      // Strip markdown links and engagement parentheticals
      const cleaned = line
        .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1') // keep link text
        .replace(/\([^)]*(?:likes|RTs|downloads)[^)]*\)/g, '') // strip engagement
        .replace(/https?:\/\/\S+/g, ''); // strip URLs

      // Check for ASCII comma or period adjacent to CJK
      if (/[\u4e00-\u9fff\u3400-\u4dbf][,.]|[,.][\u4e00-\u9fff\u3400-\u4dbf]/.test(cleaned)) {
        mixedPuncLines.push(i + 1);
      }
    }
    if (mixedPuncLines.length > 2) {
      errors.push(`ZH punctuation mixing on ${mixedPuncLines.length} lines (e.g., lines ${mixedPuncLines.slice(0, 3).join(', ')})`);
    }
  }

  // --- Check 5: Attribution check (bold title company names should appear in source data) ---
  // This is a soft check — we just warn, not fail
  // Skipped if no filteredItems provided

  // --- Check 6: H1 title short check (≤4 words for EN) ---
  if (lang === 'en') {
    const titleMatch = md.match(/^# (.+)/m);
    if (titleMatch) {
      const title = titleMatch[1].trim();
      const words = title.split(/\s+/);
      if (words.length <= 4) {
        errors.push('H1 title too short (≤4 words) — needs an editorial hook');
      }
    }
  }

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
