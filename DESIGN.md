# DESIGN.md — Intelligenzia

> Design brief for intelligenzia.fi. Read order: tokens in `src/app/[locale]/globals.css` → this file.

## 1. Product truth
- **Users:** cognitive science students and alumni of the University of Helsinki, plus people searching for what cognitive science is (in Finnish first, English second). Mostly phone for the glossary and blog, desktop for the long-form pages.
- **Purpose:** keep the alumni community together, sell the yearly membership, and publish the field's Finnish glossary and explainers.
- **Constraints:** bilingual (fi default at `/`, en under `/en`); URL slugs are SEO-load-bearing and stay stable; WCAG AA.
- **Success means:** home → visitor picks a membership or opens the glossary. Long-form pages → reader finishes and follows a related link.
- **Real content available:** `public/blog/*` photos (society events, campus), the blog archive, 125 glossary terms, the Sloan hexagon data in `src/lib/disciplines.ts`.

## 2. Surface types
| Surface | Type | V | M | D |
|---|---|---|---|---|
| Home | persuade | 7 | 5 | 4 |
| Blog index, articles, glossary, explainers | read | 3 | 2 | 5 |
| Join, my membership, login | operate | 3 | 2 | 5 |

## 3. Visual direction and project bans
- Instrument-like, academic, bilingual as structure: term in condensed display, translation in mono, definition in serif.
- The Sloan hexagon is the emblem. It appears once per page: 3D in the home hero, interactive SVG on the field overview (`/kognitiotiede`, `/en/cognitive-science`).
- Bans: eyebrow labels above headings, radial "glow" washes, icon tiles on cards, stock photos of laptops, card grids for lists (use rows with one divider).

## 4. Color tokens
OKLCH tokens live in `globals.css` (the three extra hex values are the 3D canvas fallbacks when a CSS var cannot be read). Primary is the L–M red pole, used for the primary action and current state only.

```design-tokens
fonts: Archivo, Source Serif 4, JetBrains Mono
colors: #ffffff, #000000, #1d2230, #6b7280, #c2334d
radii: 0, 3px, 9999px
```

## 5. Typography
- Display: Archivo at `wdth` 76–86 via `display-hero` / `display-lg` / `display-md`. Titles get `text-balance`.
- Text: Source Serif 4 for long-form and descriptions (`article-body`), `text-pretty`, 52–65ch.
- UI: Archivo at normal width. Mono: JetBrains Mono for dates, prices, English glossary terms only.

## 6. Spacing and layout
- 4px scale. Home sections 80–128px vertical, varied by job (writing denser, membership airier). 12-col grid, 7/5 and 4/8 splits.

## 7. Components
- Radius: controls, cards and media square (`rounded-sm` resolves to 0); `rounded-lg` (3px) for kit inputs. No pills. No shadows except menus and dialogs.
- Lists: rows with a single `border-b`, not cards. Cards only for selectable objects (membership type picker).

## 8. Motion
- Hero hexagon: slow rotation and pointer parallax, paused off-screen, static under `prefers-reduced-motion`.
- One scroll-scrubbed statement on home. Hovers 150–300ms on transform/opacity/filter.

## 9. Imagery and content
- Real society and campus photos only. Facts must come from the content files: prices from `src/lib/membership.ts`, membership terms mirror the join page.

## 10. Decision log
- 2026-10-29 — Moved the interactive Sloan hexagon off the home page to the field overview; home kept the 3D one. Two hexagons two viewports apart read as repetition.
- 2026-10-29 — Replaced the four stock-photo benefit rows with the real offer (two membership types, prices, terms) as the closing section, removing a duplicate join CTA block.
- 2026-10-29 — Blog index became a year-grouped archive with a lead post instead of a 3-column card wall.
