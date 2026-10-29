import { notFound } from 'next/navigation';
import { setRequestLocale } from 'next-intl/server';
import Image from 'next/image';
import { Link } from '@/i18n/navigation';
import { getBlogPost, getAllBlogPosts, slugify } from '@/lib/content';
import { Markdown } from '@/components/markdown';
import { TableOfContents } from '@/components/table-of-contents';
import { ArticleJsonLd, BreadcrumbJsonLd } from '@/components/json-ld';
import { AlternatePathProvider } from '@/components/alternate-path-context';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, User, ArrowLeft } from 'lucide-react';
import type { Metadata } from 'next';

type Props = {
  params: Promise<{ locale: string; slug: string }>;
};

export function generateStaticParams() {
  const locales = ['fi', 'en'];

  return locales.flatMap((locale) => {
    const posts = getAllBlogPosts(locale);
    return posts.map((post) => ({
      locale,
      slug: post.slug,
    }));
  });
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug, locale } = await params;
  const post = getBlogPost(locale, slug);

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
    ? `${baseUrl}/blogi/${slug}`
    : `${baseUrl}/en/blog/${slug}`;

  // Only add hreflang alternates when the translation actually exists
  const alternateSlug = post.frontmatter.alternateSlug;
  const languages: Record<string, string> = {};
  if (locale === 'fi') {
    languages['fi'] = `${baseUrl}/blogi/${slug}`;
    if (alternateSlug) {
      languages['en'] = `${baseUrl}/en/blog/${alternateSlug}`;
    }
  } else {
    languages['en'] = `${baseUrl}/en/blog/${slug}`;
    if (alternateSlug) {
      languages['fi'] = `${baseUrl}/blogi/${alternateSlug}`;
    }
  }

  return {
    title: post.frontmatter.title,
    description,
    keywords: post.frontmatter.keywords || undefined,
    authors: post.frontmatter.author ? [{ name: post.frontmatter.author }] : undefined,
    alternates: {
      canonical: canonicalUrl,
      languages,
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

  const post = getBlogPost(locale, slug);

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

  // Build alternate paths for the locale switcher
  const altSlug = post.frontmatter.alternateSlug;
  const alternatePaths: Partial<Record<string, string>> = {};
  if (locale === 'fi' && altSlug) {
    alternatePaths['en'] = `/blog/${altSlug}`;
  } else if (locale === 'en' && altSlug) {
    alternatePaths['fi'] = `/blogi/${altSlug}`;
  }

  return (
    <AlternatePathProvider paths={alternatePaths}>
      <ArticleJsonLd post={post} locale={locale} />
      <BreadcrumbJsonLd items={breadcrumbs} />
      <div className="container mx-auto px-4 py-12">
        <div className="relative mx-auto max-w-2xl xl:max-w-3xl">
          {/* Desktop ToC - positioned absolutely to the right */}
          <aside className="hidden xl:block absolute left-full ml-8 top-0 w-56">
            <TableOfContents content={post.content} />
          </aside>

          <article>
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
              <div className="mb-4 flex flex-wrap items-center gap-4 font-mono text-xs text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5" />
                  {formatDate(post.frontmatter.date, locale)}
                </span>
                {post.frontmatter.author && (
                  <Link
                    href={`${authorsPath}/${slugify(post.frontmatter.author)}`}
                    className="flex items-center gap-1.5 hover:text-foreground"
                  >
                    <User className="h-3.5 w-3.5" />
                    {post.frontmatter.author}
                  </Link>
                )}
                {post.frontmatter.category && (
                  <Badge variant="secondary" className="font-mono text-[10.5px]">
                    {post.frontmatter.category}
                  </Badge>
                )}
              </div>
              <h1 className="display-lg text-[clamp(2rem,5vw,3rem)]">
                {post.frontmatter.title}
              </h1>
            </header>

            {/* Mobile ToC dropdown */}
            <div className="xl:hidden mb-6">
              <TableOfContents content={post.content} />
            </div>

            {/* Article content with improved typography */}
            <div className="article-body">
              <Markdown content={post.content} />
            </div>
          </article>
        </div>
      </div>
    </AlternatePathProvider>
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
