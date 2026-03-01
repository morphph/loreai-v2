import type { Metadata } from 'next';
import NewsletterSignup from '@/components/NewsletterSignup';
import SubscriberCount from '@/components/SubscriberCount';

export const metadata: Metadata = {
  title: 'Subscribe',
  description:
    'Subscribe to the LoreAI daily newsletter. Models, tools, code, and trends delivered to your inbox every weekday.',
};

export default function SubscribePage() {
  return (
    <div className="mx-auto max-w-3xl px-6">
      <section className="py-20 sm:py-28">
        <div className="text-center">
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
            Stay ahead of AI
          </h1>
          <p className="mx-auto mt-4 max-w-lg text-lg text-muted">
            The most important AI news, distilled into a sharp 5-minute briefing.
            Delivered to your inbox every weekday morning.
          </p>
        </div>

        <div className="mt-10">
          <NewsletterSignup variant="page" />
        </div>

        {/* What you get */}
        <div className="mt-16 grid gap-6 sm:grid-cols-3">
          <div className="rounded-xl border border-border p-5">
            <h3 className="font-semibold">Models & Research</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted">
              New model releases, benchmark results, and research breakthroughs you need to know.
            </p>
          </div>
          <div className="rounded-xl border border-border p-5">
            <h3 className="font-semibold">Tools & Code</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted">
              Open-source releases, framework updates, and practical tools for builders.
            </p>
          </div>
          <div className="rounded-xl border border-border p-5">
            <h3 className="font-semibold">Trends & Analysis</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted">
              Industry moves, funding rounds, and what they mean for practitioners.
            </p>
          </div>
        </div>

        {/* Social proof */}
        <div className="mt-16 text-center">
          <SubscriberCount />
        </div>
      </section>
    </div>
  );
}
