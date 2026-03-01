import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getAllCompare, getCompare, markdownToHtml } from '@/lib/content';
import { compareMetadata } from '@/lib/metadata';
import { breadcrumbJsonLd, jsonLdScript } from '@/lib/seo';
import RelatedContent from '@/components/RelatedContent';
import ShareButtons from '@/components/ShareButtons';
import NewsletterSignup from '@/components/NewsletterSignup';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  const items = getAllCompare('en');
  return items.map((item) => ({
    slug: item.meta.slug,
  }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const item = getCompare(slug, 'en');
  if (!item) {
    return { title: 'Comparison Not Found | LoreAI' };
  }
  return compareMetadata(
    item.meta.title,
    (item.meta.description as string) || 'Read this AI comparison on LoreAI.',
    slug,
    'en'
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

export default async function CompareDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const item = getCompare(slug, 'en');

  if (!item) {
    notFound();
  }

  const rawHtml = await markdownToHtml(item.content);
  const htmlContent = addHeadingIds(rawHtml);

  const itemA = (item.meta.item_a as string) || '';
  const itemB = (item.meta.item_b as string) || '';
  const pageUrl = `https://loreai.dev/compare/${slug}`;

  const breadcrumb = breadcrumbJsonLd([
    { name: 'Home', url: 'https://loreai.dev' },
    { name: 'Compare', url: 'https://loreai.dev/compare' },
    { name: `${itemA} vs ${itemB}`, url: pageUrl },
  ]);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLdScript(breadcrumb) }}
      />

      <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
        {/* Breadcrumb */}
        <nav className="mb-8 flex items-center gap-2 text-sm text-muted">
          <Link href="/" className="transition-colors hover:text-foreground">Home</Link>
          <span aria-hidden="true">/</span>
          <Link href="/compare" className="transition-colors hover:text-foreground">Compare</Link>
          <span aria-hidden="true">/</span>
          <span className="text-foreground">{itemA} vs {itemB}</span>
        </nav>

        <article className="mx-auto max-w-3xl">
          {/* Header */}
          <header className="mb-8">
            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
              {itemA} <span className="text-muted">vs</span> {itemB}
            </h1>

            {item.meta.description && (
              <p className="mt-3 text-lg text-muted">
                {item.meta.description as string}
              </p>
            )}

            {typeof item.meta.category === 'string' && item.meta.category && (
              <div className="mt-3">
                <span className="inline-block rounded-full bg-accent/10 px-2.5 py-0.5 text-xs font-medium text-accent">
                  {item.meta.category}
                </span>
              </div>
            )}
          </header>

          {/* Share */}
          <div className="mb-8">
            <ShareButtons url={pageUrl} title={`${itemA} vs ${itemB}`} />
          </div>

          {/* Article body */}
          <div
            className="prose max-w-none"
            dangerouslySetInnerHTML={{ __html: htmlContent }}
          />

          {/* Related content */}
          <RelatedContent
            relatedGlossary={item.meta.related_glossary as string | string[] | undefined}
            relatedBlog={item.meta.related_blog as string | string[] | undefined}
            relatedCompare={item.meta.related_compare as string | string[] | undefined}
            relatedFaq={item.meta.related_faq as string | string[] | undefined}
            lang="en"
          />

          {/* Newsletter CTA */}
          <NewsletterSignup variant="inline" />
        </article>
      </div>
    </>
  );
}
