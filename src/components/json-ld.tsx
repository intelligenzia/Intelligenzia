import type { BlogPost } from '@/lib/content';

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://intelligenzia.fi';

interface OrganizationJsonLdProps {
  locale: string;
}

export function OrganizationJsonLd({ locale }: OrganizationJsonLdProps) {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Intelligenzia ry',
    alternateName: 'Intelligenzia',
    url: baseUrl,
    logo: `${baseUrl}/logo.png`,
    description:
      locale === 'fi'
        ? 'Kognitiotieteen alumniyhdistys Helsingin yliopistosta'
        : 'Cognitive science alumni society from the University of Helsinki',
    foundingDate: '2003',
    sameAs: [],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}

interface WebSiteJsonLdProps {
  locale: string;
}

export function WebSiteJsonLd({ locale }: WebSiteJsonLdProps) {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'Intelligenzia',
    url: baseUrl,
    description:
      locale === 'fi'
        ? 'Kognitiotieteen alumniyhdistys'
        : 'Cognitive science alumni society',
    inLanguage: locale === 'fi' ? 'fi-FI' : 'en-US',
    publisher: {
      '@type': 'Organization',
      name: 'Intelligenzia ry',
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}

interface ArticleJsonLdProps {
  post: BlogPost;
  locale: string;
}

export function ArticleJsonLd({ post, locale }: ArticleJsonLdProps) {
  const blogPath = locale === 'fi' ? '/blogi' : '/blog';
  const url = locale === 'fi'
    ? `${baseUrl}${blogPath}/${post.slug}`
    : `${baseUrl}/en${blogPath}/${post.slug}`;

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: post.frontmatter.title,
    description: post.content.slice(0, 160).replace(/[#*_\[\]]/g, ''),
    datePublished: post.frontmatter.date,
    dateModified: post.frontmatter.date,
    author: post.frontmatter.author
      ? {
          '@type': 'Person',
          name: post.frontmatter.author,
        }
      : undefined,
    publisher: {
      '@type': 'Organization',
      name: 'Intelligenzia ry',
      logo: {
        '@type': 'ImageObject',
        url: `${baseUrl}/logo.png`,
      },
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': url,
    },
    image: post.frontmatter.cover
      ? `${baseUrl}/blog/${post.frontmatter.cover}`
      : undefined,
    inLanguage: locale === 'fi' ? 'fi-FI' : 'en-US',
    articleSection: post.frontmatter.category || undefined,
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}

interface BreadcrumbJsonLdProps {
  items: Array<{ name: string; url: string }>;
}

export function BreadcrumbJsonLd({ items }: BreadcrumbJsonLdProps) {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}

interface PersonJsonLdProps {
  name: string;
  locale: string;
}

export function PersonJsonLd({ name, locale }: PersonJsonLdProps) {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name,
    worksFor: {
      '@type': 'Organization',
      name: 'Intelligenzia ry',
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}

interface FAQItem {
  question: string;
  answer: string;
}

interface FAQPageJsonLdProps {
  items: FAQItem[];
}

export function FAQPageJsonLd({ items }: FAQPageJsonLdProps) {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.answer,
      },
    })),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}

interface DefinedTermItem {
  name: string;
  alternateName?: string;
  description: string;
}

interface DefinedTermSetJsonLdProps {
  name: string;
  terms: DefinedTermItem[];
  url: string;
}

export function DefinedTermSetJsonLd({ name, terms, url }: DefinedTermSetJsonLdProps) {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'DefinedTermSet',
    name,
    url,
    hasDefinedTerm: terms.map((term) => ({
      '@type': 'DefinedTerm',
      name: term.name,
      ...(term.alternateName ? { alternateName: term.alternateName } : {}),
      description: term.description,
    })),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}
