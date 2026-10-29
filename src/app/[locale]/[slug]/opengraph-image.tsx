import { generateOgImage, ogImageSize, ogImageContentType } from '@/lib/og-image';
import { getPage } from '@/lib/content';
import { getContentSlug, pageMapping } from '@/lib/page-mapping';

export const alt = 'Intelligenzia';
export const size = ogImageSize;
export const contentType = ogImageContentType;

export default async function Image({ params }: { params: Promise<{ locale: string; slug: string }> }) {
  const { locale, slug } = await params;

  const contentSlug = getContentSlug(locale, slug);
  const page = contentSlug ? getPage(locale, contentSlug) : null;

  const title = page?.frontmatter.title || slug;
  const description = page?.frontmatter.description;

  return generateOgImage({
    title,
    description,
    section: sectionFor(locale, slug),
  });
}

export function generateStaticParams() {
  const params: { locale: string; slug: string }[] = [];

  for (const locale of Object.keys(pageMapping)) {
    for (const slug of Object.keys(pageMapping[locale])) {
      params.push({ locale, slug });
    }
  }

  return params;
}

/** Footer label: the society's own pages get their name, the rest are field explainers. */
function sectionFor(locale: string, slug: string): string {
  const own: Record<string, string> = {
    yhdistys: 'Yhdistys',
    organization: 'Organization',
    opiskelu: 'Opiskelu',
    studies: 'Studies',
    tapahtumat: 'Tapahtumat',
    events: 'Events',
    tietosuoja: 'Tietosuoja',
    'privacy-policy': 'Privacy',
  };
  return own[slug] ?? (locale === 'fi' ? 'Kognitiotiede' : 'Cognitive science');
}
