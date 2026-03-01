import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getAllFaq, getFaq, markdownToHtml } from '@/lib/content';
import { faqMetadata } from '@/lib/metadata';
import { faqPageJsonLd, breadcrumbJsonLd, jsonLdScript } from '@/lib/seo';
import RelatedContent from '@/components/RelatedContent';
import ShareButtons from '@/components/ShareButtons';
import NewsletterSignup from '@/components/NewsletterSignup';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  const faqs = getAllFaq('en');
  return faqs.map((faq) => ({
    slug: faq.meta.slug,
  }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const faq = getFaq(slug, 'en');
  if (!faq) {
    return { title: 'FAQ Not Found | LoreAI' };
  }
  return faqMetadata(
    faq.meta.title,
    (faq.meta.description as string) || 'Find the answer to this AI question on LoreAI.',
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

export default async function FaqDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const faq = getFaq(slug, 'en');

  if (!faq) {
    notFound();
  }

  const rawHtml = await markdownToHtml(faq.content);
  const htmlContent = addHeadingIds(rawHtml);

  const pageUrl = `https://loreai.dev/faq/${slug}`;

  // Extract the first paragraph as the direct answer for JSON-LD
  const firstParagraph = faq.content
    .split('\n\n')
    .find((p) => p.trim() && !p.trim().startsWith('#') && !p.trim().startsWith('---'));
  const directAnswer = firstParagraph
    ? firstParagraph.replace(/\*\*/g, '').replace(/\[([^\]]+)\]\([^)]+\)/g, '$1').trim()
    : (faq.meta.description as string) || '';

  const faqJsonLd = faqPageJsonLd([
    { q: faq.meta.title, a: directAnswer },
  ]);

  const breadcrumb = breadcrumbJsonLd([
    { name: 'Home', url: 'https://loreai.dev' },
    { name: 'FAQ', url: 'https://loreai.dev/faq' },
    { name: faq.meta.title, url: pageUrl },
  ]);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLdScript(faqJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLdScript(breadcrumb) }}
      />

      <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
        {/* Breadcrumb */}
        <nav className="mb-8 flex items-center gap-2 text-sm text-muted">
          <Link href="/" className="transition-colors hover:text-foreground">Home</Link>
          <span aria-hidden="true">/</span>
          <Link href="/faq" className="transition-colors hover:text-foreground">FAQ</Link>
          <span aria-hidden="true">/</span>
          <span className="text-foreground line-clamp-1">{faq.meta.title}</span>
        </nav>

        <article className="mx-auto max-w-3xl">
          {/* Header */}
          <header className="mb-8">
            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
              {faq.meta.title}
            </h1>

            {faq.meta.description && (
              <p className="mt-3 text-lg text-muted">
                {faq.meta.description as string}
              </p>
            )}

            {typeof faq.meta.category === 'string' && faq.meta.category && (
              <div className="mt-3">
                <span className="inline-block rounded-full bg-accent/10 px-2.5 py-0.5 text-xs font-medium text-accent">
                  {faq.meta.category}
                </span>
              </div>
            )}
          </header>

          {/* Share */}
          <div className="mb-8">
            <ShareButtons url={pageUrl} title={faq.meta.title} />
          </div>

          {/* Article body */}
          <div
            className="prose max-w-none"
            dangerouslySetInnerHTML={{ __html: htmlContent }}
          />

          {/* Related content */}
          <RelatedContent
            relatedGlossary={faq.meta.related_glossary as string | string[] | undefined}
            relatedBlog={faq.meta.related_blog as string | string[] | undefined}
            relatedCompare={faq.meta.related_compare as string | string[] | undefined}
            relatedFaq={faq.meta.related_faq as string | string[] | undefined}
            lang="en"
          />

          {/* Newsletter CTA */}
          <NewsletterSignup variant="inline" />
        </article>
      </div>
    </>
  );
}
