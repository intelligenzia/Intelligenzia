import { generateOgImage, ogImageSize, ogImageContentType } from '@/lib/og-image';

export const alt = 'Kognitiotieteen sanasto – Intelligenzia';
export const size = ogImageSize;
export const contentType = ogImageContentType;

export default async function Image() {
  return generateOgImage({
    title: 'Kognitiotieteen sanasto',
    description: 'Yli 100 keskeistä käsitettä psykologiasta, neurotieteestä, tekoälystä ja mielenfilosofiasta.',
  });
}
