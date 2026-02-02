import { setRequestLocale } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { VocabularySearch } from '@/components/vocabulary-search';
import type { Metadata } from 'next';

type Props = {
  params: Promise<{ locale: string }>;
};

const vocabularySections = [
  { slug: 'a-c', title: 'A–C', description: 'Abduktio, adaptaatio, algoritmi, behaviorismi...' },
  { slug: 'd-f', title: 'D–F', description: 'Deduktio, dualismi, empiirinen menetelmä, evoluutio...' },
  { slug: 'g-i', title: 'G–I', description: 'Geeni, genetiikka, havainto, holismi, hypoteesi...' },
  { slug: 'j-l', title: 'J–L', description: 'Kausaliteetti, kieli, kognitio, konnektionismi...' },
  { slug: 'm-o', title: 'M–O', description: 'Marrin tasot, materialismi, muisti, neurologia...' },
  { slug: 'p-r', title: 'P–R', description: 'Plastisuus, positivismi, propositio, psykologia...' },
  { slug: 's-u', title: 'S–U', description: 'Semantiikka, symbolinen järjestelmä, tarkkaavuus...' },
  { slug: 'v-o', title: 'V–Ö', description: 'Valenssi, vinouma, yksinkertaisuus, ärsyke...' },
];

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'Kognitiotieteen sanasto',
    description:
      'Kattava kognitiotieteen sanasto suomeksi. Selitykset keskeisille käsitteille psykologiasta, neurotieteestä, tekoälystä ja mielenfilosofiasta.',
    keywords: [
      'kognitiotiede',
      'sanasto',
      'käsitteet',
      'termit',
      'neurotiede',
      'psykologia',
      'tekoäly',
      'mielenfilosofia',
    ],
  };
}

export default async function SanastoPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="mx-auto max-w-3xl">
        <header className="mb-8">
          <h1 className="text-4xl font-bold tracking-tight">Kognitiotieteen sanasto</h1>
          <p className="mt-4 text-lg text-muted-foreground">
            Kattava suomenkielinen sanasto kognitiotieteen keskeisistä käsitteistä. Sanasto kattaa
            termejä psykologiasta, neurotieteestä, tekoälystä, kielitieteestä ja mielenfilosofiasta.
          </p>
        </header>

        {/* Search */}
        <section className="mb-10">
          <VocabularySearch />
          <p className="mt-2 text-sm text-muted-foreground">
            Hae yli 100 käsitteestä suomeksi tai englanniksi
          </p>
        </section>

        {/* Section links */}
        <nav className="grid gap-4 sm:grid-cols-2">
          {vocabularySections.map((section) => (
            <Link
              key={section.slug}
              href={`/sanasto/${section.slug}`}
              className="group rounded-lg border border-border bg-card p-6 transition-colors hover:border-primary hover:bg-accent"
            >
              <h2 className="text-2xl font-semibold group-hover:text-primary">{section.title}</h2>
              <p className="mt-2 text-sm text-muted-foreground">{section.description}</p>
            </Link>
          ))}
        </nav>

        <section className="mt-12 rounded-lg bg-muted/50 p-6">
          <h2 className="text-xl font-semibold">Tietoa sanastosta</h2>
          <p className="mt-2 text-muted-foreground">
            Tämä sanasto perustuu Otto Lapin kokoamaan kognitiotieteen sanastoon (2010). Käsitteet
            on ryhmitelty aakkosittain ja jokainen termi sisältää sekä suomenkielisen että
            englanninkielisen version.
          </p>
          <div className="mt-4">
            <Link
              href="/kognitiotieteen-kasitteet"
              className="text-sm font-medium text-primary hover:underline"
            >
              Katso myös: Kognitiotieteen keskeiset käsitteet →
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
