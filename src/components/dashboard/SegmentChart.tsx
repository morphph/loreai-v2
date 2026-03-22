'use client';

interface Segmentation {
  defending: { count: number; clicks: number };
  page_one: { count: number; clicks: number };
  striking: { count: number; clicks: number };
  building: { count: number };
  long_shot: { count: number };
}

interface Props {
  segmentation: Segmentation | null;
}

const SEGMENTS = [
  { key: 'defending', label: 'Defending (1-3)', color: 'bg-emerald-400' },
  { key: 'page_one', label: 'Page One (4-10)', color: 'bg-blue-400' },
  { key: 'striking', label: 'Striking (11-20)', color: 'bg-amber-400' },
  { key: 'building', label: 'Building (21-50)', color: 'bg-orange-400' },
  { key: 'long_shot', label: 'Long Shot (50+)', color: 'bg-red-400' },
] as const;

export default function SegmentChart({ segmentation }: Props) {
  if (!segmentation) {
    return <p className="text-sm text-muted">No GSC data available.</p>;
  }

  const counts = [
    segmentation.defending.count,
    segmentation.page_one.count,
    segmentation.striking.count,
    segmentation.building.count,
    segmentation.long_shot.count,
  ];
  const maxCount = Math.max(...counts, 1);

  return (
    <div className="space-y-2">
      {SEGMENTS.map((seg, i) => {
        const count = counts[i];
        const pct = (count / maxCount) * 100;
        return (
          <div key={seg.key} className="flex items-center gap-3">
            <div className="w-32 shrink-0 text-xs text-muted">{seg.label}</div>
            <div className="h-5 flex-1 rounded bg-surface">
              <div
                className={`h-full rounded ${seg.color}`}
                style={{ width: `${Math.max(pct, 1)}%`, transition: 'width 0.5s ease' }}
              />
            </div>
            <div className="w-12 shrink-0 text-right text-sm font-medium">{count}</div>
          </div>
        );
      })}
    </div>
  );
}
