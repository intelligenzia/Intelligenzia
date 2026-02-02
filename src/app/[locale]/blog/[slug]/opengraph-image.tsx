import { generateOgImage, ogImageSize, ogImageContentType } from '@/lib/og-image';
import { getBlogPost, getAllBlogPosts } from '@/lib/content';

export const alt = 'Intelligenzia blog';
export const size = ogImageSize;
export const contentType = ogImageContentType;

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  const post = getBlogPost('en', slug);

  const title = post?.frontmatter.title || slug;
  const description = post?.frontmatter.description || `${post?.frontmatter.author || 'Intelligenzia'} • ${post?.frontmatter.category || 'Blog'}`;

  return generateOgImage({
    title,
    description,
  });
}

export function generateStaticParams() {
  const posts = getAllBlogPosts('en');
  return posts.map((post) => ({ slug: post.slug }));
}
