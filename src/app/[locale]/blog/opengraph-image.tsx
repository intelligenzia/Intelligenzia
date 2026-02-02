import { generateOgImage, ogImageSize, ogImageContentType } from '@/lib/og-image';

export const alt = 'Blog – Intelligenzia';
export const size = ogImageSize;
export const contentType = ogImageContentType;

export default async function Image() {
  return generateOgImage({
    title: 'Blog',
    description: 'Intelligenzia blog – articles on cognitive science, AI, and the study of the mind.',
  });
}
