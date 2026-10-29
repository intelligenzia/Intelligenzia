import { generateOgImage, ogImageSize, ogImageContentType } from '@/lib/og-image';

export const alt = 'Intelligenzia – Kognitiotieteen alumniyhdistys';
export const size = ogImageSize;
export const contentType = ogImageContentType;

export default async function Image({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const isEnglish = locale === 'en';

  return generateOgImage({
    title: isEnglish ? 'The cognitive science alumni society' : 'Kognitiotieteen alumniyhdistys',
    description: isEnglish
      ? 'Alumni and students of cognitive science at the University of Helsinki, since 1989.'
      : 'Helsingin yliopiston kognitiotieteen alumnit ja opiskelijat, vuodesta 1989.',
  });
}
