'use client';

import { useEffect } from 'react';

export default function MermaidRenderer() {
  useEffect(() => {
    const codeBlocks = document.querySelectorAll('code.language-mermaid');
    if (codeBlocks.length === 0) return;

    let cancelled = false;

    import('mermaid').then(({ default: mermaid }) => {
      if (cancelled) return;

      const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      mermaid.initialize({
        startOnLoad: false,
        theme: isDark ? 'dark' : 'neutral',
        fontFamily: 'inherit',
      });

      codeBlocks.forEach((block, i) => {
        const pre = block.parentElement;
        if (!pre || pre.tagName !== 'PRE') return;

        const div = document.createElement('div');
        div.className = 'mermaid';
        div.id = `mermaid-${i}`;
        div.textContent = block.textContent || '';
        pre.replaceWith(div);
      });

      mermaid.run();
    });

    return () => {
      cancelled = true;
    };
  }, []);

  return null;
}
