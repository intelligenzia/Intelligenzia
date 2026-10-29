import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// Netlify Database injects NETLIFY_DB_URL into functions and builds, already
// pointing at the right branch (production, or a deploy preview's copy).
// DATABASE_URL remains for local development. pgbouncer=true turns off
// prepared statements, which a pooled serverless connection can't keep.
function databaseUrl(): string | undefined {
  const url = process.env.NETLIFY_DB_URL;
  if (!url) return undefined;
  const parsed = new URL(url);
  if (!parsed.searchParams.has('pgbouncer')) parsed.searchParams.set('pgbouncer', 'true');
  return parsed.toString();
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    datasourceUrl: databaseUrl(),
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}
