import { generateOgImage, ogImageSize, ogImageContentType } from '@/lib/og-image';
import { getAuthorBySlug, getAllAuthors } from '@/lib/content';

export const alt = 'Author – Intelligenzia';
export const size = ogImageSize;
export const contentType = ogImageContentType;

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  const author = getAuthorBySlug('en', slug);

  const title = author?.name || slug;
  const description = author
    ? `${author.postCount} blog post${author.postCount !== 1 ? 's' : ''} on Intelligenzia`
    : 'Intelligenzia blog author';

  return generateOgImage({
    title,
    description,
  });
}

export function generateStaticParams() {
  const authors = getAllAuthors('en');
  return authors.map((author) => ({ slug: author.slug }));
}
