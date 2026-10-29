import { useTranslations, useLocale } from 'next-intl';
import { setRequestLocale } from 'next-intl/server';
import Image from 'next/image';
import { Link } from '@/i18n/navigation';
import { ArrowRight, ArrowUpRight } from 'lucide-react';
import { getAllBlogPosts, getExcerpt } from '@/lib/content';
import { vocabularyTerms } from '@/lib/vocabulary-data';
import { FULL_PRICE } from '@/lib/membership';
import { OrganizationJsonLd, WebSiteJsonLd } from '@/components/json-ld';
import HeroSection from '@/components/hero-section';
import { SloanHexagon } from '@/components/sloan-hexagon';
import { ScrubText } from '@/components/home/scrub-text';
import { ScrollFigure } from '@/components/home/scroll-figure';
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
      <MembershipSection />
      <WritingSection />
      <GlossarySection />
      <JoinSection />
    </div>
  );
}

/**
 * What the field is: one defining sentence read at scroll pace, then a bento
 * of the long-form explainer, the interactive Sloan hexagon, and the existing
 * long-form pages.
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
      <div className="container mx-auto px-4 py-24 md:py-36">
        <ScrubText
          text={t('body1')}
          className="display-lg max-w-6xl text-[clamp(1.75rem,3.6vw,3.25rem)] leading-[1.08] [text-wrap:pretty]"
        />

        {/* Bento, 12 columns: explainer (5) + hexagon (7) across two rows,
            readings full width on the third. No empty cells. */}
        <div className="mt-20 grid grid-flow-dense grid-cols-1 gap-4 md:mt-28 lg:grid-cols-12">
          <article className="group flex flex-col overflow-hidden border bg-card lg:col-span-5 lg:row-span-2">
            <div className="relative aspect-[16/10] overflow-hidden bg-muted">
              <Image
                src="/blog/penkere.jpeg"
                alt={
                  isEnglish
                    ? 'University of Helsinki buildings by the shore in Siltasaari'
                    : 'Helsingin yliopiston rakennuksia rannassa'
                }
                fill
                sizes="(min-width: 1024px) 40vw, 100vw"
                className="object-cover grayscale-[0.4] transition-[transform,filter] duration-700 ease-out group-hover:scale-105 group-hover:grayscale-0 motion-reduce:transition-none"
              />
            </div>
            <div className="flex flex-1 flex-col gap-5 p-7 md:p-9">
              <h2 className="display-lg text-[clamp(1.875rem,3.4vw,2.75rem)]">{t('title')}</h2>
              <p className="max-w-[52ch] font-serif text-lg leading-relaxed text-muted-foreground">
                {t('body2')}
              </p>
              <Link
                href={overviewHref}
                className="mt-auto inline-flex w-fit items-center gap-2 font-display text-[15px] font-semibold text-primary underline-offset-4 hover:underline"
              >
                {t('readMore')}
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </article>

          <div className="flex flex-col justify-center border bg-card p-4 md:p-8 lg:col-span-7 lg:row-span-2">
            <SloanHexagon />
          </div>

          <ul className="grid gap-px overflow-hidden border bg-border sm:grid-cols-2 lg:col-span-12 lg:grid-cols-3">
            {readings.map((r) => (
              <li key={r.href}>
                <Link
                  href={r.href}
                  className="group flex h-full items-center justify-between gap-4 bg-card px-6 py-5 transition-colors hover:bg-accent"
                >
                  <span className="font-display text-base font-semibold">{r.label}</span>
                  <ArrowUpRight className="h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-primary" />
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

/**
 * Membership benefits as a pinned split: the offer stays put on the left
 * while the four benefits pass by on the right.
 */
function MembershipSection() {
  const locale = useLocale();
  const isEnglish = locale === 'en';
  const t = useTranslations('membership');
  const tBenefits = useTranslations('membership.benefits');
  const membershipHref = isEnglish ? '/join' : '/jaseneksi';
  const loginHref = isEnglish ? '/login' : '/kirjaudu';

  const benefits = [
    {
      title: tBenefits('networking'),
      description: isEnglish
        ? 'Meet professionals in the field and expand your network.'
        : 'Tapaa alan ammattilaisia ja laajenna verkostoasi.',
      image: '/blog/mentoring.jpeg',
      alt: isEnglish ? 'Two people working together at a laptop' : 'Kaksi ihmistä työskentelee yhdessä kannettavan äärellä',
    },
    {
      title: tBenefits('events'),
      description: isEnglish
        ? 'Take part in member events and seminars.'
        : 'Osallistu jäsentapahtumiin ja seminaareihin.',
      image: '/blog/yhdistys.jpg',
      alt: isEnglish ? 'Members in evening dress at an Intelligenzia celebration' : 'Jäseniä iltapuvuissa Intelligenzian juhlassa',
    },
    {
      title: tBenefits('newsletter'),
      description: isEnglish
        ? 'Stay up to date with developments in the field.'
        : 'Pysy ajan tasalla alan kehityksestä.',
      image: '/blog/studying.jpg',
      alt: isEnglish ? 'People taking notes around a table' : 'Ihmisiä tekemässä muistiinpanoja pöydän ääressä',
    },
    {
      title: tBenefits('community'),
      description: isEnglish
        ? 'Since September 2021 Intelligenzia has been an alumni society, keeping the community together after graduation.'
        : 'Syyskuusta 2021 Intelligenzia on ollut alumniyhdistys, joka pitää yhteisön koossa valmistumisen jälkeenkin.',
      image: '/blog/social.jpg',
      alt: isEnglish ? 'A group talking over dinner' : 'Seurue keskustelee illallisella',
    },
  ];

  return (
    <section className="border-b bg-muted/40">
      <div className="container mx-auto grid gap-16 px-4 py-24 md:py-36 lg:grid-cols-12 lg:gap-12">
        <div className="lg:col-span-5">
          <div className="flex flex-col items-start gap-6 lg:sticky lg:top-32">
            <h2 className="display-lg text-[clamp(2.25rem,4.4vw,3.75rem)]">{tBenefits('title')}</h2>
            <p className="max-w-[40ch] text-lg leading-relaxed text-muted-foreground">
              {isEnglish
                ? 'A yearly membership keeps the network, the events and the glossary going.'
                : 'Vuosittainen jäsenyys pitää verkoston, tapahtumat ja sanaston käynnissä.'}
            </p>
            <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
              <Link
                href={membershipHref}
                className="inline-flex items-center gap-3 rounded-sm bg-primary px-5 py-3.5 font-display text-[15px] font-semibold text-primary-foreground transition-[background-color,transform] duration-200 hover:bg-primary/90 active:scale-[0.98]"
              >
                {t('join')}
                <span className="font-mono text-xs font-normal opacity-75">
                  {isEnglish ? `€${FULL_PRICE}/year` : `${FULL_PRICE} €/vuosi`}
                </span>
              </Link>
              <Link
                href={loginHref}
                className="text-sm font-medium text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
              >
                {t('alreadyMember')} {t('login')}
              </Link>
            </div>
          </div>
        </div>

        <ul className="flex flex-col gap-20 md:gap-28 lg:col-span-7">
          {benefits.map((b) => (
            <li key={b.title}>
              <ScrollFigure className="origin-center">
                <div className="group relative aspect-[4/3] overflow-hidden bg-muted">
                  <Image
                    src={b.image}
                    alt={b.alt}
                    fill
                    sizes="(min-width: 1024px) 55vw, 100vw"
                    className="object-cover grayscale-[0.35] contrast-[1.05] transition-[transform,filter] duration-700 ease-out group-hover:scale-105 group-hover:grayscale-0 motion-reduce:transition-none"
                  />
                </div>
              </ScrollFigure>
              <div className="mt-6 grid gap-2 md:grid-cols-[1fr_1.3fr] md:gap-8">
                <h3 className="display-md text-2xl">{b.title}</h3>
                <p className="font-serif text-lg leading-relaxed text-muted-foreground">
                  {b.description}
                </p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

/** Latest three posts: one lead, two stacked beside it. */
function WritingSection() {
  const locale = useLocale();
  const tHome = useTranslations('home');
  const posts = getAllBlogPosts(locale).slice(0, 3);
  const blogPath = locale === 'fi' ? '/blogi' : '/blog';

  if (posts.length === 0) return null;
  const [lead, ...rest] = posts;

  return (
    <section className="border-b">
      <div className="container mx-auto px-4 py-24 md:py-36">
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

        {/* 12 columns: lead spans 7 x 2 rows, the others 5 x 1 each. */}
        <div className="grid grid-flow-dense gap-4 lg:grid-cols-12 lg:grid-rows-2">
          <Link
            href={`${blogPath}/${lead.slug}`}
            className="group flex flex-col overflow-hidden border bg-card lg:col-span-7 lg:row-span-2"
          >
            <div className="relative aspect-[16/9] overflow-hidden bg-muted lg:aspect-auto lg:min-h-[320px] lg:flex-1">
              {lead.frontmatter.cover && (
                <Image
                  src={`/blog/${lead.frontmatter.cover}`}
                  alt=""
                  fill
                  sizes="(min-width: 1024px) 58vw, 100vw"
                  className="object-cover grayscale-[0.4] transition-[transform,filter] duration-700 ease-out group-hover:scale-105 group-hover:grayscale-0 motion-reduce:transition-none"
                />
              )}
            </div>
            <div className="flex flex-col gap-3 p-7 md:p-9">
              <PostMeta date={lead.frontmatter.date} author={lead.frontmatter.author} locale={locale} />
              <h3 className="display-lg text-[clamp(1.625rem,2.6vw,2.25rem)] group-hover:text-primary">
                {lead.frontmatter.title}
              </h3>
              <p className="line-clamp-2 max-w-[60ch] font-serif text-lg text-muted-foreground">
                {getExcerpt(lead, 180)}
              </p>
            </div>
          </Link>

          {rest.map((post) => (
            <Link
              key={post.slug}
              href={`${blogPath}/${post.slug}`}
              className="group grid grid-cols-[38%_1fr] overflow-hidden border bg-card lg:col-span-5"
            >
              <div className="relative min-h-40 overflow-hidden bg-muted">
                {post.frontmatter.cover && (
                  <Image
                    src={`/blog/${post.frontmatter.cover}`}
                    alt=""
                    fill
                    sizes="(min-width: 1024px) 16vw, 38vw"
                    className="object-cover grayscale-[0.4] transition-[transform,filter] duration-700 ease-out group-hover:scale-105 group-hover:grayscale-0 motion-reduce:transition-none"
                  />
                )}
              </div>
              <div className="flex flex-col gap-2 p-5 md:p-6">
                <PostMeta date={post.frontmatter.date} author={post.frontmatter.author} locale={locale} />
                <h3 className="display-md line-clamp-3 text-xl group-hover:text-primary">
                  {post.frontmatter.title}
                </h3>
              </div>
            </Link>
          ))}
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
    <section className="border-b bg-muted/40">
      <div className="container mx-auto px-4 py-24 md:py-36">
        <div className="mb-14 flex max-w-3xl flex-col gap-5">
          <p className="eyebrow">{isEnglish ? 'Glossary' : 'Sanasto'}</p>
          <h2 className="display-lg text-[clamp(2.25rem,4.4vw,3.75rem)]">
            {isEnglish ? 'Cognitive science glossary' : 'Kognitiotieteen sanasto'}
          </h2>
          {/* The glossary data pairs every term with its English equivalent
              but defines them in Finnish only, so the English copy says so
              rather than implying English definitions exist. */}
          <p className="max-w-[58ch] text-lg leading-relaxed text-muted-foreground">
            {isEnglish
              ? `${vocabularyTerms.length} key terms from psychology, neuroscience, AI and philosophy of mind, each paired with its Finnish equivalent and defined in Finnish.`
              : `${vocabularyTerms.length} keskeistä käsitettä psykologiasta, neurotieteestä, tekoälystä ja mielenfilosofiasta, jokainen suomeksi ja englanniksi.`}
          </p>
        </div>

        {/* Bilingualism as structure: the term in condensed display, its
            translation pinned beneath in mono, the definition in serif. */}
        <div className="grid gap-px overflow-hidden border bg-border md:grid-cols-2">
          {showcase.map((term) => (
            <Link
              key={term.finnish}
              href={`${vocabularyPath}/${term.slug}`}
              className="group flex flex-col gap-4 bg-card p-7 transition-colors hover:bg-accent md:p-9"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex flex-col gap-1">
                  <span className="display-lg text-[clamp(1.75rem,2.8vw,2.5rem)] group-hover:text-primary">
                    {isEnglish ? term.english : term.finnish}
                  </span>
                  <span className="font-mono text-xs text-primary">
                    {isEnglish ? term.finnish.toLowerCase() : term.english.toLowerCase()}
                  </span>
                </div>
                <ArrowUpRight className="mt-2 h-5 w-5 shrink-0 text-muted-foreground transition-transform duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-primary" />
              </div>
              <p className="line-clamp-3 max-w-[56ch] font-serif text-[17px] leading-relaxed text-muted-foreground">
                {term.description}
              </p>
            </Link>
          ))}
        </div>

        <div className="mt-8 flex flex-col gap-5 md:flex-row md:items-center">
          <nav
            aria-label={isEnglish ? 'Glossary sections' : 'Sanaston osiot'}
            className="-mx-4 flex snap-x gap-2 overflow-x-auto px-4 pb-1 md:mx-0 md:px-0"
          >
            {sections.map((section) => (
              <Link
                key={section.slug}
                href={`${vocabularyPath}/${section.slug}`}
                className="shrink-0 snap-start rounded-sm border bg-card px-4 py-2.5 font-mono text-sm transition-colors hover:border-primary hover:text-primary"
              >
                {section.label}
              </Link>
            ))}
          </nav>
          <Link
            href={vocabularyPath}
            className="inline-flex shrink-0 items-center gap-2 font-display text-[15px] font-semibold text-primary underline-offset-4 hover:underline md:ml-auto"
          >
            {isEnglish ? 'Explore the glossary' : 'Tutustu sanastoon'}
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}

/** The closing ask: one large statement, one action. */
function JoinSection() {
  const locale = useLocale();
  const isEnglish = locale === 'en';
  const t = useTranslations('membership');
  const membershipHref = isEnglish ? '/join' : '/jaseneksi';

  const photo = (
    <span
      aria-hidden="true"
      className="mx-[0.12em] inline-block h-[0.78em] w-[1.6em] bg-cover bg-center align-[-0.04em] grayscale-[0.2]"
      style={{ backgroundImage: "url('/blog/social.jpg')" }}
    />
  );

  return (
    <section className="relative isolate overflow-hidden">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(50%_80%_at_50%_100%,color-mix(in_oklch,var(--primary)_10%,transparent),transparent_70%)]"
      />
      <div className="container mx-auto flex flex-col items-center px-4 py-28 text-center md:py-44">
        <h2 className="display-hero max-w-6xl text-[clamp(2.5rem,7vw,6.5rem)]">
          {isEnglish ? (
            <>Join the {photo} alumni community</>
          ) : (
            <>Liity {photo} alumniyhteisöön</>
          )}
        </h2>
        <p className="mt-8 max-w-[46ch] text-lg leading-relaxed text-muted-foreground">
          {isEnglish
            ? `Full membership is €${FULL_PRICE} a year for cognitive science students and graduates. Anyone interested in the field can join as a supporting member.`
            : `Varsinainen jäsenyys maksaa ${FULL_PRICE} € vuodessa kognitiotieteen opiskelijoille ja valmistuneille. Alasta kiinnostuneet voivat liittyä kannatusjäseniksi.`}
        </p>
        <Link
          href={membershipHref}
          className="mt-10 inline-flex items-center gap-3 rounded-sm bg-primary px-7 py-4 font-display text-base font-semibold text-primary-foreground transition-[background-color,transform] duration-200 hover:bg-primary/90 active:scale-[0.98]"
        >
          {t('join')}
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </section>
  );
}
