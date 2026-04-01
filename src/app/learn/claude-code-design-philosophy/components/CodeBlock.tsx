'use client';

interface CodeBlockProps {
  code: string;
  filename?: string;
  language?: string;
  annotation?: string;
}

export default function CodeBlock({ code, filename, language = 'typescript', annotation }: CodeBlockProps) {
  return (
    <div className="my-6 overflow-hidden rounded-xl border border-[#1e293b] bg-[#0f172a]">
      {filename && (
        <div className="flex items-center gap-2 border-b border-[#334155] bg-[#1e293b] px-4 py-2.5 text-[13px] text-[#94a3b8]">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="16 18 22 12 16 6" /><polyline points="8 6 2 12 8 18" /></svg>
          <span>{filename}</span>
          {language && (
            <span className="ml-auto rounded bg-[#0f172a] px-2 py-0.5 text-[11px] text-[#64748b]">
              {language}
            </span>
          )}
        </div>
      )}
      <pre className="m-0 overflow-x-auto p-4 text-[13px] leading-[1.7] text-[#e2e8f0]" style={{ fontFamily: "var(--font-geist-mono), 'SF Mono', 'Fira Code', monospace" }}>
        <code>{code}</code>
      </pre>
      {annotation && (
        <div className="border-t border-[#334155] bg-[#1a1a2e] px-4 py-3 text-[13px] leading-relaxed text-[#a5b4fc]">
          {annotation}
        </div>
      )}
    </div>
  );
}
