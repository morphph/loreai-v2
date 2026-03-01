'use client';

import { useState } from 'react';

type Variant = 'hero' | 'inline' | 'sidebar' | 'floating' | 'page';

interface NewsletterSignupProps {
  variant?: Variant;
}

export default function NewsletterSignup({ variant = 'inline' }: NewsletterSignupProps) {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email) return;

    setStatus('loading');
    try {
      const res = await fetch('/api/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (res.ok) {
        setStatus('success');
        setMessage(data.message || 'You\'re in! Check your inbox.');
        setEmail('');
      } else {
        setStatus('error');
        setMessage(data.error || 'Something went wrong. Try again.');
      }
    } catch {
      setStatus('error');
      setMessage('Network error. Please try again.');
    }
  }

  const successMsg = status === 'success' && (
    <p className="mt-3 text-sm text-green-600 dark:text-green-400">{message}</p>
  );
  const errorMsg = status === 'error' && (
    <p className="mt-3 text-sm text-red-600 dark:text-red-400">{message}</p>
  );

  if (variant === 'hero') {
    return (
      <div className="w-full max-w-lg">
        <form onSubmit={handleSubmit} className="flex flex-col gap-3 sm:flex-row">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            required
            className="flex-1 rounded-lg border border-border bg-surface px-4 py-3 text-base text-foreground placeholder:text-muted focus:border-accent focus:outline-none"
            disabled={status === 'loading'}
          />
          <button
            type="submit"
            disabled={status === 'loading'}
            className="rounded-lg bg-accent px-6 py-3 text-base font-medium text-white transition-colors hover:bg-accent-hover disabled:opacity-50"
          >
            {status === 'loading' ? 'Subscribing...' : 'Subscribe'}
          </button>
        </form>
        {successMsg}
        {errorMsg}
      </div>
    );
  }

  if (variant === 'sidebar') {
    return (
      <div className="rounded-xl border border-border bg-surface p-5">
        <h4 className="mb-1 text-sm font-semibold uppercase tracking-wide text-muted">Newsletter</h4>
        <p className="mb-3 text-sm text-foreground">Daily AI briefing, free.</p>
        <form onSubmit={handleSubmit} className="flex flex-col gap-2">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            required
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted focus:border-accent focus:outline-none"
            disabled={status === 'loading'}
          />
          <button
            type="submit"
            disabled={status === 'loading'}
            className="w-full rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-accent-hover disabled:opacity-50"
          >
            {status === 'loading' ? '...' : 'Subscribe'}
          </button>
        </form>
        {successMsg}
        {errorMsg}
      </div>
    );
  }

  if (variant === 'floating') {
    return (
      <div className="fixed bottom-6 right-6 z-50 w-80 rounded-xl border border-border bg-background p-5 shadow-lg">
        <h4 className="mb-1 text-base font-semibold">Don&apos;t miss out</h4>
        <p className="mb-3 text-sm text-muted">AI moves fast. We keep you current.</p>
        <form onSubmit={handleSubmit} className="flex flex-col gap-2">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            required
            className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground placeholder:text-muted focus:border-accent focus:outline-none"
            disabled={status === 'loading'}
          />
          <button
            type="submit"
            disabled={status === 'loading'}
            className="w-full rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-accent-hover disabled:opacity-50"
          >
            {status === 'loading' ? '...' : 'Subscribe Free'}
          </button>
        </form>
        {successMsg}
        {errorMsg}
      </div>
    );
  }

  if (variant === 'page') {
    return (
      <div className="mx-auto w-full max-w-md">
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            required
            className="w-full rounded-lg border border-border bg-surface px-4 py-3.5 text-base text-foreground placeholder:text-muted focus:border-accent focus:outline-none"
            disabled={status === 'loading'}
          />
          <button
            type="submit"
            disabled={status === 'loading'}
            className="w-full rounded-lg bg-accent px-6 py-3.5 text-base font-semibold text-white transition-colors hover:bg-accent-hover disabled:opacity-50"
          >
            {status === 'loading' ? 'Subscribing...' : 'Subscribe -- It\'s Free'}
          </button>
        </form>
        <p className="mt-3 text-center text-xs text-muted">
          No spam. Unsubscribe anytime.
        </p>
        {status === 'success' && (
          <p className="mt-3 text-center text-sm text-green-600 dark:text-green-400">{message}</p>
        )}
        {status === 'error' && (
          <p className="mt-3 text-center text-sm text-red-600 dark:text-red-400">{message}</p>
        )}
      </div>
    );
  }

  // variant === 'inline' (default)
  return (
    <section className="mt-12 rounded-xl border border-border bg-surface p-6 sm:p-8">
      <h3 className="text-lg font-semibold">
        Get the daily AI briefing
      </h3>
      <p className="mt-1 text-sm text-muted">
        Join AI practitioners who start their day with LoreAI. One email, every weekday morning.
      </p>

      {status === 'success' ? (
        <p className="mt-4 text-sm font-medium text-green-600 dark:text-green-400">
          {message}
        </p>
      ) : (
        <form onSubmit={handleSubmit} className="mt-4 flex flex-col gap-3 sm:flex-row">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            required
            className="flex-1 rounded-lg border border-border bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-muted focus:border-accent focus:outline-none"
            disabled={status === 'loading'}
          />
          <button
            type="submit"
            disabled={status === 'loading'}
            className="rounded-lg bg-accent px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-accent-hover disabled:opacity-50"
          >
            {status === 'loading' ? 'Subscribing...' : 'Subscribe'}
          </button>
        </form>
      )}

      {status === 'error' && (
        <p className="mt-2 text-sm text-red-600 dark:text-red-400">
          {message}
        </p>
      )}
    </section>
  );
}
