import { notFound } from 'next/navigation';
import { setRequestLocale } from 'next-intl/server';
import { getPage } from '@/lib/content';
import { getContentSlug, getPageSlugs, pageMapping } from '@/lib/page-mapping';
import { Markdown } from '@/components/markdown';
import { TableOfContents } from '@/components/table-of-contents';
import type { Metadata } from 'next';

type Props = {
  params: Promise<{ locale: string; slug: string }>;
};

export function generateStaticParams() {
  const params: { locale: string; slug: string }[] = [];

  for (const locale of Object.keys(pageMapping)) {
    for (const slug of getPageSlugs(locale)) {
      params.push({ locale, slug });
    }
  }

  return params;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params;
  const contentSlug = getContentSlug(locale, slug);

  if (!contentSlug) {
    return {};
  }

  const page = getPage(locale, contentSlug);

  if (!page) {
    return {};
  }

  return {
    title: page.frontmatter.title,
    description: page.frontmatter.description,
  };
}

export default async function ContentPage({ params }: Props) {
  const { locale, slug } = await params;
  setRequestLocale(locale);

  const contentSlug = getContentSlug(locale, slug);

  if (!contentSlug) {
    notFound();
  }

  const page = getPage(locale, contentSlug);

  if (!page) {
    notFound();
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="relative mx-auto max-w-3xl xl:max-w-4xl">
        {/* Desktop ToC - positioned absolutely to the right */}
        <aside className="hidden xl:block absolute left-full ml-8 top-0 w-56">
          <TableOfContents content={page.content} />
        </aside>

        <article>
          <header className="mb-8">
            <h1 className="text-4xl font-bold tracking-tight">
              {page.frontmatter.title}
            </h1>
            {page.frontmatter.description && (
              <p className="mt-4 text-lg text-muted-foreground">
                {page.frontmatter.description}
              </p>
            )}
          </header>

          {/* Mobile ToC dropdown */}
          <div className="xl:hidden">
            <TableOfContents content={page.content} />
          </div>

          <div className="prose prose-neutral dark:prose-invert max-w-none">
            <Markdown content={page.content} />
          </div>
        </article>
      </div>
    </div>
  );
}
