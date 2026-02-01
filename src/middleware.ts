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

// Legacy page paths that need redirects (old paths without locale prefix)
const legacyPagePaths: Record<string, string> = {
  '/kognitiotiede': '/fi/kognitiotiede',
  '/opiskelu': '/fi/opiskelu',
  '/yhdistys': '/fi/yhdistys',
  '/tapahtumat': '/fi/tapahtumat',
  '/jaseneksi': '/fi/jaseneksi',
  '/kirjaudu': '/fi/kirjaudu',
  // URL-encoded Finnish characters (ä -> %C3%A4)
  '/j%C3%A4seneksi': '/fi/jaseneksi',
};

// Other legacy paths that need redirects
const legacyPaths: Record<string, string> = {
  '/ajankohtaista': '/',
  '/tietosuoja': '/fi',
  '/search': '/',
  '/category': '/',
};

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
