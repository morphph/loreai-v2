import Link from 'next/link';
import type { ContentMeta } from '@/lib/content';

interface NewsletterCardProps {
  meta: ContentMeta;
  lang?: 'en' | 'zh';
}

export default function NewsletterCard({ meta, lang = 'en' }: NewsletterCardProps) {
  const formattedDate = new Date(meta.date + 'T00:00:00').toLocaleDateString(
    lang === 'zh' ? 'zh-CN' : 'en-US',
    {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }
  );

  const href = lang === 'zh' ? `/zh/newsletter/${meta.date}` : `/newsletter/${meta.date}`;

  return (
    <Link
      href={href}
      className="group block rounded-xl border border-border p-5 transition-colors hover:border-accent/40 hover:bg-surface"
    >
      <time className="text-xs font-medium uppercase tracking-wide text-muted">
        {formattedDate}
      </time>
      <h3 className="mt-1.5 text-lg font-semibold leading-snug group-hover:text-accent">
        {meta.title}
      </h3>
      {meta.description && (
        <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-muted">
          {meta.description}
        </p>
      )}
    </Link>
  );
}
