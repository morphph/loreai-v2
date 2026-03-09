/**
 * Convert newsletter markdown to styled email HTML.
 * Uses inline CSS for maximum email client compatibility.
 *
 * Card-based design inspired by Superhuman AI newsletter:
 * - Each section in a bordered card
 * - Numbered items (not ### headers)
 * - Quick hits section with compact styling
 * - Hero section with branding
 * - Mobile-friendly single-column layout
 */
import { remark } from 'remark';
import remarkHtml from 'remark-html';

/** Convert markdown string to raw HTML */
async function mdToHtml(md: string): Promise<string> {
  const result = await remark().use(remarkHtml, { sanitize: false }).process(md);
  return String(result);
}

/** Apply inline styles and transform HTML into card-based layout */
function styleBodyHtml(html: string): string {
  // Card wrapper styles
  const cardStyle = 'border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px; margin-bottom: 12px;';
  const sectionLabelBase = 'display: inline-block; font-size: 11px; font-weight: 700; letter-spacing: 1.2px; text-transform: uppercase; margin-bottom: 8px; padding: 2px 8px; border-radius: 4px;';

  // Section label colors mapped by section name keywords
  const sectionColors: Record<string, { bg: string; fg: string }> = {
    'LAUNCH': { bg: '#dbeafe', fg: '#1d4ed8' },
    'TOOL': { bg: '#fef3c7', fg: '#b45309' },
    'TECHNIQUE': { bg: '#d1fae5', fg: '#065f46' },
    'RESEARCH': { bg: '#ede9fe', fg: '#6d28d9' },
    'INSIGHT': { bg: '#fce7f3', fg: '#be185d' },
    'BUILD': { bg: '#fed7aa', fg: '#c2410c' },
    'QUICK': { bg: '#f3f4f6', fg: '#374151' },
    'MODEL': { bg: '#e0e7ff', fg: '#3730a3' },
    'PICK': { bg: '#fef9c3', fg: '#a16207' },
  };

  function getLabelColor(title: string): { bg: string; fg: string } {
    const upper = title.toUpperCase();
    for (const [key, color] of Object.entries(sectionColors)) {
      if (upper.includes(key)) return color;
    }
    return { bg: '#f3f4f6', fg: '#374151' };
  }

  // Step 1: Style inline elements first
  let styled = html
    // Links
    .replace(/<a href="([^"]*)">([\s\S]*?)<\/a>/gi,
      '<a href="$1" style="color:#3b82f6; text-decoration:none; font-weight:500;">$2</a>')
    // Bold
    .replace(/<strong>([\s\S]*?)<\/strong>/gi,
      '<strong style="color:#111; font-weight:600;">$1</strong>')
    // Horizontal rules — remove them (cards provide visual separation)
    .replace(/<hr\s*\/?>/gi, '')
    // Unordered lists
    .replace(/<ul>/gi,
      '<ul style="margin:0 0 14px; padding-left:20px;">')
    // List items
    .replace(/<li>([\s\S]*?)<\/li>/gis,
      '<li style="margin:0 0 8px; font-size:16px; color:#374151; line-height:1.65;">$1</li>')
    // Ordered lists
    .replace(/<ol>/gi,
      '<ol style="margin:0 0 14px; padding-left:20px;">');

  // Step 2: Transform H1 into hero content (will be wrapped by template)
  styled = styled.replace(/<h1([^>]*)>([\s\S]*?)<\/h1>/gi,
    '<h1$1 style="margin:0 0 6px; font-size:22px; font-weight:700; color:#111; line-height:1.35; letter-spacing:-0.2px;">$2</h1>');

  // Step 3: Wrap H2 sections in cards
  // Split by H2 to create card sections
  const parts = styled.split(/(?=<h2[^>]*>)/i);
  const heroContent = parts[0]; // Everything before the first H2
  const sections = parts.slice(1);

  let itemCounter = 0;

  const styledSections = sections.map(section => {
    // Extract H2 title
    const h2Match = section.match(/<h2[^>]*>([\s\S]*?)<\/h2>/i);
    if (!h2Match) return section;

    const sectionTitle = h2Match[1].replace(/<[^>]+>/g, '').trim(); // Strip HTML tags
    const sectionContent = section.replace(/<h2[^>]*>[\s\S]*?<\/h2>/i, '');
    const color = getLabelColor(sectionTitle);

    // Clean emoji prefix from label (use text after emoji for label)
    const labelText = sectionTitle.replace(/^[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{FE00}-\u{FE0F}\u{200D}\u{20E3}\u{E0020}-\u{E007F}]+\s*/u, '').toUpperCase();

    // Check if this is the QUICK LINKS section — use compact styling
    const isQuickLinks = /QUICK/i.test(sectionTitle);
    // Check if this is MODEL LITERACY or PICK OF THE DAY
    const isSpecialCard = /MODEL LITERACY|PICK|精选|小课堂/i.test(sectionTitle);

    // Transform H3s into numbered items (for regular sections)
    let processedContent = sectionContent;

    if (!isQuickLinks && !isSpecialCard) {
      // Replace H3 headers with numbered bold items
      processedContent = processedContent.replace(/<h3[^>]*>([\s\S]*?)<\/h3>/gi, (_match, title) => {
        itemCounter++;
        return `<p style="margin:20px 0 6px; font-size:16px; color:#111; line-height:1.5;"><span style="display:inline-block; width:24px; height:24px; background-color:#3b82f6; color:#fff; border-radius:50%; text-align:center; line-height:24px; font-size:12px; font-weight:700; margin-right:8px; vertical-align:middle;">${itemCounter}</span><strong style="color:#111; font-weight:700; font-size:17px;">${title}</strong></p>`;
      });
    } else if (isSpecialCard) {
      // For special cards, keep H3 as styled subheadings
      processedContent = processedContent.replace(/<h3[^>]*>([\s\S]*?)<\/h3>/gi,
        '<p style="margin:0 0 8px; font-size:18px; font-weight:700; color:#111; line-height:1.4;">$1</p>');
    }

    // Style paragraphs within sections
    processedContent = processedContent.replace(/<p>([\s\S]*?)<\/p>/gis,
      '<p style="margin:0 0 14px; font-size:16px; color:#374151; line-height:1.65;">$1</p>');

    // Build card HTML
    let cardBg = '#ffffff';
    let borderColor = '#e5e7eb';

    if (/PICK|精选/i.test(sectionTitle)) {
      cardBg = '#fffbeb';
      borderColor = '#f59e0b';
    } else if (/MODEL|小课堂/i.test(sectionTitle)) {
      cardBg = '#f0f4ff';
      borderColor = '#6366f1';
    }

    return `<div style="${cardStyle} background-color:${cardBg}; border-color:${borderColor};">
  <div style="${sectionLabelBase} background-color:${color.bg}; color:${color.fg};">${labelText}</div>
  ${processedContent}
</div>`;
  });

  // Style paragraphs in hero section (intro text)
  const styledHero = heroContent.replace(/<p>([\s\S]*?)<\/p>/gis,
    '<p style="margin:0 0 14px; font-size:16px; color:#374151; line-height:1.65;">$1</p>');

  return styledHero + styledSections.join('\n');
}

/** Wrap styled HTML in a full email template */
function wrapInTemplate(bodyHtml: string, opts: { title: string; date: string; lang: string }): string {
  const isZh = opts.lang === 'zh';
  const siteUrl = 'https://loreai.dev';
  const archiveUrl = isZh ? `${siteUrl}/zh/newsletter` : `${siteUrl}/newsletter`;
  const viewOnline = isZh
    ? `${siteUrl}/zh/newsletter/${opts.date}`
    : `${siteUrl}/newsletter/${opts.date}`;
  const viewOnlineText = isZh ? '在浏览器中阅读' : 'View online';
  const footerText = isZh ? '每个工作日早晨，最精炼的 AI 简报。' : 'The sharpest AI briefing, every weekday morning.';
  const unsubText = isZh ? '退订' : 'Unsubscribe';
  const archiveText = isZh ? '历史存档' : 'Archive';

  return `<!DOCTYPE html>
<html lang="${opts.lang}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${opts.title}</title>
<!--[if mso]>
<style>body{font-family:Arial,sans-serif !important;}</style>
<![endif]-->
</head>
<body style="margin:0; padding:0; background-color:#f3f4f6; font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; -webkit-font-smoothing:antialiased; -webkit-text-size-adjust:100%;">

<!-- Preheader (hidden preview text) -->
<div style="display:none; max-height:0; overflow:hidden; font-size:1px; line-height:1px; color:#f3f4f6;">
  ${opts.title}
</div>

<!-- Outer wrapper -->
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f3f4f6;">
<tr><td align="center" style="padding:24px 16px;">

<!-- Inner container -->
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:620px;">

<!-- Hero / Header Card -->
<tr><td style="background-color:#ffffff; border-radius:12px 12px 0 0; padding:24px 20px 18px; border-bottom:3px solid #3b82f6;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
  <tr>
    <td>
      <a href="${siteUrl}" style="text-decoration:none; font-size:22px; font-weight:800; color:#111; letter-spacing:-0.5px;">LoreAI</a>
      <span style="font-size:11px; color:#6b7280; margin-left:6px; font-weight:500; text-transform:uppercase; letter-spacing:0.5px;">${isZh ? 'AI 日报' : 'DAILY AI BRIEFING'}</span>
    </td>
    <td align="right">
      <span style="font-size:12px; color:#9ca3af;">${opts.date}</span>
    </td>
  </tr>
  </table>
</td></tr>

<!-- Body -->
<tr><td style="background-color:#ffffff; padding:20px 20px 24px; border-radius:0 0 12px 12px;">
  ${bodyHtml}
</td></tr>

<!-- Spacer -->
<tr><td style="height:16px;"></td></tr>

<!-- Footer Card -->
<tr><td style="background-color:#ffffff; border-radius:12px; padding:20px 20px; text-align:center;">
  <p style="margin:0 0 12px; font-size:14px; color:#6b7280; line-height:1.5;">
    ${footerText}
  </p>
  <p style="margin:0 0 16px; font-size:13px; color:#9ca3af; line-height:1.8;">
    <a href="${viewOnline}" style="color:#3b82f6; text-decoration:none; font-weight:500;">${viewOnlineText}</a>
    &nbsp;&middot;&nbsp;
    <a href="${archiveUrl}" style="color:#3b82f6; text-decoration:none; font-weight:500;">${archiveText}</a>
    &nbsp;&middot;&nbsp;
    <a href="{{ unsubscribe_url }}" style="color:#9ca3af; text-decoration:none;">${unsubText}</a>
  </p>
  <p style="margin:0; font-size:12px; color:#d1d5db;">
    <a href="https://x.com/loreai_dev" style="color:#9ca3af; text-decoration:none;">𝕏</a>
    &nbsp;&nbsp;
    <a href="${siteUrl}" style="color:#9ca3af; text-decoration:none;">loreai.dev</a>
  </p>
</td></tr>

</table>
<!-- /Inner container -->

</td></tr>
</table>
<!-- /Outer wrapper -->

</body>
</html>`;
}

/** Main: convert newsletter markdown to fully styled email HTML */
export async function markdownToEmailHtml(
  markdown: string,
  opts: { title: string; date: string; lang: string }
): Promise<string> {
  const rawHtml = await mdToHtml(markdown);
  const styledBody = styleBodyHtml(rawHtml);
  return wrapInTemplate(styledBody, opts);
}
