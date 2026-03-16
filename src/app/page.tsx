import Link from 'next/link';
import { getAllNewsletters, getAllBlogPosts, getAllCompare, getAllFaq, getAllTopics } from '@/lib/content';
import NewsletterSignup from '@/components/NewsletterSignup';
import NewsletterCard from '@/components/NewsletterCard';

export default async function Home() {
  const newsletters = getAllNewsletters('en');
  const blogPosts = getAllBlogPosts('en');

  const latestNewsletter = newsletters[0] ?? null;
  const recentBlogs = blogPosts.slice(0, 3);

  const topics = getAllTopics('en');
  const claudeCodeTopic = topics.find((t) => t.meta.slug === 'claude-code') ?? null;
  const comparePages = getAllCompare('en')
    .filter((c) => c.meta.slug.includes('claude-code'))
    .slice(0, 3);
  const faqPages = getAllFaq('en')
    .filter((f) => f.meta.slug.includes('claude-code'))
    .slice(0, 3);

  return (
    <div className="mx-auto max-w-3xl px-6">
      {/* Hero Section */}
      <section className="py-16 sm:py-24">
        <h1 className="text-4xl font-bold leading-tight tracking-tight sm:text-5xl">
          Your daily AI briefing.
        </h1>
        <p className="mt-4 text-xl text-muted sm:text-2xl">
          Models. Tools. Code. Trends.
        </p>
        <div className="mt-8">
          <NewsletterSignup variant="hero" />
        </div>
        <p className="mt-4 text-sm text-muted">
          Join AI practitioners who start their day with LoreAI.
        </p>
      </section>

      {/* TODAY'S AI NEWS */}
      <section className="border-t border-border py-12">
        <div className="flex items-baseline justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">
            Today&apos;s AI News
          </h2>
          <Link
            href="/newsletter"
            className="text-sm text-accent hover:text-accent-hover"
          >
            All issues &rarr;
          </Link>
        </div>

        {latestNewsletter ? (
          <div className="mt-6">
            <NewsletterCard meta={latestNewsletter.meta} />
          </div>
        ) : (
          <div className="mt-6 rounded-xl border border-border bg-surface p-8 text-center">
            <p className="text-muted">
              First issue coming soon. Subscribe to be the first to read it.
            </p>
          </div>
        )}
      </section>

      {/* DEEP DIVES */}
      <section className="border-t border-border py-12">
        <div className="flex items-baseline justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">
            Deep Dives
          </h2>
          <Link
            href="/blog"
            className="text-sm text-accent hover:text-accent-hover"
          >
            All posts &rarr;
          </Link>
        </div>

        {recentBlogs.length > 0 ? (
          <div className="mt-6 grid gap-4">
            {recentBlogs.map((post) => (
              <Link
                key={post.meta.slug}
                href={`/blog/${post.meta.slug}`}
                className="group block rounded-xl border border-border p-5 transition-colors hover:border-accent/40 hover:bg-surface"
              >
                <time className="text-xs font-medium uppercase tracking-wide text-muted">
                  {new Date(post.meta.date + 'T00:00:00').toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </time>
                <h3 className="mt-1.5 text-lg font-semibold leading-snug group-hover:text-accent">
                  {post.meta.title}
                </h3>
                {post.meta.description && (
                  <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-muted">
                    {post.meta.description}
                  </p>
                )}
              </Link>
            ))}
          </div>
        ) : (
          <div className="mt-6 rounded-xl border border-border bg-surface p-8 text-center">
            <p className="text-muted">
              Deep dives coming soon. Stay tuned.
            </p>
          </div>
        )}
      </section>

      {/* Explore Topics */}
      <section className="border-t border-border py-12">
        <div className="flex items-baseline justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">
            Explore Topics
          </h2>
          <Link
            href="/topics"
            className="text-sm text-accent hover:text-accent-hover"
          >
            All topics &rarr;
          </Link>
        </div>

        {claudeCodeTopic && (
          <Link
            href={`/topics/${claudeCodeTopic.meta.slug}`}
            className="group mt-6 block rounded-xl border border-border p-5 transition-colors hover:border-accent/40 hover:bg-surface"
          >
            <span className="text-xs font-medium uppercase tracking-wide text-muted">
              Flagship Topic
            </span>
            <h3 className="mt-1.5 text-lg font-semibold leading-snug group-hover:text-accent">
              {claudeCodeTopic.meta.title}
            </h3>
            {claudeCodeTopic.meta.description && (
              <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-muted">
                {claudeCodeTopic.meta.description}
              </p>
            )}
          </Link>
        )}

        {comparePages.length > 0 && (
          <div className="mt-6">
            <h3 className="text-xs font-medium uppercase tracking-wide text-muted">
              Comparisons
            </h3>
            <div className="mt-3 grid gap-4">
              {comparePages.map((page) => (
                <Link
                  key={page.meta.slug}
                  href={`/compare/${page.meta.slug}`}
                  className="group block rounded-xl border border-border p-5 transition-colors hover:border-accent/40 hover:bg-surface"
                >
                  <h4 className="text-lg font-semibold leading-snug group-hover:text-accent">
                    {page.meta.title}
                  </h4>
                  {page.meta.description && (
                    <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-muted">
                      {page.meta.description}
                    </p>
                  )}
                </Link>
              ))}
            </div>
          </div>
        )}

        {faqPages.length > 0 && (
          <div className="mt-6">
            <h3 className="text-xs font-medium uppercase tracking-wide text-muted">
              Frequently Asked
            </h3>
            <div className="mt-3 grid gap-4">
              {faqPages.map((page) => (
                <Link
                  key={page.meta.slug}
                  href={`/faq/${page.meta.slug}`}
                  className="group block rounded-xl border border-border p-5 transition-colors hover:border-accent/40 hover:bg-surface"
                >
                  <h4 className="text-lg font-semibold leading-snug group-hover:text-accent">
                    {page.meta.title}
                  </h4>
                  {page.meta.description && (
                    <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-muted">
                      {page.meta.description}
                    </p>
                  )}
                </Link>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* Bottom CTA */}
      <section className="border-t border-border py-16 text-center">
        <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
          Never miss an AI breakthrough
        </h2>
        <p className="mx-auto mt-3 max-w-md text-muted">
          Get the sharpest AI briefing delivered to your inbox every weekday morning. Free.
        </p>
        <div className="mx-auto mt-8 max-w-lg">
          <NewsletterSignup variant="hero" />
        </div>
      </section>
    </div>
  );
}
