import { setRequestLocale } from 'next-intl/server';
import Image from 'next/image';
import { Link } from '@/i18n/navigation';
import { getAllBlogPosts, getBlogCategories, getExcerpt } from '@/lib/content';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { User } from 'lucide-react';
import type { Metadata } from 'next';
import { localizedAlternates } from '@/lib/seo';

type Props = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ category?: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  return {
    title: locale === 'fi' ? 'Blogi' : 'Blog',
    description:
      locale === 'fi'
        ? 'Intelligenzian blogi - kirjoituksia kognitiotieteestä ja yhdistystoiminnasta'
        : 'Intelligenzia blog - posts about cognitive science and organization activities',
    alternates: localizedAlternates(locale, { fi: '/blogi', en: '/blog' }),
  };
}

export default async function BlogListPage({ params, searchParams }: Props) {
  const { locale } = await params;
  const { category: activeCategory } = await searchParams;
  setRequestLocale(locale);

  const categories = getBlogCategories(locale);
  const blogPath = locale === 'fi' ? '/blogi' : '/blog';

  // Only honour a category that actually exists, so a hand-typed URL falls back
  // to the full list rather than rendering an empty page.
  const category =
    activeCategory && categories.includes(activeCategory) ? activeCategory : null;

  const allPosts = getAllBlogPosts(locale);
  const posts = category
    ? allPosts.filter((post) => post.frontmatter.category === category)
    : allPosts;

  return (
    <div className="container mx-auto px-4 py-12">
      <header className="mb-8 flex flex-col gap-3">
        <p className="eyebrow">{locale === 'fi' ? 'Blogi' : 'Blog'}</p>
        <h1 className="display-lg text-[clamp(2rem,5vw,3rem)]">
          {locale === 'fi'
            ? 'Kirjoituksia kognitiotieteestä'
            : 'Writing on cognitive science'}
        </h1>
        <p className="max-w-[62ch] font-serif text-lg text-muted-foreground">
          {locale === 'fi'
            ? 'Yhdistyksen ja jäsenten kirjoituksia alasta, opiskelusta ja tutkimuksesta.'
            : 'Posts from the society and its members on the field, studying, and research.'}
        </p>
      </header>

      {/* Categories actually filter now. */}
      <nav className="mb-8 flex flex-wrap items-center gap-2">
        <Link
          href={blogPath}
          aria-current={!category ? 'page' : undefined}
          className={`rounded-sm border px-3 py-1.5 font-mono text-xs transition-colors ${
            !category
              ? 'border-primary bg-primary text-primary-foreground'
              : 'hover:border-primary hover:text-primary'
          }`}
        >
          {locale === 'fi' ? `Kaikki (${allPosts.length})` : `All (${allPosts.length})`}
        </Link>
        {categories.map((cat) => {
          const count = allPosts.filter((p) => p.frontmatter.category === cat).length;
          const isActive = category === cat;
          return (
            <Link
              key={cat}
              href={`${blogPath}?category=${encodeURIComponent(cat)}`}
              aria-current={isActive ? 'page' : undefined}
              className={`rounded-sm border px-3 py-1.5 font-mono text-xs transition-colors ${
                isActive
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'hover:border-primary hover:text-primary'
              }`}
            >
              {cat} ({count})
            </Link>
          );
        })}
      </nav>

      {posts.length === 0 ? (
        <p className="font-serif text-muted-foreground">
          {locale === 'fi'
            ? 'Tässä aiheessa ei ole vielä kirjoituksia.'
            : 'No posts in this category yet.'}
        </p>
      ) : (
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {posts.map((post) => (
            <Link key={post.slug} href={`${blogPath}/${post.slug}`}>
              <Card className="group h-full overflow-hidden pt-0 transition-colors hover:border-primary/50">
                {post.frontmatter.cover && (
                  <div className="relative aspect-video overflow-hidden">
                    <Image
                      src={`/blog/${post.frontmatter.cover}`}
                      alt={post.frontmatter.title}
                      fill
                      className="object-cover grayscale transition-all duration-300 group-hover:grayscale-0 motion-reduce:transition-none"
                    />
                  </div>
                )}
                <CardHeader className="pb-3">
                  <p className="mb-1.5 font-mono text-[10.5px] text-muted-foreground">
                    {formatDate(post.frontmatter.date, locale)}
                    {post.frontmatter.category && ` · ${post.frontmatter.category}`}
                  </p>
                  <CardTitle className="display-md line-clamp-2 text-lg">
                    {post.frontmatter.title}
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <CardDescription className="mb-3 line-clamp-3 font-serif text-sm">
                    {getExcerpt(post, 130)}
                  </CardDescription>
                  {post.frontmatter.author && (
                    <span className="flex items-center gap-1.5 font-mono text-[10.5px] text-muted-foreground">
                      <User className="h-3 w-3" />
                      {post.frontmatter.author}
                    </span>
                  )}
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

function formatDate(dateString: string, locale: string): string {
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString(locale === 'fi' ? 'fi-FI' : 'en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return dateString;
  }
}
