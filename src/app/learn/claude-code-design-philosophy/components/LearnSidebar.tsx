'use client';

import type { ChapterMeta } from '../content/chapters';

interface LearnSidebarProps {
  chapters: ChapterMeta[];
  currentId: string;
  onSelect: (id: string) => void;
  open: boolean;
  onClose: () => void;
}

export default function LearnSidebar({ chapters, currentId, onSelect, open, onClose }: LearnSidebarProps) {
  return (
    <>
      {/* Mobile overlay */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/40 md:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed left-0 top-0 z-50 flex h-screen w-[280px] min-w-[280px] flex-col border-r border-[#e2e8f0] bg-[#f8fafc] transition-transform duration-200 md:relative md:z-auto md:translate-x-0 ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Logo */}
        <div className="border-b border-[#e2e8f0] px-5 py-4">
          <div className="flex items-center gap-2.5">
            <div
              className="flex h-9 w-9 items-center justify-center rounded-[10px]"
              style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="4" width="16" height="16" rx="2" ry="2" /><rect x="9" y="9" width="6" height="6" /><line x1="9" y1="1" x2="9" y2="4" /><line x1="15" y1="1" x2="15" y2="4" /><line x1="9" y1="20" x2="9" y2="23" /><line x1="15" y1="20" x2="15" y2="23" /><line x1="20" y1="9" x2="23" y2="9" /><line x1="20" y1="14" x2="23" y2="14" /><line x1="1" y1="9" x2="4" y2="9" /><line x1="1" y1="14" x2="4" y2="14" /></svg>
            </div>
            <div>
              <div className="text-[15px] font-bold text-[#1e293b]">Claude Code 设计哲学</div>
              <div className="text-[11px] text-[#94a3b8]">从51万行源码中学到什么</div>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto px-2 py-3">
          {chapters.map((ch) => {
            const isActive = ch.id === currentId;
            return (
              <button
                key={ch.id}
                onClick={() => onSelect(ch.id)}
                className="mb-0.5 flex w-full items-center gap-3 rounded-[10px] px-3 py-2.5 text-left transition-colors"
                style={{ background: isActive ? `${ch.color}12` : 'transparent' }}
              >
                <div
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-colors"
                  style={{ background: isActive ? ch.color : '#e2e8f0' }}
                >
                  <span className="text-xs" style={{ color: isActive ? 'white' : '#94a3b8' }}>
                    {ch.icon === 'BookOpen' && '\u{1F4D6}'}
                    {ch.icon === 'Layers' && '\u{1F4DA}'}
                    {ch.icon === 'Search' && '\u{1F50D}'}
                    {ch.icon === 'Brain' && '\u{1F9E0}'}
                    {ch.icon === 'Terminal' && '\u{1F4BB}'}
                    {ch.icon === 'GitBranch' && '\u{1F500}'}
                    {ch.icon === 'FileText' && '\u{1F4DD}'}
                    {ch.icon === 'Shield' && '\u{1F6E1}\uFE0F'}
                    {ch.icon === 'Sparkles' && '\u2728'}
                    {ch.icon === 'Zap' && '\u26A1'}
                  </span>
                </div>
                <div>
                  <div
                    className="text-[13px] transition-colors"
                    style={{ fontWeight: isActive ? 700 : 500, color: isActive ? ch.color : '#475569' }}
                  >
                    {ch.title}
                  </div>
                  <div className="text-[11px] text-[#94a3b8]">{ch.subtitle}</div>
                </div>
              </button>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="border-t border-[#e2e8f0] px-4 py-3 text-center text-[11px] text-[#94a3b8]">
          基于 Claude Code v2.1.88 泄漏源码分析
        </div>
      </aside>
    </>
  );
}
