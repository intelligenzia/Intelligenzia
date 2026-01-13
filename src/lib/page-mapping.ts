// Maps URL slugs to content file names for each locale
// Note: jaseneksi/join pages are now handled by dedicated page components, not markdown
export const pageMapping: Record<string, Record<string, string>> = {
  fi: {
    opiskelu: 'opiskelu',
    kognitiotiede: 'kognitiotiede',
    yhdistys: 'yhdistys',
    tapahtumat: 'tapahtumat',
  },
  en: {
    studies: 'studies',
    'cognitive-science': 'cognitive-science',
    organization: 'organization',
    events: 'events',
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
    { href: '/membership', labelKey: 'membership' },
    { href: '/studies', labelKey: 'studies' },
    { href: '/cognitive-science', labelKey: 'cognitiveScience' },
    { href: '/organization', labelKey: 'organization' },
    { href: '/blog', labelKey: 'blog' },
  ],
} as const;
