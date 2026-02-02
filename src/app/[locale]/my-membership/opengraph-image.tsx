import { generateOgImage, ogImageSize, ogImageContentType } from '@/lib/og-image';

export const alt = 'My Membership – Intelligenzia';
export const size = ogImageSize;
export const contentType = ogImageContentType;

export default async function Image() {
  return generateOgImage({
    title: 'My Membership',
    description: 'Manage your Intelligenzia membership and information.',
  });
}
