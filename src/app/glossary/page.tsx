import type { Metadata } from 'next';
import { getAllGlossary } from '@/lib/content';
import { definedTermSetJsonLd, jsonLdScript } from '@/lib/seo';
import GlossaryList from '@/components/GlossaryList';
import NewsletterSignup from '@/components/NewsletterSignup';

export const metadata: Metadata = {
  title: 'AI Glossary | LoreAI',
  description:
    'Comprehensive AI glossary covering models, tools, concepts, and frameworks. Clear definitions for practitioners and learners.',
};

export default function GlossaryIndexPage() {
  const allTerms = getAllGlossary('en');

  const termSetJsonLd = definedTermSetJsonLd(
    allTerms.map((t) => ({
      name: (t.meta.display_term as string) || t.meta.title,
      description: (t.meta.description as string) || '',
      url: `https://loreai.dev/glossary/${(t.meta.term as string) || t.meta.slug}`,
    }))
  );

  // Serialize terms for client component
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
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
            AI Glossary
          </h1>
          <p className="mt-2 text-lg text-muted">
            Clear definitions for AI models, tools, concepts, and frameworks.
          </p>
        </header>

        <GlossaryList terms={termsData} lang="en" />

        <div className="mt-12">
          <NewsletterSignup variant="inline" />
        </div>
      </div>
    </>
  );
}
