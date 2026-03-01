import Link from 'next/link';
import type { ContentMeta } from '@/lib/content';

interface BlogCardProps {
  meta: ContentMeta;
  lang?: string;
}

function estimateReadingTime(wordCount: number): string {
  const minutes = Math.max(1, Math.ceil(wordCount / 250));
  return `${minutes} min read`;
}

export default function BlogCard({ meta, lang = 'en' }: BlogCardProps) {
  const prefix = lang === 'zh' ? '/zh' : '';
  const slug = meta.slug;

  const formattedDate = new Date(meta.date + 'T00:00:00').toLocaleDateString(
    lang === 'zh' ? 'zh-CN' : 'en-US',
    { year: 'numeric', month: 'long', day: 'numeric' }
  );

  // Estimate reading time from word count in description or fall back to a default
  const wordCount = typeof meta.word_count === 'number' ? (meta.word_count as number) : 800;
  const readingTime = estimateReadingTime(wordCount);

  const category = (meta.category as string) || null;

  return (
    <Link
      href={`${prefix}/blog/${slug}`}
      className="group flex flex-col rounded-xl border border-border p-5 transition-colors hover:border-accent/40 hover:bg-surface"
    >
      <div className="flex items-center gap-3 text-xs text-muted">
        <time dateTime={meta.date}>{formattedDate}</time>
        <span aria-hidden="true">&middot;</span>
        <span>{readingTime}</span>
      </div>

      <h3 className="mt-2 text-lg font-semibold leading-snug group-hover:text-accent">
        {meta.title}
      </h3>

      {meta.description && (
        <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-muted">
          {meta.description as string}
        </p>
      )}

      {category && (
        <div className="mt-3">
          <span className="inline-block rounded-full bg-accent/10 px-2.5 py-0.5 text-xs font-medium text-accent">
            {category}
          </span>
        </div>
      )}
    </Link>
  );
}
