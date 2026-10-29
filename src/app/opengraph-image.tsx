import { generateOgImage, ogImageSize, ogImageContentType } from '@/lib/og-image';

export const alt = 'Intelligenzia – Kognitiotieteen alumniyhdistys';
export const size = ogImageSize;
export const contentType = ogImageContentType;

export default async function Image() {
  return generateOgImage({
    title: 'Kognitiotieteen alumniyhdistys',
    description: 'Helsingin yliopiston kognitiotieteen alumnit ja opiskelijat, vuodesta 1989.',
  });
}
