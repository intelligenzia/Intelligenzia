import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';

const contentDirectory = path.join(process.cwd(), 'src/content');

export interface PageFrontmatter {
  title: string;
  description?: string;
  menuTitle?: string;
}

export interface BlogFrontmatter {
  title: string;
  date: string;
  author: string;
  category: string;
  cover?: string;
  description?: string;
  keywords?: string[];
}

export interface Page {
  slug: string;
  frontmatter: PageFrontmatter;
  content: string;
}

export interface BlogPost {
  slug: string;
  frontmatter: BlogFrontmatter;
  content: string;
}

export function getPage(locale: string, slug: string): Page | null {
  const filePath = path.join(contentDirectory, 'pages', locale, `${slug}.md`);

  if (!fs.existsSync(filePath)) {
    return null;
  }

  const fileContents = fs.readFileSync(filePath, 'utf8');
  const { data, content } = matter(fileContents);

  return {
    slug,
    frontmatter: data as PageFrontmatter,
    content,
  };
}

export function getAllPages(locale: string): Page[] {
  const pagesDir = path.join(contentDirectory, 'pages', locale);

  if (!fs.existsSync(pagesDir)) {
    return [];
  }

  const files = fs.readdirSync(pagesDir);

  return files
    .filter((file) => file.endsWith('.md'))
    .map((file) => {
      const slug = file.replace(/\.md$/, '');
      return getPage(locale, slug)!;
    })
    .filter(Boolean);
}

// Get all blog post files for a specific locale
function getBlogFiles(locale: string): string[] {
  const blogDir = path.join(contentDirectory, 'blog', locale);

  if (!fs.existsSync(blogDir)) {
    return [];
  }

  return fs
    .readdirSync(blogDir)
    .filter((file) => file.endsWith('.md'));
}

// Get slug from filename (just remove .md extension)
function getSlugFromFilename(filename: string): string {
  return filename.replace(/\.md$/, '');
}

// Find the filename for a given slug in a specific locale
function findBlogFilename(locale: string, slug: string): string | null {
  const files = getBlogFiles(locale);

  if (files.includes(`${slug}.md`)) {
    return `${slug}.md`;
  }

  return null;
}

export function getBlogPost(locale: string, slug: string): BlogPost | null {
  const filename = findBlogFilename(locale, slug);

  if (!filename) {
    return null;
  }

  const filePath = path.join(contentDirectory, 'blog', locale, filename);
  const fileContents = fs.readFileSync(filePath, 'utf8');
  const { data, content } = matter(fileContents);

  // Format date if it's a Date object
  let date = data.date;
  if (date instanceof Date) {
    date = date.toISOString().split('T')[0];
  } else if (typeof date === 'string' && date.includes('T')) {
    date = date.split('T')[0];
  }

  return {
    slug: getSlugFromFilename(filename),
    frontmatter: {
      ...data,
      date: date || '',
    } as BlogFrontmatter,
    content,
  };
}

export function getAllBlogPosts(locale: string): BlogPost[] {
  const files = getBlogFiles(locale);

  return files
    .map((file) => {
      const slug = getSlugFromFilename(file);
      return getBlogPost(locale, slug)!;
    })
    .filter(Boolean)
    .sort((a, b) => {
      const dateA = new Date(a.frontmatter.date);
      const dateB = new Date(b.frontmatter.date);
      return dateB.getTime() - dateA.getTime();
    });
}

export function getBlogCategories(locale: string): string[] {
  const posts = getAllBlogPosts(locale);
  const categories = new Set(posts.map((post) => post.frontmatter.category).filter(Boolean));
  return Array.from(categories);
}

export function getBlogPostsByCategory(locale: string, category: string): BlogPost[] {
  return getAllBlogPosts(locale).filter(
    (post) => post.frontmatter.category?.toLowerCase() === category.toLowerCase()
  );
}

// Author utilities
export interface Author {
  name: string;
  slug: string;
  postCount: number;
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

export function getAllAuthors(locale: string): Author[] {
  const posts = getAllBlogPosts(locale);
  const authorMap = new Map<string, number>();

  for (const post of posts) {
    if (post.frontmatter.author) {
      const count = authorMap.get(post.frontmatter.author) || 0;
      authorMap.set(post.frontmatter.author, count + 1);
    }
  }

  return Array.from(authorMap.entries())
    .map(([name, postCount]) => ({
      name,
      slug: slugify(name),
      postCount,
    }))
    .sort((a, b) => b.postCount - a.postCount);
}

export function getAuthorBySlug(locale: string, slug: string): Author | null {
  const authors = getAllAuthors(locale);
  return authors.find((author) => author.slug === slug) || null;
}

export function getBlogPostsByAuthor(locale: string, authorName: string): BlogPost[] {
  return getAllBlogPosts(locale).filter(
    (post) => post.frontmatter.author === authorName
  );
}
