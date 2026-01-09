'use client';

import Script from 'next/script';

interface UmamiAnalyticsProps {
  websiteId?: string;
  src?: string;
}

export function UmamiAnalytics({
  websiteId = process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID,
  src = process.env.NEXT_PUBLIC_UMAMI_URL || 'https://cloud.umami.is/script.js',
}: UmamiAnalyticsProps) {
  if (!websiteId) {
    return null;
  }

  return (
    <Script
      async
      src={src}
      data-website-id={websiteId}
      strategy="lazyOnload"
    />
  );
}
