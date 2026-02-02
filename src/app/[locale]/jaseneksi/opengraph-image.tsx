import { generateOgImage, ogImageSize, ogImageContentType } from '@/lib/og-image';

export const alt = 'Liity jäseneksi – Intelligenzia';
export const size = ogImageSize;
export const contentType = ogImageContentType;

export default async function Image() {
  return generateOgImage({
    title: 'Liity jäseneksi',
    description: 'Liity Intelligenzian jäseneksi ja verkostoidu kognitiotieteen ammattilaisten kanssa.',
  });
}
