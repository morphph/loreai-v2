import Link from 'next/link';
import { breadcrumbJsonLd, jsonLdScript } from '@/lib/seo';

export interface BreadcrumbItem {
  name: string;
  href: string;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
  className?: string;
}

export default function Breadcrumb({ items, className }: BreadcrumbProps) {
  const jsonLdItems = items.map((item) => ({
    name: item.name,
    url: item.href.startsWith('http') ? item.href : `https://loreai.dev${item.href}`,
  }));

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLdScript(breadcrumbJsonLd(jsonLdItems)) }}
      />
      <nav className={className ?? 'mb-8 flex items-center gap-2 text-sm text-muted'}>
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          return (
            <span key={item.href} className="flex items-center gap-2">
              {index > 0 && <span aria-hidden="true">/</span>}
              {isLast ? (
                <span className="text-foreground line-clamp-1">{item.name}</span>
              ) : (
                <Link href={item.href} className="transition-colors hover:text-foreground">
                  {item.name}
                </Link>
              )}
            </span>
          );
        })}
      </nav>
    </>
  );
}
