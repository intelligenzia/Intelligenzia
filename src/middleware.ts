import createMiddleware from 'next-intl/middleware';
import { NextRequest, NextResponse } from 'next/server';
import { routing } from './i18n/routing';

// Legacy blog post slugs that need to be redirected
const legacyBlogSlugs = [
  'avoin-kirje-dekaanille',
  'tiedote-kognitiotieteilijoille',
  'psykologia-ja-kognitiotiede',
  'tiedote-kognitiotieteen-tilasta',
  'mita-kognitiotiede-voi-antaa-digihumanismille',
  'intelligenzian-ryhmamentorointi',
  'kilpikonnari-kiittaa',
  'cognitive-science-courses',
  'haikugeneraattori',
  'kognitiotiede-humanistiseen',
  'uuden-koulutusohjelman-perustaminen-kannattaa',
  'intelligenzian-jasenyys-avautuu-kaikille-opiskelijoille',
  'kognitiotieteeseen-toinen-yliopistonlehtori-valonpilkahduksia-tulevaisuudesta',
  'kognitiotieteelle-perustettu-oma-maisteriopintosuunta',
  'maisteriohjelman-haku-on-auki',
  'salainen-tiedekunta-sovellus',
];

// Legacy page paths that need redirects
// NOTE: Paths like /kognitiotiede, /opiskelu, /yhdistys, /jaseneksi, /kirjaudu, /tapahtumat
// are VALID routes handled by the [slug] page or dedicated pages with localePrefix: 'as-needed'
// so we should NOT redirect them - next-intl handles the locale prefix automatically
const legacyPagePaths: Record<string, string> = {
  // URL-encoded Finnish characters (ä -> %C3%A4) -> ASCII version
  '/j%C3%A4seneksi': '/jaseneksi',
};

// Other legacy paths that need redirects
const legacyPaths: Record<string, string> = {
  '/ajankohtaista': '/',
  '/tietosuoja': '/fi',
  '/search': '/',
  '/category': '/',
};

// Cross-locale slug mapping: Finnish slug -> English slug
// Used to redirect /en/kognitiotiede -> /en/cognitive-science
const fiToEnSlugMapping: Record<string, string> = {
  kognitiotiede: 'cognitive-science',
  opiskelu: 'studies',
  yhdistys: 'organization',
  tapahtumat: 'events',
  jaseneksi: 'join',
  blogi: 'blog',
};

// Reverse mapping: English slug -> Finnish slug
// Used to redirect /fi/cognitive-science -> /kognitiotiede
const enToFiSlugMapping: Record<string, string> = Object.fromEntries(
  Object.entries(fiToEnSlugMapping).map(([fi, en]) => [en, fi])
);

const intlMiddleware = createMiddleware(routing);

export default function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Remove trailing slash for comparison
  const cleanPath = pathname.endsWith('/') && pathname !== '/'
    ? pathname.slice(0, -1)
    : pathname;

  // Check for legacy blog post URLs (including URL-encoded Finnish characters)
  // Handle both 'intelligenzian-jasenyys' and 'intelligenzian-jäsenyys' (URL-encoded)
  const decodedPath = decodeURIComponent(cleanPath);

  for (const slug of legacyBlogSlugs) {
    if (cleanPath === `/${slug}` || cleanPath.startsWith(`/${slug}/`) ||
        decodedPath === `/${slug.replace('jasenyys', 'jäsenyys')}` ||
        decodedPath.startsWith(`/${slug.replace('jasenyys', 'jäsenyys')}/`)) {
      const url = request.nextUrl.clone();
      url.pathname = `/fi/blogi/${slug}`;
      return NextResponse.redirect(url, 308);
    }
  }

  // Check for legacy page paths
  if (legacyPagePaths[cleanPath]) {
    const url = request.nextUrl.clone();
    url.pathname = legacyPagePaths[cleanPath];
    return NextResponse.redirect(url, 308);
  }

  // Check for URL-encoded paths (Finnish characters)
  const decodedCleanPath = decodeURIComponent(cleanPath);
  if (decodedCleanPath !== cleanPath) {
    // Check jäseneksi with Finnish ä
    if (decodedCleanPath === '/jäseneksi') {
      const url = request.nextUrl.clone();
      url.pathname = '/fi/jaseneksi';
      return NextResponse.redirect(url, 308);
    }
    // Check intelligenzian-jäsenyys-avautuu... with Finnish ä
    if (decodedCleanPath.includes('intelligenzian-jäsenyys-avautuu')) {
      const url = request.nextUrl.clone();
      url.pathname = '/fi/blogi/intelligenzian-jasenyys-avautuu-kaikille-opiskelijoille';
      return NextResponse.redirect(url, 308);
    }
  }

  // Check for legacy paths
  if (legacyPaths[cleanPath]) {
    const url = request.nextUrl.clone();
    url.pathname = legacyPaths[cleanPath];
    return NextResponse.redirect(url, 308);
  }

  // Check for category pages
  if (cleanPath.startsWith('/category')) {
    const url = request.nextUrl.clone();
    url.pathname = '/';
    return NextResponse.redirect(url, 308);
  }

  // Check for ajankohtaista subpaths
  if (cleanPath.startsWith('/ajankohtaista')) {
    const url = request.nextUrl.clone();
    url.pathname = '/';
    return NextResponse.redirect(url, 308);
  }

  // Handle cross-locale slug redirects
  // e.g., /en/kognitiotiede -> /en/cognitive-science
  // e.g., /fi/cognitive-science -> /cognitive-science (fi is default, no prefix needed)
  const enMatch = cleanPath.match(/^\/en\/([^/]+)(\/.*)?$/);
  if (enMatch) {
    const slug = enMatch[1];
    const rest = enMatch[2] || '';
    if (fiToEnSlugMapping[slug]) {
      const url = request.nextUrl.clone();
      url.pathname = `/en/${fiToEnSlugMapping[slug]}${rest}`;
      return NextResponse.redirect(url, 308);
    }
  }

  // Handle /fi/ prefix with English slugs -> redirect to Finnish slugs (without /fi/ since it's default)
  const fiMatch = cleanPath.match(/^\/fi\/([^/]+)(\/.*)?$/);
  if (fiMatch) {
    const slug = fiMatch[1];
    const rest = fiMatch[2] || '';
    if (enToFiSlugMapping[slug]) {
      const url = request.nextUrl.clone();
      // Finnish is default locale, so no /fi/ prefix needed
      url.pathname = `/${enToFiSlugMapping[slug]}${rest}`;
      return NextResponse.redirect(url, 308);
    }
  }

  // Default to intl middleware
  return intlMiddleware(request);
}

export const config = {
  matcher: [
    // Match all pathnames except for
    // - ... if they start with `/api`, `/_next` or `/_vercel`
    // - ... if they contain a dot (e.g. `favicon.ico`)
    '/((?!api|_next|_vercel|.*\\..*).*)',
  ],
};
