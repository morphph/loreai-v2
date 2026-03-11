// ============================================================
// outline.ts — Newsletter outline types and validation
// ============================================================

export interface OutlineItem {
  id: number;                    // matches FilteredItem.id
  title: string;                 // editorial title (English, writers adapt per language)
  section: string;               // LAUNCH | TOOL | TECHNIQUE | RESEARCH | INSIGHT | BUILD | QUICK_LINKS
  prominence: 'hero' | 'regular' | 'quick';  // hero=### sub-header, regular=**bold**, quick=one-liner
  angle: string;                 // 1 sentence: editorial angle for this story
  key_fact: string;              // most important specific number or fact
}

export interface NewsletterOutline {
  date: string;
  headline_hook: string;         // H1 editorial hook (reference 2-3 stories + verb)
  preview_topics: string[];      // 3 topics for "Today: X, Y, and Z." line
  pick_of_the_day: {
    item_id: number;
    thesis: string;              // deep analysis thesis (not a summary)
  };
  model_literacy: {
    concept: string;             // technical concept name
    relevance: string;           // why discuss this today
  };
  sections: Array<{
    name: string;
    items: OutlineItem[];
  }>;
  quick_links: OutlineItem[];
  total_items: number;           // sanity check
}

// ============================================================
// JSON extraction helper — handles ```json blocks, prose wrappers
// Mirrors extractJsonArray but for objects (first { to last })
// ============================================================

export function extractJsonObject(content: string): string {
  const start = content.indexOf('{');
  const end = content.lastIndexOf('}');
  if (start !== -1 && end > start) {
    return content.slice(start, end + 1);
  }
  return content.trim();
}

// ============================================================
// Outline validation
// ============================================================

const HEADLINE_VERBS = new Set([
  'ships', 'drops', 'launches', 'goes', 'gets', 'rolls', 'fires',
  'hits', 'lands', 'unveils', 'reveals', 'brings', 'changes',
  'takes', 'makes', 'splits', 'pushes', 'pulls', 'opens', 'closes',
  'moves', 'adds', 'cuts', 'breaks', 'builds', 'turns', 'joins',
  'picks', 'sets', 'starts', 'shows', 'runs', 'comes', 'gives',
]);

export function validateOutline(content: string): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  // 1. Parse JSON
  let outline: NewsletterOutline;
  try {
    const json = extractJsonObject(content);
    outline = JSON.parse(json) as NewsletterOutline;
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return { valid: false, errors: [`Invalid JSON: ${msg}`] };
  }

  // 2. Required top-level fields
  if (!outline.date) errors.push('Missing required field: date');
  if (!outline.headline_hook) errors.push('Missing required field: headline_hook');
  if (!outline.preview_topics) errors.push('Missing required field: preview_topics');
  if (!outline.pick_of_the_day) {
    errors.push('Missing required field: pick_of_the_day');
  } else {
    if (outline.pick_of_the_day.item_id == null) errors.push('Missing required field: pick_of_the_day.item_id');
    if (!outline.pick_of_the_day.thesis) errors.push('Missing required field: pick_of_the_day.thesis');
  }
  if (!outline.model_literacy) {
    errors.push('Missing required field: model_literacy');
  } else {
    if (!outline.model_literacy.concept) errors.push('Missing required field: model_literacy.concept');
    if (!outline.model_literacy.relevance) errors.push('Missing required field: model_literacy.relevance');
  }
  if (!outline.sections) errors.push('Missing required field: sections');
  if (!outline.quick_links) errors.push('Missing required field: quick_links');
  if (outline.total_items == null) errors.push('Missing required field: total_items');

  // Bail early if structural fields are missing
  if (errors.length > 0) return { valid: false, errors };

  // 3. Sections must be non-empty, each with at least 1 item
  if (!Array.isArray(outline.sections) || outline.sections.length === 0) {
    errors.push('sections must be a non-empty array');
  } else {
    for (const section of outline.sections) {
      if (!Array.isArray(section.items) || section.items.length === 0) {
        errors.push(`Section "${section.name}" must have at least 1 item`);
      }
    }
  }

  // 4. pick_of_the_day.item_id must exist in some section's items or quick_links
  const allItemIds = new Set<number>();
  if (Array.isArray(outline.sections)) {
    for (const section of outline.sections) {
      if (Array.isArray(section.items)) {
        for (const item of section.items) {
          allItemIds.add(item.id);
        }
      }
    }
  }
  if (Array.isArray(outline.quick_links)) {
    for (const item of outline.quick_links) {
      allItemIds.add(item.id);
    }
  }
  if (!allItemIds.has(outline.pick_of_the_day.item_id)) {
    errors.push(`pick_of_the_day.item_id (${outline.pick_of_the_day.item_id}) not found in any section or quick_links`);
  }

  // 5. headline_hook must have >= 6 words and contain at least one common verb
  const words = outline.headline_hook.split(/\s+/).filter(Boolean);
  if (words.length < 6) {
    errors.push(`headline_hook has ${words.length} words (need >= 6)`);
  }
  const lowerWords = words.map(w => w.toLowerCase().replace(/[^a-z]/g, ''));
  const hasVerb = lowerWords.some(w => HEADLINE_VERBS.has(w));
  if (!hasVerb) {
    errors.push('headline_hook must contain at least one common verb (ships, drops, launches, etc.)');
  }

  // 6. preview_topics must have exactly 3 items
  if (!Array.isArray(outline.preview_topics) || outline.preview_topics.length !== 3) {
    const count = Array.isArray(outline.preview_topics) ? outline.preview_topics.length : 0;
    errors.push(`preview_topics must have exactly 3 items (got ${count})`);
  }

  // 7. total_items must be between 15 and 25 inclusive
  if (outline.total_items < 15 || outline.total_items > 25) {
    errors.push(`total_items must be 15-25 (got ${outline.total_items})`);
  }

  // 8. At least 2 items with prominence: 'hero' across all sections
  let heroCount = 0;
  if (Array.isArray(outline.sections)) {
    for (const section of outline.sections) {
      if (Array.isArray(section.items)) {
        for (const item of section.items) {
          if (item.prominence === 'hero') heroCount++;
        }
      }
    }
  }
  if (heroCount < 2) {
    errors.push(`Need at least 2 hero items across all sections (got ${heroCount})`);
  }

  return { valid: errors.length === 0, errors };
}
