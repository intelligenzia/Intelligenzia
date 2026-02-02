import { ImageResponse } from 'next/og';
import { readFile } from 'fs/promises';
import { join } from 'path';

export const ogImageSize = {
  width: 1200,
  height: 630,
};

export const ogImageContentType = 'image/png';

interface OgImageProps {
  title: string;
  description?: string;
  siteUrl?: string;
}

export async function generateOgImage({ title, description, siteUrl = 'intelligenzia.fi' }: OgImageProps) {
  // Read the logo file
  const logoPath = join(process.cwd(), 'public', 'icon.png');
  const logoData = await readFile(logoPath);
  const logoBase64 = `data:image/png;base64,${logoData.toString('base64')}`;

  // Truncate description if too long
  const truncatedDescription = description
    ? description.length > 120
      ? description.slice(0, 117) + '...'
      : description
    : undefined;

  return new ImageResponse(
    (
      <div
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          backgroundColor: '#ffffff',
          fontFamily: 'system-ui, -apple-system, sans-serif',
          padding: 60,
        }}
      >
        {/* Left content */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            flex: 1,
            paddingRight: 60,
          }}
        >
          {/* Site URL */}
          <p
            style={{
              fontSize: 24,
              color: '#6b7280',
              margin: 0,
              marginBottom: 24,
              fontWeight: 500,
            }}
          >
            {siteUrl}
          </p>

          {/* Title */}
          <h1
            style={{
              fontSize: title.length > 40 ? 48 : 56,
              fontWeight: 700,
              color: '#111827',
              margin: 0,
              lineHeight: 1.2,
              letterSpacing: '-1px',
            }}
          >
            {title}
          </h1>

          {/* Description */}
          {truncatedDescription && (
            <p
              style={{
                fontSize: 26,
                color: '#6b7280',
                margin: 0,
                marginTop: 24,
                lineHeight: 1.5,
              }}
            >
              {truncatedDescription}
            </p>
          )}
        </div>

        {/* Right - Logo */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 200,
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={logoBase64}
            alt="Intelligenzia"
            width={160}
            height={160}
            style={{
              objectFit: 'contain',
            }}
          />
        </div>
      </div>
    ),
    {
      ...ogImageSize,
    }
  );
}
