import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getAllGlossary, getGlossaryTerm, markdownToHtml } from '@/lib/content';
import { glossaryMetadata } from '@/lib/metadata';
import { definedTermJsonLd, breadcrumbJsonLd, jsonLdScript } from '@/lib/seo';
import RelatedContent from '@/components/RelatedContent';
import ShareButtons from '@/components/ShareButtons';
import NewsletterSignup from '@/components/NewsletterSignup';

interface PageProps {
  params: Promise<{ term: string }>;
}

export async function generateStaticParams() {
  const terms = getAllGlossary('zh');
  return terms.map((t) => ({
    term: (t.meta.term as string) || t.meta.slug,
  }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { term } = await params;
  const entry = getGlossaryTerm(term, 'zh');
  if (!entry) {
    return { title: '术语未找到 | LoreAI' };
  }
  const displayTerm = (entry.meta.display_term as string) || entry.meta.title;
  return glossaryMetadata(
    displayTerm,
    (entry.meta.description as string) || `了解 AI 词汇表中的 ${displayTerm}。`,
    term,
    'zh'
  );
}

function addHeadingIds(html: string): string {
  return html.replace(/<(h[23])([^>]*)>(.*?)<\/h[23]>/gi, (_match, tag, attrs, inner) => {
    const text = inner.replace(/<[^>]*>/g, '');
    const id = text
      .toLowerCase()
      .replace(/[^a-z0-9\u4e00-\u9fff]+/g, '-')
      .replace(/(^-|-$)/g, '');
    return `<${tag}${attrs} id="${id}">${inner}</${tag}>`;
  });
}

export default async function ZhGlossaryTermPage({ params }: PageProps) {
  const { term } = await params;
  const entry = getGlossaryTerm(term, 'zh');

  if (!entry) {
    notFound();
  }

  const rawHtml = await markdownToHtml(entry.content);
  const htmlContent = addHeadingIds(rawHtml);

  const displayTerm = (entry.meta.display_term as string) || entry.meta.title;
  const category = entry.meta.category as string | undefined;
  const pageUrl = `https://loreai.dev/zh/glossary/${term}`;

  const termJsonLd = definedTermJsonLd(
    displayTerm,
    (entry.meta.description as string) || ''
  );

  const breadcrumb = breadcrumbJsonLd([
    { name: '首页', url: 'https://loreai.dev/zh' },
    { name: '词汇表', url: 'https://loreai.dev/zh/glossary' },
    { name: displayTerm, url: pageUrl },
  ]);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLdScript(termJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLdScript(breadcrumb) }}
      />

      <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
        {/* Navigation */}
        <nav className="mb-8 flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-muted">
            <Link href="/zh" className="transition-colors hover:text-foreground">首页</Link>
            <span aria-hidden="true">/</span>
            <Link href="/zh/glossary" className="transition-colors hover:text-foreground">词汇表</Link>
            <span aria-hidden="true">/</span>
            <span className="text-foreground">{displayTerm}</span>
          </div>
          <Link
            href={`/glossary/${term}`}
            className="text-sm text-muted transition-colors hover:text-foreground"
          >
            English
          </Link>
        </nav>

        <article className="mx-auto max-w-3xl">
          {/* Header */}
          <header className="mb-8">
            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
              {displayTerm}
            </h1>

            {entry.meta.description && (
              <p className="mt-3 text-lg text-muted">
                {entry.meta.description as string}
              </p>
            )}

            {category && (
              <div className="mt-3">
                <span className="inline-block rounded-full bg-accent/10 px-2.5 py-0.5 text-xs font-medium text-accent">
                  {category}
                </span>
              </div>
            )}
          </header>

          {/* Share */}
          <div className="mb-8">
            <ShareButtons
              url={pageUrl}
              title={displayTerm}
              labels={{ share: '分享', copied: '已复制', copyLink: '复制链接' }}
            />
          </div>

          {/* Article body */}
          <div
            className="prose max-w-none"
            dangerouslySetInnerHTML={{ __html: htmlContent }}
          />

          {/* Related content */}
          <RelatedContent
            relatedGlossary={entry.meta.related_glossary as string | string[] | undefined}
            relatedBlog={entry.meta.related_blog as string | string[] | undefined}
            relatedCompare={entry.meta.related_compare as string | string[] | undefined}
            relatedFaq={entry.meta.related_faq as string | string[] | undefined}
            lang="zh"
          />

          {/* Newsletter CTA */}
          <NewsletterSignup variant="inline" />
        </article>
      </div>
    </>
  );
}
