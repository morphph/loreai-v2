import type { RecentSeoPage } from './db';
import type { NewsletterOutline } from './outline';

export interface FilteredItem {
  id: number;
  title: string;
  url: string;
  source: string;
  category: string;
  score: number;
  why_it_matters: string;
  action: string;
  engagement_likes: number;
  engagement_retweets: number;
  engagement_downloads: number;
  detected_at?: string;
}

const SEO_TYPE_URL_PREFIX: Record<string, string> = {
  faq: '/faq/',
  compare: '/compare/',
  glossary: '/glossary/',
  blog: '/blog/',
  'topic-hub': '/topics/',
  'deep-dive': '/blog/',
  cornerstone: '/blog/',
};

function formatRecentPages(pages: RecentSeoPage[]): string {
  if (pages.length === 0) return '';
  const lines = pages.map(p => {
    const urlPrefix = SEO_TYPE_URL_PREFIX[p.type] || `/${p.type}/`;
    return `- [${p.title || p.slug}](https://loreai.dev${urlPrefix}${p.slug}) (${p.type}, ${p.created_at.split(' ')[0]})`;
  });
  return `\n\n## Recently Published on LoreAI (last 7 days)\nThese pages were recently published on our site. You may optionally weave 1-2 of the most relevant ones into the newsletter as "deep dive" or "further reading" links where they naturally fit a story. Do NOT force them in — only include if genuinely relevant to today's news items.\n${lines.join('\n')}\n`;
}

// ============================================================
// STAGE 4: EN Newsletter
// ============================================================

export function formatEngagement(item: FilteredItem): string {
  const parts: string[] = [];

  if (item.engagement_likes > 0 && item.engagement_downloads > 0) {
    // HuggingFace style
    const likesStr = item.engagement_likes.toLocaleString();
    const dlStr =
      item.engagement_downloads >= 1_000_000
        ? `${(item.engagement_downloads / 1_000_000).toFixed(2)}M`
        : item.engagement_downloads >= 1_000
          ? `${(item.engagement_downloads / 1_000).toFixed(1)}K`
          : item.engagement_downloads.toString();
    parts.push(`(${likesStr} likes | ${dlStr} downloads)`);
  } else if (item.engagement_likes > 0 && item.engagement_retweets > 0) {
    // Twitter style
    parts.push(`(${item.engagement_likes.toLocaleString()} likes | ${item.engagement_retweets} RTs)`);
  } else if (item.engagement_likes > 0) {
    parts.push(`(${item.engagement_likes.toLocaleString()} likes)`);
  }

  return parts.join(' ');
}


export function buildENNewsletterPrompts(
  date: string, skill: string, filtered: FilteredItem[],
  outline: NewsletterOutline | null, recentPages: RecentSeoPage[] = [],
): { systemPrompt: string; userPrompt: string } {
  const DATE = date;
  // Format items by category for the writer
  const byCategory = new Map<string, FilteredItem[]>();
  for (const item of filtered) {
    const cat = item.category || 'PRODUCT';
    if (!byCategory.has(cat)) byCategory.set(cat, []);
    byCategory.get(cat)!.push(item);
  }

  let itemsText = '';
  for (const [category, catItems] of byCategory) {
    itemsText += `\n## ${category}\n`;
    for (const item of catItems) {
      const engagement = formatEngagement(item);
      itemsText += `- ${item.title} ${engagement}\n  URL: ${item.url}\n  Source: ${item.source}\n  Why: ${item.why_it_matters}\n  Action: ${item.action || ''}\n\n`;
    }
  }

  // Build outline section if available
  const outlineSection = outline
    ? `\n\n## Structural Plan (FOLLOW THIS)\nYou MUST follow this outline. Do not reorganize or reassign items.\n- Use the headline_hook as the basis for your H1: "${outline.headline_hook}"\n- Preview line topics: ${outline.preview_topics.join(', ')}\n- PICK OF THE DAY: item #${outline.pick_of_the_day.item_id} — thesis: "${outline.pick_of_the_day.thesis}"\n- MODEL LITERACY: "${outline.model_literacy.concept}" — ${outline.model_literacy.relevance}\n- Section order and item assignment:\n${outline.sections.map(s => `  ${s.name}: ${s.items.map(i => `[${i.id}] ${i.prominence === 'hero' ? '###' : '**'} "${i.title}"`).join(', ')}`).join('\n')}\n- Quick links: ${outline.quick_links.map(i => `[${i.id}] "${i.title}"`).join(', ')}\n\nYour task is WRITING, not EDITING. Do not reorganize or reassign items. Follow the section order and prominence levels exactly.\n`
    : '';

  const recentPagesSection = formatRecentPages(recentPages);

  const systemPrompt = `${skill}${outlineSection}${recentPagesSection}\n\n## This Run\n- Date: ${DATE}\n- Items provided: ${filtered.length}\n- Outline: ${outline ? 'YES — follow it strictly' : 'NO — use your editorial judgment'}\n- IMPORTANT STRUCTURE: You MUST start with a # headline, then **${DATE}**, then a 1-2 sentence intro paragraph, then a "Today: X, Y, and Z." preview line, then --- before sections. These are required for the frontend — do NOT skip any of them.\n- Output ONLY the newsletter markdown. No frontmatter, no meta-commentary.\n- CRITICAL — Attribution accuracy: Do NOT infer or guess which product/company an item is about. Use ONLY the product/company names explicitly stated in the item title or summary. If the source doesn't name the product, describe the features without attributing them to a specific product.`;

  const userPrompt = `Write today's LoreAI AI News newsletter (${DATE}) using these ${filtered.length} curated items:\n\n${itemsText}`;

  return { systemPrompt, userPrompt };
}

export function buildZHNewsletterPrompts(
  date: string, skill: string, filtered: FilteredItem[],
  outline: NewsletterOutline | null, recentPages: RecentSeoPage[] = [],
): { systemPrompt: string; userPrompt: string } {
  const DATE = date;
  // Format items
  let itemsText = '';
  const byCategory = new Map<string, FilteredItem[]>();
  for (const item of filtered) {
    const cat = item.category || 'PRODUCT';
    if (!byCategory.has(cat)) byCategory.set(cat, []);
    byCategory.get(cat)!.push(item);
  }
  for (const [category, catItems] of byCategory) {
    itemsText += `\n## ${category}\n`;
    for (const item of catItems) {
      const engagement = formatEngagement(item);
      itemsText += `- ${item.title} ${engagement}\n  URL: ${item.url}\n  Source: ${item.source}\n  Why: ${item.why_it_matters}\n  Action: ${item.action || ''}\n\n`;
    }
  }

  // Build outline section if available (ZH adapts titles/angles but follows structure)
  const outlineSection = outline
    ? `\n\n## 结构大纲（严格遵循）\n你必须遵循以下大纲，不要重新组织或重新分配条目。\n- 标题 hook 基础："${outline.headline_hook}"（翻译并适配中文表达）\n- 预览主题：${outline.preview_topics.join('、')}\n- 今日精选：条目 #${outline.pick_of_the_day.item_id} — 论点："${outline.pick_of_the_day.thesis}"\n- 模型小课堂："${outline.model_literacy.concept}" — ${outline.model_literacy.relevance}\n- 版块顺序和条目分配：\n${outline.sections.map(s => `  ${s.name}: ${s.items.map(i => `[${i.id}] ${i.prominence === 'hero' ? '###' : '**'} "${i.title}"`).join(', ')}`).join('\n')}\n- 快讯：${outline.quick_links.map(i => `[${i.id}] "${i.title}"`).join(', ')}\n\n你的任务是写作，不是编辑。不要重新组织或重新分配条目。按大纲的版块顺序和重要度等级来写。\n`
    : '';

  const recentPagesSection = recentPages.length > 0
    ? `\n\n## 近期发布的 LoreAI 内容（最近 7 天）\n以下页面是近期在网站上发布的深度内容。如果其中有与今天新闻高度相关的，可以在正文中自然地以"延伸阅读"形式插入 1-2 个链接。不要强行插入 — 只在真正相关时使用。\n${recentPages.map(p => {
      const urlPrefix = SEO_TYPE_URL_PREFIX[p.type] || `/${p.type}/`;
      return `- [${p.title || p.slug}](https://loreai.dev${urlPrefix}${p.slug}) (${p.type}, ${p.created_at.split(' ')[0]})`;
    }).join('\n')}\n`
    : '';

  const systemPrompt = `${skill}${outlineSection}${recentPagesSection}\n\n## 本期规则\n- 日期：${DATE}\n- 提供条目：${filtered.length}\n- 大纲：${outline ? '有 — 严格遵循' : '无 — 自行组织'}\n- 重要结构：必须以 # 中文标题开头，然后 **${DATE}**，然后 1-2 句开场白，然后"今天聊：X、Y、Z。"预览行，然后 --- 分隔再开始正文。这些是前端显示必需的，不能省略任何一项。\n- 只输出 Newsletter 正文 Markdown，不要 frontmatter，不要元描述\n- 关键 — 归属准确性：不要推断或猜测某条新闻是关于哪个产品/公司的。只使用标题或摘要中明确提到的产品/公司名。如果来源没有点名产品，就描述功能本身，不要张冠李戴。`;

  const userPrompt = `基于以下 ${filtered.length} 条精选 AI 新闻，创作今日 LoreAI AI 简报中文版（${DATE}）：\n\n${itemsText}`;

  return { systemPrompt, userPrompt };
}
