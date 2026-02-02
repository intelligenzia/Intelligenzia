import { generateOgImage, ogImageSize, ogImageContentType } from '@/lib/og-image';
import { getBlogPost, getAllBlogPosts } from '@/lib/content';

export const alt = 'Intelligenzia blogi';
export const size = ogImageSize;
export const contentType = ogImageContentType;

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  const post = getBlogPost('fi', slug);

  const title = post?.frontmatter.title || slug;
  const description = post?.frontmatter.description || `${post?.frontmatter.author || 'Intelligenzia'} • ${post?.frontmatter.category || 'Blogi'}`;

  return generateOgImage({
    title,
    description,
  });
}

export function generateStaticParams() {
  const posts = getAllBlogPosts('fi');
  return posts.map((post) => ({ slug: post.slug }));
}
