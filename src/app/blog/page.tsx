import type { Metadata } from 'next';
import Link from 'next/link';
import { getAllBlogPosts } from '@/lib/content';
import BlogCard from '@/components/BlogCard';
import NewsletterSignup from '@/components/NewsletterSignup';

export const metadata: Metadata = {
  title: 'Blog | LoreAI',
  description:
    'In-depth articles on AI models, tools, trends, and engineering practices. Expert analysis from the LoreAI team.',
};

const ITEMS_PER_PAGE = 12;

export default async function BlogIndexPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const params = await searchParams;
  const page = Math.max(1, parseInt(params.page || '1', 10));

  const allPosts = getAllBlogPosts('en');

  const totalPages = Math.max(1, Math.ceil(allPosts.length / ITEMS_PER_PAGE));
  const currentPage = Math.min(page, totalPages);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedPosts = allPosts.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
      <header className="mb-10">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
          Blog
        </h1>
        <p className="mt-2 text-lg text-muted">
          In-depth articles on AI models, tools, and engineering practices.
        </p>
      </header>

      <div className="lg:grid lg:grid-cols-3 lg:gap-10">
        {/* Posts grid */}
        <div className="lg:col-span-2">
          {paginatedPosts.length === 0 ? (
            <p className="text-muted">No blog posts yet. Check back soon.</p>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {paginatedPosts.map((post) => (
                <BlogCard key={post.meta.slug} meta={post.meta} lang="en" />
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <nav className="mt-8 flex items-center justify-between" aria-label="Pagination">
              <p className="text-sm text-muted">
                Page {currentPage} of {totalPages}
              </p>
              <div className="flex gap-2">
                {currentPage > 1 && (
                  <Link
                    href={`/blog?page=${currentPage - 1}`}
                    className="rounded-lg border border-border px-3 py-1.5 text-sm font-medium text-foreground transition-colors hover:bg-surface"
                  >
                    Previous
                  </Link>
                )}
                {currentPage < totalPages && (
                  <Link
                    href={`/blog?page=${currentPage + 1}`}
                    className="rounded-lg border border-border px-3 py-1.5 text-sm font-medium text-foreground transition-colors hover:bg-surface"
                  >
                    Next
                  </Link>
                )}
              </div>
            </nav>
          )}
        </div>

        {/* Sidebar */}
        <aside className="mt-10 lg:mt-0">
          <div className="sticky top-24">
            <NewsletterSignup variant="sidebar" />
          </div>
        </aside>
      </div>
    </div>
  );
}
