import type { Metadata } from 'next';

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://intelligenzia.fi';

type Locale = 'fi' | 'en';

/** Absolute URL for a locale-less path. Finnish is the default locale and
 *  lives at the root (`localePrefix: 'as-needed'`); English sits under /en. */
export function localizedUrl(locale: Locale, path: string): string {
  const suffix = path === '/' ? '' : path;
  return locale === 'fi' ? `${baseUrl}${suffix}` : `${baseUrl}/en${suffix}`;
}

/**
 * Canonical + hreflang for a page. Pass only the locales the page really
 * exists in: a missing translation must not be advertised as an alternate.
 *
 * Every indexable page needs to call this. The root layout deliberately sets
 * no canonical, because an inherited one points every page at the homepage.
 */
export function localizedAlternates(
  locale: string,
  paths: Partial<Record<Locale, string>>,
): Metadata['alternates'] {
  const current = (locale === 'en' ? 'en' : 'fi') as Locale;
  const own = paths[current] ?? paths.fi ?? paths.en ?? '/';
  const ownLocale: Locale = paths[current] ? current : paths.fi ? 'fi' : 'en';

  const languages: Record<string, string> = {};
  if (paths.fi) languages.fi = localizedUrl('fi', paths.fi);
  if (paths.en) languages.en = localizedUrl('en', paths.en);
  if (paths.fi && paths.en) languages['x-default'] = localizedUrl('fi', paths.fi);

  return {
    canonical: localizedUrl(ownLocale, own),
    languages,
  };
}

/** Account, auth and admin surfaces: reachable, never indexed. */
export const noIndex: Metadata['robots'] = { index: false, follow: false };
