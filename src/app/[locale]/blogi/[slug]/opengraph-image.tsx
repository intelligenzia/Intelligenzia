import { generateOgImage, ogImageSize, ogImageContentType } from '@/lib/og-image';
import { getBlogPost, getAllBlogPosts, getExcerpt } from '@/lib/content';

export const alt = 'Intelligenzia blogi';
export const size = ogImageSize;
export const contentType = ogImageContentType;

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  const post = getBlogPost('fi', slug);

  const title = post?.frontmatter.title || slug;
  const description = post?.frontmatter.description || (post ? getExcerpt(post, 160) : undefined);

  return generateOgImage({
    title,
    description,
    section: 'Blogi',
    image: post?.frontmatter.cover ? `/blog/${post.frontmatter.cover}` : undefined,
  });
}

export function generateStaticParams() {
  const posts = getAllBlogPosts('fi');
  return posts.map((post) => ({ slug: post.slug }));
}
