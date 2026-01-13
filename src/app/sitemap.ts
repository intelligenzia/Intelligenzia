import type { MetadataRoute } from 'next';
import { getAllBlogPosts } from '@/lib/content';
import { pageMapping } from '@/lib/page-mapping';

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://intelligenzia.fi';

export default function sitemap(): MetadataRoute.Sitemap {
  const entries: MetadataRoute.Sitemap = [];

  // Home pages
  entries.push({
    url: baseUrl,
    lastModified: new Date(),
    changeFrequency: 'weekly',
    priority: 1.0,
  });
  entries.push({
    url: `${baseUrl}/en`,
    lastModified: new Date(),
    changeFrequency: 'weekly',
    priority: 1.0,
  });

  // Finnish content pages (no prefix)
  const fiPageSlugs = Object.keys(pageMapping.fi || {});
  for (const slug of fiPageSlugs) {
    entries.push({
      url: `${baseUrl}/${slug}`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.8,
    });
  }

  // English content pages (with /en prefix)
  const enPageSlugs = Object.keys(pageMapping.en || {});
  for (const slug of enPageSlugs) {
    entries.push({
      url: `${baseUrl}/en/${slug}`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.8,
    });
  }

  // Membership pages
  entries.push({
    url: `${baseUrl}/jaseneksi`,
    lastModified: new Date(),
    changeFrequency: 'monthly',
    priority: 0.9,
  });
  entries.push({
    url: `${baseUrl}/en/join`,
    lastModified: new Date(),
    changeFrequency: 'monthly',
    priority: 0.9,
  });

  // Blog listing pages
  entries.push({
    url: `${baseUrl}/blogi`,
    lastModified: new Date(),
    changeFrequency: 'weekly',
    priority: 0.9,
  });
  entries.push({
    url: `${baseUrl}/en/blog`,
    lastModified: new Date(),
    changeFrequency: 'weekly',
    priority: 0.9,
  });

  // Blog posts (same content, both locales)
  const blogPosts = getAllBlogPosts();
  for (const post of blogPosts) {
    const postDate = post.frontmatter.date ? new Date(post.frontmatter.date) : new Date();

    // Finnish blog URL (no prefix)
    entries.push({
      url: `${baseUrl}/blogi/${post.slug}`,
      lastModified: postDate,
      changeFrequency: 'yearly',
      priority: 0.7,
    });

    // English blog URL (with /en prefix)
    entries.push({
      url: `${baseUrl}/en/blog/${post.slug}`,
      lastModified: postDate,
      changeFrequency: 'yearly',
      priority: 0.7,
    });
  }

  // Author pages
  const authors = getUniqueAuthors(blogPosts);
  for (const author of authors) {
    const authorSlug = slugify(author);
    entries.push({
      url: `${baseUrl}/kirjoittajat/${authorSlug}`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.6,
    });
    entries.push({
      url: `${baseUrl}/en/authors/${authorSlug}`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.6,
    });
  }

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
