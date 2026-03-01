import type { Metadata } from 'next';
import Link from 'next/link';
import { getAllFaq } from '@/lib/content';
import NewsletterSignup from '@/components/NewsletterSignup';

export const metadata: Metadata = {
  title: '常见问题 | LoreAI',
  description:
    '关于 AI 工具、模型和概念的常见问题解答。获取常见 AI 问题的清晰答案。',
};

export default function ZhFaqIndexPage() {
  const allFaqs = getAllFaq('zh');

  // Group by category
  const grouped: Record<string, typeof allFaqs> = {};
  for (const faq of allFaqs) {
    const category = (faq.meta.category as string) || '通用';
    if (!grouped[category]) {
      grouped[category] = [];
    }
    grouped[category].push(faq);
  }

  const sortedCategories = Object.keys(grouped).sort();

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
      <header className="mb-10">
        <div className="flex items-baseline justify-between">
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
            常见问题
          </h1>
          <Link
            href="/faq"
            className="text-sm text-muted transition-colors hover:text-foreground"
          >
            English
          </Link>
        </div>
        <p className="mt-2 text-lg text-muted">
          关于 AI 工具、模型和概念的常见问题解答。
        </p>
      </header>

      {allFaqs.length === 0 ? (
        <p className="text-muted">暂无常见问题，敬请期待。</p>
      ) : (
        <div className="space-y-10">
          {sortedCategories.map((category) => (
            <section key={category}>
              <h2 className="mb-4 border-b border-border pb-2 text-xl font-bold">
                {category}
              </h2>
              <ul className="space-y-3">
                {grouped[category].map((faq) => (
                  <li key={faq.meta.slug}>
                    <Link
                      href={`/zh/faq/${faq.meta.slug}`}
                      className="group flex items-start gap-3 rounded-xl border border-border p-4 transition-colors hover:border-accent/40 hover:bg-surface"
                    >
                      <span className="mt-0.5 shrink-0 text-accent" aria-hidden="true">Q</span>
                      <div>
                        <h3 className="font-semibold group-hover:text-accent">
                          {faq.meta.title}
                        </h3>
                        {faq.meta.description && (
                          <p className="mt-1 line-clamp-2 text-sm text-muted">
                            {faq.meta.description as string}
                          </p>
                        )}
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}

      <div className="mt-12">
        <NewsletterSignup variant="inline" />
      </div>
    </div>
  );
}
