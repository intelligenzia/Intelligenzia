import { useTranslations, useLocale } from 'next-intl';
import { setRequestLocale } from 'next-intl/server';
import Image from 'next/image';
import { Link } from '@/i18n/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Calendar, BookOpen, ArrowRight, Lightbulb } from 'lucide-react';
import { getAllBlogPosts } from '@/lib/content';
import { OrganizationJsonLd, WebSiteJsonLd } from '@/components/json-ld';
import HeroSection from '@/components/hero-section';
import type { Metadata } from 'next';

type Props = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://intelligenzia.fi';

  return {
    title: locale === 'fi'
      ? 'Intelligenzia – Kognitiotieteen alumniyhdistys | Helsingin yliopisto'
      : 'Intelligenzia – Cognitive Science Alumni Society | University of Helsinki',
    description: locale === 'fi'
      ? 'Intelligenzia ry kokoaa yhteen kognitiotieteen ammattilaiset ja opiskelijat. Verkostoidu, löydä uramahdollisuuksia ja pysy ajan tasalla alan kehityksestä.'
      : 'Intelligenzia brings together cognitive science professionals and students. Network, discover career opportunities, and stay up to date with the field.',
    openGraph: {
      title: locale === 'fi'
        ? 'Intelligenzia – Kognitiotieteen alumniyhdistys'
        : 'Intelligenzia – Cognitive Science Alumni Society',
      description: locale === 'fi'
        ? 'Kognitiotieteen ammattilaiset ja opiskelijat yhdessä — verkostoidu ja löydä uramahdollisuuksia.'
        : 'Cognitive science professionals and students together — network and discover career opportunities.',
      url: baseUrl,
      siteName: 'Intelligenzia',
      locale: locale === 'fi' ? 'fi_FI' : 'en_US',
      type: 'website',
    },
  };
}

export default async function HomePage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <>
      <OrganizationJsonLd locale={locale} />
      <WebSiteJsonLd locale={locale} />
      <HeroSection />
      <MainContent />
      <VocabularySection />
    </>
  );
}

function MainContent() {
  const locale = useLocale();
  const t = useTranslations('membership');
  const tBenefits = useTranslations('membership.benefits');
  const posts = getAllBlogPosts(locale).slice(0, 3);
  const blogPath = locale === 'fi' ? '/blogi' : '/blog';
  const membershipHref = locale === 'fi' ? '/jaseneksi' : '/join';
  const loginHref = locale === 'fi' ? '/kirjaudu' : '/login';

  const features = [
    {
      icon: Users,
      title: tBenefits('networking'),
      description: locale === 'fi'
        ? 'Tapaa alan ammattilaisia ja laajenna verkostoasi.'
        : 'Meet professionals in the field and expand your network.',
    },
    {
      icon: Calendar,
      title: tBenefits('events'),
      description: locale === 'fi'
        ? 'Osallistu jäsentapahtumiin ja seminaareihin.'
        : 'Participate in member events and seminars.',
    },
    {
      icon: BookOpen,
      title: tBenefits('newsletter'),
      description: locale === 'fi'
        ? 'Pysy ajan tasalla alan kehityksestä.'
        : 'Stay up to date with developments in the field.',
    },
    {
      icon: Lightbulb,
      title: tBenefits('community'),
      description: locale === 'fi'
        ? 'Liity aktiiviseen kognitiotieteen yhteisöön.'
        : 'Join an active cognitive science community.',
    },
  ];

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="grid gap-12 lg:grid-cols-3 lg:gap-8">
        {/* Main column - News + Blog */}
        <div className="lg:col-span-2 space-y-12">
          {/* News announcement */}
          <section>
            <h2 className="mb-6 text-xl font-semibold">
              {locale === 'fi' ? 'Ajankohtaista' : 'News'}
            </h2>
            <Card>
              <CardHeader>
                <CardTitle>
                  {locale === 'fi'
                    ? 'Intelligenzia on nyt kognitiotieteen alumniyhdistys'
                    : 'Intelligenzia is now a cognitive science alumni society'}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-muted-foreground">
                {locale === 'fi' ? (
                  <p>
                    Intelligenzia on virallisesti valmistunut! Syyskuussa 2021 voimaan tulleen sääntömuutoksen myötä Intelligenzia ry muuttui kognitiotieteen ainejärjestöstä alumniyhdistykseksi. Päätöksen taustalla oli alumnien toive tiiviimmästä yhteisöstä ja halu säilyttää Intelligenzian tärkeät perinteet.
                  </p>
                ) : (
                  <p>
                    Intelligenzia has officially graduated! Following the rule change in September 2021, Intelligenzia ry transformed from a student organization into an alumni society. The decision was driven by alumni&apos;s desire for a closer community.
                  </p>
                )}
                <Button asChild variant="outline" size="sm">
                  <Link href={membershipHref}>
                    {locale === 'fi' ? 'Lue lisää jäsenyydestä' : 'Learn more about membership'}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </section>

          {/* Blog posts */}
          <section>
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-xl font-semibold">
                {locale === 'fi' ? 'Blogista' : 'From the blog'}
              </h2>
              <Button asChild variant="ghost" size="sm">
                <Link href={blogPath}>
                  {locale === 'fi' ? 'Kaikki' : 'All posts'}
                  <ArrowRight className="ml-1 h-4 w-4" />
                </Link>
              </Button>
            </div>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
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
                    <CardHeader className="p-4 pb-2">
                      <p className="mb-1 text-xs text-muted-foreground">
                        {formatDate(post.frontmatter.date, locale)}
                        {post.frontmatter.author && ` · ${post.frontmatter.author}`}
                      </p>
                      <CardTitle className="line-clamp-2 text-base">
                        {post.frontmatter.title}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 pt-0">
                      <CardDescription className="line-clamp-2 text-sm">
                        {post.content.slice(0, 100).replace(/[#*_\[\]]/g, '')}...
                      </CardDescription>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </section>
        </div>

        {/* Sidebar - Benefits + CTA */}
        <aside className="space-y-8">
          {/* Benefits */}
          <section>
            <h2 className="mb-4 text-xl font-semibold">{tBenefits('title')}</h2>
            <div className="space-y-4">
              {features.map((feature, index) => (
                <div key={index} className="flex gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted">
                    <feature.icon className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-medium">{feature.title}</h3>
                    <p className="text-sm text-muted-foreground">{feature.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* CTA */}
          <Card className="bg-muted/50">
            <CardHeader>
              <CardTitle className="text-lg">{t('title')}</CardTitle>
              <CardDescription>
                {locale === 'fi'
                  ? 'Liity mukaan kognitiotieteen alumniyhteisöön.'
                  : 'Join the cognitive science alumni community.'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button asChild className="w-full">
                <Link href={membershipHref}>{t('join')}</Link>
              </Button>
              <Button asChild variant="outline" className="w-full">
                <Link href={loginHref}>{t('login')}</Link>
              </Button>
            </CardContent>
          </Card>
        </aside>
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

function VocabularySection() {
  const locale = useLocale();
  const isEnglish = locale === 'en';
  const vocabularyPath = isEnglish ? '/vocabulary' : '/sanasto';

  const sections = [
    { slug: 'a-c', label: 'A–C' },
    { slug: 'd-f', label: 'D–F' },
    { slug: 'g-i', label: 'G–I' },
    { slug: 'j-l', label: 'J–L' },
    { slug: 'm-o', label: 'M–O' },
    { slug: 'p-r', label: 'P–R' },
    { slug: 's-u', label: 'S–U' },
    { slug: isEnglish ? 'v-z' : 'v-o', label: isEnglish ? 'V–Z' : 'V–Ö' },
  ];

  const featuredTerms = isEnglish
    ? ['Cognition', 'Consciousness', 'Memory', 'Perception', 'Qualia', 'Representation']
    : ['Kognitio', 'Tietoisuus', 'Muisti', 'Havainto', 'Kvaliat', 'Representaatio'];

  return (
    <section className="border-t bg-linear-to-b from-muted/30 to-background">
      <div className="container mx-auto px-4 py-16">
        <div className="mx-auto max-w-4xl text-center">
          {/* Header */}
          <div className="mb-8">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary">
              <svg
                className="h-4 w-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                />
              </svg>
              {isEnglish ? 'Learning Resource' : 'Oppimateriaali'}
            </div>
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              {isEnglish ? 'Cognitive Science Glossary' : 'Kognitiotieteen sanasto'}
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              {isEnglish
                ? 'Over 100 key terms from psychology, neuroscience, AI, and philosophy of mind — explained clearly in Finnish and English.'
                : 'Yli 100 keskeistä käsitettä psykologiasta, neurotieteestä, tekoälystä ja mielenfilosofiasta — selkeästi selitettynä suomeksi ja englanniksi.'}
            </p>
          </div>

          {/* Featured terms */}
          <div className="mb-8 flex flex-wrap justify-center gap-2">
            {featuredTerms.map((term) => (
              <span
                key={term}
                className="rounded-full border border-border bg-background px-3 py-1 text-sm"
              >
                {term}
              </span>
            ))}
            <span className="rounded-full border border-dashed border-muted-foreground/50 px-3 py-1 text-sm text-muted-foreground">
              +100 {isEnglish ? 'more' : 'lisää'}
            </span>
          </div>

          {/* Section navigation */}
          <div className="mb-8 flex flex-wrap justify-center gap-2">
            {sections.map((section) => (
              <Link
                key={section.slug}
                href={`${vocabularyPath}/${section.slug}`}
                className="rounded-lg border border-border bg-card px-4 py-2 text-sm font-medium transition-colors hover:border-primary hover:bg-accent"
              >
                {section.label}
              </Link>
            ))}
          </div>

          {/* CTA */}
          <Button asChild size="lg">
            <Link href={vocabularyPath}>
              {isEnglish ? 'Explore the Glossary' : 'Tutustu sanastoon'}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
