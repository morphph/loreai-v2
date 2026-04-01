'use client';

interface ArchItem {
  label: string;
  icon: string;
  color: string;
}

interface ArchDiagramProps {
  title?: string;
  centerLabel?: string;
  items: ArchItem[];
}

export default function ArchDiagram({ title, centerLabel, items }: ArchDiagramProps) {
  return (
    <div className="my-8 rounded-2xl border border-[#e2e8f0] p-6" style={{ background: 'linear-gradient(135deg, #f8fafc, #f1f5f9)' }}>
      {title && (
        <div className="mb-5 text-center text-[15px] font-bold text-[#475569]">{title}</div>
      )}
      <div className="flex flex-col items-center gap-3">
        {centerLabel && (
          <div
            className="rounded-xl px-8 py-3 text-[15px] font-bold text-white"
            style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', boxShadow: '0 4px 12px rgba(99,102,241,0.3)' }}
          >
            {centerLabel}
          </div>
        )}
        {centerLabel && <div className="h-5 w-0.5 bg-[#cbd5e1]" />}
        <div className="flex max-w-[600px] flex-wrap justify-center gap-3">
          {items.map((item, i) => (
            <div
              key={i}
              className="flex items-center gap-1.5 rounded-lg bg-white px-4 py-2.5 text-[13px] font-semibold text-[#334155]"
              style={{ border: `2px solid ${item.color}`, boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}
            >
              {item.icon && <span className="text-base">{item.icon}</span>}
              {item.label}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
