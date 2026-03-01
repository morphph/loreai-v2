import Link from 'next/link';
import NewsletterSignup from '@/components/NewsletterSignup';

export default function NotFound() {
  return (
    <div className="mx-auto max-w-3xl px-6">
      <section className="py-20 sm:py-28">
        <div className="text-center">
          <p className="text-sm font-medium text-accent">404</p>
          <h1 className="mt-2 text-4xl font-bold tracking-tight sm:text-5xl">
            Page not found
          </h1>
          <p className="mt-4 text-lg text-muted">
            The page you&apos;re looking for doesn&apos;t exist or has been moved.
          </p>
          <div className="mt-8 flex items-center justify-center gap-4">
            <Link
              href="/"
              className="rounded-lg bg-accent px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-accent-hover"
            >
              Go home
            </Link>
            <Link
              href="/subscribe"
              className="rounded-lg border border-border px-5 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-surface"
            >
              Subscribe
            </Link>
          </div>
        </div>

        {/* Newsletter CTA */}
        <div className="mt-16">
          <NewsletterSignup variant="inline" />
        </div>
      </section>
    </div>
  );
}
