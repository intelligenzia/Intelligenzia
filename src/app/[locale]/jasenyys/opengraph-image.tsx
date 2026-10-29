import { generateOgImage, ogImageSize, ogImageContentType } from '@/lib/og-image';

export const alt = 'Jäsenyyteni – Intelligenzia';
export const size = ogImageSize;
export const contentType = ogImageContentType;

export default async function Image() {
  return generateOgImage({
    title: 'Jäsenyyteni',
    description: 'Hallinnoi Intelligenzia-jäsenyyttäsi ja tietojasi.',
  });
}
