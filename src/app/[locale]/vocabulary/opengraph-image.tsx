import { generateOgImage, ogImageSize, ogImageContentType } from '@/lib/og-image';

export const alt = 'Cognitive Science Glossary – Intelligenzia';
export const size = ogImageSize;
export const contentType = ogImageContentType;

export default async function Image() {
  return generateOgImage({
    title: 'Cognitive Science Glossary',
    description: 'Over 100 key terms from psychology, neuroscience, AI, and philosophy of mind.',
  });
}
