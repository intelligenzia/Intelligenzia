import type { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

const nextConfig: NextConfig = {
  // Image optimization for external domains if needed
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'intelligenzia.fi',
      },
      {
        protocol: 'https',
        hostname: 'img.youtube.com',
      },
      {
        protocol: 'https',
        hostname: 'i.ytimg.com',
      },
    ],
  },
  // Handle trailing slashes consistently
  trailingSlash: false,
  async redirects() {
    return [
      // Old /ajankohtaista/ page -> homepage
      {
        source: '/ajankohtaista',
        destination: '/',
        permanent: true,
      },
      {
        source: '/ajankohtaista/:path*',
        destination: '/',
        permanent: true,
      },
      // Old category pages -> homepage
      {
        source: '/category/:slug*',
        destination: '/',
        permanent: true,
      },
      // Old privacy policy URL (without locale) -> new page
      {
        source: '/tietosuoja',
        destination: '/fi/tietosuoja',
        permanent: true,
      },
      // Malformed URLs with email addresses in path -> redirect to blog post
      {
        source: '/kognitiotieteelle-perustettu-oma-maisteriopintosuunta/:path*',
        destination: '/fi/blogi/kognitiotieteelle-perustettu-oma-maisteriopintosuunta',
        permanent: true,
      },
      // Legacy blog post URLs (without /blogi/ prefix) -> new format
      {
        source: '/avoin-kirje-dekaanille',
        destination: '/fi/blogi/avoin-kirje-dekaanille',
        permanent: true,
      },
      {
        source: '/tiedote-kognitiotieteilijoille',
        destination: '/fi/blogi/tiedote-kognitiotieteilijoille',
        permanent: true,
      },
      {
        source: '/psykologia-ja-kognitiotiede',
        destination: '/fi/blogi/psykologia-ja-kognitiotiede',
        permanent: true,
      },
      {
        source: '/tiedote-kognitiotieteen-tilasta',
        destination: '/fi/blogi/tiedote-kognitiotieteen-tilasta',
        permanent: true,
      },
      {
        source: '/mita-kognitiotiede-voi-antaa-digihumanismille',
        destination: '/fi/blogi/mita-kognitiotiede-voi-antaa-digihumanismille',
        permanent: true,
      },
      {
        source: '/intelligenzian-ryhmamentorointi',
        destination: '/fi/blogi/intelligenzian-ryhmamentorointi',
        permanent: true,
      },
      {
        source: '/kilpikonnari-kiittaa',
        destination: '/fi/blogi/kilpikonnari-kiittaa',
        permanent: true,
      },
      {
        source: '/cognitive-science-courses',
        destination: '/en/blog/cognitive-science-courses',
        permanent: true,
      },
      // English page without locale prefix
      {
        source: '/cognitive-science-vs-psychology',
        destination: '/en/cognitive-science-vs-psychology',
        permanent: true,
      },
      // Finnish blog slugs incorrectly under /en/blog/ -> correct English slug
      {
        source: '/en/blog/mita-kognitiotiede-voi-antaa-digihumanismille',
        destination: '/en/blog/what-cognitive-science-can-offer-digital-humanities',
        permanent: true,
      },
      {
        source: '/en/blog/kognitiotieteelle-perustettu-oma-maisteriopintosuunta',
        destination: '/en/blog/cognitive-science-masters-track-established',
        permanent: true,
      },
      {
        source: '/en/blog/kognitiotiede-humanistiseen',
        destination: '/en/blog/cognitive-science-to-faculty-of-arts',
        permanent: true,
      },
      // English blog slugs incorrectly under /fi/blogi/
      {
        source: '/fi/blogi/cognitive-science-to-faculty-of-arts',
        destination: '/en/blog/cognitive-science-to-faculty-of-arts',
        permanent: true,
      },
      {
        source: '/fi/blogi/thank-you-kompleksi',
        destination: '/en/blog/thank-you-kompleksi',
        permanent: true,
      },
      {
        source: '/haikugeneraattori',
        destination: '/fi/blogi/haikugeneraattori',
        permanent: true,
      },
      {
        source: '/kognitiotiede-humanistiseen',
        destination: '/fi/blogi/kognitiotiede-humanistiseen',
        permanent: true,
      },
      {
        source: '/uuden-koulutusohjelman-perustaminen-kannattaa',
        destination: '/fi/blogi/uuden-koulutusohjelman-perustaminen-kannattaa',
        permanent: true,
      },
      {
        source: '/intelligenzian-jasenyys-avautuu-kaikille-opiskelijoille',
        destination: '/fi/blogi/intelligenzian-jasenyys-avautuu-kaikille-opiskelijoille',
        permanent: true,
      },
      {
        source: '/kognitiotieteeseen-toinen-yliopistonlehtori-valonpilkahduksia-tulevaisuudesta',
        destination: '/fi/blogi/kognitiotieteeseen-toinen-yliopistonlehtori-valonpilkahduksia-tulevaisuudesta',
        permanent: true,
      },
      {
        source: '/kognitiotieteelle-perustettu-oma-maisteriopintosuunta',
        destination: '/fi/blogi/kognitiotieteelle-perustettu-oma-maisteriopintosuunta',
        permanent: true,
      },
      {
        source: '/maisteriohjelman-haku-on-auki',
        destination: '/fi/blogi/maisteriohjelman-haku-on-auki',
        permanent: true,
      },
      {
        source: '/salainen-tiedekunta-sovellus',
        destination: '/fi/blogi/salainen-tiedekunta-sovellus',
        permanent: true,
      },
      // Legacy page URLs without locale prefix
      {
        source: '/kognitiotieteen-urat',
        destination: '/fi/kognitiotieteen-urat',
        permanent: true,
      },
      {
        source: '/yhdistys',
        destination: '/fi/yhdistys',
        permanent: true,
      },
      {
        source: '/opiskelu',
        destination: '/fi/opiskelu',
        permanent: true,
      },
      {
        source: '/kognitiotiede',
        destination: '/fi/kognitiotiede',
        permanent: true,
      },
      // Legacy blog URLs without locale (using /blogi/ instead of /fi/blogi/)
      {
        source: '/blogi/:slug',
        destination: '/fi/blogi/:slug',
        permanent: true,
      },
      // Legacy author URLs without locale
      {
        source: '/kirjoittajat/:slug',
        destination: '/fi/kirjoittajat/:slug',
        permanent: true,
      },
      // Trailing slash versions of blog posts
      {
        source: '/fi/blogi/:slug/',
        destination: '/fi/blogi/:slug',
        permanent: true,
      },
      // URL with encoded ä character (jäsenyys)
      {
        source: '/intelligenzian-j%C3%A4senyys-avautuu-kaikille-opiskelijoille',
        destination: '/fi/blogi/intelligenzian-jasenyys-avautuu-kaikille-opiskelijoille',
        permanent: true,
      },
    ];
  },
};

export default withNextIntl(nextConfig);
