import { generateOgImage, ogImageSize, ogImageContentType } from '@/lib/og-image';
import { getPage } from '@/lib/content';

export const alt = 'Kognitiotieteen sanasto – Intelligenzia';
export const size = ogImageSize;
export const contentType = ogImageContentType;

const sectionDescriptions: Record<string, string> = {
  'a-c': 'Abduktio, abstraktio, adaptaatio, algoritmi, behaviorismi ja muut A–C -käsitteet.',
  'd-f': 'Deduktio, dualismi, empiirinen menetelmä, evoluutio, funktionalismi ja muut D–F -käsitteet.',
  'g-i': 'Geeni, genetiikka, havainto, holismi, hypoteesi, intentionaalisuus ja muut G–I -käsitteet.',
  'j-l': 'Kausaliteetti, kieli, kognitio, konnektionismi, logiikka ja muut J–L -käsitteet.',
  'm-o': 'Marrin tasot, materialismi, muisti, neurologia, ontologia ja muut M–O -käsitteet.',
  'p-r': 'Plastisuus, propositio, psykologia, päättely, representaatio ja muut P–R -käsitteet.',
  's-u': 'Semantiikka, syntaksi, tarkkaavuus, tietoisuus, Turingin testi ja muut S–U -käsitteet.',
  'v-o': 'Valenssi, validiteetti, vinouma, ymmärtäminen, ärsyke ja muut V–Ö -käsitteet.',
};

const sectionTitles: Record<string, string> = {
  'a-c': 'Sanasto A–C',
  'd-f': 'Sanasto D–F',
  'g-i': 'Sanasto G–I',
  'j-l': 'Sanasto J–L',
  'm-o': 'Sanasto M–O',
  'p-r': 'Sanasto P–R',
  's-u': 'Sanasto S–U',
  'v-o': 'Sanasto V–Ö',
};

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  const page = getPage('fi', `sanasto/sanasto-${slug}`);

  const title = page?.frontmatter.title || sectionTitles[slug] || `Sanasto ${slug.toUpperCase()}`;
  const description = page?.frontmatter.description || sectionDescriptions[slug] || 'Kognitiotieteen sanasto';

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
    { slug: 'v-o' },
  ];
}
