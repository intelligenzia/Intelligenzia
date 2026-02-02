import { generateOgImage, ogImageSize, ogImageContentType } from '@/lib/og-image';

export const alt = 'Kirjoittajat – Intelligenzia';
export const size = ogImageSize;
export const contentType = ogImageContentType;

export default async function Image() {
  return generateOgImage({
    title: 'Kirjoittajat',
    description: 'Intelligenzian blogin kirjoittajat – kognitiotieteen asiantuntijoita ja alumneja.',
  });
}
