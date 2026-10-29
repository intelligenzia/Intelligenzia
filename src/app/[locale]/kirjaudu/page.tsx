'use client';

import { Suspense } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { useSearchParams } from 'next/navigation';
import { Link } from '@/i18n/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft } from 'lucide-react';
import Image from 'next/image';
import { MagicLinkForm, safeCallback } from '@/components/magic-link-form';
import { localePath, routeFor } from '@/lib/membership';

// useSearchParams needs a Suspense boundary to keep the page prerenderable.
export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const t = useTranslations('auth');
  const locale = useLocale();
  const fi = locale === 'fi';
  const searchParams = useSearchParams();
  const callbackUrl = safeCallback(searchParams.get('callbackUrl'), locale);
  const fromJoin = callbackUrl.startsWith(localePath(locale, 'join'));

  return (
    <div className="container mx-auto flex min-h-[80vh] items-center justify-center px-4 py-12">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <div className="mb-4 flex justify-center">
            <Image src="/icon.png" alt="Intelligenzia" width={48} height={48} className="dark:invert" />
          </div>
          <CardTitle className="text-2xl">{t('login')}</CardTitle>
          <CardDescription>
            {fromJoin
              ? fi
                ? 'Kirjaudu, niin voimme uusia nykyisen jäsenyytesi. Ei salasanoja: lähetämme kertakäyttöisen linkin.'
                : "Sign in so we can renew your existing membership. No password: we'll email you a one-time link."
              : fi
                ? 'Ei salasanoja: lähetämme sähköpostiisi kertakäyttöisen kirjautumislinkin.'
                : "No password: we'll email you a one-time sign-in link."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <MagicLinkForm
            locale={locale}
            callbackUrl={callbackUrl}
            defaultEmail={searchParams.get('email') ?? ''}
          />

          <p className="mt-6 text-center text-sm text-muted-foreground">
            {fi
              ? 'Käytä samaa osoitetta, jolla maksoit jäsenmaksun.'
              : 'Use the address you paid your membership with.'}
          </p>

          <div className="mt-6 flex flex-col items-center gap-2 text-sm text-muted-foreground">
            {!fromJoin && (
              <Link href={routeFor(locale, 'join')} className="hover:text-foreground">
                {fi ? 'Et ole vielä jäsen? Liity ilman kirjautumista' : 'Not a member yet? Join without signing in'}
              </Link>
            )}
            <Link href="/" className="inline-flex items-center hover:text-foreground">
              <ArrowLeft className="mr-2 h-4 w-4" />
              {fi ? 'Takaisin etusivulle' : 'Back to home'}
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
