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
      // Old privacy policy -> homepage (or create a new page if needed)
      {
        source: '/tietosuoja',
        destination: '/fi',
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
        destination: '/fi/blogi/cognitive-science-courses',
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
    ];
  },
};

export default withNextIntl(nextConfig);
