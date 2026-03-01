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
  const terms = getAllGlossary('en');
  return terms.map((t) => ({
    term: (t.meta.term as string) || t.meta.slug,
  }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { term } = await params;
  const entry = getGlossaryTerm(term, 'en');
  if (!entry) {
    return { title: 'Term Not Found | LoreAI' };
  }
  const displayTerm = (entry.meta.display_term as string) || entry.meta.title;
  return glossaryMetadata(
    displayTerm,
    (entry.meta.description as string) || `Learn about ${displayTerm} in our AI glossary.`,
    term,
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

export default async function GlossaryTermPage({ params }: PageProps) {
  const { term } = await params;
  const entry = getGlossaryTerm(term, 'en');

  if (!entry) {
    notFound();
  }

  const rawHtml = await markdownToHtml(entry.content);
  const htmlContent = addHeadingIds(rawHtml);

  const displayTerm = (entry.meta.display_term as string) || entry.meta.title;
  const category = entry.meta.category as string | undefined;
  const pageUrl = `https://loreai.dev/glossary/${term}`;

  const termJsonLd = definedTermJsonLd(
    displayTerm,
    (entry.meta.description as string) || ''
  );

  const breadcrumb = breadcrumbJsonLd([
    { name: 'Home', url: 'https://loreai.dev' },
    { name: 'Glossary', url: 'https://loreai.dev/glossary' },
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
        {/* Breadcrumb */}
        <nav className="mb-8 flex items-center gap-2 text-sm text-muted">
          <Link href="/" className="transition-colors hover:text-foreground">Home</Link>
          <span aria-hidden="true">/</span>
          <Link href="/glossary" className="transition-colors hover:text-foreground">Glossary</Link>
          <span aria-hidden="true">/</span>
          <span className="text-foreground">{displayTerm}</span>
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
            <ShareButtons url={pageUrl} title={displayTerm} />
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
            lang="en"
          />

          {/* Newsletter CTA */}
          <NewsletterSignup variant="inline" />
        </article>
      </div>
    </>
  );
}
