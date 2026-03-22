'use client';

interface Anomaly {
  type: string;
  priority: string;
  query: string;
  position: number;
  impressions: number;
  ctr: number;
  suggested_action: string;
}

interface Props {
  anomalies: Anomaly[];
}

const PRIORITY_BADGE: Record<string, string> = {
  A: 'bg-red-500/20 text-red-400',
  B: 'bg-amber-500/20 text-amber-400',
  C: 'bg-blue-500/20 text-blue-400',
  D: 'bg-muted/20 text-muted',
};

const TYPE_LABELS: Record<string, string> = {
  high_impressions_low_ctr: 'Low CTR',
  high_ctr_low_impressions: 'Low Volume',
  position_dropping: 'Dropping',
};

export default function AnomalyTable({ anomalies }: Props) {
  if (anomalies.length === 0) {
    return <p className="text-sm text-muted">No anomalies detected.</p>;
  }

  const top = anomalies.slice(0, 10);

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border text-left text-xs text-muted">
            <th className="pb-2 pr-3">Priority</th>
            <th className="pb-2 pr-3">Query</th>
            <th className="pb-2 pr-3">Type</th>
            <th className="pb-2 pr-3 text-right">Pos</th>
            <th className="pb-2 pr-3 text-right">Imp</th>
            <th className="pb-2 text-right">CTR</th>
          </tr>
        </thead>
        <tbody>
          {top.map((a, i) => (
            <tr key={i} className="border-b border-border/50">
              <td className="py-2 pr-3">
                <span className={`inline-block rounded px-1.5 py-0.5 text-xs font-medium ${PRIORITY_BADGE[a.priority] ?? 'text-muted'}`}>
                  {a.priority}
                </span>
              </td>
              <td className="py-2 pr-3 font-medium" title={a.suggested_action}>
                {a.query}
              </td>
              <td className="py-2 pr-3 text-xs text-muted">
                {TYPE_LABELS[a.type] ?? a.type}
              </td>
              <td className="py-2 pr-3 text-right">{a.position.toFixed(1)}</td>
              <td className="py-2 pr-3 text-right">{a.impressions.toLocaleString()}</td>
              <td className="py-2 text-right">{(a.ctr * 100).toFixed(1)}%</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
