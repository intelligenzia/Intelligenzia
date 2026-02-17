import { notFound } from 'next/navigation';
import { setRequestLocale } from 'next-intl/server';
import { getPage } from '@/lib/content';
import { vocabularyTerms } from '@/lib/vocabulary-data';
import { Markdown } from '@/components/markdown';
import { TableOfContents } from '@/components/table-of-contents';
import { DefinedTermSetJsonLd } from '@/components/json-ld';
import { Link } from '@/i18n/navigation';
import type { Metadata } from 'next';

type Props = {
  params: Promise<{ locale: string; slug: string }>;
};

const validSlugs = ['a-c', 'd-f', 'g-i', 'j-l', 'm-o', 'p-r', 's-u', 'v-z'];

const sectionTitles: Record<string, string> = {
  'a-c': 'A–C',
  'd-f': 'D–F',
  'g-i': 'G–I',
  'j-l': 'J–L',
  'm-o': 'M–O',
  'p-r': 'P–R',
  's-u': 'S–U',
  'v-z': 'V–Z',
};

export function generateStaticParams() {
  return validSlugs.map((slug) => ({
    locale: 'en',
    slug,
  }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;

  if (!validSlugs.includes(slug)) {
    return {};
  }

  const page = getPage('en', `vocabulary/vocabulary-${slug}`);

  if (!page) {
    return {
      title: `Glossary ${sectionTitles[slug]} | Cognitive Science Glossary`,
    };
  }

  return {
    title: page.frontmatter.title,
    description: page.frontmatter.description,
  };
}

export default async function VocabularyPage({ params }: Props) {
  const { locale, slug } = await params;
  setRequestLocale(locale);

  if (!validSlugs.includes(slug)) {
    notFound();
  }

  const page = getPage('en', `vocabulary/vocabulary-${slug}`);

  if (!page) {
    notFound();
  }

  const currentIndex = validSlugs.indexOf(slug);
  const prevSlug = currentIndex > 0 ? validSlugs[currentIndex - 1] : null;
  const nextSlug = currentIndex < validSlugs.length - 1 ? validSlugs[currentIndex + 1] : null;

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://intelligenzia.fi';
  // Map English slug 'v-z' to data slug 'v-o'
  const dataSlug = slug === 'v-z' ? 'v-o' : slug;
  const sectionTerms = vocabularyTerms.filter((t) => t.slug === dataSlug);

  return (
    <>
      <DefinedTermSetJsonLd
        name={`Cognitive Science Glossary: ${sectionTitles[slug]}`}
        url={`${baseUrl}/en/vocabulary/${slug}`}
        terms={sectionTerms.map((t) => ({
          name: t.english,
          alternateName: t.finnish,
          description: t.description,
        }))}
      />
    <div className="container mx-auto px-4 py-12">
      <div className="relative mx-auto max-w-3xl xl:max-w-4xl">
        {/* Desktop ToC - positioned absolutely to the right */}
        <aside className="absolute left-full top-0 ml-8 hidden w-56 xl:block">
          <TableOfContents content={page.content} />
        </aside>

        <article>
          {/* Breadcrumb */}
          <nav className="mb-6 text-sm">
            <Link href="/vocabulary" className="text-muted-foreground hover:text-foreground">
              Glossary
            </Link>
            <span className="mx-2 text-muted-foreground">/</span>
            <span className="text-foreground">{sectionTitles[slug]}</span>
          </nav>

          <header className="mb-8">
            <h1 className="text-4xl font-bold tracking-tight">{page.frontmatter.title}</h1>
            {page.frontmatter.description && (
              <p className="mt-4 text-lg text-muted-foreground">{page.frontmatter.description}</p>
            )}
          </header>

          {/* Mobile ToC dropdown */}
          <div className="xl:hidden">
            <TableOfContents content={page.content} />
          </div>

          <div className="prose prose-neutral max-w-none dark:prose-invert">
            <Markdown content={page.content} />
          </div>

          {/* Navigation between sections */}
          <nav className="mt-12 flex items-center justify-between border-t pt-6">
            {prevSlug ? (
              <Link
                href={`/vocabulary/${prevSlug}`}
                className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground"
              >
                <span>←</span>
                <span>{sectionTitles[prevSlug]}</span>
              </Link>
            ) : (
              <div />
            )}
            <Link
              href="/vocabulary"
              className="text-sm font-medium text-muted-foreground hover:text-foreground"
            >
              All sections
            </Link>
            {nextSlug ? (
              <Link
                href={`/vocabulary/${nextSlug}`}
                className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground"
              >
                <span>{sectionTitles[nextSlug]}</span>
                <span>→</span>
              </Link>
            ) : (
              <div />
            )}
          </nav>
        </article>
      </div>
    </div>
    </>
  );
}
