import { generateOgImage, ogImageSize, ogImageContentType } from '@/lib/og-image';
import { getAuthorBySlug, getAllAuthors } from '@/lib/content';

export const alt = 'Kirjoittaja – Intelligenzia';
export const size = ogImageSize;
export const contentType = ogImageContentType;

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  const author = getAuthorBySlug('fi', slug);

  const title = author?.name || slug;
  const description = author
    ? `${author.postCount} blogikirjoitusta Intelligenzian blogissa`
    : 'Intelligenzian blogin kirjoittaja';

  return generateOgImage({
    title,
    description,
  });
}

export function generateStaticParams() {
  const authors = getAllAuthors('fi');
  return authors.map((author) => ({ slug: author.slug }));
}
