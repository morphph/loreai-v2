import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getAllNewsletters, getNewsletter, getWeeklyNewsletters, getWeeklyNewsletter, markdownToHtml } from '@/lib/content';
import { newsletterMetadata } from '@/lib/metadata';
import { articleJsonLd, jsonLdScript } from '@/lib/seo';
import NewsletterSignup from '@/components/NewsletterSignup';

interface PageProps {
  params: Promise<{ date: string }>;
}

export async function generateStaticParams() {
  const daily = getAllNewsletters('zh');
  const weekly = getWeeklyNewsletters('zh');
  return [
    ...daily.map((item) => ({ date: item.meta.date })),
    ...weekly.map((item) => ({ date: (item.meta.slug as string) || item.meta.date })),
  ];
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { date } = await params;
  const newsletter = getNewsletter(date, 'zh') || getWeeklyNewsletter(date, 'zh');
  if (!newsletter) {
    return { title: '日报未找到 | LoreAI' };
  }
  return newsletterMetadata(
    newsletter.meta.title,
    (newsletter.meta.description as string) || `${date} AI 日报`,
    date,
    'zh'
  );
}

export default async function ZhNewsletterPage({ params }: PageProps) {
  const { date } = await params;
  const newsletter = getNewsletter(date, 'zh') || getWeeklyNewsletter(date, 'zh');

  if (!newsletter) {
    notFound();
  }

  const htmlContent = await markdownToHtml(newsletter.content);

  // Get adjacent newsletters for navigation
  const allNewsletters = getAllNewsletters('zh');
  const currentIndex = allNewsletters.findIndex((n) => n.meta.date === date);
  const newerNewsletter = currentIndex > 0 ? allNewsletters[currentIndex - 1] : null;
  const olderNewsletter =
    currentIndex < allNewsletters.length - 1 ? allNewsletters[currentIndex + 1] : null;

  const pageUrl = `https://loreai.dev/zh/newsletter/${date}`;
  const jsonLd = articleJsonLd(
    newsletter.meta.title,
    newsletter.meta.date,
    (newsletter.meta.description as string) || '',
    pageUrl,
    'NewsArticle'
  );

  return (
    <>
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: jsonLdScript(jsonLd) }}
    />
    <main className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
      {/* Back to archive */}
      <nav className="mb-8 flex items-center justify-between">
        <Link
          href="/zh/newsletter"
          className="inline-flex items-center gap-1 text-sm text-zinc-500 transition-colors hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
        >
          <span aria-hidden="true">&larr;</span> 所有日报
        </Link>
        <Link
          href={`/newsletter/${date}`}
          className="text-sm text-zinc-500 transition-colors hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
        >
          English
        </Link>
      </nav>

      {/* Header */}
      <header className="mb-8">
        <time
          dateTime={newsletter.meta.date}
          className="text-sm font-medium text-zinc-500 dark:text-zinc-400"
        >
          {new Date(newsletter.meta.date).toLocaleDateString('zh-CN', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })}
        </time>
        {Array.isArray(newsletter.meta.categories) && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {(newsletter.meta.categories as string[]).map((cat: string) => (
              <span
                key={cat}
                className="rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs font-medium text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400"
              >
                {cat}
              </span>
            ))}
          </div>
        )}
        {typeof newsletter.meta.items_count === 'number' && (
          <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
            共 {newsletter.meta.items_count} 条资讯
          </p>
        )}
      </header>

      {/* Newsletter content */}
      <article
        className="prose prose-zinc max-w-none dark:prose-invert prose-headings:font-semibold prose-h1:text-2xl prose-h1:sm:text-3xl prose-h2:text-xl prose-a:text-zinc-900 prose-a:underline-offset-2 hover:prose-a:text-zinc-600 dark:prose-a:text-zinc-200 dark:hover:prose-a:text-zinc-400 prose-hr:border-zinc-200 dark:prose-hr:border-zinc-800 prose-strong:text-zinc-900 dark:prose-strong:text-zinc-100"
        dangerouslySetInnerHTML={{ __html: htmlContent }}
      />

      {/* Adjacent newsletter navigation */}
      <nav className="mt-12 flex flex-col gap-4 border-t border-zinc-200 pt-8 dark:border-zinc-800 sm:flex-row sm:justify-between">
        {olderNewsletter ? (
          <Link
            href={`/zh/newsletter/${olderNewsletter.meta.date}`}
            className="group flex flex-col"
          >
            <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
              &larr; 更早
            </span>
            <span className="mt-1 text-sm font-medium text-zinc-900 group-hover:text-zinc-600 dark:text-zinc-100 dark:group-hover:text-zinc-300">
              {olderNewsletter.meta.title}
            </span>
          </Link>
        ) : (
          <div />
        )}
        {newerNewsletter ? (
          <Link
            href={`/zh/newsletter/${newerNewsletter.meta.date}`}
            className="group flex flex-col sm:items-end sm:text-right"
          >
            <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
              更新 &rarr;
            </span>
            <span className="mt-1 text-sm font-medium text-zinc-900 group-hover:text-zinc-600 dark:text-zinc-100 dark:group-hover:text-zinc-300">
              {newerNewsletter.meta.title}
            </span>
          </Link>
        ) : (
          <div />
        )}
      </nav>

      <NewsletterSignup />
    </main>
    </>
  );
}
