import type { Metadata } from 'next';
import Link from 'next/link';
import { getAllGlossary } from '@/lib/content';
import { definedTermSetJsonLd, jsonLdScript } from '@/lib/seo';
import GlossaryList from '@/components/GlossaryList';
import NewsletterSignup from '@/components/NewsletterSignup';

export const metadata: Metadata = {
  title: 'AI 词汇表 | LoreAI',
  description:
    '全面的 AI 词汇表，涵盖模型、工具、概念和框架。为从业者和学习者提供清晰的定义。',
};

export default function ZhGlossaryIndexPage() {
  const allTerms = getAllGlossary('zh');

  const termSetJsonLd = definedTermSetJsonLd(
    allTerms.map((t) => ({
      name: (t.meta.display_term as string) || t.meta.title,
      description: (t.meta.description as string) || '',
      url: `https://loreai.dev/zh/glossary/${(t.meta.term as string) || t.meta.slug}`,
    }))
  );

  const termsData = allTerms.map((t) => ({
    displayTerm: (t.meta.display_term as string) || t.meta.title,
    slug: (t.meta.term as string) || t.meta.slug,
    category: (t.meta.category as string) || '',
    description: (t.meta.description as string) || '',
  }));

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLdScript(termSetJsonLd) }}
      />
      <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
        <header className="mb-10">
          <div className="flex items-baseline justify-between">
            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
              AI 词汇表
            </h1>
            <Link
              href="/glossary"
              className="text-sm text-muted transition-colors hover:text-foreground"
            >
              English
            </Link>
          </div>
          <p className="mt-2 text-lg text-muted">
            AI 模型、工具、概念和框架的清晰定义。
          </p>
        </header>

        <GlossaryList terms={termsData} lang="zh" />

        <div className="mt-12">
          <NewsletterSignup variant="inline" />
        </div>
      </div>
    </>
  );
}
