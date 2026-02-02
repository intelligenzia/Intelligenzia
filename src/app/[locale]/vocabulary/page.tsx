import { setRequestLocale } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { VocabularySearch } from '@/components/vocabulary-search';
import type { Metadata } from 'next';

type Props = {
  params: Promise<{ locale: string }>;
};

const vocabularySections = [
  { slug: 'a-c', title: 'A–C', description: 'Abduction, abstraction, adaptation, algorithm, behaviorism...' },
  { slug: 'd-f', title: 'D–F', description: 'Deduction, dualism, empirical method, evolution...' },
  { slug: 'g-i', title: 'G–I', description: 'Gene, genetics, perception, holism, hypothesis...' },
  { slug: 'j-l', title: 'J–L', description: 'Causality, language, cognition, connectionism...' },
  { slug: 'm-o', title: 'M–O', description: "Marr's levels, materialism, memory, neurology..." },
  { slug: 'p-r', title: 'P–R', description: 'Plasticity, positivism, proposition, psychology...' },
  { slug: 's-u', title: 'S–U', description: 'Semantics, symbolic system, attention, consciousness...' },
  { slug: 'v-z', title: 'V–Z', description: 'Valence, validity, bias, virtual reality...' },
];

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'Cognitive Science Glossary',
    description:
      'Comprehensive cognitive science glossary. Explanations of key terms from psychology, neuroscience, artificial intelligence, and philosophy of mind.',
    keywords: [
      'cognitive science',
      'glossary',
      'concepts',
      'terms',
      'neuroscience',
      'psychology',
      'artificial intelligence',
      'philosophy of mind',
    ],
  };
}

export default async function VocabularyPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="mx-auto max-w-3xl">
        <header className="mb-8">
          <h1 className="text-4xl font-bold tracking-tight">Cognitive Science Glossary</h1>
          <p className="mt-4 text-lg text-muted-foreground">
            A comprehensive glossary of key cognitive science concepts. Covering terms from
            psychology, neuroscience, artificial intelligence, linguistics, and philosophy of mind.
          </p>
        </header>

        {/* Search */}
        <section className="mb-10">
          <VocabularySearch locale="en" />
          <p className="mt-2 text-sm text-muted-foreground">
            Search over 100 terms in English or Finnish
          </p>
        </section>

        {/* Section links */}
        <nav className="grid gap-4 sm:grid-cols-2">
          {vocabularySections.map((section) => (
            <Link
              key={section.slug}
              href={`/vocabulary/${section.slug}`}
              className="group rounded-lg border border-border bg-card p-6 transition-colors hover:border-primary hover:bg-accent"
            >
              <h2 className="text-2xl font-semibold group-hover:text-primary">{section.title}</h2>
              <p className="mt-2 text-sm text-muted-foreground">{section.description}</p>
            </Link>
          ))}
        </nav>

        <section className="mt-12 rounded-lg bg-muted/50 p-6">
          <h2 className="text-xl font-semibold">About this glossary</h2>
          <p className="mt-2 text-muted-foreground">
            This glossary is based on a cognitive science vocabulary compiled by Otto Lappi (2010).
            Terms are organized alphabetically and include both English and Finnish versions.
          </p>
          <div className="mt-4">
            <Link
              href="/cognitive-science-concepts"
              className="text-sm font-medium text-primary hover:underline"
            >
              See also: Key Concepts in Cognitive Science →
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
