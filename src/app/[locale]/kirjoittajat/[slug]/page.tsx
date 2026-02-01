import { notFound } from 'next/navigation';
import { setRequestLocale } from 'next-intl/server';
import Image from 'next/image';
import { Link } from '@/i18n/navigation';
import { getAllAuthors, getAuthorBySlug, getBlogPostsByAuthor } from '@/lib/content';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, ArrowLeft, User, FileText } from 'lucide-react';
import type { Metadata } from 'next';

type Props = {
  params: Promise<{ locale: string; slug: string }>;
};

export function generateStaticParams() {
  const locales = ['fi', 'en'];

  return locales.flatMap((locale) => {
    const authors = getAllAuthors(locale);
    return authors.map((author) => ({
      locale,
      slug: author.slug,
    }));
  });
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug, locale } = await params;
  const author = getAuthorBySlug(locale, slug);

  if (!author) {
    return {};
  }

  return {
    title: locale === 'fi'
      ? `${author.name} - Kirjoittaja`
      : `${author.name} - Author`,
    description: locale === 'fi'
      ? `${author.name} on kirjoittanut ${author.postCount} blogikirjoitusta Intelligenzian blogiin.`
      : `${author.name} has written ${author.postCount} blog posts for Intelligenzia.`,
  };
}

export default async function AuthorPage({ params }: Props) {
  const { locale, slug } = await params;
  setRequestLocale(locale);

  const author = getAuthorBySlug(locale, slug);

  if (!author) {
    notFound();
  }

  const posts = getBlogPostsByAuthor(locale, author.name);
  const blogPath = locale === 'fi' ? '/blogi' : '/blog';
  const authorsPath = locale === 'fi' ? '/kirjoittajat' : '/authors';

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="mx-auto max-w-4xl">
        <Button asChild variant="ghost" className="mb-8">
          <Link href={blogPath}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            {locale === 'fi' ? 'Takaisin blogiin' : 'Back to blog'}
          </Link>
        </Button>

        <header className="mb-12">
          <div className="flex items-center gap-4 mb-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
              <User className="h-8 w-8 text-muted-foreground" />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">{author.name}</h1>
              <p className="text-muted-foreground flex items-center gap-2">
                <FileText className="h-4 w-4" />
                {locale === 'fi'
                  ? `${author.postCount} blogikirjoitusta`
                  : `${author.postCount} blog post${author.postCount !== 1 ? 's' : ''}`}
              </p>
            </div>
          </div>
        </header>

        <section>
          <h2 className="mb-6 text-xl font-semibold">
            {locale === 'fi' ? 'Kirjoitukset' : 'Posts'}
          </h2>
          <div className="grid gap-6 md:grid-cols-2">
            {posts.map((post) => (
              <Link key={post.slug} href={`${blogPath}/${post.slug}`}>
                <Card className="group h-full overflow-hidden transition-colors hover:bg-muted/50 pt-0">
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
                    {post.frontmatter.category && (
                      <Badge variant="outline" className="text-xs">
                        {post.frontmatter.category}
                      </Badge>
                    )}
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </section>
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
