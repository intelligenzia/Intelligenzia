import { setRequestLocale } from 'next-intl/server';
import Image from 'next/image';
import { Link } from '@/i18n/navigation';
import { getAllBlogPosts, getBlogCategories, getExcerpt } from '@/lib/content';
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

  // Group by year so a twelve-year archive reads as a timeline, not a wall of
  // identical cards. The newest post leads with its photo.
  const [lead, ...older] = posts;
  const years = new Map<string, typeof posts>();
  for (const post of older) {
    const year = post.frontmatter.date?.slice(0, 4) || '–';
    years.set(year, [...(years.get(year) ?? []), post]);
  }

  return (
    <div className="container mx-auto px-4 py-12 md:py-16">
      <header className="mb-10 flex flex-col gap-4">
        <h1 className="display-lg text-[clamp(2.25rem,5vw,3.5rem)] text-balance">
          {locale === 'fi'
            ? 'Kirjoituksia kognitiotieteestä'
            : 'Writing on cognitive science'}
        </h1>
        <p className="max-w-[62ch] font-serif text-lg text-pretty text-muted-foreground">
          {locale === 'fi'
            ? 'Yhdistyksen ja jäsenten kirjoituksia alasta, opiskelusta ja tutkimuksesta.'
            : 'Posts from the society and its members on the field, studying, and research.'}
        </p>
      </header>

      <nav
        aria-label={locale === 'fi' ? 'Aiheet' : 'Topics'}
        className="-mx-4 mb-12 flex gap-2 overflow-x-auto px-4 pb-1 md:mx-0 md:flex-wrap md:px-0"
      >
        <Link
          href={blogPath}
          aria-current={!category ? 'page' : undefined}
          className={`shrink-0 rounded-sm border px-3 py-1.5 font-mono text-xs transition-colors ${
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
              className={`shrink-0 rounded-sm border px-3 py-1.5 font-mono text-xs transition-colors ${
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

      {!lead ? (
        <p className="font-serif text-muted-foreground">
          {locale === 'fi'
            ? 'Tässä aiheessa ei ole vielä kirjoituksia.'
            : 'No posts in this category yet.'}
        </p>
      ) : (
        <>
          <Link
            href={`${blogPath}/${lead.slug}`}
            className="group grid gap-6 border-t pt-8 lg:grid-cols-12 lg:gap-12"
          >
            {lead.frontmatter.cover && (
              <div className="relative aspect-[16/9] overflow-hidden bg-muted lg:col-span-7">
                <Image
                  src={`/blog/${lead.frontmatter.cover}`}
                  alt=""
                  fill
                  priority
                  sizes="(min-width: 1024px) 58vw, 100vw"
                  className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.03] motion-reduce:transition-none"
                />
              </div>
            )}
            <div className="flex flex-col justify-center gap-4 lg:col-span-5">
              <PostMeta post={lead} locale={locale} />
              <h2 className="display-lg text-[clamp(1.75rem,3vw,2.5rem)] text-balance group-hover:text-primary">
                {lead.frontmatter.title}
              </h2>
              <p className="line-clamp-4 font-serif text-lg text-pretty text-muted-foreground">
                {getExcerpt(lead, 220)}
              </p>
            </div>
          </Link>

          <div className="mt-16 flex flex-col gap-14">
            {[...years.entries()].map(([year, yearPosts]) => (
              <section key={year} className="grid gap-4 lg:grid-cols-12 lg:gap-12">
                <h2 className="display-lg text-3xl text-muted-foreground lg:col-span-2 lg:pt-6">
                  {year}
                </h2>
                <ul className="border-t lg:col-span-10">
                  {yearPosts.map((post) => (
                    <li key={post.slug} className="border-b">
                      <Link
                        href={`${blogPath}/${post.slug}`}
                        className="group grid grid-cols-[1fr_auto] items-start gap-6 py-6"
                      >
                        <div className="flex flex-col gap-2">
                          <PostMeta post={post} locale={locale} />
                          <h3 className="display-md text-xl text-balance group-hover:text-primary md:text-2xl">
                            {post.frontmatter.title}
                          </h3>
                          <p className="line-clamp-2 max-w-[70ch] font-serif text-[17px] text-pretty text-muted-foreground">
                            {getExcerpt(post, 160)}
                          </p>
                        </div>
                        {post.frontmatter.cover && (
                          <div className="relative hidden aspect-[4/3] w-40 overflow-hidden bg-muted sm:block">
                            <Image
                              src={`/blog/${post.frontmatter.cover}`}
                              alt=""
                              fill
                              sizes="160px"
                              className="object-cover grayscale transition-[filter] duration-300 group-hover:grayscale-0 motion-reduce:transition-none"
                            />
                          </div>
                        )}
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function PostMeta({
  post,
  locale,
}: {
  post: ReturnType<typeof getAllBlogPosts>[number];
  locale: string;
}) {
  const { date, category, author } = post.frontmatter;
  return (
    <p className="text-xs text-muted-foreground">
      <span className="font-mono">{formatDate(date, locale)}</span>
      {category && <> · {category}</>}
      {author && <> · {author}</>}
    </p>
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
