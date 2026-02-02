import { generateOgImage, ogImageSize, ogImageContentType } from '@/lib/og-image';

export const alt = 'Kirjaudu sisään – Intelligenzia';
export const size = ogImageSize;
export const contentType = ogImageContentType;

export default async function Image() {
  return generateOgImage({
    title: 'Kirjaudu sisään',
    description: 'Kirjaudu Intelligenzia-tilillesi turvallisella sähköpostilinkillä.',
  });
}
