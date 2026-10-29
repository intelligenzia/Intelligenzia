import NextAuth from 'next-auth';
import { PrismaAdapter } from '@auth/prisma-adapter';
import Resend from 'next-auth/providers/resend';
import { prisma } from './prisma';
import { sendEmail, magicLinkEmail } from './email';
import { localePath } from './membership';

declare module 'next-auth' {
  interface User {
    role?: 'USER' | 'ADMIN';
  }
  interface Session {
    user: {
      id: string;
      email?: string | null;
      name?: string | null;
      image?: string | null;
      role?: 'USER' | 'ADMIN';
    };
  }
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  // Auth.js only trusts the Host header automatically on Vercel or when
  // AUTH_URL is set; NEXTAUTH_URL alone doesn't count, so on Netlify every
  // sign-in failed with UntrustedHost. Netlify sets the host itself.
  trustHost: true,
  providers: [
    Resend({
      from: process.env.FROM_EMAIL || 'noreply@intelligenzia.fi',
      async sendVerificationRequest({ identifier, url, provider }) {
        const callback = new URL(url).searchParams.get('callbackUrl') ?? '';
        const locale = new URL(callback, url).pathname.startsWith('/en') ? 'en' : 'fi';
        // The email points at a confirm page rather than the one-time token
        // itself: Outlook Safe Links and similar scanners open every link in
        // an email, which would spend the token before the member clicks.
        const origin = new URL(url).origin;
        const confirm = `${origin}${localePath(locale, 'confirm')}?link=${encodeURIComponent(url)}`;
        await sendEmail({ to: identifier, ...magicLinkEmail(locale, confirm) }, provider.apiKey);
      },
    }),
  ],
  session: {
    strategy: 'database',
    maxAge: 30 * 24 * 60 * 60, // 30 days
    updateAge: 24 * 60 * 60, // Update session every 24 hours
  },
  pages: {
    signIn: '/kirjaudu',
    verifyRequest: '/kirjaudu/tarkista',
    error: '/kirjaudu/virhe',
  },
  callbacks: {
    async session({ session, user }) {
      if (session.user) {
        session.user.id = user.id;
        // With the database session strategy the adapter already loads the full
        // user row, so `role` is available here without an extra query.
        session.user.role = (user as { role?: 'USER' | 'ADMIN' }).role ?? 'USER';
      }
      return session;
    },
  },
});
