import { setRequestLocale } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Mail } from 'lucide-react';
import { SentToEmail } from '@/components/sent-to-email';
import { routeFor } from '@/lib/membership';

type Props = {
  params: Promise<{ locale: string }>;
};

export default async function VerifyRequestPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const fi = locale === 'fi';

  return (
    <div className="container mx-auto flex min-h-[80vh] items-center justify-center px-4 py-12">
      <Card className="w-full max-w-md text-center">
        <CardHeader className="space-y-1">
          <div className="mb-4 flex justify-center">
            <div className="rounded-full bg-primary/10 p-4">
              <Mail className="h-8 w-8 text-primary" />
            </div>
          </div>
          <CardTitle className="text-2xl">
            {fi ? 'Tarkista sähköpostisi' : 'Check your email'}
          </CardTitle>
          <CardDescription>
            {fi ? 'Lähetimme kirjautumislinkin osoitteeseen ' : 'We sent a sign-in link to '}
            <SentToEmail fallback={fi ? 'sähköpostiisi' : 'your email'} />.{' '}
            {fi
              ? 'Avaa viesti ja paina Kirjaudu sisään. Voit sulkea tämän välilehden.'
              : 'Open it and press Sign in. You can close this tab.'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <ul className="space-y-1.5 text-left text-sm text-muted-foreground">
            <li>
              {fi
                ? 'Viesti tulee yleensä minuutin sisällä lähettäjältä Intelligenzia.'
                : 'It usually arrives within a minute, from Intelligenzia.'}
            </li>
            <li>
              {fi
                ? 'Etkö löydä sitä? Katso roskaposti- ja Muut-kansiot.'
                : "Can't find it? Look in your spam and Promotions folders."}
            </li>
            <li>
              {fi
                ? 'Linkki on voimassa 24 tuntia ja toimii kerran.'
                : 'The link works once and expires in 24 hours.'}
            </li>
          </ul>
          <Link
            href={routeFor(locale, 'login')}
            className="inline-block text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
          >
            {fi ? 'Väärä osoite? Lähetä uusi linkki' : 'Wrong address? Send a new link'}
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
