import type { Metadata } from 'next';
import Link from 'next/link';
import { getAllNewsletters, getWeeklyNewsletters } from '@/lib/content';
import NewsletterSignup from '@/components/NewsletterSignup';

export const metadata: Metadata = {
  title: 'AI Newsletter Archive | LoreAI',
  description:
    'Daily and weekly AI news briefings for founders and engineers. Curated coverage of model releases, developer tools, and industry trends.',
};

const ITEMS_PER_PAGE = 20;

export default async function NewsletterArchivePage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const params = await searchParams;
  const page = Math.max(1, parseInt(params.page || '1', 10));

  const dailyNewsletters = getAllNewsletters('en');
  const weeklyNewsletters = getWeeklyNewsletters('en');

  const allNewsletters = [...dailyNewsletters, ...weeklyNewsletters].sort(
    (a, b) => new Date(b.meta.date).getTime() - new Date(a.meta.date).getTime()
  );

  const totalPages = Math.max(1, Math.ceil(allNewsletters.length / ITEMS_PER_PAGE));
  const currentPage = Math.min(page, totalPages);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedItems = allNewsletters.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  return (
    <main className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
      <header className="mb-10">
        <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 sm:text-4xl">
          AI Newsletter
        </h1>
        <p className="mt-2 text-lg text-zinc-600 dark:text-zinc-400">
          Daily briefings on what matters in AI. Model drops, dev tools, industry moves.
        </p>
      </header>

      {paginatedItems.length === 0 ? (
        <p className="text-zinc-500 dark:text-zinc-400">No newsletters yet. Check back soon.</p>
      ) : (
        <ul className="divide-y divide-zinc-200 dark:divide-zinc-800">
          {paginatedItems.map((item) => {
            const date = item.meta.date;
            const isWeekly = item.meta.type === 'weekly';
            const linkSlug = isWeekly ? (item.meta.slug as string) || date : date;
            return (
              <li key={linkSlug}>
                <Link
                  href={`/newsletter/${linkSlug}`}
                  className="group block py-5 transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-900/50 sm:py-6"
                >
                  <div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between sm:gap-4">
                    <h2 className="text-base font-semibold text-zinc-900 group-hover:text-zinc-600 dark:text-zinc-100 dark:group-hover:text-zinc-300 sm:text-lg">
                      {item.meta.title}
                    </h2>
                    <div className="flex shrink-0 items-center gap-2">
                      {isWeekly && (
                        <span className="rounded bg-zinc-200 px-1.5 py-0.5 text-xs font-medium text-zinc-700 dark:bg-zinc-700 dark:text-zinc-300">
                          Weekly
                        </span>
                      )}
                      <time
                        dateTime={date}
                        className="text-sm tabular-nums text-zinc-500 dark:text-zinc-500"
                      >
                        {new Date(date).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        })}
                      </time>
                    </div>
                  </div>
                  {item.meta.description && (
                    <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                      {item.meta.description}
                    </p>
                  )}
                  {Array.isArray(item.meta.categories) && (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {(item.meta.categories as string[]).map((cat: string) => (
                        <span
                          key={cat}
                          className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400"
                        >
                          {cat}
                        </span>
                      ))}
                    </div>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <nav className="mt-8 flex items-center justify-between" aria-label="Pagination">
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Page {currentPage} of {totalPages}
          </p>
          <div className="flex gap-2">
            {currentPage > 1 && (
              <Link
                href={`/newsletter?page=${currentPage - 1}`}
                className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
              >
                Previous
              </Link>
            )}
            {currentPage < totalPages && (
              <Link
                href={`/newsletter?page=${currentPage + 1}`}
                className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
              >
                Next
              </Link>
            )}
          </div>
        </nav>
      )}

      <NewsletterSignup />
    </main>
  );
}
