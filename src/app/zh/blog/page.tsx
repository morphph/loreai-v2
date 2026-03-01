import type { Metadata } from 'next';
import Link from 'next/link';
import { getAllBlogPosts } from '@/lib/content';
import BlogCard from '@/components/BlogCard';
import NewsletterSignup from '@/components/NewsletterSignup';

export const metadata: Metadata = {
  title: '博客 | LoreAI',
  description:
    '深入分析 AI 模型、工具、趋势和工程实践。来自 LoreAI 团队的专业解读。',
};

const ITEMS_PER_PAGE = 12;

export default async function ZhBlogIndexPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const params = await searchParams;
  const page = Math.max(1, parseInt(params.page || '1', 10));

  const allPosts = getAllBlogPosts('zh');

  const totalPages = Math.max(1, Math.ceil(allPosts.length / ITEMS_PER_PAGE));
  const currentPage = Math.min(page, totalPages);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedPosts = allPosts.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
      <header className="mb-10">
        <div className="flex items-baseline justify-between">
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
            博客
          </h1>
          <Link
            href="/blog"
            className="text-sm text-muted transition-colors hover:text-foreground"
          >
            English
          </Link>
        </div>
        <p className="mt-2 text-lg text-muted">
          深入分析 AI 模型、工具和工程实践。
        </p>
      </header>

      <div className="lg:grid lg:grid-cols-3 lg:gap-10">
        {/* Posts grid */}
        <div className="lg:col-span-2">
          {paginatedPosts.length === 0 ? (
            <p className="text-muted">暂无博客文章，敬请期待。</p>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {paginatedPosts.map((post) => (
                <BlogCard key={post.meta.slug} meta={post.meta} lang="zh" />
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <nav className="mt-8 flex items-center justify-between" aria-label="分页导航">
              <p className="text-sm text-muted">
                第 {currentPage} / {totalPages} 页
              </p>
              <div className="flex gap-2">
                {currentPage > 1 && (
                  <Link
                    href={`/zh/blog?page=${currentPage - 1}`}
                    className="rounded-lg border border-border px-3 py-1.5 text-sm font-medium text-foreground transition-colors hover:bg-surface"
                  >
                    上一页
                  </Link>
                )}
                {currentPage < totalPages && (
                  <Link
                    href={`/zh/blog?page=${currentPage + 1}`}
                    className="rounded-lg border border-border px-3 py-1.5 text-sm font-medium text-foreground transition-colors hover:bg-surface"
                  >
                    下一页
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
