import { useTranslations, useLocale } from 'next-intl';
import { setRequestLocale } from 'next-intl/server';
import Image from 'next/image';
import { Link } from '@/i18n/navigation';
import { ArrowRight, ArrowUpRight } from 'lucide-react';
import { getAllBlogPosts, getExcerpt } from '@/lib/content';
import { vocabularyTerms } from '@/lib/vocabulary-data';
import { FULL_PRICE, MIN_SUPPORTING_PRICE } from '@/lib/membership';
import { OrganizationJsonLd, WebSiteJsonLd } from '@/components/json-ld';
import HeroSection from '@/components/hero-section';
import {
  DISCIPLINES,
  INTERDISCIPLINES,
  disciplineLabel,
  interdisciplineLabel,
} from '@/lib/disciplines';
import { ScrubText } from '@/components/home/scrub-text';
import type { Metadata } from 'next';
import { localizedAlternates, localizedUrl } from '@/lib/seo';

type Props = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
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
        ? 'Kognitiotieteen ammattilaiset ja opiskelijat yhdessä: verkostoidu ja löydä uramahdollisuuksia.'
        : 'Cognitive science professionals and students together: network and discover career opportunities.',
      url: localizedUrl(locale === 'en' ? 'en' : 'fi', '/'),
      siteName: 'Intelligenzia',
      locale: locale === 'fi' ? 'fi_FI' : 'en_US',
      alternateLocale: locale === 'fi' ? 'en_US' : 'fi_FI',
      type: 'website',
    },
    alternates: localizedAlternates(locale, { fi: '/', en: '/' }),
  };
}

export default async function HomePage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <div className="w-full max-w-full overflow-x-clip">
      <OrganizationJsonLd locale={locale} />
      <WebSiteJsonLd locale={locale} />
      <HeroSection />
      <FieldSection />
      <WritingSection />
      <GlossarySection />
      <MembershipSection />
    </div>
  );
}

/**
 * What the field is: one defining sentence read at scroll pace, then the
 * explainer beside the eleven interdisciplines the hero's hexagon draws, and
 * the long-form pages that go deeper.
 */
function FieldSection() {
  const locale = useLocale();
  const t = useTranslations('home.field');
  const isEnglish = locale === 'en';

  // Existing content pages, paired across locales.
  const readings = isEnglish
    ? [
        { href: '/what-is-cognitive-science', label: 'What is cognitive science?' },
        { href: '/cognitive-science-vs-psychology', label: 'Cognitive science vs psychology' },
        { href: '/history-of-cognitive-science', label: 'History of cognitive science' },
        { href: '/ai-and-cognitive-science', label: 'AI and cognitive science' },
        { href: '/consciousness-cognitive-science', label: 'Consciousness' },
        { href: '/cognitive-science-careers', label: 'Careers' },
      ]
    : [
        { href: '/mita-on-kognitiotiede', label: 'Mitä on kognitiotiede?' },
        { href: '/kognitiotiede-vs-psykologia', label: 'Kognitiotiede vs. psykologia' },
        { href: '/kognitiotieteen-historia', label: 'Kognitiotieteen historia' },
        { href: '/tekoaly-ja-kognitiotiede', label: 'Tekoäly ja kognitiotiede' },
        { href: '/tietoisuus-kognitiotiede', label: 'Tietoisuus' },
        { href: '/kognitiotieteen-urat', label: 'Urapolut' },
      ];

  const overviewHref = isEnglish ? '/cognitive-science' : '/kognitiotiede';

  return (
    <section className="border-b">
      <div className="container mx-auto px-4 py-24 md:py-32">
        <ScrubText
          text={t('body1')}
          className="display-lg max-w-6xl text-[clamp(1.75rem,3.6vw,3.25rem)] leading-[1.08] text-pretty"
        />

        <div className="mt-20 grid gap-14 md:mt-24 lg:grid-cols-12 lg:gap-12">
          <div className="flex flex-col gap-6 lg:col-span-5">
            <div className="relative aspect-[16/10] overflow-hidden bg-muted">
              <Image
                src="/blog/penkere.jpeg"
                alt={
                  isEnglish
                    ? 'University of Helsinki buildings on the shore'
                    : 'Helsingin yliopiston rakennuksia rannassa'
                }
                fill
                sizes="(min-width: 1024px) 40vw, 100vw"
                className="object-cover"
              />
            </div>
            <h2 className="display-lg text-[clamp(1.875rem,3.4vw,2.75rem)]">{t('title')}</h2>
            <p className="max-w-[52ch] font-serif text-lg leading-relaxed text-pretty text-muted-foreground">
              {t('body2')}
            </p>
            <Link
              href={overviewHref}
              className="inline-flex w-fit items-center gap-2 font-display text-[15px] font-semibold text-primary underline-offset-4 hover:underline"
            >
              {t('readMore')}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          {/* The edges of the hero's hexagon, spelled out. Real content from
              the Sloan report, not decoration. */}
          <div className="lg:col-span-7">
            <h3 className="display-md text-2xl text-balance">
              {isEnglish
                ? 'Six disciplines, eleven interdisciplines'
                : 'Kuusi tieteenalaa, yksitoista rajapintaa'}
            </h3>
            <p className="mt-3 max-w-[56ch] font-serif text-[17px] leading-relaxed text-pretty text-muted-foreground">
              {isEnglish
                ? 'The 1978 Sloan Foundation report drew the field as a hexagon. These are the connections it named between the disciplines.'
                : 'Sloan-säätiön raportti piirsi alan vuonna 1978 kuusikulmioksi. Nämä ovat sen nimeämät yhteydet tieteenalojen välillä.'}
            </p>
            <ul className="mt-8 grid border-t sm:grid-cols-2 sm:gap-x-10">
              {INTERDISCIPLINES.map((link) => (
                <li key={link.en} className="flex flex-col gap-0.5 border-b py-3.5">
                  <span className="font-display text-base font-semibold">
                    {interdisciplineLabel(link, locale)}
                  </span>
                  <span className="font-mono text-xs text-muted-foreground">
                    {disciplineLabel(DISCIPLINES[link.a], locale)} ×{' '}
                    {disciplineLabel(DISCIPLINES[link.b], locale)}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <nav
          aria-label={isEnglish ? 'Read more about the field' : 'Lue lisää alasta'}
          className="mt-20 grid gap-x-10 sm:grid-cols-2 lg:grid-cols-3"
        >
          {readings.map((r) => (
            <Link
              key={r.href}
              href={r.href}
              className="group flex items-center justify-between gap-4 border-t py-4 transition-colors hover:text-primary"
            >
              <span className="font-display text-lg font-semibold">{r.label}</span>
              <ArrowUpRight className="h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-primary motion-reduce:transition-none" />
            </Link>
          ))}
        </nav>
      </div>
    </section>
  );
}

/** Latest three posts: one lead with its photo, two as text beside it. */
function WritingSection() {
  const locale = useLocale();
  const tHome = useTranslations('home');
  const posts = getAllBlogPosts(locale).slice(0, 3);
  const blogPath = locale === 'fi' ? '/blogi' : '/blog';

  if (posts.length === 0) return null;
  const [lead, ...rest] = posts;

  return (
    <section className="border-b bg-muted/40">
      <div className="container mx-auto px-4 py-20 md:py-28">
        <div className="mb-12 flex items-end justify-between gap-6">
          <h2 className="display-lg text-[clamp(2.25rem,4.4vw,3.75rem)]">{tHome('fromBlog')}</h2>
          <Link
            href={blogPath}
            className="inline-flex shrink-0 items-center gap-2 font-display text-[15px] font-semibold text-primary underline-offset-4 hover:underline"
          >
            {tHome('allPosts')}
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="grid gap-12 lg:grid-cols-12 lg:gap-12">
          <Link href={`${blogPath}/${lead.slug}`} className="group flex flex-col gap-5 lg:col-span-7">
            {lead.frontmatter.cover && (
              <div className="relative aspect-[16/9] overflow-hidden bg-muted">
                <Image
                  src={`/blog/${lead.frontmatter.cover}`}
                  alt=""
                  fill
                  sizes="(min-width: 1024px) 58vw, 100vw"
                  className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.03] motion-reduce:transition-none"
                />
              </div>
            )}
            <PostMeta date={lead.frontmatter.date} author={lead.frontmatter.author} locale={locale} />
            <h3 className="display-lg -mt-2 text-[clamp(1.625rem,2.6vw,2.25rem)] text-balance group-hover:text-primary">
              {lead.frontmatter.title}
            </h3>
            <p className="line-clamp-3 max-w-[60ch] font-serif text-lg text-pretty text-muted-foreground">
              {getExcerpt(lead, 200)}
            </p>
          </Link>

          <ul className="flex flex-col lg:col-span-5">
            {rest.map((post) => (
              <li key={post.slug} className="border-t first:border-t-0 lg:first:border-t">
                <Link href={`${blogPath}/${post.slug}`} className="group flex flex-col gap-3 py-7">
                  <PostMeta date={post.frontmatter.date} author={post.frontmatter.author} locale={locale} />
                  <h3 className="display-md text-2xl text-balance group-hover:text-primary">
                    {post.frontmatter.title}
                  </h3>
                  <p className="line-clamp-2 font-serif text-[17px] text-pretty text-muted-foreground">
                    {getExcerpt(post, 140)}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

function PostMeta({ date, author, locale }: { date: string; author?: string; locale: string }) {
  return (
    <p className="font-mono text-xs text-muted-foreground">
      {formatDate(date, locale)}
      {author && ` · ${author}`}
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

function GlossarySection() {
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

  // Curated, but pulled from the real glossary so the showcase can never
  // advertise a term the data doesn't have.
  const showcaseTerms = ['Kvaliat', 'Muisti', 'Representaatio', 'Havainto'];
  const showcase = showcaseTerms
    .map((fi) => vocabularyTerms.find((term) => term.finnish === fi))
    .filter((term): term is (typeof vocabularyTerms)[number] => Boolean(term));

  return (
    <section className="border-b">
      <div className="container mx-auto grid gap-12 px-4 py-24 md:py-32 lg:grid-cols-12">
        <div className="flex flex-col gap-5 lg:col-span-4">
          <h2 className="display-lg text-[clamp(2.25rem,4.4vw,3.75rem)] text-balance">
            {isEnglish ? 'Cognitive science glossary' : 'Kognitiotieteen sanasto'}
          </h2>
          {/* The glossary data pairs every term with its English equivalent
              but defines them in Finnish only, so the English copy says so
              rather than implying English definitions exist. */}
          <p className="max-w-[46ch] text-lg leading-relaxed text-pretty text-muted-foreground">
            {isEnglish
              ? `${vocabularyTerms.length} key terms from psychology, neuroscience, AI and philosophy of mind, each paired with its Finnish equivalent and defined in Finnish.`
              : `${vocabularyTerms.length} keskeistä käsitettä psykologiasta, neurotieteestä, tekoälystä ja mielenfilosofiasta, jokainen suomeksi ja englanniksi.`}
          </p>
          <Link
            href={vocabularyPath}
            className="inline-flex w-fit items-center gap-2 font-display text-[15px] font-semibold text-primary underline-offset-4 hover:underline"
          >
            {isEnglish ? 'Explore the glossary' : 'Tutustu sanastoon'}
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="lg:col-span-8">
          {/* Dictionary entries, not cards: the term in condensed display,
              its translation in mono, the definition in serif. */}
          <dl className="grid border-t md:grid-cols-2 md:gap-x-10">
            {showcase.map((term) => (
              <div key={term.finnish} className="border-b">
                <Link href={`${vocabularyPath}/${term.slug}`} className="group flex flex-col gap-2 py-7">
                  <dt className="flex items-baseline gap-3">
                    <span className="display-lg text-[clamp(1.75rem,2.8vw,2.5rem)] group-hover:text-primary">
                      {isEnglish ? term.english : term.finnish}
                    </span>
                    <span className="font-mono text-xs text-primary">
                      {isEnglish ? term.finnish.toLowerCase() : term.english.toLowerCase()}
                    </span>
                  </dt>
                  <dd className="line-clamp-3 max-w-[48ch] font-serif text-[17px] leading-relaxed text-pretty text-muted-foreground">
                    {term.description}
                  </dd>
                </Link>
              </div>
            ))}
          </dl>

          <nav
            aria-label={isEnglish ? 'Glossary sections' : 'Sanaston osiot'}
            className="-mx-4 mt-8 flex snap-x gap-2 overflow-x-auto px-4 pb-1 md:mx-0 md:px-0"
          >
            {sections.map((section) => (
              <Link
                key={section.slug}
                href={`${vocabularyPath}/${section.slug}`}
                className="shrink-0 snap-start rounded-sm border px-4 py-2.5 font-mono text-sm transition-colors hover:border-primary hover:text-primary"
              >
                {section.label}
              </Link>
            ))}
          </nav>
        </div>
      </div>
    </section>
  );
}

/**
 * The closing ask, with the actual offer: both membership types, their real
 * prices and terms, one action. Mirrors the copy on the join page.
 */
function MembershipSection() {
  const locale = useLocale();
  const isEnglish = locale === 'en';
  const tBenefits = useTranslations('membership.benefits');
  const t = useTranslations('membership');
  const membershipHref = isEnglish ? '/join' : '/jaseneksi';
  const loginHref = isEnglish ? '/login' : '/kirjaudu';

  const types = isEnglish
    ? [
        {
          name: 'Full member',
          price: `€${FULL_PRICE} / year`,
          terms: 'For cognitive science majors, minors and graduates. Voting rights at society meetings. Renews yearly, cancel any time.',
        },
        {
          name: 'Supporting member',
          price: `from €${MIN_SUPPORTING_PRICE}`,
          terms: 'For anyone interested in cognitive science. One-time payment, valid for a year.',
        },
      ]
    : [
        {
          name: 'Varsinainen jäsen',
          price: `${FULL_PRICE} € / vuosi`,
          terms: 'Kognitiotieteen pää- tai sivuaineopiskelijoille ja valmistuneille. Äänioikeus yhdistyksen kokouksissa. Uusiutuu vuosittain, peru milloin vain.',
        },
        {
          name: 'Kannatusjäsen',
          price: `alk. ${MIN_SUPPORTING_PRICE} €`,
          terms: 'Kaikille kognitiotieteestä kiinnostuneille. Kertamaksu, voimassa vuoden.',
        },
      ];

  const benefits = [
    tBenefits('networking'),
    tBenefits('events'),
    tBenefits('newsletter'),
    tBenefits('community'),
  ];

  return (
    <section className="bg-muted/40">
      <div className="container mx-auto grid gap-12 px-4 py-24 md:py-32 lg:grid-cols-12 lg:items-center lg:gap-16">
        <div className="lg:col-span-7">
          <h2 className="display-hero text-[clamp(2.5rem,5.5vw,4.75rem)] text-balance">
            {isEnglish ? 'Two ways to join' : 'Kaksi tapaa liittyä'}
          </h2>

          <dl className="mt-10 border-t">
            {types.map((type) => (
              <div
                key={type.name}
                className="grid gap-2 border-b py-6 sm:grid-cols-[minmax(0,14rem)_1fr] sm:gap-8"
              >
                <dt className="flex flex-col gap-1">
                  <span className="display-md text-2xl">{type.name}</span>
                  <span className="font-mono text-sm text-primary tabular-nums">{type.price}</span>
                </dt>
                <dd className="max-w-[52ch] font-serif text-[17px] leading-relaxed text-pretty text-muted-foreground">
                  {type.terms}
                </dd>
              </div>
            ))}
          </dl>

          <p className="mt-6 max-w-[60ch] text-base leading-relaxed text-pretty text-muted-foreground">
            {isEnglish ? 'Both include: ' : 'Molempiin sisältyy: '}
            {benefits.map((b) => b.charAt(0).toLowerCase() + b.slice(1)).join(', ')}.
          </p>

          <div className="mt-10 flex flex-wrap items-center gap-x-6 gap-y-3">
            <Link
              href={membershipHref}
              className="inline-flex items-center gap-3 rounded-sm bg-primary px-6 py-4 font-display text-base font-semibold text-primary-foreground transition-[background-color,transform] duration-200 hover:bg-primary/90 active:scale-[0.98] motion-reduce:transition-none"
            >
              {isEnglish ? 'Choose a membership' : 'Valitse jäsenyys'}
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href={loginHref}
              className="text-sm font-medium text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
            >
              {t('alreadyMember')} {t('login')}
            </Link>
          </div>
        </div>

        <div className="relative aspect-[4/3] overflow-hidden bg-muted lg:col-span-5 lg:aspect-[4/5]">
          <Image
            src="/blog/yhdistys.jpg"
            alt={
              isEnglish
                ? 'Members in evening dress at an Intelligenzia celebration'
                : 'Jäseniä iltapuvuissa Intelligenzian juhlassa'
            }
            fill
            sizes="(min-width: 1024px) 40vw, 100vw"
            className="object-cover"
          />
        </div>
      </div>
    </section>
  );
}
