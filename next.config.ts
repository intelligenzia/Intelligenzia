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
      // Member dashboard used to live at a misspelt slug; old bookmarks and
      // in-flight Stripe return URLs still point there.
      { source: '/jasenyyys', destination: '/jasenyys', permanent: true },
      { source: '/fi/jasenyyys', destination: '/jasenyys', permanent: true },
      { source: '/en/jasenyyys', destination: '/en/my-membership', permanent: true },
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
      // Old privacy policy URL handled by next-intl with localePrefix: 'as-needed'
      // /tietosuoja works directly as Finnish default locale page
      // Malformed URLs with email addresses in path -> redirect to blog post
      {
        source: '/kognitiotieteelle-perustettu-oma-maisteriopintosuunta/:path*',
        destination: '/blogi/kognitiotieteelle-perustettu-oma-maisteriopintosuunta',
        permanent: true,
      },
      // Legacy blog post URLs (without /blogi/ prefix) -> new format
      {
        source: '/avoin-kirje-dekaanille',
        destination: '/blogi/avoin-kirje-dekaanille',
        permanent: true,
      },
      {
        source: '/tiedote-kognitiotieteilijoille',
        destination: '/blogi/tiedote-kognitiotieteilijoille',
        permanent: true,
      },
      {
        source: '/psykologia-ja-kognitiotiede',
        destination: '/blogi/psykologia-ja-kognitiotiede',
        permanent: true,
      },
      {
        source: '/tiedote-kognitiotieteen-tilasta',
        destination: '/blogi/tiedote-kognitiotieteen-tilasta',
        permanent: true,
      },
      {
        source: '/mita-kognitiotiede-voi-antaa-digihumanismille',
        destination: '/blogi/mita-kognitiotiede-voi-antaa-digihumanismille',
        permanent: true,
      },
      {
        source: '/intelligenzian-ryhmamentorointi',
        destination: '/blogi/intelligenzian-ryhmamentorointi',
        permanent: true,
      },
      {
        source: '/kilpikonnari-kiittaa',
        destination: '/blogi/kilpikonnari-kiittaa',
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
        destination: '/blogi/haikugeneraattori',
        permanent: true,
      },
      {
        source: '/kognitiotiede-humanistiseen',
        destination: '/blogi/kognitiotiede-humanistiseen',
        permanent: true,
      },
      {
        source: '/uuden-koulutusohjelman-perustaminen-kannattaa',
        destination: '/blogi/uuden-koulutusohjelman-perustaminen-kannattaa',
        permanent: true,
      },
      {
        source: '/intelligenzian-jasenyys-avautuu-kaikille-opiskelijoille',
        destination: '/blogi/intelligenzian-jasenyys-avautuu-kaikille-opiskelijoille',
        permanent: true,
      },
      {
        source: '/kognitiotieteeseen-toinen-yliopistonlehtori-valonpilkahduksia-tulevaisuudesta',
        destination: '/blogi/kognitiotieteeseen-toinen-yliopistonlehtori-valonpilkahduksia-tulevaisuudesta',
        permanent: true,
      },
      {
        source: '/kognitiotieteelle-perustettu-oma-maisteriopintosuunta',
        destination: '/blogi/kognitiotieteelle-perustettu-oma-maisteriopintosuunta',
        permanent: true,
      },
      {
        source: '/maisteriohjelman-haku-on-auki',
        destination: '/blogi/maisteriohjelman-haku-on-auki',
        permanent: true,
      },
      {
        source: '/salainen-tiedekunta-sovellus',
        destination: '/blogi/salainen-tiedekunta-sovellus',
        permanent: true,
      },
      // URL with encoded ä character (jäsenyys)
      {
        source: '/intelligenzian-j%C3%A4senyys-avautuu-kaikille-opiskelijoille',
        destination: '/blogi/intelligenzian-jasenyys-avautuu-kaikille-opiskelijoille',
        permanent: true,
      },
    ];
  },
};

export default withNextIntl(nextConfig);
