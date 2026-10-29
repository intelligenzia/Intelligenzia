/**
 * The six disciplines of the Sloan hexagon.
 *
 * The 1978 Sloan Foundation report on the State of the Art in Cognitive Science
 * drew the field as a hexagon: six contributing disciplines at the vertices,
 * and the interdisciplines forming along the edges between them. It is the
 * emblem of the field and it maps onto this site's content, which genuinely
 * spans all six.
 *
 * `slug` is the URL/filter key and is intentionally locale-independent so that
 * a filtered URL survives a locale switch.
 */

export const DISCIPLINE_SLUGS = [
  'philosophy',
  'psychology',
  'linguistics',
  'anthropology',
  'neuroscience',
  'computer-science',
] as const;

export type DisciplineSlug = (typeof DISCIPLINE_SLUGS)[number];

export type Discipline = {
  slug: DisciplineSlug;
  fi: string;
  en: string;
};

/** Ordered clockwise from the top vertex. Order is load-bearing: the hexagon
 *  geometry indexes into this array. */
export const DISCIPLINES: Discipline[] = [
  { slug: 'philosophy', fi: 'Filosofia', en: 'Philosophy' },
  { slug: 'psychology', fi: 'Psykologia', en: 'Psychology' },
  { slug: 'linguistics', fi: 'Kielitiede', en: 'Linguistics' },
  { slug: 'anthropology', fi: 'Antropologia', en: 'Anthropology' },
  { slug: 'neuroscience', fi: 'Neurotiede', en: 'Neuroscience' },
  { slug: 'computer-science', fi: 'Tietojenkäsittely', en: 'Computer Science' },
];

export type Interdiscipline = {
  /** Indices into DISCIPLINES. */
  a: number;
  b: number;
  fi: string;
  en: string;
  /**
   * True where the Sloan report drew the connection as weak or not yet
   * established in 1978. Kept because the gap is the interesting part: the
   * psychology × computer science edge was tentative then and is the centre of
   * gravity of the field now.
   */
  emerging: boolean;
};

/** The eleven interdisciplines Sloan named. The four unlisted vertex pairs are
 *  the ones the report drew no connection between. */
export const INTERDISCIPLINES: Interdiscipline[] = [
  { a: 0, b: 1, fi: 'Mielenfilosofia', en: 'Philosophy of psychology', emerging: false },
  { a: 0, b: 2, fi: 'Kielifilosofia', en: 'Philosophy of language', emerging: false },
  { a: 1, b: 2, fi: 'Psykolingvistiikka', en: 'Psycholinguistics', emerging: false },
  { a: 1, b: 3, fi: 'Kognitiivinen antropologia', en: 'Cognitive anthropology', emerging: true },
  { a: 1, b: 4, fi: 'Neuropsykologia', en: 'Neuropsychology', emerging: false },
  { a: 1, b: 5, fi: 'Tekoäly', en: 'Artificial intelligence', emerging: true },
  { a: 2, b: 3, fi: 'Antropologinen lingvistiikka', en: 'Anthropological linguistics', emerging: false },
  { a: 2, b: 4, fi: 'Neurolingvistiikka', en: 'Neurolinguistics', emerging: true },
  { a: 2, b: 5, fi: 'Laskennallinen lingvistiikka', en: 'Computational linguistics', emerging: false },
  { a: 3, b: 4, fi: 'Aivojen evoluutio', en: 'Brain evolution', emerging: true },
  { a: 4, b: 5, fi: 'Kybernetiikka', en: 'Cybernetics', emerging: false },
];

export function disciplineLabel(d: Discipline, locale: string): string {
  return locale === 'fi' ? d.fi : d.en;
}

export function interdisciplineLabel(i: Interdiscipline, locale: string): string {
  return locale === 'fi' ? i.fi : i.en;
}

export function isDisciplineSlug(value: string): value is DisciplineSlug {
  return (DISCIPLINE_SLUGS as readonly string[]).includes(value);
}
