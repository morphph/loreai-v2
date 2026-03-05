import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getAllBlogPosts, getBlogPost, markdownToHtml } from '@/lib/content';
import { blogMetadata } from '@/lib/metadata';
import { articleJsonLd, jsonLdScript } from '@/lib/seo';
import TableOfContents from '@/components/TableOfContents';
import RelatedContent from '@/components/RelatedContent';
import ShareButtons from '@/components/ShareButtons';
import NewsletterSignup from '@/components/NewsletterSignup';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  const posts = getAllBlogPosts('en');
  return posts.map((post) => ({
    slug: post.meta.slug,
  }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = getBlogPost(slug, 'en');
  if (!post) {
    return { title: 'Post Not Found | LoreAI' };
  }
  return blogMetadata(
    post.meta.title,
    (post.meta.description as string) || 'Read this article on LoreAI blog.',
    slug,
    'en'
  );
}

/** Add IDs to h2/h3 headings in rendered HTML so the TOC can link to them */
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

export default async function BlogPostPage({ params }: PageProps) {
  const { slug } = await params;
  const post = getBlogPost(slug, 'en');

  if (!post) {
    notFound();
  }

  const rawHtml = await markdownToHtml(post.content);
  const htmlContent = addHeadingIds(rawHtml);

  const pageUrl = `https://loreai.dev/blog/${slug}`;
  const jsonLd = articleJsonLd(
    post.meta.title,
    post.meta.date,
    (post.meta.description as string) || '',
    pageUrl
  );

  const videoUrl = post.meta.video_url as string | undefined;

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLdScript(jsonLd) }}
      />

      <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
        {/* Back link */}
        <nav className="mb-8">
          <Link
            href="/blog"
            className="inline-flex items-center gap-1 text-sm text-muted transition-colors hover:text-foreground"
          >
            <span aria-hidden="true">&larr;</span> All posts
          </Link>
        </nav>

        <div className="lg:grid lg:grid-cols-[1fr_220px] lg:gap-10">
          {/* Main content */}
          <article className="min-w-0">
            {/* Mobile TOC */}
            <div className="lg:hidden">
              <TableOfContents htmlContent={htmlContent} />
            </div>
            {/* Header */}
            <header className="mb-8">
              <time
                dateTime={post.meta.date}
                className="text-sm font-medium text-muted"
              >
                {new Date(post.meta.date + 'T00:00:00').toLocaleDateString('en-US', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </time>

              <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
                {post.meta.title}
              </h1>

              {post.meta.description && (
                <p className="mt-3 text-lg text-muted">
                  {post.meta.description as string}
                </p>
              )}

              {typeof post.meta.category === 'string' && post.meta.category && (
                <div className="mt-3">
                  <span className="inline-block rounded-full bg-accent/10 px-2.5 py-0.5 text-xs font-medium text-accent">
                    {post.meta.category}
                  </span>
                </div>
              )}

              {/* Video link */}
              {videoUrl && (
                <a
                  href={videoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-4 inline-flex items-center gap-2 rounded-lg bg-accent/10 px-4 py-2 text-sm font-medium text-accent transition-colors hover:bg-accent/20"
                >
                  <span aria-hidden="true">&#x1F4FA;</span> Watch video
                </a>
              )}
            </header>

            {/* Share */}
            <div className="mb-8">
              <ShareButtons url={pageUrl} title={post.meta.title} />
            </div>

            {/* Article body */}
            <div
              className="prose max-w-none"
              dangerouslySetInnerHTML={{ __html: htmlContent }}
            />

            {/* Related content */}
            <RelatedContent
              relatedNewsletter={post.meta.related_newsletter as string | string[] | undefined}
              relatedGlossary={post.meta.related_glossary as string | string[] | undefined}
              relatedCompare={post.meta.related_compare as string | string[] | undefined}
              lang="en"
            />

            {/* Newsletter CTA */}
            <NewsletterSignup variant="inline" />
          </article>

          {/* Desktop TOC sidebar */}
          <aside className="hidden lg:block">
            <TableOfContents htmlContent={htmlContent} />
          </aside>
        </div>
      </div>
    </>
  );
}
