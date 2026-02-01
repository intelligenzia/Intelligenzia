import { notFound } from 'next/navigation';
import { setRequestLocale } from 'next-intl/server';
import Image from 'next/image';
import { Link } from '@/i18n/navigation';
import { getBlogPost, getAllBlogPosts, slugify } from '@/lib/content';
import { Markdown } from '@/components/markdown';
import { ArticleJsonLd, BreadcrumbJsonLd } from '@/components/json-ld';
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
  const { slug, locale } = await params;
  const post = getBlogPost(slug);

  if (!post) {
    return {};
  }

  // Use frontmatter description if available, otherwise extract from content
  const description = post.frontmatter.description ||
    post.content.slice(0, 160).replace(/[#*_\[\]]/g, '').trim();
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://intelligenzia.fi';
  const ogImage = post.frontmatter.cover
    ? `${baseUrl}/blog/${post.frontmatter.cover}`
    : undefined;
  const canonicalUrl = locale === 'fi'
    ? `${baseUrl}/fi/blogi/${slug}`
    : `${baseUrl}/en/blog/${slug}`;

  return {
    title: post.frontmatter.title,
    description,
    keywords: post.frontmatter.keywords || undefined,
    authors: post.frontmatter.author ? [{ name: post.frontmatter.author }] : undefined,
    alternates: {
      canonical: canonicalUrl,
      languages: {
        'fi': `${baseUrl}/fi/blogi/${slug}`,
        'en': `${baseUrl}/en/blog/${slug}`,
      },
    },
    openGraph: {
      title: post.frontmatter.title,
      description,
      type: 'article',
      publishedTime: post.frontmatter.date,
      authors: post.frontmatter.author ? [post.frontmatter.author] : undefined,
      images: ogImage ? [{ url: ogImage, alt: post.frontmatter.title }] : undefined,
      locale: locale === 'fi' ? 'fi_FI' : 'en_US',
      url: canonicalUrl,
      siteName: 'Intelligenzia',
    },
    twitter: {
      card: 'summary_large_image',
      title: post.frontmatter.title,
      description,
      images: ogImage ? [ogImage] : undefined,
    },
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
  const authorsPath = locale === 'fi' ? '/kirjoittajat' : '/authors';
  const coverImage = post.frontmatter.cover;
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://intelligenzia.fi';

  const breadcrumbs = [
    { name: 'Intelligenzia', url: locale === 'fi' ? baseUrl : `${baseUrl}/en` },
    { name: locale === 'fi' ? 'Blogi' : 'Blog', url: locale === 'fi' ? `${baseUrl}/blogi` : `${baseUrl}/en/blog` },
    { name: post.frontmatter.title, url: locale === 'fi' ? `${baseUrl}/blogi/${post.slug}` : `${baseUrl}/en/blog/${post.slug}` },
  ];

  return (
    <>
      <ArticleJsonLd post={post} locale={locale} />
      <BreadcrumbJsonLd items={breadcrumbs} />
      <div className="container mx-auto px-4 py-12">
        <article className="mx-auto max-w-2xl">
          <Button asChild variant="ghost" className="mb-8">
            <Link href={blogPath}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              {locale === 'fi' ? 'Takaisin blogiin' : 'Back to blog'}
            </Link>
          </Button>

          {/* Cover Image */}
          {coverImage && (
            <div className="relative mb-8 aspect-2/1 overflow-hidden rounded-lg">
              <Image
                src={`/blog/${coverImage}`}
                alt={post.frontmatter.title}
                fill
                className="object-cover grayscale"
                priority
              />
            </div>
          )}

          <header className="mb-10">
            <div className="mb-4 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                {formatDate(post.frontmatter.date, locale)}
              </span>
              {post.frontmatter.author && (
                <Link
                  href={`${authorsPath}/${slugify(post.frontmatter.author)}`}
                  className="flex items-center gap-1 hover:text-foreground"
                >
                  <User className="h-4 w-4" />
                  {post.frontmatter.author}
                </Link>
              )}
              {post.frontmatter.category && (
                <Badge variant="secondary">{post.frontmatter.category}</Badge>
              )}
            </div>
            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
              {post.frontmatter.title}
            </h1>
          </header>

          {/* Article content with improved typography */}
          <div className="prose-article">
            <Markdown content={post.content} />
          </div>
        </article>
      </div>
    </>
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
