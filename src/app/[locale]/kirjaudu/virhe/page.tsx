import { setRequestLocale } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle } from 'lucide-react';
import { MagicLinkForm } from '@/components/magic-link-form';
import { CONTACT_EMAIL, localePath, routeFor } from '@/lib/membership';

type Props = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ error?: string }>;
};

export default async function AuthErrorPage({ params, searchParams }: Props) {
  const { locale } = await params;
  const { error } = await searchParams;
  setRequestLocale(locale);
  const fi = locale === 'fi';

  const errorMessages: Record<string, { fi: string; en: string }> = {
    Configuration: {
      fi: 'Kirjautuminen ei juuri nyt toimi meidän päässämme. Yritä hetken päästä uudelleen.',
      en: "Sign-in isn't working on our side right now. Please try again in a moment.",
    },
    AccessDenied: {
      fi: 'Sinulla ei ole oikeutta kirjautua.',
      en: 'You do not have permission to sign in.',
    },
    Verification: {
      fi: 'Linkki on vanhentunut tai sitä on jo käytetty. Saat uuden alta.',
      en: 'That link has expired or was already used. Get a fresh one below.',
    },
    Default: {
      fi: 'Kirjautumisessa tapahtui virhe.',
      en: 'An error occurred while signing in.',
    },
  };

  const errorMessage = errorMessages[error || 'Default'] || errorMessages.Default;

  return (
    <div className="container mx-auto flex min-h-[80vh] items-center justify-center px-4 py-12">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <div className="mb-4 flex justify-center">
            <div className="rounded-full bg-destructive/10 p-4">
              <AlertCircle className="h-8 w-8 text-destructive" />
            </div>
          </div>
          <CardTitle className="text-2xl">
            {error === 'Verification'
              ? fi ? 'Linkki ei enää toimi' : 'This link no longer works'
              : fi ? 'Kirjautumisvirhe' : 'Sign-in Error'}
          </CardTitle>
          <CardDescription>{errorMessage[fi ? 'fi' : 'en']}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <MagicLinkForm
            locale={locale}
            callbackUrl={localePath(locale, 'dashboard')}
            submitLabel={fi ? 'Lähetä uusi linkki' : 'Send a new link'}
          />
          <p className="text-center text-sm text-muted-foreground">
            {fi ? 'Ongelmia? Kirjoita ' : 'Still stuck? Write to '}
            <a href={`mailto:${CONTACT_EMAIL}`} className="underline underline-offset-4 hover:text-foreground">
              {CONTACT_EMAIL}
            </a>
          </p>
          <div className="text-center text-sm">
            <Link href={routeFor(locale, 'join')} className="text-muted-foreground hover:text-foreground">
              {fi ? 'Liity jäseneksi' : 'Become a member'}
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
