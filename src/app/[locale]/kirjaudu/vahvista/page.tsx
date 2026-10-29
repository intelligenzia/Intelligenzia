import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { setRequestLocale } from 'next-intl/server';
import Image from 'next/image';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { noIndex } from '@/lib/seo';
import { localePath } from '@/lib/membership';

type Props = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ link?: string }>;
};

export const metadata: Metadata = { robots: noIndex };

const CALLBACK_PATH = '/api/auth/callback/resend';

/**
 * The magic-link email lands here instead of on the token itself. Mail
 * scanners fetch this page harmlessly; only a person pressing the button
 * spends the one-time token.
 */
export default async function ConfirmSignInPage({ params, searchParams }: Props) {
  const { locale } = await params;
  const { link } = await searchParams;
  setRequestLocale(locale);
  const fi = locale === 'fi';

  // Keep only path + query, and only for our own callback, so this page
  // can't be turned into an open redirect.
  let href: string | null = null;
  let email: string | null = null;
  try {
    const url = new URL(link ?? '', 'https://placeholder.invalid');
    if (url.pathname === CALLBACK_PATH && url.searchParams.get('token')) {
      href = `${url.pathname}${url.search}`;
      email = url.searchParams.get('email');
    }
  } catch {
    // Fall through to the login page.
  }
  if (!href) redirect(localePath(locale, 'login'));

  return (
    <div className="container mx-auto flex min-h-[80vh] items-center justify-center px-4 py-12">
      <Card className="w-full max-w-md text-center">
        <CardHeader className="space-y-1">
          <div className="mb-4 flex justify-center">
            <Image src="/icon.png" alt="Intelligenzia" width={48} height={48} className="dark:invert" />
          </div>
          <CardTitle className="text-2xl">{fi ? 'Kirjaudu sisään' : 'Sign in'}</CardTitle>
          {email && (
            <CardDescription>
              {fi ? 'Jatka osoitteella ' : 'Continue as '}
              <strong className="font-medium text-foreground">{email}</strong>
            </CardDescription>
          )}
        </CardHeader>
        <CardContent>
          <Button asChild size="lg" className="w-full">
            {/* A plain anchor: the callback sets the session cookie and redirects. */}
            <a href={href}>{fi ? 'Kirjaudu sisään' : 'Sign in'}</a>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
