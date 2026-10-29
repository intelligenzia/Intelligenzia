import { ImageResponse } from 'next/og';
import { readFile } from 'fs/promises';
import { extname, join } from 'path';
import { DISCIPLINES, INTERDISCIPLINES } from '@/lib/disciplines';

export const ogImageSize = {
  width: 1200,
  height: 630,
};

export const ogImageContentType = 'image/png';

// The site's own palette, flattened to hex for Satori (no oklch support).
const PAPER = '#f6f7f9';
const INK = '#1b1e29';
const MUTED = '#6b7083';
const RULE = '#dfe2e8';
const RED = '#c4304f';

interface OgImageProps {
  title: string;
  description?: string;
  /** Where the page sits, shown after the domain: "Blogi", "Sanasto"… */
  section?: string;
  /** A file under /public (e.g. "/blog/cover.jpeg") shown on the right. */
  image?: string;
}

const fontFile = (name: string) =>
  readFile(join(process.cwd(), 'src/assets/og-fonts', `${name}.woff`));

// Static instances of the site's three families; Satori can't use the
// variable fonts next/font serves, so the condensed display cut is its own file.
let fontsPromise: Promise<
  { name: string; data: Buffer; weight: 400 | 500 | 600 | 800; style: 'normal' }[]
> | null = null;
function loadFonts() {
  fontsPromise ??= Promise.all([
    fontFile('archivo-condensed-800'),
    fontFile('archivo-600'),
    fontFile('source-serif-4-400'),
    fontFile('jetbrains-mono-500'),
  ]).then(([display, ui, serif, mono]) => [
    { name: 'Archivo Condensed', data: display, weight: 800, style: 'normal' },
    { name: 'Archivo', data: ui, weight: 600, style: 'normal' },
    { name: 'Source Serif 4', data: serif, weight: 400, style: 'normal' },
    { name: 'JetBrains Mono', data: mono, weight: 500, style: 'normal' },
  ]);
  return fontsPromise;
}

async function publicFileAsDataUrl(path: string): Promise<string | null> {
  try {
    const data = await readFile(join(process.cwd(), 'public', path));
    const ext = extname(path).toLowerCase();
    const mime = ext === '.png' ? 'image/png' : ext === '.webp' ? 'image/webp' : 'image/jpeg';
    return `data:${mime};base64,${data.toString('base64')}`;
  } catch {
    return null;
  }
}

function truncate(text: string, max: number) {
  if (text.length <= max) return text;
  const cut = text.slice(0, max);
  return `${cut.slice(0, cut.lastIndexOf(' ')).replace(/[,.:;–-]+$/, '')}…`;
}

/** The Sloan hexagon, the site's emblem, for cards without a photo. */
function Hexagon() {
  const cx = 215;
  const cy = 315;
  const r = 150;
  const pts = DISCIPLINES.map((_, i) => {
    const a = ((-90 + i * 60) * Math.PI) / 180;
    return { x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) };
  });
  return (
    <svg width="430" height="630" viewBox="0 0 430 630">
      <polygon
        points={pts.map((p) => `${p.x},${p.y}`).join(' ')}
        fill="none"
        stroke={INK}
        strokeWidth="2"
      />
      {INTERDISCIPLINES.map((e, i) => (
        <line
          key={i}
          x1={pts[e.a].x}
          y1={pts[e.a].y}
          x2={pts[e.b].x}
          y2={pts[e.b].y}
          stroke={e.emerging ? MUTED : INK}
          strokeOpacity={e.emerging ? 0.6 : 0.35}
          strokeWidth="1.5"
          strokeDasharray={e.emerging ? '5 7' : undefined}
        />
      ))}
      {pts.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r="9" fill={i === 0 ? RED : INK} />
      ))}
    </svg>
  );
}

export async function generateOgImage({ title, description, section, image }: OgImageProps) {
  const [fonts, logo, photo] = await Promise.all([
    loadFonts(),
    publicFileAsDataUrl('/icon.png'),
    image ? publicFileAsDataUrl(image) : Promise.resolve(null),
  ]);

  const titleSize = title.length <= 26 ? 92 : title.length <= 46 ? 74 : 60;
  const text = description ? truncate(description, photo ? 110 : 140) : undefined;

  return new ImageResponse(
    (
      <div
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          backgroundColor: PAPER,
          color: INK,
        }}
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            width: photo ? 730 : 770,
            padding: '56px 0 52px 72px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            {logo && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={logo} alt="" width={40} height={40} />
            )}
            <span style={{ fontFamily: 'Archivo', fontWeight: 600, fontSize: 28 }}>
              Intelligenzia
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 24, paddingRight: 24 }}>
            <span
              style={{
                fontFamily: 'Archivo Condensed',
                fontWeight: 800,
                fontSize: titleSize,
                lineHeight: 1.0,
                letterSpacing: '-0.01em',
              }}
            >
              {title}
            </span>
            {text && (
              <span
                style={{
                  fontFamily: 'Source Serif 4',
                  fontSize: 28,
                  lineHeight: 1.4,
                  color: MUTED,
                }}
              >
                {text}
              </span>
            )}
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 16,
              borderTop: `2px solid ${RULE}`,
              paddingTop: 20,
              marginRight: 24,
              fontFamily: 'JetBrains Mono',
              fontSize: 22,
              color: MUTED,
            }}
          >
            <span>intelligenzia.fi</span>
            {section && <span style={{ color: RED }}>{section}</span>}
          </div>
        </div>

        {photo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={photo}
            alt=""
            width={470}
            height={630}
            style={{ objectFit: 'cover', width: 470, height: 630 }}
          />
        ) : (
          <div style={{ display: 'flex', borderLeft: `2px solid ${RULE}` }}>
            <Hexagon />
          </div>
        )}
      </div>
    ),
    {
      ...ogImageSize,
      fonts,
    }
  );
}
