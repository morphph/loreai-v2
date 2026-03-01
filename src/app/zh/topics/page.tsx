import type { Metadata } from 'next';
import Link from 'next/link';
import { getAllTopics } from '@/lib/content';
import NewsletterSignup from '@/components/NewsletterSignup';

export const metadata: Metadata = {
  title: 'AI 主题 | LoreAI',
  description:
    '探索 AI 主题中心，涵盖人工智能的主要领域。每个主题的精选指南、工具和资源。',
};

export default function ZhTopicsIndexPage() {
  const allTopics = getAllTopics('zh');

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
      <header className="mb-10">
        <div className="flex items-baseline justify-between">
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
            AI 主题
          </h1>
          <Link
            href="/topics"
            className="text-sm text-muted transition-colors hover:text-foreground"
          >
            English
          </Link>
        </div>
        <p className="mt-2 text-lg text-muted">
          深度主题中心，涵盖人工智能的主要领域。
        </p>
      </header>

      {allTopics.length === 0 ? (
        <p className="text-muted">暂无主题，敬请期待。</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {allTopics.map((topic) => {
            const pillarTopic = (topic.meta.pillar_topic as string) || topic.meta.title;
            return (
              <Link
                key={topic.meta.slug}
                href={`/zh/topics/${topic.meta.slug}`}
                className="group flex flex-col rounded-xl border border-border p-5 transition-colors hover:border-accent/40 hover:bg-surface"
              >
                <h3 className="text-lg font-semibold group-hover:text-accent">
                  {pillarTopic}
                </h3>
                {topic.meta.description && (
                  <p className="mt-2 line-clamp-3 text-sm text-muted">
                    {topic.meta.description as string}
                  </p>
                )}
                <span className="mt-auto pt-3 text-sm font-medium text-accent">
                  探索主题 &rarr;
                </span>
              </Link>
            );
          })}
        </div>
      )}

      <div className="mt-12">
        <NewsletterSignup variant="inline" />
      </div>
    </div>
  );
}
