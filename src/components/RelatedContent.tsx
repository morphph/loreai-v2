import Link from 'next/link';

interface RelatedContentProps {
  relatedNewsletter?: string | string[];
  relatedGlossary?: string | string[];
  relatedCompare?: string | string[];
  relatedFaq?: string | string[];
  relatedBlog?: string | string[];
  relatedTopics?: string | string[];
  lang?: string;
  labels?: {
    newsletter?: string;
    glossary?: string;
    compare?: string;
    faq?: string;
    blog?: string;
    topics?: string;
  };
}

function toArray(val: string | string[] | undefined): string[] {
  if (!val) return [];
  return Array.isArray(val) ? val : [val];
}

export default function RelatedContent({
  relatedNewsletter,
  relatedGlossary,
  relatedCompare,
  relatedFaq,
  relatedBlog,
  relatedTopics,
  lang = 'en',
  labels,
}: RelatedContentProps) {
  const newsletters = toArray(relatedNewsletter);
  const glossaryTerms = toArray(relatedGlossary);
  const comparisons = toArray(relatedCompare);
  const faqs = toArray(relatedFaq);
  const blogs = toArray(relatedBlog);
  const topics = toArray(relatedTopics);

  if (
    newsletters.length === 0 &&
    glossaryTerms.length === 0 &&
    comparisons.length === 0 &&
    faqs.length === 0 &&
    blogs.length === 0 &&
    topics.length === 0
  ) {
    return null;
  }

  const prefix = lang === 'zh' ? '/zh' : '';

  const newsletterLabel = labels?.newsletter || (lang === 'zh' ? '相关日报' : 'Related Newsletter');
  const glossaryLabel = labels?.glossary || (lang === 'zh' ? '相关术语' : 'Related Terms');
  const compareLabel = labels?.compare || (lang === 'zh' ? '相关对比' : 'Related Comparisons');
  const faqLabel = labels?.faq || (lang === 'zh' ? '相关问答' : 'Related FAQ');
  const blogLabel = labels?.blog || (lang === 'zh' ? '相关文章' : 'Related Articles');
  const topicsLabel = labels?.topics || (lang === 'zh' ? '相关主题' : 'Related Topics');

  return (
    <aside className="mt-10 rounded-xl border border-border bg-surface p-5">
      <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-muted">
        {lang === 'zh' ? '相关内容' : 'Related Content'}
      </h3>

      <div className="space-y-4">
        {newsletters.length > 0 && (
          <div>
            <h4 className="mb-1.5 text-xs font-medium text-muted">{newsletterLabel}</h4>
            <ul className="space-y-1">
              {newsletters.map((date) => (
                <li key={date}>
                  <Link
                    href={`${prefix}/newsletter/${date}`}
                    className="text-sm text-accent underline-offset-2 hover:underline"
                  >
                    {date}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}

        {glossaryTerms.length > 0 && (
          <div>
            <h4 className="mb-1.5 text-xs font-medium text-muted">{glossaryLabel}</h4>
            <ul className="flex flex-wrap gap-2">
              {glossaryTerms.map((term) => (
                <li key={term}>
                  <Link
                    href={`${prefix}/glossary/${term}`}
                    className="inline-block rounded-full bg-accent/10 px-2.5 py-0.5 text-xs font-medium text-accent hover:bg-accent/20"
                  >
                    {term.replace(/-/g, ' ')}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}

        {comparisons.length > 0 && (
          <div>
            <h4 className="mb-1.5 text-xs font-medium text-muted">{compareLabel}</h4>
            <ul className="space-y-1">
              {comparisons.map((slug) => (
                <li key={slug}>
                  <Link
                    href={`${prefix}/compare/${slug}`}
                    className="text-sm text-accent underline-offset-2 hover:underline"
                  >
                    {slug.replace(/-/g, ' ')}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}

        {faqs.length > 0 && (
          <div>
            <h4 className="mb-1.5 text-xs font-medium text-muted">{faqLabel}</h4>
            <ul className="space-y-1">
              {faqs.map((slug) => (
                <li key={slug}>
                  <Link
                    href={`${prefix}/faq/${slug}`}
                    className="text-sm text-accent underline-offset-2 hover:underline"
                  >
                    {slug.replace(/-/g, ' ')}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}

        {blogs.length > 0 && (
          <div>
            <h4 className="mb-1.5 text-xs font-medium text-muted">{blogLabel}</h4>
            <ul className="space-y-1">
              {blogs.map((slug) => (
                <li key={slug}>
                  <Link
                    href={`${prefix}/blog/${slug}`}
                    className="text-sm text-accent underline-offset-2 hover:underline"
                  >
                    {slug.replace(/-/g, ' ')}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}

        {topics.length > 0 && (
          <div>
            <h4 className="mb-1.5 text-xs font-medium text-muted">{topicsLabel}</h4>
            <ul className="space-y-1">
              {topics.map((slug) => (
                <li key={slug}>
                  <Link
                    href={`${prefix}/topics/${slug}`}
                    className="text-sm text-accent underline-offset-2 hover:underline"
                  >
                    {slug.replace(/-/g, ' ')}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </aside>
  );
}
