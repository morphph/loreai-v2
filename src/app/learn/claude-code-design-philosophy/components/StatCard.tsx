'use client';

interface StatCardProps {
  number: string;
  label: string;
  sub?: string;
}

export default function StatCard({ number, label, sub }: StatCardProps) {
  return (
    <div className="min-w-[140px] flex-1 rounded-xl border border-[#e2e8f0] px-4 py-5 text-center" style={{ background: 'linear-gradient(135deg, #f8fafc, #f1f5f9)' }}>
      <div
        className="text-[32px] font-extrabold"
        style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}
      >
        {number}
      </div>
      <div className="mt-1 text-sm font-semibold text-[#334155]">{label}</div>
      {sub && <div className="mt-0.5 text-xs text-[#94a3b8]">{sub}</div>}
    </div>
  );
}
