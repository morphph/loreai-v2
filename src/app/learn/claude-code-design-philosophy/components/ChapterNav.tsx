'use client';

import type { ChapterMeta } from '../content/chapters';

interface ChapterNavProps {
  chapters: ChapterMeta[];
  currentIndex: number;
  onPrev: () => void;
  onNext: () => void;
}

export default function ChapterNav({ chapters, currentIndex, onPrev, onNext }: ChapterNavProps) {
  const hasPrev = currentIndex > 0;
  const hasNext = currentIndex < chapters.length - 1;

  return (
    <div className="mt-12 flex justify-between border-t border-[#e2e8f0] pt-6">
      {hasPrev ? (
        <button
          onClick={onPrev}
          className="flex items-center gap-2 rounded-xl border border-[#e2e8f0] bg-white px-5 py-3 text-sm transition-colors hover:border-[#cbd5e1]"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6" /></svg>
          <div className="text-left">
            <div className="text-[11px] text-[#94a3b8]">上一章</div>
            <div className="font-semibold text-[#334155]">{chapters[currentIndex - 1].title}</div>
          </div>
        </button>
      ) : (
        <div />
      )}
      {hasNext ? (
        <button
          onClick={onNext}
          className="flex items-center gap-2 rounded-xl px-5 py-3 text-sm text-white transition-opacity hover:opacity-90"
          style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}
        >
          <div className="text-right">
            <div className="text-[11px] opacity-80">下一章</div>
            <div className="font-semibold">{chapters[currentIndex + 1].title}</div>
          </div>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6" /></svg>
        </button>
      ) : (
        <div />
      )}
    </div>
  );
}
