import { generateOgImage, ogImageSize, ogImageContentType } from '@/lib/og-image';
import { getPage } from '@/lib/content';

export const alt = 'Cognitive Science Glossary – Intelligenzia';
export const size = ogImageSize;
export const contentType = ogImageContentType;

const sectionDescriptions: Record<string, string> = {
  'a-c': 'Abduction, abstraction, adaptation, algorithm, behaviorism and other A–C terms.',
  'd-f': 'Deduction, dualism, empirical method, evolution, functionalism and other D–F terms.',
  'g-i': 'Gene, genetics, perception, holism, hypothesis, intentionality and other G–I terms.',
  'j-l': 'Causality, language, cognition, connectionism, logic and other J–L terms.',
  'm-o': "Marr's levels, materialism, memory, neurology, ontology and other M–O terms.",
  'p-r': 'Plasticity, proposition, psychology, reasoning, representation and other P–R terms.',
  's-u': 'Semantics, syntax, attention, consciousness, Turing test and other S–U terms.',
  'v-z': 'Valence, validity, bias, understanding, visual processing and other V–Z terms.',
};

const sectionTitles: Record<string, string> = {
  'a-c': 'Glossary A–C',
  'd-f': 'Glossary D–F',
  'g-i': 'Glossary G–I',
  'j-l': 'Glossary J–L',
  'm-o': 'Glossary M–O',
  'p-r': 'Glossary P–R',
  's-u': 'Glossary S–U',
  'v-z': 'Glossary V–Z',
};

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  const page = getPage('en', `vocabulary/vocabulary-${slug}`);

  const title = page?.frontmatter.title || sectionTitles[slug] || `Glossary ${slug.toUpperCase()}`;
  const description = page?.frontmatter.description || sectionDescriptions[slug] || 'Cognitive science glossary';

  return generateOgImage({
    title,
    description,
  });
}

export function generateStaticParams() {
  return [
    { slug: 'a-c' },
    { slug: 'd-f' },
    { slug: 'g-i' },
    { slug: 'j-l' },
    { slug: 'm-o' },
    { slug: 'p-r' },
    { slug: 's-u' },
    { slug: 'v-z' },
  ];
}
