import { notFound } from 'next/navigation';
import { setRequestLocale } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { getBlogPost, getAllBlogPosts } from '@/lib/content';
import { Markdown } from '@/components/markdown';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, User, ArrowLeft } from 'lucide-react';
import type { Metadata } from 'next';

type Props = {
  params: Promise<{ locale: string; slug: string }>;
};

export function generateStaticParams() {
  const posts = getAllBlogPosts();
  const locales = ['fi', 'en'];

  return locales.flatMap((locale) =>
    posts.map((post) => ({
      locale,
      slug: post.slug,
    }))
  );
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = getBlogPost(slug);

  if (!post) {
    return {};
  }

  return {
    title: post.frontmatter.title,
    description: post.content.slice(0, 160).replace(/[#*_\[\]]/g, ''),
  };
}

export default async function BlogPostPage({ params }: Props) {
  const { locale, slug } = await params;
  setRequestLocale(locale);

  const post = getBlogPost(slug);

  if (!post) {
    notFound();
  }

  const blogPath = locale === 'fi' ? '/blogi' : '/blog';

  return (
    <div className="container mx-auto px-4 py-12">
      <article className="mx-auto max-w-3xl">
        <Button asChild variant="ghost" className="mb-8">
          <Link href={blogPath}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            {locale === 'fi' ? 'Takaisin blogiin' : 'Back to blog'}
          </Link>
        </Button>

        <header className="mb-8">
          <div className="mb-4 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              {formatDate(post.frontmatter.date, locale)}
            </span>
            {post.frontmatter.author && (
              <span className="flex items-center gap-1">
                <User className="h-4 w-4" />
                {post.frontmatter.author}
              </span>
            )}
            {post.frontmatter.category && (
              <Badge variant="secondary">{post.frontmatter.category}</Badge>
            )}
          </div>
          <h1 className="text-4xl font-bold tracking-tight">
            {post.frontmatter.title}
          </h1>
        </header>

        <div className="prose prose-neutral dark:prose-invert max-w-none">
          <Markdown content={post.content} />
        </div>
      </article>
    </div>
  );
}

function formatDate(dateString: string, locale: string): string {
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString(locale === 'fi' ? 'fi-FI' : 'en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  } catch {
    return dateString;
  }
}
