import { ImageResponse } from 'next/og';
import { readFile } from 'fs/promises';
import { join } from 'path';

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

  // Read the logo file
  const logoPath = join(process.cwd(), 'public', 'icon.png');
  const logoData = await readFile(logoPath);
  const logoBase64 = `data:image/png;base64,${logoData.toString('base64')}`;

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
        {/* Logo */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 40,
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={logoBase64}
            alt="Intelligenzia logo"
            width={180}
            height={180}
            style={{
              objectFit: 'contain',
            }}
          />
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
