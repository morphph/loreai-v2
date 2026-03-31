import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getAllTopics, getTopic, getRelatedContentForTopic, markdownToHtml } from '@/lib/content';
import { topicMetadata } from '@/lib/metadata';
import { collectionPageJsonLd, breadcrumbJsonLd, jsonLdScript } from '@/lib/seo';
import Breadcrumb from '@/components/Breadcrumb';
import RelatedContent from '@/components/RelatedContent';
import ShareButtons from '@/components/ShareButtons';
import NewsletterSignup from '@/components/NewsletterSignup';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  const topics = getAllTopics('zh');
  return topics.map((topic) => ({
    slug: topic.meta.slug,
  }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const topic = getTopic(slug, 'zh');
  if (!topic) {
    return { title: '主题未找到 | LoreAI' };
  }
  return topicMetadata(
    topic.meta.title,
    (topic.meta.description as string) || '在 LoreAI 上探索这个 AI 主题中心。',
    slug,
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

export default async function ZhTopicDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const topic = getTopic(slug, 'zh');

  if (!topic) {
    notFound();
  }

  const rawHtml = await markdownToHtml(topic.content);
  const htmlContent = addHeadingIds(rawHtml);

  const pillarTopic = (topic.meta.pillar_topic as string) || topic.meta.title;
  const pageUrl = `https://loreai.dev/zh/topics/${slug}`;

  const aggregated = getRelatedContentForTopic(slug, 'zh');

  const cpJsonLd = collectionPageJsonLd(
    pillarTopic,
    (topic.meta.description as string) || '',
    pageUrl
  );
  const bcJsonLd = breadcrumbJsonLd([
    { name: '首页', url: 'https://loreai.dev/zh' },
    { name: '主题', url: 'https://loreai.dev/zh/topics' },
    { name: pillarTopic, url: pageUrl },
  ]);

  const hasAggregated = aggregated.blogs.length > 0 || aggregated.faqs.length > 0 ||
    aggregated.glossary.length > 0 || aggregated.comparisons.length > 0;

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLdScript(cpJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLdScript(bcJsonLd) }}
      />

      <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="mb-8 flex items-center justify-between">
          <Breadcrumb
            items={[
              { name: '首页', href: '/zh' },
              { name: '主题', href: '/zh/topics' },
              { name: pillarTopic, href: `/zh/topics/${slug}` },
            ]}
            className="flex items-center gap-2 text-sm text-muted"
          />
          <Link
            href={`/topics/${slug}`}
            className="shrink-0 text-sm text-muted transition-colors hover:text-foreground"
          >
            English
          </Link>
        </div>

        <article className="mx-auto max-w-3xl">
          {/* Header */}
          <header className="mb-8">
            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
              {pillarTopic}
            </h1>

            {topic.meta.description && (
              <p className="mt-3 text-lg text-muted">
                {topic.meta.description as string}
              </p>
            )}
          </header>

          {/* Share */}
          <div className="mb-8">
            <ShareButtons
              url={pageUrl}
              title={pillarTopic}
              labels={{ share: '分享', copied: '已复制', copyLink: '复制链接' }}
            />
          </div>

          {/* Article body */}
          <div
            className="prose max-w-none"
            dangerouslySetInnerHTML={{ __html: htmlContent }}
          />

          {/* Auto-aggregated content sections */}
          {hasAggregated && (
            <div className="mt-12 space-y-8 border-t border-border pt-8">
              <h2 className="text-2xl font-bold">{pillarTopic} 全部资源</h2>

              {aggregated.blogs.length > 0 && (
                <section>
                  <h3 className="mb-3 text-lg font-semibold">博客文章</h3>
                  <div className="space-y-2">
                    {aggregated.blogs.map((b) => (
                      <Link key={b.slug} href={`/zh/blog/${b.slug}`} className="group block rounded-lg border border-border p-3 transition-colors hover:border-accent/40 hover:bg-surface">
                        <div className="font-medium group-hover:text-accent">{b.title}</div>
                        {b.description && <p className="mt-0.5 line-clamp-1 text-sm text-muted">{b.description}</p>}
                      </Link>
                    ))}
                  </div>
                </section>
              )}

              {aggregated.comparisons.length > 0 && (
                <section>
                  <h3 className="mb-3 text-lg font-semibold">对比文章</h3>
                  <div className="space-y-2">
                    {aggregated.comparisons.map((c) => (
                      <Link key={c.slug} href={`/zh/compare/${c.slug}`} className="group block rounded-lg border border-border p-3 transition-colors hover:border-accent/40 hover:bg-surface">
                        <div className="font-medium group-hover:text-accent">{c.title}</div>
                      </Link>
                    ))}
                  </div>
                </section>
              )}

              {aggregated.faqs.length > 0 && (
                <section>
                  <h3 className="mb-3 text-lg font-semibold">常见问题</h3>
                  <div className="space-y-2">
                    {aggregated.faqs.map((f) => (
                      <Link key={f.slug} href={`/zh/faq/${f.slug}`} className="group block rounded-lg border border-border p-3 transition-colors hover:border-accent/40 hover:bg-surface">
                        <div className="font-medium group-hover:text-accent">{f.title}</div>
                      </Link>
                    ))}
                  </div>
                </section>
              )}

              {aggregated.glossary.length > 0 && (
                <section>
                  <h3 className="mb-3 text-lg font-semibold">词汇表</h3>
                  <div className="flex flex-wrap gap-2">
                    {aggregated.glossary.map((g) => (
                      <Link key={g.slug} href={`/zh/glossary/${g.slug}`} className="rounded-full border border-border px-3 py-1 text-sm font-medium transition-colors hover:border-accent/40 hover:text-accent">
                        {g.title}
                      </Link>
                    ))}
                  </div>
                </section>
              )}
            </div>
          )}

          {/* Manually curated related content (pinned) */}
          <RelatedContent
            relatedGlossary={topic.meta.related_glossary as string | string[] | undefined}
            relatedBlog={topic.meta.related_blog as string | string[] | undefined}
            relatedCompare={topic.meta.related_compare as string | string[] | undefined}
            relatedFaq={topic.meta.related_faq as string | string[] | undefined}
            relatedTopics={topic.meta.related_topics as string | string[] | undefined}
            lang="zh"
          />

          {/* Newsletter CTA */}
          <NewsletterSignup variant="inline" />
        </article>
      </div>
    </>
  );
}
