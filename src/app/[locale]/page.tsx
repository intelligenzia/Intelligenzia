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
      ? 'Intelligenzia - Kognitiotieteen alumniyhdistys'
      : 'Intelligenzia - Cognitive Science Alumni Society',
    description: locale === 'fi'
      ? 'Intelligenzia ry on kognitiotieteen alumniyhdistys Helsingin yliopistosta. Liity mukaan verkostoitumaan alan ammattilaisten kanssa.'
      : 'Intelligenzia is a cognitive science alumni society from the University of Helsinki. Join us to network with professionals in the field.',
    openGraph: {
      title: 'Intelligenzia',
      description: locale === 'fi'
        ? 'Kognitiotieteen alumniyhdistys'
        : 'Cognitive Science Alumni Society',
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
