import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt = 'LoreAI - Your Daily AI Briefing';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function OGImage() {
  return new ImageResponse(
    (
      <div
        style={{
          background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 50%, #16213e 100%)',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'system-ui, sans-serif',
        }}
      >
        <div
          style={{
            fontSize: 80,
            fontWeight: 700,
            color: '#ffffff',
            letterSpacing: '-0.03em',
            marginBottom: 16,
          }}
        >
          LoreAI
        </div>
        <div
          style={{
            fontSize: 32,
            color: '#9ca3af',
            letterSpacing: '-0.01em',
          }}
        >
          Your Daily AI Briefing
        </div>
        <div
          style={{
            marginTop: 40,
            fontSize: 20,
            color: '#3b82f6',
            display: 'flex',
            gap: 24,
          }}
        >
          <span>Models</span>
          <span style={{ color: '#4b5563' }}>|</span>
          <span>Tools</span>
          <span style={{ color: '#4b5563' }}>|</span>
          <span>Code</span>
          <span style={{ color: '#4b5563' }}>|</span>
          <span>Trends</span>
        </div>
      </div>
    ),
    { ...size }
  );
}
