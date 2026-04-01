'use client';

interface Layer {
  title: string;
  desc: string;
  color: string;
}

interface LayerDiagramProps {
  layers: Layer[];
}

export default function LayerDiagram({ layers }: LayerDiagramProps) {
  return (
    <div className="my-8 flex flex-col items-center gap-0">
      {layers.map((layer, i) => (
        <div key={i} className="w-full max-w-[520px]">
          <div
            className="px-6 py-4"
            style={{
              background: `linear-gradient(135deg, ${layer.color}15, ${layer.color}08)`,
              border: `2px solid ${layer.color}40`,
              borderRadius: i === 0 ? '16px 16px 0 0' : i === layers.length - 1 ? '0 0 16px 16px' : 0,
              borderTop: i > 0 ? 'none' : undefined,
            }}
          >
            <div className="mb-1 text-[13px] font-bold" style={{ color: layer.color }}>
              {layer.title}
            </div>
            <div className="text-[13px] leading-relaxed text-[#64748b]">{layer.desc}</div>
          </div>
        </div>
      ))}
    </div>
  );
}
