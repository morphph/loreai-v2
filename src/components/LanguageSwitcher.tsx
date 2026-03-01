'use client';

import { usePathname, useRouter } from 'next/navigation';

export default function LanguageSwitcher() {
  const pathname = usePathname();
  const router = useRouter();

  // Determine current language from pathname
  const isZh = pathname.startsWith('/zh');
  const currentLang = isZh ? 'zh' : 'en';

  function switchLanguage() {
    if (currentLang === 'en') {
      // Switch to Chinese: prefix with /zh
      router.push(`/zh${pathname}`);
    } else {
      // Switch to English: remove /zh prefix
      const enPath = pathname.replace(/^\/zh/, '') || '/';
      router.push(enPath);
    }
  }

  return (
    <button
      onClick={switchLanguage}
      className="rounded-md px-2.5 py-1.5 text-sm font-medium text-muted transition-colors hover:text-foreground"
      aria-label={currentLang === 'en' ? 'Switch to Chinese' : 'Switch to English'}
    >
      {currentLang === 'en' ? '中文' : 'EN'}
    </button>
  );
}
