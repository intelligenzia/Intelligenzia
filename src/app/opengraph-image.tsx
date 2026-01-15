import { ImageResponse } from 'next/og';
import { readFile } from 'fs/promises';
import { join } from 'path';

export const alt = 'Intelligenzia – Kognitiotieteen alumnijärjestö';
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = 'image/png';

export default async function Image() {
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
