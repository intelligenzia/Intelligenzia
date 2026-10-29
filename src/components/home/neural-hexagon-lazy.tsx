'use client';

import dynamic from 'next/dynamic';

// three.js is ~150KB gzipped; keep it out of the initial bundle and off the
// server. The hero text is the LCP element, so nothing waits on this.
export const NeuralHexagonLazy = dynamic(() => import('./neural-hexagon'), {
  ssr: false,
  loading: () => null,
});
