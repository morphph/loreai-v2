'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';

const DISMISS_KEY = 'loreai-banner-dismissed';

export default function FloatingBanner() {
  const pathname = usePathname();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Don't show on /subscribe page
    if (pathname === '/subscribe') return;

    // Don't show if already dismissed this session
    if (sessionStorage.getItem(DISMISS_KEY)) return;

    function handleScroll() {
      if (window.scrollY > 300) {
        setVisible(true);
        window.removeEventListener('scroll', handleScroll);
      }
    }

    window.addEventListener('scroll', handleScroll, { passive: true });

    // Check immediately in case user already scrolled
    if (window.scrollY > 300) {
      setVisible(true);
    }

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [pathname]);

  function handleDismiss() {
    setVisible(false);
    sessionStorage.setItem(DISMISS_KEY, '1');
  }

  if (!visible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-background/95 backdrop-blur-sm">
      <div className="mx-auto flex max-w-3xl items-center justify-between gap-4 px-6 py-3">
        <p className="text-sm text-foreground">
          <span className="font-medium">Stay ahead of AI.</span>{' '}
          <span className="text-muted">Get the daily briefing — free.</span>
        </p>
        <div className="flex items-center gap-3 shrink-0">
          <Link
            href="/subscribe"
            className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-accent-hover"
          >
            Subscribe
          </Link>
          <button
            onClick={handleDismiss}
            aria-label="Dismiss banner"
            className="rounded p-1 text-muted transition-colors hover:text-foreground"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
