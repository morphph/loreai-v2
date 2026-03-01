import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getAllTopics, getTopic, markdownToHtml } from '@/lib/content';
import { topicMetadata } from '@/lib/metadata';
import { breadcrumbJsonLd, jsonLdScript } from '@/lib/seo';
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

  const breadcrumb = breadcrumbJsonLd([
    { name: '首页', url: 'https://loreai.dev/zh' },
    { name: '主题', url: 'https://loreai.dev/zh/topics' },
    { name: pillarTopic, url: pageUrl },
  ]);

  return (
    <>
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
            <Link href="/zh/topics" className="transition-colors hover:text-foreground">主题</Link>
            <span aria-hidden="true">/</span>
            <span className="text-foreground">{pillarTopic}</span>
          </div>
          <Link
            href={`/topics/${slug}`}
            className="text-sm text-muted transition-colors hover:text-foreground"
          >
            English
          </Link>
        </nav>

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

          {/* Related content */}
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
