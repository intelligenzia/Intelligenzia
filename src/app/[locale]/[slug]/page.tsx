import { notFound } from 'next/navigation';
import { setRequestLocale } from 'next-intl/server';
import { getPage } from '@/lib/content';
import { getContentSlug, getPageSlugs, pageMapping, getAlternateSlug } from '@/lib/page-mapping';
import { Markdown } from '@/components/markdown';
import { TableOfContents } from '@/components/table-of-contents';
import { BreadcrumbJsonLd, FAQPageJsonLd } from '@/components/json-ld';
import type { Metadata } from 'next';

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://intelligenzia.fi';

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

function getPageUrl(locale: string, slug: string): string {
  if (locale === 'fi') {
    return `${baseUrl}/${slug}`;
  }
  return `${baseUrl}/en/${slug}`;
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

  const pageUrl = getPageUrl(locale, slug);
  const alternateSlug = getAlternateSlug(locale, slug);

  const languages: Record<string, string> = {};
  if (locale === 'fi') {
    languages['fi'] = `/${slug}`;
    if (alternateSlug) {
      languages['en'] = `/en/${alternateSlug}`;
    }
  } else {
    languages['en'] = `/en/${slug}`;
    if (alternateSlug) {
      languages['fi'] = `/${alternateSlug}`;
    }
  }

  return {
    title: page.frontmatter.title,
    description: page.frontmatter.description,
    alternates: {
      canonical: locale === 'fi' ? `/${slug}` : `/en/${slug}`,
      languages,
    },
    openGraph: {
      title: page.frontmatter.title,
      description: page.frontmatter.description,
      url: pageUrl,
      siteName: 'Intelligenzia',
      locale: locale === 'fi' ? 'fi_FI' : 'en_US',
      alternateLocale: locale === 'fi' ? 'en_US' : 'fi_FI',
      type: 'article',
    },
  };
}

// FAQ data for cognitive-science-vs-psychology pages
const faqData: Record<string, { question: string; answer: string }[]> = {
  'cognitive-science-vs-psychology': [
    {
      question: 'What is the difference between cognitive science and psychology?',
      answer: 'Cognitive science is a multidisciplinary field combining psychology, neuroscience, linguistics, philosophy, AI, and anthropology to study the mind broadly. Psychology is a unified discipline focused on human behavior and mental processes, with a stronger emphasis on experimental and clinical methods.',
    },
    {
      question: 'Is cognitive science the same as cognitive psychology?',
      answer: 'No. Cognitive psychology is a subfield of psychology that studies information processing (perception, attention, memory, language). Cognitive science is broader — it includes cognitive psychology but also incorporates philosophy, AI, linguistics, and neuroscience.',
    },
    {
      question: 'Can you study both cognitive science and psychology?',
      answer: "Yes. Many students combine psychology and cognitive science studies, for example by doing a psychology bachelor's followed by a cognitive science master's, or by specializing in cognitive psychology.",
    },
    {
      question: 'What careers can you pursue with cognitive science vs psychology?',
      answer: 'Cognitive science leads to careers in AI, UX design, technology, and research. Psychology leads to clinical work (therapy, diagnostics), organizational psychology, and school psychology. Both can lead to academic research careers.',
    },
  ],
  'kognitiotiede-vs-psykologia': [
    {
      question: 'Mitä eroa on kognitiotieteellä ja psykologialla?',
      answer: 'Kognitiotiede on monitieteinen ala, joka yhdistää psykologian, neurotieteen, kielitieteen, filosofian, tekoälyn ja antropologian tutkiakseen mieltä laajasti. Psykologia on yhtenäinen tieteenala, joka keskittyy ihmisen käyttäytymiseen ja mielen prosesseihin kokeellisin ja kliinisin menetelmin.',
    },
    {
      question: 'Onko kognitiotiede sama kuin kognitiivinen psykologia?',
      answer: 'Ei. Kognitiivinen psykologia on psykologian osa-alue, joka tutkii tiedonkäsittelyä (havaitseminen, tarkkaavuus, muisti, kieli). Kognitiotiede on laajempi — se sisältää kognitiivisen psykologian, mutta myös filosofian, tekoälyn, kielitieteen ja neurotieteen.',
    },
    {
      question: 'Voiko opiskella sekä kognitiotiedettä että psykologiaa?',
      answer: 'Kyllä. Monet yhdistävät psykologian ja kognitiotieteen opinnot, esimerkiksi suorittamalla psykologian kandidaatin tutkinnon ja sen jälkeen kognitiotieteen maisterin tutkinnon, tai erikoistumalla kognitiiviseen psykologiaan.',
    },
    {
      question: 'Mihin kognitiotieteellä ja psykologialla työllistyy?',
      answer: 'Kognitiotiede johtaa uriin tekoälyn, UX-suunnittelun, teknologian ja tutkimuksen parissa. Psykologia johtaa kliiniseen työhön (terapia, diagnostiikka), organisaatiopsykologiaan ja koulupsykologiaan. Molemmat voivat johtaa akateemiseen tutkimusuraan.',
    },
  ],
};

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

  const pageUrl = getPageUrl(locale, slug);
  const homeName = locale === 'fi' ? 'Etusivu' : 'Home';
  const faq = faqData[slug];

  return (
    <div className="container mx-auto px-4 py-12">
      <BreadcrumbJsonLd
        items={[
          { name: homeName, url: locale === 'fi' ? baseUrl : `${baseUrl}/en` },
          { name: page.frontmatter.title, url: pageUrl },
        ]}
      />
      {faq && <FAQPageJsonLd items={faq} />}

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
