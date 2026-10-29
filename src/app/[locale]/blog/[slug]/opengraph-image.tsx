import { generateOgImage, ogImageSize, ogImageContentType } from '@/lib/og-image';
import { getBlogPost, getAllBlogPosts, getExcerpt } from '@/lib/content';

export const alt = 'Intelligenzia blog';
export const size = ogImageSize;
export const contentType = ogImageContentType;

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  const post = getBlogPost('en', slug);

  const title = post?.frontmatter.title || slug;
  const description = post?.frontmatter.description || (post ? getExcerpt(post, 160) : undefined);

  return generateOgImage({
    title,
    description,
    section: 'Blog',
    image: post?.frontmatter.cover ? `/blog/${post.frontmatter.cover}` : undefined,
  });
}

export function generateStaticParams() {
  const posts = getAllBlogPosts('en');
  return posts.map((post) => ({ slug: post.slug }));
}
