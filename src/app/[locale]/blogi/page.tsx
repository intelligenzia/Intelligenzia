import { setRequestLocale } from 'next-intl/server';
import Image from 'next/image';
import { Link } from '@/i18n/navigation';
import { getAllBlogPosts, getBlogCategories } from '@/lib/content';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, User } from 'lucide-react';
import type { Metadata } from 'next';

type Props = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  return {
    title: locale === 'fi' ? 'Blogi' : 'Blog',
    description:
      locale === 'fi'
        ? 'Intelligenzian blogi - kirjoituksia kognitiotieteestä ja yhdistystoiminnasta'
        : 'Intelligenzia blog - posts about cognitive science and organization activities',
  };
}

export default async function BlogListPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  const posts = getAllBlogPosts();
  const categories = getBlogCategories();
  const blogPath = locale === 'fi' ? '/blogi' : '/blog';

  return (
    <div className="container mx-auto px-4 py-12">
      <header className="mb-12">
        <h1 className="mb-4 text-4xl font-bold tracking-tight">
          {locale === 'fi' ? 'Blogi' : 'Blog'}
        </h1>
        <p className="text-lg text-muted-foreground">
          {locale === 'fi'
            ? 'Kirjoituksia kognitiotieteestä ja yhdistystoiminnasta'
            : 'Posts about cognitive science and organization activities'}
        </p>
      </header>

      {/* Categories */}
      <div className="mb-8 flex flex-wrap gap-2">
        {categories.map((category) => (
          <Badge key={category} variant="secondary">
            {category}
          </Badge>
        ))}
      </div>

      {/* Blog Posts Grid */}
      <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
        {posts.map((post) => (
          <Link key={post.slug} href={`${blogPath}/${post.slug}`}>
            <Card className="group h-full overflow-hidden transition-colors hover:bg-muted/50">
              {/* Cover Image */}
              {post.frontmatter.cover && (
                <div className="relative aspect-video overflow-hidden">
                  <Image
                    src={`/blog/${post.frontmatter.cover}`}
                    alt={post.frontmatter.title}
                    fill
                    className="object-cover grayscale transition-all duration-300 group-hover:scale-105"
                  />
                </div>
              )}
              <CardHeader className="pb-3">
                <div className="mb-2 flex items-center gap-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    {formatDate(post.frontmatter.date, locale)}
                  </span>
                </div>
                <CardTitle className="line-clamp-2 text-lg">
                  {post.frontmatter.title}
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <CardDescription className="mb-3 line-clamp-2 text-sm">
                  {post.content.slice(0, 120).replace(/[#*_\[\]]/g, '')}...
                </CardDescription>
                <div className="flex items-center gap-2">
                  {post.frontmatter.category && (
                    <Badge variant="outline" className="text-xs">
                      {post.frontmatter.category}
                    </Badge>
                  )}
                  {post.frontmatter.author && (
                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                      <User className="h-3 w-3" />
                      {post.frontmatter.author}
                    </span>
                  )}
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
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
