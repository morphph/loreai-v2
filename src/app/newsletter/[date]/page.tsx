import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getAllNewsletters, getNewsletter, getWeeklyNewsletters, getWeeklyNewsletter, markdownToHtml } from '@/lib/content';
import NewsletterSignup from '@/components/NewsletterSignup';

interface PageProps {
  params: Promise<{ date: string }>;
}

export async function generateStaticParams() {
  const daily = getAllNewsletters('en');
  const weekly = getWeeklyNewsletters('en');
  return [
    ...daily.map((item) => ({ date: item.meta.date })),
    ...weekly.map((item) => ({ date: (item.meta.slug as string) || item.meta.date })),
  ];
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { date } = await params;
  const newsletter = getNewsletter(date, 'en') || getWeeklyNewsletter(date, 'en');
  if (!newsletter) {
    return { title: 'Newsletter Not Found | LoreAI' };
  }
  const isWeekly = newsletter.meta.type === 'weekly';
  return {
    title: `${newsletter.meta.title} | LoreAI ${isWeekly ? 'Weekly' : 'Newsletter'}`,
    description: newsletter.meta.description || `AI newsletter for ${date}`,
  };
}

export default async function NewsletterPage({ params }: PageProps) {
  const { date } = await params;
  const newsletter = getNewsletter(date, 'en') || getWeeklyNewsletter(date, 'en');

  if (!newsletter) {
    notFound();
  }

  const isWeekly = newsletter.meta.type === 'weekly';

  const htmlContent = await markdownToHtml(newsletter.content);

  // Get adjacent newsletters for navigation
  const allNewsletters = getAllNewsletters('en');
  const currentIndex = allNewsletters.findIndex((n) => n.meta.date === date);
  const newerNewsletter = currentIndex > 0 ? allNewsletters[currentIndex - 1] : null;
  const olderNewsletter =
    currentIndex < allNewsletters.length - 1 ? allNewsletters[currentIndex + 1] : null;

  return (
    <main className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
      {/* Back to archive */}
      <nav className="mb-8">
        <Link
          href="/newsletter"
          className="inline-flex items-center gap-1 text-sm text-zinc-500 transition-colors hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
        >
          <span aria-hidden="true">&larr;</span> All newsletters
        </Link>
      </nav>

      {/* Header */}
      <header className="mb-8">
        <time
          dateTime={newsletter.meta.date}
          className="text-sm font-medium text-zinc-500 dark:text-zinc-400"
        >
          {new Date(newsletter.meta.date).toLocaleDateString('en-US', {
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
            {newsletter.meta.items_count} items covered
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
            href={`/newsletter/${olderNewsletter.meta.date}`}
            className="group flex flex-col"
          >
            <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
              &larr; Older
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
            href={`/newsletter/${newerNewsletter.meta.date}`}
            className="group flex flex-col sm:items-end sm:text-right"
          >
            <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
              Newer &rarr;
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
  );
}
