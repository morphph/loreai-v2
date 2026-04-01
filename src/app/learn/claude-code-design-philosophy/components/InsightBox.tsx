'use client';

interface InsightBoxProps {
  type: 'insight' | 'warning' | 'key' | 'compare';
  title: string;
  children: React.ReactNode;
}

const styles = {
  insight: { bg: 'bg-[#eff6ff]', border: 'border-[#3b82f6]', icon: '\u{1F4A1}', titleColor: 'text-[#1e40af]' },
  warning: { bg: 'bg-[#fefce8]', border: 'border-[#eab308]', icon: '\u26A0\uFE0F', titleColor: 'text-[#854d0e]' },
  key: { bg: 'bg-[#f0fdf4]', border: 'border-[#22c55e]', icon: '\u{1F511}', titleColor: 'text-[#166534]' },
  compare: { bg: 'bg-[#faf5ff]', border: 'border-[#a855f7]', icon: '\u{1F504}', titleColor: 'text-[#6b21a8]' },
};

export default function InsightBox({ type, title, children }: InsightBoxProps) {
  const s = styles[type];
  return (
    <div className={`my-6 rounded-r-xl border-l-4 ${s.border} ${s.bg} px-6 py-5 leading-[1.8]`}>
      <div className={`mb-2 text-[15px] font-bold ${s.titleColor}`}>
        {s.icon} {title}
      </div>
      <div className="text-[14.5px] text-[#334155]">{children}</div>
    </div>
  );
}
