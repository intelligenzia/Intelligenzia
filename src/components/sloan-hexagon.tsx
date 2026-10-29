'use client';

import { useMemo, useState, useId } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import {
  DISCIPLINES,
  INTERDISCIPLINES,
  disciplineLabel,
  interdisciplineLabel,
  type DisciplineSlug,
} from '@/lib/disciplines';

const CX = 230;
const CY = 200;
const R = 126;

type Point = { x: number; y: number };

function vertexPoint(index: number): Point {
  const angle = ((-90 + index * 60) * Math.PI) / 180;
  return { x: CX + R * Math.cos(angle), y: CY + R * Math.sin(angle) };
}

/** Labels are pushed outward from the centre so they never sit on an edge. */
function labelPlacement(index: number, p: Point) {
  if (index === 0) return { dx: 0, dy: -22, anchor: 'middle' as const };
  if (index === 3) return { dx: 0, dy: 32, anchor: 'middle' as const };
  return {
    dx: p.x > CX ? 16 : -16,
    dy: 4,
    anchor: (p.x > CX ? 'start' : 'end') as 'start' | 'end',
  };
}

type Props = {
  /**
   * Called when a vertex is activated. Surfaces that can filter by discipline
   * pass this; without it the hexagon still pins the vertex internally so the
   * readout is reachable by keyboard as well as pointer.
   */
  onSelect?: (slug: DisciplineSlug) => void;
  /** Externally controlled selection, for surfaces that filter. */
  selected?: DisciplineSlug | null;
  className?: string;
};

export function SloanHexagon({ onSelect, selected, className }: Props) {
  const locale = useLocale();
  const t = useTranslations('hexagon');
  const titleId = useId();
  const [hovered, setHovered] = useState<number | null>(null);
  const [pinned, setPinned] = useState<number | null>(null);

  const points = useMemo(() => DISCIPLINES.map((_, i) => vertexPoint(i)), []);

  // Controlled when `selected` is passed, self-managed otherwise.
  const controlled = selected !== undefined;
  const pinnedIndex = controlled
    ? DISCIPLINES.findIndex((d) => d.slug === selected)
    : (pinned ?? -1);

  // Hover previews; the pin persists so keyboard users get the same readout.
  const active = hovered ?? (pinnedIndex >= 0 ? pinnedIndex : null);
  const engaged = active !== null;

  const activate = (index: number) => {
    onSelect?.(DISCIPLINES[index].slug);
    if (!controlled) setPinned((prev) => (prev === index ? null : index));
  };

  const links = useMemo(
    () =>
      active === null
        ? []
        : INTERDISCIPLINES.filter((e) => e.a === active || e.b === active),
    [active],
  );

  return (
    <div className={className}>
      <div
        className="relative rounded-sm border bg-card p-2"
        onMouseLeave={() => setHovered(null)}
      >
        <svg
          viewBox="0 0 460 400"
          className="block h-auto w-full"
          role="img"
          aria-labelledby={titleId}
        >
          <title id={titleId}>{t('aria')}</title>

          {/* The hexagon itself, as structure. Sloan named no philosophy ×
              computer science interdiscipline, so the ring of named links alone
              never closes — drawing the perimeter separately keeps the shape
              legible without inventing an edge that isn't in the report. */}
          <polygon
            points={points.map((p) => `${p.x},${p.y}`).join(' ')}
            className="fill-none stroke-border"
            strokeWidth={1.25}
          />

          {/* Named interdisciplines on top of the structure. */}
          {INTERDISCIPLINES.map((e, i) => {
            const lit = active !== null && (e.a === active || e.b === active);
            return (
              <line
                key={i}
                x1={points[e.a].x}
                y1={points[e.a].y}
                x2={points[e.b].x}
                y2={points[e.b].y}
                strokeWidth={lit ? 2 : 1.25}
                strokeDasharray={e.emerging ? '3 4' : undefined}
                className={[
                  'fill-none transition-[stroke,stroke-width,opacity] duration-150 motion-reduce:transition-none',
                  lit ? 'stroke-primary' : 'stroke-border',
                  engaged && !lit ? 'opacity-30' : 'opacity-100',
                ].join(' ')}
              />
            );
          })}

          {DISCIPLINES.map((d, i) => {
            const p = points[i];
            const place = labelPlacement(i, p);
            const on = active === i;
            const dimmed = engaged && !on;

            return (
              <g
                key={d.slug}
                tabIndex={0}
                role="button"
                aria-label={`${disciplineLabel(d, locale)} (${
                  locale === 'fi' ? d.en : d.fi
                })`}
                aria-pressed={pinnedIndex === i}
                className="cursor-pointer"
                onMouseEnter={() => setHovered(i)}
                onFocus={() => setHovered(i)}
                onBlur={() => setHovered(null)}
                onClick={() => activate(i)}
                onKeyDown={(ev) => {
                  if (ev.key === 'Enter' || ev.key === ' ') {
                    ev.preventDefault();
                    activate(i);
                  }
                  if (ev.key === 'Escape' && !controlled) setPinned(null);
                }}
              >
                <circle
                  cx={p.x}
                  cy={p.y}
                  r={on ? 7 : 5.5}
                  strokeWidth={1.5}
                  className={[
                    'transition-[fill,stroke,r] duration-150 motion-reduce:transition-none',
                    on
                      ? 'fill-primary stroke-primary'
                      : 'fill-card stroke-foreground',
                    dimmed ? 'opacity-40' : 'opacity-100',
                  ].join(' ')}
                />
                <text
                  x={p.x + place.dx}
                  y={p.y + place.dy}
                  textAnchor={place.anchor}
                  className={[
                    'font-display text-[12.5px] font-semibold transition-[fill,opacity] duration-150 motion-reduce:transition-none',
                    on ? 'fill-primary' : 'fill-foreground',
                    dimmed ? 'opacity-40' : 'opacity-100',
                  ].join(' ')}
                  style={{ fontStretch: '92%' }}
                >
                  {disciplineLabel(d, locale)}
                </text>
                <text
                  x={p.x + place.dx}
                  y={p.y + place.dy + 12}
                  textAnchor={place.anchor}
                  className={[
                    'fill-muted-foreground font-mono text-[9.5px] transition-opacity duration-150 motion-reduce:transition-none',
                    dimmed ? 'opacity-40' : 'opacity-100',
                  ].join(' ')}
                >
                  {locale === 'fi' ? d.en.toLowerCase() : d.fi.toLowerCase()}
                </text>
                {/* Generous invisible hit area — the dot alone is too small a target. */}
                <circle cx={p.x} cy={p.y} r={20} fill="transparent" />
              </g>
            );
          })}
        </svg>
      </div>

      <div
        className="mt-3 flex min-h-19 flex-col gap-1.5 rounded-sm border bg-card p-3"
        aria-live="polite"
      >
        {active === null ? (
          <p className="font-display text-xs text-muted-foreground">{t('hint')}</p>
        ) : (
          <>
            <p className="font-display text-[13px] font-semibold">
              {disciplineLabel(DISCIPLINES[active], locale)}
              {' — '}
              {t('interfaces', { count: links.length })}
            </p>
            <ul className="flex flex-wrap gap-1.5">
              {links.map((e, i) => (
                <li
                  key={i}
                  className={[
                    'rounded-sm border px-1.5 py-0.5 font-mono text-[10.5px] leading-tight text-muted-foreground',
                    e.emerging ? 'border-dashed' : '',
                  ].join(' ')}
                >
                  {interdisciplineLabel(e, locale)}
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
    </div>
  );
}

export default SloanHexagon;
