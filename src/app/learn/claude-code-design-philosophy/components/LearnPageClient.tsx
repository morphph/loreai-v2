'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { allChapters, chapterMetas } from '../content/chapters';
import type { ContentBlock } from '../content/chapters';
import LearnSidebar from './LearnSidebar';
import ChapterNav from './ChapterNav';
import CodeBlock from './CodeBlock';
import InsightBox from './InsightBox';
import LayerDiagram from './LayerDiagram';
import ArchDiagram from './ArchDiagram';
import StatCard from './StatCard';
import NewsletterSignup from '@/components/NewsletterSignup';

function renderText(text: string) {
  // Convert **bold** markdown to <strong> tags
  const parts = text.split(/(\*\*.*?\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i} className="text-[#1e293b]">{part.slice(2, -2)}</strong>;
    }
    return part;
  });
}

function renderInsightContent(content: string) {
  // Split by \n\n for paragraphs, then handle **bold**
  const paragraphs = content.split('\n\n');
  return paragraphs.map((p, i) => (
    <p key={i} className="my-1">{renderText(p)}</p>
  ));
}

function renderBlock(block: ContentBlock, index: number) {
  switch (block.type) {
    case 'paragraph':
      return <p key={index} className="mb-4">{renderText(block.text)}</p>;
    case 'heading':
      return <h3 key={index} className="mb-3 mt-8 text-lg font-bold text-[#0f172a]">{block.text}</h3>;
    case 'code':
      return <CodeBlock key={index} code={block.code} filename={block.filename} language={block.language} annotation={block.annotation} />;
    case 'insight':
      return (
        <InsightBox key={index} type={block.variant} title={block.title}>
          {renderInsightContent(block.content)}
        </InsightBox>
      );
    case 'stats':
      return (
        <div key={index} className="my-7 flex flex-wrap gap-3">
          {block.items.map((item, i) => (
            <StatCard key={i} number={item.number} label={item.label} sub={item.sub} />
          ))}
        </div>
      );
    case 'layers':
      return <LayerDiagram key={index} layers={block.layers} />;
    case 'arch':
      return <ArchDiagram key={index} title={block.title} centerLabel={block.centerLabel} items={block.items} />;
    default:
      return null;
  }
}

// Chapters after which we insert a CTA (0-indexed)
const CTA_AFTER_CHAPTERS = new Set([5, 9]); // after chapter 6 (agents) and chapter 10 (takeaway)

export default function LearnPageClient() {
  const [currentChapterId, setCurrentChapterId] = useState('intro');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  const currentIndex = chapterMetas.findIndex((c) => c.id === currentChapterId);
  const chapter = allChapters[currentIndex];

  // Sync hash on load
  useEffect(() => {
    const hash = window.location.hash.slice(1);
    if (hash && chapterMetas.some((c) => c.id === hash)) {
      setCurrentChapterId(hash);
    }
  }, []);

  const goTo = useCallback((id: string) => {
    setCurrentChapterId(id);
    setSidebarOpen(false);
    window.history.replaceState(null, '', `#${id}`);
    if (contentRef.current) contentRef.current.scrollTop = 0;
  }, []);

  const goNext = useCallback(() => {
    if (currentIndex < chapterMetas.length - 1) goTo(chapterMetas[currentIndex + 1].id);
  }, [currentIndex, goTo]);

  const goPrev = useCallback(() => {
    if (currentIndex > 0) goTo(chapterMetas[currentIndex - 1].id);
  }, [currentIndex, goTo]);

  return (
    <div className="flex h-[calc(100vh-65px)]">
      <LearnSidebar
        chapters={chapterMetas}
        currentId={currentChapterId}
        onSelect={goTo}
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/* Main content */}
      <main className="flex min-w-0 flex-1 flex-col">
        {/* Top bar */}
        <header className="flex items-center gap-3 border-b border-[#e2e8f0] bg-white px-6 py-3">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="border-none bg-transparent p-1 md:hidden"
            aria-label="Toggle sidebar"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="18" x2="21" y2="18" /></svg>
          </button>
          <div className="flex items-center gap-2 text-[13px] text-[#94a3b8]">
            <span>第 {currentIndex + 1} / {chapterMetas.length} 章</span>
            <span>\u00B7</span>
            <span className="font-semibold" style={{ color: chapterMetas[currentIndex].color }}>
              {chapterMetas[currentIndex].title}
            </span>
          </div>
          <div className="ml-auto flex gap-2">
            <button
              onClick={goPrev}
              disabled={currentIndex === 0}
              className="flex items-center gap-1 rounded-lg border border-[#e2e8f0] bg-white px-3 py-1.5 text-[13px] text-[#475569] transition-colors hover:border-[#cbd5e1] disabled:opacity-40"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6" /></svg>
              <span className="hidden sm:inline">上一章</span>
            </button>
            <button
              onClick={goNext}
              disabled={currentIndex === chapterMetas.length - 1}
              className="flex items-center gap-1 rounded-lg px-3 py-1.5 text-[13px] font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-40"
              style={{
                background: currentIndex === chapterMetas.length - 1 ? '#e2e8f0' : 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                color: currentIndex === chapterMetas.length - 1 ? '#94a3b8' : 'white',
              }}
            >
              <span className="hidden sm:inline">下一章</span>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6" /></svg>
            </button>
          </div>
        </header>

        {/* Content */}
        <div ref={contentRef} className="flex-1 overflow-y-auto px-6 py-10">
          <div className="mx-auto max-w-[720px]">
            {/* Chapter header */}
            <div className="mb-8">
              <div className="mb-3 flex items-center gap-3">
                <div
                  className="flex h-11 w-11 items-center justify-center rounded-xl"
                  style={{
                    background: `linear-gradient(135deg, ${chapter.meta.color}, ${chapter.meta.color}cc)`,
                    boxShadow: `0 4px 12px ${chapter.meta.color}30`,
                  }}
                >
                  <span className="text-lg text-white">
                    {chapter.meta.icon === 'BookOpen' && '\u{1F4D6}'}
                    {chapter.meta.icon === 'Layers' && '\u{1F4DA}'}
                    {chapter.meta.icon === 'Search' && '\u{1F50D}'}
                    {chapter.meta.icon === 'Brain' && '\u{1F9E0}'}
                    {chapter.meta.icon === 'Terminal' && '\u{1F4BB}'}
                    {chapter.meta.icon === 'GitBranch' && '\u{1F500}'}
                    {chapter.meta.icon === 'FileText' && '\u{1F4DD}'}
                    {chapter.meta.icon === 'Shield' && '\u{1F6E1}\uFE0F'}
                    {chapter.meta.icon === 'Sparkles' && '\u2728'}
                    {chapter.meta.icon === 'Zap' && '\u26A1'}
                  </span>
                </div>
                <div>
                  <h1 className="text-[28px] font-extrabold leading-tight text-[#0f172a]">
                    {chapter.meta.title}
                  </h1>
                  <div className="mt-0.5 text-sm text-[#64748b]">{chapter.meta.subtitle}</div>
                </div>
              </div>
              <div
                className="h-[3px] w-[60px] rounded-sm"
                style={{ background: `linear-gradient(90deg, ${chapter.meta.color}, transparent)` }}
              />
            </div>

            {/* Chapter body */}
            <div className="text-[15px] leading-[1.9] text-[#334155]">
              {chapter.blocks.map((block, i) => renderBlock(block, i))}
            </div>

            {/* CTA after certain chapters */}
            {CTA_AFTER_CHAPTERS.has(currentIndex) && (
              <div className="my-10">
                <NewsletterSignup variant="inline" lang="zh" />
              </div>
            )}

            {/* Bottom chapter navigation */}
            <ChapterNav
              chapters={chapterMetas}
              currentIndex={currentIndex}
              onPrev={goPrev}
              onNext={goNext}
            />

            {/* Bottom subscribe CTA */}
            <div className="mt-10">
              <NewsletterSignup variant="inline" lang="zh" />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
