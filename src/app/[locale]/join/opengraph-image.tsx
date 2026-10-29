import { generateOgImage, ogImageSize, ogImageContentType } from '@/lib/og-image';

export const alt = 'Join Us – Intelligenzia';
export const size = ogImageSize;
export const contentType = ogImageContentType;

export default async function Image() {
  return generateOgImage({
    title: 'Join Intelligenzia',
    description: 'Become a member and connect with cognitive science professionals.',
    section: 'Membership',
    image: '/blog/yhdistys.jpg',
  });
}
