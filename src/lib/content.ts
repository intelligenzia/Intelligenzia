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
  locale?: string;
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

// Extract the readable slug from the filename (removes date prefix)
function getSlugFromFilename(filename: string): string {
  // Remove .md extension and date prefix (e.g., "2019-12-04--")
  const withoutExtension = filename.replace(/\.md$/, '');
  const match = withoutExtension.match(/^\d{4}-\d{2}-\d{2}--(.+)$/);
  return match ? match[1] : withoutExtension;
}

// Get all blog post files
function getBlogFiles(): string[] {
  const blogDir = path.join(contentDirectory, 'blog');

  if (!fs.existsSync(blogDir)) {
    return [];
  }

  return fs
    .readdirSync(blogDir)
    .filter((file) => file.endsWith('.md'));
}

// Find the original filename for a given slug
function findBlogFilename(slug: string): string | null {
  const files = getBlogFiles();

  // First, try exact match
  if (files.includes(`${slug}.md`)) {
    return `${slug}.md`;
  }

  // Then, try to find by slug (without date prefix)
  for (const file of files) {
    if (getSlugFromFilename(file) === slug) {
      return file;
    }
  }

  return null;
}

export function getBlogPost(slug: string): BlogPost | null {
  const filename = findBlogFilename(slug);

  if (!filename) {
    return null;
  }

  const filePath = path.join(contentDirectory, 'blog', filename);
  const fileContents = fs.readFileSync(filePath, 'utf8');
  const { data, content } = matter(fileContents);

  // Extract date from filename if not in frontmatter
  let date = data.date;
  if (!date) {
    const dateMatch = filename.match(/^(\d{4}-\d{2}-\d{2})/);
    if (dateMatch) {
      date = dateMatch[1];
    }
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

export function getAllBlogPosts(): BlogPost[] {
  const files = getBlogFiles();

  return files
    .map((file) => {
      const slug = getSlugFromFilename(file);
      return getBlogPost(slug)!;
    })
    .filter(Boolean)
    .sort((a, b) => {
      const dateA = new Date(a.frontmatter.date);
      const dateB = new Date(b.frontmatter.date);
      return dateB.getTime() - dateA.getTime();
    });
}

export function getBlogCategories(): string[] {
  const posts = getAllBlogPosts();
  const categories = new Set(posts.map((post) => post.frontmatter.category).filter(Boolean));
  return Array.from(categories);
}

export function getBlogPostsByCategory(category: string): BlogPost[] {
  return getAllBlogPosts().filter(
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

export function getAllAuthors(): Author[] {
  const posts = getAllBlogPosts();
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

export function getAuthorBySlug(slug: string): Author | null {
  const authors = getAllAuthors();
  return authors.find((author) => author.slug === slug) || null;
}

export function getBlogPostsByAuthor(authorName: string): BlogPost[] {
  return getAllBlogPosts().filter(
    (post) => post.frontmatter.author === authorName
  );
}
