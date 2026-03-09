'use client';

import { Suspense, useState } from 'react';
import { useSearchParams } from 'next/navigation';

declare global {
  interface Window {
    plausible?: (event: string, opts?: { props: Record<string, string> }) => void;
  }
}

type Variant = 'hero' | 'inline' | 'sidebar' | 'floating' | 'page';

interface NewsletterSignupProps {
  variant?: Variant;
  lang?: 'en' | 'zh';
}

export default function NewsletterSignup(props: NewsletterSignupProps) {
  return (
    <Suspense>
      <NewsletterSignupInner {...props} />
    </Suspense>
  );
}

const i18n = {
  en: {
    subscribing: 'Subscribing...',
    subscribe: 'Subscribe',
    subscribeFree: 'Subscribe Free',
    subscribeIsFree: "Subscribe -- It's Free",
    dots: '...',
    placeholder: 'you@example.com',
    successFallback: "You're in! Check your inbox.",
    errorFallback: 'Something went wrong. Try again.',
    networkError: 'Network error. Please try again.',
    noSpam: 'No spam. Unsubscribe anytime.',
    sidebarTitle: 'Newsletter',
    sidebarDesc: 'Daily AI briefing, free.',
    floatingTitle: "Don\u2019t miss out",
    floatingDesc: 'AI moves fast. We keep you current.',
    inlineTitle: 'Get the daily AI briefing',
    inlineDesc: 'Join AI practitioners who start their day with LoreAI. One email, every weekday morning.',
  },
  zh: {
    subscribing: '订阅中...',
    subscribe: '订阅',
    subscribeFree: '免费订阅',
    subscribeIsFree: '免费订阅',
    dots: '...',
    placeholder: 'you@example.com',
    successFallback: '订阅成功！请查收邮件。',
    errorFallback: '出了点问题，请重试。',
    networkError: '网络错误，请重试。',
    noSpam: '不发垃圾邮件，随时退订。',
    sidebarTitle: 'AI 简报',
    sidebarDesc: '每日 AI 简报，免费。',
    floatingTitle: '别错过',
    floatingDesc: 'AI 变化太快，我们帮你跟上。',
    inlineTitle: '订阅每日 AI 简报',
    inlineDesc: '加入每天用 LoreAI 开启工作日的 AI 从业者。每个工作日早晨一封邮件。',
  },
};

function NewsletterSignupInner({ variant = 'inline', lang = 'en' }: NewsletterSignupProps) {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const searchParams = useSearchParams();
  const t = i18n[lang];

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email) return;

    setStatus('loading');
    const source = searchParams.get('ref') || 'direct';
    try {
      const res = await fetch('/api/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, lang, source }),
      });
      const data = await res.json();
      if (res.ok) {
        setStatus('success');
        setMessage(data.message || t.successFallback);
        setEmail('');
        window.plausible?.('Subscribe', { props: { lang, source } });
      } else {
        setStatus('error');
        setMessage(data.error || t.errorFallback);
      }
    } catch {
      setStatus('error');
      setMessage(t.networkError);
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
            placeholder={t.placeholder}
            required
            className="flex-1 rounded-lg border border-border bg-surface px-4 py-3 text-base text-foreground placeholder:text-muted focus:border-accent focus:outline-none"
            disabled={status === 'loading'}
          />
          <button
            type="submit"
            disabled={status === 'loading'}
            className="rounded-lg bg-accent px-6 py-3 text-base font-medium text-white transition-colors hover:bg-accent-hover disabled:opacity-50"
          >
            {status === 'loading' ? t.subscribing : t.subscribe}
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
        <h4 className="mb-1 text-sm font-semibold uppercase tracking-wide text-muted">{t.sidebarTitle}</h4>
        <p className="mb-3 text-sm text-foreground">{t.sidebarDesc}</p>
        <form onSubmit={handleSubmit} className="flex flex-col gap-2">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={t.placeholder}
            required
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted focus:border-accent focus:outline-none"
            disabled={status === 'loading'}
          />
          <button
            type="submit"
            disabled={status === 'loading'}
            className="w-full rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-accent-hover disabled:opacity-50"
          >
            {status === 'loading' ? t.dots : t.subscribe}
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
        <h4 className="mb-1 text-base font-semibold">{t.floatingTitle}</h4>
        <p className="mb-3 text-sm text-muted">{t.floatingDesc}</p>
        <form onSubmit={handleSubmit} className="flex flex-col gap-2">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={t.placeholder}
            required
            className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground placeholder:text-muted focus:border-accent focus:outline-none"
            disabled={status === 'loading'}
          />
          <button
            type="submit"
            disabled={status === 'loading'}
            className="w-full rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-accent-hover disabled:opacity-50"
          >
            {status === 'loading' ? t.dots : t.subscribeFree}
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
            placeholder={t.placeholder}
            required
            className="w-full rounded-lg border border-border bg-surface px-4 py-3.5 text-base text-foreground placeholder:text-muted focus:border-accent focus:outline-none"
            disabled={status === 'loading'}
          />
          <button
            type="submit"
            disabled={status === 'loading'}
            className="w-full rounded-lg bg-accent px-6 py-3.5 text-base font-semibold text-white transition-colors hover:bg-accent-hover disabled:opacity-50"
          >
            {status === 'loading' ? t.subscribing : t.subscribeIsFree}
          </button>
        </form>
        <p className="mt-3 text-center text-xs text-muted">
          {t.noSpam}
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
        {t.inlineTitle}
      </h3>
      <p className="mt-1 text-sm text-muted">
        {t.inlineDesc}
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
            placeholder={t.placeholder}
            required
            className="flex-1 rounded-lg border border-border bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-muted focus:border-accent focus:outline-none"
            disabled={status === 'loading'}
          />
          <button
            type="submit"
            disabled={status === 'loading'}
            className="rounded-lg bg-accent px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-accent-hover disabled:opacity-50"
          >
            {status === 'loading' ? t.subscribing : t.subscribe}
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
