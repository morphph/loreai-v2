/**
 * Convert newsletter markdown to styled email HTML.
 * Uses inline CSS for maximum email client compatibility.
 */
import { remark } from 'remark';
import remarkHtml from 'remark-html';

/** Convert markdown string to raw HTML */
async function mdToHtml(md: string): Promise<string> {
  const result = await remark().use(remarkHtml, { sanitize: false }).process(md);
  return String(result);
}

/** Wrap raw HTML in a styled email template */
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

  return `<!DOCTYPE html>
<html lang="${opts.lang}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${opts.title}</title>
</head>
<body style="margin:0; padding:0; background-color:#f8f9fa; font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; -webkit-font-smoothing:antialiased;">

<!-- Preheader (hidden preview text) -->
<div style="display:none; max-height:0; overflow:hidden; font-size:1px; line-height:1px; color:#f8f9fa;">
  ${opts.title}
</div>

<!-- Outer wrapper -->
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f8f9fa;">
<tr><td align="center" style="padding:24px 16px;">

<!-- Inner container -->
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:620px; background-color:#ffffff; border-radius:12px; overflow:hidden; box-shadow:0 1px 3px rgba(0,0,0,0.06);">

<!-- Header -->
<tr><td style="padding:32px 36px 20px; border-bottom:1px solid #eee;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
  <tr>
    <td>
      <a href="${siteUrl}" style="text-decoration:none; font-size:22px; font-weight:700; color:#111; letter-spacing:-0.5px;">LoreAI</a>
    </td>
    <td align="right">
      <a href="${viewOnline}" style="font-size:13px; color:#6b7280; text-decoration:none;">${viewOnlineText}</a>
    </td>
  </tr>
  </table>
</td></tr>

<!-- Body -->
<tr><td style="padding:28px 36px 36px;">
  ${bodyHtml}
</td></tr>

<!-- Footer -->
<tr><td style="padding:24px 36px; background-color:#f9fafb; border-top:1px solid #eee;">
  <p style="margin:0 0 8px; font-size:14px; color:#6b7280; line-height:1.5;">
    ${footerText}
  </p>
  <p style="margin:0; font-size:13px; color:#9ca3af; line-height:1.5;">
    <a href="${archiveUrl}" style="color:#3b82f6; text-decoration:none;">Archive</a>
    &nbsp;&middot;&nbsp;
    <a href="${siteUrl}" style="color:#3b82f6; text-decoration:none;">loreai.dev</a>
    &nbsp;&middot;&nbsp;
    <a href="{{ unsubscribe_url }}" style="color:#9ca3af; text-decoration:none;">${unsubText}</a>
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

/** Apply inline styles to the raw HTML from markdown */
function styleBodyHtml(html: string): string {
  return html
    // H1 — newsletter title
    .replace(/<h1([^>]*)>(.*?)<\/h1>/gi,
      '<h1$1 style="margin:0 0 8px; font-size:26px; font-weight:700; color:#111; line-height:1.3; letter-spacing:-0.3px;">$2</h1>')
    // H2 — section headers
    .replace(/<h2([^>]*)>(.*?)<\/h2>/gi,
      '<h2$1 style="margin:28px 0 14px; font-size:16px; font-weight:700; color:#111; text-transform:uppercase; letter-spacing:0.5px; border-bottom:2px solid #3b82f6; padding-bottom:8px; display:inline-block;">$2</h2>')
    // H3
    .replace(/<h3([^>]*)>(.*?)<\/h3>/gi,
      '<h3$1 style="margin:20px 0 8px; font-size:17px; font-weight:600; color:#111; line-height:1.4;">$2</h3>')
    // Paragraphs
    .replace(/<p>(.*?)<\/p>/gis,
      '<p style="margin:0 0 14px; font-size:15px; color:#374151; line-height:1.65;">$1</p>')
    // Links
    .replace(/<a href="([^"]*)">(.*?)<\/a>/gi,
      '<a href="$1" style="color:#3b82f6; text-decoration:none; font-weight:500;">$2</a>')
    // Bold
    .replace(/<strong>(.*?)<\/strong>/gi,
      '<strong style="color:#111; font-weight:600;">$1</strong>')
    // Horizontal rules — clean divider
    .replace(/<hr\s*\/?>/gi,
      '<div style="margin:24px 0; border-top:1px solid #e5e7eb;"></div>')
    // Unordered lists
    .replace(/<ul>/gi,
      '<ul style="margin:0 0 14px; padding-left:20px;">')
    // List items
    .replace(/<li>(.*?)<\/li>/gis,
      '<li style="margin:0 0 8px; font-size:15px; color:#374151; line-height:1.6;">$1</li>')
    // Ordered lists
    .replace(/<ol>/gi,
      '<ol style="margin:0 0 14px; padding-left:20px;">');
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
