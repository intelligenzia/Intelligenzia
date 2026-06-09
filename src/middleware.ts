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
  // URL-encoded Finnish characters (ä -> %C3%A4) -> ASCII version (no /fi/ prefix needed)
  '/j%C3%A4seneksi': '/jaseneksi',
};

// Other legacy paths that need redirects
const legacyPaths: Record<string, string> = {
  '/ajankohtaista': '/',
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

// Blog slug cross-locale mapping (Finnish slug -> English slug)
// Kept in sync with alternateSlug frontmatter in blog posts
const fiBlogToEnBlog: Record<string, string> = {
  'avoin-kirje-dekaanille': 'open-letter-to-dean',
  'tiedote-kognitiotieteilijoille': 'announcement-for-cognitive-scientists',
  'psykologia-ja-kognitiotiede': 'psychology-and-cognitive-science',
  'tiedote-kognitiotieteen-tilasta': 'cognitive-science-status-update',
  'mita-kognitiotiede-voi-antaa-digihumanismille': 'what-cognitive-science-can-offer-digital-humanities',
  'intelligenzian-ryhmamentorointi': 'intelligenzias-group-mentoring',
  'kilpikonnari-kiittaa': 'thank-you-kompleksi',
  'haikugeneraattori': 'haiku-generator',
  'kognitiotiede-humanistiseen': 'cognitive-science-to-faculty-of-arts',
  'uuden-koulutusohjelman-perustaminen-kannattaa': 'establishing-new-degree-program-worthwhile',
  'intelligenzian-jasenyys-avautuu-kaikille-opiskelijoille': 'intelligenzias-membership-opens-to-all-students',
  'kognitiotieteeseen-toinen-yliopistonlehtori-valonpilkahduksia-tulevaisuudesta': 'second-university-lecturer-for-cognitive-science',
  'kognitiotieteelle-perustettu-oma-maisteriopintosuunta': 'cognitive-science-masters-track-established',
  'maisteriohjelman-haku-on-auki': 'masters-program-application-open',
  'salainen-tiedekunta-sovellus': 'secret-faculty-app',
  'kognitiotieteen-opiskelu-suomessa': 'studying-cognitive-science-in-finland',
  'jasenkysely-2026': 'member-survey-2026',
};

const enBlogToFiBlog: Record<string, string> = Object.fromEntries(
  Object.entries(fiBlogToEnBlog).map(([fi, en]) => [en, fi])
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
      url.pathname = `/blogi/${slug}`;
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
      url.pathname = '/jaseneksi';
      return NextResponse.redirect(url, 308);
    }
    // Check intelligenzian-jäsenyys-avautuu... with Finnish ä
    if (decodedCleanPath.includes('intelligenzian-jäsenyys-avautuu')) {
      const url = request.nextUrl.clone();
      url.pathname = '/blogi/intelligenzian-jasenyys-avautuu-kaikille-opiskelijoille';
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

  // Handle cross-locale blog slug redirects
  // e.g., /en/blog/jasenkysely-2026 -> /en/blog/member-survey-2026
  const enBlogMatch = cleanPath.match(/^\/en\/blog\/([^/]+)$/);
  if (enBlogMatch) {
    const slug = enBlogMatch[1];
    if (fiBlogToEnBlog[slug]) {
      const url = request.nextUrl.clone();
      url.pathname = `/en/blog/${fiBlogToEnBlog[slug]}`;
      return NextResponse.redirect(url, 308);
    }
  }

  // /blogi/english-slug -> /blogi/finnish-slug
  const fiBlogMatch = cleanPath.match(/^(?:\/fi)?\/blogi\/([^/]+)$/);
  if (fiBlogMatch) {
    const slug = fiBlogMatch[1];
    if (enBlogToFiBlog[slug]) {
      const url = request.nextUrl.clone();
      url.pathname = `/blogi/${enBlogToFiBlog[slug]}`;
      return NextResponse.redirect(url, 308);
    }
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
