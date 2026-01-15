import { ImageResponse } from 'next/og';

export const runtime = 'edge';

export const alt = 'Intelligenzia – Kognitiotieteen alumnijärjestö';
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = 'image/png';

export default async function Image({ params }: { params: { locale: string } }) {
  const locale = params.locale;
  const isEnglish = locale === 'en';

  const title = 'Intelligenzia';
  const subtitle = isEnglish
    ? 'Cognitive Science Alumni Association'
    : 'Kognitiotieteen alumnijärjestö';
  const tagline = isEnglish
    ? 'Est. 1989 • University of Helsinki'
    : 'Per. 1989 • Helsingin yliopisto';

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
        {/* Abstract brain/network visualization */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 40,
          }}
        >
          <svg width="120" height="120" viewBox="0 0 100 100" fill="none">
            {/* Network nodes representing cognitive science */}
            <circle cx="50" cy="20" r="8" fill="#1a1a1a" />
            <circle cx="20" cy="50" r="8" fill="#1a1a1a" />
            <circle cx="80" cy="50" r="8" fill="#1a1a1a" />
            <circle cx="35" cy="80" r="8" fill="#1a1a1a" />
            <circle cx="65" cy="80" r="8" fill="#1a1a1a" />
            <circle cx="50" cy="50" r="12" fill="#1a1a1a" />
            {/* Connections */}
            <line x1="50" y1="20" x2="50" y2="50" stroke="#1a1a1a" strokeWidth="2" />
            <line x1="20" y1="50" x2="50" y2="50" stroke="#1a1a1a" strokeWidth="2" />
            <line x1="80" y1="50" x2="50" y2="50" stroke="#1a1a1a" strokeWidth="2" />
            <line x1="35" y1="80" x2="50" y2="50" stroke="#1a1a1a" strokeWidth="2" />
            <line x1="65" y1="80" x2="50" y2="50" stroke="#1a1a1a" strokeWidth="2" />
            <line x1="20" y1="50" x2="35" y2="80" stroke="#1a1a1a" strokeWidth="1.5" />
            <line x1="80" y1="50" x2="65" y2="80" stroke="#1a1a1a" strokeWidth="1.5" />
            <line x1="35" y1="80" x2="65" y2="80" stroke="#1a1a1a" strokeWidth="1.5" />
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
              fontSize: 80,
              fontWeight: 700,
              color: '#1a1a1a',
              margin: 0,
              letterSpacing: '-3px',
            }}
          >
            {title}
          </h1>
          <p
            style={{
              fontSize: 36,
              color: '#444444',
              margin: '20px 0 0 0',
              fontWeight: 500,
            }}
          >
            {subtitle}
          </p>
          <p
            style={{
              fontSize: 24,
              color: '#888888',
              margin: '16px 0 0 0',
            }}
          >
            {tagline}
          </p>
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
