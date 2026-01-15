import { ImageResponse } from 'next/og';

export const runtime = 'edge';

export const alt = 'Intelligenzia – Kognitiotieteen alumnijärjestö';
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = 'image/png';

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#ffffff',
          fontFamily: 'system-ui, sans-serif',
        }}
      >
        {/* Logo placeholder - brain with circuits */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 40,
          }}
        >
          <svg
            width="150"
            height="150"
            viewBox="0 0 512 512"
            fill="none"
            style={{ marginRight: 30 }}
          >
            {/* Simplified brain icon */}
            <circle cx="256" cy="256" r="240" fill="#1a1a1a" />
            <path
              d="M180 200 Q200 150 260 160 Q320 170 340 220 Q360 270 340 320 Q320 370 260 380 Q200 390 180 340 Q160 290 180 240 Z"
              fill="#ffffff"
            />
            <path
              d="M220 180 L220 140 M260 160 L280 120 M300 180 L340 150"
              stroke="#ffffff"
              strokeWidth="8"
            />
            <circle cx="220" cy="260" r="20" fill="#1a1a1a" />
            <circle cx="280" cy="240" r="15" fill="#1a1a1a" />
            <circle cx="260" cy="300" r="18" fill="#1a1a1a" />
            <path
              d="M220 260 L280 240 M280 240 L260 300 M260 300 L220 260"
              stroke="#1a1a1a"
              strokeWidth="3"
            />
          </svg>
        </div>

        {/* Title */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
          }}
        >
          <h1
            style={{
              fontSize: 72,
              fontWeight: 700,
              color: '#1a1a1a',
              margin: 0,
              letterSpacing: '-2px',
            }}
          >
            Intelligenzia
          </h1>
          <p
            style={{
              fontSize: 32,
              color: '#666666',
              margin: '16px 0 0 0',
              fontWeight: 400,
            }}
          >
            Kognitiotieteen alumnijärjestö
          </p>
          <p
            style={{
              fontSize: 24,
              color: '#999999',
              margin: '12px 0 0 0',
            }}
          >
            Est. 1989 • Helsinki
          </p>
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
