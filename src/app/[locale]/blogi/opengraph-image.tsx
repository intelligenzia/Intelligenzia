import { generateOgImage, ogImageSize, ogImageContentType } from '@/lib/og-image';

export const alt = 'Blogi – Intelligenzia';
export const size = ogImageSize;
export const contentType = ogImageContentType;

export default async function Image() {
  return generateOgImage({
    title: 'Blogi',
    description: 'Intelligenzian blogi – kirjoituksia kognitiotieteestä, tekoälystä ja mielen tutkimuksesta.',
  });
}
