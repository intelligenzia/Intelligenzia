import { generateOgImage, ogImageSize, ogImageContentType } from '@/lib/og-image';

export const alt = 'Sign In – Intelligenzia';
export const size = ogImageSize;
export const contentType = ogImageContentType;

export default async function Image() {
  return generateOgImage({
    title: 'Sign In',
    description: 'Sign in to your Intelligenzia account with a secure magic link.',
  });
}
