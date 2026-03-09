import type { Metadata, Viewport } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import Script from 'next/script';
import Link from 'next/link';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import FloatingBanner from '@/components/FloatingBanner';
import './globals.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: {
    default: 'LoreAI - Your Daily AI Briefing',
    template: '%s | LoreAI',
  },
  description:
    'Daily AI newsletter covering models, tools, code, and trends. Stay ahead of the AI curve.',
  metadataBase: new URL('https://loreai.dev'),
  openGraph: {
    title: 'LoreAI - Your Daily AI Briefing',
    description:
      'Daily AI newsletter covering models, tools, code, and trends.',
    url: 'https://loreai.dev',
    siteName: 'LoreAI',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'LoreAI - Your Daily AI Briefing',
    description:
      'Daily AI newsletter covering models, tools, code, and trends.',
  },
  alternates: {
    types: {
      'application/rss+xml': '/rss.xml',
    },
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {/* Navigation */}
        <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur-sm">
          <nav className="mx-auto flex max-w-3xl items-center justify-between px-6 py-4">
            <div className="flex items-center gap-6">
              <Link
                href="/"
                className="text-lg font-bold tracking-tight"
              >
                LoreAI
              </Link>
              <div className="hidden items-center gap-5 sm:flex">
                <Link
                  href="/newsletter"
                  className="text-sm text-muted transition-colors hover:text-foreground"
                >
                  Newsletter
                </Link>
                <Link
                  href="/blog"
                  className="text-sm text-muted transition-colors hover:text-foreground"
                >
                  Blog
                </Link>
                <Link
                  href="/glossary"
                  className="text-sm text-muted transition-colors hover:text-foreground"
                >
                  Glossary
                </Link>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <LanguageSwitcher />
              <Link
                href="/subscribe"
                className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-accent-hover"
              >
                Subscribe
              </Link>
            </div>
          </nav>
          {/* Mobile nav links */}
          <div className="flex gap-4 border-t border-border px-6 py-2 sm:hidden">
            <Link
              href="/newsletter"
              className="text-sm text-muted transition-colors hover:text-foreground"
            >
              Newsletter
            </Link>
            <Link
              href="/blog"
              className="text-sm text-muted transition-colors hover:text-foreground"
            >
              Blog
            </Link>
            <Link
              href="/glossary"
              className="text-sm text-muted transition-colors hover:text-foreground"
            >
              Glossary
            </Link>
          </div>
        </header>

        {/* Analytics */}
        <Script
          defer
          data-domain="loreai.dev"
          src="https://plausible.io/js/script.tagged-events.js"
          strategy="afterInteractive"
        />

        {/* Main content */}
        <main className="min-h-screen">{children}</main>

        {/* Footer */}
        <footer className="border-t border-border">
          <div className="mx-auto max-w-3xl px-6 py-10">
            <div className="flex flex-col items-center gap-6 sm:flex-row sm:justify-between">
              <div className="flex items-center gap-5 text-sm text-muted">
                <Link href="/about" className="transition-colors hover:text-foreground">
                  About
                </Link>
                <Link href="/rss.xml" className="transition-colors hover:text-foreground">
                  RSS
                </Link>
                <a
                  href="https://github.com/loreai-dev"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="transition-colors hover:text-foreground"
                >
                  GitHub
                </a>
                <a
                  href="https://twitter.com/loreai_dev"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="transition-colors hover:text-foreground"
                >
                  Twitter
                </a>
              </div>
              <p className="text-xs text-muted">
                &copy; {new Date().getFullYear()} LoreAI. All rights reserved.
              </p>
            </div>
          </div>
        </footer>
        {/* Floating signup banner */}
        <FloatingBanner />
      </body>
    </html>
  );
}
