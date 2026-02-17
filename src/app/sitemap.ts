import { execSync } from 'child_process';
import path from 'path';
import type { MetadataRoute } from 'next';
import { getAllBlogPosts } from '@/lib/content';
import { pageMapping, fiToEnPageSlug, enToFiPageSlug } from '@/lib/page-mapping';

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://intelligenzia.fi';
const contentDir = path.join(process.cwd(), 'src/content');

function getGitLastModified(filePath: string): Date {
  try {
    const date = execSync(`git log -1 --format=%cI -- "${filePath}"`, {
      encoding: 'utf8',
      cwd: process.cwd(),
    }).trim();
    if (date) return new Date(date);
    return new Date('2025-01-01');
  } catch {
    return new Date('2025-01-01');
  }
}

export default function sitemap(): MetadataRoute.Sitemap {
  const entries: MetadataRoute.Sitemap = [];

  // Home pages (paired)
  entries.push({
    url: baseUrl,
    lastModified: getGitLastModified(path.join(process.cwd(), 'src/app/[locale]/page.tsx')),
    changeFrequency: 'weekly',
    priority: 1.0,
    alternates: {
      languages: {
        fi: baseUrl,
        en: `${baseUrl}/en`,
      },
    },
  });

  // Finnish content pages (default locale, no prefix)
  const fiPageSlugs = Object.keys(pageMapping.fi || {});
  for (const slug of fiPageSlugs) {
    const filePath = path.join(contentDir, 'pages', 'fi', `${slug}.md`);
    const enSlug = fiToEnPageSlug[slug];
    const alternates: Record<string, string> = { fi: `${baseUrl}/${slug}` };
    if (enSlug) {
      alternates.en = `${baseUrl}/en/${enSlug}`;
    }
    entries.push({
      url: `${baseUrl}/${slug}`,
      lastModified: getGitLastModified(filePath),
      changeFrequency: 'monthly',
      priority: 0.8,
      alternates: { languages: alternates },
    });
  }

  // English content pages (with /en prefix)
  const enPageSlugs = Object.keys(pageMapping.en || {});
  for (const slug of enPageSlugs) {
    const filePath = path.join(contentDir, 'pages', 'en', `${slug}.md`);
    const fiSlug = enToFiPageSlug[slug];
    // Skip if this page already has its alternate covered by the Finnish entry
    if (fiSlug) continue;
    // English-only pages (no Finnish counterpart)
    entries.push({
      url: `${baseUrl}/en/${slug}`,
      lastModified: getGitLastModified(filePath),
      changeFrequency: 'monthly',
      priority: 0.8,
    });
  }

  // Membership pages (paired)
  entries.push({
    url: `${baseUrl}/jaseneksi`,
    lastModified: getGitLastModified(path.join(process.cwd(), 'src/app/[locale]/jaseneksi/page.tsx')),
    changeFrequency: 'monthly',
    priority: 0.9,
    alternates: {
      languages: {
        fi: `${baseUrl}/jaseneksi`,
        en: `${baseUrl}/en/join`,
      },
    },
  });

  // Blog listing pages (paired)
  entries.push({
    url: `${baseUrl}/blogi`,
    lastModified: getGitLastModified(path.join(process.cwd(), 'src/app/[locale]/blogi/page.tsx')),
    changeFrequency: 'weekly',
    priority: 0.9,
    alternates: {
      languages: {
        fi: `${baseUrl}/blogi`,
        en: `${baseUrl}/en/blog`,
      },
    },
  });

  // Blog posts - Finnish
  const fiBlogPosts = getAllBlogPosts('fi');
  const enBlogPosts = getAllBlogPosts('en');
  const enBlogSlugs = new Set(enBlogPosts.map((p) => p.slug));
  const fiBlogSlugs = new Set(fiBlogPosts.map((p) => p.slug));

  for (const post of fiBlogPosts) {
    const postDate = post.frontmatter.date ? new Date(post.frontmatter.date) : new Date();
    const alternates: Record<string, string> = { fi: `${baseUrl}/blogi/${post.slug}` };
    if (enBlogSlugs.has(post.slug)) {
      alternates.en = `${baseUrl}/en/blog/${post.slug}`;
    }
    entries.push({
      url: `${baseUrl}/blogi/${post.slug}`,
      lastModified: postDate,
      changeFrequency: 'yearly',
      priority: 0.7,
      alternates: { languages: alternates },
    });
  }

  // Blog posts - English (only those without Finnish counterpart)
  for (const post of enBlogPosts) {
    if (fiBlogSlugs.has(post.slug)) continue;
    const postDate = post.frontmatter.date ? new Date(post.frontmatter.date) : new Date();
    entries.push({
      url: `${baseUrl}/en/blog/${post.slug}`,
      lastModified: postDate,
      changeFrequency: 'yearly',
      priority: 0.7,
    });
  }

  // Author pages - Finnish
  const fiAuthors = getUniqueAuthors(fiBlogPosts);
  for (const author of fiAuthors) {
    const authorSlug = slugify(author);
    entries.push({
      url: `${baseUrl}/kirjoittajat/${authorSlug}`,
      lastModified: getGitLastModified(path.join(process.cwd(), 'src/app/[locale]/kirjoittajat/[slug]/page.tsx')),
      changeFrequency: 'monthly',
      priority: 0.6,
    });
  }

  // Author pages - English
  const enAuthors = getUniqueAuthors(enBlogPosts);
  for (const author of enAuthors) {
    const authorSlug = slugify(author);
    entries.push({
      url: `${baseUrl}/en/authors/${authorSlug}`,
      lastModified: getGitLastModified(path.join(process.cwd(), 'src/app/[locale]/authors/[slug]/page.tsx')),
      changeFrequency: 'monthly',
      priority: 0.6,
    });
  }

  // Vocabulary (Sanasto) pages - paired
  const fiVocabularySlugs = ['a-c', 'd-f', 'g-i', 'j-l', 'm-o', 'p-r', 's-u', 'v-o'];
  const enVocabularySlugs = ['a-c', 'd-f', 'g-i', 'j-l', 'm-o', 'p-r', 's-u', 'v-z'];

  // Vocabulary index pages (paired)
  entries.push({
    url: `${baseUrl}/sanasto`,
    lastModified: getGitLastModified(path.join(process.cwd(), 'src/app/[locale]/sanasto/page.tsx')),
    changeFrequency: 'monthly',
    priority: 0.8,
    alternates: {
      languages: {
        fi: `${baseUrl}/sanasto`,
        en: `${baseUrl}/en/vocabulary`,
      },
    },
  });

  // Vocabulary section pages - Finnish (with alternates for shared slugs)
  for (const slug of fiVocabularySlugs) {
    const filePath = path.join(contentDir, 'pages', 'fi', 'sanasto', `sanasto-${slug}.md`);
    // Map fi slug to en slug (most are shared except v-o -> v-z)
    const enSlug = slug === 'v-o' ? 'v-z' : slug;
    entries.push({
      url: `${baseUrl}/sanasto/${slug}`,
      lastModified: getGitLastModified(filePath),
      changeFrequency: 'monthly',
      priority: 0.7,
      alternates: {
        languages: {
          fi: `${baseUrl}/sanasto/${slug}`,
          en: `${baseUrl}/en/vocabulary/${enSlug}`,
        },
      },
    });
  }

  // English vocabulary section pages are already covered by alternates above
  // No need for separate entries (they'd be duplicates in Google's eyes)

  return entries;
}

function getUniqueAuthors(posts: { frontmatter: { author: string } }[]): string[] {
  const authors = new Set<string>();
  for (const post of posts) {
    if (post.frontmatter.author) {
      authors.add(post.frontmatter.author);
    }
  }
  return Array.from(authors);
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}
