import type { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

const nextConfig: NextConfig = {
  // Enable static generation for localized pages
  // Add any other Next.js config here
};

export default withNextIntl(nextConfig);
