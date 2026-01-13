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
};

export default withNextIntl(nextConfig);
