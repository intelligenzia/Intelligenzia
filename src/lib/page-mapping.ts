// Maps URL slugs to content file names for each locale
// Note: jaseneksi/join pages are now handled by dedicated page components, not markdown
export const pageMapping: Record<string, Record<string, string>> = {
  fi: {
    opiskelu: 'opiskelu',
    kognitiotiede: 'kognitiotiede',
    yhdistys: 'yhdistys',
    tapahtumat: 'tapahtumat',
    tietosuoja: 'tietosuoja',
    // New SEO pages
    'kognitiotiede-suomessa': 'kognitiotiede-suomessa',
    'kognitiotieteen-historia': 'kognitiotieteen-historia',
    'mita-on-kognitiotiede': 'mita-on-kognitiotiede',
    'suomalaiset-kognitiotieteilijat': 'suomalaiset-kognitiotieteilijat',
    'kognitiotiede-helsingin-yliopisto': 'kognitiotiede-helsingin-yliopisto',
    'kognitiotiede-aalto': 'kognitiotiede-aalto',
    'kognitiivinen-psykologia': 'kognitiivinen-psykologia',
    'neurotiede-ja-kognitio': 'neurotiede-ja-kognitio',
    'tietoisuus-kognitiotiede': 'tietoisuus-kognitiotiede',
    'tekoaly-ja-kognitiotiede': 'tekoaly-ja-kognitiotiede',
    'kognitiotieteen-opiskelu': 'kognitiotieteen-opiskelu',
    'kognitiotieteen-urat': 'kognitiotieteen-urat',
    'kognitiotieteen-kasitteet': 'kognitiotieteen-kasitteet',
    'kognitiotiede-vs-psykologia': 'kognitiotiede-vs-psykologia',
  },
  en: {
    studies: 'studies',
    'cognitive-science': 'cognitive-science',
    organization: 'organization',
    events: 'events',
    'privacy-policy': 'privacy-policy',
    // New SEO pages
    'cognitive-science-in-finland': 'cognitive-science-in-finland',
    'history-of-cognitive-science': 'history-of-cognitive-science',
    'what-is-cognitive-science': 'what-is-cognitive-science',
    'finnish-cognitive-scientists': 'finnish-cognitive-scientists',
    'cognitive-science-university-of-helsinki': 'cognitive-science-university-of-helsinki',
    'cognitive-science-aalto-university': 'cognitive-science-aalto-university',
    'cognitive-psychology': 'cognitive-psychology',
    'neuroscience-and-cognition': 'neuroscience-and-cognition',
    'consciousness-cognitive-science': 'consciousness-cognitive-science',
    'ai-and-cognitive-science': 'ai-and-cognitive-science',
    'study-cognitive-science-finland': 'study-cognitive-science-finland',
    'cognitive-science-careers': 'cognitive-science-careers',
    'cognitive-science-concepts': 'cognitive-science-concepts',
    'cognitive-science-vs-psychology': 'cognitive-science-vs-psychology',
  },
};

// Get all valid page slugs for a locale
export function getPageSlugs(locale: string): string[] {
  return Object.keys(pageMapping[locale] || {});
}

// Get content file name from URL slug
export function getContentSlug(locale: string, urlSlug: string): string | null {
  return pageMapping[locale]?.[urlSlug] || null;
}

// Cross-locale slug mapping: Finnish URL slug -> English URL slug
// Used for generating hreflang alternates
export const fiToEnPageSlug: Record<string, string> = {
  opiskelu: 'studies',
  kognitiotiede: 'cognitive-science',
  yhdistys: 'organization',
  tapahtumat: 'events',
  tietosuoja: 'privacy-policy',
  'kognitiotiede-suomessa': 'cognitive-science-in-finland',
  'kognitiotieteen-historia': 'history-of-cognitive-science',
  'mita-on-kognitiotiede': 'what-is-cognitive-science',
  'suomalaiset-kognitiotieteilijat': 'finnish-cognitive-scientists',
  'kognitiotiede-helsingin-yliopisto': 'cognitive-science-university-of-helsinki',
  'kognitiotiede-aalto': 'cognitive-science-aalto-university',
  'kognitiivinen-psykologia': 'cognitive-psychology',
  'neurotiede-ja-kognitio': 'neuroscience-and-cognition',
  'tietoisuus-kognitiotiede': 'consciousness-cognitive-science',
  'tekoaly-ja-kognitiotiede': 'ai-and-cognitive-science',
  'kognitiotieteen-opiskelu': 'study-cognitive-science-finland',
  'kognitiotieteen-urat': 'cognitive-science-careers',
  'kognitiotieteen-kasitteet': 'cognitive-science-concepts',
  'kognitiotiede-vs-psykologia': 'cognitive-science-vs-psychology',
};

// Reverse mapping: English URL slug -> Finnish URL slug
export const enToFiPageSlug: Record<string, string> = Object.fromEntries(
  Object.entries(fiToEnPageSlug).map(([fi, en]) => [en, fi])
);

// Get the alternate locale slug for a given slug
export function getAlternateSlug(locale: string, slug: string): string | null {
  if (locale === 'fi') {
    return fiToEnPageSlug[slug] || null;
  }
  return enToFiPageSlug[slug] || null;
}

// Navigation items with locale-specific URLs
export const navItems = {
  fi: [
    { href: '/jaseneksi', labelKey: 'membership' },
    { href: '/opiskelu', labelKey: 'studies' },
    { href: '/kognitiotiede', labelKey: 'cognitiveScience' },
    { href: '/yhdistys', labelKey: 'organization' },
    { href: '/blogi', labelKey: 'blog' },
  ],
  en: [
    { href: '/join', labelKey: 'membership' },
    { href: '/studies', labelKey: 'studies' },
    { href: '/cognitive-science', labelKey: 'cognitiveScience' },
    { href: '/organization', labelKey: 'organization' },
    { href: '/blog', labelKey: 'blog' },
  ],
} as const;
